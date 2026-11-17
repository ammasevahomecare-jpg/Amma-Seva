import motherBaby from "@/assets/service-mother-baby.jpg";
import nursing from "@/assets/service-nursing.jpg";
import elderly from "@/assets/service-elderly.jpg";
import physio from "@/assets/service-physiotherapy.jpg";
import icu from "@/assets/service-icu-recovery.jpg";
import attendant from "@/assets/service-bedside-attendant.jpg";
import doctor from "@/assets/service-doctor.jpg";
import mtp from "@/assets/service-mtp.jpg";

export type Service = {
  id?: number;
  slug: string;
  title: string;
  short: string;
  description: string;
  benefits: string[];
  duration: string;
  pricing?: string;
  price?: string;
  comingSoon?: boolean;
  image?: string;
  about?: string;
  highlights?: string[];
  images?: string[];
  category?: string;
  advance?: number | string;
  isMtp?: boolean;
  icon?: string;
  earningEstimate?: string;
  shiftType?: string;
};

export const services: Service[] = [];

export function getService(slug: string) {
  return services.find((s) => s.slug === slug);
}

export function getServicePrimaryImage(slug: string): string {
  const s = slug.toLowerCase();
  if (s.includes("elderly")) return elderly;
  if (s.includes("mother") || s.includes("baby") || s.includes("newborn") || s.includes("pregnancy")) return motherBaby;
  if (s.includes("physio")) return physio;
  if (s.includes("icu") || s.includes("surgery") || s.includes("post-op")) return icu;
  if (s.includes("attendant") || s.includes("bedridden")) return attendant;
  if (s.includes("doctor")) return doctor;
  if (s.includes("mtp") || s.includes("transport") || s.includes("escort") || s.includes("errand")) return mtp;
  return nursing;
}

function fillServiceFallbackFields(s: Service): Service {
  let about = s.about || "";
  let highlights = s.highlights || [];
  let images = s.images || [];
  let image = s.image;
  const price = s.price || s.pricing || (s.isMtp ? "Custom Quote / Pay on Service" : "Starting ₹799 / shift");

  if (!about) {
    if (s.isMtp) {
      about = `Our specialized ${s.title} task is fulfilled by verified Amma Seva Multi-Tasking Professionals (MTP). Whether you need hospital escorts, medicine delivery, senior companionship, or urgent home errands, our background-checked team is available on-demand across Hyderabad.`;
    } else {
      about = `Our specialized ${s.title} program is designed to deliver warm, professional, and reliable home care. Under the guidance of clinical advisors, our dedicated caregivers assist with recovery, comfort, and daily needs, ensuring maximum safety and peace of mind in the comfort of your own home.`;
    }
  }

  if (!highlights || highlights.length === 0) {
    if (s.isMtp) {
      highlights = [
        "100% Background-verified local companion staff",
        "Fast on-demand dispatch or scheduled shifts",
        "Pay on service — Zero upfront advance payment required",
        "Direct care manager support on WhatsApp & call",
        "Reliable assistance for hospital visits, errands & senior walks"
      ];
    } else {
      highlights = [
        "100% Verified and background-checked care professionals",
        "Regular health reports and digital logs shared with families",
        "Personalized daily care planning tailored to patient needs",
        "Support with mobility, medicine alerts, and overall hygiene",
        "Continuous doctor-coordinator support and 24/7 care helpline"
      ];
    }
  }

  const sSlug = s.slug.toLowerCase();
  if (!image) {
    image = getServicePrimaryImage(sSlug);
  }

  if (!images || images.length === 0) {
    if (sSlug.includes("elderly")) {
      images = [elderly, attendant, nursing];
    } else if (sSlug.includes("mother") || sSlug.includes("baby") || sSlug.includes("newborn") || sSlug.includes("pregnancy")) {
      images = [motherBaby, nursing, attendant];
    } else if (sSlug.includes("physio")) {
      images = [physio, elderly, attendant];
    } else if (sSlug.includes("icu") || sSlug.includes("surgery")) {
      images = [icu, nursing, physio];
    } else if (sSlug.includes("attendant") || sSlug.includes("bedridden")) {
      images = [attendant, elderly, nursing];
    } else if (sSlug.includes("doctor")) {
      images = [doctor, nursing, elderly];
    } else if (sSlug.includes("mtp") || sSlug.includes("transport") || sSlug.includes("escort")) {
      images = [mtp, attendant, nursing];
    } else {
      images = [nursing, icu, doctor];
    }
  }

  return {
    ...s,
    price,
    pricing: price,
    image,
    about,
    highlights,
    images
  };
}

