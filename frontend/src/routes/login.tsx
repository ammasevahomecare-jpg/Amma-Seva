import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { fetchServices, type Service } from "../lib/services";
import { 
  Lock, Mail, User, Phone, ShieldAlert, CheckCircle2, 
  ArrowRight, HeartHandshake, Eye, EyeOff, Briefcase, Star, Sparkles, RefreshCw,
  ShieldCheck, Car, Heart, ChevronRight, Check, MapPin, Award, Clock
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

function LoginPage() {
  const navigate = useNavigate();
  
  // Tabs and mode
  const [role, setRole] = useState<"customer" | "caretaker">("customer");
  const [mode, setMode] = useState<"login" | "register">("login");

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

  // Check redirects if already logged in
  useEffect(() => {
    if (localStorage.getItem("ammaseva_user_token") || localStorage.getItem("ammaseva_caretaker_token")) {
      const urlParams = new URLSearchParams(window.location.search);
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
      <div className="flex min-h-[88vh] flex-col lg:flex-row bg-slate-50">
        
        {/* Left Side: Graphic / Info Banner (Ultra-Premium Aesthetic) */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#090e1a] via-[#10182c] to-[#1e2a5a] relative flex-col justify-between p-12 lg:p-16 overflow-hidden text-left">
          {/* Glowing ambient decorative meshes */}
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-gold/15 blur-[120px] pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-indigo-500/20 blur-[130px] pointer-events-none" />
          <div className="absolute top-1/2 left-1/3 w-64 h-64 rounded-full bg-gold/10 blur-[100px] pointer-events-none" />

          {/* Top Brand Tag */}
          <div className="relative z-10">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gold/30 bg-gold/10 text-xs text-[#edd392] font-semibold tracking-wider uppercase backdrop-blur-md shadow-xs">
              <Sparkles className="h-3.5 w-3.5 text-gold" /> Amma Seva Unified Portal
            </span>
          </div>

          {/* Center Main Copy */}
          <div className="relative z-10 space-y-6 my-auto max-w-lg">
            <h1 className="text-4xl sm:text-5xl font-extrabold font-display leading-[1.14] text-white tracking-tight">
              Professional Care,{" "}
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#edd392] via-[#c9a24c] to-[#f5e6be] drop-shadow-sm">
                With a Mother's Touch
              </span>
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed font-sans font-medium">
              Connect directly with verified caregivers, certified nurses, and flexible MTP companions across Hyderabad. Experience seamless booking, transparent billing, and 24/7 care coordination.
            </p>

            {/* 3 Glassmorphic Feature Highlights */}
            <div className="space-y-3.5 pt-2">
              <div className="p-4 rounded-2xl bg-white/[0.06] border border-white/10 backdrop-blur-md flex items-start gap-3.5 hover:bg-white/[0.09] transition-all">
                <div className="h-9 w-9 rounded-xl bg-gold/20 flex items-center justify-center text-gold shrink-0 mt-0.5">
                  <Heart className="h-4 w-4 fill-gold/20" />
                </div>
                <div className="text-xs">
                  <span className="block font-bold text-white text-[13px]">For Patients &amp; Families</span>
                  <span className="text-slate-300 leading-normal">Book 24/7 verified care attendants, track live shifts &amp; make secure payments.</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.06] border border-white/10 backdrop-blur-md flex items-start gap-3.5 hover:bg-white/[0.09] transition-all">
                <div className="h-9 w-9 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-300 shrink-0 mt-0.5">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div className="text-xs">
                  <span className="block font-bold text-white text-[13px]">For Certified Caregivers</span>
                  <span className="text-slate-300 leading-normal">Check duty assignments, log vital reports &amp; receive direct weekly payouts.</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.06] border border-white/10 backdrop-blur-md flex items-start gap-3.5 hover:bg-white/[0.09] transition-all">
                <div className="h-9 w-9 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-300 shrink-0 mt-0.5">
                  <Car className="h-4 w-4" />
                </div>
                <div className="text-xs">
                  <span className="block font-bold text-white text-[13px]">For MTP (Multi-Tasking) Partners</span>
                  <span className="text-slate-300 leading-normal">Hyperlocal hospital escort, pharmacy runs &amp; senior companion gigs with flexible hours.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Live Activity Pill */}
          <div className="relative z-10 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="font-semibold text-white">Live Care Desk Active</span>
            </div>
            <div className="flex items-center gap-1.5 text-gold font-bold">
              <Star className="h-4 w-4 fill-gold text-gold" />
              <span>4.9 / 5</span>
              <span className="text-slate-400 font-normal">(1,200+ Families in Hyderabad)</span>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Card Container */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-8 lg:p-12 bg-gradient-to-b from-slate-50 via-amber-50/15 to-slate-100">
          <div className="w-full max-w-xl rounded-3xl border border-slate-200/90 bg-white/95 backdrop-blur-2xl p-6 sm:p-10 shadow-2xl shadow-slate-200/60 text-left">
            
            {/* Top Switcher Tabs: Sign In vs Create Account */}
            <div className="grid grid-cols-2 p-1.5 bg-slate-100/90 rounded-2xl mb-7 border border-slate-200/60">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setAuthStep("email");
                }}
                className={`py-3 text-xs sm:text-sm font-bold rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 ${
                  mode === "login"
                    ? "bg-[#1e2a5a] text-white shadow-md shadow-[#1e2a5a]/20"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <Lock className="h-4 w-4" /> Sign In with OTP
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("register");
                }}
                className={`py-3 text-xs sm:text-sm font-bold rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 ${
                  mode === "register"
                    ? "bg-[#1e2a5a] text-white shadow-md shadow-[#1e2a5a]/20"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <User className="h-4 w-4" /> Create Account
              </button>
            </div>

            {/* Header */}
            <div className="mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-[#1e2a5a] font-display">
                {mode === "login" 
                  ? (authStep === "email" ? "Welcome Back to Amma Seva" : "Enter Verification Code")
                  : (role === "customer" ? "Create Customer Account" : "Register as Certified Caregiver")}
              </h2>
              <p className="mt-1.5 text-xs sm:text-sm text-slate-500 leading-relaxed font-medium">
                {mode === "login"
                  ? (authStep === "email" 
                      ? "Enter your registered email address to receive an instant secure OTP code." 
                      : `We sent a 6-digit verification code to ${email}`)
                  : "Join Hyderabad's most trusted home healthcare and caregiving network."}
              </p>
            </div>

            {/* Role Selectors Tabs - Visible during registration */}
            {mode === "register" && (
              <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-50 rounded-2xl mb-6 border border-slate-200/80">
                <button
                  type="button"
                  onClick={() => setRole("customer")}
                  className={`py-2.5 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    role === "customer" 
                      ? "bg-white text-[#1e2a5a] shadow-sm border border-slate-200 font-extrabold text-gold" 
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Heart className="h-3.5 w-3.5" /> Customer / Patient
                </button>
                <button
                  type="button"
                  onClick={() => setRole("caretaker")}
                  className={`py-2.5 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    role === "caretaker" 
                      ? "bg-white text-[#1e2a5a] shadow-sm border border-slate-200 font-extrabold text-gold" 
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Briefcase className="h-3.5 w-3.5" /> Caregiver / Staff
                </button>
              </div>
            )}

            {/* Success and Error alerts */}
            {error && (
              <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50/80 p-3.5 text-rose-800 text-xs sm:text-sm flex gap-2.5 items-center animate-in fade-in">
                <ShieldAlert className="h-4 w-4 shrink-0 text-rose-600" />
                <span className="font-semibold">{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-3.5 text-emerald-900 text-xs sm:text-sm flex gap-2.5 items-center animate-in fade-in">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span className="font-semibold">{successMsg}</span>
              </div>
            )}

            {/* Auth Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "register" && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
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
                      className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50/50 outline-none focus:bg-white focus:border-[#c9a24c] focus:ring-2 focus:ring-[#c9a24c]/20 transition-all font-medium text-[#1e2a5a]"
                    />
                  </div>
                </div>
              )}

              {/* Email Address (Step 1 or Registration) */}
              {(mode === "register" || authStep === "email") && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Email address <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50/50 outline-none focus:bg-white focus:border-[#c9a24c] focus:ring-2 focus:ring-[#c9a24c]/20 transition-all font-medium text-[#1e2a5a]"
                    />
                  </div>
                </div>
              )}

              {mode === "register" && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Phone number <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, "").slice(0, 10))}
                      placeholder="Enter 10-digit mobile number"
                      className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50/50 outline-none focus:bg-white focus:border-[#c9a24c] focus:ring-2 focus:ring-[#c9a24c]/20 transition-all font-medium text-[#1e2a5a]"
                    />
                  </div>
                </div>
              )}

              {/* Caregiver specific registration questions */}
              {role === "caretaker" && mode === "register" && (
                <div className="space-y-4 pt-2">
                  {/* Address Section */}
                  <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/70 space-y-3">
                    <div className="text-xs font-bold text-[#1e2a5a] uppercase tracking-wider border-b border-slate-200/80 pb-1.5 flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-gold" /> Address &amp; Location
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">State</label>
                        <select
                          required
                          value={stateName}
                          onChange={(e) => setStateName(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white outline-none focus:border-[#c9a24c]"
                        >
                          <option value="">Select State</option>
                          {INDIAN_STATES.map((st) => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">City</label>
                        <input
                          type="text"
                          required
                          value={cityName}
                          onChange={(e) => setCityName(e.target.value)}
                          placeholder="e.g. Hyderabad"
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white outline-none focus:border-[#c9a24c]"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Google Map Location Pin</label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          readOnly
                          required
                          value={googleMapLocation}
                          placeholder="Fetch map coordinates..."
                          className="flex-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-100 outline-none truncate"
                        />
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
                              (err) => {
                                alert("Failed to fetch location. Please ensure location permissions are enabled.");
                                setIsFetchingLocation(false);
                              }
                            );
                          }}
                          disabled={isFetchingLocation}
                          className="px-3.5 py-2 bg-[#1e2a5a] hover:bg-[#141d3e] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1 shrink-0 disabled:opacity-50 cursor-pointer shadow-xs"
                        >
                          {isFetchingLocation ? "Fetching..." : "Fetch GPS Location"}
                        </button>
                      </div>
                      {googleMapLocation && (
                        <p className="text-[11px] text-emerald-700 font-semibold mt-1 flex items-center gap-1">
                          ✓ Geolocation recorded successfully!
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Specialty</label>
                      <select
                        value={specialty}
                        onChange={(e) => setSpecialty(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 outline-none focus:bg-white focus:border-[#c9a24c]"
                      >
                        {servicesList.map((s) => (
                          <option key={s.title} value={s.title}>
                            {s.title}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Experience</label>
                      <select
                        value={experience}
                        onChange={(e) => setExperience(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 outline-none focus:bg-white focus:border-[#c9a24c]"
                      >
                        <option value="0">0-1 years</option>
                        <option value="1">1-2 years</option>
                        <option value="3">3-5 years</option>
                        <option value="6">6-9 years</option>
                        <option value="10">10+ years</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Experience / Skills Summary</label>
                    <textarea
                      value={experienceDetails}
                      onChange={(e) => setExperienceDetails(e.target.value)}
                      placeholder="List your previous homecare experience, certifications, hospital workings, or specific care skills..."
                      rows={2}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 outline-none focus:bg-white focus:border-[#c9a24c]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Preferred Locations</label>
                      <input
                        type="text"
                        value={workingLocations}
                        onChange={(e) => setWorkingLocations(e.target.value)}
                        placeholder="e.g. Hyderabad, Secunderabad"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 outline-none focus:bg-white focus:border-[#c9a24c]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Available Timings</label>
                      <input
                        type="text"
                        value={availableTimings}
                        onChange={(e) => setAvailableTimings(e.target.value)}
                        placeholder="e.g. Day Shift, 24/7 Live-in"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 outline-none focus:bg-white focus:border-[#c9a24c]"
                      />
                    </div>
                  </div>

                  {/* Documents & Photo uploads */}
                  <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/70 space-y-3">
                    <div className="text-xs font-bold text-[#1e2a5a] uppercase tracking-wider border-b border-slate-200/80 pb-1.5 flex items-center gap-1.5">
                      <Award className="h-3.5 w-3.5 text-gold" /> Required Verification Documents
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-1">Recent Passport Photograph</label>
                        <input
                          type="file"
                          accept="image/*"
                          required
                          onChange={(e) => handleFileChange(e, setProfilePhotoFile)}
                          className="w-full text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-1">Aadhaar Card (PDF/Image)</label>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          required
                          onChange={(e) => handleFileChange(e, setAadhaarFile)}
                          className="w-full text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-1">PAN Card (PDF/Image)</label>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          required
                          onChange={(e) => handleFileChange(e, setPanFile)}
                          className="w-full text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-1">Qualification Cert(s)</label>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          required
                          onChange={(e) => handleFileChange(e, setCertificateFile)}
                          className="w-full text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Terms and conditions */}
                  <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/70 space-y-3">
                    <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700 font-medium select-none pt-1">
                      <input
                        type="checkbox"
                        required
                        checked={agreeTerms}
                        onChange={(e) => setAgreeTerms(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#1e2a5a] focus:ring-[#c9a24c] cursor-pointer"
                      />
                      <span>
                        I have read and agree to the{" "}
                        <button
                          type="button"
                          onClick={() => setShowTermsModal(true)}
                          className="text-gold font-bold hover:underline cursor-pointer inline focus:outline-none"
                        >
                          Amma Seva Terms &amp; Conditions
                        </button>{" "}
                        and Privacy Policy.
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {/* Terms checkbox for Customer (register/login) and Caretaker (login only) */}
              {((role === "customer" && (mode === "register" || authStep === "email")) ||
                (role === "caretaker" && mode === "login" && authStep === "email")) && (
                <div className="pt-2">
                  <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700 font-medium select-none">
                    <input
                      type="checkbox"
                      required
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#1e2a5a] focus:ring-[#c9a24c] cursor-pointer"
                    />
                    <span>
                      I have read and agree to the{" "}
                      <button
                        type="button"
                        onClick={() => setShowTermsModal(true)}
                        className="text-gold font-bold hover:underline cursor-pointer inline focus:outline-none"
                      >
                        Amma Seva Terms &amp; Conditions
                      </button>{" "}
                      and Privacy Policy.
                    </span>
                  </label>
                </div>
              )}

              {/* OTP Code (Step 2 of login) */}
              {mode === "login" && authStep === "otp" && (
                <div className="space-y-4 pt-1">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 text-center">
                      Enter 6-Digit Verification Code (OTP)
                    </label>
                    <div className="relative max-w-xs mx-auto">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gold" />
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                        placeholder="• • • • • •"
                        className="w-full pl-10 pr-3.5 py-3.5 text-center text-xl font-extrabold tracking-[0.4em] rounded-2xl border-2 border-gold/40 bg-white outline-none focus:border-gold focus:ring-4 focus:ring-gold/15 text-[#1e2a5a] shadow-inner"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 px-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthStep("email");
                        setOtp("");
                        setError(null);
                        setSuccessMsg(null);
                      }}
                      className="text-gold font-bold hover:underline cursor-pointer"
                    >
                      ← Change Email Address
                    </button>
                    <button
                      type="button"
                      disabled={countdown > 0 || isLoading}
                      onClick={handleResendOtp}
                      className={`font-bold hover:underline flex items-center gap-1 cursor-pointer ${
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
                disabled={isLoading || ((mode === "register" || authStep === "email") && !agreeTerms)}
                className={`w-full py-3.5 px-6 rounded-2xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2.5 cursor-pointer shadow-lg mt-5 ${
                  isLoading || ((mode === "register" || authStep === "email") && !agreeTerms)
                    ? "bg-slate-300 text-slate-500 cursor-not-allowed shadow-none"
                    : "bg-gradient-to-r from-[#1e2a5a] via-[#2a3a78] to-[#1e2a5a] hover:from-[#141d3e] hover:to-[#223068] text-white shadow-[#1e2a5a]/25 hover:shadow-xl hover:shadow-[#1e2a5a]/35 hover:-translate-y-0.5 active:translate-y-0"
                }`}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin text-gold" />
                    <span>Processing securely...</span>
                  </>
                ) : mode === "register" ? (
                  <>
                    <span>Create Profile &amp; Continue</span>
                    <ArrowRight className="h-4 w-4 text-gold" />
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
            <div className="mt-6 pt-5 border-t border-slate-100 space-y-3 text-center text-xs">
              {mode === "login" ? (
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
              ) : (
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
              )}

              <div className="pt-2 flex flex-wrap items-center justify-center gap-3 text-[11px] text-slate-400 font-medium">
                <span className="flex items-center gap-1 text-slate-500">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> 256-Bit SSL Encrypted
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-slate-500">
                  <Lock className="h-3.5 w-3.5 text-gold" /> Passwordless OTP
                </span>
                <span>•</span>
                <Link to="/mtp" className="text-gold font-bold hover:underline flex items-center gap-1">
                  <Car className="h-3.5 w-3.5" /> Join as MTP Partner →
                </Link>
              </div>
            </div>

          </div>
        </div>

      </div>

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
