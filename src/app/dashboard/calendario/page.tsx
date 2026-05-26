"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar as CalendarIcon, Clock, Plus, Loader2, User, Stethoscope, ChevronLeft, ChevronRight, X, AlertTriangle, FileText, CheckCircle2, Phone, Home, Pencil } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import type { Cita } from "@/types";
import ModalBase from "@/components/ModalBase";
import PetAutocomplete from "@/components/PetAutocomplete";
import TimePickerInput from "@/components/TimePickerInput";

export default function CalendarioPage() {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [cargando, setCargando] = useState(true);

  const [fechaActual, setFechaActual] = useState(new Date());

  // Modal Agendamiento
  const [mostrarModalForm, setMostrarModalForm] = useState(false);
  const [fechaSeleccionada, setFechaSeleccionada] = useState("");
  const [mascota, setMascota] = useState("");
  const [dueno, setDueno] = useState("");
  const [tipo, setTipo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [notas, setNotas] = useState("");
  const [horaSeleccionada, setHoraSeleccionada] = useState("10");
  const [minutoSeleccionado, setMinutoSeleccionado] = useState("00");
  const [amPm, setAmPm] = useState("AM");
  const [enviando, setEnviando] = useState(false);

  // Modal Detalle Cita
  const [citaSeleccionada, setCitaSeleccionada] = useState<Cita | null>(null);

  const prevMonth = () => setFechaActual(new Date(fechaActual.getFullYear(), fechaActual.getMonth() - 1, 1));
  const nextMonth = () => setFechaActual(new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 1));
  
  useEffect(() => {
    async function cargarCitas() {
      setCargando(true);
      const firstDay = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1);
      const lastDay = new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 0);
      
      const startDate = firstDay.toISOString().split('T')[0];
      const endDate = lastDay.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from("citas")
        .select('*')
        .gte('fecha', startDate)
        .lte('fecha', endDate)
        .order('hora', { ascending: true });
        
      if (!error && data) setCitas(data as Cita[]);
      setCargando(false);
    }
    cargarCitas();
  }, [fechaActual]); 

  const mesActualStr = fechaActual.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
  const daysInMonth = new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 0).getDate();
  const startDay = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1).getDay();

  const agendarCitaDesdeCalendario = (dia: number) => {
    const jsDate = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), dia);
    const isoDate = new Date(jsDate.getTime() - jsDate.getTimezoneOffset() * 60000).toISOString().split('T')[0];
    setFechaSeleccionada(isoDate);
    setMascota(""); setDueno(""); setTelefono(""); setDireccion(""); setTipo(""); setNotas("");
    setMostrarModalForm(true);
  };

  const guardarCita = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);

    // Abrimos la pestaña inmediatamente en el evento síncrono del click para evitar que iOS la bloquee
    const waWindow = window.open("", "_blank");

    const stringHora = `${horaSeleccionada}:${minutoSeleccionado} ${amPm}`;
    const datosCita = { mascota, dueno, telefono, direccion, fecha: fechaSeleccionada, hora: stringHora, tipo, notas, estado: 'Pendiente', activa: true };
    
    try {
      const { error } = await supabase.from("citas").insert([datosCita]);
      if (error) {
        toast.error("Error al agendar");
        if (waWindow) waWindow.close();
      } else {
        toast.success("Cita agendada correctamente");
        
        // WhatsApp Redirect
        const mensaje = `*¡Hola! Dra. Exotic le saluda!* 🐾✨%0A%0AConfirmamos la cita para *${mascota}*:%0A📅 *Fecha:* ${fechaSeleccionada.split('-').reverse().join('/')}%0A⏰ *Hora:* ${stringHora}%0A🏥 *Motivo:* ${tipo}%0A📍 *Dirección:* ${direccion}%0A%0A¡Le esperamos con mucho cariño! 🐾🦎`;
        const waUrl = `https://wa.me/${telefono.replace(/\D/g, '')}?text=${mensaje}`;
        
        if (waWindow) {
          waWindow.location.href = waUrl;
        } else {
          window.open(waUrl, '_blank');
        }
        
        setMostrarModalForm(false);
        const { data } = await supabase.from("citas").select('*').order('hora', { ascending: true });
        if (data) setCitas(data as Cita[]);
      }
    } catch (e) {
      toast.error("Error de conexión");
      if (waWindow) waWindow.close();
    } finally {
      setEnviando(false);
    }
  };

  const verDetalle = (e: React.MouseEvent, cita: Cita) => {
    e.stopPropagation();
    setCitaSeleccionada(cita);
  };

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="max-w-[1400px] mx-auto space-y-8 relative z-10 pb-20">
         <div className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-6 mb-8">
            <div>
              <h2 className="text-[#3b3a62] font-light text-2xl md:text-3xl tracking-wide flex items-center gap-3">Calendario Interactivo {cargando && <Loader2 className="w-5 h-5 animate-spin text-[#fc855f]"/>}</h2>
              <p className="text-[#a0a0b2] font-light mt-2 text-[14px] md:text-[15px]">Visualiza tus turnos en un formato mensual ampliado.</p>
            </div>
            <div className="flex flex-wrap items-center justify-between w-full md:w-auto gap-4 bg-white p-2 md:rounded-full rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.015)] border border-slate-100">
               <button onClick={prevMonth} className="w-12 h-12 md:w-10 md:h-10 rounded-full flex items-center justify-center text-[#a0a0b2] bg-slate-50 hover:bg-[#fff4f1] hover:text-[#fc855f] transition-colors"><ChevronLeft className="w-5 h-5" /></button>
               <h3 className="font-medium text-[#3b3a62] text-[16px] md:text-base capitalize flex-1 md:w-40 text-center tracking-wide">{mesActualStr}</h3>
               <button onClick={nextMonth} className="w-12 h-12 md:w-10 md:h-10 rounded-full flex items-center justify-center text-[#a0a0b2] bg-slate-50 hover:bg-[#fff4f1] hover:text-[#fc855f] transition-colors"><ChevronRight className="w-5 h-5" /></button>
            </div>
         </div>

         <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_40px_rgba(0,0,0,0.02)] overflow-hidden">
            <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50">
               {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => (
                 <div key={d} className="py-2 md:py-4 text-center text-[10px] md:text-[12px] uppercase tracking-widest font-bold text-[#a0a0b2]">{d}</div>
               ))}
            </div>
            <div className="grid grid-cols-7 auto-rows-[100px] md:auto-rows-[160px]">
               {Array.from({ length: startDay }).map((_, i) => (
                 <div key={`empty-${i}`} className="border-b border-r border-slate-100/50 bg-slate-50/20"></div>
               ))}
               {Array.from({ length: daysInMonth }).map((_, i) => {
                 const dia = i + 1;
                 const jsDate = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), dia);
                 const isoDate = new Date(jsDate.getTime() - jsDate.getTimezoneOffset() * 60000).toISOString().split('T')[0];
                 const citasDelDia = citas.filter(c => c.fecha === isoDate);
                 const esHoy = new Date().toISOString().split('T')[0] === isoDate;
                 
                 return (
                   <div key={dia} onClick={() => agendarCitaDesdeCalendario(dia)} className="border-b border-r border-slate-100/50 p-1 md:p-3 relative group hover:bg-[#fff4f1]/30 cursor-pointer transition-colors overflow-hidden flex flex-col">
                      <span className={`text-[12px] md:text-sm font-medium w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center mb-1 md:mb-2 ${esHoy ? 'bg-[#fc855f] text-white shadow-md' : 'text-[#a0a0b2] group-hover:text-[#fc855f]'}`}>
                        {dia}
                      </span>
                      <div className="flex-1 overflow-y-auto hide-scrollbar space-y-1 md:space-y-1.5 pr-1 pb-1">
                        {citasDelDia.map(c => (
                          <div key={c.id} onClick={(e) => verDetalle(e, c)} className={`text-[8px] md:text-[11px] px-1 md:px-2 py-1 md:py-1.5 rounded-md md:rounded-lg font-medium truncate flex items-center gap-1 shadow-sm border hover:scale-[1.02] transition-transform
                            ${c.estado === 'Completada' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : c.estado === 'Cancelada' ? 'bg-rose-50 text-rose-500 border-rose-100 line-through opacity-70 hover:opacity-100' : 'bg-white border-orange-100 text-orange-600 hover:border-orange-300'}`}>
                             {c.estado === 'Pendiente' ? <div className="hidden md:block w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0"></div> : null}
                             <span className="truncate">{c.mascota}</span> <span className="font-light opacity-70 hidden md:inline shrink-0">{c.hora.split(' ')[0]}</span>
                          </div>
                        ))}
                      </div>
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block">
                        <Plus className="w-4 h-4 text-[#fc855f]" />
                      </div>
                   </div>
                 );
               })}
            </div>
         </div>
      </motion.div>

      {/* MODAL DETALLE CITA */}
      <AnimatePresence>
        {citaSeleccionada && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[400] bg-[#3b3a62]/30 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: "spring", stiffness: 300, damping: 25 }} className="bg-white/95 backdrop-blur-3xl rounded-[2.5rem] p-8 md:p-12 max-w-[450px] w-full shadow-[0_30px_100px_rgba(59,58,98,0.2)] border border-[#fcfcfd] text-left relative overflow-hidden">
              <button onClick={() => setCitaSeleccionada(null)} className="absolute top-6 right-6 w-10 h-10 rounded-full flex items-center justify-center bg-slate-50 hover:bg-rose-50 text-[#a0a0b2] hover:text-rose-500 transition-colors z-[350]"><X className="w-5 h-5"/></button>
              
              <div className="flex items-center gap-5 mb-8">
                 <div className={`w-16 h-16 rounded-full border flex items-center justify-center font-medium text-2xl
                    ${citaSeleccionada.estado === 'Completada' ? 'bg-emerald-100 text-emerald-500 border-emerald-200' :
                      citaSeleccionada.estado === 'Cancelada' ? 'bg-rose-100 text-rose-500 border-rose-200' : 'bg-[#fff4f1] border-[#ffe4dc] text-[#fc855f]'}`}>
                    {citaSeleccionada.estado === 'Completada' ? <CheckCircle2 className="w-8 h-8" strokeWidth={2}/> : citaSeleccionada.estado === 'Cancelada' ? <X className="w-8 h-8" strokeWidth={2}/> : (citaSeleccionada.mascota ? citaSeleccionada.mascota[0].toUpperCase() : '?')}
                 </div>
                 <div>
                    <h3 className={`text-2xl font-light tracking-wide ${citaSeleccionada.estado === 'Cancelada' ? 'line-through text-rose-400' : 'text-[#3b3a62]'}`}>{citaSeleccionada.mascota}</h3>
                    <p className="text-[14px] text-[#a0a0b2] font-light mt-0.5 uppercase tracking-widest">Dueño: {citaSeleccionada.dueno}</p>
                 </div>
              </div>

              <div className="space-y-5 border-t border-slate-100 pt-6">
                 <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-400"><Clock className="w-5 h-5"/></div>
                   <div><p className="text-[12px] text-[#a0a0b2] uppercase font-bold tracking-widest">Horario</p><p className="text-[#3b3a62] font-medium text-[15px]">{citaSeleccionada.fecha.split('-').reverse().join('/')} a las {citaSeleccionada.hora}</p></div>
                 </div>
                 <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-400"><Stethoscope className="w-5 h-5"/></div>
                   <div><p className="text-[12px] text-[#a0a0b2] uppercase font-bold tracking-widest">Motivo</p><p className="text-[#3b3a62] font-medium text-[15px]">{citaSeleccionada.tipo}</p></div>
                 </div>
                 {citaSeleccionada.notas && (
                    <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100 flex items-start gap-3 mt-4">
                      <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5"/>
                      <p className="text-amber-800 text-[14px] leading-relaxed font-light">{citaSeleccionada.notas}</p>
                    </div>
                 )}
                 <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex justify-between items-center mt-4">
                    <span className="text-[12px] text-[#a0a0b2] uppercase font-bold tracking-widest">Estado</span>
                    <span className={`px-4 py-1.5 rounded-full text-[12px] uppercase font-bold tracking-widest ${citaSeleccionada.estado === 'Pendiente' ? 'bg-orange-100 text-orange-500' : citaSeleccionada.estado === 'Completada' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                      {citaSeleccionada.estado}
                    </span>
                 </div>
              </div>

              <div className="mt-8">
                 <a href="/dashboard/citas" className="block w-full text-center py-4 rounded-2xl bg-[#fcfcfd] border border-slate-200 text-[#a0a0b2] font-medium hover:bg-slate-50 transition-colors">
                   Ir a modificar en Lista
                 </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL DE AGENDAMIENTO */}
      <ModalBase open={mostrarModalForm} onClose={() => setMostrarModalForm(false)}>
        <div className="flex items-center gap-4 mb-8 relative z-10 pr-12">
          <div className="w-14 h-14 rounded-[1.2rem] bg-[#f4f7f0] flex items-center justify-center shadow-sm">
            <CalendarIcon className="w-6 h-6 text-[#8DAA68]" />
          </div>
          <div>
            <h3 className="text-[#3b3a62] font-medium text-2xl">Agendar Cita</h3>
            <p className="text-[13px] text-[#a0a0b2] font-light mt-0.5">Reserva un espacio para el {fechaSeleccionada.split('-').reverse().join('/')}</p>
          </div>
        </div>
        <form onSubmit={guardarCita} className="space-y-6 relative z-10">
          <PetAutocomplete
            value={mascota}
            onChange={setMascota}
            onSelectPet={(nombre, duenoName, tel, dir) => { 
              setMascota(nombre); 
              setDueno(duenoName);
              setTelefono(tel);
              setDireccion(dir);
            }}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative group">
              <input type="text" value={dueno} onChange={(e) => setDueno(e.target.value)} className="w-full h-11 bg-transparent border-b border-[#eef2e8] focus:outline-none focus:border-[#8DAA68] text-[#8DAA68] pl-9 text-[15px]" placeholder="Nombre Dueño" />
              <User className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8DAA68]/50" />
            </div>
            <div className="relative group">
              <input type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} className="w-full h-11 bg-transparent border-b border-[#eef2e8] focus:outline-none focus:border-[#8DAA68] text-[#8DAA68] pl-9 text-[15px]" placeholder="Teléfono" />
              <Phone className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8DAA68]/50" />
            </div>
          </div>
          <div className="relative group">
            <input type="text" value={direccion} onChange={(e) => setDireccion(e.target.value)} className="w-full h-11 bg-transparent border-b border-[#eef2e8] focus:outline-none focus:border-[#8DAA68] text-[#8DAA68] pl-9 text-[15px]" placeholder="Dirección" />
            <Home className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8DAA68]/50" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] uppercase tracking-wider text-[#a0a0b2] font-semibold mb-2 block ml-1">Fecha (Bloqueada)</label>
              <input type="date" disabled value={fechaSeleccionada} className="w-full h-11 bg-slate-50 border-none rounded-xl px-4 text-[#8DAA68] text-sm opacity-60 cursor-not-allowed" />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-[#a0a0b2] font-semibold mb-2 block ml-1">Hora</label>
              <TimePickerInput hora={horaSeleccionada} minuto={minutoSeleccionado} amPm={amPm} onHoraChange={setHoraSeleccionada} onMinutoChange={setMinutoSeleccionado} onAmPmChange={setAmPm} />
            </div>
          </div>
          <div className="relative group mt-2">
            <input type="text" value={tipo} onChange={(e) => setTipo(e.target.value)} className="w-full h-11 bg-transparent border-b border-[#eef2e8] focus:outline-none focus:border-[#8DAA68] text-[#8DAA68] pl-9 text-[15px]" placeholder="Motivo de Consulta (Ej. Vacunación)" />
            <Stethoscope className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8DAA68]/50" />
          </div>
          <div className="relative group mt-6 bg-[#f4f7f0]/30 p-4 rounded-xl border border-[#eef2e8]/30">
            <label className="text-[11px] uppercase tracking-wider text-[#8DAA68] font-semibold mb-2 flex items-center gap-1.5"><FileText className="w-3.5 h-3.5"/> Condiciones / Notas</label>
            <textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={3} className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-[#3b3a62] placeholder:text-[#c4c4c4] font-light text-[14px] resize-none" placeholder="Observaciones previas..." />
          </div>
          <button type="submit" disabled={enviando} className="w-full rounded-2xl text-white font-medium text-[16px] h-14 transition-all mt-8 flex items-center justify-center gap-2 border border-white/20 bg-gradient-to-r from-[#8DAA68] to-[#6b844b] shadow-[0_8px_20px_rgba(141,170,104,0.3)] hover:shadow-[0_12px_25px_rgba(141,170,104,0.4)] active:scale-95 disabled:opacity-70">
            {enviando ? <Loader2 className="w-6 h-6 animate-spin" /> : "Guardar Turno y Ver en Calendario"}
          </button>
        </form>
      </ModalBase>
    </>
  );
}
