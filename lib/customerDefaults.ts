import type { Brand, Customer, Traveler } from "@/types/customer";

export const customerDetailsDefaults = {
  brand: "Feel Nordix" as Brand,
  offerNumber: "",
  quoteSent: false,
  quoteSentDate: "",
  quoteFollowUpDate: "",
  quoteConfirmed: false,
  quoteConfirmedDate: "",
  invoiceDate: "",
  invoiceNumber: "",
  tripNumber: "",
  tripName: "",
  departureDate: "",
  returnDate: "",
  totalAmount: "",
  paymentType: "deposit_and_final" as const,
  depositDueDate: "",
  depositReceived: false,
  depositDate: "",
  finalPaymentDueDate: "",
  finalPaymentReceived: false,
  finalPaymentDate: "",
  fullPaymentDueDate: "",
  fullPaymentReceived: false,
  fullPaymentDate: "",
  travelDocumentsPrepareFromDate: "",
  travelDocumentsPlannedSendDate: "",
  travelDocumentsPrepared: false,
  travelDocumentsSent: false,
  travelDocumentsSentDate: "",
  postTripContacted: false,
  postTripContactDate: "",
  googleReviewLinkSent: false,
  googleReviewLinkSentDate: "",
  travelers: []
};

export function normalizeCustomer(customer: Customer) {
  const hasPaymentType = "paymentType" in customer && Boolean(customer.paymentType);
  const normalizedCustomer = {
    ...customerDetailsDefaults,
    ...customer,
    brand: normalizeBrand(customer.brand)
  };

  const booleanSafeCustomer = normalizeBooleans({
    ...normalizedCustomer,
    travelers: normalizeTravelers(normalizedCustomer.travelers)
  });
  const numberedCustomer = withConfirmedNumbers(booleanSafeCustomer);

  return withAutomaticWorkflowDates(numberedCustomer, !hasPaymentType);
}

function normalizeBrand(brand: unknown): Brand {
  return brand === "Feel Dutch" ? "Feel Dutch" : "Feel Nordix";
}

function normalizeTravelers(travelers: Customer["travelers"]): Traveler[] {
  if (!Array.isArray(travelers)) {
    return [];
  }

  return travelers.map((traveler) => {
    const travelerType: Traveler["type"] =
      traveler.type === "child" ? "child" : "adult";

    return {
      id: traveler.id || cryptoSafeId(),
      firstName: traveler.firstName || "",
      lastName: traveler.lastName || "",
      birthDate: traveler.birthDate || "",
      type: travelerType,
      notes: traveler.notes || ""
    };
  });
}

function cryptoSafeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `traveler-${Math.random().toString(36).slice(2)}`;
}

function normalizeBooleans(customer: Customer) {
  return {
    ...customer,
    quoteSent: toBoolean(customer.quoteSent),
    quoteConfirmed: toBoolean(customer.quoteConfirmed),
    depositReceived: toBoolean(customer.depositReceived),
    finalPaymentReceived: toBoolean(customer.finalPaymentReceived),
    fullPaymentReceived: toBoolean(customer.fullPaymentReceived),
    travelDocumentsPrepared: toBoolean(customer.travelDocumentsPrepared),
    travelDocumentsSent: toBoolean(customer.travelDocumentsSent),
    postTripContacted: toBoolean(customer.postTripContacted),
    googleReviewLinkSent: toBoolean(customer.googleReviewLinkSent)
  };
}

function toBoolean(value: unknown) {
  return value === true || value === "true" || value === "ja";
}

export function withConfirmedNumbers(customer: Customer) {
  if (!customer.quoteConfirmed || !customer.offerNumber) {
    return customer;
  }

  return {
    ...customer,
    tripNumber: customer.tripNumber || customer.offerNumber,
    invoiceNumber: customer.invoiceNumber || customer.offerNumber
  };
}

export function withAutomaticWorkflowDates(customer: Customer, forcePayment = false) {
  return withPaymentDates(
    withQuoteFollowUpDate(withTravelDocumentDates(customer)),
    forcePayment
  );
}

export function withQuoteFollowUpDate(customer: Customer) {
  if (!customer.quoteSentDate || customer.quoteFollowUpDate) {
    return customer;
  }

  return {
    ...customer,
    quoteFollowUpDate: getDefaultQuoteFollowUpDate(customer.quoteSentDate)
  };
}

