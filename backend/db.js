import mysql from 'mysql2/promise'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import bcrypt from 'bcryptjs'
import os from 'os'
 
 // Resolve dirname
 const __filename = fileURLToPath(import.meta.url)
 const __dirname = path.dirname(__filename)
 
 const PERSISTENT_DB_PATH = process.env.DB_PATH || path.join(os.homedir(), '.ammaseva_db.json')
 const LEGACY_DB_PATH = path.join(__dirname, 'db.json')
 
 // Automatic migration of existing data on first startup
 if (!fs.existsSync(PERSISTENT_DB_PATH) && fs.existsSync(LEGACY_DB_PATH)) {
   try {
     fs.copyFileSync(LEGACY_DB_PATH, PERSISTENT_DB_PATH)
     console.log(`[Database Migration] Success: Migrated database to persistent location: ${PERSISTENT_DB_PATH}`)
   } catch (err) {
     console.error(`[Database Migration] Error: Failed to migrate database:`, err)
   }
 }
 
 const JSON_DB_PATH = PERSISTENT_DB_PATH

let pool = null
let useMySQL = false

// Initial default data structure
const DEFAULT_MOCK_DATA = {
  users: [],
  volunteers: [],
  donations: [],
  enquiries: [],
  bookings: [],
  caregivers: [],
  mtps: [],
  mtpTasks: [
    {
      id: 1,
      icon: "🚗",
      title: "Patient Hospital Dropping & Escort",
      description: "Accompany patients/seniors safely to doctors, diagnostics & therapy",
      shiftType: "Part-time / On-Demand",
      earningEstimate: "₹300 - ₹1,500 / task",
      active: true
    },
    {
      id: 2,
      icon: "💊",
      title: "Medicine Delivery & Urgent Errands",
      description: "Doorstep delivery of prescriptions, pharmacy runs & emergency supplies",
      shiftType: "Part-time / On-Demand",
      earningEstimate: "₹300 - ₹1,500 / task",
      active: true
    },
    {
      id: 3,
      icon: "👴",
      title: "Senior Walking & Companionship",
      description: "Morning/evening walks, conversations, reading & mobility support",
      shiftType: "Part-time / On-Demand",
      earningEstimate: "₹300 - ₹1,500 / task",
      active: true
    },
    {
      id: 4,
      icon: "🍼",
      title: "Mother & Baby Support Helper",
      description: "Part-time help for new moms with nursery, baby care & household tasks",
      shiftType: "Part-time / On-Demand",
      earningEstimate: "₹300 - ₹1,500 / task",
      active: true
    },
    {
      id: 5,
      icon: "🩺",
      title: "Bedside & Post-Surgery Attendant",
      description: "Hourly shift-based patient recovery & home assistance",
      shiftType: "Part-time / On-Demand",
      earningEstimate: "₹300 - ₹1,500 / task",
      active: true
    },
    {
      id: 6,
      icon: "⚡",
      title: "Emergency On-Demand Task Force",
      description: "Immediate 2-4 hour assistance calls in your local neighborhood",
      shiftType: "Part-time / On-Demand",
      earningEstimate: "₹300 - ₹1,500 / task",
      active: true
    }
  ],
  gallery: [
    {
      id: 1,
      imageUrl: "/assets/service-elderly.jpg",
      title: "Compassionate Elderly Companionship & Care",
      category: "Elderly Care",
      location: "Banjara Hills, Hyderabad",
      description: "Dedicated caregiver providing emotional warmth, daily living assistance, and medication adherence monitoring for a 76-year-old grandfather in the comfort of his home.",
      createdAt: "2026-08-15T10:00:00.000Z",
      badge: "Verified Care"
    },
    {
      id: 2,
      imageUrl: "/assets/service-nursing.jpg",
      title: "Hospital-Grade Home Nursing & Blood Pressure Monitoring",
      category: "Clinical Nursing",
      location: "Jubilee Hills, Hyderabad",
      description: "Registered GNM nurse recording digital vitals, blood pressure, and blood glucose levels during a scheduled morning clinical visit.",
      createdAt: "2026-08-18T14:30:00.000Z",
      badge: "Clinical Standard"
    },
    {
      id: 3,
      imageUrl: "/assets/service-mother-baby.jpg",
      title: "Mother & Newborn Postnatal Care Session",
      category: "Mother & Baby",
      location: "Gachibowli, Hyderabad",
      description: "Certified postnatal care attendant assisting a new mother with baby massage, feeding posture, and post-delivery maternal recovery routines.",
      createdAt: "2026-08-20T09:15:00.000Z",
      badge: "Postnatal Specialist"
    },
    {
      id: 4,
      imageUrl: "/assets/service-doctor.jpg",
      title: "Experienced Doctor Home Consultation & Health Review",
      category: "Doctor Visits",
      location: "Madhapur, Hyderabad",
      description: "Senior general physician conducting an in-depth home health review, reviewing chronic conditions, and answering family queries with patience.",
      createdAt: "2026-08-22T11:45:00.000Z",
      badge: "Doctor Visit"
    },
    {
      id: 5,
      imageUrl: "/assets/gallery-walk.jpg",
      title: "Gentle Assisted Walking & Mobility in Garden",
      category: "Elderly Care",
      location: "Secunderabad, Hyderabad",
      description: "Caregiver gently assisting a senior citizen during their morning fresh-air stroll in the community garden to promote cardiovascular health.",
      createdAt: "2026-08-25T16:00:00.000Z",
      badge: "Mobility Support"
    },
    {
      id: 6,
      imageUrl: "/assets/service-physiotherapy.jpg",
      title: "Physiotherapy & Neuro-Rehabilitation Exercise",
      category: "Physiotherapy",
      location: "Kondapur, Hyderabad",
      description: "Licensed physiotherapist guiding an elderly patient through guided range-of-motion and joint strengthening exercises following surgery.",
      createdAt: "2026-08-28T10:30:00.000Z",
      badge: "Certified PT"
    },
    {
      id: 7,
      imageUrl: "/assets/service-icu-recovery.jpg",
      title: "ICU Home Recovery & Vital Signs Tracking",
      category: "ICU Recovery",
      location: "Hitec City, Hyderabad",
      description: "Critical-care trained home nurse managing oxygen saturation, pulse oximetry, and sterile cannula care in a home step-down setting.",
      createdAt: "2026-09-01T08:00:00.000Z",
      badge: "Critical Care"
    },
    {
      id: 8,
      imageUrl: "/assets/service-bedside-attendant.jpg",
      title: "Bedside Attendant Assisting Senior Patient with Warmth",
      category: "Bedside Assistance",
      location: "Begumpet, Hyderabad",
      description: "Dedicated attendant assisting a recovering patient with nutritious meals, hydration, and gentle position changes to prevent bedsores.",
      createdAt: "2026-09-02T13:20:00.000Z",
      badge: "24/7 Attendant"
    },
    {
      id: 9,
      imageUrl: "/assets/service-mtp.jpg",
      title: "Medical Transport Partner (MTP) Safe Patient Escort",
      category: "Medical Transport",
      location: "Kukatpally, Hyderabad",
      description: "Trained MTP escort safely assisting an elderly wheelchair patient from their doorstep to an outpatient hospital consultation.",
      createdAt: "2026-09-04T15:10:00.000Z",
      badge: "Transit Escort"
    },
    {
      id: 10,
      imageUrl: "/assets/service-nursing.jpg",
      title: "Post-Surgical Wound Dressing & Aseptic Care",
      category: "Clinical Nursing",
      location: "Attapur, Hyderabad",
      description: "Qualified nurse performing sterile suture line inspection and antiseptic dressing change for a patient recovering from orthopaedic surgery.",
      createdAt: "2026-09-05T11:00:00.000Z",
      badge: "Wound Care"
    },
    {
      id: 11,
      imageUrl: "/assets/service-mother-baby.jpg",
      title: "Prenatal Wellness & Vitals Check for Expectant Mother",
      category: "Mother & Baby",
      location: "Manikonda, Hyderabad",
      description: "Maternal healthcare nurse conducting prenatal blood pressure, weight, and wellness checks in the comfort of home.",
      createdAt: "2026-09-05T16:30:00.000Z",
      badge: "Antenatal Care"
    },
    {
      id: 12,
      imageUrl: "/assets/service-doctor.jpg",
      title: "Senior Citizen Health Screening & Care Coordination",
      category: "Doctor Visits",
      location: "Somajiguda, Hyderabad",
      description: "Physician and care coordinator reviewing medication reconciliation and preventive geriatric care plan with family.",
      createdAt: "2026-09-06T09:00:00.000Z",
      badge: "Preventive Check"
    }
  ],
  services: [
    {
      id: 1,
      slug: "elderly-care",
      title: "Elderly Care at Home",
      short: "Compassionate, respectful care for seniors in the comfort of home.",
      description: "Trained caregivers assist your elderly loved ones with daily activities, mobility, medication reminders, meals, and companionship — always with dignity and warmth.",
      benefits: ["Personal hygiene & grooming", "Medication reminders & vitals check", "Nutritious meal preparation", "Mobility & assisted walking support", "Emotional companionship & conversation"],
      duration: "Hourly, Daily, or Live-in",
      price: "Starting ₹500 / visit",
      category: "Elderly Care",
      comingSoon: false,
      image: "/assets/service-elderly.jpg",
      about: "Our specialized Elderly Care program is designed to deliver warm, professional, and reliable home care. Under the guidance of geriatric clinical advisors, our dedicated caregivers assist with daily living, medicine routines, mobility, and companionship, ensuring maximum peace of mind in the comfort of your own home.",
      highlights: [
        "100% Background-checked & police-verified caregivers",
        "Daily digital health & activity logs for family members",
        "Personalized daily care routine tailored to senior needs",
        "Assisted morning & evening walks with mobility support",
        "Dedicated 24/7 care helpline and doctor coordinator"
      ],
      images: ["/assets/service-elderly.jpg", "/assets/gallery-walk.jpg", "/assets/service-bedside-attendant.jpg"]
    },
    {
      id: 2,
      slug: "mother-baby-care",
      title: "Mother & Baby Care",
      short: "Postnatal support for new mothers and their newborns.",
      description: "Experienced maternity attendants and nurses help new mothers with recovery, feeding guidance, baby bathing, and round-the-clock newborn care.",
      benefits: ["Postnatal recovery & comfort care", "Lactation & breastfeeding guidance", "Gentle baby bathing & oil massage", "Newborn sleep routine scheduling", "Mother's emotional wellness support"],
      duration: "Daily, Weekly, or Monthly",
      price: "Starting ₹18,000 / month",
      category: "Maternal",
      comingSoon: false,
      image: "/assets/service-mother-baby.jpg",
      about: "Our Mother & Baby Care service provides experienced maternity attendants and pediatric nurses who guide new mothers through post-delivery recovery, gentle newborn handling, bathing, massage, and round-the-clock peace of mind.",
      highlights: [
        "Certified newborn care specialists and postnatal attendants",
        "Safe traditional baby bathing & soothing oil massage routines",
        "Guidance on breastfeeding, burping, and infant sleep cycles",
        "Post-cesarean / normal delivery recovery assistance for mother",
        "Digital milestone and vaccination reminders"
      ],
      images: ["/assets/service-mother-baby.jpg", "/assets/service-nursing.jpg", "/assets/service-bedside-attendant.jpg"]
    },
    {
      id: 3,
      slug: "pregnancy-care",
      title: "Pregnancy Care",
      short: "Attentive prenatal support for expectant mothers at home.",
      description: "Qualified nurses provide antenatal check-ins, wellness monitoring, and comforting care throughout pregnancy — so you can rest, recover and prepare in peace.",
      benefits: ["Vitals & fetal heartbeat monitoring", "Prenatal diet & nutrition guidance", "Comfort checks & posture guidance", "Mobility & breathing exercise support", "Direct obstetrician coordination"],
      duration: "Hourly, Daily, or Monthly",
      price: "Starting ₹700 / visit",
      category: "Prenatal",
      comingSoon: false,
      image: "/assets/service-nursing.jpg",
      about: "Attentive prenatal care delivered at home by trained maternal nurses to ensure health, comfort, and peace of mind during every trimester of pregnancy.",
      highlights: [
        "Routine blood pressure, pulse, and glucose checks at home",
        "Nutrition planning tailored to trimester requirements",
        "Relaxation, breathing, and safe mobility assistance",
        "Emergency preparedness and hospital bag checklist assistance",
        "Seamless coordination with your consulting gynaecologist"
      ],
      images: ["/assets/service-nursing.jpg", "/assets/service-mother-baby.jpg", "/assets/service-doctor.jpg"]
    },
    {
      id: 4,
      slug: "newborn-baby-care",
      title: "Newborn Baby Care",
      short: "Specialist care for babies in their most delicate first weeks.",
      description: "Trained newborn caregivers handle feeding, sleep routines, bathing, and gentle massages so parents can rest while their little one is in expert hands.",
      benefits: ["Sterile feeding bottle & burping support", "Gentle Ayurvedic oil massage & warm bath", "Umbilical cord hygiene & skin care", "Vaccination schedule tracking", "Overnight watchful nursery care"],
      duration: "Daily, Weekly, or Monthly",
      price: "Starting ₹20,000 / month",
      category: "Pediatric",
      comingSoon: false,
      image: "/assets/service-mother-baby.jpg",
      about: "Our specialized newborn caregivers give your newborn infant 24/7 dedicated attention, hygiene, and soothing care during the vital first 90 days of life.",
      highlights: [
        "Dedicated infant attendants with background clearance",
        "Hygienic diaper change, skin fold care, and rash prevention",
        "Gentle burping and colic relief massage techniques",
        "Structured sleep schedules for restful newborn nights",
        "Support with breastmilk storage and bottle sterilization"
      ],
      images: ["/assets/service-mother-baby.jpg", "/assets/service-nursing.jpg", "/assets/service-bedside-attendant.jpg"]
    },
    {
      id: 5,
      slug: "home-nursing",
      title: "Home Nursing Services",
      short: "Qualified nurses delivering hospital-grade care at home.",
      description: "Registered nurses provide wound care, IV therapy, catheter care, tracheostomy care, and general nursing tailored to your medical needs.",
      benefits: ["Sterile wound dressing & suture care", "IV infusion & injection therapy", "Catheter, Ryle's tube & stoma care", "24/7 Vital signs tracking & digital charts", "Direct doctor coordination"],
      duration: "Hourly, 12-hour, or 24-hour",
      price: "Starting ₹800 / visit",
      category: "Clinical",
      comingSoon: false,
      image: "/assets/service-nursing.jpg",
      about: "Hospital-standard clinical nursing delivered at home by licensed GNM and B.Sc nurses under strict medical protocols and sterile hygiene standards.",
      highlights: [
        "State Nursing Council registered nurses",
        "Expertise in post-surgical dressings, bedsores, and IV fluids",
        "Catheterization, nebulization, and oxygen administration",
        "Real-time vitals transmission to family and consulting doctor",
        "Flexible 12-hour day/night or 24-hour continuous shifts"
      ],
      images: ["/assets/service-nursing.jpg", "/assets/service-icu-recovery.jpg", "/assets/service-doctor.jpg"]
    },
    {
      id: 6,
      slug: "injection-services",
      title: "Injection Services",
      short: "Safe, sterile injections administered by trained nurses at home.",
      description: "On-demand injection service for insulin, antibiotics, vitamin shots, and prescribed medication — quick, hygienic, and pain-conscious.",
      benefits: ["100% Sterile disposable equipment", "Administered by certified nurses only", "Same-day & scheduled on-demand visits", "Bio-hazard sharps safe disposal", "Prescription verified prior to administration"],
      duration: "Per visit",
      price: "Starting ₹299 / visit",
      category: "Clinical",
      comingSoon: false,
      image: "/assets/service-nursing.jpg",
      about: "Avoid exhausting clinic trips for routine injections. Our licensed nurses arrive at your doorstep for sterile, hygienic, and gentle medicine administration.",
      highlights: [
        "Intramuscular (IM), Intravenous (IV), and Subcutaneous (SC) injections",
        "Insulin administration and blood glucose monitoring",
        "Doctor prescription verification before every procedure",
        "Emergency anaphylaxis protocols and sterile disposal kits",
        "Immediate booking with doorstep arrival within 60 minutes"
      ],
      images: ["/assets/service-nursing.jpg", "/assets/service-doctor.jpg", "/assets/service-icu-recovery.jpg"]
    },
    {
      id: 7,
      slug: "post-surgery-care",
      title: "Post-Surgery Care",
      short: "Guided recovery care after hospital discharge.",
      description: "Nurses and attendants support post-operative healing with wound care, medication schedules, mobility help, and gentle physical support.",
      benefits: ["Wound & surgical suture inspection", "Pain management & timely medication", "Assisted mobility & deep breathing exercises", "Post-op dietary supervision", "Daily recovery progress tracking"],
      duration: "Daily or 24-hour",
      price: "Starting ₹1,500 / day",
      category: "Recovery",
      comingSoon: false,
      image: "/assets/service-icu-recovery.jpg",
      about: "Recover safely and comfortably at home following surgery. Our clinical nurses and bedside attendants prevent hospital readmissions through attentive post-operative care.",
      highlights: [
        "Specialized care for orthopaedic, cardiac, and abdominal surgeries",
        "Sterile dressing changes to prevent surgical site infections (SSI)",
        "Assistance with transfer from bed to chair and gentle walking",
        "Drain tube management and input/output fluid charting",
        "Coordinated follow-ups with your operating surgeon"
      ],
      images: ["/assets/service-icu-recovery.jpg", "/assets/service-physiotherapy.jpg", "/assets/service-nursing.jpg"]
    },
    {
      id: 8,
      slug: "patient-care-attendant",
      title: "Patient Care Attendant",
      short: "Dedicated attendants for personal and daily patient needs.",
      description: "Trained attendants assist with feeding, hygiene, positioning and companionship so families can focus on being together.",
      benefits: ["Assisted feeding & hydration", "Sponge bath & personal hygiene", "Patient turning & bed positioning", "Medicine timekeeping & reminders", "Empathetic bedside companionship"],
      duration: "12-hour or 24-hour",
      price: "Starting ₹900 / day",
      category: "Assistance",
      comingSoon: false,
      image: "/assets/service-bedside-attendant.jpg",
      about: "Compassionate and physically capable patient care attendants who support bedridden or semi-mobile family members with daily living activities.",
      highlights: [
        "Trained in patient transfer and ergonomic lifting techniques",
        "Assistance with oral hygiene, sponge bathing, and clothing change",
        "Nutritious meal and water intake monitoring",
        "Support with walker, wheelchair, and restroom assistance",
        "Reliable day and night shift options across Hyderabad"
      ],
      images: ["/assets/service-bedside-attendant.jpg", "/assets/service-elderly.jpg", "/assets/gallery-walk.jpg"]
    },
    {
      id: 9,
      slug: "bedridden-patient-care",
      title: "Bedridden Patient Care",
      short: "Specialist care for patients confined to bed.",
      description: "Attendants and nurses trained in bedsore prevention, position changes, sponge baths, catheter care, and full daily support for bedridden patients.",
      benefits: ["2-hourly turning & bedsore prevention", "Bed bath, skin care & linen change", "Adult diaper & hygiene management", "Catheter & Ryle's tube feeding care", "Passive range-of-motion limb movement"],
      duration: "12-hour or 24-hour",
      price: "Starting ₹1,200 / day",
      category: "Specialized",
      comingSoon: false,
      image: "/assets/service-bedside-attendant.jpg",
      about: "Dedicated, respectful care for chronically ill, stroke, or palliative patients confined to bed, focusing on skin integrity, nutrition, and dignity.",
      highlights: [
        "Air mattress maintenance and pressure ulcer prevention routines",
        "Tube feeding (Ryle's tube / PEG) management by trained attendants",
        "Gentle daily sponge bathing and antiseptic skin hygiene",
        "Frequent position changes to prevent stiffness and lung congestion",
        "Supportive palliative companionship and family reassurance"
      ],
      images: ["/assets/service-bedside-attendant.jpg", "/assets/service-icu-recovery.jpg", "/assets/service-nursing.jpg"]
    },
    {
      id: 10,
      slug: "icu-home-recovery",
      title: "ICU / Home Recovery Support",
      short: "ICU-level home support for critical recovery.",
      description: "Critical-care trained nurses handle ventilator monitoring, tracheostomy care, and intensive recovery routines under doctor guidance.",
      benefits: ["Critical-care ICU certified nurses", "Tracheostomy care & sterile suctioning", "Ventilator / BiPAP / CPAP monitoring", "Continuous 24/7 vitals & SpO2 tracking", "Daily consultant physician reporting"],
      duration: "24-hour",
      price: "Starting ₹2,500 / day",
      category: "Intensive",
      comingSoon: false,
      image: "/assets/service-icu-recovery.jpg",
      about: "Step down from the hospital ICU to the comfort and safety of home. Our critical care team provides advanced monitoring, ventilator support, and nursing care.",
      highlights: [
        "Trained in handling ICU equipment: suction machines, oxygen, monitors",
        "Tracheostomy cleaning, cannula dressing, and emergency management",
        "Strict infection control and aseptic technique maintenance",
        "Direct emergency escalation protocols with tertiary hospitals",
        "24-hour bedside nursing coverage with experienced staff"
      ],
      images: ["/assets/service-icu-recovery.jpg", "/assets/service-nursing.jpg", "/assets/service-doctor.jpg"]
    },
    {
      id: 11,
      slug: "physiotherapy",
      title: "Physiotherapy at Home",
      short: "Home physiotherapy sessions for recovery and mobility.",
      description: "Professional physiotherapists visit your home for orthopaedic, neurological and post-surgery rehabilitation programs.",
      benefits: ["Customized physical rehabilitation plans", "Orthopaedic & joint replacement rehab", "Neurological & stroke mobility recovery", "Post-surgery strengthening exercises", "Pain management with TENS & ultrasound"],
      duration: "Per session",
      price: "Starting ₹799 / session",
      category: "Therapy",
      comingSoon: false,
      image: "/assets/service-physiotherapy.jpg",
      about: "Reclaim mobility and strength with qualified physiotherapists who bring therapeutic equipment and guided exercises directly to your home.",
      highlights: [
        "Certified BPT / MPT licensed physiotherapists",
        "Custom rehab for knee replacement, hip surgery, and fractures",
        "Neuro-rehabilitation for stroke, Parkinson's, and paralysis patients",
        "Balance and gait training to prevent falls in elderly individuals",
        "Weekly functional improvement scoring and reporting"
      ],
      images: ["/assets/service-physiotherapy.jpg", "/assets/gallery-walk.jpg", "/assets/service-elderly.jpg"]
    },
    {
      id: 12,
      slug: "doctor-consultation",
      title: "Doctor Consultation at Home",
      short: "Home visit and online consultations with trusted doctors.",
      description: "Consult experienced general physicians and specialists from the comfort of your home — with follow-ups and prescriptions.",
      benefits: ["Comprehensive home physical examination", "Digital & printed e-Prescriptions", "Chronic condition management (Diabetes, BP)", "Specialist referral & lab test coordination", "Convenient tele-consultation follow-ups"],
      duration: "Per consultation",
      price: "Starting ₹999 / visit",
      category: "Medical",
      comingSoon: false,
      image: "/assets/service-doctor.jpg",
      about: "Compassionate, thorough medical consultations conducted in your home by verified physicians, ideal for seniors, bedridden patients, and convalescing individuals.",
      highlights: [
        "Detailed medical history review and systemic physical examination",
        "Medicine reconciliation and reduction of polypharmacy risks",
        "Doorstep diagnostic lab sample collection coordination",
        "Digital health record creation on the Amma Seva portal",
        "Direct emergency helpline access for registered patients"
      ],
      images: ["/assets/service-doctor.jpg", "/assets/service-nursing.jpg", "/assets/service-elderly.jpg"]
    }
  ],
  notifications: [],
  reviews: [],
  announcements: [],
  blogs: [
    {
      id: 1,
      slug: "essential-guide-elderly-care-hyderabad",
      title: "The Essential Guide to Quality Elderly Care at Home in Telangana",
      description: "Discover clinical protocols, psychological support frameworks, and practical routines that preserve senior dignity and safety in the comfort of home.",
      category: "Geriatric Care",
      author: "Dr. Ramesh V., MD (Geriatric Medicine) & Advisory Board",
      date: "2026-08-20",
      readTime: "6 min read",
      image: "/assets/service-elderly.jpg",
      badge: "Clinical Standard",
      keyTakeaways: [
        "Home-based geriatric care reduces cognitive disorientation and hospital delirium by over 55%.",
        "Fall prevention audits in living spaces eliminate up to 70% of senior orthopaedic fractures.",
        "Strict medication reconciliation prevents life-threatening polypharmacy and drug-drug interactions.",
        "Alignment with the National Programme for Health Care of the Elderly (NPHCE) standards."
      ],
      content: `## 1. The Demographic Need for Home Geriatric Support\n\nAs our beloved parents and grandparents age, their physical, physiological, and emotional healthcare requirements evolve rapidly. In urban hubs like Hyderabad and Secunderabad, busy family work schedules often create a care gap. While institutional nursing homes were once the default option, modern home healthcare allows seniors to receive hospital-standard clinical supervision within the comforting familiarity of their own homes.\n\nResearch conducted under geriatric welfare frameworks demonstrates that seniors recovering in familiar surroundings experience significantly lower rates of anxiety, cognitive decline, and hospital-acquired delirium compared to institutionalized patients.\n\n---\n\n## 2. Core Pillars of Comprehensive Elderly Care\n\nA clinical home care program is structured around four essential pillars:\n\n### A. Fall Risk Prevention & Environmental Safety\nFalls represent the single largest cause of debilitating hip fractures and intracranial trauma in seniors above 65 years. Our trained caregivers conduct a systematic room-by-room safety audit to eliminate hazards:\n- Securing loose carpets and installing anti-slip rubber mats in bathrooms.\n- Ensuring adequate 500-lux ambient lighting along hallways and bedroom pathways.\n- Assisting with gait stabilization, walker usage, and ergonomic bed-to-chair transfers.\n\n### B. Medication Adherence & Polypharmacy Monitoring\nElderly patients frequently manage multiple chronic conditions (Hypertension, Type 2 Diabetes, Arthritis). Amma Seva caregivers maintain digital medication logs, ensuring every pill is administered at the exact prescribed hour with water and meals.\n\n### C. Assisted Mobility & Cognitive Engagement\nStructured daily routines including morning 15-minute garden walks for natural Vitamin D synthesis and cognitive engagement exercises.\n\n### D. Continuous Vital Signs Tracking\nDaily recording of Blood Pressure, Blood Glucose, Pulse Rate, and Pulse Oximetry (SpO2) provides families and attending physicians with an unshakeable digital record.\n\n---\n\n## 3. Public Health Alignment & Senior Dignity\n\nAmma Seva adheres to the clinical benchmarks outlined by the Ministry of Health and Family Welfare's National Programme for Health Care of the Elderly (NPHCE). Every elder in our care is treated with profound respect, empathy, and dignity.`
    },
    {
      id: 2,
      slug: "postnatal-recovery-guide-new-mothers",
      title: "Postnatal & Newborn Care: Clinical Best Practices for the 4th Trimester",
      description: "A comprehensive guide on postpartum recovery, lactation support, neonatal jaundice monitoring, and the vital first 90 days of infant life.",
      category: "Maternal & Newborn",
      author: "Sister Sunitha M., B.Sc Nursing & Lactation Specialist",
      date: "2026-08-25",
      readTime: "7 min read",
      image: "/assets/service-mother-baby.jpg",
      badge: "Maternity Care",
      keyTakeaways: [
        "The 'Fourth Trimester' requires equal clinical attention for mother's physical healing and infant development.",
        "Early recognition of neonatal jaundice using Kramer's cephalocaudal rule prevents kernicterus.",
        "Proper latching and feeding ergonomics prevent nipple trauma and promote sustained breastmilk supply.",
        "Routine screening for Postpartum Depression (PPD) using the Edinburgh Postnatal Depression Scale."
      ],
      content: `## 1. Understanding the Fourth Trimester\n\nThe delivery of a baby is one of life's greatest blessings, yet the immediate 12 weeks following childbirth represents a period of profound hormonal, physical, and psychological transition for new mothers.\n\n---\n\n## 2. Key Protocols in Postnatal Maternal Recovery\n\n### Post-Cesarean & Normal Delivery Wound Care\nDaily monitoring of surgical suture lines for erythema and exudate to prevent surgical site infections (SSI), paired with high-protein nutrition to promote tissue healing.\n\n### Lactation Guidance & Feeding Mechanics\nCertified nurses provide ergonomic positioning guidance (Cradle, Football hold) and asymmetrical latching assistance to prevent nipple trauma and sustain milk supply.\n\n---\n\n## 3. Essential Newborn Care Protocols\n\n### Neonatal Jaundice Monitoring\nVisual assessment of bilirubin progression using Kramer's rule and immediate non-invasive testing when indicated.\n\n### Traditional Bathing & Safe Infant Oil Massage\nStimulates peripheral circulation and calms the infant nervous system using lukewarm water and gentle sterile techniques.`
    },
    {
      id: 3,
      slug: "prevent-bedsores-bedridden-patients",
      title: "Preventing Bedsores (Decubitus Ulcers) in Bedbound Patients: Clinical Protocol",
      description: "Evidence-based nursing guidelines on Braden Scale risk assessment, 2-hour positional turning schedules, and advanced skin integrity management.",
      category: "Clinical Nursing",
      author: "Amma Seva Clinical Nursing Board",
      date: "2026-08-28",
      readTime: "8 min read",
      image: "/assets/service-bedside-attendant.jpg",
      badge: "Wound Care",
      keyTakeaways: [
        "Pressure ulcers can form within 2 hours of unalleviated mechanical compression on bony prominences.",
        "A strict 2-hour turning schedule (Lateral-Supine-Lateral) restores capillary blood flow to ischemic tissue.",
        "Moisture management using barrier zinc-oxide ointments prevents skin maceration.",
        "High-protein nutrition (1.2 - 1.5 g/kg/day) provides essential amino acids for tissue repair."
      ],
      content: `## 1. The Critical Danger of Pressure Ulcers\n\nFor individuals recovering from severe stroke, trauma, or terminal illness, prolonged immobilization creates sustained mechanical pressure over bony prominences. When external pressure exceeds capillary arteriolar pressure (32 mmHg), rapid tissue ischemia occurs within 2 to 4 hours.\n\n---\n\n## 2. The Amma Seva Bedsore Prevention Protocol\n\n### A. The 2-Hour Positional Turning Schedule\nOur bedside attendants maintain a continuous, documented turning clock alternating between lateral tilt and supine positions.\n\n### B. Microclimate & Moisture Management\nUtilizing pH-balanced perineal cleansers, breathable zinc-oxide barrier creams, and immediate moisture-wicking underpad changes.\n\n### C. Alternating Pressure Ripple Mattresses\nMotorized cyclic inflation and deflation of air cells ensures no single anatomical zone sustains constant pressure.\n\n### D. Clinical High-Protein Nutrition\nEnsuring 1.2 to 1.5 grams of protein per kilogram of body weight daily for rapid cellular collagen repair.`
    },
    {
      id: 4,
      slug: "home-icu-step-down-protocols",
      title: "Hospital-to-Home ICU Step-Down: Safe Recovery Protocols for Critical Patients",
      description: "Why transitioning critical patients to hospital-standard home ICU setups reduces infection risks, accelerates mental healing, and saves up to 65% in costs.",
      category: "Critical Care",
      author: "Dr. Ramesh V. & ICU Critical Care Team",
      date: "2026-09-01",
      readTime: "9 min read",
      image: "/assets/service-icu-recovery.jpg",
      badge: "Critical Care",
      keyTakeaways: [
        "Home ICU step-downs reduce hospital-acquired bacterial infections (Nosocomial Pneumonia, UTI) by over 60%.",
        "Continuous 24/7 vitals telemetry (SpO2, ECG, NIBP) provides real-time alerts to supervising physicians.",
        "Tracheostomy suctioning and BiPAP ventilation administered by ICU-trained GNM nurses.",
        "Cost savings of 60% to 70% compared to private hospital intensive care unit bed charges."
      ],
      content: `## 1. Why Transition Critical Patients Home?\n\nProlonged hospital ICU admissions place patients at grave risk of multi-drug resistant superbug infections, sleep deprivation, and acute delirium. A customized Home ICU setup bridges this gap by deploying hospital-grade medical equipment and specialized critical care nurses right into the patient's bedroom.\n\n---\n\n## 2. Essential Equipment for Home Intensive Care\n\n- **Oxygen Concentrators & Cylinders**: Guaranteed uninterrupted high-flow oxygen supply with battery backup.\n- **BiPAP / CPAP Machines**: Non-invasive respiratory support for COPD and post-extubation patients.\n- **Multi-Para Monitors**: Continuous digital tracking of ECG, Heart Rate, SpO2, and Non-Invasive Blood Pressure.\n- **Sterile Suction Apparatus**: Essential for tracheostomy care and airway clearance.\n\n---\n\n## 3. Dedicated Clinical Supervision\n\nOur GNM critical care nurses follow strict sterile barrier protocols, manage arterial lines, deliver IV infusions, and provide hourly digital telemetry logs directly to the family's consulting intensivist.`
    },
    {
      id: 5,
      slug: "physiotherapy-stroke-rehab-home",
      title: "Neuro-Rehabilitation & Mobility Restoration: Physiotherapy at Home",
      description: "How early in-home physiotherapy accelerates neurological neuroplasticity, restores limb function, and rebuilds independent living.",
      category: "Therapy & Rehab",
      author: "Dr. Ananya P., Master of Physiotherapy (Neuro)",
      date: "2026-09-03",
      readTime: "6 min read",
      image: "/assets/service-physiotherapy.jpg",
      badge: "Neuro Rehab",
      keyTakeaways: [
        "Early physical rehabilitation within the first 14 days post-stroke significantly boosts motor function recovery.",
        "Task-oriented training in the patient's own home environment leads to faster transfer to daily activities.",
        "Passive and active-assisted range of motion exercises prevent painful contractures and joint stiffness.",
        "Balance and proprioception training eliminates secondary fall trauma."
      ],
      content: `## 1. The Neuroplasticity Window\n\nFollowing an ischemic stroke or orthopaedic surgery, the brain and muscular system possess an innate capacity for rewiring known as **neuroplasticity**. The first 90 days post-event represent the golden period for physical rehabilitation.\n\n---\n\n## 2. Key Modalities in Home Physiotherapy\n\n### Motor Function Re-education\nTargeted proprioceptive neuromuscular facilitation (PNF) techniques that re-educate muscle groups to perform coordinated functional tasks.\n\n### Gait & Balance Training\nGradual progression from parallel bar stabilization to walker-assisted standing, dynamic weight-shifting, and stair climbing in the patient's home.\n\n### Pain & Spasticity Management\nTherapeutic heat, cryotherapy, and electrical muscle stimulation (TENS/EMS) to alleviate spasticity and restore joint mobility.`
    },
    {
      id: 6,
      slug: "mtp-transport-medical-escort-hyderabad",
      title: "Medical Transport Partners (MTP): Safe Non-Emergency Hospital Escorts",
      description: "Solving the medical mobility crisis with trained paramedical escorts, wheelchair assistance, and zero-surge door-to-hospital transport in Hyderabad.",
      category: "Medical Transport",
      author: "Amma Seva Emergency & Mobility Operations",
      date: "2026-09-05",
      readTime: "5 min read",
      image: "/assets/service-mtp.jpg",
      badge: "Mobility Partner",
      keyTakeaways: [
        "Standard ride-hailing cabs cannot safely accommodate bedbound or wheelchair-dependent patients.",
        "MTP attendants are trained in ergonomic lifting, stretcher handling, and wheelchair security.",
        "Dedicated hospital escort assists with OPD registration, diagnostic queues, and pharmacy runs.",
        "Zero-surge, guaranteed punctual dispatch across all zones of Hyderabad."
      ],
      content: `## 1. The Medical Transit Challenge\n\nTaking an ailing parent, dialysis patient, or post-surgery relative to a hospital for routine checkups is often an overwhelming physical hurdle. Commercial auto-rickshaws and cabs lack medical suspension, wheelchair ramps, and compassionate assistance.\n\n---\n\n## 2. The Amma Seva MTP Solution\n\nOur **Multi-Tasking Professionals (MTP)** are specialized medical escort partners who handle the entire journey from your living room into the doctor's consultation chamber:\n\n- **Doorstep Assistance**: Safe bed-to-wheelchair transfers and vehicle boarding.\n- **Hospital Navigation**: Fast-tracking OPD registration, wheelchair navigation across hospital corridors, and queue management.\n- **Safe Return**: Ensuring the patient is safely escorted back home and settled comfortably into bed.`
    }
  ],
  faqs: [
    { id: 1, question: "Are your caregivers and nurses verified?", answer: "Yes. Every professional undergoes ID verification, background checks, and skill assessments before joining." },
    { id: 2, question: "How quickly can care be arranged?", answer: "In most cities, we can arrange care within 4–12 hours depending on the service and shift." },
    { id: 3, question: "Can I choose the shift duration?", answer: "Absolutely. We offer hourly visits, 12-hour and 24-hour shifts, plus weekly and monthly plans." },
    { id: 4, question: "How do payments work?", answer: "You can pay online via Razorpay. Shift booking is confirmed immediately after secure payment." },
    { id: 5, question: "What if I need to reschedule or cancel?", answer: "You can reschedule anytime via your dashboard panel. Cancellations follow our refund policy." }
  ]
}

