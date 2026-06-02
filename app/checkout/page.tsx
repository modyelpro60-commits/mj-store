import { Suspense } from "react";
import CheckoutClient from "./checkout-client";

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-black text-white p-10">
          Loading...
        </main>
      }
    >
      <CheckoutClient />
    </Suspense>
  );
}
