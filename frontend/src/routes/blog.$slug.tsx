import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ChevronLeft, Calendar, User, BookOpen } from "lucide-react";
import { SiteLayout, contact } from "@/components/SiteLayout";
import { fetchBlogs, fetchBlogBySlug, Blog } from "@/lib/blogs";

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params }) => {
    const blog = await fetchBlogBySlug(params.slug);
    if (!blog) throw notFound();
    const list = await fetchBlogs();
    return { blog, allBlogs: list };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) {
      return { meta: [{ title: "Blog not found — Amma Seva" }, { name: "robots", content: "noindex" }] };
    }
    const b = loaderData.blog;
    return {
      meta: [
        { title: `${b.title} — Amma Seva Blog` },
        { name: "description", content: b.description },
        { property: "og:title", content: `${b.title} — Amma Seva Blog` },
        { property: "og:description", content: b.description },
        { property: "og:url", content: `/blog/${params.slug}` },
      ],
      links: [{ rel: "canonical", href: `/blog/${params.slug}` }],
    };
  },
  component: BlogDetails,
});

function BlogDetails() {
  const { blog, allBlogs } = Route.useLoaderData();

  const others = allBlogs.filter((b: Blog) => b.slug !== blog.slug).slice(0, 3);

  return (
    <SiteLayout>
      {/* Breadcrumbs link */}
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8 text-left">
        <Link 
          to="/blog" 
          className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gold hover:text-gold/80 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" /> All Articles
        </Link>
      </div>

      {/* Premium Hero Banner & Image Gallery */}
      <section className="py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Relative Image Box */}
          <div className="relative w-full h-[320px] md:h-[450px] rounded-3xl overflow-hidden shadow-lg border border-border/40">
            <img 
              src={blog.image} 
              alt={blog.title} 
              className="w-full h-full object-cover" 
            />
            {/* Dark gradient mask on bottom/left for readability on small screens */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent md:from-black/30" />
            
            {/* Floating Card - absolutely positioned on desktop, sits below or overlapping on mobile */}
            <div className="absolute bottom-6 left-6 right-6 md:right-auto md:max-w-xl bg-white p-6 rounded-2xl shadow-2xl border border-slate-100 text-left">
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="inline-flex items-center rounded-full bg-gold/10 px-3 py-0.5 text-xs font-semibold text-gold border border-gold/20">
                  {blog.category}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-primary leading-tight">
                {blog.title}
              </h1>
              {/* Date and Author details row */}
              <div className="flex items-center gap-4 text-xs text-slate-400 font-semibold mt-3.5 pt-3.5 border-t border-slate-100">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-gold" /> {blog.date}
                </span>
                <span className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-gold" /> {blog.author}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Layout Grid */}
      <section>
        <div className="mx-auto grid max-w-7xl grid-cols-1 lg:grid-cols-12 gap-8 px-4 py-8 sm:px-6 lg:px-8">
          
          {/* Left Column Blog Post Body */}
          <div className="lg:col-span-8 space-y-6">
            <div className="border border-border/85 bg-background rounded-2xl p-8 shadow-sm text-left">
              <div className="flex items-center gap-2.5 mb-6 border-b border-border/60 pb-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold/10 text-gold border border-gold/20 shadow-sm">
                  <BookOpen className="h-5 w-5" />
                </span>
                <h2 className="text-xl font-bold text-primary font-display">Article Narrative</h2>
              </div>
              
              {/* Formatted Text Content */}
              <div className="prose max-w-none text-slate-600 text-sm leading-relaxed whitespace-pre-wrap space-y-4">
                {blog.content}
              </div>
            </div>
          </div>

          {/* Right Column Sidebar Other Posts */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Sidebar Helpline Card */}
            <aside className="rounded-2xl border border-gold/30 bg-[#0e2254] text-white p-6 shadow-md text-left space-y-4 relative overflow-hidden">
              <div className="absolute right-0 bottom-0 text-white/5 pointer-events-none transform translate-x-10 translate-y-10">
                <BookOpen className="h-40 w-40" />
              </div>
              <div className="space-y-1 relative z-10">
                <h3 className="text-lg font-bold">Need Personal Care?</h3>
                <p className="text-xs text-white/70 leading-relaxed">
                  Our professional, verified caregivers and clinical nurses are available for shifts across Hyderabad.
                </p>
              </div>
              <div className="pt-2 relative z-10 space-y-2">
                <a href={`tel:${contact.PHONE_TEL}`} className="btn-primary w-full bg-gold hover:bg-gold/90 text-primary py-2.5 flex items-center justify-center gap-1.5 font-bold text-sm">
                  Call {contact.PHONE}
                </a>
                <Link to="/services" className="btn-outline w-full border-white/20 text-white hover:bg-white/10 py-2 text-center text-xs font-semibold block">
                  Explore Services
                </Link>
              </div>
            </aside>

            {/* Other Health Guides Section */}
            {others.length > 0 && (
              <div className="rounded-2xl border border-border bg-background p-6 shadow-sm text-left">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Other Health Guides</h3>
                <div className="space-y-4">
                  {others.map((o: Blog) => (
                    <Link
                      key={o.slug}
                      to="/blog/$slug"
                      params={{ slug: o.slug }}
                      className="block group space-y-1 border-b border-border/40 pb-3 last:border-0 last:pb-0"
                    >
                      <div className="text-[10px] font-bold text-gold uppercase tracking-wider">{o.category}</div>
                      <h4 className="text-sm font-semibold text-primary group-hover:text-gold transition-colors line-clamp-2">
                        {o.title}
                      </h4>
                    </Link>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>
      </section>

      {/* Bottom spacing helper */}
      <div className="py-4" />
    </SiteLayout>
  );
}
