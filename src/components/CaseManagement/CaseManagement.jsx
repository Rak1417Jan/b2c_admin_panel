// src/components/CaseManagement/CaseManagement.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { FolderClosed, Clock3, CheckCheck } from "lucide-react";
import CaseBoard from "./CaseBoard";
import {
  fetchCases,
  fetchAllCases,
  resolveAgentNames,
  assignCase,
} from "../../services/CaseService";
import { fetchAllAgents } from "../../services/AgentService"; // 🔄 changed import
import CaseDetailsModal from "./CaseDetailsModal";
import CaseEditModal from "./CaseEditModal";
import UploadModal from "./UploadModal";
import CaseReportModal from "./CaseReportModal";

/* --- local soft card for stat tiles --- */
const SoftCard = ({ children }) => (
  <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
    {children}
  </div>
);
SoftCard.propTypes = { children: PropTypes.node };

const ITEMS_PER_PAGE = 8;

function getDefaultDateRange() {
  const today = new Date();
  const end = today.toISOString().slice(0, 10);
  const startDateObj = new Date(today);
  startDateObj.setMonth(startDateObj.getMonth() - 1);
  const start = startDateObj.toISOString().slice(0, 10);
  return { start, end };
}

const DEFAULT_RANGE = getDefaultDateRange();

