import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { fetchServices, type Service } from "../lib/services";
import { 
  Calendar, Clock, MapPin, User, FileText, CheckCircle2, 
  AlertTriangle, RefreshCw, XCircle, Download, CreditCard, 
  Phone, Briefcase, ChevronRight, Check, DollarSign, QrCode
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
  const [activeView, setActiveView] = useState<"bookings" | "new-booking">("bookings");
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

  // New Booking State
  const [selectedServiceId, setSelectedServiceId] = useState("elderly");
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("09:00");
  const [bookingDuration, setBookingDuration] = useState("Daily");
  const [durationCount, setDurationCount] = useState<number>(1);
  const [bookingAddress, setBookingAddress] = useState("");
  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [patientNeeds, setPatientNeeds] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"pay_later" | "razorpay">("razorpay");
  
  const [prescriptionFile, setPrescriptionFile] = useState("");
  const [bookingGoogleMapLocation, setBookingGoogleMapLocation] = useState("");
  const [isFetchingLocationBooking, setIsFetchingLocationBooking] = useState(false);
  const [agreeTermsBooking, setAgreeTermsBooking] = useState(false);
 
  // Booking result/modals state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  const [successBooking, setSuccessBooking] = useState<any | null>(null);
 
  // Action Modals State
  const [rescheduleBookingId, setRescheduleBookingId] = useState<number | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  
  const [activeInvoice, setActiveInvoice] = useState<Booking | null>(null);
  const hasServiceParam = !!(new URLSearchParams(window.location.search).get("service"));
 
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
      fetchCaretakerBookings();
      fetchAnnouncements('caretaker');
    } else if (userToken && userDetails) {
      setIsCaretaker(false);
      setUser(JSON.parse(userDetails));
      fetchAnnouncements('user');
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
          else unit = "day";
        }

        return {
          id: s.slug,
          title: s.title,
          rate: rate,
          unit: unit,
          desc: s.short || s.description
        };
      });
      if (formatted.length > 0) {
        setServicesList(formatted);
        
        // Pre-select service from URL query params if present
        const urlParams = new URLSearchParams(window.location.search);
        const preSelectedService = urlParams.get("service");
        const matchingService = formatted.find(s => s.id === preSelectedService);
        if (matchingService) {
          setSelectedServiceId(matchingService.id);
          setActiveView("new-booking");
        } else {
          setSelectedServiceId(formatted[0].id);
        }
      }
    });
  }, []);

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

  // Automatically adjust billing option based on selected service's pricing unit
  useEffect(() => {
    const current = servicesList.find(s => s.id === selectedServiceId) || servicesList[0];
    if (!current) return;
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
  
  const getServiceRates = () => {
    if (!currentService) return { hourly: 0, daily: 0, weekly: 0, monthly: 0, basis: 'day' };
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

  const calculateTotal = () => {
    const rates = getServiceRates();
    const count = Number(durationCount) || 1;
    switch (bookingDuration) {
      case "Hourly": return rates.hourly * count;
      case "Daily": return rates.daily * count;
      case "Weekly": return rates.weekly * count;
      case "Monthly": return rates.monthly * count;
      default: return rates.daily * count;
    }
  };
 
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
 
    const submitBooking = async (payStatus: string) => {
      try {
        const token = localStorage.getItem("ammaseva_user_token");
        const formattedDuration = `${durationCount} ${
          bookingDuration === "Hourly" ? (durationCount === 1 ? "Hour" : "Hours") :
          bookingDuration === "Daily" ? (durationCount === 1 ? "Day" : "Days") :
          bookingDuration === "Weekly" ? (durationCount === 1 ? "Week" : "Weeks") :
          (durationCount === 1 ? "Month" : "Months")
        }`;

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
            duration: formattedDuration,
            address: bookingAddress,
            amount: calculateTotal(),
            patientName,
            patientAge,
            patientNeeds,
            paymentMethod,
            paymentStatus: payStatus,
            userId: user.id,
            prescription: prescriptionFile,
            googleMapLocation: bookingGoogleMapLocation
          })
        });
        if (res.status === 401) {
          handleLogout();
          return;
        }
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
        setPrescriptionFile("");
        setBookingGoogleMapLocation("");
        setAgreeTermsBooking(false);
        setDurationCount(1);
      } catch (err: any) {
        alert("Booking failed: " + err.message);
      } finally {
        setIsSubmitting(false);
      }
    };

    if (paymentMethod === "razorpay") {
      if (!(window as any).Razorpay) {
        alert("Razorpay payment SDK not loaded yet. Please try again in a few seconds.");
        setIsSubmitting(false);
        return;
      }
      try {
        const orderRes = await fetch("/api/payment/order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: calculateTotal() })
        });
        const orderData = await orderRes.json();
        if (!orderRes.ok) {
          throw new Error(orderData.error || "Failed to initiate online payment order.");
        }

        const options = {
          key: "rzp_test_SwedUUn1KgRMs0",
          amount: orderData.amount,
          currency: orderData.currency,
          name: "Amma Seva",
          description: `Care Booking - ${currentService.title}`,
          order_id: orderData.orderId,
          handler: async function (response: any) {
            setIsSubmitting(true);
            try {
              const token = localStorage.getItem("ammaseva_user_token");
              const formattedDuration = `${durationCount} ${
                bookingDuration === "Hourly" ? (durationCount === 1 ? "Hour" : "Hours") :
                bookingDuration === "Daily" ? (durationCount === 1 ? "Day" : "Days") :
                bookingDuration === "Weekly" ? (durationCount === 1 ? "Week" : "Weeks") :
                (durationCount === 1 ? "Month" : "Months")
              }`;

              const res = await fetch("/api/booking", {
                method: "POST",
                headers: { 
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                  name: user.name,
                  phone: user.phone,
                  email: user.email,
                  service: currentService.title,
                  date: bookingDate,
                  time: bookingTime,
                  duration: formattedDuration,
                  address: bookingAddress,
                  amount: calculateTotal(),
                  patientName,
                  patientAge,
                  patientNeeds,
                  paymentMethod: "razorpay",
                  userId: user.id,
                  prescription: prescriptionFile,
                  googleMapLocation: bookingGoogleMapLocation,
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
                throw new Error(data.error || "Booking submission error.");
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
            } catch (err: any) {
              alert("Booking failed: " + err.message);
            } finally {
              setIsSubmitting(false);
            }
          },
          prefill: {
            name: user.name,
            email: user.email,
            contact: user.phone
          },
          theme: {
            color: "#0e2254"
          },
          modal: {
            ondismiss: function() {
              setIsSubmitting(false);
            }
          }
        };
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } catch (err: any) {
        alert("Payment initialization failed: " + err.message);
        setIsSubmitting(false);
      }
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

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground font-medium">Verifying credentials...</p>
        </div>
      </div>
    );
  }

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
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-sm text-slate-500">Welcome back, <span className="font-semibold text-slate-800">{caretakerName || caretaker?.name || "Caregiver"}</span></p>
                    {caretaker?.rating > 0 && (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100 flex items-center gap-0.5 shrink-0">
                        ⭐ {caretaker.rating} ({caretaker.reviews?.length || 0} reviews)
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                className="btn-outline px-4 py-2 text-xs font-semibold flex items-center gap-1.5 cursor-pointer rounded-lg text-slate-600"
              >
                Sign Out
              </button>
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

            {/* My Assigned Patient Shifts Card */}
            {caretaker?.status === "Verified" && (
              <div className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200/60 shadow-sm space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-primary font-display flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-indigo-600" /> My Assigned Patient Shifts
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">Below are the patient homecare shifts you have been assigned to by the administrator.</p>
                </div>

                {isLoading ? (
                  <div className="flex justify-center py-6">
                    <RefreshCw className="h-6 w-6 text-indigo-600 animate-spin" />
                  </div>
                ) : caretakerBookings.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center text-slate-500">
                    <Clock className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-semibold">No assigned shifts yet</p>
                    <p className="text-xs text-slate-400 mt-0.5">You will be notified once a customer booking is allocated to your profile.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {caretakerBookings.map((shift: any) => (
                      <div key={shift.id} className="rounded-2xl border border-slate-100 bg-slate-50/50 p-6 space-y-4 hover:border-indigo-100 transition-colors">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Shift #{shift.id}</span>
                            <h4 className="text-base font-bold text-slate-800">{shift.service}</h4>
                          </div>
                          <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${
                            shift.status === "Confirmed" ? "bg-emerald-50 text-emerald-800 border-emerald-100" :
                            shift.status === "Completed" ? "bg-indigo-50 text-indigo-800 border-indigo-100" :
                            "bg-amber-50 text-amber-800 border-amber-100"
                          }`}>
                            {shift.status}
                          </span>
                        </div>

                        {/* Patient & Care Details Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs pt-3 border-t border-slate-100/80">
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
                            <a href={`tel:${shift.phone}`} className="font-semibold text-indigo-600 hover:underline flex items-center gap-1">
                              <Phone className="h-3.5 w-3.5" /> {shift.phone}
                            </a>
                          </div>
                          <div>
                            <span className="text-slate-400 block mb-0.5">Shift Remuneration</span>
                            <span className="font-bold text-slate-800">₹{shift.amount}</span>
                          </div>
                        </div>

                        {shift.address && (
                          <div className="text-xs pt-2 border-t border-slate-100/60">
                            <span className="text-slate-400 block mb-0.5">Patient Care Address</span>
                            <span className="text-slate-700 flex items-start gap-1">
                              <MapPin className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" /> {shift.address}
                            </span>
                          </div>
                        )}

                        {shift.patientNeeds && (
                          <div className="text-xs bg-indigo-50/30 border border-indigo-100/20 p-3 rounded-xl">
                            <span className="text-indigo-600 font-bold block mb-0.5 uppercase tracking-wider text-[10px]">Special Instructions & Patient Needs</span>
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
                            ) : null}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
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

                  {/* Address Section */}
                  <div className="md:col-span-2 border border-slate-100 rounded-2xl p-4 bg-slate-50/50 space-y-4">
                    <div className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-1.5">
                      Address Details
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">State</label>
                        <select
                          required
                          value={caretakerState}
                          onChange={(e) => setCaretakerState(e.target.value)}
                          className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-background outline-none focus:ring-2 focus:ring-gold"
                        >
                          <option value="">Select State</option>
                          {INDIAN_STATES.map((st) => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">City</label>
                        <input
                          type="text"
                          required
                          value={caretakerCity}
                          onChange={(e) => setCaretakerCity(e.target.value)}
                          placeholder="e.g. Hyderabad"
                          className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-background outline-none focus:ring-2 focus:ring-gold"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Google Map Location</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          readOnly
                          required
                          value={caretakerGoogleMapLocation}
                          placeholder="Fetch map coordinates..."
                          className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-100 outline-none truncate"
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
                          className="px-3 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1 shrink-0 disabled:opacity-50 cursor-pointer"
                        >
                          {isFetchingLocation ? "Fetching..." : "Fetch GPS Location"}
                        </button>
                      </div>
                      {caretakerGoogleMapLocation && (
                        <div className="flex items-center justify-between text-[10px] mt-1">
                          <span className="text-emerald-600 font-semibold flex items-center gap-1">
                            ✓ Geolocation fetched!
                          </span>
                          <a
                            href={caretakerGoogleMapLocation}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:underline font-semibold"
                          >
                            Open on Google Maps
                          </a>
                        </div>
                      )}
                    </div>
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
                      <label className="block text-[11px] font-bold text-slate-600">Educational Qualification Cert(s)</label>
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

                    {/* Experience Certificate */}
                    <div className="space-y-2">
                      <label className="block text-[11px] font-bold text-slate-600">Experience Certificate(s)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={(e) => handleCaretakerFileChange(e, setCaretakerExperienceCertificate)}
                          className="w-full text-[11px] text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                        />
                      </div>
                      {caretakerExperienceCertificate ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                          ✓ Document Uploaded
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 font-semibold bg-slate-50 px-2 py-0.5 rounded-full">
                          Optional Document
                        </span>
                      )}
                    </div>

                    {/* Police Verification */}
                    <div className="space-y-2">
                      <label className="block text-[11px] font-bold text-slate-600">Police Verification Cert (Mandatory for Non-Local)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={(e) => handleCaretakerFileChange(e, setCaretakerPoliceVerification)}
                          className="w-full text-[11px] text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                        />
                      </div>
                      {caretakerPoliceVerification ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                          ✓ Document Uploaded
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 font-semibold bg-slate-50 px-2 py-0.5 rounded-full">
                          Optional / Pending
                        </span>
                      )}
                    </div>

                    {/* Additional Certificates */}
                    <div className="space-y-2 md:col-span-3">
                      <label className="block text-[11px] font-bold text-slate-600">Any Additional Certification(s) relevant</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={(e) => handleCaretakerFileChange(e, setCaretakerAdditionalCertificates)}
                          className="w-full text-[11px] text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                        />
                      </div>
                      {caretakerAdditionalCertificates ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                          ✓ Document Uploaded
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 font-semibold bg-slate-50 px-2 py-0.5 rounded-full">
                          Optional
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
          {/* Announcement Banners for Customer */}
          {announcements.map((ann) => (
            <div key={ann.id} className="bg-gradient-to-r from-amber-600 to-amber-700 text-white px-6 py-4 rounded-3xl flex items-center justify-between shadow-sm border border-amber-600/50 mb-6">
              <div className="flex items-center gap-3">
                <span className="text-xl animate-bounce">📢</span>
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-amber-100">Broadcaster Alert</span>
                  <p className="text-sm font-semibold">{ann.message}</p>
                </div>
              </div>
              <span className="text-[10px] text-amber-200 font-semibold shrink-0 ml-4">{new Date(ann.createdAt).toLocaleDateString()}</span>
            </div>
          ))}

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
                                  booking.status === "Confirmed" || booking.status === "Active" || booking.status === "Completed"
                                    ? "bg-emerald-500 text-white shadow-sm"
                                    : "bg-slate-100 text-slate-400"
                                }`}>
                                  {booking.status === "Confirmed" || booking.status === "Active" || booking.status === "Completed" ? <Check className="h-3.5 w-3.5" /> : "2"}
                                </div>
                                <span className="block text-[9px] font-bold text-slate-700 mt-1">Confirmed</span>
                              </div>
 
                              {/* Step 3: Caretaker Assigned */}
                              <div className="text-center">
                                <div className={`h-6 w-6 rounded-full flex items-center justify-center mx-auto text-xs font-bold ${
                                  (booking.status === "Confirmed" || booking.status === "Active" || booking.status === "Completed") && booking.assignedStaff
                                    ? "bg-emerald-500 text-white shadow-sm"
                                    : "bg-slate-100 text-slate-400"
                                }`}>
                                  {(booking.status === "Confirmed" || booking.status === "Active" || booking.status === "Completed") && booking.assignedStaff ? <Check className="h-3.5 w-3.5" /> : "3"}
                                </div>
                                <span className="block text-[9px] font-bold text-slate-700 mt-1">
                                  {booking.status === "Active" ? "Staff Active at Home" : "Staff Assigned"}
                                </span>
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
                                <a 
                                  href={booking.prescription} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="text-[10px] text-emerald-600 hover:underline font-bold block"
                                >
                                  📄 Doctor Prescription / Case File
                                </a>
                              )}
                            </div>
                          </div>
                        )}

                        {booking.caregiverDetails && (
                          <div className="mt-4 border border-indigo-100 bg-indigo-50/20 p-5 rounded-2xl space-y-4">
                            <div className="flex justify-between items-center pb-2 border-b border-indigo-100/50">
                              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5 font-display">
                                <User className="h-4 w-4" /> Assigned Caregiver Profile
                              </span>
                              <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 font-semibold">Verified Professional</span>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                              {booking.caregiverDetails.profilePhoto ? (
                                <img 
                                  src={booking.caregiverDetails.profilePhoto} 
                                  className="h-16 w-16 rounded-full object-cover border border-slate-200 shadow-sm shrink-0" 
                                  alt={booking.caregiverDetails.name} 
                                />
                              ) : (
                                <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 shrink-0 border border-slate-200 shadow-sm">
                                  <User className="h-8 w-8" />
                                </div>
                              )}
                              
                              <div className="flex-1 space-y-1 text-center sm:text-left min-w-0">
                                <h4 className="text-base font-bold text-slate-800">{booking.caregiverDetails.name}</h4>
                                <div className="flex flex-wrap justify-center sm:justify-start gap-x-3 gap-y-1 text-xs text-slate-500">
                                  <span>Role: <strong className="text-slate-700 font-semibold">{booking.caregiverDetails.specialty}</strong></span>
                                  <span>•</span>
                                  <span>Experience: <strong className="text-slate-700 font-semibold">{booking.caregiverDetails.experience}+ years</strong></span>
                                </div>
                                {booking.caregiverDetails.experienceDetails && (
                                  <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed italic">
                                    &ldquo;{booking.caregiverDetails.experienceDetails}&rdquo;
                                  </p>
                                )}
                              </div>

                              <div className="shrink-0 pt-1">
                                <a 
                                  href={`tel:${booking.caregiverDetails.phone}`} 
                                  className="btn-primary inline-flex items-center gap-1.5 text-xs py-2 px-4 shadow-sm"
                                >
                                  <Phone className="h-3.5 w-3.5" /> Call Caregiver
                                </a>
                              </div>
                            </div>
                          </div>
                        )}

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
                                    {isReviewSubmitting ? <RefreshCw className="h-3 w-3 animate-spin" /> : "Submit Care Review"}
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
                      disabled={hasServiceParam}
                      className={`w-full px-3 py-2 text-sm rounded-md border border-slate-200 bg-background outline-none focus:ring-2 focus:ring-gold ${
                        hasServiceParam ? 'bg-slate-100/80 cursor-not-allowed text-slate-500' : ''
                      }`}
                    >
                      {servicesList
                        .filter(s => !hasServiceParam || s.id === selectedServiceId)
                        .map(s => (
                          <option key={s.id} value={s.id}>{s.title} (₹{s.rate}/{s.unit})</option>
                        ))
                      }
                    </select>
                    <p className="text-[10px] text-slate-400 mt-1.5">{currentService?.desc}</p>
                  </div>

                  {/* Duration Selector */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Billing Option</label>
                    <select
                      value={bookingDuration}
                      onChange={(e) => {
                        setBookingDuration(e.target.value);
                        setDurationCount(1);
                      }}
                      className="w-full px-3 py-2 text-sm rounded-md border border-slate-200 bg-background outline-none focus:ring-2 focus:ring-gold"
                    >
                      <option value="Hourly">Hourly</option>
                      <option value="Daily">Daily</option>
                      <option value="Weekly">Weekly</option>
                      <option value="Monthly">Monthly</option>
                    </select>
                  </div>

                  {/* Duration Count Multiplier */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex justify-between items-center">
                      <span>
                        {bookingDuration === "Hourly" ? "Number of Hours" :
                         bookingDuration === "Daily" ? "Number of Days" :
                         bookingDuration === "Weekly" ? "Number of Weeks" : "Number of Months"}
                      </span>
                      <span className="text-[10px] text-indigo-600 font-bold lowercase normal-case">
                        (₹{
                          bookingDuration === "Hourly" ? getServiceRates().hourly :
                          bookingDuration === "Daily" ? getServiceRates().daily :
                          bookingDuration === "Weekly" ? getServiceRates().weekly :
                          getServiceRates().monthly
                        } / {
                          bookingDuration === "Hourly" ? "hour" :
                          bookingDuration === "Daily" ? "day" :
                          bookingDuration === "Weekly" ? "week" : "month"
                        })
                      </span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={durationCount}
                      onChange={(e) => setDurationCount(Math.max(1, Number(e.target.value)))}
                      className="w-full px-3 py-2 text-sm rounded-md border border-slate-200 bg-background outline-none focus:ring-2 focus:ring-gold"
                    />
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

                {/* Google Map Location */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Google Map Location</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      required
                      value={bookingGoogleMapLocation}
                      placeholder="Fetch map coordinates..."
                      className="flex-1 px-3 py-2 text-xs rounded-md border border-slate-200 bg-slate-100 outline-none truncate"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!navigator.geolocation) {
                          alert("Geolocation is not supported by your browser");
                          return;
                        }
                        setIsFetchingLocationBooking(true);
                        navigator.geolocation.getCurrentPosition(
                          (position) => {
                            const lat = position.coords.latitude;
                            const lng = position.coords.longitude;
                            setBookingGoogleMapLocation(`https://www.google.com/maps?q=${lat},${lng}`);
                            setIsFetchingLocationBooking(false);
                          },
                          (err) => {
                            alert("Failed to fetch location. Please ensure location permissions are enabled.");
                            setIsFetchingLocationBooking(false);
                          }
                        );
                      }}
                      disabled={isFetchingLocationBooking}
                      className="px-3 py-2 bg-gold hover:bg-gold/90 text-slate-900 text-xs font-semibold rounded-md flex items-center gap-1 shrink-0 disabled:opacity-50 cursor-pointer"
                    >
                      {isFetchingLocationBooking ? "Fetching..." : "Fetch GPS Location"}
                    </button>
                  </div>
                  {bookingGoogleMapLocation && (
                    <div className="flex justify-between items-center text-[10px] mt-1.5">
                      <span className="text-emerald-600 font-semibold flex items-center gap-1">
                        ✓ Exact Geolocation fetched successfully!
                      </span>
                      <a
                        href={bookingGoogleMapLocation}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:underline font-semibold"
                      >
                        Preview Map Pin
                      </a>
                    </div>
                  )}
                </div>

                {/* Document Upload: doctor prescription or Case file */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Doctor Prescription or Case of the File (PDF/Image)</label>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    required
                    onChange={(e) => handleCaretakerFileChange(e, setPrescriptionFile)}
                    className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                  />
                  {prescriptionFile && (
                    <p className="text-[10px] text-emerald-600 mt-1 font-semibold">✓ Document loaded successfully</p>
                  )}
                </div>

                {/* Payment selection */}
                <div className="border-t border-slate-100 pt-6">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Payment Method</label>
                  <div className="p-4 border border-gold bg-gold/5 text-gold rounded-xl flex items-center gap-4">
                    <div className="p-2.5 rounded-xl bg-gold/10 text-gold shrink-0">
                      <CreditCard className="h-6 w-6" />
                    </div>
                    <div className="text-left">
                      <span className="block text-xs font-bold text-slate-900">Pay Online (Razorpay)</span>
                      <span className="text-[10px] text-slate-500 block mt-0.5 leading-relaxed">Secure online payment integration. Pay online now to instantly schedule your caregiver shift and secure verified booking credentials.</span>
                    </div>
                  </div>
                </div>

                {/* Terms and Conditions of Patient booking */}
                <div className="border border-slate-200/60 rounded-2xl p-4 bg-slate-50/50 space-y-3">
                  <div className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-1.5">
                    Amma Seva – Patient Booking Terms &amp; Conditions
                  </div>
                  <div className="max-h-36 overflow-y-auto border border-slate-200/80 rounded-lg p-3 bg-white text-[11px] text-slate-600 leading-relaxed font-mono space-y-2">
                    <p className="font-semibold text-slate-700">Effective Date: 06/08/2026</p>
                    <p>Welcome to Amma Seva. By booking or using our services, you agree to the following Terms &amp; Conditions.</p>
                    
                    <p className="font-semibold text-slate-800">1. Service Scope</p>
                    <p>Amma Seva is a technology-enabled platform that connects clients with qualified nurses, caregivers, attendants, and home healthcare professionals.</p>
                    
                    <p className="font-semibold text-slate-800">2. Booking Confirmation</p>
                    <p>A booking is confirmed only after acceptance by Amma Seva and successful payment (where applicable).</p>
                    
                    <p className="font-semibold text-slate-800">3. Service Charges</p>
                    <p>Service charges vary depending on the type of service, duration, location, and special requirements.</p>
                    
                    <p className="font-semibold text-slate-800">4. Payment Terms</p>
                    <p>Payments shall be made through the approved payment methods provided by Amma Seva. Outstanding dues must be cleared before future bookings.</p>
                    
                    <p className="font-semibold text-slate-800">5. Cancellation &amp; Rescheduling</p>
                    <p>Cancellation or rescheduling is subject to Amma Seva's Cancellation &amp; Refund Policy.</p>
                    
                    <p className="font-semibold text-slate-800">6. Working Hours</p>
                    <p>Caregivers will provide services only during the booked time. Extra hours will be charged separately.</p>
                    
                    <p className="font-semibold text-slate-800">7. No Medical Advice or Prescription</p>
                    <p>Amma Seva does not diagnose illnesses, prescribe medications, recommend treatments, or sell/promote medicines. Our nurses and caregivers provide care strictly according to the treating doctor's valid prescription and instructions.</p>
                    
                    <p className="font-semibold text-slate-800">8. Emergency Services</p>
                    <p>Amma Seva is not an emergency medical service. In case of a medical emergency, clients must immediately contact the nearest hospital or ambulance service.</p>
                    
                    <p className="font-semibold text-slate-800">9. Patient Information</p>
                    <p>Clients must provide complete and accurate medical history, medications, allergies, and emergency contact details.</p>
                    
                    <p className="font-semibold text-slate-800">10. Client Responsibilities</p>
                    <p>Clients shall provide a safe, hygienic, and respectful environment for caregivers while services are being provided.</p>
                    
                    <p className="font-semibold text-slate-800">11. Caregiver Safety</p>
                    <p>Abusive behavior, harassment, violence, discrimination, or illegal activities towards caregivers will result in immediate termination of services.</p>
                    
                    <p className="font-semibold text-slate-800">12. Direct Engagement</p>
                    <p>If a client or caregiver directly engages with each other without Amma Seva's knowledge or authorization, Amma Seva shall not be responsible for any payments, disputes, liabilities, damages, or consequences arising from such independent arrangements.</p>
                    
                    <p className="font-semibold text-slate-800">13. No Employment Relationship</p>
                    <p>Using Amma Seva does not create an employer-employee relationship between the client and the caregiver.</p>
                    
                    <p className="font-semibold text-slate-800">14. No Guarantee of Medical Outcome</p>
                    <p>Amma Seva does not guarantee recovery, cure, or any specific medical outcome.</p>
                    
                    <p className="font-semibold text-slate-800">15. Confidentiality</p>
                    <p>Patient information will be kept confidential and handled in accordance with applicable privacy laws.</p>
                    
                    <p className="font-semibold text-slate-800">16. Personal Belongings</p>
                    <p>Amma Seva is not responsible for the loss of cash, jewellery, valuables, or personal belongings kept at the client's premises.</p>
                    
                    <p className="font-semibold text-slate-800">17. Background Verification</p>
                    <p>Amma Seva makes reasonable efforts to verify the identity and qualifications of caregivers but cannot guarantee their conduct beyond the services provided.</p>
                    
                    <p className="font-semibold text-slate-800">18. Service Refusal</p>
                    <p>Amma Seva reserves the right to refuse, suspend, or terminate services in cases of abuse, unsafe conditions, non-payment, or violation of these Terms.</p>
                    
                    <p className="font-semibold text-slate-800">19. Force Majeure</p>
                    <p>Amma Seva shall not be liable for delays or service interruptions caused by events beyond its reasonable control, including natural disasters, government restrictions, strikes, epidemics, or technical failures.</p>
                    
                    <p className="font-semibold text-slate-800">20. Intellectual Property</p>
                    <p>The Amma Seva name, logo, website, mobile application, and related content are the intellectual property of Amma Seva and may not be copied or used without prior written permission.</p>
                    
                    <p className="font-semibold text-slate-800">21. Jurisdiction</p>
                    <p>Any disputes arising from these Terms &amp; Conditions shall be subject to the exclusive jurisdiction of the competent courts where Amma Seva is registered.</p>
                    
                    <p className="font-semibold text-slate-800">22. Amendments</p>
                    <p>Amma Seva reserves the right to modify these Terms &amp; Conditions at any time. Updated versions will be published on the official website and mobile application.</p>
                    
                    <p className="font-semibold text-slate-800">23. Acceptance</p>
                    <p>By using Amma Seva's services, the client confirms that they have read, understood, and agreed to these Terms &amp; Conditions.</p>
                  </div>
                  
                  <label className="flex items-start gap-2.5 mt-2 cursor-pointer">
                    <input
                      type="checkbox"
                      required
                      checked={agreeTermsBooking}
                      onChange={(e) => setAgreeTermsBooking(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <span className="text-[11px] font-semibold text-slate-600 select-none">
                      I have read and agree to the Amma Seva Patient Booking Terms &amp; Conditions
                    </span>
                  </label>
                </div>

                {/* Cost Summary & Submission */}
                <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 -mx-6 -mb-6 p-6 rounded-b-3xl">
                  <div>
                    <span className="text-xs text-slate-400">Total Price Estimate</span>
                    <span className="block text-2xl font-extrabold text-primary font-display mt-0.5">₹{calculateTotal().toLocaleString()}</span>
                    <p className="text-[10px] text-indigo-600 font-semibold mt-1">
                      Rate: ₹{
                        bookingDuration === "Hourly" ? getServiceRates().hourly :
                        bookingDuration === "Daily" ? getServiceRates().daily :
                        bookingDuration === "Weekly" ? getServiceRates().weekly :
                        getServiceRates().monthly
                      } / {
                        bookingDuration === "Hourly" ? "Hour" :
                        bookingDuration === "Daily" ? "Day (24 hrs)" :
                        bookingDuration === "Weekly" ? "Week (7 days)" : "Month (30 days)"
                      } x {durationCount} {
                        bookingDuration === "Hourly" ? (durationCount === 1 ? "Hour" : "Hours") :
                        bookingDuration === "Daily" ? (durationCount === 1 ? "Day" : "Days") :
                        bookingDuration === "Weekly" ? (durationCount === 1 ? "Week" : "Weeks") :
                        (durationCount === 1 ? "Month" : "Months")
                      }
                    </p>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={isSubmitting || isPaymentProcessing || !agreeTermsBooking}
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
              <div className="flex justify-between"><span className="text-slate-400">Duration</span><span className="font-semibold text-slate-800">{successBooking.duration}</span></div>
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
