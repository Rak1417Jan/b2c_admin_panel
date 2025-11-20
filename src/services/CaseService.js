// src/services/CaseService.js
const API_ROOT = import.meta.env.VITE_API_BASE;
const DEFAULT_LIMIT = 8;

function getAuthToken() {
  try {
    return globalThis.localStorage.getItem("authToken") || "";
  } catch {
    return "";
  }
}

function authHeaders(json = true) {
  const headers = new Headers();
  if (json) headers.set("Content-Type", "application/json");
  const token = getAuthToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return headers;
}

/**
 * Normalize case object (ensure `agent_name` is a clean string).
 */
function normalizeCase(c) {
  return {
    ...c,
    agent_name: typeof c.agent_name === "string" ? c.agent_name : "",
  };
}

/**
 * GET /api/cases/search
 * Supports: page, limit, search (applicant/contact), created_from, created_to
 * Returns: { cases, pagination }
 */
export async function fetchCases({
  page = 1,
  limit = DEFAULT_LIMIT,
  search = "",
  created_from,
  created_to,
} = {}) {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(limit));

  const trimmedSearch = String(search || "").trim();
  if (trimmedSearch) {
    params.set("search", trimmedSearch);
  }

  // Only send dates if BOTH are present (backend expects both)
  const from = created_from ? String(created_from).slice(0, 10) : "";
  const to = created_to ? String(created_to).slice(0, 10) : "";
  if (from && to) {
    params.set("created_from", from);
    params.set("created_to", to);
  }

  const url = `${API_ROOT}/cases/search?${params.toString()}`;

  const res = await fetch(url, {
    method: "GET",
    headers: authHeaders(false),
  });

  if (!res.ok) throw new Error(`Cases fetch failed: ${res.status}`);

  const data = await res.json();

  const raw = Array.isArray(data?.data) ? data.data : [];
  const cases = raw.map(normalizeCase);

  const totalItems =
    typeof data?.pagination?.total_items === "number"
      ? data.pagination.total_items
      : cases.length;
  const itemsPerPage =
    typeof data?.pagination?.items_per_page === "number"
      ? data.pagination.items_per_page
      : limit;
  const totalPages =
    typeof data?.pagination?.total_pages === "number"
      ? data.pagination.total_pages
      : Math.max(1, Math.ceil(totalItems / (itemsPerPage || 1)));

  const pagination =
    data?.pagination || {
      current_page: page,
      total_pages: totalPages,
      total_items: totalItems,
      items_per_page: itemsPerPage,
      has_next_page: page < totalPages,
      has_prev_page: page > 1,
    };

  return { cases, pagination };
}

/**
 * GET /api/cases
 * Full list WITHOUT pagination – for stat tiles only.
 */
export async function fetchAllCases() {
  const res = await fetch(`${API_ROOT}/cases`, {
    method: "GET",
    headers: authHeaders(false),
  });
  if (!res.ok) throw new Error(`Cases fetch failed: ${res.status}`);
  const data = await res.json();

  const raw = Array.isArray(data?.cases)
    ? data.cases
    : Array.isArray(data?.data)
    ? data.data
    : [];

  return raw.map(normalizeCase);
}

/**
 * Helper: resolve many agent IDs to names WITHOUT extra network calls.
 */
export async function resolveAgentNames(cases) {
  const map = new Map();
  if (!Array.isArray(cases)) return map;

  for (const c of cases) {
    const id = c?.assigned_agent;
    const name = c?.agent_name;
    if (id && typeof name === "string" && name.trim()) {
      map.set(id, name.trim());
    }
  }
  return map;
}

/** PUT /api/cases/:caseId/assign { agent_id } */
export async function assignCase(caseId, agentId) {
  if (!caseId || !agentId) throw new Error("Missing caseId or agentId");
  const res = await fetch(
    `${API_ROOT}/cases/${encodeURIComponent(caseId)}/assign`,
    {
      method: "PUT",
      headers: authHeaders(true),
      body: JSON.stringify({ agent_id: agentId }),
    }
  );
  if (!res.ok) throw new Error(`Assign failed: ${res.status}`);
  return res.json();
}

/* ---------------------- Case files APIs ---------------------- */

/** GET /api/cases/:caseId/files -> { files: [...] } */
export async function fetchCaseFiles(caseId) {
  if (!caseId) throw new Error("Missing caseId");
  const res = await fetch(
    `${API_ROOT}/cases/${encodeURIComponent(caseId)}/files`,
    {
      method: "GET",
      headers: authHeaders(false),
    }
  );
  if (!res.ok) throw new Error(`Files fetch failed: ${res.status}`);
  const data = await res.json();
  return Array.isArray(data?.files) ? data.files : [];
}

/**
 * GET /api/files/:fileId -> binary file stream
 * Returns: { blob, contentType, filename }
 */
export async function fetchFileBlob(fileId) {
  if (!fileId) throw new Error("Missing fileId");
  const res = await fetch(`${API_ROOT}/files/${encodeURIComponent(fileId)}`, {
    method: "GET",
    headers: authHeaders(false),
  });
  if (!res.ok) throw new Error(`File download failed: ${res.status}`);

  const contentType =
    res.headers.get("Content-Type") || "application/octet-stream";
  const disp = res.headers.get("Content-Disposition") || "";
  let filename = "";
  const m = /filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i.exec(disp);
  if (m) filename = decodeURIComponent(m[1]);

  const blob = await res.blob();
  return { blob, contentType, filename };
}

/* ---------------------- Generated PDF Report ---------------------- */
/**
 * POST https://rakshitjan-generate-pdf-python.hf.space/generate-report
 * Body: { "case_id": "<uuid>" }
 * Returns a PDF blob, with content-type 'application/pdf'
 */
export async function generateCaseReport(caseId, { signal } = {}) {
  if (!caseId) throw new Error("Missing caseId");

  const res = await fetch(
    "https://rakshitjan-generate-pdf-python.hf.space/generate-report",
    {
      method: "POST",
      headers: new Headers({ "Content-Type": "application/json" }),
      body: JSON.stringify({ case_id: caseId }),
      signal,
    }
  );

  if (!res.ok) {
    throw new Error(`Report generation failed: HTTP ${res.status}`);
  }

  const contentType = res.headers.get("Content-Type") || "application/pdf";
  const blob = await res.blob();
  const filename = `Case_${caseId}_Report.pdf`;

  return { blob, contentType, filename };
}
