import SuccessPage from "@/components/pages/SuccessPage";
import { Metadata } from "next";
import { DEFAULT_SEO } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Order Confirmed | ${DEFAULT_SEO.siteName}`,
  description: "Thank you for your purchase! We've received your order.",
};

export default function CheckoutSuccessPage() {
  return <SuccessPage />;
}
