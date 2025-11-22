// src/services/Addagent.js
import { encryptText } from "../utils/cryptoService";

// ✅ Second API root (HF Space)
const HF_API_ROOT = import.meta.env.VITE_API_BASE;

/**
 * ✅ Hits 2nd API AFTER createAgent success.
 * POST /api/agents
 *
 * Requires:
 * - Bearer token from localStorage ("authToken")
 * - Encrypt: agent_name, agent_email, contact_number, agency
 * - Send: password as plain text
 *
 * NOTE:
 * - Caller may choose to ignore errors (silent fail in UI).
 */
export async function addAgentToHFAgency({
  agent_name,
  agent_email,
  contact_number,
  password,
  agency,
} = {}) {
  const token = localStorage.getItem("authToken");
  if (!token) {
    // keep as throw so caller can swallow silently if desired
    throw new Error("Auth token missing. Please login again.");
  }

  const cleanName = String(agent_name || "").trim();
  const cleanEmail = String(agent_email || "").trim();
  const cleanContact = String(contact_number || "").trim();
  const cleanAgency = String(agency || "").trim();

  const payload = {
    agent_name: encryptText(cleanName),
    agent_email: encryptText(cleanEmail),
    contact_number: encryptText(cleanContact),
    password: String(password || ""), // ✅ plain (NOT encrypted)
    agency: encryptText(cleanAgency), // ✅ encrypted per requirement
  };

  const res = await fetch(`${HF_API_ROOT}/agents`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`, // ✅ required
    },
    body: JSON.stringify(payload),
  });

  // If HF API returns non-2xx, throw formatted error
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let msg = `HF create failed (HTTP ${res.status})`;

    try {
      const j = text ? JSON.parse(text) : null;
      if (Array.isArray(j?.errors) && j.errors.length) {
        msg = j.errors.map((e) => e?.message).filter(Boolean).join(", ");
      } else if (j?.message) {
        msg = j.message;
      } else if (j?.status === "failed" && j?.code) {
        msg = `HF create failed (code ${j.code})`;
      }
    } catch {
      if (text) msg = `${msg}: ${text}`;
    }

    throw new Error(msg);
  }

  return res.json();
}
