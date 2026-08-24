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

export const defaultBlogs: Blog[] = [];

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
    if (Array.isArray(data)) {
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
    console.error("Failed to load blogs from API", err);
  }
  return [];
}

export async function fetchBlogBySlug(slug: string): Promise<Blog | null> {
  try {
    const list = await fetchBlogs();
    const blog = list.find((b) => b.slug === slug);
    if (blog) return blog;
  } catch (err) {
    console.error("Error looking up blog by slug", err);
  }
  return null;
}
