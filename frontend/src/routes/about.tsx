import { createFileRoute } from "@tanstack/react-router";
import { HeartHandshake, ShieldCheck, Users, Sparkles } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Amma Seva — Our Story & Mission" },
      { name: "description", content: "Amma Seva delivers professional home healthcare with the warmth of a mother's touch — meet the team and mission behind us." },
      { property: "og:title", content: "About Amma Seva" },
      { property: "og:description", content: "Our story, mission and values." },
      { property: "og:url", content: "/about" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
  component: About,
});

const VALUES = [
  { icon: HeartHandshake, t: "Compassion", d: "Care that feels like family — patient, kind and dignified." },
  { icon: ShieldCheck, t: "Trust", d: "Verified, trained professionals held to strict standards." },
  { icon: Users, t: "Family-first", d: "We serve every patient as we would our own mother." },
  { icon: Sparkles, t: "Excellence", d: "Reliable, punctual and professional in every visit." },
];

function About() {
  return (
    <SiteLayout>
      <section className="border-b border-border bg-cream/40">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <span className="gold-rule text-xs font-semibold uppercase tracking-[0.2em] text-gold">About Us</span>
          <h1 className="mt-4 text-4xl font-semibold text-primary sm:text-5xl">Care that feels like family</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Amma Seva was born from a simple belief — that every patient deserves the warmth of a mother&apos;s touch alongside the professionalism of qualified healthcare.
          </p>
        </div>
      </section>

      <section>
        <div className="mx-auto grid max-w-5xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <h2 className="text-2xl font-semibold text-primary">Our mission</h2>
            <p className="mt-3 text-muted-foreground">
              To make trusted, compassionate and timely home healthcare accessible to every family — through qualified nurses, trained caregivers and technology that just works.
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-primary">Our promise</h2>
            <p className="mt-3 text-muted-foreground">
              Verified professionals, transparent pricing, punctual service and a caring helpline — every day, in every home we serve.
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-cream/40">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-semibold text-primary">What we stand for</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((v) => (
              <div key={v.t} className="rounded-2xl border border-border bg-background p-6 text-center shadow-sm">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent text-gold">
                  <v.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-primary">{v.t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{v.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}