// src/components/AgentMangament/AddAgentModal.jsx
import { useEffect, useState, useId } from "react";
import PropTypes from "prop-types";
import { Eye, EyeOff } from "lucide-react";

export default function AddAgentModal({ open, onClose, onSubmit }) {
  const [form, setForm] = useState({
    agent_name: "",
    agent_email: "",
    contact_number: "",
    agency: "",
    password: "",
  });
  const [showPw, setShowPw] = useState(false);

  // Stable ids for a11y / Sonar
  const baseId = useId();
  const nameId = `${baseId}-agent-name`;
  const emailId = `${baseId}-agent-email`;
  const contactId = `${baseId}-contact-number`;
  const agencyId = `${baseId}-agency`;
  const passwordId = `${baseId}-password`;

  useEffect(() => {
    if (!open) {
      setForm({
        agent_name: "",
        agent_email: "",
        contact_number: "",
        agency: "",
        password: "",
      });
      setShowPw(false);
    }
  }, [open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSave = () => {
    onSubmit?.({
      agent_name: form.agent_name.trim(),
      agent_email: form.agent_email.trim(),
      contact_number: form.contact_number.trim(),
      agency: form.agency.trim(),
      password: form.password,
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Add New Agent</h3>
          <p className="text-sm text-gray-500">Create a new agent account</p>
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
              type="email"
              value={form.agent_email}
              onChange={handleChange}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-600/30"
              placeholder="name@example.com"
              autoComplete="email"
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
              placeholder="e.g. 9999888877"
            />
          </div>

          <div>
            <label htmlFor={agencyId} className="text-sm text-gray-700">Agency</label>
            <input
              id={agencyId}
              name="agency"
              value={form.agency}
              onChange={handleChange}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-600/30"
              placeholder="Agency name"
            />
          </div>

          <div>
            <label htmlFor={passwordId} className="text-sm text-gray-700">Set password</label>
            <div className="mt-1 flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2 focus-within:ring-2 focus-within:ring-blue-600/30 bg-white">
              <input
                id={passwordId}
                name="password"
                type={showPw ? "text" : "password"}
                value={form.password}
                onChange={handleChange}
                className="w-full bg-transparent outline-none text-sm text-gray-800 placeholder:text-gray-400"
                placeholder="Enter a secure password"
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
            Create agent
          </button>
        </div>
      </div>
    </div>
  );
}

AddAgentModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};
