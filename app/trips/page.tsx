import { Suspense } from "react";
import TripRadar from "@/components/TripRadar";

export default function TripsPage() {
  return (
    <Suspense>
      <TripRadar />
    </Suspense>
  );
}
