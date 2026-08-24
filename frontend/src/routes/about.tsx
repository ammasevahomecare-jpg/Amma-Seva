import { createFileRoute, Link } from "@tanstack/react-router";
import { HeartHandshake, ShieldCheck, Users, Sparkles, Target, Award, Clock, ChevronRight } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import elderly from "@/assets/service-elderly.jpg";

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
  { icon: HeartHandshake, t: "Compassion", d: "Care that feels like family — patient, kind and dignified.", bgClass: "bg-rose-50 text-rose-600 border border-rose-100" },
  { icon: ShieldCheck, t: "Trust", d: "Verified, trained professionals held to strict standards.", bgClass: "bg-emerald-50 text-emerald-600 border border-emerald-100" },
  { icon: Users, t: "Family-first", d: "We serve every patient as we would our own mother.", bgClass: "bg-blue-50 text-blue-600 border border-blue-100" },
  { icon: Sparkles, t: "Excellence", d: "Reliable, punctual and professional in every visit.", bgClass: "bg-amber-50 text-amber-600 border border-amber-100" },
];

function About() {
  return (
    <SiteLayout>
      {/* Premium Hero Header Section */}
      <section className="bg-gradient-to-b from-cream/60 to-background border-b border-border/60 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-center">
            
            {/* Left Column Text */}
            <div className="md:col-span-7 space-y-5 text-left">
              <span className="inline-flex items-center rounded-full bg-gold/10 px-3 py-1 text-xs font-semibold text-gold border border-gold/20 tracking-wider uppercase">
                About Us
              </span>
              <h1 className="text-4xl font-extrabold tracking-tight text-primary sm:text-5xl lg:text-6xl leading-tight">
                Care that feels <br />
                <span className="text-gold">like family</span>
              </h1>
              <p className="max-w-2xl text-lg text-slate-600 leading-relaxed font-medium">
                Amma Seva was born from a simple belief — that every patient deserves the warmth of a mother&apos;s touch alongside the professionalism of qualified healthcare.
              </p>
              <div className="h-1 w-20 bg-gold rounded-full" />
            </div>

            {/* Right Column Premium Overlapping Photo */}
            <div className="md:col-span-5 relative flex justify-center">
              <div className="relative w-full max-w-[360px] aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-slate-100">
                <img 
                  src={elderly} 
                  alt="Compassionate Care" 
                  className="w-full h-full object-cover" 
                />
              </div>
              {/* Overlapping badge */}
              <div className="absolute -bottom-5 -right-2 bg-white px-5 py-3.5 rounded-2xl shadow-xl border border-slate-100/80 text-left space-y-0.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Our Standard</div>
                <div className="text-sm font-extrabold text-primary flex items-center gap-1.5">
                  <Award className="h-4 w-4 text-gold" /> Certified Homecare
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Mission & Promise Cards Split */}
      <section className="py-6 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Mission Card */}
            <div className="border border-border/80 bg-background rounded-2xl p-8 shadow-sm text-left hover:shadow-md transition-all duration-300 flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm">
                <Target className="h-6 w-6" />
              </span>
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-primary font-display">Our Mission</h2>
                <p className="text-sm text-slate-500 leading-relaxed">
                  To make trusted, compassionate and timely home healthcare accessible to every family — through qualified nurses, trained caregivers and technology that just works.
                </p>
              </div>
            </div>

            {/* Promise Card */}
            <div className="border border-border/80 bg-background rounded-2xl p-8 shadow-sm text-left hover:shadow-md transition-all duration-300 flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gold/10 text-gold border border-gold/20 shadow-sm">
                <HeartHandshake className="h-6 w-6" />
              </span>
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-primary font-display">Our Promise</h2>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Verified professionals, transparent pricing, punctual service and a caring helpline — every day, in every home we serve with absolute dedication.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Values Grid Section */}
      <section className="border-t border-border/60 bg-cream/35 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="block text-xs font-bold uppercase tracking-widest text-gold text-center">Corporate Pillars</span>
            <h2 className="text-3xl font-bold text-primary text-center">What we stand for</h2>
            <p className="text-sm text-slate-500 max-w-xl mx-auto text-center">
              Our core values guide every interaction, shift, and clinical consultation we perform across Hyderabad.
            </p>
          </div>
          
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((v) => (
              <div 
                key={v.t} 
                className="rounded-2xl border border-border/80 bg-background p-6 text-center shadow-xs hover:-translate-y-1 hover:shadow-md transition-all duration-300 flex flex-col items-center justify-between min-h-[220px]"
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-full shadow-sm ${v.bgClass}`}>
                  <v.icon className="h-6 w-6" />
                </div>
                <div className="space-y-2 mt-4">
                  <h3 className="text-lg font-bold text-primary font-display">{v.t}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{v.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Premium Statistics Banner & Call To Action */}
      <section className="bg-[#0e2254] text-white py-10 relative overflow-hidden">
        {/* Background visual watermarks */}
        <div className="absolute right-0 top-0 text-white/5 pointer-events-none transform translate-x-20 -translate-y-20">
          <Users className="h-96 w-96" />
        </div>
        
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Stat counts columns */}
            <div className="lg:col-span-7 grid grid-cols-3 gap-6 text-center">
              <div className="space-y-1">
                <div className="text-3xl sm:text-4xl font-extrabold text-gold">10,000+</div>
                <div className="text-xs sm:text-sm font-medium text-white/70">Families Served</div>
              </div>
              <div className="space-y-1 border-l border-white/10">
                <div className="text-3xl sm:text-4xl font-extrabold text-gold">250+</div>
                <div className="text-xs sm:text-sm font-medium text-white/70">Caregivers</div>
              </div>
              <div className="space-y-1 border-l border-white/10">
                <div className="text-3xl sm:text-4xl font-extrabold text-gold">4.8/5</div>
                <div className="text-xs sm:text-sm font-medium text-white/70">Google Rating</div>
              </div>
            </div>

            {/* CTA action column */}
            <div className="lg:col-span-5 text-left lg:text-left space-y-4">
              <h3 className="text-2xl font-bold leading-tight">Ready to experience premium home care?</h3>
              <p className="text-sm text-white/70 leading-relaxed">
                Connect with our care coordinators to customize a care plan that fits your exact timelines.
              </p>
              <div className="pt-2">
                <Link 
                  to="/contact" 
                  className="inline-flex items-center gap-1.5 bg-gold hover:bg-gold/90 text-primary font-bold px-6 py-3 rounded-full text-sm shadow-lg transition-all duration-300"
                >
                  Contact Our Coordinator <ChevronRight className="h-4.5 w-4.5" />
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>
    </SiteLayout>
  );
}