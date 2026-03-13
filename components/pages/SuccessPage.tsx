"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { jsPDF } from "jspdf";
import Header from "@/components/layout/Header";
import SiteFooter from "@/components/layout/SiteFooter";
import {
  CheckIcon,
  ChevronRightIcon,
  DocumentIcon,
  TruckIcon,
  MapPinIcon
} from "@/components/ui/Icons";
import { Garment } from "@/types/Garment";
import { useProducts } from "@/hooks/useProducts";
import VideoCard from "@/components/cards/VideoCard";
import VideoModal from '@/components/modals/VideoModal';

const SuccessPage = () => {
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const { products, fetchProducts, isLoading } = useProducts();
  const [selectedProduct, setSelectedProduct] = useState<Garment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const savedOrder = localStorage.getItem('last_order');
    let orderData: any = null;
    if (savedOrder) {
      try {
        orderData = JSON.parse(savedOrder);
        setOrder(orderData);
      } catch (e) {
        console.error("Error parsing order", e);
      }
    }
    
    // Fetch products for recommendations based on the order
    if (orderData && orderData.items && orderData.items.length > 0) {
      const firstItem = orderData.items[0];
      // We prioritize occasion, then brand
      fetchProducts({ 
        limit: 4, 
        occasion: firstItem.occasion || 'all',
        brand: !firstItem.occasion ? (firstItem.brand || 'all') : 'all'
      });
    } else {
      fetchProducts({ limit: 4 });
    }
  }, [fetchProducts]);

  const handleSelectProduct = (product: Garment) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  const handleDownloadPDF = () => {
    if (!order) return;
    const doc = new jsPDF();
    
    // Brand Header
    doc.setFontSize(24);
    doc.setTextColor(20, 20, 20);
    doc.text("VESTIDO SHOP", 105, 20, { align: "center" });
    
    // Receipt Info
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Comprobante de Pedido: ${order.orderNumber}`, 20, 35);
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-PE')}`, 190, 35, { align: "right" });
    
    // Customer Section
    doc.setDrawColor(230, 230, 230);
    doc.line(20, 40, 190, 40);
    
    doc.setFontSize(12);
    doc.setTextColor(20, 20, 20);
    doc.setFont("helvetica", "bold");
    doc.text("DATOS DE ENVÍO", 20, 50);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Cliente: ${order.customerName}`, 20, 60);
    doc.text(`Dirección: ${order.shippingAddress}`, 20, 67);
    
    // Items Table
    doc.setFont("helvetica", "bold");
    doc.text("RESUMEN DE PRODUCTOS", 20, 85);
    
    let y = 95;
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text("DESCRIPCIÓN", 20, y);
    doc.text("CANT", 130, y, { align: "center" });
    doc.text("PRECIO", 155, y, { align: "center" });
    doc.text("TOTAL", 190, y, { align: "right" });
    
    doc.setDrawColor(240, 240, 240);
    doc.line(20, y + 2, 190, y + 2);
    
    y += 10;
    doc.setTextColor(20, 20, 20);
    doc.setFont("helvetica", "normal");
    
    order.items.forEach((item: any) => {
      doc.text(item.title, 20, y, { maxWidth: 100 });
      doc.text(item.quantity.toString(), 130, y, { align: "center" });
      doc.text(`S/ ${(item.price || 0).toFixed(2)}`, 155, y, { align: "center" });
      doc.text(`S/ ${((item.price || 0) * item.quantity).toFixed(2)}`, 190, y, { align: "right" });
      y += 10;
    });
    
    // Totals Section
    y += 5;
    doc.setDrawColor(200, 200, 200);
    doc.line(120, y, 190, y);
    
    y += 10;
    doc.setFontSize(10);
    doc.text("Subtotal:", 120, y);
    doc.text(`S/ ${order.total.toFixed(2)}`, 190, y, { align: "right" });
    
    y += 7;
    doc.text("Envío:", 120, y);
    doc.text("Por coordinar", 190, y, { align: "right" });
    
    y += 10;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL:", 120, y);
    doc.text(`S/ ${order.total.toFixed(2)}`, 190, y, { align: "right" });
    
    // Footer
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(150, 150, 150);
    doc.text("Gracias por tu preferencia. Coordinaremos los detalles finales vía WhatsApp.", 105, 280, { align: "center" });
    doc.text("www.vestido.shop", 105, 285, { align: "center" });
    
    doc.save(`Pedido_${order.orderNumber}.pdf`);
  };

  if (!order) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex flex-col">
        <Header isAdmin={false} onToggleAdmin={() => {}} navigate={router.push} hideAdminControls={true} />
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
        isAdmin={false}
        onToggleAdmin={() => {}}
        navigate={(path) => router.push(path)}
        hideAdminControls={true}
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
                  ¡Gracias por tu pedido!
                </h1>
                <p className="text-lg text-stone-500 dark:text-stone-400 font-medium max-w-2xl leading-relaxed">
                  Hemos recibido los detalles de tu orden. Ahora estamos listos para coordinar la entrega y el pago a través de WhatsApp.
                </p>
              </div>
              
              <div className="flex flex-wrap gap-4 pt-4">
                <Link 
                  href="/#catalogo"
                  className="bg-color-one hover:opacity-90 text-white px-10 py-4 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-xl shadow-color-one/20 active:scale-[0.98]"
                >
                  Continuar Comprando <ChevronRightIcon className="w-5 h-5" />
                </Link>
                <Link 
                  href="/#catalogo"
                  className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 px-10 py-4 rounded-2xl font-bold hover:bg-stone-50 dark:hover:bg-stone-700 transition-all active:scale-[0.98]"
                >
                  Volver al inicio
                </Link>
              </div>
            </div>

            {/* Status Mini-Cards (Hidden for now) */}
            {/* 
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-up delay-100">
               <div className="bg-white dark:bg-stone-900 p-8 rounded-[2rem] shadow-sm border border-stone-100 dark:border-stone-800 flex items-center gap-6">
                 <div className="w-12 h-12 bg-stone-50 dark:bg-stone-800 rounded-xl flex items-center justify-center">
                    <DocumentIcon className="w-6 h-6 text-color-one" />
                 </div>
                 <div>
                    <p className="text-xs font-bold text-stone-400 uppercase tracking-[0.2em] mb-1">CÓDIGO DE ORDEN</p>
                    <p className="text-2xl font-black text-stone-900 dark:text-white">#{order.orderNumber.split('-')[1] || order.orderNumber}</p>
                 </div>
               </div>

               <div className="bg-white dark:bg-stone-900 p-8 rounded-[2rem] shadow-sm border border-stone-100 dark:border-stone-800 flex items-center gap-6">
                 <div className="w-12 h-12 bg-stone-50 dark:bg-stone-800 rounded-xl flex items-center justify-center">
                    <TruckIcon className="w-6 h-6 text-color-one" />
                 </div>
                 <div>
                    <p className="text-xs font-bold text-stone-400 uppercase tracking-[0.2em] mb-1">ENTREGA ESTIMADA</p>
                    <p className="text-lg font-black text-stone-900 dark:text-white uppercase">{order.deliveryDate}</p>
                 </div>
               </div>
            </div>
            */}

            {/* Shipping Address Card */}
            <div className="bg-white dark:bg-stone-900 p-8 md:p-10 rounded-[2rem] shadow-sm border border-stone-100 dark:border-stone-800 space-y-6 animate-fade-in-up delay-200">
               <div className="flex items-center gap-3">
                  <MapPinIcon className="w-6 h-6 text-color-one" />
                  <h2 className="text-2xl font-bold text-stone-900 dark:text-white tracking-tight">Datos de Entrega</h2>
               </div>
               
               <div className="ml-9 space-y-2 text-stone-500 dark:text-stone-400 font-medium text-lg leading-relaxed">
                  <p className="text-stone-900 dark:text-white font-extrabold text-xl">{order.customerName}</p>
                  <p>{order.shippingAddress}</p>
               </div>
            </div>
          </div>

          {/* Right Column: Order Summary Sidebar */}
          <div className="lg:col-span-1 animate-fade-in-up delay-300 sticky top-28 space-y-6 h-fit">
            <div className="bg-white dark:bg-stone-900 rounded-[2rem] shadow-xl border border-stone-100 dark:border-stone-800 overflow-hidden">
               <div className="p-8 space-y-8">
                 <h2 className="text-2xl font-extrabold text-stone-900 dark:text-white tracking-tight">Resumen de Orden</h2>
                 
                 <div className="space-y-6">
                   {order.items.map((item: any) => (
                     <div key={`${item.id}-${item.size}`} className="flex gap-5 group">
                       <div className="relative w-20 h-24 rounded-2xl overflow-hidden flex-shrink-0 bg-stone-50 dark:bg-stone-800">
                         <Image 
                           src={item.imagen_principal || item.imagenes?.[0] || "/placeholder.png"} 
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

                 <div className="space-y-4 pt-8 border-t border-stone-100 dark:border-stone-800">
                    <div className="flex justify-between text-stone-500 dark:text-stone-400 font-medium">
                       <span>Subtotal</span>
                       <span className="text-stone-900 dark:text-white font-bold">S/ {order.total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-stone-500 dark:text-stone-400 font-medium">
                       <span>Envío</span>
                       <span className="text-color-one font-bold italic text-sm">Por coordinar</span>
                    </div>
                    <div className="flex justify-between text-stone-500 dark:text-stone-400 font-medium">
                       <span>Impuestos (IGV)</span>
                       <span className="text-stone-900 dark:text-white font-bold">S/ 0.00</span>
                    </div>
                 </div>
               </div>

               {/* Highlighted Total Section */}
               <div className="bg-color-one/10 dark:bg-color-one/20 p-8 flex justify-between items-center">
                  <span className="text-xl font-black text-stone-900 dark:text-white">Total</span>
                  <span className="text-3xl font-black text-color-one">
                     S/ {order.total.toFixed(2)}
                  </span>
               </div>
            </div>

            {/* PDF Export Section - Separate Div Card */}
            <div className="bg-white dark:bg-stone-900 p-8 rounded-[2rem] shadow-lg border border-stone-100 dark:border-stone-800 space-y-4">
              <button
                onClick={handleDownloadPDF}
                className="w-full flex items-center justify-center gap-3 py-5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-all shadow-sm active:scale-[0.98]"
              >
                <DocumentIcon className="w-5 h-5" />
                Exportar Resumen en PDF
              </button>
              <div className="flex items-start gap-3 p-4 bg-stone-50 dark:bg-stone-950/20 rounded-xl border border-stone-100 dark:border-stone-800/50">
                <div className="w-5 h-5 bg-stone-200 dark:bg-stone-800 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[10px] font-bold">!</span>
                </div>
                <p className="text-[10px] text-stone-500 dark:text-stone-400 leading-relaxed italic">
                  Este documento te servirá como referencia de los productos seleccionados y el total a pagar durante la coordinación.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recommended Products */}
        <section className="mt-32 space-y-12 animate-fade-in-up delay-500">
            <div className="flex items-end justify-between border-b border-stone-100 dark:border-stone-800 pb-8">
                <div>
                   <span className="text-xs font-bold uppercase tracking-[0.4em] text-color-one">Curado para ti</span>
                   <h2 className="text-5xl font-black text-stone-900 dark:text-white mt-4 tracking-tight">También te podría interesar</h2>
                </div>
                <Link href="/#catalogo" className="text-sm font-bold text-color-one hover:opacity-80 transition-all flex items-center gap-2">
                    Ver Colección <ChevronRightIcon className="w-4 h-4" />
                </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {isLoading ? (
                    Array(4).fill(0).map((_, i) => (
                        <div key={i} className="aspect-[9/16] bg-stone-100 dark:bg-stone-900 rounded-[2rem] animate-pulse"></div>
                    ))
                ) : (
                    products.slice(0, 4).map((product) => (
                        <VideoCard 
                          key={product.id} 
                          garment={product} 
                          isSelectionMode={false} 
                          onSelect={handleSelectProduct}
                        />
                    ))
                )}
            </div>
        </section>
      </main>

      <VideoModal
        isOpen={isModalOpen}
        garment={selectedProduct || undefined}
        onClose={handleCloseModal}
        garmentList={products}
        onChangeGarment={setSelectedProduct}
      />

      <SiteFooter />
    </div>
  );
};

export default SuccessPage;
