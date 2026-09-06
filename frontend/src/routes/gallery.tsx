import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { fetchGallery, GalleryItem } from "@/lib/gallery";
import { X, ZoomIn, MapPin, Calendar, ShieldCheck, HeartHandshake, PhoneCall, ChevronRight } from "lucide-react";
import { contact } from "@/components/SiteLayout";

export const Route = createFileRoute("/gallery")({
  loader: async () => {
    return await fetchGallery();
  },
  staleTime: 30000,
  head: () => ({
    meta: [
      { title: "Care Gallery & Field Moments — Amma Seva Home Healthcare" },
      { name: "description", content: "Explore authentic photo moments of Amma Seva clinical visits, elderly companionship, mother & baby care, and home rehabilitation across Hyderabad." },
      { property: "og:title", content: "Amma Seva Care Gallery" },
      { property: "og:description", content: "Moments of compassion, clinical care, and dignified home recovery." },
      { property: "og:url", content: "/gallery" },
    ],
    links: [{ rel: "canonical", href: "/gallery" }],
  }),
  component: GalleryPage,
});

function GalleryPage() {
  const items = Route.useLoaderData();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);

  const categories = ["All", ...Array.from(new Set(items.map((i) => i.category)))];

  const filteredItems = selectedCategory === "All"
    ? items
    : items.filter((i) => i.category === selectedCategory);

  return (
    <SiteLayout>
      {/* Header Banner */}
      <section className="border-b border-border/70 bg-gradient-to-b from-cream/60 via-cream/20 to-background py-10 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 text-left sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/15 px-3.5 py-1 text-xs font-bold text-gold border border-gold/30 tracking-wider uppercase">
              <ShieldCheck className="h-3.5 w-3.5" /> Authentic Care In Action
            </span>
            <h1 className="text-4xl font-extrabold text-primary sm:text-5xl font-display leading-tight">
              Moments of <span className="text-gold">Care &amp; Healing</span>
            </h1>
            <p className="text-base text-slate-600 leading-relaxed max-w-2xl">
              Real moments from home visits across Hyderabad &amp; Telangana. Our qualified nurses, caregivers, and doctors deliver hospital-grade clinical precision with the warmth of family.
            </p>
          </div>

          {/* Interactive Category Filter Pills */}
          <div className="mt-8 flex flex-wrap gap-2 pt-2 border-t border-border/40">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-[#0e2254] text-white shadow-md scale-95 border border-[#0e2254]"
                    : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="py-12 sm:py-16 bg-[#f8fafc]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {filteredItems.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
              <p className="text-slate-400 text-base italic">No photos found under this category.</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className="group relative cursor-pointer overflow-hidden rounded-3xl bg-white shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-1.5 border border-slate-100 flex flex-col"
                >
                  {/* Photo Container */}
                  <div className="relative aspect-[16/11] w-full overflow-hidden bg-slate-100 block">
                    <img 
                      src={item.imageUrl} 
                      alt={item.title} 
                      loading="lazy" 
                      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-108" 
                    />
                    
                    {/* Top Floating Category & Badge */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10 pointer-events-none">
                      <span className="bg-white/95 backdrop-blur-xs text-[#0e2254] border border-slate-100 rounded-full px-2.5 py-0.5 text-[10px] font-bold shadow-xs">
                        {item.category}
                      </span>
                      {item.badge && (
                        <span className="bg-gold text-[#0e2254] font-black rounded-full px-2.5 py-0.5 text-[9px] uppercase tracking-wider shadow-sm">
                          {item.badge}
                        </span>
                      )}
                    </div>

                    {/* Hover Zoom Overlay */}
                    <div className="absolute inset-0 bg-[#0e2254]/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <div className="px-4 py-2 bg-white/95 rounded-full shadow-lg text-primary transform scale-90 group-hover:scale-100 transition-transform duration-300 flex items-center gap-1.5 text-xs font-bold">
                        <ZoomIn className="h-4 w-4 text-gold" /> View Case Details
                      </div>
                    </div>
                  </div>

                  {/* Card Content & Clinical Context */}
                  <div className="p-5 text-left bg-white flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                        <MapPin className="h-3 w-3 text-emerald-600 shrink-0" />
                        <span>{item.location}</span>
                      </div>
                      <h3 className="font-display font-bold text-primary text-base leading-snug group-hover:text-gold transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                        {item.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-gold" />
                        {new Date(item.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                      <span className="font-bold text-gold inline-flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                        Explore <ChevronRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Lightbox Modal with Full Case Narrative */}
      {selectedItem && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedItem(null)}
        >
          <button 
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-2.5 rounded-full cursor-pointer transition-colors z-50"
            onClick={() => setSelectedItem(null)}
          >
            <X className="h-6 w-6" />
          </button>
          
          <div 
            className="relative max-h-[90vh] max-w-[95vw] md:max-w-4xl bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Image Preview */}
            <div className="relative bg-slate-900 flex items-center justify-center max-h-[55vh] overflow-hidden">
              <img 
                src={selectedItem.imageUrl} 
                alt={selectedItem.title} 
                className="max-h-[55vh] w-full object-contain"
              />
              <div className="absolute top-4 left-4 flex gap-2">
                <span className="bg-[#0e2254] text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">
                  {selectedItem.category}
                </span>
                {selectedItem.badge && (
                  <span className="bg-gold text-[#0e2254] px-3 py-1 rounded-full text-xs font-extrabold shadow-md">
                    {selectedItem.badge}
                  </span>
                )}
              </div>
            </div>

            {/* Narrative Context */}
            <div className="w-full bg-white p-6 sm:p-8 text-left space-y-4 overflow-y-auto">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                  <MapPin className="h-4 w-4 text-emerald-600" />
                  <span>{selectedItem.location}</span>
                </div>
                <div className="text-xs text-slate-400 font-medium">
                  Verified Visit Date: {new Date(selectedItem.createdAt).toLocaleDateString("en-IN", { month: "long", day: "numeric", year: "numeric" })}
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="font-display font-bold text-xl sm:text-2xl text-primary">
                  {selectedItem.title}
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {selectedItem.description}
                </p>
              </div>

              {/* Action Banner */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-4 bg-cream/40 p-4 rounded-2xl border border-border/60">
                <div className="text-xs text-slate-600">
                  <span className="font-bold text-primary">Need similar care for your family?</span> Our clinical coordinators arrange verified shifts within 2–4 hours.
                </div>
                <div className="flex items-center gap-3">
                  <a
                    href={`tel:${contact.PHONE_TEL}`}
                    className="inline-flex items-center gap-1.5 bg-[#0e2254] hover:bg-[#0e2254]/90 text-white px-4 py-2 rounded-full text-xs font-bold shadow-sm transition-all"
                  >
                    <PhoneCall className="h-3.5 w-3.5 text-gold" /> Call Helpline
                  </a>
                  <Link
                    to="/contact"
                    className="inline-flex items-center gap-1 bg-gold hover:bg-gold/90 text-primary px-4 py-2 rounded-full text-xs font-bold shadow-sm transition-all"
                    onClick={() => setSelectedItem(null)}
                  >
                    Request Booking <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </SiteLayout>
  );
}
