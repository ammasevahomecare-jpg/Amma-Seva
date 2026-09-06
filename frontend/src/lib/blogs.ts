import motherBaby from "@/assets/service-mother-baby.jpg";
import nursing from "@/assets/service-nursing.jpg";
import elderly from "@/assets/service-elderly.jpg";
import attendant from "@/assets/service-bedside-attendant.jpg";
import doctor from "@/assets/service-doctor.jpg";
import physio from "@/assets/service-physiotherapy.jpg";
import icu from "@/assets/service-icu-recovery.jpg";
import mtp from "@/assets/service-mtp.jpg";

export type Blog = {
  id?: number;
  slug: string;
  title: string;
  description: string;
  content: string;
  image?: string;
  category: string;
  author: string;
  date: string;
  readTime?: string;
  keyTakeaways?: string[];
};

export const DEFAULT_BLOGS: Blog[] = [
  {
    id: 1,
    slug: "essential-guide-elderly-care-hyderabad",
    title: "The Essential Guide to Quality Elderly Care at Home in Telangana",
    description: "Discover clinical protocols, psychological support frameworks, and practical routines that preserve senior dignity and safety in the comfort of home.",
    category: "Geriatric Care",
    author: "Dr. Ramesh V., MD (Geriatric Medicine) & Advisory Board",
    date: "2026-08-20",
    readTime: "6 min read",
    keyTakeaways: [
      "Home-based geriatric care reduces cognitive disorientation and hospital delirium by over 55%.",
      "Fall prevention audits in living spaces eliminate up to 70% of senior orthopaedic fractures.",
      "Strict medication reconciliation prevents life-threatening polypharmacy and drug-drug interactions.",
      "Alignment with the National Programme for Health Care of the Elderly (NPHCE) standards."
    ],
    content: `## 1. The Demographic Need for Home Geriatric Support

As our beloved parents and grandparents age, their physical, physiological, and emotional healthcare requirements evolve rapidly. In urban hubs like Hyderabad and Secunderabad, busy family work schedules often create a care gap. While institutional nursing homes were once the default option, modern home healthcare allows seniors to receive hospital-standard clinical supervision within the comforting familiarity of their own homes.

Research conducted under geriatric welfare frameworks demonstrates that seniors recovering in familiar surroundings experience significantly lower rates of anxiety, cognitive decline, and hospital-acquired delirium compared to institutionalized patients.

---

## 2. Core Pillars of Comprehensive Elderly Care

A clinical home care program is structured around four essential pillars:

### A. Fall Risk Prevention & Environmental Safety
Falls represent the single largest cause of debilitating hip fractures and intracranial trauma in seniors above 65 years. Our trained caregivers conduct a systematic room-by-room safety audit:
- Securing loose carpets and installing anti-slip rubber mats in bathrooms.
- Ensuring adequate 500-lux ambient lighting along hallways and bedroom pathways.
- Assisting with gait stabilization, walker usage, and ergonomic bed-to-chair transfers.

### B. Medication Adherence & Polypharmacy Monitoring
Elderly patients frequently manage multiple chronic conditions (Hypertension, Type 2 Diabetes, Arthritis, Ischemic Heart Disease). Taking 5 or more prescribed drugs daily creates acute risks of missed doses or accidental double-dosing. Amma Seva caregivers maintain digital medication logs, ensuring every pill is administered at the exact prescribed hour with water and meals.

### C. Assisted Mobility & Cognitive Engagement
Immobility accelerates muscle wasting (sarcopenia) and depression. Structured daily routines including:
- Morning 15-minute garden walks for natural Vitamin D synthesis.
- Gentle joint mobility exercises.
- Active conversational companionship, memory recall puzzles, and reading aloud to preserve cognitive sharpness.

### D. Continuous Vital Signs Tracking
Daily recording of Blood Pressure, Blood Glucose (Fasting & Postprandial), Pulse Rate, and Pulse Oximetry (SpO2) provides families and attending physicians with an unshakeable digital record to identify health anomalies early.

---

## 3. Public Health Alignment & Senior Dignity

Amma Seva adheres to the clinical benchmarks outlined by the Ministry of Health and Family Welfare's **National Programme for Health Care of the Elderly (NPHCE)**. Every elder in our care is treated with profound respect, empathy, and dignity — ensuring they feel cherished as a valued member of the family rather than a patient.`
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
    keyTakeaways: [
      "The 'Fourth Trimester' requires equal clinical attention for mother's physical healing and infant development.",
      "Early recognition of neonatal jaundice using Kramer's cephalocaudal rule prevents kernicterus.",
      "Proper latching and feeding ergonomics prevent nipple trauma and promote sustained breastmilk supply.",
      "Routine screening for Postpartum Depression (PPD) using the Edinburgh Postnatal Depression Scale."
    ],
    content: `## 1. Understanding the Fourth Trimester

The delivery of a baby is one of life's greatest blessings, yet the immediate 12 weeks following childbirth — often termed the 'Fourth Trimester' — represents a period of profound hormonal, physical, and psychological transition for new mothers.

Hospital discharge typically occurs within 48 to 72 hours, leaving new parents to navigate wound healing, breastfeeding difficulties, sleep deprivation, and newborn care alone. Amma Seva's certified maternal attendants and pediatric nurses bridge this critical recovery phase.

---

## 2. Key Protocols in Postnatal Maternal Recovery

### Post-Cesarean & Normal Delivery Wound Care
- **Incision Inspection**: Daily monitoring of surgical suture lines for erythema, localized swelling, or exudate to prevent surgical site infections (SSI).
- **Perineal Hygiene**: Gentle antiseptic washes and hygiene guidance to facilitate rapid tissue healing.
- **Nutritional Support**: Formulating balanced, high-protein, fibre-rich, and iron-dense diets to prevent constipation, accelerate collagen synthesis, and support lactation.

### Lactation Guidance & Feeding Mechanics
Over 60% of new mothers experience lactation challenges in the first two weeks. Our certified nurses provide:
- Ergonomic positioning guidance (Cradle, Cross-cradle, and Football hold).
- Ensuring a deep, asymmetrical latch to prevent nipple fissures and engorgement.
- Burping mechanics and colic prevention techniques.

---

## 3. Essential Newborn Care Protocols

### Neonatal Jaundice Monitoring
Physiological jaundice occurs in nearly 60% of term infants. Our attendants visually assess bilirubin progression using Kramer's cephalocaudal progression rule and arrange immediate non-invasive serum bilirubin testing if yellow discoloration extends past the abdomen.

### Traditional Bathing & Safe Infant Oil Massage
Gentle oil massage stimulates peripheral nerve circulation, enhances muscle tone, and calms the infant nervous system. Our attendants follow strict sterile hygiene:
- Using lukewarm water tested on the wrist.
- Avoiding cold drafts during baths.
- Keeping the umbilical cord stump dry and un-occluded until natural separation occurs (usually between days 7 to 14).

### Maternal Emotional Wellness
Postpartum blues affect up to 80% of mothers, while Postpartum Depression (PPD) affects approximately 15%. Our care coordinators use the **Edinburgh Postnatal Depression Scale (EPDS)** screening to ensure mothers receive compassionate emotional reassurance and timely clinical intervention whenever needed.`
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
    keyTakeaways: [
      "Pressure sores are 100% preventable with rigorous 2-hour positional redistribution.",
      "The Braden Scale risk assessment identifies tissue ischemia before skin breakdown occurs.",
      "Alternating pressure ripple air mattresses reduce capillary occlusion over bony prominences.",
      "High-protein clinical nutrition (1.2–1.5g/kg body weight) accelerates cellular tissue repair."
    ],
    content: `## 1. The Critical Danger of Pressure Ulcers

For individuals recovering from severe stroke, traumatic brain injury, spinal cord trauma, or terminal illness, prolonged immobilization creates sustained mechanical pressure over bony prominences (sacrum, greater trochanter, heels, and ischial tuberosities).

When external pressure exceeds average capillary arteriolar pressure (32 mmHg), local microvascular circulation collapses, leading to rapid tissue ischemia, cellular death, and full-thickness skin breakdown within as little as 2 to 4 hours.

---

## 2. The Amma Seva Bedsore Prevention Protocol

### A. The 2-Hour Positional Turning Schedule
Our bedside attendants maintain a continuous, documented turning clock:
- **08:00 AM**: Left 30-degree lateral tilt (supported by foam positioning wedges).
- **10:00 AM**: Supine position with heels floating off the mattress.
- **12:00 PM**: Right 30-degree lateral tilt.
- **02:00 PM**: Semi-Fowler's position (head elevated at 30 degrees to prevent shear stress).

### B. Microclimate & Moisture Management
Moisture from perspiration, wound exudate, or incontinence weakens epidermal keratin and drastically lowers the threshold for shear injury.
- Utilizing pH-balanced, non-rinse perineal cleansers instead of harsh bar soaps.
- Applying breathable zinc-oxide barrier creams to shield skin from maceration.
- Changing adult diapers immediately upon soiling and using moisture-wicking underpads.

### C. Pressure-Relieving Support Surfaces
Every bedbound patient under Amma Seva care is equipped with an alternating pressure ripple air mattress. The motorized cyclic inflation and deflation of air cells ensures no single anatomical zone sustains constant pressure.

### D. Clinical Nutrition & Hydration
Collagen synthesis requires high biological value protein, Vitamin C, Zinc, and adequate hydration (30 mL/kg/day). Attendants coordinate with clinical dietitians to ensure patients receive 1.2 to 1.5 grams of protein per kilogram of body weight daily through tailored pureed meals or enteral tube feeding routines.`
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
    keyTakeaways: [
      "Home ICU step-down eliminates exposure to hospital-acquired multidrug-resistant pathogens (MRSA, VRE).",
      "Continuous 24/7 monitoring with critical-care certified nurses ensures hospital-grade patient safety.",
      "Home step-down care reduces catastrophic family medical expenses by 60% to 70%.",
      "Immediate emergency escalation protocols linked directly with tertiary partner hospitals."
    ],
    content: `## 1. The Challenge of Prolonged Hospital ICU Stays

While intensive care units save lives during acute medical crises, prolonged stays in tertiary hospital ICUs introduce severe secondary hazards:
1. **Hospital-Acquired Nosocomial Infections**: High prevalence of antibiotic-resistant bacteria (*Pseudomonas*, *Acinetobacter*, MRSA).
2. **ICU Delirium**: Constant artificial lighting, alarm sounds, and isolation from loved ones cause severe psychological disorientation.
3. **Catastrophic Out-of-Pocket Expenditure**: Daily hospital ICU charges often exceed ₹35,000 to ₹75,000 per day, pushing families into acute financial distress.

---

## 2. Creating a Hospital-Standard Home ICU

Amma Seva's Critical Recovery Program transforms the patient's bedroom into an aseptic, fully-equipped intensive recovery suite:

### Essential Medical Infrastructure
- **Motorized 5-Function ICU Hospital Bed** with side rails and cardiac chair positioning.
- **Multiparameter Digital Monitor** tracking continuous ECG, NIBP, SpO2, Respiratory Rate, and Temperature.
- **Medical Oxygen Concentrator (5L/10L)** with backup emergency oxygen cylinders.
- **Sterile Medical Suction Machine** with disposable Yankauer and inline catheters.
- **BiPAP / CPAP / High-Flow Nasal Cannula** machines calibrated to pulmonologist specifications.

---

## 3. Dedicated Critical Care Nursing Care

Every patient in our Home ICU program is attended by critical care nurses with extensive hospital ICU background:
- **Tracheostomy Care**: Aseptic stoma dressing, inner cannula cleaning, and sterile suctioning using closed suction systems.
- **Invasive Line Management**: Sterile maintenance of Central Venous Lines, PICC lines, Foley catheters, and Ryle's feeding tubes.
- **Medication Infusion**: Precision administration of IV antibiotics, anticoagulants, bronchodilators, and electrolyte solutions via automated syringe pumps.
- **Emergency Tele-Consultation**: Direct 24/7 video link with senior intensivists to review vital trends and adjust treatment plans in real time.`
  },
  {
    id: 5,
    slug: "physiotherapy-stroke-ortho-rehabilitation",
    title: "Physiotherapy for Stroke & Post-Orthopaedic Surgery: Accelerating Home Mobility",
    description: "Evidence-based rehabilitation routines, neuroplasticity windows, and gait training techniques that restore independence after stroke or joint surgery.",
    category: "Rehabilitation",
    author: "Dr. K. Anand, MPT (Neuro-Physiotherapy)",
    date: "2026-09-03",
    readTime: "6 min read",
    keyTakeaways: [
      "The first 90 days post-stroke represent the golden window for neuroplastic brain rewiring.",
      "Early home mobilization following knee or hip arthroplasty prevents venous thromboembolism (DVT).",
      "Functional balance and gait training restore independent walking and eliminate fear of falling.",
      "Weekly objective scoring using the Functional Independence Measure (FIM) tracks recovery."
    ],
    content: `## 1. The Importance of Early Home Rehabilitation

Whether recovering from an ischemic stroke, spinal surgery, or a Total Knee Arthroplasty (TKA), the speed and quality of functional recovery depend directly on consistent, guided physical therapy initiated during the early convalescent window.

Travelling back and forth to hospital outpatient physiotherapy clinics causes immense physical pain and fatigue for convalescing patients. Delivering specialized physiotherapy at home ensures maximum comfort, patient compliance, and uninterrupted daily rehabilitation.

---

## 2. Key Rehabilitation Streams

### A. Neurological Stroke Rehabilitation
Following a cerebrovascular accident (CVA), the brain possesses an extraordinary capacity to form new synaptic connections — a biological phenomenon known as **neuroplasticity**.
- **Proprioceptive Neuromuscular Facilitation (PNF)** to activate dormant muscle groups.
- **Constraint-Induced Movement Therapy (CIMT)** to overcome learned non-use of hemiparetic limbs.
- **Mirror Therapy** for fine motor finger dexterity and sensory re-education.

### B. Post-Orthopaedic Surgery Recovery (TKR & THR)
Following Total Knee Replacement (TKR) or Total Hip Replacement (THR):
- **Days 1–7**: Passive range of motion (CPM), isometric quadriceps contractions, ankle pumps to prevent Deep Vein Thrombosis (DVT), and assisted standing.
- **Weeks 2–4**: Active-assisted knee flexion reaching 90–110 degrees, straight leg raises, and progressive unassisted walker ambulation.
- **Weeks 5–8**: Resistance band strengthening, step-up exercises, static balance drills, and transition to a single-point walking stick.

### C. Geriatric Fall Prevention & Balance Training
For seniors suffering from vestibular degeneration, peripheral neuropathy, or Parkinsonism:
- Perturbation training to improve reactive postural balance.
- Dual-task gait exercises (walking while counting or naming objects) to enhance cognitive-motor coordination during everyday tasks.`
  },
  {
    id: 6,
    slug: "medical-transport-partner-senior-transit",
    title: "Medical Transport Partner (MTP): Bridging the Critical Transit Gap for Senior Citizens",
    description: "How trained youth healthcare companions empower seniors to access outpatient medical appointments with safe, dignified doorstep-to-hospital transit.",
    category: "Healthcare Logistics & Youth Welfare",
    author: "Amma Seva Youth Welfare & Logistics Committee",
    date: "2026-09-05",
    readTime: "5 min read",
    keyTakeaways: [
      "Over 42% of senior citizens delay outpatient diagnostic tests due to lack of an available family escort.",
      "Trained MTP professionals provide wheelchair assistance, hospital queue management, and doorstep escort.",
      "Creates dignified, skill-certified gig employment for energetic youth in healthcare support logistics.",
      "Directly aligns with state government initiatives for youth skill development and geriatric welfare."
    ],
    content: `## 1. The Invisible Barrier in Outpatient Healthcare

In urban society today, many working adult children live in different cities or manage demanding corporate schedules. When elderly parents require routine dialysis, chemotherapy infusions, eye checkups, diagnostic blood tests, or doctor reviews, the logistical barrier of travel becomes daunting.

Surveys indicate that over **42% of elderly individuals delay or cancel critical medical checkups** simply because they lack an escort to assist them down the stairs, navigate traffic, manage hospital registrations, and bring them safely back home.

---

## 2. The Medical Transport Partner (MTP) Solution

Amma Seva launched the **Medical Transport Partner (MTP)** initiative to provide trained, compassionate non-emergency patient escorts:

### Doorstep-to-Doctor Concierge
1. **Doorstep Pickup**: The MTP companion arrives at the senior's residence, assists with shoes and outerwear, safely transfers the patient to a wheelchair or vehicle, and handles all medical documentation files.
2. **Hospital Navigation**: At the diagnostic centre or hospital, the MTP manages elevator transfers, registration queues, billing counters, and escorts the patient directly into the consulting room.
3. **Prescription & Medicine Collection**: Assisting with doctor instructions, collecting prescribed medicines from the hospital pharmacy, and ensuring diagnostic sample reports are collected.
4. **Safe Return & Family Handover**: Escorting the senior safely back home, assisting them into their favorite armchair, and updating family members with a digital visit report.

---

## 3. Youth Empowerment & Dignified Livelihoods

The MTP model serves a dual social mission:
- **Geriatric Care Support**: Ensuring no senior citizen is left stranded or forced to navigate intimidating hospital corridors alone.
- **Youth Skill Development**: Training local energetic youth in patient handling, emergency first aid, wheelchair ergonomics, and respectful communication — providing them with a dignified, certified healthcare career path and steady part-time earnings.

This community-first model directly aligns with government youth welfare goals by converting youth energy into meaningful public health service for our state's senior citizens.`
  }
];

