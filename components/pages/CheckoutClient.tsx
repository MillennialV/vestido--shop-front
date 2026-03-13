"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import SiteFooter from "@/components/layout/SiteFooter";
import { useCart } from "@/context/CartContext";
import { 
  ChevronDownIcon, 
  ChevronUpIcon, 
  ShoppingCartIcon, 
  CheckIcon,
  TruckIcon,
  CreditCardIcon,
  MapPinIcon
} from "@/components/ui/Icons";
import { useRemoteTheme } from "@/context/RemoteThemeContext";

const CheckoutClient = () => {
  const router = useRouter();
  const { cart, cartTotal, totalItems, clearCart } = useCart();
  const { storeInfo } = useRemoteTheme();
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    deliveryMethod: "standard",
    paymentMethod: "credit_card",
  });

  // Steps completion status
  const [stepsCompleted, setStepsCompleted] = useState({
    1: false,
    2: false,
    3: false
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveStep = (step: number) => {
    setStepsCompleted(prev => ({ ...prev, [step]: true }));
    setActiveStep(step + 1);
  };

  const handleEditStep = (step: number) => {
    setActiveStep(step);
  };

  const handlePlaceOrder = async () => {
    setIsProcessing(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Prepare order info for success page
    const orderInfo = {
      orderNumber: `ORD-${Math.floor(Math.random() * 1000000)}`,
      items: cart,
      total: cartTotal,
      tax: 52.84,
      shippingCost: 15.00,
      shippingAddress: `${formData.address}, ${formData.city}, ${formData.state}`,
      customerName: `${formData.firstName} ${formData.lastName}`,
      deliveryDate: "Oct 24 - Oct 26", // Mocked as per design
    };

    // Store in localStorage for the success page to pick up
    localStorage.setItem('last_order', JSON.stringify(orderInfo));

    // Clear cart and redirect
    clearCart();
    router.push("/checkout/success");
  };

  const StepHeader = ({ 
    number, 
    title, 
    isActive, 
    isCompleted, 
    summary 
  }: { 
    number: number, 
    title: string, 
    isActive: boolean, 
    isCompleted: boolean,
    summary?: string
  }) => (
    <div 
      className={`p-6 border-b border-stone-100 dark:border-stone-800 transition-all ${isActive ? 'bg-stone-50/50 dark:bg-stone-900/50' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${isActive || isCompleted ? 'bg-color-one text-white' : 'bg-stone-200 text-stone-500'}`}>
            {isCompleted ? <CheckIcon className="w-5 h-5 text-white" /> : number}
          </div>
          <div>
            <h2 className={`text-lg font-bold ${isActive ? 'text-stone-900 dark:text-white' : 'text-stone-500'}`}>{title}</h2>
            {isCompleted && !isActive && summary && (
              <p className="text-sm text-stone-500 mt-0.5">{summary}</p>
            )}
          </div>
        </div>
        {isCompleted && !isActive && (
          <button 
            onClick={() => handleEditStep(number)}
            className="text-sm font-bold text-stone-400 hover:text-stone-900 dark:hover:text-white transition-colors"
          >
            Edit
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
      <Header
        isAdmin={isAdmin}
        onToggleAdmin={() => setIsAdmin(!isAdmin)}
        navigate={(path) => router.push(path)}
      />

      <main className="max-w-7xl mx-auto px-4 py-12 md:py-20">
        <div className="mb-12">
          <h1 className="text-4xl font-extrabold text-stone-900 dark:text-white mb-2 tracking-tight">Checkout</h1>
          <p className="text-stone-500 dark:text-stone-400">Complete your purchase below.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left Column: Flow */}
          <div className="lg:col-span-2 space-y-4">
            {cart.length === 0 ? (
              <div className="bg-white dark:bg-stone-900 rounded-3xl shadow-sm border border-stone-100 dark:border-stone-800 p-16 text-center">
                <div className="w-20 h-20 bg-stone-50 dark:bg-stone-800 rounded-full flex items-center justify-center mx-auto mb-6">
                  <ShoppingCartIcon className="w-10 h-10 text-stone-300" />
                </div>
                <h2 className="text-2xl font-bold text-stone-900 dark:text-white mb-4">Tu carrito está vacío</h2>
                <p className="text-stone-500 dark:text-stone-400 mb-8 max-w-sm mx-auto">Agrega algunos productos antes de proceder al pago.</p>
                <Link 
                  href="/#catalogo" 
                  className="inline-flex px-10 py-4 bg-color-one text-white font-bold rounded-2xl hover:opacity-90 transition-all shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                >
                  Volver al catálogo
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Step 1: Shipping Address */}
                <div className="bg-white dark:bg-stone-900 rounded-3xl shadow-sm border border-stone-100 dark:border-stone-800 overflow-hidden transition-all duration-500">
                  <StepHeader 
                    number={1} 
                    title="Shipping Address" 
                    isActive={activeStep === 1} 
                    isCompleted={stepsCompleted[1]} 
                    summary={formData.address ? `${formData.address}, ${formData.city}, ${formData.zip}` : undefined}
                  />
                  
                  <div className={`overflow-hidden transition-all duration-500 ${activeStep === 1 ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="p-8 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-stone-400">First Name</label>
                          <input
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            placeholder="Jane"
                            className="w-full px-5 py-4 rounded-2xl border border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-800 focus:ring-2 focus:ring-stone-900 dark:focus:ring-white outline-none transition-all placeholder:text-stone-300"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-stone-400">Last Name</label>
                          <input
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleInputChange}
                            placeholder="Doe"
                            className="w-full px-5 py-4 rounded-2xl border border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-800 focus:ring-2 focus:ring-stone-900 dark:focus:ring-white outline-none transition-all placeholder:text-stone-300"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-stone-400">Street Address</label>
                        <input
                          type="text"
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          placeholder="123 Main St"
                          className="w-full px-5 py-4 rounded-2xl border border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-800 focus:ring-2 focus:ring-stone-900 dark:focus:ring-white outline-none transition-all placeholder:text-stone-300"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-stone-400">City</label>
                          <input
                            type="text"
                            name="city"
                            value={formData.city}
                            onChange={handleInputChange}
                            placeholder="New York"
                            className="w-full px-5 py-4 rounded-2xl border border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-800 focus:ring-2 focus:ring-stone-900 dark:focus:ring-white outline-none transition-all placeholder:text-stone-300"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-stone-400">State</label>
                          <input
                            type="text"
                            name="state"
                            value={formData.state}
                            onChange={handleInputChange}
                            placeholder="NY"
                            className="w-full px-5 py-4 rounded-2xl border border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-800 focus:ring-2 focus:ring-stone-900 dark:focus:ring-white outline-none transition-all placeholder:text-stone-300"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-stone-400">Zip</label>
                          <input
                            type="text"
                            name="zip"
                            value={formData.zip}
                            onChange={handleInputChange}
                            placeholder="10001"
                            className="w-full px-5 py-4 rounded-2xl border border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-800 focus:ring-2 focus:ring-stone-900 dark:focus:ring-white outline-none transition-all placeholder:text-stone-300"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end pt-4">
                        <button 
                          onClick={() => handleSaveStep(1)}
                          className="px-10 py-4 bg-color-one text-white font-bold rounded-2xl hover:opacity-90 transition-all shadow-lg active:scale-[0.98]"
                        >
                          Save & Continue
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 2: Delivery Method */}
                <div className="bg-white dark:bg-stone-900 rounded-3xl shadow-sm border border-stone-100 dark:border-stone-800 overflow-hidden transition-all duration-500">
                  <StepHeader 
                    number={2} 
                    title="Delivery Method" 
                    isActive={activeStep === 2} 
                    isCompleted={stepsCompleted[2]} 
                    summary={formData.deliveryMethod === 'standard' ? 'Standard Shipping (Free)' : undefined}
                  />
                  
                  <div className={`overflow-hidden transition-all duration-500 ${activeStep === 2 ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="p-8 space-y-4">
                      <div 
                        onClick={() => setFormData(p => ({ ...p, deliveryMethod: 'standard' }))}
                        className={`flex items-center gap-4 p-6 border rounded-2xl cursor-pointer transition-all ${formData.deliveryMethod === 'standard' ? 'border-color-one ring-1 ring-color-one' : 'border-stone-100 dark:border-stone-800 hover:border-stone-300'}`}
                      >
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${formData.deliveryMethod === 'standard' ? 'border-color-one' : 'border-stone-200'}`}>
                          {formData.deliveryMethod === 'standard' && <div className="w-3 h-3 rounded-full bg-color-one" />}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-stone-900 dark:text-white">Standard Shipping</p>
                          <p className="text-sm text-stone-500 font-medium">3-5 business days</p>
                        </div>
                        <p className="font-bold text-stone-900 dark:text-white">Free</p>
                      </div>

                      <div 
                        onClick={() => setFormData(p => ({ ...p, deliveryMethod: 'express' }))}
                        className={`flex items-center gap-4 p-6 border rounded-2xl cursor-pointer transition-all ${formData.deliveryMethod === 'express' ? 'border-color-one ring-1 ring-color-one' : 'border-stone-100 dark:border-stone-800 hover:border-stone-300'}`}
                      >
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${formData.deliveryMethod === 'express' ? 'border-color-one' : 'border-stone-200'}`}>
                          {formData.deliveryMethod === 'express' && <div className="w-3 h-3 rounded-full bg-color-one" />}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-stone-900 dark:text-white">Express Shipping</p>
                          <p className="text-sm text-stone-500 font-medium">1-2 business days</p>
                        </div>
                        <p className="font-bold text-stone-900 dark:text-white">$15.00</p>
                      </div>

                      <div className="flex justify-end pt-4">
                        <button 
                          onClick={() => handleSaveStep(2)}
                          className="px-10 py-4 bg-color-one text-white font-bold rounded-2xl hover:opacity-90 transition-all shadow-lg active:scale-[0.98]"
                        >
                          Save & Continue
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 3: Payment Information */}
                <div className="bg-white dark:bg-stone-900 rounded-3xl shadow-sm border border-stone-100 dark:border-stone-800 overflow-hidden transition-all duration-500">
                  <StepHeader 
                    number={3} 
                    title="Payment Information" 
                    isActive={activeStep === 3} 
                    isCompleted={stepsCompleted[3]} 
                  />
                  
                  <div className={`overflow-hidden transition-all duration-500 ${activeStep === 3 ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="p-8 space-y-8">
                      {/* Payment Tabs */}
                      <div className="flex p-1 bg-stone-50 dark:bg-stone-800 rounded-2xl">
                        {['Credit Card', 'PayPal', 'Apple Pay'].map((method) => (
                          <button
                            key={method}
                            onClick={() => setFormData(p => ({ ...p, paymentMethod: method.toLowerCase().replace(' ', '_') }))}
                            className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${formData.paymentMethod === method.toLowerCase().replace(' ', '_') ? 'bg-color-one shadow-sm text-white' : 'text-stone-400'}`}
                          >
                            {method}
                          </button>
                        ))}
                      </div>

                      {formData.paymentMethod === 'credit_card' ? (
                        <div className="space-y-6">
                           <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-stone-400">Card Number</label>
                            <div className="relative">
                              <input
                                type="text"
                                placeholder="0000 0000 0000 0000"
                                className="w-full px-5 py-4 rounded-2xl border border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-800 focus:ring-2 focus:ring-stone-900 dark:focus:ring-white outline-none transition-all"
                              />
                              <CreditCardIcon className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-300" />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <label className="text-xs font-bold uppercase tracking-wider text-stone-400">Expiry Date</label>
                              <input
                                type="text"
                                placeholder="MM / YY"
                                className="w-full px-5 py-4 rounded-2xl border border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-800 focus:ring-2 focus:ring-stone-900 dark:focus:ring-white outline-none transition-all"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-bold uppercase tracking-wider text-stone-400">CVV</label>
                              <input
                                type="text"
                                placeholder="123"
                                className="w-full px-5 py-4 rounded-2xl border border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-800 focus:ring-2 focus:ring-stone-900 dark:focus:ring-white outline-none transition-all"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-stone-400">Name on Card</label>
                            <input
                              type="text"
                              placeholder="John Doe"
                              className="w-full px-5 py-4 rounded-2xl border border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-800 focus:ring-2 focus:ring-stone-900 dark:focus:ring-white outline-none transition-all"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="p-12 text-center border-2 border-dashed border-stone-100 dark:border-stone-800 rounded-3xl">
                          <p className="text-stone-400 font-medium">Redirecting to {formData.paymentMethod === 'paypal' ? 'PayPal' : 'Apple Pay'} upon order.</p>
                        </div>
                      )}

                      <div className="flex items-center gap-3">
                        <input type="checkbox" id="billing" className="w-5 h-5 rounded-md border-stone-200 accent-stone-900" defaultChecked />
                        <label htmlFor="billing" className="text-sm font-medium text-stone-600 dark:text-stone-400">Billing address same as shipping</label>
                      </div>

                      <div className="flex justify-end pt-4">
                        <button 
                          onClick={() => handleSaveStep(3)}
                          className="px-10 py-4 bg-color-one text-white font-bold rounded-2xl hover:opacity-90 transition-all shadow-lg active:scale-[0.98]"
                        >
                          Save & Review
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Order Summary */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-stone-900 rounded-[2.5rem] shadow-sm border border-stone-100 dark:border-stone-800 p-10 sticky top-28">
              <h2 className="text-2xl font-extrabold text-stone-900 dark:text-white mb-8 tracking-tight">Order Summary</h2>
              
              <div className="space-y-6 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                {cart.map((item) => (
                  <div key={`${item.id}-${item.size}`} className="flex gap-5 group">
                    <div className="relative w-20 h-24 rounded-2xl overflow-hidden flex-shrink-0 bg-stone-50 dark:bg-stone-800">
                      <Image
                        src={item.imagen_principal || (item.imagenes?.[0]) || "/placeholder.png"}
                        alt={item.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <h3 className="font-bold text-stone-900 dark:text-white truncate">{item.title}</h3>
                      <p className="text-xs text-stone-400 font-bold uppercase mt-1">Talla: {item.size} / Cnt: {item.quantity}</p>
                      <p className="font-extrabold text-stone-900 dark:text-white mt-2">S/ {item.price}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-10 space-y-4 pt-10 border-t border-stone-50 dark:border-stone-800">
                <div className="flex justify-between text-stone-500 font-medium">
                  <span>Subtotal</span>
                  <span className="text-stone-900 dark:text-white font-bold">S/ {cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-stone-500 font-medium">
                  <span>Shipping</span>
                  <span className="text-green-600 font-bold">Free</span>
                </div>
                <div className="flex justify-between text-stone-500 font-medium">
                  <span>Taxes</span>
                  <span className="text-stone-900 dark:text-white font-bold">S/ 0.00</span>
                </div>
                <div className="flex justify-between text-2xl font-extrabold text-stone-900 dark:text-white pt-6">
                  <span>Total</span>
                  <span className="tracking-tight">S/ {cartTotal.toFixed(2)}</span>
                </div>
              </div>
              <button 
                onClick={handlePlaceOrder}
                disabled={isProcessing || !stepsCompleted[3]}
                className={`w-full mt-10 py-5 rounded-2xl font-extrabold flex items-center justify-center gap-3 transition-all shadow-xl active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100
                  ${stepsCompleted[3] ? 'bg-color-one text-white hover:opacity-90' : 'bg-stone-100 dark:bg-stone-800 text-stone-400'}
                `}
              >
                {isProcessing ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                  </span>
                ) : (
                  <>Place Order <ShoppingCartIcon className="w-5 h-5" /></>
                )}
              </button>

              <div className="mt-6 flex items-center justify-center gap-2 text-stone-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span className="text-[10px] uppercase font-bold tracking-widest">Secure encrypted transaction</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
};

export default CheckoutClient;
