import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Phone, Clock, IndianRupee, Star, ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { SiteLayout, contact } from "@/components/SiteLayout";
import { validateName, validatePhone, sanitizeIndianPhone, sanitizeName } from "@/lib/validation";
import { fetchServices } from "@/lib/services";
import motherBaby from "@/assets/service-mother-baby.jpg";
import nursing from "@/assets/service-nursing.jpg";
import elderly from "@/assets/service-elderly.jpg";
import attendant from "@/assets/service-bedside-attendant.jpg";
import doctor from "@/assets/service-doctor.jpg";
import mtp from "@/assets/service-mtp.jpg";

function getServiceDetails(slug: string) {
  const details: Record<string, { category: string; badgeClass: string; image: string; images: string[] }> = {
    "elderly-care": {
      category: "Elderly Care",
      badgeClass: "bg-emerald-50 text-emerald-700 border border-emerald-200/60",
      image: elderly,
      images: [elderly, nursing, motherBaby],
    },
    "mother-baby-care": {
      category: "Maternal",
      badgeClass: "bg-rose-50 text-rose-700 border border-rose-200/60",
      image: motherBaby,
      images: [motherBaby, nursing, elderly],
    },
    "pregnancy-care": {
      category: "Prenatal",
      badgeClass: "bg-indigo-50 text-indigo-700 border border-indigo-200/60",
      image: motherBaby,
      images: [motherBaby, nursing, elderly],
    },
    "newborn-baby-care": {
      category: "Pediatric",
      badgeClass: "bg-sky-50 text-sky-700 border border-sky-200/60",
      image: motherBaby,
      images: [motherBaby, nursing, elderly],
    },
    "home-nursing": {
      category: "Clinical",
      badgeClass: "bg-cyan-50 text-cyan-700 border border-cyan-200/60",
      image: nursing,
      images: [nursing, elderly, motherBaby],
    },
    "injection-services": {
      category: "Clinical",
      badgeClass: "bg-cyan-50 text-cyan-700 border border-cyan-200/60",
      image: nursing,
      images: [nursing, elderly, motherBaby],
    },
    "post-surgery-care": {
      category: "Recovery",
      badgeClass: "bg-amber-50 text-amber-700 border border-amber-200/60",
      image: nursing,
      images: [nursing, elderly, motherBaby],
    },
    "patient-care-attendant": {
      category: "Assistance",
      badgeClass: "bg-purple-50 text-purple-700 border border-purple-200/60",
      image: elderly,
      images: [elderly, nursing, motherBaby],
    },
    "bedridden-patient-care": {
      category: "Specialized",
      badgeClass: "bg-teal-50 text-teal-700 border border-teal-200/60",
      image: elderly,
      images: [elderly, nursing, motherBaby],
    },
    "icu-home-recovery": {
      category: "Intensive",
      badgeClass: "bg-red-50 text-red-700 border border-red-200/60",
      image: nursing,
      images: [nursing, elderly, motherBaby],
    },
    "physiotherapy": {
      category: "Therapy",
      badgeClass: "bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200/60",
      image: elderly,
      images: [elderly, nursing, motherBaby],
    },
    "doctor-consultation": {
      category: "Medical",
      badgeClass: "bg-slate-50 text-slate-700 border border-slate-200/60",
      image: nursing,
      images: [nursing, elderly, motherBaby],
    },
    "mtp": {
      category: "MTP & Companion Tasks",
      badgeClass: "bg-amber-50 text-amber-800 border border-amber-200/60",
      image: mtp,
      images: [mtp, attendant, nursing],
    },
  };

  if (slug.startsWith("mtp") || slug.includes("transport") || slug.includes("escort") || slug.includes("errand")) {
    return {
      category: "MTP & Companion Tasks",
      badgeClass: "bg-amber-50 text-amber-800 border border-amber-200/60",
      image: mtp,
      images: [mtp, attendant, nursing],
    };
  }

  return details[slug] || {
    category: "Specialized",
    badgeClass: "bg-teal-50 text-teal-700 border border-teal-200/60",
    image: nursing,
    images: [nursing, elderly, motherBaby],
  };
}

