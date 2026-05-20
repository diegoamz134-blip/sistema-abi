'use server'

import { createSupabaseServerClient, setAuthCookies, clearAuthCookies } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

export async function signIn(formData: FormData) {
  const supabase = createSupabaseServerClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email: String(formData.get('email') ?? '').trim(),
    password: String(formData.get('password') ?? '')
  })

  // Traducir mensajes comunes de error
  let errorMessage = error?.message;
  if (error?.message === "Invalid login credentials") {
    errorMessage = "Correo o contraseña incorrectos.";
  }

  if (error || !data?.session?.access_token || !data?.session?.refresh_token) {
    return { success: false, error: errorMessage ?? 'Error al iniciar sesión.' }
  }

  await setAuthCookies(data.session.access_token, data.session.refresh_token)
  return { success: true }
}

export async function signOut() {
  await clearAuthCookies()
  redirect('/')
}

export async function getUserProfile() {
  const cookieStore = await cookies();
  const token = cookieStore.get("insforge_access_token")?.value;
  if (!token) return null;
  
  try {
    const supabase = createSupabaseServerClient(token);
    const { data, error } = await supabase.auth.getUser();
    
    if (error) {
      console.warn("getUserProfile SDK error:", error.message);
      return null;
    }
    
    return data?.user ?? null;
  } catch (error) {
    console.error("getUserProfile fatal error:", error);
    return null;
  }
}

export async function updateProfileInfo(nombre_clinica: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get("insforge_access_token")?.value;
  if (!token) return { error: "No autenticado" };
  
  try {
    const supabase = createSupabaseServerClient(token);
    const { data, error } = await supabase.auth.updateUser({
      data: { nombre_clinica }
    });
    
    if (error) return { error: error.message };
    return { success: true, data };
  } catch (error) {
    return { error: "Error de conexión" };
  }
}

export async function updateProfileFoto(foto_perfil: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get("insforge_access_token")?.value;
  if (!token) return { error: "No autenticado" };
  
  try {
    const supabase = createSupabaseServerClient(token);
    const { data, error } = await supabase.auth.updateUser({
      data: { foto_perfil }
    });
    
    if (error) return { error: error.message };
    return { success: true, data };
  } catch (error) {
    return { error: "Error de conexión" };
  }
}

export async function updateUserPassword(password: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get("insforge_access_token")?.value;
  if (!token) return { error: "No autenticado" };
  
  try {
    const supabase = createSupabaseServerClient(token);
    const { error } = await supabase.auth.updateUser({ password });
    
    if (error) return { error: error.message };
    return { success: true };
  } catch (error) {
    return { error: "Error al actualizar contraseña" };
  }
}
