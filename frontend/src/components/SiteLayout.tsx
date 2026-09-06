import { Link } from "@tanstack/react-router";
import { useState, useEffect, type ReactNode } from "react";
import { Menu, X, Phone, MessageCircle, Mail, MapPin, Building2, Award } from "lucide-react";
import logoAsset from "@/assets/amma-seva-logo.png";
import { fetchServices, type Service } from "@/lib/services";
import { LaunchScreen, CommemorativeLaunchBanner } from "./LaunchScreen";

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
    { to: "/services", label: "Services", hasDropdown: true },
    { to: "/mtp", label: "MTP (Multi Tasking)" },
    { to: "/about", label: "About" },
    { to: "/gallery", label: "Gallery" },
    { to: "/blog", label: "Blog" },
    { to: "/careers", label: "Careers" },
    { to: "/contact", label: "Contact" },
  ];

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-300 ease-in-out border-b border-white/10 bg-primary shadow-lg shadow-primary/20 backdrop-blur-md ${
        isScrolled ? "py-2" : "py-3"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="group flex items-center gap-3 shrink-0">
          <div className="relative flex items-center justify-center shrink-0">
            <img
              src={logoAsset}
              alt="Amma Seva"
              className="h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-white p-1 border border-white/20 shadow-md object-contain transition-all duration-300 ease-in-out group-hover:scale-105"
              width={44}
              height={44}
            />
            <div className="absolute inset-0 -z-10 rounded-full bg-gold/25 opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-100" />
          </div>
          <div className="flex flex-col justify-center text-left">
            <div className="font-display text-lg sm:text-xl font-bold transition-all duration-300 text-white group-hover:text-gold flex items-center gap-1.5 leading-none">
              Amma <span className="text-gold transition-colors duration-300 group-hover:text-white">Seva</span>
            </div>
            <div
              className={`uppercase tracking-widest text-slate-300/85 transition-all duration-300 ease-in-out ${
                isScrolled ? "h-0 opacity-0 overflow-hidden text-[0px] mt-0" : "hidden sm:block text-[9px] sm:text-[10px] opacity-100 mt-1"
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
              className="px-4 py-1.5 text-sm font-medium rounded-tl-2xl rounded-br-2xl rounded-tr-sm rounded-bl-sm transition-all duration-300 flex items-center gap-1 text-white/80 hover:bg-white/10 hover:text-white"
              activeProps={{
                className: "bg-white/10 text-white font-semibold rounded-tl-2xl rounded-br-2xl rounded-tr-sm rounded-bl-sm border border-gold/70 shadow-sm shadow-gold/25"
              }}
              activeOptions={{ exact: n.to === "/" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2.5 lg:flex shrink-0">
          {isUser ? (
            <Link to="/dashboard" className="text-sm shrink-0 whitespace-nowrap btn-gold">
              My Dashboard
            </Link>
          ) : isCaretaker ? (
            <Link to="/dashboard" className="text-sm shrink-0 whitespace-nowrap btn-gold">
              My Profile
            </Link>
          ) : (
            <Link to="/login" className="text-sm shrink-0 whitespace-nowrap btn-gold">
              Book &amp; Login
            </Link>
          )}
        </div>
        <button
          type="button"
          className="rounded-full p-2.5 transition-all duration-300 lg:hidden text-white hover:bg-white/10"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
      {open && (
        <div className="border-t border-white/10 bg-primary/95 backdrop-blur-md lg:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4 text-left">
            {dynamicNav.map((n) => (
              <Link
                key={n.label + n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="rounded-full px-4 py-2 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white transition-all duration-200"
                activeProps={{ className: "bg-white/10 text-white font-semibold border border-gold/40" }}
              >
                {n.label}
              </Link>
            ))}
            <div className="mt-4 flex gap-2.5">
              {isUser ? (
                <Link to="/dashboard" onClick={() => setOpen(false)} className="btn-gold flex-1 text-sm text-center">
                  Dashboard
                </Link>
              ) : isCaretaker ? (
                <Link to="/dashboard" onClick={() => setOpen(false)} className="btn-gold flex-1 text-sm text-center">
                  Profile
                </Link>
              ) : (
                <Link to="/login" onClick={() => setOpen(false)} className="btn-gold flex-1 text-sm text-center text-white!">
                  Login / Book
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Scroll Reading Progress Bar */}
      <div className="absolute bottom-0 left-0 h-[2px] w-full bg-white/10">
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
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-12 lg:px-8">
        
        {/* 1. Brand details */}
        <div className="lg:col-span-3 space-y-4 text-left">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-white p-1 shadow-sm border border-slate-200/10 shrink-0">
              <img src={logoAsset} alt="Amma Seva" className="h-full w-full object-contain" width={40} height={40} />
            </div>
            <div className="font-display text-xl font-bold tracking-wide text-white">
              Amma <span className="text-gold">Seva</span>
            </div>
          </div>
          <p className="max-w-sm text-xs text-slate-400 leading-relaxed text-left">
            Hyderabad&apos;s trusted home healthcare and caregiving network — delivering professional care with the warmth of a mother&apos;s touch.
          </p>
          <div className="flex items-center gap-3 pt-2">
            {/* Facebook */}
            <a 
              href="https://facebook.com" 
              target="_blank"
              rel="noreferrer"
              aria-label="Facebook" 
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1877F2] text-white shadow-md transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-[#1877F2]/40"
            >
              <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 fill-white" xmlns="http://www.w3.org/2000/svg">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>

            {/* Instagram */}
            <a 
              href="https://instagram.com" 
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram" 
              className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white shadow-md transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-[#ee2a7b]/40"
            >
              <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 fill-white" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>

            {/* WhatsApp */}
            <a 
              href={`https://wa.me/${WHATSAPP}`} 
              target="_blank"
              rel="noreferrer"
              aria-label="WhatsApp" 
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#25D366] text-white shadow-md transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-[#25D366]/40"
            >
              <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 fill-white" xmlns="http://www.w3.org/2000/svg">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.864.002-2.637-1.03-5.114-2.905-6.99C16.546 1.875 14.072 1.84 11.43 1.84 6.002 1.84 1.578 6.262 1.574 11.693c-.001 1.705.452 3.369 1.31 4.8l-.94 3.433 3.506-.921zm12.338-7.531c-.34-.17-2.01-.993-2.321-1.106-.312-.113-.538-.17-.765.17-.227.34-.879 1.106-1.078 1.328-.199.222-.399.249-.739.08-.34-.17-1.436-.53-2.735-1.69-1.01-.9-1.694-2.01-1.892-2.35-.198-.34-.021-.524.149-.693.153-.152.34-.399.51-.599.17-.2.227-.34.34-.566.113-.227.056-.425-.028-.595-.085-.17-.765-1.842-1.049-2.528-.276-.662-.555-.572-.765-.583-.198-.011-.425-.013-.652-.013-.227 0-.595.085-.907.425-.312.34-1.191 1.164-1.191 2.837 0 1.673 1.218 3.293 1.388 3.52.17.227 2.399 3.662 5.811 5.137.812.35 1.446.56 1.94.717.816.26 1.56.223 2.148.135.656-.098 2.01-.822 2.294-1.583.283-.762.283-1.417.198-1.583-.085-.17-.312-.27-.652-.44z"/>
              </svg>
            </a>
          </div>
        </div>

        {/* 2. Services Links */}
        <div className="lg:col-span-2 text-left">
          <h4 className="text-xs font-bold uppercase tracking-widest text-white mb-4 flex items-center gap-1.5">
            <span className="h-3 w-0.5 bg-gold rounded-full" /> Services
          </h4>
          <ul className="space-y-2 text-xs text-slate-400">
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

        {/* 3. Company Links */}
        <div className="lg:col-span-2 text-left">
          <h4 className="text-xs font-bold uppercase tracking-widest text-white mb-4 flex items-center gap-1.5">
            <span className="h-3 w-0.5 bg-gold rounded-full" /> Company
          </h4>
          <ul className="space-y-2 text-xs text-slate-400">
            <li><Link to="/about" className="hover:text-gold transition-colors">About Us</Link></li>
            <li><Link to="/mtp" className="hover:text-gold transition-colors text-gold font-medium">Join as MTP</Link></li>
            <li><Link to="/careers" className="hover:text-gold transition-colors">Careers</Link></li>
            <li><Link to="/blog" className="hover:text-gold transition-colors">Blog &amp; Insights</Link></li>
            <li><Link to="/contact" className="hover:text-gold transition-colors">Contact</Link></li>
            <li><Link to="/privacy" className="hover:text-gold transition-colors">Privacy Policy</Link></li>
            <li><Link to="/terms" className="hover:text-gold transition-colors">Terms &amp; Conditions</Link></li>
            <li><Link to="/refund" className="hover:text-gold transition-colors">Refund Policy</Link></li>
          </ul>
        </div>

        {/* 4. Offices & Reach Us (Beside Company) */}
        <div className="lg:col-span-5 text-left space-y-3.5">
          <h4 className="text-xs font-bold uppercase tracking-widest text-white mb-3 flex items-center gap-1.5">
            <span className="h-3 w-0.5 bg-gold rounded-full" /> Offices &amp; Reach Us
          </h4>
          
          <ul className="space-y-2 text-xs text-slate-300">
            <li className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 text-gold shrink-0" />
              <a href={`tel:${PHONE_TEL}`} className="hover:text-gold transition-colors font-medium">
                {PHONE}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <MessageCircle className="h-3.5 w-3.5 text-gold shrink-0" />
              <a 
                href={`https://wa.me/${WHATSAPP}`} 
                target="_blank" 
                rel="noreferrer" 
                className="hover:text-gold transition-colors font-medium"
              >
                WhatsApp: +91 94945 16543
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 text-gold shrink-0" />
              <a href={`mailto:${EMAIL}`} className="hover:text-gold transition-colors font-medium">
                {EMAIL}
              </a>
            </li>
          </ul>

          <div className="pt-2 border-t border-slate-800/80 space-y-2.5 text-[11px] leading-relaxed text-slate-300">
            {/* Head Office */}
            <div className="flex items-start gap-2 bg-white/[0.04] p-2.5 rounded-xl border border-white/10">
              <MapPin className="mt-0.5 h-3.5 w-3.5 text-gold shrink-0" />
              <div>
                <strong className="text-white text-xs block font-display">Head Office:</strong>
                Shop No. S101, Door No. 769, Spencer Plaza, Anna Salai, Anna Road, Chennai, Tamil Nadu, 600002, India
              </div>
            </div>

            {/* Branches */}
            <div className="flex items-start gap-2 bg-white/[0.04] p-2.5 rounded-xl border border-white/10">
              <MapPin className="mt-0.5 h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <div>
                <strong className="text-white text-xs block font-display">Branches:</strong>
                Amaravathi, Hyderabad
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Branches Horizontal Bar */}
      <div className="border-t border-[#d4af37]/50 bg-[#07122e] py-3.5 px-4">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-4 sm:gap-7 text-xs sm:text-sm">
          <div className="flex items-center gap-2 text-slate-100 font-semibold tracking-wide hover:text-gold transition-colors">
            <Building2 className="h-4 w-4 text-[#d4af37] shrink-0" />
            <span>Chennai</span>
          </div>
          <span className="hidden sm:inline-block h-3.5 w-[1.5px] bg-[#d4af37]/60" />
          <div className="flex items-center gap-2 text-slate-100 font-semibold tracking-wide hover:text-gold transition-colors">
            <Building2 className="h-4 w-4 text-[#d4af37] shrink-0" />
            <span>Amravati</span>
          </div>
          <span className="hidden sm:inline-block h-3.5 w-[1.5px] bg-[#d4af37]/60" />
          <div className="flex items-center gap-2 text-slate-100 font-semibold tracking-wide hover:text-gold transition-colors">
            <Building2 className="h-4 w-4 text-[#d4af37] shrink-0" />
            <span>Hyderabad</span>
          </div>
        </div>
      </div>

      {/* Darker Copyright & Commemorative Launch Bottom Bar */}
      <div className="bg-[#050f28] py-5 border-t border-slate-900/60 text-xs text-slate-400">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 sm:px-6 lg:flex-row lg:px-8">
          <div className="flex flex-col sm:flex-row items-center gap-2 text-center sm:text-left">
            <span>© {new Date().getFullYear()} Amma Seva Home Healthcare. All rights reserved.</span>
            <span className="hidden sm:inline text-slate-600">•</span>
            <span className="text-amber-300/90 font-medium flex items-center gap-1">
              <Award className="h-3.5 w-3.5 text-[#ffd700]" />
              Inaugurated by Thiru Sandeep Nanduri, IAS.
            </span>
          </div>
          <span className="text-gold font-medium">Professional Care with a Mother&apos;s Touch.</span>
        </div>
      </div>
    </footer>
  );
}

