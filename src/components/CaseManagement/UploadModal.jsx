// src/components/CaseManagement/UploadModal.jsx
import React, { useState } from "react";
import PropTypes from "prop-types";
import {
  Upload,
  X,
  FileSpreadsheet,
  Loader2,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import Papa from "papaparse";
import { uploadCasesFromCSV } from "../../services/UploadService";
import CsvTemplateButton from "./CsvTemplateButton";

export default function UploadModal({ open, onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  if (!open) return null;

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setMessage("");
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      setMessage("Please select a CSV file first.");
      return;
    }
    setUploading(true);
    setMessage("");

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          // Remove completely empty rows (all values falsy/blank)
          const dataRows = (results?.data || []).filter((row) =>
            Object.values(row || {}).some((v) => String(v ?? "").trim() !== "")
          );

          const result = await uploadCasesFromCSV(dataRows);
          const successCount = result.filter((r) => r.status === "success").length;

          setMessage(`✅ Uploaded ${successCount}/${dataRows.length} cases successfully.`);
          setFile(null);
          setTimeout(() => {
            setUploading(false);
            onSuccess?.();
            onClose();
          }, 1200);
        } catch (err) {
          console.error(err);
          setMessage("❌ Error uploading CSV.");
          setUploading(false);
        }
      },
      error: () => {
        setMessage("❌ Failed to read CSV file.");
        setUploading(false);
      },
    });
  };

  /* ---------------- Template CSV: headers + sample rows ---------------- */

  const templateHeaders = [
    "case_applicant_name",
    "case_applicant_contact",
    "address",
    "case_type",
    "priority",
    "loan_amount",

    "demographic_details.contact_information.email_id",
    "demographic_details.contact_information.mobile_number",

    "demographic_details.personal_details.gender",
    "demographic_details.personal_details.education",
    "demographic_details.personal_details.number_of_family_members",

    "demographic_details.address_details.residence_address_type",
    "demographic_details.address_details.residential_address",
    "demographic_details.address_details.city",
    "demographic_details.address_details.state",
    "demographic_details.address_details.district",
    "demographic_details.address_details.pincode",

    "business_details.enterprise_information.enterprise_name",
    "business_details.enterprise_information.type_of_organization",

    "business_details.business_location_details.business_address_type",
    "business_details.business_location_details.business_location",

    "business_details.business_address.address",
    "business_details.business_address.city",
    "business_details.business_address.district",
    "business_details.business_address.state",
    "business_details.business_address.pincode",
    "business_details.business_address.landmark",

    "business_details.business_activity.business_activity",
    "business_details.business_activity.activity_type",

    "business_details.business_info.employee_count",
    "business_details.business_info.years_of_running_business",
    "business_details.business_info.additional_business",

    "financial_details.business_financial_information.monthly_income_from_business",
    "financial_details.business_financial_information.monthly_expense_of_business",
    "financial_details.loans_and_emis.current_loans_emis",
    "financial_details.family_financial_information.monthly_family_income",
    "financial_details.family_financial_information.number_of_working_members",
    "financial_details.family_financial_information.monthly_family_expense",
  ];

  const templateRows = [
    {
      case_applicant_name: "CarryMinati",
      case_applicant_contact: "9876543210",
      address: "123 Main Street, Mumbai, Maharashtra",
      case_type: "Business Loan",
      priority: "MED",
      loan_amount: "500000",

      "demographic_details.contact_information.email_id": "carry@gmail.com",
      "demographic_details.contact_information.mobile_number": "9845037014",

      "demographic_details.personal_details.gender": "Male",
      "demographic_details.personal_details.education": "Post Graduate",
      "demographic_details.personal_details.number_of_family_members": "2",

      "demographic_details.address_details.residence_address_type": "Own",
      "demographic_details.address_details.residential_address": "Flat 902, Koramangala",
      "demographic_details.address_details.city": "",
      "demographic_details.address_details.state": "",
      "demographic_details.address_details.district": "",
      "demographic_details.address_details.pincode": "642487",

      "business_details.enterprise_information.enterprise_name": "Iyer Enterprises",
      "business_details.enterprise_information.type_of_organization": "Sole Proprietorship",

      "business_details.business_location_details.business_address_type": "Rent",
      "business_details.business_location_details.business_location": "Fixed",

      "business_details.business_address.address": "Shop 31, Market Road",
      "business_details.business_address.city": "Surat",
      "business_details.business_address.district": "Central",
      "business_details.business_address.state": "Delhi",
      "business_details.business_address.pincode": "513556",
      "business_details.business_address.landmark": "Near Main Market",

      "business_details.business_activity.business_activity": "Manufacturing",
      "business_details.business_activity.activity_type": "Regular",

      "business_details.business_info.employee_count": "5",
      "business_details.business_info.years_of_running_business": "2",
      "business_details.business_info.additional_business": "Yes",

      "financial_details.business_financial_information.monthly_income_from_business": "67685",
      "financial_details.business_financial_information.monthly_expense_of_business": "80484",
      "financial_details.loans_and_emis.current_loans_emis": "None",
      "financial_details.family_financial_information.monthly_family_income": "179676",
      "financial_details.family_financial_information.number_of_working_members": "3",
      "financial_details.family_financial_information.monthly_family_expense": "139699",
    },
  ];

  const getMessageStyles = () => {
    if (message.startsWith("✅")) return "text-green-700 bg-green-50 border-green-200";
    if (message.startsWith("❌")) return "text-red-700 bg-red-50 border-red-200";
    return "text-gray-700 bg-gray-50 border-gray-200";
  };

  const getMessageIcon = () => {
    if (message.startsWith("✅")) return <CheckCircle className="h-4 w-4 flex-shrink-0" />;
    if (message.startsWith("❌")) return <AlertTriangle className="h-4 w-4 flex-shrink-0" />;
    return null;
  };

  return (
    <div className="fixed inset-0 z-50 p-4 flex items-center justify-center bg-gradient-to-br from-black/70 via-black/60 to-black/70 backdrop-blur-[2px]">
      <div
        className="
          relative w-full max-w-2xl min-w-[320px]
          rounded-2xl border border-gray-200/70
          bg-gradient-to-b from-white to-gray-50
          shadow-[0_20px_60px_-20px_rgba(0,0,0,0.5)]
          transition-all duration-300
        "
      >
        {/* Top gradient accent */}
        <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

        {/* Close */}
        <button
          onClick={onClose}
          className="
            absolute top-3 right-3 z-20 p-2 rounded-xl
            text-gray-400 hover:text-gray-700
            hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30
            transition
          "
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="px-6 pt-6 pb-3 pr-20">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-100 rounded-xl ring-1 ring-indigo-200">
                <FileSpreadsheet className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight text-gray-900">
                  Upload Cases
                </h2>
                <p className="text-sm text-gray-500">Import case details from a CSV file.</p>
              </div>
            </div>

            <div className="sm:mt-0 mt-1">
              <CsvTemplateButton
                headers={templateHeaders}
                rows={templateRows}
                filename="cases_template.csv"
                className="
                  inline-flex shrink-0 items-center gap-2 whitespace-nowrap
                  rounded-xl border border-indigo-200 bg-white
                  px-3 py-2 text-sm font-medium text-indigo-700
                  hover:border-indigo-300 hover:bg-indigo-50
                  focus:outline-none focus:ring-2 focus:ring-indigo-500/30
                  shadow-sm transition
                "
              >
                Download template
              </CsvTemplateButton>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="px-6">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Upload area */}
          <label
            htmlFor="file-input"
            className={`
              group relative block cursor-pointer rounded-2xl
              border-2 border-dashed p-8 text-center
              transition-all
              ${
                file
                  ? "border-indigo-300 bg-indigo-50"
                  : "border-gray-300 bg-white hover:border-indigo-400 hover:bg-indigo-50"
              }
            `}
          >
            <div className="mx-auto w-fit">
              <div className="p-3 bg-white rounded-full mb-3 shadow-sm ring-1 ring-gray-200 group-hover:ring-indigo-200 transition">
                {file ? (
                  <FileSpreadsheet className="h-8 w-8 text-indigo-600" />
                ) : (
                  <Upload className="h-8 w-8 text-gray-400" />
                )}
              </div>
            </div>

            {file ? (
              <>
                <div className="text-sm font-semibold text-gray-900">{file.name}</div>
                <div className="text-xs text-gray-500 mt-1">Click to change file</div>
              </>
            ) : (
              <>
                <div className="text-sm font-semibold text-gray-800">Click to select a CSV file</div>
                <div className="text-xs text-gray-500 mt-1">or drag and drop</div>
              </>
            )}

            <input id="file-input" type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
          </label>

          {/* Message */}
          {message && (
            <div className={`mt-5 text-sm p-3 rounded-xl border flex items-center gap-2 ${getMessageStyles()}`}>
              {getMessageIcon()}
              <span className="flex-1">{message}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <div className="flex justify-end items-center gap-3 flex-nowrap overflow-x-auto">
            <button
              onClick={onClose}
              disabled={uploading}
              className="
                whitespace-nowrap shrink-0
                px-5 py-2.5 text-sm font-medium
                rounded-xl border border-gray-300 bg-white text-gray-700
                hover:bg-gray-50
                focus:outline-none focus:ring-2 focus:ring-gray-300/40
                disabled:opacity-60 disabled:cursor-not-allowed
                transition
              "
            >
              Cancel
            </button>

            <button
              onClick={handleSubmit}
              disabled={uploading || !file}
              className="
                whitespace-nowrap shrink-0 inline-flex items-center gap-2
                px-5 py-2.5 text-sm font-semibold
                rounded-xl
                bg-gradient-to-r from-indigo-600 to-indigo-700 text-white
                hover:from-indigo-700 hover:to-indigo-800
                focus:outline-none focus:ring-2 focus:ring-indigo-500/40
                shadow-sm hover:shadow-md
                disabled:opacity-60 disabled:cursor-not-allowed
                transition
              "
            >
              {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
              {uploading ? "Uploading..." : "Upload File"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

UploadModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func,
};
