import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { DocumentViewerModal } from "@/components/DocumentViewerModal";
import { validateName, validatePhone, validateEmail, validateAddress, sanitizeIndianPhone, sanitizeName } from "@/lib/validation";
import { fetchServices, type Service } from "../lib/services";
import { 
  Calendar, Clock, MapPin, User, Users, FileText, CheckCircle2, 
  AlertTriangle, RefreshCw, XCircle, Download, CreditCard, 
  Phone, Briefcase, ChevronRight, Check, DollarSign, QrCode, Upload,
  Star, MessageSquare, Eye, Gift, Copy, Send, Share2, ExternalLink, Sparkles,
  Shield, ArrowRight, ShieldCheck, Filter, Search, RotateCcw, MessageCircle, Heart, Lock, ShieldAlert
} from "lucide-react";

// Helper to compute / format Referral Code (FIRSTNAME + LAST 4 DIGITS OF PHONE)
function getCaregiverReferralCode(c: { name?: string; phone?: string; uniqueId?: string; referCode?: string; referralCode?: string } | null | undefined): string {
  if (!c) return "STAFF0000";
  if (c.referCode && !c.referCode.startsWith("AMMASEVA-")) return c.referCode;
  if (c.referralCode && !c.referralCode.startsWith("AMMASEVA-")) return c.referralCode;
  if (c.uniqueId && !c.uniqueId.startsWith("AMMASEVA-")) return c.uniqueId;
  const rawName = (c.name || "STAFF").trim();
  const nameWithoutTitle = rawName.replace(/^(dr\.?|mr\.?|mrs\.?|ms\.?|sister|nurse)\s+/i, "").trim();
  const firstName = (nameWithoutTitle.split(/\s+/)[0] || "STAFF").replace(/[^a-zA-Z]/g, "").toUpperCase() || "STAFF";
  const cleanPhone = (c.phone || "").replace(/[^0-9]/g, "");
  const last4 = cleanPhone.length >= 4 ? cleanPhone.slice(-4) : (cleanPhone.padEnd(4, "0") || "0000");
  return `${firstName}${last4}`;
}

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", 
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", 
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", 
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", 
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", 
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

const sortShiftsOrBookings = (list: any[]) => {
  return [...list].sort((a, b) => {
    const aFinished = (a.status === "Completed" || a.status === "Cancelled") ? 1 : 0;
    const bFinished = (b.status === "Completed" || b.status === "Cancelled") ? 1 : 0;
    if (aFinished !== bFinished) {
      return aFinished - bFinished;
    }
    return b.id - a.id;
  });
};

const filterShiftsOrBookings = (list: any[], search: string, startDate: string, endDate: string) => {
  let filtered = list;

  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter(item => {
      const service = (item.service || "").toLowerCase();
      const name = (item.name || item.patientName || "").toLowerCase();
      const phone = (item.phone || "").toLowerCase();
      const email = (item.email || item.customerEmail || "").toLowerCase();
      const address = (item.address || "").toLowerCase();
      const needs = (item.patientNeeds || "").toLowerCase();
      
      return service.includes(q) || 
             name.includes(q) || 
             phone.includes(q) || 
             email.includes(q) || 
             address.includes(q) || 
             needs.includes(q);
    });
  }

  if (startDate) {
    filtered = filtered.filter(item => item.date >= startDate);
  }
  if (endDate) {
    filtered = filtered.filter(item => item.date <= endDate);
  }

  return filtered;
};

const formatStepTime = (isoString?: string) => {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-IN", { month: "short", day: "numeric" }) + 
           " at " + 
           d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
  } catch (e) {
    return "";
  }
};

