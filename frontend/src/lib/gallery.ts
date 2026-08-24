export type GalleryItem = {
  id: number;
  imageUrl: string;
  title: string;
  createdAt: string;
};

export async function fetchGallery(): Promise<GalleryItem[]> {
  try {
    const res = await fetch("/api/gallery");
    if (!res.ok) throw new Error("Failed to fetch gallery items");
    return await res.json();
  } catch (err) {
    console.error("Failed to load gallery items", err);
    return [];
  }
}
