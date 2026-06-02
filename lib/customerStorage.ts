import { mockCustomers } from "@/lib/mockCustomers";
import { normalizeCustomer } from "@/lib/customerDefaults";
import { getNextOfferNumberForCustomers } from "@/lib/offerNumbers";
import type { Customer } from "@/types/customer";

const storageKey = "nordix-cockpit-customers";

export function getStoredCustomers() {
  if (typeof window === "undefined") {
    return [];
  }

  const storedCustomers = window.localStorage.getItem(storageKey);

  if (!storedCustomers) {
    return [];
  }

  try {
    return (JSON.parse(storedCustomers) as Customer[]).map(normalizeCustomer);
  } catch {
    return [];
  }
}

export function getAllCustomers() {
  const customersById = new Map<string, Customer>();

  mockCustomers.forEach((customer) => {
    customersById.set(customer.id, normalizeCustomer(customer));
  });

  getStoredCustomers().forEach((customer) => {
    customersById.set(customer.id, normalizeCustomer(customer));
  });

  return Array.from(customersById.values());
}

export function saveCustomer(customer: Customer) {
  const normalizedCustomer = normalizeCustomer(customer);
  const storedCustomers = getStoredCustomers();
  const existingIndex = storedCustomers.findIndex(
    (item) => item.id === normalizedCustomer.id
  );

  if (existingIndex >= 0) {
    storedCustomers[existingIndex] = normalizedCustomer;
  } else {
    storedCustomers.push(normalizedCustomer);
  }

  window.localStorage.setItem(storageKey, JSON.stringify(storedCustomers));
}

export function getNextOfferNumber() {
  return getNextOfferNumberForCustomers(getAllCustomers());
}
