import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { fetchServices, type Service } from "../lib/services";
import { 
  Lock, Mail, User, Phone, ShieldAlert, CheckCircle2, 
  ArrowRight, HeartHandshake, Eye, EyeOff, Briefcase, Star, Sparkles, RefreshCw,
  ShieldCheck, Car, Heart, ChevronRight, Check, MapPin, Award, Clock, Gift,
  Camera, FileText, UploadCloud
} from "lucide-react";

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", 
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", 
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", 
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", 
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", 
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Authentication Gateway — Amma Seva" },
      { name: "description", content: "Sign in or register for an account to book and manage homecare services." }
    ],
  }),
  component: LoginPage,
});

function getInitialLoginState() {
  if (typeof window === "undefined") {
    return { role: "customer" as const, mode: "login" as const, referredBy: "", isReferralLocked: false };
  }
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const refParam = urlParams.get("ref") || urlParams.get("refer") || urlParams.get("referral") || urlParams.get("code") || sessionStorage.getItem("ammaseva_ref_code") || "";
    const typeParam = urlParams.get("type") || urlParams.get("role") || "";
    const modeParam = urlParams.get("mode") || urlParams.get("tab") || "";
    
    const isCaretaker = typeParam === "caretaker" || typeParam === "caregiver" || Boolean(refParam && refParam.trim());
    const isRegister = modeParam === "register" || Boolean(refParam && refParam.trim()) || typeParam === "caretaker";

    return {
      role: isCaretaker ? ("caretaker" as const) : ("customer" as const),
      mode: isRegister ? ("register" as const) : ("login" as const),
      referredBy: refParam ? refParam.trim().toUpperCase() : "",
      isReferralLocked: Boolean(refParam && refParam.trim()),
    };
  } catch (e) {
    return { role: "customer" as const, mode: "login" as const, referredBy: "", isReferralLocked: false };
  }
}

