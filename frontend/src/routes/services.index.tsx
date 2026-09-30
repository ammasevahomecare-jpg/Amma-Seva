import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { 
  ChevronRight, Sparkles, Search, ShieldCheck, Clock, CheckCircle2, 
  Phone, MessageCircle, Heart, Stethoscope, Car, Activity, Check, 
  ArrowRight, Filter, Calendar, Star
} from "lucide-react";
import { SiteLayout, contact } from "@/components/SiteLayout";
import { fetchServices, type Service } from "@/lib/services";
import { validateName, validatePhone, sanitizeIndianPhone, sanitizeName } from "@/lib/validation";
import motherBaby from "@/assets/service-mother-baby.jpg";
import nursing from "@/assets/service-nursing.jpg";
import elderly from "@/assets/service-elderly.jpg";
import physio from "@/assets/service-physiotherapy.jpg";
import icu from "@/assets/service-icu-recovery.jpg";
import attendant from "@/assets/service-bedside-attendant.jpg";
import doctor from "@/assets/service-doctor.jpg";
import mtp from "@/assets/service-mtp.jpg";
import heroCare from "@/assets/hero-care.jpg";

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
      badgeClass: "bg-blue-50 text-blue-800 border-blue-200",
      image: nursing,
      highlights: ["IV Cannula & Injections", "Bed Sore & Surgical Dressing", "Continuous Vital Parameter Log"],
      shiftType: "Shift / 24h Full-Day",
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
      image: icu,
      highlights: ["Surgical Wound Management", "Drain & Suture Monitoring", "Physical Rehab Alignment"],
      shiftType: "12h / 24h Dedicated Care",
    },
    "patient-care-attendant": {
      category: "Bedside Attendant",
      badgeClass: "bg-purple-50 text-purple-800 border-purple-200",
      image: attendant,
      highlights: ["Bed-to-Chair Transfers", "Assisted Feeding & Diaper Care", "Continuous Bedside Presence"],
      shiftType: "12h Day/Night or 24/7",
    },
    "bedridden-patient-care": {
      category: "Specialized Care",
      badgeClass: "bg-teal-50 text-teal-800 border-teal-200",
      image: attendant,
      highlights: ["Bed Sore Prevention & Turning", "Tube Feeding & Sponge Baths", "Comprehensive Dignity Care"],
      shiftType: "24/7 Full Time Live-in",
    },
    "icu-home-recovery": {
      category: "Intensive Care",
      badgeClass: "bg-red-50 text-red-800 border-red-200",
      image: icu,
      highlights: ["Tracheostomy & BiPAP Handling", "Critical Vitals Logging", "ICU-Trained ANM/GNM Staff"],
      shiftType: "24/7 Clinical Shifts",
    },
    "physiotherapy": {
      category: "Therapy & Rehab",
      badgeClass: "bg-fuchsia-50 text-fuchsia-800 border-fuchsia-200",
      image: physio,
      highlights: ["Stroke & Paralysis Recovery", "Geriatric Balance Training", "Custom Pain-Relief Exercises"],
      shiftType: "Hourly Therapy Sessions",
    },
    "doctor-consultation": {
      category: "Medical Consult",
      badgeClass: "bg-slate-50 text-slate-800 border-slate-200",
      image: doctor,
      highlights: ["Doorstep Physician Examination", "Comprehensive Diagnosis", "Prescription & Lab Review"],
      shiftType: "Home Visit by Appointment",
    },
    "mtp": {
      category: "Medical Transport",
      badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
      image: mtp,
      highlights: ["Wheelchair & Stretcher Transit", "Paramedic Escort Onboard", "Zero Surge Pricing"],
      shiftType: "On-Demand Dispatch",
    },
  };
  return details[slug] || {
    category: "Specialized Care",
    badgeClass: "bg-teal-50 text-teal-800 border-teal-200",
    image: nursing,
    highlights: ["100% Background Verified", "Doctor Prescription Adherence", "24/7 Care Coordinator"],
    shiftType: "Flexible Shifts",
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

  // Direct Care Booking Form State (Services Page)
  const [formService, setFormService] = useState("Elderly Care");
  const [formPatientName, setFormPatientName] = useState("");
  const [formPatientAge, setFormPatientAge] = useState("");
  const [formBookerName, setFormBookerName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formShift, setFormShift] = useState("12h Day Shift");
  const [formCity, setFormCity] = useState("Hyderabad");
  const [formAddress, setFormAddress] = useState("");
  const [formNeeds, setFormNeeds] = useState("");
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [formSuccessData, setFormSuccessData] = useState<any | null>(null);

  const handleDirectServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const bookerErr = validateName(formBookerName, "Your name / Contact person");
    if (bookerErr) {
      alert(bookerErr);
      return;
    }

    const phoneErr = validatePhone(formPhone, "Mobile number");
    if (phoneErr) {
      alert(phoneErr);
      return;
    }

    const cleanPhone = sanitizeIndianPhone(formPhone);

    setIsSubmittingForm(true);
    try {
      const res = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formBookerName.trim(),
          phone: cleanPhone,
          email: formEmail.trim(),
          service: `${formService} (${formShift})`,
          date: formDate || new Date().toISOString().split("T")[0],
          city: formCity || "Hyderabad",
          message: `Patient: ${formPatientName || 'Self / Family'} (Age: ${formPatientAge || 'N/A'}) | Address: ${formAddress || 'Hyderabad'} | Specific Care Requirements: ${formNeeds || 'Standard Home Healthcare'}`
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setFormSuccessData({
          name: formBookerName,
          phone: cleanPhone,
          service: formService,
          shift: formShift,
          date: formDate || "Immediate / Flexible",
          id: data.data?.id || Math.floor(1000 + Math.random() * 9000)
        });
        setFormPatientName("");
        setFormPatientAge("");
        setFormBookerName("");
        setFormPhone("");
        setFormEmail("");
        setFormAddress("");
        setFormNeeds("");
      } else {
        alert(data.error || "Failed to submit booking request. Please call our 24/7 care helpline.");
      }
    } catch (err: any) {
      alert("Network error: " + (err.message || "Please check your connection and try again."));
    } finally {
      setIsSubmittingForm(false);
    }
  };

  const categories = [
    { label: "✨ All Services", value: "All" },
    { label: "🚗 MTP & Companion Tasks", value: "MTP" },
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
      if (selectedCategory === "MTP") {
        matchesCat = Boolean(s.isMtp || s.slug.startsWith("mtp") || (s.category && s.category.toLowerCase().includes("mtp")));
      } else if (selectedCategory === "Elderly") {
        matchesCat = Boolean(elderlySlugs.includes(s.slug) || (s.category && s.category.toLowerCase().includes("elderly")));
      } else if (selectedCategory === "Maternal") {
        matchesCat = Boolean(maternalSlugs.includes(s.slug) || (s.category && s.category.toLowerCase().includes("maternal")));
      } else if (selectedCategory === "Clinical") {
        matchesCat = Boolean(clinicalSlugs.includes(s.slug) || (s.category && s.category.toLowerCase().includes("clinical")));
      } else if (selectedCategory === "Therapy") {
        matchesCat = Boolean(therapySlugs.includes(s.slug) || (s.category && s.category.toLowerCase().includes("therapy")));
      }

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
      <section className="relative overflow-hidden bg-gradient-to-b from-[#f8faff] via-white to-slate-50/50 py-8 sm:py-10 border-b border-slate-100 text-left">
        {/* Glowing ambient radial orbs */}
        <div className="absolute top-0 right-10 -z-10 h-96 w-96 rounded-full bg-gold/15 blur-[120px] pointer-events-none" />
        <div className="absolute top-10 left-0 -z-10 h-96 w-96 rounded-full bg-indigo-500/10 blur-[130px] pointer-events-none" />

        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Column: Heading, Badges */}
            <div className="lg:col-span-7 space-y-4">
              
              {/* Pill Tag */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-gold/40 bg-gold/10 text-xs font-extrabold text-[#966b1a] uppercase tracking-wider shadow-xs backdrop-blur-xs">
                <Sparkles className="h-3.5 w-3.5 text-gold animate-pulse" />
                Verified In-Home Healthcare Services
              </div>

              {/* Headline */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#1e2a5a] font-display tracking-tight leading-[1.25] sm:leading-[1.2]">
                <span className="block">Clinical Excellence,</span>
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#b3882f] via-[#c9a24c] to-[#966b1a] italic font-semibold mt-1">
                  With a Mother&apos;s Touch.
                </span>
              </h1>

              {/* Description */}
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-medium pt-1">
                From continuous newborn nurturing and trained nursing procedures to dignified 24/7 elderly companions — explore our full suite of background-verified homecare services across Hyderabad.
              </p>

              {/* Key Trust Highlights Strip */}
              <div className="pt-2 flex flex-wrap items-center gap-3 text-xs font-bold text-slate-600">
                <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 shadow-2xs">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" /> 100% Background Verified
                </span>
                <span className="flex items-center gap-1.5 text-[#1e2a5a] bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                  <Clock className="h-4 w-4 text-gold" /> 60-Minute Fast Dispatch
                </span>
                <span className="flex items-center gap-1.5 text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-200 shadow-2xs">
                  <CheckCircle2 className="h-4 w-4 text-indigo-600" /> Zero Advance Required
                </span>
              </div>

            </div>

            {/* Right Column: Hexagonal / Honeycomb Service Mosaic (Interactive Small Blocks) */}
            <div className="lg:col-span-5 relative flex flex-col items-center lg:items-end justify-center pt-6 lg:pt-0">
              <div className="relative w-full max-w-[480px] flex flex-col items-center">
                
                {/* Background ambient gold & sapphire glow */}
                <div className="absolute -inset-4 bg-gradient-to-tr from-gold/20 via-indigo-500/15 to-emerald-500/10 rounded-full blur-3xl -z-10 opacity-70 pointer-events-none" />

                {/* Floating Top Trust Badge */}
                <div className="mb-3 inline-flex items-center gap-2 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-md border border-slate-200/80 text-left">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <span className="text-[11px] font-extrabold text-[#1e2a5a]">Verified Specialists & Care Units</span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    Hyderabad
                  </span>
                </div>

                {/* HONEYCOMB / HEXAGONAL MESH (4-5-4-3 STAGGERED GRID) */}
                <div className="relative flex flex-col items-center py-2 select-none">
                  
                  {/* ROW 1: 4 Hexagons */}
                  <div className="flex justify-center items-center gap-2 sm:gap-2.5 relative z-10">
                    {/* 1. Mother & Baby */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory("Maternal");
                        document.getElementById("services-catalog")?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="group/hex relative w-15 h-17 sm:w-18 sm:h-21 lg:w-20 lg:h-23 bg-[#10b981] p-[2.5px] sm:p-[3px] cursor-pointer transition-all duration-300 hover:scale-115 hover:z-30 hover:shadow-xl"
                      style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                      title="Mother & Baby Care"
                    >
                      <div className="w-full h-full bg-slate-900 overflow-hidden relative" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
                        <img src={motherBaby} alt="Mother & Baby Care" className="w-full h-full object-cover group-hover/hex:scale-125 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-40 group-hover/hex:opacity-0 transition-opacity" />
                      </div>
                    </button>

                    {/* 2. Home Nursing */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory("Clinical");
                        document.getElementById("services-catalog")?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="group/hex relative w-15 h-17 sm:w-18 sm:h-21 lg:w-20 lg:h-23 bg-[#8b5cf6] p-[2.5px] sm:p-[3px] cursor-pointer transition-all duration-300 hover:scale-115 hover:z-30 hover:shadow-xl"
                      style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                      title="Home Nursing"
                    >
                      <div className="w-full h-full bg-slate-900 overflow-hidden relative" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
                        <img src={nursing} alt="Clinical Nursing" className="w-full h-full object-cover group-hover/hex:scale-125 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-40 group-hover/hex:opacity-0 transition-opacity" />
                      </div>
                    </button>

                    {/* 3. Elderly Care */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory("Elderly");
                        document.getElementById("services-catalog")?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="group/hex relative w-15 h-17 sm:w-18 sm:h-21 lg:w-20 lg:h-23 bg-[#f97316] p-[2.5px] sm:p-[3px] cursor-pointer transition-all duration-300 hover:scale-115 hover:z-30 hover:shadow-xl"
                      style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                      title="Elderly Care"
                    >
                      <div className="w-full h-full bg-slate-900 overflow-hidden relative" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
                        <img src={elderly} alt="Elderly Care" className="w-full h-full object-cover group-hover/hex:scale-125 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-40 group-hover/hex:opacity-0 transition-opacity" />
                      </div>
                    </button>

                    {/* 4. Physiotherapy */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory("Therapy");
                        document.getElementById("services-catalog")?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="group/hex relative w-15 h-17 sm:w-18 sm:h-21 lg:w-20 lg:h-23 bg-[#0284c7] p-[2.5px] sm:p-[3px] cursor-pointer transition-all duration-300 hover:scale-115 hover:z-30 hover:shadow-xl"
                      style={{ clipPath: 'polygon(50% 0%, 100% 25% 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                      title="Physiotherapy"
                    >
                      <div className="w-full h-full bg-slate-900 overflow-hidden relative" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
                        <img src={physio} alt="Physiotherapy" className="w-full h-full object-cover group-hover/hex:scale-125 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-40 group-hover/hex:opacity-0 transition-opacity" />
                      </div>
                    </button>
                  </div>

                  {/* ROW 2: 5 Hexagons (Shifted by 1/2 width to nest between Row 1) */}
                  <div className="flex justify-center items-center gap-2 sm:gap-2.5 -mt-3 sm:-mt-4 lg:-mt-4.5 relative z-20">
                    {/* 5. ICU Recovery */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory("Clinical");
                        document.getElementById("services-catalog")?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="group/hex relative w-15 h-17 sm:w-18 sm:h-21 lg:w-20 lg:h-23 bg-[#db2777] p-[2.5px] sm:p-[3px] cursor-pointer transition-all duration-300 hover:scale-115 hover:z-30 hover:shadow-xl"
                      style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                      title="ICU Recovery"
                    >
                      <div className="w-full h-full bg-slate-900 overflow-hidden relative" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
                        <img src={icu} alt="ICU Care" className="w-full h-full object-cover group-hover/hex:scale-125 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-40 group-hover/hex:opacity-0 transition-opacity" />
                      </div>
                    </button>

                    {/* 6. Doctor Consultation */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory("Clinical");
                        document.getElementById("services-catalog")?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="group/hex relative w-15 h-17 sm:w-18 sm:h-21 lg:w-20 lg:h-23 bg-[#059669] p-[2.5px] sm:p-[3px] cursor-pointer transition-all duration-300 hover:scale-115 hover:z-30 hover:shadow-xl"
                      style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                      title="Doctor Consultation"
                    >
                      <div className="w-full h-full bg-slate-900 overflow-hidden relative" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
                        <img src={doctor} alt="Doctor Consult" className="w-full h-full object-cover group-hover/hex:scale-125 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-40 group-hover/hex:opacity-0 transition-opacity" />
                      </div>
                    </button>

                    {/* 7. Center Clinical Hero */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory("Clinical");
                        document.getElementById("services-catalog")?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="group/hex relative w-15 h-17 sm:w-18 sm:h-21 lg:w-20 lg:h-23 bg-[#e11d48] p-[2.5px] sm:p-[3px] cursor-pointer transition-all duration-300 hover:scale-115 hover:z-30 hover:shadow-xl"
                      style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                      title="Clinical Homecare & Vitals"
                    >
                      <div className="w-full h-full bg-slate-900 overflow-hidden relative" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
                        <img src={heroCare} alt="Clinical Homecare" className="w-full h-full object-cover group-hover/hex:scale-125 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-40 group-hover/hex:opacity-0 transition-opacity" />
                      </div>
                    </button>

                    {/* 8. MTP Escort */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory("MTP");
                        document.getElementById("services-catalog")?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="group/hex relative w-15 h-17 sm:w-18 sm:h-21 lg:w-20 lg:h-23 bg-[#0f766e] p-[2.5px] sm:p-[3px] cursor-pointer transition-all duration-300 hover:scale-115 hover:z-30 hover:shadow-xl"
                      style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                      title="MTP Transit Companion"
                    >
                      <div className="w-full h-full bg-slate-900 overflow-hidden relative" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
                        <img src={mtp} alt="MTP Companion" className="w-full h-full object-cover group-hover/hex:scale-125 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-40 group-hover/hex:opacity-0 transition-opacity" />
                      </div>
                    </button>

                    {/* 9. Bedside Attendant */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory("Elderly");
                        document.getElementById("services-catalog")?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="group/hex relative w-15 h-17 sm:w-18 sm:h-21 lg:w-20 lg:h-23 bg-[#0d9488] p-[2.5px] sm:p-[3px] cursor-pointer transition-all duration-300 hover:scale-115 hover:z-30 hover:shadow-xl"
                      style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                      title="Bedside Patient Attendant"
                    >
                      <div className="w-full h-full bg-slate-900 overflow-hidden relative" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
                        <img src={attendant} alt="Patient Attendant" className="w-full h-full object-cover group-hover/hex:scale-125 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-40 group-hover/hex:opacity-0 transition-opacity" />
                      </div>
                    </button>
                  </div>

                  {/* ROW 3: 4 Hexagons (Aligned with Row 1) */}
                  <div className="flex justify-center items-center gap-2 sm:gap-2.5 -mt-3 sm:-mt-4 lg:-mt-4.5 relative z-10">
                    {/* 10. Newborn Baby Care */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory("Maternal");
                        document.getElementById("services-catalog")?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="group/hex relative w-15 h-17 sm:w-18 sm:h-21 lg:w-20 lg:h-23 bg-[#f59e0b] p-[2.5px] sm:p-[3px] cursor-pointer transition-all duration-300 hover:scale-115 hover:z-30 hover:shadow-xl"
                      style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                      title="Newborn Infant Nurture"
                    >
                      <div className="w-full h-full bg-slate-900 overflow-hidden relative" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
                        <img src={motherBaby} alt="Newborn Care" className="w-full h-full object-cover group-hover/hex:scale-125 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-40 group-hover/hex:opacity-0 transition-opacity" />
                      </div>
                    </button>

                    {/* 11. Injections & Vitals */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory("Clinical");
                        document.getElementById("services-catalog")?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="group/hex relative w-15 h-17 sm:w-18 sm:h-21 lg:w-20 lg:h-23 bg-[#06b6d4] p-[2.5px] sm:p-[3px] cursor-pointer transition-all duration-300 hover:scale-115 hover:z-30 hover:shadow-xl"
                      style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                      title="Injection Services & BP"
                    >
                      <div className="w-full h-full bg-slate-900 overflow-hidden relative" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
                        <img src={nursing} alt="Injections" className="w-full h-full object-cover group-hover/hex:scale-125 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-40 group-hover/hex:opacity-0 transition-opacity" />
                      </div>
                    </button>

                    {/* 12. Pregnancy Care */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory("Maternal");
                        document.getElementById("services-catalog")?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="group/hex relative w-15 h-17 sm:w-18 sm:h-21 lg:w-20 lg:h-23 bg-[#c026d3] p-[2.5px] sm:p-[3px] cursor-pointer transition-all duration-300 hover:scale-115 hover:z-30 hover:shadow-xl"
                      style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                      title="Pregnancy Care"
                    >
                      <div className="w-full h-full bg-slate-900 overflow-hidden relative" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
                        <img src={motherBaby} alt="Pregnancy Care" className="w-full h-full object-cover group-hover/hex:scale-125 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-40 group-hover/hex:opacity-0 transition-opacity" />
                      </div>
                    </button>

                    {/* 13. Bedridden Care */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory("Elderly");
                        document.getElementById("services-catalog")?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="group/hex relative w-15 h-17 sm:w-18 sm:h-21 lg:w-20 lg:h-23 bg-[#ef4444] p-[2.5px] sm:p-[3px] cursor-pointer transition-all duration-300 hover:scale-115 hover:z-30 hover:shadow-xl"
                      style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                      title="Bedridden Patient Care"
                    >
                      <div className="w-full h-full bg-slate-900 overflow-hidden relative" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
                        <img src={attendant} alt="Bedridden Care" className="w-full h-full object-cover group-hover/hex:scale-125 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-40 group-hover/hex:opacity-0 transition-opacity" />
                      </div>
                    </button>
                  </div>

                  {/* ROW 4: 3 Hexagons (Bottom Row centered under Row 2) */}
                  <div className="flex justify-center items-center gap-2 sm:gap-2.5 -mt-3 sm:-mt-4 lg:-mt-4.5 relative z-20">
                    {/* 14. 24/7 GNM / ANM Staff */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory("Clinical");
                        document.getElementById("services-catalog")?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="group/hex relative w-15 h-17 sm:w-18 sm:h-21 lg:w-20 lg:h-23 bg-[#16a34a] p-[2.5px] sm:p-[3px] cursor-pointer transition-all duration-300 hover:scale-115 hover:z-30 hover:shadow-xl"
                      style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                      title="24/7 Dedicated Nursing Staff"
                    >
                      <div className="w-full h-full bg-slate-900 overflow-hidden relative" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
                        <img src={heroCare} alt="GNM ANM Nursing" className="w-full h-full object-cover group-hover/hex:scale-125 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-40 group-hover/hex:opacity-0 transition-opacity" />
                      </div>
                    </button>

                    {/* 15. Post Surgery */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory("Clinical");
                        document.getElementById("services-catalog")?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="group/hex relative w-15 h-17 sm:w-18 sm:h-21 lg:w-20 lg:h-23 bg-[#f43f5e] p-[2.5px] sm:p-[3px] cursor-pointer transition-all duration-300 hover:scale-115 hover:z-30 hover:shadow-xl"
                      style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                      title="Post-Surgery Healing"
                    >
                      <div className="w-full h-full bg-slate-900 overflow-hidden relative" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
                        <img src={icu} alt="Post-Surgery Care" className="w-full h-full object-cover group-hover/hex:scale-125 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-40 group-hover/hex:opacity-0 transition-opacity" />
                      </div>
                    </button>

                    {/* 16. MTP Wheelchair */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory("MTP");
                        document.getElementById("services-catalog")?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="group/hex relative w-15 h-17 sm:w-18 sm:h-21 lg:w-20 lg:h-23 bg-[#d97706] p-[2.5px] sm:p-[3px] cursor-pointer transition-all duration-300 hover:scale-115 hover:z-30 hover:shadow-xl"
                      style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                      title="Fast Dispatch Healthcare"
                    >
                      <div className="w-full h-full bg-slate-900 overflow-hidden relative" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
                        <img src={mtp} alt="Fast Dispatch" className="w-full h-full object-cover group-hover/hex:scale-125 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-40 group-hover/hex:opacity-0 transition-opacity" />
                      </div>
                    </button>
                  </div>

                </div>

                {/* Bottom Interactive Prompt Card */}
                <div className="mt-2 text-center bg-white/95 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-200/90 shadow-sm flex items-center justify-center gap-2">
                  <span className="text-xs font-bold text-slate-700">✨ Click any block to filter care services</span>
                  <span className="text-[10px] font-extrabold text-gold bg-gold/10 px-2 py-0.5 rounded-lg border border-gold/30">
                    18 Options
                  </span>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 2. SEARCH & FILTER TOOLBAR                                   */}
      {/* ============================================================ */}
      <section className="bg-white border-b border-slate-200/80 py-4">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 xl:px-12">
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
      <section id="services-catalog" className="py-8 sm:py-10 bg-slate-50/50 scroll-mt-24">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 xl:px-12">
          
          {/* Results Header Counter */}
          <div className="flex items-center justify-between mb-6 text-left">
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
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500 space-y-4 max-w-lg mx-auto">
              <Search className="mx-auto h-10 w-10 text-slate-300" />
              <div className="font-display font-bold text-lg text-[#1e2a5a]">No Matching Services Found</div>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {filteredServices.map((s: Service) => {
                const details = getServiceDetails(s.slug);
                const cardImage = s.image || details.image;
                const cardPrice = s.isMtp 
                  ? (s.pricing || "Pay on Service") 
                  : (s.price || s.pricing || "Starting ₹799 / shift");
                const cardHighlights = (s.highlights && s.highlights.length > 0) ? s.highlights.slice(0, 3) : details.highlights;

                return (
                  <div
                    key={s.slug}
                    className={`group flex flex-col overflow-hidden rounded-3xl bg-white border shadow-sm hover:shadow-2xl transition-all duration-300 hover:-translate-y-1.5 text-left ${
                      s.isMtp ? "border-amber-300/80 hover:border-amber-500" : "border-slate-200/90 hover:border-gold/50"
                    }`}
                  >
                    {/* Card Image Container */}
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
                      <img 
                        src={cardImage} 
                        alt={s.title} 
                        width={1200} 
                        height={800} 
                        loading="lazy" 
                        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-106" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      {/* Floating Price Badge */}
                      <div className={`absolute top-3.5 right-3.5 backdrop-blur-xs px-3.5 py-1 rounded-xl text-xs font-bold shadow-md border ${
                        s.isMtp 
                          ? "bg-amber-900/90 text-[#fcedc7] border-amber-400/40" 
                          : "bg-[#1e2a5a]/95 text-white border-white/20"
                      }`}>
                        {s.isMtp ? `✨ ${cardPrice}` : cardPrice}
                      </div>

                      {/* Verified Badge */}
                      <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-xs text-emerald-800 px-2.5 py-1 rounded-lg text-[10px] font-extrabold flex items-center gap-1 shadow-sm">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> {s.isMtp ? "Verified MTP Companion" : "Verified Staff"}
                      </div>
                    </div>
                    
                    {/* Card Content */}
                    <div className="flex flex-1 flex-col p-5 sm:p-6 justify-between space-y-4">
                      <div className="space-y-2.5">
                        
                        {/* Categories & Badges */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`inline-flex items-center rounded-lg px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider border ${
                            s.isMtp ? "bg-amber-50 text-amber-900 border-amber-200" : details.badgeClass
                          }`}>
                            {s.category || (s.isMtp ? "MTP & Companion Tasks" : details.category)}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                            {s.shiftType || s.duration || details.shiftType}
                          </span>
                          {s.isMtp && (
                            <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                              Zero Advance Required
                            </span>
                          )}
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
                        <div className="pt-2 space-y-1.5 border-t border-slate-100">
                          {cardHighlights.map((h: string, i: number) => (
                            <div key={i} className="flex items-center gap-2 text-[11px] text-slate-700 font-medium">
                              <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                              <span className="truncate">{h}</span>
                            </div>
                          ))}
                        </div>

                      </div>

                      {/* Action Button Row */}
                      <div className="pt-3 border-t border-slate-100 flex items-center gap-2.5">
                        <Link
                          to="/services/$slug"
                          params={{ slug: s.slug }}
                          className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-[#1e2a5a] hover:text-white text-[#1e2a5a] text-xs font-bold transition-all text-center"
                        >
                          View Details
                        </Link>
                        <a
                          href={`/dashboard?service=${s.slug}`}
                          className={`flex-1 py-2 px-3 rounded-xl text-white text-xs font-bold transition-all text-center shadow-md flex items-center justify-center gap-1 cursor-pointer group/btn ${
                            s.isMtp 
                              ? "bg-gradient-to-r from-amber-700 via-amber-800 to-amber-900 hover:from-amber-800 hover:to-amber-950 shadow-amber-900/20"
                              : "bg-gradient-to-r from-[#1e2a5a] via-[#283870] to-[#1e2a5a] hover:from-[#151e42] hover:to-[#223068] shadow-[#1e2a5a]/20"
                          }`}
                        >
                          <span>{s.isMtp ? "Book MTP Task" : "Book Now"}</span>
                          <ChevronRight className="h-3.5 w-3.5 text-gold transition-transform group-hover/btn:translate-x-0.5" />
                        </a>
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
      {/* 3. DIRECT CARE SERVICE BOOKING & CONSULTATION FORM           */}
      {/* ============================================================ */}
      <section id="services-form" className="py-12 sm:py-16 bg-gradient-to-b from-slate-50 via-white to-slate-50/70 border-y border-slate-200/80 text-left relative overflow-hidden scroll-mt-20">
        {/* Ambient background blur circles */}
        <div className="absolute top-0 right-1/4 -z-10 h-96 w-96 rounded-full bg-gold/15 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-10 -z-10 h-80 w-80 rounded-full bg-[#1e2a5a]/10 blur-[100px] pointer-events-none" />

        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 xl:px-12">
          
          <div className="rounded-3xl border border-gold/35 bg-white p-6 sm:p-10 lg:p-12 shadow-2xl relative overflow-hidden">
            {/* Top gold accent line */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#0b183b] via-[#c9a24c] to-[#0b183b]" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
              
              {/* Left Column: Form Header & Guarantees */}
              <div className="lg:col-span-5 space-y-5">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-gold/40 bg-gold/10 text-xs font-extrabold text-[#966b1a] uppercase tracking-wider">
                  <Sparkles className="h-3.5 w-3.5 text-gold animate-pulse" />
                  Instant Care Request
                </div>

                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#1e2a5a] font-display tracking-tight leading-tight">
                  Book Care Service or Request Free Consultation
                </h2>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                  Fill in your patient requirements below. Our Hyderabad clinical coordinator will match a verified nurse or attendant and call you within <strong>15 minutes</strong> with transparent pricing and shift schedules.
                </p>

                {/* 4 Pillars of Trust */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 font-bold">
                      ✓
                    </span>
                    <div>
                      <strong className="text-slate-800 block font-semibold">100% Police &amp; ID Verified Staff</strong>
                      <span className="text-slate-500 text-[11px]">Strict background verification, Aadhaar KYC &amp; medical nursing credentials.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-gold/20 text-[#966b1a] font-bold">
                      ⚡
                    </span>
                    <div>
                      <strong className="text-slate-800 block font-semibold">Zero Advance Required to Inquire</strong>
                      <span className="text-slate-500 text-[11px]">Discuss schedules and options freely before committing.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 font-bold">
                      🛡️
                    </span>
                    <div>
                      <strong className="text-slate-800 block font-semibold">Continuous Doctor &amp; Supervisor Oversight</strong>
                      <span className="text-slate-500 text-[11px]">Daily digital vitals log and emergency escalation support.</span>
                    </div>
                  </div>
                </div>

                {/* Direct Phone / WhatsApp quick links */}
                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <a
                    href={`tel:${contact.PHONE_TEL}`}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#1e2a5a] text-xs font-bold flex items-center justify-center gap-2 border border-slate-200 transition-colors"
                  >
                    <Phone className="h-3.5 w-3.5 text-primary" />
                    <span>Call Helpline</span>
                  </a>
                  <a
                    href={`https://wa.me/${contact.WHATSAPP}?text=Hello%20Amma%20Seva%2C%20I%20want%20to%20book%20a%20care%20service`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-2.5 px-4 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 text-emerald-800 text-xs font-bold flex items-center justify-center gap-2 border border-emerald-200 transition-colors"
                  >
                    <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
                    <span>WhatsApp Desk</span>
                  </a>
                </div>
              </div>

              {/* Right Column: Direct Booking Form */}
              <div className="lg:col-span-7 bg-slate-50/60 rounded-2xl border border-slate-200/90 p-5 sm:p-8 text-left space-y-6">
                
                <form onSubmit={handleDirectServiceSubmit} className="space-y-5">
                  
                  {/* Select Service */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                      Select Required Healthcare Service <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formService}
                      onChange={(e) => setFormService(e.target.value)}
                      className="w-full px-4 py-3 text-sm rounded-2xl border border-slate-200 bg-white text-slate-900 outline-none transition-all focus:border-gold focus:ring-4 focus:ring-gold/15 shadow-sm font-semibold cursor-pointer"
                    >
                      <option value="Elderly Care">👴 Elderly &amp; Senior Healthcare (₹1,200/day)</option>
                      <option value="Home Nursing Services">🩺 Professional Home Nursing &amp; Injections (₹1,500/day)</option>
                      <option value="Patient Bedside Attendant">🛏️ Patient Bedside Attendant (₹1,100/day)</option>
                      <option value="Mother & Newborn Baby Care">🍼 Mother &amp; Newborn Baby Care (₹1,400/day)</option>
                      <option value="Bedridden Patient Care">♿ Bedridden &amp; Post-Op Recovery Care (₹1,300/day)</option>
                      <option value="ICU Home Recovery">🏥 Critical ICU Home Setup (₹2,200/day)</option>
                      <option value="Physiotherapy & Mobility">🧘 In-Home Physiotherapy (₹900/session)</option>
                      <option value="General Health Consultation">✨ Doctor &amp; Clinical Health Consultation</option>
                    </select>
                  </div>

                  {/* Shift Duration & Start Date */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        Shift Type / Duration
                      </label>
                      <select
                        value={formShift}
                        onChange={(e) => setFormShift(e.target.value)}
                        className="w-full px-4 py-3 text-sm rounded-2xl border border-slate-200 bg-white text-slate-900 outline-none transition-all focus:border-gold focus:ring-4 focus:ring-gold/15 shadow-sm font-medium cursor-pointer"
                      >
                        <option value="12h Day Shift">12 Hours Day Shift</option>
                        <option value="12h Night Shift">12 Hours Night Shift</option>
                        <option value="24/7 Full Time Live-in">24/7 Full Time Live-in Care</option>
                        <option value="Per Visit / Procedure">Per Visit On-Demand Procedure</option>
                        <option value="Custom Flexible Schedule">Custom Flexible Schedule</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        Preferred Start Date
                      </label>
                      <input
                        type="date"
                        value={formDate}
                        min={new Date().toISOString().split("T")[0]}
                        onChange={(e) => setFormDate(e.target.value)}
                        className="w-full px-4 py-3 text-sm rounded-2xl border border-slate-200 bg-white text-slate-900 outline-none transition-all focus:border-gold focus:ring-4 focus:ring-gold/15 shadow-sm font-medium cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Patient Details */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        Patient Full Name
                      </label>
                      <input
                        type="text"
                        value={formPatientName}
                        onChange={(e) => setFormPatientName(sanitizeName(e.target.value))}
                        placeholder="e.g. Ramesh Chandra"
                        className="w-full px-4 py-3 text-sm rounded-2xl border border-slate-200 bg-white text-slate-900 outline-none transition-all focus:border-gold focus:ring-4 focus:ring-gold/15 shadow-sm font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        Patient Age
                      </label>
                      <input
                        type="text"
                        maxLength={2}
                        value={formPatientAge}
                        onChange={(e) => setFormPatientAge(e.target.value.replace(/\D/g, "").slice(0, 2))}
                        placeholder="e.g. 74"
                        className="w-full px-4 py-3 text-sm rounded-2xl border border-slate-200 bg-white text-slate-900 outline-none transition-all focus:border-gold focus:ring-4 focus:ring-gold/15 shadow-sm font-medium"
                      />
                    </div>
                  </div>

                  {/* Booker Contact Info */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        Your Full Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formBookerName}
                        onChange={(e) => setFormBookerName(sanitizeName(e.target.value))}
                        placeholder="e.g. Suresh Kumar"
                        className="w-full px-4 py-3 text-sm rounded-2xl border border-slate-200 bg-white text-slate-900 outline-none transition-all focus:border-gold focus:ring-4 focus:ring-gold/15 shadow-sm font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        10-Digit Mobile Number <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        value={formPhone}
                        onChange={(e) => setFormPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        placeholder="e.g. 9876543210"
                        className="w-full px-4 py-3 text-sm rounded-2xl border border-slate-200 bg-white text-slate-900 outline-none transition-all focus:border-gold focus:ring-4 focus:ring-gold/15 shadow-sm font-semibold font-mono"
                      />
                    </div>
                  </div>

                  {/* Address & Locality in Hyderabad */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        Locality / Area in Hyderabad
                      </label>
                      <input
                        type="text"
                        value={formAddress}
                        onChange={(e) => setFormAddress(e.target.value)}
                        placeholder="e.g. Banjara Hills, Gachibowli, Kukatpally..."
                        className="w-full px-4 py-3 text-sm rounded-2xl border border-slate-200 bg-white text-slate-900 outline-none transition-all focus:border-gold focus:ring-4 focus:ring-gold/15 shadow-sm font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        City
                      </label>
                      <input
                        type="text"
                        value={formCity}
                        onChange={(e) => setFormCity(e.target.value)}
                        className="w-full px-4 py-3 text-sm rounded-2xl border border-slate-200 bg-slate-100 text-slate-700 outline-none font-medium"
                      />
                    </div>
                  </div>

                  {/* Medical Conditions & Special Care Notes */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                      Special Medical Needs / Care Instructions
                    </label>
                    <textarea
                      rows={2}
                      value={formNeeds}
                      onChange={(e) => setFormNeeds(e.target.value)}
                      placeholder="e.g. Post-knee surgery mobility assistance, diabetic insulin tracking, stroke recovery, dementia companion..."
                      className="w-full px-4 py-3 text-sm rounded-2xl border border-slate-200 bg-white text-slate-900 outline-none transition-all focus:border-gold focus:ring-4 focus:ring-gold/15 shadow-sm font-medium"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmittingForm}
                    className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#0b183b] via-[#14234f] to-[#1e2a5a] hover:from-[#14234f] hover:to-[#0b183b] text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50"
                  >
                    {isSubmittingForm ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Submitting Care Booking...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-gold" />
                        <span>Submit Direct Care Booking Request</span>
                        <ArrowRight className="h-4 w-4 text-gold" />
                      </>
                    )}
                  </button>

                  <p className="text-[11px] text-center text-slate-500 font-medium">
                    🔒 Zero upfront payment required. Our care manager will call you immediately to confirm attendant match.
                  </p>
                </form>

              </div>

            </div>

          </div>

        </div>
      </section>

      {/* Success Modal Overlay */}
      {formSuccessData && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white border border-slate-200/80 shadow-2xl text-center space-y-6 animate-in zoom-in duration-300 relative overflow-hidden p-8">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-gold to-emerald-500" />
            
            <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-600 border border-emerald-200/80 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
              <Check className="h-10 w-10 text-emerald-600" />
            </div>

            <div className="space-y-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-100 text-emerald-800">
                ✓ Booking Request Received
              </span>
              <h3 className="text-2xl font-black text-slate-900 font-display">
                Thank You, {formSuccessData.name}!
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Your request for <strong>{formSuccessData.service} ({formSuccessData.shift})</strong> has been logged under Request #{formSuccessData.id}.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs text-left space-y-2 text-slate-600">
              <div className="flex justify-between">
                <span className="text-slate-400">Mobile Number:</span>
                <span className="font-bold text-slate-800 font-mono">{formSuccessData.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Service:</span>
                <span className="font-bold text-[#1e2a5a]">{formSuccessData.service}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Coordinator Call:</span>
                <span className="font-bold text-emerald-700">Within 15 Minutes</span>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <a
                href={`https://wa.me/${contact.WHATSAPP}?text=Hello%20Amma%20Seva%2C%20I%20just%20submitted%20care%20request%20%23${formSuccessData.id}%20for%20${encodeURIComponent(formSuccessData.service)}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <MessageCircle className="h-4 w-4" /> Chat on WhatsApp Now
              </a>
              <button
                type="button"
                onClick={() => setFormSuccessData(null)}
                className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Close &amp; Browse Services
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 4. MTP ON-DEMAND CARE BANNER                                */}
      {/* ============================================================ */}
      <section className="py-8 sm:py-10 bg-gradient-to-r from-[#0d1427] via-[#101b38] to-[#1e2a5a] text-white text-left relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-gold/10 blur-[130px] pointer-events-none" />

        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 xl:px-12 relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 rounded-3xl bg-white/[0.06] border border-white/15 backdrop-blur-md p-6 sm:p-8 shadow-xl">
            <div className="space-y-2.5 max-w-2xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/20 text-[#edd392] text-xs font-bold border border-gold/30">
                <Car className="h-3.5 w-3.5 text-gold" /> Need Flexible Dropping or Errands?
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold font-display leading-tight text-white">
                MTP (Multi-Tasking Professionals) On-Demand Task Force
              </h3>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                Book hourly hospital escorts, urgent prescription medicine deliveries, senior walking companions, and newborn nursery helpers across Hyderabad.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 shrink-0">
              <Link
                to="/mtp"
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#c9a24c] to-[#b38938] hover:from-[#b38938] hover:to-[#966b1a] text-[#0d1427] font-extrabold text-xs shadow-xl shadow-gold/20 hover:scale-102 transition-all flex items-center gap-2"
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
      <section className="py-8 sm:py-10 bg-white text-left border-t border-slate-100">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="rounded-3xl bg-gradient-to-r from-[#1e2a5a] via-[#24346e] to-[#1e2a5a] text-white p-8 sm:p-12 shadow-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative overflow-hidden">
            <div className="space-y-3 max-w-2xl relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                </span>
                24/7 Care Coordinator Standing By
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-display leading-tight text-white">
                Need Help Choosing the Right Home Caregiver?
              </h2>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
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
