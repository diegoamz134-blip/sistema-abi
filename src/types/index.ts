// ── Tipos Globales del Sistema Veterinario ──

export type EstadoCita = 'Pendiente' | 'Completada' | 'Cancelada';
export type EspecieAnimal = 'Perro' | 'Gato' | 'Ave' | 'Exótico';

export interface ArchivoAdjunto {
  url: string;
  nombre: string;
  tipo: string;
  key?: string;
}

export interface Paciente {
  id: string;
  numero_historial: string;
  nombre: string;
  especie: EspecieAnimal;
  raza?: string;
  dueno: string;
  telefono: string;
  direccion?: string;
  nombre_cientifico?: string;
  tiempo_tenencia?: string;
  dieta?: string;
  habitat?: string;
  foto_url?: string;
  fecha_nacimiento?: string;
  peso?: number;
  created_at: string;
}

export interface HistorialClinico {
  id: string;
  paciente_id: string;
  fecha: string;
  tipo: string;
  titulo: string;
  descripcion?: string;
  archivos?: ArchivoAdjunto[];
  veterinario?: string;
  created_at: string;
}

export interface Vacuna {
  id: string;
  paciente_id: string;
  tipo: string;
  nombre: string;
  fecha_aplicacion: string;
  proxima_dosis?: string;
  aplicado_por?: string;
  notas?: string;
  created_at: string;
}

export interface ArticuloInventario {
  id: string;
  nombre: string;
  categoria: string;
  cantidad: number;
  unidad_medida?: string;
  precio_venta?: number;
  stock_minimo: number;
  created_at: string;
}

export interface Cita {
  id: string;
  mascota: string;
  telefono?: string;
  direccion?: string;
  dueno: string;
  fecha: string;
  hora: string;
  tipo: string;
  notas?: string;
  estado: EstadoCita;
  diagnostico?: string;
  tratamiento?: string;
  observaciones?: string;
  recomendaciones?: string;
  archivos?: ArchivoAdjunto[];
  activa: boolean;
}

export interface Recordatorio {
  id: string;
  texto: string;
  completado: boolean;
  fecha: string;
}

export interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  trend: string;
  color: 'blue' | 'orange' | 'teal' | 'green';
}

export interface AppointmentItemProps {
  pet: string;
  owner: string;
  time: string;
  type: string;
  estado: EstadoCita;
}
