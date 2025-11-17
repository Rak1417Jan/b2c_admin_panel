// src/components/CaseManagement/CaseEditModal.jsx
import React, { useEffect, useMemo, useState, useId } from "react";
import PropTypes from "prop-types";

export default function CaseEditModal({ open, onClose, caseData, agents = [], onSubmitAssign, saving }) {
  const [selectedAgentId, setSelectedAgentId] = useState("");

  // a11y ids
  const baseId = useId();
  const agentSelectId = `${baseId}-agent-select`;

  useEffect(() => {
    if (!open || !caseData) return;
    // preselect current assigned agent id if available
    setSelectedAgentId(caseData.assigned_agent || "");
  }, [open, caseData]);

  const sortedAgents = useMemo(() => {
    // Show active agents first, then others; alphabetical by name
    const active = agents.filter((a) => a.status !== "inactive");
    const inactive = agents.filter((a) => a.status === "inactive");
    const sortByName = (arr) => [...arr].sort((x, y) => x.agent_name.localeCompare(y.agent_name));
    return [...sortByName(active), ...sortByName(inactive)];
  }, [agents]);

  if (!open || !caseData) return null;

  const handleSave = () => {
    if (!selectedAgentId) return;
    onSubmitAssign?.(caseData.case_id, selectedAgentId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl border border-gray-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Edit Case / Assign Agent</h3>
            <p className="text-sm text-gray-500">
              Case ID: <span className="font-medium text-gray-700">{caseData.case_id}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
            aria-label="Close edit modal"
          >
            Close
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Summary */}
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-500">Applicant Name</div>
                <div className="text-sm font-medium text-gray-900">{caseData.case_applicant_name}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Applicant Contact</div>
                <div className="text-sm font-medium text-gray-900">{caseData.case_applicant_contact}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Case Type</div>
                <div className="text-sm font-medium text-gray-900">{caseData.case_type}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Status</div>
                <div className="text-sm font-medium text-gray-900">{caseData.status || "Pending"}</div>
              </div>
            </div>
          </div>

          {/* Assign Section */}
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <label htmlFor={agentSelectId} className="text-sm text-gray-700">
              Select Agent
            </label>
            <div className="mt-2">
              <select
                id={agentSelectId}
                value={selectedAgentId}
                onChange={(e) => setSelectedAgentId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600/30"
              >
                <option value="" disabled>
                  Choose an agent…
                </option>
                {sortedAgents.map((a) => (
                  <option key={a.agent_id} value={a.agent_id}>
                    {a.agent_name} {a.status === "inactive" ? "(inactive)" : ""}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-gray-500">
                Tip: Agents marked inactive cannot log in, but you can still reassign to them if needed.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!selectedAgentId || saving}
            onClick={handleSave}
            className={`rounded-md px-4 py-2 text-sm font-medium text-white transition ${
              !selectedAgentId || saving
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700"
            }`}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

CaseEditModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  caseData: PropTypes.object,
  agents: PropTypes.arrayOf(
    PropTypes.shape({
      agent_id: PropTypes.string.isRequired,
      agent_name: PropTypes.string.isRequired,
      status: PropTypes.string,
    })
  ),
  onSubmitAssign: PropTypes.func, // (caseId, agentId) => void
  saving: PropTypes.bool,
};
