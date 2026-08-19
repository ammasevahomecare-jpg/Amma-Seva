import motherBaby from "@/assets/service-mother-baby.jpg";
import nursing from "@/assets/service-nursing.jpg";
import elderly from "@/assets/service-elderly.jpg";

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
};

export const defaultBlogs: Blog[] = [
  {
    id: 1,
    title: "5 things to prepare before bringing your newborn home",
    slug: "prepare-before-bringing-newborn-home",
    description: "A calm, well-prepared home makes those first weeks so much easier — here's a gentle checklist.",
    content: "Bringing a newborn home is one of the most beautiful and overwhelming moments of life. To help you transition smoothly, here are 5 key things to prepare:\n\n1. Set up a dedicated nursing and diapering station.\n2. Stock up on postpartum recovery essentials for the mother.\n3. Prepare a safe sleep space (like a certified crib or bassinet).\n4. Sterilize bottles, pump parts, and newborn clothes ahead of time.\n5. Keep a list of contact numbers for your pediatrician and lactation advisor.\n\nAmma Seva's trained maternal caregivers are always ready to support you with professional, motherly care.",
    image: motherBaby,
    category: "Maternal",
    author: "Amma Seva Care Team",
    date: "2026-08-17"
  },
  {
    id: 2,
    title: "Caring for a bedridden parent: a family guide",
    slug: "caring-for-bedridden-parent-family-guide",
    description: "Simple daily routines that keep your loved one comfortable, safe and dignified.",
    content: "Caring for a bedridden loved one requires patience, empathy, and proper technique. This guide offers essential routines:\n\n1. Prevent pressure sores (bedsores) by shifting positions every 2 hours.\n2. Ensure proper hygiene with gentle sponge baths and skin moisturizing.\n3. Pay close attention to hydration and a balanced soft-diet.\n4. Perform passive range-of-motion exercises to maintain joint flexibility.\n5. Maintain a positive, cheerful atmosphere in their room to support mental health.\n\nOur professional patient care attendants at Amma Seva are trained specifically in caring for bedridden patients with high dignity.",
    image: elderly,
    category: "Elderly Care",
    author: "Dr. Lakshmi Prasad",
    date: "2026-08-15"
  },
  {
    id: 3,
    title: "Post-surgery recovery at home: what to expect",
    slug: "post-surgery-recovery-home-expectations",
    description: "Wound care, nutrition and mobility — a week-by-week overview for families.",
    content: "Recovering from surgery at home can feel challenging, but knowing what to expect makes a significant difference:\n\n1. Week 1 is all about rest and strict pain management as prescribed.\n2. Week 2 focuses on gentle mobility and tracking wound healing/infections.\n3. Week 3 shifts to building strength through light therapy and nutrition.\n\nAlways ensure you have a trained nurse for complex tasks like IV injections, dressing, and catheter management. Amma Seva provides full-scope home nursing for post-surgery recovery.",
    image: nursing,
    category: "Clinical",
    author: "Nurse Mercy K.",
    date: "2026-08-10"
  }
];

function fillBlogFallbackFields(blog: any): Blog {
  let mappedImage = blog.image;
  if (!mappedImage || mappedImage.trim() === "" || mappedImage.includes("placeholder")) {
    if (blog.category?.toLowerCase().includes("matern") || blog.category?.toLowerCase().includes("newborn")) {
      mappedImage = motherBaby;
    } else if (blog.category?.toLowerCase().includes("elderly") || blog.category?.toLowerCase().includes("senior")) {
      mappedImage = elderly;
    } else {
      mappedImage = nursing;
    }
  }
  return {
    ...blog,
    image: mappedImage
  };
}

export async function fetchBlogs(): Promise<Blog[]> {
  try {
    const res = await fetch("/api/blogs");
    if (!res.ok) throw new Error("Failed to fetch blogs");
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      return data.map((item: any) => fillBlogFallbackFields({
        id: item.id,
        slug: item.slug || item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
        title: item.title,
        description: item.description || item.content?.substring(0, 100) + "..." || "",
        content: item.content || "",
        image: item.image || "",
        category: item.category || "General",
        author: item.author || "Amma Seva Care Team",
        date: item.date || new Date().toISOString().split("T")[0]
      }));
    }
  } catch (err) {
    console.error("Failed to load blogs from API, using local default fallback", err);
  }
  return defaultBlogs.map(fillBlogFallbackFields);
}

export async function fetchBlogBySlug(slug: string): Promise<Blog | null> {
  try {
    const list = await fetchBlogs();
    const blog = list.find((b) => b.slug === slug);
    if (blog) return blog;
  } catch (err) {
    console.error("Error looking up blog by slug", err);
  }
  return defaultBlogs.find((b) => b.slug === slug) || null;
}
