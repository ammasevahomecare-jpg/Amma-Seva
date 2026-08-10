import { createFileRoute, Link } from "@tanstack/react-router";
import { Phone, Calendar, ShieldCheck, HeartHandshake, Clock, BadgeCheck, Star, ChevronRight } from "lucide-react";
import { SiteLayout, contact } from "@/components/SiteLayout";
import { fetchServices } from "@/lib/services";
import hero from "@/assets/hero-care.jpg";
import motherBaby from "@/assets/service-mother-baby.jpg";
import nursing from "@/assets/service-nursing.jpg";
import elderly from "@/assets/service-elderly.jpg";

export const Route = createFileRoute("/")({
  loader: async () => {
    const list = await fetchServices();
    return { services: list };
  },
  head: () => ({
    meta: [
      { title: "Amma Seva — Trusted Home Healthcare & Caregiving" },
      { name: "description", content: "Qualified nurses and compassionate caregivers for elderly care, mother & baby care, home nursing and more — delivered to your home." },
      { property: "og:title", content: "Amma Seva — Trusted Home Healthcare & Caregiving" },
      { property: "og:description", content: "Professional care with a mother's touch. Book trusted home nurses and caregivers." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "MedicalBusiness",
          name: "Amma Seva",
          description: "Professional home healthcare and caregiving services.",
          telephone: contact.PHONE,
          email: contact.EMAIL,
          slogan: "Professional Care with a Mother's Touch.",
          areaServed: "IN",
        }),
      },
    ],
  }),
  component: Home,
});

const IMAGE_BY_SLUG: Record<string, string> = {
  "mother-baby-care": motherBaby,
  "home-nursing": nursing,
  "elderly-care": elderly,
};

const WHY = [
  { icon: BadgeCheck, title: "Verified Professionals", desc: "Background-checked nurses and caregivers, trained and certified." },
  { icon: ShieldCheck, title: "Safe & Hygienic", desc: "Strict protocols for cleanliness, safety and patient dignity." },
  { icon: Clock, title: "On-time, Every Time", desc: "Punctual visits, transparent scheduling, and reliable staff." },
  { icon: HeartHandshake, title: "Compassion First", desc: "Care delivered with the warmth and patience of a mother." },
];

const STEPS = [
  { n: "01", t: "Tell us your need", d: "Share the type of care, location and schedule that works for you." },
  { n: "02", t: "Get matched", d: "We assign a verified nurse or caregiver suited to your requirement." },
  { n: "03", t: "Care at home", d: "Our professional arrives on time and begins care at your doorstep." },
  { n: "04", t: "Ongoing support", d: "Regular check-ins, easy rescheduling, and a helpline you can trust." },
];

const TESTIMONIALS = [
  { name: "Priya R.", role: "Daughter of a patient", quote: "The caregiver treated my mother like her own. Punctual, gentle and skilled — Amma Seva gave our family real peace of mind." },
  { name: "Rahul M.", role: "New father", quote: "Our newborn caregiver was a blessing. Calm, experienced and incredibly patient with both baby and us." },
  { name: "Dr. Anitha K.", role: "Physician", quote: "I recommend Amma Seva to my post-surgical patients — their nurses follow protocols with real professionalism." },
];

const FAQ = [
  { q: "Are your caregivers and nurses verified?", a: "Yes. Every professional undergoes ID verification, background checks, and skill assessments before joining." },
  { q: "How quickly can care be arranged?", a: "In most cities, we can arrange care within 4–12 hours depending on the service and shift." },
  { q: "Can I choose the shift duration?", a: "Absolutely. We offer hourly visits, 12-hour and 24-hour shifts, plus weekly and monthly plans." },
  { q: "How do payments work?", a: "You can pay online via UPI, cards, netbanking, or wallets. Cash after service may also be available." },
  { q: "What if I need to reschedule or cancel?", a: "You can reschedule anytime by contacting our helpline or via your account. Cancellations follow our refund policy." },
];

