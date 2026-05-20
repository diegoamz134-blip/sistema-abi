"use client";

import { ReactNode, useState, useEffect, useRef } from "react";
import { PawPrint, Users, Calendar, Clock, LogOut, Menu, X, Camera, Package, BarChart3, BookOpen, Banknote } from "lucide-react";
import { Toaster } from "sonner";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, getUserProfile, updateProfileFoto } from "@/app/actions/auth";
import { supabase } from "@/lib/supabase";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [nombreDra, setNombreDra] = useState("Dra Exotic");
  const [greeting, setGreeting] = useState("¡Buenos días!");
  const [fotoPerfil, setFotoPerfil] = useState<string | null>(null);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    setMenuAbierto(false);
    const hours = new Date().getHours();
    if (hours >= 6 && hours < 12) setGreeting("¡Buenos días!");
    else if (hours >= 12 && hours < 19) setGreeting("¡Buenas tardes!");
    else setGreeting("¡Buenas noches!");

    async function loadUser() {
      try {
        const profile = await getUserProfile();
        if (profile?.user_metadata?.nombre_clinica) setNombreDra(profile.user_metadata.nombre_clinica);
        if (profile?.user_metadata?.foto_perfil) setFotoPerfil(profile.user_metadata.foto_perfil);
      } catch (e) { console.error("Error cargando perfil", e); }
    }
    loadUser();
  }, [pathname]);

  const iniciales = nombreDra ? nombreDra.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() : 'DR';

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
          const MAX_WIDTH = 400; // Avatar doesn't need to be huge
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

  const handleFotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setSubiendoFoto(true);
    try {
      // 1. Mostrar preview inmediato
      const reader = new FileReader();
      reader.onload = (ev) => { if (ev.target?.result) setFotoPerfil(ev.target.result as string); };
      reader.readAsDataURL(file);

      // 2. Comprimir la imagen
      const fotoComprimida = await comprimirImagen(file);

      // 3. Eliminar foto anterior si existe
      if (fotoPerfil && fotoPerfil.includes('supabase.co')) {
        try {
          // Extraer el nombre del archivo de la URL
          const urlParts = fotoPerfil.split('/');
          const fileName = urlParts[urlParts.length - 1];
          if (fileName) {
            await supabase.storage.from('historial').remove([fileName]);
          }
        } catch (err) {
          console.error("Error al borrar foto anterior", err);
        }
      }

      // 4. Subir la nueva foto
      const fileName = `avatar_${Date.now()}_${fotoComprimida.name.replace(/[^a-zA-Z0-9.\-_]/g, '')}`;
      const { data, error } = await supabase.storage.from('historial').upload(fileName, fotoComprimida);
      
      if (error) throw error;

      // Obtener URL pública
      const { data: publicData } = supabase.storage.from('historial').getPublicUrl(fileName);
      const publicUrl = publicData.publicUrl;

      // 5. Actualizar metadata del usuario
      const response = await updateProfileFoto(publicUrl);

      if (response?.error) throw new Error(response.error);

      setFotoPerfil(publicUrl);
    } catch (error) {
      console.error("Error procesando foto:", error);
    } finally {
      setSubiendoFoto(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex font-sans relative text-[var(--foreground)] w-full max-w-full overflow-x-hidden">
      {/* Overlay móvil */}
      {menuAbierto && (
        <div
          className="fixed inset-0 bg-black/10 backdrop-blur-sm z-[150] md:hidden"
          onClick={() => setMenuAbierto(false)}
        />
      )}

      {/* ─── SIDEBAR FLOTANTE ─── */}
      <aside className={`
        fixed z-[200] h-[calc(100vh-2rem)] my-4 ml-4
        w-[240px] flex flex-col
        bg-white
        rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)]
        border border-[#f0ece1]
        transition-transform duration-300 ease-in-out
        ${menuAbierto ? 'translate-x-0' : '-translate-x-[110%] md:translate-x-0'}
      `}>
        {/* Botón cerrar (móvil) */}
        <button onClick={() => setMenuAbierto(false)} className="absolute top-3 right-3 md:hidden text-slate-400 hover:bg-slate-100 p-1.5 rounded-lg">
          <X size={18} />
        </button>

        {/* ── Perfil / Logo ── */}
        <div className="pt-10 pb-6 px-5 flex flex-col items-center border-b border-[#f0ece1]/50">
          <div className="w-32 mb-2">
            <img src="/icons/logo-transparent.png" alt="Logo Veterinaria" className="w-full h-auto object-contain" />
          </div>

          <div className="flex items-center gap-2 mt-2 bg-[#F4F7F0] px-3 py-1.5 rounded-full border border-[#E2E8D8] shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#8DAA68] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#8DAA68]"></span>
            </span>
            <span className="text-[11px] text-[#2D3339] font-bold uppercase tracking-[0.1em]">Administrador</span>
          </div>
        </div>

        {/* ── Navegación ── */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <MenuLink href="/dashboard"            icon={<PawPrint size={18} strokeWidth={2} />} text="Dashboard" />
          <MenuLink href="/dashboard/calendario" icon={<Calendar  size={18} strokeWidth={2} />} text="Calendario" />
          <MenuLink href="/dashboard/citas"      icon={<Clock     size={18} strokeWidth={2} />} text="Lista de Citas" />
          <MenuLink href="/dashboard/pacientes"  icon={<Users     size={18} strokeWidth={2} />} text="Pacientes" />
          <MenuLink href="/dashboard/ventas"     icon={<Banknote  size={18} strokeWidth={2} />} text="Punto de Venta" />
          <MenuLink href="/dashboard/inventario" icon={<Package   size={18} strokeWidth={2} />} text="Inventario" />
          <MenuLink href="/dashboard/reportes"   icon={<BarChart3 size={18} strokeWidth={2} />} text="Reportes" />
        </nav>

        {/* ── Manual + Cerrar sesión ── */}
        <div className="px-4 pb-6 pt-4 space-y-1">
          <Link
            href="/dashboard/manual"
            className="flex items-center gap-3 text-[#A0AAB2] text-[14px] font-medium px-4 py-3 rounded-xl hover:bg-[#f4f7f0] hover:text-[#8DAA68] transition-colors w-full group"
          >
            <BookOpen size={18} strokeWidth={2} className="group-hover:text-[#8DAA68] transition-colors shrink-0" />
            <span>Manual de Uso</span>
          </Link>
          <button
            onClick={() => signOut()}
            className="flex items-center gap-3 text-[#A0AAB2] text-[14px] font-medium px-4 py-3 rounded-xl hover:bg-red-50 hover:text-red-500 transition-colors w-full group cursor-pointer"
          >
            <LogOut size={18} strokeWidth={2} className="group-hover:text-red-400 transition-colors shrink-0" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* ─── CONTENIDO PRINCIPAL ─── */}
      <div className="flex-1 flex flex-col min-h-screen md:pl-[272px] w-full max-w-full overflow-x-hidden min-w-0">

        {/* Header flotante */}
        <div className="sticky top-0 z-20 px-4 pt-4 pb-2 pointer-events-none">
          <header className="pointer-events-auto h-[68px] bg-white/80 backdrop-blur-md rounded-2xl flex items-center px-6 shadow-[0_2px_20px_rgba(0,0,0,0.02)] border border-white/50">
            <button
              onClick={() => setMenuAbierto(true)}
              className="mr-4 text-[#2D3339] p-2 bg-slate-50 rounded-xl border border-slate-100 md:hidden hover:bg-slate-100 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <h1 className="text-[18px] md:text-[20px] font-medium text-[#2D3339] tracking-tight">Centro de Control</h1>
              <p className="text-[12px] text-[#8DAA68] font-medium mt-0.5">{greeting}</p>
            </div>

            <div className="ml-auto flex items-center gap-4">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-[var(--color-primary)] to-[#e87a60] flex items-center justify-center text-white font-medium text-[14px] shadow-sm border-2 border-white ring-2 ring-[#f0ece1]">
                {fotoPerfil
                  ? <img src={fotoPerfil} alt="Avatar" className="w-full h-full object-cover" />
                  : iniciales[0]
                }
              </div>
            </div>
          </header>
        </div>

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 lg:px-10 pt-4 pb-12 w-full min-w-0">
          {children}
        </main>
      </div>

      <Toaster position="top-right" richColors expand={false} className="font-sans" />
    </div>
  );
}

function MenuLink({ icon, text, href = "#" }: { icon: ReactNode, text: string, href?: string }) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/dashboard" && pathname?.startsWith(href));

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-[14px] font-medium
        ${active
          ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)] shadow-sm'
          : 'text-[#8591A0] hover:bg-[#FAF9F6] hover:text-[#2D3339]'
        }`}
    >
      <span className="shrink-0">{icon}</span>
      <span>{text}</span>
    </Link>
  );
}