function FloatingActions() {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3">
      {/* Call Floating Action */}
      <a
        href={`tel:${PHONE_TEL}`}
        aria-label="Call Amma Seva"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[#1e2a5a] text-white shadow-xl border border-white/20 transition-all hover:bg-[#151e40] hover:scale-110 active:scale-95 group relative"
      >
        <Phone className="h-6 w-6 text-white group-hover:animate-pulse" />
        <span className="absolute right-16 bg-[#1e2a5a] text-white text-[10px] font-bold py-1 px-2.5 rounded-lg shadow-sm border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap hidden sm:block">
          Call Care Desk
        </span>
      </a>

      {/* WhatsApp Floating Action */}
      <a
        href={`https://wa.me/${WHATSAPP}`}
        target="_blank"
        rel="noreferrer"
        aria-label="Chat on WhatsApp"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-all hover:scale-110 active:scale-95 group relative"
      >
        <svg 
          viewBox="0 0 24 24" 
          className="h-8 w-8 fill-current text-white" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.864.002-2.637-1.03-5.114-2.905-6.99C16.546 1.875 14.072 1.84 11.43 1.84 6.002 1.84 1.578 6.262 1.574 11.693c-.001 1.705.452 3.369 1.31 4.8l-.94 3.433 3.506-.921zm12.338-7.531c-.34-.17-2.01-.993-2.321-1.106-.312-.113-.538-.17-.765.17-.227.34-.879 1.106-1.078 1.328-.199.222-.399.249-.739.08-.34-.17-1.436-.53-2.735-1.69-1.01-.9-1.694-2.01-1.892-2.35-.198-.34-.021-.524.149-.693.153-.152.34-.399.51-.599.17-.2.227-.34.34-.566.113-.227.056-.425-.028-.595-.085-.17-.765-1.842-1.049-2.528-.276-.662-.555-.572-.765-.583-.198-.011-.425-.013-.652-.013-.227 0-.595.085-.907.425-.312.34-1.191 1.164-1.191 2.837 0 1.673 1.218 3.293 1.388 3.52.17.227 2.399 3.662 5.811 5.137.812.35 1.446.56 1.94.717.816.26 1.56.223 2.148.135.656-.098 2.01-.822 2.294-1.583.283-.762.283-1.417.198-1.583-.085-.17-.312-.27-.652-.44z"/>
        </svg>
        <span className="absolute right-16 bg-[#25D366] text-white text-[10px] font-bold py-1 px-2.5 rounded-lg shadow-sm border border-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap hidden sm:block">
          WhatsApp Care Desk
        </span>
      </a>
    </div>
  );
}

export function SiteLayout({ children }: { children: ReactNode }) {
  const [showLaunchScreen, setShowLaunchScreen] = useState<boolean | undefined>(undefined);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <LaunchScreen 
        isOpen={showLaunchScreen} 
        onLaunched={() => setShowLaunchScreen(false)} 
      />
      <CommemorativeLaunchBanner onReplayLaunch={() => setShowLaunchScreen(true)} />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <FloatingActions />
    </div>
  );
}

export const contact = { PHONE, PHONE_TEL, WHATSAPP, EMAIL };