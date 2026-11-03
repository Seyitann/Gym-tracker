import { useState } from "react";
import type { FormEvent } from "react";
import { updatePassword } from "../api/auth";
import Page, { PageHeader } from "../components/Page";
import TextField from "../components/TextField";
import { btnPrimary } from "../ui";

export default function ChangePassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (password.length < 8) {
      setMessage({ type: "error", text: "Use at least 8 characters." });
      return;
    }
    if (password !== confirm) {
      setMessage({ type: "error", text: "The two passwords don't match." });
      return;
    }
    setSaving(true);
    try {
      await updatePassword(password);
      setPassword("");
      setConfirm("");
      setMessage({ type: "ok", text: "Password updated." });
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Could not update your password.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Page>
      <PageHeader title="Change password" back="/settings" />
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-card p-5 space-y-4">
        <TextField
          label="New password"
          type="password"
          value={password}
          onChange={setPassword}
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="At least 8 characters"
        />
        <TextField
          label="Confirm new password"
          type="password"
          value={confirm}
          onChange={setConfirm}
          required
          autoComplete="new-password"
          placeholder="Type it again"
        />
        {message && (
          <p
            role={message.type === "error" ? "alert" : "status"}
            className={`text-sm rounded-2xl px-4 py-3 ${
              message.type === "ok" ? "text-mint-600 bg-mint-50" : "text-brand-600 bg-brand-50"
            }`}
          >
            {message.text}
          </p>
        )}
        <button type="submit" disabled={saving} className={`${btnPrimary} w-full`}>
          {saving ? "Saving..." : "Update password"}
        </button>
      </form>
    </Page>
  );
}
