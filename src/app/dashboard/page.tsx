"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Calendar, User, Clock, CheckCircle2, Plus, Check, Pencil, Trash2, Star, Loader2 } from "lucide-react";
import { useState, useMemo } from "react";
import useSWR, { mutate } from "swr";
import { fetcher } from "@/lib/fetchers";
import { insforge } from "@/lib/insforge";
import StatCard from "@/components/StatCard";
import Skeleton from "@/components/Skeleton";
import EmptyState from "@/components/EmptyState";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { Cita, Recordatorio, AppointmentItemProps } from "@/types";

const HOY = new Date().toISOString().split('T')[0];
const CITAS_KEY = `citas:{"eq":["fecha","${HOY}"],"order":["hora",{"ascending":true}]}`;
const PACIENTES_KEY = 'pacientes:{"select":"id","count":"exact"}';
const RECORDATORIOS_KEY = 'recordatorios:{"order":["id",{"ascending":false}]}';
const CONSULTAS_COMPLETADAS_KEY = 'citas:{"eq":["estado","Completada"],"select":"id","count":"exact"}';

// Datos de ejemplo para el gráfico de analíticas
const dataGrafico = [
  { name: "Lun", citas: 4, ingresos: 400 },
  { name: "Mar", citas: 3, ingresos: 300 },
  { name: "Mié", citas: 5, ingresos: 500 },
  { name: "Jue", citas: 2, ingresos: 200 },
  { name: "Vie", citas: 6, ingresos: 600 },
  { name: "Sáb", citas: 7, ingresos: 700 },
  { name: "Dom", citas: 1, ingresos: 100 },
];

