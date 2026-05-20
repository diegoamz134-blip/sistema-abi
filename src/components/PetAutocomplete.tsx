"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PawPrint } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Paciente } from "@/types";

interface PetAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelectPet: (nombre: string, dueno: string, telefono: string, direccion: string) => void;
  placeholder?: string;
}

export default function PetAutocomplete({
  value,
  onChange,
  onSelectPet,
  placeholder = "Escribe para buscar mascota...",
}: PetAutocompleteProps) {
  const [sugerencias, setSugerencias] = useState<Pick<Paciente, 'id' | 'nombre' | 'dueno' | 'especie' | 'telefono' | 'direccion'>[]>([]);
  const [mostrar, setMostrar] = useState(false);

  const handleChange = async (val: string) => {
    onChange(val);
    if (!val || val.length < 2) {
      setSugerencias([]);
      setMostrar(false);
      return;
    }
    const { data } = await supabase
      .from("pacientes")
      .select("id, nombre, dueno, especie, telefono, direccion")
      .ilike("nombre", `%${val}%`)
      .limit(5);
    if (data && data.length > 0) {
      setSugerencias(data as Pick<Paciente, 'id' | 'nombre' | 'dueno' | 'especie' | 'telefono' | 'direccion'>[]);
      setMostrar(true);
    } else {
      setMostrar(false);
    }
  };

  const seleccionar = (p: Pick<Paciente, 'id' | 'nombre' | 'dueno' | 'especie' | 'telefono' | 'direccion'>) => {
    onSelectPet(p.nombre, p.dueno, p.telefono || '', p.direccion || '');
    setMostrar(false);
  };

  return (
    <div className="relative group overflow-visible">
      <input
        type="text"
        required
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => {
          if (sugerencias.length > 0) setMostrar(true);
        }}
        onBlur={() => setTimeout(() => setMostrar(false), 200)}
        className="w-full h-11 bg-transparent border-b border-[#eef2e8] focus:outline-none focus:border-[#8DAA68] transition-all text-[#8DAA68] placeholder:text-[#c4c4c4] font-medium text-[16px] pl-9"
        placeholder={placeholder}
        autoComplete="off"
      />
      <PawPrint className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8DAA68]/50" />

      <AnimatePresence>
        {mostrar && sugerencias.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="absolute top-12 left-0 w-full bg-white/95 backdrop-blur-xl rounded-xl shadow-[0_15px_40px_rgba(141,170,104,0.15)] border border-[#eef2e8] z-[120] overflow-hidden"
          >
            {sugerencias.map((p) => (
              <div
                key={p.id}
                onClick={() => seleccionar(p)}
                className="px-4 py-3 cursor-pointer hover:bg-[#f4f7f0]/80 border-b border-[#eef2e8]/50 last:border-0 flex items-center justify-between transition-colors"
              >
                <div>
                  <p className="text-[#3b3a62] text-[14px] font-medium leading-none mb-1.5">
                    {p.nombre}
                  </p>
                  <p className="text-[#a0a0b2] text-[11px] font-light leading-none">
                    Dueño: {p.dueno}
                  </p>
                </div>
                <span className="text-[10px] bg-[#8DAA68]/10 text-[#8DAA68] px-2 py-0.5 rounded-full font-medium">
                  {p.especie || "Mascota"}
                </span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
