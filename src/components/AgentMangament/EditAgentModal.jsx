// src/components/AgentManagement/EditAgentModal.jsx
import { useEffect, useState, useId } from "react";
import PropTypes from "prop-types";
import { Eye, EyeOff } from "lucide-react";

export default function EditAgentModal({ open, agent, onClose, onSubmit }) {
  const [form, setForm] = useState({
    agent_name: "",
    agent_email: "",
    contact_number: "",
    status: "active",
    password: "", // NEW: change password
  });
  const [showPw, setShowPw] = useState(false);

  // Stable, unique ids for a11y / Sonar
  const baseId = useId();
  const nameId = `${baseId}-agent-name`;
  const emailId = `${baseId}-agent-email`;
  const contactId = `${baseId}-contact-number`;
  const statusId = `${baseId}-status`;
  const passwordId = `${baseId}-password`; // NEW

  useEffect(() => {
    if (!open || !agent) return;
    setForm({
      agent_name: agent.agent_name || "",
      agent_email: agent.agent_email || "",
      contact_number: agent.contact_number || "",
      status: agent.status === "inactive" ? "inactive" : "active",
      password: "",
    });
    setShowPw(false);
  }, [open, agent]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSave = () => {
    onSubmit?.({
      agent_name: form.agent_name.trim(),
      contact_number: form.contact_number.trim(),
      status: form.status,
      // Only send password if user typed something
      password: form.password.trim(),
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Edit Agent</h3>
          <p className="text-sm text-gray-500">Update agent details</p>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label htmlFor={nameId} className="text-sm text-gray-700">Agent name</label>
            <input
              id={nameId}
              name="agent_name"
              value={form.agent_name}
              onChange={handleChange}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-600/30"
              placeholder="Enter agent name"
            />
          </div>

          <div>
            <label htmlFor={emailId} className="text-sm text-gray-700">Agent email</label>
            <input
              id={emailId}
              name="agent_email"
              value={form.agent_email}
              disabled
              className="mt-1 w-full rounded-md border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-600"
            />
          </div>

          <div>
            <label htmlFor={contactId} className="text-sm text-gray-700">Contact number</label>
            <input
              id={contactId}
              name="contact_number"
              value={form.contact_number}
              onChange={handleChange}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-600/30"
              placeholder="Enter contact number"
            />
          </div>

          <div>
            <label htmlFor={statusId} className="text-sm text-gray-700">Status</label>
            <select
              id={statusId}
              name="status"
              value={form.status}
              onChange={handleChange}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-600/30 bg-white"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* NEW: Change password */}
          <div>
            <label htmlFor={passwordId} className="text-sm text-gray-700">Change password</label>
            <div className="mt-1 flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2 focus-within:ring-2 focus-within:ring-blue-600/30 bg-white">
              <input
                id={passwordId}
                name="password"
                type={showPw ? "text" : "password"}
                value={form.password}
                onChange={handleChange}
                className="w-full bg-transparent outline-none text-sm text-gray-800 placeholder:text-gray-400"
                placeholder="Change Password"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                className="p-1.5 rounded-md hover:bg-gray-100 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/40"
                aria-label={showPw ? "Hide password" : "Show password"}
                title={showPw ? "Hide password" : "Show password"}
              >
                {showPw ? (
                  <EyeOff className="h-4 w-4 text-gray-600" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-600" />
                )}
              </button>
            </div>
          </div>
        </div>

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
            onClick={onSave}
            className="rounded-md px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700"
          >
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}

EditAgentModal.propTypes = {
  open: PropTypes.bool.isRequired,
  agent: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};
