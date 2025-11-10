// src/components/CaseManagement/CaseDetailsModal.jsx
import React, { useEffect, useState, useCallback, useRef } from "react";
import PropTypes from "prop-types";
import { X, Eye, MapPin, FileText, Image as ImageIcon, FileDown } from "lucide-react";
import { fetchCaseFiles, fetchFileBlob } from "../../services/CaseService";

/* ---------- Extracted child components ---------- */

export function InfoRow({ label, value }) {
  return (
    <div className="grid grid-cols-12 gap-3 py-1.5 items-start">
      <span className="col-span-5 text-gray-500 text-sm">{label}</span>
      <span className="col-span-7 text-gray-900 text-sm font-medium text-right break-words">
        {value ?? "—"}
      </span>
    </div>
  );
}
InfoRow.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.bool]),
};

export function Section({ title, children }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <div className="px-4 py-3 border-b border-gray-100">
        <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
      </div>
      <div className="px-4 py-4">{children}</div>
    </div>
  );
}
Section.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node,
};

/* ----------------------- Document viewer modal ----------------------- */

function DocumentViewerModal({ open, onClose, fileMeta, objectUrl, contentType, downloadName }) {
  if (!open) return null;

  const isImage =
    /^image\//i.test(contentType) || /\.(png|jpe?g|webp|gif)$/i.test(downloadName || "");
  const isPDF = /pdf/i.test(contentType) || /\.pdf$/i.test(downloadName || "");

  let viewerBody = (
    <div className="py-10 text-center text-sm text-gray-600">No preview available.</div>
  );
  if (objectUrl) {
    if (isImage) {
      viewerBody = (
        <div className="w-full">
          <img
            src={objectUrl}
            alt={fileMeta?.original_name || "document"}
            className="max-h-[70vh] w-full object-contain rounded-lg border border-gray-200"
          />
        </div>
      );
    } else if (isPDF) {
      viewerBody = (
        <iframe
          title={fileMeta?.original_name || "PDF"}
          src={objectUrl}
          className="w-full h-[70vh] rounded-lg border border-gray-200"
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
            className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-gray-700 hover:bg-gray-50 transition shadow-sm"
          >
            <FileDown className="h-4 w-4" />
            Download
          </a>
        </div>
      );
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-5xl rounded-2xl bg-white border border-gray-200 shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {fileMeta?.original_name || "Document"}
            </h3>
            <p className="text-sm text-gray-500 truncate">
              Type: <span className="font-medium text-gray-700">{fileMeta?.file_type || "—"}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center h-9 w-9 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50"
            aria-label="Close viewer"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4">{viewerBody}</div>
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

  const setImagePreviewSuccess = useCallback((fileId, { url, contentType, name }) => {
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
  }, []);

  const setImagePreviewFailed = useCallback((fileId) => {
    setPreviews((prev) => {
      const next = { ...prev };
      const existing = next[fileId];
      next[fileId] = existing ? { ...existing, loading: false, isImage: true } : { loading: false, isImage: true };
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
        const imageFiles = files.filter((f) => isImageName(f?.original_name || ""));
        await preloadImagePreviews(imageFiles, cancelledRef);
      } catch (e) {
        if (!cancelledRef.current) setDocError(e?.message || "Failed to load documents");
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

        const { blob, contentType, filename } = await fetchFileBlob(file.file_id);
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
  const prettyDate = (iso) => (iso ? new Date(iso).toLocaleString() : "—");
  const googleMapsLink = (lat, lng) =>
    typeof lat === "number" && typeof lng === "number"
      ? `https://maps.google.com/?q=${lat},${lng}`
      : null;

  const fileTypeBadgeTone = (t) => {
    if (!t) return "bg-gray-100 text-gray-700 border-gray-200";
    const v = String(t).toLowerCase();
    if (v.includes("aadhaar")) return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (v.includes("customer")) return "bg-blue-50 text-blue-700 border-blue-200";
    if (v.includes("residence")) return "bg-amber-50 text-amber-700 border-amber-200";
    if (v.includes("business")) return "bg-purple-50 text-purple-700 border-purple-200";
    return "bg-gray-100 text-gray-700 border-gray-200";
  };

  /* ---------------- Extracted docs content (no nested ternary) ---------------- */
  let docsContent = null;

  if (docLoading && docs.length === 0) {
    docsContent = (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {skeletonKeysRef.current.map((k) => (
          <div key={k} className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="h-36 w-full bg-gray-100 rounded-lg animate-pulse" />
            <div className="mt-3 h-4 w-40 bg-gray-100 rounded animate-pulse" />
            <div className="mt-2 h-3 w-24 bg-gray-100 rounded animate-pulse" />
            <div className="mt-2 h-3 w-28 bg-gray-100 rounded animate-pulse" />
            <div className="mt-3 flex justify-end">
              <div className="h-8 w-20 bg-gray-100 rounded-md animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  } else if (docs.length === 0) {
    docsContent = <p className="text-sm text-gray-600">No documents uploaded for this case.</p>;
  } else {
    docsContent = (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {docs.map((f) => {
          const badgeClass = fileTypeBadgeTone(f.file_type);
          const mapsHref = googleMapsLink(f?.geo_location?.lat, f?.geo_location?.lng);

          // Geolocation block (explicit)
          let geoNode = <span>—</span>;
          const hasLatLng =
            typeof f?.geo_location?.lat === "number" &&
            typeof f?.geo_location?.lng === "number";
          if (hasLatLng) {
            geoNode = mapsHref ? (
              <a
                className="text-blue-600 hover:underline"
                href={mapsHref}
                target="_blank"
                rel="noreferrer"
                title="Open in Google Maps"
              >
                {f.geo_location.lat.toFixed(6)}, {f.geo_location.lng.toFixed(6)}
              </a>
            ) : (
              <span>
                {f.geo_location.lat}, {f.geo_location.lng}
              </span>
            );
          }

          // Icon by type
          const thumbIcon = isImageName(f.original_name || "") ? (
            <ImageIcon className="h-6 w-6 text-gray-600" />
          ) : (
            <FileText className="h-6 w-6 text-gray-600" />
          );

          // Inline preview: loading shimmer → image (if available)
          const pv = previews[f.file_id];
          let inlinePreview = null;
          if (pv?.isImage) {
            if (pv.loading) {
              inlinePreview = (
                <div className="mt-3 h-44 w-full rounded-lg border border-gray-200 overflow-hidden relative">
                  <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100" />
                </div>
              );
            } else if (pv?.url) {
              inlinePreview = (
                <img
                  src={pv.url}
                  alt={f.original_name || "document"}
                  className="mt-3 h-44 w-full object-cover rounded-lg border border-gray-200"
                />
              );
            }
          }

          return (
            <div
              key={f._id || f.file_id}
              className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              {/* Header row */}
              <div className="flex items-center justify-between">
                <span
                  className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium ${badgeClass}`}
                  title={f.file_type}
                >
                  {thumbIcon}
                  {f.file_type || "document"}
                </span>
                <span className="text-xs text-gray-500">{prettyBytes(f.file_size)}</span>
              </div>

              {/* Name + Uploaded */}
              <div className="mt-3">
                <div className="text-sm font-semibold text-gray-900 break-words">
                  {f.original_name || "—"}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  Uploaded: {prettyDate(f.uploaded_at)}
                </div>
              </div>

              {/* Geolocation */}
              <div className="mt-3 flex items-center gap-2 text-sm text-gray-700">
                <MapPin className="h-4 w-4 text-blue-500" />
                {geoNode}
              </div>

              {/* Inline preview (images with loading animation) */}
              {inlinePreview}

              {/* Actions */}
              <div className="mt-4 flex items-center justify-between">
                <span className="text-[11px] text-gray-500">File ID: {f.file_id}</span>
                <button
                  type="button"
                  onClick={() => viewDocument(f)}
                  className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-gray-700 hover:bg-gray-50 transition shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-5xl rounded-2xl bg-white shadow-xl border border-gray-200">
        {/* Header (single close) */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">Case Details</h3>
            <p className="text-sm text-gray-500 truncate">
              Case ID: <span className="font-medium text-gray-700">{caseData.case_id}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center h-9 w-9 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50"
            aria-label="Close case details"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="px-6 py-5 space-y-5 max-h-[72vh] overflow-y-auto">
          {/* Applicant summary */}
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InfoRow label="Applicant" value={caseData.case_applicant_name} />
              <InfoRow label="Contact" value={caseData.case_applicant_contact} />
              <InfoRow label="Status" value={caseData.status} />
              <InfoRow label="Case Type" value={caseData.case_type} />
              <InfoRow label="Priority" value={caseData.priority} />
              <InfoRow
                label="Loan Amount"
                value={`₹${Number(caseData.loan_amount || 0).toLocaleString("en-IN")}`}
              />
              <InfoRow label="Created At" value={caseData.created_at} />
              <InfoRow label="Assigned At" value={caseData.assigned_at} />
              <InfoRow label="Completed At" value={caseData.completed_at} />
            </div>
            <div className="mt-3">
              <InfoRow label="Address" value={caseData.address} />
            </div>
            {caseData.remarks ? (
              <div className="mt-3">
                <InfoRow label="Remarks" value={caseData.remarks} />
              </div>
            ) : null}
          </div>

          {/* Uploaded Documents */}
          <Section title="Uploaded Documents">
            {docError ? <div className="mb-3 text-sm text-red-600">{docError}</div> : null}
            {docsContent}
          </Section>

          {/* Demographic */}
          <Section title="Demographic Details">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InfoRow label="Email" value={demographic_details?.contact_information?.email_id} />
              <InfoRow label="Mobile" value={demographic_details?.contact_information?.mobile_number} />
              <InfoRow label="Aadhaar Photo Match" value={aadhaarMatchText} />
              <InfoRow label="Gender" value={demographic_details?.personal_details?.gender} />
              <InfoRow label="Education" value={demographic_details?.personal_details?.education} />
              <InfoRow
                label="Family Members"
                value={demographic_details?.personal_details?.number_of_family_members}
              />
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <InfoRow
                label="Residence Type"
                value={demographic_details?.address_details?.residence_address_type}
              />
              <InfoRow label="City" value={demographic_details?.address_details?.city} />
              <InfoRow label="State" value={demographic_details?.address_details?.state} />
              <InfoRow label="District" value={demographic_details?.address_details?.district} />
              <InfoRow label="Pincode" value={demographic_details?.address_details?.pincode} />
              <div className="md:col-span-3">
                <InfoRow
                  label="Residential Address"
                  value={demographic_details?.address_details?.residential_address}
                />
              </div>
            </div>
          </Section>

          {/* Business */}
          <Section title="Business Details">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InfoRow
                label="Enterprise"
                value={business_details?.enterprise_information?.enterprise_name}
              />
              <InfoRow
                label="Organization Type"
                value={business_details?.enterprise_information?.type_of_organization}
              />
              <InfoRow
                label="Location"
                value={business_details?.business_location_details?.business_location}
              />
              <InfoRow
                label="Address Type"
                value={business_details?.business_location_details?.business_address_type}
              />
              <InfoRow
                label="Activity"
                value={business_details?.business_activity?.business_activity}
              />
              <InfoRow
                label="Activity Type"
                value={business_details?.business_activity?.activity_type}
              />
              <InfoRow label="Employees" value={business_details?.business_info?.employee_count} />
              <InfoRow
                label="Years Running"
                value={business_details?.business_info?.years_of_running_business}
              />
              <InfoRow
                label="Additional Business"
                value={business_details?.business_info?.additional_business}
              />
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-3">
                <InfoRow label="Business Address" value={business_details?.business_address?.address} />
              </div>
              <InfoRow label="City" value={business_details?.business_address?.city} />
              <InfoRow label="District" value={business_details?.business_address?.district} />
              <InfoRow label="State" value={business_details?.business_address?.state} />
              <InfoRow label="Pincode" value={business_details?.business_address?.pincode} />
              <InfoRow label="Landmark" value={business_details?.business_address?.landmark} />
            </div>
          </Section>

          {/* Financial */}
          <Section title="Financial Details">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InfoRow
                label="Monthly Income (Business)"
                value={financial_details?.business_financial_information?.monthly_income_from_business}
              />
              <InfoRow
                label="Monthly Expense (Business)"
                value={financial_details?.business_financial_information?.monthly_expense_of_business}
              />
              <InfoRow
                label="Current Loans/EMIs"
                value={financial_details?.loans_and_emis?.current_loans_emis}
              />
              <InfoRow
                label="Monthly Family Income"
                value={financial_details?.family_financial_information?.monthly_family_income}
              />
              <InfoRow
                label="Working Members"
                value={financial_details?.family_financial_information?.number_of_working_members}
              />
              <InfoRow
                label="Monthly Family Expense"
                value={financial_details?.family_financial_information?.monthly_family_expense}
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
