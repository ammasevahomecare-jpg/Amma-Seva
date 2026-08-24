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
    console.error("Failed to load FAQs, using local fallback", err);
    return [
      { id: 1, question: "Are your caregivers and nurses verified?", answer: "Yes. Every professional undergoes ID verification, background checks, and skill assessments before joining." },
      { id: 2, question: "How quickly can care be arranged?", answer: "In most cities, we can arrange care within 4–12 hours depending on the service and shift." },
      { id: 3, question: "Can I choose the shift duration?", answer: "Absolutely. We offer hourly visits, 12-hour and 24-hour shifts, plus weekly and monthly plans." },
      { id: 4, question: "How do payments work?", answer: "You can pay online via Razorpay. Shift booking is confirmed immediately after secure payment." },
      { id: 5, question: "What if I need to reschedule or cancel?", answer: "You can reschedule anytime via your dashboard panel. Cancellations follow our refund policy." }
    ];
  }
}
