import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronRight, Calendar, User, ArrowRight } from "lucide-react";
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
      { title: "Health Tips & Family Care Guidance — Amma Seva Blog" },
      { name: "description", content: "Practical health tips, caregiving guides, and stories from the Amma Seva expert home healthcare team." },
      { property: "og:title", content: "Amma Seva Blog" },
      { property: "og:description", content: "Caregiving guidance and clinical tips." },
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
      <section className="bg-gradient-to-b from-cream/60 to-background border-b border-border/60 py-12">
        <div className="mx-auto max-w-7xl px-4 text-left sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-4">
            <span className="inline-flex items-center rounded-full bg-gold/10 px-3.5 py-1 text-xs font-semibold text-gold border border-gold/20 tracking-wider uppercase">
              Health Tips &amp; Insights
            </span>
            <h1 className="text-4xl font-extrabold text-primary sm:text-5xl leading-tight">
              Amma Seva <span className="text-gold">Insights</span>
            </h1>
            <p className="max-w-2xl text-base text-slate-500 leading-relaxed">
              Practical guides, expert health checks, and heartfelt stories curated by our clinical advisors to help you care for your loved ones at home.
            </p>
          </div>

          {/* Categories Horizontal Filtering Tabs */}
          <div className="mt-8 flex flex-wrap gap-2 pb-2 border-b border-border/40">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${
                  selectedCategory === cat
                    ? "bg-[#0e2254] text-white border-[#0e2254] shadow-sm scale-95"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Blogs Listings Grid */}
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {filteredBlogs.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-border rounded-3xl">
              <p className="text-slate-400 text-sm">No blog posts found under this category.</p>
            </div>
          ) : (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {filteredBlogs.map((b: Blog) => (
                <article
                  key={b.slug}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-border/80 bg-background shadow-xs transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg text-left"
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
                      <span className="bg-white/95 backdrop-blur-xs text-[#0e2254] border border-slate-100 rounded-full px-3 py-0.5 text-[10px] font-bold shadow-xs">
                        {b.category}
                      </span>
                    </div>
                  </Link>

                  {/* Blog Card Details */}
                  <div className="flex flex-1 flex-col p-5 space-y-3">
                    {/* Date and Author Metatags */}
                    <div className="flex items-center gap-4 text-[11px] text-slate-400 font-semibold">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-gold" /> {b.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3 text-gold" /> {b.author}
                      </span>
                    </div>

                    {/* Blog Title Link */}
                    <Link
                      to="/blog/$slug"
                      params={{ slug: b.slug }}
                      className="text-lg font-bold text-primary group-hover:text-gold transition-colors duration-200 line-clamp-2"
                    >
                      {b.title}
                    </Link>

                    {/* Description Excerpt */}
                    <p className="flex-1 text-sm text-slate-500 leading-relaxed line-clamp-3">
                      {b.description}
                    </p>

                    {/* Read Details Action Button */}
                    <div className="pt-2">
                      <Link
                        to="/blog/$slug"
                        params={{ slug: b.slug }}
                        className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-gold group-hover:text-gold/80 transition-colors"
                      >
                        Read Full Post <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
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
