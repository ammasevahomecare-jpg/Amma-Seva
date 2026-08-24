import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Phone, Clock, IndianRupee, Star, ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { SiteLayout, contact } from "@/components/SiteLayout";
import { fetchServices } from "@/lib/services";
import motherBaby from "@/assets/service-mother-baby.jpg";
import nursing from "@/assets/service-nursing.jpg";
import elderly from "@/assets/service-elderly.jpg";

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
  };
  return details[slug] || {
    category: "Specialized",
    badgeClass: "bg-teal-50 text-teal-700 border border-teal-200/60",
    image: nursing,
    images: [nursing, elderly, motherBaby],
  };
}

function getSecondaryTag(category: string): [string, string] {
  switch (category) {
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
    ...(service.images || details.images || []).filter(img => img !== (service.image || details.image))
  ].filter(Boolean);

  const [activeImage, setActiveImage] = useState(serviceImages[0] || details.image);
  const [activeTab, setActiveTab] = useState<"enquiry" | "book">("enquiry");
  
  const others = allServices.filter((s: any) => s.slug !== service.slug).slice(0, 3);

  return (
    <SiteLayout>
      {/* Breadcrumb link */}
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8 text-left">
        <Link 
          to="/services" 
          className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gold hover:text-gold/80 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" /> All Services
        </Link>
      </div>

      {/* Premium Hero Header & Image Gallery */}
      <section className="py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Relative Image Box */}
          <div className="relative w-full h-[320px] md:h-[450px] rounded-3xl overflow-hidden shadow-lg border border-border/40">
            <img 
              src={activeImage} 
              alt={service.title} 
              className="w-full h-full object-cover transition-all duration-300" 
            />
            {/* Dark gradient mask on bottom/left for readability on small screens */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent md:from-black/30" />
            
            {/* Floating Card - absolutely positioned on desktop, sits below or overlapping on mobile */}
            <div className="absolute bottom-6 left-6 right-6 md:right-auto md:max-w-xl bg-white p-6 rounded-2xl shadow-2xl border border-slate-100 text-left">
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-0.5 text-xs font-semibold text-slate-700">
                  {getSecondaryTag(details.category)[0]}
                </span>
                <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-0.5 text-xs font-semibold text-slate-700">
                  {getSecondaryTag(details.category)[1]}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-primary leading-tight">
                {service.title}
              </h1>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
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
        <div className="mx-auto grid max-w-7xl grid-cols-1 lg:grid-cols-12 gap-8 px-4 py-8 sm:px-6 lg:px-8">
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
            <div className="border border-border/85 bg-[#f8f9fc] rounded-2xl p-6 shadow-xs text-left flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div className="space-y-1 flex-1">
                <h3 className="text-lg font-bold text-primary">Pricing Options</h3>
                <p className="text-sm text-slate-500">Flexible packages tailored to your care timeline.</p>
              </div>
              <div className="text-left sm:text-right shrink-0">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Starts at</div>
                <div className="text-3xl font-extrabold text-emerald-600 mt-1">
                  {service.pricing || "₹1,200"}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">{service.duration || "per shift"}</div>
              </div>
              <div className="shrink-0 w-full sm:w-auto">
                <a
                  href={
                    localStorage.getItem("ammaseva_user_token")
                      ? `/dashboard?service=${service.slug}`
                      : `/login?redirect=/dashboard?service=${service.slug}`
                  }
                  className="btn-primary w-full py-2.5 px-5 flex items-center justify-center gap-1.5 font-bold text-xs shadow-sm hover:shadow-md cursor-pointer whitespace-nowrap text-white text-center"
                >
                  Book Care Now <ArrowRight className="h-3.5 w-3.5" />
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
                  Book Care Shift
                </button>
              </div>

              {activeTab === "book" ? (
                <div className="space-y-5 py-2 animate-in fade-in duration-200">
                  <div className="rounded-2xl bg-indigo-50/50 border border-indigo-100/40 p-4 text-center space-y-3.5">
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-inner mx-auto">
                      <Clock className="h-6 w-6" />
                    </span>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-slate-800">Direct Online Booking</h4>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Skip callbacks and wait times. Set your care shift times, specify patient needs, and confirm caregivers online.
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex justify-between items-center text-xs">
                    <div>
                      <span className="text-slate-400 block mb-0.5">Starting Rate</span>
                      <span className="font-semibold text-slate-700">{service.pricing || "₹1,200"}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block mb-0.5">Billing Basis</span>
                      <span className="font-bold text-primary">{service.duration || "Per shift"}</span>
                    </div>
                  </div>

                  <a
                    href={
                      localStorage.getItem("ammaseva_user_token")
                        ? `/dashboard?service=${service.slug}`
                        : `/login?redirect=/dashboard?service=${service.slug}`
                    }
                    className="btn-primary w-full py-3 flex items-center justify-center gap-2 font-bold text-sm shadow-sm hover:shadow-md cursor-pointer text-center text-white"
                  >
                    Proceed to Booking Form <ArrowRight className="h-4 w-4" />
                  </a>

                  <p className="text-[10px] text-slate-400 text-center font-medium">
                    🔒 Secure authentication &amp; encrypted payments.
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
                    onSubmit={(e) => {
                      e.preventDefault();
                      const form = e.target as HTMLFormElement;
                      const formData = new FormData(form);
                      const data = {
                        name: formData.get("name") as string,
                        phone: formData.get("phone") as string,
                        date: formData.get("date") as string,
                        message: formData.get("message") as string,
                        service: service.title,
                      };

                      fetch("/api/enquiry", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(data),
                      })
                        .then((res) => res.json())
                        .then((resData) => {
                          if (resData.success) {
                            alert("Thank you! Our care coordinator will contact you shortly.");
                            form.reset();
                          } else {
                            alert("Error: " + (resData.error || "Failed to submit enquiry."));
                          }
                        })
                        .catch((err) => {
                          console.error(err);
                          alert("Thank you! Our care coordinator will contact you shortly.");
                          form.reset();
                        });
                    }}
                  >
                    <div>
                      <label className="text-xs font-semibold text-slate-500 block mb-1">Full Name</label>
                      <input
                        name="name"
                        type="text"
                        required
                        placeholder="Jane Doe"
                        className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-gold focus:border-gold"
                      />
                    </div>
                    
                    <div>
                      <label className="text-xs font-semibold text-slate-500 block mb-1">Phone Number</label>
                      <input
                        name="phone"
                        type="tel"
                        required
                        placeholder="+91 98765 43210"
                        className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-gold focus:border-gold"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-500 block mb-1">Expected Start Date (Optional)</label>
                      <input
                        name="date"
                        type="date"
                        className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-gold focus:border-gold text-slate-500"
                      />
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
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
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