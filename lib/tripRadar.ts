import type { Customer } from "../types/customer";

export type TripFilter =
  | "all"
  | "new"
  | "quote"
  | "confirmed"
  | "upcoming"
  | "departed"
  | "completed";

export type TripRow = {
  customerId: string;
  brand: string;
  tripNumber: string;
  customerName: string;
  tripName: string;
  departureDate: string;
  returnDate: string;
  status: string;
  paymentStatus: string;
  travelDocumentsStatus: string;
};

export function getTripRows(customers: Customer[]) {
  return customers.map((customer) => ({
    customerId: customer.id,
    brand: customer.brand,
    tripNumber: customer.tripNumber || customer.offerNumber || "-",
    customerName: `${customer.firstName} ${customer.lastName}`,
    tripName: customer.tripName || customer.destination || "Nog te bepalen",
    departureDate: customer.departureDate,
    returnDate: customer.returnDate,
    status: getTripStatus(customer),
    paymentStatus: getPaymentStatus(customer),
    travelDocumentsStatus: getTravelDocumentsStatus(customer)
  }));
}

export function filterTripRows(
  rows: TripRow[],
  filter: TripFilter,
  today = getTodayDate()
) {
  if (filter === "all") {
    return rows;
  }

  return rows.filter((row) => {
    if (filter === "new") {
      return row.status === "Nieuwe aanvraag";
    }

    if (filter === "quote") {
      return row.status === "Offertefase";
    }

    if (filter === "confirmed") {
      return row.status === "Bevestigd";
    }

    if (filter === "upcoming") {
      return isWithinNextDays(row.departureDate, today, 30);
    }

    if (filter === "departed") {
      return Boolean(row.departureDate) && row.departureDate <= today && row.status !== "Afgerond";
    }

    if (filter === "completed") {
      return row.status === "Afgerond";
    }

    return true;
  });
}

export function searchTripRows(rows: TripRow[], query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return rows;
  }

  return rows.filter((row) => {
    return [
      row.customerName,
      row.brand,
      row.tripNumber,
      row.tripName
    ].some((value) => value.toLowerCase().includes(normalizedQuery));
  });
}

export function getTripStats(customers: Customer[], today = getTodayDate()) {
  const rows = getTripRows(customers);

  return {
    upcomingWithin30Days: filterTripRows(rows, "upcoming", today).length,
    newRequests: rows.filter((row) => row.status === "Nieuwe aanvraag").length,
    openPayments: rows.filter((row) => row.paymentStatus !== "Betaald" && row.paymentStatus !== "-").length
  };
}

function getTripStatus(customer: Customer) {
  const today = getTodayDate();

  if (customer.status === "Nieuwe aanvraag") {
    return "Nieuwe aanvraag";
  }

  if (customer.quoteConfirmed !== true) {
    return "Offertefase";
  }

  if (customer.returnDate && customer.returnDate < today) {
    return "Afgerond";
  }

  if (customer.departureDate && customer.departureDate <= today) {
    return "Vertrokken";
  }

  return "Bevestigd";
}

function getPaymentStatus(customer: Customer) {
  if (customer.quoteConfirmed !== true) {
    return "-";
  }

  if (customer.paymentType === "full") {
    return customer.fullPaymentReceived ? "Betaald" : "Open volledige betaling";
  }

  if (!customer.depositReceived) {
    return "Aanbetaling open";
  }

  if (!customer.finalPaymentReceived) {
    return "Restantbetaling open";
  }

  return "Betaald";
}

function getTravelDocumentsStatus(customer: Customer) {
  if (customer.quoteConfirmed !== true) {
    return "-";
  }

  if (customer.travelDocumentsSent) {
    return "Verstuurd";
  }

  if (customer.travelDocumentsPrepared) {
    return "Voorbereid";
  }

  return "Nog voorbereiden";
}

function isWithinNextDays(dateValue: string, today: string, days: number) {
  return Boolean(dateValue) && dateValue >= today && dateValue <= shiftDate(today, days);
}

function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function shiftDate(dateValue: string, days: number) {
  const date = new Date(`${dateValue}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const monthValue = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${monthValue}-${day}`;
}
