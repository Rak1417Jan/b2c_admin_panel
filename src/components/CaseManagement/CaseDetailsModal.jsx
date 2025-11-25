// src/components/CaseManagement/CaseDetailsModal.jsx
import React, { useEffect, useState, useCallback, useRef } from "react";
import PropTypes from "prop-types";
import {
  X,
  Eye,
  MapPin,
  FileText,
  Image as ImageIcon,
  FileDown,
  User,
  Phone,
  Mail,
  Info,
  Tag,
  AlertTriangle,
  BadgeIndianRupee,
  CalendarClock,
  CalendarCheck,
  CalendarX2,
  MapPinned,
  ShieldCheck,
  GraduationCap,
  Users,
  Home,
  Building2,
  Briefcase,
  Landmark,
  Banknote,
  TrendingUp,
  TrendingDown,
  Wallet,
} from "lucide-react";
import { fetchCaseFiles, fetchFileBlob } from "../../services/CaseService";

/* ---------- Extracted child components ---------- */

export function InfoRow({ label, value, icon: Icon }) {
  return (
    <div className="grid grid-cols-12 gap-3 py-2 items-start">
      {/* Left: icon + label */}
      <div className="col-span-5 sm:col-span-4 flex items-start gap-2 min-w-0">
        {Icon ? (
          <span className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex-shrink-0">
            <Icon className="h-4 w-4" />
          </span>
        ) : (
          <span className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gray-50 text-gray-500 border border-gray-100 flex-shrink-0">
            <Info className="h-4 w-4" />
          </span>
        )}

        <span className="text-gray-600 text-sm font-semibold truncate">
          {label}
          <span className="text-gray-400 font-bold"> :</span>
        </span>
      </div>

      {/* Right: value */}
      <div className="col-span-7 sm:col-span-8">
        <span className="block text-gray-900 text-sm font-semibold break-words text-right sm:text-left">
          {value ?? "—"}
        </span>
      </div>
    </div>
  );
}
InfoRow.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.bool,
  ]),
  icon: PropTypes.elementType,
};

export function Section({ title, children, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 via-white to-gray-50 flex items-center gap-2">
        {Icon ? (
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white border border-gray-200 text-gray-700 shadow-sm">
            <Icon className="h-4.5 w-4.5" />
          </span>
        ) : null}
        <h4 className="text-base font-extrabold text-gray-900 tracking-tight">
          {title}
        </h4>
      </div>
      <div className="px-5 py-5">{children}</div>
    </div>
  );
}
Section.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node,
  icon: PropTypes.elementType,
};

/* ----------------------- Document viewer modal ----------------------- */

function DocumentViewerModal({
  open,
  onClose,
  fileMeta,
  objectUrl,
  contentType,
  downloadName,
}) {
  if (!open) return null;

  const isImage =
    /^image\//i.test(contentType) ||
    /\.(png|jpe?g|webp|gif)$/i.test(downloadName || "");
  const isPDF = /pdf/i.test(contentType) || /\.pdf$/i.test(downloadName || "");

  let viewerBody = (
    <div className="py-10 text-center text-sm text-gray-600">
      No preview available.
    </div>
  );
  if (objectUrl) {
    if (isImage) {
      viewerBody = (
        <div className="w-full">
          <img
            src={objectUrl}
            alt={fileMeta?.original_name || "document"}
            className="max-h-[70vh] w-full object-contain rounded-xl border border-gray-200 shadow-lg bg-white"
          />
        </div>
      );
    } else if (isPDF) {
      viewerBody = (
        <iframe
          title={fileMeta?.original_name || "PDF"}
          src={objectUrl}
          className="w-full h-[70vh] rounded-xl border border-gray-200 shadow-lg bg-white"
        />
      );
    } else {
      viewerBody = (
        <div className="flex flex-col items-center justify-center gap-3 py-10">
          <FileText className="h-8 w-8 text-gray-500" />
          <p className="text-sm text-gray-600">
            Preview not supported. You can download the file instead.
          </p>
          <a
            href={objectUrl}
            download={downloadName || fileMeta?.original_name || "file"}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50 transition-all shadow-sm hover:shadow"
          >
            <FileDown className="h-4 w-4" />
            Download
          </a>
        </div>
      );
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-5xl rounded-2xl bg-white border border-gray-200 shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-gray-900 truncate">
              {fileMeta?.original_name || "Document"}
            </h3>
            <p className="text-sm text-gray-600 truncate mt-0.5">
              Type:{" "}
              <span className="font-semibold text-gray-800">
                {fileMeta?.file_type || "—"}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center h-10 w-10 rounded-full border border-gray-300 text-gray-700 hover:bg-white hover:shadow-md transition-all"
            aria-label="Close viewer"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 bg-gray-50">{viewerBody}</div>
      </div>
    </div>
  );
}
DocumentViewerModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  fileMeta: PropTypes.object,
  objectUrl: PropTypes.string,
  contentType: PropTypes.string,
  downloadName: PropTypes.string,
};

