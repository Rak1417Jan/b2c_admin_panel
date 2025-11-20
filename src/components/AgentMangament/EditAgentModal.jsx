// src/components/AgentManagement/EditAgentModal.jsx
import { useEffect, useState, useId } from "react";
import PropTypes from "prop-types";
import { Eye, EyeOff, CheckCircle2 } from "lucide-react";

/* ---------- Validation helpers (outer scope) ---------- */

function isValidAgentName(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return true; // optional field
  // Only letters and spaces
  const nameRegex = /^[A-Za-z\s]+$/;
  return nameRegex.test(trimmed);
}

function isValidContactNumber(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return true; // optional field
  // Exactly 10 digits
  const phoneRegex = /^\d{10}$/;
  return phoneRegex.test(trimmed);
}

function isValidPassword(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return true; // optional field
  // At least 8 chars, 1 uppercase, 1 number, 1 special char
  const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
  return passwordRegex.test(trimmed);
}

/* -------------------------- Component -------------------------- */

export default function EditAgentModal({ open, agent, onClose, onSubmit }) {
  const [form, setForm] = useState({
    agent_name: "",
    agent_email: "",
    contact_number: "",
    status: "active",
    password: "",
  });

  const [errors, setErrors] = useState({
    agent_name: "",
    contact_number: "",
    password: "",
  });

  const [successMsg, setSuccessMsg] = useState("");
  const [showPw, setShowPw] = useState(false);

  // Stable, unique ids for a11y / Sonar
  const baseId = useId();
  const nameId = `${baseId}-agent-name`;
  const emailId = `${baseId}-agent-email`;
  const contactId = `${baseId}-contact-number`;
  const statusId = `${baseId}-status`;
  const passwordId = `${baseId}-password`;

  useEffect(() => {
    if (!open || !agent) return;

    setForm({
      agent_name: agent.agent_name || "",
      agent_email: agent.agent_email || "",
      contact_number: agent.contact_number || "",
      status: agent.status === "inactive" ? "inactive" : "active",
      password: "",
    });

    setErrors({
      agent_name: "",
      contact_number: "",
      password: "",
    });
    setSuccessMsg("");
    setShowPw(false);
  }, [open, agent]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear field error and success message when user edits
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (successMsg) {
      setSuccessMsg("");
    }
  };

  const onSave = () => {
    const newErrors = {
      agent_name: "",
      contact_number: "",
      password: "",
    };

    // Validate agent name (optional, but if filled, must be valid)
    if (!isValidAgentName(form.agent_name)) {
      newErrors.agent_name = "Name can only contain letters and spaces.";
    }

    // Validate contact number (optional, but if filled, must be 10 digits)
    if (!isValidContactNumber(form.contact_number)) {
      newErrors.contact_number = "Enter a valid 10-digit mobile number.";
    }

    // Validate password (optional, but if filled, must be strong)
    if (!isValidPassword(form.password)) {
      newErrors.password =
        "Password must be at least 8 characters, with 1 uppercase letter, 1 number and 1 special character.";
    }

    const hasError = Object.values(newErrors).some(Boolean);
    if (hasError) {
      setErrors(newErrors);
      return;
    }

    const trimmedName = form.agent_name.trim();
    const trimmedContact = form.contact_number.trim();
    const trimmedPassword = form.password.trim();
    const originalName = String(agent?.agent_name || "").trim();
    const originalContact = String(agent?.contact_number || "").trim();
    const originalStatus = agent?.status === "inactive" ? "inactive" : "active";

    const hasChanges =
      trimmedName !== originalName ||
      trimmedContact !== originalContact ||
      form.status !== originalStatus ||
      trimmedPassword !== "";

    if (!hasChanges) {
      // Nothing changed; optional: no submit, just info message
      setSuccessMsg("No changes to save.");
      return;
    }

    onSubmit?.({
      agent_name: trimmedName,
      contact_number: trimmedContact,
      status: form.status,
      // Only send password if user typed something
      password: trimmedPassword,
    });

    setSuccessMsg("Agent details have been updated successfully.");
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
          {successMsg && (
            <div className="mb-2 flex items-start gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
              <CheckCircle2 className="mt-[2px] h-4 w-4" />
              <p>{successMsg}</p>
            </div>
          )}

          {/* Agent name */}
          <div>
            <label htmlFor={nameId} className="text-sm text-gray-700">
              Agent name
            </label>
            <input
              id={nameId}
              name="agent_name"
              value={form.agent_name}
              onChange={handleChange}
              className={`mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 ${
                errors.agent_name
                  ? "border-red-400 bg-red-50 focus:ring-red-500/40"
                  : "border-gray-300 focus:ring-blue-600/30"
              }`}
              placeholder="Enter agent name"
              aria-invalid={!!errors.agent_name}
            />
            {errors.agent_name && (
              <p className="mt-1 text-xs text-red-500">{errors.agent_name}</p>
            )}
          </div>

          {/* Agent email (readonly) */}
          <div>
            <label htmlFor={emailId} className="text-sm text-gray-700">
              Agent email
            </label>
            <input
              id={emailId}
              name="agent_email"
              value={form.agent_email}
              disabled
              className="mt-1 w-full rounded-md border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-600"
            />
          </div>

          {/* Contact number */}
          <div>
            <label htmlFor={contactId} className="text-sm text-gray-700">
              Contact number
            </label>
            <input
              id={contactId}
              name="contact_number"
              value={form.contact_number}
              onChange={handleChange}
              className={`mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 ${
                errors.contact_number
                  ? "border-red-400 bg-red-50 focus:ring-red-500/40"
                  : "border-gray-300 focus:ring-blue-600/30"
              }`}
              placeholder="Enter contact number"
              aria-invalid={!!errors.contact_number}
            />
            {errors.contact_number && (
              <p className="mt-1 text-xs text-red-500">
                {errors.contact_number}
              </p>
            )}
          </div>

          {/* Status */}
          <div>
            <label htmlFor={statusId} className="text-sm text-gray-700">
              Status
            </label>
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

          {/* Change password */}
          <div>
            <label htmlFor={passwordId} className="text-sm text-gray-700">
              Change password
            </label>
            <div
              className={`mt-1 flex items-center gap-2 rounded-md border px-3 py-2 bg-white focus-within:ring-2 ${
                errors.password
                  ? "border-red-400 bg-red-50 focus-within:ring-red-500/40"
                  : "border-gray-300 focus-within:ring-blue-600/30"
              }`}
            >
              <input
                id={passwordId}
                name="password"
                type={showPw ? "text" : "password"}
                value={form.password}
                onChange={handleChange}
                className="w-full bg-transparent outline-none text-sm text-gray-800 placeholder:text-gray-400"
                placeholder="Change Password (optional)"
                autoComplete="new-password"
                aria-invalid={!!errors.password}
              />
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                className="p-1.5 rounded-md hover:bg-gray-100 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/40"
                aria-label={showPw ? "Hide password" : "Show password"}
                title={showPw ? "Hide password" : "Show password"}
              >
                {/* 👇 Updated: Eye = visible, EyeOff = hidden */}
                {showPw ? (
                  <Eye className="h-4 w-4 text-gray-600" />
                ) : (
                  <EyeOff className="h-4 w-4 text-gray-600" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-red-500">{errors.password}</p>
            )}
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
