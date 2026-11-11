import React, { useState, useMemo } from "react";
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Coins,
  Receipt,
  Landmark,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Info,
  TrendingUp,
  Percent,
  Layers,
  FileText,
  AlertCircle,
  Trash2
} from "lucide-react";

export interface MonthlyLedgerBooking {
  id: number | string;
  date?: string;
  createdAt?: string;
  name?: string;
  patientName?: string;
  phone?: string;
  service?: string;
  amount?: number;
  baseAmount?: number;
  gstAmount?: number;
  advancePaid?: number;
  balanceAmount?: number;
  paymentStatus?: string;
  paymentMethod?: string;
  transactionId?: string;
  paymentDate?: string;
  caretakerPayout?: number | null;
  caretakerPayoutStatus?: string;
  caretakerPayoutMethod?: string;
  caretakerPayoutRef?: string;
  assignedStaff?: string;
  assignedStaffId?: number | string;
  caretakerName?: string;
  status?: string;
  invoiceNumber?: string;
  address?: string;
}

interface MonthlyLedgerRegistersProps {
  bookings: MonthlyLedgerBooking[];
  onRefresh?: () => Promise<void>;
  onNavigateToTab?: (tab: string) => void;
  onDeleteBooking?: (id: number | string, clientName?: string) => Promise<boolean | void>;
}

