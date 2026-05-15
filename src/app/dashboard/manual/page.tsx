"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, PawPrint, Calendar, Users, Package, BarChart3,
  Clock, ChevronDown, ChevronRight, Search, Stethoscope,
  Syringe, FileText, Plus, Pencil, Trash2, Download,
  MessageCircle, AlertTriangle, CheckCircle2, Camera,
  Star, LayoutDashboard, LogOut, Bell, Filter
} from "lucide-react";

// ─── Tipos ────────────────────────────────────────────────
interface Paso {
  texto: string;
  tip?: string;
}

interface Seccion {
  id: string;
  titulo: string;
  icono: React.ReactNode;
  color: string;
  bg: string;
  border: string;
  descripcion: string;
  pasos: Paso[];
  advertencia?: string;
  consejo?: string;
}

// ─── Contenido del Manual ─────────────────────────────────
const SECCIONES: Seccion[] = [
  {
    id: "dashboard",
    titulo: "Panel Principal (Dashboard)",
    icono: <LayoutDashboard className="w-5 h-5" />,
    color: "text-[#F28C73]",
    bg: "bg-[#FFF0ED]",
    border: "border-[#FFD5C8]",
    descripcion: "El Dashboard es la pantalla principal. Aquí puedes ver de un vistazo todo lo importante de la clínica.",
    pasos: [
      { texto: "Al ingresar verás 3 tarjetas superiores: Total de Pacientes, Citas de Hoy y Consultas Completadas.", tip: "Estos números se actualizan en tiempo real." },
      { texto: "Si hay productos con poco stock, aparecerá una alerta roja en la parte superior. Haz clic en ella para ir directamente al inventario." },
      { texto: "El gráfico 'Actividad Semanal' muestra cuántas citas tuviste cada día de la última semana — la línea verde son las completadas.", tip: "Los datos son reales, no inventados." },
      { texto: "En 'Agenda de Hoy' ves todas las citas programadas para el día. Las completadas aparecen en verde, las canceladas en gris." },
      { texto: "El panel 'Tareas Pendientes' (estrella) sirve para apuntar recordatorios rápidos. Haz clic en el '+' para agregar uno nuevo.", tip: "Puedes hacer clic en el círculo para marcar una tarea como completada." },
    ],
    consejo: "Empieza siempre tu día revisando el Dashboard — te ahorrará tiempo y evitará olvidos.",
  },
  {
    id: "citas",
    titulo: "Agendar y Gestionar Citas",
    icono: <Clock className="w-5 h-5" />,
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    descripcion: "Aquí se administra toda la agenda de la clínica, organizada por fecha.",
    pasos: [
      { texto: "Ve a 'Lista de Citas' en el menú lateral izquierdo." },
      { texto: "Haz clic en el botón verde 'Agendar Turno' (esquina superior derecha) para crear una cita nueva." },
      { texto: "Completa los campos: nombre de la mascota, dueño, teléfono, fecha, hora y motivo de consulta.", tip: "El sistema sugerirá nombres de mascotas ya registradas automáticamente." },
      { texto: "Las citas aparecen organizadas en grupos: 'Hoy', 'Mañana', 'Próximos Días' e 'Historial Anterior'." },
      { texto: "Para buscar una cita, usa la barra de búsqueda — filtra por mascota, dueño o tipo de consulta en tiempo real." },
      { texto: "Al terminar una consulta, haz clic en el botón verde '✓ Completar' de la cita. Se abrirá el formulario de expediente clínico." },
      { texto: "Completa el diagnóstico, tratamiento, observaciones y recomendaciones. Luego guarda.", tip: "Desde el expediente puedes descargar la receta en PDF o enviarla por WhatsApp directamente." },
    ],
    advertencia: "Una vez que marcas una cita como 'Completada' o 'Cancelada', no se puede editar. Solo se puede eliminar.",
    consejo: "Usa el botón 'Editar' (ícono de lápiz) para corregir datos antes de completar la consulta.",
  },
  {
    id: "pacientes",
    titulo: "Registro de Pacientes",
    icono: <Users className="w-5 h-5" />,
    color: "text-[#8DAA68]",
    bg: "bg-[#f4f7f0]",
    border: "border-[#dce8cc]",
    descripcion: "El módulo de pacientes guarda la ficha completa de cada animal atendido en la clínica.",
    pasos: [
      { texto: "Ve a 'Pacientes' en el menú lateral." },
      { texto: "Haz clic en 'Nuevo Paciente' (botón verde arriba a la derecha)." },
      { texto: "Completa los datos básicos: nombre, especie, raza, dueño y teléfono.", tip: "Si la especie es 'Exótico', aparecerán campos adicionales como nombre científico, hábitat y dieta." },
      { texto: "Puedes agregar fecha de nacimiento (el sistema calculará la edad automáticamente) y el peso actual del animal.", tip: "El peso y la edad aparecen como badges de color en la tarjeta del paciente." },
      { texto: "Para subir una foto de la mascota: en el formulario hay una sección 'Foto de la Mascota'. Haz clic en 'Subir foto' y selecciona la imagen.", tip: "La imagen se comprime automáticamente antes de subirse." },
      { texto: "Usa la barra de búsqueda para encontrar pacientes por nombre, dueño o número de historial." },
      { texto: "Haz clic en el botón de historial clínico (ícono de ficha) en cualquier tarjeta para ver el expediente completo del animal." },
    ],
    consejo: "Cada paciente tiene su propio historial con línea de tiempo, vacunas y archivos adjuntos como radiografías.",
  },
  {
    id: "historial",
    titulo: "Historia Clínica y Vacunas",
    icono: <Stethoscope className="w-5 h-5" />,
    color: "text-teal-600",
    bg: "bg-teal-50",
    border: "border-teal-200",
    descripcion: "Cada paciente tiene un expediente digital completo con tres secciones.",
    pasos: [
      { texto: "En Pacientes, haz clic en el botón de historial (ícono de documento) en la tarjeta del animal que deseas ver." },
      { texto: "TAB 'Línea de Tiempo': muestra todas las consultas, vacunas y registros del paciente en orden cronológico.", tip: "Haz clic en cualquier consulta para ver los detalles completos: diagnóstico, tratamiento, etc." },
      { texto: "TAB 'Vacunas & Desparasitación': lista todas las vacunas aplicadas. Haz clic en 'Registrar' para agregar una nueva.", tip: "Si una vacuna está vencida (la próxima dosis ya pasó), aparecerá en rojo con un '(!)'." },
      { texto: "En el formulario de vacuna, completa: tipo (Vacuna / Desparasitación), nombre del producto, fecha de aplicación y fecha de la próxima dosis." },
      { texto: "TAB 'Archivos Adjuntos': aquí puedes subir radiografías, exámenes o cualquier documento. Haz clic en el área punteada o arrastra el archivo.", tip: "Se aceptan PDFs e imágenes. El archivo se guarda en la nube." },
    ],
    consejo: "Los registros de la línea de tiempo también incluyen automáticamente las citas completadas desde el módulo de Citas.",
  },
  {
    id: "pdf",
    titulo: "Generar Receta en PDF y WhatsApp",
    icono: <FileText className="w-5 h-5" />,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    descripcion: "Puedes generar recetas en PDF o enviarlas por WhatsApp directamente al dueño.",
    pasos: [
      { texto: "Ve a Pacientes → abre el historial de la mascota → en la Línea de Tiempo, haz clic en una consulta completada." },
      { texto: "Se abrirá el detalle de la consulta. Busca los botones en la parte superior derecha: 'PDF' y 'Enviar' (WhatsApp)." },
      { texto: "Haz clic en 'PDF' para descargar la receta en formato PDF con logo y datos de la clínica.", tip: "El PDF incluye: nombre del paciente, fecha, diagnóstico, tratamiento y observaciones." },
      { texto: "Haz clic en 'Enviar' para abrir WhatsApp con un mensaje ya redactado con el resumen de la consulta.", tip: "El número de teléfono del dueño se toma automáticamente del registro del paciente." },
    ],
    consejo: "Asegúrate de llenar bien el campo 'Tratamiento' al completar la cita — ese campo es el cuerpo de la receta.",
  },
  {
    id: "calendario",
    titulo: "Calendario de Citas",
    icono: <Calendar className="w-5 h-5" />,
    color: "text-violet-600",
    bg: "bg-violet-50",
    border: "border-violet-200",
    descripcion: "Vista mensual de todas las citas para una visión global de la agenda.",
    pasos: [
      { texto: "Ve a 'Calendario' en el menú lateral." },
      { texto: "Verás todos los días del mes con puntos de colores indicando citas: naranja (pendiente), verde (completada), rojo (cancelada)." },
      { texto: "Haz clic en cualquier día para ver qué citas están programadas en ese día." },
      { texto: "Usa las flechas '< >' para navegar entre meses.", tip: "El día de hoy siempre está resaltado con un círculo de color." },
    ],
    consejo: "El calendario es de solo lectura. Para crear o editar citas, usa 'Lista de Citas'.",
  },
  {
    id: "inventario",
    titulo: "Inventario de Productos",
    icono: <Package className="w-5 h-5" />,
    color: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-orange-200",
    descripcion: "Controla el stock de medicamentos, insumos y productos de la clínica.",
    pasos: [
      { texto: "Ve a 'Inventario' en el menú lateral." },
      { texto: "Haz clic en 'Agregar Producto' para registrar un nuevo artículo.", tip: "Los campos importantes son: nombre, categoría, cantidad actual y stock mínimo." },
      { texto: "El 'Stock Mínimo' es la cantidad crítica — cuando el stock baje a ese nivel, aparecerá una alerta roja en el Dashboard.", },
      { texto: "Para ajustar la cantidad de un producto (entrada o salida), haz clic en los botones '+' y '-' de la fila del producto." },
      { texto: "Usa la barra de búsqueda para filtrar por nombre o categoría." },
    ],
    advertencia: "Cuando el sistema detecte productos con stock crítico, verás una alerta en el Dashboard con los nombres. ¡No la ignores!",
    consejo: "Define bien el Stock Mínimo de cada producto — ese número es la clave para que las alertas funcionen correctamente.",
  },
  {
    id: "reportes",
    titulo: "Reportes y Estadísticas",
    icono: <BarChart3 className="w-5 h-5" />,
    color: "text-[#F28C73]",
    bg: "bg-[#FFF0ED]",
    border: "border-[#FFD5C8]",
    descripcion: "Visualiza el rendimiento de la clínica con gráficos en tiempo real de los últimos 6 meses.",
    pasos: [
      { texto: "Ve a 'Reportes' en el menú lateral." },
      { texto: "Las 6 tarjetas superiores muestran: total de citas, completadas, canceladas, tasa de éxito, pacientes y pacientes exóticos." },
      { texto: "'Citas por Mes': gráfico de barras con las citas completadas vs canceladas por mes." },
      { texto: "'Nuevos Pacientes': línea de tendencia de registros de nuevos pacientes mes a mes." },
      { texto: "'Distribución por Especie': gráfico circular con el porcentaje de perros, gatos, aves y exóticos." },
      { texto: "'Top Motivos de Consulta': los 6 motivos más frecuentes en el período seleccionado.", tip: "Útil para saber qué servicios tienen más demanda." },
    ],
    consejo: "Los reportes se actualizan automáticamente cada vez que entras a la página — siempre muestran datos reales.",
  },
  {
    id: "perfil",
    titulo: "Perfil y Configuración",
    icono: <Camera className="w-5 h-5" />,
    color: "text-pink-600",
    bg: "bg-pink-50",
    border: "border-pink-200",
    descripcion: "Personaliza tu perfil de administrador del sistema.",
    pasos: [
      { texto: "En el sidebar izquierdo, haz clic en tu foto de perfil o en las iniciales (parte inferior)." },
      { texto: "Para cambiar tu foto de perfil: haz clic en el ícono de cámara que aparece sobre la foto.", tip: "La imagen se sube automáticamente y se comprime para ahorrar espacio." },
      { texto: "Para cerrar sesión de forma segura: haz clic en 'Cerrar Sesión' al final del menú lateral.", tip: "Tu sesión se mantiene activa de forma segura aunque cierres el navegador." },
    ],
    consejo: "El sistema recuerda tu sesión de forma automática y segura. No necesitas escribir tu contraseña cada vez si activaste 'Recordar correo' al iniciar sesión.",
  },
];

