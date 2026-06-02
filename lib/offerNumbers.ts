import type { Customer } from "../types/customer";

const firstOfferNumber = 2614;
const offerNumberYear = 2026;

export function getNextOfferNumberForCustomers(customers: Customer[]) {
  const highestNumber = customers.reduce((highest, customer) => {
    return Math.max(
      highest,
      getSequenceNumber(customer.offerNumber),
      getSequenceNumber(customer.tripNumber)
    );
  }, firstOfferNumber - 1);

  return `${offerNumberYear}-${highestNumber + 1}`;
}

function getSequenceNumber(value: string | undefined) {
  if (!value) {
    return 0;
  }

  const match = value.match(/^2026-(\d+)$/);

  if (!match) {
    return 0;
  }

  return Number(match[1]);
}