export default function Dashboard() {
  const { data: citasData, isLoading: citasLoading } = useSWR(CITAS_KEY, fetcher);
  const { data: pacientesData, isLoading: pacientesLoading } = useSWR(PACIENTES_KEY, fetcher);
  const { data: recordatoriosData, isLoading: recordatoriosLoading } = useSWR(RECORDATORIOS_KEY, fetcher);
  const { data: consultasData, isLoading: consultasLoading } = useSWR(CONSULTAS_COMPLETADAS_KEY, fetcher);

  const citas = (citasData || []) as Cita[];
  const recordatorios = (recordatoriosData || []) as Recordatorio[];
  
  const stats = useMemo(() => ({
    pacientes: pacientesData?.length || 0,
    consultas: consultasData?.length || 0
  }), [pacientesData, consultasData]);

  const cargando = citasLoading || pacientesLoading || recordatoriosLoading || consultasLoading;

  const [nuevoTexto, setNuevoTexto] = useState("");
  const [creando, setCreando] = useState(false);
  const [mostrandoInput, setMostrandoInput] = useState(false);
  
  const [editandoRecordatorioId, setEditandoRecordatorioId] = useState<string | null>(null);
  const [textoEditado, setTextoEditado] = useState("");

  const agregarRecordatorio = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!nuevoTexto.trim()) return;
    setCreando(true);
    const nuevo = { texto: nuevoTexto.trim(), completado: false };
    const { error } = await insforge.database.from("recordatorios").insert([nuevo]);
    if(!error) {
       mutate(RECORDATORIOS_KEY);
       setNuevoTexto("");
       setMostrandoInput(false);
    }
    setCreando(false);
  };

  const completarRecordatorio = async (id: string, actual: boolean) => {
    await insforge.database.from("recordatorios").update({ completado: !actual }).eq("id", id);
    mutate(RECORDATORIOS_KEY);
  };

  const iniciarEdicionRecordatorio = (r: Recordatorio) => {
    setEditandoRecordatorioId(r.id);
    setTextoEditado(r.texto);
  };

  const guardarEdicionRecordatorio = async (e: React.FormEvent | React.FocusEvent, id: string) => {
    if(e && 'preventDefault' in e) e.preventDefault();
    if(!textoEditado.trim()) { setEditandoRecordatorioId(null); return; }
    setEditandoRecordatorioId(null);
    await insforge.database.from("recordatorios").update({ texto: textoEditado.trim() }).eq("id", id);
    mutate(RECORDATORIOS_KEY);
  };

  const eliminarRecordatorio = async (id: string) => {
    await insforge.database.from("recordatorios").delete().eq("id", id);
    mutate(RECORDATORIOS_KEY);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="max-w-[1400px] mx-auto space-y-8"
    >
      {/* Tarjetas Superiores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard icon={<User strokeWidth={1.5} />} title="Pacientes" value={cargando ? "-" : stats.pacientes.toString()} trend="Total registrados" color="green" />
        <StatCard icon={<Calendar strokeWidth={1.5} />} title="Citas Hoy" value={cargando ? "-" : citas.length.toString()} trend="Pendientes de atención" color="orange" />
        <StatCard icon={<CheckCircle2 strokeWidth={1.5} />} title="Consultas" value={cargando ? "-" : stats.consultas.toString()} trend="Finalizadas" color="teal" />
      </div>

      {/* Gráfico Analítico (Nuevo) */}
      <div className="bg-white rounded-[1.5rem] p-6 md:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-[#f0ece1]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-[#2D3339] font-medium text-lg tracking-tight">Actividad Semanal</h3>
            <p className="text-[#A0AAB2] text-sm mt-1">Tendencia de citas atendidas en los últimos 7 días</p>
          </div>
        </div>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dataGrafico} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCitas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#A0AAB2', fontSize: 12}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#A0AAB2', fontSize: 12}} />
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0ece1" />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                itemStyle={{ color: '#2D3339', fontWeight: 500 }}
              />
              <Area type="monotone" dataKey="citas" stroke="var(--color-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorCitas)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Sección Inferior dividida en Columnas */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Próximas Citas */}
        <div className="xl:col-span-2 bg-white rounded-[1.5rem] p-6 md:p-8 border border-[#f0ece1] shadow-[0_4px_24px_rgba(0,0,0,0.02)] relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center mb-6 relative z-10 gap-4">
            <h3 className="text-[#2D3339] font-medium text-lg tracking-tight flex items-center gap-2">
              Agenda de Hoy
              {cargando && <Loader2 className="w-4 h-4 animate-spin text-[var(--color-primary)] ml-2" />}
            </h3>
            <button className="text-[var(--color-primary)] text-sm font-medium hover:bg-[var(--color-primary-light)] px-4 py-2 rounded-lg transition-colors">
              Ver calendario completo
            </button>
          </div>
          
          <div className="space-y-3 relative z-10 min-h-[150px]">
            {cargando ? (
              <div className="space-y-3">
                <Skeleton className="h-[72px] w-full rounded-xl" />
                <Skeleton className="h-[72px] w-full rounded-xl" />
              </div>
            ) : citas.length === 0 ? (
              <EmptyState 
                title="Agenda despejada" 
                description="No hay más pacientes programados para hoy. ¡Buen trabajo!" 
                className="py-10 border-none bg-[#FAF9F6] rounded-xl"
              />
            ) : (
              citas.map((cita) => (
                <AppointmentItem 
                  key={cita.id}
                  pet={cita.mascota} 
                  owner={cita.dueno} 
                  time={cita.hora} 
                  type={cita.tipo} 
                  estado={cita.estado}
                />
              ))
            )}
          </div>
        </div>

        {/* Notificaciones / Recordatorios */}
        <div className="bg-[#FAF9F6] border border-[#f0ece1] rounded-[1.5rem] p-6 md:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)] relative overflow-hidden flex flex-col h-[400px]">
          <div className="flex items-center justify-between mb-6 relative z-10">
            <div className="flex items-center gap-2 text-[#2D3339]">
              <Star className="w-5 h-5 text-[var(--color-primary)]" fill="currentColor" strokeWidth={1} />
              <h3 className="font-medium text-lg tracking-tight">Tareas Pendientes</h3>
            </div>
            <button onClick={() => setMostrandoInput(!mostrandoInput)} className="w-8 h-8 rounded-full bg-white border border-[#f0ece1] flex items-center justify-center hover:bg-slate-50 transition-colors shadow-sm text-[#2D3339]">
              <Plus className={`w-4 h-4 transition-transform ${mostrandoInput ? 'rotate-45' : ''}`} />
            </button>
          </div>

          <div className="space-y-3 relative z-10 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <AnimatePresence>
              {mostrandoInput && (
                <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} onSubmit={agregarRecordatorio} className="mb-4 overflow-hidden">
                   <div className="flex gap-2 p-1">
                     <input type="text" autoFocus value={nuevoTexto} onChange={(e) => setNuevoTexto(e.target.value)} placeholder="Nueva tarea..." className="flex-1 bg-white rounded-xl p-3 border border-[#f0ece1] text-[#2D3339] placeholder:text-[#A0AAB2] focus:outline-none focus:border-[var(--color-primary)] text-sm shadow-sm transition-colors w-full" />
                     <button type="submit" disabled={creando} className="bg-[var(--color-primary)] text-white px-4 rounded-xl text-sm font-medium hover:bg-[#e87a60] transition-colors shrink-0 shadow-sm">{creando ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Guardar'}</button>
                   </div>
                </motion.form>
              )}
            </AnimatePresence>
          
            {cargando ? (
               <div className="flex justify-center items-center h-20 text-[#A0AAB2]"><Loader2 className="w-5 h-5 animate-spin" /></div>
            ) : recordatorios.length === 0 ? (
               <p className="text-[#A0AAB2] text-sm text-center mt-10 font-medium">No hay tareas pendientes.</p>
            ) : (
               <AnimatePresence>
                  {recordatorios.map(r => (
                     <motion.div layout key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className={`relative bg-white rounded-xl p-4 border border-[#f0ece1] transition-all flex items-start gap-3 group overflow-hidden shadow-sm ${r.completado ? 'opacity-60 bg-slate-50' : 'hover:border-[var(--color-primary-light)] hover:shadow-md'}`}>
                       <button onClick={() => completarRecordatorio(r.id, r.completado)} className={`w-5 h-5 rounded-full mt-0.5 border flex items-center justify-center shrink-0 transition-colors z-10 ${r.completado ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white' : 'border-[#d0d5dc] hover:border-[var(--color-primary)] bg-white text-transparent'}`}>
                          <Check className="w-3 h-3" strokeWidth={3} />
                       </button>
                       {editandoRecordatorioId === r.id ? (
                          <form onSubmit={(e) => guardarEdicionRecordatorio(e, r.id)} className="flex-1 -mt-1.5 -ml-1 z-10 relative">
                             <input type="text" autoFocus value={textoEditado} onChange={(e) => setTextoEditado(e.target.value)} onBlur={(e) => guardarEdicionRecordatorio(e, r.id)} className="w-full bg-slate-50 rounded-lg p-2 border border-[var(--color-primary)] text-[#2D3339] focus:outline-none text-sm" />
                          </form>
                       ) : (
                          <p className={`text-sm text-[#2D3339] leading-relaxed flex-1 pr-12 ${r.completado ? 'line-through text-[#A0AAB2]' : ''}`}>{r.texto}</p>
                       )}
                       
                       {!r.completado && editandoRecordatorioId !== r.id && (
                          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 z-20">
                             <button onClick={() => iniciarEdicionRecordatorio(r)} className="w-7 h-7 rounded-md flex items-center justify-center bg-slate-50 text-[#8591A0] hover:bg-[var(--color-primary-light)] hover:text-[var(--color-primary)] transition-colors" title="Editar">
                                <Pencil className="w-3 h-3" />
                             </button>
                             <button onClick={() => eliminarRecordatorio(r.id)} className="w-7 h-7 rounded-md flex items-center justify-center bg-slate-50 text-[#8591A0] hover:bg-red-50 hover:text-red-500 transition-colors" title="Eliminar">
                                <Trash2 className="w-3 h-3" />
                             </button>
                          </div>
                       )}
                     </motion.div>
                  ))}
               </AnimatePresence>
            )}
          </div>
        </div>

      </div>
    </motion.div>
  );
}

