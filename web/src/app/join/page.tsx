"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getCurrentUser } from "aws-amplify/auth";
import { apiFetch } from "@/lib/api";

export default function JoinPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const inviteId = sp.get("invite") || "";

  const [status, setStatus] = useState("Checking session...");
  const [me, setMe] = useState<string | null>(null);

  useEffect(() => {
    console.log("ENV CHECK", {
      api: process.env.NEXT_PUBLIC_API_URL,
      pool: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID,
      client: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID,
    });
  }, []);

  useEffect(() => {
    getCurrentUser()
      .then((u) => setMe(u.username))
      .catch(() => setMe(null));
  }, []);

  useEffect(() => {
    // auto-accept si ya está logueado
    if (me && inviteId) accept();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me, inviteId]);

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
      setStatus(`Accept error: ${e?.message || String(e)}`);
    }
  }

  return (
    <main style={{ maxWidth: 720, margin: "60px auto", fontFamily: "system-ui", color: "white" }}>
      <h1>Join Household</h1>

      <p style={{ opacity: 0.8 }}>
        Invite token: <code>{inviteId || "—"}</code>
      </p>

      <p style={{ opacity: 0.9 }}>
        Status: <b>{status}</b>
      </p>

      {!me ? (
        <p style={{ opacity: 0.8 }}>
          You must sign in first, then come back to this link.
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
