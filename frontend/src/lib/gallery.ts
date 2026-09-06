import elderly from "@/assets/service-elderly.jpg";
import nursing from "@/assets/service-nursing.jpg";
import motherBaby from "@/assets/service-mother-baby.jpg";
import doctor from "@/assets/service-doctor.jpg";
import physio from "@/assets/service-physiotherapy.jpg";
import icu from "@/assets/service-icu-recovery.jpg";
import attendant from "@/assets/service-bedside-attendant.jpg";
import mtp from "@/assets/service-mtp.jpg";
import galleryWalk from "@/assets/gallery-walk.jpg";

export type GalleryItem = {
  id: number;
  imageUrl: string;
  title: string;
  category: string;
  location: string;
  description: string;
  createdAt: string;
  badge?: string;
};

export const DEFAULT_GALLERY: GalleryItem[] = [
  {
    id: 1,
    imageUrl: elderly,
    title: "Compassionate Elderly Companionship & Care",
    category: "Elderly Care",
    location: "Banjara Hills, Hyderabad",
    description: "Dedicated caregiver providing emotional warmth, daily living assistance, and medication adherence monitoring for a 76-year-old grandfather in the comfort of his home.",
    createdAt: "2026-08-15T10:00:00.000Z",
    badge: "Verified Care"
  },
  {
    id: 2,
    imageUrl: nursing,
    title: "Hospital-Grade Home Nursing & Blood Pressure Monitoring",
    category: "Clinical Nursing",
    location: "Jubilee Hills, Hyderabad",
    description: "Registered GNM nurse recording digital vitals, blood pressure, and blood glucose levels during a scheduled morning clinical visit.",
    createdAt: "2026-08-18T14:30:00.000Z",
    badge: "Clinical Standard"
  },
  {
    id: 3,
    imageUrl: motherBaby,
    title: "Mother & Newborn Postnatal Care Session",
    category: "Mother & Baby",
    location: "Gachibowli, Hyderabad",
    description: "Certified postnatal care attendant assisting a new mother with baby massage, feeding posture, and post-delivery maternal recovery routines.",
    createdAt: "2026-08-20T09:15:00.000Z",
    badge: "Postnatal Specialist"
  },
  {
    id: 4,
    imageUrl: doctor,
    title: "Experienced Doctor Home Consultation & Health Review",
    category: "Doctor Visits",
    location: "Madhapur, Hyderabad",
    description: "Senior general physician conducting an in-depth home health review, reviewing chronic conditions, and answering family queries with patience.",
    createdAt: "2026-08-22T11:45:00.000Z",
    badge: "Doctor Visit"
  },
  {
    id: 5,
    imageUrl: galleryWalk,
    title: "Gentle Assisted Walking & Mobility in Garden",
    category: "Elderly Care",
    location: "Secunderabad, Hyderabad",
    description: "Caregiver gently assisting a senior citizen during their morning fresh-air stroll in the community garden to promote cardiovascular health.",
    createdAt: "2026-08-25T16:00:00.000Z",
    badge: "Mobility Support"
  },
  {
    id: 6,
    imageUrl: physio,
    title: "Physiotherapy & Neuro-Rehabilitation Exercise",
    category: "Physiotherapy",
    location: "Kondapur, Hyderabad",
    description: "Licensed physiotherapist guiding an elderly patient through guided range-of-motion and joint strengthening exercises following surgery.",
    createdAt: "2026-08-28T10:30:00.000Z",
    badge: "Certified PT"
  },
  {
    id: 7,
    imageUrl: icu,
    title: "ICU Home Recovery & Vital Signs Tracking",
    category: "ICU Recovery",
    location: "Hitec City, Hyderabad",
    description: "Critical-care trained home nurse managing oxygen saturation, pulse oximetry, and sterile cannula care in a home step-down setting.",
    createdAt: "2026-09-01T08:00:00.000Z",
    badge: "Critical Care"
  },
  {
    id: 8,
    imageUrl: attendant,
    title: "Bedside Attendant Assisting Senior Patient with Warmth",
    category: "Bedside Assistance",
    location: "Begumpet, Hyderabad",
    description: "Dedicated attendant assisting a recovering patient with nutritious meals, hydration, and gentle position changes to prevent bedsores.",
    createdAt: "2026-09-02T13:20:00.000Z",
    badge: "24/7 Attendant"
  },
  {
    id: 9,
    imageUrl: mtp,
    title: "Medical Transport Partner (MTP) Safe Patient Escort",
    category: "Medical Transport",
    location: "Kukatpally, Hyderabad",
    description: "Trained MTP escort safely assisting an elderly wheelchair patient from their doorstep to an outpatient hospital consultation.",
    createdAt: "2026-09-04T15:10:00.000Z",
    badge: "Transit Escort"
  },
  {
    id: 10,
    imageUrl: nursing,
    title: "Post-Surgical Wound Dressing & Aseptic Care",
    category: "Clinical Nursing",
    location: "Attapur, Hyderabad",
    description: "Qualified nurse performing sterile suture line inspection and antiseptic dressing change for a patient recovering from orthopaedic surgery.",
    createdAt: "2026-09-05T11:00:00.000Z",
    badge: "Wound Care"
  },
  {
    id: 11,
    imageUrl: motherBaby,
    title: "Prenatal Wellness & Vitals Check for Expectant Mother",
    category: "Mother & Baby",
    location: "Manikonda, Hyderabad",
    description: "Maternal healthcare nurse conducting prenatal blood pressure, weight, and wellness checks in the comfort of home.",
    createdAt: "2026-09-05T16:30:00.000Z",
    badge: "Antenatal Care"
  },
  {
    id: 12,
    imageUrl: doctor,
    title: "Senior Citizen Health Screening & Care Coordination",
    category: "Doctor Visits",
    location: "Somajiguda, Hyderabad",
    description: "Physician and care coordinator reviewing medication reconciliation and preventive geriatric care plan with family.",
    createdAt: "2026-09-06T09:00:00.000Z",
    badge: "Preventive Check"
  }
];