export const MonthlyLedgerRegisters: React.FC<MonthlyLedgerRegistersProps> = ({
  bookings = [],
  onRefresh,
  onNavigateToTab,
  onDeleteBooking
}) => {
  // Current month default (YYYY-MM)
  const defaultMonthStr = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }, []);

  const [selectedMonth, setSelectedMonth] = useState<string>(defaultMonthStr);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeView, setActiveView] = useState<"all" | "profit" | "gst" | "transactions">("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<number | string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleDeleteRecord = async (bookingId: number | string, clientName?: string) => {
    if (onDeleteBooking) {
      setIsDeletingId(bookingId);
      try {
        await onDeleteBooking(bookingId, clientName);
      } finally {
        setIsDeletingId(null);
      }
      return;
    }

    const nameDisplay = clientName ? ` (${clientName})` : "";
    const confirmMsg = `Are you sure you want to permanently delete transaction #${bookingId}${nameDisplay}?\n\nThis will remove it from the database permanently and recalculate the ledger.`;
    if (!window.confirm(confirmMsg)) return;

    setIsDeletingId(bookingId);
    try {
      const token = localStorage.getItem("ammaseva_admin_token");
      const res = await fetch(`/api/booking/${bookingId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        showToast(`✅ Transaction #${bookingId}${nameDisplay} permanently deleted from database.`);
        if (onRefresh) {
          await onRefresh();
        }
      } else {
        alert(data.error || "Failed to delete transaction.");
      }
    } catch (err: any) {
      console.error("Delete transaction error:", err);
      alert("Error deleting transaction: " + err.message);
    } finally {
      setIsDeletingId(null);
    }
  };

  // Helper to extract ISO date YYYY-MM-DD from booking
  const getBookingISODate = (b: MonthlyLedgerBooking): string => {
    if (b.date) {
      const firstPart = b.date.includes(" to ") ? b.date.split(" to ")[0].trim() : b.date.trim();
      if (/^\d{4}-\d{2}-\d{2}/.test(firstPart)) return firstPart.slice(0, 10);
    }
    if (b.createdAt) {
      return b.createdAt.slice(0, 10);
    }
    return "";
  };

  // Generate list of distinct available months from bookings
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    const nowMonth = defaultMonthStr;
    set.add(nowMonth);

    bookings.forEach((b) => {
      const iso = getBookingISODate(b);
      if (iso && iso.length >= 7) {
        set.add(iso.slice(0, 7));
      }
    });

    return Array.from(set).sort().reverse();
  }, [bookings, defaultMonthStr]);

  // Format YYYY-MM into friendly string e.g. "October 2026"
  const formatMonthLabel = (mStr: string) => {
    if (!mStr || mStr === "all") return "All Time";
    try {
      const [year, month] = mStr.split("-");
      const d = new Date(Number(year), Number(month) - 1, 1);
      return d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
    } catch {
      return mStr;
    }
  };

  // Filter bookings based on selected month or custom date range and search query
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      // Exclude explicitly cancelled bookings unless searched
      if (b.status === "Cancelled" && !searchQuery.trim()) return false;

      const bDate = getBookingISODate(b);

      // Custom date range takes priority if both are entered
      if (startDate && bDate && bDate < startDate) return false;
      if (endDate && bDate && bDate > endDate) return false;

      // If no custom date range, apply month filter
      if (!startDate && !endDate && selectedMonth !== "all") {
        if (!bDate.startsWith(selectedMonth)) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          (b.name || "").toLowerCase().includes(q) ||
          (b.patientName || "").toLowerCase().includes(q) ||
          (b.phone || "").includes(q) ||
          (b.service || "").toLowerCase().includes(q) ||
          (b.invoiceNumber || "").toLowerCase().includes(q) ||
          `#${b.id}`.includes(q) ||
          String(b.id) === q;
        if (!match) return false;
      }

      return true;
    });
  }, [bookings, selectedMonth, startDate, endDate, searchQuery]);

  // Derive the active Month / Year display string for sheet headers
  const activePeriodTitle = useMemo(() => {
    if (startDate || endDate) {
      return `${startDate || "Start"} to ${endDate || "Present"}`;
    }
    return formatMonthLabel(selectedMonth);
  }, [startDate, endDate, selectedMonth]);

  // =========================================================================
  // SHEET 1: COMPUTED MONTHLY PROFIT REGISTER DATA
  // =========================================================================
  const profitRegisterRows = useMemo(() => {
    return filteredBookings.map((b, idx) => {
      const tot = Number(b.amount || 0);
      const bDate = getBookingISODate(b);

      // Base Service Fee (Taxable value)
      const serviceFee = Number(b.baseAmount) || Math.round(tot / 1.18);

      // 18% GST (recorded separately)
      const gst = Number(b.gstAmount) !== undefined && b.gstAmount !== null
        ? Number(b.gstAmount)
        : Math.max(0, tot - serviceFee);

      // Payment to Caregivers: explicit caretakerPayout or fallback 70% of service fee
      let paymentToCaregivers = 0;
      if (b.caretakerPayout !== undefined && b.caretakerPayout !== null && Number(b.caretakerPayout) >= 0) {
        paymentToCaregivers = Number(b.caretakerPayout);
      } else {
        paymentToCaregivers = Math.round(serviceFee * 0.70);
      }

      // Razorpay 2% calculated on Service Fee
      const razorpayFee = Math.round(serviceFee * 0.02 * 100) / 100;

      // Other Charges 1% calculated on Service Fee
      const otherCharges = Math.round(serviceFee * 0.01 * 100) / 100;

      // Amma Seva Amount = Service Fee - Payment to Caregivers - Razorpay 2% - Other Charges 1%
      const ammaSevaAmount = Math.max(
        0,
        Math.round((serviceFee - paymentToCaregivers - razorpayFee - otherCharges) * 100) / 100
      );

      // Office Maintenance 15% calculated on Amma Seva Amount
      const officeMaintenance = Math.round(ammaSevaAmount * 0.15 * 100) / 100;

      // Profit 5% calculated on Amma Seva Amount
      const profit = Math.round(ammaSevaAmount * 0.05 * 100) / 100;

      // Note / Settlement details
      const isPaid =
        (b.paymentStatus || "").toLowerCase() === "paid" ||
        (b.balanceAmount !== undefined && Number(b.balanceAmount) <= 0 && tot > 0) ||
        (b.advancePaid !== undefined && Number(b.advancePaid) >= tot && tot > 0);
      const balanceDue = isPaid
        ? 0
        : b.balanceAmount !== undefined && b.balanceAmount !== null
          ? Math.max(0, Number(b.balanceAmount))
          : Math.max(0, tot - Number(b.advancePaid || 0));

      const note = isPaid
        ? "Settled (₹0 Due)"
        : balanceDue > 0
          ? `Pending Bal ₹${balanceDue.toLocaleString("en-IN")}`
          : "Active";

      const customerDetails = `${b.name || "Customer"}${b.phone ? ` (${b.phone})` : ""}${b.patientName && b.patientName !== b.name ? ` [Pt: ${b.patientName}]` : ""
        }`;

      return {
        serialNo: idx + 1,
        date: bDate || "—",
        invoiceNo: b.invoiceNumber || `INV-BK-${b.id}`,
        customerDetails,
        typeOfService: b.service || "Healthcare Support",
        serviceFee,
        gst,
        paymentToCaregivers,
        razorpayFee,
        otherCharges,
        ammaSevaAmount,
        officeMaintenance,
        profit,
        note,
        rawBooking: b
      };
    });
  }, [filteredBookings]);

  // Aggregated totals for Profit Register
  const profitTotals = useMemo(() => {
    let sumServiceFee = 0;
    let sumGst = 0;
    let sumCaregivers = 0;
    let sumRazorpay = 0;
    let sumOtherCharges = 0;
    let sumAmmaSeva = 0;
    let sumOfficeMaintenance = 0;
    let sumProfit = 0;

    profitRegisterRows.forEach((r) => {
      sumServiceFee += r.serviceFee;
      sumGst += r.gst;
      sumCaregivers += r.paymentToCaregivers;
      sumRazorpay += r.razorpayFee;
      sumOtherCharges += r.otherCharges;
      sumAmmaSeva += r.ammaSevaAmount;
      sumOfficeMaintenance += r.officeMaintenance;
      sumProfit += r.profit;
    });

    return {
      serviceFee: Math.round(sumServiceFee),
      gst: Math.round(sumGst),
      caregivers: Math.round(sumCaregivers),
      razorpay: Math.round(sumRazorpay * 100) / 100,
      otherCharges: Math.round(sumOtherCharges * 100) / 100,
      ammaSeva: Math.round(sumAmmaSeva * 100) / 100,
      officeMaintenance: Math.round(sumOfficeMaintenance * 100) / 100,
      profit: Math.round(sumProfit * 100) / 100
    };
  }, [profitRegisterRows]);

  // =========================================================================
  // SHEET 2: COMPUTED MONTHLY GST COLLECTION REGISTER DATA
  // =========================================================================
  const gstRegisterRows = useMemo(() => {
    return filteredBookings.map((b, idx) => {
      const tot = Number(b.amount || 0);
      const bDate = getBookingISODate(b);
      const serviceFee = Number(b.baseAmount) || Math.round(tot / 1.18);
      const gst = Number(b.gstAmount) !== undefined && b.gstAmount !== null
        ? Number(b.gstAmount)
        : Math.max(0, tot - serviceFee);
      const cgst = Math.round(gst / 2);
      const sgst = gst - cgst;

      const customerDetails = `${b.name || "Customer"}${b.phone ? ` (${b.phone})` : ""}`;
      const note = `CGST 9% (₹${cgst.toLocaleString("en-IN")}) + SGST 9% (₹${sgst.toLocaleString("en-IN")}) | ${b.paymentMethod || "Direct"
        }`;

      return {
        serialNo: idx + 1,
        date: bDate || "—",
        invoiceNo: b.invoiceNumber || `INV-BK-${b.id}`,
        customerDetails,
        typeOfService: b.service || "Healthcare Support",
        serviceFee,
        gst,
        cgst,
        sgst,
        note,
        rawBooking: b
      };
    });
  }, [filteredBookings]);

  const gstTotals = useMemo(() => {
    let sumServiceFee = 0;
    let sumGst = 0;
    gstRegisterRows.forEach((r) => {
      sumServiceFee += r.serviceFee;
      sumGst += r.gst;
    });
    return {
      serviceFee: Math.round(sumServiceFee),
      gst: Math.round(sumGst)
    };
  }, [gstRegisterRows]);

  // =========================================================================
  // SHEET 3: COMPUTED MONTHLY TRANSACTIONS REGISTER (DAY BOOK & CASH)
  // =========================================================================
  const { transactionsList, daySummaryMap, txTotals } = useMemo(() => {
    const list: Array<{
      serialNo: number;
      date: string;
      dayNumber: number;
      description: string;
      credit: number;
      debit: number;
      dailyNet: number;
      notes: string;
      bookingId?: number | string;
      rawBooking?: MonthlyLedgerBooking;
    }> = [];

    // Initialize 31-day summary tracking
    const dayMap: { [day: number]: { credits: number; debits: number; net: number } } = {};
    for (let d = 1; d <= 31; d++) {
      dayMap[d] = { credits: 0, debits: 0, net: 0 };
    }

    let serial = 1;

    // Process all filtered bookings into transaction credits and debits
    filteredBookings.forEach((b) => {
      const tot = Number(b.amount || 0);
      const isPaid =
        (b.paymentStatus || "").toLowerCase() === "paid" ||
        (b.balanceAmount !== undefined && Number(b.balanceAmount) <= 0 && tot > 0) ||
        (b.advancePaid !== undefined && Number(b.advancePaid) >= tot && tot > 0);
      const collected = isPaid ? tot : b.advancePaid !== undefined ? Number(b.advancePaid) : 0;
      const bDate = getBookingISODate(b) || "2026-10-01";
      const dayNum = parseInt(bDate.slice(8, 10), 10) || 1;

      // 1. Credit Transaction (Customer Collection / Payment Received)
      if (collected > 0) {
        list.push({
          serialNo: serial++,
          date: bDate,
          dayNumber: dayNum,
          description: `Booking #${b.id} payment from ${b.name || "Customer"} (${b.service || "Service"})`,
          credit: collected,
          debit: 0,
          dailyNet: collected,
          notes: `Txn: ${b.transactionId || "DIRECT/UPI"} | Method: ${b.paymentMethod || "Online/Cash"}`,
          bookingId: b.id,
          rawBooking: b
        });

        if (dayNum >= 1 && dayNum <= 31) {
          dayMap[dayNum].credits += collected;
        }
      }

      // 2. Debit Transaction (Caregiver Payout if paid or recorded)
      const payoutVal =
        b.caretakerPayout !== undefined && b.caretakerPayout !== null && Number(b.caretakerPayout) > 0
          ? Number(b.caretakerPayout)
          : 0;

      if (payoutVal > 0) {
        list.push({
          serialNo: serial++,
          date: bDate,
          dayNumber: dayNum,
          description: `Caregiver Payout for #${b.id} to ${b.assignedStaff || b.caretakerName || "Staff"}`,
          credit: 0,
          debit: payoutVal,
          dailyNet: -payoutVal,
          notes: `Ref: ${b.caretakerPayoutRef || "PAYOUT-STAFF"} | Status: ${b.caretakerPayoutStatus || "Paid"}`,
          bookingId: b.id,
          rawBooking: b
        });

        if (dayNum >= 1 && dayNum <= 31) {
          dayMap[dayNum].debits += payoutVal;
        }
      }
    });

    // Compute net for each day
    for (let d = 1; d <= 31; d++) {
      dayMap[d].net = dayMap[d].credits - dayMap[d].debits;
    }

    // Grand totals
    let totalCredits = 0;
    let totalDebits = 0;
    list.forEach((t) => {
      totalCredits += t.credit;
      totalDebits += t.debit;
    });

    return {
      transactionsList: list,
      daySummaryMap: dayMap,
      txTotals: {
        totalCredits: Math.round(totalCredits),
        totalDebits: Math.round(totalDebits),
        net: Math.round(totalCredits - totalDebits)
      }
    };
  }, [filteredBookings]);

  // CSV escape utility
  const esc = (val: any) => {
    if (val === undefined || val === null) return "";
    const str = String(val).replace(/"/g, '""').replace(/\r?\n/g, " ");
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str}"`;
    }
    return str;
  };

  // =========================================================================
  // EXPORT 1: MONTHLY PROFIT REGISTER (Exact template CSV)
  // =========================================================================
  const handleDownloadProfitRegisterCSV = () => {
    const periodName = activePeriodTitle;
    const headerLines = [
      ",,,,,AMMA SEVA,,,,,,,,,",
      ",,,,,MONTHLY PROFIT REGISTER,,,,,,,,,",
      ",,,,,Professional Care with a Mother's Touch.,,,,,,,,,",
      ",,,,,,,,,,,,,,",
      `,Month / Year:,${periodName},,Razorpay and Other Charges are calculated on Service Fee.,,,,,,,,,,`,
      ",,,,,,,,,,,,,,",
      ",Serial No.,Date,Invoice No.,Customer Details,Type of Service,Service Fee (₹),GST (₹),Payment to Caregivers (₹),Razorpay 2% (₹),Other Charges 1% (₹),Amma Seva Amount (₹),Office Maintenance 15% (₹),Profit 5% (₹),Note"
    ];

    const dataLines = profitRegisterRows.map((r) => {
      return [
        "", // Leading empty column as per template
        r.serialNo,
        esc(r.date),
        esc(r.invoiceNo),
        esc(r.customerDetails),
        esc(r.typeOfService),
        r.serviceFee,
        r.gst,
        r.paymentToCaregivers,
        r.razorpayFee,
        r.otherCharges,
        r.ammaSevaAmount,
        r.officeMaintenance,
        r.profit,
        esc(r.note)
      ].join(",");
    });

    // Add empty padding rows up to 50 rows if needed to match template feel
    const paddingRowsCount = Math.max(0, 15 - dataLines.length);
    const paddingLines = Array(paddingRowsCount).fill(",,,,,,,,,,,,,,");

    const totalsLines = [
      ",,,,,,,,,,,,,,",
      `,MONTHLY TOTALS,,,,,${profitTotals.serviceFee},${profitTotals.gst},${profitTotals.caregivers},${profitTotals.razorpay},${profitTotals.otherCharges},${profitTotals.ammaSeva},${profitTotals.officeMaintenance},${profitTotals.profit},`,
      ",,,,,,,,,,,,,,",
      `,TOTAL PROFIT EARNED FOR THE MONTH (₹),,,,,,,,,,,${profitTotals.profit},,`,
      ",,,,,,,,,,,,,,",
      ',Formula note: Amma Seva Amount = Service Fee − Payment to Caregivers − Razorpay (2%) − Other Charges (1%). GST is recorded separately and is not deducted from Amma Seva Amount. Office Maintenance (15%) and Profit (5%) are calculated on Amma Seva Amount.,,,,,,,,,,,,,'
    ];

    const csvContent = "\uFEFF" + [...headerLines, ...dataLines, ...paddingLines, ...totalsLines].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const cleanPeriod = periodName.replace(/[^a-zA-Z0-9_-]/g, "_");
    a.href = url;
    a.download = `Amma_Seva_Monthly_Profit_Register_${cleanPeriod}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("✅ Monthly Profit Register downloaded successfully!");
  };

  // =========================================================================
  // EXPORT 2: MONTHLY GST COLLECTION REGISTER (Exact template CSV)
  // =========================================================================
  const handleDownloadGSTRegisterCSV = () => {
    const periodName = activePeriodTitle;
    const headerLines = [
      ",,,AMMA SEVA,,,,,",
      ",,,MONTHLY GST COLLECTION REGISTER,,,,,",
      ",,,Professional Care with a Mother's Touch.,,,,,",
      ",,,,,,,,",
      `,Month / Year:,${periodName},,Enter GST amount for each invoice in the GST column.,,,,`,
      ",,,,,,,,",
      ",Serial No.,Date,Invoice No.,Customer Details,Type of Service,Service Fee(₹),GST (₹),Note"
    ];

    const dataLines = gstRegisterRows.map((r) => {
      return [
        "", // Leading empty column
        r.serialNo,
        esc(r.date),
        esc(r.invoiceNo),
        esc(r.customerDetails),
        esc(r.typeOfService),
        r.serviceFee,
        r.gst,
        esc(r.note)
      ].join(",");
    });

    const paddingRowsCount = Math.max(0, 15 - dataLines.length);
    const paddingLines = Array(paddingRowsCount).fill(",,,,,,,,");

    const totalsLines = [
      ",,,,,,,,",
      `,TOTAL FOR THE MONTH,,,,,${gstTotals.serviceFee},${gstTotals.gst},`,
      ",,,,,,,,",
      `,TOTAL GST COLLECTED FOR THE MONTH (₹),,,,,,${gstTotals.gst},`,
      ",,,,,,,,",
      ",Note: Enter the GST amount actually charged on each invoice. The monthly GST total updates automatically.,,,,,,,"
    ];

    const csvContent = "\uFEFF" + [...headerLines, ...dataLines, ...paddingLines, ...totalsLines].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const cleanPeriod = periodName.replace(/[^a-zA-Z0-9_-]/g, "_");
    a.href = url;
    a.download = `Amma_Seva_Monthly_GST_Collection_Register_${cleanPeriod}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("✅ Monthly GST Collection Register downloaded successfully!");
  };

  // =========================================================================
  // EXPORT 3: MONTHLY TRANSACTIONS REGISTER (Day Book & Cash Book CSV)
  // =========================================================================
  const handleDownloadTransactionsRegisterCSV = () => {
    const periodParts = activePeriodTitle.split(" ");
    const monthWord = periodParts[0] || "October";
    const yearWord = periodParts[1] || "2026";

    const headerLines = [
      "AMMA SEVA — MONTHLY TRANSACTIONS REGISTER,,,,,,,,,,,",
      `Month: ${monthWord}     Year: ${yearWord},,,,,,,,,,,`,
      ",,,,,,,,,,,",
      "S. No.,Date,Description of Transaction,Credit (₹),Debit (₹),Daily Net (₹),Notes / Reference,,Day,Daily Credits (₹),Daily Debits (₹),Daily Net (₹)"
    ];

    // Build the rows: Combine transaction entries with 31-day table on the right
    const maxRows = Math.max(31, transactionsList.length);
    const combinedRows: string[] = [];

    for (let i = 0; i < maxRows; i++) {
      const tx = transactionsList[i];
      const dayNum = i + 1; // 1 to 31
      const dayData = dayNum <= 31 ? daySummaryMap[dayNum] : null;

      const leftCols = tx
        ? [
          tx.serialNo,
          esc(tx.date),
          esc(tx.description),
          tx.credit,
          tx.debit,
          tx.dailyNet,
          esc(tx.notes)
        ]
        : ["", "", "", "", "", "", ""];

      const rightCols = dayData
        ? [dayNum, dayData.credits, dayData.debits, dayData.net]
        : ["", "", "", ""];

      combinedRows.push([...leftCols, "", ...rightCols].join(","));
    }

    const totalsLines = [
      ",,,,,,,,,,,",
      `TOTAL CREDITS,,,${txTotals.totalCredits},,,,,,,,`,
      `TOTAL CREDITS,,,${txTotals.totalCredits},${txTotals.totalCredits},,,,,,,`,
      `TOTAL DEBITS,,,${txTotals.totalDebits},${txTotals.totalDebits},,,,,,,`,
      `NET (CREDITS − DEBITS),,,${txTotals.net},,,,,,,,`,
      ",,,,,,,,,,,",
      "HOW TO USE — MONTHLY TRANSACTIONS REGISTER,",
      ",",
      "Step,Action",
      "1,Write the month and year at the top.",
      '2,"Each date has a block of 10 rows: use rows 1–10 for day 1, next 10 rows for day 2, and continue through day 31."',
      '3,"Enter the actual date, description, credit amount, and/or debit amount for each transaction."',
      "4,Use Credit for money received and Debit for money paid. Enter an amount in only the relevant column for each transaction.",
      "5,Serial numbers fill automatically when a transaction row has details.",
      '6,"At the bottom, Total Credits and Total Debits calculate automatically, along with Net (Credits − Debits)."',
      '7,"The workbook provides 310 transaction rows for a 31-day month. For shorter months, unused day blocks can remain blank."',
      ",",
      '8,"Daily Net (₹) calculates Credit minus Debit for each transaction. The summary table on the right totals credits, debits, and net for each day\'s 10-row block."'
    ];

    const csvContent = "\uFEFF" + [...headerLines, ...combinedRows, ...totalsLines].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const cleanPeriod = activePeriodTitle.replace(/[^a-zA-Z0-9_-]/g, "_");
    a.href = url;
    a.download = `Amma_Seva_Monthly_Transactions_Register_${cleanPeriod}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("✅ Monthly Transactions Register downloaded successfully!");
  };

  // =========================================================================
  // EXPORT 4: MASTER WORKBOOK (SpreadsheetML XML with ALL 3 SHEETS in ONE .xls)
  // =========================================================================
  const handleDownloadCompleteWorkbookXLS = () => {
    const periodName = activePeriodTitle;
    const periodParts = periodName.split(" ");
    const monthWord = periodParts[0] || "October";
    const yearWord = periodParts[1] || "2026";

    // Helper to format XML cell
    const cell = (val: any, type: "String" | "Number" = "String", styleId?: string) => {
      const cleanVal = val === null || val === undefined ? "" : String(val);
      const styleAttr = styleId ? ` ss:StyleID="${styleId}"` : "";
      return `<Cell${styleAttr}><Data ss:Type="${type}">${cleanVal
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")}</Data></Cell>`;
    };

    // 1. Worksheet 1 XML: Monthly Profit Register
    const sheet1Rows: string[] = [
      `<Row><Cell ss:StyleID="BrandHeader"><Data ss:Type="String">AMMA SEVA</Data></Cell></Row>`,
      `<Row><Cell ss:StyleID="SubHeader"><Data ss:Type="String">MONTHLY PROFIT REGISTER</Data></Cell></Row>`,
      `<Row><Cell ss:StyleID="Italic"><Data ss:Type="String">Professional Care with a Mother's Touch.</Data></Cell></Row>`,
      `<Row></Row>`,
      `<Row><Cell ss:StyleID="Bold"><Data ss:Type="String">Month / Year:</Data></Cell><Cell ss:StyleID="Bold"><Data ss:Type="String">${periodName}</Data></Cell><Cell><Data ss:Type="String"></Data></Cell><Cell ss:StyleID="Italic"><Data ss:Type="String">Razorpay and Other Charges are calculated on Service Fee.</Data></Cell></Row>`,
      `<Row></Row>`,
      `<Row ss:StyleID="TableColHeader">
        ${cell("Serial No.", "String")}
        ${cell("Date", "String")}
        ${cell("Invoice No.", "String")}
        ${cell("Customer Details", "String")}
        ${cell("Type of Service", "String")}
        ${cell("Service Fee (₹)", "String")}
        ${cell("GST (₹)", "String")}
        ${cell("Payment to Caregivers (₹)", "String")}
        ${cell("Razorpay 2% (₹)", "String")}
        ${cell("Other Charges 1% (₹)", "String")}
        ${cell("Amma Seva Amount (₹)", "String")}
        ${cell("Office Maintenance 15% (₹)", "String")}
        ${cell("Profit 5% (₹)", "String")}
        ${cell("Note", "String")}
      </Row>`
    ];

    profitRegisterRows.forEach((r) => {
      sheet1Rows.push(
        `<Row>
          ${cell(r.serialNo, "Number")}
          ${cell(r.date, "String")}
          ${cell(r.invoiceNo, "String")}
          ${cell(r.customerDetails, "String")}
          ${cell(r.typeOfService, "String")}
          ${cell(r.serviceFee, "Number")}
          ${cell(r.gst, "Number")}
          ${cell(r.paymentToCaregivers, "Number")}
          ${cell(r.razorpayFee, "Number")}
          ${cell(r.otherCharges, "Number")}
          ${cell(r.ammaSevaAmount, "Number")}
          ${cell(r.officeMaintenance, "Number")}
          ${cell(r.profit, "Number")}
          ${cell(r.note, "String")}
        </Row>`
      );
    });

    sheet1Rows.push(
      `<Row></Row>`,
      `<Row ss:StyleID="TotalsRow">
        ${cell("", "String")}
        ${cell("", "String")}
        ${cell("", "String")}
        ${cell("", "String")}
        ${cell("MONTHLY TOTALS", "String")}
        ${cell(profitTotals.serviceFee, "Number")}
        ${cell(profitTotals.gst, "Number")}
        ${cell(profitTotals.caregivers, "Number")}
        ${cell(profitTotals.razorpay, "Number")}
        ${cell(profitTotals.otherCharges, "Number")}
        ${cell(profitTotals.ammaSeva, "Number")}
        ${cell(profitTotals.officeMaintenance, "Number")}
        ${cell(profitTotals.profit, "Number")}
        ${cell("", "String")}
      </Row>`,
      `<Row ss:StyleID="TotalsRow">
        ${cell("", "String")}
        ${cell("", "String")}
        ${cell("", "String")}
        ${cell("", "String")}
        ${cell("", "String")}
        ${cell("", "String")}
        ${cell("", "String")}
        ${cell("", "String")}
        ${cell("", "String")}
        ${cell("", "String")}
        ${cell("TOTAL PROFIT EARNED FOR THE MONTH (₹)", "String")}
        ${cell(profitTotals.profit, "Number")}
        ${cell("", "String")}
      </Row>`,
      `<Row></Row>`,
      `<Row><Cell ss:StyleID="Italic"><Data ss:Type="String">Formula note: Amma Seva Amount = Service Fee − Payment to Caregivers − Razorpay (2%) − Other Charges (1%). GST is recorded separately and is not deducted from Amma Seva Amount. Office Maintenance (15%) and Profit (5%) are calculated on Amma Seva Amount.</Data></Cell></Row>`
    );

    // 2. Worksheet 2 XML: Monthly GST Collection Register
    const sheet2Rows: string[] = [
      `<Row><Cell ss:StyleID="BrandHeader"><Data ss:Type="String">AMMA SEVA</Data></Cell></Row>`,
      `<Row><Cell ss:StyleID="SubHeader"><Data ss:Type="String">MONTHLY GST COLLECTION REGISTER</Data></Cell></Row>`,
      `<Row><Cell ss:StyleID="Italic"><Data ss:Type="String">Professional Care with a Mother's Touch.</Data></Cell></Row>`,
      `<Row></Row>`,
      `<Row><Cell ss:StyleID="Bold"><Data ss:Type="String">Month / Year:</Data></Cell><Cell ss:StyleID="Bold"><Data ss:Type="String">${periodName}</Data></Cell><Cell><Data ss:Type="String"></Data></Cell><Cell ss:StyleID="Italic"><Data ss:Type="String">Enter GST amount for each invoice in the GST column.</Data></Cell></Row>`,
      `<Row></Row>`,
      `<Row ss:StyleID="TableColHeader">
        ${cell("Serial No.", "String")}
        ${cell("Date", "String")}
        ${cell("Invoice No.", "String")}
        ${cell("Customer Details", "String")}
        ${cell("Type of Service", "String")}
        ${cell("Service Fee(₹)", "String")}
        ${cell("GST (₹)", "String")}
        ${cell("Note", "String")}
      </Row>`
    ];

    gstRegisterRows.forEach((r) => {
      sheet2Rows.push(
        `<Row>
          ${cell(r.serialNo, "Number")}
          ${cell(r.date, "String")}
          ${cell(r.invoiceNo, "String")}
          ${cell(r.customerDetails, "String")}
          ${cell(r.typeOfService, "String")}
          ${cell(r.serviceFee, "Number")}
          ${cell(r.gst, "Number")}
          ${cell(r.note, "String")}
        </Row>`
      );
    });

    sheet2Rows.push(
      `<Row></Row>`,
      `<Row ss:StyleID="TotalsRow">
        ${cell("", "String")}
        ${cell("", "String")}
        ${cell("", "String")}
        ${cell("", "String")}
        ${cell("TOTAL FOR THE MONTH", "String")}
        ${cell(gstTotals.serviceFee, "Number")}
        ${cell(gstTotals.gst, "Number")}
        ${cell("", "String")}
      </Row>`,
      `<Row ss:StyleID="TotalsRow">
        ${cell("", "String")}
        ${cell("", "String")}
        ${cell("", "String")}
        ${cell("", "String")}
        ${cell("", "String")}
        ${cell("TOTAL GST COLLECTED FOR THE MONTH (₹)", "String")}
        ${cell(gstTotals.gst, "Number")}
        ${cell("", "String")}
      </Row>`,
      `<Row></Row>`,
      `<Row><Cell ss:StyleID="Italic"><Data ss:Type="String">Note: Enter the GST amount actually charged on each invoice. The monthly GST total updates automatically.</Data></Cell></Row>`
    );

    // 3. Worksheet 3 XML: Monthly Transactions Register
    const sheet3Rows: string[] = [
      `<Row><Cell ss:StyleID="BrandHeader"><Data ss:Type="String">AMMA SEVA — MONTHLY TRANSACTIONS REGISTER</Data></Cell></Row>`,
      `<Row><Cell ss:StyleID="Bold"><Data ss:Type="String">Month: ${monthWord}     Year: ${yearWord}</Data></Cell></Row>`,
      `<Row></Row>`,
      `<Row ss:StyleID="TableColHeader">
        ${cell("S. No.", "String")}
        ${cell("Date", "String")}
        ${cell("Description of Transaction", "String")}
        ${cell("Credit (₹)", "String")}
        ${cell("Debit (₹)", "String")}
        ${cell("Daily Net (₹)", "String")}
        ${cell("Notes / Reference", "String")}
        ${cell("", "String")}
        ${cell("Day", "String")}
        ${cell("Daily Credits (₹)", "String")}
        ${cell("Daily Debits (₹)", "String")}
        ${cell("Daily Net (₹)", "String")}
      </Row>`
    ];

    const maxRows = Math.max(31, transactionsList.length);
    for (let i = 0; i < maxRows; i++) {
      const tx = transactionsList[i];
      const dayNum = i + 1;
      const dayData = dayNum <= 31 ? daySummaryMap[dayNum] : null;

      const left = tx
        ? [
          cell(tx.serialNo, "Number"),
          cell(tx.date, "String"),
          cell(tx.description, "String"),
          cell(tx.credit, "Number"),
          cell(tx.debit, "Number"),
          cell(tx.dailyNet, "Number"),
          cell(tx.notes, "String")
        ].join("")
        : [cell("", "String"), cell("", "String"), cell("", "String"), cell("", "String"), cell("", "String"), cell("", "String"), cell("", "String")].join("");

      const right = dayData
        ? [
          cell(dayNum, "Number"),
          cell(dayData.credits, "Number"),
          cell(dayData.debits, "Number"),
          cell(dayData.net, "Number")
        ].join("")
        : [cell("", "String"), cell("", "String"), cell("", "String"), cell("", "String")].join("");

      sheet3Rows.push(`<Row>${left}${cell("", "String")}${right}</Row>`);
    }

    sheet3Rows.push(
      `<Row></Row>`,
      `<Row ss:StyleID="TotalsRow">
        ${cell("", "String")}${cell("", "String")}
        ${cell("TOTAL CREDITS", "String")}
        ${cell(txTotals.totalCredits, "Number")}
        ${cell("", "String")}${cell("", "String")}${cell("", "String")}${cell("", "String")}
        ${cell("", "String")}${cell("", "String")}${cell("", "String")}${cell("", "String")}
      </Row>`,
      `<Row ss:StyleID="TotalsRow">
        ${cell("", "String")}${cell("", "String")}
        ${cell("TOTAL DEBITS", "String")}
        ${cell(txTotals.totalDebits, "Number")}
        ${cell("", "String")}${cell("", "String")}${cell("", "String")}${cell("", "String")}
        ${cell("", "String")}${cell("", "String")}${cell("", "String")}${cell("", "String")}
      </Row>`,
      `<Row ss:StyleID="TotalsRow">
        ${cell("", "String")}${cell("", "String")}
        ${cell("NET (CREDITS − DEBITS)", "String")}
        ${cell(txTotals.net, "Number")}
        ${cell("", "String")}${cell("", "String")}${cell("", "String")}${cell("", "String")}
        ${cell("", "String")}${cell("", "String")}${cell("", "String")}${cell("", "String")}
      </Row>`
    );

    // Assemble complete multi-sheet XML Spreadsheet 2003
    const xmlWorkbook = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
  <Styles>
    <Style ss:ID="Default" ss:Name="Normal">
      <Alignment ss:Vertical="Center"/>
      <Borders/>
      <Font ss:FontName="Calibri" ss:Size="11"/>
    </Style>
    <Style ss:ID="BrandHeader">
      <Font ss:FontName="Calibri" ss:Size="14" ss:Bold="1" ss:Color="#1E2A5A"/>
      <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
    </Style>
    <Style ss:ID="SubHeader">
      <Font ss:FontName="Calibri" ss:Size="12" ss:Bold="1" ss:Color="#C9A24C"/>
    </Style>
    <Style ss:ID="Bold">
      <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1"/>
    </Style>
    <Style ss:ID="Italic">
      <Font ss:FontName="Calibri" ss:Size="10" ss:Italic="1" ss:Color="#64748B"/>
    </Style>
    <Style ss:ID="TableColHeader">
      <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
      <Interior ss:Color="#1E2A5A" ss:Pattern="Solid"/>
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
    </Style>
    <Style ss:ID="TotalsRow">
      <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#0F172A"/>
      <Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/>
      <Borders>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
        <Border ss:Position="Bottom" ss:LineStyle="Double" ss:Weight="2" ss:Color="#94A3B8"/>
      </Borders>
    </Style>
  </Styles>
  <Worksheet ss:Name="Monthly Profit Register">
    <Table>
      ${sheet1Rows.join("\n")}
    </Table>
  </Worksheet>
  <Worksheet ss:Name="Monthly GST Register">
    <Table>
      ${sheet2Rows.join("\n")}
    </Table>
  </Worksheet>
  <Worksheet ss:Name="Transactions Register">
    <Table>
      ${sheet3Rows.join("\n")}
    </Table>
  </Worksheet>
</Workbook>`;

    const blob = new Blob([xmlWorkbook], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const cleanPeriod = periodName.replace(/[^a-zA-Z0-9_-]/g, "_");
    a.href = url;
    a.download = `Amma_Seva_Monthly_Ledger_Registers_${cleanPeriod}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("🌟 All 3 Registers downloaded in one Excel Workbook (.xls)!");
  };

  // Download all 3 separate CSV files sequentially
  const handleDownloadAllThreeCSVs = () => {
    handleDownloadProfitRegisterCSV();
    setTimeout(() => {
      handleDownloadGSTRegisterCSV();
    }, 400);
    setTimeout(() => {
      handleDownloadTransactionsRegisterCSV();
    }, 800);
    showToast("📦 Downloading all 3 separate CSV registers...");
  };

  const handleTriggerRefresh = async () => {
    if (!onRefresh) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
      showToast("Data refreshed successfully!");
    } catch (e: any) {
      showToast("Refresh error: " + e.message);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 text-left">
      {/* Toast Alert Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-[#1e2a5a] text-white px-5 py-3 rounded-2xl shadow-2xl border border-[#c9a24c]/40 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="h-5 w-5 text-[#c9a24c]" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MASTER TOP HEADER & QUICK STATS                                           */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-md shadow-slate-100/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#c9a24c]/10 to-[#1e2a5a]/5 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5">
          <div>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-[#1e2a5a] text-[#c9a24c] flex items-center justify-center font-bold shadow-lg shadow-[#1e2a5a]/20">
                <FileSpreadsheet className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-black text-[#1e2a5a] tracking-tight font-display">
                    Monthly Financial Ledger & Registers
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#c9a24c]/20 text-[#1e2a5a] text-[10px] font-extrabold uppercase tracking-wider border border-[#c9a24c]/30">
                    3 Registers
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">
                  AMMA SEVA — Professional Care with a Mother's Touch • Monthly Profit Register, GST Register & Cash Day Book
                </p>
              </div>
            </div>
          </div>

          {/* Master Download Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            <button
              onClick={handleTriggerRefresh}
              disabled={isRefreshing}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer font-bold text-xs flex items-center gap-1.5"
              title="Refresh Records"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin text-[#c9a24c]" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {/* 3 Sheets in One Excel Workbook */}
            <button
              onClick={handleDownloadCompleteWorkbookXLS}
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-gradient-to-r from-[#1e2a5a] to-[#2d3f82] hover:from-[#151e40] hover:to-[#223066] text-white rounded-xl text-xs font-extrabold shadow-md hover:shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2 border border-[#c9a24c]/40"
            >
              <Download className="h-4 w-4 text-[#c9a24c]" />
              <span>Download Excel Workbook (All 3 Sheets)</span>
            </button>

            {/* Download All 3 Separate CSVs */}
            <button
              onClick={handleDownloadAllThreeCSVs}
              className="px-3.5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-extrabold shadow-sm hover:shadow transition-all cursor-pointer flex items-center gap-1.5"
              title="Download 3 separate CSV files"
            >
              <FileText className="h-4 w-4" />
              <span>Download 3 CSVs</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* KPI SUMMARY CARDS FOR ACTIVE PERIOD                                       */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
          {/* Card 1: Service Fee */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-extrabold uppercase tracking-wider">Service Fee (Base)</span>
              <Receipt className="h-4 w-4 text-[#1e2a5a]" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-[#1e2a5a] tracking-tight">
              ₹{profitTotals.serviceFee.toLocaleString("en-IN")}
            </div>
            <p className="text-[10px] text-slate-500 font-medium mt-1">
              From {profitRegisterRows.length} active invoices
            </p>
          </div>

          {/* Card 2: 18% GST */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-extrabold uppercase tracking-wider">GST (18% Total)</span>
              <Percent className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-blue-900 tracking-tight">
              ₹{profitTotals.gst.toLocaleString("en-IN")}
            </div>
            <p className="text-[10px] text-slate-500 font-medium mt-1">
              Recorded separately (CGST 9% + SGST 9%)
            </p>
          </div>

          {/* Card 3: Caregiver Payouts */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-extrabold uppercase tracking-wider">Caregiver Payouts</span>
              <Coins className="h-4 w-4 text-amber-600" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-800 tracking-tight">
              ₹{profitTotals.caregivers.toLocaleString("en-IN")}
            </div>
            <p className="text-[10px] text-slate-500 font-medium mt-1">
              Deducted from Service Fee
            </p>
          </div>

          {/* Card 4: Monthly Net Profit (5%) */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-4 relative overflow-hidden">
            <div className="flex items-center justify-between text-emerald-700 mb-1">
              <span className="text-[11px] font-extrabold uppercase tracking-wider">Net Profit 5%</span>
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-800 tracking-tight">
              ₹{profitTotals.profit.toLocaleString("en-IN")}
            </div>
            <p className="text-[10px] text-emerald-700 font-semibold mt-1">
              Office Maint (15%): ₹{profitTotals.officeMaintenance.toLocaleString("en-IN")}
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* FILTER & DATE CONTROLS BAR                                                */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Month / Year Dropdown */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5 whitespace-nowrap">
                <Calendar className="h-4 w-4 text-[#c9a24c]" />
                <span>Month:</span>
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                  setStartDate("");
                  setEndDate("");
                }}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[#1e2a5a] outline-none cursor-pointer focus:ring-2 focus:ring-[#1e2a5a]/20"
              >
                <option value="all">All Months (All Time)</option>
                {availableMonths.map((m) => (
                  <option key={m} value={m}>
                    {formatMonthLabel(m)}
                  </option>
                ))}
              </select>
            </div>

            {/* Custom Date Range Picker */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400">or Custom:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
                title="Start Date"
              />
              <span className="text-xs font-bold text-slate-400">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
                title="End Date"
              />
              {(startDate || endDate) && (
                <button
                  onClick={() => {
                    setStartDate("");
                    setEndDate("");
                  }}
                  className="text-[11px] font-bold text-red-600 hover:underline"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Quick Search */}
          <div className="relative w-full md:w-72">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search Client, Patient, #BK..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-[#1e2a5a]/20"
            />
          </div>
        </div>

        {/* Register View Switcher Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100">
          <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
            <Layers className="h-3.5 w-3.5 text-[#c9a24c]" />
            <span>Select Sheet:</span>
          </span>

          <button
            onClick={() => setActiveView("all")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeView === "all"
                ? "bg-[#1e2a5a] text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
          >
            All 3 Registers Overview
          </button>

          <button
            onClick={() => setActiveView("profit")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${activeView === "profit"
                ? "bg-[#1e2a5a] text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
          >
            <TrendingUp className="h-3.5 w-3.5 text-[#c9a24c]" />
            <span>Sheet 1: Monthly Profit Register</span>
          </button>

          <button
            onClick={() => setActiveView("gst")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${activeView === "gst"
                ? "bg-[#1e2a5a] text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
          >
            <Receipt className="h-3.5 w-3.5 text-blue-500" />
            <span>Sheet 2: Monthly GST Collection Register</span>
          </button>

          <button
            onClick={() => setActiveView("transactions")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${activeView === "transactions"
                ? "bg-[#1e2a5a] text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
          >
            <Landmark className="h-3.5 w-3.5 text-emerald-500" />
            <span>Sheet 3: Transactions Register (Day Book)</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW: SHEET 1 — MONTHLY PROFIT REGISTER                                   */}
      {/* ========================================================================= */}
      {(activeView === "all" || activeView === "profit") && (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-md overflow-hidden">
          {/* Header Banner */}
          <div className="p-5 bg-gradient-to-r from-slate-900 to-[#1e2a5a] text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-[#c9a24c] text-slate-950 text-[10px] font-black uppercase">
                  Sheet 1
                </span>
                <h3 className="text-lg font-black tracking-tight font-display">
                  Monthly Profit Register
                </h3>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Period: <span className="text-[#c9a24c] font-bold">{activePeriodTitle}</span> • Razorpay (2%) and Other Charges (1%) calculated on Service Fee.
              </p>
            </div>

            <button
              onClick={handleDownloadProfitRegisterCSV}
              className="px-4 py-2 bg-[#c9a24c] hover:bg-[#b38f3f] text-[#1e2a5a] rounded-xl text-xs font-black shadow-md transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Download className="h-4 w-4" />
              <span>Download Profit Register (CSV)</span>
            </button>
          </div>

          {/* Formula Callout Banner */}
          <div className="px-5 py-3 bg-amber-50 border-b border-amber-100 text-amber-900 text-[11px] font-semibold flex items-start gap-2">
            <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Formula Note: </span>
              Amma Seva Amount = Service Fee − Payment to Caregivers − Razorpay (2%) − Other Charges (1%). GST is recorded separately and is not deducted from Amma Seva Amount. Office Maintenance (15%) and Profit (5%) are calculated on Amma Seva Amount.
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-100/90 text-slate-700 font-bold sticky top-0 z-10 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3">S.No</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Invoice No.</th>
                  <th className="py-3 px-4">Customer Details</th>
                  <th className="py-3 px-3">Type of Service</th>
                  <th className="py-3 px-3 text-right">Service Fee (₹)</th>
                  <th className="py-3 px-3 text-right">GST (₹)</th>
                  <th className="py-3 px-3 text-right">Caregiver Pay (₹)</th>
                  <th className="py-3 px-3 text-right">Razorpay 2% (₹)</th>
                  <th className="py-3 px-3 text-right">Other 1% (₹)</th>
                  <th className="py-3 px-3 text-right font-extrabold text-[#1e2a5a] bg-slate-200/50">
                    Amma Seva Amt (₹)
                  </th>
                  <th className="py-3 px-3 text-right">Office Maint 15% (₹)</th>
                  <th className="py-3 px-3 text-right font-extrabold text-emerald-700 bg-emerald-50">
                    Profit 5% (₹)
                  </th>
                  <th className="py-3 px-3">Note</th>
                  <th className="py-3 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {profitRegisterRows.length === 0 ? (
                  <tr>
                    <td colSpan={15} className="py-12 text-center text-slate-400 font-semibold">
                      No invoices or booking records found for {activePeriodTitle}.
                    </td>
                  </tr>
                ) : (
                  profitRegisterRows.map((r) => (
                    <tr key={r.serialNo} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 text-slate-500 font-bold">{r.serialNo}</td>
                      <td className="py-2.5 px-3 text-slate-700">{r.date}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-[#1e2a5a]">{r.invoiceNo}</td>
                      <td className="py-2.5 px-4 font-semibold text-slate-900 max-w-xs truncate" title={r.customerDetails}>
                        {r.customerDetails}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">{r.typeOfService}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                        ₹{r.serviceFee.toLocaleString("en-IN")}
                      </td>
                      <td className="py-2.5 px-3 text-right text-blue-700 font-semibold">
                        ₹{r.gst.toLocaleString("en-IN")}
                      </td>
                      <td className="py-2.5 px-3 text-right text-amber-700 font-semibold">
                        ₹{r.paymentToCaregivers.toLocaleString("en-IN")}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-500">
                        ₹{r.razorpayFee.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-500">
                        ₹{r.otherCharges.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-extrabold text-[#1e2a5a] bg-slate-50">
                        ₹{r.ammaSevaAmount.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-600">
                        ₹{r.officeMaintenance.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-emerald-700 bg-emerald-50/60">
                        ₹{r.profit.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 text-[11px]">{r.note}</td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteRecord(r.rawBooking.id, r.rawBooking.name)}
                          disabled={isDeletingId === r.rawBooking.id}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-500 hover:text-white text-rose-600 border border-rose-200 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                          title="Delete Transaction Permanently from Database"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {profitRegisterRows.length > 0 && (
                <tfoot className="bg-slate-900 text-white font-extrabold sticky bottom-0">
                  <tr>
                    <td colSpan={5} className="py-3 px-4 uppercase text-[11px] tracking-wider text-[#c9a24c]">
                      MONTHLY TOTALS ({profitRegisterRows.length} Bookings)
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-xs">
                      ₹{profitTotals.serviceFee.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-xs text-blue-300">
                      ₹{profitTotals.gst.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-xs text-amber-300">
                      ₹{profitTotals.caregivers.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-xs text-slate-300">
                      ₹{profitTotals.razorpay.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-xs text-slate-300">
                      ₹{profitTotals.otherCharges.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-xs text-[#c9a24c] bg-slate-800">
                      ₹{profitTotals.ammaSeva.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-xs text-slate-300">
                      ₹{profitTotals.officeMaintenance.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-sm text-emerald-400 bg-emerald-950/80">
                      ₹{profitTotals.profit.toFixed(2)}
                    </td>
                    <td className="py-3 px-3"></td>
                    <td className="py-3 px-3"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* Profit Highlight Footer */}
          {profitRegisterRows.length > 0 && (
            <div className="p-4 bg-emerald-50 border-t border-emerald-100 flex flex-col sm:flex-row justify-between items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-900">
                TOTAL PROFIT EARNED FOR THE MONTH (₹)
              </span>
              <span className="text-2xl font-black text-emerald-700 font-mono tracking-tight">
                ₹{profitTotals.profit.toFixed(2)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW: SHEET 2 — MONTHLY GST COLLECTION REGISTER                          */}
      {/* ========================================================================= */}
      {(activeView === "all" || activeView === "gst") && (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-md overflow-hidden">
          {/* Header Banner */}
          <div className="p-5 bg-gradient-to-r from-blue-950 to-slate-900 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-blue-500 text-white text-[10px] font-black uppercase">
                  Sheet 2
                </span>
                <h3 className="text-lg font-black tracking-tight font-display">
                  Monthly GST Collection Register
                </h3>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Period: <span className="text-blue-300 font-bold">{activePeriodTitle}</span> • Enter GST amount for each invoice in the GST column.
              </p>
            </div>

            <button
              onClick={handleDownloadGSTRegisterCSV}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-md transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Download className="h-4 w-4" />
              <span>Download GST Register (CSV)</span>
            </button>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-100/90 text-slate-700 font-bold sticky top-0 z-10 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3">Serial No.</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Invoice No.</th>
                  <th className="py-3 px-4">Customer Details</th>
                  <th className="py-3 px-3">Type of Service</th>
                  <th className="py-3 px-4 text-right">Service Fee (₹)</th>
                  <th className="py-3 px-4 text-right text-blue-900 bg-blue-50/50 font-extrabold">
                    GST (₹)
                  </th>
                  <th className="py-3 px-4">Note / Tax Audit</th>
                  <th className="py-3 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {gstRegisterRows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400 font-semibold">
                      No tax invoices found for {activePeriodTitle}.
                    </td>
                  </tr>
                ) : (
                  gstRegisterRows.map((r) => (
                    <tr key={r.serialNo} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 text-slate-500 font-bold">{r.serialNo}</td>
                      <td className="py-2.5 px-3 text-slate-700">{r.date}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-950">{r.invoiceNo}</td>
                      <td className="py-2.5 px-4 font-semibold text-slate-900">{r.customerDetails}</td>
                      <td className="py-2.5 px-3 text-slate-700">{r.typeOfService}</td>
                      <td className="py-2.5 px-4 text-right font-bold text-slate-900">
                        ₹{r.serviceFee.toLocaleString("en-IN")}
                      </td>
                      <td className="py-2.5 px-4 text-right font-black text-blue-800 bg-blue-50/30 font-mono">
                        ₹{r.gst.toLocaleString("en-IN")}
                      </td>
                      <td className="py-2.5 px-4 text-slate-500 text-[11px] font-mono">{r.note}</td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteRecord(r.rawBooking.id, r.rawBooking.name)}
                          disabled={isDeletingId === r.rawBooking.id}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-500 hover:text-white text-rose-600 border border-rose-200 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                          title="Delete Transaction Permanently from Database"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {gstRegisterRows.length > 0 && (
                <tfoot className="bg-slate-900 text-white font-extrabold sticky bottom-0">
                  <tr>
                    <td colSpan={5} className="py-3 px-4 uppercase text-[11px] tracking-wider text-blue-300">
                      TOTAL FOR THE MONTH ({gstRegisterRows.length} Invoices)
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-xs">
                      ₹{gstTotals.serviceFee.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-sm text-blue-300 bg-blue-950">
                      ₹{gstTotals.gst.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-4"></td>
                    <td className="py-3 px-3"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* GST Highlight Footer */}
          {gstRegisterRows.length > 0 && (
            <div className="p-4 bg-blue-50 border-t border-blue-100 flex flex-col sm:flex-row justify-between items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-blue-950">
                TOTAL GST COLLECTED FOR THE MONTH (₹)
              </span>
              <span className="text-2xl font-black text-blue-800 font-mono tracking-tight">
                ₹{gstTotals.gst.toLocaleString("en-IN")}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW: SHEET 3 — MONTHLY TRANSACTIONS REGISTER (DAY BOOK & CASH)           */}
      {/* ========================================================================= */}
      {(activeView === "all" || activeView === "transactions") && (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-md overflow-hidden">
          {/* Header Banner */}
          <div className="p-5 bg-gradient-to-r from-emerald-950 via-slate-900 to-[#1e2a5a] text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-emerald-500 text-slate-950 text-[10px] font-black uppercase">
                  Sheet 3
                </span>
                <h3 className="text-lg font-black tracking-tight font-display">
                  Monthly Transactions Register (Day Book & Daily Net)
                </h3>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Period: <span className="text-emerald-300 font-bold">{activePeriodTitle}</span> • Credit: Money Received | Debit: Money Paid Out | Daily Net = Credit − Debit.
              </p>
            </div>

            <button
              onClick={handleDownloadTransactionsRegisterCSV}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Download className="h-4 w-4" />
              <span>Download Transactions Register (CSV)</span>
            </button>
          </div>

          {/* Split 2-Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
            {/* Left 2 Cols: Detailed Transactions List */}
            <div className="lg:col-span-2 overflow-x-auto max-h-[550px] overflow-y-auto">
              <div className="p-3 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700 flex justify-between items-center">
                <span>Detailed Cash & Bank Transactions</span>
                <span className="text-[11px] text-slate-500 font-normal">
                  Showing {transactionsList.length} transaction entries
                </span>
              </div>
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-slate-100/90 text-slate-700 font-bold sticky top-0 z-10 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">S. No.</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Description of Transaction</th>
                    <th className="py-2.5 px-3 text-right text-emerald-800">Credit (₹)</th>
                    <th className="py-2.5 px-3 text-right text-red-800">Debit (₹)</th>
                    <th className="py-2.5 px-3 text-right font-extrabold">Daily Net (₹)</th>
                    <th className="py-2.5 px-3">Notes / Ref</th>
                    <th className="py-2.5 px-2 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactionsList.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400 font-semibold">
                        No transactions recorded for {activePeriodTitle}.
                      </td>
                    </tr>
                  ) : (
                    transactionsList.map((t) => (
                      <tr key={t.serialNo} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2 px-3 text-slate-500 font-bold">{t.serialNo}</td>
                        <td className="py-2 px-3 text-slate-700 font-mono text-[11px]">{t.date}</td>
                        <td className="py-2 px-3 font-semibold text-slate-900 max-w-xs truncate" title={t.description}>
                          {t.description}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-emerald-700">
                          {t.credit > 0 ? `₹${t.credit.toLocaleString("en-IN")}` : "—"}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-red-700">
                          {t.debit > 0 ? `₹${t.debit.toLocaleString("en-IN")}` : "—"}
                        </td>
                        <td
                          className={`py-2 px-3 text-right font-black font-mono ${t.dailyNet >= 0 ? "text-emerald-700" : "text-red-700"
                            }`}
                        >
                          {t.dailyNet >= 0 ? `+₹${t.dailyNet.toLocaleString("en-IN")}` : `-₹${Math.abs(t.dailyNet).toLocaleString("en-IN")}`}
                        </td>
                        <td className="py-2 px-3 text-slate-500 text-[11px]">{t.notes}</td>
                        <td className="py-2 px-2 text-center">
                          {t.bookingId && (
                            <button
                              type="button"
                              onClick={() => handleDeleteRecord(t.bookingId!, t.rawBooking?.name)}
                              disabled={isDeletingId === t.bookingId}
                              className="p-1 rounded-md bg-rose-50 hover:bg-rose-500 hover:text-white text-rose-600 border border-rose-200 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                              title="Delete Transaction Permanently from Database"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Right Col: 31-Day Block Summary Table */}
            <div className="overflow-x-auto max-h-[550px] overflow-y-auto">
              <div className="p-3 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700 flex justify-between items-center">
                <span>31-Day Block Calendar Totals</span>
                <span className="text-[10px] text-slate-500 font-semibold">Day 1 to 31</span>
              </div>
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-slate-100/90 text-slate-700 font-bold sticky top-0 z-10 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Day</th>
                    <th className="py-2.5 px-3 text-right text-emerald-800">Credits (₹)</th>
                    <th className="py-2.5 px-3 text-right text-red-800">Debits (₹)</th>
                    <th className="py-2.5 px-3 text-right font-extrabold">Daily Net (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((dayNum) => {
                    const row = daySummaryMap[dayNum];
                    const hasActivity = row.credits > 0 || row.debits > 0;
                    return (
                      <tr
                        key={dayNum}
                        className={`transition-colors ${hasActivity ? "bg-amber-50/30 font-semibold" : "text-slate-400"
                          }`}
                      >
                        <td className="py-1.5 px-3 font-bold text-slate-600">Day {dayNum}</td>
                        <td className="py-1.5 px-3 text-right text-emerald-700">
                          {row.credits > 0 ? `₹${row.credits.toLocaleString("en-IN")}` : "0"}
                        </td>
                        <td className="py-1.5 px-3 text-right text-red-700">
                          {row.debits > 0 ? `₹${row.debits.toLocaleString("en-IN")}` : "0"}
                        </td>
                        <td
                          className={`py-1.5 px-3 text-right font-mono ${row.net > 0 ? "text-emerald-700 font-bold" : row.net < 0 ? "text-red-700 font-bold" : "text-slate-400"
                            }`}
                        >
                          {row.net !== 0 ? `₹${row.net.toLocaleString("en-IN")}` : "0"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Transactions Bottom Totals Bar */}
          <div className="p-4 bg-slate-900 text-white flex flex-wrap justify-between items-center gap-4 text-xs">
            <div className="flex flex-wrap items-center gap-6">
              <div>
                <span className="text-slate-400 text-[10px] uppercase block font-bold">TOTAL CREDITS</span>
                <span className="text-lg font-mono font-black text-emerald-400">
                  ₹{txTotals.totalCredits.toLocaleString("en-IN")}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase block font-bold">TOTAL DEBITS</span>
                <span className="text-lg font-mono font-black text-red-400">
                  ₹{txTotals.totalDebits.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="border-l border-slate-700 pl-6">
                <span className="text-[#c9a24c] text-[10px] uppercase block font-bold">NET CASHFLOW (CREDITS − DEBITS)</span>
                <span
                  className={`text-xl font-mono font-black ${txTotals.net >= 0 ? "text-emerald-300" : "text-red-400"
                    }`}
                >
                  ₹{txTotals.net.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            <button
              onClick={handleDownloadTransactionsRegisterCSV}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Download className="h-4 w-4" />
              <span>Export Day Book</span>
            </button>
          </div>

          {/* How to Use Instructions */}
          <div className="p-5 bg-slate-50 border-t border-slate-200">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2">
              HOW TO USE — MONTHLY TRANSACTIONS REGISTER (DAY BOOK)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-slate-600">
              <div className="flex gap-2">
                <span className="font-bold text-[#c9a24c]">Step 1:</span>
                <span>Select the Month and Year at the top to filter bookings and payouts automatically.</span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold text-[#c9a24c]">Step 2:</span>
                <span>Each date maps to a block of transactions for days 1 through 31.</span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold text-[#c9a24c]">Step 3:</span>
                <span>Credit indicates incoming payments (advances & settlements) from clients.</span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold text-[#c9a24c]">Step 4:</span>
                <span>Debit indicates caregiver salaries, payouts, and operational expenses.</span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold text-[#c9a24c]">Step 5:</span>
                <span>Daily Net (₹) automatically calculates Credit minus Debit for each entry.</span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold text-[#c9a24c]">Step 6:</span>
                <span>The summary table on the right displays totals for each day's activity block.</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

