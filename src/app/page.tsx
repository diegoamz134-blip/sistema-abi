"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Eye, EyeOff, Mail, Lock, PawPrint, ShieldCheck } from "lucide-react";
import { Toaster, toast } from "sonner";
import { useRouter } from "next/navigation";
import { signIn } from "@/app/actions/auth";

// Posiciones fijas para las huellas decorativas (evita hidration mismatch)
const HUELLAS = [
  { top: "6%",  left: "4%",  rotate: -20, size: 80,  opacity: 0.055 },
  { top: "18%", left: "88%", rotate: 35,  size: 60,  opacity: 0.04  },
  { top: "38%", left: "2%",  rotate: 10,  size: 50,  opacity: 0.03  },
  { top: "55%", left: "92%", rotate: -45, size: 90,  opacity: 0.05  },
  { top: "72%", left: "8%",  rotate: 25,  size: 70,  opacity: 0.045 },
  { top: "85%", left: "80%", rotate: -15, size: 55,  opacity: 0.035 },
  { top: "90%", left: "30%", rotate: 50,  size: 65,  opacity: 0.03  },
  { top: "12%", left: "55%", rotate: -30, size: 45,  opacity: 0.025 },
  { top: "62%", left: "50%", rotate: 15,  size: 100, opacity: 0.02  },
  { top: "45%", left: "75%", rotate: -5,  size: 40,  opacity: 0.03  },
];

// SVG de huella de patita
function HuellaSVG({ size, color = "#8DAA68" }: { size: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill={color}>
      {/* Almohadilla central */}
      <ellipse cx="50" cy="62" rx="22" ry="18" />
      {/* Dedos */}
      <ellipse cx="25" cy="35" rx="10" ry="13" transform="rotate(-15 25 35)" />
      <ellipse cx="40" cy="25" rx="9"  ry="12" transform="rotate(-5 40 25)"  />
      <ellipse cx="58" cy="25" rx="9"  ry="12" transform="rotate(5 58 25)"   />
      <ellipse cx="73" cy="35" rx="10" ry="13" transform="rotate(15 73 35)"  />
    </svg>
  );
}

