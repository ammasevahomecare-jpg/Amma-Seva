import { Link } from "@tanstack/react-router";
import { useState, useEffect, type ReactNode } from "react";
import { Menu, X, Phone, MessageCircle, Mail, MapPin, Facebook, Instagram } from "lucide-react";
import logoAsset from "@/assets/amma-seva-logo.png";

const PHONE = "+91 90000 00000";
const PHONE_TEL = "+919000000000";
const WHATSAPP = "919000000000";
const EMAIL = "care@ammaseva.in";

function Header() {
  const [open, setOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isUser, setIsUser] = useState(false);
  const [isCaretaker, setIsCaretaker] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      setIsAdmin(!!localStorage.getItem("ammaseva_admin_token"));
      setIsUser(!!localStorage.getItem("ammaseva_user_token"));
      setIsCaretaker(!!localStorage.getItem("ammaseva_caretaker_token"));
    };
    checkAuth();
    const interval = setInterval(checkAuth, 1500);
    return () => clearInterval(interval);
  }, []);

  const dynamicNav = [
    { to: "/", label: "Home" },
    { to: "/services", label: "Services" },
    { to: "/about", label: "About" },
    { to: "/blog", label: "Blog" },
    { to: "/careers", label: "Careers" },
    { to: "/contact", label: "Contact" },
    ...(isUser ? [{ to: "/dashboard", label: "Dashboard" }] : []),
    ...(isCaretaker ? [{ to: "/dashboard", label: "Profile" }] : []),
    ...(isAdmin ? [{ to: "/admin", label: "Admin Panel" }] : []),
    ...(!isUser && !isCaretaker && !isAdmin ? [{ to: "/login", label: "Login" }] : []),
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3">
          <img src={logoAsset} alt="Amma Seva" className="h-12 w-12 object-contain" width={48} height={48} />
          <div className="leading-tight">
            <div className="font-display text-xl font-semibold text-primary">
              Amma <span className="text-gold">Seva</span>
            </div>
            <div className="hidden text-[10px] uppercase tracking-widest text-muted-foreground sm:block">
              Professional Care with a Mother&apos;s Touch
            </div>
          </div>
        </Link>
        <nav className="hidden items-center gap-7 lg:flex">
          {dynamicNav.map((n) => (
            <Link
              key={n.label + n.to}
              to={n.to}
              className="text-sm font-medium text-foreground/80 transition-colors hover:text-primary flex items-center gap-1"
              activeProps={{ className: "text-primary" }}
              activeOptions={{ exact: n.to === "/" }}
            >
              {n.label}
              {n.label === "Admin Panel" && (
                <span 
                  className={`h-1.5 w-1.5 rounded-full ${isAdmin ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} 
                  title={isAdmin ? "Logged in" : "Lock secured"}
                />
              )}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          <a href={`tel:${PHONE_TEL}`} className="btn-outline text-sm">
            <Phone className="h-4 w-4" /> Call Now
          </a>
          {isUser ? (
            <Link to="/dashboard" className="btn-primary text-sm">
              My Dashboard
            </Link>
          ) : isCaretaker ? (
            <Link to="/dashboard" className="btn-primary text-sm">
              My Profile
            </Link>
          ) : isAdmin ? (
            <Link to="/admin" className="btn-primary text-sm">
              Admin Panel
            </Link>
          ) : (
            <Link to="/login" className="btn-primary text-sm">
              Book &amp; Login
            </Link>
          )}
        </div>
        <button
          type="button"
          className="rounded-md p-2 text-primary lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
      {open && (
        <div className="border-t border-border bg-background lg:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
            {dynamicNav.map((n) => (
              <Link
                key={n.label + n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="rounded-md px-2 py-2 text-sm font-medium text-foreground/80 hover:bg-secondary"
              >
                {n.label}
              </Link>
            ))}
            <div className="mt-2 flex gap-2">
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
              ) : isAdmin ? (
                <Link to="/admin" onClick={() => setOpen(false)} className="btn-primary flex-1 text-sm text-center">
                  Admin Panel
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
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border bg-secondary/40">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div>
          <div className="flex items-center gap-3">
            <img src={logoAsset} alt="Amma Seva" className="h-12 w-12 object-contain" width={48} height={48} />
            <div className="font-display text-xl font-semibold text-primary">
              Amma <span className="text-gold">Seva</span>
            </div>
          </div>
          <p className="mt-4 max-w-xs text-sm text-muted-foreground">
            Trusted home healthcare and caregiving — delivered with the warmth of a mother&apos;s touch.
          </p>
          <div className="mt-4 flex gap-3">
            <a href="#" aria-label="Facebook" className="rounded-full border border-border p-2 text-primary hover:bg-primary hover:text-primary-foreground">
              <Facebook className="h-4 w-4" />
            </a>
            <a href="#" aria-label="Instagram" className="rounded-full border border-border p-2 text-primary hover:bg-primary hover:text-primary-foreground">
              <Instagram className="h-4 w-4" />
            </a>
            <a href={`https://wa.me/${WHATSAPP}`} aria-label="WhatsApp" className="rounded-full border border-border p-2 text-primary hover:bg-primary hover:text-primary-foreground">
              <MessageCircle className="h-4 w-4" />
            </a>
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-primary">Services</h4>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/services/$slug" params={{ slug: "elderly-care" }} className="hover:text-primary">Elderly Care</Link></li>
            <li><Link to="/services/$slug" params={{ slug: "mother-baby-care" }} className="hover:text-primary">Mother &amp; Baby Care</Link></li>
            <li><Link to="/services/$slug" params={{ slug: "home-nursing" }} className="hover:text-primary">Home Nursing</Link></li>
            <li><Link to="/services/$slug" params={{ slug: "post-surgery-care" }} className="hover:text-primary">Post-Surgery Care</Link></li>
            <li><Link to="/services" className="hover:text-primary">All services →</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-primary">Company</h4>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/about" className="hover:text-primary">About Us</Link></li>
            <li><Link to="/careers" className="hover:text-primary">Careers</Link></li>
            <li><Link to="/blog" className="hover:text-primary">Blog &amp; Health Tips</Link></li>
            <li><Link to="/contact" className="hover:text-primary">Contact</Link></li>
            <li><Link to="/privacy" className="hover:text-primary">Privacy Policy</Link></li>
            <li><Link to="/terms" className="hover:text-primary">Terms &amp; Conditions</Link></li>
            <li><Link to="/refund" className="hover:text-primary">Refund Policy</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-primary">Reach Us</h4>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-2"><Phone className="mt-0.5 h-4 w-4 text-gold" /><a href={`tel:${PHONE_TEL}`}>{PHONE}</a></li>
            <li className="flex items-start gap-2"><MessageCircle className="mt-0.5 h-4 w-4 text-gold" /><a href={`https://wa.me/${WHATSAPP}`}>WhatsApp us</a></li>
            <li className="flex items-start gap-2"><Mail className="mt-0.5 h-4 w-4 text-gold" /><a href={`mailto:${EMAIL}`}>{EMAIL}</a></li>
            <li className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 text-gold" />Hyderabad, India</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-muted-foreground sm:flex-row sm:px-6 lg:px-8">
          <span>© {new Date().getFullYear()} Amma Seva. All rights reserved.</span>
          <span>Professional Care with a Mother&apos;s Touch.</span>
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