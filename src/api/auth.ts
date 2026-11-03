import { supabase } from "../lib/supabase";

// Where Supabase sends people after they click the link in an email
const callbackUrl = () => `${window.location.origin}/auth/callback`;
const resetUrl = () => `${window.location.origin}/reset-password`;

export async function registerUser(email: string, name: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name }, // read by the handle_new_user() trigger
      emailRedirectTo: callbackUrl(),
    },
  });
  if (error) throw error;
  return data;
}

export async function resendConfirmation(email: string) {
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: callbackUrl() },
  });
  if (error) throw error;
}

export async function loginUser(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function logoutUser() {
  await supabase.auth.signOut();
}

export async function sendPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: resetUrl() });
  if (error) throw error;
}

export async function updatePassword(password: string) {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}

export function errorCode(err: unknown): string | undefined {
  return (err as { code?: string } | null)?.code;
}
