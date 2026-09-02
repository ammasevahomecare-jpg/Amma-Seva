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
    { to: "/services", label: "Services", hasDropdown: true },
    { to: "/mtp", label: "MTP (Multi Tasking)" },
    { to: "/about", label: "About" },
    { to: "/gallery", label: "Gallery" },
    { to: "/blog", label: "Blog" },
    { to: "/careers", label: "Careers" },
    { to: "/contact", label: "Contact" },
  ];

  return (
    <>
      {/* Top Utility Bar (Dark Royal Navy) */}
      <div className="bg-[#0b1426] text-white text-[11px] sm:text-xs py-2 px-4 sm:px-6 lg:px-8 border-b border-slate-800/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4 sm:gap-6 flex-wrap text-slate-300">
            <span className="flex items-center gap-1.5 hover:text-white transition-colors">
              <MapPin className="h-3.5 w-3.5 text-gold" />
              <span>Hyderabad, Telangana, India</span>
            </span>
            <span className="hidden sm:inline text-slate-700">|</span>
            <a href={`tel:${PHONE_TEL}`} className="flex items-center gap-1.5 hover:text-gold transition-colors">
              <Phone className="h-3.5 w-3.5 text-gold" />
              <span>{PHONE}</span>
            </a>
            <span className="hidden sm:inline text-slate-700">|</span>
            <a href={`mailto:${EMAIL}`} className="flex items-center gap-1.5 hover:text-gold transition-colors">
              <Mail className="h-3.5 w-3.5 text-gold" />
              <span>{EMAIL}</span>
            </a>
          </div>

          <div className="hidden md:flex items-center gap-3 text-slate-400">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Follow Us:</span>
            <a href="https://facebook.com" target="_blank" rel="noreferrer" className="hover:text-gold transition-colors p-1" aria-label="Facebook">
              <Facebook className="h-3.5 w-3.5" />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:text-gold transition-colors p-1" aria-label="Instagram">
              <Instagram className="h-3.5 w-3.5" />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="hover:text-gold transition-colors p-1" aria-label="LinkedIn">
              <span className="font-bold text-[11px]">in</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Luxury White Navigation Header */}
      <header
        className={`sticky top-0 z-40 w-full transition-all duration-300 ease-in-out bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-xs ${
          isScrolled ? "py-2 shadow-md" : "py-3.5"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          
          {/* Logo & Brand Name */}
          <Link to="/" className="group flex items-center gap-3.5">
            <div className="relative flex items-center justify-center shrink-0">
              <img
                src={logoAsset}
                alt="Amma Seva"
                className={`rounded-full bg-white p-0.5 border border-slate-200/80 shadow-xs object-cover transition-all duration-300 ease-in-out ${
                  isScrolled ? "h-12 w-12" : "h-14 w-14"
                }`}
                width={isScrolled ? 48 : 56}
                height={isScrolled ? 48 : 56}
              />
            </div>
            <div className="leading-tight text-left">
              <div className="font-display text-2xl sm:text-[26px] font-bold tracking-tight text-[#1e2a5a] transition-colors group-hover:text-gold">
                Amma <span className="text-[#c9a24c]">Seva</span>
              </div>
              <div className="text-[9px] sm:text-[10px] uppercase font-bold tracking-[0.18em] text-slate-500 mt-0.5">
                Professional Care with a Mother&apos;s Touch
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-1 sm:gap-2 lg:flex">
            {dynamicNav.map((n) => (
              <Link
                key={n.label + n.to}
                to={n.to}
                className="px-3.5 py-1.5 text-xs sm:text-[13px] font-semibold text-slate-700 hover:text-[#c9a24c] transition-colors rounded-lg flex items-center gap-1"
                activeProps={{
                  className: "text-[#1e2a5a] font-extrabold border-b-2 border-gold pb-1 rounded-none"
                }}
                activeOptions={{ exact: n.to === "/" }}
              >
                <span>{n.label}</span>
                {n.hasDropdown && <span className="text-[10px] text-slate-400">▾</span>}
              </Link>
            ))}
          </nav>

          {/* Right Action Button */}
          <div className="hidden items-center gap-3 lg:flex shrink-0">
            {isUser ? (
              <Link 
                to="/dashboard" 
                className="px-5 py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-[#c9a24c] to-[#b38938] hover:from-[#b38938] hover:to-[#966b1a] text-white shadow-md shadow-gold/20 flex items-center gap-1.5 hover:scale-102 transition-all cursor-pointer"
              >
                <span>👤 My Dashboard</span>
              </Link>
            ) : isCaretaker ? (
              <Link 
                to="/dashboard" 
                className="px-5 py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-[#c9a24c] to-[#b38938] hover:from-[#b38938] hover:to-[#966b1a] text-white shadow-md shadow-gold/20 flex items-center gap-1.5 hover:scale-102 transition-all cursor-pointer"
              >
                <span>👤 Staff Portal</span>
              </Link>
            ) : (
              <Link 
                to="/login" 
                className="px-5 py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-[#c9a24c] to-[#b38938] hover:from-[#b38938] hover:to-[#966b1a] text-white shadow-md shadow-gold/20 flex items-center gap-1.5 hover:scale-102 transition-all cursor-pointer"
              >
                <span>👤 My Dashboard</span>
              </Link>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            className="rounded-xl p-2 transition-all duration-300 lg:hidden text-slate-700 hover:bg-slate-100"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {open && (
          <div className="border-t border-slate-100 bg-white/98 backdrop-blur-xl lg:hidden shadow-xl animate-in fade-in">
            <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4 text-left">
              {dynamicNav.map((n) => (
                <Link
                  key={n.label + n.to}
                  to={n.to}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-gold transition-colors"
                  activeProps={{ className: "bg-gold/10 text-[#1e2a5a] font-bold border-l-4 border-gold" }}
                  activeOptions={{ exact: n.to === "/" }}
                >
                  {n.label}
                </Link>
              ))}
              <div className="mt-4 pt-3 border-t border-slate-100 flex gap-2.5">
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#c9a24c] to-[#b38938] text-white font-bold text-xs text-center shadow-md"
                >
                  👤 Access Dashboard / Login
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Reading Progress Line */}
        <div className="absolute bottom-0 left-0 h-[2px] w-full bg-slate-100">
          <div
            className="h-full bg-gold transition-all duration-150 ease-out"
            style={{ width: `${scrollProgress}%` }}
          />
        </div>
      </header>
    </>
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
            <li><Link to="/mtp" className="hover:text-gold transition-colors text-gold font-medium">Join as MTP</Link></li>
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
      <div className="bg-[#050f28] py-5 border-t border-slate-900/60 text-xs text-slate-400">
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