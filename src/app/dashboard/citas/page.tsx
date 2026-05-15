"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar as CalendarIcon, Clock, Plus, Loader2, User, Stethoscope, AlertTriangle, CheckCircle2, FileText, UploadCloud, X, Trash2, Pencil, Phone, Home } from "lucide-react";
import { insforge } from "@/lib/insforge";
import { toast } from "sonner";
import type { Cita, Paciente } from "@/types";
import ModalBase from "@/components/ModalBase";
import ConfirmDialog from "@/components/ConfirmDialog";
import Pagination from "@/components/Pagination";
import PetAutocomplete from "@/components/PetAutocomplete";
import TimePickerInput from "@/components/TimePickerInput";
import Skeleton from "@/components/Skeleton";
import EmptyState from "@/components/EmptyState";
import SearchInput from "@/components/SearchInput";
import { Inbox, CalendarX } from "lucide-react";
import useSWR, { mutate } from "swr";
import { fetcher } from "@/lib/fetchers";

const CITAS_ALL_KEY = 'citas:{"order":["fecha",{"ascending":false}]}' ;

export default function CitasPage() {
  const { data: citasData, isLoading: cargando } = useSWR(CITAS_ALL_KEY, fetcher);
  const citas = (citasData || []) as Cita[];

  const [enviando, setEnviando] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);
  const POR_PAGINA = 8;

  // Filtrado por búsqueda
  const citasFiltradas = useMemo(() => {
    if (!busqueda.trim()) return citas;
    const q = busqueda.toLowerCase();
    return citas.filter(c =>
      c.mascota?.toLowerCase().includes(q) ||
      c.dueno?.toLowerCase().includes(q) ||
      c.tipo?.toLowerCase().includes(q)
    );
  }, [citas, busqueda]);

  const [mostrarModalForm, setMostrarModalForm] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [fechaSeleccionada, setFechaSeleccionada] = useState("");
  const [mascota, setMascota] = useState("");
  const [dueno, setDueno] = useState("");
  const [tipo, setTipo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [notas, setNotas] = useState("");
  const [estadoCita, setEstadoCita] = useState("Pendiente"); 

  const [citaAEliminar, setCitaAEliminar] = useState<Cita | null>(null);
  const [estadoAConfirmar, setEstadoAConfirmar] = useState<(Cita & { accion: string }) | null>(null);
  
  // Modal de Historial (Consulta Médica al completar)
  const [modalConsulta, setModalConsulta] = useState<Cita | null>(null);
  const [diagnostico, setDiagnostico] = useState("");
  const [tratamiento, setTratamiento] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [recomendaciones, setRecomendaciones] = useState("");
  const [archivosSeleccionados, setArchivosSeleccionados] = useState<File[]>([]);
  const [subiendoConsulta, setSubiendoConsulta] = useState(false);

  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [horaSeleccionada, setHoraSeleccionada] = useState("10");
  const [minutoSeleccionado, setMinutoSeleccionado] = useState("00");
  const [amPm, setAmPm] = useState("AM");

  useEffect(() => {
    const delay = setTimeout(() => { cargarCitas(); }, 300);
    return () => clearTimeout(delay);
  }, [busqueda, paginaActual]);

  async function cargarCitas() {
    // This function is no longer needed as SWR handles fetching
    // setCargando(true);
    // let query = insforge.database.from("citas").select('*', { count: 'exact' });
    // if (busqueda) query = query.or(`mascota.ilike.%${busqueda}%,dueno.ilike.%${busqueda}%,tipo.ilike.%${busqueda}%`);
    // const { data, count, error } = await query.order('fecha', { ascending: true }).range((paginaActual - 1) * POR_PAGINA, (paginaActual * POR_PAGINA) - 1);
    // if (!error && data) { setCitas(data as Cita[]); setTotalCitas(count || 0); }
    // setCargando(false);
  }

  const agendarOActualizarCita = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    const stringHora = `${horaSeleccionada}:${minutoSeleccionado} ${amPm}`;
    const datosCita = { mascota, dueno, telefono, direccion, fecha, hora: stringHora, tipo, notas, estado: estadoCita, activa: true };

    try {
      if (editandoId) {
        await insforge.database.from("citas").update(datosCita).eq("id", editandoId);
        toast.success("Cita actualizada elegantemente.");
      } else {
        const { error } = await insforge.database.from("citas").insert([datosCita]);
      
        if (error) {
          toast.error("Error al agendar");
        } else {
          toast.success("Cita agendada correctamente");
          
          // WhatsApp Redirect
          const mensaje = `*¡Hola! Dra. Exotic le saluda!* 🐾✨%0A%0AConfirmamos la cita para *${mascota}*:%0A📅 *Fecha:* ${fecha.split('-').reverse().join('/')}%0A⏰ *Hora:* ${stringHora}%0A🏥 *Motivo:* ${tipo}%0A📍 *Dirección:* ${direccion}%0A%0A¡Le esperamos con mucho cariño! 🐾🦎`;
          const waUrl = `https://wa.me/${telefono.replace(/\D/g, '')}?text=${mensaje}`;
          window.open(waUrl, '_blank');
        }
      }
      mutate(CITAS_ALL_KEY);
      cancelarEdicion();
      setMostrarModalForm(false);
    } catch (e) {
      toast.error("Error de conexión");
    } finally {
      setEnviando(false);
    }
  };

  const solicitarCambioEstado = (cita: Cita, nuevoEstado: string) => {
    if (cita.estado === nuevoEstado) return;
    if (cita.estado === 'Completada' || cita.estado === 'Cancelada') return;
    if (nuevoEstado === 'Pendiente') {
      cambiarEstadoDirecto(cita.id, nuevoEstado);
    } else if (nuevoEstado === 'Completada') {
      setDiagnostico(""); setTratamiento(""); setObservaciones(""); setRecomendaciones(""); setArchivosSeleccionados([]);
      setModalConsulta(cita);
    } else {
      setEstadoAConfirmar({ ...cita, accion: nuevoEstado });
    }
  };

  const cambiarEstadoDirecto = async (id: string, nuevoEstado: string) => {
    const { error } = await insforge.database.from("citas").update({ estado: nuevoEstado }).eq("id", id);
    if (error) { 
      toast.error("No se pudo actualizar el estado."); 
    } else { 
      mutate(CITAS_ALL_KEY);
      toast.success(`Cita marcada como ${nuevoEstado}.`); 
    }
  };

  const comprimirImagen = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      if (!file.type.startsWith('image/')) return resolve(file);
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200;
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = img.width > MAX_WIDTH ? MAX_WIDTH : img.width;
          canvas.height = img.width > MAX_WIDTH ? img.height * scaleSize : img.height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => {
            if (blob) resolve(new File([blob], file.name, { type: 'image/jpeg' }));
            else resolve(file);
          }, 'image/jpeg', 0.6);
        };
      };
    });
  };

  const manejarArchivos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const procesados = await Promise.all(files.map(f => comprimirImagen(f)));
      setArchivosSeleccionados(prev => [...prev, ...procesados]);
    }
  };

  const guardarConsulta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalConsulta) return;
    setSubiendoConsulta(true);
    const archivosUrls: { url: string; nombre: string; tipo: string }[] = [];

    for (const file of archivosSeleccionados) {
      const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '')}`;
      const { data, error } = await insforge.storage.from('historial').upload(fileName, file);
      if (data) {
        const uploadData = data as any;
        const filePath = uploadData.path || uploadData.url || uploadData.key || fileName;
        archivosUrls.push({ url: filePath, nombre: file.name, tipo: file.type });
      } else {
        console.error("Storage error:", error);
      }
    }

    const { error } = await insforge.database.from("citas").update({
      estado: 'Completada',
      diagnostico,
      tratamiento,
      observaciones,
      recomendaciones,
      archivos: archivosUrls
    }).eq("id", modalConsulta.id);

    setSubiendoConsulta(false);

    if (error) {
      toast.error("Error guardando expediente.");
    } else {
      toast.success("Expediente clínico guardado y cita completada.", { style: { background: '#ecfeff', color: '#14b8a6', border: 'none' }});
      setModalConsulta(null);
      mutate(CITAS_ALL_KEY);
    }
  };

  const ejecutarCambioEstado = () => {
    if(!estadoAConfirmar) return;
    cambiarEstadoDirecto(estadoAConfirmar.id, estadoAConfirmar.accion);
    setEstadoAConfirmar(null);
  };

  const eliminarCita = async () => {
    if(!citaAEliminar) return;
    const { error } = await insforge.database.from("citas").delete().eq("id", citaAEliminar.id);
    if(error) toast.error("Error al eliminar el turno.");
    else { toast.success("Turno borrado de la agenda."); setCitaAEliminar(null); mutate(CITAS_ALL_KEY); }
  };

  const iniciarEdicion = (cita: Cita) => {
    setEditandoId(cita.id);
    setMascota(cita.mascota || ""); setDueno(cita.dueno || ""); setTelefono(cita.telefono || ""); setDireccion(cita.direccion || ""); setTipo(cita.tipo || ""); setNotas(cita.notas || ""); setEstadoCita(cita.estado || "Pendiente");
    if (cita.fecha) setFecha(cita.fecha);
    setMostrarModalForm(true);
  };

  const cancelarEdicion = () => {
    setEditandoId(null); setMascota(""); setDueno(""); setTelefono(""); setDireccion(""); setTipo(""); setNotas(""); setEstadoCita("Pendiente");
  };

  const hoyStr = new Date().toISOString().split('T')[0];
  const mananaDate = new Date(); mananaDate.setDate(mananaDate.getDate() + 1);
  const mananaStr = mananaDate.toISOString().split('T')[0];

  // Agrupar por fecha usando las citas filtradas
  const citasHoy      = citasFiltradas.filter(c => c.fecha === hoyStr);
  const citasManana   = citasFiltradas.filter(c => c.fecha === mananaStr);
  const citasProximas = citasFiltradas.filter(c => c.fecha > mananaStr);
  const todasPasadas  = citasFiltradas.filter(c => c.fecha < hoyStr);
  const hayResultados = citasFiltradas.length > 0;

  // Paginación aplicada solo al histórico (que puede ser muy largo)
  const totalPaginas  = Math.ceil(todasPasadas.length / POR_PAGINA);
  const citasPasadas  = todasPasadas.slice(
    (paginaActual - 1) * POR_PAGINA,
    paginaActual * POR_PAGINA
  );
  const totalHistorico = todasPasadas.length;

  const CitaCard = ({ cita }: { cita: Cita }) => {
    const isLocked = cita.estado === 'Completada' || cita.estado === 'Cancelada';
    return (
      <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.3 }}
        className={`relative flex flex-col md:flex-row md:items-center justify-between p-6 rounded-2xl border transition-all group overflow-hidden 
          ${cita.estado === 'Completada' ? 'bg-emerald-50/40 border-emerald-100 opacity-70' : cita.estado === 'Cancelada' ? 'bg-rose-50/40 border-rose-100 opacity-60 grayscale-[30%]' : 'bg-white border-[#fcfcfd] shadow-[0_4px_15px_rgba(0,0,0,0.015)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.04)]'}`}
      >
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex gap-2">
          {!isLocked && (
            <button onClick={() => iniciarEdicion(cita)} className="w-8 h-8 rounded-full flex items-center justify-center text-teal-400 hover:bg-teal-50 hover:text-teal-500 transition-colors bg-white/80 backdrop-blur-sm shadow-sm" title="Editar">
               <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
          <button onClick={() => setCitaAEliminar(cita)} className="w-8 h-8 rounded-full flex items-center justify-center text-rose-400 hover:bg-rose-50 hover:text-rose-500 transition-colors bg-white/80 backdrop-blur-sm shadow-sm" title="Eliminar">
             <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex items-start md:items-center gap-5">
          <div className={`w-14 h-14 rounded-full border flex items-center justify-center font-medium text-xl transition-all duration-300
            ${cita.estado === 'Completada' ? 'bg-emerald-100 text-emerald-500 border-emerald-200' : cita.estado === 'Cancelada' ? 'bg-rose-100 text-rose-500 border-rose-200' : 'border-[#eef2e8] bg-[#f4f7f0] text-[#8DAA68] group-hover:bg-[#8DAA68] group-hover:text-white'}`}>
            {cita.estado === 'Completada' ? <CheckCircle2 className="w-6 h-6" /> : cita.estado === 'Cancelada' ? <X className="w-6 h-6" /> : (cita.mascota ? cita.mascota[0].toUpperCase() : '?')}
          </div>
          <div>
            <h5 className={`font-medium text-[16px] flex items-center gap-2 ${cita.estado === 'Cancelada' ? 'line-through text-rose-400' : 'text-[#3b3a62]'}`}>
              {cita.mascota} <span className={`font-light text-sm ${cita.estado === 'Cancelada' ? 'text-rose-300' : 'text-[#a0a0b2]'}`}>({cita.dueno})</span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-widest ml-2
                ${cita.estado === 'Pendiente' || !cita.estado ? 'bg-orange-100 text-orange-500' : cita.estado === 'Completada' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                {cita.estado || 'Pendiente'}
              </span>
            </h5>
            <div className="flex flex-wrap items-center gap-4 mt-1">
              <p className="text-[14px] text-[#a0a0b2] font-light flex items-center gap-1.5"><Stethoscope className="w-3.5 h-3.5 text-[#8DAA68]/60" /> {cita.tipo}</p>
            </div>
          </div>
        </div>
        
        <div className="mt-5 md:mt-0 flex flex-col md:flex-row items-center gap-4 border-t md:border-t-0 md:border-l border-slate-100 pt-5 md:pt-0 pl-0 md:pl-6">
          <div className={`flex bg-slate-50 p-1 rounded-xl w-full md:w-auto h-10 border transition-all ${isLocked ? 'opacity-50 pointer-events-none grayscale-[50%]' : 'border-slate-100/60'}`}>
            <button onClick={() => solicitarCambioEstado(cita, 'Pendiente')} className={`flex-1 md:w-10 rounded-lg flex items-center justify-center transition-all ${(!cita.estado || cita.estado === 'Pendiente') ? 'bg-white shadow-sm text-orange-500' : 'text-slate-400 hover:text-orange-400'}`}><Clock className="w-4 h-4" /></button>
            <button onClick={() => solicitarCambioEstado(cita, 'Completada')} className={`flex-1 md:w-10 rounded-lg flex items-center justify-center transition-all ${cita.estado === 'Completada' ? 'bg-white shadow-sm text-emerald-500' : 'text-slate-400 hover:text-emerald-400'}`} title="Generar Expediente Clínico"><CheckCircle2 className="w-4 h-4" /></button>
            <button onClick={() => solicitarCambioEstado(cita, 'Cancelada')} className={`flex-1 md:w-10 rounded-lg flex items-center justify-center transition-all ${cita.estado === 'Cancelada' ? 'bg-white shadow-sm text-rose-500' : 'text-slate-400 hover:text-rose-400'}`}><X className="w-4 h-4" /></button>
          </div>
          <div className="flex flex-col items-center md:items-end w-full md:w-32 shrink-0">
            <div className={`text-[15px] font-medium flex items-center gap-1.5 ${isLocked ? 'text-[#a0a0b2]' : 'text-[#3b3a62]'}`}>
              {cita.fecha ? cita.fecha.split('-').reverse().slice(0,2).join('/') : '-'} <span className="text-slate-300 mx-1">•</span> {cita.hora.split(' ')[0]}
            </div>
            <div className="text-[11px] font-bold text-[#a0a0b2] uppercase tracking-wider mt-0.5">{cita.hora.split(' ')[1]}</div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="max-w-7xl mx-auto space-y-8 relative z-10 pb-20">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-6 mb-10">
           <div>
            <h2 className="text-[#3b3a62] font-light text-3xl tracking-wide">Agenda de Turnos</h2>
            <p className="text-[#a0a0b2] font-light mt-2 text-[15px]">Administra y visualiza el calendario completo de pacientes.</p>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-4 w-full lg:w-auto">
             <SearchInput
               value={busqueda}
               onChange={(v) => { setBusqueda(v); setPaginaActual(1); }}
               placeholder="Buscar por mascota, dueño o motivo..."
             />
             <button onClick={() => { cancelarEdicion(); setMostrarModalForm(true); }} className="w-full md:w-auto whitespace-nowrap bg-gradient-to-r from-[#8DAA68] to-[#6b844b] text-white px-8 h-[52px] rounded-full font-medium text-[15px] shadow-sm hover:scale-[1.02] flex items-center justify-center gap-2"><Plus className="w-5 h-5" /> Agendar Turno</button>
          </div>
        </div>
        
        <div className="bg-transparent min-h-[500px]">
          {cargando ? (
            <div className="space-y-6">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : citas.length === 0 ? (
            <EmptyState 
              title="No hay turnos registrados" 
              description="Parece que la agenda está vacía. ¡Agrega un nuevo turno para comenzar!" 
              icon={<CalendarX className="w-12 h-12 text-[#8DAA68]/20" />}
            />
          ) : !hayResultados ? (
            <EmptyState
              title="Sin resultados"
              description={`No se encontraron citas para "${busqueda}". Prueba con otro término.`}
              icon={<CalendarX className="w-12 h-12 text-[#8DAA68]/20" />}
            />
          ) : (
            <div className="w-full space-y-12">
              <AnimatePresence>
                {citasHoy.length > 0 && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4"><h3 className="text-[14px] uppercase tracking-widest font-bold text-[#8DAA68] border-b border-[#eef2e8] pb-3 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#8DAA68] animate-pulse"></span> Turnos para Hoy</h3><div className="flex flex-col gap-4">{citasHoy.map(c => <CitaCard key={c.id} cita={c} />)}</div></motion.div>)}
                {citasManana.length > 0 && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4"><h3 className="text-[14px] uppercase tracking-widest font-bold text-[#3b3a62]/60 border-b border-slate-200 pb-3">Para Mañana</h3><div className="flex flex-col gap-4">{citasManana.map(c => <CitaCard key={c.id} cita={c} />)}</div></motion.div>)}
                {citasProximas.length > 0 && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4"><h3 className="text-[14px] uppercase tracking-widest font-bold text-[#3b3a62]/60 border-b border-slate-200 pb-3">Próximos Días</h3><div className="flex flex-col gap-4">{citasProximas.map(c => <CitaCard key={c.id} cita={c} />)}</div></motion.div>)}
                {citasPasadas.length > 0 && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 opacity-70"><h3 className="text-[14px] uppercase tracking-widest font-bold text-slate-400 border-b border-slate-200 pb-3 flex items-center justify-between"><span>Historial Anterior</span><span className="text-[12px] font-medium text-slate-300 normal-case tracking-normal">{totalHistorico} registros</span></h3><div className="flex flex-col gap-4">{citasPasadas.map(c => <CitaCard key={c.id} cita={c} />)}</div></motion.div>)}
              </AnimatePresence>
              
              {/* Paginación del histórico — funcional */}
              {totalPaginas > 1 && (
                <Pagination paginaActual={paginaActual} totalPaginas={totalPaginas} onPageChange={setPaginaActual} />
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* MODAL DE HISTORIAL CLÍNICO */}
      <ModalBase open={!!modalConsulta} onClose={() => setModalConsulta(null)} maxWidth="max-w-2xl" shadowColor="rgba(20,184,166,0.3)" borderColor="border-teal-50" blobColor="bg-teal-300">
        <div className="flex items-center gap-4 mb-8 relative z-10">
          <div className="w-14 h-14 rounded-[1.2rem] bg-teal-50 flex items-center justify-center shadow-sm">
            <Stethoscope className="w-6 h-6 text-teal-500" />
          </div>
          <div>
            <h3 className="text-[#3b3a62] font-medium text-2xl">Expediente Clínico</h3>
            <p className="text-[13px] text-[#a0a0b2] font-light mt-0.5">Completando turno de <strong className="text-teal-600 font-medium">{modalConsulta?.mascota}</strong></p>
          </div>
        </div>

        <form onSubmit={guardarConsulta} className="space-y-6 relative z-10">
           <div className="bg-teal-50/30 p-4 rounded-xl border border-teal-100/50">
             <label className="text-[11px] uppercase tracking-wider text-teal-600 font-bold mb-2 block ml-1 flex items-center gap-1.5"><Stethoscope className="w-3.5 h-3.5"/> Procedimiento Realizado</label>
             <textarea required value={diagnostico} onChange={(e) => setDiagnostico(e.target.value)} rows={3} className="w-full bg-white rounded-lg p-3 text-[14px] text-[#3b3a62] border border-teal-100 focus:outline-none focus:border-teal-300 focus:ring-1 focus:ring-teal-300" placeholder="Describe los síntomas y el procedimiento realizado..."></textarea>
           </div>

           <div className="bg-emerald-50/30 p-4 rounded-xl border border-emerald-100/50">
             <label className="text-[11px] uppercase tracking-wider text-emerald-600 font-bold mb-2 block ml-1 flex items-center gap-1.5"><FileText className="w-3.5 h-3.5"/> Tratamiento / Receta</label>
             <textarea required value={tratamiento} onChange={(e) => setTratamiento(e.target.value)} rows={3} className="w-full bg-white rounded-lg p-3 text-[14px] text-[#3b3a62] border border-emerald-100 focus:outline-none focus:border-emerald-300 focus:ring-1 focus:ring-emerald-300" placeholder="Indica los medicamentos, dosis y pasos a seguir..."></textarea>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-orange-50/30 p-4 rounded-xl border border-orange-100/50">
                <label className="text-[11px] uppercase tracking-wider text-orange-600 font-bold mb-2 block ml-1 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5"/> Observaciones</label>
                <textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} rows={3} className="w-full bg-white rounded-lg p-3 text-[14px] text-[#3b3a62] border border-orange-100 focus:outline-none focus:border-orange-300 focus:ring-1 focus:ring-orange-300" placeholder="Notas adicionales del paciente..."></textarea>
              </div>
              <div className="bg-blue-50/30 p-4 rounded-xl border border-blue-100/50">
                <label className="text-[11px] uppercase tracking-wider text-blue-600 font-bold mb-2 block ml-1 flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5"/> Recomendaciones</label>
                <textarea value={recomendaciones} onChange={(e) => setRecomendaciones(e.target.value)} rows={3} className="w-full bg-white rounded-lg p-3 text-[14px] text-[#3b3a62] border border-blue-100 focus:outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-300" placeholder="Pasos a seguir por el dueño..."></textarea>
              </div>
           </div>

           <div className="bg-slate-50/40 p-4 rounded-xl border border-slate-100/50 text-[#3b3a62]">
             <label className="text-[11px] uppercase tracking-wider text-[#a0a0b2] font-bold mb-2 block ml-1 flex items-center gap-1.5"><UploadCloud className="w-3.5 h-3.5"/> Subir Análisis o PDF (Se comprime automático)</label>
             <div className="relative w-full h-24 border-2 border-dashed border-blue-200 rounded-xl flex items-center justify-center bg-white hover:bg-blue-50 transition-colors cursor-pointer overflow-hidden">
               <input type="file" multiple accept=".pdf,image/jpeg,image/png" onChange={manejarArchivos} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" />
               <div className="text-center text-blue-400">
                  <UploadCloud className="w-6 h-6 mx-auto mb-1" />
                  <span className="text-[13px] font-medium">Toca o arrastra PDFs / Imágenes</span>
               </div>
             </div>
             {archivosSeleccionados.length > 0 && (
               <div className="mt-3 flex flex-wrap gap-2">
                  {archivosSeleccionados.map((f, i) => (
                     <span key={i} className="px-3 py-1.5 bg-blue-100 text-blue-600 text-[11px] font-medium rounded-lg truncate max-w-[150px] shadow-sm">{f.name}</span>
                  ))}
               </div>
             )}
           </div>

           <button type="submit" disabled={subiendoConsulta} className="w-full rounded-2xl text-white font-medium text-[16px] h-14 bg-gradient-to-r from-teal-400 to-emerald-400 disabled:opacity-50 mt-8 shadow-[0_8px_20px_rgba(20,184,166,0.3)] hover:shadow-[0_12px_25px_rgba(20,184,166,0.4)] transition-all flex items-center justify-center gap-2">
              {subiendoConsulta ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : <><CheckCircle2 className="w-5 h-5"/> Guardar Expediente y Finalizar Cita</>}
           </button>
        </form>
      </ModalBase>

      {/* MODAL DE FORMULARIO DE CITA */}
      <ModalBase open={mostrarModalForm} onClose={() => setMostrarModalForm(false)}>
        <div className="flex items-center gap-4 mb-8 relative z-10 pr-12">
          <div className={`w-14 h-14 rounded-[1.2rem] flex items-center justify-center shadow-sm ${editandoId ? 'bg-teal-50' : 'bg-[#f4f7f0]'}`}>
            {editandoId ? <Pencil className="w-6 h-6 text-teal-400" /> : <CalendarIcon className="w-6 h-6 text-[#8DAA68]" />}
          </div>
          <div>
            <h3 className="text-[#3b3a62] font-medium text-2xl">{editandoId ? "Modificar Cita" : "Agendar Cita"}</h3>
            <p className="text-[13px] text-[#a0a0b2] font-light mt-0.5">Reserva un espacio en la clínica</p>
          </div>
        </div>
        <form onSubmit={agendarOActualizarCita} className="space-y-6 relative z-10">
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
              <input type="text" required value={dueno} onChange={(e) => setDueno(e.target.value)} className="w-full h-11 bg-transparent border-b border-[#eef2e8] focus:outline-none focus:border-[#8DAA68] text-[#8DAA68] pl-9 text-[15px]" placeholder="Nombre Dueño" />
              <User className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8DAA68]/50" />
            </div>
            <div className="relative group">
              <input type="tel" required value={telefono} onChange={(e) => setTelefono(e.target.value)} className="w-full h-11 bg-transparent border-b border-[#eef2e8] focus:outline-none focus:border-[#8DAA68] text-[#8DAA68] pl-9 text-[15px]" placeholder="Teléfono" />
              <Phone className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8DAA68]/50" />
            </div>
          </div>
          <div className="relative group">
            <input type="text" value={direccion} onChange={(e) => setDireccion(e.target.value)} className="w-full h-11 bg-transparent border-b border-[#eef2e8] focus:outline-none focus:border-[#8DAA68] text-[#8DAA68] pl-9 text-[15px]" placeholder="Dirección (Opcional)" />
            <Home className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8DAA68]/50" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] uppercase tracking-wider text-[#a0a0b2] font-semibold mb-2 block ml-1">Fecha</label>
              <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="w-full h-11 bg-slate-50 border-none rounded-xl px-4 text-[#8DAA68] text-sm focus:ring-1 focus:ring-[#8DAA68]/50" />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-[#a0a0b2] font-semibold mb-2 block ml-1">Hora</label>
              <TimePickerInput hora={horaSeleccionada} minuto={minutoSeleccionado} amPm={amPm} onHoraChange={setHoraSeleccionada} onMinutoChange={setMinutoSeleccionado} onAmPmChange={setAmPm} />
            </div>
          </div>
          <div className="relative group mt-2">
            <input type="text" required value={tipo} onChange={(e) => setTipo(e.target.value)} className="w-full h-11 bg-transparent border-b border-[#eef2e8] focus:outline-none focus:border-[#8DAA68] text-[#8DAA68] pl-9 text-[15px]" placeholder="Motivo de Consulta (Ej. Vacunación)" />
            <Stethoscope className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8DAA68]/50" />
          </div>
          <div className="relative group mt-6 bg-[#f4f7f0]/30 p-4 rounded-xl border border-[#eef2e8]/30">
            <label className="text-[11px] uppercase tracking-wider text-[#8DAA68] font-semibold mb-2 flex items-center gap-1.5"><FileText className="w-3.5 h-3.5"/> Condiciones / Notas</label>
            <textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={3} className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-[#3b3a62] placeholder:text-[#c4c4c4] font-light text-[14px] resize-none" placeholder="Observaciones previas..." />
          </div>
          <button type="submit" disabled={enviando} className={`w-full rounded-2xl text-white font-medium text-[16px] h-14 transition-all mt-8 flex items-center justify-center gap-2 border border-white/20
              ${editandoId ? 'bg-gradient-to-r from-teal-400 to-emerald-400 shadow-[0_8px_20px_rgba(45,212,191,0.3)] hover:shadow-[0_12px_25px_rgba(45,212,191,0.4)]' : 'bg-gradient-to-r from-[#8DAA68] to-[#6b844b] shadow-[0_8px_20px_rgba(141,170,104,0.3)] hover:shadow-[0_12px_25px_rgba(141,170,104,0.4)]'} active:scale-95 disabled:opacity-70`}>
            {enviando ? <Loader2 className="w-6 h-6 animate-spin" /> : editandoId ? "Actualizar Registro" : "Guardar Turno y Salir"}
          </button>
        </form>
      </ModalBase>

      {/* MODAL DE CONFIRMACION DE ESTADO */}
      <ConfirmDialog
        open={!!estadoAConfirmar}
        onClose={() => setEstadoAConfirmar(null)}
        onConfirm={ejecutarCambioEstado}
        icon={estadoAConfirmar?.accion === 'Cancelada' ? <AlertTriangle className="w-8 h-8 text-rose-500" /> : <CheckCircle2 className="w-8 h-8 text-emerald-500" />}
        title={`¿Marcar como ${estadoAConfirmar?.accion}?`}
        message={<>Esta acción bloqueará el turno de <strong className="font-medium text-[#fc855f]">{estadoAConfirmar?.mascota}</strong> y no podrás revertirlo.</>}
        confirmText="Confirmar"
        cancelText="Volver"
        confirmColor={estadoAConfirmar?.accion === 'Cancelada' ? 'rose' : 'emerald'}
      />

      {/* MODAL ELIMINAR CITA */}
      <ConfirmDialog
        open={!!citaAEliminar}
        onClose={() => setCitaAEliminar(null)}
        onConfirm={eliminarCita}
        icon={<Trash2 className="w-8 h-8 text-rose-500" />}
        title="¿Eliminar turno?"
        message={<>Estás a punto de borrar definitivamente el turno de <strong className="font-medium text-[#fc855f]">{citaAEliminar?.mascota}</strong>. Esto no se puede deshacer.</>}
        confirmText="Eliminar"
        cancelText="Cancelar"
        confirmColor="rose"
      />
    </>
  );
}
