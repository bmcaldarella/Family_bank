"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getCurrentUser } from "aws-amplify/auth";
import { apiFetch } from "@/lib/api";

type JoinState =
  | "checking"
  | "missing_token"
  | "redirecting_login"
  | "ready"
  | "accepting"
  | "accepted"
  | "error";

function humanError(msg: string) {
  const m = (msg || "").toLowerCase();

  if (m.includes("invite expired") || m.includes("expired")) {
    return "This invite link has expired. Ask the owner to send a new one.";
  }
  if (m.includes("already accepted") || m.includes("no longer pending")) {
    return "This invite link was already used. Ask the owner for a new link if you still can’t join.";
  }
  if (m.includes("not for your email") || m.includes("forbidden")) {
    return "This invite link is not for this account. Sign in with the correct email (or create a new account).";
  }
  if (m.includes("unauthorized")) {
    return "You need to sign in first.";
  }

  return msg || "Something went wrong.";
}

export default function JoinPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const inviteId = (sp.get("invite") || "").trim();

  const [me, setMe] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [state, setState] = useState<JoinState>("checking");
  const [errorMsg, setErrorMsg] = useState<string>("");

  // evita doble accept por renders/retries
  const didAccept = useRef(false);

  const nextUrl = useMemo(() => {
    const next = `/join?invite=${encodeURIComponent(inviteId)}`;
    return next;
  }, [inviteId]);

  // 1) Check sesión una vez
  useEffect(() => {
    getCurrentUser()
      .then((u) => setMe(u.username))
      .catch(() => setMe(null))
      .finally(() => setChecked(true));
  }, []);

  // 2) Validación del token
  useEffect(() => {
    if (!checked) return;

    if (!inviteId) {
      setState("missing_token");
      return;
    }

    // si hay token y ya sabemos session => sigue flujo
    setState("checking");
  }, [checked, inviteId]);

  // 3) Si no está logueado -> redirige al login (home)
  useEffect(() => {
    if (!checked) return;
    if (!inviteId) return;

    if (!me) {
      setState("redirecting_login");

      // mandamos next=/join?... para volver automáticamente
      router.replace(
        `/?next=${encodeURIComponent(nextUrl)}&invite=${encodeURIComponent(inviteId)}`
      );
      return;
    }

    setState("ready");
  }, [checked, me, inviteId, nextUrl, router]);

  // 4) Auto-accept si ya está logueado
  useEffect(() => {
    if (!checked) return;
    if (!inviteId) return;
    if (!me) return;
    if (didAccept.current) return;
    if (state !== "ready") return;

    didAccept.current = true;
    acceptInvite().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checked, me, inviteId, state]);

  async function acceptInvite() {
    if (!inviteId) {
      setState("missing_token");
      return;
    }

    setErrorMsg("");
    setState("accepting");

    try {
      await getCurrentUser();

      await apiFetch("/invites/accept", {
        method: "POST",
        body: JSON.stringify({ inviteId }),
      });

      setState("accepted");

      // ✅ importante: mandamos inviteId al home para que el OWNER haga polling y muestre popup
      router.push(`/?joined=1&invite=${encodeURIComponent(inviteId)}`);
    } catch (e: any) {
      didAccept.current = false; // permite reintentar con botón
      const msg = e?.message || String(e);
      setErrorMsg(humanError(msg));
      setState("error");
    }
  }

  const title = useMemo(() => {
    if (state === "missing_token") return "Invalid invite link";
    if (state === "redirecting_login") return "Sign in required";
    if (state === "accepting") return "Joining household…";
    if (state === "accepted") return "Welcome!";
    if (state === "error") return "Couldn’t join";
    return "Join Household";
  }, [state]);

  const subtitle = useMemo(() => {
    if (state === "missing_token") return "This link doesn’t contain a valid invite token.";
    if (state === "redirecting_login")
      return "We’re sending you to sign in. After that, you’ll come back here automatically.";
    if (state === "accepting") return "Accepting the invite…";
    if (state === "accepted") return "Invite accepted. Redirecting…";
    if (state === "error") return errorMsg || "Something went wrong.";
    if (!checked) return "Checking your session…";
    return "You’re about to join a household.";
  }, [state, checked, errorMsg]);

  const card: React.CSSProperties = {
    maxWidth: 760,
    margin: "64px auto",
    padding: 18,
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,.10)",
    background: "rgba(255,255,255,.04)",
    color: "#EAF0FF",
    fontFamily: "system-ui",
    boxShadow: "0 18px 50px rgba(0,0,0,.40)",
  };

  const pill: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 12,
    border: "1px solid rgba(255,255,255,.12)",
    background: "rgba(255,255,255,.05)",
    opacity: 0.9,
  };

  const btn: React.CSSProperties = {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(124,156,255,.35)",
    background: "rgba(124,156,255,.18)",
    color: "#EAF0FF",
    cursor: "pointer",
    fontWeight: 800,
  };

  const ghost: React.CSSProperties = {
    ...btn,
    background: "transparent",
    borderColor: "rgba(255,255,255,.15)",
    fontWeight: 700,
    opacity: 0.9,
  };

  return (
    <main>
      <style jsx global>{`
        body {
          background: #0b1020;
        }
        code {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 2px 6px;
          border-radius: 8px;
        }
      `}</style>

      <section style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, letterSpacing: "-.02em" }}>{title}</h1>
            <p style={{ margin: "6px 0 0", opacity: 0.8 }}>{subtitle}</p>
          </div>

          <div style={pill}>
            <span style={{ opacity: 0.7 }}>Invite:</span>
            <code>{inviteId || "—"}</code>
          </div>
        </div>

        <div style={{ height: 14 }} />

        {!checked ? (
          <p style={{ opacity: 0.85 }}>Checking session…</p>
        ) : state === "missing_token" ? (
          <div style={{ opacity: 0.9 }}>
            <p style={{ marginTop: 0 }}>
              Ask the household owner to generate a new invite link and send it again.
            </p>
            <button type="button" style={ghost} onClick={() => router.push("/")}>
              Go to Home
            </button>
          </div>
        ) : state === "redirecting_login" ? (
          <div style={{ opacity: 0.9 }}>
            <p style={{ marginTop: 0 }}>
              If this is not the right account, create a new one on the login screen.
              You’ll come back here automatically.
            </p>
            <p style={{ opacity: 0.75, marginTop: 0 }}>
              (Redirecting…)
            </p>
          </div>
        ) : state === "ready" ? (
          <div>
            <p style={{ marginTop: 0, opacity: 0.85 }}>
              You are signed in as <b>{me}</b>. Click to join the household.
            </p>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button type="button" style={btn} onClick={() => acceptInvite()}>
                Accept Invite
              </button>
              <button
                type="button"
                style={ghost}
                onClick={() => {
                  didAccept.current = false;
                  router.push(`/?invite=${encodeURIComponent(inviteId)}&next=${encodeURIComponent(nextUrl)}`);
                }}
              >
                Use a different account
              </button>
            </div>
          </div>
        ) : state === "accepting" ? (
          <p style={{ opacity: 0.85 }}>Accepting invite…</p>
        ) : state === "accepted" ? (
          <p style={{ opacity: 0.85 }}>Redirecting…</p>
        ) : (
          <div>
            <p style={{ marginTop: 0, color: "rgba(255,120,120,1)" }}>
              {errorMsg || "Something went wrong."}
            </p>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button type="button" style={btn} onClick={() => acceptInvite()}>
                Try again
              </button>
              <button type="button" style={ghost} onClick={() => router.push("/")}>
                Go to Home
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
