import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ChevronLeft, Calendar, User, BookOpen, Clock, ShieldCheck, CheckCircle2, PhoneCall, ChevronRight, Share2, Award } from "lucide-react";
import { SiteLayout, contact } from "@/components/SiteLayout";
import { fetchBlogs, fetchBlogBySlug, Blog } from "@/lib/blogs";

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params }) => {
    const blog = await fetchBlogBySlug(params.slug);
    if (!blog) throw notFound();
    const list = await fetchBlogs();
    return { blog, allBlogs: list };
  },
  staleTime: 30000,
  head: ({ loaderData, params }) => {
    if (!loaderData) {
      return { meta: [{ title: "Blog not found — Amma Seva" }, { name: "robots", content: "noindex" }] };
    }
    const b = loaderData.blog;
    return {
      meta: [
        { title: `${b.title} — Amma Seva Clinical Blog` },
        { name: "description", content: b.description },
        { property: "og:title", content: `${b.title} — Amma Seva Clinical Blog` },
        { property: "og:description", content: b.description },
        { property: "og:url", content: `/blog/${params.slug}` },
      ],
      links: [{ rel: "canonical", href: `/blog/${params.slug}` }],
    };
  },
  component: BlogDetails,
});

function FormattedContent({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];

  let currentList: string[] = [];
  let isNumberedList = false;

  const flushList = () => {
    if (currentList.length > 0) {
      if (isNumberedList) {
        elements.push(
          <ol key={`ol-${elements.length}`} className="list-decimal pl-6 space-y-2 text-slate-600 my-4 text-sm leading-relaxed">
            {currentList.map((item, idx) => (
              <li key={idx} className="pl-1 font-medium">{renderInline(item)}</li>
            ))}
          </ol>
        );
      } else {
        elements.push(
          <ul key={`ul-${elements.length}`} className="space-y-2.5 my-4 text-slate-600 text-sm leading-relaxed">
            {currentList.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <span className="h-1.5 w-1.5 rounded-full bg-gold shrink-0 mt-2" />
                <span>{renderInline(item)}</span>
              </li>
            ))}
          </ul>
        );
      }
      currentList = [];
    }
  };

  const renderInline = (text: string) => {
    // Bold matching
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (trimmed.startsWith("### ")) {
      flushList();
      elements.push(
        <h3 key={index} className="text-lg font-bold text-primary font-display mt-6 mb-2">
          {trimmed.replace("### ", "")}
        </h3>
      );
    } else if (trimmed.startsWith("## ")) {
      flushList();
      elements.push(
        <h2 key={index} className="text-xl sm:text-2xl font-extrabold text-primary font-display mt-8 mb-3 pb-2 border-b border-slate-100">
          {trimmed.replace("## ", "")}
        </h2>
      );
    } else if (trimmed.startsWith("---")) {
      flushList();
      elements.push(<hr key={index} className="my-6 border-slate-200/80" />);
    } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      isNumberedList = false;
      currentList.push(trimmed.slice(2));
    } else if (/^\d+\.\s/.test(trimmed)) {
      isNumberedList = true;
      currentList.push(trimmed.replace(/^\d+\.\s/, ""));
    } else if (trimmed.length > 0) {
      flushList();
      elements.push(
        <p key={index} className="text-slate-600 text-sm sm:text-base leading-relaxed my-3 font-normal">
          {renderInline(trimmed)}
        </p>
      );
    }
  });

  flushList();

  return <div className="space-y-1 text-left">{elements}</div>;
}

