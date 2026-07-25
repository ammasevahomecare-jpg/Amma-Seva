import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "Blog & Health Tips — Amma Seva" },
      { name: "description", content: "Practical health tips and caregiving guides from the Amma Seva team." },
      { property: "og:title", content: "Amma Seva Blog" },
      { property: "og:description", content: "Health tips and caregiving guides." },
      { property: "og:url", content: "/blog" },
    ],
    links: [{ rel: "canonical", href: "/blog" }],
  }),
  component: Blog,
});

const POSTS = [
  { title: "5 things to prepare before bringing your newborn home", excerpt: "A calm, well-prepared home makes those first weeks so much easier — here's a gentle checklist." },
  { title: "Caring for a bedridden parent: a family guide", excerpt: "Simple daily routines that keep your loved one comfortable, safe and dignified." },
  { title: "Post-surgery recovery at home: what to expect", excerpt: "Wound care, nutrition and mobility — a week-by-week overview for families." },
];

function Blog() {
  return (
    <SiteLayout>
      <section className="border-b border-border bg-cream/40">
        <div className="mx-auto max-w-4xl px-4 py-14 text-center sm:px-6 lg:px-8">
          <span className="gold-rule text-xs font-semibold uppercase tracking-[0.2em] text-gold">Health Tips</span>
          <h1 className="mt-4 text-4xl font-semibold text-primary sm:text-5xl">Amma Seva Blog</h1>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">Practical guidance from our care team. Fresh articles coming soon.</p>
        </div>
      </section>
      <section>
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-14 sm:grid-cols-2 sm:px-6 lg:grid-cols-3 lg:px-8">
          {POSTS.map((p) => (
            <article key={p.title} className="rounded-2xl border border-border bg-background p-6 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-widest text-gold">Coming soon</div>
              <h2 className="mt-2 text-lg font-semibold text-primary">{p.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{p.excerpt}</p>
            </article>
          ))}
        </div>
      </section>
    </SiteLayout>
  );
}