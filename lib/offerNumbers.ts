import type { Customer } from "../types/customer";

const firstOfferNumber = 2614;
const offerNumberYear = 2026;

type NumberSource = {
  offer_number?: string | null;
  trip_number?: string | null;
  invoice_number?: string | null;
};

export function getNextOfferNumberForCustomers(customers: Customer[]) {
  const highestNumber = customers.reduce((highest, customer) => {
    return Math.max(
      highest,
      getSequenceNumber(customer.offerNumber),
      getSequenceNumber(customer.tripNumber),
      getSequenceNumber(customer.invoiceNumber)
    );
  }, firstOfferNumber - 1);

  return `${offerNumberYear}-${highestNumber + 1}`;
}

export function getNextOfferNumberForTrips(
  trips: NumberSource[],
  year = getCurrentYear()
) {
  const highestNumber = trips.reduce((highest, trip) => {
    return Math.max(
      highest,
      getSequenceNumberForYear(trip.offer_number, year),
      getSequenceNumberForYear(trip.trip_number, year),
      getSequenceNumberForYear(trip.invoice_number, year)
    );
  }, getFirstSequenceForYear(year) - 1);

  return `${year}-${highestNumber + 1}`;
}

function getSequenceNumber(value: string | undefined) {
  return getSequenceNumberForYear(value, offerNumberYear);
}

function getSequenceNumberForYear(value: string | null | undefined, year: number) {
  if (!value) {
    return 0;
  }

  const match = value.match(/^(\d{4})-(\d+)$/);

  if (!match || Number(match[1]) !== year) {
    return 0;
  }

  return Number(match[2]);
}

function getFirstSequenceForYear(year: number) {
  return year === offerNumberYear ? firstOfferNumber : 1;
}

function getCurrentYear() {
  return new Date().getFullYear();
}
