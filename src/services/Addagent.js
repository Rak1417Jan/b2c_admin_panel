// src/services/Addagent.js
import { encryptText } from "../utils/cryptoService";

// ✅ HF Space API root (example: https://rakshitjan-cps-b2c.hf.space/api)
const HF_API_ROOT = import.meta.env.VITE_API_BASE;

// ✅ CPV API root (second backend)
const CPV_API_ROOT =
  import.meta.env.VITE_CPV_API_BASE;
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
 * ✅ Fetch agents list from HF API for Case Edit Modal dropdown
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

/**
 * ✅ NEW: After B2C updateAgent success, sync changes to:
 *  1) HF search API (by email) -> get agent_id
 *  2) CPV API (PUT /api/agents/:agent_id)
 *
 *  - Uses Bearer token from localStorage
 *  - Encrypts agent_name & contact_number
 *  - status always sent
 *  - password sent only if provided
 *  - Second API is fire-and-forget (no await)
 */
export async function syncEditedAgentToHFAndCPV({
  agent_email,
  agent_name,
  contact_number,
  status,
  password,
} = {}) {
  const token = localStorage.getItem("authToken");
  if (!token) {
    console.warn(
      "[syncEditedAgentToHFAndCPV] Auth token missing. Skipping HF/CPV sync."
    );
    return;
  }

  const cleanEmail = String(agent_email || "").trim();
  if (!cleanEmail) {
    console.warn(
      "[syncEditedAgentToHFAndCPV] agent_email missing. Skipping HF/CPV sync."
    );
    return;
  }

  try {
    // 1️⃣ HF SEARCH API
    // curl --location 'https://rakshitjan-cps-b2c.hf.space/api/agents/search?page=1&limit=20&search=sinhashubham923%40exit.com'
    const searchUrl = `${HF_API_ROOT}/agents/search?page=1&limit=20&search=${encodeURIComponent(
      cleanEmail
    )}`;

    const searchRes = await fetch(searchUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!searchRes.ok) {
      const text = await searchRes.text().catch(() => "");
      console.error(
        `[syncEditedAgentToHFAndCPV] HF search failed (HTTP ${searchRes.status}):`,
        text
      );
      return;
    }

    const searchJson = await searchRes.json().catch(() => null);
    const hfAgentArray = Array.isArray(searchJson?.data)
      ? searchJson.data
      : [];
    const hfAgent = hfAgentArray[0];

    if (!hfAgent?.agent_id) {
      console.warn(
        "[syncEditedAgentToHFAndCPV] No HF agent_id found for email:",
        cleanEmail
      );
      return;
    }

    const hfAgentId = hfAgent.agent_id;

    // 2️⃣ CPV PUT API (fire-and-forget)
    // 'PUT https://cpv-b2c-apis-.../api/agents/{agent_id}'
    // Payload:
    // {
    //   agent_name: <encrypted if provided>,
    //   contact_number: <encrypted if provided>,
    //   status: "active" | "inactive",
    //   password: <plain if provided>
    // }

    const payload = {
      status: String(status || "").trim(), // always send status
    };

    const cleanName = String(agent_name || "").trim();
    const cleanContact = String(contact_number || "").trim();
    const cleanPassword = String(password || "").trim();

    if (cleanName) {
      payload.agent_name = encryptText(cleanName); // 🔐 encrypted
    }

    if (cleanContact) {
      payload.contact_number = encryptText(cleanContact); // 🔐 encrypted
    }

    if (cleanPassword) {
      // plain password in CPV payload as per sample
      payload.password = cleanPassword;
    }

    // If only status is changed, payload will only have { status: ... }

    // 🔥 Fire-and-forget: do NOT await this fetch
    fetch(`${HF_API_ROOT}/agents/${hfAgentId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    }).catch((err) => {
      console.error("[syncEditedAgentToHFAndCPV] CPV update failed:", err);
    });
  } catch (err) {
    console.error("[syncEditedAgentToHFAndCPV] Unexpected error:", err);
  }
}
