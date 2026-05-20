"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, Plus, Loader2, Search, Trash2, Pencil, Calendar, 
  Phone, User as UserIcon, Info, ChevronRight, 
  Stethoscope, Activity, Dna, Apple, Home, CheckCircle2, Clock, FileText, PawPrint, SearchX, AlertTriangle, Camera, Zap
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import type { Paciente, Cita } from "@/types";
import ModalBase from "@/components/ModalBase";
import ConfirmDialog from "@/components/ConfirmDialog";
import MedicalRecordModal from "@/components/MedicalRecordModal";
import SearchInput from "@/components/SearchInput";
import Pagination from "@/components/Pagination";
import Skeleton from "@/components/Skeleton";
import EmptyState from "@/components/EmptyState";
import useSWR, { mutate } from "swr";
import { fetcher } from "@/lib/fetchers";

const PACIENTES_ALL_KEY = 'pacientes:{"order":["nombre",{"ascending":true}]}';

export default function PacientesPage() {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPacientes, setTotalPacientes] = useState(0);
  const POR_PAGINA = 8;

  // Modales
  const [mostrarModalForm, setMostrarModalForm] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [pacienteAEliminar, setPacienteAEliminar] = useState<Paciente | null>(null);
  
  // Modal de Historial
  const [verHistorialPaciente, setVerHistorialPaciente] = useState<Paciente | null>(null);
  const [historialCitas, setHistorialCitas] = useState<Cita[]>([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [citaDetalle, setCitaDetalle] = useState<Cita | null>(null);


  // Formulario
  const [nombre, setNombre] = useState("");
  const [especie, setEspecie] = useState<any>("Perro");
  const [raza, setRaza] = useState("");
  const [dueno, setDueno] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [historia, setHistoria] = useState("");

  // Campos Exóticos
  const [nombreCientifico, setNombreCientifico] = useState("");
  const [tiempoTenencia, setTiempoTenencia] = useState("");
  const [dieta, setDieta] = useState("");
  const [habitat, setHabitat] = useState("");

  // Foto de mascota
  const [fotoUrl, setFotoUrl] = useState("");
  const [subiendoFoto, setSubiendoFoto] = useState(false);

  // Edad y peso
  const [edad, setEdad] = useState<string>("");
  const [peso, setPeso] = useState<number | "">("");

  const [enviando, setEnviando] = useState(false);

  // Walk-in (consulta sin cita)
  const [pacienteWalkIn, setPacienteWalkIn] = useState<Paciente | null>(null);
  const [tipoConsultaWalkIn, setTipoConsultaWalkIn] = useState("");
  const [notasWalkIn, setNotasWalkIn] = useState("");
  const [diagnosticoWalkIn, setDiagnosticoWalkIn] = useState("");
  const [tratamientoWalkIn, setTratamientoWalkIn] = useState("");
  const [observacionesWalkIn, setObservacionesWalkIn] = useState("");
  const [recomendacionesWalkIn, setRecomendacionesWalkIn] = useState("");
  const [iniciandoConsulta, setIniciandoConsulta] = useState(false);

  useEffect(() => {
    const delay = setTimeout(() => { cargarPacientes(); }, 300);
    return () => clearTimeout(delay);
  }, [busqueda, paginaActual]);

  async function cargarPacientes() {
    setCargando(true);
    let query = supabase.from("pacientes").select('*', { count: 'exact' });
    
    if (busqueda) {
      query = query.or(`nombre.ilike.%${busqueda}%,dueno.ilike.%${busqueda}%,numero_historial.ilike.%${busqueda}%`);
    }

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range((paginaActual - 1) * POR_PAGINA, (paginaActual * POR_PAGINA) - 1);

    if (!error && data) {
      setPacientes(data as Paciente[]);
      setTotalPacientes(count || 0);
    }
    setCargando(false);
  }

  // Comprimir imagen antes de subir
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
          const MAX = 400;
          const scale = MAX / Math.max(img.width, img.height);
          canvas.width = img.width > MAX ? img.width * scale : img.width;
          canvas.height = img.height > MAX ? img.height * scale : img.height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => {
            if (blob) resolve(new File([blob], file.name, { type: 'image/jpeg' }));
            else resolve(file);
          }, 'image/jpeg', 0.7);
        };
      };
    });
  };

  const handleFotoMascota = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSubiendoFoto(true);
    // Preview inmediato
    const reader = new FileReader();
    reader.onload = (ev) => { if (ev.target?.result) setFotoUrl(ev.target.result as string); };
    reader.readAsDataURL(file);
    try {
      const compressed = await comprimirImagen(file);
      const fileName = `mascota_${Date.now()}_${compressed.name.replace(/[^a-zA-Z0-9.\-_]/g, '')}`;
      const { data, error } = await supabase.storage.from('historial').upload(fileName, compressed);
      if (error) throw error;
      const { data: publicData } = supabase.storage.from('historial').getPublicUrl(fileName);
      const publicUrl = publicData.publicUrl;
      setFotoUrl(publicUrl);
    } catch (err) {
      console.error('Error subiendo foto de mascota:', err);
    } finally {
      setSubiendoFoto(false);
    }
  };

  const cargarHistorial = async (p: Paciente) => {
    setVerHistorialPaciente(p);
    setCargandoHistorial(true);
    const { data, error } = await supabase
      .from("citas")
      .select('*')
      .eq("mascota", p.nombre)
      .eq("dueno", p.dueno)
      .order('fecha', { ascending: false });
    
    if (!error && data) setHistorialCitas(data as Cita[]);
    setCargandoHistorial(false);
  };

  const compartirWhatsApp = () => {
    if (!citaDetalle || !verHistorialPaciente) return;
    
    const telefonoRaw = verHistorialPaciente.telefono || '';
    const phoneInfo = telefonoRaw.replace(/\D/g, '');
    const phone = phoneInfo.startsWith('51') ? phoneInfo : `51${phoneInfo}`;

    // Usamos Unicode escapes para garantizar que los emojis se vean en PC y móvil
    const PAW    = '\uD83D\uDC3E'; // 🐾
    const STET   = '\uD83E\uDE7A'; // 🩺
    const PILL   = '\uD83D\uDC8A'; // 💊
    const WARN   = '\u26A0\uFE0F';  // ⚠️
    const INFO   = '\u2139\uFE0F';  // ℹ️
    const HOSP   = '\uD83C\uDFE5'; // 🏥
    const DOC    = '\uD83D\uDCCE'; // 📎

    let mensaje = `${PAW} *Resumen de Consulta Veterinaria*\n`;
    mensaje += `*Paciente:* ${verHistorialPaciente.nombre}\n`;
    mensaje += `*Due\u00f1o:* ${verHistorialPaciente.dueno}\n`;
    mensaje += `*Fecha de atenci\u00f3n:* ${citaDetalle.fecha.split('-').reverse().join('/')}\n\n`;
    
    if (citaDetalle.diagnostico) mensaje += `${STET} *Procedimiento Realizado:*\n${citaDetalle.diagnostico}\n\n`;
    if (citaDetalle.tratamiento) mensaje += `${PILL} *Tratamiento / Receta:*\n${citaDetalle.tratamiento}\n\n`;
    if (citaDetalle.observaciones) mensaje += `${WARN} *Observaciones:*\n${citaDetalle.observaciones}\n\n`;
    if (citaDetalle.recomendaciones) mensaje += `${INFO} *Recomendaciones:*\n${citaDetalle.recomendaciones}\n\n`;
    
    // Incluir links a los PDFs si existen
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

  const guardarPaciente = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);

    const datosPaciente: Partial<Paciente> = {
      nombre, especie, raza, dueno, telefono, direccion,
      numero_historial: historia || `HE-${Date.now().toString().slice(-6)}`,
      nombre_cientifico: nombreCientifico,
      tiempo_tenencia: tiempoTenencia,
      dieta,
      habitat,
      ...(fotoUrl ? { foto_url: fotoUrl } : {}),
      ...(edad ? { fecha_nacimiento: calcularFechaDesdeEdad(edad) } : {}),
      ...(peso !== "" ? { peso: Number(peso) } : {}),
    };

    const pacienteEditando = !!editandoId;

    try {
      const { error } = pacienteEditando
        ? await supabase.from("pacientes").update(datosPaciente).eq("id", editandoId)
        : await supabase.from("pacientes").insert([datosPaciente]);
      
      if (!error) {
        cargarPacientes();
        toast.success(pacienteEditando ? "Paciente actualizado" : "Paciente registrado");
        limpiarFormulario();
        setMostrarModalForm(false); 
      } else {
        toast.error("Error al guardar");
      }
    } catch (e) {
      toast.error("Error de conexión");
    } finally {
      setEnviando(false);
    }
  };

  const eliminarPaciente = async () => {
    if (!pacienteAEliminar) return;
    try {
      const { error } = await supabase.from("pacientes").delete().eq("id", pacienteAEliminar.id);
      if (!error) {
        cargarPacientes();
        toast.success("Paciente eliminado");
        setPacienteAEliminar(null); // Clear the patient to be deleted
      } else {
        toast.error("Error al eliminar");
      }
    } catch (e) {
      toast.error("Error de conexión");
    }
  };

  const iniciarEdicion = (p: Paciente) => {
    setEditandoId(p.id);
    setNombre(p.nombre);
    setEspecie(p.especie);
    setRaza(p.raza || "");
    setDueno(p.dueno);
    setTelefono(p.telefono);
    setDireccion(p.direccion || "");
    setHistoria(p.numero_historial);
    setNombreCientifico(p.nombre_cientifico || "");
    setTiempoTenencia(p.tiempo_tenencia || "");
    setDieta(p.dieta || "");
    setHabitat(p.habitat || "");
    setFotoUrl(p.foto_url || "");
    
    if (p.fecha_nacimiento) {
      setEdad(calcularEdadString(p.fecha_nacimiento));
    } else {
      setEdad("");
    }
    setPeso(p.peso ?? "");
    setMostrarModalForm(true);
  };

  const limpiarFormulario = () => {
    setEditandoId(null);
    setNombre(""); setEspecie("Perro"); setRaza(""); setDueno(""); setTelefono(""); setDireccion(""); setHistoria("");
    setNombreCientifico(""); setTiempoTenencia(""); setDieta(""); setHabitat("");
    setFotoUrl("");
    setEdad(""); setPeso("");
  };

  const confirmarConsultaRapida = async () => {
    if (!pacienteWalkIn) return;
    setIniciandoConsulta(true);
    try {
      const ahora = new Date();
      const hora = ahora.toTimeString().slice(0, 5);
      const fecha = ahora.toISOString().split('T')[0];

      const { error } = await supabase.from("citas").insert([{
        mascota: pacienteWalkIn.nombre,
        dueno: pacienteWalkIn.dueno,
        telefono: pacienteWalkIn.telefono || '',
        direccion: pacienteWalkIn.direccion || '',
        fecha,
        hora,
        tipo: tipoConsultaWalkIn,
        notas: notasWalkIn || 'Paciente sin cita previa',
        diagnostico: diagnosticoWalkIn,
        tratamiento: tratamientoWalkIn,
        observaciones: observacionesWalkIn,
        recomendaciones: recomendacionesWalkIn,
        estado: 'Completada',
        activa: true,
      }]);

      if (error) throw error;

      toast.success("✅ Consulta guardada correctamente");
      const pacienteParaHistorial = pacienteWalkIn;
      setPacienteWalkIn(null);
      setNotasWalkIn("");
      setTipoConsultaWalkIn("");
      setDiagnosticoWalkIn("");
      setTratamientoWalkIn("");
      setObservacionesWalkIn("");
      setRecomendacionesWalkIn("");
      // Abrir la historia clínica directo
      setVerHistorialPaciente(pacienteParaHistorial);
    } catch (err) {
      toast.error("Error al iniciar la consulta");
    } finally {
      setIniciandoConsulta(false);
    }
  };

  const calcularFechaDesdeEdad = (edadStr: string) => {
    const hoy = new Date();
    if (edadStr.includes('mes')) {
      const meses = parseInt(edadStr);
      hoy.setMonth(hoy.getMonth() - meses);
    } else if (edadStr.includes('año')) {
      const anios = parseInt(edadStr);
      hoy.setFullYear(hoy.getFullYear() - anios);
    }
    return hoy.toISOString().split('T')[0];
  };

  const calcularEdadString = (fechaNacimiento: string) => {
    const hoy = new Date();
    const nac = new Date(fechaNacimiento);
    let meses = (hoy.getFullYear() - nac.getFullYear()) * 12;
    meses -= nac.getMonth();
    meses += hoy.getMonth();
    if (meses <= 0) return '1 mes';
    if (meses <= 12) return meses === 1 ? '1 mes' : `${meses} meses`;
    const anios = Math.floor(meses / 12);
    return anios === 1 ? '1 año' : `${anios} años`;
  };

  const totalPaginas = Math.ceil(totalPacientes / POR_PAGINA);

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="max-w-7xl mx-auto space-y-8 pb-20">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-6 mb-12">
          <div>
            <h2 className="text-[#3b3a62] font-light text-3xl tracking-wide flex items-center gap-3">Directorio de Pacientes</h2>
            <p className="text-[#a0a0b2] font-light mt-2 text-[15px]">Gestiona las historias clínicas de todas las mascotas.</p>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-5 w-full lg:w-auto">
            <SearchInput value={busqueda} onChange={setBusqueda} placeholder="Buscar por nombre, dueño o historial..." />
            <button onClick={() => { limpiarFormulario(); setMostrarModalForm(true); }} className="w-full md:w-auto bg-gradient-to-r from-[#8DAA68] to-[#6b844b] text-white px-8 h-[52px] rounded-full font-medium text-[15px] shadow-[0_8px_25px_rgba(141,170,104,0.2)] hover:scale-[1.02] flex items-center justify-center gap-2 transition-all">
              <Plus className="w-5 h-5" /> Nueva Mascota
            </button>
          </div>
        </div>

        {cargando ? (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-64 w-full" />)}
           </div>
        ) : pacientes.length === 0 ? (
           <EmptyState 
              title="No se encontraron pacientes" 
              description={busqueda ? "No hay resultados para tu búsqueda. Intenta con otros términos." : "Tu base de datos de pacientes está vacía. ¡Registra al primer paciente!"}
              icon={<SearchX className="w-12 h-12 text-[#8DAA68]/20" />}
           />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {pacientes.map((p) => (
              <motion.div layout key={p.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[2rem] border border-[#fcfcfd] shadow-[0_4px_20px_rgba(0,0,0,0.015)] p-6 relative group hover:shadow-[0_12px_40px_rgba(0,0,0,0.04)] transition-all flex flex-col">
                <div className={`absolute top-4 right-4 py-1 px-3 rounded-full text-[10px] font-bold uppercase tracking-wider ${p.especie === 'Exótico' ? 'bg-amber-100 text-amber-600' : 'bg-[#f4f7f0] text-[#8DAA68]'}`}>
                  {p.especie}
                </div>
                
                <div className="flex items-center gap-4 mb-6">
                    {/* Avatar con foto o inicial */}
                    <div className="relative shrink-0">
                      <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-50 flex items-center justify-center text-slate-300 group-hover:ring-2 group-hover:ring-[#8DAA68]/30 transition-all">
                        {p.foto_url ? (
                          <img src={p.foto_url} alt={p.nombre} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-2xl font-bold text-[#8DAA68]/40">{p.nombre[0]?.toUpperCase()}</span>
                        )}
                      </div>
                    </div>
                   <div className="flex-1 min-w-0">
                      <h4 className="text-[#3b3a62] font-medium text-lg truncate">{p.nombre}</h4>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[12px] text-[#a0a0b2] truncate">Hist: {p.numero_historial}</p>
                        {p.fecha_nacimiento && (
                          <span className="text-[11px] bg-[#f4f7f0] text-[#8DAA68] px-2 py-0.5 rounded-full font-medium">
                            {calcularEdadString(p.fecha_nacimiento)}
                          </span>
                        )}
                        {p.peso && (
                          <span className="text-[11px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">
                            {p.peso} kg
                          </span>
                        )}
                      </div>
                   </div>
                </div>

                <div className="space-y-3 mb-8 flex-1">
                   <div className="flex items-center gap-3 text-[13px] text-[#a0a0b2] font-light">
                      <UserIcon className="w-4 h-4 text-[#8DAA68]/50" /> <span>{p.dueno}</span>
                   </div>
                   <div className="flex items-center gap-3 text-[13px] text-[#a0a0b2] font-light">
                      <Phone className="w-4 h-4 text-[#8DAA68]/50" /> 
                      <a href={`https://wa.me/51${p.telefono.replace(/\s+/g, '')}`} target="_blank" className="hover:text-[#8DAA68] transition-colors">{p.telefono}</a>
                   </div>
                   <div className="flex items-center gap-3 text-[13px] text-[#a0a0b2] font-light">
                      <Home className="w-4 h-4 text-[#8DAA68]/50" /> <span className="truncate">{p.direccion || 'Sin dirección'}</span>
                   </div>
                   <div className="flex items-center gap-3 text-[13px] text-[#a0a0b2] font-light">
                      <Info className="w-4 h-4 text-[#8DAA68]/50" /> <span>{p.raza || 'Sin raza definida'}</span>
                   </div>
                </div>

                <div className="space-y-2 mt-auto">
                  <div className="grid grid-cols-3 gap-2">
                     <button onClick={() => cargarHistorial(p)} className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 hover:bg-teal-50 text-slate-400 hover:text-teal-500 transition-colors group/btn">
                        <Activity className="w-4 h-4 mb-1" />
                        <span className="text-[10px] font-medium">Historial</span>
                     </button>
                     <button onClick={() => iniciarEdicion(p)} className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 hover:bg-blue-50 text-slate-400 hover:text-blue-500 transition-colors group/btn">
                        <Pencil className="w-4 h-4 mb-1" />
                        <span className="text-[10px] font-medium">Editar</span>
                     </button>
                     <button onClick={() => setPacienteAEliminar(p)} className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors group/btn">
                        <Trash2 className="w-4 h-4 mb-1" />
                        <span className="text-[10px] font-medium">Borrar</span>
                     </button>
                  </div>
                  <button
                    onClick={() => setPacienteWalkIn(p)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 transition-all shadow-sm hover:shadow-md text-[12px] font-semibold active:scale-95"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    Atender Ahora
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <Pagination paginaActual={paginaActual} totalPaginas={totalPaginas} onPageChange={setPaginaActual} />
      </motion.div>

      {/* MODAL FORMULARIO PACIENTE */}
      <ModalBase open={mostrarModalForm} onClose={() => setMostrarModalForm(false)} maxWidth="max-w-[600px]">
        <div className="flex items-center gap-4 mb-8 relative z-10">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${editandoId ? 'bg-blue-50' : 'bg-[#f4f7f0]'}`}>
            {editandoId ? <Pencil className="w-6 h-6 text-blue-400" /> : <Plus className="w-6 h-6 text-[#8DAA68]" />}
          </div>
          <div>
            <h3 className="text-[#3b3a62] font-medium text-2xl">{editandoId ? "Editar Paciente" : "Registrar Mascota"}</h3>
            <p className="text-[13px] text-[#a0a0b2] font-light mt-0.5">Completa la ficha técnica para el historial clínico.</p>
          </div>
        </div>

        <form onSubmit={guardarPaciente} className="space-y-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-4">
               <div>
                  <label className="text-[11px] uppercase tracking-wider text-[#a0a0b2] font-bold mb-2 block ml-1">Nombre de Mascota</label>
                  <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full h-11 bg-slate-50 rounded-xl px-4 text-[#8DAA68] text-sm focus:ring-1 focus:ring-[#8DAA68]/50 focus:outline-none transition-all" placeholder="Ej: Toby" />
               </div>
                <div>
                   <label className="text-[11px] uppercase tracking-wider text-[#a0a0b2] font-bold mb-2 block ml-1">Especie</label>
                   <div className="relative group/sel">
                     <select value={especie} onChange={(e) => setEspecie(e.target.value)} className="w-full h-11 bg-slate-50/80 rounded-xl px-4 text-[#8DAA68] text-sm focus:ring-1 focus:ring-[#8DAA68]/50 cursor-pointer appearance-none outline-none border border-transparent focus:border-[#8DAA68]/20 transition-all hover:bg-slate-100/50">
                       <option>Perro</option>
                       <option>Gato</option>
                       <option>Exótico</option>
                     </select>
                     <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8DAA68]/40 pointer-events-none rotate-90 group-hover/sel:text-[#8DAA68] transition-colors" />
                   </div>
                </div>
               <div>
                  <label className="text-[11px] uppercase tracking-wider text-[#a0a0b2] font-bold mb-2 block ml-1">Raza / Tipo</label>
                  <input type="text" value={raza} onChange={(e) => setRaza(e.target.value)} className="w-full h-11 bg-slate-50 rounded-xl px-4 text-[#8DAA68] text-sm focus:ring-1 focus:ring-[#8DAA68]/50 focus:outline-none" placeholder="Ej: Husky" />
               </div>
            </div>

            <div className="space-y-4">
               <div>
                  <label className="text-[11px] uppercase tracking-wider text-[#a0a0b2] font-bold mb-2 block ml-1">Nombre del Dueño</label>
                  <input type="text" value={dueno} onChange={(e) => setDueno(e.target.value)} className="w-full h-11 bg-slate-50 rounded-xl px-4 text-[#8DAA68] text-sm focus:ring-1 focus:ring-[#8DAA68]/50 focus:outline-none" placeholder="Nombre y Apellido" />
               </div>
               <div>
                  <label className="text-[11px] uppercase tracking-wider text-[#a0a0b2] font-bold mb-2 block ml-1">Teléfono de Contacto</label>
                  <input type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} className="w-full h-11 bg-slate-50 rounded-xl px-4 text-[#8DAA68] text-sm focus:ring-1 focus:ring-[#8DAA68]/50 focus:outline-none" placeholder="999 999 999" />
               </div>
               <div>
                  <label className="text-[11px] uppercase tracking-wider text-[#a0a0b2] font-bold mb-2 block ml-1">N° Historia</label>
                  <input type="text" value={historia} onChange={(e) => setHistoria(e.target.value)} className="w-full h-11 bg-slate-50 rounded-xl px-4 text-[#8DAA68] text-sm focus:ring-1 focus:ring-[#8DAA68]/50 focus:outline-none" placeholder="Generado automático si vacío" />
               </div>
            </div>
            <div className="col-span-1 md:col-span-2">
               <label className="text-[11px] uppercase tracking-wider text-[#a0a0b2] font-bold mb-2 block ml-1">Dirección</label>
               <div className="relative group">
                 <input type="text" value={direccion} onChange={(e) => setDireccion(e.target.value)} className="w-full h-11 bg-slate-50 rounded-xl px-10 text-[#8DAA68] text-sm focus:ring-1 focus:ring-[#8DAA68]/50 focus:outline-none" placeholder="Av. Siempre Viva 123" />
                 <Home className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8DAA68]/40" />
               </div>
            </div>

            <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] uppercase tracking-wider text-[#a0a0b2] font-bold mb-2 block ml-1">Edad</label>
                <div className="relative group/sel">
                  <select
                    value={edad}
                    onChange={(e) => setEdad(e.target.value)}
                    className="w-full h-11 bg-slate-50 rounded-xl px-4 text-[#8DAA68] text-sm focus:ring-1 focus:ring-[#8DAA68]/50 focus:outline-none cursor-pointer appearance-none"
                  >
                    <option value="">Seleccione...</option>
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={`m-${i+1}`} value={`${i+1} mes${i===0?'':'es'}`}>{i+1} mes{i===0?'':'es'}</option>
                    ))}
                    {Array.from({ length: 15 }, (_, i) => (
                      <option key={`y-${i+1}`} value={`${i+1} año${i===0?'':'s'}`}>{i+1} año{i===0?'':'s'}</option>
                    ))}
                  </select>
                  <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8DAA68]/40 pointer-events-none rotate-90" />
                </div>
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-wider text-[#a0a0b2] font-bold mb-2 block ml-1">Peso Actual (kg)</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={peso}
                  onChange={(e) => setPeso(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full h-11 bg-slate-50 rounded-xl px-4 text-[#8DAA68] text-sm focus:ring-1 focus:ring-[#8DAA68]/50 focus:outline-none"
                  placeholder="Ej: 4.5"
                />
              </div>
            </div>

            {/* Foto de la Mascota */}
            <div className="col-span-1 md:col-span-2">
              <label className="text-[11px] uppercase tracking-wider text-[#a0a0b2] font-bold mb-2 block ml-1 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5" /> Foto de la Mascota
              </label>
              <div className="flex items-center gap-4">
                {/* Preview */}
                <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                  {subiendoFoto ? (
                    <Loader2 className="w-5 h-5 animate-spin text-[#8DAA68]" />
                  ) : fotoUrl ? (
                    <img src={fotoUrl} alt="Foto mascota" className="w-full h-full object-cover" />
                  ) : (
                    <PawPrint className="w-6 h-6 text-slate-300" />
                  )}
                </div>
                {/* Input */}
                <label className="flex-1 cursor-pointer">
                  <div className="h-11 bg-slate-50 border border-dashed border-slate-200 rounded-xl flex items-center justify-center gap-2 text-[#8DAA68] text-sm font-medium hover:bg-[#f4f7f0] hover:border-[#8DAA68]/40 transition-colors">
                    <Camera className="w-4 h-4" />
                    {fotoUrl ? 'Cambiar foto' : 'Subir foto'}
                  </div>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFotoMascota}
                    className="hidden"
                    disabled={subiendoFoto}
                  />
                </label>
              </div>
            </div>
          </div>

          {especie === 'Exótico' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4 border-t border-amber-100 pt-6 mt-2">
               <h4 className="text-[12px] uppercase tracking-widest text-amber-600 font-bold mb-4 flex items-center gap-2">
                 <Dna className="w-4 h-4" /> Especificaciones para Animales Exóticos
               </h4>
               <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-[11px] text-amber-500 font-bold mb-1 block uppercase">Nombre Científico</label>
                    <input type="text" value={nombreCientifico} onChange={(e) => setNombreCientifico(e.target.value)} className="w-full h-10 bg-amber-50/50 rounded-lg px-4 text-amber-800 text-sm border border-amber-100 focus:outline-none focus:ring-1 focus:ring-amber-300" placeholder="Ej: Pogona vitticeps" />
                  </div>
                  <div>
                    <label className="text-[11px] text-amber-500 font-bold mb-1 block uppercase">Tiempo Tenencia</label>
                    <input type="text" value={tiempoTenencia} onChange={(e) => setTiempoTenencia(e.target.value)} className="w-full h-10 bg-amber-50/50 rounded-lg px-4 text-amber-800 text-sm border border-amber-100 placeholder:text-amber-300" placeholder="Ej: 2 años" />
                  </div>
                  <div>
                    <label className="text-[11px] text-amber-500 font-bold mb-1 block uppercase flex items-center gap-1.5"><Apple className="w-3 h-3" /> Dieta Principal</label>
                    <input type="text" value={dieta} onChange={(e) => setDieta(e.target.value)} className="w-full h-10 bg-amber-50/50 rounded-lg px-4 text-amber-800 text-sm border border-amber-100" placeholder="Insectos, frutas, etc" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[11px] text-amber-500 font-bold mb-1 block uppercase flex items-center gap-1.5"><Home className="w-3 h-3" /> Hábitat / Terrario</label>
                    <textarea value={habitat} onChange={(e) => setHabitat(e.target.value)} rows={2} className="w-full bg-amber-50/50 rounded-lg p-3 text-amber-800 text-sm border border-amber-100 focus:outline-none" placeholder="Dimensiones y parámetros" />
                  </div>
               </div>
            </motion.div>
          )}

          <button type="submit" disabled={enviando} className={`w-full rounded-2xl text-white font-medium text-[16px] h-14 mt-6 shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 ${editandoId ? 'bg-gradient-to-r from-blue-400 to-indigo-400 shadow-blue-200' : 'bg-gradient-to-r from-[#8DAA68] to-[#6b844b] shadow-[0_8px_25px_rgba(141,170,104,0.2)]'}`}>
            {enviando ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : editandoId ? "Guardar Cambios" : "Completar Registro"}
          </button>
        </form>
      </ModalBase>

      {/* MODAL HISTORIA CLINICA */}
      <MedicalRecordModal paciente={verHistorialPaciente} onClose={() => setVerHistorialPaciente(null)} />

      {/* MODAL CONSULTA RÁPIDA / WALK-IN */}
      <ModalBase
        open={!!pacienteWalkIn}
        onClose={() => {
          setPacienteWalkIn(null);
          setNotasWalkIn(""); setTipoConsultaWalkIn("");
          setDiagnosticoWalkIn(""); setTratamientoWalkIn("");
          setObservacionesWalkIn(""); setRecomendacionesWalkIn("");
        }}
        maxWidth="max-w-2xl"
      >
        {/* Cabecera */}
        <div className="flex items-center gap-4 mb-7 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center shadow-sm">
            <Zap className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-[#3b3a62] font-medium text-xl">Consulta Sin Cita</h3>
            <p className="text-[13px] text-[#a0a0b2] font-light mt-0.5">
              Paciente: <span className="font-medium text-[#3b3a62]">{pacienteWalkIn?.nombre}</span> • {pacienteWalkIn?.dueno}
            </p>
          </div>
        </div>

        <div className="space-y-5 relative z-10 max-h-[70vh] overflow-y-auto pr-1 custom-scrollbar">
          {/* Tipo de consulta + Notas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] uppercase tracking-wider text-[#a0a0b2] font-bold mb-2 block ml-1">Tipo de Consulta</label>
              <input
                type="text"
                value={tipoConsultaWalkIn}
                onChange={(e) => setTipoConsultaWalkIn(e.target.value)}
                placeholder="Ej: Consulta general, urgencia..."
                className="w-full h-11 bg-slate-50 rounded-xl px-4 text-[#3b3a62] text-sm focus:ring-1 focus:ring-emerald-400/50 focus:outline-none border border-transparent focus:border-emerald-200 transition-all"
              />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-[#a0a0b2] font-bold mb-2 block ml-1">Motivo / Notas</label>
              <input
                type="text"
                value={notasWalkIn}
                onChange={(e) => setNotasWalkIn(e.target.value)}
                placeholder="Ej: Llegó con vómitos..."
                className="w-full h-11 bg-slate-50 rounded-xl px-4 text-[#3b3a62] text-sm focus:ring-1 focus:ring-emerald-400/50 focus:outline-none border border-transparent focus:border-emerald-200 transition-all"
              />
            </div>
          </div>

          {/* Procedimiento Realizado */}
          <div className="p-5 bg-teal-50/40 border border-teal-100/60 rounded-[20px]">
            <p className="text-[11px] text-teal-600 font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
              <Stethoscope className="w-4 h-4" /> Procedimiento Realizado
            </p>
            <textarea
              value={diagnosticoWalkIn}
              onChange={(e) => setDiagnosticoWalkIn(e.target.value)}
              rows={3}
              placeholder="Describe el procedimiento realizado..."
              className="w-full bg-white border border-teal-200 rounded-xl p-3 text-[#414066] text-[14px] leading-relaxed focus:outline-none focus:ring-2 focus:ring-teal-300 resize-none"
            />
          </div>

          {/* Tratamiento / Receta */}
          <div className="p-5 bg-emerald-50/40 border border-emerald-100/60 rounded-[20px]">
            <p className="text-[11px] text-emerald-600 font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" /> Tratamiento / Receta
            </p>
            <textarea
              value={tratamientoWalkIn}
              onChange={(e) => setTratamientoWalkIn(e.target.value)}
              rows={3}
              placeholder="Describe el tratamiento o receta médica..."
              className="w-full bg-white border border-emerald-200 rounded-xl p-3 text-[#414066] text-[14px] leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-300 resize-none"
            />
          </div>

          {/* Observaciones y Recomendaciones */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 bg-[#fff8f3]/60 border border-orange-100/60 rounded-[20px]">
              <p className="text-[11px] text-orange-500 font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Observaciones
              </p>
              <textarea
                value={observacionesWalkIn}
                onChange={(e) => setObservacionesWalkIn(e.target.value)}
                rows={3}
                placeholder="Observaciones relevantes..."
                className="w-full bg-white border border-orange-200 rounded-xl p-3 text-[#59587a] text-[13px] leading-relaxed focus:outline-none focus:ring-2 focus:ring-orange-200 resize-none"
              />
            </div>
            <div className="p-5 bg-blue-50/40 border border-blue-100/60 rounded-[20px]">
              <p className="text-[11px] text-blue-500 font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                <Info className="w-4 h-4" /> Recomendaciones
              </p>
              <textarea
                value={recomendacionesWalkIn}
                onChange={(e) => setRecomendacionesWalkIn(e.target.value)}
                rows={3}
                placeholder="Recomendaciones para el dueño..."
                className="w-full bg-white border border-blue-200 rounded-xl p-3 text-[#59587a] text-[13px] leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none"
              />
            </div>
          </div>

          {/* Botón guardar */}
          <button
            onClick={confirmarConsultaRapida}
            disabled={iniciandoConsulta}
            className="w-full h-14 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold text-[15px] rounded-2xl shadow-[0_8px_25px_rgba(16,185,129,0.25)] hover:shadow-[0_12px_30px_rgba(16,185,129,0.35)] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {iniciandoConsulta
              ? <Loader2 className="w-5 h-5 animate-spin" />
              : <><Zap className="w-5 h-5" /> Guardar Consulta</>
            }
          </button>
        </div>
      </ModalBase>

      {/* MODAL ELIMINAR PACIENTE */}
      <ConfirmDialog
        open={!!pacienteAEliminar}
        onClose={() => setPacienteAEliminar(null)}
        onConfirm={eliminarPaciente}
        icon={<Trash2 className="w-8 h-8 text-rose-500" />}
        title="¿Eliminar Registro?"
        message={<>Estás a punto de borrar definitivamente la ficha de <strong className="font-medium text-[#fc855f]">{pacienteAEliminar?.nombre}</strong>. Se perderá todo su historial médico.</>}
        confirmText="Eliminar de por vida"
        cancelText="Conservar"
        confirmColor="rose"
      />
    </>
  );
}