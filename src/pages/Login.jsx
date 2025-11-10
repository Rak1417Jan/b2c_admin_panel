import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CreditCard, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { loginAdmin } from "../services/LoginApiServices";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  const emailId = "login-email";
  const passwordId = "login-password";

  async function onSubmit(e) {
    e.preventDefault();
    setErrorMsg("");
    if (!email.trim() || !password.trim()) return;

    try {
      setLoading(true);
      const res = await loginAdmin(email.trim(), password.trim());
      if (res?.token) {
        navigate("/dashboard", { replace: true });
      } else {
        setErrorMsg(res?.message || "Invalid credentials");
      }
    } catch {
      setErrorMsg("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      {/* LEFT: gradient info panel */}
      <div className="hidden md:flex flex-col justify-between p-10 bg-gradient-to-br from-emerald-500 via-teal-500 to-blue-600 text-white">
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-white/15 border border-white/30 shadow-sm">
              <CreditCard className="h-5 w-5" />
            </div>
            <span className="text-2xl font-semibold tracking-tight">
              Bizz 2 Credit
            </span>
          </div>
          <p className="text-white/90 max-w-xs leading-relaxed">
            Empowering businesses with smart financial solutions.
          </p>
        </div>

        <div className="p-6 max-w-md rounded-xl bg-white/10 border border-white/20 backdrop-blur shadow-lg">
          <p className="text-sm leading-relaxed">
            “Bizz 2 Credit transformed how we manage finances — fast, reliable, and secure.”
          </p>
          <p className="text-white/80 text-sm mt-3">— Financial Partner</p>
        </div>

        <p className="text-white/80 text-xs">
          © 2025 Bizz 2 Credit. All rights reserved.
        </p>
      </div>

      {/* RIGHT: login form */}
      <div className="flex items-center justify-center px-4 md:px-0">
        <div className="w-full max-w-lg md:max-w-xl">
          <div className="rounded-3xl p-[1px] bg-gradient-to-r from-emerald-500/40 via-teal-400/30 to-blue-600/40 shadow-lg">
            <div className="rounded-3xl border border-gray-200 bg-white/95 backdrop-blur-sm p-7 md:p-8">
              <div className="space-y-1.5 mb-6 text-center">
                <h1 className="text-gray-900 text-2xl font-semibold leading-tight">
                  CPV Admin Panel
                </h1>
                <p className="text-gray-500 text-sm">
                  Sign in to access your dashboard
                </p>
              </div>

              <form onSubmit={onSubmit} className="space-y-5" noValidate>
                <div className="space-y-2">
                  <label htmlFor={emailId} className="block text-sm text-gray-700">
                    Email Address
                  </label>
                  <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-100/60 px-3.5 py-3.5 focus-within:ring-2 focus-within:ring-blue-600/30 focus-within:border-blue-600/40 transition">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <input
                      id={emailId}
                      type="email"
                      placeholder="admin@bizz2credit.com"
                      className="w-full bg-transparent outline-none text-sm text-gray-800 placeholder:text-gray-400"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor={passwordId} className="block text-sm text-gray-700">
                    Password
                  </label>
                  <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-100/60 px-3.5 py-3.5 focus-within:ring-2 focus-within:ring-blue-600/30 focus-within:border-blue-600/40 transition">
                    <Lock className="h-4 w-4 text-gray-500" />
                    <input
                      id={passwordId}
                      type={showPw ? "text" : "password"}
                      placeholder="Enter your password"
                      className="w-full bg-transparent outline-none text-sm text-gray-800 placeholder:text-gray-400"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((s) => !s)}
                      className="p-1.5 rounded-md hover:bg-gray-200/60 transition"
                      aria-label={showPw ? "Hide password" : "Show password"}
                    >
                      {showPw ? (
                        <EyeOff className="h-4 w-4 text-gray-600" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>

                {errorMsg && (
                  <p className="text-red-500 text-sm text-center">{errorMsg}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg py-3.5 text-white font-medium shadow-md bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 transition disabled:opacity-60"
                >
                  {loading ? "Signing in..." : "Sign In"}
                </button>
              </form>
            </div>
          </div>

          <p className="text-gray-500/80 text-xs text-center mt-4 md:hidden">
            © 2025 Bizz 2 Credit
          </p>
        </div>
      </div>
    </div>
  );
}
