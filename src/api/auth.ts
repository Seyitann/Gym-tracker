import { supabase } from "../lib/supabase";

export async function registerUser(email: string, name: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } }, // read by the handle_new_user() trigger
  });
  if (error) throw error;
  return data;
}

export async function loginUser(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function logoutUser() {
  await supabase.auth.signOut();
}
