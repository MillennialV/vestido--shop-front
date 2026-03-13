import SuccessPage from "@/components/pages/SuccessPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Order Confirmed | Mi tienda",
  description: "Thank you for your purchase! We've received your order.",
};

export default function CheckoutSuccessPage() {
  return <SuccessPage />;
}