function getSecondaryTag(category: string): [string, string] {
  switch (category) {
    case "MTP & Companion Tasks":
      return ["On-Demand Companion", "Pay on Service"];
    case "Maternal":
      return ["Postnatal Care", "Newborn Support"];
    case "Prenatal":
      return ["Prenatal Care", "Pregnancy Support"];
    case "Pediatric":
      return ["Newborn Care", "Pediatric Support"];
    case "Elderly Care":
      return ["Geriatric Care", "Senior Support"];
    case "Clinical":
      return ["Clinical Care", "Medical Support"];
    case "Recovery":
      return ["Post-Op Recovery", "Rehabilitation"];
    case "Assistance":
      return ["Daily Assistance", "Personal Care"];
    case "Specialized":
      return ["Specialized Care", "Bedridden Care"];
    case "Intensive":
      return ["Critical Support", "Intensive Care"];
    case "Therapy":
      return ["Physical Therapy", "Rehab Support"];
    case "Medical":
      return ["Doctor Consult", "Clinical Support"];
    default:
      return ["Home Healthcare", "Dignified Care"];
  }
}

export const Route = createFileRoute("/services/$slug")({
  loader: async ({ params }) => {
    const list = await fetchServices();
    const service = list.find((s) => s.slug === params.slug);
    if (!service) throw notFound();
    return { service, allServices: list };
  },
  staleTime: 30000,
  head: ({ loaderData, params }) => {
    if (!loaderData) {
      return { meta: [{ title: "Service not found — Amma Seva" }, { name: "robots", content: "noindex" }] };
    }
    const s = loaderData.service;
    return {
      meta: [
        { title: `${s.title} — Amma Seva` },
        { name: "description", content: s.short },
        { property: "og:title", content: `${s.title} — Amma Seva` },
        { property: "og:description", content: s.short },
        { property: "og:url", content: `/services/${params.slug}` },
      ],
      links: [{ rel: "canonical", href: `/services/${params.slug}` }],
    };
  },
  component: ServicePage,
});

