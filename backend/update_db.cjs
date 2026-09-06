const fs = require('fs');
const path = require('path');
const os = require('os');

const src = path.join(__dirname, 'db.json');
const dest = path.join(os.homedir(), '.ammaseva_db.json');

const dbData = JSON.parse(fs.readFileSync(src, 'utf8'));

dbData.gallery = [
  {
    id: 1,
    imageUrl: '/assets/service-elderly.jpg',
    title: 'Compassionate Elderly Companionship & Care',
    category: 'Elderly Care',
    location: 'Banjara Hills, Hyderabad',
    description: 'Dedicated caregiver providing emotional warmth, daily living assistance, and medication adherence monitoring for a 76-year-old grandfather in the comfort of his home.',
    createdAt: '2026-08-15T10:00:00.000Z',
    badge: 'Verified Care'
  },
  {
    id: 2,
    imageUrl: '/assets/service-nursing.jpg',
    title: 'Hospital-Grade Home Nursing & Blood Pressure Monitoring',
    category: 'Clinical Nursing',
    location: 'Jubilee Hills, Hyderabad',
    description: 'Registered GNM nurse recording digital vitals, blood pressure, and blood glucose levels during a scheduled morning clinical visit.',
    createdAt: '2026-08-18T14:30:00.000Z',
    badge: 'Clinical Standard'
  },
  {
    id: 3,
    imageUrl: '/assets/service-mother-baby.jpg',
    title: 'Mother & Newborn Postnatal Care Session',
    category: 'Mother & Baby',
    location: 'Gachibowli, Hyderabad',
    description: 'Certified postnatal care attendant assisting a new mother with baby massage, feeding posture, and post-delivery maternal recovery routines.',
    createdAt: '2026-08-20T09:15:00.000Z',
    badge: 'Postnatal Specialist'
  },
  {
    id: 4,
    imageUrl: '/assets/service-doctor.jpg',
    title: 'Experienced Doctor Home Consultation & Health Review',
    category: 'Doctor Visits',
    location: 'Madhapur, Hyderabad',
    description: 'Senior general physician conducting an in-depth home health review, reviewing chronic conditions, and answering family queries with patience.',
    createdAt: '2026-08-22T11:45:00.000Z',
    badge: 'Doctor Visit'
  },
  {
    id: 5,
    imageUrl: '/assets/gallery-walk.jpg',
    title: 'Gentle Assisted Walking & Mobility in Garden',
    category: 'Elderly Care',
    location: 'Secunderabad, Hyderabad',
    description: 'Caregiver gently assisting a senior citizen during their morning fresh-air stroll in the community garden to promote cardiovascular health.',
    createdAt: '2026-08-25T16:00:00.000Z',
    badge: 'Mobility Support'
  },
  {
    id: 6,
    imageUrl: '/assets/service-physiotherapy.jpg',
    title: 'Physiotherapy & Neuro-Rehabilitation Exercise',
    category: 'Physiotherapy',
    location: 'Kondapur, Hyderabad',
    description: 'Licensed physiotherapist guiding an elderly patient through guided range-of-motion and joint strengthening exercises following surgery.',
    createdAt: '2026-08-28T10:30:00.000Z',
    badge: 'Certified PT'
  },
  {
    id: 7,
    imageUrl: '/assets/service-icu-recovery.jpg',
    title: 'ICU Home Recovery & Vital Signs Tracking',
    category: 'ICU Recovery',
    location: 'Hitec City, Hyderabad',
    description: 'Critical-care trained home nurse managing oxygen saturation, pulse oximetry, and sterile cannula care in a home step-down setting.',
    createdAt: '2026-09-01T08:00:00.000Z',
    badge: 'Critical Care'
  },
  {
    id: 8,
    imageUrl: '/assets/service-bedside-attendant.jpg',
    title: 'Bedside Attendant Assisting Senior Patient with Warmth',
    category: 'Bedside Assistance',
    location: 'Begumpet, Hyderabad',
    description: 'Dedicated attendant assisting a recovering patient with nutritious meals, hydration, and gentle position changes to prevent bedsores.',
    createdAt: '2026-09-02T13:20:00.000Z',
    badge: '24/7 Attendant'
  },
  {
    id: 9,
    imageUrl: '/assets/service-mtp.jpg',
    title: 'Medical Transport Partner (MTP) Safe Patient Escort',
    category: 'Medical Transport',
    location: 'Kukatpally, Hyderabad',
    description: 'Trained MTP escort safely assisting an elderly wheelchair patient from their doorstep to an outpatient hospital consultation.',
    createdAt: '2026-09-04T15:10:00.000Z',
    badge: 'Transit Escort'
  },
  {
    id: 10,
    imageUrl: '/assets/service-nursing.jpg',
    title: 'Post-Surgical Wound Dressing & Aseptic Care',
    category: 'Clinical Nursing',
    location: 'Attapur, Hyderabad',
    description: 'Qualified nurse performing sterile suture line inspection and antiseptic dressing change for a patient recovering from orthopaedic surgery.',
    createdAt: '2026-09-05T11:00:00.000Z',
    badge: 'Wound Care'
  },
  {
    id: 11,
    imageUrl: '/assets/service-mother-baby.jpg',
    title: 'Prenatal Wellness & Vitals Check for Expectant Mother',
    category: 'Mother & Baby',
    location: 'Manikonda, Hyderabad',
    description: 'Maternal healthcare nurse conducting prenatal blood pressure, weight, and wellness checks in the comfort of home.',
    createdAt: '2026-09-05T16:30:00.000Z',
    badge: 'Antenatal Care'
  },
  {
    id: 12,
    imageUrl: '/assets/service-doctor.jpg',
    title: 'Senior Citizen Health Screening & Care Coordination',
    category: 'Doctor Visits',
    location: 'Somajiguda, Hyderabad',
    description: 'Physician and care coordinator reviewing medication reconciliation and preventive geriatric care plan with family.',
    createdAt: '2026-09-06T09:00:00.000Z',
    badge: 'Preventive Check'
  }
];

