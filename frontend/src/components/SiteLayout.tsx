import { Link } from "@tanstack/react-router";
import { useState, useEffect, type ReactNode } from "react";
import { 
  Menu, X, Phone, MessageCircle, Mail, MapPin, Building2, 
  Award, ShieldCheck, Heart, Sparkles, Clock, ChevronRight, 
  User, ArrowUpRight, Calendar, Car
} from "lucide-react";
import logoAsset from "@/assets/amma-seva-logo.png";
import { fetchServices, type Service } from "@/lib/services";
import { InaugurationSection } from "./InaugurationSection";
import { ScrollRevealObserver } from "./ScrollRevealObserver";

const PHONE = "+91 94945 16543";
const PHONE_TEL = "+919494516543";
const WHATSAPP = "919494516543";
const WHATSAPP_DEFAULT_TEXT = "Hello Amma Seva, I need home healthcare support.";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(WHATSAPP_DEFAULT_TEXT)}`;
const EMAIL = "info@ammaseva.in";
const INSTAGRAM = "https://www.instagram.com/amma.seva?stkn=NWo0NTdxZnRxOHpx&utm_source=qr";

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
      setIsScrolled(window.scrollY > 15);
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
    { to: "/mtp", label: "🚗 MTP Tasks", isSpecial: true },
    { to: "/about", label: "About" },
    { to: "/gallery", label: "Gallery" },
    { to: "/blog", label: "Blog" },
    { to: "/careers", label: "Careers" },
    { to: "/contact", label: "Contact" },
  ];

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-300 ease-in-out border-b ${
        isScrolled 
          ? "bg-white/95 backdrop-blur-md border-slate-200/80 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.06)] py-2.5" 
          : "bg-white border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)] py-3.5"
      }`}
    >
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 xl:px-12">
        
        {/* Brand Logo & Title */}
        <Link 
          to="/" 
          onClick={() => window.scrollTo({ top: 0, left: 0, behavior: "instant" })}
          className="group flex items-center gap-3 shrink-0"
        >
          <div className="relative flex items-center justify-center shrink-0">
            <img
              src={logoAsset}
              alt="Amma Seva"
              className="h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-slate-50 p-1 border border-slate-200 shadow-sm object-contain transition-all duration-300 group-hover:scale-105"
              width={44}
              height={44}
            />
          </div>
          <div className="flex flex-col justify-center text-left">
            <div className="font-display text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-1.5 leading-none">
              Amma <span className="text-amber-600 font-extrabold">Seva</span>
            </div>
            <div
              className={`uppercase tracking-wider font-semibold text-slate-500 transition-all duration-300 ease-in-out ${
                isScrolled ? "h-0 opacity-0 overflow-hidden text-[0px] mt-0" : "hidden sm:block text-[9px] sm:text-[10px] opacity-100 mt-1"
              }`}
            >
              Trusted Home Healthcare
            </div>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1.5 lg:flex">
          {dynamicNav.map((n) => (
            <Link
              key={n.label + n.to}
              to={n.to}
              onClick={() => window.scrollTo({ top: 0, left: 0, behavior: "instant" })}
              className={
                n.isSpecial
                  ? "relative px-3.5 py-1.5 text-[13px] font-bold rounded-full text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 transition-all duration-200 flex items-center gap-1.5"
                  : "px-3.5 py-1.5 text-[13px] font-semibold rounded-full text-slate-650 hover:text-slate-950 hover:bg-slate-100/90 transition-all duration-200 flex items-center gap-1"
              }
              activeProps={{
                className: n.isSpecial
                  ? "bg-amber-500 text-slate-950 font-bold rounded-full shadow-sm"
                  : "bg-slate-900 text-white font-bold rounded-full shadow-sm shadow-slate-900/10"
              }}
              activeOptions={{ exact: n.to === "/" }}
            >
              {n.label}
              {n.isSpecial && (
                <span className="flex h-1.5 w-1.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* Action Area */}
        <div className="hidden items-center gap-3 lg:flex shrink-0">
          <a
            href={`tel:${PHONE_TEL}`}
            className="hidden xl:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200/80 transition-colors"
          >
            <Phone className="h-3.5 w-3.5 text-primary" />
            <span>+91 94945 16543</span>
          </a>

          {isUser ? (
            <Link 
              to="/dashboard" 
              onClick={() => window.scrollTo({ top: 0, left: 0, behavior: "instant" })}
              className="px-5 py-2 rounded-full bg-primary hover:bg-primary/90 text-white text-xs font-bold uppercase tracking-wider shadow-md shadow-primary/20 flex items-center gap-1.5 transition-all hover:scale-[1.02]"
            >
              <User className="h-3.5 w-3.5" />
              <span>Dashboard</span>
            </Link>
          ) : isCaretaker ? (
            <Link 
              to="/dashboard" 
              onClick={() => window.scrollTo({ top: 0, left: 0, behavior: "instant" })}
              className="px-5 py-2 rounded-full bg-primary hover:bg-primary/90 text-white text-xs font-bold uppercase tracking-wider shadow-md shadow-primary/20 flex items-center gap-1.5 transition-all hover:scale-[1.02]"
            >
              <User className="h-3.5 w-3.5" />
              <span>Profile</span>
            </Link>
          ) : (
            <Link 
              to="/login" 
              onClick={() => window.scrollTo({ top: 0, left: 0, behavior: "instant" })}
              className="px-5 py-2 rounded-full bg-gradient-to-r from-primary via-[#24346e] to-primary hover:from-[#162045] hover:to-[#162045] text-white text-xs font-bold uppercase tracking-wider shadow-md shadow-primary/25 flex items-center gap-1.5 transition-all hover:scale-[1.02]"
            >
              <span>Book &amp; Login</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>

        {/* Mobile menu trigger */}
        <button
          type="button"
          className="rounded-full p-2.5 transition-all duration-200 lg:hidden text-slate-700 hover:bg-slate-100 border border-slate-200/60"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {open && (
        <div className="border-t border-slate-100 bg-white/98 backdrop-blur-lg lg:hidden shadow-xl animate-in slide-in-from-top-2 duration-200">
          <div className="mx-auto flex max-w-[1440px] flex-col gap-1.5 px-4 py-4 text-left">
            {dynamicNav.map((n) => (
              <Link
                key={n.label + n.to}
                to={n.to}
                onClick={() => {
                  setOpen(false);
                  window.scrollTo({ top: 0, left: 0, behavior: "instant" });
                }}
                className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 flex items-center justify-between ${
                  n.isSpecial 
                    ? "bg-amber-50 text-amber-900 border border-amber-200/80" 
                    : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                }`}
                activeProps={{ 
                  className: "bg-slate-900 text-white font-bold" 
                }}
              >
                <span>{n.label}</span>
                <ChevronRight className="h-4 w-4 opacity-50" />
              </Link>
            ))}

            <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col gap-2">
              <a
                href={`tel:${PHONE_TEL}`}
                className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-50 text-slate-800 text-xs font-bold border border-slate-200"
              >
                <Phone className="h-4 w-4 text-primary" />
                <span>Call Care Helpline: {PHONE}</span>
              </a>

              {isUser ? (
                <Link 
                  to="/dashboard" 
                  onClick={() => {
                    setOpen(false);
                    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
                  }} 
                  className="py-3 px-4 rounded-xl bg-primary text-white text-xs font-bold uppercase tracking-wider text-center shadow-md"
                >
                  My Dashboard
                </Link>
              ) : isCaretaker ? (
                <Link 
                  to="/dashboard" 
                  onClick={() => {
                    setOpen(false);
                    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
                  }} 
                  className="py-3 px-4 rounded-xl bg-primary text-white text-xs font-bold uppercase tracking-wider text-center shadow-md"
                >
                  My Caregiver Profile
                </Link>
              ) : (
                <Link 
                  to="/login" 
                  onClick={() => {
                    setOpen(false);
                    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
                  }} 
                  className="py-3 px-4 rounded-xl bg-primary text-white text-xs font-bold uppercase tracking-wider text-center shadow-md"
                >
                  Login / Book Care
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Scroll Reading Progress Bar */}
      <div className="absolute bottom-0 left-0 h-[2.5px] w-full bg-slate-100 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-amber-500 via-primary to-emerald-500 transition-all duration-150 ease-out"
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
      setServices(list.slice(0, 6));
    });
  }, []);

  return (
    <footer className="bg-gradient-to-b from-[#0b1329] via-[#070c1a] to-[#04060f] text-slate-300 border-t border-slate-800 relative z-10">
      
      {/* 1. Trust & Confidence Strip */}
      <div className="border-b border-white/[0.08] bg-white/[0.02]">
        <div className="mx-auto max-w-[1440px] px-4 py-4 sm:px-6 lg:px-8 xl:px-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          <div className="flex items-center gap-3 bg-white/[0.02] p-2.5 rounded-2xl border border-white/[0.05]">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="text-left">
              <h5 className="text-xs font-bold text-white mb-0.5 uppercase tracking-wider">Verified Staff</h5>
              <p className="text-[11px] text-slate-400 leading-tight">Police &amp; background checked</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white/[0.02] p-2.5 rounded-2xl border border-white/[0.05]">
            <div className="h-9 w-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Clock className="h-5 w-5" />
            </div>
            <div className="text-left">
              <h5 className="text-xs font-bold text-white mb-0.5 uppercase tracking-wider">24/7 Rapid Care</h5>
              <p className="text-[11px] text-slate-400 leading-tight">Emergency &amp; shift coverage</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white/[0.02] p-2.5 rounded-2xl border border-white/[0.05]">
            <div className="h-9 w-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <Heart className="h-5 w-5" />
            </div>
            <div className="text-left">
              <h5 className="text-xs font-bold text-white mb-0.5 uppercase tracking-wider">Hospital Protocols</h5>
              <p className="text-[11px] text-slate-400 leading-tight">Clinical hygiene &amp; care</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white/[0.02] p-2.5 rounded-2xl border border-white/[0.05]">
            <div className="h-9 w-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="text-left">
              <h5 className="text-xs font-bold text-white mb-0.5 uppercase tracking-wider">Zero Advance MTP</h5>
              <p className="text-[11px] text-slate-400 leading-tight">Pay on service / quote</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main 4-Column Grid */}
      <div className="mx-auto grid max-w-[1440px] gap-8 px-4 py-8 sm:py-10 sm:px-6 lg:grid-cols-12 lg:px-8 xl:px-12">
        
        {/* Brand details */}
        <div className="lg:col-span-4 space-y-4 text-left">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-full bg-white p-1 shadow-md border border-slate-200 shrink-0">
              <img src={logoAsset} alt="Amma Seva" className="h-full w-full object-contain" width={44} height={44} />
            </div>
            <div className="font-display text-2xl font-bold tracking-tight text-white">
              Amma <span className="text-amber-400 font-extrabold">Seva</span>
            </div>
          </div>

          <p className="max-w-sm text-xs text-slate-400 leading-relaxed text-left">
            Hyderabad&apos;s trusted home healthcare network — providing professional hospital-grade nurses, compassionate elderly care, and verified multi-tasking companions.
          </p>

          {/* IAS Dedication Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-400/10 border border-amber-400/25 text-amber-300 text-[11px] font-semibold">
            <Award className="h-4 w-4 text-amber-400 shrink-0" />
            <span>Inaugurated by Thiru Sandeep Nanduri, IAS</span>
          </div>

          {/* Social Links (Original Brand Colors) */}
          <div className="flex items-center gap-3 pt-2">
            {/* Facebook */}
            <a 
              href="https://facebook.com" 
              target="_blank"
              rel="noreferrer"
              aria-label="Facebook" 
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1877F2] text-white shadow-md shadow-[#1877F2]/30 hover:scale-110 hover:shadow-lg hover:shadow-[#1877F2]/50 transition-all duration-200"
            >
              <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 fill-white" xmlns="http://www.w3.org/2000/svg">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>

            {/* Instagram */}
            <a 
              href={INSTAGRAM} 
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram" 
              className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white shadow-md shadow-[#dc2743]/30 hover:scale-110 hover:shadow-lg hover:shadow-[#dc2743]/50 transition-all duration-200"
            >
              <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 fill-white" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>

            {/* WhatsApp */}
            <a 
              href={WHATSAPP_URL} 
              target="_blank"
              rel="noreferrer"
              aria-label="WhatsApp" 
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#25D366] text-white shadow-md shadow-[#25D366]/30 hover:scale-110 hover:shadow-lg hover:shadow-[#25D366]/50 transition-all duration-200"
            >
              <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 fill-white" xmlns="http://www.w3.org/2000/svg">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.864.002-2.637-1.03-5.114-2.905-6.99C16.546 1.875 14.072 1.84 11.43 1.84 6.002 1.84 1.578 6.262 1.574 11.693c-.001 1.705.452 3.369 1.31 4.8l-.94 3.433 3.506-.921zm12.338-7.531c-.34-.17-2.01-.993-2.321-1.106-.312-.113-.538-.17-.765.17-.227.34-.879 1.106-1.078 1.328-.199.222-.399.249-.739.08-.34-.17-1.436-.53-2.735-1.69-1.01-.9-1.694-2.01-1.892-2.35-.198-.34-.021-.524.149-.693.153-.152.34-.399.51-.599.17-.2.227-.34.34-.566.113-.227.056-.425-.028-.595-.085-.17-.765-1.842-1.049-2.528-.276-.662-.555-.572-.765-.583-.198-.011-.425-.013-.652-.013-.227 0-.595.085-.907.425-.312.34-1.191 1.164-1.191 2.837 0 1.673 1.218 3.293 1.388 3.52.17.227 2.399 3.662 5.811 5.137.812.35 1.446.56 1.94.717.816.26 1.56.223 2.148.135.656-.098 2.01-.822 2.294-1.583.283-.762.283-1.417.198-1.583-.085-.17-.312-.27-.652-.44z"/>
              </svg>
            </a>
          </div>
        </div>

        {/* Services Links */}
        <div className="lg:col-span-2 text-left">
          <h4 className="text-xs font-bold uppercase tracking-widest text-white mb-4 flex items-center gap-1.5">
            <span className="h-3 w-1 bg-amber-400 rounded-full" /> Care Services
          </h4>
          <ul className="space-y-2.5 text-xs text-slate-400">
            {services.map((s) => (
              <li key={s.slug}>
                <Link to="/services/$slug" params={{ slug: s.slug }} className="hover:text-amber-300 transition-colors">
                  {s.title}
                </Link>
              </li>
            ))}
            <li>
              <Link to="/services" className="text-amber-400 font-bold hover:underline flex items-center gap-1">
                <span>View all services</span>
                <ChevronRight className="h-3 w-3" />
              </Link>
            </li>
          </ul>
        </div>

        {/* Company & MTP Tasks */}
        <div className="lg:col-span-2 text-left">
          <h4 className="text-xs font-bold uppercase tracking-widest text-white mb-4 flex items-center gap-1.5">
            <span className="h-3 w-1 bg-amber-400 rounded-full" /> Company &amp; MTP
          </h4>
          <ul className="space-y-2.5 text-xs text-slate-400">
            <li><Link to="/about" className="hover:text-amber-300 transition-colors">About Us</Link></li>
            <li>
              <Link to="/mtp" className="text-amber-400 font-bold hover:text-amber-300 transition-colors flex items-center gap-1">
                <span>Join as MTP</span>
                <span className="px-1.5 py-0.2 bg-amber-400/20 text-amber-300 text-[9px] rounded-full">New</span>
              </Link>
            </li>
            <li><Link to="/careers" className="hover:text-amber-300 transition-colors">Careers</Link></li>
            <li><Link to="/blog" className="hover:text-amber-300 transition-colors">Blog &amp; Insights</Link></li>
            <li><Link to="/contact" className="hover:text-amber-300 transition-colors">Contact Us</Link></li>
            <li><Link to="/privacy" className="hover:text-amber-300 transition-colors">Privacy Policy</Link></li>
            <li><Link to="/terms" className="hover:text-amber-300 transition-colors">Terms of Service</Link></li>
            <li><Link to="/refund" className="hover:text-amber-300 transition-colors">Refund Policy</Link></li>
          </ul>
        </div>

        {/* 24/7 Helpline & Offices */}
        <div className="lg:col-span-4 text-left space-y-3.5">
          <h4 className="text-xs font-bold uppercase tracking-widest text-white mb-4 flex items-center gap-1.5">
            <span className="h-3 w-1 bg-amber-400 rounded-full" /> 24/7 Care Desk
          </h4>
          
          <ul className="space-y-2.5 text-xs">
            <li>
              <a 
                href={`tel:${PHONE_TEL}`} 
                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-slate-200 transition-colors font-semibold"
              >
                <div className="h-7 w-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Phone className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-normal">Emergency &amp; Booking Helpline</span>
                  <span className="text-white font-bold">{PHONE}</span>
                </div>
              </a>
            </li>

            <li>
              <a 
                href={WHATSAPP_URL} 
                target="_blank" 
                rel="noreferrer" 
                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-slate-200 transition-colors font-semibold"
              >
                <div className="h-7 w-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <MessageCircle className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-normal">WhatsApp Care Coordinator</span>
                  <span className="text-emerald-400 font-bold">+91 94945 16543</span>
                </div>
              </a>
            </li>

            <li>
              <a 
                href={`mailto:${EMAIL}`} 
                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-slate-200 transition-colors font-semibold"
              >
                <div className="h-7 w-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-normal">Official Inquiries</span>
                  <span className="text-white font-bold">{EMAIL}</span>
                </div>
              </a>
            </li>
          </ul>

          <div className="pt-2 border-t border-white/10 space-y-2 text-[11px] leading-relaxed text-slate-400">
            <div className="flex items-start gap-2 bg-white/[0.02] p-2.5 rounded-xl border border-white/[0.05]">
              <MapPin className="mt-0.5 h-3.5 w-3.5 text-amber-400 shrink-0" />
              <div>
                <strong className="text-white block font-semibold">Head Office:</strong>
                Shop No. S101, Door No. 769, Spencer Plaza, Anna Salai, Anna Road, Chennai, Tamil Nadu, 600002
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* 3. Regional Presence Bar */}
      <div className="border-t border-white/[0.08] bg-black/40 py-3.5 px-4">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs text-slate-300 px-4 sm:px-6 lg:px-8 xl:px-12">
          <span className="text-[11px] uppercase font-bold tracking-wider text-slate-500">Service Coverage Hubs:</span>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 font-medium">
            <Building2 className="h-3.5 w-3.5 text-amber-400" />
            <span>Hyderabad, Telangana</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 font-medium">
            <Building2 className="h-3.5 w-3.5 text-amber-400" />
            <span>Chennai, Tamil Nadu</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 font-medium">
            <Building2 className="h-3.5 w-3.5 text-amber-400" />
            <span>Amaravathi, Andhra Pradesh</span>
          </div>
        </div>
      </div>

      {/* 4. Bottom Legal & Copyright */}
      <div className="bg-[#03060f] py-4 border-t border-white/5 text-[11px] text-slate-500">
        <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-2.5 px-4 sm:px-6 lg:flex-row lg:px-8 xl:px-12">
          <div className="flex flex-col sm:flex-row items-center gap-2 text-center sm:text-left">
            <span>© {new Date().getFullYear()} Amma Seva Home Healthcare. All rights reserved.</span>
            <span className="hidden sm:inline text-slate-700">•</span>
            <span className="text-slate-400">Professional Care with a Mother&apos;s Touch</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400 text-center">
            <span>24/7 Emergency Medical Care Network</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FloatingActions() {
  return (
    <>
      {/* Bottom-Left Quick Action Pills */}
      <div className="fixed bottom-5 left-5 z-40 hidden sm:flex flex-col gap-2.5">
        <a
          href="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#0b183b] text-white text-xs font-bold shadow-xl border border-white/20 hover:scale-105 hover:bg-[#14234f] transition-all cursor-pointer"
        >
          <Calendar className="h-4 w-4 text-gold" />
          <span>Book Care Service</span>
        </a>
        <a
          href="/dashboard?service=mtp"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#c9a24c] via-[#dfba63] to-[#b38938] text-[#0b183b] text-xs font-extrabold shadow-xl border border-amber-200/50 hover:scale-105 transition-all cursor-pointer"
        >
          <Car className="h-4 w-4 text-[#0b183b]" />
          <span>Book MTP Task</span>
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
        </a>
      </div>

      {/* Bottom-Right Helpline & WhatsApp Floating Actions */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3">
        {/* Call Floating Action */}
        <a
          href={`tel:${PHONE_TEL}`}
          aria-label="Call Amma Seva"
          className="flex h-13 w-13 items-center justify-center rounded-full bg-slate-900 text-white shadow-2xl border border-white/20 transition-all hover:bg-slate-800 hover:scale-110 active:scale-95 group relative"
        >
          <Phone className="h-5 w-5 text-white group-hover:animate-pulse" />
          <span className="absolute right-15 bg-slate-900 text-white text-[10px] font-bold py-1 px-2.5 rounded-lg shadow-md border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap hidden sm:block">
            Call 24/7 Care Helpline
          </span>
        </a>

        {/* WhatsApp Floating Action */}
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noreferrer"
          aria-label="Chat on WhatsApp"
          className="flex h-13 w-13 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl transition-all hover:scale-110 active:scale-95 group relative"
        >
          <svg 
            viewBox="0 0 24 24" 
            className="h-7 w-7 fill-current text-white" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.864.002-2.637-1.03-5.114-2.905-6.99C16.546 1.875 14.072 1.84 11.43 1.84 6.002 1.84 1.578 6.262 1.574 11.693c-.001 1.705.452 3.369 1.31 4.8l-.94 3.433 3.506-.921zm12.338-7.531c-.34-.17-2.01-.993-2.321-1.106-.312-.113-.538-.17-.765.17-.227.34-.879 1.106-1.078 1.328-.199.222-.399.249-.739.08-.34-.17-1.436-.53-2.735-1.69-1.01-.9-1.694-2.01-1.892-2.35-.198-.34-.021-.524.149-.693.153-.152.34-.399.51-.599.17-.2.227-.34.34-.566.113-.227.056-.425-.028-.595-.085-.17-.765-1.842-1.049-2.528-.276-.662-.555-.572-.765-.583-.198-.011-.425-.013-.652-.013-.227 0-.595.085-.907.425-.312.34-1.191 1.164-1.191 2.837 0 1.673 1.218 3.293 1.388 3.52.17.227 2.399 3.662 5.811 5.137.812.35 1.446.56 1.94.717.816.26 1.56.223 2.148.135.656-.098 2.01-.822 2.294-1.583.283-.762.283-1.417.198-1.583-.085-.17-.312-.27-.652-.44z"/>
          </svg>
          <span className="absolute right-15 bg-[#25D366] text-white text-[10px] font-bold py-1 px-2.5 rounded-lg shadow-md border border-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap hidden sm:block">
            WhatsApp Care Desk
          </span>
        </a>
      </div>
    </>
  );
}

export function SiteLayout({ 
  children, 
  showInauguration = false 
}: { 
  children: ReactNode; 
  showInauguration?: boolean;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-slate-850">
      <ScrollRevealObserver />
      <Header />
      <main className="flex-1">{children}</main>
      {showInauguration && <InaugurationSection />}
      <Footer />
      <FloatingActions />
    </div>
  );
}

export const contact = { PHONE, PHONE_TEL, WHATSAPP, WHATSAPP_URL, EMAIL, INSTAGRAM };