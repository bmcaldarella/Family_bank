"use client";

import type React from "react";
import { useEffect, useMemo, useState } from "react";
import {
  signUp,
  signIn,
  signOut,
  getCurrentUser,
  confirmSignUp,
  resendSignUpCode,
} from "aws-amplify/auth";
import { apiFetch } from "@/lib/api";

type Household = { houseId: string; name: string; role: string };

type Profile = {
  userId: string;
  displayName: string;
  avatarUrl: string;
  updatedAt?: string | null;
};

type Goal = {
  houseId: string;
  savingsGoal: number;
  updatedAt?: string;
  updatedBy?: string;
};

type Tx = {
  txId: string;
  houseId: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  category: string;
  note?: string;
  date: string; // YYYY-MM-DD
  createdAt: string;
  createdBy?: string;

  // NEW: guardado por Lambda al crear la tx
  createdByName?: string;
  createdByAvatar?: string;
};

export default function Home() {
  // -------- AUTH UI ----------
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<string>("");

  const [me, setMe] = useState<string | null>(null);

  // -------- HOUSEHOLDS ----------
  const [households, setHouseholds] = useState<Household[]>([]);
  const [newHouseName, setNewHouseName] = useState("");
  const [selectedHouseId, setSelectedHouseId] = useState<string>("");

  // -------- GOAL ----------
  const [goal, setGoal] = useState<Goal | null>(null);
  const [goalInput, setGoalInput] = useState<string>("0");

  // -------- PROFILE ----------
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileName, setProfileName] = useState("");
  const [profileAvatar, setProfileAvatar] = useState("");

  // -------- INVITES ----------
  const [inviteRole, setInviteRole] = useState<"MEMBER" | "OWNER">("MEMBER");
  const [inviteLink, setInviteLink] = useState<string>("");

  // -------- TX CREATE ----------
  const [txs, setTxs] = useState<Tx[]>([]);
  const [txType, setTxType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [txAmount, setTxAmount] = useState<string>("");
  const [txCategory, setTxCategory] = useState<string>("Food");
  const [txNote, setTxNote] = useState<string>("");
  const [txDate, setTxDate] = useState<string>(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });

  // -------- TX EDIT ----------
  const [editingKey, setEditingKey] = useState<string>(""); // `${date}#${txId}`
  const [editType, setEditType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [editAmount, setEditAmount] = useState<string>("");
  const [editCategory, setEditCategory] = useState<string>("");
  const [editNote, setEditNote] = useState<string>("");

  // -------- STYLES ----------
  const pageWrap: React.CSSProperties = {
    maxWidth: 1120,
    margin: "32px auto",
    padding: 16,
    fontFamily: "system-ui",
    color: "#EAF0FF",
  };

  const shell: React.CSSProperties = {
    background: "#0E1424",
    borderRadius: 24,
    padding: 18,
    boxShadow: "0 18px 50px rgba(0,0,0,.45)",
  };

  const topBar: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
    padding: "10px 12px",
    borderRadius: 18,
    background: "rgba(255,255,255,.03)",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "rgba(255,255,255,.08)",
  };

  const brandTitle: React.CSSProperties = {
    margin: 0,
    fontSize: 22,
    letterSpacing: "-.02em",
    lineHeight: 1.2,
  };

  const brandSub: React.CSSProperties = {
    margin: 0,
    opacity: 0.75,
    fontSize: 13,
  };

  const statusBar: React.CSSProperties = {
    marginTop: 12,
    padding: "10px 12px",
    borderRadius: 16,
    background: "rgba(255,255,255,.03)",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "rgba(255,255,255,.08)",
    fontSize: 13,
    opacity: 0.92,
  };

  const card: React.CSSProperties = {
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "rgba(255,255,255,.10)",
    background: "rgba(255,255,255,.03)",
    padding: 16,
    borderRadius: 18,
  };

  const label: React.CSSProperties = {
    opacity: 0.75,
    fontSize: 12,
    marginBottom: 6,
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "rgba(255,255,255,.12)",
    background: "rgba(255,255,255,.04)",
    color: "#EAF0FF",
    outline: "none",
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    appearance: "none",
  };

  const btn: React.CSSProperties = {
    padding: "10px 12px",
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "rgba(255,255,255,.12)",
    background: "rgba(255,255,255,.06)",
    color: "#EAF0FF",
    cursor: "pointer",
  };

  const btnPrimary: React.CSSProperties = {
    ...btn,
    background: "rgba(124,156,255,.18)",
    borderColor: "rgba(124,156,255,.35)",
  };

  const btnGhost: React.CSSProperties = {
    ...btn,
    background: "transparent",
    opacity: 0.9,
  };

  const btnDanger: React.CSSProperties = {
    ...btn,
    background: "rgba(255,255,255,.06)",
    borderColor: "rgba(255,255,255,.18)",
  };

  const kpisRow: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 10,
    marginTop: 12,
  };

  const kpi: React.CSSProperties = {
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "rgba(255,255,255,.10)",
    background: "rgba(255,255,255,.03)",
    borderRadius: 16,
    padding: 12,
  };

  const kpiLabel: React.CSSProperties = { opacity: 0.7, fontSize: 12 };
  const kpiValue: React.CSSProperties = { fontSize: 18, fontWeight: 800, marginTop: 4 };

  const tableWrap: React.CSSProperties = {
    overflowX: "auto",
    marginTop: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "rgba(255,255,255,.10)",
  };

  const tableStyle: React.CSSProperties = {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: 0,
  };

  const th: React.CSSProperties = {
    textAlign: "left",
    padding: 12,
    fontSize: 12,
    opacity: 0.8,
    background: "rgba(255,255,255,.04)",
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: "rgba(255,255,255,.10)",
    position: "sticky",
    top: 0,
    zIndex: 1,
    whiteSpace: "nowrap",
  };

  const td: React.CSSProperties = {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: "rgba(255,255,255,.08)",
    verticalAlign: "middle",
  };

  // -------- COMPUTEDS ----------
  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const t of txs) {
      if (t.type === "INCOME") income += t.amount;
      else expense += t.amount;
    }
    return { income, expense, net: income - expense };
  }, [txs]);

  const selectedHouse = useMemo(
    () => households.find((h) => h.houseId === selectedHouseId) || null,
    [households, selectedHouseId]
  );

  const goalValue = useMemo(() => {
    const n = Number(goalInput);
    return Number.isFinite(n) ? n : 0;
  }, [goalInput]);

  const netColor = useMemo(() => {
    const g = goal?.savingsGoal ?? 0;
    return totals.net >= g ? "rgba(80, 220, 140, 1)" : "rgba(255, 120, 120, 1)";
  }, [totals.net, goal?.savingsGoal]);

  // -------- API ----------
  async function refreshMeAndHouseholds() {
    const user = await getCurrentUser();
    setMe(user.username);

    const data = await apiFetch("/households");
    const list: Household[] = data.households || [];
    setHouseholds(list);

    if (!selectedHouseId && list.length > 0) {
      setSelectedHouseId(list[0].houseId);
    }
  }

  async function loadTransactions(houseId: string) {
    if (!houseId) return;
    const data = await apiFetch(`/transactions?houseId=${encodeURIComponent(houseId)}`);
    setTxs(data.transactions || []);
  }

  async function loadProfile() {
    const data = await apiFetch("/profile");
    const p: Profile = data.profile;
    setProfile(p);
    setProfileName(p.displayName || "");
    setProfileAvatar(p.avatarUrl || "");
  }

  async function saveProfile() {
    if (!profileName.trim()) {
      setStatus("Profile name required.");
      return;
    }
    setStatus("Saving profile...");
    try {
      const data = await apiFetch("/profile", {
        method: "PUT",
        body: JSON.stringify({
          displayName: profileName.trim(),
          avatarUrl: profileAvatar.trim(),
        }),
      });
      setProfile(data.profile);
      setStatus("Profile saved ✅");
    } catch (e: any) {
      setStatus(`Profile error: ${e?.message || String(e)}`);
    }
  }

  async function loadGoal(houseId: string) {
    if (!houseId) return;
    const data = await apiFetch(`/goals?houseId=${encodeURIComponent(houseId)}`);
    const g: Goal = data.goal;
    setGoal(g);
    setGoalInput(String(g.savingsGoal ?? 0));
  }

  async function saveGoal() {
    if (!selectedHouseId) return setStatus("Select a household first.");
    const n = Number(goalInput);
    if (!Number.isFinite(n) || n < 0) return setStatus("Savings goal must be >= 0.");
    setStatus("Saving goal...");
    try {
      const data = await apiFetch("/goals", {
        method: "PUT",
        body: JSON.stringify({ houseId: selectedHouseId, savingsGoal: n }),
      });
      setGoal(data.goal);
      setStatus("Goal saved ✅");
    } catch (e: any) {
      setStatus(`Goal error: ${e?.message || String(e)}`);
    }
  }

  // -------- LIFECYCLE ----------
  useEffect(() => {
    getCurrentUser()
      .then(async () => {
        await refreshMeAndHouseholds();
        await loadProfile();
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setInviteLink("");
    if (!me || !selectedHouseId) return;

    loadTransactions(selectedHouseId).catch((e) =>
      setStatus(`Load tx error: ${e?.message || String(e)}`)
    );

    loadGoal(selectedHouseId).catch((e) =>
      setStatus(`Load goal error: ${e?.message || String(e)}`)
    );

    const id = setInterval(() => {
      loadTransactions(selectedHouseId).catch(() => {});
    }, 3000);

    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me, selectedHouseId]);

  // -------- AUTH ----------
  async function doSignUp() {
    setStatus("Signing up...");
    try {
      await signUp({
        username: email,
        password: pass,
        options: { userAttributes: { email } },
      });
      setStatus("Signup OK. Put code and Confirm Code.");
    } catch (e: any) {
      const msg = e?.message || String(e);
      if (msg.toLowerCase().includes("user already exists")) {
        setStatus("User already exists. Use Confirm Code (if needed) then Sign In.");
      } else {
        setStatus(`Signup error: ${msg}`);
      }
    }
  }

  async function doConfirm() {
    if (!email) return setStatus("Put your email first.");
    if (!code) return setStatus("Put the verification code.");
    setStatus("Confirming code...");
    try {
      await confirmSignUp({ username: email, confirmationCode: code });
      setStatus("Email confirmed ✅ Now Sign In.");
    } catch (e: any) {
      setStatus(`Confirm error: ${e?.message || String(e)}`);
    }
  }

  async function doResend() {
    if (!email) return setStatus("Put your email first.");
    setStatus("Resending code...");
    try {
      await resendSignUpCode({ username: email });
      setStatus("Code resent. Check your email.");
    } catch (e: any) {
      setStatus(`Resend error: ${e?.message || String(e)}`);
    }
  }

  async function doSignIn() {
    setStatus("Signing in...");
    try {
      await signIn({ username: email, password: pass });
      await refreshMeAndHouseholds();
      await loadProfile();
      setStatus("Signed in ✅");
    } catch (e: any) {
      const msg = e?.message || String(e);

      if (msg.toLowerCase().includes("already a signed in user")) {
        await refreshMeAndHouseholds().catch(() => {});
        await loadProfile().catch(() => {});
        setStatus("You were already signed in ✅");
        return;
      }

      if (msg.toLowerCase().includes("not authorized")) {
        setStatus("Signin error: wrong email/password (or user needs a reset).");
      } else if (msg.toLowerCase().includes("user is not confirmed")) {
        setStatus("Signin error: user not confirmed. Use Confirm Code.");
      } else {
        setStatus(`Signin error: ${msg}`);
      }
    }
  }

  async function doSignOut() {
    setStatus("Signing out...");
    try {
      await signOut();
      setMe(null);
      setHouseholds([]);
      setSelectedHouseId("");
      setTxs([]);
      setInviteLink("");
      setGoal(null);
      setProfile(null);
      setStatus("Signed out.");
    } catch (e: any) {
      setStatus(`Signout error: ${e?.message || String(e)}`);
    }
  }

  async function doForceSignOut() {
    setStatus("Force signing out...");
    try {
      await signOut({ global: true });
      setMe(null);
      setHouseholds([]);
      setSelectedHouseId("");
      setTxs([]);
      setInviteLink("");
      setGoal(null);
      setProfile(null);
      setStatus("Signed out (global). Now Sign In.");
    } catch (e: any) {
      setStatus(`Force signout error: ${e?.message || String(e)}`);
    }
  }

  // -------- HOUSEHOLDS ----------
  async function createHousehold() {
    if (!newHouseName.trim()) return setStatus("Household name required.");
    setStatus("Creating household...");
    try {
      await apiFetch("/households", {
        method: "POST",
        body: JSON.stringify({ name: newHouseName }),
      });
      setNewHouseName("");
      await refreshMeAndHouseholds();
      setStatus("Household created ✅");
    } catch (e: any) {
      setStatus(`Create household error: ${e?.message || String(e)}`);
    }
  }

  // -------- INVITES ----------
  async function createInviteLink() {
    if (!selectedHouseId) return setStatus("Select a household first.");
    if (selectedHouse?.role !== "OWNER") return setStatus("Only OWNER can create invite links.");

    setStatus("Creating invite link...");
    try {
      const res = await apiFetch("/invites", {
        method: "POST",
        body: JSON.stringify({
          houseId: selectedHouseId,
          role: inviteRole,
          expiresInHours: 72,
        }),
      });

      const url = `${window.location.origin}/join?invite=${encodeURIComponent(res.inviteId)}`;
      setInviteLink(url);
      setStatus("Invite created ✅ Copy the link.");
    } catch (e: any) {
      setStatus(`Invite error: ${e?.message || String(e)}`);
    }
  }

  async function copyInvite() {
    try {
      if (!inviteLink) return;
      await navigator.clipboard.writeText(inviteLink);
      setStatus("Invite link copied ✅");
    } catch {
      setStatus("Could not copy. Select the input and copy manually.");
    }
  }

  // -------- TX CREATE ----------
  async function createTransaction() {
    if (!selectedHouseId) return setStatus("Select a household first.");
    const amount = Number(txAmount);
    if (!Number.isFinite(amount) || amount <= 0) return setStatus("Amount must be > 0.");
    if (!txCategory.trim()) return setStatus("Category is required.");

    setStatus("Creating transaction...");
    try {
      await apiFetch("/transactions", {
        method: "POST",
        body: JSON.stringify({
          houseId: selectedHouseId,
          type: txType,
          amount,
          category: txCategory.trim(),
          note: txNote.trim(),
          date: txDate,
        }),
      });

      setTxAmount("");
      setTxNote("");
      await loadTransactions(selectedHouseId);
      setStatus("Transaction added ✅");
    } catch (e: any) {
      setStatus(`Create tx error: ${e?.message || String(e)}`);
    }
  }

  // -------- TX EDIT/DELETE ----------
  function txKey(t: Tx) {
    return `${t.date}#${t.txId}`;
  }

  function startEdit(t: Tx) {
    setEditingKey(txKey(t));
    setEditType(t.type);
    setEditAmount(String(t.amount));
    setEditCategory(t.category);
    setEditNote(t.note || "");
  }

  function cancelEdit() {
    setEditingKey("");
    setEditType("EXPENSE");
    setEditAmount("");
    setEditCategory("");
    setEditNote("");
  }

  async function saveEdit(t: Tx) {
    if (!selectedHouseId) return setStatus("Select a household first.");

    const amount = Number(editAmount);
    if (!Number.isFinite(amount) || amount <= 0) return setStatus("Amount must be > 0.");
    if (!editCategory.trim()) return setStatus("Category is required.");

    setStatus("Saving changes...");
    try {
      const qs = new URLSearchParams({
        houseId: selectedHouseId,
        date: t.date,
        txId: t.txId,
      });

      await apiFetch(`/transactions?${qs.toString()}`, {
        method: "PATCH",
        body: JSON.stringify({
          type: editType,
          amount,
          category: editCategory.trim(),
          note: editNote.trim(),
        }),
      });

      cancelEdit();
      await loadTransactions(selectedHouseId);
      setStatus("Updated ✅");
    } catch (e: any) {
      setStatus(`Update error: ${e?.message || String(e)}`);
    }
  }

  async function deleteTx(t: Tx) {
    if (!selectedHouseId) return setStatus("Select a household first.");

    const ok = window.confirm("Delete this transaction? This cannot be undone.");
    if (!ok) return;

    setStatus("Deleting...");
    try {
      const qs = new URLSearchParams({
        houseId: selectedHouseId,
        date: t.date,
        txId: t.txId,
      });

      await apiFetch(`/transactions?${qs.toString()}`, {
        method: "DELETE",
      });

      setTxs((prev) => prev.filter((x) => !(x.txId === t.txId && x.date === t.date)));
      if (editingKey === txKey(t)) cancelEdit();

      setStatus("Deleted ✅");
    } catch (e: any) {
      setStatus(`Delete error: ${e?.message || String(e)}`);
    }
  }

  // -------- UI HELPERS ----------
  function initials(name: string) {
    const s = (name || "").trim();
    if (!s) return "?";
    const parts = s.split(/\s+/).slice(0, 2);
    return parts.map((p) => p[0]?.toUpperCase()).join("");
  }

  function Avatar({
    name,
    url,
    size = 28,
  }: {
    name: string;
    url?: string;
    size?: number;
  }) {
    const base: React.CSSProperties = {
      width: size,
      height: size,
      borderRadius: 999,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: Math.max(11, Math.floor(size * 0.38)),
      fontWeight: 800,
      border: "1px solid rgba(255,255,255,.18)",
      background: "rgba(255,255,255,.06)",
      overflow: "hidden",
      flex: "0 0 auto",
    };

    if (url) {
      return (
        <span style={base} title={name}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
          <span style={{ position: "absolute", opacity: 0 }}>{initials(name)}</span>
        </span>
      );
    }

    return <span style={base} title={name}>{initials(name)}</span>;
  }

  return (
    <main style={pageWrap}>
      <style jsx global>{`
        body {
          background: #0b1020;
        }
        .dashGrid {
          display: grid;
          grid-template-columns: 360px 1fr;
          gap: 14px;
          align-items: start;
        }
        @media (max-width: 920px) {
          .dashGrid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div style={shell}>
        {/* HEADER */}
        <div style={topBar}>
          <div>
            <h1 style={brandTitle}>Family Bank</h1>
            <p style={brandSub}>Next.js + Cognito + API Gateway + Lambda + DynamoDB</p>
          </div>

          {me ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <Avatar
                  name={profile?.displayName || me}
                  url={profile?.avatarUrl || ""}
                  size={28}
                />
                <div style={{ opacity: 0.9, fontSize: 13 }}>
                  Logged in as <b>{profile?.displayName || me}</b>
                </div>
              </div>

              <button type="button" style={btnGhost} onClick={doSignOut}>
                Sign out
              </button>
            </div>
          ) : null}
        </div>

        <div style={statusBar}>
          <b>Status:</b> {status || "—"}
        </div>

        {/* AUTH */}
        {!me ? (
          <section style={{ ...card, marginTop: 14 }}>
            <h2 style={{ marginTop: 0, fontSize: 16 }}>Login</h2>

            <div style={{ display: "grid", gap: 10 }}>
              <input
                style={inputStyle}
                placeholder="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                style={inputStyle}
                placeholder="password"
                type="password"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
              />
              <input
                style={inputStyle}
                placeholder="verification code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button type="button" style={btn} onClick={doConfirm}>
                  Confirm Code
                </button>
                <button type="button" style={btn} onClick={doResend}>
                  Resend Code
                </button>
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button type="button" style={btnPrimary} onClick={doSignIn}>
                  Sign In
                </button>
                <button type="button" style={btn} onClick={doSignUp}>
                  Sign Up
                </button>
                <button type="button" style={btnGhost} onClick={doForceSignOut}>
                  Force Sign Out
                </button>
              </div>
            </div>
          </section>
        ) : (
          <div style={{ display: "grid", gap: 14, marginTop: 14 }}>
            {/* DASHBOARD GRID */}
            <div className="dashGrid">
              {/* LEFT */}
              <div style={{ display: "grid", gap: 14 }}>
                {/* PROFILE */}
                <section style={card}>
                  <h2 style={{ margin: 0, fontSize: 16 }}>My Profile</h2>
                  <div style={{ height: 10 }} />

                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Avatar name={profileName || "Me"} url={profileAvatar} size={42} />
                    <div style={{ opacity: 0.85, fontSize: 12 }}>
                      Tip: pega una URL de imagen (GitHub, Imgur, etc.). Si no, se ven tus iniciales 😎
                    </div>
                  </div>

                  <div style={{ height: 12 }} />

                  <div style={label}>Display name</div>
                  <input
                    style={inputStyle}
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="e.g. Brandon"
                  />

                  <div style={{ height: 10 }} />

                  <div style={label}>Avatar URL (optional)</div>
                  <input
                    style={inputStyle}
                    value={profileAvatar}
                    onChange={(e) => setProfileAvatar(e.target.value)}
                    placeholder="https://..."
                  />

                  <div style={{ height: 10 }} />

                  <button type="button" style={btnPrimary} onClick={saveProfile}>
                    Save profile
                  </button>
                </section>

                {/* HOUSEHOLDS */}
                <section style={card}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
                    <h2 style={{ margin: 0, fontSize: 16 }}>Households</h2>
                    <span style={{ opacity: 0.7, fontSize: 12 }}>
                      {selectedHouse ? `Role: ${selectedHouse.role}` : "—"}
                    </span>
                  </div>

                  <div style={{ height: 10 }} />

                  <div style={label}>Select household</div>
                  <select
                    style={selectStyle}
                    value={selectedHouseId}
                    onChange={(e) => setSelectedHouseId(e.target.value)}
                  >
                    <option value="" disabled>
                      -- select --
                    </option>
                    {households.map((h) => (
                      <option key={h.houseId} value={h.houseId}>
                        {h.name} ({h.role})
                      </option>
                    ))}
                  </select>

                  <div style={{ height: 12 }} />

                  <div style={label}>Create household</div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <input
                      style={{ ...inputStyle, flex: 1 }}
                      placeholder="New household name"
                      value={newHouseName}
                      onChange={(e) => setNewHouseName(e.target.value)}
                    />
                    <button type="button" style={btnPrimary} onClick={createHousehold}>
                      Create
                    </button>
                  </div>
                </section>

                {/* GOAL */}
                <section style={card}>
                  <h2 style={{ margin: 0, fontSize: 16 }}>Savings Goal</h2>
                  <div style={{ height: 10 }} />

                  <div style={{ opacity: 0.8, fontSize: 12 }}>
                    This goal is per household. If <b>Net</b> is above the goal → green. Otherwise → red.
                  </div>

                  <div style={{ height: 10 }} />

                  <div style={label}>Goal amount</div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <input
                      style={{ ...inputStyle, flex: 1 }}
                      value={goalInput}
                      onChange={(e) => setGoalInput(e.target.value)}
                      placeholder="0"
                    />
                    <button type="button" style={btnPrimary} onClick={saveGoal}>
                      Save
                    </button>
                  </div>

                  <div style={{ height: 10 }} />

                  <div style={{ fontSize: 12, opacity: 0.85 }}>
                    Current goal: <b>{(goal?.savingsGoal ?? 0).toFixed(2)}</b>
                  </div>
                </section>

                {/* INVITE */}
                <section style={card}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
                    <h2 style={{ margin: 0, fontSize: 16 }}>Invite</h2>
                    <span style={{ opacity: 0.7, fontSize: 12 }}>
                      {selectedHouse ? `Role: ${selectedHouse.role}` : "—"}
                    </span>
                  </div>

                  <div style={{ height: 10 }} />

                  {selectedHouse?.role !== "OWNER" ? (
                    <p style={{ opacity: 0.8, margin: 0 }}>
                      Only <b>OWNER</b> can create invite links.
                    </p>
                  ) : (
                    <>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <select
                          style={selectStyle}
                          value={inviteRole}
                          onChange={(e) => setInviteRole(e.target.value as any)}
                        >
                          <option value="MEMBER">MEMBER</option>
                          <option value="OWNER">OWNER</option>
                        </select>

                        <button type="button" style={btnPrimary} onClick={createInviteLink}>
                          Create link
                        </button>
                      </div>

                      {inviteLink ? (
                        <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
                          <input
                            style={inputStyle}
                            value={inviteLink}
                            readOnly
                            onFocus={(e) => e.currentTarget.select()}
                          />
                          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                            <button type="button" style={btn} onClick={copyInvite}>
                              Copy
                            </button>
                            <a
                              href={inviteLink}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                ...btn,
                                textDecoration: "none",
                                display: "inline-flex",
                                alignItems: "center",
                              }}
                            >
                              Open
                            </a>
                          </div>
                        </div>
                      ) : (
                        <p style={{ opacity: 0.75, margin: "10px 0 0" }}>
                          Create a link and share it.
                        </p>
                      )}
                    </>
                  )}
                </section>
              </div>

              {/* RIGHT */}
              <div style={{ display: "grid", gap: 14 }}>
                <section style={card}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
                    <h2 style={{ margin: 0, fontSize: 16 }}>Quick add</h2>
                    <span style={{ opacity: 0.7, fontSize: 12 }}>
                      Auto refresh: <b>every 3s</b>
                    </span>
                  </div>

                  <div style={{ height: 10 }} />

                  <div style={{ display: "grid", gap: 10 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <select
                        style={selectStyle}
                        value={txType}
                        onChange={(e) => setTxType(e.target.value as any)}
                      >
                        <option value="EXPENSE">EXPENSE</option>
                        <option value="INCOME">INCOME</option>
                      </select>

                      <input
                        style={inputStyle}
                        placeholder="Amount"
                        value={txAmount}
                        onChange={(e) => setTxAmount(e.target.value)}
                      />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <input
                        style={inputStyle}
                        placeholder="Category"
                        value={txCategory}
                        onChange={(e) => setTxCategory(e.target.value)}
                      />
                      <input
                        style={inputStyle}
                        type="date"
                        value={txDate}
                        onChange={(e) => setTxDate(e.target.value)}
                      />
                    </div>

                    <input
                      style={inputStyle}
                      placeholder="Note (optional)"
                      value={txNote}
                      onChange={(e) => setTxNote(e.target.value)}
                    />

                    <button type="button" style={btnPrimary} onClick={createTransaction}>
                      Add transaction
                    </button>
                  </div>

                  {/* KPIs */}
                  <div style={kpisRow}>
                    <div style={kpi}>
                      <div style={kpiLabel}>Income</div>
                      <div style={kpiValue}>{totals.income.toFixed(2)}</div>
                    </div>
                    <div style={kpi}>
                      <div style={kpiLabel}>Expense</div>
                      <div style={kpiValue}>{totals.expense.toFixed(2)}</div>
                    </div>
                    <div style={kpi}>
                      <div style={kpiLabel}>Net vs Goal</div>
                      <div style={{ ...kpiValue, color: netColor }}>
                        {totals.net.toFixed(2)}
                      </div>
                      <div style={{ opacity: 0.7, fontSize: 12, marginTop: 4 }}>
                        Goal: {(goal?.savingsGoal ?? 0).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>

            {/* TABLE FULL WIDTH */}
            <section style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
                <h2 style={{ margin: 0, fontSize: 16 }}>Transactions</h2>
                <span style={{ opacity: 0.7, fontSize: 12 }}>{txs.length} items</span>
              </div>

              {txs.length === 0 ? (
                <p style={{ opacity: 0.8, margin: "10px 0 0" }}>No transactions yet.</p>
              ) : (
                <div style={tableWrap}>
                  <table style={tableStyle}>
                    <thead>
                      <tr>
                        <th style={th}>By</th>
                        <th style={th}>Date</th>
                        <th style={th}>Type</th>
                        <th style={th}>Amount</th>
                        <th style={th}>Category</th>
                        <th style={th}>Note</th>
                        <th style={{ ...th, textAlign: "right" }}>Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {txs.map((t) => {
                        const isEditing = editingKey === txKey(t);
                        const whoName = (t.createdByName || "").trim() || "Member";
                        const whoAvatar = (t.createdByAvatar || "").trim();

                        return (
                          <tr key={`${t.date}-${t.txId}`}>
                            <td style={{ ...td, whiteSpace: "nowrap" }}>
                              <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                                <Avatar name={whoName} url={whoAvatar} size={28} />
                                <span style={{ opacity: 0.9, fontSize: 13, fontWeight: 700 }}>
                                  {whoName}
                                </span>
                              </div>
                            </td>

                            <td style={{ ...td, whiteSpace: "nowrap", opacity: 0.92 }}>{t.date}</td>

                            <td style={td}>
                              {isEditing ? (
                                <select
                                  style={{ ...selectStyle, padding: "8px 10px" }}
                                  value={editType}
                                  onChange={(e) => setEditType(e.target.value as any)}
                                >
                                  <option value="EXPENSE">EXPENSE</option>
                                  <option value="INCOME">INCOME</option>
                                </select>
                              ) : (
                                <span style={{ fontWeight: 800 }}>{t.type}</span>
                              )}
                            </td>

                            <td style={{ ...td, width: 140 }}>
                              {isEditing ? (
                                <input
                                  style={{ ...inputStyle, padding: "8px 10px" }}
                                  value={editAmount}
                                  onChange={(e) => setEditAmount(e.target.value)}
                                  placeholder="0.00"
                                />
                              ) : (
                                <span>{t.amount.toFixed(2)}</span>
                              )}
                            </td>

                            <td style={{ ...td, minWidth: 160 }}>
                              {isEditing ? (
                                <input
                                  style={{ ...inputStyle, padding: "8px 10px" }}
                                  value={editCategory}
                                  onChange={(e) => setEditCategory(e.target.value)}
                                />
                              ) : (
                                <span>{t.category}</span>
                              )}
                            </td>

                            <td style={{ ...td, minWidth: 220 }}>
                              {isEditing ? (
                                <input
                                  style={{ ...inputStyle, padding: "8px 10px" }}
                                  value={editNote}
                                  onChange={(e) => setEditNote(e.target.value)}
                                  placeholder="—"
                                />
                              ) : (
                                <span style={{ opacity: t.note ? 1 : 0.65 }}>{t.note || "—"}</span>
                              )}
                            </td>

                            <td style={{ ...td, textAlign: "right", whiteSpace: "nowrap" }}>
                              {!isEditing ? (
                                <div style={{ display: "inline-flex", gap: 8 }}>
                                  <button
                                    type="button"
                                    style={{ ...btn, padding: "8px 10px" }}
                                    onClick={() => startEdit(t)}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    style={{ ...btnDanger, padding: "8px 10px" }}
                                    onClick={() => deleteTx(t)}
                                  >
                                    Delete
                                  </button>
                                </div>
                              ) : (
                                <div style={{ display: "inline-flex", gap: 8 }}>
                                  <button
                                    type="button"
                                    style={{ ...btnPrimary, padding: "8px 10px" }}
                                    onClick={() => saveEdit(t)}
                                  >
                                    Save
                                  </button>
                                  <button
                                    type="button"
                                    style={{ ...btnGhost, padding: "8px 10px" }}
                                    onClick={cancelEdit}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
