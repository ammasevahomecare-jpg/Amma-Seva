import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { 
  ChevronRight, Sparkles, Search, ShieldCheck, Clock, CheckCircle2, 
  Phone, MessageCircle, Heart, Stethoscope, Car, Activity, Check, 
  ArrowRight, Filter, Calendar, Star
} from "lucide-react";
import { SiteLayout, contact } from "@/components/SiteLayout";
import { fetchServices, type Service } from "@/lib/services";
import motherBaby from "@/assets/service-mother-baby.jpg";
import nursing from "@/assets/service-nursing.jpg";
import elderly from "@/assets/service-elderly.jpg";

function getServiceDetails(slug: string) {
  const details: Record<string, { category: string; badgeClass: string; image: string; highlights: string[]; shiftType: string }> = {
    "elderly-care": {
      category: "Elderly Care",
      badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
      image: elderly,
      highlights: ["Mobility & Walking Support", "Timely Medication Reminder", "Personal Hygiene & Sponge Bath"],
      shiftType: "12h / 24h Shifts Available",
    },
    "mother-baby-care": {
      category: "Maternal & Newborn",
      badgeClass: "bg-rose-50 text-rose-800 border-rose-200",
      image: motherBaby,
      highlights: ["Postnatal Mother Healing", "Baby Massage & Bathing", "Night Feeding Supervision"],
      shiftType: "Day / Night / 24h Live-in",
    },
    "pregnancy-care": {
      category: "Prenatal Care",
      badgeClass: "bg-indigo-50 text-indigo-800 border-indigo-200",
      image: motherBaby,
      highlights: ["Pregnancy Diet & Nutrition", "Vitals & BP Monitoring", "Doctor Visit Companionship"],
      shiftType: "Custom Scheduled Shifts",
    },
    "newborn-baby-care": {
      category: "Pediatric Care",
      badgeClass: "bg-sky-50 text-sky-800 border-sky-200",
      image: motherBaby,
      highlights: ["Infant Hygiene & Sleep Routine", "Sterilization of Bottles", "24/7 Nursery Support"],
      shiftType: "12h / 24h Shifts Available",
    },
    "home-nursing": {
      category: "Clinical Nursing",
      badgeClass: "bg-cyan-50 text-cyan-800 border-cyan-200",
      image: nursing,
      highlights: ["IV / IM Injections & Drips", "Wound Dressing & Catheterization", "Vitals & Sugar Charting"],
      shiftType: "Visit / Hourly / 12h Shift",
    },
    "injection-services": {
      category: "Clinical Nursing",
      badgeClass: "bg-cyan-50 text-cyan-800 border-cyan-200",
      image: nursing,
      highlights: ["Sterile In-Home Administration", "Doctor Prescription Adherence", "Immediate Doorstep Dispatch"],
      shiftType: "Per Visit On-Demand",
    },
    "post-surgery-care": {
      category: "Recovery & Rehab",
      badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
      image: nursing,
      highlights: ["Surgical Wound Management", "Drain & Suture Monitoring", "Physical Rehab Alignment"],
      shiftType: "12h / 24h Dedicated Care",
    },
    "patient-care-attendant": {
      category: "Bedside Attendant",
      badgeClass: "bg-purple-50 text-purple-800 border-purple-200",
      image: elderly,
      highlights: ["Bed-to-Chair Transfers", "Assisted Feeding & Diaper Care", "Continuous Bedside Presence"],
      shiftType: "12h Day/Night or 24/7",
    },
    "bedridden-patient-care": {
      category: "Specialized Care",
      badgeClass: "bg-teal-50 text-teal-800 border-teal-200",
      image: elderly,
      highlights: ["Bed Sore Prevention & Turning", "Tube Feeding & Sponge Baths", "Comprehensive Dignity Care"],
      shiftType: "24/7 Full Time Live-in",
    },
    "icu-home-recovery": {
      category: "Intensive Care",
      badgeClass: "bg-red-50 text-red-800 border-red-200",
      image: nursing,
      highlights: ["Tracheostomy & BiPAP Handling", "Critical Vitals Logging", "ICU-Trained ANM/GNM Staff"],
      shiftType: "24/7 Clinical Shifts",
    },
    "physiotherapy": {
      category: "Therapy & Rehab",
      badgeClass: "bg-fuchsia-50 text-fuchsia-800 border-fuchsia-200",
      image: elderly,
      highlights: ["Stroke & Paralysis Recovery", "Geriatric Balance Training", "Custom Pain-Relief Exercises"],
      shiftType: "Hourly Therapy Sessions",
    },
    "doctor-consultation": {
      category: "Medical Consult",
      badgeClass: "bg-slate-50 text-slate-800 border-slate-200",
      image: nursing,
      highlights: ["Doorstep Physician Examination", "Comprehensive Diagnosis", "Prescription & Lab Review"],
      shiftType: "Home Visit by Appointment",
    },
  };
  return details[slug] || {
    category: "Specialized Care",
    badgeClass: "bg-teal-50 text-teal-800 border-teal-200",
    image: nursing,
    highlights: ["100% Background Verified", "Doctor Prescription Adherence", "24/7 Care Coordinator"],
    shiftType: "Flexible Hourly / Shift",
  };
}

