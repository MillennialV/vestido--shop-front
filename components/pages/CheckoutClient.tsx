"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import SiteFooter from "@/components/layout/SiteFooter";
import { useCart } from "@/context/CartContext";
import { ChevronDownIcon, ChevronUpIcon, ShoppingCartIcon } from "@/components/ui/Icons";
import { useRemoteTheme } from "@/context/RemoteThemeContext";

const CheckoutClient = () => {
  const router = useRouter();
  const { cart, cartTotal, totalItems } = useCart();
  const { storeInfo } = useRemoteTheme();
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeStep, setActiveStep] = useState(1);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    deliveryMethod: "standard",
    paymentMethod: "whatsapp", // Default to whatsapp as per current flow
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePlaceOrder = () => {
    // For now, let's keep the WhatsApp flow but in a more professional way
    const itemsList = cart.map((item, index) =>
        `- ${item.title} (x${item.quantity}) - Talla: ${item.size} - S/ ${item.price}`
    ).join('\n');

    const message = `*Nuevo Pedido desde la Web*\n\n` +
      `*Cliente:* ${formData.firstName} ${formData.lastName}\n` +
      `*Dirección:* ${formData.address}, ${formData.city}, ${formData.state}\n\n` +
      `*Productos:*\n${itemsList}\n\n` +
      `*Total: S/ ${cartTotal.toFixed(2)}*`;

    const whatsappUrl = `https://wa.me/${storeInfo?.whatsapp}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  const StepHeader = ({ number, title, isActive, isCompleted }: { number: number, title: string, isActive: boolean, isCompleted: boolean }) => (
    <div 
      className={`flex items-center justify-between p-6 border-b border-stone-100 dark:border-stone-800 cursor-pointer ${isActive ? 'bg-stone-50/50 dark:bg-stone-900/50' : ''}`}
      onClick={() => setActiveStep(number)}
    >
      <div className="flex items-center gap-4">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${isActive || isCompleted ? 'bg-color-three text-color-four' : 'bg-stone-200 text-stone-500'}`}>
          {number}
        </div>
        <h2 className={`text-lg font-semibold ${isActive ? 'text-stone-900 dark:text-white' : 'text-stone-500'}`}>{title}</h2>
      </div>
      {isActive ? <ChevronUpIcon className="w-5 h-5 text-stone-400" /> : <ChevronDownIcon className="w-5 h-5 text-stone-400" />}
    </div>
  );

  return (
    <div className="min-h-screen bg-color-four dark:bg-color-three">
      <Header
        isAdmin={isAdmin}
        onToggleAdmin={() => setIsAdmin(!isAdmin)}
        navigate={(path) => router.push(path)}
      />

      <main className="max-w-7xl mx-auto px-4 py-12 md:py-20">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-stone-900 dark:text-white mb-2">Checkout</h1>
          <p className="text-stone-500 dark:text-stone-400">Complete your purchase below.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left Column: Flow */}
          <div className="lg:col-span-2 space-y-4">
            {cart.length === 0 ? (
              <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-sm border border-stone-100 dark:border-stone-800 p-12 text-center">
                <ShoppingCartIcon className="w-16 h-16 text-stone-300 mx-auto mb-6" />
                <h2 className="text-2xl font-bold text-stone-900 dark:text-white mb-4">Tu carrito está vacío</h2>
                <p className="text-stone-500 dark:text-stone-400 mb-8">Agrega algunos productos antes de proceder al pago.</p>
                <Link 
                  href="/#catalogo" 
                  className="inline-flex px-8 py-3 bg-color-three text-color-four font-bold rounded-xl hover:bg-opacity-90 transition-all shadow-md"
                >
                  Volver al catálogo
                </Link>
              </div>
            ) : (
              <>
                {/* Step 1: Shipping Address */}
            <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-sm border border-stone-100 dark:border-stone-800 overflow-hidden">
              <StepHeader number={1} title="Shipping Address" isActive={activeStep === 1} isCompleted={activeStep > 1} />
              {activeStep === 1 && (
                <div className="p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-stone-700 dark:text-stone-300">First Name</label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        placeholder="Jane"
                        className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 focus:ring-2 focus:ring-color-three outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-stone-700 dark:text-stone-300">Last Name</label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        placeholder="Doe"
                        className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 focus:ring-2 focus:ring-color-three outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-stone-700 dark:text-stone-300">Street Address</label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="123 Main St"
                      className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 focus:ring-2 focus:ring-color-three outline-none transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-stone-700 dark:text-stone-300">City</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        placeholder="New York"
                        className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 focus:ring-2 focus:ring-color-three outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-stone-700 dark:text-stone-300">State</label>
                      <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        placeholder="NY"
                        className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 focus:ring-2 focus:ring-color-three outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-stone-700 dark:text-stone-300">Zip</label>
                      <input
                        type="text"
                        name="zip"
                        value={formData.zip}
                        onChange={handleInputChange}
                        placeholder="10001"
                        className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 focus:ring-2 focus:ring-color-three outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end pt-4">
                    <button 
                      onClick={() => setActiveStep(2)}
                      className="px-8 py-3 bg-color-three text-color-four font-bold rounded-xl hover:bg-opacity-90 transition-all shadow-md active:scale-[0.98]"
                    >
                      Save & Continue
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: Delivery Method */}
            <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-sm border border-stone-100 dark:border-stone-800 overflow-hidden">
              <StepHeader number={2} title="Delivery Method" isActive={activeStep === 2} isCompleted={activeStep > 2} />
              {activeStep === 2 && (
                <div className="p-8 space-y-4">
                  <div className="flex items-center gap-4 p-4 border border-stone-200 dark:border-stone-700 rounded-xl cursor-pointer hover:border-color-three transition-all">
                    <input type="radio" checked className="w-5 h-5 accent-color-three" readOnly />
                    <div className="flex-1">
                      <p className="font-semibold">Envío Estándar</p>
                      <p className="text-sm text-stone-500">2-3 días hábiles</p>
                    </div>
                    <p className="font-bold">S/ 10.00</p>
                  </div>
                  <div className="flex justify-end pt-4">
                    <button 
                      onClick={() => setActiveStep(3)}
                      className="px-8 py-3 bg-color-three text-color-four font-bold rounded-xl hover:bg-opacity-90 transition-all shadow-md active:scale-[0.98]"
                    >
                      Save & Continue
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Step 3: Payment Information */}
            <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-sm border border-stone-100 dark:border-stone-800 overflow-hidden">
              <StepHeader number={3} title="Payment Information" isActive={activeStep === 3} isCompleted={activeStep > 3} />
              {activeStep === 3 && (
                <div className="p-8">
                  <p className="text-stone-600 dark:text-stone-400 mb-6">
                    Tu pedido será procesado y te contactaremos para finalizar el pago. Actualmente aceptamos transferencias y pagos contra entrega coordinados por WhatsApp.
                  </p>
                  <div className="flex justify-end">
                    <button 
                      onClick={handlePlaceOrder}
                      className="px-8 py-3 bg-color-three text-color-four font-bold rounded-xl hover:bg-opacity-90 transition-all shadow-md active:scale-[0.98]"
                    >
                      Place Order
                    </button>
                  </div>
                </div>
              )}
            </div>
              </>
            )}
          </div>

          {/* Right Column: Order Summary */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-sm border border-stone-100 dark:border-stone-800 p-8">
              <h2 className="text-xl font-bold text-stone-900 dark:text-white mb-6">Order Summary</h2>
              
              <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {cart.map((item) => (
                  <div key={`${item.id}-${item.size}`} className="flex gap-4">
                    <div className="relative w-16 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-stone-100">
                      <Image
                        src={item.imagen_principal || (item.imagenes?.[0]) || "/placeholder.png"}
                        alt={item.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-stone-900 dark:text-white truncate">{item.title}</h3>
                      <p className="text-sm text-stone-500">Talla: {item.size} / Cnt: {item.quantity}</p>
                      <p className="font-bold text-stone-900 dark:text-white mt-1">S/ {item.price}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 space-y-4 pt-8 border-t border-stone-100 dark:border-stone-800">
                <div className="flex justify-between text-stone-600 dark:text-stone-400">
                  <span>Subtotal</span>
                  <span>S/ {cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-stone-600 dark:text-stone-400">
                  <span>Shipping</span>
                  <span className="text-green-600 font-semibold">Free</span>
                </div>
                <div className="flex justify-between text-stone-600 dark:text-stone-400">
                  <span>Taxes</span>
                  <span>S/ 0.00</span>
                </div>
                <div className="flex justify-between text-xl font-bold text-stone-900 dark:text-white pt-4">
                  <span>Total</span>
                  <span>S/ {cartTotal.toFixed(2)}</span>
                </div>
              </div>

              <button 
                onClick={handlePlaceOrder}
                className="w-full mt-8 py-4 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg active:scale-[0.98]"
              >
                Place Order <ShoppingCartIcon className="w-5 h-5 ml-2" />
              </button>
              <p className="text-center text-xs text-stone-400 mt-4">
                Secure checkout powered by Stripe
              </p>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
};

export default CheckoutClient;
