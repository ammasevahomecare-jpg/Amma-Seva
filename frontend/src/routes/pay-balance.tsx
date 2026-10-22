import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { 
  ShieldCheck, Lock, CreditCard, CheckCircle2, AlertTriangle, 
  RefreshCw, ArrowRight, Phone, MessageSquare, ExternalLink,
  Receipt, Calendar, Clock, MapPin, User, Car, Download, Check
} from "lucide-react";

interface BookingPayInfo {
  id: number;
  name: string;
  phone: string;
  phoneMasked: string;
  email?: string;
  service: string;
  duration: string;
  date: string;
  time: string;
  address: string;
  baseAmount: number;
  gstAmount: number;
  amount: number;
  advancePaid: number;
  balanceAmount: number;
  paymentStatus: string;
  status: string;
  isMtp?: boolean;
}

export const Route = createFileRoute("/pay-balance")({
  head: () => ({
    meta: [
      { title: "Pay Balance Due — Amma Seva Home Healthcare" },
      { name: "description", content: "Secure online payment for remaining balance on your Amma Seva booking." }
    ],
  }),
  component: PayBalancePage,
});

export default function PayBalancePage() {
  const [bookingId, setBookingId] = useState<string>("");
  const [manualIdInput, setManualIdInput] = useState<string>("");
  const [booking, setBooking] = useState<BookingPayInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);
  const [paymentSuccess, setPaymentSuccess] = useState<boolean>(false);
  const [paymentRefId, setPaymentRefId] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const id = params.get("id") || params.get("bookingId") || params.get("booking_id") || "";
      if (id) {
        setBookingId(id);
        fetchPayInfo(id);
      } else {
        setIsLoading(false);
      }
    }
  }, []);

  const fetchPayInfo = async (id: string) => {
    if (!id.trim()) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/booking/${id.trim()}/pay-info`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error(`Booking #${id} was not found. Please check your Booking Reference ID.`);
        }
        throw new Error("Unable to retrieve booking details. Please try again.");
      }
      const data: BookingPayInfo = await res.json();
      setBooking(data);
      if (Number(data.balanceAmount) <= 0 || String(data.paymentStatus || "").toLowerCase() === "paid") {
        setPaymentSuccess(true);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred while loading booking details.");
      setBooking(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualIdInput.trim()) return;
    setBookingId(manualIdInput.trim());
    fetchPayInfo(manualIdInput.trim());
  };

  const handlePayOnline = async () => {
    if (!booking) return;
    const isSettled = Number(booking.balanceAmount) <= 0 || String(booking.paymentStatus || "").toLowerCase() === "paid";
    if (isSettled) {
      alert("✓ Notice: This booking has already been settled in full! Duplicate payment has been blocked.");
      setPaymentSuccess(true);
      return;
    }
    const balance = Number(booking.balanceAmount);

    setIsProcessingPayment(true);
    try {
      // 1. Create order for balance amount with dual payment protection
      const orderRes = await fetch("/api/payment/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: balance, bookingId: booking.id })
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        if (orderData.alreadyPaid) {
          alert("✓ Notice: This booking has already been settled in full! Duplicate payment has been blocked.");
          setPaymentSuccess(true);
          fetchPayInfo(String(booking.id));
          return;
        }
        throw new Error(orderData.error || "Failed to initiate online payment session.");
      }

      // Handler to finalize payment in database
      const finalizePayment = async (payResponse: any) => {
        try {
          const verifyRes = await fetch(`/api/booking/${booking.id}/pay-balance`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: payResponse.razorpay_order_id,
              razorpay_payment_id: payResponse.razorpay_payment_id,
              razorpay_signature: payResponse.razorpay_signature || "simulated_sig"
            })
          });

          const verifyData = await verifyRes.json();
          if (!verifyRes.ok) {
            if (verifyData.alreadyPaid) {
              alert("✓ Notice: This booking has already been settled in full! Duplicate payment was prevented.");
              setPaymentSuccess(true);
              fetchPayInfo(String(booking.id));
              return;
            }
            throw new Error(verifyData.error || "Payment verification failed.");
          }

          setPaymentRefId(payResponse.razorpay_payment_id);
          setPaymentSuccess(true);
          // Refetch updated booking
          fetchPayInfo(String(booking.id));
        } catch (vErr: any) {
          alert("Error updating payment status: " + vErr.message);
        } finally {
          setIsProcessingPayment(false);
        }
      };

      // If simulated / dev environment or Razorpay SDK not loaded
      if (orderData.isSimulation || !(window as any).Razorpay) {
        const simTxn = `pay_sim_${Date.now()}`;
        await finalizePayment({
          razorpay_order_id: orderData.orderId,
          razorpay_payment_id: simTxn,
          razorpay_signature: `sig_sim_${Date.now()}`
        });
        return;
      }

      // 2. Open Live Razorpay Checkout
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "Amma Seva Home Healthcare",
        description: `Balance Payment for Booking #${booking.id}`,
        order_id: orderData.orderId,
        handler: finalizePayment,
        modal: {
          ondismiss: () => {
            setIsProcessingPayment(false);
          }
        },
        prefill: {
          name: booking.name || "",
          contact: booking.phone || ""
        },
        notes: {
          bookingId: String(booking.id),
          service: booking.service
        },
        theme: {
          color: "#0e2254"
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", (failRes: any) => {
        setIsProcessingPayment(false);
        alert(`Payment failed: ${failRes.error?.description || "Transaction cancelled"}`);
      });
      rzp.open();
    } catch (err: any) {
      setIsProcessingPayment(false);
      alert("Payment initiation error: " + err.message);
    }
  };

  return (
    <SiteLayout>
      <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          {/* Header Badge */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold tracking-wide uppercase mb-3 shadow-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              100% Secure SSL Payment Gateway
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0e2254] tracking-tight">
              Pay Booking Balance
            </h1>
            <p className="mt-1.5 text-sm text-slate-600">
              Complete your remaining balance for Amma Seva healthcare &amp; mobility services
            </p>
          </div>

          {/* If No ID Provided in URL: Manual ID Search Form */}
          {!bookingId && !booking && !isLoading && (
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-8 text-center">
              <div className="w-14 h-14 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-[#0e2254]">
                <Receipt className="w-7 h-7" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 mb-1">Enter Your Booking Reference</h2>
              <p className="text-xs text-slate-500 mb-6">
                Please enter the Booking ID received in your WhatsApp confirmation or SMS invoice.
              </p>
              <form onSubmit={handleManualSearch} className="max-w-md mx-auto">
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="e.g. 14"
                    value={manualIdInput}
                    onChange={(e) => setManualIdInput(e.target.value)}
                    className="flex-1 px-4 py-3 border border-slate-300 rounded-xl text-base font-semibold focus:ring-2 focus:ring-[#0e2254] focus:outline-none"
                    required
                  />
                  <button
                    type="submit"
                    className="px-6 py-3 bg-[#0e2254] text-white font-bold rounded-xl hover:bg-[#152e70] transition-colors flex items-center gap-2"
                  >
                    Lookup
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Loading Skeleton */}
          {isLoading && (
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center animate-pulse">
              <RefreshCw className="w-8 h-8 text-[#0e2254] animate-spin mx-auto mb-4" />
              <p className="text-sm font-semibold text-slate-600">Verifying booking and balance details...</p>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && !isLoading && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center mb-6">
              <AlertTriangle className="w-8 h-8 text-rose-600 mx-auto mb-2" />
              <h3 className="text-base font-bold text-rose-900 mb-1">Booking Not Found</h3>
              <p className="text-xs text-rose-700 mb-4">{errorMsg}</p>
              <div className="flex flex-wrap justify-center gap-3">
                <button
                  onClick={() => { setBookingId(""); setBooking(null); setErrorMsg(null); }}
                  className="px-4 py-2 bg-white border border-rose-300 text-rose-800 text-xs font-bold rounded-xl hover:bg-rose-100 transition-colors"
                >
                  Enter Another Booking ID
                </button>
                <a
                  href="tel:9490587575"
                  className="px-4 py-2 bg-[#0e2254] text-white text-xs font-bold rounded-xl hover:bg-[#152e70] transition-colors flex items-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5" />
                  Call Support
                </a>
              </div>
            </div>
          )}

          {/* Booking Found Card */}
          {booking && !isLoading && (
            <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
              {/* Card Header Banner */}
              <div className="bg-gradient-to-r from-[#091438] via-[#10235b] to-[#091438] p-6 text-white relative">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs font-mono font-bold tracking-wider">
                        BOOKING #{booking.id}
                      </span>
                      {booking.isMtp && (
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-400/20 border border-blue-400/40 text-blue-200 text-xs font-bold flex items-center gap-1">
                          <Car className="w-3 h-3" />
                          MTP Mobility
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl font-extrabold text-white">{booking.service}</h2>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Customer: <span className="font-semibold text-white">{booking.name}</span>
                    </p>
                  </div>

                  <div className="text-right">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      paymentSuccess || Number(booking.balanceAmount) <= 0 || String(booking.paymentStatus || "").toLowerCase() === "paid"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                    }`}>
                      {paymentSuccess || Number(booking.balanceAmount) <= 0 || String(booking.paymentStatus || "").toLowerCase() === "paid" ? "✓ Fully Paid" : "⏳ Balance Due"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Booking Shift Details */}
              <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-slate-400 font-medium block flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" /> Date
                    </span>
                    <span className="font-bold text-slate-900 mt-0.5 block">{booking.date || "Scheduled"}</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-slate-400 font-medium block flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" /> Start Time
                    </span>
                    <span className="font-bold text-slate-900 mt-0.5 block">{booking.time || "Regular"}</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200 col-span-2 sm:col-span-1">
                    <span className="text-slate-400 font-medium block">Duration / Hours</span>
                    <span className="font-bold text-slate-900 mt-0.5 block">{booking.duration || "Standard"}</span>
                  </div>
                </div>

                {booking.address && (
                  <div className="mt-3 flex items-start gap-2 text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-200">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="truncate">{booking.address}</span>
                  </div>
                )}
              </div>

              {/* Financial Calculation Breakdown */}
              <div className="p-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                  Shift Financial Breakdown
                </h3>
                
                <div className="space-y-2.5 text-sm border-b border-slate-200 pb-4">
                  <div className="flex justify-between text-slate-600">
                    <span>Base Service Amount</span>
                    <span className="font-semibold text-slate-900">₹{booking.baseAmount.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>GST (18% Govt. Tax)</span>
                    <span className="font-semibold text-slate-900">₹{booking.gstAmount.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-dashed border-slate-200">
                    <span>Total Service Value</span>
                    <span className="text-base text-[#0e2254]">₹{booking.amount.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200">
                    <span className="flex items-center gap-1.5 font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Advance Paid Online
                    </span>
                    <span className="font-bold">₹{booking.advancePaid.toLocaleString("en-IN")}</span>
                  </div>
                </div>

                {/* Final Balance Due Highlight Card */}
                {paymentSuccess || Number(booking.balanceAmount) <= 0 || String(booking.paymentStatus || "").toLowerCase() === "paid" ? (
                  <div className="mt-6 bg-gradient-to-b from-emerald-50 to-teal-50 border-2 border-emerald-300 rounded-3xl p-6 text-center shadow-xs">
                    <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-emerald-700 shadow-2xs">
                      <Check className="w-7 h-7 stroke-[3]" />
                    </div>
                    <span className="inline-block px-3 py-1 rounded-full bg-emerald-200/60 text-emerald-900 text-[10px] font-black uppercase tracking-wider mb-2">
                      🔒 Dual-Payment Protected • Fully Reconciled
                    </span>
                    <h4 className="text-xl font-extrabold text-emerald-950 mb-1">
                      Payment Settled in Full!
                    </h4>
                    <p className="text-xs text-emerald-800 max-w-md mx-auto mb-4 leading-relaxed">
                      Thank you! There is <strong>₹0.00 outstanding balance</strong> remaining for Booking #{booking.id}. Any duplicate payment attempt is automatically blocked. Your digital tax invoice and account ledger are finalized.
                    </p>
                    {paymentRefId && (
                      <p className="text-[11px] font-mono text-emerald-800 bg-white/90 py-1.5 px-3.5 rounded-xl inline-block border border-emerald-200 mb-4 shadow-2xs">
                        Transaction ID: {paymentRefId}
                      </p>
                    )}
                    <div className="flex flex-wrap justify-center gap-3">
                      <Link
                        to="/dashboard"
                        className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#0e2254] text-white text-xs font-bold rounded-xl hover:bg-[#152e70] transition-colors shadow-sm"
                      >
                        Go to My Dashboard
                      </Link>
                      <Link
                        to="/"
                        className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-white border border-slate-300 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-100 transition-colors"
                      >
                        Return to Homepage
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="mt-6">
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300/80 rounded-2xl p-5 mb-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                            Outstanding Balance Due
                          </span>
                          <p className="text-2xl sm:text-3xl font-extrabold text-[#0e2254] mt-0.5">
                            ₹{booking.balanceAmount.toLocaleString("en-IN")}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] font-semibold text-slate-500 block">Accepted:</span>
                          <span className="text-[10px] font-bold text-slate-700 block">UPI • GPay • PhonePe • Cards</span>
                        </div>
                      </div>
                    </div>

                    {/* Pay Button */}
                    <button
                      onClick={handlePayOnline}
                      disabled={isProcessingPayment}
                      className="w-full py-4 px-6 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white font-extrabold text-base rounded-2xl shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2.5 transition-all transform active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                    >
                      {isProcessingPayment ? (
                        <>
                          <RefreshCw className="w-5 h-5 animate-spin" />
                          Processing Secure Payment...
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-5 h-5" />
                          Pay ₹{booking.balanceAmount.toLocaleString("en-IN")} Balance Now
                        </>
                      )}
                    </button>

                    {/* Cash Option Alternate */}
                    <div className="mt-4 p-3.5 bg-slate-100 rounded-xl border border-slate-200 text-center">
                      <p className="text-xs text-slate-600">
                        <span className="font-bold text-slate-800">Prefer Cash?</span> You may also hand over this exact cash balance (₹{booking.balanceAmount}) directly to your caregiver/driver upon shift completion.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Trust Bar */}
              <div className="bg-slate-50 p-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>256-Bit Bank Grade Encryption</span>
                </div>
                <div className="flex items-center gap-3">
                  <a
                    href="tel:9490587575"
                    className="text-[#0e2254] font-bold hover:underline flex items-center gap-1"
                  >
                    <Phone className="w-3 h-3" />
                    Help: 94905 87575
                  </a>
                  <a
                    href={`https://wa.me/919490587575?text=${encodeURIComponent(`Hi Amma Seva, I have a question regarding Booking #${booking.id} balance payment.`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-700 font-bold hover:underline flex items-center gap-1"
                  >
                    <MessageSquare className="w-3 h-3" />
                    WhatsApp
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </SiteLayout>
  );
}
