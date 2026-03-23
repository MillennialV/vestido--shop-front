import { Metadata } from "next";
import CheckoutClient from "@/components/pages/CheckoutClient";
import { DEFAULT_SEO } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Checkout | ${DEFAULT_SEO.siteName}`,
  description: "Complete your purchase and secure your items.",
};

export default function CheckoutPage() {
  return <CheckoutClient />;
}