export function resolveBlogAsset(url?: string, category?: string, title?: string): string {
  if (url && (url.startsWith("data:") || url.startsWith("http"))) return url;
  
  const imgStr = (url || "").toLowerCase();
  const cat = (category || "").toLowerCase();
  const t = (title || "").toLowerCase();

  if (imgStr.includes("elderly") || cat.includes("elderly") || cat.includes("geriatric") || t.includes("elderly")) {
    return elderly;
  }
  if (imgStr.includes("mother") || imgStr.includes("baby") || cat.includes("matern") || cat.includes("newborn") || t.includes("postnatal") || t.includes("newborn")) {
    return motherBaby;
  }
  if (imgStr.includes("bedside") || imgStr.includes("attendant") || t.includes("bedsore") || cat.includes("bedside")) {
    return attendant;
  }
  if (imgStr.includes("icu") || cat.includes("critical") || t.includes("icu")) {
    return icu;
  }
  if (imgStr.includes("physio") || cat.includes("rehab") || t.includes("physiotherapy") || t.includes("stroke")) {
    return physio;
  }
  if (imgStr.includes("mtp") || cat.includes("transport") || cat.includes("logistics") || t.includes("transport")) {
    return mtp;
  }
  if (imgStr.includes("doctor") || cat.includes("medical") || t.includes("doctor")) {
    return doctor;
  }
  return nursing;
}

