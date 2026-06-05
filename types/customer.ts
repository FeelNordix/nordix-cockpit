export type Customer = {
  id: string;
  firstName: string;
  lastName: string;
  companyName: string;
  email: string;
  phone: string;
  streetAddress: string;
  postalCode: string;
  city: string;
  country: string;
  destination: string;
  travelPeriod: string;
  status:
    | "Nieuwe aanvraag"
    | "Intake gepland"
    | "Reisvoorstel"
    | "Geannuleerd"
    | "Op reis geweest";
  notes: string;
  brand: Brand;
  offerNumber: string;
  quoteSent: boolean;
  quoteSentDate: string;
  quoteFollowUpDate: string;
  quoteConfirmed: boolean;
  quoteConfirmedDate: string;
  invoiceDate: string;
  invoiceNumber: string;
  tripNumber: string;
  tripName: string;
  departureDate: string;
  returnDate: string;
  totalAmount: string;
  paymentType: "deposit_and_final" | "full";
  depositDueDate: string;
  depositReceived: boolean;
  depositDate: string;
  finalPaymentDueDate: string;
  finalPaymentReceived: boolean;
  finalPaymentDate: string;
  fullPaymentDueDate: string;
  fullPaymentReceived: boolean;
  fullPaymentDate: string;
  travelDocumentsPrepareFromDate: string;
  travelDocumentsPlannedSendDate: string;
  travelDocumentsPrepared: boolean;
  travelDocumentsSent: boolean;
  travelDocumentsSentDate: string;
  postTripContacted: boolean;
  postTripContactDate: string;
  googleReviewLinkSent: boolean;
  googleReviewLinkSentDate: string;
  travelers: Traveler[];
};

export type Brand = "Feel Nordix" | "Feel Dutch";

export type Traveler = {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  type: "adult" | "child";
  notes: string;
};
