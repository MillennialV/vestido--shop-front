import { Metadata } from "next";
import CheckoutClient from "@/components/pages/CheckoutClient";

export const metadata: Metadata = {
  title: "Checkout | Mi tienda",
  description: "Complete your purchase and secure your items.",
};

export default function CheckoutPage() {
  return <CheckoutClient />;
}
