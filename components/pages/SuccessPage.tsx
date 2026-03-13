"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import SiteFooter from "@/components/layout/SiteFooter";
import { 
  CheckIcon,
  ChevronRightIcon, 
  DocumentIcon,
  TruckIcon,
  MapPinIcon
} from "@/components/ui/Icons";
import { useProducts } from "@/hooks/useProducts";
import VideoCard from "@/components/cards/VideoCard";

const SuccessPage = () => {
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const { products, fetchProducts, isLoading } = useProducts();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const savedOrder = localStorage.getItem('last_order');
    if (savedOrder) {
      setOrder(JSON.parse(savedOrder));
    }
    
    // Fetch products for recommendations
    fetchProducts({ limit: 4 });
  }, [fetchProducts]);

  if (!order) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex flex-col">
        <Header isAdmin={isAdmin} onToggleAdmin={() => setIsAdmin(!isAdmin)} navigate={router.push} />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-stone-900 dark:border-white"></div>
        </div>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
      <Header
        isAdmin={isAdmin}
        onToggleAdmin={() => setIsAdmin(!isAdmin)}
        navigate={(path) => router.push(path)}
      />

      <main className="max-w-6xl mx-auto px-4 py-16 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Left Column: Details & Address */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Main Thank You Card */}
            <div className="bg-white dark:bg-stone-900 p-8 md:p-12 rounded-[2rem] shadow-sm border border-stone-100 dark:border-stone-800 space-y-8 animate-fade-in-up">
              <div className="w-16 h-16 bg-color-one rounded-full flex items-center justify-center shadow-lg shadow-color-one/20">
                <CheckIcon className="w-8 h-8 text-white" />
              </div>
              
              <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl font-extrabold text-stone-900 dark:text-white tracking-tight">
                  Thank you for your order!
                </h1>
                <p className="text-lg text-stone-500 dark:text-stone-400 font-medium max-w-2xl leading-relaxed">
                  We've received your order and will begin processing it right away. 
                  You will receive an email confirmation shortly.
                </p>
              </div>
              
              <div className="flex flex-wrap gap-4 pt-4">
                <button className="bg-color-one hover:opacity-90 text-white px-10 py-4 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-xl shadow-color-one/20 active:scale-[0.98]">
                  Track My Order <ChevronRightIcon className="w-5 h-5" />
                </button>
                <Link 
                  href="/#catalogo"
                  className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 px-10 py-4 rounded-2xl font-bold hover:bg-stone-50 dark:hover:bg-stone-700 transition-all active:scale-[0.98]"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>

            {/* Status Mini-Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-up delay-100">
               <div className="bg-white dark:bg-stone-900 p-8 rounded-[2rem] shadow-sm border border-stone-100 dark:border-stone-800 flex items-center gap-6">
                 <div className="w-12 h-12 bg-stone-50 dark:bg-stone-800 rounded-xl flex items-center justify-center">
                    <DocumentIcon className="w-6 h-6 text-color-one" />
                 </div>
                 <div>
                    <p className="text-xs font-bold text-stone-400 uppercase tracking-[0.2em] mb-1">ORDER NUMBER</p>
                    <p className="text-2xl font-black text-stone-900 dark:text-white">#{order.orderNumber.split('-')[1] || order.orderNumber}</p>
                 </div>
               </div>

               <div className="bg-white dark:bg-stone-900 p-8 rounded-[2rem] shadow-sm border border-stone-100 dark:border-stone-800 flex items-center gap-6">
                 <div className="w-12 h-12 bg-stone-50 dark:bg-stone-800 rounded-xl flex items-center justify-center">
                    <TruckIcon className="w-6 h-6 text-color-one" />
                 </div>
                 <div>
                    <p className="text-xs font-bold text-stone-400 uppercase tracking-[0.2em] mb-1">ESTIMATED DELIVERY</p>
                    <p className="text-2xl font-black text-stone-900 dark:text-white">{order.deliveryDate}</p>
                 </div>
               </div>
            </div>

            {/* Shipping Address Card */}
            <div className="bg-white dark:bg-stone-900 p-8 md:p-10 rounded-[2rem] shadow-sm border border-stone-100 dark:border-stone-800 space-y-6 animate-fade-in-up delay-200">
               <div className="flex items-center gap-3">
                  <MapPinIcon className="w-6 h-6 text-color-one" />
                  <h2 className="text-2xl font-bold text-stone-900 dark:text-white tracking-tight">Shipping Address</h2>
               </div>
               
               <div className="ml-9 space-y-2 text-stone-500 dark:text-stone-400 font-medium text-lg leading-relaxed">
                  <p className="text-stone-900 dark:text-white font-extrabold text-xl">{order.customerName}</p>
                  <p>{order.shippingAddress.split(',')[0]}</p>
                  <p>{order.shippingAddress.split(',').slice(1).join(',').trim()}</p>
                  <p>United States</p>
                  <p className="pt-2 text-stone-400 text-sm font-bold uppercase tracking-wider">Phone: +1 (555) 123-4567</p>
               </div>
            </div>

          </div>

          {/* Right Column: Order Summary Sidebar */}
          <div className="lg:col-span-1 animate-fade-in-up delay-300">
            <div className="bg-white dark:bg-stone-900 rounded-[2rem] shadow-xl border border-stone-100 dark:border-stone-800 overflow-hidden sticky top-28">
               <div className="p-8 space-y-8">
                 <h2 className="text-2xl font-extrabold text-stone-900 dark:text-white tracking-tight">Order Summary</h2>
                 
                 <div className="space-y-6">
                   {order.items.map((item: any) => (
                     <div key={item.id} className="flex gap-4 group">
                       <div className="relative w-24 h-24 bg-stone-100 dark:bg-stone-800 rounded-2xl overflow-hidden flex-shrink-0">
                         <Image 
                           src={item.imagen_principal || item.imagenes?.[0] || "/placeholder.png"} 
                           alt={item.title}
                           fill
                           className="object-cover transition-transform duration-500 group-hover:scale-110"
                         />
                       </div>
                       <div className="flex-1 flex flex-col justify-center min-w-0">
                         <h3 className="font-bold text-stone-900 dark:text-white truncate">{item.title}</h3>
                         <p className="text-sm text-stone-400 font-bold mt-1 uppercase tracking-tighter">Qty: {item.quantity}</p>
                       </div>
                       <div className="flex items-center">
                         <p className="font-black text-stone-900 dark:text-white">S/ {item.price}</p>
                       </div>
                     </div>
                   ))}
                 </div>

                 <div className="space-y-4 pt-8 border-t border-stone-100 dark:border-stone-800">
                    <div className="flex justify-between text-stone-500 dark:text-stone-400 font-medium">
                       <span>Subtotal</span>
                       <span className="text-stone-900 dark:text-white font-bold">S/ {order.total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-stone-500 dark:text-stone-400 font-medium">
                       <span>Shipping</span>
                       <span className="text-stone-900 dark:text-white font-bold">S/ {(order.shippingCost || 15.00).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-stone-500 dark:text-stone-400 font-medium">
                       <span>Tax</span>
                       <span className="text-stone-900 dark:text-white font-bold">S/ {(order.tax || 52.84).toFixed(2)}</span>
                    </div>
                 </div>
               </div>

               {/* Highlighted Total Section */}
               <div className="bg-color-one/10 dark:bg-color-one/20 p-8 flex justify-between items-center">
                  <span className="text-xl font-black text-stone-900 dark:text-white">Total</span>
                  <span className="text-3xl font-black text-color-one">
                     S/ {(order.total + (order.shippingCost || 15.00) + (order.tax || 52.84)).toFixed(2)}
                  </span>
               </div>
            </div>
          </div>

        </div>

        {/* Recommended Products */}
        <section className="mt-32 space-y-12 animate-fade-in-up delay-500">
            <div className="flex items-end justify-between border-b border-stone-100 dark:border-stone-800 pb-8">
                <div>
                   <span className="text-xs font-bold uppercase tracking-[0.4em] text-color-one">Curated for you</span>
                   <h2 className="text-5xl font-black text-stone-900 dark:text-white mt-4 tracking-tight">You Might Also Like</h2>
                </div>
                <Link href="/#catalogo" className="text-sm font-bold text-color-one hover:opacity-80 transition-all flex items-center gap-2">
                    View Collection <ChevronRightIcon className="w-4 h-4" />
                </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {isLoading ? (
                    Array(4).fill(0).map((_, i) => (
                        <div key={i} className="aspect-[9/16] bg-stone-100 dark:bg-stone-900 rounded-[2rem] animate-pulse"></div>
                    ))
                ) : (
                    products.slice(0, 4).map((product) => (
                        <VideoCard key={product.id} garment={product} isSelectionMode={false} />
                    ))
                )}
            </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
};

export default SuccessPage;
