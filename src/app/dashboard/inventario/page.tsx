"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Package, Search, AlertTriangle, Pencil, Trash2, Tag, Loader2, BarChart3, Database } from "lucide-react";
import { insforge } from "@/lib/insforge";
import { toast } from "sonner";
import useSWR, { mutate } from "swr";
import { fetcher } from "@/lib/fetchers";
import ModalBase from "@/components/ModalBase";
import ConfirmDialog from "@/components/ConfirmDialog";
import SearchInput from "@/components/SearchInput";
import EmptyState from "@/components/EmptyState";
import Pagination from "@/components/Pagination";
import Skeleton from "@/components/Skeleton";
import type { ArticuloInventario } from "@/types";

const INVENTARIO_KEY = 'inventario:{"order":["nombre",{"ascending":true}]}';

export default function InventarioPage() {
  const [busqueda, setBusqueda] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);
  const POR_PAGINA = 10;

  const { data, isLoading } = useSWR(INVENTARIO_KEY, fetcher);
  const articulos = (data || []) as ArticuloInventario[];

  // Filtrado y Paginación Local
  const articulosFiltrados = articulos.filter(a => 
    a.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    a.categoria.toLowerCase().includes(busqueda.toLowerCase())
  );
  const totalArticulos = articulosFiltrados.length;
  const totalPaginas = Math.ceil(totalArticulos / POR_PAGINA);
  const articulosPaginados = articulosFiltrados.slice((paginaActual - 1) * POR_PAGINA, paginaActual * POR_PAGINA);

  // Modales y Estados de Formulario
  const [mostrarModal, setMostrarModal] = useState(false);
  const [articuloAEliminar, setArticuloAEliminar] = useState<ArticuloInventario | null>(null);
  
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState("Medicamento");
  const [cantidad, setCantidad] = useState<number>(0);
  const [unidadMedida, setUnidadMedida] = useState("Unidad");
  const [precioVenta, setPrecioVenta] = useState<number>(0);
  const [stockMinimo, setStockMinimo] = useState<number>(5);
  const [enviando, setEnviando] = useState(false);

  const stats = {
    total: articulos.length,
    bajoStock: articulos.filter(a => a.cantidad <= a.stock_minimo).length,
    medicamentos: articulos.filter(a => a.categoria === 'Medicamento').length,
  };

  const limpiarFormulario = () => {
    setEditandoId(null);
    setNombre(""); setCategoria("Medicamento"); setCantidad(0);
    setUnidadMedida("Unidad"); setPrecioVenta(0); setStockMinimo(5);
  };

  const iniciarEdicion = (a: ArticuloInventario) => {
    setEditandoId(a.id);
    setNombre(a.nombre);
    setCategoria(a.categoria);
    setCantidad(a.cantidad);
    setUnidadMedida(a.unidad_medida || "Unidad");
    setPrecioVenta(a.precio_venta || 0);
    setStockMinimo(a.stock_minimo);
    setMostrarModal(true);
  };

  const guardarArticulo = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);

    const articuloData = {
      nombre, categoria, cantidad, unidad_medida: unidadMedida,
      precio_venta: precioVenta, stock_minimo: stockMinimo
    };

    try {
      if (editandoId) {
        await insforge.database.from("inventario").update(articuloData).eq("id", editandoId);
        toast.success("Artículo actualizado");
      } else {
        await insforge.database.from("inventario").insert([articuloData]);
        toast.success("Artículo registrado");
      }
      mutate(INVENTARIO_KEY);
      setMostrarModal(false);
      limpiarFormulario();
    } catch (error) {
      toast.error("Error al guardar el artículo");
    } finally {
      setEnviando(false);
    }
  };

  const eliminarArticulo = async () => {
    if (!articuloAEliminar) return;
    try {
      await insforge.database.from("inventario").delete().eq("id", articuloAEliminar.id);
      toast.success("Artículo eliminado");
      mutate(INVENTARIO_KEY);
    } catch (error) {
      toast.error("Error al eliminar");
    } finally {
      setArticuloAEliminar(null);
    }
  };

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-[1400px] mx-auto space-y-8 pb-12">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-6">
          <div>
            <h2 className="text-[#2D3339] font-medium text-3xl tracking-tight flex items-center gap-3">
              <Package className="w-8 h-8 text-[var(--color-primary)]" />
              Inventario Clínico
            </h2>
            <p className="text-[#A0AAB2] font-normal mt-2 text-[15px]">Control de stock de medicamentos, alimentos y suministros.</p>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-4 w-full lg:w-auto">
            <SearchInput value={busqueda} onChange={(v) => { setBusqueda(v); setPaginaActual(1); }} placeholder="Buscar producto..." />
            <button onClick={() => { limpiarFormulario(); setMostrarModal(true); }} className="w-full md:w-auto bg-[var(--color-primary)] text-white px-6 h-12 rounded-xl font-medium text-[14px] shadow-sm hover:bg-[#e87a60] flex items-center justify-center gap-2 transition-colors">
              <Plus className="w-5 h-5" /> Nuevo Artículo
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-[1.5rem] p-6 border border-[#f0ece1] shadow-sm flex items-center gap-5">
             <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 border border-slate-100">
                <Database className="w-6 h-6" />
             </div>
             <div>
                <p className="text-[13px] text-[#A0AAB2] font-medium uppercase tracking-wide">Total de Productos</p>
                <h4 className="text-2xl font-bold text-[#2D3339] mt-0.5">{isLoading ? "-" : stats.total}</h4>
             </div>
          </div>
          <div className="bg-white rounded-[1.5rem] p-6 border border-rose-100 shadow-sm flex items-center gap-5">
             <div className="w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 border border-rose-100">
                <AlertTriangle className="w-6 h-6" />
             </div>
             <div>
                <p className="text-[13px] text-[#A0AAB2] font-medium uppercase tracking-wide">Stock Crítico</p>
                <h4 className="text-2xl font-bold text-rose-500 mt-0.5">{isLoading ? "-" : stats.bajoStock}</h4>
             </div>
          </div>
          <div className="bg-white rounded-[1.5rem] p-6 border border-[#f0ece1] shadow-sm flex items-center gap-5">
             <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 border border-blue-100">
                <BarChart3 className="w-6 h-6" />
             </div>
             <div>
                <p className="text-[13px] text-[#A0AAB2] font-medium uppercase tracking-wide">Medicamentos</p>
                <h4 className="text-2xl font-bold text-[#2D3339] mt-0.5">{isLoading ? "-" : stats.medicamentos}</h4>
             </div>
          </div>
        </div>

        {/* Listado */}
        <div className="bg-white rounded-[1.5rem] border border-[#f0ece1] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FAF9F6] border-b border-[#f0ece1]">
                  <th className="px-6 py-4 text-[13px] font-medium text-[#A0AAB2] uppercase tracking-wider">Producto</th>
                  <th className="px-6 py-4 text-[13px] font-medium text-[#A0AAB2] uppercase tracking-wider">Categoría</th>
                  <th className="px-6 py-4 text-[13px] font-medium text-[#A0AAB2] uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-4 text-[13px] font-medium text-[#A0AAB2] uppercase tracking-wider">Precio</th>
                  <th className="px-6 py-4 text-[13px] font-medium text-[#A0AAB2] uppercase tracking-wider text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0ece1]">
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      <td colSpan={5} className="px-6 py-4"><Skeleton className="h-10 w-full rounded-lg" /></td>
                    </tr>
                  ))
                ) : articulosPaginados.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <EmptyState title="Inventario Vacío" description="No se encontraron artículos con esos criterios." />
                    </td>
                  </tr>
                ) : (
                  articulosPaginados.map((articulo) => (
                    <tr key={articulo.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${articulo.cantidad <= articulo.stock_minimo ? 'bg-rose-50 border-rose-100 text-rose-500' : 'bg-[#FAF9F6] border-[#f0ece1] text-[#A0AAB2]'}`}>
                            <Tag className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-medium text-[#2D3339] text-sm">{articulo.nombre}</p>
                            <p className="text-xs text-[#A0AAB2] mt-0.5">Mínimo: {articulo.stock_minimo}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-medium">{articulo.categoria}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold ${articulo.cantidad <= articulo.stock_minimo ? 'text-rose-500' : 'text-[#2D3339]'}`}>
                            {articulo.cantidad}
                          </span>
                          <span className="text-xs text-[#A0AAB2]">{articulo.unidad_medida}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-[#8DAA68]">
                        ${articulo.precio_venta?.toFixed(2) || '0.00'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => iniciarEdicion(articulo)} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => setArticuloAEliminar(articulo)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {totalPaginas > 1 && (
            <div className="p-4 border-t border-[#f0ece1]">
              <Pagination paginaActual={paginaActual} totalPaginas={totalPaginas} onPageChange={setPaginaActual} />
            </div>
          )}
        </div>
      </motion.div>

      {/* Modal Formulario */}
      <ModalBase open={mostrarModal} onClose={() => setMostrarModal(false)} maxWidth="max-w-[600px]">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-[var(--color-primary-light)] flex items-center justify-center text-[var(--color-primary)] border border-white shadow-sm">
            {editandoId ? <Pencil className="w-6 h-6" /> : <Package className="w-6 h-6" />}
          </div>
          <div>
            <h3 className="text-[#2D3339] font-medium text-xl">{editandoId ? "Editar Artículo" : "Registrar Artículo"}</h3>
            <p className="text-[13px] text-[#A0AAB2] mt-1">Completa los datos del producto en inventario.</p>
          </div>
        </div>

        <form onSubmit={guardarArticulo} className="space-y-5">
          <div>
            <label className="text-xs font-medium text-[#8591A0] mb-1.5 block">Nombre del Producto</label>
            <input type="text" required value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full h-11 bg-white border border-[#f0ece1] rounded-xl px-4 text-[#2D3339] text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] transition-all" placeholder="Ej: Vacuna Sextuple" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-[#8591A0] mb-1.5 block">Categoría</label>
              <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="w-full h-11 bg-white border border-[#f0ece1] rounded-xl px-4 text-[#2D3339] text-sm focus:border-[var(--color-primary)] focus:outline-none transition-all">
                <option>Medicamento</option>
                <option>Alimento</option>
                <option>Accesorio</option>
                <option>Insumo Médico</option>
                <option>Vacuna</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-[#8591A0] mb-1.5 block">Unidad de Medida</label>
              <select value={unidadMedida} onChange={(e) => setUnidadMedida(e.target.value)} className="w-full h-11 bg-white border border-[#f0ece1] rounded-xl px-4 text-[#2D3339] text-sm focus:border-[var(--color-primary)] focus:outline-none transition-all">
                <option>Unidad</option>
                <option>Caja</option>
                <option>Frasco</option>
                <option>Dosis</option>
                <option>Kg</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-[#8591A0] mb-1.5 block">Cantidad Actual</label>
              <input type="number" min="0" required value={cantidad} onChange={(e) => setCantidad(Number(e.target.value))} className="w-full h-11 bg-white border border-[#f0ece1] rounded-xl px-4 text-[#2D3339] text-sm focus:border-[var(--color-primary)] focus:outline-none transition-all" />
            </div>
            <div>
              <label className="text-xs font-medium text-[#8591A0] mb-1.5 block">Stock Mínimo</label>
              <input type="number" min="0" required value={stockMinimo} onChange={(e) => setStockMinimo(Number(e.target.value))} className="w-full h-11 bg-white border border-[#f0ece1] rounded-xl px-4 text-[#2D3339] text-sm focus:border-[var(--color-primary)] focus:outline-none transition-all" />
            </div>
            <div>
              <label className="text-xs font-medium text-[#8591A0] mb-1.5 block">Precio Venta ($)</label>
              <input type="number" min="0" step="0.01" value={precioVenta} onChange={(e) => setPrecioVenta(Number(e.target.value))} className="w-full h-11 bg-white border border-[#f0ece1] rounded-xl px-4 text-[#2D3339] text-sm focus:border-[var(--color-primary)] focus:outline-none transition-all" />
            </div>
          </div>

          <button type="submit" disabled={enviando} className="w-full h-12 bg-[var(--color-primary)] text-white rounded-xl font-medium mt-4 shadow-sm hover:bg-[#e87a60] transition-colors disabled:opacity-50 flex justify-center items-center">
            {enviando ? <Loader2 className="w-5 h-5 animate-spin" /> : "Guardar Producto"}
          </button>
        </form>
      </ModalBase>

      {/* Modal Confirmación Eliminación */}
      <ConfirmDialog
        open={!!articuloAEliminar}
        onClose={() => setArticuloAEliminar(null)}
        onConfirm={eliminarArticulo}
        icon={<Trash2 className="w-8 h-8 text-rose-500" />}
        title="¿Eliminar Producto?"
        message={<>Estás a punto de borrar <strong>{articuloAEliminar?.nombre}</strong> del inventario. Esta acción no se puede deshacer.</>}
        confirmText="Eliminar"
        cancelText="Cancelar"
        confirmColor="rose"
      />
    </>
  );
}
