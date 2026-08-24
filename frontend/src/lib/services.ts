import motherBaby from "@/assets/service-mother-baby.jpg";
import nursing from "@/assets/service-nursing.jpg";
import elderly from "@/assets/service-elderly.jpg";

export type Service = {
  slug: string;
  title: string;
  short: string;
  description: string;
  benefits: string[];
  duration: string;
  pricing?: string;
  comingSoon?: boolean;
  image?: string;
  about?: string;
  highlights?: string[];
  images?: string[];
  category?: string;
};

export const services: Service[] = [];

export function getService(slug: string) {
  return services.find((s) => s.slug === slug);
}

function fillServiceFallbackFields(s: Service): Service {
  const hasAbout = !!s.about;
  const hasHighlights = s.highlights && s.highlights.length > 0;
  const hasImages = s.images && s.images.length > 0;

  if (hasAbout && hasHighlights && hasImages) return s;

  let about = s.about || "";
  let highlights = s.highlights || [];
  let images = s.images || [];

  if (!about) {
    about = `Our specialized ${s.title} program is designed to deliver warm, professional, and reliable home care. Under the guidance of clinical advisors, our dedicated caregivers assist with recovery, comfort, and daily needs, ensuring maximum safety and peace of mind in the comfort of your own home.`;
  }

  if (!highlights || highlights.length === 0) {
    highlights = [
      "100% Verified and background-checked care professionals",
      "Regular health reports and digital logs shared with families",
      "Personalized daily care planning tailored to patient needs",
      "Support with mobility, medicine alerts, and overall hygiene",
      "Continuous doctor-coordinator support and 24/7 care helpline"
    ];
  }

  if (!images || images.length === 0) {
    if (s.slug.includes("elderly") || s.slug.includes("attendant") || s.slug.includes("physio") || s.slug.includes("bedridden")) {
      images = [elderly, nursing, motherBaby];
    } else if (s.slug.includes("mother") || s.slug.includes("baby") || s.slug.includes("newborn") || s.slug.includes("pregnancy")) {
      images = [motherBaby, nursing, elderly];
    } else {
      images = [nursing, elderly, motherBaby];
    }
  }

  return {
    ...s,
    about,
    highlights,
    images
  };
}

export async function fetchServices(): Promise<Service[]> {
  try {
    const res = await fetch("/api/services");
    if (!res.ok) throw new Error("Failed to fetch services");
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      return data.map((item: any) => fillServiceFallbackFields({
        slug: item.slug || item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
        title: item.title,
        short: item.short || item.description?.substring(0, 80) + "..." || "",
        description: item.description || "",
        benefits: Array.isArray(item.benefits) ? item.benefits : [],
        duration: item.duration || "Hourly",
        pricing: item.price || item.pricing,
        comingSoon: !!item.comingSoon,
        image: item.image || "",
        about: item.about || "",
        highlights: Array.isArray(item.highlights) ? item.highlights : [],
        images: Array.isArray(item.images) ? item.images : [],
        category: item.category || ""
      }));
    }
  } catch (err) {
    console.error("Failed to load services from API", err);
  }
  return [];
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