// Fetch with timeout + retries (a slow or briefly restarting server used to make
// service pages show "Page Not Found" and booking pick the wrong service).
async function fetchWithRetry(url: string, attempts = 3): Promise<Response> {
  let lastError: unknown = null;
  for (let i = 0; i < attempts; i++) {
    const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), 15000) : null;
    try {
      const res = await fetch(url, controller ? { signal: controller.signal } : undefined);
      if (res.ok) return res;
      // Do not retry client errors (except 429), they will not change
      if (res.status < 500 && res.status !== 429) return res;
      lastError = new Error(`${url} responded ${res.status}`);
    } catch (err) {
      lastError = err;
    } finally {
      if (timer) clearTimeout(timer);
    }
    await new Promise((r) => setTimeout(r, 500 * (i + 1)));
  }
  throw lastError instanceof Error ? lastError : new Error(`Failed to load ${url}`);
}

const SERVICES_CACHE_KEY = "ammaseva_services_cache_v1";
const SERVICES_TTL_MS = 60 * 1000;
let servicesCache: { at: number; list: Service[] } | null = null;
let servicesInFlight: Promise<Service[]> | null = null;

const readStoredServices = (): Service[] | null => {
  try {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(SERVICES_CACHE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
  } catch {
    return null;
  }
};

const storeServices = (list: Service[]) => {
  try {
    if (typeof window !== "undefined") window.localStorage.setItem(SERVICES_CACHE_KEY, JSON.stringify(list));
  } catch {
    /* storage full or blocked: ignore */
  }
};

/**
 * Loads all bookable services (standard care + MTP tasks).
 * - Concurrent callers (header, footer, page loader, dashboard) share ONE request.
 * - Results are cached for 60s, so navigating between pages is instant.
 * - If the API is unreachable, the last successfully loaded list is used.
 * - Throws only when nothing is available at all (pages then show "Try again", not "Not Found").
 */
export async function fetchServices(): Promise<Service[]> {
  if (servicesCache && Date.now() - servicesCache.at < SERVICES_TTL_MS) return servicesCache.list;
  if (servicesInFlight) return servicesInFlight;
  servicesInFlight = loadServicesFromApi()
    .then((list) => {
      servicesCache = { at: Date.now(), list };
      storeServices(list);
      return list;
    })
    .catch((err) => {
      const stored = servicesCache?.list || readStoredServices();
      if (stored) {
        console.warn("Services API unavailable, using last loaded list", err);
        return stored;
      }
      throw err;
    })
    .finally(() => {
      servicesInFlight = null;
    });
  return servicesInFlight;
}

async function loadServicesFromApi(): Promise<Service[]> {
  let standardServices: Service[] = [];

  // 1. Fetch standard care services from /api/services (required)
  {
    const res = await fetchWithRetry("/api/services");
    if (!res.ok) throw new Error(`Services API responded ${res.status}`);
    {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        standardServices = data.map((item: any) => {
          const itemPrice = item.price || item.pricing || "Starting ₹799 / shift";
          return fillServiceFallbackFields({
            id: item.id,
            slug: item.slug || item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
            title: item.title,
            short: item.short || item.description?.substring(0, 80) + "..." || "",
            description: item.description || "",
            benefits: Array.isArray(item.benefits) ? item.benefits : [],
            duration: item.duration || "Hourly",
            pricing: itemPrice,
            price: itemPrice,
            comingSoon: !!item.comingSoon,
            image: item.image || "",
            about: item.about || "",
            highlights: Array.isArray(item.highlights) ? item.highlights : [],
            images: Array.isArray(item.images) ? item.images : [],
            category: item.category || "",
            advance: item.advance,
            isMtp: false
          });
        });
      }
    }
  }

  // 2. Fetch dynamic MTP Tasks configured by Admin from /api/mtp/tasks (optional)
  let mtpServices: Service[] = [];
  try {
    const mtpRes = await fetchWithRetry("/api/mtp/tasks", 2);
    if (mtpRes.ok) {
      const mtpData = await mtpRes.json();
      if (Array.isArray(mtpData) && mtpData.length > 0) {
        const activeMtpTasks = mtpData.filter((t: any) => t.active !== false);
        mtpServices = activeMtpTasks.map((t: any) => {
          const titleSlug = (t.title || `task-${t.id}`)
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '');
          const cleanSlug = `mtp-${t.id}-${titleSlug}`;
          const priceEstimate = t.earningEstimate || "Custom Quote / Pay on Service";
          const shiftDuration = t.shiftType || "On-Demand / Per Task";

          return fillServiceFallbackFields({
            id: 10000 + Number(t.id),
            slug: cleanSlug,
            title: t.title,
            short: t.description || "On-demand Multi-Tasking Professional service across Hyderabad.",
            description: t.description || "On-demand Multi-Tasking Professional service across Hyderabad.",
            benefits: [
              "100% Verified Multi-Tasking Professional (MTP)",
              "Flexible on-demand or scheduled shifts",
              "Pay on Service / Quote upon Confirmation",
              "No Upfront Advance Payment Required"
            ],
            duration: shiftDuration,
            pricing: priceEstimate,
            price: priceEstimate,
            comingSoon: false,
            image: mtp,
            images: [mtp, attendant, nursing],
            category: "MTP & Companion Tasks",
            advance: 0,
            isMtp: true,
            icon: t.icon || "🚗",
            earningEstimate: priceEstimate,
            shiftType: shiftDuration,
            about: `Our ${t.title} service is provided by Amma Seva Multi-Tasking Professionals (MTP). Whether you need safe hospital escorts, urgent prescription medicine runs, senior walking companions, or on-demand home support, our verified staff is ready to assist across Hyderabad.`,
            highlights: [
              "100% Background-verified local companion staff",
              "Immediate 60-minute dispatch or scheduled slots",
              "Pay on service — No upfront payment required",
              "24/7 Care Coordinator supervision"
            ]
          });
        });
      }
    }
  } catch (err) {
    console.error("Failed to load dynamic MTP tasks into services", err);
  }

  return [...standardServices, ...mtpServices];
}

/**
 * Finds a service by URL slug. Exact match first; for MTP tasks the slug is
 * "mtp-<taskId>-<title>", so an old link keeps working after the admin renames the task.
 */
export function findServiceBySlug(list: Service[], rawSlug: string): Service | undefined {
  const slug = decodeURIComponent(String(rawSlug || "")).toLowerCase().trim().replace(/\/+$/, "");
  if (!slug) return undefined;
  const exact = list.find((s) => s.slug.toLowerCase() === slug);
  if (exact) return exact;
  const mtpMatch = slug.match(/^mtp-(\d+)(?:-|$)/);
  if (mtpMatch) {
    return list.find((s) => s.isMtp && s.slug.startsWith(`mtp-${mtpMatch[1]}-`));
  }
  return undefined;
}

export async function fetchServiceBySlug(slug: string): Promise<Service | null> {
  try {
    const list = await fetchServices();
    const service = list.find((s) => s.slug === slug || (s.isMtp && (s.slug === slug || s.slug.startsWith(slug) || slug.startsWith(`mtp-${s.id}`))));
    if (service) return service;
  } catch (err) {
    console.error("Error looking up service by slug", err);
  }
  return getService(slug) || null;
}