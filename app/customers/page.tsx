import { Suspense } from "react";
import CustomerManager from "@/components/CustomerManager";

export default function CustomersPage() {
  return (
    <Suspense>
      <CustomerManager />
    </Suspense>
  );
}
