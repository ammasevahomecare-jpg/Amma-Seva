export type Service = {
  slug: string;
  title: string;
  short: string;
  description: string;
  benefits: string[];
  duration: string;
  pricing?: string;
  comingSoon?: boolean;
};

export const services: Service[] = [
  {
    slug: "elderly-care",
    title: "Elderly Care at Home",
    short: "Compassionate, respectful care for seniors in the comfort of home.",
    description:
      "Trained caregivers assist your elderly loved ones with daily activities, mobility, medication reminders, meals, and companionship — always with dignity and warmth.",
    benefits: ["Personal hygiene & grooming", "Medication reminders", "Meal preparation", "Mobility assistance", "Companionship"],
    duration: "Hourly, Daily, or Live-in",
    pricing: "Starting ₹500 / visit",
  },
  {
    slug: "mother-baby-care",
    title: "Mother & Baby Care",
    short: "Postnatal support for new mothers and their newborns.",
    description:
      "Experienced maternity attendants and nurses help new mothers with recovery, feeding guidance, baby bathing, and round-the-clock newborn care.",
    benefits: ["Postnatal recovery support", "Breastfeeding guidance", "Baby bathing & massage", "Sleep scheduling", "Emotional wellness"],
    duration: "Daily, Weekly, or Monthly",
    pricing: "Starting ₹18,000 / month",
  },
  {
    slug: "pregnancy-care",
    title: "Pregnancy Care",
    short: "Attentive prenatal support for expectant mothers at home.",
    description:
      "Qualified nurses provide antenatal check-ins, wellness monitoring, and comforting care throughout pregnancy — so you can rest, recover and prepare in peace.",
    benefits: ["Vitals monitoring", "Diet & nutrition guidance", "Wellness check-ins", "Mobility support", "Doctor coordination"],
    duration: "Hourly, Daily, or Monthly",
    pricing: "Starting ₹700 / visit",
  },
  {
    slug: "newborn-baby-care",
    title: "Newborn Baby Care",
    short: "Specialist care for babies in their most delicate first weeks.",
    description:
      "Trained newborn caregivers handle feeding, sleep routines, bathing, and gentle massages so parents can rest while their little one is in expert hands.",
    benefits: ["Feeding & burping", "Bathing & massage", "Sleep routines", "Vaccination reminders", "Overnight care"],
    duration: "Daily, Weekly, or Monthly",
    pricing: "Starting ₹20,000 / month",
  },
  {
    slug: "home-nursing",
    title: "Home Nursing Services",
    short: "Qualified nurses delivering hospital-grade care at home.",
    description:
      "Registered nurses provide wound care, IV therapy, catheter care, tracheostomy care, and general nursing tailored to your medical needs.",
    benefits: ["Wound dressing", "IV / injection therapy", "Catheter & tube care", "Vitals monitoring", "Doctor coordination"],
    duration: "Hourly, 12-hour, or 24-hour",
    pricing: "Starting ₹800 / visit",
  },
  {
    slug: "injection-services",
    title: "Injection Services",
    short: "Safe, sterile injections administered by trained nurses at home.",
    description:
      "On-demand injection service for insulin, antibiotics, vitamin shots, and prescribed medication — quick, hygienic, and pain-conscious.",
    benefits: ["Sterile procedure", "Trained nurses only", "Same-day availability", "Safe disposal", "Doctor prescription verified"],
    duration: "Per visit",
    pricing: "Starting ₹299 / visit",
  },
  {
    slug: "post-surgery-care",
    title: "Post-Surgery Care",
    short: "Guided recovery care after hospital discharge.",
    description:
      "Nurses and attendants support post-operative healing with wound care, medication schedules, mobility help, and gentle physical support.",
    benefits: ["Wound & suture care", "Pain management support", "Mobility assistance", "Diet planning", "Progress reporting"],
    duration: "Daily or 24-hour",
    pricing: "Starting ₹1,500 / day",
  },
  {
    slug: "patient-care-attendant",
    title: "Patient Care Attendant",
    short: "Dedicated attendants for personal and daily patient needs.",
    description:
      "Trained attendants assist with feeding, hygiene, positioning and companionship so families can focus on being together.",
    benefits: ["Feeding assistance", "Personal hygiene", "Turning & positioning", "Household support", "Emotional companionship"],
    duration: "12-hour or 24-hour",
    pricing: "Starting ₹900 / day",
  },
  {
    slug: "bedridden-patient-care",
    title: "Bedridden Patient Care",
    short: "Specialist care for patients confined to bed.",
    description:
      "Attendants and nurses trained in bedsore prevention, position changes, sponge baths, catheter care, and full daily support for bedridden patients.",
    benefits: ["Bedsore prevention", "Sponge bath & hygiene", "Position changes", "Diaper care", "Catheter care"],
    duration: "12-hour or 24-hour",
    pricing: "Starting ₹1,200 / day",
  },
  {
    slug: "icu-home-recovery",
    title: "ICU / Home Recovery Support",
    short: "ICU-level home support for critical recovery.",
    description:
      "Critical-care trained nurses handle ventilator monitoring, tracheostomy care, and intensive recovery routines under doctor guidance.",
    benefits: ["Critical-care nurses", "Ventilator monitoring", "Tracheostomy care", "24/7 vitals tracking", "Doctor coordination"],
    duration: "24-hour",
    pricing: "Starting ₹2,500 / day",
  },
  {
    slug: "physiotherapy",
    title: "Physiotherapy",
    short: "Home physiotherapy sessions for recovery and mobility.",
    description:
      "Professional physiotherapists visit your home for orthopaedic, neurological and post-surgery rehabilitation programs.",
    benefits: ["Custom rehab plans", "Orthopaedic care", "Neuro rehab", "Post-surgery recovery", "Progress reviews"],
    duration: "Per session",
    comingSoon: true,
  },
  {
    slug: "doctor-consultation",
    title: "Doctor Consultation",
    short: "Home visit and online consultations with trusted doctors.",
    description:
      "Consult experienced general physicians and specialists from the comfort of your home — with follow-ups and prescriptions.",
    benefits: ["Home visits", "Online consults", "Follow-ups", "e-Prescriptions", "Specialist referrals"],
    duration: "Per consultation",
    comingSoon: true,
  },
];

export function getService(slug: string) {
  return services.find((s) => s.slug === slug);
}

export async function fetchServices(): Promise<Service[]> {
  try {
    const res = await fetch("/api/services");
    if (!res.ok) throw new Error("Failed to fetch services");
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      return data.map((item: any) => ({
        slug: item.slug || item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
        title: item.title,
        short: item.short || item.description?.substring(0, 80) + "..." || "",
        description: item.description || "",
        benefits: Array.isArray(item.benefits) ? item.benefits : [],
        duration: item.duration || "Hourly",
        pricing: item.price || item.pricing,
        comingSoon: !!item.comingSoon
      }));
    }
  } catch (err) {
    console.error("Failed to load services from API, using local fallback", err);
  }
  return services;
}

export async function fetchServiceBySlug(slug: string): Promise<Service | null> {
  try {
    const list = await fetchServices();
    const service = list.find((s) => s.slug === slug);
    if (service) return service;
  } catch (err) {
    console.error("Error looking up service by slug", err);
  }
  return getService(slug) || null;
}