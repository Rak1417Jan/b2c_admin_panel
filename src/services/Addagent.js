// src/services/Addagent.js
import { encryptText } from "../utils/cryptoService";

// ✅ Second API root (HF Space)
// Example: https://rakshitjan-cps-b2c.hf.space/api
const HF_API_ROOT = import.meta.env.VITE_API_BASE;

/**
 * ✅ Hits HF API AFTER createAgent success.
 * POST /api/agents
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
    agency: encryptText(cleanAgency),
  };

  const res = await fetch(`${HF_API_ROOT}/agents`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

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

/**
 * ✅ NEW: Fetch agents list from HF API for Case Edit Modal dropdown
 * GET /api/agents
 *
 * Returns: normalized array of agents
 * [{ agent_id, agent_name, status, ... }]
 */
export async function fetchHFAgents() {
  const token = localStorage.getItem("authToken");
  if (!token) {
    throw new Error("Auth token missing. Please login again.");
  }

  const res = await fetch(`${HF_API_ROOT}/agents`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let msg = `HF agents fetch failed (HTTP ${res.status})`;
    if (text) msg += `: ${text}`;
    throw new Error(msg);
  }

  const data = await res.json().catch(() => ({}));

  // HF response shape: { agents: [...] }
  const rawAgents = Array.isArray(data?.agents) ? data.agents : [];

  return rawAgents.map((a) => ({
    agent_id: a.agent_id,
    agent_name: a.agent_name,
    status: a.status,
    agent_email: a.agent_email,
    contact_number: a.contact_number,
    _id: a._id,
  }));
}