export function withTravelDocumentDates(customer: Customer) {
  if (!customer.departureDate) {
    return customer;
  }

  const dates = getDefaultTravelDocumentDates(customer.departureDate);

  return {
    ...customer,
    travelDocumentsPrepareFromDate:
      customer.travelDocumentsPrepareFromDate || dates.prepareFromDate,
    travelDocumentsPlannedSendDate:
      customer.travelDocumentsPlannedSendDate || dates.plannedSendDate
  };
}

export function withPaymentDates(customer: Customer, force = false) {
  if (!customer.invoiceDate || !customer.departureDate) {
    return customer;
  }

  const dates = getDefaultPaymentDates(customer.invoiceDate, customer.departureDate);

  return {
    ...customer,
    paymentType: force ? dates.paymentType : customer.paymentType || dates.paymentType,
    depositDueDate: force ? dates.depositDueDate : customer.depositDueDate || dates.depositDueDate,
    finalPaymentDueDate: force
      ? dates.finalPaymentDueDate
      : customer.finalPaymentDueDate || dates.finalPaymentDueDate,
    fullPaymentDueDate: force
      ? dates.fullPaymentDueDate
      : customer.fullPaymentDueDate || dates.fullPaymentDueDate
  };
}

export function recalculateWorkflowDates(customer: Customer) {
  if (!customer.departureDate) {
    return customer;
  }

  const travelDocumentDates = getDefaultTravelDocumentDates(customer.departureDate);
  const paymentDates =
    customer.invoiceDate && customer.departureDate
      ? getDefaultPaymentDates(customer.invoiceDate, customer.departureDate)
      : null;

  return {
    ...customer,
    travelDocumentsPrepareFromDate: travelDocumentDates.prepareFromDate,
    travelDocumentsPlannedSendDate: travelDocumentDates.plannedSendDate,
    ...(paymentDates
      ? {
          paymentType: paymentDates.paymentType,
          depositDueDate: paymentDates.depositDueDate,
          finalPaymentDueDate: paymentDates.finalPaymentDueDate,
          fullPaymentDueDate: paymentDates.fullPaymentDueDate
        }
      : {})
  };
}

export function getCustomerWorkflowState(customer: Customer) {
  return {
    showConfirmedSections: customer.quoteConfirmed === true,
    paymentType: customer.paymentType
  };
}

export function getDefaultPaymentDates(
  invoiceDate: string,
  departureDate: string
) {
  const fullPaymentDueDate = shiftDate(invoiceDate, 8);
  const finalPaymentDueDate = shiftDate(departureDate, -42);
  const paymentType: Customer["paymentType"] = isDepartureWithinSixWeeks(invoiceDate, departureDate)
    ? "full"
    : "deposit_and_final";

  return {
    paymentType,
    depositDueDate: paymentType === "deposit_and_final" ? fullPaymentDueDate : "",
    finalPaymentDueDate: paymentType === "deposit_and_final" ? finalPaymentDueDate : "",
    fullPaymentDueDate: paymentType === "full" ? fullPaymentDueDate : ""
  };
}

export function isDepartureWithinSixWeeks(
  invoiceDate: string,
  departureDate: string
) {
  const invoice = parseDate(invoiceDate);
  const departure = parseDate(departureDate);

  if (!invoice || !departure) {
    return false;
  }

  const sixWeeksAfterInvoice = new Date(invoice);
  sixWeeksAfterInvoice.setDate(sixWeeksAfterInvoice.getDate() + 42);

  return departure <= sixWeeksAfterInvoice;
}

export function getDefaultTravelDocumentDates(departureDate: string) {
  return {
    prepareFromDate: shiftDate(departureDate, -14),
    plannedSendDate: shiftDate(departureDate, -7)
  };
}

export function getDefaultQuoteFollowUpDate(quoteSentDate: string) {
  return shiftDate(quoteSentDate, 7);
}

function shiftDate(dateValue: string, days: number) {
  const date = parseDate(dateValue);

  if (!date) {
    return "";
  }

  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseDate(dateValue: string) {
  const date = new Date(`${dateValue}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}
