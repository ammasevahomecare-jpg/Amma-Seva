import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { fetchGallery } from "@/lib/gallery";
import { X, ZoomIn } from "lucide-react";
import { getServiceDetails } from "@/routes/index";

export const Route = createFileRoute("/gallery")({
  loader: async () => {
    return await fetchGallery();
  },
  staleTime: 30000,
  head: () => ({
    meta: [
      { title: "Photo Gallery — Amma Seva Home Healthcare" },
      { name: "description", content: "Explore photos of the Amma Seva clinical team, care events, and home healthcare services." },
      { property: "og:title", content: "Amma Seva Gallery" },
      { property: "og:description", content: "Explore our home healthcare gallery." },
      { property: "og:url", content: "/gallery" },
    ],
    links: [{ rel: "canonical", href: "/gallery" }],
  }),
  component: GalleryPage,
});

function GalleryPage() {
  const items = Route.useLoaderData();
  const [selectedImg, setSelectedImg] = useState<string | null>(null);
  const [selectedTitle, setSelectedTitle] = useState<string | null>(null);

  return (
    <SiteLayout>
      <section className="border-b border-border bg-cream/40">
        <div className="mx-auto max-w-7xl px-4 py-8 text-left sm:px-6 lg:px-8">
          <h1 className="gold-rule text-4xl font-extrabold text-primary sm:text-5xl font-display">Gallery</h1>
          <h4 className="mt-2 text-lg font-semibold text-slate-600 font-display">Moments of care and compassion</h4>
          <p className="mt-2 max-w-2xl text-slate-500 text-sm leading-relaxed">
            A glimpse into the life-changing support, clinical procedures, and home recovery checkups delivered daily by our caregivers and nurses.
          </p>
        </div>
      </section>

      <section className="py-12 sm:py-16 bg-[#fbfbfe]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {items.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-200/50 p-8 shadow-sm">
              <p className="text-slate-400 text-base italic">No photos added to the gallery yet.</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setSelectedImg(item.imageUrl);
                    setSelectedTitle(item.title);
                  }}
                  className="group relative cursor-pointer overflow-hidden rounded-3xl bg-white shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-1.5 premium-card"
                >
                  <div className="relative aspect-square w-full overflow-hidden bg-slate-100 block">
                    <img 
                      src={item.imageUrl} 
                      alt={item.title} 
                      loading="lazy" 
                      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-108" 
                    />
                    <div className="absolute inset-0 bg-primary/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <div className="p-3 bg-white/95 rounded-full shadow-lg text-primary transform scale-90 group-hover:scale-100 transition-transform duration-300">
                        <ZoomIn className="h-5 w-5 text-gold" />
                      </div>
                    </div>
                  </div>
                  <div className="p-4 text-left border-t border-slate-100 bg-white">
                    <h3 className="font-display font-bold text-primary text-base truncate">{item.title}</h3>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                      Added {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Lightbox Modal */}
      {selectedImg && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => {
            setSelectedImg(null);
            setSelectedTitle(null);
          }}
        >
          <button 
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-2.5 rounded-full cursor-pointer transition-colors"
            onClick={() => {
              setSelectedImg(null);
              setSelectedTitle(null);
            }}
          >
            <X className="h-6 w-6" />
          </button>
          
          <div 
            className="relative max-h-[85vh] max-w-[95vw] md:max-w-4xl bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col items-center animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={selectedImg} 
              alt={selectedTitle || "Gallery"} 
              className="max-h-[75vh] w-full object-contain bg-slate-50"
            />
            {selectedTitle && (
              <div className="w-full bg-white p-5 border-t border-slate-100 text-left">
                <h3 className="font-display font-bold text-lg text-primary">{selectedTitle}</h3>
              </div>
            )}
          </div>
        </div>
      )}
    </SiteLayout>
  );
}
