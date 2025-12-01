import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CreditCard, LogOut, FolderClosed, UsersRound } from "lucide-react";
import AgentStats from "../components/AgentMangament/AgentStats";
import CaseManagement from "../components/CaseManagement/CaseManagement";
import { logoutAdmin } from "../services/LoginApiServices";
import logoImg from "../assets/logo/logo.png";
import EditAgentModal from "../components/AgentMangament/EditAgentModal";

export default function Dashboard() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("agent");
  const [adminName, setAdminName] = useState("");

  useEffect(() => {
    const storedName = localStorage.getItem("adminName");
    if (storedName) setAdminName(storedName);
    else navigate("/", { replace: true }); // no login info, redirect
  }, [navigate]);

  const handleLogout = () => {
    logoutAdmin();
    navigate("/", { replace: true });
  };

  const isAgent = tab === "agent";

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
        <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="leading-tight">
               <img
                            src={logoImg}
                            alt="Bizz 2 Credit Logo Text"
                            className="h-12 object-contain"
                          />
            </div>
          </div>

          {/* Admin name & logout */}
          <div className="flex items-center gap-4">
            <span className="text-gray-700 text-sm font-medium">
              👋 Welcome, <span className="text-emerald-700">{adminName}</span>
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="w-full rounded-lg bg-gray-50 border border-gray-200 p-4">
          <div className="flex items-center gap-2" role="tablist">
            <button
              type="button"
              onClick={() => setTab("agent")}
              className={`inline-flex items-center gap-2 rounded-full text-sm font-medium px-3.5 py-1.5 transition ${
                isAgent
                  ? "bg-gradient-to-r from-emerald-600 to-blue-600 text-white shadow-sm"
                  : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              <UsersRound
                className={`h-4 w-4 ${isAgent ? "text-white" : "text-gray-500"}`}
              />
              Agent Management
            </button>

            <button
              type="button"
              onClick={() => setTab("case")}
              className={`inline-flex items-center gap-2 rounded-full text-sm font-medium px-3.5 py-1.5 transition ${
                !isAgent
                  ? "bg-gradient-to-r from-emerald-600 to-blue-600 text-white shadow-sm"
                  : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              <FolderClosed
                className={`h-4 w-4 ${!isAgent ? "text-white" : "text-gray-500"}`}
              />
              Case Management
            </button>
          </div>

          <section className="mt-3">
            {isAgent ? (
              <>
              <AgentStats />
              </>
            ) : (
              <CaseManagement />
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
