import React, { useState, useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { SiteLayout, contact } from "@/components/SiteLayout";
import { sanitizeIndianPhone, sanitizeName, validateName, validateEmail } from "@/lib/validation";
import {
  Car,
  Clock,
  ShieldCheck,
  Award,
  HeartHandshake,
  CheckCircle2,
  Phone,
  MessageCircle,
  MapPin,
  Sparkles,
  Users,
  ChevronRight,
  Send,
  HelpCircle,
  Briefcase,
  AlertCircle,
  FileText,
  Upload,
  Trash2,
  FileCheck,
  CreditCard,
  GraduationCap,
  ShieldAlert,
  Lock,
  RefreshCw,
  ArrowRight,
  X
} from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";

export const Route = createFileRoute("/mtp")({
  head: () => ({
    meta: [
      { title: "MTP (Multi Tasking Professionals) — Join Amma Seva Hyderabad" },
      {
        name: "description",
        content:
          "Register as a Multi Tasking Professional (MTP) with Amma Seva. Flexible part-time gigs: patient hospital dropping, elderly walking, medicine pickup, and home support.",
      },
      { property: "og:title", content: "MTP (Multi Tasking Professionals) — Amma Seva" },
      {
        property: "og:description",
        content: "Flexible, part-time and on-demand care gigs in Hyderabad. Weekly payouts, choose your hours.",
      },
      { property: "og:url", content: "/mtp" },
    ],
    links: [{ rel: "canonical", href: "/mtp" }],
  }),
  component: MTPPage,
});

export const REGIONAL_CONFIG: Record<
  string,
  { state: string; defaultCity: string; label: string; zones: string[] }
> = {
  "Telangana": {
    state: "Telangana",
    defaultCity: "Hyderabad",
    label: "Telangana (Hyderabad Region)",
    zones: [
      "Banjara Hills & Jubilee Hills",
      "Gachibowli & Hitec City",
      "Madhapur & Kondapur",
      "Kukatpally & Miyapur",
      "Secunderabad & Begumpet",
      "Ameerpet & SR Nagar",
      "Mehdipatnam & Tolichowki",
      "LB Nagar & Dilsukhnagar",
      "Uppal & Habsiguda",
      "Manikonda, Narsingi & Kokapet",
      "Attapur & Rajendranagar",
      "Other Locality in Telangana / Hyderabad"
    ],
  },
  "Andhra Pradesh": {
    state: "Andhra Pradesh",
    defaultCity: "Amaravathi",
    label: "Andhra Pradesh (Amaravathi / Vijayawada / Vizag)",
    zones: [
      "Amaravathi Capital Region & Secretariat",
      "Vijayawada Central & Benz Circle",
      "Vijayawada - One Town & Governorpet",
      "Vijayawada - Auto Nagar & Kanuru",
      "Guntur City - Brodipet & Arundelpet",
      "Guntur - Lakshmipuram & Pattabhipuram",
      "Mangalagiri & Tadepalli",
      "Tenali & Surroundings",
      "Visakhapatnam (Vizag) - MVP Colony & Siripuram",
      "Visakhapatnam (Vizag) - Gajuwaka & Madhurawada",
      "Tirupati & Chittoor Region",
      "Other Locality in Andhra Pradesh / Amaravathi"
    ],
  },
  "Tamil Nadu": {
    state: "Tamil Nadu",
    defaultCity: "Chennai",
    label: "Tamil Nadu (Chennai Region)",
    zones: [
      "Chennai Central & T. Nagar",
      "Anna Nagar & Kilpauk",
      "Adyar & Besant Nagar",
      "Velachery & Guindy",
      "OMR & Sholinganallur (IT Corridor)",
      "Tambaram, Chromepet & Pallavaram",
      "Porur, Vadapalani & Koyambedu",
      "Mylapore & Alwarpet",
      "Nungambakkam & Egmore",
      "Perambur & Kolathur",
      "Other Locality in Tamil Nadu / Chennai"
    ],
  },
  "Other": {
    state: "Other State",
    defaultCity: "Other City",
    label: "Other State / Custom Region",
    zones: [
      "Specify Custom Address / Locality Below"
    ],
  },
};

export interface MTPTaskItem {
  id: number;
  icon: string;
  title: string;
  description: string;
  shiftType?: string;
  earningEstimate?: string;
  active?: boolean;
}

function MTPPage() {
  const navigate = useNavigate();
  // Dynamic Tasks strictly fetched from Database
  const [mtpTasks, setMtpTasks] = useState<MTPTaskItem[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);

  // Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState("Male");
  const [age, setAge] = useState("");
  const [selectedState, setSelectedState] = useState("Telangana");
  const [locality, setLocality] = useState(REGIONAL_CONFIG["Telangana"].zones[0]);
  const [customAddress, setCustomAddress] = useState("");
  const [customStateName, setCustomStateName] = useState("");
  const [customCityName, setCustomCityName] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [availability, setAvailability] = useState("Part-time (Flexible)");
  const [vehicle, setVehicle] = useState("Two-wheeler (Bike / Scooty)");
  const [drivingLicense, setDrivingLicense] = useState("Yes");
  const [experience, setExperience] = useState("Fresher / Ready to Learn");
  const [skillsSummary, setSkillsSummary] = useState("");
  const [aadhaar, setAadhaar] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");

  // Document Uploads State
  const [aadhaarDoc, setAadhaarDoc] = useState("");
  const [aadhaarDocName, setAadhaarDocName] = useState("");

  const [panDoc, setPanDoc] = useState("");
  const [panDocName, setPanDocName] = useState("");

  const [drivingLicenseDoc, setDrivingLicenseDoc] = useState("");
  const [drivingLicenseDocName, setDrivingLicenseDocName] = useState("");

  const [tenthCertificateDoc, setTenthCertificateDoc] = useState("");
  const [tenthCertificateDocName, setTenthCertificateDocName] = useState("");

  const [policeVerificationDoc, setPoliceVerificationDoc] = useState("");
  const [policeVerificationDocName, setPoliceVerificationDocName] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedData, setSubmittedData] = useState<any | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // OTP Verification Flow States
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [registrationOtp, setRegistrationOtp] = useState("");
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<any | null>(null);

  useEffect(() => {
    let timer: any;
    if (otpCountdown > 0) {
      timer = setInterval(() => {
        setOtpCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [otpCountdown]);

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setDoc: (val: string) => void,
    setDocName: (name: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be under 10MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setDoc(reader.result as string);
      setDocName(file.name);
      toast.success(`${file.name} attached successfully.`);
    };
    reader.readAsDataURL(file);
  };

  // Fetch dynamic MTP Tasks from DB
  useEffect(() => {
    setIsLoadingTasks(true);
    fetch("/api/mtp/tasks")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const activeTasks = data.filter((t) => t.active !== false);
          setMtpTasks(activeTasks);
          if (activeTasks.length > 0 && selectedRoles.length === 0) {
            setSelectedRoles([`${activeTasks[0].icon || "🚗"} ${activeTasks[0].title}`]);
          }
        }
      })
      .catch((err) => console.error("Failed to fetch MTP tasks from database:", err))
      .finally(() => setIsLoadingTasks(false));
  }, []);

  const toggleRole = (roleLabel: string) => {
    if (selectedRoles.includes(roleLabel)) {
      if (selectedRoles.length === 1) {
        toast.error("Please select at least one task or role.");
        return;
      }
      setSelectedRoles(selectedRoles.filter((r) => r !== roleLabel));
    } else {
      setSelectedRoles([...selectedRoles, roleLabel]);
    }
  };

  const handleStateSelect = (stateKey: string) => {
    setSelectedState(stateKey);
    const cfg = REGIONAL_CONFIG[stateKey] || REGIONAL_CONFIG["Telangana"];
    setLocality(cfg.zones[0]);
    if (stateKey !== "Other" && !cfg.zones[0].toLowerCase().includes("other")) {
      setCustomAddress("");
    }
  };

  const isOtherLocality =
    locality.toLowerCase().includes("other") ||
    locality.toLowerCase().includes("specify") ||
    selectedState === "Other";

  const handleCloseModal = () => {
    setShowSuccessModal(false);
    setSubmittedData(null);
    setName("");
    setPhone("");
    setEmail("");
    setAge("");
    setSelectedState("Telangana");
    setLocality(REGIONAL_CONFIG["Telangana"].zones[0]);
    setCustomAddress("");
    setCustomStateName("");
    setCustomCityName("");
    setAadhaar("");
    setEmergencyContactName("");
    setEmergencyContactPhone("");
    setSkillsSummary("");
    setAadhaarDoc("");
    setAadhaarDocName("");
    setPanDoc("");
    setPanDocName("");
    setDrivingLicenseDoc("");
    setDrivingLicenseDocName("");
    setTenthCertificateDoc("");
    setTenthCertificateDocName("");
    setPoliceVerificationDoc("");
    setPoliceVerificationDocName("");
    setRegistrationOtp("");
    setShowOtpModal(false);
    setPendingPayload(null);
  };

  // Step 1: Validate inputs and trigger Registration OTP to Mobile & Email
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Full Name Validation
    const nameErr = validateName(name, "Full name");
    if (nameErr) {
      toast.error(nameErr);
      return;
    }
    const cleanName = name.trim();

    // 2. Mobile Number Validation (Strict Indian 10-digit mobile starting with 6,7,8,9)
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    if (!cleanPhone) {
      toast.error("Please enter your mobile / WhatsApp number.");
      return;
    }
    if (cleanPhone.length !== 10) {
      toast.error("Mobile number must be exactly 10 digits.");
      return;
    }
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      toast.error("Please enter a valid Indian mobile number starting with 6, 7, 8, or 9.");
      return;
    }

    // 3. Email Validation (Mandatory for MTP Registration & Updates)
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      toast.error("Please enter your email address for account alerts.");
      return;
    }
    const emailErr = validateEmail(cleanEmail, true, "Email address");
    if (emailErr) {
      toast.error(emailErr);
      return;
    }

    // 4. Age Validation
    if (age) {
      const numAge = Number(age);
      if (isNaN(numAge) || numAge < 18 || numAge > 70) {
        toast.error("Applicant age must be between 18 and 70 years.");
        return;
      }
    }

    // 5. Aadhaar Number Validation (If provided, must be exactly 12 digits)
    const cleanAadhaar = aadhaar.replace(/[^0-9]/g, "");
    if (cleanAadhaar && cleanAadhaar.length !== 12) {
      toast.error("Aadhaar Number must be exactly 12 digits.");
      return;
    }

    // 6. Selected Roles Validation
    if (selectedRoles.length === 0) {
      toast.error("Please select at least one preferred task or role.");
      return;
    }

    // 7. Emergency Contact Validation
    const emergencyNameErr = validateName(emergencyContactName, "Emergency Contact Person");
    if (emergencyNameErr) {
      toast.error(emergencyNameErr);
      return;
    }
    const cleanEmergencyName = emergencyContactName.trim();
    const cleanEmergencyPhone = emergencyContactPhone.replace(/[^0-9]/g, "");
    if (!cleanEmergencyPhone) {
      toast.error("Please enter the Emergency Contact mobile number.");
      return;
    }
    if (cleanEmergencyPhone.length !== 10) {
      toast.error("Emergency Contact mobile number must be exactly 10 digits.");
      return;
    }
    if (!/^[6-9]\d{9}$/.test(cleanEmergencyPhone)) {
      toast.error("Please enter a valid 10-digit Indian Emergency mobile number starting with 6, 7, 8, or 9.");
      return;
    }
    if (cleanEmergencyPhone === cleanPhone) {
      toast.error("Emergency Contact number cannot be identical to your own mobile number.");
      return;
    }

    // 8. Locality & Custom Address Validation
    let finalState = selectedState === "Other" ? (customStateName.trim() || "Other State") : (REGIONAL_CONFIG[selectedState]?.state || selectedState);
    let finalCity = selectedState === "Other" ? (customCityName.trim() || "Other City") : (REGIONAL_CONFIG[selectedState]?.defaultCity || "Hyderabad");
    let finalLocality = locality;

    if (selectedState === "Other") {
      if (!customStateName.trim()) {
        toast.error("Please specify your State name.");
        return;
      }
      if (!customCityName.trim()) {
        toast.error("Please specify your City name.");
        return;
      }
      if (!customAddress.trim()) {
        toast.error("Please enter your exact locality or full address.");
        return;
      }
      finalLocality = customAddress.trim();
    } else if (isOtherLocality) {
      if (!customAddress.trim()) {
        toast.error("Please enter your exact area / colony or full address.");
        return;
      }
      finalLocality = customAddress.trim();
    }

    // 9. Required KYC Documents Validation
    if (!aadhaarDoc) {
      toast.error("Please upload your Aadhaar Card document for identity verification.");
      return;
    }

    if (!panDoc) {
      toast.error("Please upload your PAN Card document for payout & tax verification.");
      return;
    }

    if (!policeVerificationDoc) {
      toast.error("Please upload your Police Verification Certificate or acknowledgment copy.");
      return;
    }

    const payload = {
      name: cleanName,
      phone: cleanPhone,
      email: cleanEmail,
      gender,
      age: age.trim(),
      state: finalState,
      city: finalCity,
      locality: finalLocality,
      roles: selectedRoles,
      availability,
      vehicle,
      drivingLicense,
      experience,
      skillsSummary: skillsSummary.trim(),
      aadhaar: cleanAadhaar,
      emergencyContact: `${cleanEmergencyName} (${cleanEmergencyPhone})`,
      aadhaarDoc,
      panDoc,
      drivingLicenseDoc,
      tenthCertificateDoc,
      policeVerificationDoc,
    };

    setPendingPayload(payload);
    setIsSendingOtp(true);

    try {
      const res = await fetch("/api/auth/send-registration-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: cleanPhone,
          email: cleanEmail,
          name: cleanName,
          role: "mtp",
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setShowOtpModal(true);
        setOtpCountdown(60);
        setRegistrationOtp("");
        toast.success(data.message || "6-digit OTP code sent to your Mobile & Email!");
      } else {
        toast.error(data.error || "Failed to dispatch verification code. Please try again.");
      }
    } catch (err) {
      console.error("Failed to send OTP:", err);
      toast.error("Network error. Could not dispatch OTP.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Step 2: Resend Registration OTP
  const handleResendRegistrationOtp = async () => {
    if (otpCountdown > 0 || isSendingOtp || !pendingPayload) return;
    setIsSendingOtp(true);
    try {
      const res = await fetch("/api/auth/send-registration-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: pendingPayload.phone,
          email: pendingPayload.email,
          name: pendingPayload.name,
          role: "mtp",
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setOtpCountdown(60);
        toast.success(data.message || "A new 6-digit OTP code has been dispatched.");
      } else {
        toast.error(data.error || "Failed to resend verification code.");
      }
    } catch (err) {
      toast.error("Network error. Failed to resend code.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Step 3: Verify OTP and finalize MTP Registration
  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanOtp = registrationOtp.trim();
    if (!cleanOtp || cleanOtp.length < 4) {
      toast.error("Please enter the 6-digit verification code.");
      return;
    }
    if (!pendingPayload) {
      toast.error("Registration session expired. Please fill the form again.");
      setShowOtpModal(false);
      return;
    }

    setIsVerifyingOtp(true);

    try {
      const res = await fetch("/api/mtp/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...pendingPayload,
          otp: cleanOtp,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        const finalData = data.data || pendingPayload;
        // Save session tokens for instant dashboard access
        if (data.token) {
          localStorage.setItem("ammaseva_caretaker_token", data.token);
          localStorage.setItem("ammaseva_caretaker_details", JSON.stringify(data.caretaker || finalData));
        }
        setSubmittedData(finalData);
        setShowOtpModal(false);
        setShowSuccessModal(true);
        try {
          confetti({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.6 },
          });
        } catch (e) {}
        toast.success("MTP Registration verified & submitted successfully!");
      } else {
        toast.error(data.error || "Verification failed. Please check the code and try again.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error during verification. Please try again.");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  return (
    <SiteLayout>
      {/* Hero Header Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#fbfbfe] via-cream/30 to-white py-8 sm:py-10 border-b border-border/40">
        <div className="absolute top-0 right-0 -z-10 h-96 w-96 rounded-full bg-gold/10 blur-3xl opacity-60" />
        <div className="absolute top-20 left-10 -z-10 h-80 w-80 rounded-full bg-primary/5 blur-3xl opacity-60" />

        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 xl:px-12 text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3.5 py-1 text-xs font-bold text-gold tracking-wider uppercase mb-3">
            <Sparkles className="h-3.5 w-3.5" />
            Hyderabad&apos;s Multi Tasking Professionals (MTP)
          </div>

          <div className="grid lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-4">
              <h1 className="text-4xl font-extrabold leading-tight text-primary sm:text-5xl lg:text-6xl font-display">
                Earn with Purpose. <br />
                <span className="text-gold italic font-medium">Work with Total Flexibility.</span>
              </h1>
              <p className="max-w-3xl text-base sm:text-lg text-slate-600 leading-relaxed">
                Join Amma Seva as an <strong>MTP (Multi Tasking Professional)</strong>. Anyone can register to provide on-demand support — from <strong>patient hospital dropping &amp; escort</strong> to <strong>elderly walking, medicine errands, and flexible homecare shifts</strong> across Hyderabad.
              </p>

              {/* Badges row */}
              <div className="pt-2 flex flex-wrap gap-2.5 sm:gap-3 text-xs font-semibold text-primary">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 shadow-xs">
                  <Clock className="h-4 w-4 text-gold" /> Choose Your Own Hours
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 shadow-xs">
                  <Award className="h-4 w-4 text-gold" /> Weekly Direct Payouts
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 shadow-xs">
                  <MapPin className="h-4 w-4 text-gold" /> Hyperlocal Neighborhood Gigs
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 shadow-xs">
                  <ShieldCheck className="h-4 w-4 text-gold" /> Official Amma Seva Digital ID
                </span>
              </div>
            </div>

            <div className="lg:col-span-4 bg-white/90 backdrop-blur-md rounded-2xl border border-gold/30 p-5 sm:p-6 shadow-xl space-y-3.5 text-left">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-gold/15 flex items-center justify-center text-gold font-bold">
                  <Car className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-gold">Fast Track Onboarding</div>
                  <div className="text-lg font-bold text-primary font-display">Instant Registration</div>
                </div>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Fill the form below in 2 minutes. Our Hyderabad Care Coordination desk will verify and activate your profile within 4–12 hours.
              </p>
              <a
                href="#register-form"
                className="w-full inline-flex items-center justify-center gap-2 btn-gold py-2.5 text-sm font-bold shadow-md"
              >
                Register as MTP Now <ChevronRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* What is an MTP & Tasks Grid */}
      <section className="py-8 sm:py-10 bg-white border-b border-border/40">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 xl:px-12 text-left">
          <div className="max-w-3xl mb-6 sm:mb-8">
            <h2 className="gold-rule text-3xl font-extrabold text-primary sm:text-4xl font-display">
              What Does an MTP Do?
            </h2>
            <p className="mt-2 text-base text-slate-600">
              MTPs are versatile, compassionate problem-solvers who assist local families with everyday care, logistics, and mobility tasks:
            </p>
          </div>

          {isLoadingTasks ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 animate-pulse">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-44 rounded-2xl bg-slate-100 border border-slate-200" />
              ))}
            </div>
          ) : mtpTasks.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-dashed border-slate-300 text-slate-400">
              No active MTP task categories available currently.
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {mtpTasks.map((item) => (
                <div
                  key={item.id}
                  className="group relative rounded-2xl border border-slate-200/80 bg-background p-6 transition-all duration-300 hover:-translate-y-1 hover:border-gold hover:shadow-xl"
                >
                  <div className="text-2xl mb-3">{item.icon || "🚗"}</div>
                  <h3 className="text-lg font-bold text-primary font-display mb-2 group-hover:text-gold transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{item.description}</p>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-gold">
                    <span>{item.shiftType || "Part-time / On-Demand"}</span>
                    <span>{item.earningEstimate || "₹300 - ₹1,500 / task"}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Why Join Benefits */}
      <section className="py-8 sm:py-10 bg-cream/35 border-b border-border/40">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 xl:px-12 text-left">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            <div className="lg:col-span-5 space-y-4">
              <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary uppercase tracking-wider">
                Why Join Amma Seva
              </span>
              <h2 className="text-3xl font-extrabold text-primary sm:text-4xl font-display leading-tight">
                Designed for Part-Timers, Students &amp; Professionals
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                Whether you have 2 spare hours every morning, want to do weekend runs, or seek daily shift opportunities — Amma Seva connects you with verified families right in your neighborhood.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <div className="mt-1 h-5 w-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <strong className="text-sm text-primary block">No Rigid Medical Degree Required</strong>
                    <span className="text-xs text-slate-500">Basic empathy, punctual attitude, and valid ID are all you need to start.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-1 h-5 w-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <strong className="text-sm text-primary block">Direct UPI / Bank Payouts</strong>
                    <span className="text-xs text-slate-500">Fast, transparent payments credited every week with zero hidden deductions.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-1 h-5 w-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <strong className="text-sm text-primary block">Verified Safe Patient Families</strong>
                    <span className="text-xs text-slate-500">All client bookings are pre-screened and logged on our central system.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* How It Works Steps */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
              <h3 className="text-xl font-bold text-primary font-display mb-5">
                How Onboarding Works (4 Simple Steps)
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 space-y-1.5">
                  <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs">
                    01
                  </div>
                  <h4 className="font-bold text-primary text-sm">Register Online</h4>
                  <p className="text-xs text-slate-500">Fill your contact, preferred localities and task interests below.</p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 space-y-1.5">
                  <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs">
                    02
                  </div>
                  <h4 className="font-bold text-primary text-sm">Quick Phone Check</h4>
                  <p className="text-xs text-slate-500">Our coordinator verifies your ID and gives a 10-min safety briefing.</p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 space-y-1.5">
                  <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs">
                    03
                  </div>
                  <h4 className="font-bold text-primary text-sm">Receive Gig Alerts</h4>
                  <p className="text-xs text-slate-500">Get nearby task requests via WhatsApp or phone call. Accept what fits.</p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 space-y-1.5">
                  <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs">
                    04
                  </div>
                  <h4 className="font-bold text-primary text-sm">Complete &amp; Get Paid</h4>
                  <p className="text-xs text-slate-500">Deliver quality care and receive direct payouts to your account.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Registration Form Section */}
      <section id="register-form" className="py-8 sm:py-10 bg-slate-50/60 border-t border-slate-100">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-10 lg:p-12 shadow-xl shadow-slate-900/5 text-left space-y-8">
            <div className="border-b border-slate-100 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-gold font-bold text-xs uppercase tracking-wider mb-1.5">
                  <Briefcase className="h-4 w-4" /> Official Registration Form
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-primary font-display tracking-tight">
                  MTP Registration — Amma Seva Network
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Fill in your accurate details below. No application fees. Safe, transparent and flexible.
                </p>
              </div>
              <div className="shrink-0 hidden sm:flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Free KYC Verification</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                
                {/* 1. Basic Personal Info (3 in a Row) */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-gold" /> 1. Personal &amp; Contact Details
                    </h3>
                    <span className="text-[11px] text-slate-400 font-medium">Fields with * are mandatory</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Full Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(sanitizeName(e.target.value))}
                        placeholder="e.g. Ramesh Kumar / Anitha Reddy"
                        className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-gold focus:bg-white focus:ring-2 focus:ring-gold/15 outline-none transition-all font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Mobile / WhatsApp Number <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative flex items-center">
                        <div className="absolute left-2.5 flex items-center gap-1 text-[11px] font-bold text-slate-600 border-r border-slate-200 pr-1.5 pointer-events-none">
                          <span>🇮🇳</span>
                          <span>+91</span>
                        </div>
                        <input
                          type="tel"
                          inputMode="numeric"
                          required
                          maxLength={10}
                          value={phone}
                          onChange={(e) => setPhone(sanitizeIndianPhone(e.target.value))}
                          placeholder="10-digit mobile"
                          className="w-full h-11 pl-14 pr-3.5 rounded-xl border border-slate-200 bg-slate-50/60 text-sm text-slate-800 font-mono font-bold placeholder:text-slate-400 placeholder:font-sans placeholder:font-normal focus:border-gold focus:bg-white focus:ring-2 focus:ring-gold/15 outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Email Address <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value.toLowerCase().trim())}
                        placeholder="yourname@gmail.com"
                        className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-gold focus:bg-white focus:ring-2 focus:ring-gold/15 outline-none transition-all font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Gender
                      </label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-sm text-slate-800 focus:border-gold focus:bg-white focus:ring-2 focus:ring-gold/15 outline-none transition-all font-medium cursor-pointer"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Age (Years)
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={2}
                        value={age}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "").slice(0, 2);
                          setAge(val);
                        }}
                        placeholder="e.g. 25"
                        className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-gold focus:bg-white focus:ring-2 focus:ring-gold/15 outline-none transition-all font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Aadhaar Number <span className="text-slate-400 font-normal">(12 Digits)</span>
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={12}
                        value={aadhaar}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "").slice(0, 12);
                          setAadhaar(val);
                        }}
                        placeholder="12-digit Aadhaar Number"
                        className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-gold focus:bg-white focus:ring-2 focus:ring-gold/15 outline-none transition-all font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Locality, Transport & Work Preferences (3 in a Row) */}
                <div className="space-y-4 pt-6 border-t border-slate-100">
                  <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-gold" /> 2. Operating State, Locality &amp; Transport
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                    {/* Operating State / Region */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Operating State / Region <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={selectedState}
                        onChange={(e) => handleStateSelect(e.target.value)}
                        className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-sm text-slate-800 font-bold focus:border-gold focus:bg-white focus:ring-2 focus:ring-gold/15 outline-none transition-all cursor-pointer"
                      >
                        {Object.entries(REGIONAL_CONFIG).map(([key, config]) => (
                          <option key={key} value={key}>
                            {config.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Preferred Zone / Area (Dynamic based on selected state) */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Preferred Zone / Locality <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={locality}
                        onChange={(e) => setLocality(e.target.value)}
                        className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-sm text-slate-800 focus:border-gold focus:bg-white focus:ring-2 focus:ring-gold/15 outline-none transition-all font-medium cursor-pointer"
                      >
                        {(REGIONAL_CONFIG[selectedState]?.zones || []).map((zone) => (
                          <option key={zone} value={zone}>
                            {zone}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* If Selected State is Other, show Custom State & City inputs */}
                    {selectedState === "Other" && (
                      <>
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                            State Name <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={customStateName}
                            onChange={(e) => setCustomStateName(e.target.value)}
                            placeholder="e.g. Karnataka / Maharashtra"
                            className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 text-sm text-slate-800 focus:border-gold focus:bg-white focus:ring-2 focus:ring-gold/15 outline-none transition-all font-medium"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                            City / District <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={customCityName}
                            onChange={(e) => setCustomCityName(e.target.value)}
                            placeholder="e.g. Bengaluru / Pune"
                            className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 text-sm text-slate-800 focus:border-gold focus:bg-white focus:ring-2 focus:ring-gold/15 outline-none transition-all font-medium"
                          />
                        </div>
                      </>
                    )}

                    {/* Conditional Custom Address / Other Locality Field */}
                    {isOtherLocality && (
                      <div className="col-span-1 sm:col-span-2 lg:col-span-3">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-gold" /> Specify Your Exact Area / Full Address <span className="text-rose-500">*</span>
                          </span>
                          <span className="text-[11px] text-emerald-600 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                            Saved directly to Database
                          </span>
                        </label>
                        <input
                          type="text"
                          required
                          value={customAddress}
                          onChange={(e) => setCustomAddress(e.target.value)}
                          placeholder={
                            selectedState === "Tamil Nadu"
                              ? "e.g. Flat 4B, Ruby Enclave, Gandhi Road, Tambaram / T. Nagar, Chennai - 600045"
                              : selectedState === "Andhra Pradesh"
                              ? "e.g. Door No. 12-4-8, Benz Circle / Brodipet / Amaravathi Rd, Vijayawada - 520010"
                              : selectedState === "Telangana"
                              ? "e.g. Plot 104, Green Meadows, Narsingi / Manikonda / Miyapur, Hyderabad - 500075"
                              : "e.g. Door / Flat No, Street, Landmark, Colony, City & Pincode"
                          }
                          className="w-full h-11 rounded-xl border-2 border-gold/50 bg-amber-50/20 px-3.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-gold focus:bg-white focus:ring-2 focus:ring-gold/20 outline-none transition-all font-medium shadow-sm"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Vehicle Available
                      </label>
                      <select
                        value={vehicle}
                        onChange={(e) => {
                          const val = e.target.value;
                          setVehicle(val);
                          if (val === "No Vehicle (Public Transport / Walking)") {
                            setDrivingLicense("No");
                          }
                        }}
                        className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-sm text-slate-800 focus:border-gold focus:bg-white focus:ring-2 focus:ring-gold/15 outline-none transition-all font-medium cursor-pointer"
                      >
                        <option value="Two-wheeler (Bike / Scooty)">Two-wheeler (Bike / Scooty)</option>
                        <option value="Four-wheeler (Car)">Four-wheeler (Car)</option>
                        <option value="No Vehicle (Public Transport / Walking)">No Vehicle (Public Transport / Walking)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Driving License Status {vehicle === "No Vehicle (Public Transport / Walking)" && <span className="text-slate-400 font-normal text-[11px] lowercase">(disabled)</span>}
                      </label>
                      <select
                        disabled={vehicle === "No Vehicle (Public Transport / Walking)"}
                        value={vehicle === "No Vehicle (Public Transport / Walking)" ? "No" : drivingLicense}
                        onChange={(e) => setDrivingLicense(e.target.value)}
                        className={`w-full h-11 rounded-xl border px-3 text-sm transition-all font-medium ${
                          vehicle === "No Vehicle (Public Transport / Walking)"
                            ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed select-none"
                            : "border-slate-200 bg-slate-50/60 text-slate-800 focus:border-gold focus:bg-white focus:ring-2 focus:ring-gold/15 outline-none cursor-pointer"
                        }`}
                      >
                        <option value="Yes">Yes, Active License</option>
                        <option value="No">No Driving License</option>
                        <option value="Learning">Learning / Applied</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Availability Preference
                      </label>
                      <select
                        value={availability}
                        onChange={(e) => setAvailability(e.target.value)}
                        className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-sm text-slate-800 focus:border-gold focus:bg-white focus:ring-2 focus:ring-gold/15 outline-none transition-all font-medium cursor-pointer"
                      >
                        <option value="Part-time (Flexible)">Part-time (Flexible / On-Demand)</option>
                        <option value="Part-time (Morning Shifts)">Part-time (Morning Shifts)</option>
                        <option value="Part-time (Evening Shifts)">Part-time (Evening Shifts)</option>
                        <option value="Weekends Only (Sat/Sun)">Weekends Only (Sat/Sun)</option>
                        <option value="Full-time (12h Shifts)">Full-time (12h Shifts)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Prior Work Experience
                      </label>
                      <select
                        value={experience}
                        onChange={(e) => setExperience(e.target.value)}
                        className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-sm text-slate-800 focus:border-gold focus:bg-white focus:ring-2 focus:ring-gold/15 outline-none transition-all font-medium cursor-pointer"
                      >
                        <option value="Fresher / Ready to Learn">Fresher / Ready to Learn</option>
                        <option value="1-2 Years Experience">1-2 Years Experience</option>
                        <option value="3-5 Years Experience">3-5 Years Experience</option>
                        <option value="5+ Years Healthcare/Driver/Helper">5+ Years Healthcare / Driver / Helper</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Emergency Contact Person <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={emergencyContactName}
                        onChange={(e) => setEmergencyContactName(sanitizeName(e.target.value))}
                        placeholder="e.g. Suresh Kumar (Brother)"
                        className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-gold focus:bg-white focus:ring-2 focus:ring-gold/15 outline-none transition-all font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Emergency Mobile Number <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative flex items-center">
                        <div className="absolute left-2.5 flex items-center gap-1 text-[11px] font-bold text-slate-600 border-r border-slate-200 pr-1.5 pointer-events-none">
                          <span>🇮🇳</span>
                          <span>+91</span>
                        </div>
                        <input
                          type="tel"
                          inputMode="numeric"
                          required
                          maxLength={10}
                          value={emergencyContactPhone}
                          onChange={(e) => setEmergencyContactPhone(sanitizeIndianPhone(e.target.value))}
                          placeholder="10-digit mobile"
                          className="w-full h-11 pl-14 pr-3.5 rounded-xl border border-slate-200 bg-slate-50/60 text-sm text-slate-800 font-mono font-bold placeholder:text-slate-400 placeholder:font-sans placeholder:font-normal focus:border-gold focus:bg-white focus:ring-2 focus:ring-gold/15 outline-none transition-all"
                        />
                      </div>
                    </div>

                    {/* Full-width Bio */}
                    <div className="col-span-1 sm:col-span-2 lg:col-span-3">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Languages Spoken &amp; Short Bio <span className="text-slate-400 font-normal">(Optional)</span>
                      </label>
                      <textarea
                        rows={2}
                        value={skillsSummary}
                        onChange={(e) => setSkillsSummary(e.target.value)}
                        placeholder="e.g. Fluent in Telugu and Hindi. Familiar with Banjara Hills & Gachibowli routes. Gentle and patient with elderly."
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-gold focus:bg-white focus:ring-2 focus:ring-gold/15 outline-none transition-all resize-none font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Preferred Tasks / Roles (3 in a Row Grid) */}
                <div className="space-y-3.5 pt-6 border-t border-slate-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-gold" /> 3. Select Tasks You Can Perform
                    </h3>
                    <span className="text-[11px] text-slate-400 font-semibold">Select all tasks that match your skills</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {mtpTasks.map((t) => {
                      const roleLabel = `${t.icon || "🚗"} ${t.title}`;
                      const isChecked = selectedRoles.includes(roleLabel) || selectedRoles.includes(t.title);
                      return (
                        <div
                          key={t.id}
                          onClick={() => toggleRole(roleLabel)}
                          className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all duration-200 ${
                            isChecked
                              ? "border-gold bg-gold/10 text-primary font-medium shadow-xs ring-1 ring-gold/40"
                              : "border-slate-200 bg-slate-50/40 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleRole(roleLabel)}
                            className="mt-0.5 h-4 w-4 rounded text-gold focus:ring-gold border-slate-300 pointer-events-none shrink-0"
                          />
                          <div className="text-xs leading-relaxed min-w-0 flex-1">
                            <span className="font-bold text-primary block truncate">{roleLabel}</span>
                            <span className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{t.description}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Document Uploads & KYC Verification (3 in a Row on Desktop) */}
                <div className="space-y-4 pt-6 border-t border-slate-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-gold" /> 4. Document Uploads &amp; KYC Verification
                    </h3>
                    <span className="text-[11px] text-slate-400 font-semibold">Accepted: JPG, PNG, PDF (Max 10MB)</span>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed">
                    Please upload clear photos or scanned copies of your official documents for fast-track profile verification and direct payout processing.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                    {/* 1. Aadhaar Card (Required) */}
                    <div className={`rounded-2xl border p-4 transition-all flex flex-col justify-between ${aadhaarDoc ? 'border-emerald-300 bg-emerald-50/40 shadow-xs' : 'border-slate-200 bg-slate-50/50'}`}>
                      <div className="flex items-start gap-3">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${aadhaarDoc ? 'bg-emerald-500 text-white' : 'bg-white text-primary border border-slate-200 shadow-xs'}`}>
                          {aadhaarDoc ? <CheckCircle2 className="h-5 w-5" /> : <FileText className="h-5 w-5 text-gold" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-primary truncate">Aadhaar Card</span>
                            <span className="rounded-md bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-700 shrink-0">Required *</span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">Front/Back or PDF</p>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-slate-200/60">
                        {aadhaarDoc ? (
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-medium truncate">
                              <FileCheck className="h-4 w-4 shrink-0 text-emerald-600" />
                              <span className="truncate max-w-[130px]">{aadhaarDocName || "Attached"}</span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <label htmlFor="mtp-aadhaar-input" className="text-[10px] font-bold text-primary hover:underline cursor-pointer bg-white px-2 py-0.5 rounded-lg border border-slate-200 shadow-2xs">Change</label>
                              <button type="button" onClick={() => { setAadhaarDoc(""); setAadhaarDocName(""); }} className="text-rose-600 hover:bg-rose-50 p-1 rounded-lg cursor-pointer" title="Remove"><Trash2 className="h-3 w-3" /></button>
                            </div>
                          </div>
                        ) : (
                          <label htmlFor="mtp-aadhaar-input" className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 bg-white py-2 text-xs font-bold text-slate-700 hover:border-gold hover:text-primary transition-all cursor-pointer hover:bg-gold/5">
                            <Upload className="h-3.5 w-3.5 text-gold" />
                            <span>Upload Aadhaar</span>
                          </label>
                        )}
                        <input id="mtp-aadhaar-input" type="file" accept="image/*,application/pdf" onChange={(e) => handleFileUpload(e, setAadhaarDoc, setAadhaarDocName)} className="hidden" />
                      </div>
                    </div>

                    {/* 2. PAN Card (Required) */}
                    <div className={`rounded-2xl border p-4 transition-all flex flex-col justify-between ${panDoc ? 'border-emerald-300 bg-emerald-50/40 shadow-xs' : 'border-slate-200 bg-slate-50/50'}`}>
                      <div className="flex items-start gap-3">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${panDoc ? 'bg-emerald-500 text-white' : 'bg-white text-primary border border-slate-200 shadow-xs'}`}>
                          {panDoc ? <CheckCircle2 className="h-5 w-5" /> : <CreditCard className="h-5 w-5 text-gold" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-primary truncate">PAN Card</span>
                            <span className="rounded-md bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-700 shrink-0">Required *</span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">For direct bank payouts</p>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-slate-200/60">
                        {panDoc ? (
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-medium truncate">
                              <FileCheck className="h-4 w-4 shrink-0 text-emerald-600" />
                              <span className="truncate max-w-[130px]">{panDocName || "Attached"}</span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <label htmlFor="mtp-pan-input" className="text-[10px] font-bold text-primary hover:underline cursor-pointer bg-white px-2 py-0.5 rounded-lg border border-slate-200 shadow-2xs">Change</label>
                              <button type="button" onClick={() => { setPanDoc(""); setPanDocName(""); }} className="text-rose-600 hover:bg-rose-50 p-1 rounded-lg cursor-pointer" title="Remove"><Trash2 className="h-3 w-3" /></button>
                            </div>
                          </div>
                        ) : (
                          <label htmlFor="mtp-pan-input" className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 bg-white py-2 text-xs font-bold text-slate-700 hover:border-gold hover:text-primary transition-all cursor-pointer hover:bg-gold/5">
                            <Upload className="h-3.5 w-3.5 text-gold" />
                            <span>Upload PAN</span>
                          </label>
                        )}
                        <input id="mtp-pan-input" type="file" accept="image/*,application/pdf" onChange={(e) => handleFileUpload(e, setPanDoc, setPanDocName)} className="hidden" />
                      </div>
                    </div>

                    {/* 3. Driving Licence (Optional) */}
                    <div className={`rounded-2xl border p-4 transition-all flex flex-col justify-between ${drivingLicenseDoc ? 'border-emerald-300 bg-emerald-50/40 shadow-xs' : 'border-slate-200 bg-slate-50/50'}`}>
                      <div className="flex items-start gap-3">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${drivingLicenseDoc ? 'bg-emerald-500 text-white' : 'bg-white text-primary border border-slate-200 shadow-xs'}`}>
                          {drivingLicenseDoc ? <CheckCircle2 className="h-5 w-5" /> : <Car className="h-5 w-5 text-gold" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-primary truncate">Driving Licence</span>
                            <span className="rounded-md bg-slate-200/80 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 shrink-0">Optional</span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">For escort &amp; dropping gigs</p>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-slate-200/60">
                        {drivingLicenseDoc ? (
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-medium truncate">
                              <FileCheck className="h-4 w-4 shrink-0 text-emerald-600" />
                              <span className="truncate max-w-[130px]">{drivingLicenseDocName || "Attached"}</span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <label htmlFor="mtp-dl-input" className="text-[10px] font-bold text-primary hover:underline cursor-pointer bg-white px-2 py-0.5 rounded-lg border border-slate-200 shadow-2xs">Change</label>
                              <button type="button" onClick={() => { setDrivingLicenseDoc(""); setDrivingLicenseDocName(""); }} className="text-rose-600 hover:bg-rose-50 p-1 rounded-lg cursor-pointer" title="Remove"><Trash2 className="h-3 w-3" /></button>
                            </div>
                          </div>
                        ) : (
                          <label htmlFor="mtp-dl-input" className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 bg-white py-2 text-xs font-bold text-slate-700 hover:border-gold hover:text-primary transition-all cursor-pointer hover:bg-gold/5">
                            <Upload className="h-3.5 w-3.5 text-gold" />
                            <span>Upload Driving Licence</span>
                          </label>
                        )}
                        <input id="mtp-dl-input" type="file" accept="image/*,application/pdf" onChange={(e) => handleFileUpload(e, setDrivingLicenseDoc, setDrivingLicenseDocName)} className="hidden" />
                      </div>
                    </div>

                    {/* 4. 10th Certificate (Optional) */}
                    <div className={`rounded-2xl border p-4 transition-all flex flex-col justify-between ${tenthCertificateDoc ? 'border-emerald-300 bg-emerald-50/40 shadow-xs' : 'border-slate-200 bg-slate-50/50'}`}>
                      <div className="flex items-start gap-3">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tenthCertificateDoc ? 'bg-emerald-500 text-white' : 'bg-white text-primary border border-slate-200 shadow-xs'}`}>
                          {tenthCertificateDoc ? <CheckCircle2 className="h-5 w-5" /> : <GraduationCap className="h-5 w-5 text-gold" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-primary truncate">10th Certificate</span>
                            <span className="rounded-md bg-slate-200/80 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 shrink-0">Optional</span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">Marksheet or qualification</p>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-slate-200/60">
                        {tenthCertificateDoc ? (
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-medium truncate">
                              <FileCheck className="h-4 w-4 shrink-0 text-emerald-600" />
                              <span className="truncate max-w-[130px]">{tenthCertificateDocName || "Attached"}</span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <label htmlFor="mtp-10th-input" className="text-[10px] font-bold text-primary hover:underline cursor-pointer bg-white px-2 py-0.5 rounded-lg border border-slate-200 shadow-2xs">Change</label>
                              <button type="button" onClick={() => { setTenthCertificateDoc(""); setTenthCertificateDocName(""); }} className="text-rose-600 hover:bg-rose-50 p-1 rounded-lg cursor-pointer" title="Remove"><Trash2 className="h-3 w-3" /></button>
                            </div>
                          </div>
                        ) : (
                          <label htmlFor="mtp-10th-input" className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 bg-white py-2 text-xs font-bold text-slate-700 hover:border-gold hover:text-primary transition-all cursor-pointer hover:bg-gold/5">
                            <Upload className="h-3.5 w-3.5 text-gold" />
                            <span>Upload 10th Certificate</span>
                          </label>
                        )}
                        <input id="mtp-10th-input" type="file" accept="image/*,application/pdf" onChange={(e) => handleFileUpload(e, setTenthCertificateDoc, setTenthCertificateDocName)} className="hidden" />
                      </div>
                    </div>

                    {/* 5. Police Verification Certificate (Required / Priority) - Spans 2 cols on desktop */}
                    <div className={`rounded-2xl border p-4 sm:col-span-2 lg:col-span-2 transition-all flex flex-col justify-between ${policeVerificationDoc ? 'border-emerald-300 bg-emerald-50/40 shadow-xs' : 'border-slate-200 bg-slate-50/50'}`}>
                      <div className="flex items-start gap-3">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${policeVerificationDoc ? 'bg-emerald-500 text-white' : 'bg-white text-primary border border-slate-200 shadow-xs'}`}>
                          {policeVerificationDoc ? <CheckCircle2 className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5 text-gold" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-primary truncate">Police Verification Certificate (PCC)</span>
                            <span className="rounded-md bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-700 shrink-0">Required *</span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">Police clearance certificate (PCC), acknowledgment copy, or character certificate</p>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-slate-200/60">
                        {policeVerificationDoc ? (
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-medium truncate">
                              <FileCheck className="h-4 w-4 shrink-0 text-emerald-600" />
                              <span className="truncate">{policeVerificationDocName || "Police Verification Attached"}</span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <label htmlFor="mtp-pcc-input" className="text-[10px] font-bold text-primary hover:underline cursor-pointer bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">Change</label>
                              <button type="button" onClick={() => { setPoliceVerificationDoc(""); setPoliceVerificationDocName(""); }} className="text-rose-600 hover:bg-rose-50 p-1 rounded-lg cursor-pointer" title="Remove"><Trash2 className="h-3.5 w-3.5" /></button>
                            </div>
                          </div>
                        ) : (
                          <label htmlFor="mtp-pcc-input" className="w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white py-2.5 text-xs font-bold text-slate-700 hover:border-gold hover:text-primary transition-all cursor-pointer hover:bg-gold/5">
                            <Upload className="h-3.5 w-3.5 text-gold" />
                            <span>Upload Police Verification Certificate</span>
                          </label>
                        )}
                        <input id="mtp-pcc-input" type="file" accept="image/*,application/pdf" onChange={(e) => handleFileUpload(e, setPoliceVerificationDoc, setPoliceVerificationDocName)} className="hidden" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Action */}
                <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-[11px] text-slate-400 max-w-md leading-relaxed">
                    🔒 By registering, you agree to undergo standard identity verification and adhere to the Amma Seva professional code of conduct.
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 btn-gold px-9 py-3.5 text-sm font-bold shadow-lg shadow-gold/25 cursor-pointer disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    {isSubmitting ? (
                      <>Processing Registration...</>
                    ) : (
                      <>
                        <Send className="h-4 w-4" /> Submit MTP Registration
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
        </div>
      </section>

      {/* MTP Frequently Asked Questions */}
      <section className="py-14 sm:py-20 bg-cream/35 border-t border-border/40 text-left">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 xl:px-12">
          
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full border border-slate-200 bg-white text-xs font-bold text-primary uppercase tracking-wider shadow-2xs">
              <HelpCircle className="h-3.5 w-3.5 text-gold" /> MTP Support &amp; FAQ
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-primary font-display">
              Frequently Asked Questions about MTP
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Everything you need to know about joining, earning, and working as a Multi Tasking Professional.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 items-start">
            {[
              {
                q: "What does an MTP (Multi Tasking Professional) do?",
                a: "MTPs handle flexible local assistance tasks including: safely accompanying seniors or patients for hospital doctor visits & dropping, picking up urgent medicines/prescriptions, assisting elders with morning walks, and providing part-time mother/newborn home support."
              },
              {
                q: "Who is eligible to join as an MTP?",
                a: "Anyone aged 18+ with a valid Aadhaar card, clean background, and compassionate mindset. Students, gig workers, part-timers, drivers, attendants, and home helpers can all register."
              },
              {
                q: "Do I need a bike or car to join?",
                a: "Having a two-wheeler (bike/scooty) is a great plus for patient dropping and medicine delivery, but is not mandatory. You can also accept walking and home-attendant shifts in your immediate locality."
              },
              {
                q: "How and when do I get paid?",
                a: "Payouts are transferred directly to your bank account or UPI every week. Rates range from ₹300 for quick errand runs to ₹800–₹1,500+ for hospital escorts and half-day shifts."
              },
              {
                q: "Is there any registration or platform fee?",
                a: "No! Registration with Amma Seva is 100% free. We never charge any upfront fees or registration deposits from our care professionals."
              },
              {
                q: "How quickly can I start receiving gig alerts?",
                a: "Once you submit your form and KYC documents, our Hyderabad Care Coordination desk reviews and approves your profile within 4–12 hours. You will then receive nearby task alerts directly on WhatsApp or via phone."
              }
            ].map((faq, i) => (
              <details
                key={i}
                className="group rounded-2xl border border-slate-200/90 bg-white p-5 hover:border-gold/70 transition-all duration-300 open:border-gold/80 open:shadow-[0_10px_25px_-5px_rgba(201,162,76,0.15)] hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-bold text-primary group-open:text-gold transition-colors select-none outline-none">
                  <span className="pr-4">{faq.q}</span>
                  <ChevronRight className="h-4 w-4 text-gold/80 transition-transform group-open:rotate-90 shrink-0" />
                </summary>
                <p className="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed pl-3.5 border-l-2 border-gold/40">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>

          {/* Full-width Help & Coordinator Banner */}
          <div className="mt-10 rounded-3xl bg-[#0b183b] text-white p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl border border-white/10">
            <div className="space-y-1.5 text-center sm:text-left">
              <div className="font-bold font-display text-lg sm:text-xl text-white flex items-center justify-center sm:justify-start gap-2">
                <Sparkles className="h-4 w-4 text-gold" />
                Have more questions about joining MTP?
              </div>
              <p className="text-xs sm:text-sm text-slate-300">
                Call or WhatsApp our Hyderabad care coordination desk directly: <strong className="text-gold">{contact.PHONE}</strong>
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
              <a
                href={`https://wa.me/${contact.WHATSAPP}?text=Hi%20Amma%20Seva%20Team,%20I%20have%20questions%20about%20the%20MTP%20Registration.`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-600 transition-all whitespace-nowrap"
              >
                <MessageCircle className="h-4 w-4" /> WhatsApp Us
              </a>
              <a
                href={`tel:${contact.PHONE_TEL}`}
                className="inline-flex items-center gap-2 rounded-xl bg-gold px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#b08b3a] transition-all whitespace-nowrap"
              >
                <Phone className="h-4 w-4" /> Call Coordinator
              </a>
            </div>
          </div>

        </div>
      </section>

      {/* OTP Verification Modal for Registration */}
      {showOtpModal && pendingPayload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border-2 border-gold/40 text-center animate-in zoom-in-95 duration-200 space-y-6 my-auto">
            
            {/* Close Button */}
            <button
              type="button"
              onClick={() => {
                if (!isVerifyingOtp) setShowOtpModal(false);
              }}
              className="absolute top-4 right-4 h-9 w-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Lock / Key Icon */}
            <div className="space-y-2">
              <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-tr from-[#091438] via-[#1e2a5a] to-[#091438] text-gold flex items-center justify-center shadow-lg border border-gold/30">
                <Lock className="h-8 w-8 text-gold" />
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-primary font-display tracking-tight">
                Verify OTP to Complete
              </h2>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                Enter the 6-digit verification code sent to your registered mobile and email.
              </p>
            </div>

            {/* Destination Badges */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs space-y-1 text-slate-700 text-left">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">📱 Mobile:</span>
                <span className="font-bold text-primary font-mono">+91 {pendingPayload.phone}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">✉️ Email:</span>
                <span className="font-bold text-primary truncate max-w-[200px]">{pendingPayload.email}</span>
              </div>
            </div>

            {/* OTP Input Form */}
            <form onSubmit={handleVerifyAndRegister} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5 text-left">
                  Enter 6-Digit OTP Code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoFocus
                  maxLength={6}
                  value={registrationOtp}
                  onChange={(e) => setRegistrationOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="• • • • • •"
                  className="w-full h-13 rounded-xl border-2 border-gold/50 bg-slate-50 text-center text-2xl font-mono font-extrabold tracking-[8px] text-primary focus:border-gold focus:bg-white focus:ring-4 focus:ring-gold/15 outline-none transition-all placeholder:tracking-normal placeholder:font-sans placeholder:text-sm placeholder:font-normal"
                />
              </div>

              {/* Resend Countdown */}
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-500">Didn&apos;t receive the code?</span>
                {otpCountdown > 0 ? (
                  <span className="font-bold text-gold font-mono">
                    Resend in {otpCountdown}s
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={isSendingOtp}
                    onClick={handleResendRegistrationOtp}
                    className="font-bold text-gold hover:text-[#9e7a2b] transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isSendingOtp ? "animate-spin" : ""}`} />
                    Resend Code
                  </button>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isVerifyingOtp || registrationOtp.length < 4}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-gold via-[#d8b458] to-gold text-[#091438] font-extrabold text-sm shadow-lg hover:shadow-xl hover:brightness-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                {isVerifyingOtp ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" /> Verifying &amp; Registering...
                  </>
                ) : (
                  <>
                    Verify &amp; Submit Application <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            <p className="text-[11px] text-slate-400">
              🔒 Safe &amp; verified via Amma Seva Care Network
            </p>
          </div>
        </div>
      )}

      {/* High-Converting Success / Congratulations Modal */}
      {showSuccessModal && submittedData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border-2 border-gold/40 text-center animate-in zoom-in-95 duration-200 space-y-6 my-auto max-h-[92vh] overflow-y-auto">
            
            {/* Close Button */}
            <button
              type="button"
              onClick={handleCloseModal}
              className="absolute top-4 right-4 h-9 w-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Top Celebration Icon & Badge */}
            <div className="space-y-3">
              <div className="mx-auto h-20 w-20 rounded-full bg-gradient-to-tr from-emerald-600 to-emerald-400 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3.5 py-1 text-xs font-bold text-emerald-800 tracking-wider uppercase">
                <Sparkles className="h-3.5 w-3.5 text-emerald-600" /> Registration Confirmed
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-primary font-display tracking-tight">
                Congratulations, {submittedData.name}! 🎉
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                You have successfully registered as a <strong>Multi Tasking Professional (MTP)</strong> with Amma Seva Hyderabad.
              </p>
            </div>

            {/* Reference ID Card */}
            <div className="rounded-2xl bg-gradient-to-r from-[#091438] via-[#1e2a5a] to-[#091438] p-4 sm:p-5 text-white shadow-md border border-gold/40 space-y-1">
              <div className="text-[11px] font-bold uppercase tracking-widest text-gold">Official MTP Reference ID</div>
              <div className="text-2xl sm:text-3xl font-extrabold tracking-wider font-mono text-white">
                #{submittedData.id || "MTP-PENDING"}
              </div>
              <div className="text-[10px] text-slate-300">
                Please save this ID for all coordination and payout inquiries.
              </div>
            </div>

            {/* Details Summary Table */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-left text-xs space-y-2.5 text-slate-700">
              <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-500">Applicant:</span>
                <span className="font-bold text-primary">{submittedData.name}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-500">Registered Mobile:</span>
                <span className="font-bold text-primary font-mono">{submittedData.phone}</span>
              </div>
              {submittedData.email && (
                <div className="flex justify-between border-b border-slate-200/60 pb-1.5 items-center">
                  <span className="text-slate-500">Email Address:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-slate-800">{submittedData.email}</span>
                    <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-800 shrink-0">
                      ✉️ Email Sent
                    </span>
                  </div>
                </div>
              )}
              <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-500">State &amp; City:</span>
                <span className="font-bold text-primary">
                  {submittedData.city ? `${submittedData.city}, ` : ""}{submittedData.state || "Telangana"}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-500">Preferred Zone / Area:</span>
                <span className="font-bold text-primary max-w-[240px] text-right truncate" title={submittedData.locality}>
                  {submittedData.locality}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-500">Assigned Tasks:</span>
                <span className="font-bold text-emerald-700 max-w-[240px] text-right truncate">
                  {Array.isArray(submittedData.roles) ? submittedData.roles.join(', ') : submittedData.roles}
                </span>
              </div>
              <div className="flex justify-between items-center pt-0.5">
                <span className="text-slate-500">KYC Status:</span>
                <span className="inline-flex items-center gap-1 font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 text-[10px]">
                  ⏳ Under Review (4–12 Hours)
                </span>
              </div>
            </div>

            {/* What Happens Next Steps */}
            <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-4 text-left space-y-1.5 text-xs text-emerald-900">
              <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600" /> What Happens Next?
              </div>
              <p className="text-[11px] text-emerald-800/90 leading-relaxed">
                1. Our Hyderabad coordination desk will verify your Aadhaar, PAN &amp; Police verification records.<br />
                2. You can log in using your registered Mobile / Email + OTP anytime to check your real-time approval status.<br />
                3. Once approved, your live task assignment dashboard opens with available companion gigs!
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  window.location.href = "/login";
                }}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold via-[#d8b458] to-gold text-[#091438] hover:brightness-105 px-5 py-3.5 text-sm font-extrabold shadow-lg hover:shadow-xl transition-all cursor-pointer border border-gold/40"
              >
                <Clock className="h-4 w-4" /> Go to Login / Check Verification →
              </button>
              <div className="flex flex-col sm:flex-row gap-2.5">
                <a
                  href={`https://wa.me/${contact.WHATSAPP}?text=Hi%20Amma%20Seva%20Team,%20I%20registered%20as%20an%20MTP%20(${encodeURIComponent(submittedData.name)}%20-%20${encodeURIComponent(submittedData.phone)}).%20My%20MTP%20Reference%20ID%20is%20%23${submittedData.id || "PENDING"}.%20Please%20verify%20my%20profile.`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-emerald-600 transition-all cursor-pointer"
                >
                  <MessageCircle className="h-4 w-4" /> WhatsApp Coordinator
                </a>
                <button
                  type="button"
                  onClick={() => {
                    handleCloseModal();
                    window.location.href = "/dashboard";
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Done &amp; Close
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </SiteLayout>
  );
}
