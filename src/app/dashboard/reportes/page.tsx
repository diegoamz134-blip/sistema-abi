"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, TrendingUp, PawPrint, Stethoscope, Users, CalendarCheck, Wallet, Package, CreditCard, Banknote } from "lucide-react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetchers";
import Skeleton from "@/components/Skeleton";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import type { Cita, Paciente, Venta, VentaDetalle } from "@/types";

// Últimos 6 meses
function getUltimos6Meses() {
  const meses: { label: string; key: string }[] = [];
  const hoy = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('es-PE', { month: 'short', year: '2-digit' });
    meses.push({ label: label.charAt(0).toUpperCase() + label.slice(1), key });
  }
  return meses;
}

const MESES_6 = getUltimos6Meses();
const FECHA_6_MESES = `${MESES_6[0].key}-01`;

const CITAS_KEY = `citas:{"gte":["fecha","${FECHA_6_MESES}"],"order":["fecha",{"ascending":true}]}`;
const PACIENTES_KEY = 'pacientes:{"order":["created_at",{"ascending":true}]}';
const VENTAS_KEY = `ventas:{"gte":["fecha","${FECHA_6_MESES}"],"order":["fecha",{"ascending":true}]}`;
const DETALLES_KEY = 'venta_detalles:{}';

const COLORES_ESPECIE = ['#8DAA68', '#F28C73', '#6d8bc4', '#e2a44d', '#c46d9a'];
const COLORES_FINANZAS = ['#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899'];