// Initialize JSON database with default template
const initJSONDb = () => {
  if (!fs.existsSync(JSON_DB_PATH)) {
    fs.writeFileSync(JSON_DB_PATH, JSON.stringify(DEFAULT_MOCK_DATA, null, 2))
  } else {
    try {
      const data = JSON.parse(fs.readFileSync(JSON_DB_PATH, 'utf-8'))
      let modified = false
      if (!data.users) { data.users = DEFAULT_MOCK_DATA.users; modified = true }
      if (!data.enquiries) { data.enquiries = DEFAULT_MOCK_DATA.enquiries; modified = true }
      if (!data.bookings) { data.bookings = DEFAULT_MOCK_DATA.bookings; modified = true }
      if (!data.caregivers) { data.caregivers = DEFAULT_MOCK_DATA.caregivers; modified = true }
      if (!data.services || data.services.length === 0) { data.services = DEFAULT_MOCK_DATA.services; modified = true }
      if (data.services) {
        data.services.forEach(s => {
          if (s.advance === undefined) {
            const priceVal = Number(String(s.price).replace(/[^0-9]/g, '')) || 500
            s.advance = Math.round(priceVal * 0.2)
            modified = true
          }
        })
      }
      if (!data.notifications) { data.notifications = DEFAULT_MOCK_DATA.notifications; modified = true }
      if (!data.reviews) { data.reviews = []; modified = true }
      if (!data.announcements) { data.announcements = []; modified = true }
      if (!data.mtps) { data.mtps = []; modified = true }
      if (!data.mtpTasks || data.mtpTasks.length === 0) { data.mtpTasks = DEFAULT_MOCK_DATA.mtpTasks; modified = true }
      if (!data.blogs || data.blogs.length <= 1 || (data.blogs.length === 1 && data.blogs[0].title === 'Testing')) {
        data.blogs = DEFAULT_MOCK_DATA.blogs;
        modified = true;
      }
      if (!data.gallery || data.gallery.length <= 1 || (data.gallery.length === 1 && (data.gallery[0].title.includes('Honey') || data.gallery[0].title === 'Testing'))) {
        data.gallery = DEFAULT_MOCK_DATA.gallery;
        modified = true;
      }
      if (!data.faqs || data.faqs.length === 0) { data.faqs = DEFAULT_MOCK_DATA.faqs; modified = true }
      if (modified) {
        fs.writeFileSync(JSON_DB_PATH, JSON.stringify(data, null, 2))
      }
    } catch (e) {
      fs.writeFileSync(JSON_DB_PATH, JSON.stringify(DEFAULT_MOCK_DATA, null, 2))
    }
  }
}

