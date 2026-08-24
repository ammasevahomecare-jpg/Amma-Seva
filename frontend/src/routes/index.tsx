import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { Phone, Calendar, ShieldCheck, HeartHandshake, Clock, BadgeCheck, Star, ChevronRight, ChevronLeft } from "lucide-react";
import { SiteLayout, contact } from "@/components/SiteLayout";
import { fetchServices } from "@/lib/services";
import { fetchFaqs } from "@/lib/faqs";
import hero from "@/assets/hero-care.jpg";
import motherBaby from "@/assets/service-mother-baby.jpg";
import nursing from "@/assets/service-nursing.jpg";
import elderly from "@/assets/service-elderly.jpg";

const HERO_IMAGES = [hero, motherBaby, nursing, elderly];

export const Route = createFileRoute("/")({
  loader: async () => {
    const services = await fetchServices();
    const faqs = await fetchFaqs();
    return { services, faqs };
  },
  staleTime: 30000,
  head: () => ({
    meta: [
      { title: "Amma Seva — Trusted Home Healthcare & Caregiving" },
      { name: "description", content: "Qualified nurses and compassionate caregivers for elderly care, mother & baby care, home nursing and more — delivered to your home." },
      { property: "og:title", content: "Amma Seva — Trusted Home Healthcare & Caregiving" },
      { property: "og:description", content: "Professional care with a mother's touch. Book trusted home nurses and caregivers." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
    ],
  }),
  component: Home,
});

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

function Home() {
  const { services, faqs } = Route.useLoaderData();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedTag, setSelectedTag] = useState("All");
  const carouselRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (carouselRef.current) {
      const card = carouselRef.current.firstElementChild as HTMLElement;
      const width = card ? card.offsetWidth + 24 : 320;
      carouselRef.current.scrollBy({ left: -width, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (carouselRef.current) {
      const card = carouselRef.current.firstElementChild as HTMLElement;
      const width = card ? card.offsetWidth + 24 : 320;
      carouselRef.current.scrollBy({ left: width, behavior: "smooth" });
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <SiteLayout>
      {/* Hero with dynamic premium styling */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#fbfbfe] to-white pb-6">
        {/* Floating background graphic elements */}
        <div className="absolute top-0 right-0 -z-10 h-96 w-96 rounded-full bg-gold/5 blur-3xl opacity-60" />
        <div className="absolute top-20 left-10 -z-10 h-80 w-80 rounded-full bg-primary/5 blur-3xl opacity-60" />

        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-4 sm:px-6 lg:grid-cols-2 lg:gap-8 lg:px-8 lg:py-10">
          <div className="flex flex-col justify-center text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/5 px-3 py-1 text-[11px] font-bold text-gold tracking-wider uppercase mb-3 max-w-fit">
              ✨ Hyderabad&apos;s Trusted Professional Care Network
            </div>
            <h1 className="text-4xl font-extrabold leading-tight text-primary sm:text-5xl lg:text-6xl font-display">
              Professional Care <br className="hidden sm:inline" />
              with a <span className="text-gold italic font-medium relative">Mother&apos;s Touch.</span>
            </h1>
            <p className="mt-3 max-w-xl text-lg text-slate-500 leading-relaxed">
              Qualified nurses and compassionate caregivers for elderly care, mothers, newborns, and patients — delivered to the comfort of your home.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link to="/contact" className="btn-primary shadow-lg shadow-primary/20 hover:shadow-xl transition-all">
                <Calendar className="h-5 w-5" /> Book a Service
              </Link>
              <a href={`tel:${contact.PHONE_TEL}`} className="btn-gold shadow-lg shadow-gold/20 hover:shadow-xl transition-all">
                <Phone className="h-5 w-5" /> Call Now
              </a>
            </div>
            <div className="mt-8 grid grid-cols-3 gap-6 border-t border-slate-100 pt-6">
              <Stat n="5,000+" l="Happy families" />
              <Stat n="500+" l="Verified staff" />
              <Stat n="24/7" l="Care helpline" />
            </div>
          </div>
          <div className="relative flex items-center justify-center lg:pl-4">
            <div className="absolute -inset-4 rounded-3xl bg-gold/5 blur-2xl" aria-hidden />
            <div className="relative overflow-hidden rounded-[2.5rem] border border-slate-200/60 shadow-2xl aspect-[16/10] w-full bg-slate-50">
              {HERO_IMAGES.map((imgSrc, idx) => (
                <img
                  key={imgSrc}
                  src={imgSrc}
                  alt="Amma Seva home nursing"
                  width={1600}
                  height={1000}
                  className={`absolute inset-0 h-full w-full object-cover transition-all duration-1000 ease-in-out hover:scale-103 ${
                    idx === currentImageIndex ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
                  }`}
                />
              ))}
              <div className="absolute inset-0 bg-gradient-to-t from-primary/10 via-transparent to-transparent" />
            </div>
            {/* Premium Floating Card */}
            <div className="absolute -bottom-6 -left-2 sm:-left-6 max-w-[280px] sm:max-w-xs rounded-2xl border border-white/40 bg-white/80 backdrop-blur-md p-5 shadow-2xl z-10 text-left transition-transform hover:scale-102 duration-300 hidden sm:block">
              <div className="flex items-center gap-1.5 text-gold">
                {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
              </div>
              <p className="mt-2.5 text-sm font-semibold text-primary leading-relaxed">
                “Punctual, gentle, and highly skilled caregivers. Real peace of mind for our parents.”
              </p>
              <p className="mt-2 text-xs font-bold text-slate-400 uppercase tracking-wider">— Priya R.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="border-t border-slate-100 bg-cream/35 py-6 sm:py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl text-left mb-6 sm:mb-8">
            <h2 className="gold-rule text-3xl font-extrabold text-primary sm:text-4xl font-display">Our Services</h2>
            <h4 className="mt-2 text-lg font-semibold text-slate-600 font-display">Care for every stage of life</h4>
            <p className="mt-1 text-slate-500 text-sm leading-relaxed">From newborns to seniors — comprehensive home healthcare tailored to your family.</p>
          </div>

          {/* Smart Symptom & Care Matcher Tags */}
          <div className="flex flex-wrap gap-2.5 mb-6 text-left">
            {[
              { label: "✨ All Services", value: "All" },
              { label: "👴 Elderly Support", value: "Elderly" },
              { label: "🍼 Maternal & Newborn", value: "Maternal" },
              { label: "🩺 Clinical & Recovery", value: "Clinical" },
            ].map((tag) => (
              <button
                key={tag.value}
                onClick={() => setSelectedTag(tag.value)}
                className={`px-4 py-2 text-xs font-bold rounded-full border transition-all duration-300 cursor-pointer ${
                  selectedTag === tag.value
                    ? "bg-primary text-white border-primary shadow-sm shadow-primary/20 scale-102 font-sans"
                    : "bg-white text-slate-600 border-slate-200 hover:border-gold hover:text-gold font-sans"
                }`}
              >
                {tag.label}
              </button>
            ))}
          </div>
          
          <div className="relative group/carousel px-1">
            {/* Left Scroll Navigation Button */}
            <button
              onClick={scrollLeft}
              className="absolute -left-2.5 sm:-left-4 top-1/2 -translate-y-1/2 z-20 bg-white/95 text-primary p-2 sm:p-3 rounded-full shadow-lg border border-slate-200/50 hover:text-gold transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover/carousel:opacity-100 focus:opacity-100"
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            {/* Scroll snap flex container */}
            <div
              ref={carouselRef}
              className="flex gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-6"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {(() => {
                const elderlySlugs = ["elderly-care", "patient-care-attendant", "bedridden-patient-care", "physiotherapy"];
                const maternalSlugs = ["mother-baby-care", "pregnancy-care", "newborn-baby-care"];
                const clinicalSlugs = ["home-nursing", "injection-services", "post-surgery-care", "icu-home-recovery", "doctor-consultation"];

                const filteredServices = services.filter((s: any) => {
                  if (selectedTag === "All") return true;
                  if (selectedTag === "Elderly") return elderlySlugs.includes(s.slug);
                  if (selectedTag === "Maternal") return maternalSlugs.includes(s.slug);
                  if (selectedTag === "Clinical") return clinicalSlugs.includes(s.slug);
                  return true;
                });

                return filteredServices.map((s: any) => {
                  const details = getServiceDetails(s.slug);
                  return (
                  <div
                    key={s.slug}
                    className="carousel-card premium-card snap-start snap-always group/card flex flex-col overflow-hidden rounded-3xl bg-background shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-1.5"
                  >
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 block">
                      <img 
                        src={details.image} 
                        alt={s.title} 
                        width={1200} 
                        height={900} 
                        loading="lazy" 
                        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover/card:scale-108" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-primary/50 via-transparent to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-500" />
                      
                      {/* Floating Price Badge */}
                      <div className="absolute top-4 right-4 bg-primary/95 backdrop-blur-sm text-white px-3.5 py-1 rounded-xl text-xs font-bold shadow-md border border-white/10">
                        {s.price}
                      </div>
                    </div>
                    
                    <div className="flex flex-1 flex-col p-5 text-left">
                      <div className="flex">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider border ${details.badgeClass}`}>
                          {s.category || details.category}
                        </span>
                      </div>
                      <Link
                        to="/services/$slug"
                        params={{ slug: s.slug }}
                        className="mt-2 block text-lg font-bold text-primary hover:text-gold transition-colors duration-300 font-display"
                      >
                        {s.title}
                      </Link>
                      <p className="mt-1.5 flex-1 text-sm text-slate-500 leading-relaxed line-clamp-3">
                        {s.short}
                      </p>
                      <Link
                        to="/services/$slug"
                        params={{ slug: s.slug }}
                        className="mt-4 w-full btn-primary text-sm font-bold flex items-center justify-center gap-1.5 shadow-sm shadow-primary/10 group-hover/card:shadow-md transition-all duration-300"
                      >
                        View Details <ChevronRight className="h-4 w-4 transition-transform group-hover/card:translate-x-0.5" />
                      </Link>
                    </div>
                  </div>
                  );
                });
              })()}
            </div>

            {/* Right Scroll Navigation Button */}
            <button
              onClick={scrollRight}
              className="absolute -right-2.5 sm:-right-4 top-1/2 -translate-y-1/2 z-20 bg-white/95 text-primary p-2 sm:p-3 rounded-full shadow-lg border border-slate-200/50 hover:text-gold transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover/carousel:opacity-100 focus:opacity-100"
              aria-label="Scroll right"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          
          <div className="mt-4 text-center">
            <Link to="/services" className="btn-outline px-8 py-2.5">View all services</Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="border-t border-slate-100 py-6 sm:py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl text-left mb-6">
            <h2 className="gold-rule text-3xl font-extrabold text-primary sm:text-4xl font-display">Why Amma Seva</h2>
            <h4 className="mt-2 text-lg font-semibold text-slate-600 font-display">A promise your family can lean on</h4>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {WHY.map((w) => (
              <div key={w.title} className="group rounded-3xl premium-card bg-background p-5 text-left shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/10 text-gold transition-all duration-500 group-hover:bg-primary group-hover:text-white group-hover:rotate-3 shadow-inner">
                  <w.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-3 text-lg font-bold text-primary font-display">{w.title}</h3>
                <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-slate-100 bg-cream/35 py-6 sm:py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl text-left mb-6">
            <h2 className="gold-rule text-3xl font-extrabold text-primary sm:text-4xl font-display">How It Works</h2>
            <h4 className="mt-2 text-lg font-semibold text-slate-600 font-display">Care arranged in four simple steps</h4>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s) => (
              <div key={s.n} className="relative rounded-3xl premium-card bg-background p-5 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1 text-left">
                <div className="absolute top-4 right-6 font-display text-5xl font-extrabold text-gold/15 select-none">{s.n}</div>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-white font-bold text-sm shadow-sm">{s.n}</div>
                <h3 className="mt-3 text-lg font-bold text-primary font-display">{s.t}</h3>
                <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-t border-slate-100 py-6 sm:py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl text-left mb-6">
            <h2 className="gold-rule text-3xl font-extrabold text-primary sm:text-4xl font-display">Testimonials</h2>
            <h4 className="mt-2 text-lg font-semibold text-slate-600 font-display">Loved by families across India</h4>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <figure key={t.name} className="relative rounded-3xl premium-card bg-background p-5 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1 flex flex-col justify-between text-left">
                <div>
                  <div className="flex gap-1 text-gold">
                    {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
                  </div>
                  <blockquote className="mt-3 text-slate-600 leading-relaxed italic">“{t.quote}”</blockquote>
                </div>
                <figcaption className="mt-4 flex items-center gap-3.5 border-t border-slate-100 pt-3">
                  <div className="h-8 w-8 rounded-full bg-gold/10 flex items-center justify-center font-bold text-gold text-xs border border-gold/20 uppercase shrink-0">
                    {t.name[0]}
                  </div>
                  <div className="text-sm">
                    <div className="font-bold text-primary font-display">{t.name}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{t.role}</div>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-slate-100 bg-cream/35 py-6 sm:py-8">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl text-left mb-6">
            <h2 className="gold-rule text-3xl font-extrabold text-primary sm:text-4xl font-display">FAQs</h2>
            <h4 className="mt-2 text-lg font-semibold text-slate-600 font-display">Answers to common questions</h4>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-2 items-start text-left">
            {faqs.map((f: any) => (
              <details key={f.id} className="group rounded-2xl border border-slate-200/60 bg-background p-4 hover:border-gold/50 transition-all duration-300 open:border-gold open:shadow-md hover:shadow-sm">
                <summary className="flex cursor-pointer list-none items-center justify-between text-base font-bold text-primary transition-colors group-open:text-gold select-none outline-none">
                  <span>{f.question}</span>
                  <ChevronRight className="h-5 w-5 text-gold/70 transition-transform group-open:rotate-90 group-open:text-gold shrink-0" />
                </summary>
                <div className="mt-2 text-sm text-slate-600 leading-relaxed pl-3 border-l-2 border-gold/30">
                  {f.answer}
                </div>
              </details>
            ))}
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