// Custom tooltip elegante
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-[#f0ece1] rounded-2xl px-4 py-3 shadow-lg text-sm">
        <p className="font-semibold text-[#2D3339] mb-1">{label}</p>
        {payload.map((entry: any, i: number) => (
          <p key={i} style={{ color: entry.color }} className="font-medium">
            {entry.name}: <span className="text-[#2D3339]">{entry.name.includes("Ingreso") || entry.name.includes("Total") || entry.name.includes("Facturado") || entry.name.includes("Ganancia") || entry.name.includes("Ganancias") ? `S/ ${Number(entry.value).toFixed(2)}` : entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function ReportesPage() {
  const [tabActiva, setTabActiva] = useState<"clinicos" | "finanzas">("clinicos");

  // Fetching de datos
  const { data: citasData, isLoading: citasLoading } = useSWR(CITAS_KEY, fetcher);
  const { data: pacientesData, isLoading: pacientesLoading } = useSWR(PACIENTES_KEY, fetcher);
  const { data: ventasData, isLoading: ventasLoading } = useSWR(VENTAS_KEY, fetcher);
  const { data: detallesData, isLoading: detallesLoading } = useSWR(DETALLES_KEY, fetcher);

  const citas = (citasData || []) as Cita[];
  const pacientes = (pacientesData || []) as Paciente[];
  const ventas = (ventasData || []) as Venta[];
  const detalles = (detallesData || []) as VentaDetalle[];

  const cargandoClinicos = citasLoading || pacientesLoading;
  const cargandoFinanzas = ventasLoading || detallesLoading;

  // ── MÓDULO CLÍNICO ──
  const citasPorMes = useMemo(() =>
    MESES_6.map(({ label, key }) => {
      const del_mes = citas.filter(c => c.fecha?.startsWith(key));
      return {
        name: label,
        total: del_mes.length,
        completadas: del_mes.filter(c => c.estado === 'Completada').length,
        canceladas: del_mes.filter(c => c.estado === 'Cancelada').length,
      };
    }), [citas]);

  const pacientesPorMes = useMemo(() =>
    MESES_6.map(({ label, key }) => ({
      name: label,
      nuevos: pacientes.filter(p => p.created_at?.startsWith(key)).length,
    })), [pacientes]);

  const especieConteo = useMemo(() => {
    const mapa: Record<string, number> = {};
    pacientes.forEach(p => {
      mapa[p.especie] = (mapa[p.especie] || 0) + 1;
    });
    return Object.entries(mapa).map(([name, value]) => ({ name, value }));
  }, [pacientes]);

  const topMotivos = useMemo(() => {
    const mapa: Record<string, number> = {};
    citas.forEach(c => {
      if (c.tipo) mapa[c.tipo] = (mapa[c.tipo] || 0) + 1;
    });
    return Object.entries(mapa)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value]) => ({ name: name.length > 20 ? name.slice(0, 18) + '…' : name, value }));
  }, [citas]);

  const kpisClinicos = useMemo(() => ({
    totalCitas: citas.length,
    completadas: citas.filter(c => c.estado === 'Completada').length,
    canceladas: citas.filter(c => c.estado === 'Cancelada').length,
    tasaExito: citas.length > 0 ? Math.round((citas.filter(c => c.estado === 'Completada').length / citas.length) * 100) : 0,
    totalPacientes: pacientes.length,
    exoticos: pacientes.filter(p => p.especie === 'Exótico').length,
  }), [citas, pacientes]);

  // ── MÓDULO FINANCIERO ──
  const kpisFinanzas = useMemo(() => {
    const total = ventas.reduce((sum, v) => sum + (Number(v.total) || 0), 0);
    
    // Separamos detalles filtrando por la existencia de venta relacionada en el periodo
    const idsVentasPeriodo = new Set(ventas.map(v => v.id));
    const detallesPeriodo = detalles.filter(d => idsVentasPeriodo.has(d.venta_id));

    let totalServicios = 0;
    let totalProductos = 0;
    let totalCosto = 0;

    detallesPeriodo.forEach(d => {
      const costo = (Number(d.precio_compra) || 0) * (Number(d.cantidad) || 0);
      totalCosto += costo;
      if (d.articulo_id) {
        totalProductos += (Number(d.subtotal) || 0);
      } else {
        totalServicios += (Number(d.subtotal) || 0);
      }
    });

    const gananciaNeta = total - totalCosto;
    const ticketPromedio = ventas.length > 0 ? (total / ventas.length) : 0;

    return {
      total,
      totalServicios,
      totalProductos,
      totalCosto,
      gananciaNeta,
      ticketPromedio,
      cantidadVentas: ventas.length
    };
  }, [ventas, detalles]);

  const ingresosPorMes = useMemo(() =>
    MESES_6.map(({ label, key }) => {
      const del_mes = ventas.filter(v => v.fecha?.startsWith(key));
      const total = del_mes.reduce((sum, v) => sum + (Number(v.total) || 0), 0);
      
      const idsDelMes = new Set(del_mes.map(v => v.id));
      const detallesDelMes = detalles.filter(d => idsDelMes.has(d.venta_id));
      const costoDelMes = detallesDelMes.reduce((sum, d) => sum + ((Number(d.precio_compra) || 0) * (Number(d.cantidad) || 0)), 0);
      const ganancia = total - costoDelMes;

      return {
        name: label,
        Ingresos: total,
        Ganancias: ganancia,
      };
    }), [ventas, detalles]);

  const distribucionConcepto = useMemo(() => {
    return [
      { name: "Servicios", value: kpisFinanzas.totalServicios },
      { name: "Productos", value: kpisFinanzas.totalProductos },
    ].filter(item => item.value > 0);
  }, [kpisFinanzas]);

  const metodosPagoData = useMemo(() => {
    const mapa: Record<string, number> = {};
    ventas.forEach(v => {
      const mp = v.metodo_pago || "Efectivo";
      mapa[mp] = (mapa[mp] || 0) + (Number(v.total) || 0);
    });
    return Object.entries(mapa).map(([name, value]) => ({ name, value }));
  }, [ventas]);

  const topVentasArticulos = useMemo(() => {
    const idsVentasPeriodo = new Set(ventas.map(v => v.id));
    const detallesPeriodo = detalles.filter(d => idsVentasPeriodo.has(d.venta_id));

    const mapa: Record<string, number> = {};
    detallesPeriodo.forEach(d => {
      const ganancia = (Number(d.subtotal) || 0) - ((Number(d.precio_compra) || 0) * (Number(d.cantidad) || 0));
      mapa[d.concepto] = (mapa[d.concepto] || 0) + ganancia;
    });
    return Object.entries(mapa)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => ({ name: name.length > 15 ? name.slice(0, 13) + '…' : name, value }));
  }, [ventas, detalles]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7 }}
      className="max-w-[1400px] mx-auto space-y-8 pb-16"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-[#3b3a62] font-light text-3xl tracking-wide flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-[var(--color-primary)]" />
            Reportes & Inteligencia
          </h2>
          <p className="text-[#a0a0b2] font-light mt-2 text-[15px]">
            Visualiza el estado clínico y el rendimiento financiero de tu clínica en tiempo real.
          </p>
        </div>

        {/* Tabs de navegación */}
        <div className="flex bg-white border border-[#f0ece1] p-1.5 rounded-2xl shadow-sm shrink-0 self-start md:self-center">
          <button
            onClick={() => setTabActiva("clinicos")}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 cursor-pointer ${
              tabActiva === "clinicos"
                ? "bg-[var(--color-primary)] text-white shadow-sm"
                : "text-[#8591A0] hover:text-[#2D3339]"
            }`}
          >
            <Stethoscope size={16} />
            Clínica
          </button>
          <button
            onClick={() => setTabActiva("finanzas")}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 cursor-pointer ${
              tabActiva === "finanzas"
                ? "bg-[var(--color-primary)] text-white shadow-sm"
                : "text-[#8591A0] hover:text-[#2D3339]"
            }`}
          >
            <Wallet size={16} />
            Finanzas
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {tabActiva === "clinicos" ? (
          <motion.div
            key="clinicos"
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 15 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            {/* KPIs Clínicos */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { label: 'Total Citas', value: kpisClinicos.totalCitas, icon: <CalendarCheck className="w-5 h-5" />, color: 'text-[var(--color-primary)]', bg: 'bg-[var(--color-primary-light)]' },
                { label: 'Completadas', value: kpisClinicos.completadas, icon: <Stethoscope className="w-5 h-5" />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'Canceladas', value: kpisClinicos.canceladas, icon: <TrendingUp className="w-5 h-5 rotate-180" />, color: 'text-rose-500', bg: 'bg-rose-50' },
                { label: 'Tasa Éxito', value: `${kpisClinicos.tasaExito}%`, icon: <TrendingUp className="w-5 h-5" />, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Pacientes', value: kpisClinicos.totalPacientes, icon: <Users className="w-5 h-5" />, color: 'text-violet-600', bg: 'bg-violet-50' },
                { label: 'Exóticos', value: kpisClinicos.exoticos, icon: <PawPrint className="w-5 h-5" />, color: 'text-amber-600', bg: 'bg-amber-50' },
              ].map((kpi, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl p-5 border border-[#f0ece1] shadow-sm flex flex-col gap-3"
                >
                  <div className={`w-10 h-10 rounded-xl ${kpi.bg} flex items-center justify-center ${kpi.color}`}>
                    {kpi.icon}
                  </div>
                  <div>
                    {cargandoClinicos
                      ? <Skeleton className="h-7 w-12 rounded-lg mb-1" />
                      : <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
                    }
                    <p className="text-[11px] text-[#A0AAB2] font-medium uppercase tracking-wide mt-0.5">{kpi.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Fila 1 Clínicos */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Citas por mes */}
              <div className="bg-white rounded-[1.5rem] p-6 md:p-8 border border-[#f0ece1] shadow-sm">
                <h3 className="text-[#2D3339] font-medium text-lg mb-1">Citas por Mes</h3>
                <p className="text-[#A0AAB2] text-sm mb-6">Desglose por estado en los últimos 6 meses</p>
                {cargandoClinicos ? <Skeleton className="h-[240px] w-full rounded-xl" /> : (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={citasPorMes} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0ece1" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#A0AAB2', fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#A0AAB2', fontSize: 12 }} allowDecimals={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 12, color: '#A0AAB2', paddingTop: 12 }} />
                      <Bar dataKey="completadas" name="Completadas" fill="#10b981" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="canceladas" name="Canceladas" fill="#f43f5e" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Pacientes nuevos por mes */}
              <div className="bg-white rounded-[1.5rem] p-6 md:p-8 border border-[#f0ece1] shadow-sm">
                <h3 className="text-[#2D3339] font-medium text-lg mb-1">Nuevos Pacientes</h3>
                <p className="text-[#A0AAB2] text-sm mb-6">Registros por mes en los últimos 6 meses</p>
                {cargandoClinicos ? <Skeleton className="h-[240px] w-full rounded-xl" /> : (
                  <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={pacientesPorMes} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gradPacientes" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8DAA68" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#8DAA68" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0ece1" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#A0AAB2', fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#A0AAB2', fontSize: 12 }} allowDecimals={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="nuevos" name="Nuevos" stroke="#8DAA68" strokeWidth={3} fill="url(#gradPacientes)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Fila 2 Clínicos */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Distribución por especie */}
              <div className="bg-white rounded-[1.5rem] p-6 md:p-8 border border-[#f0ece1] shadow-sm">
                <h3 className="text-[#2D3339] font-medium text-lg mb-1">Distribución por Especie</h3>
                <p className="text-[#A0AAB2] text-sm mb-6">Composición de la base de pacientes</p>
                {cargandoClinicos ? <Skeleton className="h-[240px] w-full rounded-xl" /> : especieConteo.length === 0 ? (
                  <div className="flex items-center justify-center h-[240px] text-[#A0AAB2] text-sm">Sin datos suficientes</div>
                ) : (
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={especieConteo} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                          {especieConteo.map((_, i) => (
                            <Cell key={i} fill={COLORES_ESPECIE[i % COLORES_ESPECIE.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-col gap-2 shrink-0">
                      {especieConteo.map((entry, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORES_ESPECIE[i % COLORES_ESPECIE.length] }} />
                          <span className="text-[#2D3339] font-medium">{entry.name}</span>
                          <span className="text-[#A0AAB2]">({entry.value})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Top motivos de consulta */}
              <div className="bg-white rounded-[1.5rem] p-6 md:p-8 border border-[#f0ece1] shadow-sm">
                <h3 className="text-[#2D3339] font-medium text-lg mb-1">Top Motivos de Consulta</h3>
                <p className="text-[#A0AAB2] text-sm mb-6">Los 6 motivos más frecuentes en el período</p>
                {cargandoClinicos ? <Skeleton className="h-[240px] w-full rounded-xl" /> : topMotivos.length === 0 ? (
                  <div className="flex items-center justify-center h-[240px] text-[#A0AAB2] text-sm">Sin datos suficientes</div>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={topMotivos} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0ece1" />
                      <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#A0AAB2', fontSize: 11 }} allowDecimals={false} />
                      <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#2D3339', fontSize: 12 }} width={110} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" name="Consultas" fill="var(--color-primary)" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="finanzas"
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            {/* KPIs Financieros */}
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { label: 'Ingresos Totales', value: `S/ ${kpisFinanzas.total.toFixed(2)}`, icon: <Wallet className="w-5 h-5" />, color: 'text-[#3b82f6]', bg: 'bg-blue-50' },
                { label: 'Ganancia Neta', value: `S/ ${kpisFinanzas.gananciaNeta.toFixed(2)}`, icon: <TrendingUp className="w-5 h-5" />, color: 'text-[#10b981]', bg: 'bg-emerald-50' },
                { label: 'Ingreso Servicios', value: `S/ ${kpisFinanzas.totalServicios.toFixed(2)}`, icon: <Stethoscope className="w-5 h-5" />, color: 'text-violet-600', bg: 'bg-violet-50' },
                { label: 'Ingreso Productos', value: `S/ ${kpisFinanzas.totalProductos.toFixed(2)}`, icon: <Package className="w-5 h-5" />, color: 'text-amber-600', bg: 'bg-amber-50' },
                { label: 'Ticket Promedio', value: `S/ ${kpisFinanzas.ticketPromedio.toFixed(2)}`, icon: <CreditCard className="w-5 h-5" />, color: 'text-pink-600', bg: 'bg-pink-50' },
                { label: 'Ventas Totales', value: kpisFinanzas.cantidadVentas, icon: <Banknote className="w-5 h-5" />, color: 'text-slate-600', bg: 'bg-slate-50' },
              ].map((kpi, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl p-5 border border-[#f0ece1] shadow-sm flex flex-col gap-3"
                >
                  <div className={`w-10 h-10 rounded-xl ${kpi.bg} flex items-center justify-center ${kpi.color}`}>
                    {kpi.icon}
                  </div>
                  <div>
                    {cargandoFinanzas
                      ? <Skeleton className="h-7 w-20 rounded-lg mb-1" />
                      : <p className={`text-lg font-black ${kpi.color}`}>{kpi.value}</p>
                    }
                    <p className="text-[11px] text-[#A0AAB2] font-medium uppercase tracking-wide mt-0.5">{kpi.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Fila 1 Finanzas */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Gráfico de ingresos y ganancias mensuales */}
              <div className="bg-white rounded-[1.5rem] p-6 md:p-8 border border-[#f0ece1] shadow-sm">
                <h3 className="text-[#2D3339] font-medium text-lg mb-1">Ingresos vs. Ganancias</h3>
                <p className="text-[#A0AAB2] text-sm mb-6">Comparativa de facturación bruta y ganancia neta</p>
                {cargandoFinanzas ? <Skeleton className="h-[240px] w-full rounded-xl" /> : (
                  <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={ingresosPorMes} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gradIngresos" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradGanancias" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0ece1" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#A0AAB2', fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#A0AAB2', fontSize: 12 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 12, color: '#A0AAB2', paddingTop: 12 }} />
                      <Area type="monotone" dataKey="Ingresos" name="Ingresos" stroke="#3b82f6" strokeWidth={2.5} fill="url(#gradIngresos)" />
                      <Area type="monotone" dataKey="Ganancias" name="Ganancia Neta" stroke="#10b981" strokeWidth={3} fill="url(#gradGanancias)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Gráfico de Servicios vs Productos (Dona) */}
              <div className="bg-white rounded-[1.5rem] p-6 md:p-8 border border-[#f0ece1] shadow-sm">
                <h3 className="text-[#2D3339] font-medium text-lg mb-1">Servicios vs. Productos</h3>
                <p className="text-[#A0AAB2] text-sm mb-6">Distribución del origen de tus ingresos</p>
                {cargandoFinanzas ? <Skeleton className="h-[240px] w-full rounded-xl" /> : distribucionConcepto.length === 0 ? (
                  <div className="flex items-center justify-center h-[240px] text-[#A0AAB2] text-sm">Sin datos de ventas registrados</div>
                ) : (
                  <div className="flex flex-col md:flex-row items-center justify-around gap-6">
                    <ResponsiveContainer width="60%" height={200}>
                      <PieChart>
                        <Pie data={distribucionConcepto} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={5} dataKey="value">
                          {distribucionConcepto.map((_, i) => (
                            <Cell key={i} fill={i === 0 ? "#3b82f6" : "#f59e0b"} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-col gap-3">
                      {distribucionConcepto.map((item, i) => (
                        <div key={i} className="flex items-center gap-2.5 text-sm">
                          <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: i === 0 ? "#3b82f6" : "#f59e0b" }} />
                          <div className="flex flex-col">
                            <span className="text-[#2D3339] font-semibold">{item.name}</span>
                            <span className="text-[#A0AAB2] text-xs">S/ {item.value.toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Fila 2 Finanzas */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Gráfico Métodos de Pago */}
              <div className="bg-white rounded-[1.5rem] p-6 md:p-8 border border-[#f0ece1] shadow-sm">
                <h3 className="text-[#2D3339] font-medium text-lg mb-1">Métodos de Pago</h3>
                <p className="text-[#A0AAB2] text-sm mb-6">Uso preferido de cobro por volumen de dinero</p>
                {cargandoFinanzas ? <Skeleton className="h-[240px] w-full rounded-xl" /> : metodosPagoData.length === 0 ? (
                  <div className="flex items-center justify-center h-[240px] text-[#A0AAB2] text-sm">Sin datos registrados</div>
                ) : (
                  <div className="flex flex-col md:flex-row items-center justify-around gap-6">
                    <ResponsiveContainer width="60%" height={200}>
                      <PieChart>
                        <Pie data={metodosPagoData} cx="50%" cy="50%" innerRadius={0} outerRadius={85} paddingAngle={2} dataKey="value">
                          {metodosPagoData.map((_, i) => (
                            <Cell key={i} fill={COLORES_FINANZAS[i % COLORES_FINANZAS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-col gap-2 shrink-0">
                      {metodosPagoData.map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: COLORES_FINANZAS[i % COLORES_FINANZAS.length]} } />
                          <span className="text-[#2D3339] font-medium">{item.name}</span>
                          <span className="text-[#A0AAB2]">({((item.value / kpisFinanzas.total) * 100).toFixed(0)}%)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Top Facturación de Artículos / Conceptos por Ganancia */}
              <div className="bg-white rounded-[1.5rem] p-6 md:p-8 border border-[#f0ece1] shadow-sm">
                <h3 className="text-[#2D3339] font-medium text-lg mb-1">Top Generadores de Ganancia</h3>
                <p className="text-[#A0AAB2] text-sm mb-6">Conceptos que más ganancia neta generaron</p>
                {cargandoFinanzas ? <Skeleton className="h-[240px] w-full rounded-xl" /> : topVentasArticulos.length === 0 ? (
                  <div className="flex items-center justify-center h-[240px] text-[#A0AAB2] text-sm">Sin datos registrados</div>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={topVentasArticulos} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0ece1" />
                      <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#A0AAB2', fontSize: 11 }} />
                      <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#2D3339', fontSize: 12 }} width={90} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" name="Ganancia" fill="#10b981" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
