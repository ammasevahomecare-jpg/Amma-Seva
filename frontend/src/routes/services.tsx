import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { services } from "@/lib/services";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Our Services — Amma Seva Home Healthcare" },
      { name: "description", content: "Explore Amma Seva's full range of home healthcare — elderly care, mother & baby care, nursing, injections, post-surgery and more." },
      { property: "og:title", content: "Our Services — Amma Seva" },
      { property: "og:description", content: "Comprehensive home healthcare and caregiving services." },
      { property: "og:url", content: "/services" },
    ],
    links: [{ rel: "canonical", href: "/services" }],
  }),
  component: ServicesPage,
});

function ServicesPage() {
  return (
    <SiteLayout>
      <section className="border-b border-border bg-cream/40">
        <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <span className="gold-rule text-xs font-semibold uppercase tracking-[0.2em] text-gold">Services</span>
          <h1 className="mt-4 text-4xl font-semibold text-primary sm:text-5xl">Our home healthcare services</h1>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Care for every stage of life, delivered by verified nurses and compassionate caregivers.
          </p>
        </div>
      </section>
      <section>
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-16 sm:grid-cols-2 sm:px-6 lg:grid-cols-3 lg:px-8">
          {services.map((s) => (
            <Link
              key={s.slug}
              to="/services/$slug"
              params={{ slug: s.slug }}
              className="group flex flex-col rounded-2xl border border-border bg-background p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <h3 className="text-xl font-semibold text-primary">{s.title}</h3>
              {s.comingSoon && (
                <span className="mt-2 w-fit rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-primary">Coming soon</span>
              )}
              <p className="mt-3 flex-1 text-sm text-muted-foreground">{s.short}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-gold">
                Learn more <ChevronRight className="h-4 w-4" />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </SiteLayout>
  );
}