function LoginPage() {
  const navigate = useNavigate();
  const initial = getInitialLoginState();
  
  // Tabs and mode
  const [role, setRole] = useState<"customer" | "caretaker">(initial.role);
  const [mode, setMode] = useState<"login" | "register">(initial.mode);

  // Referral states
  const [referredBy, setReferredBy] = useState(initial.referredBy);
  const [isReferralLocked, setIsReferralLocked] = useState(initial.isReferralLocked);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [specialty, setSpecialty] = useState("Elderly Care");
  const [experience, setExperience] = useState("3");
  const [servicesList, setServicesList] = useState<Service[]>([]);
  
  // OTP flow states
  const [authStep, setAuthStep] = useState<"email" | "otp">("email");
  const [otp, setOtp] = useState("");
  const [countdown, setCountdown] = useState(0);

  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Caregiver registration documents & profile states
  const [aadhaarFile, setAadhaarFile] = useState("");
  const [panFile, setPanFile] = useState("");
  const [certificateFile, setCertificateFile] = useState("");
  const [profilePhotoFile, setProfilePhotoFile] = useState("");
  const [experienceDetails, setExperienceDetails] = useState("");
  const [workingLocations, setWorkingLocations] = useState("");
  const [availableTimings, setAvailableTimings] = useState("");
  
  const [experienceCertificateFile, setExperienceCertificateFile] = useState("");
  const [policeVerificationFile, setPoliceVerificationFile] = useState("");
  const [additionalCertificatesFile, setAdditionalCertificatesFile] = useState("");
  
  const [stateName, setStateName] = useState("");
  const [cityName, setCityName] = useState("");
  const [googleMapLocation, setGoogleMapLocation] = useState("");
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setFileState: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFileState(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Resend countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Load dynamic services for specialty dropdown
  useEffect(() => {
    fetchServices().then((list) => {
      setServicesList(list);
      if (list.length > 0) {
        setSpecialty(list[0].title);
      }
    });
  }, []);

  // Clear states on mode changes
  useEffect(() => {
    setName("");
    setEmail("");
    setPhone("");
    setPassword("");
    setOtp("");
    setAuthStep("email");
    setError(null);
    setSuccessMsg(null);
    setStateName("");
    setCityName("");
    setGoogleMapLocation("");
    setAgreeTerms(false);
    setExperienceCertificateFile("");
    setPoliceVerificationFile("");
    setAdditionalCertificatesFile("");
  }, [mode, role]);

  // Check referral params & redirects if already logged in
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const refParam = urlParams.get("ref") || urlParams.get("refer") || urlParams.get("referral") || urlParams.get("code");
    if (refParam && refParam.trim()) {
      const cleanRef = refParam.trim().toUpperCase();
      setReferredBy(cleanRef);
      setIsReferralLocked(true);
      setRole("caretaker");
      setMode("register");
      try {
        sessionStorage.setItem("ammaseva_ref_code", cleanRef);
      } catch (e) {}
    } else {
      try {
        const stored = sessionStorage.getItem("ammaseva_ref_code");
        if (stored && stored.trim()) {
          setReferredBy(stored.trim().toUpperCase());
          setIsReferralLocked(true);
        }
      } catch (e) {}
    }

    if (localStorage.getItem("ammaseva_user_token") || localStorage.getItem("ammaseva_caretaker_token")) {
      const redirect = urlParams.get("redirect") || "/dashboard";
      window.location.href = redirect;
    } else if (localStorage.getItem("ammaseva_admin_token")) {
      navigate({ to: "/admin" });
    }
  }, [navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const trimmedEmail = email.toLowerCase().trim();

    if (mode === "register") {
      if (!name.trim()) {
        setError("Please enter your name.");
        return;
      }
      if (!trimmedEmail) {
        setError("Please enter your email.");
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        setError("Please enter a valid email address.");
        return;
      }
      const trimmedPhone = phone.trim();
      if (!trimmedPhone) {
        setError("Please enter your 10-digit phone number.");
        return;
      }
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(trimmedPhone)) {
        setError("Phone number must be exactly 10 digits and contain only numbers.");
        return;
      }

      if (role === "caretaker") {
        if (!experienceDetails.trim()) {
          setError("Please enter experience details.");
          return;
        }
        if (!workingLocations.trim()) {
          setError("Please enter preferred working locations.");
          return;
        }
        if (!availableTimings.trim()) {
          setError("Please enter your available timings.");
          return;
        }
        if (!stateName.trim()) {
          setError("Please select/enter your State.");
          return;
        }
        if (!cityName.trim()) {
          setError("Please select/enter your City.");
          return;
        }
        if (!agreeTerms) {
          setError("You must agree to the Terms of Service & Privacy Policy.");
          return;
        }
      }
    } else {
      if (!trimmedEmail) {
        setError("Please enter your email address.");
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        setError("Please enter a valid email address.");
        return;
      }
    }

    setIsLoading(true);

    if (mode === "register") {
      const apiRole = role === "customer" ? "user" : role;
      const endpoint = `/api/${apiRole}/register`;
      const bodyData: any = { 
        email: email.toLowerCase().trim(),
        name,
        phone
      };
      if (role === "caretaker") {
        bodyData.specialty = specialty;
        bodyData.experience = Number(experience);
        bodyData.aadhaar = aadhaarFile;
        bodyData.pan = panFile;
        bodyData.certificates = certificateFile;
        bodyData.profilePhoto = profilePhotoFile;
        bodyData.experienceDetails = experienceDetails;
        bodyData.workingLocations = workingLocations;
        bodyData.availableTimings = availableTimings;
        bodyData.state = stateName;
        bodyData.city = cityName;
        bodyData.googleMapLocation = googleMapLocation;
        bodyData.experienceCertificate = experienceCertificateFile;
        bodyData.policeVerification = policeVerificationFile;
        bodyData.additionalCertificates = additionalCertificatesFile;
        bodyData.referredBy = referredBy.trim().toUpperCase();
      }

      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData)
      })
        .then(async (res) => {
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || "Registration failed.");
          }
          return data;
        })
        .then((data) => {
          if (data.success) {
            setSuccessMsg(data.message || "Account registered successfully!");
            setTimeout(() => {
              setMode("login");
              setAuthStep("email");
              setSuccessMsg(null);
            }, 1800);
          }
        })
        .catch((err) => {
          setError(err.message || "Unable to complete registration.");
        })
        .finally(() => {
          setIsLoading(false);
        });

    } else {
      // Login mode - Step 1: Send OTP
      if (authStep === "email") {
        fetch("/api/auth/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.toLowerCase().trim() })
        })
          .then(async (res) => {
            const data = await res.json();
            if (!res.ok) {
              throw new Error(data.error || "Failed to dispatch verification code.");
            }
            return data;
          })
          .then((data) => {
            if (data.success) {
              setAuthStep("otp");
              setSuccessMsg("Verification OTP code has been sent to " + email);
              setCountdown(30);
            }
          })
          .catch((err) => {
            setError(err.message || "Unable to reach database service.");
          })
          .finally(() => {
            setIsLoading(false);
          });
      } else {
        // Login mode - Step 2: Verify OTP
        fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.toLowerCase().trim(), otp: otp.trim() })
        })
          .then(async (res) => {
            const data = await res.json();
            if (!res.ok) {
              throw new Error(data.error || "Verification failed.");
            }
            return data;
          })
          .then((data) => {
            if (data.success) {
              if (data.role === "admin") {
                localStorage.setItem("ammaseva_admin_token", data.token);
                navigate({ to: "/admin" });
              } else if (data.role === "caretaker") {
                localStorage.setItem("ammaseva_caretaker_token", data.token);
                localStorage.setItem("ammaseva_caretaker_details", JSON.stringify(data.caretaker));
                setSuccessMsg(`Welcome, caregiver ${data.caretaker.name}!`);
                const urlParams = new URLSearchParams(window.location.search);
                const redirect = urlParams.get("redirect") || "/dashboard";
                window.location.href = redirect;
              } else if (data.role === "customer") {
                localStorage.setItem("ammaseva_user_token", data.token);
                localStorage.setItem("ammaseva_user_details", JSON.stringify(data.user));
                const urlParams = new URLSearchParams(window.location.search);
                const redirect = urlParams.get("redirect") || "/dashboard";
                window.location.href = redirect;
              }
            }
          })
          .catch((err) => {
            setError(err.message || "Invalid or expired verification code.");
          })
          .finally(() => {
            setIsLoading(false);
          });
      }
    }
  };

  const handleResendOtp = () => {
    if (countdown > 0 || isLoading) return;
    setError(null);
    setSuccessMsg(null);
    setIsLoading(true);

    fetch("/api/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.toLowerCase().trim() })
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to resend code.");
        }
        return data;
      })
      .then((data) => {
        if (data.success) {
          setSuccessMsg("A new verification code has been sent to " + email);
          setCountdown(30);
        }
      })
      .catch((err) => {
        setError(err.message || "Failed to resend verification code.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };
  return (
    <SiteLayout>
      {/* ========================================================================= */}
      {/* MODE 1: FULL-WIDTH PREMIUM REGISTRATION (ALIGNED WITH HEADER max-w-7xl)    */}
      {/* ========================================================================= */}
      {mode === "register" ? (
        <div className="w-full min-h-[calc(100vh-80px)] bg-gradient-to-b from-slate-50 via-amber-50/15 to-slate-100/80 relative overflow-hidden py-6 sm:py-10">
          
          {/* Ambient Glowing Background Orbs */}
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#c9a24c]/10 blur-[130px] pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-indigo-500/10 blur-[140px] pointer-events-none" />

          {/* Main Container - EXACT ALIGNMENT with Navbar max-w-7xl px-4 sm:px-6 lg:px-8 */}
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="w-full rounded-3xl border border-slate-200/90 bg-white/95 backdrop-blur-2xl p-5 sm:p-8 lg:p-10 shadow-2xl shadow-slate-200/60 text-left transition-all duration-300 animate-in fade-in">
              
              {/* Brand Pill */}
              <div className="flex justify-center mb-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/10 border border-gold/30 text-[11px] font-bold text-[#8c6b16] tracking-wide uppercase">
                  <Sparkles className="h-3 w-3 text-gold" /> Amma Seva Certified Care Network
                </span>
              </div>

              {/* Top Switcher Tabs: Sign In vs Register Profile */}
              <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl mb-6 border border-slate-200/70 max-w-md mx-auto">
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setAuthStep("email");
                  }}
                  className="py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 text-slate-500 hover:text-slate-900"
                >
                  <Lock className="h-3.5 w-3.5" /> Sign In (OTP)
                </button>
                <button
                  type="button"
                  onClick={() => setMode("register")}
                  className="py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 bg-[#1e2a5a] text-white shadow-md shadow-[#1e2a5a]/20"
                >
                  <User className="h-3.5 w-3.5" /> Register Profile
                </button>
              </div>

              {/* Header */}
              <div className="mb-6 text-center">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1e2a5a] font-display">
                  {role === "customer" ? "Create Patient & Family Account" : "Register as Certified Caregiver / Nurse"}
                </h2>
                <p className="mt-1.5 text-xs sm:text-sm text-slate-500 leading-relaxed font-medium max-w-2xl mx-auto">
                  {role === "customer" 
                    ? "Register in seconds to book verified attendants, home nursing, and post-hospitalization care." 
                    : "Join Hyderabad's most trusted home healthcare network. Direct duty shifts, transparent weekly payouts, and continuous staff support."}
                </p>
              </div>

              {/* Role Selectors Tabs */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl mb-6 border border-slate-200/80 max-w-md mx-auto">
                <button
                  type="button"
                  onClick={() => setRole("customer")}
                  className={`py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    role === "customer" 
                      ? "bg-white text-[#1e2a5a] shadow-sm border border-slate-200 font-extrabold" 
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Heart className="h-3.5 w-3.5 text-rose-500" /> Customer / Patient
                </button>
                <button
                  type="button"
                  onClick={() => setRole("caretaker")}
                  className={`py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    role === "caretaker" 
                      ? "bg-white text-[#1e2a5a] shadow-sm border border-slate-200 font-extrabold" 
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Briefcase className="h-3.5 w-3.5 text-[#c9a24c]" /> Caregiver / Staff
                </button>
              </div>

              {/* Success and Error alerts */}
              {error && (
                <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50/90 p-3.5 text-rose-800 text-xs flex gap-2.5 items-center animate-in fade-in max-w-3xl mx-auto">
                  <ShieldAlert className="h-4 w-4 shrink-0 text-rose-600" />
                  <span className="font-semibold">{error}</span>
                </div>
              )}

              {successMsg && (
                <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50/90 p-3.5 text-emerald-900 text-xs flex gap-2.5 items-center animate-in fade-in max-w-3xl mx-auto">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span className="font-semibold">{successMsg}</span>
                </div>
              )}

              {/* Registration Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                
                {/* --- ROLE A: CUSTOMER REGISTRATION --- */}
                {role === "customer" && (
                  <div className="max-w-xl mx-auto space-y-4 bg-slate-50/60 p-5 sm:p-7 rounded-2xl border border-slate-200/80">
                    <div>
                      <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
                        Full Name <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. Rahul Sharma"
                          className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white outline-none focus:border-[#c9a24c] focus:ring-2 focus:ring-[#c9a24c]/20 transition-all font-medium text-[#1e2a5a]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
                        Email Address <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="name@example.com"
                          className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white outline-none focus:border-[#c9a24c] focus:ring-2 focus:ring-[#c9a24c]/20 transition-all font-medium text-[#1e2a5a]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
                        Phone Number <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, "").slice(0, 10))}
                          placeholder="10-digit mobile number"
                          className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white outline-none focus:border-[#c9a24c] focus:ring-2 focus:ring-[#c9a24c]/20 transition-all font-medium text-[#1e2a5a] font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* --- ROLE B: CAREGIVER / STAFF REGISTRATION (FULL 7XL RESPONSIVE GRID) --- */}
                {role === "caretaker" && (
                  <div className="space-y-4">
                    
                    {/* Referral Code Banner */}
                    {isReferralLocked ? (
                      <div className="bg-gradient-to-r from-[#1e2a5a] via-[#24356e] to-[#1e2a5a] border border-[#c9a24c]/40 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md text-white">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-gold/20 border border-gold/40 flex items-center justify-center text-gold shrink-0 font-bold">
                            <Gift className="h-5 w-5 text-gold" />
                          </div>
                          <div>
                            <div className="text-[10px] font-extrabold text-[#edd392] uppercase tracking-wider">
                              Invited by Care Partner
                            </div>
                            <div className="text-sm sm:text-base font-black font-mono tracking-widest text-white">
                              {referredBy}
                            </div>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-emerald-300 bg-white/10 px-3.5 py-1.5 rounded-full border border-emerald-400/30 flex items-center gap-1.5 backdrop-blur-xs self-start sm:self-auto">
                          <Check className="h-4 w-4 text-emerald-400" /> Referral Code Applied (Locked)
                        </span>
                      </div>
                    ) : (
                      <div className="bg-slate-50/90 rounded-2xl p-3.5 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <label className="text-xs font-extrabold uppercase tracking-wider text-[#1e2a5a] flex items-center gap-2 shrink-0">
                          <Gift className="h-4 w-4 text-[#c9a24c]" /> Have a Partner Referral Code? (Optional)
                        </label>
                        <input
                          type="text"
                          value={referredBy}
                          onChange={(e) => setReferredBy(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                          placeholder="e.g. PRIYA3210"
                          className="w-full sm:w-60 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-mono font-bold text-[#1e2a5a] outline-none focus:ring-2 focus:ring-[#c9a24c]/30 focus:border-[#c9a24c] uppercase tracking-wider"
                        />
                      </div>
                    )}

                    {/* Section 1: Basic & Professional Details (3 Columns on Desktop) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                          Full Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. Priya Sharma"
                          className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50/60 outline-none focus:bg-white focus:border-[#c9a24c] focus:ring-2 focus:ring-[#c9a24c]/20 text-[#1e2a5a] font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                          Phone Number <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, "").slice(0, 10))}
                          placeholder="10-digit mobile"
                          className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50/60 outline-none focus:bg-white focus:border-[#c9a24c] focus:ring-2 focus:ring-[#c9a24c]/20 text-[#1e2a5a] font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                          Email Address <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="staff@ammaseva.in"
                          className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50/60 outline-none focus:bg-white focus:border-[#c9a24c] focus:ring-2 focus:ring-[#c9a24c]/20 text-[#1e2a5a] font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                          Specialty Domain <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={specialty}
                          onChange={(e) => setSpecialty(e.target.value)}
                          className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50/60 outline-none focus:bg-white focus:border-[#c9a24c] focus:ring-2 focus:ring-[#c9a24c]/20 text-[#1e2a5a] font-medium cursor-pointer"
                        >
                          {servicesList.length > 0 ? (
                            servicesList.map((s) => (
                              <option key={s.title} value={s.title}>
                                {s.title}
                              </option>
                            ))
                          ) : (
                            <>
                              <option value="Elderly Care">Elderly Care</option>
                              <option value="Mother & Baby Care">Mother & Baby Care</option>
                              <option value="Home Nursing Services">Home Nursing Services</option>
                              <option value="ICU/Home Recovery Support">ICU/Home Recovery Support</option>
                            </>
                          )}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                          Total Experience <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={experience}
                          onChange={(e) => setExperience(e.target.value)}
                          className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50/60 outline-none focus:bg-white focus:border-[#c9a24c] focus:ring-2 focus:ring-[#c9a24c]/20 text-[#1e2a5a] font-medium cursor-pointer"
                        >
                          <option value="1">1-2 years experience</option>
                          <option value="3">3-5 years experience</option>
                          <option value="6">6-9 years experience</option>
                          <option value="10">10+ years experience</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                          Available Shift Timings <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={availableTimings}
                          onChange={(e) => setAvailableTimings(e.target.value)}
                          placeholder="e.g. 12hr Day Shift / 24hr Live-in"
                          className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50/60 outline-none focus:bg-white focus:border-[#c9a24c] focus:ring-2 focus:ring-[#c9a24c]/20 text-[#1e2a5a]"
                        />
                      </div>

                      <div className="sm:col-span-2 lg:col-span-3">
                        <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                          Preferred Localities / Areas <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={workingLocations}
                          onChange={(e) => setWorkingLocations(e.target.value)}
                          placeholder="e.g. Banjara Hills, Jubilee Hills, Gachibowli, Kukatpally, Madhapur"
                          className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50/60 outline-none focus:bg-white focus:border-[#c9a24c] focus:ring-2 focus:ring-[#c9a24c]/20 text-[#1e2a5a]"
                        />
                      </div>

                      <div className="sm:col-span-2 lg:col-span-3">
                        <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                          Experience &amp; Skills Summary <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                          required
                          value={experienceDetails}
                          onChange={(e) => setExperienceDetails(e.target.value)}
                          placeholder="Brief summary of previous hospital postings, eldercare, injection/IV expertise, patient mobility support..."
                          rows={2}
                          className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50/60 outline-none focus:bg-white focus:border-[#c9a24c] focus:ring-2 focus:ring-[#c9a24c]/20 text-[#1e2a5a] resize-none"
                        />
                      </div>
                    </div>

                    {/* Section 2: Location & GPS Geolocation */}
                    <div className="rounded-2xl border border-slate-200/80 p-4 sm:p-5 bg-slate-50/70 space-y-3">
                      <div className="text-xs font-bold text-[#1e2a5a] uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200/60 pb-2">
                        <MapPin className="h-4 w-4 text-gold" /> Address &amp; GPS Location Pin
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">State <span className="text-rose-500">*</span></label>
                          <select
                            required
                            value={stateName}
                            onChange={(e) => setStateName(e.target.value)}
                            className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white outline-none focus:border-[#c9a24c] font-medium"
                          >
                            <option value="">Select State</option>
                            {INDIAN_STATES.map((st) => (
                              <option key={st} value={st}>{st}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">City <span className="text-rose-500">*</span></label>
                          <input
                            type="text"
                            required
                            value={cityName}
                            onChange={(e) => setCityName(e.target.value)}
                            placeholder="e.g. Hyderabad"
                            className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white outline-none focus:border-[#c9a24c] font-medium"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            if (!navigator.geolocation) {
                              alert("Geolocation is not supported by your browser");
                              return;
                            }
                            setIsFetchingLocation(true);
                            navigator.geolocation.getCurrentPosition(
                              (position) => {
                                const lat = position.coords.latitude;
                                const lng = position.coords.longitude;
                                setGoogleMapLocation(`https://www.google.com/maps?q=${lat},${lng}`);
                                setIsFetchingLocation(false);
                              },
                              () => {
                                alert("Failed to fetch location. Please ensure location permissions are enabled.");
                                setIsFetchingLocation(false);
                              }
                            );
                          }}
                          disabled={isFetchingLocation}
                          className="w-full sm:w-auto px-4 py-2 bg-[#1e2a5a] hover:bg-[#141d3e] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shrink-0 disabled:opacity-50 cursor-pointer shadow-xs transition-all"
                        >
                          <MapPin className="h-3.5 w-3.5 text-gold" />
                          {isFetchingLocation ? "Detecting GPS..." : "Auto-Detect GPS Location"}
                        </button>
                        {googleMapLocation ? (
                          <span className="text-xs text-emerald-700 font-bold flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                            <Check className="h-4 w-4 text-emerald-600" /> Coordinates Saved Successfully
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium">
                            Click to tag your exact duty starting coordinates
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Section 3: KYC Verification Upload Tiles (4 Columns on Desktop) */}
                    <div className="rounded-2xl border border-slate-200/80 p-4 sm:p-5 bg-slate-50/70 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                        <div className="text-xs font-bold text-[#1e2a5a] uppercase tracking-wider flex items-center gap-1.5">
                          <Award className="h-4 w-4 text-gold" /> Required KYC Verification Documents
                        </div>
                        <span className="text-xs text-slate-400 font-medium">PDF / Image</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                        {/* 1: Passport Photo */}
                        <div className={`rounded-xl border p-3 transition-all flex flex-col justify-between gap-2.5 ${
                          profilePhotoFile ? "bg-emerald-50/60 border-emerald-300 ring-1 ring-emerald-200" : "bg-white border-slate-200 hover:border-slate-300"
                        }`}>
                          <div className="flex items-center gap-2.5 min-w-0">
                            {profilePhotoFile ? (
                              <img src={profilePhotoFile} alt="Profile" className="h-10 w-10 rounded-lg object-cover border border-emerald-300 shrink-0" />
                            ) : (
                              <div className="h-10 w-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                                <Camera className="h-5 w-5" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-800 truncate">Passport Photo <span className="text-rose-500">*</span></div>
                              <div className="text-[11px] text-slate-400">
                                {profilePhotoFile ? <span className="text-emerald-700 font-bold">✓ Attached</span> : "Clear portrait"}
                              </div>
                            </div>
                          </div>
                          <label className="text-xs font-bold text-[#1e2a5a] hover:text-[#c9a24c] bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer text-center border border-slate-200 w-full mt-1">
                            <span>{profilePhotoFile ? "Change Photo" : "Upload Photo"}</span>
                            <input type="file" accept="image/*" required={!profilePhotoFile} onChange={(e) => handleFileChange(e, setProfilePhotoFile)} className="hidden" />
                          </label>
                        </div>

                        {/* 2: Aadhaar Card */}
                        <div className={`rounded-xl border p-3 transition-all flex flex-col justify-between gap-2.5 ${
                          aadhaarFile ? "bg-emerald-50/60 border-emerald-300 ring-1 ring-emerald-200" : "bg-white border-slate-200 hover:border-slate-300"
                        }`}>
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
                              aadhaarFile ? "bg-emerald-100 text-emerald-700" : "bg-amber-50 text-amber-700"
                            }`}>
                              <FileText className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-800 truncate">Aadhaar Card <span className="text-rose-500">*</span></div>
                              <div className="text-[11px] text-slate-400">
                                {aadhaarFile ? <span className="text-emerald-700 font-bold">✓ Attached</span> : "Front & Back ID"}
                              </div>
                            </div>
                          </div>
                          <label className="text-xs font-bold text-[#1e2a5a] hover:text-[#c9a24c] bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer text-center border border-slate-200 w-full mt-1">
                            <span>{aadhaarFile ? "Change Aadhaar" : "Upload Aadhaar"}</span>
                            <input type="file" accept="image/*,application/pdf" required={!aadhaarFile} onChange={(e) => handleFileChange(e, setAadhaarFile)} className="hidden" />
                          </label>
                        </div>

                        {/* 3: PAN Card */}
                        <div className={`rounded-xl border p-3 transition-all flex flex-col justify-between gap-2.5 ${
                          panFile ? "bg-emerald-50/60 border-emerald-300 ring-1 ring-emerald-200" : "bg-white border-slate-200 hover:border-slate-300"
                        }`}>
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
                              panFile ? "bg-emerald-100 text-emerald-700" : "bg-sky-50 text-sky-700"
                            }`}>
                              <FileText className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-800 truncate">PAN Card <span className="text-rose-500">*</span></div>
                              <div className="text-[11px] text-slate-400">
                                {panFile ? <span className="text-emerald-700 font-bold">✓ Attached</span> : "Tax / Payout ID"}
                              </div>
                            </div>
                          </div>
                          <label className="text-xs font-bold text-[#1e2a5a] hover:text-[#c9a24c] bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer text-center border border-slate-200 w-full mt-1">
                            <span>{panFile ? "Change PAN" : "Upload PAN"}</span>
                            <input type="file" accept="image/*,application/pdf" required={!panFile} onChange={(e) => handleFileChange(e, setPanFile)} className="hidden" />
                          </label>
                        </div>

                        {/* 4: Qualification Certificate */}
                        <div className={`rounded-xl border p-3 transition-all flex flex-col justify-between gap-2.5 ${
                          certificateFile ? "bg-emerald-50/60 border-emerald-300 ring-1 ring-emerald-200" : "bg-white border-slate-200 hover:border-slate-300"
                        }`}>
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
                              certificateFile ? "bg-emerald-100 text-emerald-700" : "bg-purple-50 text-purple-700"
                            }`}>
                              <Award className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-800 truncate">Qualification <span className="text-rose-500">*</span></div>
                              <div className="text-[11px] text-slate-400">
                                {certificateFile ? <span className="text-emerald-700 font-bold">✓ Attached</span> : "Nursing / Cert"}
                              </div>
                            </div>
                          </div>
                          <label className="text-xs font-bold text-[#1e2a5a] hover:text-[#c9a24c] bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer text-center border border-slate-200 w-full mt-1">
                            <span>{certificateFile ? "Change Cert" : "Upload Cert"}</span>
                            <input type="file" accept="image/*,application/pdf" required={!certificateFile} onChange={(e) => handleFileChange(e, setCertificateFile)} className="hidden" />
                          </label>
                        </div>
                      </div>
                    </div>

                  </div>
                )}

                {/* Terms Checkbox */}
                <div className="pt-2 flex justify-center">
                  <label className="flex items-start gap-2.5 cursor-pointer text-xs sm:text-sm text-slate-600 font-medium select-none">
                    <input
                      type="checkbox"
                      required
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#1e2a5a] focus:ring-[#c9a24c] cursor-pointer"
                    />
                    <span>
                      I agree to the{" "}
                      <button
                        type="button"
                        onClick={() => setShowTermsModal(true)}
                        className="text-gold font-bold hover:underline cursor-pointer inline focus:outline-none"
                      >
                        Terms of Service &amp; Care Policies
                      </button>
                      .
                    </span>
                  </label>
                </div>

                {/* Submit CTA Button */}
                <div className="max-w-md mx-auto pt-2">
                  <button
                    type="submit"
                    disabled={isLoading || !agreeTerms}
                    className={`w-full py-3.5 px-6 rounded-xl font-bold text-xs sm:text-sm transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                      isLoading || !agreeTerms
                        ? "bg-slate-300 text-slate-500 cursor-not-allowed shadow-none"
                        : "bg-gradient-to-r from-[#1e2a5a] via-[#2a3a78] to-[#1e2a5a] hover:from-[#141d3e] hover:to-[#223068] text-white shadow-[#1e2a5a]/20 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin text-gold" />
                        <span>Processing registration...</span>
                      </>
                    ) : (
                      <>
                        <span>{role === "customer" ? "Create Patient & Family Account" : "Submit Caregiver Registration"}</span>
                        <ArrowRight className="h-4 w-4 text-gold" />
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Bottom Swapper & Trust badges */}
              <div className="mt-6 pt-5 border-t border-slate-100 space-y-3 text-center text-xs">
                <p className="text-slate-600 font-medium">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("login");
                      setAuthStep("email");
                    }}
                    className="text-[#1e2a5a] font-extrabold hover:text-gold hover:underline cursor-pointer"
                  >
                    Sign in here
                  </button>
                </p>

                <div className="pt-1 flex flex-wrap items-center justify-center gap-3 text-[11px] text-slate-400 font-medium">
                  <span className="flex items-center gap-1 text-slate-500">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> 256-Bit SSL Encrypted
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-slate-500">
                    <Lock className="h-3.5 w-3.5 text-gold" /> Instant Verification
                  </span>
                  <span>•</span>
                  <Link to="/mtp" className="text-gold font-bold hover:underline flex items-center gap-1">
                    <Car className="h-3.5 w-3.5" /> Join MTP Partner →
                  </Link>
                </div>
              </div>

            </div>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* MODE 2: SPLIT SCREEN SIGN IN (OTP)                                        */
        /* ========================================================================= */
        <div className="flex min-h-[90vh] flex-col lg:flex-row bg-slate-50 relative overflow-hidden">
          
          {/* Ambient Glowing Background Orbs */}
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#c9a24c]/10 blur-[130px] pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-indigo-500/10 blur-[140px] pointer-events-none" />
          
          {/* Left Side: Graphic / Info Banner */}
          <div className="hidden lg:flex lg:w-5/12 xl:w-1/2 bg-gradient-to-br from-[#070b14] via-[#0f172a] to-[#1e2a5a] relative flex-col justify-between p-10 xl:p-14 overflow-hidden text-left shadow-2xl animate-in fade-in duration-300">
            {/* Glowing ambient decorative meshes */}
            <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-gold/15 blur-[120px] pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-indigo-500/20 blur-[130px] pointer-events-none" />
            <div className="absolute top-1/2 left-1/3 w-64 h-64 rounded-full bg-gold/10 blur-[100px] pointer-events-none" />

            {/* Top Brand Tag */}
            <div className="relative z-10">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-gold/30 bg-gold/10 text-xs text-[#edd392] font-semibold tracking-wider uppercase backdrop-blur-md shadow-xs">
                <Sparkles className="h-3.5 w-3.5 text-gold" /> Amma Seva Care Network
              </span>
            </div>

            {/* Center Main Copy */}
            <div className="relative z-10 space-y-5 my-auto max-w-lg">
              <h1 className="text-3xl xl:text-4xl font-extrabold font-display leading-[1.18] text-white tracking-tight">
                Professional Care,{" "}
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#edd392] via-[#c9a24c] to-[#f5e6be] drop-shadow-sm">
                  With a Mother's Touch
                </span>
              </h1>
              <p className="text-xs xl:text-sm text-slate-300 leading-relaxed font-sans font-medium">
                Connect with verified caregivers, certified nurses, and flexible MTP companions across Hyderabad. Experience seamless booking, transparent billing, and 24/7 care coordination.
              </p>

              {/* 3 Glassmorphic Feature Highlights */}
              <div className="space-y-3 pt-1">
                <div className="p-3 rounded-xl bg-white/[0.06] border border-white/10 backdrop-blur-md flex items-center gap-3 hover:bg-white/[0.09] transition-all">
                  <div className="h-8 w-8 rounded-lg bg-gold/20 flex items-center justify-center text-gold shrink-0">
                    <Heart className="h-4 w-4 fill-gold/20" />
                  </div>
                  <div className="text-xs">
                    <span className="block font-bold text-white text-[12px]">For Patients &amp; Families</span>
                    <span className="text-slate-300 text-[11px]">Book 24/7 verified care attendants &amp; pay securely.</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.06] border border-white/10 backdrop-blur-md flex items-center gap-3 hover:bg-white/[0.09] transition-all">
                  <div className="h-8 w-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-300 shrink-0">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div className="text-xs">
                    <span className="block font-bold text-white text-[12px]">For Certified Caregivers</span>
                    <span className="text-slate-300 text-[11px]">Direct duty shifts, patient vitals logging &amp; payouts.</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.06] border border-white/10 backdrop-blur-md flex items-center gap-3 hover:bg-white/[0.09] transition-all">
                  <div className="h-8 w-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-300 shrink-0">
                    <Gift className="h-4 w-4 text-amber-400" />
                  </div>
                  <div className="text-xs">
                    <span className="block font-bold text-white text-[12px]">Direct Staff Referral Program</span>
                    <span className="text-slate-300 text-[11px]">Share your caregiver referral link &amp; track partners.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Live Activity Pill */}
            <div className="relative z-10 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="font-semibold text-white text-xs">Live Care Desk Active</span>
              </div>
              <div className="flex items-center gap-1.5 text-gold font-bold text-xs">
                <Star className="h-3.5 w-3.5 fill-gold text-gold" />
                <span>4.9 / 5</span>
                <span className="text-slate-400 font-normal">(1,200+ Families)</span>
              </div>
            </div>
          </div>

          {/* Right Side: Auth Card Container */}
          <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-10 bg-gradient-to-b from-slate-50 via-amber-50/10 to-slate-100/80 overflow-y-auto">
            <div className="w-full max-w-md rounded-3xl border border-slate-200/90 bg-white/95 backdrop-blur-2xl p-6 sm:p-9 shadow-2xl shadow-slate-200/60 text-left transition-all duration-300 animate-in fade-in">
              
              {/* Top Switcher Tabs: Sign In vs Register Profile */}
              <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl mb-6 border border-slate-200/70">
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setAuthStep("email");
                  }}
                  className="py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 bg-[#1e2a5a] text-white shadow-md shadow-[#1e2a5a]/20"
                >
                  <Lock className="h-3.5 w-3.5" /> Sign In (OTP)
                </button>
                <button
                  type="button"
                  onClick={() => setMode("register")}
                  className="py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 text-slate-500 hover:text-slate-900"
                >
                  <User className="h-3.5 w-3.5" /> Register Profile
                </button>
              </div>

              {/* Header */}
              <div className="mb-5">
                <h2 className="text-xl sm:text-2xl font-bold text-[#1e2a5a] font-display">
                  {authStep === "email" ? "Welcome Back to Amma Seva" : "Enter Verification Code"}
                </h2>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed font-medium">
                  {authStep === "email" 
                    ? "Enter your registered email address to receive an instant secure OTP code." 
                    : `We sent a 6-digit verification code to ${email}`}
                </p>
              </div>

              {/* Success and Error alerts */}
              {error && (
                <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50/90 p-3 text-rose-800 text-xs flex gap-2 items-center animate-in fade-in">
                  <ShieldAlert className="h-4 w-4 shrink-0 text-rose-600" />
                  <span className="font-semibold">{error}</span>
                </div>
              )}

              {successMsg && (
                <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50/90 p-3 text-emerald-900 text-xs flex gap-2 items-center animate-in fade-in">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span className="font-semibold">{successMsg}</span>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {authStep === "email" ? (
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50/50 outline-none focus:bg-white focus:border-[#c9a24c] focus:ring-2 focus:ring-[#c9a24c]/20 transition-all font-medium text-[#1e2a5a]"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 pt-1">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 text-center">
                        Enter 6-Digit Verification Code (OTP)
                      </label>
                      <div className="relative max-w-xs mx-auto">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gold" />
                        <input
                          type="text"
                          required
                          maxLength={6}
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                          placeholder="• • • • • •"
                          className="w-full pl-10 pr-3.5 py-3 text-center text-lg font-extrabold tracking-[0.35em] rounded-xl border-2 border-gold/40 bg-white outline-none focus:border-gold focus:ring-2 focus:ring-gold/15 text-[#1e2a5a] shadow-inner"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 px-1">
                      <button
                        type="button"
                        onClick={() => {
                          setAuthStep("email");
                          setOtp("");
                          setError(null);
                          setSuccessMsg(null);
                        }}
                        className="text-gold font-bold hover:underline cursor-pointer text-[11px]"
                      >
                        ← Change Email
                      </button>
                      <button
                        type="button"
                        disabled={countdown > 0 || isLoading}
                        onClick={handleResendOtp}
                        className={`font-bold hover:underline flex items-center gap-1 cursor-pointer text-[11px] ${
                          countdown > 0 ? "text-slate-400 cursor-not-allowed" : "text-[#1e2a5a]"
                        }`}
                      >
                        {isLoading && <RefreshCw className="h-3 w-3 animate-spin" />}
                        {countdown > 0 ? `Resend Code (${countdown}s)` : "Resend OTP"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Submit CTA Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-3.5 px-6 rounded-xl font-bold text-xs sm:text-sm transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-md mt-4 ${
                    isLoading
                      ? "bg-slate-300 text-slate-500 cursor-not-allowed shadow-none"
                      : "bg-gradient-to-r from-[#1e2a5a] via-[#2a3a78] to-[#1e2a5a] hover:from-[#141d3e] hover:to-[#223068] text-white shadow-[#1e2a5a]/20 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                  }`}
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin text-gold" />
                      <span>Processing securely...</span>
                    </>
                  ) : authStep === "email" ? (
                    <>
                      <span>Send Verification Code</span>
                      <ArrowRight className="h-4 w-4 text-gold" />
                    </>
                  ) : (
                    <>
                      <span>Verify &amp; Access Dashboard</span>
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    </>
                  )}
                </button>
              </form>

              {/* Bottom Swapper & Trust badges */}
              <div className="mt-5 pt-4 border-t border-slate-100 space-y-2.5 text-center text-xs">
                <p className="text-slate-600 font-medium">
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("register")}
                    className="text-[#1e2a5a] font-extrabold hover:text-gold hover:underline cursor-pointer"
                  >
                    Register here
                  </button>
                </p>

                <div className="pt-1 flex flex-wrap items-center justify-center gap-3 text-[11px] text-slate-400 font-medium">
                  <span className="flex items-center gap-1 text-slate-500">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> 256-Bit SSL Encrypted
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-slate-500">
                    <Lock className="h-3.5 w-3.5 text-gold" /> Passwordless OTP
                  </span>
                  <span>•</span>
                  <Link to="/mtp" className="text-gold font-bold hover:underline flex items-center gap-1">
                    <Car className="h-3.5 w-3.5" /> Join MTP Partner →
                  </Link>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleUp {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out forwards;
        }
        .animate-scaleUp {
          animation: scaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {/* Terms & Conditions Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all duration-300 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-slate-100 transform transition-all duration-300 scale-100 animate-scaleUp">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-serif text-base font-bold text-slate-800">
                {role === "caretaker" 
                  ? "Amma Seva – Nurse & Caregiver Terms & Conditions" 
                  : "Amma Seva – Terms & Conditions"}
              </h3>
              <button 
                type="button"
                onClick={() => setShowTermsModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer h-8 w-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors focus:outline-none"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-600 leading-relaxed max-h-[60vh]">
              {role === "customer" ? (
                <>
                  <p className="font-semibold text-slate-800 text-sm">Effective Date: 10/08/2026</p>
                  <p className="font-medium text-slate-700">
                    Welcome to Amma Seva. By booking or using our services, you agree to the following Terms & Conditions.
                  </p>
                  
                  <div className="space-y-3.5">
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs">1. Service Scope</h4>
                      <p>Amma Seva is a technology-enabled platform that connects clients with qualified nurses, caregivers, attendants, and home healthcare professionals.</p>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs">2. Booking Confirmation</h4>
                      <p>A booking is confirmed only after acceptance by Amma Seva and successful payment (where applicable).</p>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs">3. Service Charges</h4>
                      <p>Service charges vary depending on the type of service, duration, location, and special requirements.</p>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs">4. Payment Terms</h4>
                      <p>Payments shall be made through the approved payment methods provided by Amma Seva. Outstanding dues must be cleared before future bookings.</p>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs">5. Cancellation & Rescheduling</h4>
                      <p>Cancellation or rescheduling is subject to Amma Seva's Cancellation & Refund Policy.</p>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs">6. Working Hours</h4>
                      <p>Caregivers will provide services only during the booked time. Extra hours will be charged separately.</p>
                    </div>
                    <div className="p-3 bg-rose-50/50 border border-rose-100 rounded-xl">
                      <h4 className="font-bold text-rose-800 text-xs flex items-center gap-1">
                        ⚠️ 7. No Medical Advice or Prescription
                      </h4>
                      <p className="text-rose-700 font-medium text-[11px]">Amma Seva does not diagnose illnesses, prescribe medications, recommend treatments, or sell/promote medicines. Our nurses and caregivers provide care strictly according to the treating doctor's valid prescription and instructions.</p>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs">8. Emergency Services</h4>
                      <p>Amma Seva is not an emergency medical service. In case of a medical emergency, clients must immediately contact the nearest hospital or ambulance service.</p>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs">9. Patient Information</h4>
                      <p>Clients must provide complete and accurate medical history, medications, allergies, and emergency contact details.</p>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs">10. Client Responsibilities</h4>
                      <p>Clients shall provide a safe, hygienic, and respectful environment for caregivers while services are being provided.</p>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs">11. Caregiver Safety</h4>
                      <p>Abusive behavior, harassment, violence, discrimination, or illegal activities towards caregivers will result in immediate termination of services.</p>
                    </div>
                    <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-xl">
                      <h4 className="font-bold text-amber-800 text-xs">12. Direct Engagement</h4>
                      <p className="text-amber-700 font-medium text-[11px]">If a client or caregiver directly engages with each other without Amma Seva's knowledge or authorization, Amma Seva shall not be responsible for any payments, disputes, liabilities, damages, or consequences arising from such independent arrangements.</p>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs">13. No Employment Relationship</h4>
                      <p>Using Amma Seva does not create an employer-employee relationship between the client and the caregiver.</p>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs">14. No Guarantee of Medical Outcome</h4>
                      <p>Amma Seva does not guarantee recovery, cure, or any specific medical outcome.</p>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs">15. Confidentiality</h4>
                      <p>Patient information will be kept confidential and handled in accordance with applicable privacy laws.</p>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs">16. Personal Belongings</h4>
                      <p>Amma Seva is not responsible for the loss of cash, jewellery, valuables, or personal belongings kept at the client's premises.</p>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs">17. Background Verification</h4>
                      <p>Amma Seva makes reasonable efforts to verify the identity and qualifications of caregivers but cannot guarantee their conduct beyond the services provided.</p>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs">18. Service Refusal</h4>
                      <p>Amma Seva reserves the right to refuse, suspend, or terminate services in cases of abuse, unsafe conditions, non-payment, or violation of these Terms.</p>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs">19. Force Majeure</h4>
                      <p>Amma Seva shall not be liable for delays or service interruptions caused by events beyond its reasonable control, including natural disasters, government restrictions, strikes, epidemics, or technical failures.</p>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs">20. Intellectual Property</h4>
                      <p>The Amma Seva name, logo, website, mobile application, and related content are the intellectual property of Amma Seva and may not be copied or used without prior written permission.</p>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs">21. Jurisdiction</h4>
                      <p>Any disputes arising from these Terms & Conditions shall be subject to the exclusive jurisdiction of the competent courts where Amma Seva is registered.</p>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs">22. Amendments</h4>
                      <p>Amma Seva reserves the right to modify these Terms & Conditions at any time. Updated versions will be published on the official website and mobile application.</p>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs">23. Acceptance</h4>
                      <p>By using Amma Seva's services, the client confirms that they have read, understood, and agreed to these Terms & Conditions.</p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <p className="font-semibold text-slate-800 text-sm">Amma Seva – Nurse & Caregiver Terms & Conditions</p>
                  <p className="font-medium text-slate-700">By registering with Amma Seva, you agree to the following:</p>
                  
                  <ol className="list-decimal pl-4 space-y-2.5">
                    <li>All information and documents submitted by you are true, accurate, and valid.</li>
                    <li>Amma Seva reserves the right to verify your identity, qualifications, experience, and other supporting documents.</li>
                    <li>You are registered as an independent service provider and not as an employee of Amma Seva.</li>
                    <li>You shall provide services professionally, ethically, and with respect for every client.</li>
                    <li>You shall provide nursing or caregiving services only within your qualifications and as per the treating doctor's prescription and instructions.</li>
                    <li>You shall maintain the confidentiality and privacy of all client information.</li>
                    <li>You shall report on time for assigned bookings and promptly inform Amma Seva in case of any delay or inability to attend.</li>
                    <li>You shall not demand or accept additional payments directly from clients unless authorized by Amma Seva.</li>
                    <li>You shall not directly engage with or continue providing services to Amma Seva clients outside the platform without prior written permission.</li>
                    <li>Any misconduct, negligence, abuse, harassment, fraud, submission of false documents, repeated cancellations, or violation of these Terms may result in suspension or permanent termination of your registration.</li>
                    <li>Payments will be processed by Amma Seva as per the applicable payment policy after successful completion of eligible services.</li>
                    <li>Amma Seva reserves the right to modify these Terms & Conditions at any time. Continued use of the platform constitutes acceptance of the revised Terms.</li>
                    <li>Any disputes shall be subject to the jurisdiction of the competent courts where Amma Seva is registered.</li>
                    <li>By clicking "Register", you confirm that you have read, understood, and agreed to these Terms & Conditions.</li>
                  </ol>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setAgreeTerms(true);
                  setShowTermsModal(false);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                I Agree & Accept
              </button>
              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}
    </SiteLayout>
  );
}