function ServicePage() {
  const { service, allServices } = Route.useLoaderData();
  const details = getServiceDetails(service.slug);
  
  // Combine all images available
  const serviceImages = [
    service.image || details.image,
    ...(service.images || details.images || []).filter((img: string) => img !== (service.image || details.image))
  ].filter(Boolean);

  const [activeImage, setActiveImage] = useState(serviceImages[0] || details.image);
  const [activeTab, setActiveTab] = useState<"enquiry" | "book">("enquiry");
  const [enquiryName, setEnquiryName] = useState("");
  const [enquiryPhone, setEnquiryPhone] = useState("");
  const [enquiryDate, setEnquiryDate] = useState("");

  const getTodayISO = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const todayStr = getTodayISO();
  
  const others = allServices.filter((s: any) => s.slug !== service.slug).slice(0, 3);

  return (
    <SiteLayout>
      {/* Breadcrumb link */}
      <div className="mx-auto max-w-[1440px] px-4 pt-6 sm:px-6 lg:px-8 xl:px-12 text-left">
        <Link 
          to="/services" 
          className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gold hover:text-gold/80 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" /> All Services
        </Link>
      </div>

      {/* Premium Hero Header & Image Gallery */}
      <section className="py-6">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 xl:px-12">
          {/* Responsive Hero Header & Image Container */}
          <div className="relative w-full rounded-3xl overflow-hidden shadow-lg border border-border/40 bg-white">
            {/* Image Banner */}
            <div className="relative w-full h-[220px] sm:h-[280px] md:h-[450px] overflow-hidden bg-slate-100">
              <img 
                src={activeImage} 
                alt={service.title} 
                className="w-full h-full object-cover transition-all duration-300" 
              />
              {/* Subtle gradient vignette on desktop */}
              <div className="hidden md:block absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
            </div>
            
            {/* Details Content Card: clean flow below image on mobile, floating overlay on desktop */}
            <div className="p-5 sm:p-6 md:absolute md:bottom-6 md:left-6 md:right-auto md:max-w-xl md:bg-white/95 md:backdrop-blur-md md:rounded-2xl md:shadow-2xl md:border md:border-slate-100 text-left bg-white">
              <div className="flex flex-wrap gap-2 mb-2.5">
                <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-0.5 text-xs font-semibold text-slate-700">
                  {getSecondaryTag(service.category || details.category)[0]}
                </span>
                <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-0.5 text-xs font-semibold text-slate-700">
                  {getSecondaryTag(service.category || details.category)[1]}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-primary leading-tight font-display">
                {service.title}
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                {service.short}
              </p>
            </div>
          </div>

          {/* Interactive Image Gallery Thumbnails */}
          {serviceImages.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full justify-start mt-4">
              {serviceImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(img)}
                  className={`h-14 w-18 shrink-0 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                    activeImage === img ? "border-gold scale-95 shadow-sm" : "border-transparent hover:border-slate-300"
                  }`}
                >
                  <img src={img} className="w-full h-full object-cover" alt="" />
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Main Details Grid */}
      <section>
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 lg:grid-cols-12 gap-8 px-4 py-8 sm:px-6 lg:px-8 xl:px-12">
          <div className="lg:col-span-8 space-y-8">
            
            {/* Service Overview Card */}
            <div className="border border-border/85 bg-background rounded-2xl p-6 shadow-sm text-left">
              <div className="flex items-center gap-2.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm">
                  <Check className="h-5 w-5" />
                </span>
                <h2 className="text-xl font-bold text-primary font-display">Service Overview</h2>
              </div>
              <div className="mt-4 text-sm text-slate-600 leading-relaxed space-y-4">
                <p className="whitespace-pre-wrap">{service.about}</p>
                <p>
                  We combine clinical best practices with a soft, human-centric approach, transforming your home into a sanctuary of dignified care during these crucial weeks.
                </p>
              </div>
            </div>

            {/* Side-by-side What's Included & Key Benefits */}
            <div className="grid gap-6 md:grid-cols-2">
              
              {/* What's Included Card */}
              <div className="border border-border/85 bg-background rounded-2xl p-6 shadow-sm text-left">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span className="h-5 w-1 bg-gold rounded-full" /> What's Included
                </h3>
                <ul className="mt-5 space-y-4">
                  {service.benefits.map((b: string, idx: number) => {
                    const iconList = [Clock, Star, Check, Phone];
                    const Icon = iconList[idx % iconList.length];
                    return (
                      <li key={b} className="flex items-start gap-3">
                        <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                          <Icon className="h-3 w-3" />
                        </span>
                        <div>
                          <div className="text-sm font-semibold text-slate-800">{b}</div>
                          <div className="text-xs text-slate-400 mt-0.5">Professional, personalized checks and support.</div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Key Benefits Navy Card */}
              <div className="bg-[#0e2254] text-white rounded-2xl p-6 shadow-sm text-left relative overflow-hidden flex flex-col justify-between">
                {/* Watermark icon decoration */}
                <div className="absolute -right-10 -bottom-10 text-white/5 opacity-10 pointer-events-none">
                  <Star className="h-40 w-40" />
                </div>
                <div>
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <span className="h-5 w-1 bg-gold rounded-full" /> Key Benefits
                  </h3>
                  <ul className="mt-5 space-y-3">
                    {service.highlights && service.highlights.map((h: string, idx: number) => {
                      const iconList = [Clock, Star, Check];
                      const Icon = iconList[idx % iconList.length];
                      return (
                        <li key={h} className="bg-white/10 hover:bg-white/15 transition-colors border border-white/10 rounded-xl p-3.5 flex items-center gap-3">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20 text-white">
                            <Icon className="h-3 w-3 fill-white" />
                          </span>
                          <span className="text-sm font-medium leading-snug">{h}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>

            </div>

            {/* Pricing Options Card */}
            <div className={`border rounded-2xl p-6 shadow-xs text-left flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 ${
              service.isMtp || service.slug.startsWith("mtp") 
                ? "border-amber-200 bg-amber-50/40" 
                : "border-border/85 bg-[#f8f9fc]"
            }`}>
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-primary">Pricing Options</h3>
                  {service.isMtp && (
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                      Pay on Service / Quote
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-500">
                  {service.isMtp 
                    ? "No upfront payment required! Exact task quote confirmed upon booking." 
                    : "Flexible packages tailored to your care timeline."}
                </p>
              </div>
              <div className="text-left sm:text-right shrink-0">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {service.isMtp ? "Estimated Rate" : "Starts at"}
                </div>
                <div className={`text-3xl font-extrabold mt-1 ${service.isMtp ? "text-amber-900" : "text-emerald-600"}`}>
                  {service.pricing || (service.isMtp ? "Custom Quote" : "₹1,200")}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {service.isMtp ? "0 advance needed" : (service.duration || "per shift")}
                </div>
              </div>
              <div className="shrink-0 w-full sm:w-auto">
                <a
                  href={
                    typeof window !== "undefined" && localStorage.getItem("ammaseva_user_token")
                      ? `/dashboard?service=${service.slug}`
                      : `/login?redirect=${encodeURIComponent(`/dashboard?service=${service.slug}`)}`
                  }
                  className={`w-full py-2.5 px-5 flex items-center justify-center gap-1.5 font-bold text-xs rounded-xl shadow-sm hover:shadow-md cursor-pointer whitespace-nowrap text-white text-center transition-all ${
                    service.isMtp
                      ? "bg-gradient-to-r from-amber-700 via-amber-800 to-amber-900 hover:from-amber-800 hover:to-amber-950"
                      : "btn-primary"
                  }`}
                >
                  <span>{service.isMtp ? "Book MTP Task (No Advance)" : "Book Care Now"}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>

          </div>

          {/* Sticky Enquiry/Booking Sidebar */}
          <div className="lg:col-span-4">
            <aside className="rounded-2xl border border-border bg-background p-6 shadow-md sticky top-24 text-left space-y-4">
              
              {/* Tab Selector */}
              <div className="flex border-b border-slate-100 pb-1 mb-4">
                <button
                  type="button"
                  onClick={() => setActiveTab("enquiry")}
                  className={`flex-1 pb-2 text-center text-xs font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
                    activeTab === "enquiry" 
                      ? "border-gold text-primary font-bold" 
                      : "border-transparent text-slate-400 hover:text-slate-600"
                  }`}
                >
                  Quick Enquiry
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("book")}
                  className={`flex-1 pb-2 text-center text-xs font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
                    activeTab === "book" 
                      ? "border-gold text-primary font-bold" 
                      : "border-transparent text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {service.isMtp ? "Book MTP Task" : "Book Care Shift"}
                </button>
              </div>

              {activeTab === "book" ? (
                <div className="space-y-5 py-2 animate-in fade-in duration-200">
                  <div className={`rounded-2xl p-4 text-center space-y-3.5 border ${
                    service.isMtp ? "bg-amber-50/60 border-amber-200" : "bg-indigo-50/50 border-indigo-100/40"
                  }`}>
                    <span className={`inline-flex h-12 w-12 items-center justify-center rounded-full shadow-inner mx-auto border ${
                      service.isMtp 
                        ? "bg-amber-100 text-amber-800 border-amber-200" 
                        : "bg-indigo-50 text-indigo-600 border-indigo-100"
                    }`}>
                      <Clock className="h-6 w-6" />
                    </span>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-slate-800">
                        {service.isMtp ? "Instant MTP Booking (Zero Advance)" : "Direct Online Booking"}
                      </h4>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        {service.isMtp 
                          ? "Select your scheduled date and time. No payment required at booking time; settle directly with our care coordinator."
                          : "Skip callbacks and wait times. Set your care shift times, specify patient needs, and confirm caregivers online."}
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex justify-between items-center text-xs">
                    <div>
                      <span className="text-slate-400 block mb-0.5">
                        {service.isMtp ? "Payment Option" : "Starting Rate"}
                      </span>
                      <span className="font-semibold text-slate-700">
                        {service.pricing || (service.isMtp ? "Pay on Service" : "₹1,200")}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block mb-0.5">Billing Basis</span>
                      <span className="font-bold text-primary">
                        {service.duration || (service.isMtp ? "Per Task" : "Per shift")}
                      </span>
                    </div>
                  </div>

                  <a
                    href={
                      typeof window !== "undefined" && localStorage.getItem("ammaseva_user_token")
                        ? `/dashboard?service=${service.slug}`
                        : `/login?redirect=${encodeURIComponent(`/dashboard?service=${service.slug}`)}`
                    }
                    className={`w-full py-3 flex items-center justify-center gap-2 font-bold text-sm rounded-xl shadow-sm hover:shadow-md cursor-pointer text-center text-white transition-all ${
                      service.isMtp
                        ? "bg-gradient-to-r from-amber-700 via-amber-800 to-amber-900 hover:from-amber-800 hover:to-amber-950"
                        : "btn-primary"
                    }`}
                  >
                    <span>{service.isMtp ? "Book MTP Task Now (0 Advance)" : "Proceed to Booking Form"}</span>
                    <ArrowRight className="h-4 w-4" />
                  </a>

                  <p className="text-[10px] text-slate-400 text-center font-medium">
                    🔒 100% Background-checked &amp; doctor-supervised staff.
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Quick Enquiry</h3>
                    <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                      Have questions about our {service.title}? Fill out the form and our care coordinator will reach out shortly.
                    </p>
                  </div>
                  <form
                    className="space-y-4"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const form = e.target as HTMLFormElement;
                      const formData = new FormData(form);
                      const name = (formData.get("name") as string) || "";
                      const phone = enquiryPhone || (formData.get("phone") as string) || "";

                      const nameErr = validateName(name, "Full name");
                      if (nameErr) {
                        alert(nameErr);
                        return;
                      }

                      const phoneErr = validatePhone(phone, "Phone number");
                      if (phoneErr) {
                        alert(phoneErr);
                        return;
                      }

                      const dateVal = enquiryDate || (formData.get("date") as string) || "";
                      if (dateVal) {
                        const [yearStr] = dateVal.split("-");
                        const yearNum = Number(yearStr);
                        const currentYear = new Date().getFullYear();
                        if (!yearStr || yearStr.length !== 4 || isNaN(yearNum) || yearNum < currentYear || yearNum > 2099) {
                          alert(`Please enter a valid 4-digit year (between ${currentYear} and 2099).`);
                          return;
                        }
                        if (dateVal < todayStr) {
                          alert("Please select today or a future date for your expected start date. Past dates are not allowed.");
                          return;
                        }
                      }

                      const data = {
                        name: name.trim(),
                        phone: phone.replace(/\D/g, ""),
                        date: dateVal,
                        message: (formData.get("message") as string) || "",
                        service: service.title,
                      };

                      try {
                        const res = await fetch("/api/enquiry", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify(data),
                        });
                        const resData = await res.json().catch(() => ({}));
                        if (res.ok && resData.success) {
                          alert(resData.message || "Thank you! Our care coordinator will contact you shortly.");
                          form.reset();
                          setEnquiryName("");
                          setEnquiryPhone("");
                          setEnquiryDate("");
                        } else {
                          alert("Error: " + (resData.error || "Failed to submit enquiry. Please check your inputs."));
                        }
                      } catch (err) {
                        console.error(err);
                        alert("Unable to reach the server. Please check your internet connection or call our 24/7 helpline at +91 94945 16543.");
                      }
                    }}
                  >
                    <div>
                      <label className="text-xs font-semibold text-slate-600 block mb-1">Full Name</label>
                      <input
                        name="name"
                        type="text"
                        required
                        value={enquiryName}
                        onChange={(e) => setEnquiryName(sanitizeName(e.target.value))}
                        placeholder="Jane Doe"
                        className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-gold focus:border-gold"
                      />
                    </div>
                    
                    <div>
                      <label className="text-xs font-semibold text-slate-600 block mb-1">
                        Phone Number <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative flex items-center">
                        <div className="absolute left-3 flex items-center gap-1.5 text-xs font-extrabold text-slate-700 pointer-events-none select-none border-r border-slate-200 pr-2.5">
                          <span>🇮🇳</span>
                          <span>+91</span>
                        </div>
                        <input
                          name="phone"
                          type="tel"
                          inputMode="numeric"
                          maxLength={10}
                          required
                          value={enquiryPhone}
                          onChange={(e) => setEnquiryPhone(sanitizeIndianPhone(e.target.value))}
                          placeholder="98765 43210"
                          className="w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-20 pr-3 py-2 text-sm outline-none focus:ring-1 focus:ring-gold focus:border-gold font-mono font-bold text-slate-800 tracking-wider"
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">Enter 10-digit Indian mobile number (starts with 6, 7, 8, 9)</p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-slate-600 block">Expected Start Date (Optional)</label>
                        <span className="text-[10px] text-slate-400 font-medium">4-digit year (YYYY)</span>
                      </div>
                      <input
                        name="date"
                        type="date"
                        min={todayStr}
                        max="2099-12-31"
                        value={enquiryDate}
                        onChange={(e) => {
                          let val = e.target.value;
                          if (val) {
                            const parts = val.split("-");
                            if (parts[0] && parts[0].length > 4) {
                              parts[0] = parts[0].slice(0, 4);
                              val = parts.join("-");
                            }
                          }
                          setEnquiryDate(val);
                        }}
                        className={`w-full rounded-lg border bg-slate-50/50 px-3 py-2 text-sm outline-none focus:ring-1 text-slate-700 cursor-pointer ${
                          enquiryDate && enquiryDate.length === 10 && enquiryDate < todayStr
                            ? "border-rose-400 focus:ring-rose-400 focus:border-rose-400 bg-rose-50/30"
                            : "border-slate-200 focus:ring-gold focus:border-gold"
                        }`}
                      />
                      {enquiryDate && (() => {
                        const yearPart = enquiryDate.split("-")[0];
                        const yearNum = Number(yearPart);
                        const currentYear = new Date().getFullYear();
                        if (yearPart && yearPart.length > 4) {
                          return <p className="text-[11px] text-rose-600 font-medium mt-1">⚠️ Year must be 4 digits only.</p>;
                        }
                        if (enquiryDate.length === 10) {
                          if (yearNum > 2099 || yearNum < currentYear) {
                            return <p className="text-[11px] text-rose-600 font-medium mt-1">⚠️ Year must be between {currentYear} and 2099.</p>;
                          }
                          if (enquiryDate < todayStr) {
                            return <p className="text-[11px] text-rose-600 font-medium mt-1">⚠️ Start date cannot be in the past. Please select today or a future date.</p>;
                          }
                        }
                        return null;
                      })()}
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-500 block mb-1">How can we help?</label>
                      <textarea
                        name="message"
                        rows={3}
                        placeholder="E.g., I need a night caregiver for 2 weeks..."
                        className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-gold focus:border-gold"
                      />
                    </div>
                    
                    <button type="submit" className="btn-primary w-full py-2.5 mt-2 flex items-center justify-center gap-1.5 font-semibold text-sm cursor-pointer">
                      Request Callback <ChevronRight className="h-4 w-4" />
                    </button>
                    
                    <div className="text-[10px] text-slate-400 font-medium text-center flex items-center justify-center gap-1 mt-2">
                      <span>🔒</span> Your information is secure.
                    </div>
                  </form>
                </>
              )}
            </aside>
          </div>
        </div>
      </section>

      {/* Other Services Section */}
      <section className="border-t border-border bg-cream/40">
        <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8 xl:px-12">
          <h2 className="text-2xl font-semibold text-primary text-left">Other services you may need</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {others.map((o: any) => (
              <Link key={o.slug} to="/services/$slug" params={{ slug: o.slug }} className="rounded-xl border border-border bg-background p-5 shadow-sm hover:shadow-md text-left">
                <div className="font-semibold text-primary">{o.title}</div>
                <p className="mt-1 text-sm text-muted-foreground">{o.short}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}