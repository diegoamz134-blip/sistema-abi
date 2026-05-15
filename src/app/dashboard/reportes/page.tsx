"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { BarChart3, TrendingUp, PawPrint, Stethoscope, Users, CalendarCheck } from "lucide-react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetchers";
import Skeleton from "@/components/Skeleton";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import type { Cita, Paciente } from "@/types";

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

const COLORES_ESPECIE = ['#8DAA68', '#F28C73', '#6d8bc4', '#e2a44d', '#c46d9a'];
const COLORES_ESTADO = { Completada: '#10b981', Pendiente: '#f59e0b', Cancelada: '#f43f5e' };

// Custom tooltip elegante
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-[#f0ece1] rounded-2xl px-4 py-3 shadow-lg text-sm">
        <p className="font-semibold text-[#2D3339] mb-1">{label}</p>
        {payload.map((entry: any, i: number) => (
          <p key={i} style={{ color: entry.color }} className="font-medium">
            {entry.name}: <span className="text-[#2D3339]">{entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function ReportesPage() {
  const { data: citasData, isLoading: citasLoading } = useSWR(CITAS_KEY, fetcher);
  const { data: pacientesData, isLoading: pacientesLoading } = useSWR(PACIENTES_KEY, fetcher);

  const citas = (citasData || []) as Cita[];
  const pacientes = (pacientesData || []) as Paciente[];
  const cargando = citasLoading || pacientesLoading;

  // ── Citas por mes (últimos 6 meses) ──
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

  // ── Pacientes nuevos por mes ──
  const pacientesPorMes = useMemo(() =>
    MESES_6.map(({ label, key }) => ({
      name: label,
      nuevos: pacientes.filter(p => p.created_at?.startsWith(key)).length,
    })), [pacientes]);

  // ── Distribución por especie ──
  const especieConteo = useMemo(() => {
    const mapa: Record<string, number> = {};
    pacientes.forEach(p => {
      mapa[p.especie] = (mapa[p.especie] || 0) + 1;
    });
    return Object.entries(mapa).map(([name, value]) => ({ name, value }));
  }, [pacientes]);

  // ── Top motivos de consulta ──
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

  // ── KPIs ──
  const kpis = useMemo(() => ({
    totalCitas: citas.length,
    completadas: citas.filter(c => c.estado === 'Completada').length,
    canceladas: citas.filter(c => c.estado === 'Cancelada').length,
    tasaExito: citas.length > 0 ? Math.round((citas.filter(c => c.estado === 'Completada').length / citas.length) * 100) : 0,
    totalPacientes: pacientes.length,
    exoticos: pacientes.filter(p => p.especie === 'Exótico').length,
  }), [citas, pacientes]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7 }}
      className="max-w-[1400px] mx-auto space-y-8 pb-16"
    >
      {/* Header */}
      <div>
        <h2 className="text-[#3b3a62] font-light text-3xl tracking-wide flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-[var(--color-primary)]" />
          Reportes & Estadísticas
        </h2>
        <p className="text-[#a0a0b2] font-light mt-2 text-[15px]">
          Análisis de los últimos 6 meses — datos en tiempo real.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total Citas', value: kpis.totalCitas, icon: <CalendarCheck className="w-5 h-5" />, color: 'text-[var(--color-primary)]', bg: 'bg-[var(--color-primary-light)]' },
          { label: 'Completadas', value: kpis.completadas, icon: <Stethoscope className="w-5 h-5" />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Canceladas', value: kpis.canceladas, icon: <TrendingUp className="w-5 h-5 rotate-180" />, color: 'text-rose-500', bg: 'bg-rose-50' },
          { label: 'Tasa Éxito', value: `${kpis.tasaExito}%`, icon: <TrendingUp className="w-5 h-5" />, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Pacientes', value: kpis.totalPacientes, icon: <Users className="w-5 h-5" />, color: 'text-violet-600', bg: 'bg-violet-50' },
          { label: 'Exóticos', value: kpis.exoticos, icon: <PawPrint className="w-5 h-5" />, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map((kpi, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="bg-white rounded-2xl p-5 border border-[#f0ece1] shadow-sm flex flex-col gap-3"
          >
            <div className={`w-10 h-10 rounded-xl ${kpi.bg} flex items-center justify-center ${kpi.color}`}>
              {kpi.icon}
            </div>
            <div>
              {cargando
                ? <Skeleton className="h-7 w-12 rounded-lg mb-1" />
                : <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
              }
              <p className="text-[11px] text-[#A0AAB2] font-medium uppercase tracking-wide mt-0.5">{kpi.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Fila 1: Citas por mes + Pacientes nuevos por mes */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Citas por mes */}
        <div className="bg-white rounded-[1.5rem] p-6 md:p-8 border border-[#f0ece1] shadow-sm">
          <h3 className="text-[#2D3339] font-medium text-lg mb-1">Citas por Mes</h3>
          <p className="text-[#A0AAB2] text-sm mb-6">Desglose por estado en los últimos 6 meses</p>
          {cargando ? <Skeleton className="h-[240px] w-full rounded-xl" /> : (
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
          {cargando ? <Skeleton className="h-[240px] w-full rounded-xl" /> : (
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

      {/* Fila 2: Distribución por especie + Top motivos */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Distribución por especie */}
        <div className="bg-white rounded-[1.5rem] p-6 md:p-8 border border-[#f0ece1] shadow-sm">
          <h3 className="text-[#2D3339] font-medium text-lg mb-1">Distribución por Especie</h3>
          <p className="text-[#A0AAB2] text-sm mb-6">Composición de la base de pacientes</p>
          {cargando ? <Skeleton className="h-[240px] w-full rounded-xl" /> : especieConteo.length === 0 ? (
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
          {cargando ? <Skeleton className="h-[240px] w-full rounded-xl" /> : topMotivos.length === 0 ? (
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
  );
}