export default function CaseManagement() {
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState(DEFAULT_RANGE.start);
  const [endDate, setEndDate] = useState(DEFAULT_RANGE.end);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [viewing, setViewing] = useState(null); // selected case for details modal
  const [editing, setEditing] = useState(null); // selected case for edit modal
  const [agentList, setAgentList] = useState([]); // [{agent_id, agent_name}, ...]
  const [saving, setSaving] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false); // controls upload modal

  // NEW: full list only for stat tiles
  const [allCases, setAllCases] = useState([]);

  // NEW: report modal state
  const [reportCaseId, setReportCaseId] = useState("");

  // Guard against race conditions
  const requestIdRef = useRef(0);

  /* --- load paginated cases (with search + date) --- */
  async function load({
    page: pageOverride,
    search: searchOverride,
    created_from,
    created_to,
  } = {}) {
    const effectivePage = pageOverride ?? page ?? 1;
    const effectiveSearch =
      typeof searchOverride === "string" ? searchOverride : search || "";
    const effectiveFrom = created_from ?? startDate ?? "";
    const effectiveTo = created_to ?? endDate ?? "";

    const currentId = ++requestIdRef.current;

    setLoading(true);
    setErr("");

    try {
      const { cases: serverCases, pagination: pg } = await fetchCases({
        page: effectivePage,
        limit: ITEMS_PER_PAGE,
        search: effectiveSearch,
        created_from: effectiveFrom,
        created_to: effectiveTo,
      });

      if (currentId !== requestIdRef.current) return;

      const idToName = await resolveAgentNames(serverCases);

      const mapped = serverCases.map((c) => ({
        id: c.case_id,
        name: c.case_applicant_name,
        phone: c.case_applicant_contact,
        address: c.address,
        type: c.case_type,
        agent:
          idToName.get(c.assigned_agent) ||
          c.agent_name ||
          c.assigned_agent ||
          "Unassigned",
        status: c.status || "Pending",
        loan_amount: c.loan_amount,
        priority: c.priority,
        __raw: c,
      }));

      setRows(mapped);
      setPagination(pg || null);
      setPage(pg?.current_page || effectivePage);
      setSearch(effectiveSearch);
      setStartDate(effectiveFrom);
      setEndDate(effectiveTo);
    } catch (e) {
      if (currentId !== requestIdRef.current) return;
      setErr(
        e?.message ? `Failed to load cases: ${e.message}` : "Failed to load cases."
      );
    } finally {
      if (currentId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }

  /* --- load ALL cases for stat tiles (no filters) --- */
  async function loadAllCases() {
    try {
      const full = await fetchAllCases();
      setAllCases(full);
    } catch (e) {
      console.error("Failed to load all cases:", e);
    }
  }

  /* --- prefetch agents (used in the edit modal) --- */
  async function loadAgents() {
    try {
      // 🔄 Use /api/agents (full list) instead of /agents/search
      const allAgents = await fetchAllAgents(); // returns normalized array

      setAgentList(
        allAgents
          .filter((a) => a?.agent_id && a?.agent_name)
          .map((a) => ({
            agent_id: a.agent_id,
            agent_name: a.agent_name,
            status: a.status,
          }))
      );
    } catch (e) {
      console.error("Failed to load agents:", e);
      setAgentList([]);
    }
  }

  useEffect(() => {
    // default: last 1 month date range
    load({
      page: 1,
      search: "",
      created_from: DEFAULT_RANGE.start,
      created_to: DEFAULT_RANGE.end,
    });
    loadAgents();
    loadAllCases();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* --- Stat tiles — Total, Pending, Completed (based on /api/cases) --- */
  const totals = useMemo(() => {
    const total = allCases.length;
    const completed = allCases.filter((c) => c.status === "Completed").length;
    const pending = total - completed;
    return { total, pending, completed };
  }, [allCases]);

  /* --- open edit modal (guard on completed) --- */
  const handleOpenEdit = (row) => {
    if (row?.status === "Completed" || row?.__raw?.status === "Completed") return;
    setEditing(row.__raw);
  };

  /* --- assign agent --- */
  const handleAssignAgent = async (caseId, agentId) => {
    if (!caseId || !agentId) return;
    try {
      setSaving(true);
      await assignCase(caseId, agentId);
      setEditing(null);
      await load();
      await loadAllCases();
    } catch (e) {
      console.error("Assign case failed:", e);
    } finally {
      setSaving(false);
    }
  };

  // NEW: open Report modal
  const handleViewReport = (row) => {
    const id = row?.__raw?.case_id || row?.id;
    if (!id) return;
    setReportCaseId(id);
  };

  // NEW: search handler (applicant / contact)
  const handleSearch = async (value) => {
    await load({ page: 1, search: value });
  };

  // NEW: page change handler
  const handlePageChange = async (nextPage) => {
    if (!nextPage || nextPage === page) return;
    await load({ page: nextPage });
  };

  // NEW: date range handler (only filters when both dates are present)
  const handleDateChange = async (which, value) => {
    if (which === "from") {
      setStartDate(value);
      if (value && endDate) {
        await load({ page: 1, created_from: value, created_to: endDate });
      }
    } else {
      setEndDate(value);
      if (startDate && value) {
        await load({ page: 1, created_from: startDate, created_to: value });
      }
    }
  };

  const handleRefresh = () => {
    load();
    loadAgents();
    loadAllCases();
  };

  return (
    <div className="space-y-6 mt-6">
      {/* Stat Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SoftCard>
          <div className="p-5 flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Cases</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {totals.total}
              </p>
              {err && <p className="text-xs text-red-600 mt-1">{err}</p>}
              {loading && (
                <p className="text-xs text-gray-500 mt-1">Loading cases…</p>
              )}
            </div>
            <div className="h-11 w-11 rounded-xl flex items-center justify-center bg-indigo-50 border border-indigo-100">
              <FolderClosed className="h-5 w-5 text-indigo-500" />
            </div>
          </div>
        </SoftCard>

        <SoftCard>
          <div className="p-5 flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Pending</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {totals.pending}
              </p>
            </div>
            <div className="h-11 w-11 rounded-xl flex items-center justify-center bg-amber-50 border border-amber-200">
              <Clock3 className="h-5 w-5 text-amber-500" />
            </div>
          </div>
        </SoftCard>

        <SoftCard>
          <div className="p-5 flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Completed</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {totals.completed}
              </p>
            </div>
            <div className="h-11 w-11 rounded-xl flex items-center justify-center bg-emerald-50 border border-emerald-200">
              <CheckCheck className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
        </SoftCard>
      </div>

      {/* Case Board */}
      <CaseBoard
        rows={rows}
        onUploadExcel={() => setShowUploadModal(true)}
        onChangeAgent={() => {}}
        onChangeStatus={() => {}}
        onView={(row) => setViewing(row.__raw)}
        onEdit={handleOpenEdit}
        onRefresh={handleRefresh}
        onViewReport={handleViewReport}
        loading={loading}
        // NEW: filters + pagination
        search={search}
        onSearch={handleSearch}
        startDate={startDate}
        endDate={endDate}
        onDateChange={handleDateChange}
        pagination={pagination}
        page={page}
        onPageChange={handlePageChange}
      />

      {/* Upload Modal */}
      <UploadModal
        open={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={load}
      />

      {/* Details Modal */}
      <CaseDetailsModal
        open={Boolean(viewing)}
        onClose={() => setViewing(null)}
        caseData={viewing}
      />

      {/* Edit / Assign Modal */}
      <CaseEditModal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        caseData={editing}
        agents={agentList}
        onSubmitAssign={handleAssignAgent}
        saving={saving}
      />

      {/* Report Modal */}
      <CaseReportModal
        open={Boolean(reportCaseId)}
        onClose={() => setReportCaseId("")}
        caseId={reportCaseId}
      />

      {saving && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 rounded-lg bg-gray-900 text-white text-sm px-3 py-2 shadow">
          Saving changes…
        </div>
      )}
    </div>
  );
}

CaseManagement.propTypes = {};
