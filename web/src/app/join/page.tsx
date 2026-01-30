"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getCurrentUser } from "aws-amplify/auth";
import { apiFetch } from "@/lib/api";

export default function JoinPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const inviteId = sp.get("invite") || "";

  const [status, setStatus] = useState("Checking session...");
  const [me, setMe] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  // evita doble accept por renders/retries
  const didAccept = useRef(false);

  useEffect(() => {
    console.log("ENV CHECK", {
      api: process.env.NEXT_PUBLIC_API_URL,
      pool: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID,
      client: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID,
    });
  }, []);

  // 1) Check sesión una vez
  useEffect(() => {
    getCurrentUser()
      .then((u) => setMe(u.username))
      .catch(() => setMe(null))
      .finally(() => setChecked(true));
  }, []);

  // 2) Si no hay invite token, corta
  useEffect(() => {
    if (!checked) return;
    if (!inviteId) {
      setStatus("Missing invite token.");
    }
  }, [checked, inviteId]);

  // 3) Si no está logueado -> redirige al login (home)
  useEffect(() => {
    if (!checked) return;
    if (!inviteId) return;

    if (!me) {
      setStatus("Not signed in. Redirecting to sign in...");

      const next = `/join?invite=${encodeURIComponent(inviteId)}`;
      router.replace(
        `/?next=${encodeURIComponent(next)}&invite=${encodeURIComponent(inviteId)}`
      );
    }
  }, [checked, me, inviteId, router]);

  // 4) Auto-accept si ya está logueado
  useEffect(() => {
    if (!checked) return;
    if (!inviteId) return;
    if (!me) return;
    if (didAccept.current) return;

    didAccept.current = true;
    accept();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checked, me, inviteId]);

  async function accept() {
    if (!inviteId) return setStatus("Missing invite token.");
    setStatus("Accepting invite...");

    try {
      // seguridad extra: confirma sesión
      await getCurrentUser();

      await apiFetch("/invites/accept", {
        method: "POST",
        body: JSON.stringify({ inviteId }),
      });

      setStatus("Invite accepted ✅ Redirecting...");
      router.push("/?joined=1");
    } catch (e: any) {
      didAccept.current = false; // permite reintentar con el botón
      setStatus(`Accept error: ${e?.message || String(e)}`);
    }
  }

  return (
    <main
      style={{
        maxWidth: 720,
        margin: "60px auto",
        fontFamily: "system-ui",
        color: "white",
      }}
    >
      <h1>Join Household</h1>

      <p style={{ opacity: 0.8 }}>
        Invite token: <code>{inviteId || "—"}</code>
      </p>

      <p style={{ opacity: 0.9 }}>
        Status: <b>{status}</b>
      </p>

      {!checked ? (
        <p style={{ opacity: 0.8 }}>Checking session...</p>
      ) : !inviteId ? (
        <p style={{ opacity: 0.8 }}>
          This invite link is invalid. Ask the owner to send it again.
        </p>
      ) : !me ? (
        <p style={{ opacity: 0.8 }}>
          Redirecting you to sign in…
          <br />
          If this is not the right account, create a new one, then you’ll be
          brought back here automatically.
        </p>
      ) : (
        <button
          type="button"
          onClick={accept}
          style={{
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,.2)",
            background: "rgba(255,255,255,.08)",
            color: "white",
            cursor: "pointer",
          }}
        >
          Accept Invite
        </button>
      )}
    </main>
  );
}