export default function PaginaInicio() {
  const [cargando, setCargando]       = useState(false);
  const [email, setEmail]             = useState("");
  const [password, setPassword]       = useState("");
  const [mostrarPass, setMostrarPass] = useState(false);
  const [recordarme, setRecordarme]   = useState(false);
  const [emailFocus, setEmailFocus]   = useState(false);
  const [passFocus, setPassFocus]     = useState(false);
  const router = useRouter();

  useEffect(() => {
    const savedEmail = localStorage.getItem("dra_exotic_email");
    if (savedEmail) { setEmail(savedEmail); setRecordarme(true); }
  }, []);

  const procesarLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);
    const result = await signIn(formData);
    setCargando(false);

    if (!result?.success) {
      toast.error(result?.error || "Credenciales incorrectas. Verifica tus datos.", {
        position: "top-center",
        style: { borderRadius: "16px", padding: "14px 20px", fontSize: "14px", background: "#fff1f2", color: "#e11d48", border: "1px solid #fecdd3", fontWeight: 500 },
      });
      return;
    }

    if (recordarme) localStorage.setItem("dra_exotic_email", email);
    else            localStorage.removeItem("dra_exotic_email");
    localStorage.removeItem("dra_exotic_pass");

    toast.success("¡Bienvenida, Dra. Exotic! 🐾", {
      position: "top-center",
      style: { borderRadius: "16px", padding: "14px 20px", fontSize: "14px", background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", fontWeight: 500 },
    });
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 relative overflow-hidden">
      <Toaster />

      {/* ── Huellas decorativas de fondo ── */}
      {HUELLAS.map((h, i) => (
        <div
          key={i}
          className="absolute pointer-events-none select-none"
          style={{
            top: h.top,
            left: h.left,
            transform: `rotate(${h.rotate}deg)`,
            opacity: h.opacity,
          }}
        >
          <HuellaSVG size={h.size} />
        </div>
      ))}

      {/* Blob verde suave arriba izquierda */}
      <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-[#8DAA68]/8 rounded-full blur-[140px] pointer-events-none" />
      {/* Blob naranja suave abajo derecha */}
      <div className="absolute -bottom-32 -right-32 w-[400px] h-[400px] bg-[#F28C73]/8 rounded-full blur-[120px] pointer-events-none" />

      {/* ── Tarjeta principal ── */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0,  scale: 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative z-10 w-full max-w-[440px]"
      >
        {/* Card */}
        <div className="bg-white/90 backdrop-blur-md border border-[#f0ece1] rounded-[2rem] shadow-[0_24px_80px_rgba(141,170,104,0.12),0_8px_32px_rgba(0,0,0,0.04)] p-8 sm:p-10">

          {/* Logo + nombre */}
          <div className="flex flex-col items-center mb-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1,   opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5, type: "spring" }}
              className="w-20 h-20 rounded-[1.5rem] bg-gradient-to-br from-[#f4f7f0] to-[#e8f0e0] border border-[#dce8cc] shadow-sm flex items-center justify-center mb-5 overflow-hidden"
            >
              <img
                src="/icons/logo-transparent.png"
                alt="Logo Dra Exotic"
                className="w-16 h-16 object-contain"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="text-center"
            >
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-[#8DAA68] bg-[#f4f7f0] px-3 py-1 rounded-full border border-[#dce8cc] mb-3">
                <PawPrint className="w-3 h-3" /> Dra Exotic
              </span>
              <h1 className="text-[#2D3339] text-3xl sm:text-[2rem] font-bold tracking-tight leading-tight">
                Bienvenida de vuelta
              </h1>
              <p className="text-[#A0AAB2] text-[14px] mt-1.5">
                Ingresa tus credenciales para continuar
              </p>
            </motion.div>
          </div>

          {/* Formulario */}
          <form onSubmit={procesarLogin} className="space-y-4">

            {/* Email */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.45 }}
              className="space-y-1.5"
            >
              <label htmlFor="email" className="text-[11px] font-bold uppercase tracking-widest text-[#8591A0] block ml-1">
                Correo Electrónico
              </label>
              <div className={`relative flex items-center rounded-2xl border-2 transition-all duration-200 bg-[#FAFAF8] ${emailFocus ? "border-[#8DAA68] shadow-[0_0_0_4px_rgba(141,170,104,0.12)]" : "border-[#f0ece1] hover:border-[#c8ddb0]"}`}>
                <Mail className={`absolute left-4 w-[18px] h-[18px] shrink-0 transition-colors ${emailFocus ? "text-[#8DAA68]" : "text-[#C4C4D0]"}`} />
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setEmailFocus(true)}
                  onBlur={() => setEmailFocus(false)}
                  className="w-full h-[52px] bg-transparent pl-12 pr-12 text-[#2D3339] placeholder:text-[#C8C8D4] focus:outline-none text-[15px] font-medium rounded-2xl"
                  placeholder="tu@correo.com"
                />
                <AnimatePresence>
                  {email.includes("@") && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="absolute right-4 w-[22px] h-[22px] rounded-full bg-[#8DAA68] flex items-center justify-center shadow-sm"
                    >
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Contraseña */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.52 }}
              className="space-y-1.5"
            >
              <label htmlFor="password" className="text-[11px] font-bold uppercase tracking-widest text-[#8591A0] block ml-1">
                Contraseña
              </label>
              <div className={`relative flex items-center rounded-2xl border-2 transition-all duration-200 bg-[#FAFAF8] ${passFocus ? "border-[#8DAA68] shadow-[0_0_0_4px_rgba(141,170,104,0.12)]" : "border-[#f0ece1] hover:border-[#c8ddb0]"}`}>
                <Lock className={`absolute left-4 w-[18px] h-[18px] shrink-0 transition-colors ${passFocus ? "text-[#8DAA68]" : "text-[#C4C4D0]"}`} />
                <input
                  id="password"
                  type={mostrarPass ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setPassFocus(true)}
                  onBlur={() => setPassFocus(false)}
                  className="w-full h-[52px] bg-transparent pl-12 pr-14 text-[#2D3339] placeholder:text-[#C8C8D4] focus:outline-none text-[15px] font-medium rounded-2xl"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setMostrarPass(!mostrarPass)}
                  className="absolute right-4 text-[#C4C4D0] hover:text-[#8DAA68] transition-colors p-1 rounded-lg"
                >
                  {mostrarPass ? <EyeOff size={18} strokeWidth={2} /> : <Eye size={18} strokeWidth={2} />}
                </button>
              </div>
            </motion.div>

            {/* Recordarme */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.58 }}
              className="flex items-center pt-1"
            >
              <button
                type="button"
                onClick={() => setRecordarme(!recordarme)}
                className="flex items-center gap-2.5 group"
              >
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${recordarme ? "bg-[#8DAA68] border-[#8DAA68] shadow-sm" : "border-[#d0d5dc] hover:border-[#8DAA68] bg-white"}`}>
                  <AnimatePresence>
                    {recordarme && (
                      <motion.svg initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </motion.svg>
                    )}
                  </AnimatePresence>
                </div>
                <span className="text-[13px] text-[#8591A0] font-medium group-hover:text-[#2D3339] transition-colors select-none">
                  Recordar mi correo
                </span>
              </button>
            </motion.div>

            {/* Botón de ingreso */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.62 }}
              className="pt-2"
            >
              <button
                type="submit"
                disabled={cargando}
                className="group w-full h-[54px] rounded-2xl bg-gradient-to-r from-[#8DAA68] to-[#6b9e52] text-white font-semibold text-[15px] tracking-wide shadow-[0_8px_28px_rgba(141,170,104,0.35)] hover:shadow-[0_14px_36px_rgba(141,170,104,0.45)] hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2.5 overflow-hidden relative"
              >
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
                {cargando ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /><span>Verificando...</span></>
                ) : (
                  <><PawPrint className="w-5 h-5" /><span>Ingresar al Sistema</span></>
                )}
              </button>
            </motion.div>
          </form>

          {/* Divisor */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-[#f0ece1]" />
            <div className="flex items-center gap-1.5 text-[#C4C4D0]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#8DAA68]" />
              <span className="text-[11px] font-semibold uppercase tracking-widest">Acceso Seguro</span>
            </div>
            <div className="flex-1 h-px bg-[#f0ece1]" />
          </div>

          {/* Footer de la card */}
          <p className="text-center text-[12px] text-[#C4C4D0] font-medium">
            Solo personal autorizado de la clínica
          </p>
        </div>

        {/* Copyright debajo de la card */}
        <p className="text-center text-[11px] text-[#C8C8D4] mt-5">
          © 2025 Veterinaria Dra. Exotic · Todos los derechos reservados
        </p>
      </motion.div>
    </div>
  );
}