function AppointmentItem({ pet, owner, time, type, estado }: AppointmentItemProps) {
  const isCompleted = estado === 'Completada';
  const isCancelled = estado === 'Cancelada';

  return (
    <div className={`flex items-center justify-between p-4 rounded-xl transition-all border group ${isCompleted ? 'bg-emerald-50/50 border-emerald-100 opacity-80' : isCancelled ? 'bg-slate-50 border-slate-200 opacity-60 grayscale-[20%]' : 'bg-white border-[#f0ece1] hover:border-[var(--color-primary-light)] hover:shadow-sm'}`}>
      <div className="flex items-center gap-4">
        <div className={`w-11 h-11 rounded-full border flex items-center justify-center font-medium text-lg ${isCompleted ? 'bg-emerald-100 border-emerald-200 text-emerald-600' : isCancelled ? 'bg-slate-200 border-slate-300 text-slate-500' : 'bg-[var(--color-primary-light)] border-white text-[var(--color-primary)] shadow-sm'}`}>
          {pet ? pet[0].toUpperCase() : '?'}
        </div>
        <div>
          <h5 className={`font-medium text-[15px] flex items-center gap-2 ${isCancelled ? 'line-through text-[#A0AAB2]' : 'text-[#2D3339]'}`}>
            {pet} <span className="text-[#A0AAB2] font-normal text-sm ml-1">({owner})</span>
          </h5>
          <p className="text-[13px] text-[#8591A0] mt-0.5 font-normal">{type}</p>
        </div>
      </div>
      <div className={`text-sm font-medium px-3 py-1.5 rounded-lg ${isCompleted ? 'text-emerald-600 bg-emerald-100/50' : isCancelled ? 'text-slate-500 bg-slate-100' : 'text-[#2D3339] bg-slate-50 group-hover:bg-[var(--color-primary)] group-hover:text-white transition-colors border border-slate-200 group-hover:border-[var(--color-primary)]'}`}>
        {time}
      </div>
    </div>
  );
}