// ─── Componente de sección ────────────────────────────────
function SeccionManual({ s, isOpen, onToggle }: { s: Seccion; isOpen: boolean; onToggle: () => void }) {
  return (
    <motion.div
      layout
      className={`rounded-2xl border-2 overflow-hidden transition-colors duration-200 ${isOpen ? s.border + " " + s.bg : "border-[#f0ece1] bg-white hover:border-[#e4ddd0]"}`}
    >
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-5 sm:p-6 text-left"
      >
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-xl ${s.bg} ${s.border} border flex items-center justify-center ${s.color} shrink-0 shadow-sm`}>
            {s.icono}
          </div>
          <div>
            <h3 className={`font-semibold text-[15px] sm:text-[16px] ${isOpen ? "text-[#2D3339]" : "text-[#3b3a62]"}`}>
              {s.titulo}
            </h3>
            {!isOpen && (
              <p className="text-[#A0AAB2] text-[12px] mt-0.5 hidden sm:block line-clamp-1">{s.descripcion}</p>
            )}
          </div>
        </div>
        <div className={`shrink-0 ml-4 transition-transform duration-300 ${isOpen ? "rotate-180" : ""} ${s.color}`}>
          <ChevronDown className="w-5 h-5" />
        </div>
      </button>

      {/* Contenido */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-5 sm:px-6 pb-6 space-y-5">
              {/* Descripción */}
              <p className="text-[#59587a] text-[14px] leading-relaxed border-l-4 pl-4 py-1 rounded-r-lg" style={{ borderColor: "currentColor" }}>
                {s.descripcion}
              </p>

              {/* Pasos */}
              <div className="space-y-3">
                {s.pasos.map((paso, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex gap-3"
                  >
                    <div className={`w-6 h-6 rounded-full ${s.bg} border ${s.border} flex items-center justify-center shrink-0 mt-0.5 shadow-sm`}>
                      <span className={`text-[11px] font-bold ${s.color}`}>{i + 1}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-[#2D3339] text-[14px] leading-relaxed">{paso.texto}</p>
                      {paso.tip && (
                        <div className="flex items-start gap-1.5 mt-1.5 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                          <Star className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" fill="currentColor" strokeWidth={0} />
                          <p className="text-amber-700 text-[12px] font-medium leading-relaxed">{paso.tip}</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Advertencia */}
              {s.advertencia && (
                <div className="flex items-start gap-3 bg-rose-50 border border-rose-200 rounded-2xl p-4">
                  <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  <p className="text-rose-700 text-[13px] font-medium leading-relaxed">{s.advertencia}</p>
                </div>
              )}

              {/* Consejo */}
              {s.consejo && (
                <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-emerald-700 text-[13px] font-medium leading-relaxed"><span className="font-bold">Consejo Profesional:</span> {s.consejo}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Página Principal del Manual ─────────────────────────
export default function ManualPage() {
  const [abiertos, setAbiertos] = useState<string[]>(["dashboard"]);
  const [busqueda, setBusqueda] = useState("");

  const toggleSeccion = (id: string) => {
    setAbiertos(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const abrirTodo = () => setAbiertos(SECCIONES.map(s => s.id));
  const cerrarTodo = () => setAbiertos([]);

  const seccionesFiltradas = SECCIONES.filter(s =>
    busqueda === "" ||
    s.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
    s.descripcion.toLowerCase().includes(busqueda.toLowerCase()) ||
    s.pasos.some(p => p.texto.toLowerCase().includes(busqueda.toLowerCase()))
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="max-w-[860px] mx-auto pb-20 space-y-8"
    >
      {/* ── Header ── */}
      <div className="relative bg-gradient-to-br from-[#2D3339] to-[#3b4349] rounded-[2rem] p-8 sm:p-10 overflow-hidden">
        {/* Huellas decorativas */}
        <div className="absolute top-4 right-6 opacity-[0.06] pointer-events-none">
          <svg width="120" height="120" viewBox="0 0 100 100" fill="white">
            <ellipse cx="50" cy="62" rx="22" ry="18" />
            <ellipse cx="25" cy="35" rx="10" ry="13" transform="rotate(-15 25 35)" />
            <ellipse cx="40" cy="25" rx="9" ry="12" transform="rotate(-5 40 25)" />
            <ellipse cx="58" cy="25" rx="9" ry="12" transform="rotate(5 58 25)" />
            <ellipse cx="73" cy="35" rx="10" ry="13" transform="rotate(15 73 35)" />
          </svg>
        </div>
        <div className="absolute bottom-2 left-10 opacity-[0.04] pointer-events-none">
          <svg width="80" height="80" viewBox="0 0 100 100" fill="white">
            <ellipse cx="50" cy="62" rx="22" ry="18" />
            <ellipse cx="25" cy="35" rx="10" ry="13" transform="rotate(-15 25 35)" />
            <ellipse cx="40" cy="25" rx="9" ry="12" transform="rotate(-5 40 25)" />
            <ellipse cx="58" cy="25" rx="9" ry="12" transform="rotate(5 58 25)" />
            <ellipse cx="73" cy="35" rx="10" ry="13" transform="rotate(15 73 35)" />
          </svg>
        </div>

        <div className="relative z-10 flex items-start gap-5">
          <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
            <BookOpen className="w-7 h-7 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#8DAA68] bg-[#8DAA68]/20 px-2.5 py-1 rounded-full border border-[#8DAA68]/30">
                Dra Exotic · Sistema
              </span>
            </div>
            <h1 className="text-white text-2xl sm:text-3xl font-bold tracking-tight mb-2">
              Manual de Uso del Sistema
            </h1>
            <p className="text-white/50 text-[14px] leading-relaxed max-w-lg">
              Guía completa y paso a paso de todas las funciones disponibles. Haz clic en cualquier sección para expandirla.
            </p>
          </div>
        </div>
      </div>

      {/* ── Acceso Rápido ── */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-[#A0AAB2] mb-3 ml-1">Ir directo a</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {SECCIONES.slice(0, 8).map(s => (
            <button
              key={s.id}
              onClick={() => {
                if (!abiertos.includes(s.id)) toggleSeccion(s.id);
                document.getElementById(`sec-${s.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl border-2 text-left transition-all hover:scale-[1.02] active:scale-[0.98] ${s.bg} ${s.border}`}
            >
              <span className={s.color}>{s.icono}</span>
              <span className={`text-[12px] font-semibold ${s.color} leading-tight`}>{s.titulo.split(" ").slice(0, 3).join(" ")}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Barra de búsqueda + controles ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A0AAB2]" />
          <input
            type="text"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar en el manual... (ej: 'receta', 'vacuna', 'stock')"
            className="w-full h-12 bg-white border-2 border-[#f0ece1] rounded-2xl pl-11 pr-4 text-[#2D3339] placeholder:text-[#C4C4D0] focus:outline-none focus:border-[#8DAA68] text-[14px] transition-all"
          />
        </div>
        <div className="flex gap-2">
          <button onClick={abrirTodo} className="px-4 py-2 rounded-xl bg-[#f4f7f0] text-[#8DAA68] text-[13px] font-semibold border border-[#dce8cc] hover:bg-[#e8f0e0] transition-colors whitespace-nowrap">
            Abrir todo
          </button>
          <button onClick={cerrarTodo} className="px-4 py-2 rounded-xl bg-white text-[#A0AAB2] text-[13px] font-semibold border border-[#f0ece1] hover:bg-slate-50 transition-colors whitespace-nowrap">
            Cerrar todo
          </button>
        </div>
      </div>

      {/* ── Secciones ── */}
      {busqueda && seccionesFiltradas.length === 0 ? (
        <div className="text-center py-16">
          <PawPrint className="w-12 h-12 text-[#f0ece1] mx-auto mb-3" />
          <p className="text-[#A0AAB2] font-medium">No encontramos resultados para "<span className="text-[#2D3339]">{busqueda}</span>"</p>
          <button onClick={() => setBusqueda("")} className="mt-3 text-[#8DAA68] text-sm font-semibold hover:underline">Limpiar búsqueda</button>
        </div>
      ) : (
        <div className="space-y-3">
          {seccionesFiltradas.map(s => (
            <div key={s.id} id={`sec-${s.id}`}>
              <SeccionManual s={s} isOpen={abiertos.includes(s.id)} onToggle={() => toggleSeccion(s.id)} />
            </div>
          ))}
        </div>
      )}

      {/* ── Footer ── */}
      <div className="bg-gradient-to-r from-[#f4f7f0] to-[#FFF0ED] border border-[#f0ece1] rounded-2xl p-6 text-center">
        <PawPrint className="w-8 h-8 text-[#8DAA68]/40 mx-auto mb-3" />
        <p className="text-[#2D3339] font-semibold text-[15px] mb-1">¿Necesitas más ayuda?</p>
        <p className="text-[#A0AAB2] text-[13px]">
          Si tienes dudas que no están en este manual, contacta al equipo técnico que configuró el sistema.
        </p>
      </div>
    </motion.div>
  );
}
