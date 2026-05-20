"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetchers";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, FileText, Trash2, Printer, Check, X, Package, Stethoscope, Banknote } from "lucide-react";
import { toast } from "sonner";
import EmptyState from "@/components/EmptyState";
import ModalBase from "@/components/ModalBase";
import PetAutocomplete from "@/components/PetAutocomplete";
import type { Venta, VentaDetalle, ArticuloInventario } from "@/types";

const VENTAS_KEY = 'ventas:{"order":["fecha",{"ascending":false}]}';
const INVENTARIO_KEY = 'inventario:{"order":["nombre",{"ascending":true}]}';

export default function VentasPage() {
  const { data: ventasData, isLoading: ventasLoading, mutate: mutateVentas } = useSWR(VENTAS_KEY, fetcher);
  const { data: inventarioData } = useSWR(INVENTARIO_KEY, fetcher);

  const ventas = (ventasData || []) as Venta[];
  const inventario = (inventarioData || []) as ArticuloInventario[];

  const [modalAbierto, setModalAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  const ventasFiltradas = useMemo(() => {
    return ventas.filter(v => 
      v.mascota.toLowerCase().includes(busqueda.toLowerCase()) || 
      v.dueno.toLowerCase().includes(busqueda.toLowerCase())
    );
  }, [ventas, busqueda]);

  const abrirModal = () => setModalAbierto(true);
  const cerrarModal = () => setModalAbierto(false);

  const imprimirTicket = async (venta: Venta) => {
    const { data: detalles } = await supabase.from('venta_detalles').select('*').eq('venta_id', venta.id);
    if (!detalles) return;

    // @ts-ignore
    const { jsPDF } = await import("jspdf/dist/jspdf.umd.js");
    const doc = new jsPDF({ format: [80, 200] }); // Formato ticket 80mm

    let currentY = 10;

    // Cargar Logo
    const img = new Image();
    img.src = '/icons/logo.jpg'; // O '/icons/logo-transparent.png' si prefieres
    await new Promise((resolve) => {
      img.onload = resolve;
      img.onerror = resolve; // Continuar aunque falle
    });

    if (img.complete && img.naturalHeight !== 0) {
      // Centrar el logo (ancho 80, logo 30 -> x = 25)
      doc.addImage(img, 'JPEG', 25, 5, 30, 30);
      currentY = 40;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Clínica Veterinaria", 40, currentY, { align: "center" });
    currentY += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("Dra. Tamara Abigail Alvarez Flores", 40, currentY, { align: "center" });
    currentY += 5;
    
    doc.setLineDashPattern([1, 1], 0);
    doc.line(5, currentY, 75, currentY);
    doc.setLineDashPattern([], 0);
    currentY += 5;

    doc.text(`Fecha: ${new Date(venta.fecha).toLocaleDateString()}`, 5, currentY);
    currentY += 5;
    doc.text(`Cliente: ${venta.dueno}`, 5, currentY);
    currentY += 5;
    doc.text(`Paciente: ${venta.mascota}`, 5, currentY);
    currentY += 5;
    
    doc.line(5, currentY, 75, currentY);
    currentY += 5;
    
    doc.setFont("helvetica", "bold");
    doc.text("CANT", 5, currentY);
    doc.text("DESCRIPCIÓN", 20, currentY);
    doc.text("SUBT", 65, currentY);
    doc.setFont("helvetica", "normal");
    
    let y = currentY + 5;
    detalles.forEach((det: VentaDetalle) => {
      doc.text(`${det.cantidad}`, 5, y);
      const desc = doc.splitTextToSize(det.concepto, 40);
      doc.text(desc, 20, y);
      doc.text(`S/ ${det.subtotal.toFixed(2)}`, 65, y);
      y += desc.length * 4 + 2;
    });

    doc.line(5, y, 75, y);
    y += 5;
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`TOTAL: S/ ${venta.total.toFixed(2)}`, 65, y, { align: "right" });
    y += 8;
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(`Método: ${venta.metodo_pago}`, 5, y);
    y += 10;
    
    doc.text("¡Gracias por su preferencia!", 40, y, { align: "center" });

    doc.save(`Ticket_Venta_${venta.id.slice(0,6)}.pdf`);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 w-full min-w-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#2D3339] tracking-tight">Punto de Venta</h1>
          <p className="text-[#8591A0] text-sm md:text-base mt-1">Registra cobros y administra tus ingresos</p>
        </div>
        <button
          onClick={abrirModal}
          className="bg-[var(--color-primary)] hover:bg-[#e87a60] text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm flex items-center gap-2"
        >
          <Plus size={18} />
          Nueva Venta
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-[#f0ece1] flex items-center gap-3">
        <Search className="text-[#8591A0] w-5 h-5 ml-2" />
        <input
          type="text"
          placeholder="Buscar por dueño o mascota..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          className="flex-1 bg-transparent border-none focus:outline-none text-[#2D3339] placeholder:text-[#A0AAB2] text-sm"
        />
      </div>

      <div className="bg-white border border-[#f0ece1] rounded-[1.5rem] overflow-hidden shadow-sm w-full min-w-0">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-[#f0ece1]">
                <th className="py-4 px-6 text-xs font-semibold text-[#8591A0] uppercase tracking-wider">Fecha</th>
                <th className="py-4 px-6 text-xs font-semibold text-[#8591A0] uppercase tracking-wider">Cliente / Mascota</th>
                <th className="py-4 px-6 text-xs font-semibold text-[#8591A0] uppercase tracking-wider">Método Pago</th>
                <th className="py-4 px-6 text-xs font-semibold text-[#8591A0] uppercase tracking-wider">Total</th>
                <th className="py-4 px-6 text-xs font-semibold text-[#8591A0] uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0ece1]">
              {ventasLoading ? (
                <tr><td colSpan={5} className="p-10 text-center text-[#A0AAB2]">Cargando ventas...</td></tr>
              ) : ventasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-0">
                    <EmptyState 
                      title="No hay ventas registradas" 
                      description={busqueda ? "No encontramos coincidencias para tu búsqueda." : "Crea tu primera venta para empezar a llevar el control."} 
                    />
                  </td>
                </tr>
              ) : (
                ventasFiltradas.map((venta) => (
                  <tr key={venta.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 text-sm text-[#8591A0]">
                      {new Date(venta.fecha).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-[#2D3339]">{venta.dueno}</span>
                        <span className="text-xs text-[#8591A0]">{venta.mascota}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-[#2D3339]">
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium">
                        {venta.metodo_pago}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm font-bold text-[#10b981]">
                      S/ {venta.total.toFixed(2)}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => imprimirTicket(venta)}
                        className="p-2 text-[#8591A0] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-light)] rounded-lg transition-colors inline-flex"
                        title="Imprimir Ticket"
                      >
                        <Printer size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <NuevaVentaModal
        open={modalAbierto}
        onClose={cerrarModal}
        inventario={inventario}
        onSuccess={() => { mutateVentas(); cerrarModal(); }}
      />
    </motion.div>
  );
}

// ----------------------------------------------------
// Modal de Nueva Venta
// ----------------------------------------------------

function NuevaVentaModal({ open, onClose, inventario, onSuccess }: { open: boolean, onClose: () => void, inventario: ArticuloInventario[], onSuccess: () => void }) {
  const [mascota, setMascota] = useState("");
  const [dueno, setDueno] = useState("");
  const [metodoPago, setMetodoPago] = useState("Efectivo");
  const [esConsumidorFinal, setEsConsumidorFinal] = useState(false);

  const toggleConsumidorFinal = (checked: boolean) => {
    setEsConsumidorFinal(checked);
    if (checked) {
      setMascota("General");
      setDueno("Consumidor Final");
    } else {
      setMascota("");
      setDueno("");
    }
  };

  // Formularios de detalle
  type TipoItem = "Servicio" | "Producto";
  const [tipoItem, setTipoItem] = useState<TipoItem>("Servicio");
  
  // Estado para Servicio
  const [conceptoServicio, setConceptoServicio] = useState("");
  const [precioServicio, setPrecioServicio] = useState("");
  
  // Estado para Producto
  const [productoSeleccionado, setProductoSeleccionado] = useState("");
  const [cantidadProducto, setCantidadProducto] = useState("1");

  // Lista temporal
  const [detalles, setDetalles] = useState<Omit<VentaDetalle, 'id' | 'venta_id'>[]>([]);
  const [guardando, setGuardando] = useState(false);

  const total = detalles.reduce((acc, d) => acc + d.subtotal, 0);

  const agregarServicio = () => {
    if (!conceptoServicio || !precioServicio) return toast.error("Ingresa el concepto y precio");
    const p = parseFloat(precioServicio);
    if (isNaN(p) || p <= 0) return toast.error("Precio inválido");
    
    setDetalles([...detalles, { concepto: conceptoServicio, cantidad: 1, precio_compra: 0, precio_unitario: p, subtotal: p }]);
    setConceptoServicio("");
    setPrecioServicio("");
  };

  const agregarProducto = () => {
    if (!productoSeleccionado) return toast.error("Selecciona un producto");
    const prod = inventario.find(i => i.id === productoSeleccionado);
    if (!prod) return;
    
    const cant = parseInt(cantidadProducto);
    if (isNaN(cant) || cant <= 0) return toast.error("Cantidad inválida");
    if (cant > prod.cantidad) return toast.error(`Solo hay ${prod.cantidad} en stock`);
    
    const precio = prod.precio_venta || 0;
    
    setDetalles([...detalles, { 
      concepto: prod.nombre, 
      articulo_id: prod.id,
      cantidad: cant, 
      precio_compra: prod.precio_compra || 0,
      precio_unitario: precio, 
      subtotal: cant * precio 
    }]);
    
    setProductoSeleccionado("");
    setCantidadProducto("1");
  };

  const eliminarDetalle = (index: number) => {
    const nuevos = [...detalles];
    nuevos.splice(index, 1);
    setDetalles(nuevos);
  };

  const procesarVenta = async () => {
    if (!mascota || !dueno) return toast.error("Debes seleccionar una mascota y dueño");
    if (detalles.length === 0) return toast.error("Agrega al menos un servicio o producto");
    
    setGuardando(true);
    try {
      // 1. Crear venta
      const { data: ventaData, error: errVenta } = await supabase.from('ventas').insert([{
        mascota, dueno, total, metodo_pago: metodoPago, fecha: new Date().toISOString()
      }]).select('id').single();
      
      if (errVenta) throw errVenta;

      // 2. Insertar detalles
      const detallesAInsertar = detalles.map(d => ({ ...d, venta_id: ventaData.id }));
      const { error: errDetalles } = await supabase.from('venta_detalles').insert(detallesAInsertar);
      if (errDetalles) throw errDetalles;

      // 3. Descontar inventario
      const prodsAActualizar = detalles.filter(d => d.articulo_id);
      for (const prod of prodsAActualizar) {
        // Obtenemos stock actual (por si acaso)
        const itemStock = inventario.find(i => i.id === prod.articulo_id);
        if (itemStock) {
           const nuevoStock = itemStock.cantidad - prod.cantidad;
           await supabase.from('inventario').update({ cantidad: nuevoStock }).eq('id', prod.articulo_id);
        }
      }

      toast.success("Venta procesada con éxito");
      
      // Reset
      setMascota(""); setDueno(""); setDetalles([]);
      setEsConsumidorFinal(false);
      onSuccess();
    } catch (e: any) {
      console.error(e);
      toast.error("Error al procesar la venta");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <ModalBase open={open} onClose={onClose} maxWidth="max-w-4xl">
      <div className="mb-6 flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center shrink-0">
          <Banknote size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-[#2D3339]">Registrar Venta</h2>
          <p className="text-[#8591A0] text-sm">Crea una nueva venta y genera un ticket</p>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full min-w-0">
        
        {/* Lado Izquierdo: Formulario de entrada */}
        <div className="space-y-6">
          {/* Cliente */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4">
             <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[#2D3339] flex items-center gap-2">
                  1. Cliente
                </h3>
                <label className="flex items-center gap-2 text-xs font-medium text-[#8591A0] cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={esConsumidorFinal} 
                    onChange={(e) => toggleConsumidorFinal(e.target.checked)}
                    className="rounded border-[#d0d5dc] text-[var(--color-primary)] focus:ring-[var(--color-primary)] w-4 h-4 cursor-pointer"
                  />
                  Consumidor Final
                </label>
             </div>
             {!esConsumidorFinal ? (
               <PetAutocomplete 
                 value={mascota}
                 onChange={(val) => setMascota(val)}
                 onSelectPet={(n, d) => { setMascota(n); setDueno(d); }}
                 placeholder="Busca una mascota..."
               />
             ) : (
               <div className="text-sm text-slate-500 bg-white border border-[#f0ece1] px-4 py-2.5 rounded-xl">
                 Venta a nombre de <strong className="text-[#2D3339]">Consumidor Final</strong>
               </div>
             )}
          </div>

          {/* Agregar Ítems */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4">
             <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[#2D3339]">2. Agregar Ítems</h3>
                <div className="flex bg-white rounded-lg p-1 shadow-sm border border-slate-200">
                  <button type="button" onClick={() => setTipoItem("Servicio")} className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${tipoItem === "Servicio" ? 'bg-[var(--color-primary)] text-white' : 'text-slate-500 hover:text-[#2D3339]'}`}>Servicio</button>
                  <button type="button" onClick={() => setTipoItem("Producto")} className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${tipoItem === "Producto" ? 'bg-[var(--color-primary)] text-white' : 'text-slate-500 hover:text-[#2D3339]'}`}>Producto</button>
                </div>
             </div>

             {tipoItem === "Servicio" ? (
               <div className="space-y-3">
                 <div>
                   <label className="block text-xs font-medium text-[#8591A0] mb-1">Concepto</label>
                   <input type="text" placeholder="Ej: Consulta General" value={conceptoServicio} onChange={e=>setConceptoServicio(e.target.value)} className="w-full bg-white border border-[#d0d5dc] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--color-primary)]" />
                 </div>
                 <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-[#8591A0] mb-1">Precio (S/)</label>
                      <input type="number" step="0.01" value={precioServicio} onChange={e=>setPrecioServicio(e.target.value)} className="w-full bg-white border border-[#d0d5dc] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--color-primary)]" />
                    </div>
                    <button type="button" onClick={agregarServicio} className="mt-5 bg-slate-800 text-white px-4 rounded-xl text-sm font-medium hover:bg-slate-700 transition-colors flex items-center gap-2">
                       Añadir <Plus size={16}/>
                    </button>
                 </div>
               </div>
             ) : (
               <div className="space-y-3">
                 <div>
                   <label className="block text-xs font-medium text-[#8591A0] mb-1">Producto del Inventario</label>
                   <select value={productoSeleccionado} onChange={e=>setProductoSeleccionado(e.target.value)} className="w-full bg-white border border-[#d0d5dc] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--color-primary)]">
                     <option value="">-- Seleccionar Producto --</option>
                     {inventario.filter(i => i.cantidad > 0).map(item => (
                       <option key={item.id} value={item.id}>{item.nombre} (Disp: {item.cantidad} | Precio: S/ {item.precio_venta || 0})</option>
                     ))}
                   </select>
                 </div>
                 <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-[#8591A0] mb-1">Cantidad</label>
                      <input type="number" min="1" value={cantidadProducto} onChange={e=>setCantidadProducto(e.target.value)} className="w-full bg-white border border-[#d0d5dc] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--color-primary)]" />
                    </div>
                    <button type="button" onClick={agregarProducto} className="mt-5 bg-slate-800 text-white px-4 rounded-xl text-sm font-medium hover:bg-slate-700 transition-colors flex items-center gap-2">
                       Añadir <Plus size={16}/>
                    </button>
                 </div>
               </div>
             )}
          </div>
        </div>

        {/* Lado Derecho: Resumen / Carrito */}
        <div className="bg-white rounded-2xl border border-[#f0ece1] shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col overflow-hidden h-[450px]">
           <div className="bg-slate-50 border-b border-[#f0ece1] p-4">
             <h3 className="font-semibold text-[#2D3339] flex items-center gap-2"><FileText size={18} className="text-[#8591A0]"/> Resumen de Venta</h3>
           </div>
           
           <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
             {detalles.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center text-[#A0AAB2] space-y-2">
                 <Package size={32} opacity={0.5}/>
                 <p className="text-sm">No hay ítems en la venta</p>
               </div>
             ) : (
               detalles.map((d, idx) => (
                 <div key={idx} className="flex items-center justify-between bg-white border border-[#f0ece1] p-3 rounded-xl shadow-sm">
                   <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${d.articulo_id ? 'bg-amber-50 text-amber-500' : 'bg-teal-50 text-teal-500'}`}>
                         {d.articulo_id ? <Package size={16}/> : <Stethoscope size={16}/>}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#2D3339] leading-tight">{d.concepto}</p>
                        <p className="text-xs text-[#8591A0] mt-0.5">{d.cantidad} x S/ {d.precio_unitario.toFixed(2)}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-[#10b981]">S/ {d.subtotal.toFixed(2)}</span>
                      <button onClick={() => eliminarDetalle(idx)} className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors"><Trash2 size={16}/></button>
                   </div>
                 </div>
               ))
             )}
           </div>

           {/* Total y Checkout */}
           <div className="bg-slate-50 border-t border-[#f0ece1] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[#8591A0] font-medium">Método de Pago:</span>
                <select value={metodoPago} onChange={e=>setMetodoPago(e.target.value)} className="bg-white border border-[#d0d5dc] rounded-lg px-2 py-1 text-sm font-medium text-[#2D3339] focus:outline-none focus:border-[var(--color-primary)]">
                  <option>Efectivo</option>
                  <option>Transferencia</option>
                  <option>Tarjeta</option>
                  <option>Yape</option>
                  <option>Plin</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-[#2D3339]">Total a cobrar:</span>
                <span className="text-2xl font-black text-[#10b981]">S/ {total.toFixed(2)}</span>
              </div>
              <button 
                onClick={procesarVenta} 
                disabled={detalles.length === 0 || guardando}
                className="w-full bg-[var(--color-primary)] hover:bg-[#e87a60] disabled:bg-slate-300 disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold text-sm transition-all shadow-sm flex items-center justify-center gap-2"
              >
                {guardando ? 'Procesando...' : <><Check size={18}/> Procesar y Cobrar</>}
              </button>
           </div>
        </div>

      </div>
    </ModalBase>
  );
}