function Home() {
  const { services } = Route.useLoaderData();
  return (
    <SiteLayout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-20">
          <div className="flex flex-col justify-center">
            <span className="gold-rule text-xs font-semibold uppercase tracking-[0.2em] text-gold">Home Healthcare</span>
            <h1 className="mt-5 text-4xl font-semibold leading-tight text-primary sm:text-5xl lg:text-6xl">
              Professional Care with a <span className="text-gold italic">Mother&apos;s Touch.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">
              Trusted nurses and compassionate caregivers for elderly care, mothers, newborns and patients — delivered to the comfort of your home.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/contact" className="btn-primary">
                <Calendar className="h-5 w-5" /> Book a Service
              </Link>
              <a href={`tel:${contact.PHONE_TEL}`} className="btn-gold">
                <Phone className="h-5 w-5" /> Call Now
              </a>
            </div>
            <div className="mt-10 grid grid-cols-3 gap-6 border-t border-border pt-6">
              <Stat n="5,000+" l="Happy families" />
              <Stat n="500+" l="Verified staff" />
              <Stat n="24/7" l="Care helpline" />
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 rounded-3xl bg-accent/50 blur-2xl" aria-hidden />
            <div className="relative overflow-hidden rounded-3xl border border-border shadow-xl">
              <img src={hero} alt="Amma Seva nurse caring for elderly woman at home" width={1600} height={1000} className="h-full w-full object-cover" />
            </div>
            <div className="absolute -bottom-6 -left-6 hidden max-w-xs rounded-2xl border border-border bg-background p-5 shadow-lg sm:block">
              <div className="flex items-center gap-2 text-gold">
                {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
              </div>
              <p className="mt-2 text-sm text-foreground">“Punctual, gentle and skilled. Real peace of mind for our family.”</p>
              <p className="mt-2 text-xs text-muted-foreground">— Priya R.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="border-t border-border bg-cream/40">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="gold-rule text-xs font-semibold uppercase tracking-[0.2em] text-gold">Our Services</span>
            <h2 className="mt-4 text-3xl font-semibold text-primary sm:text-4xl">Care for every stage of life</h2>
            <p className="mt-3 text-muted-foreground">From newborns to seniors — comprehensive home healthcare tailored to your family.</p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.slice(0, 6).map((s: any) => {
              const imgSrc = s.image || IMAGE_BY_SLUG[s.slug];
              return (
                <Link
                  key={s.slug}
                  to="/services/$slug"
                  params={{ slug: s.slug }}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
                >
                  {imgSrc && (
                    <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                      <img 
                        src={imgSrc} 
                        alt={s.title} 
                        width={1200} 
                        height={900} 
                        loading="lazy" 
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" 
                      />
                    </div>
                  )}
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="text-xl font-semibold text-primary">{s.title}</h3>
                  <p className="mt-2 flex-1 text-sm text-muted-foreground">{s.short}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-gold">
                    Learn more <ChevronRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            )
          })}
          </div>
          <div className="mt-10 text-center">
            <Link to="/services" className="btn-outline">View all services</Link>
          </div>
        </div>
      </section>

      {/* Why choose */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="gold-rule text-xs font-semibold uppercase tracking-[0.2em] text-gold">Why Amma Seva</span>
            <h2 className="mt-4 text-3xl font-semibold text-primary sm:text-4xl">A promise your family can lean on</h2>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {WHY.map((w) => (
              <div key={w.title} className="rounded-2xl border border-border bg-background p-6 text-center shadow-sm">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent text-gold">
                  <w.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-primary">{w.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-border bg-cream/40">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="gold-rule text-xs font-semibold uppercase tracking-[0.2em] text-gold">How It Works</span>
            <h2 className="mt-4 text-3xl font-semibold text-primary sm:text-4xl">Care arranged in four simple steps</h2>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s) => (
              <div key={s.n} className="relative rounded-2xl border border-border bg-background p-6 shadow-sm">
                <div className="font-display text-4xl font-semibold text-gold">{s.n}</div>
                <h3 className="mt-2 text-lg font-semibold text-primary">{s.t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="gold-rule text-xs font-semibold uppercase tracking-[0.2em] text-gold">Testimonials</span>
            <h2 className="mt-4 text-3xl font-semibold text-primary sm:text-4xl">Loved by families across India</h2>
          </div>
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <figure key={t.name} className="rounded-2xl border border-border bg-background p-6 shadow-sm">
                <div className="flex gap-1 text-gold">
                  {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
                </div>
                <blockquote className="mt-4 text-foreground">“{t.quote}”</blockquote>
                <figcaption className="mt-6 text-sm">
                  <div className="font-semibold text-primary">{t.name}</div>
                  <div className="text-muted-foreground">{t.role}</div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-border bg-cream/40">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="gold-rule text-xs font-semibold uppercase tracking-[0.2em] text-gold">FAQs</span>
            <h2 className="mt-4 text-3xl font-semibold text-primary sm:text-4xl">Answers to common questions</h2>
          </div>
          <div className="mt-10 space-y-3">
            {FAQ.map((f) => (
              <details key={f.q} className="group rounded-xl border border-border bg-background p-5 open:shadow-md">
                <summary className="flex cursor-pointer list-none items-center justify-between text-base font-medium text-primary">
                  {f.q}
                  <ChevronRight className="h-5 w-5 text-gold transition-transform group-open:rotate-90" />
                </summary>
                <p className="mt-3 text-sm text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-border bg-primary p-10 text-center text-primary-foreground shadow-xl sm:p-14">
            <h2 className="text-3xl font-semibold sm:text-4xl">Ready to bring care home?</h2>
            <p className="mx-auto mt-3 max-w-2xl text-primary-foreground/80">
              Talk to our care team today. We&apos;ll help you find the right professional for your family — usually within hours.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <a href={`tel:${contact.PHONE_TEL}`} className="btn-gold">
                <Phone className="h-5 w-5" /> {contact.PHONE}
              </a>
              <Link to="/contact" className="inline-flex items-center justify-center gap-2 rounded-lg border border-primary-foreground/40 px-6 py-3 font-medium hover:bg-primary-foreground hover:text-primary">
                Book a Service
              </Link>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

function Stat({ n, l }: { n: string; l: string }) {
  return (
    <div>
      <div className="font-display text-2xl font-semibold text-primary sm:text-3xl">{n}</div>
      <div className="text-xs uppercase tracking-widest text-muted-foreground">{l}</div>
    </div>
  );
}
