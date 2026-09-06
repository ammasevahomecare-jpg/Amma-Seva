import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronRight, Calendar, User, ArrowRight, Clock, ShieldCheck, Sparkles, BookOpen } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { fetchBlogs, Blog } from "@/lib/blogs";

export const Route = createFileRoute("/blog/")({
  loader: async () => {
    const list = await fetchBlogs();
    return { blogs: list };
  },
  staleTime: 30000,
  head: () => ({
    meta: [
      { title: "Clinical Insights & Healthcare Guides — Amma Seva" },
      { name: "description", content: "Evidence-based health guides, clinical caregiving protocols, and geriatric insights curated by Amma Seva medical advisors." },
      { property: "og:title", content: "Amma Seva Health Insights & Clinical Guides" },
      { property: "og:description", content: "Authoritative health guides for home care, geriatric wellness, and post-operative recovery." },
      { property: "og:url", content: "/blog" },
    ],
    links: [{ rel: "canonical", href: "/blog" }],
  }),
  component: BlogList,
});

function BlogList() {
  const { blogs } = Route.useLoaderData();
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = ["All", ...Array.from(new Set(blogs.map((b) => b.category)))];

  const filteredBlogs = selectedCategory === "All"
    ? blogs
    : blogs.filter((b) => b.category === selectedCategory);

  return (
    <SiteLayout>
      {/* Blog Hero Header Section */}
      <section className="bg-gradient-to-b from-cream/60 via-cream/20 to-background border-b border-border/60 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 text-left sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/15 px-3.5 py-1 text-xs font-bold text-gold border border-gold/30 tracking-wider uppercase">
              <BookOpen className="h-3.5 w-3.5" /> Clinical Insights &amp; Health Literacy
            </span>
            <h1 className="text-4xl font-extrabold text-primary sm:text-5xl font-display leading-tight">
              Evidence-Based <span className="text-gold">Home Healthcare Guides</span>
            </h1>
            <p className="max-w-2xl text-base text-slate-600 leading-relaxed">
              Researched clinical protocols, geriatric safety guidelines, and family care frameworks authored by Amma Seva physicians, ICU nurses, and public health advisors.
            </p>
          </div>

          {/* Categories Horizontal Filtering Tabs */}
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

      {/* Blogs Listings Grid */}
      <section className="py-12 sm:py-16 bg-[#f8fafc]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {filteredBlogs.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
              <p className="text-slate-400 text-base italic">No blog posts found under this category.</p>
            </div>
          ) : (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {filteredBlogs.map((b: Blog) => (
                <article
                  key={b.slug}
                  className="group flex flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl text-left"
                >
                  {/* Blog Card Image Link */}
                  <Link
                    to="/blog/$slug"
                    params={{ slug: b.slug }}
                    className="aspect-[16/10] w-full overflow-hidden bg-slate-100 block relative"
                  >
                    <img
                      src={b.image}
                      alt={b.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {/* Category Overlay Tag */}
                    <div className="absolute top-4 left-4 z-10">
                      <span className="bg-[#0e2254]/95 text-white backdrop-blur-xs rounded-full px-3 py-0.5 text-[10px] font-bold shadow-xs">
                        {b.category}
                      </span>
                    </div>
                    {/* Read Time Tag */}
                    <div className="absolute top-4 right-4 z-10">
                      <span className="bg-white/95 text-slate-700 backdrop-blur-xs rounded-full px-2.5 py-0.5 text-[10px] font-semibold flex items-center gap-1 shadow-xs">
                        <Clock className="h-3 w-3 text-gold" /> {b.readTime || "6 min read"}
                      </span>
                    </div>
                  </Link>

                  {/* Blog Card Details */}
                  <div className="flex flex-1 flex-col p-6 space-y-3 justify-between">
                    <div className="space-y-2.5">
                      {/* Date and Author Metatags */}
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 font-semibold">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-gold" /> {new Date(b.date).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                        <span>•</span>
                        <span className="truncate max-w-[150px]">{b.author}</span>
                      </div>

                      {/* Blog Title Link */}
                      <Link
                        to="/blog/$slug"
                        params={{ slug: b.slug }}
                        className="text-lg font-bold text-primary group-hover:text-gold transition-colors duration-200 line-clamp-2 leading-snug font-display"
                      >
                        {b.title}
                      </Link>

                      {/* Description Excerpt */}
                      <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
                        {b.description}
                      </p>
                    </div>

                    {/* Read Details Action Button */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <Link
                        to="/blog/$slug"
                        params={{ slug: b.slug }}
                        className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-gold group-hover:text-gold/80 transition-colors"
                      >
                        Read Full Article <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                        Peer Reviewed
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}
