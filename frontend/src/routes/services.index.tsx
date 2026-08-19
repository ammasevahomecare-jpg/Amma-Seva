import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { fetchServices } from "@/lib/services";
import motherBaby from "@/assets/service-mother-baby.jpg";
import nursing from "@/assets/service-nursing.jpg";
import elderly from "@/assets/service-elderly.jpg";

function getServiceDetails(slug: string) {
  const details: Record<string, { category: string; badgeClass: string; image: string }> = {
    "elderly-care": {
      category: "Elderly Care",
      badgeClass: "bg-emerald-50 text-emerald-700 border border-emerald-200/60",
      image: elderly,
    },
    "mother-baby-care": {
      category: "Maternal",
      badgeClass: "bg-rose-50 text-rose-700 border border-rose-200/60",
      image: motherBaby,
    },
    "pregnancy-care": {
      category: "Prenatal",
      badgeClass: "bg-indigo-50 text-indigo-700 border border-indigo-200/60",
      image: motherBaby,
    },
    "newborn-baby-care": {
      category: "Pediatric",
      badgeClass: "bg-sky-50 text-sky-700 border border-sky-200/60",
      image: motherBaby,
    },
    "home-nursing": {
      category: "Clinical",
      badgeClass: "bg-cyan-50 text-cyan-700 border border-cyan-200/60",
      image: nursing,
    },
    "injection-services": {
      category: "Clinical",
      badgeClass: "bg-cyan-50 text-cyan-700 border border-cyan-200/60",
      image: nursing,
    },
    "post-surgery-care": {
      category: "Recovery",
      badgeClass: "bg-amber-50 text-amber-700 border border-amber-200/60",
      image: nursing,
    },
    "patient-care-attendant": {
      category: "Assistance",
      badgeClass: "bg-purple-50 text-purple-700 border border-purple-200/60",
      image: elderly,
    },
    "bedridden-patient-care": {
      category: "Specialized",
      badgeClass: "bg-teal-50 text-teal-700 border border-teal-200/60",
      image: elderly,
    },
    "icu-home-recovery": {
      category: "Intensive",
      badgeClass: "bg-red-50 text-red-700 border border-red-200/60",
      image: nursing,
    },
    "physiotherapy": {
      category: "Therapy",
      badgeClass: "bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200/60",
      image: elderly,
    },
    "doctor-consultation": {
      category: "Medical",
      badgeClass: "bg-slate-50 text-slate-700 border border-slate-200/60",
      image: nursing,
    },
  };
  return details[slug] || {
    category: "Specialized",
    badgeClass: "bg-teal-50 text-teal-700 border border-teal-200/60",
    image: nursing,
  };
}

export const Route = createFileRoute("/services/")({
  loader: async () => {
    const list = await fetchServices();
    return { services: list };
  },
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
  const { services } = Route.useLoaderData();
  return (
    <SiteLayout>
      <section className="border-b border-border bg-cream/40">
        <div className="mx-auto max-w-7xl px-4 py-8 text-left sm:px-6 lg:px-8">
          <span className="gold-rule text-xs font-semibold uppercase tracking-[0.2em] text-gold">Services</span>
          <h1 className="mt-4 text-4xl font-semibold text-primary sm:text-5xl">Our home healthcare services</h1>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            Care for every stage of life, delivered by verified nurses and compassionate caregivers.
          </p>
        </div>
      </section>
      <section>
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:grid-cols-2 sm:px-6 lg:grid-cols-3 lg:px-8">
          {services.map((s: any) => {
            const details = getServiceDetails(s.slug);
            return (
              <div
                key={s.slug}
                className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <Link
                  to="/services/$slug"
                  params={{ slug: s.slug }}
                  className="aspect-[4/3] w-full overflow-hidden bg-slate-100 block"
                >
                  <img 
                    src={details.image} 
                    alt={s.title} 
                    width={1200} 
                    height={900} 
                    loading="lazy" 
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" 
                  />
                </Link>
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${details.badgeClass}`}>
                      {details.category}
                    </span>
                    {s.comingSoon && (
                      <span className="inline-flex items-center rounded-full bg-amber-50 text-amber-700 border border-amber-200/60 px-2 py-0.5 text-xs font-medium">
                        Coming soon
                      </span>
                    )}
                  </div>
                  <Link
                    to="/services/$slug"
                    params={{ slug: s.slug }}
                    className="mt-3 block text-lg font-bold text-primary hover:text-gold transition-colors duration-200"
                  >
                    {s.title}
                  </Link>
                  <p className="mt-2 flex-1 text-sm text-muted-foreground line-clamp-3">
                    {s.short}
                  </p>
                  <Link
                    to="/services/$slug"
                    params={{ slug: s.slug }}
                    className="mt-5 w-full bg-[#3f5151] hover:bg-[#2c3a3a] text-white text-center py-2 px-4 rounded-lg text-sm font-semibold transition-colors duration-300 flex items-center justify-center gap-1.5"
                  >
                    View Details <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </SiteLayout>
  );
}