export const Route = createFileRoute("/dashboard")({
  validateSearch: (search: Record<string, unknown>): { service?: string; book?: string } => {
    return {
      service: typeof search.service === "string" ? search.service : undefined,
      book: typeof search.book === "string" ? search.book : undefined,
    };
  },
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
  baseAmount?: number;
  gstAmount?: number;
  paymentStatus: string;
  createdAt: string;
  patientName?: string;
  patientAge?: string;
  patientNeeds?: string;
  prescription?: string;
  googleMapLocation?: string;
  paymentMethod?: string;
  transactionId?: string;
  paymentDate?: string;
  isReviewed?: boolean;
  review?: {
    rating: number;
    comment?: string;
  };
  advancePaid?: number;
  balanceAmount?: number;
  caretakerPayoutStatus?: string;
  caretakerPayoutMethod?: string;
  caretakerPayoutRef?: string;
  caregiverDetails?: {
    name: string;
    phone: string;
    email?: string;
    specialty: string;
    experience: number;
    profilePhoto?: string;
    experienceDetails?: string;
  };
}

const SERVICES_CATALOG: any[] = [];

function CustomerDashboard() {
  const navigate = useNavigate();
  const search = Route.useSearch();

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const userToken = localStorage.getItem("ammaseva_user_token");
    const userDetails = localStorage.getItem("ammaseva_user_details");
    const caretakerToken = localStorage.getItem("ammaseva_caretaker_token");
    const caretakerDetails = localStorage.getItem("ammaseva_caretaker_details");
    return !!(userToken && userDetails) || !!(caretakerToken && caretakerDetails);
  });

  const handleLogout = () => {
    localStorage.removeItem("ammaseva_user_token");
    localStorage.removeItem("ammaseva_user_details");
    localStorage.removeItem("ammaseva_caretaker_token");
    localStorage.removeItem("ammaseva_caretaker_details");
    setIsAuthenticated(false);
    navigate({ to: "/login" });
  };

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
  
  const [caretakerExperienceCertificate, setCaretakerExperienceCertificate] = useState("");
  const [caretakerPoliceVerification, setCaretakerPoliceVerification] = useState("");
  const [caretakerAdditionalCertificates, setCaretakerAdditionalCertificates] = useState("");
  
  const [caretakerState, setCaretakerState] = useState("");
  const [caretakerCity, setCaretakerCity] = useState("");
  const [caretakerGoogleMapLocation, setCaretakerGoogleMapLocation] = useState("");
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  
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

  // Fetch announcements helper
  const fetchAnnouncements = async (role: 'user' | 'caretaker') => {
    const token = localStorage.getItem(role === 'caretaker' ? "ammaseva_caretaker_token" : "ammaseva_user_token");
    if (!token) return;
    try {
      const res = await fetch("/api/announcements", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.status === 401) {
        handleLogout();
        return;
      }
      const data = await res.json();
      if (res.ok) {
        setAnnouncements(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to load announcements:", err);
    }
  };

  // Fetch caretaker assigned bookings
  const fetchCaretakerBookings = async () => {
    const token = localStorage.getItem("ammaseva_caretaker_token");
    if (!token) return;
    setIsLoading(true);
    setDashboardError(null);
    try {
      const res = await fetch("/api/caretaker/bookings", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.status === 401) {
        handleLogout();
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load assigned shifts.");
      }
      setCaretakerBookings(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setDashboardError(err.message || "Failed to load assigned shifts.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveVitalsAndLogs = async (bookingId: number, currentBooking: any) => {
    const token = localStorage.getItem("ammaseva_caretaker_token");
    if (!token) return;
    setIsSavingLog(true);
    const vitalsObj = {
      bloodPressure: vitalBP,
      pulseRate: `${vitalPulse} bpm`,
      bodyTemp: `${vitalTemp} °F`,
      bloodGlucose: `${vitalSugar} mg/dL`,
      updatedAt: new Date().toISOString()
    };
    let logsArray: any[] = [];
    if (currentBooking.careLogs) {
      try {
        logsArray = typeof currentBooking.careLogs === 'string' 
          ? JSON.parse(currentBooking.careLogs) 
          : currentBooking.careLogs;
      } catch (e) {
        logsArray = [];
      }
    }
    if (!Array.isArray(logsArray)) logsArray = [];
    if (logMessage.trim()) {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12;
      hours = hours ? hours : 12;
      const timeStr = `${hours.toString().padStart(2, "0")}:${minutes} ${ampm}`;
      logsArray.push({
        time: timeStr,
        text: logMessage.trim(),
        loggedAt: now.toISOString()
      });
    }
    try {
      const res = await fetch(`/api/booking/${bookingId}/vitals-log`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          vitals: vitalsObj,
          careLogs: logsArray
        })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to update vitals and progress logs.");
      }
      alert("Shift vitals and care logs updated successfully!");
      setLogMessage("");
      setActiveLogShiftId(null);
      fetchCaretakerBookings();
    } catch (err: any) {
      alert(err.message || "Failed to update logs.");
    } finally {
      setIsSavingLog(false);
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
      if (res.status === 401) {
        handleLogout();
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load profile.");
      }
      const details = data.details;
      setCaretaker(details);
      setCaretakerReviews(details.reviews || []);
      setCaretakerAvgRating(details.rating !== undefined ? details.rating : 0);
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
      setCaretakerState(details.state || "");
      setCaretakerCity(details.city || "");
      setCaretakerGoogleMapLocation(details.googleMapLocation || "");
      setCaretakerExperienceCertificate(details.experienceCertificate || "");
      setCaretakerPoliceVerification(details.policeVerification || "");
      setCaretakerAdditionalCertificates(details.additionalCertificates || "");
    } catch (err: any) {
      setCaretakerError(err.message || "Failed to load profile.");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch caretaker referrals network intelligence
  const fetchCaretakerReferrals = async () => {
    const token = localStorage.getItem("ammaseva_caretaker_token");
    if (!token) return;
    setIsLoadingReferrals(true);
    try {
      const res = await fetch("/api/caretaker/referrals", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.status === 401) {
        handleLogout();
        return;
      }
      const data = await res.json();
      if (res.ok && data.success) {
        setCaretakerReferralsData(data);
      }
    } catch (err) {
      console.error("Failed to load caretaker referrals:", err);
    } finally {
      setIsLoadingReferrals(false);
    }
  };

  // Save caretaker details
  const handleCaretakerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCaretakerError(null);
    setCaretakerSuccess(null);

    const nameErr = validateName(caretakerName, "Full name");
    if (nameErr) {
      setCaretakerError(nameErr);
      return;
    }

    const phoneErr = validatePhone(caretakerPhone, "Phone number");
    if (phoneErr) {
      setCaretakerError(phoneErr);
      return;
    }

    if (!caretakerExperienceDetails.trim() || caretakerExperienceDetails.trim().length < 5) {
      setCaretakerError("Please provide experience and skills summary (at least 5 characters).");
      return;
    }

    if (!caretakerWorkingLocations.trim()) {
      setCaretakerError("Please enter preferred working locations/localities.");
      return;
    }

    if (!caretakerAvailableTimings.trim()) {
      setCaretakerError("Please enter available shift timings.");
      return;
    }

    if (!caretakerState.trim()) {
      setCaretakerError("Please select State.");
      return;
    }

    if (!caretakerCity.trim() || caretakerCity.trim().length < 2) {
      setCaretakerError("Please enter City.");
      return;
    }

    setIsCaretakerSaving(true);
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
          profilePhoto: caretakerProfilePhoto,
          state: caretakerState,
          city: caretakerCity,
          googleMapLocation: caretakerGoogleMapLocation,
          experienceCertificate: caretakerExperienceCertificate,
          policeVerification: caretakerPoliceVerification,
          additionalCertificates: caretakerAdditionalCertificates
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
  const [activeView, setActiveView] = useState<"bookings" | "new-booking">(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      // Only switch to new-booking if specifically requested via URL parameters
      if (urlParams.get("service") || urlParams.get("book") === "true") {
        return "new-booking";
      }
      const userToken = localStorage.getItem("ammaseva_user_token");
      if (userToken) {
        return "bookings";
      }
    }
    return "bookings";
  });
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [caretakerBookings, setCaretakerBookings] = useState<Booking[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  // Submit Review States
  const [submittingReviewBookingId, setSubmittingReviewBookingId] = useState<number | null>(null);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>("");
  const [isReviewSubmitting, setIsReviewSubmitting] = useState(false);

  // Caretaker dashboard filter states
  const [caretakerSearch, setCaretakerSearch] = useState("");
  const [caretakerStartDate, setCaretakerStartDate] = useState("");
  const [caretakerEndDate, setCaretakerEndDate] = useState("");
  const [caretakerReviews, setCaretakerReviews] = useState<any[]>([]);
  const [caretakerAvgRating, setCaretakerAvgRating] = useState<number>(5);
  // Customer dashboard filter states
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerStartDate, setCustomerStartDate] = useState("");
  const [customerEndDate, setCustomerEndDate] = useState("");
  const [expandedBookingIds, setExpandedBookingIds] = useState<Record<number, boolean>>({});

  // New Booking State
  const [selectedServiceId, setSelectedServiceId] = useState("elderly");
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("09:00");
  const [bookingDuration, setBookingDuration] = useState("Daily");
  const [durationCount, setDurationCount] = useState<number>(1);
  const [bookingStep, setBookingStep] = useState(1);
  const goToBookingStep = (step: number) => {
    setBookingStep(step);
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
  };
  const [bookingAddress, setBookingAddress] = useState("");
  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [patientRelation, setPatientRelation] = useState("Parents (Elderly)");
  const [patientMobility, setPatientMobility] = useState("Fully Mobile");
  const [patientNeeds, setPatientNeeds] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"pay_later" | "razorpay">("razorpay");
  
  const [prescriptionFile, setPrescriptionFile] = useState("");
  const [bookingGoogleMapLocation, setBookingGoogleMapLocation] = useState("");
  const [isFetchingLocationBooking, setIsFetchingLocationBooking] = useState(false);
  const [agreeTermsBooking, setAgreeTermsBooking] = useState(false);

  // Helper for today's ISO date (YYYY-MM-DD)
  const getTodayISO = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  const todayStr = getTodayISO();

  // Document Viewer Modal State
  const [docViewerState, setDocViewerState] = useState<{
    isOpen: boolean;
    docUrl: string | null;
    docTitle: string;
    applicantName: string;
    category: string;
  }>({
    isOpen: false,
    docUrl: null,
    docTitle: "",
    applicantName: "",
    category: "",
  });

  const openDocViewer = (docUrl?: string | null, docTitle = "Medical Document", applicantName = "", category = "Patient Medical Record") => {
    if (!docUrl) return;
    setDocViewerState({
      isOpen: true,
      docUrl,
      docTitle,
      applicantName,
      category,
    });
  };
 
  // Booking result/modals state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  const [successBooking, setSuccessBooking] = useState<any | null>(null);
 
  // Action Modals State
  const [rescheduleBookingId, setRescheduleBookingId] = useState<number | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editBookingId, setEditBookingId] = useState<number | null>(null);
  const [editPatientName, setEditPatientName] = useState("");
  const [editPatientAge, setEditPatientAge] = useState("");
  const [editPatientNeeds, setEditPatientNeeds] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editGoogleMapLocation, setEditGoogleMapLocation] = useState("");
  const [isSavingDetails, setIsSavingDetails] = useState(false);

  const [activeInvoice, setActiveInvoice] = useState<Booking | null>(null);
  const [activeLogShiftId, setActiveLogShiftId] = useState<number | null>(null);
  const [vitalBP, setVitalBP] = useState("120/80");
  const [vitalPulse, setVitalPulse] = useState("72");
  const [vitalTemp, setVitalTemp] = useState("98.4");
  const [vitalSugar, setVitalSugar] = useState("115");
  const [logMessage, setLogMessage] = useState("");
  const [isSavingLog, setIsSavingLog] = useState(false);
  const [activeCaregiverTab, setActiveCaregiverTab] = useState("shifts");
  const hasServiceParam = !!(new URLSearchParams(window.location.search).get("service"));

  // Caretaker Referral Network State
  const [caretakerReferralsData, setCaretakerReferralsData] = useState<{
    referCode: string;
    totalJoined: number;
    totalVerified: number;
    totalPending: number;
    members: any[];
  } | null>(null);
  const [isLoadingReferrals, setIsLoadingReferrals] = useState(false);
 
  // Scroll to top on initial dashboard mount
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
    const main = document.querySelector("main");
    if (main) main.scrollTop = 0;

    const t1 = setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      if (document.documentElement) document.documentElement.scrollTop = 0;
      if (document.body) document.body.scrollTop = 0;
    }, 40);
    const t2 = setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      if (document.documentElement) document.documentElement.scrollTop = 0;
      if (document.body) document.body.scrollTop = 0;
    }, 150);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  // Scroll to top on tab or view switch
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
    const main = document.querySelector("main");
    if (main) main.scrollTop = 0;
  }, [activeCaregiverTab, activeView]);

  // Check login on mount
  useEffect(() => {
    const userToken = localStorage.getItem("ammaseva_user_token");
    const userDetails = localStorage.getItem("ammaseva_user_details");
    const caretakerToken = localStorage.getItem("ammaseva_caretaker_token");
    const caretakerDetails = localStorage.getItem("ammaseva_caretaker_details");
 
    if (caretakerToken && caretakerDetails) {
      setIsCaretaker(true);
      try {
        const parsedCaretaker = JSON.parse(caretakerDetails);
        setCaretaker(parsedCaretaker);
        const isApproved = parsedCaretaker.status === "Verified" || parsedCaretaker.status === "Approved" || parsedCaretaker.status === "Active";
        if (!isApproved) {
          setActiveCaregiverTab("profile");
        } else {
          setActiveCaregiverTab("shifts");
        }
      } catch (e) {}
      fetchCaretakerProfile();
      fetchCaretakerBookings();
      fetchCaretakerReferrals();
      fetchAnnouncements('caretaker');
    } else if (userToken && userDetails) {
      setIsCaretaker(false);
      try {
        const parsedUser = JSON.parse(userDetails);
        setUser(parsedUser);
        setContactName(parsedUser.name || "");
        setContactPhone(parsedUser.phone || "");
        setContactEmail(parsedUser.email || "");
      } catch (e) {}
      fetchAnnouncements('user');
    } else {
      // Mandatory authentication: Redirect unauthenticated visitors to login/register first
      const currentUrl = typeof window !== "undefined" ? (window.location.pathname + window.location.search) : "/dashboard";
      window.location.href = `/login?redirect=${encodeURIComponent(currentUrl)}`;
    }
  }, [navigate]);

  useEffect(() => {
    if (isCaretaker && activeCaregiverTab === "referrals") {
      fetchCaretakerReferrals();
    }
  }, [activeCaregiverTab, isCaretaker]);
 
  // Load dynamic services for specialty dropdown and booking catalog
  useEffect(() => {
    fetchServices().then((list) => {
      const formatted = list.map((s) => {
        let rate = 1200;
        const matches = s.pricing?.replace(/,/g, '').match(/\d+/);
        if (matches) {
          rate = Number(matches[0]);
        }

        // Determine price basis unit from the pricing string (e.g. ₹900 / day -> day)
        let unit = "day";
        const priceStr = (s.pricing || "").toLowerCase();
        if (priceStr.includes("month")) {
          unit = "month";
        } else if (priceStr.includes("hour")) {
          unit = "hour";
        } else if (priceStr.includes("week")) {
          unit = "week";
        } else if (priceStr.includes("day") || priceStr.includes("visit") || priceStr.includes("session") || priceStr.includes("consultation")) {
          unit = "day";
        } else {
          // fallback to duration if pricing string doesn't specify unit
          const durStr = (s.duration || "").toLowerCase();
          if (durStr.includes("month")) unit = "month";
          else if (durStr.includes("hour")) unit = "hour";
          else if (durStr.includes("week")) unit = "week";
          else if (durStr.includes("task")) unit = "task";
          else unit = "day";
        }

        const isMtpService = !!s.isMtp || s.slug.startsWith("mtp") || (s.category && s.category.toLowerCase().includes("mtp"));

        return {
          id: s.slug,
          title: s.title,
          rate: isMtpService ? 0 : rate,
          unit: isMtpService ? "task" : unit,
          desc: s.short || s.description,
          advance: isMtpService ? 0 : (s.advance !== undefined && s.advance !== null ? Number(s.advance) : 0),
          isMtp: isMtpService,
          category: s.category || (isMtpService ? "MTP & Companion Tasks" : "Standard Care"),
          pricing: s.pricing || (isMtpService ? "Pay on Service / Custom Quote" : undefined)
        };
      });
      if (formatted.length > 0) {
        setServicesList(formatted);
        
        // Pre-select service from URL query params if present
        const urlParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
        const preSelected = ((search?.service || search?.book || urlParams.get("service") || urlParams.get("book") || "") as string).toLowerCase().trim();
        if (preSelected === "mtp" || preSelected.startsWith("mtp")) {
          const mtpItem = formatted.find(s => s.isMtp || s.id.startsWith("mtp")) || { id: "mtp-hospital-escort" };
          setSelectedServiceId(mtpItem.id);
          setActiveView("new-booking");
        } else if (preSelected === "care" || preSelected === "clinical") {
          const careItem = formatted.find(s => !s.isMtp) || formatted[0];
          if (careItem) setSelectedServiceId(careItem.id);
          setActiveView("new-booking");
        } else if (preSelected) {
          const matchingService = formatted.find(s => 
            s.id === preSelected || 
            s.id.startsWith(preSelected) || 
            preSelected.startsWith(s.id) ||
            s.id.includes(preSelected) ||
            preSelected.includes(s.id)
          );
          if (matchingService) {
            setSelectedServiceId(matchingService.id);
            setActiveView("new-booking");
          } else {
            setSelectedServiceId(formatted[0].id);
          }
        } else {
          setSelectedServiceId(formatted[0].id);
          const userToken = typeof window !== "undefined" ? localStorage.getItem("ammaseva_user_token") : null;
          if (userToken) {
            setActiveView("bookings");
          }
        }
      }
    });
  }, [search?.service, search?.book]);

  // Listen to search params reactively
  useEffect(() => {
    if (servicesList.length === 0) return;
    const urlParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
    const rawService = search?.service || search?.book || urlParams.get("service") || urlParams.get("book");
    const preSelected = (rawService ? String(rawService) : "").toLowerCase().trim();
    if (preSelected === "mtp" || preSelected.startsWith("mtp")) {
      const mtpItem = servicesList.find(s => s.isMtp || s.id.startsWith("mtp")) || { id: "mtp-hospital-escort" };
      setSelectedServiceId(mtpItem.id);
      setActiveView("new-booking");
    } else if (preSelected === "care" || preSelected === "clinical") {
      const careItem = servicesList.find(s => !s.isMtp) || servicesList[0];
      if (careItem) setSelectedServiceId(careItem.id);
      setActiveView("new-booking");
    } else if (preSelected) {
      const matchingService = servicesList.find(s => 
        s.id === preSelected || 
        s.id.startsWith(preSelected) || 
        preSelected.startsWith(s.id) ||
        s.id.includes(preSelected) ||
        preSelected.includes(s.id)
      );
      if (matchingService) {
        setSelectedServiceId(matchingService.id);
        setActiveView("new-booking");
      }
    } else {
      // Direct dashboard navigation without preselected service
      const userToken = typeof window !== "undefined" ? localStorage.getItem("ammaseva_user_token") : null;
      if (userToken) {
        setActiveView("bookings");
      }
    }
  }, [servicesList, search?.service, search?.book]);

  // Load Razorpay checkout script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
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
      if (res.status === 401) {
        handleLogout();
        return;
      }
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

  // Handle auto-triggering balance payment or opening a booking from email link ?payBookingId=123
  useEffect(() => {
    if (typeof window !== "undefined" && bookings.length > 0) {
      const urlParams = new URLSearchParams(window.location.search);
      const payBookingId = urlParams.get("payBookingId") || urlParams.get("bookingId");
      if (payBookingId) {
        const targetId = Number(payBookingId);
        const targetBooking = bookings.find((b) => b.id === targetId);
        if (targetBooking) {
          setExpandedBookingIds((prev) => ({ ...prev, [targetId]: true }));
          setTimeout(() => {
            const el = document.getElementById(`booking-card-${targetId}`);
            if (el) {
              el.scrollIntoView({ behavior: "smooth", block: "center" });
            }
            if (Number(targetBooking.balanceAmount) > 0 && targetBooking.status !== "Cancelled") {
              handlePayBalance(targetBooking);
            }
          }, 500);
        }
      }
    }
  }, [bookings]);

  // Automatically adjust billing option based on selected service's pricing unit
  useEffect(() => {
    const current = servicesList.find(s => s.id === selectedServiceId) || servicesList[0];
    if (!current) return;
    if (current.isMtp || (selectedServiceId && selectedServiceId.startsWith("mtp"))) {
      setBookingDuration("Daily");
      setDurationCount(1);
      return;
    }
    const unit = (current.unit || 'day').toLowerCase();
    if (unit.includes('month')) {
      setBookingDuration("Monthly");
    } else if (unit.includes('hour')) {
      setBookingDuration("Hourly");
    } else if (unit.includes('week')) {
      setBookingDuration("Weekly");
    } else {
      setBookingDuration("Daily");
    }
    setDurationCount(1);
  }, [selectedServiceId, servicesList]);
 
  // Calculate pricing
  const currentService = servicesList.find(s => s.id === selectedServiceId) || SERVICES_CATALOG.find(s => s.id === selectedServiceId) || servicesList[0] || SERVICES_CATALOG[0];
  const isMtpBooking = Boolean(currentService?.isMtp || (selectedServiceId && (selectedServiceId.startsWith("mtp") || selectedServiceId.includes("mtp"))));
  
  const getServiceRates = () => {
    if (!currentService) return { hourly: 0, daily: 0, weekly: 0, monthly: 0, basis: 'day' };
    if (isMtpBooking) {
      return { hourly: 0, daily: 0, weekly: 0, monthly: 0, basis: 'task' };
    }
    const base = currentService.rate || 1200;
    const unit = (currentService.unit || 'day').toLowerCase();

    let hourly = 0;
    let daily = 0;
    let weekly = 0;
    let monthly = 0;
    let basis = 'day';

    if (unit.includes('month')) {
      basis = 'month';
      monthly = base;
      daily = Math.round(monthly / 30);
      weekly = Math.round(daily * 7);
      hourly = Math.round(daily / 24);
    } else if (unit.includes('hour')) {
      basis = 'hour';
      hourly = base;
      daily = Math.round(hourly * 24);
      weekly = Math.round(daily * 7);
      monthly = Math.round(daily * 30);
    } else if (unit.includes('visit') || unit.includes('session') || unit.includes('consultation')) {
      basis = 'day';
      daily = base;
      hourly = base;
      weekly = base * 7;
      monthly = base * 30;
    } else { // default to 'day'
      basis = 'day';
      daily = base;
      hourly = Math.round(daily / 24);
      weekly = Math.round(daily * 7);
      monthly = Math.round(daily * 30);
    }

    return { hourly, daily, weekly, monthly, basis };
  };

  const calculateBaseAmount = () => {
    const isMtpBooking = Boolean(currentService?.isMtp || (selectedServiceId && (selectedServiceId.startsWith("mtp") || selectedServiceId.includes("mtp"))));
    if (isMtpBooking) {
      return 0; // Free Dispatch / Pay on Service (₹0 upfront advance)
    }
    const count = Number(durationCount) || 1;
    const rates = getServiceRates();
    switch (bookingDuration) {
      case "Hourly": return rates.hourly * count;
      case "Daily": return rates.daily * count;
      case "Weekly": return rates.weekly * count;
      case "Monthly": return rates.monthly * count;
      default: return rates.daily * count;
    }
  };

  const calculateGST = (base?: number) => {
    const b = base !== undefined ? base : calculateBaseAmount();
    return Math.round(b * 0.18);
  };

  const calculateTotal = () => {
    const base = calculateBaseAmount();
    const gst = calculateGST(base);
    return base + gst;
  };

  const calculateAdvance = () => {
    const isMtpBooking = Boolean(currentService?.isMtp || (selectedServiceId && (selectedServiceId.startsWith("mtp") || selectedServiceId.includes("mtp"))));
    if (isMtpBooking) {
      return 0; // ₹0 upfront advance for MTP tasks
    }
    const service = currentService || servicesList.find(s => s.id === selectedServiceId) || SERVICES_CATALOG.find(s => s.id === selectedServiceId);
    if (service && service.advance !== undefined && service.advance !== null && service.advance !== '') {
      const configuredAdvance = Number(service.advance);
      // Admin configured fixed advance (e.g. ₹1 or ₹300) capped at total shift value
      return Math.min(calculateTotal(), Math.max(0, configuredAdvance));
    }
    return 0;
  };

  const validateStep1 = () => {
    if (!bookingDate || !bookingTime) {
      alert("Please select the care shift starting Date and Time.");
      return false;
    }
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    if (bookingDate < todayStr) {
      alert("Booking date cannot be in the past. Please select today or a future date.");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!user) {
      const contactNameErr = validateName(contactName, "Your name / Contact person");
      if (contactNameErr) {
        alert(contactNameErr);
        return false;
      }
      const contactPhoneErr = validatePhone(contactPhone, "Your mobile number");
      if (contactPhoneErr) {
        alert(contactPhoneErr);
        return false;
      }
      if (contactEmail && contactEmail.trim()) {
        const emailErr = validateEmail(contactEmail, false, "Email address");
        if (emailErr) {
          alert(emailErr);
          return false;
        }
      }
    }

    const nameErr = validateName(patientName, "Patient name");
    if (nameErr) {
      alert(nameErr);
      return false;
    }
    const age = Number(patientAge);
    if (!patientAge || isNaN(age) || age < 0 || age > 125) {
      alert("Please enter a valid patient age between 0 and 125.");
      return false;
    }
    return true;
  };
 
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const userToken = localStorage.getItem("ammaseva_user_token");
    if (!user && !userToken) {
      alert("Please sign in or register with your mobile number to complete your booking.");
      const currentUrl = typeof window !== "undefined" ? (window.location.pathname + window.location.search) : "/dashboard";
      window.location.href = `/login?redirect=${encodeURIComponent(currentUrl)}`;
      return;
    }

    const isMtpBooking = Boolean(currentService?.isMtp || (selectedServiceId && (selectedServiceId.startsWith("mtp") || selectedServiceId.includes("mtp"))));

    if (isMtpBooking) {
      // Simplified validation for MTP tasks: Name, Phone, Date, Time, Location Address
      const bookerNameInput = (user?.name || contactName || patientName || "").trim();
      const nameErr = validateName(bookerNameInput, "Your name");
      if (nameErr) {
        alert(nameErr);
        return;
      }
      const bookerPhoneInput = (user?.phone || contactPhone || "").trim();
      const phoneErr = validatePhone(bookerPhoneInput, "Your mobile number");
      if (phoneErr) {
        alert(phoneErr);
        return;
      }
      if (contactEmail && contactEmail.trim()) {
        const emailErr = validateEmail(contactEmail, false, "Email address");
        if (emailErr) {
          alert(emailErr);
          return;
        }
      }
      if (!bookingDate || !bookingTime) {
        alert("Please select the task Date and Time.");
        return;
      }
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      if (bookingDate < todayStr) {
        alert("Task date cannot be in the past. Please select today or a future date.");
        return;
      }
      const addrErr = validateAddress(bookingAddress, "Task location address");
      if (addrErr) {
        alert(addrErr);
        return;
      }
      if (!agreeTermsBooking) {
        alert("Please check the box to confirm your MTP task booking.");
        return;
      }
    } else {
      if (!validateStep1() || !validateStep2()) {
        return;
      }

      const addrErr = validateAddress(bookingAddress, "Care address");
      if (addrErr) {
        alert(addrErr);
        return;
      }

      if (!agreeTermsBooking) {
        alert("Please check the box to agree to the Amma Seva Patient Booking Terms & Conditions.");
        return;
      }
    }

    const bookerName = (user?.name || contactName || patientName || "Customer").trim();
    const bookerPhone = sanitizeIndianPhone(user?.phone || contactPhone || "9490587575");
    const bookerEmail = (user?.email || contactEmail || "").trim();

    setIsSubmitting(true);
 
    const submitBooking = async (payStatus: string, razorpayPaymentDetails?: any) => {
      try {
        const token = localStorage.getItem("ammaseva_user_token");
        const formattedDuration = isMtpBooking
          ? `${durationCount} ${durationCount === 1 ? "Task / Visit" : "Tasks / Visits"}`
          : `${durationCount} ${
              bookingDuration === "Hourly" ? (durationCount === 1 ? "Hour" : "Hours") :
              bookingDuration === "Daily" ? (durationCount === 1 ? "Day" : "Days") :
              bookingDuration === "Weekly" ? (durationCount === 1 ? "Week" : "Weeks") :
              (durationCount === 1 ? "Month" : "Months")
            }`;

        const baseCost = calculateBaseAmount();
        const gstCost = calculateGST(baseCost);
        const totalCost = calculateTotal();
        const advPaid = isMtpBooking 
          ? (payStatus === "Advance Paid" || payStatus === "Paid" ? totalCost : 0)
          : (payStatus === "Advance Paid" ? calculateAdvance() : 0);
        const balDue = Math.max(0, totalCost - advPaid);

        const res = await fetch("/api/booking", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            ...(token ? { "Authorization": `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            name: bookerName,
            phone: bookerPhone,
            email: bookerEmail,
            service: currentService?.title || (isMtpBooking ? "MTP Task Companion" : "Home Care Healthcare"),
            date: bookingDate || new Date().toISOString().split("T")[0],
            time: bookingTime || "09:00 AM",
            duration: formattedDuration || "1 Day",
            address: bookingAddress || "Hyderabad, Telangana",
            baseAmount: baseCost,
            gstAmount: gstCost,
            amount: totalCost,
            patientName: isMtpBooking ? bookerName : (patientName || bookerName),
            patientAge: isMtpBooking ? "" : patientAge,
            patientNeeds: patientNeeds || (isMtpBooking ? "MTP On-Demand Task & Errand Companion" : ""),
            paymentMethod: isMtpBooking ? (paymentMethod === "razorpay" ? "razorpay" : "pay_on_service") : (paymentMethod || "pay_later"),
            paymentStatus: isMtpBooking ? (payStatus === "Advance Paid" ? "Advance Paid" : "Pay on Service") : payStatus,
            userId: user?.id || undefined,
            prescription: isMtpBooking ? "" : prescriptionFile,
            googleMapLocation: bookingGoogleMapLocation,
            advancePaid: advPaid,
            balanceAmount: balDue,
            ...(razorpayPaymentDetails || {})
          })
        });
        if (res.status === 401 && user) {
          handleLogout();
          return;
        }
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Booking submission error.");
        }

        // If guest user, persist login user details so they can access their booking dashboard
        if (!user && (bookerPhone || bookerEmail)) {
          const guestUser = {
            id: data.data?.userId || Date.now(),
            name: bookerName,
            phone: bookerPhone,
            email: bookerEmail
          };
          setUser(guestUser);
          localStorage.setItem("ammaseva_user_details", JSON.stringify(guestUser));
          if (!localStorage.getItem("ammaseva_user_token")) {
            localStorage.setItem("ammaseva_user_token", `mock-jwt-user-token-${guestUser.id}`);
          }
        }

        setSuccessBooking(data.data);
        // Reset form
        setBookingDate("");
        setBookingAddress("");
        setPatientName("");
        setPatientAge("");
        setPatientNeeds("");
        setPrescriptionFile("");
        setBookingGoogleMapLocation("");
        setAgreeTermsBooking(false);
        setDurationCount(1);
        setBookingStep(1);
        if (user) {
          fetchBookings();
        }
      } catch (err: any) {
        alert("Booking failed: " + err.message);
      } finally {
        setIsSubmitting(false);
        setIsPaymentProcessing(false);
      }
    };

    // If MTP task with pay on service selected, submit directly
    if (isMtpBooking && paymentMethod !== "razorpay") {
      await submitBooking("Pay on Service");
      return;
    }

    if (paymentMethod === "razorpay" && (isMtpBooking ? calculateTotal() : calculateAdvance()) > 0) {
      const chargeAmount = isMtpBooking ? calculateTotal() : calculateAdvance();
      try {
        setIsPaymentProcessing(true);
        const orderRes = await fetch("/api/payment/order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: chargeAmount })
        });
        const orderData = await orderRes.json();
        if (!orderRes.ok) {
          throw new Error(orderData.error || "Failed to initiate online payment order.");
        }
        if (!orderData.keyId && !orderData.isSimulation) {
          throw new Error("Razorpay Key ID not configured on the server.");
        }

        // If server provided simulation fallback order or SDK is not present, complete directly
        if (orderData.isSimulation || !(window as any).Razorpay) {
          await submitBooking("Advance Paid", {
            razorpay_order_id: orderData.orderId,
            razorpay_payment_id: `pay_sim_${Date.now()}`,
            razorpay_signature: `sig_sim_${Date.now()}`
          });
          return;
        }

        const options = {
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency || "INR",
          name: "Amma Seva",
          description: isMtpBooking ? `MTP Task Booking (Fee ₹100)` : `Care Booking - ${currentService?.title || "Service"}`,
          order_id: orderData.orderId,
          handler: async (response: any) => {
            await submitBooking("Advance Paid", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
          },
          prefill: {
            name: bookerName,
            email: bookerEmail,
            contact: bookerPhone
          },
          theme: {
            color: "#0e2254"
          },
          modal: {
            ondismiss: function() {
              setIsSubmitting(false);
              setIsPaymentProcessing(false);
            }
          }
        };

        try {
          const rzp = new (window as any).Razorpay(options);
          rzp.open();
        } catch (rzpErr) {
          console.warn("[Razorpay SDK warning] Falling back to direct confirmation:", rzpErr);
          await submitBooking("Advance Paid", {
            razorpay_order_id: orderData.orderId,
            razorpay_payment_id: `pay_sim_${Date.now()}`,
            razorpay_signature: `sig_sim_${Date.now()}`
          });
        }
      } catch (err: any) {
        alert("Payment initialization error: " + err.message);
        setIsSubmitting(false);
        setIsPaymentProcessing(false);
      }
    } else {
      await submitBooking(isMtpBooking ? "Pay on Service" : "Unpaid");
    }
  };

  const handleReschedule = async () => {
    if (!rescheduleBookingId) return;
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    if (!rescheduleDate || rescheduleDate < todayStr) {
      alert("Reschedule date cannot be in the past. Please select today or a future date.");
      return;
    }
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
      if (res.status === 401) {
        handleLogout();
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Could not reschedule shift.");
      }
      alert("Shift rescheduled successfully!");
      setRescheduleBookingId(null);
      fetchBookings();
    } catch (err: any) {
      alert("Reschedule failed: " + err.message);
    }
  };

  const handleSaveDetails = async () => {
    if (!editBookingId) return;

    const nameErr = validateName(editPatientName, "Patient name");
    if (nameErr) {
      alert(nameErr);
      return;
    }

    const addrErr = validateAddress(editAddress, "Care address");
    if (addrErr) {
      alert(addrErr);
      return;
    }

    setIsSavingDetails(true);
    try {
      const token = localStorage.getItem("ammaseva_user_token");
      const res = await fetch(`/api/booking/${editBookingId}/details`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          patientName: editPatientName,
          patientAge: editPatientAge,
          patientNeeds: editPatientNeeds,
          address: editAddress,
          googleMapLocation: editGoogleMapLocation
        })
      });

      if (res.status === 401) {
        handleLogout();
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update details.");
      }

      alert("Booking details updated successfully!");
      setIsEditModalOpen(false);
      fetchBookings();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsSavingDetails(false);
    }
  };

  const handlePayBalance = async (booking: Booking) => {
    const balanceVal = Number(booking.balanceAmount);
    if (isNaN(balanceVal) || balanceVal <= 0) {
      alert("No pending balance amount found for this booking.");
      return;
    }

    try {
      // 1. Create order for balance amount
      const orderRes = await fetch("/api/payment/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: balanceVal })
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        throw new Error(orderData.error || "Failed to initiate online payment order.");
      }

      const verifyBalancePayment = async (response: any) => {
        try {
          const token = localStorage.getItem("ammaseva_user_token");
          const res = await fetch(`/api/booking/${booking.id}/pay-balance`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            })
          });

          if (res.status === 401) {
            handleLogout();
            return;
          }

          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || "Verification of balance payment failed.");
          }

          alert("Balance payment completed and verified successfully!");
          fetchBookings();
        } catch (err: any) {
          alert("Payment verification failed: " + err.message);
        }
      };

      // If simulation mode or Razorpay SDK not available
      if (orderData.isSimulation || !(window as any).Razorpay) {
        await verifyBalancePayment({
          razorpay_order_id: orderData.orderId,
          razorpay_payment_id: `pay_sim_${Date.now()}`,
          razorpay_signature: `sig_sim_${Date.now()}`
        });
        return;
      }

      // 2. Open Razorpay checkout modal
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "Amma Seva",
        description: `Balance Payment for Booking #${booking.id}`,
        order_id: orderData.orderId,
        handler: verifyBalancePayment,
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
          contact: user?.phone || ""
        },
        theme: {
          color: "#0e2254"
        }
      };

      try {
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } catch (rzpErr) {
        await verifyBalancePayment({
          razorpay_order_id: orderData.orderId,
          razorpay_payment_id: `pay_sim_${Date.now()}`,
          razorpay_signature: `sig_sim_${Date.now()}`
        });
      }
    } catch (err: any) {
      alert("Payment notice: " + err.message);
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
      if (res.status === 401) {
        handleLogout();
        return;
      }
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

  if (isCaretaker) {
    return (
      <SiteLayout>
        <div className="min-h-screen bg-slate-50/50 py-10 px-4 sm:px-6 lg:px-8 animate-in fade-in duration-300">
          <div className="mx-auto max-w-[1440px] space-y-6">
            
            {/* Premium Two-Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
              
              {/* Left Column - Sticky Profile Overview & Switcher */}
              <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-6 self-start">
                <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm p-6 space-y-6 text-center">
                  <div className="flex flex-col items-center">
                    <div className="h-24 w-24 rounded-full bg-indigo-50 border-2 border-slate-100 flex items-center justify-center text-indigo-600 shadow-inner relative overflow-hidden mb-4 shrink-0">
                      {caretakerProfilePhoto ? (
                        <img src={caretakerProfilePhoto} alt={caretakerName} className="h-full w-full object-cover" />
                      ) : (
                        <User className="h-12 w-12 text-slate-400" />
                      )}
                    </div>
                    
                    <h2 className="text-xl font-bold text-[#1e2a5a] font-display">{caretakerName || caretaker?.name || (caretaker?.isMtp ? "MTP Companion" : "Caregiver Partner")}</h2>
                    <p className="text-xs text-[#c9a24c] font-bold uppercase tracking-wider mt-0.5">
                      {caretaker?.isMtp ? "Multi Tasking Professional (MTP)" : (caretakerSpecialty || caretaker?.specialty || "Caregiver")}
                    </p>
                    
                    {caretaker?.rating > 0 && (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100 flex items-center gap-1 mt-2">
                        ⭐ {caretaker.rating} ({caretaker.reviews?.length || 0} reviews)
                      </span>
                    )}

                    <div className="mt-4 w-full">
                      {caretaker?.status === "Verified" ? (
                        <div className="space-y-2">
                          <span className="inline-flex items-center justify-center gap-1.5 w-full py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-100 text-xs font-bold uppercase tracking-wider">
                            <CheckCircle2 className="h-3.5 w-3.5" /> {caretaker?.isMtp ? "Verified MTP Companion" : "Active Partner"}
                          </span>
                          <button
                            type="button"
                            onClick={() => setActiveCaregiverTab("reviews")}
                            className="flex items-center justify-center gap-1 bg-amber-50/50 hover:bg-amber-100/70 border border-amber-200/40 px-2.5 py-1 rounded-xl w-max mx-auto shadow-inner text-xs font-extrabold text-amber-700 cursor-pointer transition-all hover:scale-105"
                            title="View Customer Reviews"
                          >
                            ★ {caretakerReviews.length > 0 ? caretakerAvgRating.toFixed(1) : "0.0"} <span className="text-[10px] text-slate-400 font-bold ml-0.5">({caretakerReviews.length})</span>
                          </button>
                        </div>
                      ) : caretaker?.status === "Rejected" ? (
                        <span className="inline-flex items-center justify-center gap-1.5 w-full py-1.5 rounded-xl bg-rose-50 text-rose-800 border border-rose-100 text-xs font-bold uppercase tracking-wider">
                          <AlertTriangle className="h-3.5 w-3.5 animate-pulse" /> Application Rejected
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center gap-1.5 w-full py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-100 text-xs font-bold uppercase tracking-wider">
                          <Clock className="h-3.5 w-3.5" /> {caretaker?.isMtp ? "MTP Verification Pending" : "Pending Verification"}
                        </span>
                      )}
                    </div>
                  </div>

                  <hr className="border-slate-100" />

                  {/* Vertical Tab Navigation */}
                  <div className="flex flex-col gap-2.5">
                    <button
                      type="button"
                      onClick={() => setActiveCaregiverTab("shifts")}
                      className={`w-full py-3 px-4 rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center gap-3 cursor-pointer transition-all ${
                        activeCaregiverTab === "shifts"
                          ? "bg-[#1e2a5a] text-white shadow-md shadow-[#1e2a5a]/20"
                          : "text-slate-500 hover:text-[#1e2a5a] hover:bg-slate-50 border border-transparent hover:border-slate-200/50"
                      }`}
                    >
                      <Calendar className="h-4 w-4 shrink-0" />
                      <span className="text-left flex-1">{caretaker?.isMtp ? "Assigned Gigs & Shifts" : "Assigned Shifts"}</span>
                      {caretakerBookings.length > 0 && caretaker?.status === "Verified" && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          activeCaregiverTab === "shifts" ? "bg-white text-[#1e2a5a]" : "bg-[#1e2a5a] text-white"
                        }`}>
                          {caretakerBookings.filter(b => b.status !== "Completed" && b.status !== "Cancelled").length}
                        </span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveCaregiverTab("profile")}
                      className={`w-full py-3 px-4 rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center gap-3 cursor-pointer transition-all ${
                        activeCaregiverTab === "profile"
                          ? "bg-[#1e2a5a] text-white shadow-md shadow-[#1e2a5a]/20"
                          : "text-slate-500 hover:text-[#1e2a5a] hover:bg-slate-50 border border-transparent hover:border-slate-200/50"
                      }`}
                    >
                      <User className="h-4 w-4 shrink-0" />
                      <span className="text-left flex-1">{caretaker?.isMtp ? "Application & KYC Details" : "Profile Details"}</span>
                    </button>

                    {caretaker?.status === "Verified" && (
                      <button
                        type="button"
                        onClick={() => setActiveCaregiverTab("reviews")}
                        className={`w-full py-3 px-4 rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center gap-3 cursor-pointer transition-all ${
                          activeCaregiverTab === "reviews"
                            ? "bg-[#1e2a5a] text-white shadow-md shadow-[#1e2a5a]/20"
                            : "text-slate-500 hover:text-[#1e2a5a] hover:bg-slate-50 border border-transparent hover:border-slate-200/50"
                        }`}
                      >
                        <Star className="h-4 w-4 shrink-0" />
                        <span className="text-left flex-1">Customer Reviews</span>
                        {caretakerReviews.length > 0 && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            activeCaregiverTab === "reviews" ? "bg-[#c9a24c] text-[#1e2a5a]" : "bg-[#c9a24c]/20 text-[#c9a24c]"
                          }`}>
                            {caretakerReviews.length}
                          </span>
                        )}
                      </button>
                    )}

                    {caretaker?.status === "Verified" && (
                      <button
                        type="button"
                        onClick={() => setActiveCaregiverTab("earnings")}
                        className={`w-full py-3 px-4 rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center gap-3 cursor-pointer transition-all ${
                          activeCaregiverTab === "earnings"
                            ? "bg-[#1e2a5a] text-white shadow-md shadow-[#1e2a5a]/20"
                            : "text-slate-500 hover:text-[#1e2a5a] hover:bg-slate-50 border border-transparent hover:border-slate-200/50"
                        }`}
                      >
                        <DollarSign className="h-4 w-4 shrink-0 text-[#c9a24c]" />
                        <span className="text-left flex-1 font-sans">Earnings &amp; Duty Logs</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setActiveCaregiverTab("referrals")}
                      className={`w-full py-3 px-4 rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center gap-3 cursor-pointer transition-all ${
                        activeCaregiverTab === "referrals"
                          ? "bg-[#1e2a5a] text-white shadow-md shadow-[#1e2a5a]/20"
                          : "text-slate-500 hover:text-[#1e2a5a] hover:bg-slate-50 border border-transparent hover:border-slate-200/50"
                      }`}
                    >
                      <Gift className="h-4 w-4 shrink-0 text-[#c9a24c]" />
                      <span className="text-left flex-1 font-sans">Refer &amp; Share Link</span>
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-[#c9a24c]/20 text-[#c9a24c]">
                        NEW
                      </span>
                    </button>

                    {caretaker?.status !== "Verified" && (
                        <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse shrink-0"></span>
                    )}
                  </div>

                  <hr className="border-slate-100" />

                  <button
                    onClick={handleLogout}
                    className="w-full py-3 border border-rose-100 hover:bg-rose-50 text-rose-600 hover:text-rose-700 text-xs font-bold uppercase tracking-wider rounded-2xl cursor-pointer flex items-center justify-center gap-2 transition-all"
                  >
                    Log Out
                  </button>
                </div>
              </div>

              {/* Right Column - Main Dynamic Workspace */}
              <div className="lg:col-span-3 space-y-6">
                
                {/* Personal Referral & Share Link Quick Card */}
                <div className="bg-gradient-to-r from-[#1e2a5a] via-[#162044] to-[#0f1738] rounded-3xl p-6 text-white shadow-lg shadow-[#1e2a5a]/20 border border-slate-700/50 space-y-4 text-left">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-black tracking-widest text-[#f0d48b] bg-[#c9a24c]/20 px-2.5 py-0.5 rounded-full border border-[#c9a24c]/30 flex items-center gap-1">
                          <Gift className="h-3 w-3 text-[#f0d48b]" /> {caretaker?.isMtp ? "MTP Network Referral" : "Care Partner Referral"}
                        </span>
                        <span className="text-xs text-slate-300 font-medium">Earn Referral Rewards</span>
                      </div>
                      <h3 className="text-lg sm:text-xl font-extrabold font-display text-white">
                        {caretaker?.isMtp ? "Invite Companions & MTPs to Amma Seva" : "Invite Caregivers & Nurses to Amma Seva"}
                      </h3>
                      <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
                        When partners apply using your link, their application automatically locks your referral code.
                      </p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15 flex items-center gap-3 shrink-0">
                      <div>
                        <div className="text-[9px] uppercase font-extrabold tracking-wider text-slate-300">Your Referral Code</div>
                        <div className="text-lg font-black text-[#f5d77f] font-mono tracking-widest">
                          {getCaregiverReferralCode(caretaker)}
                        </div>
                      </div>
                      <button
                        type="button"
                        title="Copy Referral Code"
                        onClick={() => {
                          const code = getCaregiverReferralCode(caretaker);
                          navigator.clipboard.writeText(code);
                          alert(`Copied Referral Code: ${code}`);
                        }}
                        className="h-9 w-9 rounded-xl bg-white/20 hover:bg-white/30 text-white flex items-center justify-center cursor-pointer transition-all border border-white/20"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="w-full sm:flex-1 bg-black/20 rounded-xl px-3.5 py-2 border border-white/10 flex items-center justify-between gap-2 overflow-hidden">
                      <span className="text-xs text-slate-300 font-mono truncate select-all">
                        {typeof window !== "undefined" ? `${window.location.origin}/login?ref=${getCaregiverReferralCode(caretaker)}&type=caretaker` : `/login?ref=${getCaregiverReferralCode(caretaker)}&type=caretaker`}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const url = `${window.location.origin}/login?ref=${getCaregiverReferralCode(caretaker)}&type=caretaker`;
                          navigator.clipboard.writeText(url);
                          alert(`Copied your personal referral link:\n${url}`);
                        }}
                        className="text-[11px] font-bold text-[#f5d77f] hover:underline shrink-0 cursor-pointer flex items-center gap-1"
                      >
                        <Copy className="h-3 w-3" /> Copy Link
                      </button>
                    </div>

                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(
                        `Namaste! Join Amma Seva as a care partner or MTP companion in Hyderabad. Great payouts, flexible shift options & doctor-backed support.\n\nRegister directly using my referral link:\n${typeof window !== "undefined" ? window.location.origin : "https://ammaseva.in"}/login?ref=${getCaregiverReferralCode(caretaker)}&type=caretaker`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer shrink-0"
                    >
                      <Send className="h-3.5 w-3.5" /> Share on WhatsApp
                    </a>
                  </div>
                </div>

                {/* Announcement Banners for Caretaker */}
                {announcements.map((ann) => (
                  <div key={ann.id} className="bg-gradient-to-r from-indigo-600 to-indigo-800 text-white px-6 py-4 rounded-3xl flex items-center justify-between shadow-sm border border-indigo-700/50">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">📢</span>
                      <div className="space-y-0.5">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-200">System Announcement</span>
                        <p className="text-sm font-semibold">{ann.message}</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-indigo-300 font-semibold shrink-0 ml-4">{new Date(ann.createdAt).toLocaleDateString()}</span>
                  </div>
                ))}

                {/* Application Status Banner */}
                {(caretaker?.status === "Verified" || caretaker?.status === "Approved" || caretaker?.status === "Active") ? (
                  <div className="rounded-3xl border border-emerald-200 bg-emerald-50/50 p-6 flex gap-4 items-start shadow-sm">
                    <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold text-emerald-900 font-display">
                        {caretaker?.isMtp ? "MTP Profile Approved & Active" : "Profile Approved & Active"}
                      </h3>
                      <p className="text-sm text-emerald-800 leading-relaxed">
                        {caretaker?.isMtp
                          ? "Your MTP companion profile has been verified and approved by the Amma Seva administrator. You can now view and accept patient hospital drops, senior walks, and home assistance gigs below."
                          : "Your caretaker profile is fully verified by the administrator. Your profile is visible in the care network, and you can now be assigned to customer booking shifts."}
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
                        Your application could not be verified due to incomplete KYC or mismatched records. Please update your profile details and re-upload clear copies of all required documents.
                      </p>
                    </div>
                  </div>
                ) : caretaker?.isMtp ? (
                  <div className="rounded-3xl border-2 border-amber-300 bg-gradient-to-br from-amber-50/80 via-white to-amber-50/40 p-6 sm:p-7 shadow-sm text-left space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-200/60 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 shadow-xs">
                          <Clock className="h-6 w-6 animate-pulse" />
                        </div>
                        <div>
                          <div className="text-[10px] font-extrabold uppercase tracking-widest text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full inline-block mb-0.5">
                            MTP Reference ID #{caretaker?.id || "MTP-PENDING"}
                          </div>
                          <h3 className="text-lg sm:text-xl font-extrabold text-primary font-display">
                            MTP Application Under Admin Verification
                          </h3>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1.5 font-bold text-xs text-amber-800 bg-amber-100/90 border border-amber-300 px-3.5 py-1.5 rounded-xl shadow-xs self-start sm:self-auto">
                        ⏳ 4–12 Hours Verification Window
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                      Thank you for registering as a <strong>Multi Tasking Professional (MTP)</strong> with Amma Seva. Your profile, Aadhaar, PAN, and police verification documents are currently undergoing administrative background checks.
                    </p>

                    {/* MTP Applicant Summary Card */}
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs text-slate-700">
                      <div>
                        <span className="text-slate-400 block text-[10px] font-bold uppercase">Applicant Name</span>
                        <span className="font-bold text-primary">{caretaker?.name || "Applicant"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] font-bold uppercase">Registered Phone</span>
                        <span className="font-bold text-primary font-mono">{caretaker?.phone || ""}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] font-bold uppercase">Email Address</span>
                        <span className="font-medium text-slate-800 truncate block">{caretaker?.email || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] font-bold uppercase">Operational Zone</span>
                        <span className="font-bold text-primary">{caretaker?.workingLocations || caretaker?.locality || "Hyderabad"}</span>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-slate-400 block text-[10px] font-bold uppercase">Selected Task Roles</span>
                        <span className="font-bold text-emerald-700">
                          {Array.isArray(caretaker?.roles) ? caretaker.roles.join(', ') : (caretaker?.roles || "On-Demand Tasks & Senior Escort")}
                        </span>
                      </div>
                    </div>

                    {/* Next Steps & Support Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                      <div className="text-xs text-slate-500 text-center sm:text-left">
                        Once approved by admin, your live task dispatch feed and weekly payout ledger will unlock here automatically.
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <a
                          href={`https://wa.me/919494516543?text=Hi%20Amma%20Seva%20Coordinator,%20I%20have%20registered%20as%20an%20MTP%20(${encodeURIComponent(caretaker?.name || "")}%20-%20${encodeURIComponent(caretaker?.phone || "")}).%20My%20Ref%20ID%20is%20%23${caretaker?.id || "PENDING"}.%20Please%20verify%20my%20application.`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#25D366] hover:bg-emerald-600 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                        >
                          <MessageCircle className="h-3.5 w-3.5" /> WhatsApp Desk
                        </a>
                        <a
                          href="tel:+919494516543"
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gold hover:bg-[#b58e38] text-[#091438] text-xs font-bold shadow-xs transition-all cursor-pointer"
                        >
                          <Phone className="h-3.5 w-3.5" /> Call Coordinator
                        </a>
                      </div>
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

            {/* Shifts Content View */}
            {activeCaregiverTab === "shifts" && (
              <>
                {(caretaker?.status === "Verified" || caretaker?.status === "Approved" || caretaker?.status === "Active") ? (
                  <div className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200/60 shadow-sm space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-primary font-display flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-indigo-600" /> My Assigned Patient Shifts
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">Below are the patient homecare shifts you have been assigned to by the administrator.</p>
                    </div>
 
                    {/* Premium Filter Controls */}
                    <div className="grid gap-4 md:grid-cols-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-200/50 text-left">
                      {/* Search Anything */}
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Search Anything</label>
                        <input
                          type="text"
                          value={caretakerSearch}
                          onChange={(e) => setCaretakerSearch(e.target.value)}
                          placeholder="Search location, name, number, issue..."
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white outline-none focus:border-[#1e2a5a] focus:ring-2 focus:ring-[#1e2a5a]/5 transition-all text-slate-800"
                        />
                      </div>
                      
                      {/* Start Date */}
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">From Date</label>
                        <input
                          type="date"
                          value={caretakerStartDate}
                          onChange={(e) => setCaretakerStartDate(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white outline-none focus:border-[#1e2a5a] focus:ring-2 focus:ring-[#1e2a5a]/5 transition-all text-slate-850"
                        />
                      </div>

                      {/* End Date */}
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">To Date</label>
                        <input
                          type="date"
                          value={caretakerEndDate}
                          onChange={(e) => setCaretakerEndDate(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white outline-none focus:border-[#1e2a5a] focus:ring-2 focus:ring-[#1e2a5a]/5 transition-all text-slate-850"
                        />
                      </div>
                    </div>
 
                    {(() => {
                      const sortedFiltered = sortShiftsOrBookings(
                        filterShiftsOrBookings(caretakerBookings, caretakerSearch, caretakerStartDate, caretakerEndDate)
                      );
                      
                      if (isLoading) {
                        return (
                          <div className="flex justify-center py-6">
                            <div className="w-6 h-6 border-2 border-[#1e2a5a] border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        );
                      }
                      
                      if (caretakerBookings.length === 0) {
                        return (
                          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center text-slate-500">
                            <Clock className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                            <p className="text-sm font-semibold">No assigned shifts yet</p>
                            <p className="text-xs text-slate-400 mt-0.5">You will be notified once a customer booking is allocated to your profile.</p>
                          </div>
                        );
                      }

                      if (sortedFiltered.length === 0) {
                        return (
                          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center text-slate-500">
                            <Clock className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                            <p className="text-sm font-semibold">No matching shifts</p>
                            <p className="text-xs text-slate-400 mt-0.5">Adjust your search query or date range filters to find other patient bookings.</p>
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-4">
                          {sortedFiltered.map((shift: any) => {
                            const isExpanded = expandedBookingIds[shift.id] !== undefined
                              ? expandedBookingIds[shift.id]
                              : (shift.status !== "Completed" && shift.status !== "Cancelled");

                            return (
                              <div key={shift.id} className="rounded-3xl border border-slate-200/60 bg-gradient-to-br from-white to-slate-50/20 p-6 space-y-4 hover:border-[#c9a24c]/40 hover:shadow-md hover:shadow-slate-100/30 transition-all duration-300 text-left">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <span className="text-[10px] uppercase font-bold tracking-widest text-[#c9a24c]">Shift #{shift.id}</span>
                                    <h4 className="text-base font-bold text-[#1e2a5a] font-display">{shift.service}</h4>
                                    {!isExpanded && (
                                      <p className="text-xs text-slate-400 font-semibold mt-1 text-left">
                                        Date: {shift.date} at {shift.time} • Patient: {shift.name || shift.patientName} • Contact: {shift.phone}
                                      </p>
                                    )}
                                  </div>
                                  
                                  <div className="flex items-center gap-3">
                                    <span className={`text-[9px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-xl border ${
                                      shift.status === "Confirmed" ? "bg-emerald-50 text-emerald-800 border-emerald-100" :
                                      shift.status === "Active" ? "bg-indigo-50 text-indigo-850 border-indigo-100 animate-pulse" :
                                      shift.status === "Completed" ? "bg-slate-50 text-slate-650 border-slate-200" :
                                      "bg-rose-50 text-rose-800 border-rose-100"
                                    }`}>
                                      {shift.status}
                                    </span>

                                    {(shift.status === "Completed" || shift.status === "Cancelled") && (
                                      <button
                                        type="button"
                                        onClick={() => setExpandedBookingIds(prev => ({ ...prev, [shift.id]: !isExpanded }))}
                                        className="px-3 py-1 border border-[#c9a24c]/40 hover:bg-[#c9a24c]/10 text-[#c9a24c] rounded-xl text-xs font-bold transition-all cursor-pointer"
                                      >
                                        {isExpanded ? "Hide Details" : "View Details"}
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {isExpanded && (
                                  <>
                            {/* Patient & Care Details Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs pt-3 border-t border-slate-100/80 text-left">
                              <div>
                                <span className="text-slate-400 block mb-0.5">Patient Name</span>
                                <span className="font-semibold text-slate-800 flex items-center gap-1">
                                  <User className="h-3.5 w-3.5 text-slate-400" /> {shift.patientName || shift.name || "N/A"}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-400 block mb-0.5">Patient Age</span>
                                <span className="font-semibold text-slate-800">{shift.patientAge || "N/A"} yrs</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block mb-0.5">Shift Date & Time</span>
                                <span className="font-semibold text-slate-800 flex items-center gap-1">
                                  <Calendar className="h-3.5 w-3.5 text-slate-400" /> {shift.date} at {shift.time}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-400 block mb-0.5">Duration Option</span>
                                <span className="font-semibold text-slate-800">{shift.duration}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block mb-0.5">Customer Contact</span>
                                <a href={`tel:${shift.phone}`} className="font-semibold text-[#1e2a5a] hover:underline flex items-center gap-1">
                                  <Phone className="h-3.5 w-3.5" /> {shift.phone}
                                </a>
                              </div>
                              <div>
                                <span className="text-slate-400 block mb-0.5">Shift Remuneration</span>
                                <span className="font-bold text-slate-800">₹{shift.amount}</span>
                              </div>
                            </div>

                            {shift.address && (
                              <div className="text-xs pt-2 border-t border-slate-100/60 text-left">
                                <span className="text-slate-400 block mb-0.5">Patient Care Address</span>
                                <span className="text-slate-700 flex items-start gap-1">
                                  <MapPin className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" /> {shift.address}
                                </span>
                              </div>
                            )}

                            {shift.patientNeeds && (
                              <div className="text-xs bg-slate-50 border border-slate-200/60 p-4 rounded-2xl text-left">
                                <span className="text-[#1e2a5a] font-bold block mb-0.5 uppercase tracking-wider text-[10px]">Special Instructions & Patient Needs</span>
                                <p className="text-slate-600 leading-relaxed italic">&ldquo;{shift.patientNeeds}&rdquo;</p>
                              </div>
                            )}

                            {/* Check-In / Check-Out Shift Tracking actions */}
                            {shift.status !== "Completed" && shift.status !== "Cancelled" && (
                              <div className="flex gap-3 pt-3 border-t border-slate-100/60 justify-end">
                                {shift.status === "Confirmed" ? (
                                  <button
                                    onClick={async () => {
                                      const token = localStorage.getItem("ammaseva_caretaker_token");
                                      if (!token) return;
                                      try {
                                        const res = await fetch(`/api/booking/${shift.id}/status`, {
                                          method: "PUT",
                                          headers: { 
                                            "Content-Type": "application/json",
                                            "Authorization": `Bearer ${token}` 
                                          },
                                          body: JSON.stringify({ status: "Active" })
                                        });
                                        if (res.ok) {
                                          fetchCaretakerBookings();
                                        }
                                      } catch (err) {
                                        console.error(err);
                                      }
                                    }}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm flex items-center gap-1.5"
                                  >
                                    <Check className="h-4 w-4" /> Start Shift (Check-In)
                                  </button>
                                ) : shift.status === "Active" ? (
                                  <div className="flex gap-2.5">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (activeLogShiftId === shift.id) {
                                          setActiveLogShiftId(null);
                                        } else {
                                          setActiveLogShiftId(shift.id);
                                          if (shift.vitals) {
                                            try {
                                              const parsedVitals = typeof shift.vitals === 'string'
                                                ? JSON.parse(shift.vitals)
                                                : shift.vitals;
                                              setVitalBP(parsedVitals.bloodPressure || "120/80");
                                              setVitalPulse(parsedVitals.pulseRate?.replace(" bpm", "") || "72");
                                              setVitalTemp(parsedVitals.bodyTemp?.replace(" °F", "") || "98.4");
                                              setVitalSugar(parsedVitals.bloodGlucose?.replace(" mg/dL", "") || "115");
                                            } catch (e) {
                                              // Ignore
                                            }
                                          }
                                        }
                                      }}
                                      className="px-4 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm flex items-center gap-1.5"
                                    >
                                      📝 {activeLogShiftId === shift.id ? "Hide Form" : "Record Vitals & Activity"}
                                    </button>
                                    <button
                                      onClick={async () => {
                                        const token = localStorage.getItem("ammaseva_caretaker_token");
                                        if (!token) return;
                                        try {
                                          const res = await fetch(`/api/booking/${shift.id}/status`, {
                                            method: "PUT",
                                            headers: { 
                                              "Content-Type": "application/json",
                                              "Authorization": `Bearer ${token}` 
                                            },
                                            body: JSON.stringify({ status: "Completed" })
                                          });
                                          if (res.ok) {
                                            fetchCaretakerBookings();
                                          }
                                        } catch (err) {
                                          console.error(err);
                                        }
                                      }}
                                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm flex items-center gap-1.5"
                                    >
                                      <CheckCircle2 className="h-4 w-4" /> Complete Shift (Check-Out)
                                    </button>
                                  </div>
                                ) : null}
                              </div>
                            )}

                            {/* Caregiver Vitals and Progress Logging Form */}
                            {activeLogShiftId === shift.id && (
                              <div className="mt-4 p-5 bg-white border border-indigo-150 rounded-2xl space-y-4 animate-fade-in text-left">
                                <h5 className="text-xs font-bold text-indigo-700 uppercase tracking-wider border-b border-indigo-50 pb-1.5 flex items-center gap-1">
                                  📝 Record Patient Vitals & Progress Log
                                </h5>
                                
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                  <div>
                                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Blood Pressure</label>
                                    <input
                                      type="text"
                                      value={vitalBP}
                                      onChange={(e) => setVitalBP(e.target.value)}
                                      placeholder="e.g. 120/80"
                                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50/50 outline-none focus:bg-white focus:border-gold"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Pulse Rate (bpm)</label>
                                    <input
                                      type="number"
                                      value={vitalPulse}
                                      onChange={(e) => setVitalPulse(e.target.value)}
                                      placeholder="e.g. 72"
                                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50/50 outline-none focus:bg-white focus:border-gold"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Body Temp (°F)</label>
                                    <input
                                      type="text"
                                      value={vitalTemp}
                                      onChange={(e) => setVitalTemp(e.target.value)}
                                      placeholder="e.g. 98.4"
                                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50/50 outline-none focus:bg-white focus:border-gold"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Blood Glucose (mg/dL)</label>
                                    <input
                                      type="number"
                                      value={vitalSugar}
                                      onChange={(e) => setVitalSugar(e.target.value)}
                                      placeholder="e.g. 110"
                                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50/50 outline-none focus:bg-white focus:border-gold"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">New Shift Activity Log Entry</label>
                                  <textarea
                                    value={logMessage}
                                    onChange={(e) => setLogMessage(e.target.value)}
                                    placeholder="Describe current activity (e.g. Administered prescribed insulin dose, assisted with daily walk)"
                                    rows={2}
                                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50/50 outline-none focus:bg-white focus:border-gold"
                                  />
                                </div>

                                <div className="flex justify-end gap-3">
                                  <button
                                    type="button"
                                    onClick={() => setActiveLogShiftId(null)}
                                    className="px-3.5 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    disabled={isSavingLog}
                                    onClick={() => handleSaveVitalsAndLogs(shift.id, shift)}
                                    className="px-4 py-1.5 text-xs font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer flex items-center gap-1 shadow-sm disabled:opacity-50"
                                  >
                                    {isSavingLog && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0"></span>}
                                    {isSavingLog ? "Saving..." : "Save Vitals & Log Entry"}
                                  </button>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200/60 shadow-sm text-center py-12 space-y-4">
                    <div className="h-14 w-14 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 mx-auto">
                      <Clock className="h-7 w-7" />
                    </div>
                    <div className="max-w-md mx-auto space-y-2">
                      <h3 className="text-lg font-bold text-[#1e2a5a] font-display">Shifts Not Available</h3>
                      <p className="text-xs text-slate-400 font-medium leading-relaxed">
                        Your profile must be fully verified and approved by the administrator before you can view or accept patient homecare shifts.
                      </p>
                      <button
                        type="button"
                        onClick={() => setActiveCaregiverTab("profile")}
                        className="mt-2 text-xs font-bold text-[#c9a24c] hover:underline cursor-pointer"
                      >
                        Complete Profile Registration &rarr;
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Earnings & Duty Logs tab */}
            {activeCaregiverTab === "earnings" && (() => {
              const completedShifts = caretakerBookings.filter(b => b.status === "Completed");
              
              const getShiftPayout = (b: any) => {
                return b.caretakerPayout !== undefined && b.caretakerPayout !== null && Number(b.caretakerPayout) > 0
                  ? Number(b.caretakerPayout)
                  : Math.round(Number(b.amount || 0) * 0.85);
              };

              const estimatedEarnings = completedShifts.reduce((sum, b) => sum + getShiftPayout(b), 0);
              const estimatedHours = completedShifts.length * 8; // Simulating 8 hours per completed shift duration

              return (
                <div className="space-y-6 text-left animate-in fade-in duration-300">
                  {/* Earnings Metric Grid */}
                  <div className="grid gap-5 grid-cols-1 sm:grid-cols-3">
                    <div className="rounded-3xl border border-[#c9a24c]/30 bg-gradient-to-tr from-[#1e2a5a] to-[#151c3e] p-6 text-white shadow-md relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-[#c9a24c]/10 rounded-full blur-xl pointer-events-none"></div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#c9a24c]">Earnings Payout</span>
                      <div className="text-3xl font-bold font-display mt-2">₹{estimatedEarnings.toLocaleString()}</div>
                      <p className="text-[10px] text-slate-350 mt-1 leading-relaxed">Total payout amount approved and scheduled by administrator.</p>
                    </div>

                    <div className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Shifts Completed</span>
                      <div className="text-3xl font-bold text-[#1e2a5a] font-display mt-2">{completedShifts.length}</div>
                      <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">Active allocations assigned & delivered successfully.</p>
                    </div>

                    <div className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Estimated On-Duty Hours</span>
                      <div className="text-3xl font-bold text-[#1e2a5a] font-display mt-2">{estimatedHours} Hrs</div>
                      <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">Calculated based on standard completed duty logs.</p>
                    </div>
                  </div>

                  {/* Earnings Graph simulator using clean custom CSS */}
                  <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/60 shadow-sm space-y-6">
                    <div>
                      <h3 className="text-base font-bold text-[#1e2a5a] font-display">Monthly Shift Activity Analytics</h3>
                      <p className="text-xs text-slate-450 mt-0.5">Visual representation of shifts completed over recent booking intervals.</p>
                    </div>

                    {completedShifts.length > 0 ? (
                      <div className="space-y-4">
                        <div className="flex items-end justify-between gap-3 h-40 pt-4 px-2 border-b border-slate-100">
                          {completedShifts.slice(-6).map((shift) => {
                            const payout = getShiftPayout(shift);
                            const maxPayout = Math.max(...completedShifts.map(s => getShiftPayout(s))) || 1;
                            const barHeight = Math.min(100, Math.max(20, Math.round((payout / maxPayout) * 100)));
                            return (
                              <div key={shift.id} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                                <div className="text-[9px] font-extrabold text-[#c9a24c] opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                  ₹{payout}
                                </div>
                                <div 
                                  style={{ height: `${barHeight}%` }} 
                                  className="w-full sm:w-12 rounded-t-lg bg-gradient-to-t from-[#1e2a5a]/70 to-[#1e2a5a] group-hover:from-[#c9a24c] group-hover:to-[#c9a24c] transition-all duration-300 shadow-sm"
                                ></div>
                                <span className="text-[9px] font-bold text-slate-400 uppercase truncate max-w-full">
                                  Shift #{shift.id}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-400 font-bold px-2">
                          <span>Oldest Completed</span>
                          <span>Most Recent Shift</span>
                        </div>
                      </div>
                    ) : (
                      <div className="py-8 text-center text-slate-450">
                        <DollarSign className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs font-bold">No completed shift transactions recorded to compile analytics.</p>
                      </div>
                    )}
                  </div>

                  {/* Premium Shift Logs list */}
                  <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/60 shadow-sm space-y-4">
                    <h3 className="text-base font-bold text-[#1e2a5a] font-display border-b border-slate-100 pb-3">Historical Payout Records</h3>
                    {completedShifts.length > 0 ? (
                      <div className="divide-y divide-slate-100">
                        {completedShifts.map((shift) => (
                          <div key={shift.id} className="py-3.5 flex justify-between items-center text-xs">
                            <div>
                              <div className="font-bold text-slate-800">{shift.service}</div>
                              <div className="text-slate-400 text-[10px] font-semibold mt-0.5">{shift.date} • Patient: {shift.patientName || shift.name}</div>
                            </div>
                            <div className="text-right space-y-1">
                              <div className="font-extrabold text-emerald-600">+₹{getShiftPayout(shift)}</div>
                              {shift.caretakerPayoutStatus === "Paid" ? (
                                <div className="space-y-0.5">
                                  <span className="inline-flex items-center gap-1 text-[9px] text-emerald-750 bg-emerald-50 border border-emerald-200/60 font-bold px-1.5 py-0.5 rounded-md">
                                    ✓ Settled
                                  </span>
                                  {shift.caretakerPayoutMethod && (
                                    <div className="text-[8px] text-slate-400 font-medium font-sans">
                                      {shift.caretakerPayoutMethod} {shift.caretakerPayoutRef ? `(${shift.caretakerPayoutRef})` : ''}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[9px] text-amber-750 bg-amber-50 border border-amber-200/60 font-bold px-1.5 py-0.5 rounded-md">
                                  ● Pending Settle
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-450 italic">No historical shift logs found for your profile.</p>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Customer Reviews tab */}
            {activeCaregiverTab === "reviews" && (
              <div className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200/60 shadow-sm space-y-6 text-left animate-in fade-in duration-300">
                <div>
                  <h2 className="text-xl font-bold text-primary font-display flex items-center gap-2">
                    <Star className="h-5 w-5 text-[#c9a24c]" /> Customer Ratings &amp; Reviews
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">Real-time feedback and ratings submitted by patients and families.</p>
                </div>

                <div className="grid gap-6 sm:grid-cols-3 bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
                  <div className="text-center space-y-1">
                    <span className="text-4xl font-extrabold text-[#1e2a5a] font-display">{caretakerAvgRating.toFixed(1)}</span>
                    <div className="flex justify-center text-amber-500 text-sm mt-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i}>{i < Math.round(caretakerAvgRating) ? "★" : "☆"}</span>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mt-1">Average rating</p>
                  </div>
                  
                  <div className="sm:col-span-2 space-y-2 border-t sm:border-t-0 sm:border-l border-slate-200/60 pt-4 sm:pt-0 sm:pl-6 text-xs text-slate-500 flex flex-col justify-center">
                    <div className="flex items-center gap-2">
                      <span className="w-12 text-right">Excellent</span>
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500" style={{ width: `${(caretakerReviews.filter(r => r.rating >= 4.5).length / (caretakerReviews.length || 1)) * 100}%` }} />
                      </div>
                      <span className="w-8 text-right font-semibold">{caretakerReviews.filter(r => r.rating >= 4.5).length}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-12 text-right">Good</span>
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500" style={{ width: `${(caretakerReviews.filter(r => r.rating >= 3.5 && r.rating < 4.5).length / (caretakerReviews.length || 1)) * 100}%` }} />
                      </div>
                      <span className="w-8 text-right font-semibold">{caretakerReviews.filter(r => r.rating >= 3.5 && r.rating < 4.5).length}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-12 text-right">Average</span>
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500" style={{ width: `${(caretakerReviews.filter(r => r.rating < 3.5).length / (caretakerReviews.length || 1)) * 100}%` }} />
                      </div>
                      <span className="w-8 text-right font-semibold">{caretakerReviews.filter(r => r.rating < 3.5).length}</span>
                    </div>
                  </div>
                </div>

                {caretakerReviews.length === 0 ? (
                  <div className="text-center text-slate-400 py-10">
                    <MessageSquare className="h-10 w-10 text-slate-350 mx-auto mb-2" />
                    <p className="text-sm font-semibold">No reviews submitted yet</p>
                    <p className="text-xs">Feedback details will appear here once shift checkouts are rated.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {caretakerReviews.map((rev: any, idx: number) => (
                      <div key={idx} className="p-5 bg-slate-50/50 border border-slate-200/50 rounded-2xl space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-700">Patient Booking #{rev.bookingId || "N/A"}</span>
                          <span className="text-xs text-amber-500 font-bold">{"★".repeat(rev.rating)}</span>
                        </div>
                        <p className="text-xs text-slate-650 italic leading-relaxed">&ldquo;{rev.comment || "No written comments."}&rdquo;</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Profile Form Card */}
            {activeCaregiverTab === "profile" && (
              <div className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200/60 shadow-sm space-y-8">
              <div>
                <h2 className="text-xl font-bold text-[#1e2a5a] font-display">Complete & Update Profile Details</h2>
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

              <form onSubmit={handleCaretakerSubmit} className="space-y-8">
                
                {/* Profile Photo Upload and Preview */}
                <div className="flex flex-col sm:flex-row items-center gap-6 bg-gradient-to-br from-slate-50 to-white p-6 rounded-3xl border border-slate-200/60 shadow-sm">
                  <div className="h-24 w-24 rounded-full border-2 border-dashed border-slate-300 bg-white flex items-center justify-center text-slate-400 overflow-hidden relative group shrink-0 shadow-inner">
                    {caretakerProfilePhoto ? (
                      <img src={caretakerProfilePhoto} alt="Profile preview" className="h-full w-full object-cover animate-in fade-in duration-300" />
                    ) : (
                      <User className="h-10 w-10 text-slate-300" />
                    )}
                  </div>
                  <div className="space-y-2 text-center sm:text-left flex-1">
                    <span className="block text-xs font-bold text-[#1e2a5a] uppercase tracking-wider">Profile Picture</span>
                    <p className="text-[11px] text-slate-400">Upload a professional face photo for patient trust and security.</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleCaretakerFileChange(e, setCaretakerProfilePhoto)}
                      className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#1e2a5a]/5 file:text-[#1e2a5a] hover:file:bg-[#1e2a5a]/10 cursor-pointer transition-colors"
                    />
                  </div>
                </div>

                {/* Form Field Grid */}
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Full Name</label>
                    <input
                      type="text"
                      required
                      value={caretakerName}
                      onChange={(e) => setCaretakerName(sanitizeName(e.target.value))}
                      placeholder="e.g. Pandu R."
                      className="w-full px-4 py-3 text-sm rounded-2xl border border-slate-200 bg-white outline-none transition-all hover:border-slate-300 focus:border-[#1e2a5a] focus:ring-4 focus:ring-[#1e2a5a]/5"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Phone Number</label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      required
                      value={caretakerPhone}
                      onChange={(e) => setCaretakerPhone(sanitizeIndianPhone(e.target.value))}
                      placeholder="Enter 10-digit mobile number"
                      className="w-full px-4 py-3 text-sm rounded-2xl border border-slate-200 bg-white outline-none transition-all hover:border-slate-300 focus:border-[#1e2a5a] focus:ring-4 focus:ring-[#1e2a5a]/5 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Specialty / Role Category</label>
                    <select
                      value={caretakerSpecialty}
                      onChange={(e) => setCaretakerSpecialty(e.target.value)}
                      className="w-full px-4 py-3 text-sm rounded-2xl border border-slate-200 bg-white outline-none transition-all hover:border-slate-300 focus:border-[#1e2a5a] focus:ring-4 focus:ring-[#1e2a5a]/5"
                    >
                      {servicesList.map((s) => (
                        <option key={s.title} value={s.title}>{s.title}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Years of Experience</label>
                    <select
                      value={caretakerExperience}
                      onChange={(e) => setCaretakerExperience(e.target.value)}
                      className="w-full px-4 py-3 text-sm rounded-2xl border border-slate-200 bg-white outline-none transition-all hover:border-slate-300 focus:border-[#1e2a5a] focus:ring-4 focus:ring-[#1e2a5a]/5"
                    >
                      <option value="0">0-1 years</option>
                      <option value="1">1-2 years</option>
                      <option value="3">3-5 years</option>
                      <option value="6">6-9 years</option>
                      <option value="10">10+ years</option>
                    </select>
                  </div>

                  {/* Address Section */}
                  <div className="md:col-span-2 border border-slate-200/60 rounded-3xl p-6 bg-gradient-to-br from-slate-50 to-white space-y-6 shadow-sm">
                    <div className="text-xs font-bold text-[#1e2a5a] uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-[#c9a24c]" /> Address & GPS Location
                    </div>
                    <div className="grid gap-6 md:grid-cols-2">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">State</label>
                        <select
                          required
                          value={caretakerState}
                          onChange={(e) => setCaretakerState(e.target.value)}
                          className="w-full px-4 py-3 text-sm rounded-2xl border border-slate-200 bg-white outline-none transition-all hover:border-slate-300 focus:border-[#1e2a5a] focus:ring-4 focus:ring-[#1e2a5a]/5"
                        >
                          <option value="">Select State</option>
                          {INDIAN_STATES.map((st) => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">City</label>
                        <input
                          type="text"
                          required
                          value={caretakerCity}
                          onChange={(e) => setCaretakerCity(e.target.value)}
                          placeholder="e.g. Hyderabad"
                          className="w-full px-4 py-3 text-sm rounded-2xl border border-slate-200 bg-white outline-none transition-all hover:border-slate-300 focus:border-[#1e2a5a] focus:ring-4 focus:ring-[#1e2a5a]/5"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Google Map Location (GPS Link)</label>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <input
                          type="text"
                          readOnly
                          required
                          value={caretakerGoogleMapLocation}
                          placeholder="Click button to fetch GPS coordinates..."
                          className="flex-1 w-full px-4 py-3 text-xs rounded-2xl border border-slate-200 bg-slate-100/50 outline-none truncate font-mono text-slate-600"
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
                                setCaretakerGoogleMapLocation(`https://www.google.com/maps?q=${lat},${lng}`);
                                setIsFetchingLocation(false);
                              },
                              (err) => {
                                alert("Failed to fetch location. Please ensure location permissions are enabled.");
                                setIsFetchingLocation(false);
                              }
                            );
                          }}
                          disabled={isFetchingLocation}
                          className="px-5 py-3 bg-[#1e2a5a] hover:bg-[#1e2a5a]/90 text-white text-xs font-bold uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 shrink-0 disabled:opacity-50 cursor-pointer shadow-sm shadow-[#1e2a5a]/10 transition-all hover:translate-y-[-1px] w-full sm:w-auto text-center"
                        >
                          {isFetchingLocation ? "Fetching..." : "Fetch GPS Location"}
                        </button>
                      </div>
                      {caretakerGoogleMapLocation && (
                        <div className="flex items-center justify-between text-[11px] mt-2 px-1">
                          <span className="text-emerald-600 font-bold flex items-center gap-1">
                            ✓ Geolocation coordinates fetched
                          </span>
                          <a
                            href={caretakerGoogleMapLocation}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#c9a24c] hover:text-[#c9a24c]/85 hover:underline font-bold"
                          >
                            Open on Google Maps &rarr;
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Working Locations (Areas / Localities)</label>
                    <input
                      type="text"
                      value={caretakerWorkingLocations}
                      onChange={(e) => setCaretakerWorkingLocations(e.target.value)}
                      placeholder="e.g. Kukatpally, Gachibowli, Madhapur"
                      className="w-full px-4 py-3 text-sm rounded-2xl border border-slate-200 bg-white outline-none transition-all hover:border-slate-300 focus:border-[#1e2a5a] focus:ring-4 focus:ring-[#1e2a5a]/5"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Available Timings / Shifts</label>
                    <input
                      type="text"
                      value={caretakerAvailableTimings}
                      onChange={(e) => setCaretakerAvailableTimings(e.target.value)}
                      placeholder="e.g. Day Shift, Night Shift, 24/7 Live-in"
                      className="w-full px-4 py-3 text-sm rounded-2xl border border-slate-200 bg-white outline-none transition-all hover:border-slate-300 focus:border-[#1e2a5a] focus:ring-4 focus:ring-[#1e2a5a]/5"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Detailed Experience & Skills Summary</label>
                  <textarea
                    value={caretakerExperienceDetails}
                    onChange={(e) => setCaretakerExperienceDetails(e.target.value)}
                    placeholder="Describe your qualifications, hospital training, types of patients managed, special clinical equipment handled (e.g. Ryles tube, catheter, IV line, oxygen)..."
                    rows={4}
                    className="w-full px-4 py-3 text-sm rounded-2xl border border-slate-200 bg-white outline-none transition-all hover:border-slate-300 focus:border-[#1e2a5a] focus:ring-4 focus:ring-[#1e2a5a]/5"
                  />
                </div>

                {/* Documents Upload Section */}
                <div className="border border-slate-200/60 rounded-3xl p-6 bg-gradient-to-br from-slate-50 to-white space-y-6 shadow-sm">
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                    <FileText className="h-5 w-5 text-[#c9a24c]" />
                    <span className="text-sm font-bold text-[#1e2a5a] uppercase tracking-wider">Verification Documents</span>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    
                    {/* Aadhaar */}
                    <div className="space-y-2.5 flex flex-col justify-between h-full bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">Aadhaar Card</label>
                        <p className="text-[10px] text-slate-400">Government identity card for address & verification.</p>
                      </div>
                      <div className="relative group border border-slate-200 hover:border-[#c9a24c]/40 rounded-xl bg-slate-50/50 hover:bg-[#c9a24c]/5 p-4 transition-all">
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={(e) => handleCaretakerFileChange(e, setCaretakerAadhaar)}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                        />
                        <div className="flex flex-col items-center justify-center text-center py-1">
                          <Upload className="h-5 w-5 text-slate-400 group-hover:text-[#c9a24c] mb-1 transition-colors" />
                          <span className="text-[10px] font-bold text-slate-600 block">
                            {caretakerAadhaar ? "Change Document" : "Choose File"}
                          </span>
                        </div>
                      </div>
                      {caretakerAadhaar ? (
                        <span className="inline-flex items-center justify-center gap-1 text-[10px] text-emerald-600 font-bold bg-emerald-50 py-1 rounded-xl">
                          ✓ Document Uploaded
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center gap-1 text-[10px] text-rose-500 font-bold bg-rose-50 py-1 rounded-xl">
                          ⚠ Missing Aadhaar Card
                        </span>
                      )}
                    </div>

                    {/* PAN Card */}
                    <div className="space-y-2.5 flex flex-col justify-between h-full bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">PAN Card</label>
                        <p className="text-[10px] text-slate-400">Tax registration card for payment processing.</p>
                      </div>
                      <div className="relative group border border-slate-200 hover:border-[#c9a24c]/40 rounded-xl bg-slate-50/50 hover:bg-[#c9a24c]/5 p-4 transition-all">
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={(e) => handleCaretakerFileChange(e, setCaretakerPan)}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                        />
                        <div className="flex flex-col items-center justify-center text-center py-1">
                          <Upload className="h-5 w-5 text-slate-400 group-hover:text-[#c9a24c] mb-1 transition-colors" />
                          <span className="text-[10px] font-bold text-slate-600 block">
                            {caretakerPan ? "Change Document" : "Choose File"}
                          </span>
                        </div>
                      </div>
                      {caretakerPan ? (
                        <span className="inline-flex items-center justify-center gap-1 text-[10px] text-emerald-600 font-bold bg-emerald-50 py-1 rounded-xl">
                          ✓ Document Uploaded
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center gap-1 text-[10px] text-rose-500 font-bold bg-rose-50 py-1 rounded-xl">
                          ⚠ Missing PAN Card
                        </span>
                      )}
                    </div>

                    {/* Certificates */}
                    <div className="space-y-2.5 flex flex-col justify-between h-full bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">Educational Cert(s)</label>
                        <p className="text-[10px] text-slate-400">Nursing, clinical training, or first-aid certs.</p>
                      </div>
                      <div className="relative group border border-slate-200 hover:border-[#c9a24c]/40 rounded-xl bg-slate-50/50 hover:bg-[#c9a24c]/5 p-4 transition-all">
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={(e) => handleCaretakerFileChange(e, setCaretakerCertificates)}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                        />
                        <div className="flex flex-col items-center justify-center text-center py-1">
                          <Upload className="h-5 w-5 text-slate-400 group-hover:text-[#c9a24c] mb-1 transition-colors" />
                          <span className="text-[10px] font-bold text-slate-600 block">
                            {caretakerCertificates ? "Change Document" : "Choose File"}
                          </span>
                        </div>
                      </div>
                      {caretakerCertificates ? (
                        <span className="inline-flex items-center justify-center gap-1 text-[10px] text-emerald-600 font-bold bg-emerald-50 py-1 rounded-xl">
                          ✓ Document Uploaded
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center gap-1 text-[10px] text-rose-500 font-bold bg-rose-50 py-1 rounded-xl">
                          ⚠ Missing Certification
                        </span>
                      )}
                    </div>

                    {/* Experience Certificate */}
                    <div className="space-y-2.5 flex flex-col justify-between h-full bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">Experience Letters</label>
                        <p className="text-[10px] text-slate-400">Past service references or hospital discharge letters.</p>
                      </div>
                      <div className="relative group border border-slate-200 hover:border-[#c9a24c]/40 rounded-xl bg-slate-50/50 hover:bg-[#c9a24c]/5 p-4 transition-all">
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={(e) => handleCaretakerFileChange(e, setCaretakerExperienceCertificate)}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                        />
                        <div className="flex flex-col items-center justify-center text-center py-1">
                          <Upload className="h-5 w-5 text-slate-400 group-hover:text-[#c9a24c] mb-1 transition-colors" />
                          <span className="text-[10px] font-bold text-slate-600 block">
                            {caretakerExperienceCertificate ? "Change Document" : "Choose File"}
                          </span>
                        </div>
                      </div>
                      {caretakerExperienceCertificate ? (
                        <span className="inline-flex items-center justify-center gap-1 text-[10px] text-emerald-600 font-bold bg-emerald-50 py-1 rounded-xl">
                          ✓ Document Uploaded
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center gap-1 text-[10px] text-slate-400 font-bold bg-slate-50 py-1 rounded-xl">
                          Optional Document
                        </span>
                      )}
                    </div>

                    {/* Police Verification */}
                    <div className="space-y-2.5 flex flex-col justify-between h-full bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">Police verification</label>
                        <p className="text-[10px] text-slate-400">Mandatory background verification certificate.</p>
                      </div>
                      <div className="relative group border border-slate-200 hover:border-[#c9a24c]/40 rounded-xl bg-slate-50/50 hover:bg-[#c9a24c]/5 p-4 transition-all">
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={(e) => handleCaretakerFileChange(e, setCaretakerPoliceVerification)}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                        />
                        <div className="flex flex-col items-center justify-center text-center py-1">
                          <Upload className="h-5 w-5 text-slate-400 group-hover:text-[#c9a24c] mb-1 transition-colors" />
                          <span className="text-[10px] font-bold text-slate-600 block">
                            {caretakerPoliceVerification ? "Change Document" : "Choose File"}
                          </span>
                        </div>
                      </div>
                      {caretakerPoliceVerification ? (
                        <span className="inline-flex items-center justify-center gap-1 text-[10px] text-emerald-600 font-bold bg-emerald-50 py-1 rounded-xl">
                          ✓ Document Uploaded
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center gap-1 text-[10px] text-slate-400 font-bold bg-slate-50 py-1 rounded-xl">
                          Optional Document
                        </span>
                      )}
                    </div>

                    {/* Additional Certificates */}
                    <div className="space-y-2.5 flex flex-col justify-between h-full bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">Additional Certificates</label>
                        <p className="text-[10px] text-slate-400">Any other courses, seminars or care credentials.</p>
                      </div>
                      <div className="relative group border border-slate-200 hover:border-[#c9a24c]/40 rounded-xl bg-slate-50/50 hover:bg-[#c9a24c]/5 p-4 transition-all">
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={(e) => handleCaretakerFileChange(e, setCaretakerAdditionalCertificates)}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                        />
                        <div className="flex flex-col items-center justify-center text-center py-1">
                          <Upload className="h-5 w-5 text-slate-400 group-hover:text-[#c9a24c] mb-1 transition-colors" />
                          <span className="text-[10px] font-bold text-slate-600 block">
                            {caretakerAdditionalCertificates ? "Change Document" : "Choose File"}
                          </span>
                        </div>
                      </div>
                      {caretakerAdditionalCertificates ? (
                        <span className="inline-flex items-center justify-center gap-1 text-[10px] text-emerald-600 font-bold bg-emerald-50 py-1 rounded-xl">
                          ✓ Document Uploaded
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center gap-1 text-[10px] text-slate-400 font-bold bg-slate-50 py-1 rounded-xl">
                          Optional Document
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
                    {isCaretakerSaving && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0"></span>}
                    {isCaretakerSaving ? "Saving profile details..." : "Save Profile Details"}
                  </button>
                </div>

              </form>
            </div>
          )}

          {/* Referrals & Partner Share Tab */}
          {activeCaregiverTab === "referrals" && (
            <div className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200/60 shadow-sm space-y-8 text-left animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] uppercase font-black tracking-widest text-[#9e761a] bg-[#c9a24c]/15 px-2.5 py-0.5 rounded-full border border-[#c9a24c]/30 flex items-center gap-1 font-mono">
                      <Gift className="h-3 w-3 text-[#c9a24c]" /> Staff Referral System
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">• Live Attribution</span>
                  </div>
                  <h2 className="text-2xl font-extrabold text-[#1e2a5a] font-display">
                    Refer Caregivers, Nurses &amp; Staff
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Share your personalized referral code or 1-click link to invite friends, coworkers, and healthcare professionals.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={fetchCaretakerReferrals}
                  disabled={isLoadingReferrals}
                  className="px-4 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors self-start sm:self-auto"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isLoadingReferrals ? "animate-spin" : ""}`} />
                  Sync Referral Data
                </button>
              </div>

              {/* 3 Real-time KPI Metric Badges */}
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
                <div className="bg-gradient-to-br from-indigo-50/70 to-indigo-50/20 border border-indigo-100 rounded-2xl p-5 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block">
                    Total Members Joined
                  </span>
                  <div className="text-3xl font-black text-[#1e2a5a] font-display">
                    {caretakerReferralsData?.totalJoined || 0}
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">Applied using your referral link</p>
                </div>

                <div className="bg-gradient-to-br from-emerald-50/70 to-emerald-50/20 border border-emerald-100 rounded-2xl p-5 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                    Verified Staff
                  </span>
                  <div className="text-3xl font-black text-emerald-700 font-display">
                    {caretakerReferralsData?.totalVerified || 0}
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">Approved by admin for shifts</p>
                </div>

                <div className="bg-gradient-to-br from-amber-50/70 to-amber-50/20 border border-amber-100 rounded-2xl p-5 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">
                    Pending Verification
                  </span>
                  <div className="text-3xl font-black text-amber-700 font-display">
                    {caretakerReferralsData?.totalPending || 0}
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">Under KYC document review</p>
                </div>
              </div>

              {/* Main Highlight Card */}
              <div className="bg-gradient-to-br from-[#1e2a5a] via-[#152047] to-[#0f1738] rounded-3xl p-6 sm:p-8 text-white space-y-6 shadow-xl shadow-[#1e2a5a]/20 border border-slate-700/50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-[#f5d77f] uppercase tracking-wider block">Your Unique Referral Code</span>
                    <div className="flex items-center gap-3">
                      <span className="text-3xl sm:text-4xl font-black font-mono tracking-widest text-white bg-white/10 px-4 py-2 rounded-2xl border border-white/20 shadow-inner">
                        {caretakerReferralsData?.referCode || getCaregiverReferralCode(caretaker)}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const code = caretakerReferralsData?.referCode || getCaregiverReferralCode(caretaker);
                          navigator.clipboard.writeText(code);
                          alert(`Copied Referral Code: ${code}`);
                        }}
                        className="px-4 py-2.5 rounded-xl bg-[#c9a24c] hover:bg-[#b08726] text-[#1e2a5a] font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer shrink-0"
                      >
                        <Copy className="h-4 w-4" /> Copy Code
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Generated automatically from your name + phone number.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-bold text-[#f5d77f] uppercase tracking-wider block">1-Click Shareable Apply Link</span>
                    <div className="bg-black/30 rounded-2xl p-3 border border-white/15 flex items-center justify-between gap-2 overflow-hidden">
                      <span className="text-xs font-mono text-slate-200 truncate select-all">
                        {typeof window !== "undefined" ? `${window.location.origin}/login?ref=${caretakerReferralsData?.referCode || getCaregiverReferralCode(caretaker)}&type=caretaker` : `/login?ref=${getCaregiverReferralCode(caretaker)}&type=caretaker`}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const url = `${window.location.origin}/login?ref=${caretakerReferralsData?.referCode || getCaregiverReferralCode(caretaker)}&type=caretaker`;
                          navigator.clipboard.writeText(url);
                          alert(`Copied your personal referral link:\n${url}`);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white font-bold text-xs flex items-center gap-1 shrink-0 cursor-pointer transition-all border border-white/20"
                      >
                        <Copy className="h-3 w-3" /> Copy
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      When someone clicks this link, your code is auto-locked into their registration!
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10 flex flex-wrap gap-3">
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(
                      `Namaste! Join Amma Seva as a caregiver or nurse in Hyderabad. Great daily/monthly payouts, flexible shifts & doctor-backed support.\n\nRegister directly using my referral link:\n${typeof window !== "undefined" ? window.location.origin : "https://ammaseva.in"}/login?ref=${caretakerReferralsData?.referCode || getCaregiverReferralCode(caretaker)}&type=caretaker`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all cursor-pointer"
                  >
                    <Send className="h-4 w-4" /> Share on WhatsApp
                  </a>

                  <a
                    href={typeof window !== "undefined" ? `/login?ref=${caretakerReferralsData?.referCode || getCaregiverReferralCode(caretaker)}&type=caretaker` : "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-3 rounded-2xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 border border-white/20 transition-all cursor-pointer"
                  >
                    <ExternalLink className="h-4 w-4" /> Preview Caretaker Registration Page
                  </a>
                </div>
              </div>

              {/* Members Joined via My Referral Code Table / Grid */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-extrabold text-[#1e2a5a] font-display flex items-center gap-2">
                    <Users className="h-5 w-5 text-[#c9a24c]" /> Members Joined via My Referral Link ({caretakerReferralsData?.members?.length || 0})
                  </h3>
                </div>

                {(!caretakerReferralsData?.members || caretakerReferralsData.members.length === 0) ? (
                  <div className="bg-slate-50/70 border border-dashed border-slate-200 rounded-2xl p-8 sm:p-12 text-center text-slate-500 space-y-3">
                    <Gift className="h-10 w-10 text-slate-300 mx-auto" />
                    <div>
                      <h4 className="font-bold text-base text-slate-800">No members have joined yet</h4>
                      <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                        Share your referral link on WhatsApp with other nurses, elder care attendants, and health assistants. Once they apply, they will appear here!
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm text-slate-700">
                        <thead>
                          <tr className="border-b border-slate-100 bg-slate-50/80 text-xs text-[#1e2a5a] uppercase font-bold tracking-wider">
                            <th className="py-3.5 px-5">Candidate Name</th>
                            <th className="py-3.5 px-5">Specialty</th>
                            <th className="py-3.5 px-5">Experience</th>
                            <th className="py-3.5 px-5">Joined Date</th>
                            <th className="py-3.5 px-5">Location</th>
                            <th className="py-3.5 px-5 text-right">Verification Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {caretakerReferralsData.members.map((member: any) => (
                            <tr key={member.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-3.5 px-5">
                                <div className="font-bold text-[#1e2a5a]">{member.name}</div>
                              </td>
                              <td className="py-3.5 px-5 text-xs text-slate-600 font-medium">
                                {member.specialty}
                              </td>
                              <td className="py-3.5 px-5 text-xs text-slate-500">
                                {member.experience} years
                              </td>
                              <td className="py-3.5 px-5 text-xs text-slate-500">
                                {new Date(member.joinedAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                              </td>
                              <td className="py-3.5 px-5 text-xs text-slate-600">
                                {member.city}, {member.state}
                              </td>
                              <td className="py-3.5 px-5 text-right">
                                <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                                  member.status === "Verified" ? "bg-emerald-50 text-emerald-800 border-emerald-200" :
                                  member.status === "Rejected" ? "bg-rose-50 text-rose-800 border-rose-200" :
                                  "bg-amber-50 text-amber-800 border-amber-200"
                                }`}>
                                  {member.status === "Verified" ? "✓ Verified" :
                                   member.status === "Rejected" ? "✗ Rejected" : "⏳ Review Pending"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* How it Works Step-by-Step */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h3 className="text-base font-extrabold text-[#1e2a5a] font-display">
                  How the Referral Program Works
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-2">
                    <span className="h-8 w-8 rounded-full bg-[#1e2a5a] text-white flex items-center justify-center font-bold text-xs">
                      1
                    </span>
                    <h4 className="text-sm font-bold text-slate-900">Share Your Link</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Send your link to nurses, geriatric caregivers, post-operative attendants, and physiotherapists.
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-2">
                    <span className="h-8 w-8 rounded-full bg-[#c9a24c] text-[#1e2a5a] flex items-center justify-center font-bold text-xs">
                      2
                    </span>
                    <h4 className="text-sm font-bold text-slate-900">Automatic Code Lock</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      The applicant submits with your referral code automatically locked so you receive 100% credit.
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-2">
                    <span className="h-8 w-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                      3
                    </span>
                    <h4 className="text-sm font-bold text-slate-900">Verification &amp; Payouts</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Admin verifies their KYC credentials and assigns them to active customer shifts across Hyderabad.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
</SiteLayout>
);
}

  return (
    <SiteLayout>
      <div className="min-h-screen bg-[#faf8f5] py-8 sm:py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden selection:bg-[#c9a24c]/20 selection:text-[#0b183b]">
        {/* Ambient background soft glow effects */}
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[#c9a24c]/10 rounded-full blur-3xl pointer-events-none -z-0" />
        <div className="absolute top-1/3 left-0 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none -z-0" />
        <div className="absolute bottom-10 right-10 w-[450px] h-[450px] bg-amber-500/5 rounded-full blur-3xl pointer-events-none -z-0" />

        <div className="mx-auto max-w-[1440px] relative z-10">
          
          {/* Header Section: Full Banner when in Bookings view, Sleek Compact Bar when in Booking Wizard */}
          {activeView === "bookings" ? (
            <>
              {/* Sleek Compact User Header Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/95 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-xs mb-4 sm:mb-5 text-left">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-xl bg-[#0b183b] text-[#c9a24c] flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                    <User className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Customer Portal</div>
                    <h1 className="text-base sm:text-lg font-black text-[#0b183b] font-display truncate">
                      {user ? user.name : "My Account"}
                    </h1>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {user ? (
                    <>
                      <button
                        onClick={() => setActiveView("new-booking")}
                        className="px-3.5 sm:px-4 py-2 bg-[#0b183b] hover:bg-[#14234f] text-[#c9a24c] hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
                      >
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Schedule Shift</span>
                      </button>
                      <button
                        onClick={handleLogout}
                        className="px-3 sm:px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                      >
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <Link
                      to="/login"
                      className="px-4 py-2 rounded-xl bg-[#0b183b] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <User className="h-3.5 w-3.5 text-[#c9a24c]" />
                      <span>Sign In</span>
                    </Link>
                  )}
                </div>
              </div>

              {/* Quick Metrics Statistics Grid (Rendered for logged in customers in My Bookings view) */}
              {user && (
                <div className="grid gap-2.5 sm:gap-3.5 grid-cols-2 lg:grid-cols-4 mb-5 sm:mb-6">
                  {/* 1. Total Bookings */}
                  <div className="rounded-2xl border border-slate-200/80 bg-white/95 backdrop-blur-md p-3 sm:p-4 text-left shadow-xs hover:border-[#c9a24c]/50 transition-all flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <span className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-[#b38b32] border border-amber-500/25">
                      <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-slate-400 truncate">Bookings</div>
                      <div className="text-base sm:text-lg lg:text-xl font-black text-[#0b183b] font-display truncate">{bookings.length} Shifts</div>
                    </div>
                  </div>

                  {/* 2. Assigned Caregivers */}
                  <div className="rounded-2xl border border-slate-200/80 bg-white/95 backdrop-blur-md p-3 sm:p-4 text-left shadow-xs hover:border-[#c9a24c]/50 transition-all flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <span className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/15 text-[#1e2a5a] border border-indigo-500/25">
                      <User className="h-4 w-4 sm:h-5 sm:w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-slate-400 truncate">Caregivers</div>
                      <div className="text-base sm:text-lg lg:text-xl font-black text-[#0b183b] font-display truncate">
                        {bookings.filter(b => b.assignedStaff && b.status !== "Cancelled").length} <span className="text-[10px] sm:text-xs font-bold text-emerald-600 font-sans">Active</span>
                      </div>
                    </div>
                  </div>

                  {/* 3. Total Spend (Paid) */}
                  <div className="rounded-2xl border border-slate-200/80 bg-white/95 backdrop-blur-md p-3 sm:p-4 text-left shadow-xs hover:border-[#c9a24c]/50 transition-all flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <span className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 border border-emerald-500/25">
                      <DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-slate-400 truncate">Total Paid</div>
                      <div className="text-base sm:text-lg lg:text-xl font-black text-slate-800 font-display truncate">
                        ₹{bookings.reduce((sum, b) => sum + Number(b.advancePaid || 0), 0).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* 4. Pending Balance */}
                  <div className="rounded-2xl border border-slate-200/80 bg-white/95 backdrop-blur-md p-3 sm:p-4 text-left shadow-xs hover:border-[#c9a24c]/50 transition-all flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <span className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/15 text-rose-600 border border-rose-500/25">
                      <CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-slate-400 truncate">Balance Due</div>
                      <div className="text-base sm:text-lg lg:text-xl font-black text-slate-800 font-display truncate">
                        ₹{bookings.filter(b => b.status !== "Cancelled" && b.paymentStatus !== "Paid").reduce((sum, b) => sum + Number(b.balanceAmount || 0), 0).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Compact Header when in Scheduling Mode */
            <div className="max-w-4xl mx-auto flex items-center justify-between gap-2 sm:gap-3 mb-5 text-left bg-white/95 backdrop-blur-md px-3 sm:px-6 py-2.5 sm:py-3.5 rounded-2xl border border-slate-200/90 shadow-xs">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                {user ? (
                  <button
                    onClick={() => setActiveView("bookings")}
                    className="inline-flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-xs shrink-0"
                    title="Back to My Shifts"
                  >
                    <span>←</span>
                    <span className="hidden sm:inline">My Shifts</span>
                    <span className="sm:hidden">Shifts</span>
                  </button>
                ) : (
                  <Link
                    to="/"
                    className="inline-flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all shadow-xs shrink-0"
                  >
                    <span>←</span>
                    <span>Home</span>
                  </Link>
                )}
                
                <div className="min-w-0 flex-1">
                  <div className="text-xs sm:text-sm md:text-base font-black text-[#0b183b] font-display flex items-center gap-1.5 truncate">
                    <span className="truncate">
                      {isMtpBooking ? "MTP Tasks" : "Shift Booking"}
                    </span>
                    <span className="hidden md:inline-block text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                      Escrow Protected
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                {user ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700 hidden md:inline">
                      👤 {user.name}
                    </span>
                    <button
                      onClick={handleLogout}
                      className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/80 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl border border-rose-200 cursor-pointer transition-all whitespace-nowrap shadow-2xs"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <Link
                    to="/login"
                    className="text-xs font-bold text-[#1e2a5a] hover:underline bg-slate-100 px-3 py-1.5 sm:py-2 rounded-xl border border-slate-200 whitespace-nowrap"
                  >
                    Login
                  </Link>
                )}
              </div>
            </div>
          )}

          {activeView === "bookings" ? (
            
            // MY BOOKINGS VIEW
            <div className="space-y-5 sm:space-y-6 pb-28 sm:pb-16">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-[#0b183b] font-display flex items-center gap-2.5 text-left">
                    <Calendar className="h-6 w-6 text-[#c9a24c]" /> My Healthcare Shifts
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 text-left">View active shifts, monitor live caregiver allocations, download invoices, or reschedule.</p>
                </div>

                <button
                  onClick={() => setActiveView("new-booking")}
                  className="px-5 py-2.5 bg-[#0b183b] hover:bg-[#162554] text-white rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-md transition-all self-start sm:self-auto"
                >
                  <Sparkles className="h-3.5 w-3.5 text-[#c9a24c]" /> Schedule New Shift
                </button>
              </div>

              {/* Luxury Filter Controls */}
              <div className="grid gap-4 md:grid-cols-3 bg-white/80 backdrop-blur-md p-5 rounded-3xl border border-slate-200/80 shadow-sm text-left">
                {/* Search Anything */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Search className="h-3 w-3 text-slate-400" /> Search Shifts
                  </label>
                  <input
                    type="text"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    placeholder="Search service, name, address, needs..."
                    className="w-full px-4 py-2.5 text-xs rounded-2xl border border-slate-200 bg-slate-50/50 outline-none focus:bg-white focus:border-[#c9a24c] focus:ring-2 focus:ring-[#c9a24c]/15 transition-all text-slate-800"
                  />
                </div>
                
                {/* Start Date */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-slate-400" /> From Date
                  </label>
                  <input
                    type="date"
                    value={customerStartDate}
                    onChange={(e) => setCustomerStartDate(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs rounded-2xl border border-slate-200 bg-slate-50/50 outline-none focus:bg-white focus:border-[#c9a24c] focus:ring-2 focus:ring-[#c9a24c]/15 transition-all text-slate-800"
                  />
                </div>

                {/* End Date */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-slate-400" /> To Date
                  </label>
                  <input
                    type="date"
                    value={customerEndDate}
                    onChange={(e) => setCustomerEndDate(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs rounded-2xl border border-slate-200 bg-slate-50/50 outline-none focus:bg-white focus:border-[#c9a24c] focus:ring-2 focus:ring-[#c9a24c]/15 transition-all text-slate-800"
                  />
                </div>
              </div>
 
              {(() => {
                const sortedFiltered = sortShiftsOrBookings(
                  filterShiftsOrBookings(bookings, customerSearch, customerStartDate, customerEndDate)
                );
 
                if (isLoading) {
                  return (
                    <div className="flex justify-center py-20">
                      <div className="w-10 h-10 border-3 border-[#c9a24c] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  );
                }
 
                if (dashboardError) {
                  return (
                    <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-6 text-destructive flex gap-3 items-center text-left">
                      <AlertTriangle className="h-6 w-6 shrink-0" />
                      <div>
                        <span className="font-bold">Sync Error: </span>{dashboardError}
                      </div>
                    </div>
                  );
                }
 
                if (bookings.length === 0) {
                  return (
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
                  );
                }
 
                if (sortedFiltered.length === 0) {
                  return (
                    <div className="rounded-3xl border border-slate-200/60 bg-white p-12 text-center shadow-sm">
                      <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                      <h3 className="text-lg font-bold text-[#1e2a5a] font-display">No matching bookings</h3>
                      <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">Adjust your search query or date range filters to find other requested shifts.</p>
                    </div>
                  );
                }
 
                return (
                  <div className="grid gap-6">
                    {sortedFiltered.map((booking) => {
                      const isExpanded = !!expandedBookingIds[booking.id];
                      const isActive = booking.status !== "Completed" && booking.status !== "Cancelled";
                      const advPaid = booking.advancePaid !== undefined && booking.advancePaid !== null 
                        ? Number(booking.advancePaid) 
                        : (booking.paymentStatus === "Paid" ? Number(booking.amount) : 0);
                      const balDue = booking.balanceAmount !== undefined && booking.balanceAmount !== null
                        ? Number(booking.balanceAmount)
                        : Math.max(0, Number(booking.amount) - advPaid);

                      return (
                        <div
                          key={booking.id}
                          id={`booking-card-${booking.id}`}
                          className={`rounded-3xl border border-slate-200/60 p-5 sm:p-7 shadow-sm transition-all duration-300 flex flex-col lg:flex-row justify-between gap-5 sm:gap-6 text-left ${
                            isActive
                              ? "bg-white border-l-4 border-l-[#c9a24c] hover:shadow-md hover:shadow-slate-100/40 hover:border-[#c9a24c]/50"
                              : booking.status === "Cancelled"
                                ? "bg-gradient-to-br from-white to-rose-50/5 hover:border-slate-300"
                                : "bg-gradient-to-br from-white to-slate-50/40 hover:border-slate-350"
                          }`}
                        >
                          <div className="space-y-4 flex-1">
                            {/* Summary Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100/80">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] uppercase font-extrabold tracking-widest text-[#c9a24c] bg-[#c9a24c]/10 px-2 py-0.5 rounded">
                                    Shift #{booking.id}
                                  </span>
                                  <span className={`text-[10px] uppercase font-extrabold tracking-wider px-2.5 py-0.5 rounded-full border ${
                                    booking.status === "Confirmed" ? "bg-emerald-50 text-emerald-800 border-emerald-200 shadow-2xs" :
                                    booking.status === "Cancelled" ? "bg-rose-50 text-rose-800 border-rose-200 shadow-2xs" :
                                    booking.status === "Completed" ? "bg-indigo-50 text-indigo-800 border-indigo-200 shadow-2xs" :
                                    "bg-amber-50 text-amber-800 border-amber-200 shadow-2xs animate-pulse"
                                  }`}>
                                    {booking.status}
                                  </span>
                                </div>
                                <h3 className="text-lg sm:text-xl font-bold text-[#1e2a5a] font-display">
                                  {booking.service}
                                </h3>
                                {!isExpanded && (
                                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap pt-1 text-xs">
                                    <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg text-[10.5px] font-semibold">
                                      📅 {booking.date} at {booking.time}
                                    </span>
                                    <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg text-[10.5px] font-semibold">
                                      ⏱ {booking.duration}
                                    </span>
                                    <span className="inline-flex items-center gap-1 bg-[#1e2a5a]/5 text-[#1e2a5a] px-2.5 py-1 rounded-lg text-[10.5px] font-extrabold font-mono">
                                      Total: ₹{Number(booking.amount).toLocaleString()}
                                    </span>
                                    <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-lg text-[10.5px] font-bold border border-emerald-200">
                                      Paid: ₹{advPaid.toLocaleString()}
                                    </span>
                                    {balDue > 0 ? (
                                      <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-900 px-2.5 py-1 rounded-lg text-[10.5px] font-bold border border-amber-300">
                                        Balance: ₹{balDue.toLocaleString()}
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-900 px-2.5 py-1 rounded-lg text-[10.5px] font-bold border border-emerald-300">
                                        Settled
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-2 self-start sm:self-center shrink-0 pt-1 sm:pt-0">
                                {!isExpanded && balDue > 0 && booking.status !== "Cancelled" && (
                                  <button
                                    type="button"
                                    onClick={() => handlePayBalance(booking)}
                                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95 flex items-center gap-1"
                                    title="Pay Remaining Balance Online"
                                  >
                                    <span>💳 Pay Bal (₹{balDue.toLocaleString()})</span>
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => setExpandedBookingIds(prev => ({ ...prev, [booking.id]: !isExpanded }))}
                                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shadow-xs active:scale-95 flex items-center gap-1.5 ${
                                    isExpanded
                                      ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300"
                                      : "bg-[#0b183b] hover:bg-[#162554] text-[#c9a24c] hover:text-white border border-[#0b183b]"
                                  }`}
                                >
                                  <span>{isExpanded ? "Hide Details" : "View Details"}</span>
                                  <span className="text-[10px]">{isExpanded ? "▲" : "▼"}</span>
                                </button>
                                {!isExpanded && (
                                  <button
                                    type="button"
                                    onClick={() => setActiveInvoice(booking)}
                                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer border border-slate-200 flex items-center gap-1"
                                    title="Download Invoice PDF"
                                  >
                                    <Download className="h-3.5 w-3.5 text-slate-500" />
                                    <span className="hidden sm:inline">Invoice</span>
                                  </button>
                                )}
                              </div>
                            </div>

                            {isExpanded && (
                              <>
 
                        {/* Booking Tracker Visual Pipeline (Stepper) */}
                        {booking.status !== "Cancelled" && (
                          <div className="pt-4 pb-2 border-t border-slate-150/60">
                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4 text-left">Care tracker status</span>
                            <div className="grid grid-cols-4 gap-2 relative">
                              {/* Connecting timeline background bar */}
                              <div className="absolute top-[11px] left-[12%] right-[12%] h-[3px] bg-slate-100 -z-0" />
                              {/* Connecting timeline active filled bar */}
                              <div 
                                className="absolute top-[11px] left-[12%] h-[3px] bg-[#c9a24c] transition-all duration-500 -z-0" 
                                style={{ 
                                  width: booking.status === "Completed" ? "76%" : 
                                         (booking.status === "Confirmed" || booking.status === "Active") && booking.assignedStaff ? "51%" :
                                         booking.status === "Confirmed" || booking.status === "Active" ? "25%" : "0%"
                                }} 
                              />
                              {/* Step 1: Request Pending */}
                              <div className="text-center relative z-10">
                                <div className="h-6 w-6 rounded-full bg-[#c9a24c] text-white flex items-center justify-center mx-auto text-xs font-bold shadow-sm border border-white">
                                  <Check className="h-3.5 w-3.5" />
                                </div>
                                <span className="block text-[9px] font-bold text-slate-650 mt-1">Requested</span>
                                <span className="block text-[8px] text-slate-400 font-bold mt-0.5">{formatStepTime(booking.createdAt)}</span>
                              </div>
 
                              {/* Step 2: Confirmed */}
                              <div className="text-center relative z-10">
                                <div className={`h-6 w-6 rounded-full flex items-center justify-center mx-auto text-xs font-bold border border-white ${
                                  booking.status === "Confirmed" || booking.status === "Active" || booking.status === "Completed"
                                    ? "bg-[#1e2a5a] text-white shadow-sm"
                                    : "bg-slate-100 text-slate-400"
                                }`}>
                                  {booking.status === "Confirmed" || booking.status === "Active" || booking.status === "Completed" ? <Check className="h-3.5 w-3.5" /> : "2"}
                                </div>
                                <span className="block text-[9px] font-bold text-slate-650 mt-1">Confirmed</span>
                                <span className="block text-[8px] text-slate-400 font-bold mt-0.5">{booking.confirmedAt ? formatStepTime(booking.confirmedAt) : "Pending"}</span>
                              </div>
 
                              {/* Step 3: Caretaker Assigned */}
                              <div className="text-center relative z-10">
                                <div className={`h-6 w-6 rounded-full flex items-center justify-center mx-auto text-xs font-bold border border-white ${
                                  (booking.status === "Confirmed" || booking.status === "Active" || booking.status === "Completed") && booking.assignedStaff
                                    ? "bg-[#1e2a5a] text-white shadow-sm"
                                    : "bg-slate-100 text-slate-400"
                                }`}>
                                  {(booking.status === "Confirmed" || booking.status === "Active" || booking.status === "Completed") && booking.assignedStaff ? <Check className="h-3.5 w-3.5" /> : "3"}
                                </div>
                                <span className="block text-[9px] font-bold text-slate-650 mt-1">
                                  {booking.status === "Active" ? "Staff Active" : "Staff Assigned"}
                                </span>
                                <span className="block text-[8px] text-slate-400 font-bold mt-0.5">{booking.assignedAt ? formatStepTime(booking.assignedAt) : "Pending"}</span>
                              </div>
 
                              {/* Step 4: Completed */}
                              <div className="text-center relative z-10">
                                <div className={`h-6 w-6 rounded-full flex items-center justify-center mx-auto text-xs font-bold border border-white ${
                                  booking.status === "Completed"
                                    ? "bg-[#c9a24c] text-white shadow-sm"
                                    : "bg-slate-100 text-slate-400"
                                }`}>
                                  {booking.status === "Completed" ? <Check className="h-3.5 w-3.5" /> : "4"}
                                </div>
                                <span className="block text-[9px] font-bold text-slate-650 mt-1">Delivered</span>
                                <span className="block text-[8px] text-slate-400 font-bold mt-0.5">{booking.completedAt ? formatStepTime(booking.completedAt) : "Pending"}</span>
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
                          <div className="bg-slate-50 border border-slate-200/50 p-2.5 rounded-2xl space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Total (incl. 18% GST)</span>
                              <span className="text-[8px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">18% GST</span>
                            </div>
                            <div className="flex justify-between items-center gap-1.5">
                              <span className="text-xs font-extrabold text-[#1e2a5a]">
                                ₹{Number(booking.amount).toLocaleString()}
                              </span>
                              <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded-md border ${
                                booking.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                booking.paymentStatus === 'Advance Paid' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                'bg-slate-100 text-slate-600 border-slate-200'
                              }`}>
                                {booking.paymentStatus}
                              </span>
                            </div>
                            <div className="text-[9px] text-slate-500 border-t border-slate-200/60 pt-1 flex justify-between gap-2 font-medium">
                              <span>Paid: <strong className="text-slate-700">₹{Number(booking.advancePaid || 0).toLocaleString()}</strong></span>
                              <span>Bal: <strong className="text-amber-800">₹{Number(booking.balanceAmount || 0).toLocaleString()}</strong></span>
                            </div>
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

                        {(booking.patientName || booking.prescription || booking.googleMapLocation) && (
                          <div className="text-xs pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 border-t border-slate-100/50 mt-2">
                            {booking.patientName && (
                              <div>
                                <span className="text-slate-400 block mb-0.5">Patient Details</span>
                                <span className="text-slate-700 font-semibold">
                                  👤 {booking.patientName} ({booking.patientAge} years)
                                </span>
                                {booking.patientNeeds && (
                                  <p className="text-[10px] text-slate-500 italic mt-0.5">Needs: {booking.patientNeeds}</p>
                                )}
                              </div>
                            )}
                            <div className="space-y-1">
                              {booking.googleMapLocation && (
                                <a 
                                  href={booking.googleMapLocation} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="text-[10px] text-indigo-600 hover:underline font-bold block"
                                >
                                  🗺 Open Google Map Location
                                </a>
                              )}
                              {booking.prescription && (
                                <button
                                  type="button"
                                  onClick={() => openDocViewer(booking.prescription, "Doctor Prescription / Case File", booking.patientName || booking.name, "Patient Medical Record")}
                                  className="text-[10px] text-emerald-700 font-bold hover:underline flex items-center gap-1 cursor-pointer bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200"
                                >
                                  <Eye className="h-2.5 w-2.5" />
                                  <span>📄 Doctor Prescription / Case File</span>
                                </button>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Assigned Staff or Allocation Notice */}
                        {booking.assignedStaff && booking.assignedStaff.trim() && booking.assignedStaff.trim().toLowerCase() !== 'unassigned' ? (
                          <div className="mt-4 border border-indigo-100 bg-gradient-to-br from-indigo-50/30 via-white to-indigo-50/15 p-5 rounded-3xl shadow-xs space-y-4">
                            <div className="flex justify-between items-center pb-2 border-b border-indigo-100/60">
                              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5 font-display">
                                <User className="h-4 w-4 text-[#c9a24c]" /> 
                                {booking.caregiverDetails?.type === 'mtp' ? "Assigned MTP Companion Profile" : "Assigned Caregiver Profile"}
                              </span>
                              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 font-bold flex items-center gap-1">
                                <ShieldCheck className="h-3 w-3 text-emerald-600" /> Verified Professional
                              </span>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                              {booking.caregiverDetails?.profilePhoto ? (
                                <img 
                                  src={booking.caregiverDetails.profilePhoto} 
                                  className="h-16 w-16 rounded-2xl object-cover border-2 border-indigo-100 shadow-sm shrink-0" 
                                  alt={booking.caregiverDetails.name} 
                                />
                              ) : (
                                <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-[#1e2a5a] to-[#0f1530] flex items-center justify-center text-white text-xl font-black shrink-0 shadow-sm">
                                  {(booking.caregiverDetails?.name || booking.assignedStaff).charAt(0).toUpperCase()}
                                </div>
                              )}
                              
                              <div className="flex-1 space-y-1 text-center sm:text-left min-w-0">
                                <h4 className="text-base font-extrabold text-slate-850">
                                  {booking.caregiverDetails?.name || booking.assignedStaff}
                                </h4>
                                <div className="flex flex-wrap justify-center sm:justify-start items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                                  <span className="text-[#1e2a5a] font-bold bg-[#1e2a5a]/5 px-2 py-0.5 rounded-md">
                                    {booking.caregiverDetails?.specialty || (booking.caregiverDetails?.type === 'mtp' ? "MTP Companion & Tasks" : "Senior Care Specialist")}
                                  </span>
                                  {booking.caregiverDetails?.experience && (
                                    <>
                                      <span>•</span>
                                      <span className="text-slate-600 font-semibold">{booking.caregiverDetails.experience}+ yrs exp</span>
                                    </>
                                  )}
                                </div>
                                {booking.caregiverDetails?.experienceDetails && (
                                  <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed italic">
                                    &ldquo;{booking.caregiverDetails.experienceDetails}&rdquo;
                                  </p>
                                )}
                              </div>

                              <div className="flex flex-wrap sm:flex-col gap-2 shrink-0 pt-1">
                                {booking.caregiverDetails?.phone && booking.caregiverDetails.phone !== 'Contact Admin' ? (
                                  <>
                                    <a 
                                      href={`tel:${booking.caregiverDetails.phone}`} 
                                      className="btn-primary inline-flex items-center justify-center gap-1.5 text-xs py-2 px-3.5 shadow-xs"
                                    >
                                      <Phone className="h-3.5 w-3.5" /> Call Staff
                                    </a>
                                    <a 
                                      href={`https://wa.me/91${booking.caregiverDetails.phone.replace(/\D/g, '').slice(-10)}?text=Hi%20${encodeURIComponent(booking.caregiverDetails.name)},%20this%20is%20regarding%20my%20Amma%20Seva%20booking%20%23${booking.id}.`} 
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center justify-center gap-1.5 text-xs py-2 px-3.5 rounded-xl bg-[#25D366] hover:bg-emerald-600 text-white font-bold shadow-xs transition-colors"
                                    >
                                      <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                                    </a>
                                  </>
                                ) : (
                                  <a 
                                    href="tel:+919494516543" 
                                    className="btn-primary inline-flex items-center justify-center gap-1.5 text-xs py-2 px-3.5 shadow-xs"
                                  >
                                    <Phone className="h-3.5 w-3.5" /> Support Desk
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-4 border border-amber-200/80 bg-gradient-to-br from-amber-50/50 via-white to-amber-50/20 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                                <Clock className="h-5 w-5 animate-pulse" />
                              </div>
                              <div>
                                <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider">Staff Allocation in Progress</h4>
                                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                                  Our care coordinators are assigning the best background-verified caregiver/companion for your shift.
                                </p>
                              </div>
                            </div>
                            <a
                              href="https://wa.me/919494516543?text=Hi%20Amma%20Seva%20Team,%20please%20update%20me%20on%20staff%20allocation%20for%20my%20shift%20%23"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold shrink-0 transition-colors shadow-2xs flex items-center gap-1.5"
                            >
                              <MessageCircle className="h-3.5 w-3.5 text-[#25D366]" /> Need Quick Update?
                            </a>
                          </div>
                        )}
                           {/* Digital Shift Care Log & Vitals Tracker */}
                        {booking.assignedStaff && (booking.status === "Confirmed" || booking.status === "Active" || booking.status === "Completed") && (() => {
                          let vitalsObj = null;
                          if (booking.vitals) {
                            try {
                              vitalsObj = typeof booking.vitals === 'string' ? JSON.parse(booking.vitals) : booking.vitals;
                            } catch (e) {
                              vitalsObj = null;
                            }
                          }
                          let logsArray = [];
                          if (booking.careLogs) {
                            try {
                              logsArray = typeof booking.careLogs === 'string' ? JSON.parse(booking.careLogs) : booking.careLogs;
                            } catch (e) {
                              logsArray = [];
                            }
                          }
                          return (
                            <div className="mt-4 border border-emerald-100 bg-emerald-50/15 p-5 rounded-2xl space-y-4">
                              <div className="flex justify-between items-center pb-2 border-b border-emerald-100/50">
                                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5 font-display">
                                  📊 Real-Time Vitals & Care Log
                                </span>
                                <span className={`text-[9px] px-2.5 py-0.5 rounded-full border font-bold tracking-wider uppercase ${
                                  booking.status === 'Active' ? 'text-emerald-600 bg-emerald-50 border-emerald-200/50 animate-pulse' : 'text-slate-400 bg-slate-105 border-slate-200'
                                }`}>
                                  {booking.status === 'Active' ? 'Live Updates' : 'Shift Log History'}
                                </span>
                              </div>

                              {vitalsObj ? (
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                  <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-100/40 text-left">
                                    <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Blood Pressure</span>
                                    <span className="block text-sm font-extrabold text-slate-800 mt-0.5">{vitalsObj.bloodPressure || 'N/A'}</span>
                                    <span className="text-[8px] text-emerald-600 font-semibold block mt-0.5">Updated</span>
                                  </div>
                                  <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-100/40 text-left">
                                    <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Pulse Rate</span>
                                    <span className="block text-sm font-extrabold text-slate-800 mt-0.5">{vitalsObj.pulseRate || 'N/A'}</span>
                                    <span className="text-[8px] text-emerald-600 font-semibold block mt-0.5">Updated</span>
                                  </div>
                                  <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-100/40 text-left">
                                    <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Body Temp</span>
                                    <span className="block text-sm font-extrabold text-slate-800 mt-0.5">{vitalsObj.bodyTemp || 'N/A'}</span>
                                    <span className="text-[8px] text-emerald-600 font-semibold block mt-0.5">Updated</span>
                                  </div>
                                  <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-100/40 text-left">
                                    <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Blood Glucose</span>
                                    <span className="block text-sm font-extrabold text-slate-800 mt-0.5">{vitalsObj.bloodGlucose || 'N/A'}</span>
                                    <span className="text-[8px] text-emerald-600 font-semibold block mt-0.5 font-sans">Updated</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-xs text-slate-500 italic p-4 bg-white/50 border border-slate-100 rounded-xl text-center">
                                  ⏳ Caregiver has not logged vitals for this shift yet.
                                </div>
                              )}

                              <div className="space-y-3 bg-white/70 p-3 rounded-xl border border-emerald-100/40 text-left">
                                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block mb-1">Shift Progress Logs</span>
                                {logsArray.length > 0 ? (
                                  <div className="space-y-2 text-xs">
                                    {logsArray.map((log: any, lIdx: number) => (
                                      <div key={lIdx} className="flex gap-2.5 items-start font-sans">
                                        <span className="text-[9px] font-bold text-slate-400 shrink-0 mt-0.5 bg-slate-100 px-1.5 py-0.5 rounded">{log.time}</span>
                                        <p className="text-slate-650 leading-relaxed text-left">{log.text}</p>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-xs text-slate-400 italic text-center py-2">
                                    No activity logs recorded yet for this shift.
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })()}

                        {/* Caregiver Performance Rating & Review widget */}
                        {booking.status === "Completed" && booking.assignedStaff && !booking.isReviewed && (
                          <div className="mt-4 border border-amber-100 bg-amber-50/20 p-5 rounded-2xl space-y-3">
                            <div className="flex justify-between items-center pb-2 border-b border-amber-100/50">
                              <span className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5 font-display">
                                🌟 Rate Caregiver Performance
                              </span>
                              <span className="text-[10px] text-slate-500 font-medium">Shift Completed</span>
                            </div>

                            {submittingReviewBookingId === booking.id ? (
                              <div className="space-y-3">
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Select Rating Star Score</label>
                                  <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <button
                                        key={star}
                                        type="button"
                                        onClick={() => setReviewRating(star)}
                                        className={`h-9 w-9 rounded-xl border text-base font-bold flex items-center justify-center transition-colors cursor-pointer ${
                                          reviewRating >= star 
                                            ? "bg-amber-500 border-amber-500 text-white" 
                                            : "bg-white border-slate-200 text-slate-400 hover:border-amber-300"
                                        }`}
                                      >
                                        ⭐
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Write Feedback Comment</label>
                                  <textarea
                                    value={reviewComment}
                                    onChange={(e) => setReviewComment(e.target.value)}
                                    placeholder="Tell us about the caregiver's punctuality, care quality, or bedside manners..."
                                    rows={3}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none bg-white text-xs text-slate-700"
                                  />
                                </div>

                                <div className="flex justify-end gap-2 pt-1">
                                  <button
                                    type="button"
                                    onClick={() => setSubmittingReviewBookingId(null)}
                                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-100 cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      const token = localStorage.getItem("ammaseva_user_token");
                                      if (!token) return;
                                      setIsReviewSubmitting(true);
                                      try {
                                        const res = await fetch("/api/reviews", {
                                          method: "POST",
                                          headers: {
                                            "Content-Type": "application/json",
                                            "Authorization": `Bearer ${token}`
                                          },
                                          body: JSON.stringify({
                                            bookingId: booking.id,
                                            caregiverName: booking.assignedStaff,
                                            rating: reviewRating,
                                            comment: reviewComment
                                          })
                                        });
                                        if (res.ok) {
                                          fetchBookings();
                                          setSubmittingReviewBookingId(null);
                                          setReviewComment("");
                                          setReviewRating(5);
                                        }
                                      } catch (err) {
                                        console.error(err);
                                      } finally {
                                        setIsReviewSubmitting(false);
                                      }
                                    }}
                                    disabled={isReviewSubmitting}
                                    className="btn-primary inline-flex items-center gap-1.5 text-xs py-2 px-4 shadow-sm"
                                  >
                                    {isReviewSubmitting ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0"></span> : "Submit Care Review"}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex justify-between items-center bg-white border border-slate-100 rounded-xl p-3 shadow-inner">
                                <p className="text-xs text-slate-500 font-medium">Please share your experience with <strong className="text-slate-700">{booking.assignedStaff}</strong> to help us improve quality.</p>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSubmittingReviewBookingId(booking.id);
                                    setReviewRating(5);
                                    setReviewComment("");
                                  }}
                                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm shrink-0"
                                >
                                  Rate &amp; Review
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {booking.status === "Completed" && booking.isReviewed && booking.review && (
                          <div className="mt-4 border border-slate-100 bg-slate-50/50 p-5 rounded-2xl space-y-2">
                            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 font-display">
                                💬 Submitted Feedback
                              </span>
                              <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 font-bold flex items-center gap-0.5">
                                ⭐ {booking.review.rating}.0
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 italic leading-relaxed">&ldquo;{booking.review.comment || "No written comments submitted."}&rdquo;</p>
                          </div>
                        )}
                            </>
                          )}
                      </div>

                      {/* Action buttons */}
                      {isExpanded && (
                        <div className="flex flex-col sm:flex-row lg:flex-col justify-end gap-2.5 shrink-0 border-t lg:border-t-0 lg:border-l border-slate-100/80 pt-4 lg:pt-0 lg:pl-6">
                          {booking.status !== "Cancelled" && (booking.paymentStatus === "Advance Paid" || booking.paymentStatus === "Unpaid") && Number(booking.balanceAmount) > 0 && (
                            <button
                              onClick={() => handlePayBalance(booking)}
                              className="px-4 py-2.5 rounded-xl bg-emerald-600 border border-emerald-700 text-white text-xs font-bold uppercase tracking-wider hover:bg-emerald-700 cursor-pointer transition-all hover:translate-y-[-1px] text-center w-full sm:w-auto"
                            >
                              Pay Balance (₹{booking.balanceAmount})
                            </button>
                          )}
                           {booking.status !== "Cancelled" && booking.status !== "Completed" && (
                            <>
                              <button
                                onClick={() => {
                                  setEditBookingId(booking.id);
                                  setEditPatientName(booking.patientName || "");
                                  setEditPatientAge(booking.patientAge || "");
                                  setEditPatientNeeds(booking.patientNeeds || "");
                                  setEditAddress(booking.address || "");
                                  setEditGoogleMapLocation(booking.googleMapLocation || "");
                                  setIsEditModalOpen(true);
                                }}
                                className="px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider hover:bg-slate-100 cursor-pointer transition-all hover:translate-y-[-1px] text-center w-full sm:w-auto"
                              >
                                Edit Details
                              </button>
                              <button
                                onClick={() => {
                                  setRescheduleBookingId(booking.id);
                                  setRescheduleDate(booking.date);
                                  setRescheduleTime(booking.time);
                                }}
                                className="px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider hover:bg-slate-100 cursor-pointer transition-all hover:translate-y-[-1px] text-center w-full sm:w-auto"
                              >
                                Reschedule Shift
                              </button>
                              <button
                                onClick={() => handleCancel(booking.id)}
                                className="px-4 py-2.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs font-bold uppercase tracking-wider hover:bg-rose-500 hover:text-white cursor-pointer transition-all hover:translate-y-[-1px] text-center w-full sm:w-auto"
                              >
                                Cancel Booking
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() => setActiveInvoice(booking)}
                            className="px-4 py-2.5 rounded-xl bg-[#1e2a5a] border border-[#1e2a5a]/10 text-[#c9a24c] hover:text-white text-xs font-bold uppercase tracking-wider hover:bg-[#1e2a5a]/90 cursor-pointer transition-all hover:translate-y-[-1px] flex items-center justify-center gap-1.5 w-full sm:w-auto shadow-sm"
                          >
                            <Download className="h-3.5 w-3.5" /> Invoice PDF
                          </button>
                          <button
                            type="button"
                            onClick={() => setExpandedBookingIds(prev => ({ ...prev, [booking.id]: false }))}
                            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider cursor-pointer transition-all hover:translate-y-[-1px] flex items-center justify-center gap-1 w-full sm:w-auto border border-slate-200"
                          >
                            <span>▲ Close Details</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      ) : isMtpBooking ? (
            // =========================================================================
            // 🚗 COMPACT ULTRA-PREMIUM 1-STEP MTP TASK BOOKING VIEW
            // =========================================================================
            <div className="max-w-4xl mx-auto rounded-3xl bg-white border border-amber-300/80 shadow-2xl shadow-amber-900/10 p-5 sm:p-8 text-left animate-fade-in relative overflow-hidden mb-16">
              
              {/* Category Mode Switcher Tabs */}
              <div className="space-y-4 pb-6 mb-6 border-b border-slate-150">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Booking Category</span>
                    <h2 className="text-lg sm:text-xl font-black text-[#0b183b] font-display flex items-center gap-2">
                      <span>🚗 Multi-Tasking Professional (MTP)</span>
                    </h2>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className="inline-flex items-center gap-1.5 text-xs font-black text-amber-900 bg-amber-100/90 border border-amber-300/80 px-3.5 py-1 rounded-full shadow-xs">
                      <span className="h-2 w-2 rounded-full bg-amber-600 animate-pulse" />
                      ⚡ 1-Step Fast Dispatch
                    </span>
                  </div>
                </div>

                {/* Full-width Luxury 2-Tab Segmented Control */}
                <div className="grid grid-cols-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200/90 gap-1.5 shadow-inner">
                  {/* Tab 1: Clinical Home Care */}
                  <button
                    type="button"
                    onClick={() => {
                      const standard = servicesList.find(s => !s.isMtp) || servicesList[0];
                      if (standard) setSelectedServiceId(standard.id);
                      setBookingStep(1);
                    }}
                    className="relative py-2.5 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 text-center select-none bg-transparent text-slate-600 hover:text-[#0b183b] hover:bg-white/80"
                  >
                    <span className="text-base sm:text-lg shrink-0">🩺</span>
                    <div className="text-left leading-tight">
                      <span className="block text-xs sm:text-sm font-bold text-slate-700">
                        Clinical Home Care
                      </span>
                      <span className="hidden xs:block text-[10px] sm:text-[11px] text-slate-400 font-medium">
                        Nursing, Elderly &amp; ICU
                      </span>
                    </div>
                  </button>

                  {/* Tab 2: MTP Tasks (Active) */}
                  <button
                    type="button"
                    className="relative py-2.5 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 text-center select-none bg-[#0b183b] text-[#c9a24c] shadow-md border border-[#0b183b]"
                  >
                    <span className="text-base sm:text-lg shrink-0">🚗</span>
                    <div className="text-left leading-tight">
                      <span className="block text-xs sm:text-sm font-black text-[#c9a24c]">
                        MTP Tasks &amp; Errands
                      </span>
                      <span className="hidden xs:block text-[10px] sm:text-[11px] text-amber-200/90 font-medium">
                        ₹100 Base • Zero Docs
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              <form onSubmit={handleBookingSubmit} className="space-y-6">
                
                {/* 1. MTP Visual 6-Card Category Selector */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
                      <Briefcase className="h-3.5 w-3.5 text-amber-700" /> Select MTP Task Category
                    </label>
                    <span className="text-xs text-amber-800 font-extrabold bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200">
                      ₹100 Base Dispatch Fee
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                    {[
                      { id: "mtp-hospital-escort", icon: "🚗", title: "Hospital Escort", sub: "Doctor Visits" },
                      { id: "mtp-senior-walk", icon: "🧓", title: "Senior Walk", sub: "Park Companion" },
                      { id: "mtp-medicine-pickup", icon: "💊", title: "Medicine Pickup", sub: "Chemist Errand" },
                      { id: "mtp-grocery-errand", icon: "🛒", title: "Grocery & Utility", sub: "Home Supplies" },
                      { id: "mtp-bank-assistant", icon: "🏦", title: "Bank & Govt", sub: "Official Work" },
                      { id: "mtp-general", icon: "🤝", title: "General MTP", sub: "City Errands" }
                    ].map((cat) => {
                      const isSelected = selectedServiceId === cat.id || (!selectedServiceId.startsWith("mtp-") && cat.id === "mtp-hospital-escort");
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setSelectedServiceId(cat.id)}
                          className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                            isSelected
                              ? "bg-amber-500/15 border-amber-500 text-amber-950 font-black shadow-md ring-2 ring-amber-400/40"
                              : "bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-amber-50/60 hover:border-amber-300 shadow-2xs"
                          }`}
                        >
                          <span className="text-xl">{cat.icon}</span>
                          <span className="text-xs font-bold leading-tight truncate w-full mt-0.5">{cat.title}</span>
                          <span className="text-[10px] text-slate-400 font-medium truncate w-full">{cat.sub}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Customer Contact Details */}
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-200/90 shadow-2xs space-y-3.5">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/70">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#1e2a5a] flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-indigo-600" /> Customer Information
                    </span>
                    {!user ? (
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">Direct Guest Booking</span>
                    ) : (
                      <span className="text-[10px] font-bold text-indigo-800 bg-indigo-100 px-2.5 py-0.5 rounded-full">Logged In: {user.name}</span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        Full Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={user?.name || contactName}
                        onChange={(e) => setContactName(sanitizeName(e.target.value))}
                        placeholder="e.g. Suresh Kumar"
                        className="w-full h-11 px-3.5 text-sm rounded-xl border border-slate-200 bg-white text-slate-900 outline-none transition-all focus:border-[#c9a24c] focus:ring-2 focus:ring-[#c9a24c]/20 shadow-2xs font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        Mobile Number <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        value={user?.phone || contactPhone}
                        onChange={(e) => setContactPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        placeholder="10-digit mobile number"
                        className="w-full h-11 px-3.5 text-sm rounded-xl border border-slate-200 bg-white text-slate-900 outline-none transition-all focus:border-[#c9a24c] focus:ring-2 focus:ring-[#c9a24c]/20 shadow-2xs font-semibold font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        Email Address <span className="text-slate-400 font-normal lowercase">(optional)</span>
                      </label>
                      <input
                        type="email"
                        value={user?.email || contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="name@gmail.com"
                        className="w-full h-11 px-3.5 text-sm rounded-xl border border-slate-200 bg-white text-slate-900 outline-none transition-all focus:border-[#c9a24c] focus:ring-2 focus:ring-[#c9a24c]/20 shadow-2xs font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Schedule & Scope */}
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-200/90 shadow-2xs space-y-3.5">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/70">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#1e2a5a] flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-indigo-600" /> Date &amp; Shift Schedule
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">Today or upcoming</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        Task Date <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        min={todayStr}
                        max="2099-12-31"
                        value={bookingDate}
                        onChange={(e) => setBookingDate(e.target.value)}
                        className="w-full h-11 px-3.5 text-sm rounded-xl border border-slate-200 bg-white text-slate-900 outline-none transition-all focus:border-[#c9a24c] focus:ring-2 focus:ring-[#c9a24c]/20 shadow-2xs font-semibold cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        Start Time <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="time"
                        required
                        value={bookingTime}
                        onChange={(e) => setBookingTime(e.target.value)}
                        className="w-full h-11 px-3.5 text-sm rounded-xl border border-slate-200 bg-white text-slate-900 outline-none transition-all focus:border-[#c9a24c] focus:ring-2 focus:ring-[#c9a24c]/20 shadow-2xs font-semibold cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        Scope / Duration
                      </label>
                      <select
                        value={durationCount}
                        onChange={(e) => setDurationCount(Math.max(1, Number(e.target.value)))}
                        className="w-full h-11 px-3.5 text-sm rounded-xl border border-slate-200 bg-white text-slate-900 outline-none transition-all focus:border-[#c9a24c] focus:ring-2 focus:ring-[#c9a24c]/20 shadow-2xs font-semibold cursor-pointer"
                      >
                        <option value={1}>1 Task / Single Visit</option>
                        <option value={2}>2 Hours Assistant</option>
                        <option value={4}>4 Hours (Half Day)</option>
                        <option value={8}>8 Hours (Full Day)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 4. Task Location & GPS */}
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-200/90 shadow-2xs space-y-3.5">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/70">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#1e2a5a] flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-indigo-600" /> Location &amp; Navigation
                    </span>
                    <span className="text-[10px] text-slate-400">Hyderabad</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 items-start">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        Address / Pickup Spot <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={bookingAddress}
                        onChange={(e) => setBookingAddress(e.target.value)}
                        placeholder="Door/Flat no, building, street, landmark, area & pincode"
                        className="w-full h-11 px-3.5 text-sm rounded-xl border border-slate-200 bg-white text-slate-900 outline-none transition-all focus:border-[#c9a24c] focus:ring-2 focus:ring-[#c9a24c]/20 shadow-2xs font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        GPS Pin <span className="text-slate-400 font-normal lowercase">(optional)</span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          readOnly
                          value={bookingGoogleMapLocation}
                          placeholder="GPS Coordinates"
                          className="min-w-0 flex-1 h-11 px-3 text-xs rounded-xl border border-slate-200 bg-slate-100 text-slate-600 outline-none truncate font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!navigator.geolocation) return;
                            setIsFetchingLocationBooking(true);
                            navigator.geolocation.getCurrentPosition(
                              (position) => {
                                const lat = position.coords.latitude;
                                const lng = position.coords.longitude;
                                setBookingGoogleMapLocation(`https://www.google.com/maps?q=${lat},${lng}`);
                                setIsFetchingLocationBooking(false);
                              },
                              () => setIsFetchingLocationBooking(false)
                            );
                          }}
                          disabled={isFetchingLocationBooking}
                          className="h-11 px-3.5 bg-[#1e2a5a] hover:bg-[#283870] text-[#c9a24c] text-xs font-black rounded-xl flex items-center gap-1.5 shrink-0 disabled:opacity-50 cursor-pointer shadow-2xs transition-all whitespace-nowrap"
                        >
                          {isFetchingLocationBooking ? "..." : "📍 GPS"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 5. Task Instructions & Notes */}
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-200/90 shadow-2xs space-y-2.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                    Specific Task Notes / Requirements
                  </label>
                  <textarea
                    rows={3}
                    value={patientNeeds}
                    onChange={(e) => setPatientNeeds(e.target.value)}
                    placeholder="Describe specific task needs (e.g. Escort to Apollo clinic, wheelchair assist, buy medicines from Apollo pharmacy)..."
                    className="w-full p-3 text-sm rounded-xl border border-slate-200 bg-white text-slate-900 outline-none transition-all focus:border-[#c9a24c] focus:ring-2 focus:ring-[#c9a24c]/20 shadow-2xs font-medium"
                  />

                  {/* Compact Quick Tags */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Quick Tags:</span>
                    {["Hospital Escort", "Medicine Pickup", "Senior Walk", "Bank Work", "Grocery Errand", "Wheelchair Support"].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          if (patientNeeds.includes(tag)) return;
                          setPatientNeeds(prev => prev ? `${prev}, ${tag}` : tag);
                        }}
                        className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white hover:bg-amber-100 hover:text-amber-900 text-slate-600 border border-slate-200 transition-all cursor-pointer shadow-2xs"
                      >
                        + {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 6. Pay on Service / Free Dispatch Request */}
                <div className="rounded-2xl border border-amber-300 bg-gradient-to-r from-amber-50 via-white to-orange-50/40 p-5 text-amber-950 space-y-3.5 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-amber-200/80">
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl sm:text-3xl font-black text-amber-950 font-display">Pay on Service</span>
                        <span className="text-xs text-emerald-800 font-bold bg-emerald-100/90 px-2.5 py-0.5 rounded-full border border-emerald-300">
                          ₹0 Advance (Free Dispatch)
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        No advance payment needed now. Pay caregiver directly or settle via UPI upon arrival/service completion.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-extrabold text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-2.5 py-1 rounded-lg">
                        ✓ No Medical Docs
                      </span>
                      <span className="text-[11px] font-extrabold text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-2.5 py-1 rounded-lg">
                        ✓ 100% Escrow Protected
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-amber-200 text-xs text-slate-700 flex items-center gap-2.5">
                    <span className="text-lg shrink-0">🤝</span>
                    <span>
                      <strong>On-Demand Companion Dispatch:</strong> A verified caregiver will be allocated immediately for your requested time slot. Service fees are finalized transparently upon arrival.
                    </span>
                  </div>
                </div>

                {/* 7. Agreement & Submit */}
                <div className="pt-2 space-y-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      required
                      checked={agreeTermsBooking}
                      onChange={(e) => setAgreeTermsBooking(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#1e2a5a] focus:ring-gold cursor-pointer accent-[#c9a24c]"
                    />
                    <span className="text-xs font-semibold text-slate-600 select-none leading-relaxed">
                      I confirm this MTP Task Request (Pay on Service) and agree to Amma Seva terms.
                    </span>
                  </label>

                  <button
                    type="submit"
                    disabled={isSubmitting || !agreeTermsBooking}
                    className="w-full h-12 sm:h-13 bg-gradient-to-r from-[#1e2a5a] via-[#091129] to-[#1e2a5a] hover:from-[#283870] hover:to-[#14224c] text-[#c9a24c] hover:text-white rounded-2xl font-black uppercase tracking-wider text-xs sm:text-sm flex items-center justify-center gap-2.5 cursor-pointer shadow-xl shadow-[#1e2a5a]/25 disabled:opacity-50 transition-all"
                  >
                    {isSubmitting && (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                    )}
                    {isSubmitting ? "Allocating MTP Companion..." : "Confirm MTP Booking (Pay on Service)"}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            // =========================================================================
            // 🏥 COMPACT ULTRA-PREMIUM 3-STEP CLINICAL HEALTHCARE BOOKING WIZARD
            // =========================================================================
            <div className="max-w-4xl mx-auto rounded-3xl bg-white border border-slate-200/90 shadow-2xl shadow-slate-200/40 p-3.5 sm:p-6 md:p-8 text-left animate-fade-in relative overflow-hidden mb-16">
              
              {/* Category Mode Switcher Tabs */}
              <div className="space-y-4 pb-6 mb-6 border-b border-slate-150">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Booking Category</span>
                    <h2 className="text-lg sm:text-xl font-black text-[#0b183b] font-display flex items-center gap-2">
                      <span>🩺 Clinical Healthcare Home Booking</span>
                    </h2>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className="inline-flex items-center gap-1.5 text-xs font-black text-slate-700 bg-slate-100 border border-slate-200 px-3.5 py-1 rounded-full shadow-xs">
                      Step <strong className="text-[#0b183b] font-black">{bookingStep}</strong> of 3
                    </span>
                  </div>
                </div>

                {/* Full-width Luxury 2-Tab Segmented Control */}
                <div className="grid grid-cols-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200/90 gap-1.5 shadow-inner">
                  {/* Tab 1: Clinical Home Care (Active) */}
                  <button
                    type="button"
                    className="relative py-2.5 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 text-center select-none bg-[#0b183b] text-white shadow-md border border-[#0b183b]"
                  >
                    <span className="text-base sm:text-lg shrink-0">🩺</span>
                    <div className="text-left leading-tight">
                      <span className="block text-xs sm:text-sm font-black text-white">
                        Clinical Home Care
                      </span>
                      <span className="hidden xs:block text-[10px] sm:text-[11px] text-[#c9a24c] font-medium">
                        Nursing, Elderly &amp; ICU
                      </span>
                    </div>
                  </button>

                  {/* Tab 2: MTP Tasks */}
                  <button
                    type="button"
                    onClick={() => {
                      const mtpItem = servicesList.find(s => s.isMtp || s.id.startsWith("mtp")) || { id: "mtp-hospital-escort" };
                      setSelectedServiceId(mtpItem.id);
                    }}
                    className="relative py-2.5 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 text-center select-none bg-transparent text-slate-600 hover:text-[#0b183b] hover:bg-white/80"
                  >
                    <span className="text-base sm:text-lg shrink-0">🚗</span>
                    <div className="text-left leading-tight">
                      <span className="block text-xs sm:text-sm font-bold text-slate-700">
                        MTP Tasks &amp; Errands
                      </span>
                      <span className="hidden xs:block text-[10px] sm:text-[11px] text-slate-400 font-medium">
                        ₹100 Base • Zero Docs
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Progress Stepper Bar (Responsive & Spacious) */}
              <div className="mb-8 max-w-2xl mx-auto px-1">
                {/* Desktop 3-Step Pill Bar */}
                <div className="hidden sm:grid grid-cols-3 gap-3">
                  {[
                    { step: 1, label: "1. Service & Schedule" },
                    { step: 2, label: "2. Patient Profile" },
                    { step: 3, label: "3. Location & Pay" }
                  ].map((s) => {
                    const isActive = bookingStep === s.step;
                    const isCompleted = bookingStep > s.step;

                    return (
                      <button
                        type="button"
                        key={s.step}
                        onClick={() => {
                          if (s.step === 1) goToBookingStep(1);
                          else if (s.step === 2 && validateStep1()) goToBookingStep(2);
                          else if (s.step === 3 && validateStep1() && validateStep2()) goToBookingStep(3);
                        }}
                        className={`flex items-center justify-center gap-2 min-h-[42px] py-2 px-3 rounded-xl text-xs font-bold leading-normal transition-all cursor-pointer border ${
                          isActive
                            ? "bg-[#0b183b] text-[#c9a24c] border-[#0b183b] shadow-sm ring-2 ring-[#c9a24c]/20"
                            : isCompleted
                              ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100/70"
                              : "bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                          isActive ? "bg-[#c9a24c] text-[#091129]" : isCompleted ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-600"
                        }`}>
                          {isCompleted ? "✓" : s.step}
                        </span>
                        <span className="truncate">{s.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Mobile Stepper Indicator (Clean, non-squished) */}
                <div className="sm:hidden space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold px-1">
                    <span className="text-[#0b183b] flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#0b183b] text-[#c9a24c] text-[10px] font-black flex items-center justify-center">
                        {bookingStep}
                      </span>
                      <span>
                        {bookingStep === 1 && "Service & Shift Schedule"}
                        {bookingStep === 2 && "Patient & Booker Profile"}
                        {bookingStep === 3 && "Location & Advance Payment"}
                      </span>
                    </span>
                    <span className="text-[11px] text-slate-400 font-semibold">Step {bookingStep} of 3</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 h-1.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
                    <div className={`h-full rounded-full transition-all ${bookingStep >= 1 ? "bg-emerald-500" : "bg-slate-200"}`} />
                    <div className={`h-full rounded-full transition-all ${bookingStep >= 2 ? "bg-emerald-500" : "bg-slate-200"}`} />
                    <div className={`h-full rounded-full transition-all ${bookingStep >= 3 ? "bg-emerald-500" : "bg-slate-200"}`} />
                  </div>
                </div>
              </div>

              <form onSubmit={handleBookingSubmit} className="space-y-6">
                
                {/* ========================================================================= */}
                {/* 🌟 STEP 1: SERVICE & SCHEDULING */}
                {/* ========================================================================= */}
                {bookingStep === 1 && (
                  <div className="space-y-5 animate-fade-in">
                    
                    {/* Select Service Dropdown + Description */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Select Healthcare Service
                        </label>
                        <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                          Verified Clinical Care
                        </span>
                      </div>

                      <select
                        value={selectedServiceId}
                        onChange={(e) => setSelectedServiceId(e.target.value)}
                        className="w-full h-11 sm:h-12 px-3.5 text-sm rounded-xl border border-slate-200 bg-slate-50/70 text-slate-900 outline-none transition-all focus:bg-white focus:border-[#c9a24c] focus:ring-2 focus:ring-[#c9a24c]/20 shadow-2xs font-semibold cursor-pointer"
                      >
                        <optgroup label="🌟 Standard Clinical Healthcare Services">
                          {servicesList
                            .filter(s => !s.isMtp)
                            .map(s => (
                              <option key={s.id} value={s.id}>{s.title} (₹{s.rate}/{s.unit})</option>
                            ))
                          }
                        </optgroup>
                        {servicesList.some(s => s.isMtp) && (
                          <optgroup label="🚗 Switch to MTP Tasks (Zero Docs • ₹100 Base Fee)">
                            {servicesList
                              .filter(s => s.isMtp)
                              .map(s => (
                                <option key={s.id} value={s.id}>✨ {s.title} (₹100 Base Booking)</option>
                              ))
                            }
                          </optgroup>
                        )}
                      </select>

                      {currentService?.desc && (
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-slate-600 text-xs flex items-center gap-2">
                          <span className="text-[#c9a24c] font-bold text-sm">✦</span>
                          <span className="leading-snug">{currentService?.desc}</span>
                        </div>
                      )}
                    </div>

                    {/* Schedule Inputs: 1 col on mobile, 2 on tablet, 4 on desktop */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-200/90 shadow-2xs space-y-3.5">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200/70">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#1e2a5a] flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-indigo-600" /> Billing Option &amp; Shift Schedule
                        </span>
                        <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          Flexible shifts
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                        {/* 1. Billing Frequency */}
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 truncate">
                            Billing Option
                          </label>
                          <select
                            value={bookingDuration}
                            onChange={(e) => {
                              setBookingDuration(e.target.value);
                              setDurationCount(1);
                            }}
                            className="w-full h-11 px-3 text-sm rounded-xl border border-slate-200 bg-white text-slate-900 outline-none transition-all focus:border-[#c9a24c] focus:ring-2 focus:ring-[#c9a24c]/20 shadow-2xs font-semibold cursor-pointer"
                          >
                            <option value="Daily">Daily</option>
                            <option value="Hourly">Hourly</option>
                            <option value="Weekly">Weekly</option>
                            <option value="Monthly">Monthly</option>
                          </select>
                        </div>

                        {/* 2. Duration count multiplier with rate badge */}
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 truncate">
                            {bookingDuration === "Hourly" ? "Hours" : bookingDuration === "Daily" ? "Days" : bookingDuration === "Weekly" ? "Weeks" : "Months"} (₹{
                              bookingDuration === "Hourly" ? getServiceRates().hourly :
                              bookingDuration === "Daily" ? getServiceRates().daily :
                              bookingDuration === "Weekly" ? getServiceRates().weekly :
                              getServiceRates().monthly
                            }/{bookingDuration === "Hourly" ? "hr" : bookingDuration === "Daily" ? "day" : bookingDuration === "Weekly" ? "wk" : "mo"})
                          </label>
                          <input
                            type="number"
                            min={1}
                            required
                            value={durationCount}
                            onChange={(e) => setDurationCount(Math.max(1, Number(e.target.value)))}
                            className="w-full h-11 px-3.5 text-sm rounded-xl border border-slate-200 bg-white text-slate-900 outline-none transition-all focus:border-[#c9a24c] focus:ring-2 focus:ring-[#c9a24c]/20 shadow-2xs font-semibold"
                          />
                        </div>

                        {/* 3. Preferred Start Date */}
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 truncate">
                            Start Date <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="date"
                            required
                            min={todayStr}
                            max="2099-12-31"
                            value={bookingDate}
                            onChange={(e) => setBookingDate(e.target.value)}
                            className="w-full h-11 px-3 text-sm rounded-xl border border-slate-200 bg-white text-slate-900 outline-none transition-all focus:border-[#c9a24c] focus:ring-2 focus:ring-[#c9a24c]/20 shadow-2xs font-semibold cursor-pointer"
                          />
                        </div>

                        {/* 4. Shift Start Time */}
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 truncate">
                            Start Time <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="time"
                            required
                            value={bookingTime}
                            onChange={(e) => setBookingTime(e.target.value)}
                            className="w-full h-11 px-3 text-sm rounded-xl border border-slate-200 bg-white text-slate-900 outline-none transition-all focus:border-[#c9a24c] focus:ring-2 focus:ring-[#c9a24c]/20 shadow-2xs font-semibold cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Next Action */}
                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (validateStep1()) goToBookingStep(2);
                        }}
                        className="h-10 sm:h-11 px-4 sm:px-6 bg-[#1e2a5a] hover:bg-[#283870] text-[#c9a24c] hover:text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all"
                      >
                        <span>Next: Patient Profile</span>
                        <ChevronRight className="h-4 w-4 shrink-0" />
                      </button>
                    </div>

                  </div>
                )}

                {/* ========================================================================= */}
                {/* 👤 STEP 2: PATIENT & BOOKER DETAILS */}
                {/* ========================================================================= */}
                {bookingStep === 2 && (
                  <div className="space-y-5 animate-fade-in">
                    
                    {/* Guest Booker Information Section */}
                    {!user ? (
                      <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-200/90 shadow-2xs space-y-3.5">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-200/70">
                          <span className="text-xs font-bold uppercase tracking-wider text-[#1e2a5a] flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5 text-indigo-600" /> Booker Contact Details
                          </span>
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">Direct Booking</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                              Booker Name <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={contactName}
                              onChange={(e) => setContactName(sanitizeName(e.target.value))}
                              placeholder="e.g. Suresh Kumar"
                              className="w-full h-11 px-3.5 text-sm rounded-xl border border-slate-200 bg-white text-slate-900 outline-none transition-all focus:border-[#c9a24c] focus:ring-2 focus:ring-[#c9a24c]/20 shadow-2xs font-semibold"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                              Mobile Number <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="tel"
                              required
                              maxLength={10}
                              value={contactPhone}
                              onChange={(e) => setContactPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                              placeholder="10-digit mobile number"
                              className="w-full h-11 px-3.5 text-sm rounded-xl border border-slate-200 bg-white text-slate-900 outline-none transition-all focus:border-[#c9a24c] focus:ring-2 focus:ring-[#c9a24c]/20 shadow-2xs font-semibold font-mono"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                              Email Address <span className="text-slate-400 font-normal lowercase">(optional)</span>
                            </label>
                            <input
                              type="email"
                              value={contactEmail}
                              onChange={(e) => setContactEmail(e.target.value)}
                              placeholder="name@gmail.com"
                              className="w-full h-11 px-3.5 text-sm rounded-xl border border-slate-200 bg-white text-slate-900 outline-none transition-all focus:border-[#c9a24c] focus:ring-2 focus:ring-[#c9a24c]/20 shadow-2xs font-medium"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs sm:text-sm">
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-[#1e2a5a] font-bold">Booking Account:</span>
                          <span className="font-semibold text-slate-700 truncate">{user.name} ({user.phone || user.email})</span>
                        </div>
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                          ✓ Verified Account
                        </span>
                      </div>
                    )}

                    {/* Patient Details: 1 col on mobile, 2 on tablet, 4 on desktop */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-200/90 shadow-2xs space-y-3.5">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200/70">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#1e2a5a] flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-indigo-600" /> Patient Profile
                        </span>
                        <span className="text-[10px] text-slate-400">Personalized Staff Allocation</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                        {/* 1. Patient Name */}
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 truncate">
                            Patient Name <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={patientName}
                            onChange={(e) => setPatientName(sanitizeName(e.target.value))}
                            placeholder="e.g. Ramesh Chandra"
                            className="w-full h-11 px-3.5 text-sm rounded-xl border border-slate-200 bg-white text-slate-900 outline-none transition-all focus:border-[#c9a24c] focus:ring-2 focus:ring-[#c9a24c]/20 shadow-2xs font-semibold"
                          />
                        </div>

                        {/* 2. Patient Age */}
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 truncate">
                            Patient Age <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={2}
                            required
                            value={patientAge}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, "").slice(0, 2);
                              setPatientAge(val);
                            }}
                            placeholder="e.g. 72"
                            className="w-full h-11 px-3.5 text-sm rounded-xl border border-slate-200 bg-white text-slate-900 outline-none transition-all focus:border-[#c9a24c] focus:ring-2 focus:ring-[#c9a24c]/20 shadow-2xs font-semibold font-mono"
                          />
                        </div>

                        {/* 3. Care For */}
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 truncate">
                            Care For
                          </label>
                          <select
                            value={patientRelation}
                            onChange={(e) => setPatientRelation(e.target.value)}
                            className="w-full h-11 px-3 text-sm rounded-xl border border-slate-200 bg-white text-slate-900 outline-none transition-all focus:border-[#c9a24c] focus:ring-2 focus:ring-[#c9a24c]/20 shadow-2xs font-semibold cursor-pointer"
                          >
                            <option value="Parents (Elderly)">Parents (Elderly)</option>
                            <option value="Self">Self</option>
                            <option value="Spouse">Spouse</option>
                            <option value="Child">Child</option>
                            <option value="Relative / Friend">Relative / Friend</option>
                          </select>
                        </div>

                        {/* 4. Mobility Status */}
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 truncate">
                            Mobility Status
                          </label>
                          <select
                            value={patientMobility}
                            onChange={(e) => setPatientMobility(e.target.value)}
                            className="w-full h-11 px-3 text-sm rounded-xl border border-slate-200 bg-white text-slate-900 outline-none transition-all focus:border-[#c9a24c] focus:ring-2 focus:ring-[#c9a24c]/20 shadow-2xs font-semibold cursor-pointer"
                          >
                            <option value="Fully Mobile">🟢 Fully Mobile</option>
                            <option value="Assisted Walking">🟡 Assisted Walking</option>
                            <option value="Wheelchair Bound">🟠 Wheelchair Bound</option>
                            <option value="Bedridden">🔴 Bedridden</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Conditions & Special Care Instructions */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-200/90 shadow-2xs space-y-2.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                        Medical Conditions &amp; Special Care Directives
                      </label>
                      <textarea
                        rows={3}
                        value={patientNeeds}
                        onChange={(e) => setPatientNeeds(e.target.value)}
                        placeholder="Describe special care instructions (e.g. post-cardiac surgery recovery, BP/Sugar monitoring, Ryle's tube, catheter care, wound dressing, dementia care)..."
                        className="w-full p-3 text-sm rounded-xl border border-slate-200 bg-white text-slate-900 outline-none transition-all focus:border-[#c9a24c] focus:ring-2 focus:ring-[#c9a24c]/20 shadow-2xs font-medium"
                      />

                      {/* Quick Tags */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Quick Tags:</span>
                        {["Post-Op Recovery", "Vitals & Sugar Check", "Mobility & Wheelchair", "Dementia & Memory", "Catheter Care", "Wound Dressing", "Bedridden Nursing"].map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => {
                              if (patientNeeds.includes(tag)) return;
                              setPatientNeeds(prev => prev ? `${prev}, ${tag}` : tag);
                            }}
                            className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white hover:bg-amber-100 hover:text-amber-900 text-slate-600 border border-slate-200 transition-all cursor-pointer shadow-2xs"
                          >
                            + {tag}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex items-center justify-between gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => goToBookingStep(1)}
                        className="h-10 sm:h-11 px-3 sm:px-4 rounded-xl border border-slate-200 hover:bg-slate-100 font-bold text-xs text-slate-700 cursor-pointer transition-all shrink-0 flex items-center justify-center"
                      >
                        ← Back
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (validateStep2()) goToBookingStep(3);
                        }}
                        className="h-10 sm:h-11 px-3.5 sm:px-5 bg-[#1e2a5a] hover:bg-[#283870] text-[#c9a24c] hover:text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all shrink-0"
                      >
                        <span>Next: Location &amp; Pay</span>
                        <ChevronRight className="h-4 w-4 shrink-0" />
                      </button>
                    </div>

                  </div>
                )}

                {/* ========================================================================= */}
                {/* 💳 STEP 3: LOCATION & PAYMENT */}
                {/* ========================================================================= */}
                {bookingStep === 3 && (
                  <div className="space-y-5 animate-fade-in">
                    
                    {/* Care Address */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-200/90 shadow-2xs space-y-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                        Care Delivery Address in Hyderabad <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={bookingAddress}
                        onChange={(e) => setBookingAddress(e.target.value)}
                        placeholder="Door/Flat no, building, street, landmark, area & pincode (e.g. Flat 402, Royal Residency, Road 12, Banjara Hills)"
                        className="w-full h-11 sm:h-12 px-3.5 text-sm rounded-xl border border-slate-200 bg-white text-slate-900 outline-none transition-all focus:border-[#c9a24c] focus:ring-2 focus:ring-[#c9a24c]/20 shadow-2xs font-medium"
                      />
                    </div>

                    {/* GPS Pin & Prescription Upload */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {/* GPS Pin */}
                      <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/90 shadow-2xs space-y-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 truncate">
                          Exact GPS Pin <span className="text-slate-400 font-normal lowercase">(for staff navigation)</span>
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            readOnly
                            value={bookingGoogleMapLocation}
                            placeholder="GPS Coordinates"
                            className="min-w-0 flex-1 h-11 px-3 text-xs rounded-xl border border-slate-200 bg-slate-100 text-slate-600 outline-none truncate font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (!navigator.geolocation) return;
                              setIsFetchingLocationBooking(true);
                              navigator.geolocation.getCurrentPosition(
                                (position) => {
                                  const lat = position.coords.latitude;
                                  const lng = position.coords.longitude;
                                  setBookingGoogleMapLocation(`https://www.google.com/maps?q=${lat},${lng}`);
                                  setIsFetchingLocationBooking(false);
                                },
                                () => setIsFetchingLocationBooking(false)
                              );
                            }}
                            disabled={isFetchingLocationBooking}
                            className="h-11 px-3.5 bg-[#1e2a5a] hover:bg-[#283870] text-[#c9a24c] text-xs font-black rounded-xl flex items-center gap-1.5 shrink-0 disabled:opacity-50 cursor-pointer shadow-2xs transition-all whitespace-nowrap"
                          >
                            {isFetchingLocationBooking ? "..." : "📍 GPS"}
                          </button>
                        </div>
                      </div>

                      {/* Doctor Prescription Upload */}
                      <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/90 shadow-2xs space-y-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 truncate">
                          Doctor Prescription / Case File <span className="text-slate-400 font-normal lowercase">(optional)</span>
                        </label>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={(e) => handleCaretakerFileChange(e, setPrescriptionFile)}
                          className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-[#1e2a5a] file:text-[#c9a24c] hover:file:bg-[#283870] cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Clean Luxury Payment Summary Breakdown */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/90 border border-slate-200/90 shadow-2xs space-y-3.5">
                      {/* Header */}
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#0b183b] flex items-center gap-1.5">
                          <span>🧾</span> Payment Summary
                        </span>
                        <span className="text-[10px] sm:text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                          <ShieldCheck className="h-3 w-3 text-emerald-600 shrink-0" />
                          <span>100% Escrow Protected</span>
                        </span>
                      </div>

                      {/* Line Items */}
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between items-center text-slate-600">
                          <span className="font-medium">Base Service ({durationCount} {bookingDuration}):</span>
                          <span className="font-bold text-slate-900 font-mono text-xs sm:text-sm">₹{calculateBaseAmount().toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-600">
                          <span className="font-medium">GST Govt. Tax (18%):</span>
                          <span className="font-bold text-slate-700 font-mono text-xs sm:text-sm">+₹{calculateGST().toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-dashed border-slate-200 text-sm">
                          <span className="font-extrabold text-[#0b183b]">Total Shift Amount:</span>
                          <span className="font-black text-base sm:text-lg text-[#0b183b] font-display">₹{calculateTotal().toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Split Payment Card (Pay Advance vs Post-Shift Balance) */}
                      {calculateAdvance() > 0 ? (
                        <div className="bg-white rounded-xl border border-slate-200/90 p-3 shadow-2xs grid grid-cols-2 divide-x divide-slate-150">
                          <div className="pr-3">
                            <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider block">
                              Pay Advance Now
                            </span>
                            <div className="text-lg sm:text-xl font-black text-emerald-950 font-display mt-0.5">
                              ₹{calculateAdvance().toLocaleString()}
                            </div>
                            <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1 mt-0.5">
                              🔒 Locks Caregiver
                            </span>
                          </div>

                          <div className="pl-3">
                            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                              Post-Shift Balance
                            </span>
                            <div className="text-lg sm:text-xl font-black text-slate-900 font-display mt-0.5">
                              ₹{(calculateTotal() - calculateAdvance()).toLocaleString()}
                            </div>
                            <span className="text-[10px] font-medium text-slate-500 block mt-0.5">
                              Pay after service
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 rounded-xl bg-white border border-slate-200/90 text-xs text-slate-700 flex items-center justify-between">
                          <span className="font-semibold">Pay On Service Completion:</span>
                          <span className="font-black text-sm text-[#0b183b] font-mono">₹{calculateTotal().toLocaleString()}</span>
                        </div>
                      )}

                      {/* Escrow Guarantee Note */}
                      <p className="text-[11px] text-slate-500 leading-normal flex items-start gap-1.5 pt-0.5">
                        <span className="text-emerald-600 font-bold shrink-0">🛡️</span>
                        <span>
                          {calculateAdvance() > 0 ? (
                            <>Advance (<strong>₹{calculateAdvance().toLocaleString()}</strong>) secures verified staff dispatch. Remaining balance is payable only after shift completion.</>
                          ) : (
                            <>No advance required. Pay complete amount directly after caregiver visit.</>
                          )}
                        </span>
                      </p>
                    </div>

                    {/* Terms Agreement & Final Action Buttons */}
                    <div className="pt-2 space-y-4">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          required
                          checked={agreeTermsBooking}
                          onChange={(e) => setAgreeTermsBooking(e.target.checked)}
                          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#1e2a5a] focus:ring-gold cursor-pointer accent-[#c9a24c]"
                        />
                        <span className="text-xs font-semibold text-slate-600 select-none leading-relaxed">
                          I have read and agree to Amma Seva Patient Booking Terms &amp; Escrow Guarantee Policies.
                        </span>
                      </label>

                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => goToBookingStep(2)}
                          className="h-11 sm:h-12 px-3 sm:px-4 rounded-xl border border-slate-200 hover:bg-slate-100 font-bold text-xs text-slate-700 cursor-pointer transition-all shrink-0 flex items-center justify-center"
                        >
                          ← Back
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmitting || isPaymentProcessing || !agreeTermsBooking}
                          className="flex-1 min-w-0 h-11 sm:h-12 px-3 sm:px-4 bg-gradient-to-r from-[#1e2a5a] via-[#091129] to-[#1e2a5a] hover:from-[#283870] hover:to-[#14224c] text-[#c9a24c] hover:text-white rounded-xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer shadow-xl shadow-[#1e2a5a]/25 disabled:opacity-50 transition-all text-center truncate"
                        >
                          {(isSubmitting || isPaymentProcessing) && (
                            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                          )}
                          <span className="truncate">
                            {isPaymentProcessing 
                              ? "Opening Gateway..." 
                              : isSubmitting 
                                ? "Securing Shift..." 
                                : calculateAdvance() > 0
                                  ? `Pay ₹${calculateAdvance().toLocaleString()} Advance & Confirm`
                                  : "Confirm Booking & Dispatch"}
                          </span>
                        </button>
                      </div>
                    </div>

                  </div>
                )}

              </form>
            </div>
          )}

        </div>
      </div>

      {/* Booking SUCCESS Modal overlay */}
      {successBooking && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white border border-slate-200/80 shadow-2xl text-center space-y-6 animate-in zoom-in duration-300 relative overflow-hidden p-8">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-gold to-emerald-500" />
            
            <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-600 border border-emerald-200/80 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
              <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                Payment &amp; Booking Verified
              </span>
              <h3 className="text-2xl font-bold text-primary font-display tracking-tight">
                Booking Confirmed!
              </h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Your care shift has been registered. Our care desk coordinator is assigning your verified caregiver.
              </p>
            </div>

            <div className="bg-slate-50/80 border border-slate-200/70 p-5 rounded-2xl text-left text-xs space-y-2.5 shadow-inner">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">Booking ID</span>
                <span className="font-extrabold text-primary font-mono">#{successBooking.id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">Care Service</span>
                <span className="font-bold text-slate-800">{successBooking.service}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">Duration</span>
                <span className="font-semibold text-slate-700">{successBooking.duration}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">Shift Start</span>
                <span className="font-semibold text-slate-700">{successBooking.date}</span>
              </div>

              {/* Dynamic 18% GST itemized breakdown in success modal */}
              <div className="pt-2 border-t border-slate-200/60 space-y-1.5 text-[11px]">
                <div className="flex justify-between items-center text-slate-600">
                  <span>Base Service Value</span>
                  <span className="font-semibold text-slate-800 font-mono">
                    ₹{(successBooking.baseAmount || Math.round(successBooking.amount / 1.18)).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>18% GST (CGST 9% + SGST 9%)</span>
                  <span className="font-semibold text-amber-800 font-mono">
                    +₹{(successBooking.gstAmount || (successBooking.amount - Math.round(successBooking.amount / 1.18))).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-200/60">
                <span className="text-slate-700 font-bold uppercase tracking-wider text-[10px]">Total Shift Amount</span>
                <span className="font-black text-emerald-700 text-sm font-display">₹{Number(successBooking.amount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-[11px] pt-1">
                <span className="text-emerald-700 font-medium">Advance Paid:</span>
                <span className="font-bold text-emerald-800 font-mono">₹{Number(successBooking.advancePaid || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-amber-800 font-medium">Balance Payable:</span>
                <span className="font-bold text-amber-900 font-mono">₹{Number(successBooking.balanceAmount || 0).toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={() => {
                setSuccessBooking(null);
                setActiveView("bookings");
              }}
              className="btn-primary w-full py-3.5 font-bold uppercase tracking-wider text-xs shadow-lg shadow-primary/20 cursor-pointer"
            >
              View My Bookings &amp; Care Shifts
            </button>
          </div>
        </div>
      )}

      {/* Booking RESCHEDULE Modal Overlay */}
      {rescheduleBookingId && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6 animate-in zoom-in duration-200 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-gold to-primary" />
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gold/15 border border-gold/30 flex items-center justify-center text-primary">
                <RotateCcw className="h-5 w-5 text-gold" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-primary font-display tracking-tight">Reschedule Care Shift</h3>
                <p className="text-xs text-slate-400">Shift #{rescheduleBookingId}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    New Care Date
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">Today or future date</span>
                </div>
                <input
                  type="date"
                  required
                  min={todayStr}
                  max="2099-12-31"
                  value={rescheduleDate}
                  onChange={(e) => {
                    let val = e.target.value;
                    if (val) {
                      const parts = val.split("-");
                      if (parts[0] && parts[0].length > 4) {
                        parts[0] = parts[0].slice(0, 4);
                        val = parts.join("-");
                      }
                      if (val.length === 10 && val < todayStr) {
                        alert("Reschedule date cannot be in the past. Please select today or a future date.");
                        val = todayStr;
                      }
                    }
                    setRescheduleDate(val);
                  }}
                  className={`w-full px-4 py-3 text-sm rounded-2xl border bg-slate-50/60 text-slate-900 outline-none focus:bg-white focus:border-gold focus:ring-4 focus:ring-gold/15 cursor-pointer font-semibold ${
                    rescheduleDate && rescheduleDate.length === 10 && rescheduleDate < todayStr
                      ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/20"
                      : "border-slate-200"
                  }`}
                />
                {rescheduleDate && rescheduleDate.length === 10 && rescheduleDate < todayStr && (
                  <p className="text-[11px] text-rose-500 mt-1 font-semibold flex items-center gap-1">
                    ⚠️ Reschedule date cannot be in the past.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                  New Start Time
                </label>
                <input
                  type="time"
                  required
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="w-full px-4 py-3 text-sm rounded-2xl border border-slate-200 bg-slate-50/60 text-slate-900 outline-none focus:bg-white focus:border-gold focus:ring-4 focus:ring-gold/15 cursor-pointer font-semibold"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setRescheduleBookingId(null)}
                className="btn-outline flex-1 py-3 text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleReschedule}
                className="btn-primary flex-1 py-3 text-xs font-bold uppercase tracking-wider cursor-pointer shadow-lg shadow-primary/20"
              >
                Confirm Shift
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Modal Details View - Guaranteed Single-Page A4 Layout */}
      {activeInvoice && (() => {
        const invBase = activeInvoice.baseAmount !== undefined && activeInvoice.baseAmount !== null
          ? Number(activeInvoice.baseAmount)
          : Math.round(Number(activeInvoice.amount) / 1.18);
        const invGst = activeInvoice.gstAmount !== undefined && activeInvoice.gstAmount !== null
          ? Number(activeInvoice.gstAmount)
          : (Number(activeInvoice.amount) - invBase);
        const invCgst = Math.round(invGst / 2);
        const invSgst = invGst - invCgst;
        const invTotal = Number(activeInvoice.amount);
        const invAdvPaid = activeInvoice.advancePaid !== undefined && activeInvoice.advancePaid !== null
          ? Number(activeInvoice.advancePaid)
          : (activeInvoice.paymentStatus === 'Paid' ? invTotal : 0);
        const invBalance = activeInvoice.balanceAmount !== undefined && activeInvoice.balanceAmount !== null
          ? Number(activeInvoice.balanceAmount)
          : Math.max(0, invTotal - invAdvPaid);

        return (
          <div id="invoice-modal-root" className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-fade-in overflow-y-auto">
            <div className="w-full max-w-2xl sm:max-w-3xl rounded-2xl bg-white p-4 sm:p-6 border border-slate-300 shadow-2xl space-y-3.5 animate-in zoom-in duration-150 relative my-auto">
              
              {/* Invoice Printable Sheet */}
              <div id="invoice-sheet" className="space-y-3 text-slate-800 bg-white">
                
                {/* 1. Header: Brand / Corporate & Invoice Identification */}
                <div className="flex justify-between items-start gap-3 border-b-2 border-[#1e2a5a] pb-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-black font-display text-[#1e2a5a] tracking-tight">AMMA SEVA</span>
                      <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-300">
                        TAX INVOICE
                      </span>
                    </div>
                    <p className="text-[11px] font-bold text-slate-700">LUXDHANA GLOBAL PRIVATE LIMITED</p>
                    <p className="text-[9.5px] text-slate-500 leading-tight">
                      GSTIN: <strong className="font-mono text-slate-900">36AAACL8921M1ZT</strong> &nbsp;|&nbsp; State Code: <strong>36 (Telangana)</strong><br />
                      8-2-630/B/B/1, Mount Banjara complex, Rd #12, Banjara Hills, Hyderabad - 500034<br />
                      Helpdesk: +91 94945 16543 &nbsp;|&nbsp; Email: support@ammaseva.in &nbsp;|&nbsp; www.ammaseva.in
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="inline-block bg-slate-100 px-2.5 py-1 rounded border border-slate-300 mb-1">
                      <span className="text-[9px] font-extrabold text-slate-600 uppercase tracking-widest block">Original for Recipient</span>
                      <span className="text-sm font-black text-[#1e2a5a] font-mono block">#INV-{activeInvoice.id}</span>
                    </div>
                    <div className="text-[10px] text-slate-600 font-medium">
                      Date: <strong className="text-slate-900">{new Date(activeInvoice.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</strong>
                    </div>
                    <div className="mt-1">
                      <span className={`inline-block text-[9px] font-extrabold px-2 py-0.5 rounded border uppercase tracking-wider ${
                        activeInvoice.paymentStatus === 'Paid'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : activeInvoice.paymentStatus === 'Advance Paid'
                            ? 'bg-blue-50 text-blue-800 border-blue-300'
                            : 'bg-amber-50 text-amber-800 border-amber-300'
                      }`}>
                        {activeInvoice.paymentStatus || 'Pay on Service'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Client & Service Delivery Details (2-Column Compact Grid) */}
                <div className="grid grid-cols-2 gap-3 text-[10.5px]">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="block text-slate-400 font-extrabold text-[8.5px] uppercase tracking-wider mb-0.5">Billed To (Client / Patient)</span>
                    <span className="block font-bold text-slate-900 text-xs">{activeInvoice.name || user?.name || "Valued Client"}</span>
                    <span className="block text-slate-600 font-mono">{activeInvoice.phone || user?.phone || "—"}</span>
                    <span className="block text-slate-600">{activeInvoice.email || user?.email || "—"}</span>
                    {activeInvoice.patientName && (
                      <div className="mt-1 pt-1 border-t border-slate-200 text-[10px] text-slate-700">
                        Patient: <strong>{activeInvoice.patientName}</strong> {activeInvoice.patientAge ? `(${activeInvoice.patientAge} yrs)` : ''}
                      </div>
                    )}
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="block text-slate-400 font-extrabold text-[8.5px] uppercase tracking-wider mb-0.5">Service Delivery Details</span>
                    <span className="block font-bold text-[#1e2a5a] text-xs">{activeInvoice.service}</span>
                    <span className="block text-slate-700">
                      Schedule: <strong>{activeInvoice.date}</strong> at <strong>{activeInvoice.time}</strong> ({activeInvoice.duration})
                    </span>
                    <span className="block text-slate-600 truncate" title={activeInvoice.address}>
                      Location: {activeInvoice.address}
                    </span>
                    <span className="block text-[9px] text-slate-500 mt-0.5">
                      Place of Supply: <strong>Telangana (36)</strong>
                    </span>
                  </div>
                </div>

                {/* 3. Itemized Tax Invoice Breakdown Table */}
                <div className="overflow-hidden rounded-xl border border-slate-300 text-[10.5px]">
                  <table className="w-full text-left invoice-table border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-800 text-[9.5px] uppercase tracking-wider">
                        <th className="py-1.5 px-3">Service &amp; Scope Description</th>
                        <th className="py-1.5 px-2.5 text-center">HSN / SAC</th>
                        <th className="py-1.5 px-2.5 text-center">Duration</th>
                        <th className="py-1.5 px-3 text-right">Taxable Value (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      <tr className="text-slate-800">
                        <td className="py-2 px-3 font-semibold text-[#1e2a5a]">
                          {activeInvoice.service}
                          <span className="block text-[9px] font-normal text-slate-500">Verified Healthcare &amp; Caregiver Support Assistance</span>
                        </td>
                        <td className="py-2 px-2.5 text-center font-mono text-slate-600">999312</td>
                        <td className="py-2 px-2.5 text-center text-slate-700">{activeInvoice.duration}</td>
                        <td className="py-2 px-3 text-right font-bold text-slate-900 font-mono">
                          ₹{invBase.toLocaleString()}
                        </td>
                      </tr>
                    </tbody>
                    <tfoot className="bg-slate-50/80 divide-y divide-slate-200 font-medium">
                      <tr>
                        <td colSpan={3} className="py-1 px-3 text-right text-slate-600">Base Taxable Subtotal:</td>
                        <td className="py-1 px-3 text-right font-bold text-slate-900 font-mono">₹{invBase.toLocaleString()}</td>
                      </tr>
                      <tr className="text-slate-600 text-[10px]">
                        <td colSpan={3} className="py-1 px-3 text-right">CGST (Central Tax @ 9.0%):</td>
                        <td className="py-1 px-3 text-right font-mono text-slate-800">₹{invCgst.toLocaleString()}</td>
                      </tr>
                      <tr className="text-slate-600 text-[10px]">
                        <td colSpan={3} className="py-1 px-3 text-right">SGST (State Tax @ 9.0%):</td>
                        <td className="py-1 px-3 text-right font-mono text-slate-800">₹{invSgst.toLocaleString()}</td>
                      </tr>
                      <tr className="text-amber-900 bg-amber-50/60 font-semibold text-[10.5px]">
                        <td colSpan={3} className="py-1 px-3 text-right">Total 18% GST (CGST 9% + SGST 9%):</td>
                        <td className="py-1 px-3 text-right font-bold text-amber-900 font-mono">+₹{invGst.toLocaleString()}</td>
                      </tr>
                      <tr className="bg-slate-100 text-slate-900 font-bold border-t-2 border-slate-400">
                        <td colSpan={3} className="py-1.5 px-3 text-right uppercase tracking-wider text-[10px] text-[#1e2a5a]">
                          Total Shift Value (incl. 18% GST):
                        </td>
                        <td className="py-1.5 px-3 text-right text-sm font-black text-[#1e2a5a] font-display">
                          ₹{invTotal.toLocaleString()}
                        </td>
                      </tr>
                      {invAdvPaid > 0 ? (
                        <tr className="text-emerald-800 bg-emerald-50 font-semibold">
                          <td colSpan={3} className="py-1 px-3 text-right text-[10px]">✓ Advance Paid (Escrow Locked):</td>
                          <td className="py-1 px-3 text-right font-bold text-emerald-800 font-mono">-₹{invAdvPaid.toLocaleString()}</td>
                        </tr>
                      ) : null}
                      <tr className="text-slate-900 bg-slate-50 font-bold border-t border-slate-300">
                        <td colSpan={3} className="py-1.5 px-3 text-right text-[10px] uppercase tracking-wider">
                          Post-Shift Balance Due:
                        </td>
                        <td className="py-1.5 px-3 text-right text-xs font-black text-slate-900 font-display">
                          ₹{invBalance.toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* 4. Payment Guarantee & Authorized Seal Row */}
                <div className="grid grid-cols-2 gap-3 items-center pt-1 border-t border-slate-200 text-[9.5px]">
                  <div className="p-2 rounded-lg bg-emerald-50/70 border border-emerald-200 text-emerald-950 space-y-0.5">
                    <span className="font-bold flex items-center gap-1 text-[10px] text-emerald-900">
                      🛡️ Amma Seva Escrow &amp; Shift Guarantee
                    </span>
                    <p className="text-[9px] text-emerald-800 leading-tight">
                      Payment Mode: <strong>{activeInvoice.paymentMethod === 'razorpay' ? 'Razorpay Online Gateway (UPI/Card)' : 'Pay on Service / Offline Escrow'}</strong><br />
                      Advance is safely escrow-held until verified caregiver arrival &amp; shift fulfillment.
                    </p>
                  </div>

                  <div className="text-right space-y-0.5">
                    <p className="text-[9px] font-extrabold text-slate-600 uppercase tracking-wider">For LUXDHANA GLOBAL PRIVATE LIMITED</p>
                    <div className="h-6 flex items-center justify-end">
                      <span className="font-display font-bold text-xs text-[#1e2a5a] tracking-wider italic">Amma Seva Healthcare</span>
                    </div>
                    <p className="text-[8.5px] text-slate-500 font-medium">Authorized Digital Signatory</p>
                  </div>
                </div>

                {/* 5. Compact 1-Page Declaration Footer */}
                <div className="border-t border-slate-200 pt-1.5 text-center text-[8.5px] text-slate-400">
                  This is a computer-generated GST Tax Invoice compliant with Section 31 of CGST Act, 2017. Issued by Luxdhana Global Pvt. Ltd.
                </div>

              </div>

              {/* Action Buttons (Excluded from Print) */}
              <div className="no-print flex gap-3 border-t border-slate-200 pt-3">
                <button
                  type="button"
                  onClick={() => setActiveInvoice(null)}
                  className="btn-outline flex-1 py-2.5 text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Close View
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="btn-primary flex-1 py-2.5 text-xs font-bold uppercase tracking-wider cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                >
                  <Download className="h-4 w-4" /> Print / Save PDF (1-Page)
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* Booking EDIT DETAILS Modal Overlay */}
      {isEditModalOpen && editBookingId && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-5 animate-in zoom-in duration-200 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-gold to-primary" />
            
            <div>
              <h3 className="text-xl font-bold text-primary font-display tracking-tight">Edit Care Details</h3>
              <p className="text-xs text-slate-400 mt-0.5">Booking Shift #{editBookingId}</p>
            </div>

            <div className="space-y-4 max-h-[350px] overflow-y-auto px-1">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Patient Full Name</label>
                <input
                  type="text"
                  required
                  value={editPatientName}
                  onChange={(e) => setEditPatientName(sanitizeName(e.target.value))}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50/60 outline-none focus:bg-white focus:border-gold focus:ring-4 focus:ring-gold/15 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex justify-between">
                  <span>Patient Age</span>
                  <span className="text-[10px] text-slate-400">Max 2 Digits</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={2}
                  required
                  value={editPatientAge}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 2);
                    setEditPatientAge(val);
                  }}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50/60 outline-none focus:bg-white focus:border-gold focus:ring-4 focus:ring-gold/15 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Patient Specific Needs</label>
                <textarea
                  value={editPatientNeeds}
                  onChange={(e) => setEditPatientNeeds(e.target.value)}
                  placeholder="Describe patient health status and daily care needs..."
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50/60 outline-none focus:bg-white focus:border-gold focus:ring-4 focus:ring-gold/15 min-h-[60px] font-medium leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Care Address</label>
                <textarea
                  required
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50/60 outline-none focus:bg-white focus:border-gold focus:ring-4 focus:ring-gold/15 min-h-[60px] font-medium leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Google Maps Location Link</label>
                <input
                  type="text"
                  value={editGoogleMapLocation}
                  onChange={(e) => setEditGoogleMapLocation(e.target.value)}
                  placeholder="https://maps.google.com/..."
                  className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50/60 outline-none focus:bg-white focus:border-gold focus:ring-4 focus:ring-gold/15 font-mono"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setIsEditModalOpen(false)}
                disabled={isSavingDetails}
                className="btn-outline flex-1 py-3 text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDetails}
                disabled={isSavingDetails}
                className="btn-primary flex-1 py-3 text-xs font-bold uppercase tracking-wider cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-primary/20"
              >
                {isSavingDetails ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Details"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DOCUMENT PREVIEW MODAL */}
      <DocumentViewerModal
        isOpen={docViewerState.isOpen}
        onClose={() => setDocViewerState(s => ({ ...s, isOpen: false }))}
        docUrl={docViewerState.docUrl}
        docTitle={docViewerState.docTitle}
        applicantName={docViewerState.applicantName}
        category={docViewerState.category}
      />

    </SiteLayout>
  );
}
