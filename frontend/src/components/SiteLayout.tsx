import { Link } from "@tanstack/react-router";
import { useState, useEffect, type ReactNode } from "react";
import { Menu, X, Phone, MessageCircle, Mail, MapPin, Facebook, Instagram } from "lucide-react";
import logoAsset from "@/assets/amma-seva-logo.png";
import { fetchServices, type Service } from "@/lib/services";

const PHONE = "+91 94945 16543";
const PHONE_TEL = "+919494516543";
const WHATSAPP = "919494516543";
const EMAIL = "info@ammaseva.in";

function Header() {
  const [open, setOpen] = useState(false);
  const [isUser, setIsUser] = useState(false);
  const [isCaretaker, setIsCaretaker] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const checkAuth = () => {
      setIsUser(!!localStorage.getItem("ammaseva_user_token"));
      setIsCaretaker(!!localStorage.getItem("ammaseva_caretaker_token"));
    };
    checkAuth();
    const interval = setInterval(checkAuth, 1500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        setScrollProgress((window.scrollY / totalHeight) * 100);
      } else {
        setScrollProgress(0);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const dynamicNav = [
    { to: "/", label: "Home" },
    { to: "/services", label: "Services" },
    { to: "/about", label: "About" },
    { to: "/blog", label: "Blog" },
    { to: "/careers", label: "Careers" },
    { to: "/contact", label: "Contact" },
  ];

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-300 ease-in-out ${
        isScrolled
          ? "border-b border-white/10 bg-primary/95 shadow-lg shadow-primary/20 backdrop-blur-md py-1.5"
          : "border-b border-border/40 bg-background py-2.5"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="group flex items-center gap-3.5">
          <div className="relative flex items-center justify-center">
            <img
              src={logoAsset}
              alt="Amma Seva"
              className={`rounded-full bg-white p-1 border border-border/60 shadow-sm object-cover transition-all duration-300 ease-in-out ${
                isScrolled ? "h-14 w-14" : "h-16 w-16"
              }`}
              width={isScrolled ? 56 : 64}
              height={isScrolled ? 56 : 64}
            />
            <div className="absolute inset-0 -z-10 rounded-full bg-gold/20 opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-100" />
          </div>
          <div className="leading-tight">
            <div className={`font-display text-xl font-bold transition-all duration-300 ${
              isScrolled ? "text-white" : "text-primary group-hover:text-gold"
            }`}>
              Amma <span className={`text-gold transition-colors duration-300 ${
                isScrolled ? "" : "group-hover:text-primary"
              }`}>Seva</span>
            </div>
            <div
              className={`uppercase tracking-widest text-muted-foreground transition-all duration-300 ease-in-out sm:block ${
                isScrolled ? "h-0 opacity-0 overflow-hidden text-[0px] mt-0" : "hidden text-[10px] opacity-100 mt-0.5"
              }`}
            >
              Professional Care with a Mother&apos;s Touch
            </div>
          </div>
        </Link>
        <nav className="hidden items-center gap-2 lg:flex">
          {dynamicNav.map((n) => (
            <Link
              key={n.label + n.to}
              to={n.to}
              className={`px-4 py-1.5 text-sm font-medium rounded-tl-2xl rounded-br-2xl rounded-tr-sm rounded-bl-sm transition-all duration-300 flex items-center gap-1 ${
                isScrolled
                  ? "text-white/80 hover:bg-white/10 hover:text-white"
                  : "text-foreground/80 hover:bg-secondary/60 hover:text-primary"
              }`}
              activeProps={{
                className: isScrolled
                  ? "bg-gold text-gold-foreground font-semibold rounded-tl-2xl rounded-br-2xl rounded-tr-sm rounded-bl-sm shadow-sm shadow-gold/20"
                  : "bg-primary text-primary-foreground font-semibold rounded-tl-2xl rounded-br-2xl rounded-tr-sm rounded-bl-sm shadow-sm shadow-primary/10"
              }}
              activeOptions={{ exact: n.to === "/" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2.5 lg:flex shrink-0">
          <a
            href={`tel:${PHONE_TEL}`}
            className={`btn-outline text-sm shrink-0 whitespace-nowrap ${
              isScrolled
                ? "text-white! border-white/50! hover:bg-white! hover:text-primary! hover:shadow-white/10"
                : ""
            }`}
          >
            <Phone className="h-4 w-4" /> Call Now
          </a>
          {isUser ? (
            <Link to="/dashboard" className={`text-sm shrink-0 whitespace-nowrap ${isScrolled ? "btn-gold" : "btn-primary"}`}>
              My Dashboard
            </Link>
          ) : isCaretaker ? (
            <Link to="/dashboard" className={`text-sm shrink-0 whitespace-nowrap ${isScrolled ? "btn-gold" : "btn-primary"}`}>
              My Profile
            </Link>
          ) : (
            <Link to="/login" className={`text-sm shrink-0 whitespace-nowrap ${isScrolled ? "btn-gold" : "btn-primary"}`}>
              Book &amp; Login
            </Link>
          )}
        </div>
        <button
          type="button"
          className={`rounded-full p-2.5 transition-all duration-300 lg:hidden ${
            isScrolled ? "text-white hover:bg-white/10" : "text-primary hover:bg-secondary"
          }`}
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
      {open && (
        <div className="border-t border-border/80 bg-background/95 backdrop-blur-md lg:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4">
            {dynamicNav.map((n) => (
              <Link
                key={n.label + n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="rounded-full px-4 py-2 text-sm font-medium text-foreground/80 hover:bg-secondary hover:text-primary transition-all duration-200"
                activeProps={{ className: "bg-secondary text-primary font-semibold" }}
              >
                {n.label}
              </Link>
            ))}
            <div className="mt-4 flex gap-2.5">
              <a href={`tel:${PHONE_TEL}`} className="btn-outline flex-1 text-sm">
                <Phone className="h-4 w-4" /> Call
              </a>
              {isUser ? (
                <Link to="/dashboard" onClick={() => setOpen(false)} className="btn-primary flex-1 text-sm text-center">
                  Dashboard
                </Link>
              ) : isCaretaker ? (
                <Link to="/dashboard" onClick={() => setOpen(false)} className="btn-primary flex-1 text-sm text-center">
                  Profile
                </Link>
              ) : (
                <Link to="/login" onClick={() => setOpen(false)} className="btn-primary flex-1 text-sm text-center">
                  Login / Book
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Scroll Reading Progress Bar */}
      <div className="absolute bottom-0 left-0 h-[2px] w-full bg-border/20">
        <div
          className="h-full bg-gold transition-all duration-150 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>
    </header>
  );
}

function Footer() {
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    fetchServices().then((list) => {
      // Show up to 4 services dynamically in the footer
      setServices(list.slice(0, 4));
    });
  }, []);

  return (
    <footer className="bg-[#0b183b] text-white border-t border-slate-800">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-12 lg:px-8">
        
        {/* Brand details */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-white p-1 shadow-sm border border-slate-200/10 shrink-0">
              <img src={logoAsset} alt="Amma Seva" className="h-full w-full object-contain" width={40} height={40} />
            </div>
            <div className="font-display text-xl font-bold tracking-wide">
              Amma <span className="text-gold">Seva</span>
            </div>
          </div>
          <p className="max-w-sm text-sm text-slate-400 leading-relaxed text-left">
            Hyderabad&apos;s trusted home healthcare and caregiving network — delivering professional care with the warmth of a mother&apos;s touch.
          </p>
          <div className="flex gap-2.5 pt-2">
            <a 
              href="#" 
              aria-label="Facebook" 
              className="rounded-full border border-slate-700/60 p-2 text-slate-400 hover:bg-gold hover:text-[#0b183b] hover:border-gold transition-all duration-300"
            >
              <Facebook className="h-4 w-4" />
            </a>
            <a 
              href="#" 
              aria-label="Instagram" 
              className="rounded-full border border-slate-700/60 p-2 text-slate-400 hover:bg-gold hover:text-[#0b183b] hover:border-gold transition-all duration-300"
            >
              <Instagram className="h-4 w-4" />
            </a>
            <a 
              href={`https://wa.me/${WHATSAPP}`} 
              aria-label="WhatsApp" 
              className="rounded-full border border-slate-700/60 p-2 text-slate-400 hover:bg-gold hover:text-[#0b183b] hover:border-gold transition-all duration-300"
            >
              <MessageCircle className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* Services Links */}
        <div className="lg:col-span-3 text-left">
          <h4 className="text-xs font-bold uppercase tracking-widest text-white mb-4 flex items-center gap-1.5">
            <span className="h-3 w-0.5 bg-gold rounded-full" /> Services
          </h4>
          <ul className="space-y-2 text-sm text-slate-400">
            {services.map((s) => (
              <li key={s.slug}>
                <Link to="/services/$slug" params={{ slug: s.slug }} className="hover:text-gold transition-colors">
                  {s.title}
                </Link>
              </li>
            ))}
            <li><Link to="/services" className="text-gold font-semibold hover:underline">All services →</Link></li>
          </ul>
        </div>

        {/* Company Links */}
        <div className="lg:col-span-2 text-left">
          <h4 className="text-xs font-bold uppercase tracking-widest text-white mb-4 flex items-center gap-1.5">
            <span className="h-3 w-0.5 bg-gold rounded-full" /> Company
          </h4>
          <ul className="space-y-2 text-sm text-slate-400">
            <li><Link to="/about" className="hover:text-gold transition-colors">About Us</Link></li>
            <li><Link to="/careers" className="hover:text-gold transition-colors">Careers</Link></li>
            <li><Link to="/blog" className="hover:text-gold transition-colors">Blog &amp; Insights</Link></li>
            <li><Link to="/contact" className="hover:text-gold transition-colors">Contact</Link></li>
            <li><Link to="/privacy" className="hover:text-gold transition-colors">Privacy Policy</Link></li>
            <li><Link to="/terms" className="hover:text-gold transition-colors">Terms &amp; Conditions</Link></li>
            <li><Link to="/refund" className="hover:text-gold transition-colors">Refund Policy</Link></li>
          </ul>
        </div>

        {/* Reach Us contact details */}
        <div className="lg:col-span-3 text-left">
          <h4 className="text-xs font-bold uppercase tracking-widest text-white mb-4 flex items-center gap-1.5">
            <span className="h-3 w-0.5 bg-gold rounded-full" /> Reach Us
          </h4>
          <ul className="space-y-3 text-sm text-slate-400">
            <li className="flex items-start gap-2.5">
              <Phone className="mt-0.5 h-4 w-4 text-gold shrink-0" />
              <a href={`tel:${PHONE_TEL}`} className="hover:text-gold transition-colors">{PHONE}</a>
            </li>
            <li className="flex items-start gap-2.5">
              <MessageCircle className="mt-0.5 h-4 w-4 text-gold shrink-0" />
              <a href={`https://wa.me/${WHATSAPP}`} className="hover:text-gold transition-colors">WhatsApp Chat</a>
            </li>
            <li className="flex items-start gap-2.5">
              <Mail className="mt-0.5 h-4 w-4 text-gold shrink-0" />
              <a href={`mailto:${EMAIL}`} className="hover:text-gold transition-colors">{EMAIL}</a>
            </li>
            <li className="flex items-start gap-2.5">
              <MapPin className="mt-1 h-4 w-4 text-gold shrink-0" />
              <span className="leading-relaxed">
                <strong>LUXDHANA GLOBAL PRIVATE LIMITED</strong><br />
                8-2-630/B/B/1, Mount Banjara complex,<br />
                Road No. 12, Banjara Hills,<br />
                Hyderabad - 500034, Telangana.
              </span>
            </li>
          </ul>
        </div>

      </div>

      {/* Darker Copyright Bottom Bar */}
      <div className="bg-[#050f28] py-5 border-t border-slate-900/60 text-xs text-slate-500">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 sm:px-6 lg:flex-row lg:px-8">
          <span>© {new Date().getFullYear()} Amma Seva Home Healthcare. All rights reserved.</span>
          <span className="text-gold font-medium">Professional Care with a Mother&apos;s Touch.</span>
        </div>
      </div>
    </footer>
  );
}

function FloatingActions() {
  return (
    <>
      <a
        href={`https://wa.me/${WHATSAPP}`}
        target="_blank"
        rel="noreferrer"
        aria-label="Chat on WhatsApp"
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105"
      >
        <MessageCircle className="h-7 w-7" />
      </a>
      <a
        href={`tel:${PHONE_TEL}`}
        aria-label="Call Amma Seva"
        className="fixed bottom-5 left-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 sm:hidden"
      >
        <Phone className="h-6 w-6" />
      </a>
    </>
  );
}

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <FloatingActions />
    </div>
  );
}

export const contact = { PHONE, PHONE_TEL, WHATSAPP, EMAIL };