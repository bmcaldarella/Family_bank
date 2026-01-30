import { fetchAuthSession } from "aws-amplify/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function apiFetch(path: string, init: RequestInit = {}) {
  if (!API_URL) throw new Error("NEXT_PUBLIC_API_URL is missing");

  const session = await fetchAuthSession();
  const token = session.tokens?.idToken?.toString();
  if (!token) throw new Error("No idToken found. Are you signed in?");

  const url = `${API_URL}${path}`;

  if (process.env.NODE_ENV !== "production") {
    console.log("➡️ apiFetch", init.method || "GET", url);
  }

  const res = await fetch(url, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });

  const text = await res.text();
  let data: any = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    const msg = data?.message || data?.raw || `${res.status} ${res.statusText}`;
    throw new Error(msg);
  }

  return data;
}
