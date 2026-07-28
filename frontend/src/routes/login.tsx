import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { fetchServices, type Service } from "../lib/services";
import { 
  Lock, Mail, User, Phone, ShieldAlert, CheckCircle2, 
  ArrowRight, HeartHandshake, Eye, EyeOff, Briefcase, Star, Sparkles, RefreshCw
} from "lucide-react";

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
  }, [mode]);

  // Check redirects if already logged in
  useEffect(() => {
    if (localStorage.getItem("ammaseva_user_token") || localStorage.getItem("ammaseva_caretaker_token")) {
      navigate({ to: "/dashboard" });
    } else if (localStorage.getItem("ammaseva_admin_token")) {
      navigate({ to: "/admin" });
    }
  }, [navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
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
                navigate({ to: "/dashboard" });
              } else if (data.role === "customer") {
                localStorage.setItem("ammaseva_user_token", data.token);
                localStorage.setItem("ammaseva_user_details", JSON.stringify(data.user));
                navigate({ to: "/dashboard" });
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
      <div className="flex min-h-[85vh] flex-col lg:flex-row bg-slate-50">
        
        {/* Left Side: Graphic / Info Banner (Premium Aesthetic) */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 relative items-center justify-center p-12 overflow-hidden">
          {/* Subtle background decoration */}
          <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-gold/10 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[100px]" />
          
          <div className="max-w-md text-white space-y-8 z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-gold/20 bg-gold/5 text-xs text-gold font-semibold uppercase tracking-wider">
              <Sparkles className="h-3 w-3" /> Amma Seva Portals
            </span>
            <div className="space-y-4">
              <h1 className="text-4xl font-extrabold font-display leading-tight tracking-tight">
                Professional Home Healthcare, <span className="text-gold">with a Mother's Touch</span>
              </h1>
              <p className="text-sm text-slate-300 leading-relaxed">
                Connect directly with certified caregivers, nurses, and home recovery companions. Book, manage shifts, reschedule, and access billing reports all in one place.
              </p>
            </div>
            
            <div className="grid gap-4 pt-4 border-t border-slate-800">
              <div className="flex gap-3 items-start text-xs text-slate-400">
                <HeartHandshake className="h-5 w-5 text-gold shrink-0 mt-0.5" />
                <div>
                  <span className="block font-semibold text-white">For Customers</span>
                  Book qualified care shifts, make secure digital payments, and download invoicing receipts.
                </div>
              </div>
              <div className="flex gap-3 items-start text-xs text-slate-400">
                <Briefcase className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <span className="block font-semibold text-white">For Caregivers</span>
                  Join the platform network, check assigned shifts, and update care schedules.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Card Container */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-12 lg:p-16">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200/60 bg-white p-8 sm:p-10 shadow-lg">
            
            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-primary font-display">Authentication Portal</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {mode === "login" 
                  ? "Sign in with your email address to receive an OTP code." 
                  : "Register a new profile to access the care network."}
              </p>
            </div>

            {/* Role Selectors Tabs - Only visible during registration */}
            {mode === "register" && (
              <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl mb-6">
                <button
                  type="button"
                  onClick={() => setRole("customer")}
                  className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    role === "customer" 
                      ? "bg-white text-primary shadow-sm" 
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Customer / Patient
                </button>
                <button
                  type="button"
                  onClick={() => setRole("caretaker")}
                  className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    role === "caretaker" 
                      ? "bg-white text-primary shadow-sm" 
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Caregiver / Staff
                </button>
              </div>
            )}

            {/* Success and Error alerts */}
            {error && (
              <div className="mb-6 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-destructive text-sm flex gap-2 items-center">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-800 text-sm flex gap-2 items-center">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Auth Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "register" && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full pl-10 pr-3 py-2 text-sm rounded-md border border-slate-200 bg-background outline-none focus:ring-2 focus:ring-gold"
                    />
                  </div>
                </div>
              )}

              {/* Email Address (Step 1 or Registration) */}
              {(mode === "register" || authStep === "email") && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Email address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full pl-10 pr-3 py-2 text-sm rounded-md border border-slate-200 bg-background outline-none focus:ring-2 focus:ring-gold"
                    />
                  </div>
                </div>
              )}

              {mode === "register" && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Phone number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 XXXXX XXXXX"
                      className="w-full pl-10 pr-3 py-2 text-sm rounded-md border border-slate-200 bg-background outline-none focus:ring-2 focus:ring-gold"
                    />
                  </div>
                </div>
              )}

              {/* Caregiver specific registration questions */}
              {role === "caretaker" && mode === "register" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Specialty</label>
                      <select
                        value={specialty}
                        onChange={(e) => setSpecialty(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-md border border-slate-200 bg-background outline-none focus:ring-2 focus:ring-gold"
                      >
                        {servicesList.map((s) => (
                          <option key={s.title} value={s.title}>
                            {s.title}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Experience</label>
                      <select
                        value={experience}
                        onChange={(e) => setExperience(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-md border border-slate-200 bg-background outline-none focus:ring-2 focus:ring-gold"
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
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Detailed Experience / Skills Summary</label>
                    <textarea
                      value={experienceDetails}
                      onChange={(e) => setExperienceDetails(e.target.value)}
                      placeholder="List your previous homecare experience, certifications, hospital workings, or specific care skills..."
                      rows={3}
                      className="w-full px-3 py-2 text-sm rounded-md border border-slate-200 bg-background outline-none focus:ring-2 focus:ring-gold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Preferred Locations</label>
                      <input
                        type="text"
                        value={workingLocations}
                        onChange={(e) => setWorkingLocations(e.target.value)}
                        placeholder="e.g. Hyderabad, Secunderabad"
                        className="w-full px-3 py-2 text-sm rounded-md border border-slate-200 bg-background outline-none focus:ring-2 focus:ring-gold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Available Timings</label>
                      <input
                        type="text"
                        value={availableTimings}
                        onChange={(e) => setAvailableTimings(e.target.value)}
                        placeholder="e.g. Day Shift, 24/7 Live-in"
                        className="w-full px-3 py-2 text-sm rounded-md border border-slate-200 bg-background outline-none focus:ring-2 focus:ring-gold"
                      />
                    </div>
                  </div>

                  {/* Documents & Photo uploads */}
                  <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50 space-y-3">
                    <div className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-1.5">
                      Required Verification Documents
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Profile Photo</label>
                        <input
                          type="file"
                          accept="image/*"
                          required
                          onChange={(e) => handleFileChange(e, setProfilePhotoFile)}
                          className="w-full text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Aadhaar Card (PDF/Image)</label>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          required
                          onChange={(e) => handleFileChange(e, setAadhaarFile)}
                          className="w-full text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">PAN Card (PDF/Image)</label>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          required
                          onChange={(e) => handleFileChange(e, setPanFile)}
                          className="w-full text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Nursing Certificates</label>
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
                </div>
              )}



              {/* OTP Code (Step 2 of login) */}
              {mode === "login" && authStep === "otp" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 text-center">
                      Verification Code (OTP)
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                        placeholder="Enter 6-digit OTP"
                        className="w-full pl-10 pr-3 py-3 text-center text-lg font-bold tracking-[0.5em] rounded-md border border-slate-200 bg-background outline-none focus:ring-2 focus:ring-gold"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthStep("email");
                        setOtp("");
                        setError(null);
                        setSuccessMsg(null);
                      }}
                      className="text-gold font-semibold hover:underline cursor-pointer"
                    >
                      Change email
                    </button>
                    <button
                      type="button"
                      disabled={countdown > 0 || isLoading}
                      onClick={handleResendOtp}
                      className={`font-semibold hover:underline flex items-center gap-1 cursor-pointer ${
                        countdown > 0 ? "text-slate-400 cursor-not-allowed" : "text-indigo-600"
                      }`}
                    >
                      {isLoading && <RefreshCw className="h-3 w-3 animate-spin" />}
                      {countdown > 0 ? `Resend Code in ${countdown}s` : "Resend Code"}
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full py-2.5 mt-4 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading 
                  ? "Authenticating..." 
                  : mode === "register" 
                    ? "Register Account" 
                    : authStep === "email" 
                      ? "Send Verification Code" 
                      : "Verify & Log In"}
                {!isLoading && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>

            {/* Bottom Swapper */}
            <div className="mt-6 text-center text-xs">
              {mode === "login" ? (
                <p className="text-slate-500">
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("register")}
                    className="text-gold font-bold hover:underline cursor-pointer"
                  >
                    Register here
                  </button>
                </p>
              ) : (
                <p className="text-slate-500">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("login")}
                    className="text-gold font-bold hover:underline cursor-pointer"
                  >
                    Sign in here
                  </button>
                </p>
              )}
            </div>

          </div>
        </div>

      </div>
    </SiteLayout>
  );
}