dbData.blogs = [
  {
    id: 1,
    slug: 'essential-guide-elderly-care-hyderabad',
    title: 'The Essential Guide to Quality Elderly Care at Home in Telangana',
    description: 'Discover clinical protocols, psychological support frameworks, and practical routines that preserve senior dignity and safety in the comfort of home.',
    category: 'Geriatric Care',
    author: 'Dr. Ramesh V., MD (Geriatric Medicine) & Advisory Board',
    date: '2026-08-20',
    readTime: '6 min read',
    image: '/assets/service-elderly.jpg',
    content: `## 1. The Demographic Need for Home Geriatric Support

As our beloved parents and grandparents age, their physical, physiological, and emotional healthcare requirements evolve rapidly. In urban hubs like Hyderabad and Secunderabad, busy family work schedules often create a care gap. While institutional nursing homes were once the default option, modern home healthcare allows seniors to receive hospital-standard clinical supervision within the comforting familiarity of their own homes.

Research conducted under geriatric welfare frameworks demonstrates that seniors recovering in familiar surroundings experience significantly lower rates of anxiety, cognitive decline, and hospital-acquired delirium compared to institutionalized patients.

---

## 2. Core Pillars of Comprehensive Elderly Care

A clinical home care program is structured around four essential pillars:

### A. Fall Risk Prevention & Environmental Safety
Falls represent the single largest cause of debilitating hip fractures and intracranial trauma in seniors above 65 years. Our trained caregivers conduct a systematic room-by-room safety audit to eliminate hazards:
- Securing loose carpets and installing anti-slip rubber mats in bathrooms.
- Ensuring adequate 500-lux ambient lighting along hallways and bedroom pathways.
- Assisting with gait stabilization, walker usage, and ergonomic bed-to-chair transfers.

### B. Medication Adherence & Polypharmacy Monitoring
Elderly patients frequently manage multiple chronic conditions (Hypertension, Type 2 Diabetes, Arthritis). Amma Seva caregivers maintain digital medication logs, ensuring every pill is administered at the exact prescribed hour.

### C. Assisted Mobility & Cognitive Engagement
Structured daily routines including morning 15-minute garden walks for natural Vitamin D synthesis and cognitive engagement exercises.

### D. Continuous Vital Signs Tracking
Daily recording of Blood Pressure, Blood Glucose, Pulse Rate, and Pulse Oximetry (SpO2) provides an unshakeable digital record.

---

## 3. Public Health Alignment & Senior Dignity

Amma Seva adheres to the clinical benchmarks outlined by the Ministry of Health and Family Welfare's National Programme for Health Care of the Elderly (NPHCE). Every elder in our care is treated with profound respect, empathy, and dignity.`
  },
  {
    id: 2,
    slug: 'postnatal-recovery-guide-new-mothers',
    title: 'Postnatal & Newborn Care: Clinical Best Practices for the 4th Trimester',
    description: 'A comprehensive guide on postpartum recovery, lactation support, neonatal jaundice monitoring, and the vital first 90 days of infant life.',
    category: 'Maternal & Newborn',
    author: 'Sister Sunitha M., B.Sc Nursing & Lactation Specialist',
    date: '2026-08-25',
    readTime: '7 min read',
    image: '/assets/service-mother-baby.jpg',
    content: `## 1. Understanding the Fourth Trimester

The delivery of a baby is one of life's greatest blessings, yet the immediate 12 weeks following childbirth represents a period of profound hormonal, physical, and psychological transition for new mothers.

---

## 2. Key Protocols in Postnatal Maternal Recovery

### Post-Cesarean & Normal Delivery Wound Care
Daily monitoring of surgical suture lines for erythema and exudate to prevent surgical site infections (SSI), paired with high-protein nutrition to promote tissue healing.

### Lactation Guidance & Feeding Mechanics
Certified nurses provide ergonomic positioning guidance (Cradle, Football hold) and asymmetrical latching assistance to prevent nipple trauma and sustain milk supply.

---

## 3. Essential Newborn Care Protocols

### Neonatal Jaundice Monitoring
Visual assessment of bilirubin progression using Kramer's rule and immediate non-invasive testing when indicated.

### Traditional Bathing & Safe Infant Oil Massage
Stimulates peripheral circulation and calms the infant nervous system using lukewarm water and gentle sterile techniques.`
  },
  {
    id: 3,
    slug: 'prevent-bedsores-bedridden-patients',
    title: 'Preventing Bedsores (Decubitus Ulcers) in Bedbound Patients: Clinical Protocol',
    description: 'Evidence-based nursing guidelines on Braden Scale risk assessment, 2-hour positional turning schedules, and advanced skin integrity management.',
    category: 'Clinical Nursing',
    author: 'Amma Seva Clinical Nursing Board',
    date: '2026-08-28',
    readTime: '8 min read',
    image: '/assets/service-bedside-attendant.jpg',
    content: `## 1. The Critical Danger of Pressure Ulcers

For individuals recovering from severe stroke, trauma, or terminal illness, prolonged immobilization creates sustained mechanical pressure over bony prominences. When external pressure exceeds capillary arteriolar pressure (32 mmHg), rapid tissue ischemia occurs within 2 to 4 hours.

---

## 2. The Amma Seva Bedsore Prevention Protocol

### A. The 2-Hour Positional Turning Schedule
Our bedside attendants maintain a continuous, documented turning clock alternating between lateral tilt and supine positions.

### B. Microclimate & Moisture Management
Utilizing pH-balanced perineal cleansers, breathable zinc-oxide barrier creams, and immediate moisture-wicking underpad changes.

### C. Alternating Pressure Ripple Mattresses
Motorized cyclic inflation and deflation of air cells ensures no single anatomical zone sustains constant pressure.

### D. Clinical High-Protein Nutrition
Ensuring 1.2 to 1.5 grams of protein per kilogram of body weight daily for rapid cellular collagen repair.`
  },
  {
    id: 4,
    slug: 'home-icu-step-down-protocols',
    title: 'Hospital-to-Home ICU Step-Down: Safe Recovery Protocols for Critical Patients',
    description: 'Why transitioning critical patients to hospital-standard home ICU setups reduces infection risks, accelerates mental healing, and saves up to 65% in costs.',
    category: 'Critical Care',
    author: 'Dr. Ramesh V. & ICU Critical Care Team',
    date: '2026-09-01',
    readTime: '9 min read',
    image: '/assets/service-icu-recovery.jpg',
    content: `## 1. The Challenge of Prolonged Hospital ICU Stays

Prolonged stays in tertiary hospital ICUs introduce severe secondary hazards including hospital-acquired nosocomial infections, ICU delirium, and catastrophic financial expenditure.

---

## 2. Creating a Hospital-Standard Home ICU

Amma Seva's Critical Recovery Program transforms the patient's bedroom into an aseptic, fully-equipped intensive recovery suite with 5-function ICU motorized bed, multiparameter digital monitor, oxygen concentrators, and sterile suctioning equipment.

---

## 3. Dedicated Critical Care Nursing

Critical-care certified nurses manage tracheostomy care, sterile suctioning, central lines, and precision medication infusion under continuous tele-consultation with senior intensivists.`
  },
  {
    id: 5,
    slug: 'physiotherapy-stroke-ortho-rehabilitation',
    title: 'Physiotherapy for Stroke & Post-Orthopaedic Surgery: Accelerating Home Mobility',
    description: 'Evidence-based rehabilitation routines, neuroplasticity windows, and gait training techniques that restore independence after stroke or joint surgery.',
    category: 'Rehabilitation',
    author: 'Dr. K. Anand, MPT (Neuro-Physiotherapy)',
    date: '2026-09-03',
    readTime: '6 min read',
    image: '/assets/service-physiotherapy.jpg',
    content: `## 1. The Importance of Early Home Rehabilitation

Delivering specialized physical therapy at home eliminates the pain and fatigue of hospital travel while capitalizing on the golden 90-day post-stroke neuroplasticity window.

---

## 2. Key Rehabilitation Streams

### A. Neurological Stroke Rehabilitation
Proprioceptive Neuromuscular Facilitation (PNF) and Constraint-Induced Movement Therapy (CIMT) to activate dormant muscle groups.

### B. Post-Orthopaedic Surgery Recovery
Targeted protocols following Total Knee Replacement (TKR) and Hip Replacement (THR) progressing from passive range of motion to unassisted walking.

### C. Geriatric Fall Prevention & Balance Training
Perturbation drills and dual-task gait exercises to eliminate fear of falling.`
  },
  {
    id: 6,
    slug: 'medical-transport-partner-senior-transit',
    title: 'Medical Transport Partner (MTP): Bridging the Critical Transit Gap for Senior Citizens',
    description: 'How trained youth healthcare companions empower seniors to access outpatient medical appointments with safe, dignified doorstep-to-hospital transit.',
    category: 'Healthcare Logistics & Youth Welfare',
    author: 'Amma Seva Youth Welfare & Logistics Committee',
    date: '2026-09-05',
    readTime: '5 min read',
    image: '/assets/service-mtp.jpg',
    content: `## 1. The Invisible Barrier in Outpatient Healthcare

Over 42% of elderly individuals delay or cancel critical medical checkups because they lack an escort to assist them down stairs, navigate traffic, and manage hospital queues.

---

## 2. The Medical Transport Partner (MTP) Solution

Trained youth companions provide doorstep pickup, wheelchair assistance, hospital registration and elevator navigation, prescription collection, and safe return home.

---

## 3. Youth Empowerment & Dignified Livelihoods

Converts youth energy into meaningful public health service, providing certified healthcare career paths and dignified earnings aligned with state youth welfare initiatives.`
  }
];

fs.writeFileSync(src, JSON.stringify(dbData, null, 2), 'utf8');
fs.writeFileSync(dest, JSON.stringify(dbData, null, 2), 'utf8');
console.log('SUCCESS: Updated db.json and ~/.ammaseva_db.json with 12 gallery items and 6 clinical blogs');
