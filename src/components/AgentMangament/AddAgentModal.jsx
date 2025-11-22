// src/components/AgentMangament/AddAgentModal.jsx
import { useEffect, useState, useId } from "react";
import PropTypes from "prop-types";
import {
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  BadgeCheck,
  XCircle,
  Building2,
} from "lucide-react";

/* ---------- Validation helpers (outer scope for Sonar) ---------- */

function isValidAgentName(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return false;
  const nameRegex = /^[A-Za-z\s]+$/;
  return nameRegex.test(trimmed);
}

function isValidEmail(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(trimmed);
}

function isValidContactNumber(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return false;
  const phoneRegex = /^\d{10}$/;
  return phoneRegex.test(trimmed);
}

function isValidPassword(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return false;
  const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
  return passwordRegex.test(trimmed);
}

/* ---------- Backend error formatter (for FIRST API only) ---------- */
function normalizeApiErrors(payload) {
  const errs = Array.isArray(payload?.errors) ? payload.errors : [];
  if (errs.length === 0) return [];
  return errs.map((e, i) => ({
    id: `${e?.parameter || "error"}-${i}`,
    field: e?.parameter || "unknown_field",
    message: e?.message || "Something went wrong.",
    type: e?.type || "ERROR",
  }));
}

export default function AddAgentModal({ open, onClose, onSubmit }) {
  const [form, setForm] = useState({
    agent_name: "",
    agent_email: "",
    contact_number: "",
    password: "",
    agency: "",       // ✅ required for second API
    status: "active", // ✅ keep for first API only
  });

  const [errors, setErrors] = useState({
    agent_name: "",
    agent_email: "",
    contact_number: "",
    password: "",
    agency: "",
  });

  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);

  const [successMsg, setSuccessMsg] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [apiErrors, setApiErrors] = useState([]);

  const baseId = useId();
  const nameId = `${baseId}-agent-name`;
  const emailId = `${baseId}-agent-email`;
  const contactId = `${baseId}-contact-number`;
  const passwordId = `${baseId}-password`;
  const statusId = `${baseId}-status`;
  const agencyId = `${baseId}-agency`;

  useEffect(() => {
    if (!open) {
      setForm({
        agent_name: "",
        agent_email: "",
        contact_number: "",
        password: "",
        agency: "",
        status: "active",
      });
      setErrors({
        agent_name: "",
        agent_email: "",
        contact_number: "",
        password: "",
        agency: "",
      });
      setShowPw(false);
      setSaving(false);
      setSuccessMsg("");
      setSubmitError("");
      setApiErrors([]);
    }
  }, [open]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    if (successMsg) setSuccessMsg("");
    if (submitError) setSubmitError("");
    if (apiErrors.length) setApiErrors([]);
  };

  const onSave = async () => {
    if (saving) return;

    const newErrors = {
      agent_name: "",
      agent_email: "",
      contact_number: "",
      password: "",
      agency: "",
    };

    if (!form.agent_name.trim()) {
      newErrors.agent_name = "Agent name is required.";
    } else if (!isValidAgentName(form.agent_name)) {
      newErrors.agent_name = "Name can only contain letters and spaces.";
    }

    if (!form.agent_email.trim()) {
      newErrors.agent_email = "Agent email is required.";
    } else if (!isValidEmail(form.agent_email)) {
      newErrors.agent_email = "Please enter a valid email address.";
    }

    if (!form.contact_number.trim()) {
      newErrors.contact_number = "Contact number is required.";
    } else if (!isValidContactNumber(form.contact_number)) {
      newErrors.contact_number = "Enter a valid 10-digit mobile number.";
    }

    if (!form.password.trim()) {
      newErrors.password = "Password is required.";
    } else if (!isValidPassword(form.password)) {
      newErrors.password =
        "Password must be 8+ chars with 1 uppercase, 1 number, and 1 special character.";
    }

    if (!form.agency.trim()) {
      newErrors.agency = "Agency is required.";
    }

    const hasError = Object.values(newErrors).some(Boolean);
    if (hasError) {
      setErrors(newErrors);
      return;
    }

    try {
      setSaving(true);
      setSubmitError("");
      setSuccessMsg("");
      setApiErrors([]);

      const resp = await onSubmit?.({
        agent_name: form.agent_name.trim(),
        agent_email: form.agent_email.trim(),
        contact_number: form.contact_number.trim(),
        password: form.password,
        agency: form.agency.trim(),              // ✅ for 2nd API
        is_active: form.status === "active",     // ✅ for 1st API only
      });

      // If nothing returned (e.g., blocked by saving), don’t show success
      if (!resp) return;

      // FIRST API “body failed” guard
      const failedByBody =
        resp?.status === "failed" ||
        (typeof resp?.code === "number" && resp.code >= 400);

      if (failedByBody) {
        const niceErrors = normalizeApiErrors(resp);
        if (niceErrors.length) {
          setApiErrors(niceErrors);
        } else {
          setSubmitError(resp?.message || "Failed to create agent.");
        }
        return;
      }

      // ✅ success only for first API success
      setSuccessMsg("Agent created successfully.");
      setForm({
        agent_name: "",
        agent_email: "",
        contact_number: "",
        password: "",
        agency: "",
        status: "active",
      });
      setShowPw(false);
    } catch (err) {
      const msg =
        err instanceof Error && err.message
          ? err.message
          : "Failed to create agent. Please try again.";
      setSubmitError(msg);
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-3 sm:p-4">
      <div className="w-full max-w-lg max-h-[90vh] rounded-2xl bg-white shadow-2xl border border-gray-200 flex flex-col">
        {/* Header */}
        <div className="px-5 sm:px-6 py-3.5 sm:py-4 border-b border-gray-200">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">
            Add New Agent
          </h3>
          <p className="mt-0.5 text-xs sm:text-sm text-gray-500">
            Create a new agent account
          </p>
        </div>

        {/* Body */}
        <div className="px-5 sm:px-6 py-4 sm:py-5 space-y-4 overflow-y-auto">
          {/* Success */}
          {successMsg && (
            <div className="flex items-start gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
              <CheckCircle2 className="mt-[2px] h-4 w-4" />
              <p>{successMsg}</p>
            </div>
          )}

          {/* Backend structured errors */}
          {apiErrors.length > 0 && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-red-700">
                <AlertTriangle className="h-4 w-4" />
                <span>Couldn’t create agent</span>
              </div>

              <ul className="mt-2 space-y-1.5 text-xs text-red-700">
                {apiErrors.map((e) => (
                  <li
                    key={e.id}
                    className="flex items-start gap-2 rounded-lg bg-white/60 px-2 py-1 border border-red-100"
                  >
                    <XCircle className="mt-[2px] h-3.5 w-3.5 text-red-600" />
                    <div>
                      <p className="font-medium capitalize">
                        {String(e.field).replace(/_/g, " ")}
                      </p>
                      <p className="text-red-600/90">{e.message}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Fallback error */}
          {submitError && apiErrors.length === 0 && (
            <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
              <AlertTriangle className="mt-[2px] h-4 w-4" />
              <p>{submitError}</p>
            </div>
          )}

          {/* Agent name */}
          <div>
            <label htmlFor={nameId} className="text-xs sm:text-sm text-gray-700">
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
            />
            {errors.agent_name && (
              <p className="mt-1 text-xs text-red-500">{errors.agent_name}</p>
            )}
          </div>

          {/* Agent email */}
          <div>
            <label htmlFor={emailId} className="text-xs sm:text-sm text-gray-700">
              Agent email
            </label>
            <input
              id={emailId}
              name="agent_email"
              type="email"
              value={form.agent_email}
              onChange={handleChange}
              className={`mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 transition ${
                errors.agent_email
                  ? "border-red-400 bg-red-50 focus:ring-red-500/40"
                  : "border-gray-300 focus:ring-blue-600/30"
              }`}
              placeholder="name@example.com"
            />
            {errors.agent_email && (
              <p className="mt-1 text-xs text-red-500">{errors.agent_email}</p>
            )}
          </div>

          {/* Contact number */}
          <div>
            <label htmlFor={contactId} className="text-xs sm:text-sm text-gray-700">
              Contact number
            </label>
            <input
              id={contactId}
              name="contact_number"
              type="tel"
              value={form.contact_number}
              onChange={handleChange}
              className={`mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 transition ${
                errors.contact_number
                  ? "border-red-400 bg-red-50 focus:ring-red-500/40"
                  : "border-gray-300 focus:ring-blue-600/30"
              }`}
              placeholder="e.g. 9999888877"
            />
            {errors.contact_number && (
              <p className="mt-1 text-xs text-red-500">
                {errors.contact_number}
              </p>
            )}
          </div>

          {/* Agency */}
          <div>
            <label htmlFor={agencyId} className="text-xs sm:text-sm text-gray-700">
              Agency
            </label>
            <div
              className={`mt-1 flex items-center gap-2 rounded-md border px-3 py-2 focus-within:ring-2 transition ${
                errors.agency
                  ? "border-red-400 bg-red-50 focus-within:ring-red-500/40"
                  : "border-gray-300 bg-white focus-within:ring-blue-600/30"
              }`}
            >
              <Building2 className="h-4 w-4 text-gray-500" />
              <input
                id={agencyId}
                name="agency"
                value={form.agency}
                onChange={handleChange}
                className="w-full bg-transparent outline-none text-sm text-gray-800 placeholder:text-gray-400"
                placeholder="Enter agency name"
              />
            </div>
            {errors.agency && (
              <p className="mt-1 text-xs text-red-500">{errors.agency}</p>
            )}
          </div>

          {/* Status (first API only) */}
          <div>
            <label htmlFor={statusId} className="text-xs sm:text-sm text-gray-700">
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

            <p className="mt-1 text-[11px] text-gray-500 flex items-center gap-1">
              <BadgeCheck className="h-3 w-3" />
              Active users can login immediately.
            </p>
          </div>

          {/* Password */}
          <div>
            <label htmlFor={passwordId} className="text-xs sm:text-sm text-gray-700">
              Set password
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
                placeholder="Enter a secure password"
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
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-3.5 sm:py-4 border-t border-gray-200 flex justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-md border border-gray-200 px-3.5 sm:px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="rounded-md px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white shadow
                       bg-gradient-to-r from-emerald-600 to-blue-600
                       hover:from-emerald-700 hover:to-blue-700 transition
                       disabled:opacity-60 disabled:cursor-not-allowed
                       inline-flex items-center gap-2"
          >
            {saving ? (
              <>
                <span className="h-4 w-4 rounded-full border-2 border-white/70 border-t-transparent animate-spin" />
                Creating...
              </>
            ) : (
              "Create agent"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

AddAgentModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired, // should return Promise with FIRST API json
};
