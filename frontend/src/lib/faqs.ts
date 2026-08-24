export type FAQItem = {
  id: number;
  question: string;
  answer: string;
  createdAt?: string;
};

export async function fetchFaqs(): Promise<FAQItem[]> {
  try {
    const res = await fetch("/api/faqs");
    if (!res.ok) throw new Error("Failed to fetch FAQs");
    return await res.json();
  } catch (err) {
    console.error("Failed to load FAQs", err);
    return [];
  }
}