export function resolveGalleryAsset(url: string): string {
  if (!url) return nursing;
  const s = url.toLowerCase();
  if (s.includes("elderly")) return elderly;
  if (s.includes("nursing") || s.includes("bp") || s.includes("wound")) return nursing;
  if (s.includes("mother") || s.includes("baby") || s.includes("newborn") || s.includes("prenatal")) return motherBaby;
  if (s.includes("doctor") || s.includes("physician") || s.includes("screening")) return doctor;
  if (s.includes("walk") || s.includes("garden")) return galleryWalk;
  if (s.includes("physio") || s.includes("rehab")) return physio;
  if (s.includes("icu") || s.includes("recovery")) return icu;
  if (s.includes("attendant") || s.includes("bedside")) return attendant;
  if (s.includes("mtp") || s.includes("transport")) return mtp;
  return url;
}

export async function fetchGallery(): Promise<GalleryItem[]> {
  try {
    const res = await fetch("/api/gallery");
    if (!res.ok) throw new Error("Failed to fetch gallery items");
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      return data.map((item: any, idx: number) => {
        const fallback = DEFAULT_GALLERY[idx % DEFAULT_GALLERY.length] || DEFAULT_GALLERY[0];
        return {
          id: item.id || idx + 1,
          imageUrl: resolveGalleryAsset(item.imageUrl || fallback.imageUrl),
          title: item.title || fallback.title,
          category: item.category || fallback.category,
          location: item.location || fallback.location,
          description: item.description || fallback.description,
          createdAt: item.createdAt || fallback.createdAt,
          badge: item.badge || fallback.badge
        };
      });
    }
  } catch (err) {
    console.error("Failed to load gallery items from API, using default authentic gallery", err);
  }
  return DEFAULT_GALLERY;
}
