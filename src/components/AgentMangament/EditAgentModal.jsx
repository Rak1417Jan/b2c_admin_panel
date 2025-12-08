// src/components/AgentManagement/EditAgentModal.jsx
import { useEffect, useState, useId } from "react";
import PropTypes from "prop-types";
import {
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  BadgeCheck,
} from "lucide-react";

/* ---------- Validation helpers (outer scope) ---------- */

function isValidAgentName(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return true; // optional
  const nameRegex = /^[A-Za-z\s]+$/;
  return nameRegex.test(trimmed);
}

function isValidContactNumber(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return true; // optional
  const phoneRegex = /^\d{10}$/;
  return phoneRegex.test(trimmed);
}

function isValidPassword(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return true; // optional
  const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
  return passwordRegex.test(trimmed);
}

/* ---------- Extracted helpers to reduce complexity ---------- */

function computeValidationErrors(form) {
  const validationErrors = {
    agent_name: "",
    contact_number: "",
    password: "",
  };

  if (!isValidAgentName(form.agent_name)) {
    validationErrors.agent_name = "Name can only contain letters and spaces.";
  }

  if (!isValidContactNumber(form.contact_number)) {
    validationErrors.contact_number = "Enter a valid 10-digit mobile number.";
  }

  if (!isValidPassword(form.password)) {
    validationErrors.password =
      "Password must be 8+ chars with 1 uppercase, 1 number & 1 special character.";
  }

  return validationErrors;
}

function buildUpdatePayload(form, agent) {
  const trimmedName = form.agent_name.trim();
  const trimmedEmail = form.agent_email.trim().toLowerCase();
  const trimmedContact = form.contact_number.trim();
  const trimmedPassword = form.password.trim();

  const originalName = String(agent?.agent_name || "").trim();
  const originalEmail = String(agent?.agent_email || "").trim().toLowerCase();
  const originalContact = String(agent?.contact_number || "").trim();
  const originalStatus =
    agent?.status === "inactive" ? "inactive" : "active";

  const hasChanges =
    trimmedName !== originalName ||
    trimmedEmail !== originalEmail ||
    trimmedContact !== originalContact ||
    form.status !== originalStatus ||
    trimmedPassword !== "";

  const updatePayload = {
    status: form.status,
  };

  if (trimmedName && trimmedName !== originalName) {
    updatePayload.agent_name = trimmedName;
  }

  // ✅ Even though email is disabled, keep this logic harmless
  if (trimmedEmail && trimmedEmail !== originalEmail) {
    // always send lowercase email
    updatePayload.agent_email = trimmedEmail;
  }

  if (trimmedContact && trimmedContact !== originalContact) {
    updatePayload.contact_number = trimmedContact;
  }

  if (trimmedPassword) {
    updatePayload.password = trimmedPassword;
  }

  return { hasChanges, updatePayload };
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
  const [submitError, setSubmitError] = useState("");
  const [saving, setSaving] = useState(false);
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

    setErrors({ agent_name: "", contact_number: "", password: "" });
    setSuccessMsg("");
    setSubmitError("");
    setSaving(false);
    setShowPw(false);
  }, [open, agent]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    if (successMsg) setSuccessMsg("");
    if (submitError) setSubmitError("");
  };

  const onSave = async () => {
    if (!agent?.agent_id || saving) return;

    // Step 1: validate form
    const validationErrors = computeValidationErrors(form);
    const hasError = Object.values(validationErrors).some(Boolean);

    if (hasError) {
      setErrors(validationErrors);
      return;
    }

    // Step 2: compute changes + payload
    const { hasChanges, updatePayload } = buildUpdatePayload(form, agent);

    if (!hasChanges) {
      setSuccessMsg("No changes to save.");
      return;
    }

    try {
      setSaving(true);
      setSubmitError("");
      setSuccessMsg("");

      await onSubmit?.(updatePayload);

      setSuccessMsg("Agent details updated successfully.");
      setForm((prev) => ({ ...prev, password: "" }));
      setShowPw(false);
    } catch (err) {
      console.error("EditAgentModal save failed:", err);
      setSubmitError(
        err instanceof Error && err.message
          ? err.message
          : "Failed to update agent. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const isVerified = Boolean(agent?.is_verified);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl border border-gray-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Edit Agent</h3>
            <p className="text-sm text-gray-500">
              Update agent details securely
            </p>
          </div>

          {/* Verified badge (read-only info from new API) */}
          <div
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border ${
              isVerified
                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                : "bg-gray-50 text-gray-600 border-gray-200"
            }`}
            title={isVerified ? "User is verified" : "User not verified"}
          >
            <BadgeCheck className="h-3.5 w-3.5" />
            {isVerified ? "Verified" : "Not verified"}
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Success */}
          {successMsg && (
            <div className="flex items-start gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
              <CheckCircle2 className="mt-[2px] h-4 w-4" />
              <p>{successMsg}</p>
            </div>
          )}

          {/* Error */}
          {submitError && (
            <div className="flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
              <AlertTriangle className="mt-[2px] h-4 w-4" />
              <p>{submitError}</p>
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
              className={`mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 transition ${
                errors.agent_name
                  ? "border-red-400 bg-red-50 focus:ring-red-500/40"
                  : "border-gray-300 focus:ring-blue-600/30"
              }`}
              placeholder="Enter agent name"
              aria-invalid={!!errors.agent_name}
            />
            {errors.agent_name && (
              <p className="mt-1 text-xs text-red-500">
                {errors.agent_name}
              </p>
            )}
          </div>

          {/* Agent email (DISABLED - read-only) */}
          <div>
            <label htmlFor={emailId} className="text-sm text-gray-700">
              Agent email
            </label>
            <input
              id={emailId}
              name="agent_email"
              value={form.agent_email}
              onChange={handleChange}
              disabled
              className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-500 bg-gray-50 cursor-not-allowed outline-none"
              placeholder="Agent email"
              title="Email cannot be changed"
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
              className={`mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 transition ${
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
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-600/30 bg-white transition"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Change password */}
          <div>
            <label htmlFor={passwordId} className="text-sm text-gray-700">
              Change password (optional)
            </label>

            <div
              className={`mt-1 flex items-center gap-2 rounded-md border px-3 py-2 bg-white focus-within:ring-2 transition ${
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
                placeholder="Enter new password"
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

            {/* Strength hint */}
            {!errors.password && form.password.trim() && (
              <p className="mt-1 text-[11px] text-gray-500 flex items-center gap-1">
                <BadgeCheck className="h-3 w-3" />
                Use 8+ chars, uppercase, number & special character.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-md border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="rounded-md px-4 py-2 text-sm font-medium text-white shadow
                       bg-gradient-to-r from-emerald-600 to-blue-600
                       hover:from-emerald-700 hover:to-blue-700
                       disabled:opacity-60 disabled:cursor-not-allowed
                       inline-flex items-center gap-2"
          >
            {saving ? (
              <>
                <span className="h-4 w-4 rounded-full border-2 border-white/70 border-t-transparent animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <BadgeCheck className="h-4 w-4" />
                <span>Save changes</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

EditAgentModal.propTypes = {
  open: PropTypes.bool.isRequired,
  agent: PropTypes.shape({
    agent_id: PropTypes.string,
    agent_name: PropTypes.string,
    agent_email: PropTypes.string,
    contact_number: PropTypes.string,
    status: PropTypes.string,
    is_verified: PropTypes.bool,
  }),
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired, // should return a Promise
};