// Read JSON database file
const readJSONDb = async () => {
  initJSONDb()
  const data = await fs.promises.readFile(JSON_DB_PATH, 'utf-8')
  return JSON.parse(data)
}

// Write JSON database file
const writeJSONDb = async (data) => {
  await fs.promises.writeFile(JSON_DB_PATH, JSON.stringify(data, null, 2), 'utf-8')
}

export const db = {
  // Initialize Database
  init: async () => {
    const host = process.env.DB_HOST
    const user = process.env.DB_USER
    const password = process.env.DB_PASSWORD
    const database = process.env.DB_NAME

    if (host && user && database) {
      console.log(`🔌 Detected MySQL environment variables. Initializing MySQL pool connection...`)
      try {
        pool = mysql.createPool({
          host,
          user,
          password,
          database,
          port: process.env.DB_PORT || 3306,
          waitForConnections: true,
          connectionLimit: 10,
          queueLimit: 0
        })

        // Verify connection & create tables
        const connection = await pool.getConnection()
        console.log(`✅ MySQL connected. Ensuring tables exist...`)

        await connection.query(`
          CREATE TABLE IF NOT EXISTS volunteers (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            registeredAt VARCHAR(255) NOT NULL
          )
        `)

        await connection.query(`
          CREATE TABLE IF NOT EXISTS donations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            amount DECIMAL(10,2) NOT NULL,
            donatedAt VARCHAR(255) NOT NULL
          )
        `)

        await connection.query(`
          CREATE TABLE IF NOT EXISTS enquiries (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            phone VARCHAR(50) NOT NULL,
            email VARCHAR(255),
            service VARCHAR(255),
            city VARCHAR(255),
            message TEXT,
            submittedAt VARCHAR(255) NOT NULL
          )
        `)

        await connection.query(`
          CREATE TABLE IF NOT EXISTS bookings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            phone VARCHAR(50) NOT NULL,
            service VARCHAR(255) NOT NULL,
            date VARCHAR(50) NOT NULL,
            time VARCHAR(50) NOT NULL,
            duration VARCHAR(50) NOT NULL,
            address TEXT NOT NULL,
            status VARCHAR(50) DEFAULT 'Pending',
            assignedStaff VARCHAR(255),
            amount DECIMAL(10,2) DEFAULT 0,
            paymentStatus VARCHAR(50) DEFAULT 'Unpaid',
            paymentMethod VARCHAR(100),
            transactionId VARCHAR(255),
            paymentDate VARCHAR(100),
            patientName LONGTEXT,
            patientAge VARCHAR(50),
            patientNeeds LONGTEXT,
            prescription LONGTEXT,
            googleMapLocation TEXT,
            advancePaid DECIMAL(10,2) DEFAULT 0,
            balanceAmount DECIMAL(10,2) DEFAULT 0,
            createdAt VARCHAR(255) NOT NULL
          )
        `)

        try {
          await connection.query('ALTER TABLE bookings ADD COLUMN vitals TEXT')
          console.log('[MySQL] Added column vitals to bookings table.')
        } catch (err) {
          // Column probably already exists, ignore
        }
        try {
          await connection.query('ALTER TABLE bookings ADD COLUMN careLogs TEXT')
          console.log('[MySQL] Added column careLogs to bookings table.')
        } catch (err) {
          // Column probably already exists, ignore
        }

        await connection.query(`
          CREATE TABLE IF NOT EXISTS caregivers (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            phone VARCHAR(50) NOT NULL,
            email VARCHAR(255),
            specialty VARCHAR(255) NOT NULL,
            experience INT DEFAULT 0,
            status VARCHAR(50) DEFAULT 'Pending',
            aadhaar LONGTEXT,
            pan LONGTEXT,
            certificates LONGTEXT,
            profilePhoto LONGTEXT,
            experienceDetails TEXT,
            workingLocations TEXT,
            availableTimings TEXT,
            state VARCHAR(100),
            city VARCHAR(100),
            googleMapLocation TEXT,
            experienceCertificate LONGTEXT,
            policeVerification LONGTEXT,
            additionalCertificates LONGTEXT,
            joinedAt VARCHAR(255) NOT NULL
          )
        `)

        await connection.query(`
          CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL UNIQUE,
            phone VARCHAR(50) NOT NULL,
            password VARCHAR(255) NOT NULL,
            createdAt VARCHAR(255) NOT NULL
          )
        `)

        await connection.query(`
          CREATE TABLE IF NOT EXISTS services (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            slug VARCHAR(255) NOT NULL UNIQUE,
            short TEXT,
            description TEXT,
            benefits TEXT,
            duration VARCHAR(100),
            price VARCHAR(50) NOT NULL,
            category VARCHAR(50),
            comingSoon TINYINT DEFAULT 0,
            advance INT DEFAULT 0,
            image LONGTEXT,
            about TEXT,
            highlights TEXT,
            images TEXT
          )
        `)

        await connection.query(`
          CREATE TABLE IF NOT EXISTS notifications (
            id INT AUTO_INCREMENT PRIMARY KEY,
            recipient VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            type VARCHAR(50) NOT NULL,
            sentAt VARCHAR(255) NOT NULL
          )
        `)

        await connection.query(`
          CREATE TABLE IF NOT EXISTS otp_verifications (
            email VARCHAR(255) PRIMARY KEY,
            otp VARCHAR(10) NOT NULL,
            role VARCHAR(50) NOT NULL,
            expiresAt BIGINT NOT NULL
          )
        `)

        await connection.query(`
          CREATE TABLE IF NOT EXISTS reviews (
            id INT AUTO_INCREMENT PRIMARY KEY,
            bookingId INT UNIQUE,
            caregiverName VARCHAR(255) NOT NULL,
            rating INT NOT NULL,
            comment TEXT,
            createdAt VARCHAR(255) NOT NULL
          )
        `)

        await connection.query(`
          CREATE TABLE IF NOT EXISTS announcements (
            id INT AUTO_INCREMENT PRIMARY KEY,
            message TEXT NOT NULL,
            target VARCHAR(50) NOT NULL,
            createdAt VARCHAR(255) NOT NULL
          )
        `)

        await connection.query(`
          CREATE TABLE IF NOT EXISTS gallery (
            id INT AUTO_INCREMENT PRIMARY KEY,
            imageUrl LONGTEXT NOT NULL,
            title VARCHAR(255) NOT NULL,
            createdAt VARCHAR(255) NOT NULL
          )
        `)

        await connection.query(`
          CREATE TABLE IF NOT EXISTS blogs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            slug VARCHAR(255) NOT NULL,
            description TEXT NOT NULL,
            content LONGTEXT NOT NULL,
            image TEXT,
            category VARCHAR(255),
            author VARCHAR(255),
            date VARCHAR(255)
          )
        `)

        await connection.query(`
          CREATE TABLE IF NOT EXISTS faqs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            question TEXT NOT NULL,
            answer TEXT NOT NULL,
            createdAt VARCHAR(255) NOT NULL
          )
        `)

        await connection.query(`
          CREATE TABLE IF NOT EXISTS mtps (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            phone VARCHAR(50) NOT NULL,
            email VARCHAR(255),
            gender VARCHAR(50),
            age VARCHAR(50),
            city VARCHAR(100) DEFAULT 'Hyderabad',
            locality VARCHAR(255),
            roles TEXT,
            availability VARCHAR(100),
            vehicle VARCHAR(100),
            drivingLicense VARCHAR(50),
            experience VARCHAR(100),
            skillsSummary TEXT,
            aadhaar VARCHAR(100),
            emergencyContact VARCHAR(255),
            aadhaarDoc LONGTEXT,
            panDoc LONGTEXT,
            drivingLicenseDoc LONGTEXT,
            tenthCertificateDoc LONGTEXT,
            policeVerificationDoc LONGTEXT,
            status VARCHAR(50) DEFAULT 'Pending',
            adminNotes TEXT,
            createdAt VARCHAR(255) NOT NULL
          )
        `)

        await connection.query(`
          CREATE TABLE IF NOT EXISTS mtp_tasks (
            id INT AUTO_INCREMENT PRIMARY KEY,
            icon VARCHAR(50) DEFAULT '🚗',
            title VARCHAR(255) NOT NULL,
            description TEXT NOT NULL,
            shiftType VARCHAR(100) DEFAULT 'Part-time / On-Demand',
            earningEstimate VARCHAR(100) DEFAULT '₹300 - ₹1,500 / task',
            active TINYINT DEFAULT 1,
            createdAt VARCHAR(255) NOT NULL
          )
        `)

        // Add columns to existing tables if missing
        try {
          await connection.query(`ALTER TABLE caregivers ADD COLUMN password VARCHAR(255)`)
        } catch (e) {
          // ignore column already exists error
        }
        try {
          await connection.query(`ALTER TABLE caregivers ADD COLUMN aadhaar LONGTEXT`)
        } catch (e) {}
        try {
          await connection.query(`ALTER TABLE caregivers ADD COLUMN pan LONGTEXT`)
        } catch (e) {}
        try {
          await connection.query(`ALTER TABLE caregivers ADD COLUMN certificates LONGTEXT`)
        } catch (e) {}
        try {
          await connection.query(`ALTER TABLE caregivers ADD COLUMN profilePhoto LONGTEXT`)
        } catch (e) {}
        try {
          await connection.query(`ALTER TABLE caregivers ADD COLUMN experienceDetails TEXT`)
        } catch (e) {}
        try {
          await connection.query(`ALTER TABLE caregivers ADD COLUMN workingLocations TEXT`)
        } catch (e) {}
        try {
          await connection.query(`ALTER TABLE caregivers ADD COLUMN availableTimings TEXT`)
        } catch (e) {}
        try {
          await connection.query(`ALTER TABLE caregivers ADD COLUMN state VARCHAR(100)`)
        } catch (e) {}
        try {
          await connection.query(`ALTER TABLE caregivers ADD COLUMN city VARCHAR(100)`)
        } catch (e) {}
        try {
          await connection.query(`ALTER TABLE caregivers ADD COLUMN googleMapLocation TEXT`)
        } catch (e) {}
        try {
          await connection.query(`ALTER TABLE caregivers ADD COLUMN experienceCertificate LONGTEXT`)
        } catch (e) {}
        try {
          await connection.query(`ALTER TABLE caregivers ADD COLUMN policeVerification LONGTEXT`)
        } catch (e) {}
        try {
          await connection.query(`ALTER TABLE caregivers ADD COLUMN additionalCertificates LONGTEXT`)
        } catch (e) {}
        try {
          await connection.query(`ALTER TABLE mtps ADD COLUMN aadhaarDoc LONGTEXT`)
        } catch (e) {}
        try {
          await connection.query(`ALTER TABLE mtps ADD COLUMN panDoc LONGTEXT`)
        } catch (e) {}
        try {
          await connection.query(`ALTER TABLE mtps ADD COLUMN drivingLicenseDoc LONGTEXT`)
        } catch (e) {}
        try {
          await connection.query(`ALTER TABLE mtps ADD COLUMN tenthCertificateDoc LONGTEXT`)
        } catch (e) {}
        try {
          await connection.query(`ALTER TABLE mtps ADD COLUMN policeVerificationDoc LONGTEXT`)
        } catch (e) {}
        try {
          await connection.query(`ALTER TABLE bookings ADD COLUMN userId INT`)
        } catch (e) {
          // ignore column already exists error
        }
        try {
          await connection.query(`ALTER TABLE bookings ADD COLUMN paymentMethod VARCHAR(100)`)
        } catch (e) {}
        try {
          await connection.query(`ALTER TABLE bookings ADD COLUMN transactionId VARCHAR(255)`)
        } catch (e) {}
        try {
          await connection.query(`ALTER TABLE bookings ADD COLUMN paymentDate VARCHAR(100)`)
        } catch (e) {}
        try {
          await connection.query(`ALTER TABLE bookings ADD COLUMN patientName LONGTEXT`)
        } catch (e) {}
        try {
          await connection.query(`ALTER TABLE bookings ADD COLUMN patientAge VARCHAR(50)`)
        } catch (e) {}
        try {
          await connection.query(`ALTER TABLE bookings ADD COLUMN patientNeeds LONGTEXT`)
        } catch (e) {}
        try {
          await connection.query(`ALTER TABLE bookings ADD COLUMN prescription LONGTEXT`)
        } catch (e) {}
        try {
          await connection.query(`ALTER TABLE bookings ADD COLUMN googleMapLocation TEXT`)
        } catch (e) {}
        try {
          await connection.query(`ALTER TABLE services ADD COLUMN advance INT DEFAULT 0`)
        } catch (e) {}
        try {
          await connection.query(`ALTER TABLE bookings ADD COLUMN advancePaid DECIMAL(10,2) DEFAULT 0`)
        } catch (e) {}
        try {
          await connection.query(`ALTER TABLE bookings ADD COLUMN balanceAmount DECIMAL(10,2) DEFAULT 0`)
        } catch (e) {}

        // Migration queries for services table
        try {
          await connection.query(`ALTER TABLE services ADD COLUMN slug VARCHAR(255)`)
        } catch (e) {}
        try {
          await connection.query(`ALTER TABLE services ADD COLUMN short TEXT`)
        } catch (e) {}
        try {
          await connection.query(`ALTER TABLE services ADD COLUMN benefits TEXT`)
        } catch (e) {}
        try {
          await connection.query(`ALTER TABLE services ADD COLUMN duration VARCHAR(100)`)
        } catch (e) {}
        try {
          await connection.query(`ALTER TABLE services ADD COLUMN comingSoon TINYINT DEFAULT 0`)
        } catch (e) {}
        try {
          await connection.query(`ALTER TABLE services ADD COLUMN image LONGTEXT`)
        } catch (e) {}
        try {
          await connection.query(`ALTER TABLE services ADD COLUMN about TEXT`)
        } catch (e) {}
        try {
          await connection.query(`ALTER TABLE services ADD COLUMN highlights TEXT`)
        } catch (e) {}
        try {
          await connection.query(`ALTER TABLE services ADD COLUMN images TEXT`)
        } catch (e) {}

        // Insert initial values if MySQL database is fresh/empty
        const [bookingsRows] = await connection.query('SELECT count(*) as count FROM bookings')
        if (bookingsRows[0].count === 0) {
          console.log('Inserting initial mock bookings into MySQL...')
          for (const b of DEFAULT_MOCK_DATA.bookings) {
            await connection.query(
              'INSERT INTO bookings (name, phone, service, date, time, duration, address, status, assignedStaff, amount, paymentStatus, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
              [b.name, b.phone, b.service, b.date, b.time, b.duration, b.address, b.status, b.assignedStaff, b.amount, b.paymentStatus, b.createdAt]
            )
          }
        }

        const [caregiverRows] = await connection.query('SELECT count(*) as count FROM caregivers')
        if (caregiverRows[0].count === 0) {
          console.log('Inserting initial mock caregivers into MySQL...')
          for (const c of DEFAULT_MOCK_DATA.caregivers) {
            await connection.query(
              'INSERT INTO caregivers (name, phone, email, specialty, experience, status, joinedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
              [c.name, c.phone, c.email, c.specialty, c.experience, c.status, c.joinedAt]
            )
          }
        }

        const [enquiryRows] = await connection.query('SELECT count(*) as count FROM enquiries')
        if (enquiryRows[0].count === 0) {
          console.log('Inserting initial mock enquiries into MySQL...')
          for (const e of DEFAULT_MOCK_DATA.enquiries) {
            await connection.query(
              'INSERT INTO enquiries (name, phone, email, service, city, message, submittedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
              [e.name, e.phone, e.email, e.service, e.city, e.message, e.submittedAt]
            )
          }
        }

        // Clean up old default sample/mock services from the live database
        try {
          await connection.query(`
            DELETE FROM services 
            WHERE slug IN ('baby-care', 'injection-services', 'elderly-care-at-home', 'elderly-care') 
               OR description IN ('wklbcbkfhip', 'IV, IM, and subcutaneous drug administrations', 'Assisting seniors with daily tasks and medication routine')
          `)
          console.log('🧹 Cleaned up old default mock/sample services from MySQL database.')
        } catch (e) {
          console.error('Failed to cleanup old mock services:', e)
        }

        const [servicesRows] = await connection.query('SELECT count(*) as count FROM services')
        if (servicesRows[0].count === 0) {
          console.log('Inserting initial mock services into MySQL...')
          for (const s of DEFAULT_MOCK_DATA.services) {
            const priceVal = Number(String(s.price).replace(/[^0-9]/g, '')) || 500
            const advanceVal = s.advance || Math.round(priceVal * 0.2)
            await connection.query(
              'INSERT INTO services (title, slug, short, description, benefits, duration, price, category, comingSoon, advance) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
              [s.title, s.slug, s.short, s.description, JSON.stringify(s.benefits), s.duration, s.price, s.category, s.comingSoon ? 1 : 0, advanceVal]
            )
          }
        }

        // Auto migration for gallery and blogs
        try {
          await connection.query(`ALTER TABLE gallery ADD COLUMN category VARCHAR(100)`)
        } catch (e) {}
        try {
          await connection.query(`ALTER TABLE gallery ADD COLUMN location VARCHAR(255)`)
        } catch (e) {}
        try {
          await connection.query(`ALTER TABLE gallery ADD COLUMN description TEXT`)
        } catch (e) {}
        try {
          await connection.query(`ALTER TABLE gallery ADD COLUMN badge VARCHAR(100)`)
        } catch (e) {}
        try {
          await connection.query(`ALTER TABLE blogs ADD COLUMN readTime VARCHAR(50)`)
        } catch (e) {}
        try {
          await connection.query(`ALTER TABLE blogs ADD COLUMN badge VARCHAR(100)`)
        } catch (e) {}
        try {
          await connection.query(`ALTER TABLE blogs ADD COLUMN keyTakeaways TEXT`)
        } catch (e) {}
        try {
          await connection.query(`ALTER TABLE blogs ADD COLUMN createdAt VARCHAR(255)`)
        } catch (e) {}

        // Clean up dummy test data in MySQL
        try {
          await connection.query(`DELETE FROM blogs WHERE title = 'Testing' OR slug = 'testing'`)
        } catch (e) {}
        try {
          await connection.query(`DELETE FROM gallery WHERE title LIKE '%Honey%' OR imageUrl LIKE '%Honey%' OR title = 'Testing'`)
        } catch (e) {}

        // Seed gallery if empty or single dummy
        const [galleryRows] = await connection.query('SELECT count(*) as count FROM gallery')
        if (galleryRows[0].count === 0 || galleryRows[0].count <= 1) {
          console.log('Inserting initial full gallery items into MySQL...')
          await connection.query('DELETE FROM gallery WHERE id > 0')
          for (const g of DEFAULT_MOCK_DATA.gallery) {
            await connection.query(
              'INSERT INTO gallery (id, imageUrl, title, category, location, description, badge, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
              [g.id, g.imageUrl, g.title, g.category || 'General', g.location || 'Hyderabad', g.description || '', g.badge || 'Verified Care', g.createdAt || new Date().toISOString()]
            )
          }
        }

        // Seed blogs if empty or single dummy
        const [blogsRows] = await connection.query('SELECT count(*) as count FROM blogs')
        if (blogsRows[0].count === 0 || blogsRows[0].count <= 1) {
          console.log('Inserting initial full clinical blogs into MySQL...')
          await connection.query('DELETE FROM blogs WHERE id > 0')
          for (const b of DEFAULT_MOCK_DATA.blogs) {
            await connection.query(
              'INSERT INTO blogs (id, title, slug, description, content, image, category, author, date, readTime, badge, keyTakeaways, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
              [b.id, b.title, b.slug, b.description, b.content, b.image, b.category, b.author, b.date, b.readTime || '5 min read', b.badge || 'Clinical Standard', JSON.stringify(b.keyTakeaways || []), new Date().toISOString()]
            )
          }
        }

        const [faqsRows] = await connection.query('SELECT count(*) as count FROM faqs')
        if (faqsRows[0].count === 0) {
          console.log('Inserting initial mock FAQs into MySQL...')
          for (const f of DEFAULT_MOCK_DATA.faqs) {
            await connection.query(
              'INSERT INTO faqs (question, answer, createdAt) VALUES (?, ?, ?)',
              [f.question, f.answer, new Date().toISOString()]
            )
          }
        }

        const [notificationsRows] = await connection.query('SELECT count(*) as count FROM notifications')
        if (notificationsRows[0].count === 0) {
          console.log('Inserting initial mock notifications into MySQL...')
          for (const n of DEFAULT_MOCK_DATA.notifications) {
            await connection.query(
              'INSERT INTO notifications (recipient, message, type, sentAt) VALUES (?, ?, ?, ?)',
              [n.recipient, n.message, n.type, n.sentAt]
            )
          }
        }

        const [mtpTasksRows] = await connection.query('SELECT count(*) as count FROM mtp_tasks')
        if (mtpTasksRows[0].count === 0) {
          console.log('Inserting initial MTP tasks into MySQL...')
          for (const t of DEFAULT_MOCK_DATA.mtpTasks) {
            await connection.query(
              'INSERT INTO mtp_tasks (icon, title, description, shiftType, earningEstimate, active, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
              [t.icon, t.title, t.description, t.shiftType, t.earningEstimate, t.active ? 1 : 0, new Date().toISOString()]
            )
          }
        }

        connection.release()
        useMySQL = true
        console.log(`✅ MySQL Tables verified and seeded successfully!`)
      } catch (err) {
        console.error(`❌ Failed to connect to MySQL database:`, err.message)
        console.warn(`⚠️ Warning: MySQL database offline. Falling back to JSON database.`)
        useMySQL = false
      }
    } else {
      console.warn(`⚠️ Warning: MySQL environment variables (DB_HOST, DB_USER, DB_NAME) are not defined. Falling back to JSON database.`)
      useMySQL = false
    }
  },

  // Enquiries Operations
  getEnquiries: async () => {
    if (useMySQL) {
      const [rows] = await pool.query('SELECT * FROM enquiries ORDER BY id DESC')
      return rows
    } else {
      const data = await readJSONDb()
      return [...data.enquiries].reverse()
    }
  },

  addEnquiry: async (enquiryData) => {
    const { name, phone, email = '', service = '', city = '', message = '' } = enquiryData
    const submittedAt = new Date().toISOString()
    if (useMySQL) {
      const [result] = await pool.query(
        'INSERT INTO enquiries (name, phone, email, service, city, message, submittedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [name, phone, email, service, city, message, submittedAt]
      )
      return { id: result.insertId, name, phone, email, service, city, message, submittedAt }
    } else {
      const data = await readJSONDb()
      const newEnquiry = {
        id: data.enquiries.length > 0 ? Math.max(...data.enquiries.map(e => e.id)) + 1 : 1,
        name,
        phone,
        email,
        service,
        city,
        message,
        submittedAt
      }
      data.enquiries.push(newEnquiry)
      await writeJSONDb(data)
      return newEnquiry
    }
  },

  deleteEnquiry: async (id) => {
    if (useMySQL) {
      await pool.query('DELETE FROM enquiries WHERE id = ?', [id])
      return true
    } else {
      const data = await readJSONDb()
      const initialLength = data.enquiries.length
      data.enquiries = data.enquiries.filter(e => e.id !== Number(id))
      await writeJSONDb(data)
      return data.enquiries.length < initialLength
    }
  },

  // Bookings Operations
  getBookings: async () => {
    if (useMySQL) {
      const [rows] = await pool.query('SELECT * FROM bookings ORDER BY id DESC')
      return rows
    } else {
      const data = await readJSONDb()
      return [...data.bookings].reverse()
    }
  },

  addBooking: async (bookingData) => {
    const { name, phone, service, date, time, duration, address, amount = 1200, paymentStatus = 'Unpaid', paymentMethod = '', transactionId = '', paymentDate = '', prescription = '', googleMapLocation = '', caretakerPayout, caretakerPayoutStatus = 'Unpaid', caretakerPayoutMethod = '', caretakerPayoutRef = '', advancePaid = 0, balanceAmount = 0 } = bookingData
    const createdAt = new Date().toISOString()
    if (useMySQL) {
      const [result] = await pool.query(
        'INSERT INTO bookings (name, phone, service, date, time, duration, address, amount, paymentStatus, paymentMethod, transactionId, paymentDate, prescription, googleMapLocation, advancePaid, balanceAmount, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [name, phone, service, date, time, duration, address, amount, paymentStatus, paymentMethod, transactionId, paymentDate, prescription, googleMapLocation, advancePaid, balanceAmount, createdAt]
      )
      return { id: result.insertId, name, phone, service, date, time, duration, address, status: 'Pending', assignedStaff: null, amount, paymentStatus, paymentMethod, transactionId, paymentDate, prescription, googleMapLocation, advancePaid, balanceAmount, createdAt }
    } else {
      const data = await readJSONDb()
      const newBooking = {
        id: data.bookings.length > 0 ? Math.max(...data.bookings.map(b => b.id)) + 1 : 1,
        name,
        phone,
        service,
        date,
        time,
        duration,
        address,
        status: 'Pending',
        assignedStaff: null,
        amount,
        caretakerPayout: Number(caretakerPayout) || 0,
        caretakerPayoutStatus,
        caretakerPayoutMethod,
        caretakerPayoutRef,
        paymentStatus,
        paymentMethod,
        transactionId,
        paymentDate,
        prescription,
        googleMapLocation,
        advancePaid: Number(advancePaid) || 0,
        balanceAmount: Number(balanceAmount) || 0,
        createdAt
      }
      data.bookings.push(newBooking)
      await writeJSONDb(data)
      return newBooking
    }
  },

  updateBooking: async (id, status, assignedStaff, paymentStatus) => {
    if (useMySQL) {
      const [result] = await pool.query(
        'UPDATE bookings SET status = ?, assignedStaff = ?, paymentStatus = ? WHERE id = ?',
        [status, assignedStaff, paymentStatus, id]
      )
      return result.affectedRows > 0
    } else {
      const data = await readJSONDb()
      const bookingIdx = data.bookings.findIndex(b => b.id === Number(id))
      if (bookingIdx > -1) {
        const oldBooking = data.bookings[bookingIdx]
        const now = new Date().toISOString()
        
        let confirmedAt = oldBooking.confirmedAt
        if ((status === 'Confirmed' || status === 'Active' || status === 'Completed') && !confirmedAt) {
          confirmedAt = now
        }
        
        let assignedAt = oldBooking.assignedAt
        if (assignedStaff && assignedStaff !== oldBooking.assignedStaff && !assignedAt) {
          assignedAt = now
        }
        
        let completedAt = oldBooking.completedAt
        if (status === 'Completed' && !completedAt) {
          completedAt = now
        }

        let cancelledAt = oldBooking.cancelledAt
        if (status === 'Cancelled' && !cancelledAt) {
          cancelledAt = now
        }

        data.bookings[bookingIdx] = {
          ...oldBooking,
          status,
          assignedStaff,
          paymentStatus,
          confirmedAt,
          assignedAt,
          completedAt,
          cancelledAt
        }
        await writeJSONDb(data)
        return true
      }
      return false
    }
  },

  payBookingBalance: async (id, paymentMethod, transactionId) => {
    const paymentDate = new Date().toISOString()
    if (useMySQL) {
      const [rows] = await pool.query('SELECT amount, advancePaid FROM bookings WHERE id = ?', [id])
      if (rows[0]) {
        await pool.query(
          'UPDATE bookings SET paymentStatus = "Paid", advancePaid = amount, balanceAmount = 0, paymentMethod = ?, transactionId = ?, paymentDate = ? WHERE id = ?',
          [paymentMethod, transactionId, paymentDate, id]
        )
        return true
      }
      return false
    } else {
      const data = await readJSONDb()
      const idx = data.bookings.findIndex(b => b.id === Number(id))
      if (idx > -1) {
        const b = data.bookings[idx]
        data.bookings[idx] = {
          ...b,
          paymentStatus: "Paid",
          advancePaid: b.amount,
          balanceAmount: 0,
          paymentMethod,
          transactionId,
          paymentDate
        }
        await writeJSONDb(data)
        return true
      }
      return false
    }
  },

  updateBookingDetails: async (id, details) => {
    const { patientName, patientAge, patientNeeds, address, googleMapLocation } = details
    if (useMySQL) {
      await pool.query(
        'UPDATE bookings SET patientName = ?, patientAge = ?, patientNeeds = ?, address = ?, googleMapLocation = ? WHERE id = ?',
        [patientName, patientAge, patientNeeds, address, googleMapLocation, id]
      )
      return true
    } else {
      const data = await readJSONDb()
      const idx = data.bookings.findIndex(b => b.id === Number(id))
      if (idx > -1) {
        data.bookings[idx] = {
          ...data.bookings[idx],
          patientName,
          patientAge,
          patientNeeds,
          address,
          googleMapLocation
        }
        await writeJSONDb(data)
        return true
      }
      return false
    }
  },

  // Caregivers Operations
  getCaregivers: async () => {
    if (useMySQL) {
      const [rows] = await pool.query('SELECT * FROM caregivers ORDER BY id DESC')
      return rows.map(r => ({
        ...r,
        uniqueId: `AMMASEVA-${String(r.id).padStart(4, '0')}`
      }))
    } else {
      const data = await readJSONDb()
      return [...data.caregivers].reverse().map(r => ({
        ...r,
        uniqueId: `AMMASEVA-${String(r.id).padStart(4, '0')}`
      }))
    }
  },

  addCaregiver: async (caregiverData) => {
    const { name, phone, email, specialty, experience } = caregiverData
    const joinedAt = new Date().toISOString()
    if (useMySQL) {
      const [result] = await pool.query(
        'INSERT INTO caregivers (name, phone, email, specialty, experience, joinedAt) VALUES (?, ?, ?, ?, ?, ?)',
        [name, phone, email, specialty, experience, joinedAt]
      )
      return { id: result.insertId, name, phone, email, specialty, experience, status: 'Pending', joinedAt }
    } else {
      const data = await readJSONDb()
      const newCaregiver = {
        id: data.caregivers.length > 0 ? Math.max(...data.caregivers.map(c => c.id)) + 1 : 1,
        name,
        phone,
        email,
        specialty,
        experience,
        status: 'Pending',
        joinedAt
      }
      data.caregivers.push(newCaregiver)
      await writeJSONDb(data)
      return newCaregiver
    }
  },

  updateCaregiverStatus: async (id, status) => {
    if (useMySQL) {
      const [result] = await pool.query(
        'UPDATE caregivers SET status = ? WHERE id = ?',
        [status, id]
      )
      return result.affectedRows > 0
    } else {
      const data = await readJSONDb()
      const caregiverIdx = data.caregivers.findIndex(c => c.id === Number(id))
      if (caregiverIdx > -1) {
        data.caregivers[caregiverIdx].status = status
        await writeJSONDb(data)
        return true
      }
      return false
    }
  },

  // Users Auth & Management
  addUser: async (userData) => {
    const { name, email, phone, password } = userData
    const createdAt = new Date().toISOString()
    const hashedPassword = await bcrypt.hash(password, 10)
    if (useMySQL) {
      const [result] = await pool.query(
        'INSERT INTO users (name, email, phone, password, createdAt) VALUES (?, ?, ?, ?, ?)',
        [name, email.toLowerCase().trim(), phone, hashedPassword, createdAt]
      )
      return { id: result.insertId, name, email, phone, createdAt }
    } else {
      const data = await readJSONDb()
      if (!data.users) data.users = []
      const newUser = {
        id: data.users.length > 0 ? Math.max(...data.users.map(u => u.id)) + 1 : 1,
        name,
        email: email.toLowerCase().trim(),
        phone,
        password: hashedPassword,
        createdAt
      }
      data.users.push(newUser)
      await writeJSONDb(data)
      return newUser
    }
  },

  getUserById: async (id) => {
    if (useMySQL) {
      const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id])
      return rows[0] || null
    } else {
      const data = await readJSONDb()
      if (!data.users) data.users = []
      return data.users.find(u => u.id === Number(id)) || null
    }
  },

  getUserByEmail: async (email) => {
    const normalized = email.toLowerCase().trim()
    if (useMySQL) {
      const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [normalized])
      return rows[0] || null
    } else {
      const data = await readJSONDb()
      if (!data.users) data.users = []
      return data.users.find(u => u.email === normalized) || null
    }
  },

  getCaregiverByEmail: async (email) => {
    const normalized = email.toLowerCase().trim()
    if (useMySQL) {
      const [rows] = await pool.query('SELECT * FROM caregivers WHERE email = ?', [normalized])
      return rows[0] || null
    } else {
      const data = await readJSONDb()
      return data.caregivers.find(c => c.email && c.email.toLowerCase().trim() === normalized) || null
    }
  },

  getCaregiverById: async (id) => {
    if (useMySQL) {
      const [rows] = await pool.query('SELECT * FROM caregivers WHERE id = ?', [id])
      return rows[0] ? { ...rows[0], uniqueId: `AMMASEVA-${String(rows[0].id).padStart(4, '0')}` } : null
    } else {
      const data = await readJSONDb()
      const c = data.caregivers.find(c => c.id === Number(id))
      return c ? { ...c, uniqueId: `AMMASEVA-${String(c.id).padStart(4, '0')}` } : null
    }
  },

  getCaregiverByName: async (name) => {
    const trimmed = name.trim()
    if (useMySQL) {
      const [rows] = await pool.query('SELECT * FROM caregivers WHERE name = ?', [trimmed])
      return rows[0] || null
    } else {
      const data = await readJSONDb()
      return data.caregivers.find(c => c.name && c.name.trim() === trimmed) || null
    }
  },

  updateCaregiverProfile: async (id, profileData) => {
    const { 
      name, phone, specialty, experience, 
      aadhaar, pan, certificates, profilePhoto, 
      experienceDetails, workingLocations, availableTimings,
      state, city, googleMapLocation,
      experienceCertificate, policeVerification, additionalCertificates
    } = profileData
    if (useMySQL) {
      const [result] = await pool.query(
        `UPDATE caregivers SET 
          name = COALESCE(?, name), 
          phone = COALESCE(?, phone), 
          specialty = COALESCE(?, specialty), 
          experience = COALESCE(?, experience), 
          aadhaar = COALESCE(?, aadhaar), 
          pan = COALESCE(?, pan), 
          certificates = COALESCE(?, certificates), 
          profilePhoto = COALESCE(?, profilePhoto), 
          experienceDetails = COALESCE(?, experienceDetails), 
          workingLocations = COALESCE(?, workingLocations), 
          availableTimings = COALESCE(?, availableTimings),
          state = COALESCE(?, state),
          city = COALESCE(?, city),
          googleMapLocation = COALESCE(?, googleMapLocation),
          experienceCertificate = COALESCE(?, experienceCertificate),
          policeVerification = COALESCE(?, policeVerification),
          additionalCertificates = COALESCE(?, additionalCertificates)
        WHERE id = ?`,
        [
          name !== undefined ? name : null, 
          phone !== undefined ? phone : null, 
          specialty !== undefined ? specialty : null, 
          experience !== undefined ? Number(experience) : null, 
          aadhaar !== undefined ? aadhaar : null, 
          pan !== undefined ? pan : null, 
          certificates !== undefined ? certificates : null, 
          profilePhoto !== undefined ? profilePhoto : null, 
          experienceDetails !== undefined ? experienceDetails : null, 
          workingLocations !== undefined ? workingLocations : null, 
          availableTimings !== undefined ? availableTimings : null, 
          state !== undefined ? state : null,
          city !== undefined ? city : null,
          googleMapLocation !== undefined ? googleMapLocation : null,
          experienceCertificate !== undefined ? experienceCertificate : null,
          policeVerification !== undefined ? policeVerification : null,
          additionalCertificates !== undefined ? additionalCertificates : null,
          id
        ]
      )
      return result.affectedRows > 0
    } else {
      const data = await readJSONDb()
      const idx = data.caregivers.findIndex(c => c.id === Number(id))
      if (idx > -1) {
        data.caregivers[idx] = {
          ...data.caregivers[idx],
          name: name !== undefined ? name : data.caregivers[idx].name,
          phone: phone !== undefined ? phone : data.caregivers[idx].phone,
          specialty: specialty !== undefined ? specialty : data.caregivers[idx].specialty,
          experience: experience !== undefined ? Number(experience) : data.caregivers[idx].experience,
          aadhaar: aadhaar !== undefined ? aadhaar : data.caregivers[idx].aadhaar,
          pan: pan !== undefined ? pan : data.caregivers[idx].pan,
          certificates: certificates !== undefined ? certificates : data.caregivers[idx].certificates,
          profilePhoto: profilePhoto !== undefined ? profilePhoto : data.caregivers[idx].profilePhoto,
          experienceDetails: experienceDetails !== undefined ? experienceDetails : data.caregivers[idx].experienceDetails,
          workingLocations: workingLocations !== undefined ? workingLocations : data.caregivers[idx].workingLocations,
          availableTimings: availableTimings !== undefined ? availableTimings : data.caregivers[idx].availableTimings,
          state: state !== undefined ? state : data.caregivers[idx].state,
          city: city !== undefined ? city : data.caregivers[idx].city,
          googleMapLocation: googleMapLocation !== undefined ? googleMapLocation : data.caregivers[idx].googleMapLocation,
          experienceCertificate: experienceCertificate !== undefined ? experienceCertificate : data.caregivers[idx].experienceCertificate,
          policeVerification: policeVerification !== undefined ? policeVerification : data.caregivers[idx].policeVerification,
          additionalCertificates: additionalCertificates !== undefined ? additionalCertificates : data.caregivers[idx].additionalCertificates
        }
        await writeJSONDb(data)
        return true
      }
      return false
    }
  },

  updateUserPassword: async (id, hashedPassword) => {
    if (useMySQL) {
      await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, id])
    } else {
      const data = await readJSONDb()
      const idx = data.users.findIndex(u => u.id === Number(id))
      if (idx > -1) {
        data.users[idx].password = hashedPassword
        await writeJSONDb(data)
      }
    }
  },

  updateCaregiverPassword: async (id, hashedPassword) => {
    if (useMySQL) {
      await pool.query('UPDATE caregivers SET password = ? WHERE id = ?', [hashedPassword, id])
    } else {
      const data = await readJSONDb()
      const idx = data.caregivers.findIndex(c => c.id === Number(id))
      if (idx > -1) {
        data.caregivers[idx].password = hashedPassword
        await writeJSONDb(data)
      }
    }
  },

  addCaregiverWithPassword: async (caregiverData) => {
    const { 
      name, phone, email, specialty, experience, 
      aadhaar = '', pan = '', certificates = '', profilePhoto = '', 
      experienceDetails = '', workingLocations = '', availableTimings = '',
      state = '', city = '', googleMapLocation = '',
      experienceCertificate = '', policeVerification = '', additionalCertificates = ''
    } = caregiverData
    const joinedAt = new Date().toISOString()
    const dummyPassword = ''
    if (useMySQL) {
      const [result] = await pool.query(
        'INSERT INTO caregivers (name, phone, email, specialty, experience, password, joinedAt, aadhaar, pan, certificates, profilePhoto, experienceDetails, workingLocations, availableTimings, state, city, googleMapLocation, experienceCertificate, policeVerification, additionalCertificates) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [name, phone, email, specialty, experience, dummyPassword, joinedAt, aadhaar, pan, certificates, profilePhoto, experienceDetails, workingLocations, availableTimings, state, city, googleMapLocation, experienceCertificate, policeVerification, additionalCertificates]
      )
      return { id: result.insertId, name, phone, email, specialty, experience, status: 'Pending', joinedAt, state, city, googleMapLocation, experienceCertificate, policeVerification, additionalCertificates }
    } else {
      const data = await readJSONDb()
      const newCaregiver = {
        id: data.caregivers.length > 0 ? Math.max(...data.caregivers.map(c => c.id)) + 1 : 1,
        name,
        phone,
        email,
        specialty,
        experience,
        password: dummyPassword,
        status: 'Pending',
        joinedAt,
        aadhaar,
        pan,
        certificates,
        profilePhoto,
        experienceDetails,
        workingLocations,
        availableTimings,
        state,
        city,
        googleMapLocation,
        experienceCertificate,
        policeVerification,
        additionalCertificates
      }
      data.caregivers.push(newCaregiver)
      await writeJSONDb(data)
      return newCaregiver
    }
  },

  // User Bookings Operations
  addBookingForUser: async (bookingData) => {
    const { name, phone, service, date, time, duration, address, amount = 1200, userId = null, patientName = '', patientAge = '', patientNeeds = '', prescription = '', googleMapLocation = '', paymentStatus = 'Unpaid', paymentMethod = '', transactionId = '', paymentDate = '', advancePaid = 0, balanceAmount = 0 } = bookingData
    const createdAt = new Date().toISOString()
    if (useMySQL) {
      const [result] = await pool.query(
        'INSERT INTO bookings (name, phone, service, date, time, duration, address, amount, userId, createdAt, patientName, patientAge, patientNeeds, prescription, googleMapLocation, paymentStatus, paymentMethod, transactionId, paymentDate, advancePaid, balanceAmount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [name, phone, service, date, time, duration, address, amount, userId, createdAt, patientName, patientAge, patientNeeds, prescription, googleMapLocation, paymentStatus, paymentMethod, transactionId, paymentDate, advancePaid, balanceAmount]
      )
      return { id: result.insertId, name, phone, service, date, time, duration, address, status: 'Pending', assignedStaff: null, amount, paymentStatus, userId, createdAt, patientName, patientAge, patientNeeds, prescription, googleMapLocation, paymentMethod, transactionId, paymentDate, advancePaid, balanceAmount }
    } else {
      const data = await readJSONDb()
      const newBooking = {
        id: data.bookings.length > 0 ? Math.max(...data.bookings.map(b => b.id)) + 1 : 1,
        name,
        phone,
        service,
        date,
        time,
        duration,
        address,
        status: 'Pending',
        assignedStaff: null,
        amount,
        paymentStatus,
        paymentMethod,
        transactionId,
        paymentDate,
        userId: userId ? Number(userId) : null,
        patientName,
        patientAge,
        patientNeeds,
        prescription,
        googleMapLocation,
        advancePaid: Number(advancePaid) || 0,
        balanceAmount: Number(balanceAmount) || 0,
        createdAt
      }
      data.bookings.push(newBooking)
      await writeJSONDb(data)
      return newBooking
    }
  },

  getBookingById: async (id) => {
    if (useMySQL) {
      const [rows] = await pool.query('SELECT * FROM bookings WHERE id = ?', [id])
      return rows[0] || null
    } else {
      const data = await readJSONDb()
      return data.bookings.find(b => b.id === Number(id)) || null
    }
  },

  getBookingsByUserId: async (userId) => {
    if (useMySQL) {
      const [rows] = await pool.query('SELECT * FROM bookings WHERE userId = ? ORDER BY id DESC', [userId])
      return rows
    } else {
      const data = await readJSONDb()
      return data.bookings.filter(b => b.userId === Number(userId)).reverse()
    }
  },

  getBookingsByAssignedStaff: async (staffName) => {
    if (useMySQL) {
      const [rows] = await pool.query('SELECT * FROM bookings WHERE assignedStaff = ? ORDER BY id DESC', [staffName])
      return rows
    } else {
      const data = await readJSONDb()
      return data.bookings.filter(b => b.assignedStaff === staffName).reverse()
    }
  },

  rescheduleBooking: async (id, date, time) => {
    if (useMySQL) {
      const [result] = await pool.query('UPDATE bookings SET date = ?, time = ? WHERE id = ?', [date, time, id])
      return result.affectedRows > 0
    } else {
      const data = await readJSONDb()
      const idx = data.bookings.findIndex(b => b.id === Number(id))
      if (idx > -1) {
        data.bookings[idx].date = date
        data.bookings[idx].time = time
        await writeJSONDb(data)
        return true
      }
      return false
    }
  },

  cancelBooking: async (id) => {
    if (useMySQL) {
      const [result] = await pool.query("UPDATE bookings SET status = 'Cancelled' WHERE id = ?", [id])
      return result.affectedRows > 0
    } else {
      const data = await readJSONDb()
      const idx = data.bookings.findIndex(b => b.id === Number(id))
      if (idx > -1) {
        data.bookings[idx].status = 'Cancelled'
        await writeJSONDb(data)
        return true
      }
      return false
    }
  },

  // Admin CRUD operations: Users
  getUsers: async () => {
    if (useMySQL) {
      const [rows] = await pool.query('SELECT id, name, email, phone, createdAt FROM users ORDER BY id DESC')
      return rows
    } else {
      const data = await readJSONDb()
      if (!data.users) data.users = []
      return data.users.map(({ password, ...u }) => u).reverse()
    }
  },

  deleteUser: async (id) => {
    if (useMySQL) {
      const [result] = await pool.query('DELETE FROM users WHERE id = ?', [id])
      return result.affectedRows > 0
    } else {
      const data = await readJSONDb()
      const initialLength = data.users.length
      data.users = data.users.filter(u => u.id !== Number(id))
      await writeJSONDb(data)
      return data.users.length < initialLength
    }
  },

  // Admin CRUD operations: Bookings (Full Edit & Delete)
  adminUpdateBooking: async (id, bookingData) => {
    const { name, phone, service, date, time, duration, address, status, assignedStaff, amount, paymentStatus, paymentMethod = '', transactionId = '', paymentDate = '', caretakerPayout, caretakerPayoutStatus, caretakerPayoutMethod, caretakerPayoutRef } = bookingData
    if (useMySQL) {
      const [result] = await pool.query(
        'UPDATE bookings SET name = ?, phone = ?, service = ?, date = ?, time = ?, duration = ?, address = ?, status = ?, assignedStaff = ?, amount = ?, paymentStatus = ?, paymentMethod = ?, transactionId = ?, paymentDate = ? WHERE id = ?',
        [name, phone, service, date, time, duration, address, status, assignedStaff || null, amount, paymentStatus, paymentMethod, transactionId, paymentDate, id]
      )
      return result.affectedRows > 0
    } else {
      const data = await readJSONDb()
      const idx = data.bookings.findIndex(b => b.id === Number(id))
      if (idx > -1) {
        data.bookings[idx] = {
          ...data.bookings[idx],
          name,
          phone,
          service,
          date,
          time,
          duration,
          address,
          status,
          assignedStaff: assignedStaff || null,
          amount: Number(amount),
          caretakerPayout: caretakerPayout !== undefined ? Number(caretakerPayout) : (data.bookings[idx].caretakerPayout || 0),
          caretakerPayoutStatus: caretakerPayoutStatus !== undefined ? caretakerPayoutStatus : (data.bookings[idx].caretakerPayoutStatus || 'Unpaid'),
          caretakerPayoutMethod: caretakerPayoutMethod !== undefined ? caretakerPayoutMethod : (data.bookings[idx].caretakerPayoutMethod || ''),
          caretakerPayoutRef: caretakerPayoutRef !== undefined ? caretakerPayoutRef : (data.bookings[idx].caretakerPayoutRef || ''),
          paymentStatus,
          paymentMethod,
          transactionId,
          paymentDate
        }
        await writeJSONDb(data)
        return true
      }
      return false
    }
  },

  deleteBooking: async (id) => {
    if (useMySQL) {
      const [result] = await pool.query('DELETE FROM bookings WHERE id = ?', [id])
      return result.affectedRows > 0
    } else {
      const data = await readJSONDb()
      const initialLength = data.bookings.length
      data.bookings = data.bookings.filter(b => b.id !== Number(id))
      await writeJSONDb(data)
      return data.bookings.length < initialLength
    }
  },

  // Admin CRUD operations: Caregivers (Full Edit & Delete)
  adminUpdateCaregiver: async (id, caregiverData) => {
    const { 
      name, phone, email, specialty, experience, status, 
      aadhaar, pan, certificates, profilePhoto, 
      experienceDetails, workingLocations, availableTimings,
      state, city, googleMapLocation,
      experienceCertificate, policeVerification, additionalCertificates
    } = caregiverData
    if (useMySQL) {
      const [result] = await pool.query(
        'UPDATE caregivers SET name = ?, phone = ?, email = ?, specialty = ?, experience = ?, status = ?, aadhaar = COALESCE(?, aadhaar), pan = COALESCE(?, pan), certificates = COALESCE(?, certificates), profilePhoto = COALESCE(?, profilePhoto), experienceDetails = COALESCE(?, experienceDetails), workingLocations = COALESCE(?, workingLocations), availableTimings = COALESCE(?, availableTimings), state = COALESCE(?, state), city = COALESCE(?, city), googleMapLocation = COALESCE(?, googleMapLocation), experienceCertificate = COALESCE(?, experienceCertificate), policeVerification = COALESCE(?, policeVerification), additionalCertificates = COALESCE(?, additionalCertificates) WHERE id = ?',
        [name, phone, email, specialty, experience, status, aadhaar, pan, certificates, profilePhoto, experienceDetails, workingLocations, availableTimings, state !== undefined ? state : null, city !== undefined ? city : null, googleMapLocation !== undefined ? googleMapLocation : null, experienceCertificate !== undefined ? experienceCertificate : null, policeVerification !== undefined ? policeVerification : null, additionalCertificates !== undefined ? additionalCertificates : null, id]
      )
      return result.affectedRows > 0
    } else {
      const data = await readJSONDb()
      const idx = data.caregivers.findIndex(c => c.id === Number(id))
      if (idx > -1) {
        data.caregivers[idx] = {
          ...data.caregivers[idx],
          name,
          phone,
          email,
          specialty,
          experience: Number(experience),
          status,
          aadhaar: aadhaar !== undefined ? aadhaar : data.caregivers[idx].aadhaar,
          pan: pan !== undefined ? pan : data.caregivers[idx].pan,
          certificates: certificates !== undefined ? certificates : data.caregivers[idx].certificates,
          profilePhoto: profilePhoto !== undefined ? profilePhoto : data.caregivers[idx].profilePhoto,
          experienceDetails: experienceDetails !== undefined ? experienceDetails : data.caregivers[idx].experienceDetails,
          workingLocations: workingLocations !== undefined ? workingLocations : data.caregivers[idx].workingLocations,
          availableTimings: availableTimings !== undefined ? availableTimings : data.caregivers[idx].availableTimings,
          state: state !== undefined ? state : data.caregivers[idx].state,
          city: city !== undefined ? city : data.caregivers[idx].city,
          googleMapLocation: googleMapLocation !== undefined ? googleMapLocation : data.caregivers[idx].googleMapLocation,
          experienceCertificate: experienceCertificate !== undefined ? experienceCertificate : data.caregivers[idx].experienceCertificate,
          policeVerification: policeVerification !== undefined ? policeVerification : data.caregivers[idx].policeVerification,
          additionalCertificates: additionalCertificates !== undefined ? additionalCertificates : data.caregivers[idx].additionalCertificates
        }
        await writeJSONDb(data)
        return true
      }
      return false
    }
  },

  deleteCaregiver: async (id) => {
    if (useMySQL) {
      const [result] = await pool.query('DELETE FROM caregivers WHERE id = ?', [id])
      return result.affectedRows > 0
    } else {
      const data = await readJSONDb()
      const initialLength = data.caregivers.length
      data.caregivers = data.caregivers.filter(c => c.id !== Number(id))
      await writeJSONDb(data)
      return data.caregivers.length < initialLength
    }
  },

  // Persistent OTP methods
  saveOTP: async (email, otp, role, expiresAt) => {
    if (useMySQL) {
      await pool.query(
        'INSERT INTO otp_verifications (email, otp, role, expiresAt) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE otp = ?, role = ?, expiresAt = ?',
        [email, otp, role, expiresAt, otp, role, expiresAt]
      )
    } else {
      const data = await readJSONDb()
      if (!data.otps) data.otps = []
      const idx = data.otps.findIndex(o => o.email === email)
      const otpObj = { email, otp, role, expiresAt }
      if (idx > -1) {
        data.otps[idx] = otpObj
      } else {
        data.otps.push(otpObj)
      }
      await writeJSONDb(data)
    }
  },

  getOTP: async (email) => {
    if (useMySQL) {
      const [rows] = await pool.query('SELECT * FROM otp_verifications WHERE email = ?', [email])
      return rows[0] || null
    } else {
      const data = await readJSONDb()
      if (!data.otps) return null
      return data.otps.find(o => o.email === email) || null
    }
  },

  deleteOTP: async (email) => {
    if (useMySQL) {
      await pool.query('DELETE FROM otp_verifications WHERE email = ?', [email])
    } else {
      const data = await readJSONDb()
      if (data.otps) {
        data.otps = data.otps.filter(o => o.email !== email)
        await writeJSONDb(data)
      }
    }
  },

  // Admin CRUD operations: Services
  getServices: async () => {
    if (useMySQL) {
      const [rows] = await pool.query('SELECT * FROM services ORDER BY id DESC')
      return rows.map(row => ({
        ...row,
        benefits: row.benefits ? JSON.parse(row.benefits) : [],
        highlights: row.highlights ? JSON.parse(row.highlights) : [],
        images: row.images ? JSON.parse(row.images) : [],
        comingSoon: !!row.comingSoon
      }))
    } else {
      const data = await readJSONDb()
      if (!data.services) data.services = []
      return [...data.services].reverse()
    }
  },

  addService: async (serviceData) => {
    const { 
      title, slug, short, description, benefits, duration, price, category, 
      comingSoon = false, image = '', about = '', highlights = [], images = [],
      advance = 0
    } = serviceData
    const benefitsStr = Array.isArray(benefits) ? JSON.stringify(benefits) : JSON.stringify([])
    const highlightsStr = Array.isArray(highlights) ? JSON.stringify(highlights) : JSON.stringify([])
    const imagesStr = Array.isArray(images) ? JSON.stringify(images) : JSON.stringify([])
    const comingSoonVal = comingSoon ? 1 : 0
    if (useMySQL) {
      const [result] = await pool.query(
        'INSERT INTO services (title, slug, short, description, benefits, duration, price, category, comingSoon, image, about, highlights, images, advance) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [title, slug, short, description, benefitsStr, duration, price, category, comingSoonVal, image, about, highlightsStr, imagesStr, advance]
      )
      return { id: result.insertId, title, slug, short, description, benefits, duration, price, category, comingSoon, image, about, highlights, images, advance }
    } else {
      const data = await readJSONDb()
      if (!data.services) data.services = []
      const newService = {
        id: data.services.length > 0 ? Math.max(...data.services.map(s => s.id)) + 1 : 1,
        title,
        slug,
        short,
        description,
        benefits: Array.isArray(benefits) ? benefits : [],
        duration,
        price,
        category,
        comingSoon: !!comingSoon,
        advance: Number(advance) || 0,
        image,
        about,
        highlights: Array.isArray(highlights) ? highlights : [],
        images: Array.isArray(images) ? images : []
      }
      data.services.push(newService)
      await writeJSONDb(data)
      return newService
    }
  },

  updateService: async (id, serviceData) => {
    const { 
      title, slug, short, description, benefits, duration, price, category, 
      comingSoon = false, image, about, highlights, images, advance 
    } = serviceData
    const benefitsStr = Array.isArray(benefits) ? JSON.stringify(benefits) : JSON.stringify([])
    const highlightsStr = Array.isArray(highlights) ? JSON.stringify(highlights) : JSON.stringify([])
    const imagesStr = Array.isArray(images) ? JSON.stringify(images) : JSON.stringify([])
    const comingSoonVal = comingSoon ? 1 : 0
    if (useMySQL) {
      const [result] = await pool.query(
        'UPDATE services SET title = ?, slug = ?, short = ?, description = ?, benefits = ?, duration = ?, price = ?, category = ?, comingSoon = ?, image = COALESCE(?, image), about = ?, highlights = ?, images = ?, advance = COALESCE(?, advance) WHERE id = ?',
        [title, slug, short, description, benefitsStr, duration, price, category, comingSoonVal, image !== undefined ? image : null, about, highlightsStr, imagesStr, advance !== undefined ? Number(advance) : null, id]
      )
      return result.affectedRows > 0
    } else {
      const data = await readJSONDb()
      const idx = data.services.findIndex(s => s.id === Number(id))
      if (idx > -1) {
        data.services[idx] = {
          ...data.services[idx],
          title,
          slug,
          short,
          description,
          benefits: Array.isArray(benefits) ? benefits : [],
          duration,
          price,
          category,
          comingSoon: !!comingSoon,
          advance: advance !== undefined ? Number(advance) : data.services[idx].advance,
          image: image !== undefined ? image : data.services[idx].image,
          about: about !== undefined ? about : (data.services[idx].about || ''),
          highlights: Array.isArray(highlights) ? highlights : (data.services[idx].highlights || []),
          images: Array.isArray(images) ? images : (data.services[idx].images || [])
        }
        await writeJSONDb(data)
        return true
      }
      return false
    }
  },

  deleteService: async (id) => {
    if (useMySQL) {
      const [result] = await pool.query('DELETE FROM services WHERE id = ?', [id])
      return result.affectedRows > 0
    } else {
      const data = await readJSONDb()
      const initialLength = data.services.length
      data.services = data.services.filter(s => s.id !== Number(id))
      await writeJSONDb(data)
      return data.services.length < initialLength
    }
  },

  // Admin CRUD operations: Notifications
  getNotifications: async () => {
    if (useMySQL) {
      const [rows] = await pool.query('SELECT * FROM notifications ORDER BY id DESC')
      return rows
    } else {
      const data = await readJSONDb()
      if (!data.notifications) data.notifications = []
      return [...data.notifications].reverse()
    }
  },

  addNotification: async (notificationData) => {
    const { recipient, message, type } = notificationData
    const sentAt = new Date().toISOString()
    if (useMySQL) {
      const [result] = await pool.query(
        'INSERT INTO notifications (recipient, message, type, sentAt) VALUES (?, ?, ?, ?)',
        [recipient, message, type, sentAt]
      )
      return { id: result.insertId, recipient, message, type, sentAt }
    } else {
      const data = await readJSONDb()
      if (!data.notifications) data.notifications = []
      const newNotification = {
        id: data.notifications.length > 0 ? Math.max(...data.notifications.map(n => n.id)) + 1 : 1,
        recipient,
        message,
        type,
        sentAt
      }
      data.notifications.push(newNotification)
      await writeJSONDb(data)
      return newNotification
    }
  },

  updateBookingStatus: async (id, status) => {
    if (useMySQL) {
      const [result] = await pool.query('UPDATE bookings SET status = ? WHERE id = ?', [status, id])
      return result.affectedRows > 0
    } else {
      const data = await readJSONDb()
      const idx = data.bookings.findIndex(b => b.id === Number(id))
      if (idx > -1) {
        const oldBooking = data.bookings[idx]
        const now = new Date().toISOString()
        
        let confirmedAt = oldBooking.confirmedAt
        if ((status === 'Confirmed' || status === 'Active' || status === 'Completed') && !confirmedAt) {
          confirmedAt = now
        }
        
        let completedAt = oldBooking.completedAt
        if (status === 'Completed' && !completedAt) {
          completedAt = now
        }

        let cancelledAt = oldBooking.cancelledAt
        if (status === 'Cancelled' && !cancelledAt) {
          cancelledAt = now
        }

        data.bookings[idx] = {
          ...oldBooking,
          status,
          confirmedAt,
          completedAt,
          cancelledAt
        }
        await writeJSONDb(data)
        return true
      }
      return false
    }
  },

  updateBookingVitalsAndLogs: async (id, vitals, careLogs) => {
    const vitalsStr = typeof vitals === 'object' ? JSON.stringify(vitals) : vitals
    const careLogsStr = typeof careLogs === 'object' ? JSON.stringify(careLogs) : careLogs
    if (useMySQL) {
      const [result] = await pool.query(
        'UPDATE bookings SET vitals = ?, careLogs = ? WHERE id = ?',
        [vitalsStr, careLogsStr, id]
      )
      return result.affectedRows > 0
    } else {
      const data = await readJSONDb()
      const idx = data.bookings.findIndex(b => b.id === Number(id))
      if (idx > -1) {
        data.bookings[idx].vitals = vitalsStr
        data.bookings[idx].careLogs = careLogsStr
        await writeJSONDb(data)
        return true
      }
      return false
    }
  },

  addReview: async (reviewData) => {
    const { bookingId, caregiverName, rating, comment } = reviewData
    const createdAt = new Date().toISOString()
    if (useMySQL) {
      const [result] = await pool.query(
        'INSERT INTO reviews (bookingId, caregiverName, rating, comment, createdAt) VALUES (?, ?, ?, ?, ?)',
        [bookingId, caregiverName, rating, comment, createdAt]
      )
      return { id: result.insertId, bookingId, caregiverName, rating, comment, createdAt }
    } else {
      const data = await readJSONDb()
      if (!data.reviews) data.reviews = []
      data.reviews = data.reviews.filter(r => r.bookingId !== Number(bookingId))
      const newReview = {
        id: data.reviews.length > 0 ? Math.max(...data.reviews.map(r => r.id)) + 1 : 1,
        bookingId: Number(bookingId),
        caregiverName,
        rating: Number(rating),
        comment,
        createdAt
      }
      data.reviews.push(newReview)
      await writeJSONDb(data)
      return newReview
    }
  },

  getReviewsForCaregiver: async (caregiverName) => {
    if (useMySQL) {
      const [rows] = await pool.query('SELECT * FROM reviews WHERE caregiverName = ? ORDER BY id DESC', [caregiverName])
      return rows
    } else {
      const data = await readJSONDb()
      if (!data.reviews) data.reviews = []
      return data.reviews.filter(r => r.caregiverName === caregiverName).reverse()
    }
  },

  getReviewByBookingId: async (bookingId) => {
    if (useMySQL) {
      const [rows] = await pool.query('SELECT * FROM reviews WHERE bookingId = ?', [bookingId])
      return rows[0] || null
    } else {
      const data = await readJSONDb()
      if (!data.reviews) data.reviews = []
      return data.reviews.find(r => r.bookingId === Number(bookingId)) || null
    }
  },

  getAnnouncements: async (target) => {
    if (useMySQL) {
      const [rows] = await pool.query('SELECT * FROM announcements WHERE target = ? OR target = "All" ORDER BY id DESC', [target])
      return rows
    } else {
      const data = await readJSONDb()
      if (!data.announcements) data.announcements = []
      return data.announcements.filter(a => a.target === target || a.target === 'All').reverse()
    }
  },

  addAnnouncement: async (message, target) => {
    const createdAt = new Date().toISOString()
    if (useMySQL) {
      const [result] = await pool.query(
        'INSERT INTO announcements (message, target, createdAt) VALUES (?, ?, ?)',
        [message, target, createdAt]
      )
      return { id: result.insertId, message, target, createdAt }
    } else {
      const data = await readJSONDb()
      if (!data.announcements) data.announcements = []
      const newAnn = {
        id: data.announcements.length > 0 ? Math.max(...data.announcements.map(a => a.id)) + 1 : 1,
        message,
        target,
        createdAt
      }
      data.announcements.push(newAnn)
      await writeJSONDb(data)
      return newAnn
    }
  },

  getBlogs: async () => {
    if (useMySQL) {
      const [rows] = await pool.query('SELECT * FROM blogs ORDER BY id DESC')
      return rows
    } else {
      const data = await readJSONDb()
      if (!data.blogs) data.blogs = []
      return data.blogs.slice().reverse()
    }
  },

  addBlog: async (blog) => {
    const date = blog.date || new Date().toISOString().split('T')[0]
    const author = blog.author || 'Amma Seva Care Team'
    if (useMySQL) {
      const [result] = await pool.query(
        'INSERT INTO blogs (title, slug, description, content, image, category, author, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [blog.title, blog.slug, blog.description, blog.content, blog.image, blog.category, author, date]
      )
      return { id: result.insertId, ...blog, author, date }
    } else {
      const data = await readJSONDb()
      if (!data.blogs) data.blogs = []
      const newBlog = {
        id: data.blogs.length > 0 ? Math.max(...data.blogs.map(b => b.id)) + 1 : 1,
        ...blog,
        author,
        date
      }
      data.blogs.push(newBlog)
      await writeJSONDb(data)
      return newBlog
    }
  },

  updateBlog: async (id, blog) => {
    const date = blog.date || new Date().toISOString().split('T')[0]
    if (useMySQL) {
      await pool.query(
        'UPDATE blogs SET title = ?, slug = ?, description = ?, content = ?, image = ?, category = ?, author = ?, date = ? WHERE id = ?',
        [blog.title, blog.slug, blog.description, blog.content, blog.image, blog.category, blog.author, date, Number(id)]
      )
      return { id: Number(id), ...blog, date }
    } else {
      const data = await readJSONDb()
      if (!data.blogs) data.blogs = []
      const idx = data.blogs.findIndex(b => b.id === Number(id))
      if (idx !== -1) {
        data.blogs[idx] = { ...data.blogs[idx], ...blog, date }
        await writeJSONDb(data)
        return data.blogs[idx]
      }
      return null
    }
  },

  deleteBlog: async (id) => {
    if (useMySQL) {
      await pool.query('DELETE FROM blogs WHERE id = ?', [Number(id)])
      return true
    } else {
      const data = await readJSONDb()
      if (!data.blogs) data.blogs = []
      const filtered = data.blogs.filter(b => b.id !== Number(id))
      data.blogs = filtered
      await writeJSONDb(data)
      return true
    }
  },

  getFaqs: async () => {
    if (useMySQL) {
      const [rows] = await pool.query('SELECT * FROM faqs ORDER BY id DESC')
      return rows
    } else {
      const data = await readJSONDb()
      return data.faqs || []
    }
  },

  addFaq: async (faq) => {
    const createdAt = new Date().toISOString()
    if (useMySQL) {
      const [result] = await pool.query(
        'INSERT INTO faqs (question, answer, createdAt) VALUES (?, ?, ?)',
        [faq.question, faq.answer, createdAt]
      )
      return { id: result.insertId, ...faq, createdAt }
    } else {
      const data = await readJSONDb()
      if (!data.faqs) data.faqs = []
      const newFaq = {
        id: data.faqs.length > 0 ? Math.max(...data.faqs.map(f => f.id)) + 1 : 1,
        ...faq,
        createdAt
      }
      data.faqs.push(newFaq)
      await writeJSONDb(data)
      return newFaq
    }
  },

  updateFaq: async (id, faq) => {
    if (useMySQL) {
      await pool.query(
        'UPDATE faqs SET question = ?, answer = ? WHERE id = ?',
        [faq.question, faq.answer, Number(id)]
      )
      return { id: Number(id), ...faq }
    } else {
      const data = await readJSONDb()
      if (!data.faqs) data.faqs = []
      const idx = data.faqs.findIndex(f => f.id === Number(id))
      if (idx !== -1) {
        data.faqs[idx] = { ...data.faqs[idx], ...faq }
        await writeJSONDb(data)
        return data.faqs[idx]
      }
      return null
    }
  },

  deleteFaq: async (id) => {
    if (useMySQL) {
      await pool.query('DELETE FROM faqs WHERE id = ?', [Number(id)])
      return true
    } else {
      const data = await readJSONDb()
      if (!data.faqs) data.faqs = []
      const filtered = data.faqs.filter(f => f.id !== Number(id))
      data.faqs = filtered
      await writeJSONDb(data)
      return true
    }
  },

  getGallery: async () => {
    if (useMySQL) {
      const [rows] = await pool.query('SELECT * FROM gallery ORDER BY id DESC')
      return rows
    } else {
      const data = await readJSONDb()
      if (!data.gallery) data.gallery = []
      return data.gallery.slice().reverse()
    }
  },

  addGallery: async (item) => {
    const createdAt = new Date().toISOString()
    if (useMySQL) {
      const [result] = await pool.query(
        'INSERT INTO gallery (imageUrl, title, createdAt) VALUES (?, ?, ?)',
        [item.imageUrl, item.title, createdAt]
      )
      return { id: result.insertId, ...item, createdAt }
    } else {
      const data = await readJSONDb()
      if (!data.gallery) data.gallery = []
      const newItem = {
        id: data.gallery.length > 0 ? Math.max(...data.gallery.map(g => g.id)) + 1 : 1,
        ...item,
        createdAt
      }
      data.gallery.push(newItem)
      await writeJSONDb(data)
      return newItem
    }
  },

  deleteGallery: async (id) => {
    if (useMySQL) {
      await pool.query('DELETE FROM gallery WHERE id = ?', [Number(id)])
      return true
    } else {
      const data = await readJSONDb()
      if (!data.gallery) data.gallery = []
      data.gallery = data.gallery.filter(g => g.id !== Number(id))
      await writeJSONDb(data)
      return true
    }
  },

  // MTP (Multi Tasking Professionals) Operations
  getMTPs: async () => {
    if (useMySQL) {
      const [rows] = await pool.query('SELECT * FROM mtps ORDER BY id DESC')
      return rows
    } else {
      const data = await readJSONDb()
      if (!data.mtps) data.mtps = []
      return [...data.mtps].reverse()
    }
  },

  getMTPById: async (id) => {
    if (useMySQL) {
      const [rows] = await pool.query('SELECT * FROM mtps WHERE id = ?', [Number(id)])
      return rows[0] || null
    } else {
      const data = await readJSONDb()
      if (!data.mtps) data.mtps = []
      return data.mtps.find(m => m.id === Number(id)) || null
    }
  },

  createMTP: async (mtpData) => {
    const createdAt = new Date().toISOString()
    const {
      name,
      phone,
      email = '',
      gender = '',
      age = '',
      city = 'Hyderabad',
      locality = '',
      roles = [],
      availability = 'Part-time',
      vehicle = 'No Vehicle',
      drivingLicense = 'No',
      experience = 'Fresher',
      skillsSummary = '',
      aadhaar = '',
      emergencyContact = '',
      aadhaarDoc = '',
      panDoc = '',
      drivingLicenseDoc = '',
      tenthCertificateDoc = '',
      policeVerificationDoc = '',
      status = 'Pending',
      adminNotes = ''
    } = mtpData

    const rolesString = Array.isArray(roles) ? roles.join(', ') : (roles || '')

    if (useMySQL) {
      const [result] = await pool.query(
        `INSERT INTO mtps (name, phone, email, gender, age, city, locality, roles, availability, vehicle, drivingLicense, experience, skillsSummary, aadhaar, emergencyContact, aadhaarDoc, panDoc, drivingLicenseDoc, tenthCertificateDoc, policeVerificationDoc, status, adminNotes, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, phone, email, gender, age, city, locality, rolesString, availability, vehicle, drivingLicense, experience, skillsSummary, aadhaar, emergencyContact, aadhaarDoc, panDoc, drivingLicenseDoc, tenthCertificateDoc, policeVerificationDoc, status, adminNotes, createdAt]
      )
      return { id: result.insertId, ...mtpData, roles: rolesString, createdAt, status }
    } else {
      const data = await readJSONDb()
      if (!data.mtps) data.mtps = []
      const newMTP = {
        id: data.mtps.length > 0 ? Math.max(...data.mtps.map(m => m.id)) + 1 : 1,
        name,
        phone,
        email,
        gender,
        age,
        city,
        locality,
        roles: rolesString,
        availability,
        vehicle,
        drivingLicense,
        experience,
        skillsSummary,
        aadhaar,
        emergencyContact,
        aadhaarDoc,
        panDoc,
        drivingLicenseDoc,
        tenthCertificateDoc,
        policeVerificationDoc,
        status,
        adminNotes,
        createdAt
      }
      data.mtps.push(newMTP)
      await writeJSONDb(data)
      return newMTP
    }
  },

  updateMTPStatus: async (id, status, adminNotes = null) => {
    if (useMySQL) {
      if (adminNotes !== null) {
        await pool.query('UPDATE mtps SET status = ?, adminNotes = ? WHERE id = ?', [status, adminNotes, Number(id)])
      } else {
        await pool.query('UPDATE mtps SET status = ? WHERE id = ?', [status, Number(id)])
      }
      const [rows] = await pool.query('SELECT * FROM mtps WHERE id = ?', [Number(id)])
      return rows[0] || null
    } else {
      const data = await readJSONDb()
      if (!data.mtps) data.mtps = []
      const index = data.mtps.findIndex(m => m.id === Number(id))
      if (index === -1) return null
      data.mtps[index].status = status
      if (adminNotes !== null) {
        data.mtps[index].adminNotes = adminNotes
      }
      await writeJSONDb(data)
      return data.mtps[index]
    }
  },

  deleteMTP: async (id) => {
    if (useMySQL) {
      await pool.query('DELETE FROM mtps WHERE id = ?', [Number(id)])
      return true
    } else {
      const data = await readJSONDb()
      if (!data.mtps) data.mtps = []
      data.mtps = data.mtps.filter(m => m.id !== Number(id))
      await writeJSONDb(data)
      return true
    }
  },

  // MTP Tasks (Dynamic Task Categories / Roles)
  getMTPTasks: async () => {
    if (useMySQL) {
      const [rows] = await pool.query('SELECT * FROM mtp_tasks ORDER BY id ASC')
      if (rows.length === 0 && DEFAULT_MOCK_DATA.mtpTasks && DEFAULT_MOCK_DATA.mtpTasks.length > 0) {
        for (const t of DEFAULT_MOCK_DATA.mtpTasks) {
          await pool.query(
            'INSERT INTO mtp_tasks (icon, title, description, shiftType, earningEstimate, active, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [t.icon, t.title, t.description, t.shiftType, t.earningEstimate, t.active ? 1 : 0, new Date().toISOString()]
          )
        }
        const [seededRows] = await pool.query('SELECT * FROM mtp_tasks ORDER BY id ASC')
        return seededRows
      }
      return rows
    } else {
      const data = await readJSONDb()
      if (!data.mtpTasks || data.mtpTasks.length === 0) {
        data.mtpTasks = [...DEFAULT_MOCK_DATA.mtpTasks]
        await writeJSONDb(data)
      }
      return data.mtpTasks
    }
  },

  getMTPTaskById: async (id) => {
    if (useMySQL) {
      const [rows] = await pool.query('SELECT * FROM mtp_tasks WHERE id = ?', [Number(id)])
      return rows[0] || null
    } else {
      const data = await readJSONDb()
      if (!data.mtpTasks) data.mtpTasks = DEFAULT_MOCK_DATA.mtpTasks
      return data.mtpTasks.find(t => t.id === Number(id)) || null
    }
  },

  createMTPTask: async (taskData) => {
    const createdAt = new Date().toISOString()
    const {
      icon = '🚗',
      title,
      description,
      shiftType = 'Part-time / On-Demand',
      earningEstimate = '₹300 - ₹1,500 / task',
      active = true
    } = taskData

    if (useMySQL) {
      const [result] = await pool.query(
        `INSERT INTO mtp_tasks (icon, title, description, shiftType, earningEstimate, active, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [icon, title, description, shiftType, earningEstimate, active ? 1 : 0, createdAt]
      )
      return { id: result.insertId, ...taskData, createdAt }
    } else {
      const data = await readJSONDb()
      if (!data.mtpTasks) data.mtpTasks = [...DEFAULT_MOCK_DATA.mtpTasks]
      const newTask = {
        id: data.mtpTasks.length > 0 ? Math.max(...data.mtpTasks.map(t => t.id)) + 1 : 1,
        icon,
        title,
        description,
        shiftType,
        earningEstimate,
        active: Boolean(active),
        createdAt
      }
      data.mtpTasks.push(newTask)
      await writeJSONDb(data)
      return newTask
    }
  },

  updateMTPTask: async (id, taskData) => {
    const { icon, title, description, shiftType, earningEstimate, active } = taskData
    if (useMySQL) {
      await pool.query(
        `UPDATE mtp_tasks 
         SET icon = COALESCE(?, icon),
             title = COALESCE(?, title),
             description = COALESCE(?, description),
             shiftType = COALESCE(?, shiftType),
             earningEstimate = COALESCE(?, earningEstimate),
             active = COALESCE(?, active)
         WHERE id = ?`,
        [icon || null, title || null, description || null, shiftType || null, earningEstimate || null, active !== undefined ? (active ? 1 : 0) : null, Number(id)]
      )
      const [rows] = await pool.query('SELECT * FROM mtp_tasks WHERE id = ?', [Number(id)])
      return rows[0] || null
    } else {
      const data = await readJSONDb()
      if (!data.mtpTasks) data.mtpTasks = [...DEFAULT_MOCK_DATA.mtpTasks]
      const index = data.mtpTasks.findIndex(t => t.id === Number(id))
      if (index === -1) return null
      data.mtpTasks[index] = {
        ...data.mtpTasks[index],
        ...taskData,
        id: Number(id)
      }
      await writeJSONDb(data)
      return data.mtpTasks[index]
    }
  },

  deleteMTPTask: async (id) => {
    if (useMySQL) {
      await pool.query('DELETE FROM mtp_tasks WHERE id = ?', [Number(id)])
      return true
    } else {
      const data = await readJSONDb()
      if (!data.mtpTasks) data.mtpTasks = [...DEFAULT_MOCK_DATA.mtpTasks]
      data.mtpTasks = data.mtpTasks.filter(t => t.id !== Number(id))
      await writeJSONDb(data)
      return true
    }
  },

  // ==========================================
  // GALLERY OPERATIONS (MySQL + JSON DB)
  // ==========================================
  getGallery: async () => {
    if (useMySQL) {
      const [rows] = await pool.query('SELECT * FROM gallery ORDER BY id ASC')
      if (rows.length === 0 && DEFAULT_MOCK_DATA.gallery && DEFAULT_MOCK_DATA.gallery.length > 0) {
        for (const g of DEFAULT_MOCK_DATA.gallery) {
          await pool.query(
            'INSERT INTO gallery (id, imageUrl, title, category, location, description, badge, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [g.id, g.imageUrl, g.title, g.category || 'General', g.location || 'Hyderabad', g.description || '', g.badge || 'Verified Care', g.createdAt || new Date().toISOString()]
          )
        }
        const [seededRows] = await pool.query('SELECT * FROM gallery ORDER BY id ASC')
        return seededRows
      }
      return rows
    } else {
      const data = await readJSONDb()
      if (!data.gallery || data.gallery.length === 0) {
        data.gallery = [...DEFAULT_MOCK_DATA.gallery]
        await writeJSONDb(data)
      }
      return data.gallery
    }
  },

  getGalleryItemById: async (id) => {
    if (useMySQL) {
      const [rows] = await pool.query('SELECT * FROM gallery WHERE id = ?', [Number(id)])
      return rows[0] || null
    } else {
      const data = await readJSONDb()
      if (!data.gallery) data.gallery = [...DEFAULT_MOCK_DATA.gallery]
      return data.gallery.find(g => g.id === Number(id)) || null
    }
  },

  addGallery: async (itemData) => {
    const {
      imageUrl,
      title,
      category = 'Elderly Care',
      location = 'Hyderabad',
      description = '',
      badge = 'Verified Care'
    } = itemData
    const createdAt = new Date().toISOString()
    if (useMySQL) {
      const [result] = await pool.query(
        'INSERT INTO gallery (imageUrl, title, category, location, description, badge, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [imageUrl, title, category, location, description, badge, createdAt]
      )
      return { id: result.insertId, imageUrl, title, category, location, description, badge, createdAt }
    } else {
      const data = await readJSONDb()
      if (!data.gallery) data.gallery = [...DEFAULT_MOCK_DATA.gallery]
      const newItem = {
        id: data.gallery.length > 0 ? Math.max(...data.gallery.map(g => g.id || 0)) + 1 : 1,
        imageUrl,
        title,
        category,
        location,
        description,
        badge,
        createdAt
      }
      data.gallery.unshift(newItem)
      await writeJSONDb(data)
      return newItem
    }
  },

  deleteGallery: async (id) => {
    if (useMySQL) {
      const [result] = await pool.query('DELETE FROM gallery WHERE id = ?', [Number(id)])
      return result.affectedRows > 0
    } else {
      const data = await readJSONDb()
      if (!data.gallery) data.gallery = []
      const prevLength = data.gallery.length
      data.gallery = data.gallery.filter(g => g.id !== Number(id))
      await writeJSONDb(data)
      return data.gallery.length < prevLength
    }
  },

  // ==========================================
  // BLOG OPERATIONS (MySQL + JSON DB)
  // ==========================================
  getBlogs: async () => {
    if (useMySQL) {
      const [rows] = await pool.query('SELECT * FROM blogs ORDER BY id ASC')
      if (rows.length === 0 && DEFAULT_MOCK_DATA.blogs && DEFAULT_MOCK_DATA.blogs.length > 0) {
        for (const b of DEFAULT_MOCK_DATA.blogs) {
          await pool.query(
            'INSERT INTO blogs (id, title, slug, description, content, image, category, author, date, readTime, badge, keyTakeaways, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [b.id, b.title, b.slug, b.description, b.content, b.image, b.category, b.author, b.date, b.readTime || '5 min read', b.badge || 'Clinical Standard', JSON.stringify(b.keyTakeaways || []), new Date().toISOString()]
          )
        }
        const [seededRows] = await pool.query('SELECT * FROM blogs ORDER BY id ASC')
        return seededRows.map(r => ({
          ...r,
          keyTakeaways: typeof r.keyTakeaways === 'string' ? (() => { try { return JSON.parse(r.keyTakeaways) } catch { return [] } })() : (r.keyTakeaways || [])
        }))
      }
      return rows.map(r => ({
        ...r,
        keyTakeaways: typeof r.keyTakeaways === 'string' ? (() => { try { return JSON.parse(r.keyTakeaways) } catch { return [] } })() : (r.keyTakeaways || [])
      }))
    } else {
      const data = await readJSONDb()
      if (!data.blogs || data.blogs.length === 0) {
        data.blogs = [...DEFAULT_MOCK_DATA.blogs]
        await writeJSONDb(data)
      }
      return data.blogs
    }
  },

  getBlogById: async (id) => {
    if (useMySQL) {
      const [rows] = await pool.query('SELECT * FROM blogs WHERE id = ?', [Number(id)])
      if (rows.length === 0) return null
      const r = rows[0]
      return {
        ...r,
        keyTakeaways: typeof r.keyTakeaways === 'string' ? (() => { try { return JSON.parse(r.keyTakeaways) } catch { return [] } })() : (r.keyTakeaways || [])
      }
    } else {
      const data = await readJSONDb()
      if (!data.blogs) data.blogs = [...DEFAULT_MOCK_DATA.blogs]
      return data.blogs.find(b => b.id === Number(id)) || null
    }
  },

  getBlogBySlug: async (slug) => {
    if (useMySQL) {
      const [rows] = await pool.query('SELECT * FROM blogs WHERE slug = ?', [slug])
      if (rows.length === 0) return null
      const r = rows[0]
      return {
        ...r,
        keyTakeaways: typeof r.keyTakeaways === 'string' ? (() => { try { return JSON.parse(r.keyTakeaways) } catch { return [] } })() : (r.keyTakeaways || [])
      }
    } else {
      const data = await readJSONDb()
      if (!data.blogs) data.blogs = [...DEFAULT_MOCK_DATA.blogs]
      return data.blogs.find(b => b.slug === slug) || null
    }
  },

  addBlog: async (blogData) => {
    const {
      title,
      slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
      description = '',
      content,
      image = '/assets/service-elderly.jpg',
      category = 'Healthcare',
      author = 'Amma Seva Care Team',
      date = new Date().toISOString().split('T')[0],
      readTime = '5 min read',
      badge = 'Clinical Standard',
      keyTakeaways = []
    } = blogData
    const createdAt = new Date().toISOString()
    if (useMySQL) {
      const [result] = await pool.query(
        'INSERT INTO blogs (title, slug, description, content, image, category, author, date, readTime, badge, keyTakeaways, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [title, slug, description, content, image, category, author, date, readTime, badge, JSON.stringify(keyTakeaways), createdAt]
      )
      return { id: result.insertId, title, slug, description, content, image, category, author, date, readTime, badge, keyTakeaways, createdAt }
    } else {
      const data = await readJSONDb()
      if (!data.blogs) data.blogs = [...DEFAULT_MOCK_DATA.blogs]
      const newBlog = {
        id: data.blogs.length > 0 ? Math.max(...data.blogs.map(b => b.id || 0)) + 1 : 1,
        title,
        slug,
        description,
        content,
        image,
        category,
        author,
        date,
        readTime,
        badge,
        keyTakeaways,
        createdAt
      }
      data.blogs.unshift(newBlog)
      await writeJSONDb(data)
      return newBlog
    }
  },

  updateBlog: async (id, blogData) => {
    const {
      title,
      slug,
      description,
      content,
      image,
      category,
      author,
      date,
      readTime,
      badge,
      keyTakeaways
    } = blogData

    if (useMySQL) {
      await pool.query(
        `UPDATE blogs 
         SET title = COALESCE(?, title),
             slug = COALESCE(?, slug),
             description = COALESCE(?, description),
             content = COALESCE(?, content),
             image = COALESCE(?, image),
             category = COALESCE(?, category),
             author = COALESCE(?, author),
             date = COALESCE(?, date),
             readTime = COALESCE(?, readTime),
             badge = COALESCE(?, badge),
             keyTakeaways = COALESCE(?, keyTakeaways)
         WHERE id = ?`,
        [
          title || null,
          slug || null,
          description || null,
          content || null,
          image || null,
          category || null,
          author || null,
          date || null,
          readTime || null,
          badge || null,
          keyTakeaways ? JSON.stringify(keyTakeaways) : null,
          Number(id)
        ]
      )
      const [rows] = await pool.query('SELECT * FROM blogs WHERE id = ?', [Number(id)])
      if (rows.length === 0) return null
      const r = rows[0]
      return {
        ...r,
        keyTakeaways: typeof r.keyTakeaways === 'string' ? (() => { try { return JSON.parse(r.keyTakeaways) } catch { return [] } })() : (r.keyTakeaways || [])
      }
    } else {
      const data = await readJSONDb()
      if (!data.blogs) data.blogs = [...DEFAULT_MOCK_DATA.blogs]
      const index = data.blogs.findIndex(b => b.id === Number(id))
      if (index === -1) return null
      data.blogs[index] = {
        ...data.blogs[index],
        ...blogData,
        id: Number(id)
      }
      await writeJSONDb(data)
      return data.blogs[index]
    }
  },

  deleteBlog: async (id) => {
    if (useMySQL) {
      const [result] = await pool.query('DELETE FROM blogs WHERE id = ?', [Number(id)])
      return result.affectedRows > 0
    } else {
      const data = await readJSONDb()
      if (!data.blogs) data.blogs = []
      const prevLength = data.blogs.length
      data.blogs = data.blogs.filter(b => b.id !== Number(id))
      await writeJSONDb(data)
      return data.blogs.length < prevLength
    }
  }
}
