"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Calendar, FileText, Syringe, Plus, Clock, File, Trash2, Loader2, Download, AlertTriangle, ChevronRight, CheckCircle2, Stethoscope, Info } from "lucide-react";
import ModalBase from "./ModalBase";
import { insforge } from "@/lib/insforge";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import type { Paciente, HistorialClinico, Vacuna, Cita } from "@/types";

interface Props {
  paciente: Paciente | null;
  onClose: () => void;
}

export default function MedicalRecordModal({ paciente, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<'timeline' | 'vacunas' | 'archivos'>('timeline');
  const [cargando, setCargando] = useState(false);
  
  // Data
  const [historial, setHistorial] = useState<HistorialClinico[]>([]);
  const [vacunas, setVacunas] = useState<Vacuna[]>([]);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [citaDetalle, setCitaDetalle] = useState<Cita | null>(null);
  
  // Forms
  const [mostrarFormVacuna, setMostrarFormVacuna] = useState(false);
  const [nuevaVacuna, setNuevaVacuna] = useState({ tipo: 'Vacuna', nombre: '', fecha_aplicacion: '', proxima_dosis: '', notas: '' });
  const [subiendoArchivo, setSubiendoArchivo] = useState(false);

  useEffect(() => {
    if (paciente) {
      cargarDatos();
    }
  }, [paciente]);

  const cargarDatos = async () => {
    if (!paciente) return;
    setCargando(true);
    try {
      const [resHistorial, resVacunas, resCitas] = await Promise.all([
        insforge.database.from('historial_clinico').select('*').eq('paciente_id', paciente.id).order('fecha', { ascending: false }),
        insforge.database.from('vacunas').select('*').eq('paciente_id', paciente.id).order('fecha_aplicacion', { ascending: false }),
        insforge.database.from('citas').select('*').eq('mascota', paciente.nombre).eq('dueno', paciente.dueno).order('fecha', { ascending: false })
      ]);
      
      if (resHistorial.data) setHistorial(resHistorial.data as HistorialClinico[]);
      if (resVacunas.data) setVacunas(resVacunas.data as Vacuna[]);
      if (resCitas.data) setCitas(resCitas.data as Cita[]);
    } catch (error) {
      console.error(error);
    } finally {
      setCargando(false);
    }
  };

  const handleSubirArchivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !paciente) return;
    
    setSubiendoArchivo(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${paciente.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await insforge.storage.from('historial').upload(fileName, file);
      if (uploadError) throw uploadError;

      const publicUrl = insforge.storage.from('historial').getPublicUrl(fileName) as string;

      const nuevoRegistro: Partial<HistorialClinico> = {
        paciente_id: paciente.id,
        fecha: new Date().toISOString(),
        tipo: 'Archivo Adjunto',
        titulo: `Documento: ${file.name}`,
        archivos: [{ url: publicUrl, nombre: file.name, tipo: file.type }]
      };

      await insforge.database.from('historial_clinico').insert([nuevoRegistro]);
      toast.success("Archivo subido correctamente");
      cargarDatos();
    } catch (error) {
      toast.error("Error al subir el archivo");
    } finally {
      setSubiendoArchivo(false);
    }
  };

  const guardarVacuna = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paciente) return;
    
    try {
      await insforge.database.from('vacunas').insert([{
        paciente_id: paciente.id,
        ...nuevaVacuna,
        fecha_aplicacion: nuevaVacuna.fecha_aplicacion || new Date().toISOString().split('T')[0]
      }]);
      toast.success("Registro guardado");
      setMostrarFormVacuna(false);
      setNuevaVacuna({ tipo: 'Vacuna', nombre: '', fecha_aplicacion: '', proxima_dosis: '', notas: '' });
      cargarDatos();
    } catch (error) {
      toast.error("Error al guardar registro");
    }
  };

  const eliminarVacuna = async (id: string) => {
    try {
      await insforge.database.from('vacunas').delete().eq('id', id);
      toast.success("Registro eliminado");
      cargarDatos();
    } catch (error) {
      toast.error("Error al eliminar");
    }
  };

  // Combinar historial, citas y vacunas para el timeline
  const timelineItems = [
    ...historial.map(h => ({ ...h, source: 'historial', date: new Date(h.fecha) })),
    ...vacunas.map(v => ({ id: v.id, titulo: `${v.tipo}: ${v.nombre}`, descripcion: v.notas, fecha: v.fecha_aplicacion, source: 'vacuna', date: new Date(v.fecha_aplicacion) })),
    ...citas.filter(c => c.estado === 'Completada').map(c => ({ id: c.id, titulo: `Consulta: ${c.tipo}`, descripcion: c.diagnostico, fecha: c.fecha, source: 'cita', date: new Date(c.fecha) }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  const archivosAll = historial.filter(h => h.archivos && h.archivos.length > 0).flatMap(h => h.archivos || []);

  const compartirWhatsApp = () => {
    if (!citaDetalle || !paciente) return;
    
    const telefonoRaw = paciente.telefono || '';
    const phoneInfo = telefonoRaw.replace(/\D/g, '');
    const phone = phoneInfo.startsWith('51') ? phoneInfo : `51${phoneInfo}`;

    const PAW    = '\uD83D\uDC3E'; // 🐾
    const STET   = '\uD83E\uDE7A'; // 🩺
    const PILL   = '\uD83D\uDC8A'; // 💊
    const WARN   = '\u26A0\uFE0F';  // ⚠️
    const INFO   = '\u2139\uFE0F';  // ℹ️
    const HOSP   = '\uD83C\uDFE5'; // 🏥
    const DOC    = '\uD83D\uDCCE'; // 📎

    let mensaje = `${PAW} *Resumen de Consulta Veterinaria*\n`;
    mensaje += `*Paciente:* ${paciente.nombre}\n`;
    mensaje += `*Dueño:* ${paciente.dueno}\n`;
    mensaje += `*Fecha de atención:* ${citaDetalle.fecha.split('-').reverse().join('/')}\n\n`;
    
    if (citaDetalle.diagnostico) mensaje += `${STET} *Procedimiento Realizado:*\n${citaDetalle.diagnostico}\n\n`;
    if (citaDetalle.tratamiento) mensaje += `${PILL} *Tratamiento / Receta:*\n${citaDetalle.tratamiento}\n\n`;
    if (citaDetalle.observaciones) mensaje += `${WARN} *Observaciones:*\n${citaDetalle.observaciones}\n\n`;
    if (citaDetalle.recomendaciones) mensaje += `${INFO} *Recomendaciones:*\n${citaDetalle.recomendaciones}\n\n`;
    
    if (citaDetalle.archivos && (citaDetalle.archivos as any[]).length > 0) {
      mensaje += `${DOC} *Documentos adjuntos:*\n`;
      (citaDetalle.archivos as any[]).forEach((file, idx) => {
        mensaje += `${idx + 1}. ${file.nombre || 'Archivo'}: ${file.url}\n`;
      });
      mensaje += '\n';
    }

    mensaje += `${HOSP} *Veterinaria Dra. Exotic*`;

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  };

  const generarRecetaPDF = async () => {
    if (!citaDetalle || !paciente) return;
    
    // @ts-ignore
    const { jsPDF } = await import("jspdf/dist/jspdf.umd.js");
    const doc = new jsPDF();
    
    // Cargar Logo
    const img = new Image();
    img.src = '/icons/logo-transparent.png';
    await new Promise((resolve) => {
      img.onload = resolve;
      img.onerror = resolve; // Continue even if image fails
    });

    if (img.complete && img.naturalHeight !== 0) {
      // Dibujar logo arriba a la derecha
      doc.addImage(img, 'PNG', 160, 10, 30, 30);
    }
    
    // Título y Cabecera
    doc.setFontSize(22);
    doc.setTextColor(242, 140, 115); // Color primario
    doc.text("Clínica Veterinaria", 20, 20);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Dra. Exotic - Centro de Especialidades", 20, 28);
    
    // Línea separadora
    doc.setDrawColor(240, 236, 225);
    doc.setLineWidth(0.5);
    doc.line(20, 32, 190, 32);

    // Datos del Paciente
    doc.setFontSize(14);
    doc.setTextColor(45, 51, 57);
    doc.text("Datos del Paciente", 20, 42);
    doc.setFontSize(10);
    doc.setTextColor(133, 145, 160);
    doc.text(`Nombre: ${paciente.nombre} (${paciente.especie})`, 20, 50);
    doc.text(`Dueño: ${paciente.dueno}`, 20, 56);
    doc.text(`Fecha: ${citaDetalle.fecha.split('-').reverse().join('/')}`, 140, 50);
    
    // Procedimiento/Diagnóstico
    let startY = 70;
    if (citaDetalle.diagnostico) {
      doc.setFontSize(12);
      doc.setTextColor(45, 51, 57);
      doc.text("Procedimiento Realizado:", 20, startY);
      doc.setFontSize(10);
      doc.setTextColor(89, 88, 122);
      const splitDiag = doc.splitTextToSize(citaDetalle.diagnostico, 170);
      doc.text(splitDiag, 20, startY + 6);
      startY += splitDiag.length * 5 + 12;
    }

    // Tratamiento/Receta
    if (citaDetalle.tratamiento) {
      doc.setFontSize(12);
      doc.setTextColor(16, 185, 129); // Verde Emerald
      doc.text("Tratamiento / Receta Médica:", 20, startY);
      doc.setFontSize(10);
      doc.setTextColor(45, 51, 57);
      const splitTrat = doc.splitTextToSize(citaDetalle.tratamiento, 170);
      doc.text(splitTrat, 20, startY + 6);
      startY += splitTrat.length * 5 + 12;
    }

    // Pie de página
    doc.setFontSize(9);
    doc.setTextColor(160);
    doc.text("Documento generado electrónicamente. Válido con firma y sello del médico veterinario.", 20, 280);

    doc.save(`Receta_${paciente.nombre}_${citaDetalle.fecha}.pdf`);
  };

  if (!paciente) return null;

  return (
    <>
    <ModalBase open={!!paciente} onClose={onClose} maxWidth="max-w-5xl" shadowColor="rgba(242,140,115,0.1)" borderColor="border-[#f0ece1]" blobColor="bg-[var(--color-primary-light)]">
      {/* Cabecera */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 relative z-10">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-[1.5rem] bg-[var(--color-primary-light)] flex items-center justify-center text-[var(--color-primary)] shadow-sm border border-white">
            <Activity className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-[#2D3339] font-medium text-2xl">Historia Clínica</h3>
            <p className="text-[14px] text-[#A0AAB2] font-normal mt-0.5">{paciente.nombre} ({paciente.especie}) • Dueño: {paciente.dueno}</p>
          </div>
        </div>
        <div className="bg-[#FAF9F6] px-5 py-3 rounded-2xl border border-[#f0ece1] shadow-sm flex items-center gap-4">
          <div className="text-center group pr-4 border-r border-[#f0ece1]">
            <p className="text-[10px] text-[#A0AAB2] uppercase font-bold tracking-widest mb-0.5">N° Historia</p>
            <p className="text-[#2D3339] font-medium text-sm">{paciente.numero_historial}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-[#A0AAB2] uppercase font-bold tracking-widest mb-0.5">Consultas</p>
            <p className="text-[#2D3339] font-medium text-sm">{citas.length}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-slate-50/50 p-1.5 rounded-2xl border border-[#f0ece1] relative z-10 w-fit">
        <button onClick={() => setActiveTab('timeline')} className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'timeline' ? 'bg-white text-[var(--color-primary)] shadow-sm border border-[#f0ece1]' : 'text-[#8591A0] hover:text-[#2D3339]'}`}>
          <Clock className="w-4 h-4" /> Línea de Tiempo
        </button>
        <button onClick={() => setActiveTab('vacunas')} className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'vacunas' ? 'bg-white text-teal-600 shadow-sm border border-[#f0ece1]' : 'text-[#8591A0] hover:text-[#2D3339]'}`}>
          <Syringe className="w-4 h-4" /> Vacunas & Desparasitación
        </button>
        <button onClick={() => setActiveTab('archivos')} className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'archivos' ? 'bg-white text-blue-600 shadow-sm border border-[#f0ece1]' : 'text-[#8591A0] hover:text-[#2D3339]'}`}>
          <FileText className="w-4 h-4" /> Archivos Adjuntos
        </button>
      </div>

      {/* Contenido */}
      <div className="relative z-10 min-h-[400px] max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
        {cargando ? (
          <div className="flex flex-col items-center justify-center h-40 text-[var(--color-primary)] gap-3">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p className="text-xs font-medium tracking-wide">Cargando expediente...</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            
            {/* TAB: TIMELINE */}
            {activeTab === 'timeline' && (
              <motion.div key="timeline" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6 pl-4 border-l-2 border-[#f0ece1] ml-4 py-2">
                {timelineItems.length === 0 ? (
                  <div className="text-center p-10 -ml-4">
                    <p className="text-[#A0AAB2] italic text-sm font-medium">No hay registros clínicos previos.</p>
                  </div>
                ) : (
                  timelineItems.map((item, idx) => (
                    <div key={`${item.source}-${item.id}-${idx}`} className="relative">
                      {/* Nodo del timeline */}
                      <div className={`absolute -left-[27px] w-5 h-5 rounded-full border-2 border-white shadow-sm flex items-center justify-center ${item.source === 'vacuna' ? 'bg-teal-400' : item.source === 'cita' ? 'bg-[var(--color-primary)]' : 'bg-blue-400'}`}>
                        <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                      </div>
                      
                      <div 
                        className={`bg-white border border-[#f0ece1] rounded-2xl p-5 shadow-sm transition-shadow ${item.source === 'cita' ? 'hover:border-[var(--color-primary)] cursor-pointer hover:shadow-md' : 'hover:border-[var(--color-primary-light)]'}`}
                        onClick={() => {
                           if (item.source === 'cita') {
                              const citaEncontrada = citas.find(c => c.id === item.id);
                              if (citaEncontrada) setCitaDetalle(citaEncontrada);
                           }
                        }}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="text-[#2D3339] font-medium text-[15px]">{item.titulo}</h4>
                          <span className="text-xs font-medium text-[#A0AAB2] bg-[#FAF9F6] px-2 py-1 rounded-md">{new Date(item.fecha).toLocaleDateString()}</span>
                        </div>
                        {item.descripcion && <p className="text-[#8591A0] text-sm leading-relaxed">{item.descripcion}</p>}
                        
                        {item.source === 'cita' && (
                           <div className="mt-3">
                              <span className="text-xs text-[var(--color-primary)] font-medium flex items-center gap-1">Ver detalles de la consulta <ChevronRight className="w-3 h-3" /></span>
                           </div>
                        )}
                        
                        {'archivos' in item && item.archivos && item.archivos.length > 0 && (
                          <div className="mt-4 flex flex-wrap gap-2 pt-3 border-t border-[#f0ece1]">
                            {item.archivos.map((archivo, aIdx) => (
                              <a key={aIdx} href={archivo.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs font-medium text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">
                                <File className="w-3.5 h-3.5" /> {archivo.nombre}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </motion.div>
            )}

            {/* TAB: VACUNAS */}
            {activeTab === 'vacunas' && (
              <motion.div key="vacunas" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                <div className="flex justify-between items-center bg-teal-50/50 p-4 rounded-2xl border border-teal-100/50">
                  <div className="flex items-center gap-3 text-teal-700">
                    <Syringe className="w-5 h-5" />
                    <div>
                      <h4 className="font-medium text-sm">Calendario de Prevención</h4>
                      <p className="text-xs text-teal-600/70">Control de vacunas y desparasitaciones</p>
                    </div>
                  </div>
                  <button onClick={() => setMostrarFormVacuna(!mostrarFormVacuna)} className="bg-teal-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-teal-600 transition-colors flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Registrar
                  </button>
                </div>

                <AnimatePresence>
                  {mostrarFormVacuna && (
                    <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} onSubmit={guardarVacuna} className="bg-white p-5 rounded-2xl border border-[#f0ece1] shadow-sm mb-6 overflow-hidden">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="text-xs font-medium text-[#8591A0] mb-1.5 block">Tipo</label>
                          <select value={nuevaVacuna.tipo} onChange={e => setNuevaVacuna({...nuevaVacuna, tipo: e.target.value})} className="w-full h-10 bg-slate-50 border border-[#f0ece1] rounded-lg px-3 text-sm focus:border-teal-400 focus:outline-none">
                            <option>Vacuna</option>
                            <option>Desparasitación Interna</option>
                            <option>Desparasitación Externa</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-[#8591A0] mb-1.5 block">Nombre del Producto</label>
                          <input type="text" required value={nuevaVacuna.nombre} onChange={e => setNuevaVacuna({...nuevaVacuna, nombre: e.target.value})} className="w-full h-10 bg-slate-50 border border-[#f0ece1] rounded-lg px-3 text-sm focus:border-teal-400 focus:outline-none" placeholder="Ej: Séxtuple, NexGard..." />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-[#8591A0] mb-1.5 block">Fecha de Aplicación</label>
                          <input type="date" required value={nuevaVacuna.fecha_aplicacion} onChange={e => setNuevaVacuna({...nuevaVacuna, fecha_aplicacion: e.target.value})} className="w-full h-10 bg-slate-50 border border-[#f0ece1] rounded-lg px-3 text-sm focus:border-teal-400 focus:outline-none" />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-[#8591A0] mb-1.5 block">Próxima Dosis (Alerta)</label>
                          <input type="date" value={nuevaVacuna.proxima_dosis} onChange={e => setNuevaVacuna({...nuevaVacuna, proxima_dosis: e.target.value})} className="w-full h-10 bg-slate-50 border border-[#f0ece1] rounded-lg px-3 text-sm focus:border-teal-400 focus:outline-none" />
                        </div>
                        <div className="md:col-span-2">
                          <label className="text-xs font-medium text-[#8591A0] mb-1.5 block">Notas adicionales</label>
                          <input type="text" value={nuevaVacuna.notas} onChange={e => setNuevaVacuna({...nuevaVacuna, notas: e.target.value})} className="w-full h-10 bg-slate-50 border border-[#f0ece1] rounded-lg px-3 text-sm focus:border-teal-400 focus:outline-none" placeholder="Lote, peso del paciente, etc." />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setMostrarFormVacuna(false)} className="px-4 py-2 text-sm font-medium text-[#8591A0] hover:bg-slate-50 rounded-lg">Cancelar</button>
                        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-teal-500 hover:bg-teal-600 rounded-lg shadow-sm">Guardar Registro</button>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {vacunas.length === 0 ? (
                    <div className="col-span-2 text-center p-8 bg-slate-50 rounded-2xl border border-dashed border-[#f0ece1]">
                      <p className="text-[#A0AAB2] text-sm font-medium">No hay vacunas ni desparasitaciones registradas.</p>
                    </div>
                  ) : (
                    vacunas.map(v => {
                      const proxima = v.proxima_dosis ? new Date(v.proxima_dosis) : null;
                      const hoy = new Date();
                      const vencida = proxima && proxima < hoy;
                      
                      return (
                        <div key={v.id} className="bg-white border border-[#f0ece1] p-4 rounded-2xl shadow-sm flex flex-col relative group">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <span className="text-[10px] uppercase font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md tracking-wider">{v.tipo}</span>
                              <h4 className="font-medium text-[#2D3339] text-[15px] mt-1.5">{v.nombre}</h4>
                            </div>
                            <button onClick={() => eliminarVacuna(v.id)} className="text-[#A0AAB2] hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          
                          <div className="mt-auto space-y-1.5 bg-[#FAF9F6] p-3 rounded-xl border border-[#f0ece1]/50">
                            <p className="text-xs text-[#8591A0] flex justify-between">
                              <span>Aplicada:</span> <span className="font-medium text-[#2D3339]">{new Date(v.fecha_aplicacion).toLocaleDateString()}</span>
                            </p>
                            {proxima && (
                              <p className={`text-xs flex justify-between ${vencida ? 'text-rose-500 font-medium' : 'text-[#8591A0]'}`}>
                                <span>Próxima Dosis:</span> <span className={vencida ? 'font-bold' : 'font-medium text-[#2D3339]'}>{proxima.toLocaleDateString()} {vencida && '(!)'}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </motion.div>
            )}

            {/* TAB: ARCHIVOS */}
            {activeTab === 'archivos' && (
              <motion.div key="archivos" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                <div className="border-2 border-dashed border-[#f0ece1] rounded-2xl p-8 text-center bg-[#FAF9F6] relative group hover:border-[var(--color-primary-light)] transition-colors">
                  <input type="file" onChange={handleSubirArchivo} disabled={subiendoArchivo} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" />
                  {subiendoArchivo ? (
                    <div className="flex flex-col items-center text-[var(--color-primary)]">
                      <Loader2 className="w-8 h-8 animate-spin mb-2" />
                      <span className="text-sm font-medium">Subiendo archivo...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-[#A0AAB2] group-hover:text-[var(--color-primary)] transition-colors">
                      <Download className="w-8 h-8 mb-2" />
                      <p className="text-sm font-medium text-[#2D3339]">Haz clic o arrastra archivos aquí</p>
                      <p className="text-xs mt-1">PDFs, Imágenes de Radiografías, Resultados (Max 10MB)</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {archivosAll.length === 0 ? (
                    <div className="col-span-full text-center py-6">
                       <p className="text-[#A0AAB2] text-sm font-medium">No hay archivos adjuntos en el historial.</p>
                    </div>
                  ) : (
                    archivosAll.map((archivo, idx) => (
                      <a key={idx} href={archivo.url} target="_blank" rel="noopener noreferrer" className="bg-white border border-[#f0ece1] p-4 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-100 transition-all flex flex-col items-center text-center group">
                        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500 mb-3 group-hover:scale-110 transition-transform">
                          <FileText className="w-6 h-6" />
                        </div>
                        <p className="text-xs font-medium text-[#2D3339] line-clamp-2 break-words w-full" title={archivo.nombre}>{archivo.nombre}</p>
                      </a>
                    ))
                  )}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        )}
      </div>
    </ModalBase>

    {/* MODAL DETALLE DE CITA (Vista Completa) */}
    <ModalBase 
       open={!!citaDetalle} 
       onClose={() => setCitaDetalle(null)}
       maxWidth="max-w-2xl"
    >
       {citaDetalle && (
          <div className="space-y-5 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar pb-6">
             <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 bg-slate-50/50 p-5 rounded-3xl border border-slate-100/60">
                <div className="flex items-center gap-4">
                   <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 ${citaDetalle.estado === 'Completada' ? 'bg-teal-50 border-white text-teal-500 shadow-sm' : 'bg-slate-100 border-white text-slate-400'}`}>
                      {citaDetalle.estado === 'Completada' ? <CheckCircle2 className="w-7 h-7"/> : <Clock className="w-7 h-7"/>}
                   </div>
                   <div>
                      <h4 className="text-[#3b3a62] font-bold text-lg flex items-center gap-2 uppercase tracking-wide">
                         {citaDetalle.tipo}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                         <p className="text-[#a0a0b2] text-[13px] font-medium flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {citaDetalle.fecha.split('-').reverse().join('/')} • {citaDetalle.hora}</p>
                         <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${citaDetalle.estado === 'Completada' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>{citaDetalle.estado}</span>
                      </div>
                   </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                   <button
                      onClick={generarRecetaPDF}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-medium text-sm hover:bg-blue-100 transition-colors shadow-sm whitespace-nowrap"
                      title="Descargar Receta en PDF"
                   >
                      <Download className="w-4 h-4" />
                      PDF
                   </button>
                   
                   <button
                      onClick={compartirWhatsApp}
                      className="flex items-center gap-2 px-4 py-2 bg-[#25D366]/10 text-[#25D366] rounded-xl font-medium text-sm hover:bg-[#25D366]/20 transition-colors shadow-sm whitespace-nowrap"
                      title="Compartir por WhatsApp"
                   >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                         <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.662-2.06-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                      </svg>
                      Enviar
                   </button>
                </div>
             </div>

             <div className="p-6 bg-teal-50/40 border border-teal-100/60 rounded-[24px]">
                <p className="text-[11px] text-teal-600 font-bold uppercase tracking-widest mb-3 flex items-center gap-2"><Stethoscope className="w-4 h-4"/> Procedimiento Realizado</p>
                <p className="text-[#414066] text-[15px] leading-relaxed font-light italic whitespace-pre-line">{citaDetalle.diagnostico || 'Sin información detallada del procedimiento.'}</p>
             </div>

             <div className="p-6 bg-emerald-50/40 border border-emerald-100/60 rounded-[24px]">
                <p className="text-[11px] text-emerald-600 font-bold uppercase tracking-widest mb-3 flex items-center gap-2"><FileText className="w-4 h-4"/> Tratamiento / Receta</p>
                <p className="text-[#414066] text-[15px] leading-relaxed font-light whitespace-pre-line">{citaDetalle.tratamiento || 'No se prescribió ningún tratamiento.'}</p>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 bg-[#fff8f3]/60 border border-orange-100/60 rounded-[24px]">
                   <p className="text-[11px] text-orange-500 font-bold uppercase tracking-widest mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4"/> Observaciones</p>
                   <p className="text-[#59587a] text-[14px] leading-relaxed font-light whitespace-pre-line">{citaDetalle.observaciones || 'No se registraron observaciones adicionales para este procedimiento.'}</p>
                </div>
                <div className="p-6 bg-blue-50/40 border border-blue-100/60 rounded-[24px]">
                   <p className="text-[11px] text-blue-500 font-bold uppercase tracking-widest mb-3 flex items-center gap-2"><Info className="w-4 h-4"/> Recomendaciones</p>
                   <p className="text-[#59587a] text-[14px] leading-relaxed font-light whitespace-pre-line">{citaDetalle.recomendaciones || 'El paciente no requiere recomendaciones específicas por el momento.'}</p>
                </div>
             </div>
          </div>
       )}
    </ModalBase>
    </>
  );
}