/* --------------------------------- Main modal --------------------------------- */

// helper for stable unique keys (no array index in keys)
function makeKey() {
  const cr = globalThis.crypto;
  if (cr?.randomUUID) return cr.randomUUID();
  return Math.random().toString(36).slice(2);
}

// file extension helpers
const isImageName = (name = "") => /\.(png|jpe?g|webp|gif)$/i.test(String(name));

export default function CaseDetailsModal({ open, onClose, caseData }) {
  const [docLoading, setDocLoading] = useState(false);
  const [docError, setDocError] = useState("");
  const [docs, setDocs] = useState([]);

  /**
   * previews: {
   *   [file_id]: {
   *     loading: boolean,
   *     url?: string,
   *     contentType?: string,
   *     name?: string,
   *     isImage?: boolean
   *   }
   * }
   */
  const [previews, setPreviews] = useState({});
  const blobUrlsRef = useRef(new Set()); // to revoke on cleanup

  // Viewer state
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerUrl, setViewerUrl] = useState("");
  const [viewerType, setViewerType] = useState("application/octet-stream");
  const [viewerName, setViewerName] = useState("");
  const [viewerMeta, setViewerMeta] = useState(null);
  const [viewerBorrowed, setViewerBorrowed] = useState(false); // borrowed from previews?

  // stable skeleton keys (avoid index keys)
  const skeletonKeysRef = useRef(Array.from({ length: 6 }, () => makeKey()));

  /* ----------------------- small helpers (reduce nesting) ----------------------- */
  const markImageLoading = useCallback((fileId) => {
    setPreviews((prev) => {
      const next = { ...prev };
      const existing = next[fileId];
      next[fileId] = existing
        ? { ...existing, loading: true, isImage: true }
        : { loading: true, isImage: true };
      return next;
    });
  }, []);

  const setImagePreviewSuccess = useCallback(
    (fileId, { url, contentType, name }) => {
      setPreviews((prev) => {
        const next = { ...prev };
        const existing = next[fileId];
        const base = existing ? { ...existing } : {};
        next[fileId] = {
          ...base,
          loading: false,
          url,
          contentType: contentType || "application/octet-stream",
          name: name || "file",
          isImage: true,
        };
        return next;
      });
    },
    []
  );

  const setImagePreviewFailed = useCallback((fileId) => {
    setPreviews((prev) => {
      const next = { ...prev };
      const existing = next[fileId];
      next[fileId] = existing
        ? { ...existing, loading: false, isImage: true }
        : { loading: false, isImage: true };
      return next;
    });
  }, []);

  const preloadImagePreviews = useCallback(
    async (files, cancelledRef) => {
      // Step 1: mark as loading so UI shows shimmer immediately
      for (const f of files) markImageLoading(f.file_id);

      // Step 2: fetch each image
      for (const f of files) {
        if (cancelledRef.current) break;
        try {
          const { blob, contentType, filename } = await fetchFileBlob(f.file_id);
          if (cancelledRef.current) break;
          const url = URL.createObjectURL(blob);
          blobUrlsRef.current.add(url);
          setImagePreviewSuccess(f.file_id, {
            url,
            contentType,
            name: filename || f.original_name || "file",
          });
        } catch {
          if (cancelledRef.current) break;
          setImagePreviewFailed(f.file_id);
        }
      }
    },
    [markImageLoading, setImagePreviewFailed, setImagePreviewSuccess]
  );

  // Cleanup PREVIEW blob URLs ONLY on unmount
  useEffect(() => {
    return () => {
      for (const url of blobUrlsRef.current) {
        try {
          URL.revokeObjectURL(url);
        } catch {}
      }
      blobUrlsRef.current.clear();
    };
  }, []);

  // Cleanup VIEWER URL when it changes or component unmounts — but NEVER if borrowed
  useEffect(() => {
    return () => {
      if (viewerUrl && !viewerBorrowed) {
        try {
          URL.revokeObjectURL(viewerUrl);
        } catch {}
      }
    };
  }, [viewerUrl, viewerBorrowed]);

  const caseId = caseData?.case_id;

  // Fetch case files when modal opens or case changes
  useEffect(() => {
    if (!open || !caseId) return;
    const cancelledRef = { current: false };

    async function load() {
      setDocError("");
      setDocLoading(true);
      try {
        const files = await fetchCaseFiles(caseId);
        if (cancelledRef.current) return;

        setDocs(files);

        // Preload previews ONLY for images (thumbnails shown inline)
        const imageFiles = files.filter((f) =>
          isImageName(f?.original_name || "")
        );
        await preloadImagePreviews(imageFiles, cancelledRef);
      } catch (e) {
        if (!cancelledRef.current)
          setDocError(e?.message || "Failed to load documents");
      } finally {
        if (!cancelledRef.current) setDocLoading(false);
      }
    }
    load();

    return () => {
      cancelledRef.current = true;
      // revoke existing previews (fresh set will be made on next load)
      for (const url of blobUrlsRef.current) {
        try {
          URL.revokeObjectURL(url);
        } catch {}
      }
      blobUrlsRef.current.clear();
      setPreviews({});
    };
  }, [open, caseId, preloadImagePreviews]);

  const viewDocument = useCallback(
    async (file) => {
      try {
        // If already preloaded (image), reuse it (borrowed URL)
        const p = previews[file.file_id];
        if (p?.url) {
          setViewerBorrowed(true);
          setViewerMeta(file);
          setViewerUrl(p.url); // don't revoke borrowed URL
          setViewerType(p.contentType || "application/octet-stream");
          setViewerName(p.name || file.original_name || "file");
          setViewerOpen(true);
          return;
        }

        // Otherwise fetch on demand (PDF/other types)
        if (viewerUrl && !viewerBorrowed) {
          try {
            URL.revokeObjectURL(viewerUrl);
          } catch {}
        }

        const { blob, contentType, filename } = await fetchFileBlob(
          file.file_id
        );
        const url = URL.createObjectURL(blob);
        setViewerBorrowed(false); // we own this URL
        setViewerMeta(file);
        setViewerUrl(url);
        setViewerType(contentType || "application/octet-stream");
        setViewerName(filename || file.original_name || "file");
        setViewerOpen(true);
      } catch (e) {
        setDocError(e?.message || "Failed to open document");
      }
    },
    [viewerUrl, viewerBorrowed, previews]
  );

  if (!open || !caseData) return null;

  const { demographic_details, business_details, financial_details } = caseData;

  // Explicit statement instead of nested ternary
  let aadhaarMatchText = "—";
  if (typeof demographic_details?.aadhaar_photo_match === "boolean") {
    aadhaarMatchText = demographic_details.aadhaar_photo_match ? "Yes" : "No";
  }

  // Pretty helpers
  const prettyBytes = (n) => {
    const b = Number(n || 0);
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / (1024 * 1024)).toFixed(1)} MB`;
  };
  const prettyDate = (iso) =>
    iso
      ? new Date(iso).toLocaleString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      : "—";
  const googleMapsLink = (lat, lng) =>
    typeof lat === "number" && typeof lng === "number"
      ? `https://maps.google.com/?q=${lat},${lng}`
      : null;

  const fileTypeBadgeTone = (t) => {
    if (!t) return "bg-gray-100 text-gray-700 border-gray-200";
    const v = String(t).toLowerCase();
    if (v.includes("aadhaar"))
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (v.includes("customer"))
      return "bg-blue-50 text-blue-700 border-blue-200";
    if (v.includes("residence"))
      return "bg-amber-50 text-amber-700 border-amber-200";
    if (v.includes("business"))
      return "bg-purple-50 text-purple-700 border-purple-200";
    return "bg-gray-100 text-gray-700 border-gray-200";
  };

  // INR formatter for financial area
  const formatINR = (val) => {
    if (val === null || val === undefined || val === "") return "—";
    const num = Number(val);
    if (Number.isFinite(num)) return `₹${num.toLocaleString("en-IN")}`;
    return String(val);
  };

  /* ---------------- Extracted docs content (no nested ternary) ---------------- */
  let docsContent = null;

  if (docLoading && docs.length === 0) {
    docsContent = (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {skeletonKeysRef.current.map((k) => (
          <div
            key={k}
            className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <div className="h-40 w-full bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl animate-pulse" />
            <div className="mt-4 h-4 w-40 bg-gray-100 rounded animate-pulse" />
            <div className="mt-2 h-3 w-24 bg-gray-100 rounded animate-pulse" />
            <div className="mt-2 h-3 w-28 bg-gray-100 rounded animate-pulse" />
            <div className="mt-4 flex justify-end">
              <div className="h-9 w-20 bg-gray-100 rounded-lg animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  } else if (docs.length === 0) {
    docsContent = (
      <p className="text-sm text-gray-600">
        No documents uploaded for this case.
      </p>
    );
  } else {
    docsContent = (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {docs.map((f) => {
          const badgeClass = fileTypeBadgeTone(f.file_type);
          const mapsHref = googleMapsLink(
            f?.geo_location?.lat,
            f?.geo_location?.lng
          );

          // Geolocation block (explicit)
          let geoNode = <span>—</span>;
          const hasLatLng =
            typeof f?.geo_location?.lat === "number" &&
            typeof f?.geo_location?.lng === "number";
          if (hasLatLng) {
            geoNode = mapsHref ? (
              <a
                className="text-blue-600 hover:text-blue-700 hover:underline font-medium transition-colors"
                href={mapsHref}
                target="_blank"
                rel="noreferrer"
                title="Open in Google Maps"
              >
                {f.geo_location.lat.toFixed(6)},{" "}
                {f.geo_location.lng.toFixed(6)}
              </a>
            ) : (
              <span>
                {f.geo_location.lat}, {f.geo_location.lng}
              </span>
            );
          }

          // Icon by type
          const thumbIcon = isImageName(f.original_name || "") ? (
            <ImageIcon className="h-5 w-5 text-gray-600" />
          ) : (
            <FileText className="h-5 w-5 text-gray-600" />
          );

          // Inline preview: loading shimmer → image (if available)
          const pv = previews[f.file_id];
          let inlinePreview = null;
          if (pv?.isImage) {
            if (pv.loading) {
              inlinePreview = (
                <div className="mt-4 h-48 w-full rounded-xl border border-gray-200 overflow-hidden relative shadow-sm">
                  <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100" />
                </div>
              );
            } else if (pv?.url) {
              inlinePreview = (
                <img
                  src={pv.url}
                  alt={f.original_name || "document"}
                  className="mt-4 h-48 w-full object-cover rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                />
              );
            }
          }

          return (
            <div
              key={f._id || f.file_id}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-lg transition-all"
            >
              {/* Header row */}
              <div className="flex items-center justify-between">
                <span
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${badgeClass}`}
                  title={f.file_type}
                >
                  {thumbIcon}
                  {f.file_type || "document"}
                </span>
                <span className="text-xs font-medium text-gray-500">
                  {prettyBytes(f.file_size)}
                </span>
              </div>

              {/* Name + Uploaded */}
              <div className="mt-4">
                <div className="text-sm font-bold text-gray-900 break-words">
                  {f.original_name || "—"}
                </div>
                <div className="text-xs text-gray-500 mt-1 font-medium">
                  Uploaded: {prettyDate(f.uploaded_at)}
                </div>
              </div>

              {/* Geolocation */}
              <div className="mt-3 flex items-center gap-2 text-sm text-gray-700">
                <MapPin className="h-4 w-4 text-blue-500 flex-shrink-0" />
                <span className="break-all">{geoNode}</span>
              </div>

              {/* Inline preview (images with loading animation) */}
              {inlinePreview}

              {/* Actions */}
              <div className="mt-4 flex items-center justify-between">
                <span className="text-[10px] text-gray-500 font-medium">
                  ID: {f.file_id}
                </span>
                <button
                  type="button"
                  onClick={() => viewDocument(f)}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  title="View document"
                >
                  <Eye className="h-4 w-4" />
                  View
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-6xl rounded-2xl bg-white shadow-2xl border border-gray-300 overflow-hidden">
        {/* Header (single close) */}
        <div className="px-7 py-5 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50">
          <div className="min-w-0">
            <h3 className="text-xl font-extrabold text-gray-900 truncate tracking-tight">
              Case Details
            </h3>
            <p className="text-sm text-gray-600 truncate mt-1">
              Case ID:{" "}
              <span className="font-bold text-gray-800">
                {caseData.case_id}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center h-10 w-10 rounded-full border border-gray-300 text-gray-700 hover:bg-white hover:shadow-lg transition-all"
            aria-label="Close case details"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="px-7 py-6 space-y-6 max-h-[75vh] overflow-y-auto bg-gradient-to-br from-gray-50 via-white to-gray-50">
          {/* Applicant summary */}
          <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="space-y-1">
              <InfoRow
                label="Applicant"
                value={caseData.case_applicant_name}
                icon={User}
              />
              <InfoRow
                label="Contact"
                value={caseData.case_applicant_contact}
                icon={Phone}
              />
              <InfoRow label="Status" value={caseData.status} icon={ShieldCheck} />
              <InfoRow label="Case Type" value={caseData.case_type} icon={Tag} />
              <InfoRow
                label="Priority"
                value={caseData.priority}
                icon={AlertTriangle}
              />
              <InfoRow
                label="Loan Amount"
                value={`₹${Number(caseData.loan_amount || 0).toLocaleString(
                  "en-IN"
                )}`}
                icon={BadgeIndianRupee}
              />
              <InfoRow
                label="Created At"
                value={prettyDate(caseData.created_at)}
                icon={CalendarClock}
              />
              <InfoRow
                label="Assigned At"
                value={prettyDate(caseData.assigned_at)}
                icon={CalendarCheck}
              />
              <InfoRow
                label="Completed At"
                value={prettyDate(caseData.completed_at)}
                icon={CalendarX2}
              />
              <InfoRow
                label="Address"
                value={caseData.address}
                icon={MapPinned}
              />
              {caseData.remarks && (
                <InfoRow label="Remarks" value={caseData.remarks} icon={FileText} />
              )}
            </div>
          </div>

          {/* Uploaded Documents */}
          <Section title="Uploaded Documents" icon={FileText}>
            {docError ? (
              <div className="mb-4 text-sm text-red-600 font-medium">
                {docError}
              </div>
            ) : null}
            {docsContent}
          </Section>

          {/* Demographic */}
          <Section title="Demographic Details" icon={Users}>
            <div className="space-y-1">
              <InfoRow
                label="Email"
                value={demographic_details?.contact_information?.email_id}
                icon={Mail}
              />
              <InfoRow
                label="Mobile"
                value={demographic_details?.contact_information?.mobile_number}
                icon={Phone}
              />
              <InfoRow
                label="Aadhaar Photo Match"
                value={aadhaarMatchText}
                icon={ShieldCheck}
              />
              <InfoRow
                label="Gender"
                value={demographic_details?.personal_details?.gender}
                icon={User}
              />
              <InfoRow
                label="Education"
                value={demographic_details?.personal_details?.education}
                icon={GraduationCap}
              />
              <InfoRow
                label="Family Members"
                value={
                  demographic_details?.personal_details?.number_of_family_members
                }
                icon={Users}
              />
              <InfoRow
                label="Residence Type"
                value={
                  demographic_details?.address_details?.residence_address_type
                }
                icon={Home}
              />
              <InfoRow
                label="City"
                value={demographic_details?.address_details?.city}
                icon={MapPin}
              />
              <InfoRow
                label="State"
                value={demographic_details?.address_details?.state}
                icon={MapPinned}
              />
              <InfoRow
                label="District"
                value={demographic_details?.address_details?.district}
                icon={MapPinned}
              />
              <InfoRow
                label="Pincode"
                value={demographic_details?.address_details?.pincode}
                icon={Landmark}
              />
              <InfoRow
                label="Residential Address"
                value={demographic_details?.address_details?.residential_address}
                icon={MapPinned}
              />
            </div>
          </Section>

          {/* Business */}
          <Section title="Business Details" icon={Building2}>
            <div className="space-y-1">
              <InfoRow
                label="Enterprise"
                value={business_details?.enterprise_information?.enterprise_name}
                icon={Building2}
              />
              <InfoRow
                label="Organization Type"
                value={
                  business_details?.enterprise_information?.type_of_organization
                }
                icon={Briefcase}
              />
              <InfoRow
                label="Location"
                value={
                  business_details?.business_location_details?.business_location
                }
                icon={MapPin}
              />
              <InfoRow
                label="Address Type"
                value={
                  business_details?.business_location_details
                    ?.business_address_type
                }
                icon={Home}
              />
              <InfoRow
                label="Activity"
                value={business_details?.business_activity?.business_activity}
                icon={Briefcase}
              />
              <InfoRow
                label="Activity Type"
                value={business_details?.business_activity?.activity_type}
                icon={Tag}
              />
              <InfoRow
                label="Employees"
                value={business_details?.business_info?.employee_count}
                icon={Users}
              />
              <InfoRow
                label="Years Running"
                value={business_details?.business_info?.years_of_running_business}
                icon={CalendarClock}
              />
              <InfoRow
                label="Additional Business"
                value={business_details?.business_info?.additional_business}
                icon={Briefcase}
              />
              <InfoRow
                label="Business Address"
                value={business_details?.business_address?.address}
                icon={MapPinned}
              />
              <InfoRow
                label="City"
                value={business_details?.business_address?.city}
                icon={MapPin}
              />
              <InfoRow
                label="District"
                value={business_details?.business_address?.district}
                icon={MapPinned}
              />
              <InfoRow
                label="State"
                value={business_details?.business_address?.state}
                icon={MapPinned}
              />
              <InfoRow
                label="Pincode"
                value={business_details?.business_address?.pincode}
                icon={Landmark}
              />
              <InfoRow
                label="Landmark"
                value={business_details?.business_address?.landmark}
                icon={Landmark}
              />
            </div>
          </Section>

          {/* Financial */}
          <Section title="Financial Details" icon={Wallet}>
            <div className="space-y-1">
              <InfoRow
                label="Monthly Income (Business)"
                value={formatINR(
                  financial_details?.business_financial_information
                    ?.monthly_income_from_business
                )}
                icon={TrendingUp}
              />
              <InfoRow
                label="Monthly Expense (Business)"
                value={formatINR(
                  financial_details?.business_financial_information
                    ?.monthly_expense_of_business
                )}
                icon={TrendingDown}
              />
              <InfoRow
                label="Current Loans/EMIs"
                value={formatINR(
                  financial_details?.loans_and_emis?.current_loans_emis
                )}
                icon={Banknote}
              />
              <InfoRow
                label="Monthly Family Income"
                value={formatINR(
                  financial_details?.family_financial_information
                    ?.monthly_family_income
                )}
                icon={BadgeIndianRupee}
              />
              <InfoRow
                label="Working Members"
                value={
                  financial_details?.family_financial_information
                    ?.number_of_working_members
                }
                icon={Users}
              />
              <InfoRow
                label="Monthly Family Expense"
                value={formatINR(
                  financial_details?.family_financial_information
                    ?.monthly_family_expense
                )}
                icon={Wallet}
              />
            </div>
          </Section>
        </div>
      </div>

      {/* Document Viewer */}
      <DocumentViewerModal
        open={viewerOpen}
        onClose={() => {
          setViewerOpen(false);
          setViewerMeta(null);
        }}
        fileMeta={viewerMeta}
        objectUrl={viewerUrl}
        contentType={viewerType}
        downloadName={viewerName}
      />
    </div>
  );
}

CaseDetailsModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  caseData: PropTypes.object,
};
