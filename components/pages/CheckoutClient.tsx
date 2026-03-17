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
  const [activeStep, setActiveStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    phone: "",
    deliveryMethod: "whatsapp_coord",
    paymentMethod: "whatsapp",
  });
  const [isAccepted, setIsAccepted] = useState(false);

  // Steps completion status
  const [stepsCompleted, setStepsCompleted] = useState({
    1: false,
    2: false,
    3: false
  });
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateStep1 = () => {
    const newErrors: Record<string, boolean> = {};
    if (!formData.firstName.trim()) newErrors.firstName = true;
    if (!formData.lastName.trim()) newErrors.lastName = true;
    if (!formData.phone.trim()) newErrors.phone = true;
    if (!formData.city.trim()) newErrors.city = true;
    if (!formData.address.trim()) newErrors.address = true;
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveStep = (step: number) => {
    if (step === 1 && !validateStep1()) {
      return;
    }
    setStepsCompleted(prev => ({ ...prev, [step]: true }));
    setActiveStep(step + 1);
  };

  const handleEditStep = (step: number) => {
    setActiveStep(step);
  };

  const shippingPrice = 0;
  const grandTotal = cartTotal + shippingPrice;

  const handlePlaceOrder = async () => {
    setIsProcessing(true);
    
    // Preparar el mensaje de WhatsApp
    const whatsappNumber = storeInfo?.whatsapp || "51900000000"; // Fallback number
    const customerName = `${formData.firstName} ${formData.lastName}`;
    const fullAddress = `${formData.address}, ${formData.city}, ${formData.state} ${formData.zip}`;
    
    let message = `*Nueva Orden - ${storeInfo?.title || "Tienda"}*\n\n`;
    message += `*Cliente:* ${customerName}\n`;
    message += `*Teléfono:* ${formData.phone}\n`;
    message += `*Dirección:* ${fullAddress}\n\n`;
    message += `*Productos:* \n`;
    
    cart.forEach((item) => {
      message += `- ${item.title} (Talla: ${item.size}) x${item.quantity} - S/ ${(Number(item.price) * item.quantity).toFixed(2)}\n`;
    });
    
    message += `\n*Subtotal:* S/ ${cartTotal.toFixed(2)}\n`;
    message += `*Envío:* Por coordinar vía WhatsApp\n`;
    message += `*Total Final: S/ ${grandTotal.toFixed(2)}*\n\n`;
    message += `_Enviado desde el sitio web_`;

    // 1. Preparar objeto de orden para la página de éxito
    const orderData = {
      orderNumber: `ORD-${Math.floor(100000 + Math.random() * 900000)}`,
      customerName: `${formData.firstName} ${formData.lastName}`,
      shippingAddress: `${formData.address}, ${formData.zip}, ${formData.city}/${formData.state}`,
      deliveryDate: formData.deliveryMethod === 'express' ? '1-2 días hábiles' : '3-5 días hábiles',
      items: cart.map(item => ({
        id: item.id,
        title: item.title,
        price: item.price,
        quantity: item.quantity,
        imagen_principal: item.imagen_principal || (item as any).imagenes?.[0],
        brand: item.brand,
        size: item.size,
        occasion: item.occasion
      })),
      total: cartTotal,
      shippingCost: shippingPrice,
      tax: 0
    };

    // 2. Guardar en localStorage
    localStorage.setItem('last_order', JSON.stringify(orderData));

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${encodedMessage}`;

    // Pequeño delay para feedback visual
    await new Promise(resolve => setTimeout(resolve, 800));

    // 3. Abrir WhatsApp en una pestaña aparte
    window.open(whatsappUrl, '_blank');

    // 4. Redirigir a success en la pestaña actual
    router.push('/checkout/success');

    // 5. Limpiar carrito
    clearCart();
    setIsProcessing(false);
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
            Editar
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
      <Header
        isAdmin={false}
        onToggleAdmin={() => {}}
        navigate={(path) => router.push(path)}
        hideAdminControls={true}
      />

      <main className="max-w-7xl mx-auto px-4 py-12 md:py-20">
        <div className="mb-12">
          <h1 className="text-4xl font-extrabold text-stone-900 dark:text-white mb-2 tracking-tight">Finalizar Compra</h1>
          <p className="text-stone-500 dark:text-stone-400">Completa tus datos para procesar el pedido por WhatsApp.</p>
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
                    title="Datos de Envío" 
                    isActive={activeStep === 1} 
                    isCompleted={stepsCompleted[1]} 
                    summary={formData.address ? `${formData.address}, ${formData.city}` : undefined}
                  />
                  
                  <div className={`overflow-hidden transition-all duration-500 ${activeStep === 1 ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="p-8 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-stone-400">Nombre</label>
                          <input
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            placeholder="Ej. Ana"
                            className={`w-full px-5 py-4 rounded-2xl border bg-stone-50 dark:bg-stone-800 focus:ring-2 focus:ring-stone-900 dark:focus:ring-white outline-none transition-all placeholder:text-stone-300 ${errors.firstName ? 'border-red-500 ring-1 ring-red-500' : 'border-stone-100 dark:border-stone-800'}`}
                          />
                          {errors.firstName && <p className="text-[10px] font-bold text-red-500 uppercase ml-2">Campo obligatorio</p>}
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-stone-400">Apellido</label>
                          <input
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleInputChange}
                            placeholder="Ej. García"
                            className={`w-full px-5 py-4 rounded-2xl border bg-stone-50 dark:bg-stone-800 focus:ring-2 focus:ring-stone-900 dark:focus:ring-white outline-none transition-all placeholder:text-stone-300 ${errors.lastName ? 'border-red-500 ring-1 ring-red-500' : 'border-stone-100 dark:border-stone-800'}`}
                          />
                          {errors.lastName && <p className="text-[10px] font-bold text-red-500 uppercase ml-2">Campo obligatorio</p>}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-stone-400">Teléfono / WhatsApp</label>
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            placeholder="Ej. 987 654 321"
                            className={`w-full px-5 py-4 rounded-2xl border bg-stone-50 dark:bg-stone-800 focus:ring-2 focus:ring-stone-900 dark:focus:ring-white outline-none transition-all placeholder:text-stone-300 ${errors.phone ? 'border-red-500 ring-1 ring-red-500' : 'border-stone-100 dark:border-stone-800'}`}
                          />
                          {errors.phone && <p className="text-[10px] font-bold text-red-500 uppercase ml-2">Campo obligatorio</p>}
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-stone-400">Ciudad / Distrito</label>
                          <input
                            type="text"
                            name="city"
                            value={formData.city}
                            onChange={handleInputChange}
                            placeholder="Ej. Miraflores, Lima"
                            className={`w-full px-5 py-4 rounded-2xl border bg-stone-50 dark:bg-stone-800 focus:ring-2 focus:ring-stone-900 dark:focus:ring-white outline-none transition-all placeholder:text-stone-300 ${errors.city ? 'border-red-500 ring-1 ring-red-500' : 'border-stone-100 dark:border-stone-800'}`}
                          />
                          {errors.city && <p className="text-[10px] font-bold text-red-500 uppercase ml-2">Campo obligatorio</p>}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-stone-400">Dirección Completa</label>
                        <input
                          type="text"
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          placeholder="Calle, número, departamento..."
                          className={`w-full px-5 py-4 rounded-2xl border bg-stone-50 dark:bg-stone-800 focus:ring-2 focus:ring-stone-900 dark:focus:ring-white outline-none transition-all placeholder:text-stone-300 ${errors.address ? 'border-red-500 ring-1 ring-red-500' : 'border-stone-100 dark:border-stone-800'}`}
                        />
                        {errors.address && <p className="text-[10px] font-bold text-red-500 uppercase ml-2">Campo obligatorio</p>}
                      </div>
                      
                      <div className="flex justify-end pt-4">
                        <button 
                          onClick={() => handleSaveStep(1)}
                          className="px-10 py-4 bg-color-one text-white font-bold rounded-2xl hover:opacity-90 transition-all shadow-lg active:scale-[0.98]"
                        >
                          Guardar y Continuar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 2: Delivery Method */}
                <div className="bg-white dark:bg-stone-900 rounded-3xl shadow-sm border border-stone-100 dark:border-stone-800 overflow-hidden transition-all duration-500">
                  <StepHeader 
                    number={2} 
                    title="Método de Entrega" 
                    isActive={activeStep === 2} 
                    isCompleted={stepsCompleted[2]} 
                    summary="Coordinar por WhatsApp"
                  />
                  
                  <div className={`overflow-hidden transition-all duration-500 ${activeStep === 2 ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="p-8 space-y-4">
                      <div 
                        onClick={() => setFormData(p => ({ ...p, deliveryMethod: 'whatsapp_coord' }))}
                        className={`flex items-center gap-4 p-8 border rounded-3xl cursor-pointer transition-all ${formData.deliveryMethod === 'whatsapp_coord' ? 'border-color-one ring-2 ring-color-one bg-color-one/[0.02]' : 'border-stone-100 dark:border-stone-800 hover:border-stone-300'}`}
                      >
                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${formData.deliveryMethod === 'whatsapp_coord' ? 'border-color-one' : 'border-stone-200'}`}>
                          {formData.deliveryMethod === 'whatsapp_coord' && <div className="w-4 h-4 rounded-full bg-color-one" />}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-stone-900 dark:text-white text-lg">Coordinar Envío por WhatsApp</p>
                          <p className="text-stone-500 font-medium leading-relaxed">
                            El costo del envío se ajustará dependiendo de tu zona y se acordará directamente por el chat.
                          </p>
                        </div>
                        <div className="bg-stone-50 dark:bg-stone-800 px-4 py-2 rounded-xl border border-stone-100 dark:border-stone-700">
                          <p className="font-bold text-color-one">Por definir</p>
                        </div>
                      </div>

                      <div className="flex justify-end pt-4">
                        <button 
                          onClick={() => handleSaveStep(2)}
                          className="px-10 py-4 bg-color-one text-white font-bold rounded-2xl hover:opacity-90 transition-all shadow-lg active:scale-[0.98]"
                        >
                          Confirmar Entrega
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 3: Payment/WhatsApp Check */}
                <div className="bg-white dark:bg-stone-900 rounded-3xl shadow-sm border border-stone-100 dark:border-stone-800 overflow-hidden transition-all duration-500">
                  <StepHeader 
                    number={3} 
                    title="Confirmación de Pedido" 
                    isActive={activeStep === 3} 
                    isCompleted={stepsCompleted[3]} 
                  />
                  
                  <div className={`overflow-hidden transition-all duration-500 ${activeStep === 3 ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="p-8 space-y-8">
                      <div className="bg-color-one/5 border border-color-one/20 p-8 rounded-3xl text-center space-y-4">
                         <div className="w-16 h-16 bg-color-one rounded-full flex items-center justify-center mx-auto shadow-lg shadow-color-one/20">
                            <TruckIcon className="w-8 h-8 text-white" />
                         </div>
                         <h3 className="text-xl font-bold text-stone-900 dark:text-white">¡Casi listo!</h3>
                         <p className="text-stone-600 dark:text-stone-400 max-w-sm mx-auto leading-relaxed">
                            Al hacer clic en "Enviar pedido por WhatsApp", se generará un mensaje automático con los detalles de tu compra para coordinar la entrega y el pago.
                         </p>
                      </div>

                      <div className="flex flex-col items-center gap-2">
                        <div className="flex items-center gap-3 justify-center">
                          <input 
                            type="checkbox" 
                            id="whatsapp-confirm" 
                            className="w-5 h-5 rounded-md border-stone-200 accent-color-one cursor-pointer" 
                            checked={isAccepted}
                            onChange={(e) => setIsAccepted(e.target.checked)}
                          />
                          <label htmlFor="whatsapp-confirm" className="text-sm font-medium text-stone-600 dark:text-stone-400 cursor-pointer select-none">
                            Acepto coordinar mi pedido vía WhatsApp
                          </label>
                        </div>
                        {!isAccepted && stepsCompleted[2] && (
                          <p className="text-xs text-red-500 font-bold animate-pulse">Debes aceptar los términos para continuar</p>
                        )}
                      </div>

                      <div className="flex justify-center pt-4">
                        <button 
                          onClick={() => {
                            if (isAccepted) {
                              handleSaveStep(3);
                            }
                          }}
                          disabled={!isAccepted}
                          className={`px-12 py-4 font-bold rounded-2xl transition-all shadow-lg active:scale-[0.98] ${isAccepted ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900 hover:opacity-90' : 'bg-stone-200 text-stone-400 cursor-not-allowed'}`}
                        >
                          Revisar Resumen Final
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
              <h2 className="text-2xl font-extrabold text-stone-900 dark:text-white mb-8 tracking-tight">Resumen de Orden</h2>
              
              <div className="space-y-6 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                {cart.map((item) => (
                  <div key={`${item.id}-${item.size}`} className="flex gap-5 group">
                    <div className="relative w-20 h-24 rounded-2xl overflow-hidden flex-shrink-0 bg-stone-50 dark:bg-stone-800">
                       <Image
                        src={item.imagen_principal || (item.imagenes?.[0]) || "/placeholder.png"}
                        alt={item.title}
                        fill
                        unoptimized
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <h3 className="font-bold text-stone-900 dark:text-white truncate">{item.title}</h3>
                      <p className="text-xs text-stone-400 font-bold uppercase mt-1">Talla: {item.size} / Cant: {item.quantity}</p>
                      <p className="font-extrabold text-stone-900 dark:text-white mt-2">S/ {item.price || 0}</p>
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
                  <span>Envío</span>
                  <span className="text-color-one font-bold italic text-sm">Por coordinar vía WhatsApp</span>
                </div>
                <div className="flex justify-between text-stone-500 font-medium">
                  <span>Impuestos (IGV)</span>
                  <span className="text-stone-900 dark:text-white font-bold">S/ 0.00</span>
                </div>
                <div className="flex justify-between text-2xl font-extrabold text-stone-900 dark:text-white pt-6">
                  <span>Total</span>
                  <span className="tracking-tight">S/ {grandTotal.toFixed(2)}</span>
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
                    Procesando...
                  </span>
                ) : (
                  <>Enviar pedido por WhatsApp <ShoppingCartIcon className="w-5 h-5" /></>
                )}
              </button>

              <div className="mt-6 flex items-center justify-center gap-2 text-stone-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span className="text-[10px] uppercase font-bold tracking-widest">Pedido Seguro vía WhatsApp</span>
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
