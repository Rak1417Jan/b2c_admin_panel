import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { FolderClosed, Clock3, CheckCheck } from "lucide-react";
import CaseBoard from "./CaseBoard";
import { fetchCases, resolveAgentNames, assignCase } from "../../services/CaseService";
import { fetchAgents } from "../../services/AgentService";
import CaseDetailsModal from "./CaseDetailsModal";
import CaseEditModal from "./CaseEditModal";
import UploadModal from "./UploadModal";
import CaseReportModal from "./CaseReportModal";

/* --- local soft card for stat tiles --- */
const SoftCard = ({ children }) => (
  <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">{children}</div>
);
SoftCard.propTypes = { children: PropTypes.node };

export default function CaseManagement() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [viewing, setViewing] = useState(null); // selected case for details modal
  const [editing, setEditing] = useState(null); // selected case for edit modal
  const [agentList, setAgentList] = useState([]); // [{agent_id, agent_name}, ...]
  const [saving, setSaving] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false); // controls upload modal

  // NEW: report modal state
  const [reportCaseId, setReportCaseId] = useState("");

  /* --- load all cases --- */
  async function load() {
    setLoading(true);
    setErr("");
    try {
      const serverCases = await fetchCases();
      const idToName = await resolveAgentNames(serverCases);

      const mapped = serverCases.map((c) => ({
        id: c.case_id,
        name: c.case_applicant_name,
        phone: c.case_applicant_contact,
        address: c.address,
        type: c.case_type,
        agent: idToName.get(c.assigned_agent) || c.assigned_agent || "Unassigned",
        status: c.status || "Pending",
        loan_amount: c.loan_amount,
        priority: c.priority,
        __raw: c,
      }));

      setRows(mapped);
    } catch (e) {
      setErr(e?.message ? `Failed to load cases: ${e.message}` : "Failed to load cases.");
    } finally {
      setLoading(false);
    }
  }

  /* --- prefetch agents (used in the edit modal) --- */
  async function loadAgents() {
    try {
      const agents = await fetchAgents();
      setAgentList(
        agents
          .filter((a) => a?.agent_id && a?.agent_name)
          .map((a) => ({ agent_id: a.agent_id, agent_name: a.agent_name, status: a.status }))
      );
    } catch {
      setAgentList([]);
    }
  }

  useEffect(() => {
    load();
    loadAgents();
  }, []);

  /* --- Stat tiles — Total, Pending, Completed --- */
  const totals = useMemo(() => {
    const total = rows.length;
    const completed = rows.filter((r) => r.status === "Completed").length;
    const pending = total - completed;
    return { total, pending, completed };
  }, [rows]);

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

  return (
    <div className="space-y-6 mt-6">
      {/* Stat Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SoftCard>
          <div className="p-5 flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Cases</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">{totals.total}</p>
              {err && <p className="text-xs text-red-600 mt-1">{err}</p>}
              {loading && <p className="text-xs text-gray-500 mt-1">Loading cases…</p>}
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
              <p className="mt-1 text-2xl font-semibold text-gray-900">{totals.pending}</p>
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
              <p className="mt-1 text-2xl font-semibold text-gray-900">{totals.completed}</p>
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
        onRefresh={() => {
          load();
          loadAgents();
        }}
        // NEW: report
        onViewReport={handleViewReport}
        loading={loading}
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

      {/* NEW: Report Modal */}
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
