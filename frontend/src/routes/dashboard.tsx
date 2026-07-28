import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { fetchServices, type Service } from "../lib/services";
import { 
  Calendar, Clock, MapPin, User, FileText, CheckCircle2, 
  AlertTriangle, RefreshCw, XCircle, Download, CreditCard, 
  Phone, Briefcase, ChevronRight, Check, DollarSign, QrCode
} from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Customer Dashboard — Amma Seva" },
      { name: "description", content: "Book healthcare services, reschedule visits, track caregiver status, and view invoices." }
    ],
  }),
  component: CustomerDashboard,
});

interface UserDetails {
  id: number;
  name: string;
  email: string;
  phone: string;
}

interface Booking {
  id: number;
  name: string;
  phone: string;
  service: string;
  date: string;
  time: string;
  duration: string;
  address: string;
  status: string;
  assignedStaff: string | null;
  amount: number;
  paymentStatus: string;
  createdAt: string;
}

const SERVICES_CATALOG = [
  { id: "elderly", title: "Elderly Care at Home", rate: 1200, unit: "day", desc: "Assisting seniors with daily tasks, medication routine, and vitals monitoring." },
  { id: "mother-baby", title: "Mother & Baby Care", rate: 2500, unit: "day", desc: "Postnatal care for new moms and newborn health checks." },
  { id: "nursing", title: "Home Nursing Services", rate: 1500, unit: "visit", desc: "Post-surgery care, wound dressing, vitals tracking, and injections." },
  { id: "injection", title: "Injection Services", rate: 300, unit: "visit", desc: "IV, IM, and subcutaneous drug administrations by registered staff." },
  { id: "icu", title: "ICU/Home Recovery Support", rate: 4500, unit: "day", desc: "Critical home support with specialized medical staff and equipments." }
];

function CustomerDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserDetails | null>(null);
  
  // Role selection
  const [isCaretaker, setIsCaretaker] = useState(false);
  const [caretaker, setCaretaker] = useState<any | null>(null);

  // Caretaker form states
  const [caretakerName, setCaretakerName] = useState("");
  const [caretakerPhone, setCaretakerPhone] = useState("");
  const [caretakerSpecialty, setCaretakerSpecialty] = useState("Elderly Care");
  const [caretakerExperience, setCaretakerExperience] = useState("3");
  const [servicesList, setServicesList] = useState<any[]>(SERVICES_CATALOG);
  const [caretakerExperienceDetails, setCaretakerExperienceDetails] = useState("");
  const [caretakerWorkingLocations, setCaretakerWorkingLocations] = useState("");
  const [caretakerAvailableTimings, setCaretakerAvailableTimings] = useState("");
  const [caretakerAadhaar, setCaretakerAadhaar] = useState("");
  const [caretakerPan, setCaretakerPan] = useState("");
  const [caretakerCertificates, setCaretakerCertificates] = useState("");
  const [caretakerProfilePhoto, setCaretakerProfilePhoto] = useState("");
  
  const [isCaretakerSaving, setIsCaretakerSaving] = useState(false);
  const [caretakerError, setCaretakerError] = useState<string | null>(null);
  const [caretakerSuccess, setCaretakerSuccess] = useState<string | null>(null);

  // Caretaker file upload helper
  const handleCaretakerFileChange = (e: React.ChangeEvent<HTMLInputElement>, setFileState: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFileState(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Fetch caretaker profile
  const fetchCaretakerProfile = async () => {
    const token = localStorage.getItem("ammaseva_caretaker_token");
    if (!token) return;
    setIsLoading(true);
    setCaretakerError(null);
    try {
      const res = await fetch("/api/caretaker/profile", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load profile.");
      }
      const details = data.details;
      setCaretaker(details);
      setCaretakerName(details.name || "");
      setCaretakerPhone(details.phone || "");
      setCaretakerSpecialty(details.specialty || "Elderly Care");
      setCaretakerExperience(String(details.experience || "3"));
      setCaretakerExperienceDetails(details.experienceDetails || "");
      setCaretakerWorkingLocations(details.workingLocations || "");
      setCaretakerAvailableTimings(details.availableTimings || "");
      setCaretakerAadhaar(details.aadhaar || "");
      setCaretakerPan(details.pan || "");
      setCaretakerCertificates(details.certificates || "");
      setCaretakerProfilePhoto(details.profilePhoto || "");
    } catch (err: any) {
      setCaretakerError(err.message || "Failed to load profile.");
    } finally {
      setIsLoading(false);
    }
  };

  // Save caretaker details
  const handleCaretakerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCaretakerSaving(true);
    setCaretakerError(null);
    setCaretakerSuccess(null);
    try {
      const token = localStorage.getItem("ammaseva_caretaker_token");
      const res = await fetch("/api/caretaker/profile", {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name: caretakerName,
          phone: caretakerPhone,
          specialty: caretakerSpecialty,
          experience: Number(caretakerExperience),
          experienceDetails: caretakerExperienceDetails,
          workingLocations: caretakerWorkingLocations,
          availableTimings: caretakerAvailableTimings,
          aadhaar: caretakerAadhaar,
          pan: caretakerPan,
          certificates: caretakerCertificates,
          profilePhoto: caretakerProfilePhoto
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update profile.");
      }
      setCaretakerSuccess("Profile successfully updated!");
      setCaretaker(data.details);
      // Update local storage too so headers display correct name
      localStorage.setItem("ammaseva_caretaker_details", JSON.stringify(data.details));
      setTimeout(() => setCaretakerSuccess(null), 3000);
    } catch (err: any) {
      setCaretakerError(err.message || "Failed to save profile.");
    } finally {
      setIsCaretakerSaving(false);
    }
  };

  // View states
  const [activeView, setActiveView] = useState<"bookings" | "new-booking">("bookings");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  // New Booking State
  const [selectedServiceId, setSelectedServiceId] = useState("elderly");
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("09:00");
  const [bookingDuration, setBookingDuration] = useState("Daily");
  const [bookingAddress, setBookingAddress] = useState("");
  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [patientNeeds, setPatientNeeds] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"pay_later" | "card" | "upi">("pay_later");
  
  // Card states
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardHolder, setCardHolder] = useState("");

  // Booking result/modals state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  const [successBooking, setSuccessBooking] = useState<any | null>(null);

  // Action Modals State
  const [rescheduleBookingId, setRescheduleBookingId] = useState<number | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  
  const [activeInvoice, setActiveInvoice] = useState<Booking | null>(null);

  // Check login on mount
  useEffect(() => {
    const userToken = localStorage.getItem("ammaseva_user_token");
    const userDetails = localStorage.getItem("ammaseva_user_details");
    const caretakerToken = localStorage.getItem("ammaseva_caretaker_token");
    const caretakerDetails = localStorage.getItem("ammaseva_caretaker_details");

    if (caretakerToken && caretakerDetails) {
      setIsCaretaker(true);
      setCaretaker(JSON.parse(caretakerDetails));
      fetchCaretakerProfile();
    } else if (userToken && userDetails) {
      setIsCaretaker(false);
      setUser(JSON.parse(userDetails));
    } else {
      navigate({ to: "/login" });
    }
  }, [navigate]);

  // Load dynamic services for specialty dropdown and booking catalog
  useEffect(() => {
    fetchServices().then((list) => {
      const formatted = list.map((s) => {
        let rate = 1200;
        const matches = s.pricing?.replace(/,/g, '').match(/\d+/);
        if (matches) {
          rate = Number(matches[0]);
        }
        return {
          id: s.slug,
          title: s.title,
          rate: rate,
          unit: s.duration || "day",
          desc: s.short || s.description
        };
      });
      if (formatted.length > 0) {
        setServicesList(formatted);
        setSelectedServiceId(formatted[0].id);
      }
    });
  }, []);

  // Fetch customer bookings
  const fetchBookings = async () => {
    const token = localStorage.getItem("ammaseva_user_token");
    if (!token) return;
    setIsLoading(true);
    setDashboardError(null);
    try {
      const res = await fetch("/api/user/bookings", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load bookings log.");
      }
      setBookings(data);
    } catch (err: any) {
      setDashboardError(err.message || "Failed to load dashboard logs.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user, activeView]);

  // Calculate pricing
  const currentService = servicesList.find(s => s.id === selectedServiceId) || SERVICES_CATALOG.find(s => s.id === selectedServiceId) || servicesList[0] || SERVICES_CATALOG[0];
  const calculateTotal = () => {
    const base = currentService?.rate || 1200;
    switch (bookingDuration) {
      case "Hourly": return base * 0.5;
      case "Daily": return base;
      case "Weekly": return base * 6;
      case "Monthly": return base * 22;
      default: return base;
    }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);

    const submitBooking = async (payStatus: string) => {
      try {
        const token = localStorage.getItem("ammaseva_user_token");
        const res = await fetch("/api/booking", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            name: user.name,
            phone: user.phone,
            email: user.email, // Passing email to trigger confirmation email
            service: currentService.title,
            date: bookingDate,
            time: bookingTime,
            duration: bookingDuration,
            address: bookingAddress,
            amount: calculateTotal(),
            patientName,
            patientAge,
            patientNeeds,
            paymentMethod: paymentMethod === "pay_later" ? "Pay Later" : "Online Paid",
            paymentStatus: payStatus
          })
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Booking submission error.");
        }
        setSuccessBooking(data.data);
        // Reset form
        setBookingDate("");
        setBookingAddress("");
        setPatientName("");
        setPatientAge("");
        setPatientNeeds("");
      } catch (err: any) {
        alert("Booking failed: " + err.message);
      } finally {
        setIsSubmitting(false);
      }
    };

    if (paymentMethod !== "pay_later") {
      setIsPaymentProcessing(true);
      // Simulate visual loader payment gateway processing
      setTimeout(async () => {
        setIsPaymentProcessing(false);
        await submitBooking("Paid");
      }, 2000);
    } else {
      await submitBooking("Unpaid");
    }
  };

  const handleReschedule = async () => {
    if (!rescheduleBookingId) return;
    try {
      const token = localStorage.getItem("ammaseva_user_token");
      const res = await fetch(`/api/booking/${rescheduleBookingId}/reschedule`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ date: rescheduleDate, time: rescheduleTime })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Could not reschedule shift.");
      }
      alert("Shift rescheduled successfully!");
      setRescheduleBookingId(null);
      fetchBookings();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleCancel = async (id: number) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;
    try {
      const token = localStorage.getItem("ammaseva_user_token");
      const res = await fetch(`/api/booking/${id}/cancel`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Could not cancel shift.");
      }
      alert("Booking successfully cancelled.");
      fetchBookings();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("ammaseva_user_token");
    localStorage.removeItem("ammaseva_user_details");
    localStorage.removeItem("ammaseva_caretaker_token");
    localStorage.removeItem("ammaseva_caretaker_details");
    navigate({ to: "/login" });
  };

  if (isCaretaker) {
    return (
      <SiteLayout>
        <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8 animate-in fade-in duration-300">
          <div className="mx-auto max-w-4xl space-y-6">
            
            {/* Header Card */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-indigo-50 border border-slate-100 flex items-center justify-center text-indigo-600 shadow-inner shrink-0 overflow-hidden">
                  {caretakerProfilePhoto ? (
                    <img src={caretakerProfilePhoto} alt={caretakerName} className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-8 w-8" />
                  )}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-primary font-display">Caregiver Portal</h1>
                  <p className="text-sm text-slate-500">Welcome back, <span className="font-semibold text-slate-800">{caretakerName || caretaker?.name || "Caregiver"}</span></p>
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                className="btn-outline px-4 py-2 text-xs font-semibold flex items-center gap-1.5 cursor-pointer rounded-lg text-slate-600"
              >
                Sign Out
              </button>
            </div>

            {/* Application Status Banner */}
            {caretaker?.status === "Verified" ? (
              <div className="rounded-3xl border border-emerald-200 bg-emerald-50/50 p-6 flex gap-4 items-start shadow-sm">
                <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-emerald-900 font-display">Profile Approved & Active</h3>
                  <p className="text-sm text-emerald-800 leading-relaxed">
                    Your caretaker profile is fully verified by the administrator. Your profile is visible in the care network, and you can now be assigned to customer booking shifts.
                  </p>
                </div>
              </div>
            ) : caretaker?.status === "Rejected" ? (
              <div className="rounded-3xl border border-rose-200 bg-rose-50/50 p-6 flex gap-4 items-start shadow-sm">
                <div className="h-12 w-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-rose-900 font-display">Application Rejected</h3>
                  <p className="text-sm text-rose-800 leading-relaxed">
                    Your caregiver profile has been rejected by the administrator. Please update and fill your details accurately below, re-upload clear copies of all required documents, and submit for re-verification.
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border border-amber-200 bg-amber-50/50 p-6 flex gap-4 items-start shadow-sm">
                <div className="h-12 w-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                  <Clock className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-amber-900 font-display">Verification Pending</h3>
                  <p className="text-sm text-amber-800 leading-relaxed">
                    Your caretaker registration is currently undergoing administrative background checks. To speed up verification, make sure all your profile details and required documents are complete and up-to-date below.
                  </p>
                </div>
              </div>
            )}

            {/* Profile Form Card */}
            <div className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200/60 shadow-sm space-y-6">
              <div>
                <h2 className="text-xl font-bold text-primary font-display">Complete & Update Profile Details</h2>
                <p className="text-xs text-slate-400 mt-0.5">Keep your details up-to-date to receive relevant shift opportunities.</p>
              </div>

              {caretakerError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-800 text-sm flex gap-2 items-center">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>{caretakerError}</span>
                </div>
              )}

              {caretakerSuccess && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-800 text-sm flex gap-2 items-center">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{caretakerSuccess}</span>
                </div>
              )}

              <form onSubmit={handleCaretakerSubmit} className="space-y-6">
                
                {/* Profile Photo Upload and Preview */}
                <div className="flex flex-col sm:flex-row items-center gap-6 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                  <div className="h-24 w-24 rounded-full border-2 border-dashed border-slate-300 bg-white flex items-center justify-center text-slate-400 overflow-hidden relative group shrink-0">
                    {caretakerProfilePhoto ? (
                      <img src={caretakerProfilePhoto} alt="Profile preview" className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-10 w-10 text-slate-300" />
                    )}
                  </div>
                  <div className="space-y-2 text-center sm:text-left">
                    <span className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Profile Photo</span>
                    <p className="text-[11px] text-slate-400">Upload a professional face photo for patient trust.</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleCaretakerFileChange(e, setCaretakerProfilePhoto)}
                      className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Full Name</label>
                    <input
                      type="text"
                      required
                      value={caretakerName}
                      onChange={(e) => setCaretakerName(e.target.value)}
                      placeholder="e.g. Pandu R."
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-background outline-none focus:ring-2 focus:ring-gold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Phone Number</label>
                    <input
                      type="tel"
                      required
                      value={caretakerPhone}
                      onChange={(e) => setCaretakerPhone(e.target.value)}
                      placeholder="+91 XXXXX XXXXX"
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-background outline-none focus:ring-2 focus:ring-gold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Specialty / Role Category</label>
                    <select
                      value={caretakerSpecialty}
                      onChange={(e) => setCaretakerSpecialty(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-background outline-none focus:ring-2 focus:ring-gold"
                    >
                      {servicesList.map((s) => (
                        <option key={s.title} value={s.title}>{s.title}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Years of Experience</label>
                    <select
                      value={caretakerExperience}
                      onChange={(e) => setCaretakerExperience(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-background outline-none focus:ring-2 focus:ring-gold"
                    >
                      <option value="0">0-1 years</option>
                      <option value="1">1-2 years</option>
                      <option value="3">3-5 years</option>
                      <option value="6">6-9 years</option>
                      <option value="10">10+ years</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Working Locations (Areas)</label>
                    <input
                      type="text"
                      value={caretakerWorkingLocations}
                      onChange={(e) => setCaretakerWorkingLocations(e.target.value)}
                      placeholder="e.g. Kukatpally, Gachibowli"
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-background outline-none focus:ring-2 focus:ring-gold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Available Timings / Shifts</label>
                    <input
                      type="text"
                      value={caretakerAvailableTimings}
                      onChange={(e) => setCaretakerAvailableTimings(e.target.value)}
                      placeholder="e.g. Day Shift, Night Shift, 24/7 Live-in"
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-background outline-none focus:ring-2 focus:ring-gold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Detailed Experience & Skills Summary</label>
                  <textarea
                    value={caretakerExperienceDetails}
                    onChange={(e) => setCaretakerExperienceDetails(e.target.value)}
                    placeholder="Describe your qualifications, hospital training, types of patients managed, special clinical equipment handled (e.g. Ryles tube, catheter, IV line, oxygen)..."
                    rows={4}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-background outline-none focus:ring-2 focus:ring-gold"
                  />
                </div>

                {/* Documents Upload Section */}
                <div className="border border-slate-200/60 rounded-3xl p-6 bg-slate-50/50 space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                    <FileText className="h-5 w-5 text-indigo-600" />
                    <span className="text-sm font-bold text-slate-800 uppercase tracking-wider">Verification Documents</span>
                  </div>

                  <div className="grid gap-6 md:grid-cols-3">
                    
                    {/* Aadhaar */}
                    <div className="space-y-2">
                      <label className="block text-[11px] font-bold text-slate-600">Aadhaar Card (PDF / Image)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={(e) => handleCaretakerFileChange(e, setCaretakerAadhaar)}
                          className="w-full text-[11px] text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                        />
                      </div>
                      {caretakerAadhaar ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                          ✓ Document Uploaded
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] text-rose-500 font-semibold bg-rose-50 px-2 py-0.5 rounded-full">
                          ⚠ Missing Document
                        </span>
                      )}
                    </div>

                    {/* PAN Card */}
                    <div className="space-y-2">
                      <label className="block text-[11px] font-bold text-slate-600">PAN Card (PDF / Image)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={(e) => handleCaretakerFileChange(e, setCaretakerPan)}
                          className="w-full text-[11px] text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                        />
                      </div>
                      {caretakerPan ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                          ✓ Document Uploaded
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] text-rose-500 font-semibold bg-rose-50 px-2 py-0.5 rounded-full">
                          ⚠ Missing Document
                        </span>
                      )}
                    </div>

                    {/* Certificates */}
                    <div className="space-y-2">
                      <label className="block text-[11px] font-bold text-slate-600">Nursing / Care Certificates</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={(e) => handleCaretakerFileChange(e, setCaretakerCertificates)}
                          className="w-full text-[11px] text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                        />
                      </div>
                      {caretakerCertificates ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                          ✓ Document Uploaded
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] text-rose-500 font-semibold bg-rose-50 px-2 py-0.5 rounded-full">
                          ⚠ Missing Document
                        </span>
                      )}
                    </div>

                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={isCaretakerSaving}
                    className="btn-primary py-2.5 px-8 font-semibold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 w-full sm:w-auto"
                  >
                    {isCaretakerSaving && <RefreshCw className="h-4 w-4 animate-spin" />}
                    {isCaretakerSaving ? "Saving profile details..." : "Save Profile Details"}
                  </button>
                </div>

              </form>
            </div>

          </div>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          
          {/* Dashboard Header Bar */}
          <div className="rounded-3xl border border-slate-200/60 bg-white p-6 sm:p-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-gold">Dashboard Gateway</span>
              <h1 className="mt-1 text-3xl font-bold text-primary font-display">Welcome, {user?.name || "Patient"}</h1>
              <p className="text-xs text-slate-400 mt-0.5">Manage your homecare booking log and caretaker allocations.</p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setActiveView(activeView === "bookings" ? "new-booking" : "bookings")}
                className="btn-primary py-2 px-4 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                {activeView === "bookings" ? "Book New Service" : "View My Bookings"}
              </button>
              <button
                onClick={handleLogout}
                className="btn-outline py-2 px-4 text-xs font-semibold border-destructive/20 hover:bg-destructive hover:text-white text-destructive cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>

          {/* Main Workspace View */}
          {activeView === "bookings" ? (
            
            // MY BOOKINGS VIEW
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-primary font-display flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gold" /> My Healthcare Shifts
              </h2>

              {isLoading ? (
                <div className="flex justify-center py-20">
                  <RefreshCw className="h-10 w-10 text-gold animate-spin" />
                </div>
              ) : dashboardError ? (
                <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-6 text-destructive flex gap-3 items-center">
                  <AlertTriangle className="h-6 w-6 shrink-0" />
                  <div>
                    <span className="font-bold">Sync Error: </span>{dashboardError}
                  </div>
                </div>
              ) : bookings.length === 0 ? (
                <div className="rounded-3xl border border-slate-200/60 bg-white p-12 text-center shadow-sm">
                  <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-primary">No active bookings</h3>
                  <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">You haven't requested any care shifts yet. Get started by booking a verified homecare service.</p>
                  <button
                    onClick={() => setActiveView("new-booking")}
                    className="btn-primary mt-6 text-xs py-2 px-4 cursor-pointer"
                  >
                    Request Booking Now
                  </button>
                </div>
              ) : (
                <div className="grid gap-6">
                  {bookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="rounded-3xl border border-slate-200/60 bg-white p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col lg:flex-row justify-between gap-6"
                    >
                      <div className="space-y-4 flex-1">
                        {/* Summary Header */}
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Shift #{booking.id}</span>
                            <h3 className="text-xl font-bold text-primary font-display">{booking.service}</h3>
                          </div>
                          
                          <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded border ${
                            booking.status === "Confirmed" ? "bg-emerald-50 text-emerald-800 border-emerald-100" :
                            booking.status === "Cancelled" ? "bg-rose-50 text-rose-800 border-rose-100" :
                            "bg-amber-50 text-amber-800 border-amber-100"
                          }`}>
                            {booking.status}
                          </span>
                        </div>

                        {/* Booking Tracker Visual Pipeline (Stepper) */}
                        {booking.status !== "Cancelled" && (
                          <div className="pt-4 pb-2 border-t border-slate-100">
                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Care tracker status</span>
                            <div className="grid grid-cols-4 gap-2 relative">
                              
                              {/* Step 1: Request Pending */}
                              <div className="text-center">
                                <div className="h-6 w-6 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto text-xs font-bold shadow-sm">
                                  <Check className="h-3.5 w-3.5" />
                                </div>
                                <span className="block text-[9px] font-bold text-slate-700 mt-1">Requested</span>
                              </div>

                              {/* Step 2: Confirmed */}
                              <div className="text-center">
                                <div className={`h-6 w-6 rounded-full flex items-center justify-center mx-auto text-xs font-bold ${
                                  booking.status === "Confirmed" || booking.status === "Completed"
                                    ? "bg-emerald-500 text-white shadow-sm"
                                    : "bg-slate-100 text-slate-400"
                                }`}>
                                  {booking.status === "Confirmed" || booking.status === "Completed" ? <Check className="h-3.5 w-3.5" /> : "2"}
                                </div>
                                <span className="block text-[9px] font-bold text-slate-700 mt-1">Confirmed</span>
                              </div>

                              {/* Step 3: Caretaker Assigned */}
                              <div className="text-center">
                                <div className={`h-6 w-6 rounded-full flex items-center justify-center mx-auto text-xs font-bold ${
                                  (booking.status === "Confirmed" || booking.status === "Completed") && booking.assignedStaff
                                    ? "bg-emerald-500 text-white shadow-sm"
                                    : "bg-slate-100 text-slate-400"
                                }`}>
                                  {(booking.status === "Confirmed" || booking.status === "Completed") && booking.assignedStaff ? <Check className="h-3.5 w-3.5" /> : "3"}
                                </div>
                                <span className="block text-[9px] font-bold text-slate-700 mt-1">Staff Assigned</span>
                              </div>

                              {/* Step 4: Completed */}
                              <div className="text-center">
                                <div className={`h-6 w-6 rounded-full flex items-center justify-center mx-auto text-xs font-bold ${
                                  booking.status === "Completed"
                                    ? "bg-emerald-500 text-white shadow-sm"
                                    : "bg-slate-100 text-slate-400"
                                }`}>
                                  {booking.status === "Completed" ? <Check className="h-3.5 w-3.5" /> : "4"}
                                </div>
                                <span className="block text-[9px] font-bold text-slate-700 mt-1">Delivered</span>
                              </div>

                            </div>
                          </div>
                        )}

                        {/* Metadata Rows */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-4 border-t border-slate-100">
                          <div>
                            <span className="text-slate-400 block mb-0.5">Date &amp; Time</span>
                            <span className="font-semibold text-slate-800 flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5 text-slate-400" /> {booking.date} at {booking.time}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block mb-0.5">Duration</span>
                            <span className="font-semibold text-slate-800 flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5 text-slate-400" /> {booking.duration}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block mb-0.5">Caregiver Assigned</span>
                            <span className="font-semibold text-slate-800 flex items-center gap-1">
                              <User className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                              {booking.assignedStaff || "Allocating staff..."}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block mb-0.5">Invoice Billing</span>
                            <span className="font-bold text-slate-800">
                              ₹{booking.amount} <span className="text-[10px] font-medium text-emerald-600">({booking.paymentStatus})</span>
                            </span>
                          </div>
                        </div>

                        {booking.address && (
                          <div className="text-xs pt-2">
                            <span className="text-slate-400 block mb-0.5">Care Address</span>
                            <span className="text-slate-600 flex items-start gap-1">
                              <MapPin className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" /> {booking.address}
                            </span>
                          </div>
                        )}

                      </div>

                      {/* Action buttons */}
                      <div className="flex lg:flex-col justify-end gap-2 shrink-0 border-t lg:border-t-0 lg:border-l border-slate-100 pt-4 lg:pt-0 lg:pl-6">
                        {booking.status !== "Cancelled" && booking.status !== "Completed" && (
                          <>
                            <button
                              onClick={() => {
                                setRescheduleBookingId(booking.id);
                                setRescheduleDate(booking.date);
                                setRescheduleTime(booking.time);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-100 cursor-pointer transition-colors"
                            >
                              Reschedule Shift
                            </button>
                            <button
                              onClick={() => handleCancel(booking.id)}
                              className="px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold hover:bg-rose-500 hover:text-white cursor-pointer transition-colors"
                            >
                              Cancel Booking
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => setActiveInvoice(booking)}
                          className="px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold hover:bg-indigo-600 hover:text-white cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Download className="h-3.5 w-3.5" /> Invoice PDF
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            
            // NEW BOOKING VIEW
            <div className="rounded-3xl border border-slate-200/60 bg-white p-6 sm:p-8 shadow-sm">
              <h2 className="text-xl font-bold text-primary font-display flex items-center gap-2 mb-6">
                <Calendar className="h-5 w-5 text-gold" /> Schedule verified home care
              </h2>

              <form onSubmit={handleBookingSubmit} className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  
                  {/* Select Service */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Select Service</label>
                    <select
                      value={selectedServiceId}
                      onChange={(e) => setSelectedServiceId(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-md border border-slate-200 bg-background outline-none focus:ring-2 focus:ring-gold"
                    >
                      {servicesList.map(s => (
                        <option key={s.id} value={s.id}>{s.title} (₹{s.rate}/{s.unit})</option>
                      ))}
                    </select>
                    <p className="text-[10px] text-slate-400 mt-1.5">{currentService?.desc}</p>
                  </div>

                  {/* Duration Selector */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Shift Duration</label>
                    <select
                      value={bookingDuration}
                      onChange={(e) => setBookingDuration(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-md border border-slate-200 bg-background outline-none focus:ring-2 focus:ring-gold"
                    >
                      <option value="Hourly">Hourly (2-4 Hours)</option>
                      <option value="Daily">Daily (24 Hours shift)</option>
                      <option value="Weekly">Weekly Contract</option>
                      <option value="Monthly">Monthly Contract</option>
                    </select>
                  </div>

                  {/* Date selection */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Date</label>
                    <input
                      type="date"
                      required
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-md border border-slate-200 bg-background outline-none focus:ring-2 focus:ring-gold"
                    />
                  </div>

                  {/* Time selection */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Start Time</label>
                    <input
                      type="time"
                      required
                      value={bookingTime}
                      onChange={(e) => setBookingTime(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-md border border-slate-200 bg-background outline-none focus:ring-2 focus:ring-gold"
                    />
                  </div>

                  {/* Patient Name */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Patient Name</label>
                    <input
                      type="text"
                      required
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      placeholder="Enter patient full name"
                      className="w-full px-3 py-2 text-sm rounded-md border border-slate-200 bg-background outline-none focus:ring-2 focus:ring-gold"
                    />
                  </div>

                  {/* Patient Age */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Patient Age</label>
                    <input
                      type="number"
                      required
                      value={patientAge}
                      onChange={(e) => setPatientAge(e.target.value)}
                      placeholder="e.g. 72"
                      className="w-full px-3 py-2 text-sm rounded-md border border-slate-200 bg-background outline-none focus:ring-2 focus:ring-gold"
                    />
                  </div>

                </div>

                {/* Patient Special Needs */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Medical Conditions &amp; Special Needs</label>
                  <textarea
                    rows={2}
                    value={patientNeeds}
                    onChange={(e) => setPatientNeeds(e.target.value)}
                    placeholder="Describe patient condition (e.g. dementia, diabetic, wheelchair bound, urinary catheter, post-surgery)"
                    className="w-full px-3 py-2 text-sm rounded-md border border-slate-200 bg-background outline-none focus:ring-2 focus:ring-gold"
                  />
                </div>

                {/* Address */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Care Address</label>
                  <textarea
                    rows={2}
                    required
                    value={bookingAddress}
                    onChange={(e) => setBookingAddress(e.target.value)}
                    placeholder="Enter complete delivery address"
                    className="w-full px-3 py-2 text-sm rounded-md border border-slate-200 bg-background outline-none focus:ring-2 focus:ring-gold"
                  />
                </div>

                {/* Payment selection */}
                <div className="border-t border-slate-100 pt-6">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Choose Payment Method</label>
                  <div className="grid grid-cols-3 gap-4">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("pay_later")}
                      className={`p-4 border rounded-xl text-left transition-all cursor-pointer ${
                        paymentMethod === "pay_later" 
                          ? "border-gold bg-gold/5 text-gold shadow-sm" 
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <DollarSign className="h-6 w-6 mb-1.5" />
                      <span className="block text-xs font-bold">Pay Later</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Pay after service</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("card")}
                      className={`p-4 border rounded-xl text-left transition-all cursor-pointer ${
                        paymentMethod === "card" 
                          ? "border-gold bg-gold/5 text-gold shadow-sm" 
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <CreditCard className="h-6 w-6 mb-1.5" />
                      <span className="block text-xs font-bold">Credit/Debit Card</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Instant online payment</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("upi")}
                      className={`p-4 border rounded-xl text-left transition-all cursor-pointer ${
                        paymentMethod === "upi" 
                          ? "border-gold bg-gold/5 text-gold shadow-sm" 
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <QrCode className="h-6 w-6 mb-1.5" />
                      <span className="block text-xs font-bold">UPI QR Code</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Scan to pay instantly</span>
                    </button>
                  </div>
                </div>

                {/* Mock Card Form Details */}
                {paymentMethod === "card" && (
                  <div className="grid gap-4 md:grid-cols-3 bg-slate-50 p-6 rounded-2xl border border-slate-200/60 animate-in fade-in duration-300">
                    <div className="md:col-span-3">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Card Number</label>
                      <input
                        type="text"
                        required
                        maxLength={19}
                        placeholder="4111 2222 3333 4444"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-md border border-slate-200 bg-background outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Expiry Date</label>
                      <input
                        type="text"
                        required
                        maxLength={5}
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-md border border-slate-200 bg-background outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">CVV</label>
                      <input
                        type="password"
                        required
                        maxLength={3}
                        placeholder="•••"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-md border border-slate-200 bg-background outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Cardholder Name</label>
                      <input
                        type="text"
                        required
                        placeholder="Cardholder Name"
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-md border border-slate-200 bg-background outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Mock UPI Code Details */}
                {paymentMethod === "upi" && (
                  <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-200/60 animate-in fade-in duration-300 text-center">
                    <QrCode className="h-28 w-28 text-slate-800 mb-2 border p-2 bg-white rounded-xl" />
                    <span className="text-xs font-bold text-slate-800">Scan QR Code via PhonePe / GPay / BHIM</span>
                    <span className="text-[10px] text-slate-400 block mt-1">Payee: ammasevahomecare@okaxis</span>
                  </div>
                )}

                {/* Cost Summary & Submission */}
                <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 -mx-6 -mb-6 p-6 rounded-b-3xl">
                  <div>
                    <span className="text-xs text-slate-400">Total Price Estimate</span>
                    <span className="block text-2xl font-extrabold text-primary font-display mt-0.5">₹{calculateTotal().toLocaleString()}</span>
                    <span className="text-[10px] text-slate-400">Includes all nursing charges and platform taxes.</span>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={isSubmitting || isPaymentProcessing}
                    className="btn-primary py-2.5 px-6 font-semibold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 w-full sm:w-auto"
                  >
                    {(isSubmitting || isPaymentProcessing) && <RefreshCw className="h-4 w-4 animate-spin" />}
                    {isPaymentProcessing 
                      ? "Verifying payment session..." 
                      : isSubmitting 
                        ? "Booking care shift..." 
                        : "Confirm & Schedule Shift"}
                  </button>
                </div>

              </form>
            </div>
          )}

        </div>
      </div>

      {/* Booking SUCCESS Modal overlay */}
      {successBooking && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 border border-slate-200 shadow-2xl text-center space-y-6 animate-in zoom-in duration-300">
            <div className="h-16 w-16 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-primary font-display">Booking confirmed!</h3>
              <p className="text-sm text-slate-400">Your care request has been registered and verified.</p>
              <p className="text-xs text-emerald-600 bg-emerald-50 p-2 rounded-xl mt-2 font-medium">A confirmation alert has been sent via email to your registered account.</p>
            </div>
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl text-left text-xs space-y-2">
              <div className="flex justify-between"><span className="text-slate-400">Booking ID</span><span className="font-bold text-slate-800">#{successBooking.id}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Service</span><span className="font-semibold text-slate-800">{successBooking.service}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Scheduled Date</span><span className="font-semibold text-slate-800">{successBooking.date}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Total Price</span><span className="font-bold text-slate-800">₹{successBooking.amount}</span></div>
            </div>
            <button
              onClick={() => {
                setSuccessBooking(null);
                setActiveView("bookings");
              }}
              className="btn-primary w-full py-2.5 cursor-pointer"
            >
              Go to my bookings list
            </button>
          </div>
        </div>
      )}

      {/* Booking RESCHEDULE Modal Overlay */}
      {rescheduleBookingId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-5 animate-in zoom-in duration-200">
            <div>
              <h3 className="text-xl font-bold text-primary font-display">Reschedule Shift</h3>
              <p className="text-xs text-slate-400 mt-0.5">Select a new date and time for booking #{rescheduleBookingId}.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">New Date</label>
                <input
                  type="date"
                  required
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-md border border-slate-200 bg-background outline-none focus:ring-1 focus:ring-gold"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">New Start Time</label>
                <input
                  type="time"
                  required
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-md border border-slate-200 bg-background outline-none focus:ring-1 focus:ring-gold"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setRescheduleBookingId(null)}
                className="btn-outline flex-1 py-2 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleReschedule}
                className="btn-primary flex-1 py-2 text-xs font-semibold cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Modal Details View */}
      {activeInvoice && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-8 border border-slate-200 shadow-2xl space-y-6 animate-in zoom-in duration-200 relative max-h-[90vh] overflow-y-auto">
            
            {/* Invoice Print Sheet Header */}
            <div id="invoice-sheet" className="space-y-6">
              
              {/* Receipt Header */}
              <div className="flex justify-between items-start border-b border-slate-100 pb-6">
                <div>
                  <h3 className="text-2xl font-bold font-display text-primary">Amma Seva Healthcare</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Professional Care with a Mother's Touch</p>
                  <p className="text-[10px] text-slate-400">Hyderabad, Telangana, India</p>
                </div>
                <div className="text-right">
                  <span className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Receipt Invoice</span>
                  <span className="block text-lg font-bold text-slate-800 font-display">#INV-{activeInvoice.id}</span>
                  <span className="block text-[10px] text-slate-400 mt-1">Generated: {new Date(activeInvoice.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Patient & Customer Billing Rows */}
              <div className="grid grid-cols-2 gap-6 text-xs border-b border-slate-100 pb-6">
                <div>
                  <span className="block text-slate-400 font-semibold mb-1 uppercase tracking-wider">Billed To</span>
                  <span className="block font-bold text-slate-800">{user?.name}</span>
                  <span className="block text-slate-500">{user?.phone}</span>
                  <span className="block text-slate-500">{user?.email}</span>
                </div>
                <div>
                  <span className="block text-slate-400 font-semibold mb-1 uppercase tracking-wider">Service Delivery Address</span>
                  <span className="block text-slate-600 italic leading-relaxed">{activeInvoice.address}</span>
                </div>
              </div>

              {/* Invoice Table Items */}
              <div>
                <span className="block text-slate-400 font-semibold text-xs mb-3 uppercase tracking-wider">Invoice summary</span>
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 font-bold text-slate-800 bg-slate-50/50">
                      <th className="py-2.5 px-3">Service Description</th>
                      <th className="py-2.5 px-3">Duration Contract</th>
                      <th className="py-2.5 px-3">Schedule Date</th>
                      <th className="py-2.5 px-3 text-right">Billing Charge</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-100 text-slate-700">
                      <td className="py-3 px-3 font-semibold text-primary">{activeInvoice.service}</td>
                      <td className="py-3 px-3">{activeInvoice.duration}</td>
                      <td className="py-3 px-3">{activeInvoice.date} at {activeInvoice.time}</td>
                      <td className="py-3 px-3 text-right font-bold text-slate-800">₹{activeInvoice.amount}</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr className="text-slate-800 font-bold">
                      <td colSpan={3} className="py-3 px-3 text-right uppercase tracking-wider text-slate-400">Total Due Amount</td>
                      <td className="py-3 px-3 text-right text-base text-primary">₹{activeInvoice.amount}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Status details info */}
              <div className="rounded-xl bg-slate-50 p-4 border border-slate-100 flex justify-between items-center text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">Payment Mode</span>
                  <span className="font-semibold text-slate-700">Online/Pay Later Offline Billing</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block mb-0.5">Status</span>
                  <span className={`font-bold ${activeInvoice.paymentStatus === 'Paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {activeInvoice.paymentStatus}
                  </span>
                </div>
              </div>

            </div>

            {/* Print and Close controls */}
            <div className="flex gap-3 border-t border-slate-100 pt-5">
              <button
                onClick={() => setActiveInvoice(null)}
                className="btn-outline flex-1 py-2 text-xs font-semibold cursor-pointer"
              >
                Close View
              </button>
              <button
                onClick={() => window.print()}
                className="btn-primary flex-1 py-2 text-xs font-semibold cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Download className="h-4 w-4" /> Print / Save Invoice
              </button>
            </div>

          </div>
        </div>
      )}

    </SiteLayout>
  );
}