export const Route = createFileRoute("/services/")({
  loader: async () => {
    const list = await fetchServices();
    return { services: list };
  },
  staleTime: 30000,
  head: () => ({
    meta: [
      { title: "Our Comprehensive Healthcare Services — Amma Seva" },
      { name: "description", content: "Explore Amma Seva's full range of verified home healthcare in Hyderabad — elderly care, mother & baby care, nursing, bedside attendants, post-surgery and on-demand MTP escorts." },
      { property: "og:title", content: "Our Services — Amma Seva Home Healthcare" },
      { property: "og:description", content: "Verified home nurses, patient attendants, and compassionate caregivers delivered to your home." },
      { property: "og:url", content: "/services" },
    ],
    links: [{ rel: "canonical", href: "/services" }],
  }),
  component: ServicesPage,
});

function ServicesPage() {
  const { services } = Route.useLoaderData();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = [
    { label: "✨ All Services", value: "All" },
    { label: "👴 Elderly & Senior Care", value: "Elderly" },
    { label: "🍼 Maternal & Newborn", value: "Maternal" },
    { label: "🩺 Clinical Nursing & ICU", value: "Clinical" },
    { label: "🧘 Therapy & Recovery", value: "Therapy" },
  ];

  const elderlySlugs = ["elderly-care", "patient-care-attendant", "bedridden-patient-care"];
  const maternalSlugs = ["mother-baby-care", "pregnancy-care", "newborn-baby-care"];
  const clinicalSlugs = ["home-nursing", "injection-services", "post-surgery-care", "icu-home-recovery", "doctor-consultation"];
  const therapySlugs = ["physiotherapy", "post-surgery-care"];

  const filteredServices = useMemo(() => {
    return services.filter((s: Service) => {
      // Category filter
      let matchesCat = true;
      if (selectedCategory === "Elderly") matchesCat = elderlySlugs.includes(s.slug);
      else if (selectedCategory === "Maternal") matchesCat = maternalSlugs.includes(s.slug);
      else if (selectedCategory === "Clinical") matchesCat = clinicalSlugs.includes(s.slug);
      else if (selectedCategory === "Therapy") matchesCat = therapySlugs.includes(s.slug);

      // Search query filter
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        s.title.toLowerCase().includes(q) || 
        s.short.toLowerCase().includes(q) ||
        (s.category && s.category.toLowerCase().includes(q));

      return matchesCat && matchesSearch;
    });
  }, [services, selectedCategory, searchQuery]);

  return (
    <SiteLayout>
      {/* ============================================================ */}
      {/* 1. HERO BANNER (ULTRA-PREMIUM & BRANDED)                     */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#f8faff] via-white to-slate-50/50 pt-8 pb-12 sm:pb-16 lg:pt-12 lg:pb-16 border-b border-slate-100 text-left">
        {/* Glowing ambient radial orbs */}
        <div className="absolute top-0 right-10 -z-10 h-96 w-96 rounded-full bg-gold/15 blur-[120px] pointer-events-none" />
        <div className="absolute top-10 left-0 -z-10 h-96 w-96 rounded-full bg-indigo-500/10 blur-[130px] pointer-events-none" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-4">
            
            {/* Pill Tag */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-gold/40 bg-gold/10 text-xs font-extrabold text-[#966b1a] uppercase tracking-wider shadow-xs backdrop-blur-xs">
              <Sparkles className="h-3.5 w-3.5 text-gold animate-pulse" />
              Verified In-Home Healthcare Services
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#1e2a5a] font-display tracking-tight leading-[1.12]">
              Clinical Excellence, <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#b3882f] via-[#c9a24c] to-[#966b1a] relative italic font-semibold">
                With a Mother&apos;s Touch.
              </span>
            </h1>

            {/* Description */}
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-medium">
              From continuous newborn nurturing and trained nursing procedures to dignified 24/7 elderly companions — explore our full suite of background-verified homecare services across Hyderabad.
            </p>

            {/* Key Trust Highlights Strip */}
            <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-bold text-slate-600">
              <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                <ShieldCheck className="h-4 w-4 text-emerald-600" /> 100% Background Verified
              </span>
              <span className="flex items-center gap-1.5 text-[#1e2a5a] bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                <Clock className="h-4 w-4 text-gold" /> 60-Minute Fast Dispatch
              </span>
              <span className="flex items-center gap-1.5 text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-200">
                <CheckCircle2 className="h-4 w-4 text-indigo-600" /> Zero Advance Required
              </span>
            </div>

          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 2. SEARCH & FILTER TOOLBAR                                   */}
      {/* ============================================================ */}
      <section className="sticky top-[76px] z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 py-4 shadow-xs">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all duration-200 cursor-pointer whitespace-nowrap ${
                    selectedCategory === cat.value
                      ? "bg-[#1e2a5a] text-white border-[#1e2a5a] shadow-md shadow-[#1e2a5a]/20 scale-[1.02]"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:border-gold hover:text-gold hover:bg-white"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Live Search Input */}
            <div className="relative w-full md:w-72 shrink-0">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search care service..."
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/80 outline-none focus:bg-white focus:border-[#c9a24c] focus:ring-2 focus:ring-gold/20 font-medium text-[#1e2a5a] transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 3. SERVICES CATALOG GRID                                     */}
      {/* ============================================================ */}
      <section className="py-12 sm:py-16 bg-slate-50/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          {/* Results Header Counter */}
          <div className="flex items-center justify-between mb-8 text-left">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Showing <span className="text-[#1e2a5a] font-extrabold">{filteredServices.length}</span> verified homecare options
            </div>
            {selectedCategory !== "All" && (
              <button
                onClick={() => {
                  setSelectedCategory("All");
                  setSearchQuery("");
                }}
                className="text-xs text-gold font-bold hover:underline cursor-pointer"
              >
                Reset All Filters
              </button>
            )}
          </div>

          {filteredServices.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500 space-y-4 max-w-lg mx-auto">
              <Search className="mx-auto h-12 w-12 text-slate-300" />
              <div className="font-display font-bold text-xl text-[#1e2a5a]">No Matching Services Found</div>
              <p className="text-xs text-slate-500">
                We couldn&apos;t find any service matching &quot;{searchQuery}&quot;. Please try a different term or contact our care desk directly.
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("All");
                }}
                className="px-5 py-2.5 rounded-xl bg-[#1e2a5a] text-white text-xs font-bold hover:bg-[#141d3e] transition-all cursor-pointer"
              >
                Clear Search Filter
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
              {filteredServices.map((s: Service) => {
                const details = getServiceDetails(s.slug);
                return (
                  <div
                    key={s.slug}
                    className="group flex flex-col overflow-hidden rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:shadow-2xl hover:border-gold/50 transition-all duration-300 hover:-translate-y-1.5 text-left"
                  >
                    {/* Card Image Container */}
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
                      <img 
                        src={details.image} 
                        alt={s.title} 
                        width={1200} 
                        height={800} 
                        loading="lazy" 
                        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-106" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      {/* Floating Price Badge */}
                      <div className="absolute top-3.5 right-3.5 bg-[#1e2a5a]/95 backdrop-blur-xs text-white px-3.5 py-1 rounded-xl text-xs font-bold shadow-md border border-white/20">
                        {s.price || "₹799 / Shift"}
                      </div>

                      {/* Verified Badge */}
                      <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-xs text-emerald-800 px-2.5 py-1 rounded-lg text-[10px] font-extrabold flex items-center gap-1 shadow-sm">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Verified Staff
                      </div>
                    </div>
                    
                    {/* Card Content */}
                    <div className="flex flex-1 flex-col p-6 justify-between space-y-5">
                      <div className="space-y-3">
                        
                        {/* Categories & Badges */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`inline-flex items-center rounded-lg px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider border ${details.badgeClass}`}>
                            {s.category || details.category}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                            {details.shiftType}
                          </span>
                        </div>

                        {/* Title */}
                        <Link
                          to="/services/$slug"
                          params={{ slug: s.slug }}
                          className="block text-xl font-bold text-[#1e2a5a] group-hover:text-gold transition-colors font-display leading-snug"
                        >
                          {s.title}
                        </Link>

                        {/* Short description */}
                        <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                          {s.short}
                        </p>

                        {/* Feature Checklist */}
                        <div className="pt-2 space-y-2 border-t border-slate-100">
                          {details.highlights.map((h, i) => (
                            <div key={i} className="flex items-center gap-2 text-[11px] text-slate-700 font-medium">
                              <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                              <span className="truncate">{h}</span>
                            </div>
                          ))}
                        </div>

                      </div>

                      {/* Action Button Row */}
                      <div className="pt-3 border-t border-slate-100 flex items-center gap-3">
                        <Link
                          to="/services/$slug"
                          params={{ slug: s.slug }}
                          className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-[#1e2a5a] hover:text-white text-[#1e2a5a] text-xs font-bold transition-all text-center"
                        >
                          View Details
                        </Link>
                        <Link
                          to="/contact"
                          className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#1e2a5a] via-[#283870] to-[#1e2a5a] hover:from-[#151e42] hover:to-[#223068] text-white text-xs font-bold transition-all text-center shadow-md shadow-[#1e2a5a]/20 flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <span>Book Now</span>
                          <ChevronRight className="h-3.5 w-3.5 text-gold" />
                        </Link>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </section>

      {/* ============================================================ */}
      {/* 4. MTP ON-DEMAND CARE BANNER                                */}
      {/* ============================================================ */}
      <section className="py-12 bg-gradient-to-r from-[#0d1427] via-[#101b38] to-[#1e2a5a] text-white text-left relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-gold/10 blur-[130px] pointer-events-none" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 rounded-3xl bg-white/[0.06] border border-white/15 backdrop-blur-md p-8 sm:p-10 shadow-xl">
            <div className="space-y-3 max-w-2xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/20 text-[#edd392] text-xs font-bold border border-gold/30">
                <Car className="h-3.5 w-3.5 text-gold" /> Need Flexible Dropping or Errands?
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold font-display leading-tight">
                MTP (Multi-Tasking Professionals) On-Demand Task Force
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                Book hourly hospital escorts, urgent prescription medicine deliveries, senior walking companions, and newborn nursery helpers across Hyderabad.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 shrink-0">
              <Link
                to="/mtp"
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#c9a24c] to-[#b38938] hover:from-[#b38938] hover:to-[#966b1a] text-[#0d1427] font-extrabold text-xs shadow-xl shadow-gold/20 hover:scale-102 transition-all flex items-center gap-2"
              >
                <Car className="h-4 w-4" />
                <span>Explore MTP Services</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 5. 24/7 HELPLINE & CONSULTATION DESK                         */}
      {/* ============================================================ */}
      <section className="py-14 sm:py-16 bg-white text-left border-t border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-gradient-to-r from-[#1e2a5a] via-[#24346e] to-[#1e2a5a] text-white p-8 sm:p-12 shadow-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative overflow-hidden">
            <div className="space-y-3 max-w-2xl relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                </span>
                24/7 Care Coordinator Standing By
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-display leading-tight">
                Need Help Choosing the Right Home Caregiver?
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                Our clinical supervisors provide free telephone guidance to help match your patient with the ideal nurse or attendant.
              </p>
            </div>

            <div className="flex flex-wrap gap-3.5 shrink-0 relative z-10">
              <a
                href={`tel:${contact.PHONE_TEL}`}
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#c9a24c] to-[#b38938] hover:from-[#b38938] hover:to-[#966b1a] text-[#0d1427] font-extrabold text-sm shadow-xl shadow-gold/20 hover:scale-102 transition-all flex items-center gap-2"
              >
                <Phone className="h-4 w-4" />
                <span>Call +91 94945 16543</span>
              </a>

              <a
                href={`https://wa.me/${contact.WHATSAPP}?text=Hello%20Amma%20Seva%2C%20I%20need%20assistance%20choosing%20a%20caregiver`}
                target="_blank"
                rel="noreferrer"
                className="px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-xl shadow-emerald-950/20 hover:scale-102 transition-all flex items-center gap-2"
              >
                <MessageCircle className="h-4 w-4" />
                <span>WhatsApp Care Desk</span>
              </a>
            </div>
          </div>
        </div>
      </section>

    </SiteLayout>
  );
}