function BlogDetails() {
  const { blog, allBlogs } = Route.useLoaderData();

  const others = allBlogs.filter((b: Blog) => b.slug !== blog.slug).slice(0, 4);

  return (
    <SiteLayout>
      {/* Breadcrumbs link */}
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8 text-left">
        <Link 
          to="/blog" 
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gold hover:text-gold/80 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" /> All Health Guides &amp; Insights
        </Link>
      </div>

      {/* Article Hero Banner */}
      <section className="py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative w-full h-[340px] md:h-[460px] rounded-3xl overflow-hidden shadow-xl border border-slate-200">
            <img 
              src={blog.image} 
              alt={blog.title} 
              className="w-full h-full object-cover" 
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
            
            {/* Floating Title & Metadata in Banner */}
            <div className="absolute bottom-6 left-6 right-6 md:max-w-3xl text-left text-white space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-gold text-[#0e2254] px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
                  {blog.category}
                </span>
                <span className="bg-white/20 backdrop-blur-xs text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                  <Clock className="h-3 w-3 text-gold" /> {blog.readTime || "6 min read"}
                </span>
                <span className="bg-emerald-500/90 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" /> Clinical Standard
                </span>
              </div>
              
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white font-display leading-tight drop-shadow-md">
                {blog.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-xs text-white/80 pt-2 border-t border-white/20">
                <span className="flex items-center gap-1.5 font-medium">
                  <Calendar className="h-3.5 w-3.5 text-gold" /> Published: {new Date(blog.date).toLocaleDateString("en-IN", { month: "long", day: "numeric", year: "numeric" })}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5 font-semibold text-white">
                  <User className="h-3.5 w-3.5 text-gold" /> {blog.author}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Layout Grid */}
      <section className="py-6 pb-16">
        <div className="mx-auto grid max-w-7xl grid-cols-1 lg:grid-cols-12 gap-8 px-4 sm:px-6 lg:px-8">
          
          {/* Left Column Blog Post Body */}
          <div className="lg:col-span-8 space-y-8 text-left">
            
            {/* Key Clinical Takeaways Callout Box */}
            {blog.keyTakeaways && blog.keyTakeaways.length > 0 && (
              <div className="rounded-3xl border-2 border-gold/40 bg-gradient-to-br from-cream/80 to-white p-6 sm:p-8 shadow-sm">
                <div className="flex items-center gap-2.5 mb-4 text-[#0e2254]">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold text-[#0e2254] font-black">
                    <Award className="h-4 w-4" />
                  </span>
                  <h3 className="font-display font-bold text-lg text-primary">Key Takeaways for Families &amp; Clinical Caregivers</h3>
                </div>
                <ul className="grid gap-2.5 sm:grid-cols-2">
                  {blog.keyTakeaways.map((takeaway, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-slate-700 bg-white/80 p-3 rounded-xl border border-slate-100">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="font-medium leading-snug">{takeaway}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Main Formatted Article Card */}
            <div className="border border-slate-200 bg-white rounded-3xl p-6 sm:p-10 shadow-sm space-y-6">
              <FormattedContent content={blog.content} />
            </div>

            {/* Author Credential & Review Board Stamp */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-5 text-left">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#0e2254] text-gold font-bold text-xl shadow-md">
                AS
              </div>
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-primary text-base font-display">{blog.author}</h4>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    Verified Medical Author
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Published by the Amma Seva Clinical Review Board. Our medical articles are reviewed against state healthcare guidelines, World Health Organization (WHO) home care recommendations, and Indian Council of Medical Research (ICMR) geriatric standards.
                </p>
              </div>
            </div>

          </div>

          {/* Right Column Sidebar */}
          <div className="lg:col-span-4 space-y-6 text-left">
            
            {/* Direct Helpline Card */}
            <aside className="rounded-3xl border border-gold/40 bg-[#0e2254] text-white p-6 shadow-xl text-left space-y-4 relative overflow-hidden">
              <div className="space-y-1 relative z-10">
                <span className="text-xs font-bold uppercase tracking-wider text-gold">Immediate Home Assistance</span>
                <h3 className="text-xl font-bold font-display">Need Verified Healthcare at Home?</h3>
                <p className="text-xs text-white/75 leading-relaxed">
                  Our licensed GNM nurses, bedside attendants, and physiotherapists are available across Hyderabad within 2–4 hours.
                </p>
              </div>
              <div className="pt-2 relative z-10 space-y-2.5">
                <a 
                  href={`tel:${contact.PHONE_TEL}`} 
                  className="w-full bg-gold hover:bg-gold/90 text-primary py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-sm shadow-md transition-all"
                >
                  <PhoneCall className="h-4 w-4 text-primary" /> Call {contact.PHONE}
                </a>
                <Link 
                  to="/services" 
                  className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white py-2.5 rounded-xl text-center text-xs font-bold block transition-all"
                >
                  Explore All 12 Services <ChevronRight className="h-3.5 w-3.5 inline ml-1" />
                </Link>
              </div>
            </aside>

            {/* Other Healthcare Guides */}
            {others.length > 0 && (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm text-left space-y-4">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                  Related Clinical Guides
                </h3>
                <div className="space-y-4">
                  {others.map((o: Blog) => (
                    <Link
                      key={o.slug}
                      to="/blog/$slug"
                      params={{ slug: o.slug }}
                      className="block group space-y-1 border-b border-slate-100 pb-3 last:border-0 last:pb-0"
                    >
                      <div className="flex items-center justify-between text-[10px] font-bold text-gold uppercase tracking-wider">
                        <span>{o.category}</span>
                        <span className="text-slate-400 font-normal">{o.readTime || "5 min read"}</span>
                      </div>
                      <h4 className="text-sm font-semibold text-primary group-hover:text-gold transition-colors line-clamp-2 leading-snug">
                        {o.title}
                      </h4>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Community Health Commitment Card */}
            <div className="rounded-3xl border border-border bg-cream/40 p-6 text-left space-y-2">
              <div className="flex items-center gap-2 text-primary font-bold text-sm">
                <ShieldCheck className="h-4 w-4 text-gold" /> Public Health Alignment
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Amma Seva operates under strict adherence to the National Health Mission and Senior Citizen Healthcare Welfare policies, delivering accountable, ethical home care across Telangana.
              </p>
            </div>

          </div>

        </div>
      </section>
    </SiteLayout>
  );
}