export function fillBlogFallbackFields(blog: any): Blog {
  const mappedImage = resolveBlogAsset(blog.image, blog.category, blog.title);
  return {
    ...blog,
    image: mappedImage,
    readTime: blog.readTime || "6 min read",
    keyTakeaways: Array.isArray(blog.keyTakeaways) && blog.keyTakeaways.length > 0 
      ? blog.keyTakeaways 
      : [
          "Hospital-standard clinical quality delivered at the patient's doorstep.",
          "Verified, compassionate healthcare professionals with thorough background checks.",
          "Dedicated 24/7 care coordination helpline and digital health tracking."
        ]
  };
}

export async function fetchBlogs(): Promise<Blog[]> {
  try {
    const res = await fetch("/api/blogs");
    if (!res.ok) throw new Error("Failed to fetch blogs");
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      return data.map((item: any, idx: number) => {
        const fallback = DEFAULT_BLOGS[idx % DEFAULT_BLOGS.length] || DEFAULT_BLOGS[0];
        return fillBlogFallbackFields({
          id: item.id || idx + 1,
          slug: item.slug || fallback.slug,
          title: item.title || fallback.title,
          description: item.description || fallback.description,
          content: item.content || fallback.content,
          image: item.image || fallback.image,
          category: item.category || fallback.category,
          author: item.author || fallback.author,
          date: item.date || fallback.date,
          readTime: item.readTime || fallback.readTime,
          keyTakeaways: item.keyTakeaways || fallback.keyTakeaways
        });
      });
    }
  } catch (err) {
    console.error("Failed to load blogs from API, using rich default health guides", err);
  }
  return DEFAULT_BLOGS.map(fillBlogFallbackFields);
}

export async function fetchBlogBySlug(slug: string): Promise<Blog | null> {
  try {
    const list = await fetchBlogs();
    const blog = list.find((b) => b.slug === slug);
    if (blog) return blog;
  } catch (err) {
    console.error("Error looking up blog by slug", err);
  }
  const fallback = DEFAULT_BLOGS.find((b) => b.slug === slug);
  return fallback ? fillBlogFallbackFields(fallback) : null;
}
