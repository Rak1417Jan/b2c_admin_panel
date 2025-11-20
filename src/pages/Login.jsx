import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CreditCard, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { loginAdmin } from "../services/LoginApiServices";
import logoImg from "../assets/logo/logo.png";

/* ------------ VALIDATION -------------- */
function isValidEmail(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(trimmed);
}

function isValidPassword(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return false;
  const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
  return passwordRegex.test(trimmed);
}

/* ------------ MAIN COMPONENT -------------- */
export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false); // default hidden
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const navigate = useNavigate();
  const emailId = "login-email";
  const passwordId = "login-password";

  async function onSubmit(e) {
    e.preventDefault();
    setErrorMsg("");
    setEmailError("");
    setPasswordError("");

    let hasError = false;

    if (!email.trim()) {
      setEmailError("Email address is required.");
      hasError = true;
    } else if (!isValidEmail(email)) {
      setEmailError("Please enter a valid email address.");
      hasError = true;
    }

    if (!password.trim()) {
      setPasswordError("Password is required.");
      hasError = true;
    } else if (!isValidPassword(password)) {
      setPasswordError(
        "Password must be at least 8 characters, include 1 uppercase letter and 1 number."
      );
      hasError = true;
    }

    if (hasError) return;

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
      {/* LEFT PANEL */}
      <div className="hidden md:flex flex-col justify-between p-10 bg-gradient-to-br from-emerald-500 via-teal-500 to-blue-600 text-white">
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <img src={logoImg} alt="Bizz 2 Credit Logo" className="h-12" />
          </div>

          <p className="text-white/90 max-w-xs leading-relaxed">
            Empowering businesses with smart financial solutions.
          </p>
        </div>

        <div className="p-6 max-w-md rounded-xl bg-white/10 border border-white/20 backdrop-blur shadow-lg">
          <p className="text-sm leading-relaxed">
            “Bizz 2 Credit transformed how we manage finances — fast, reliable,
            and secure.”
          </p>
          <p className="text-white/80 text-sm mt-3">— Financial Partner</p>
        </div>

        <p className="text-white/80 text-xs">
          © 2025 Bizz 2 Credit. All rights reserved.
        </p>
      </div>

      {/* RIGHT LOGIN FORM */}
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
                {/* EMAIL */}
                <div className="space-y-1.5">
                  <label htmlFor={emailId} className="block text-sm text-gray-700">
                    Email Address
                  </label>
                  <div
                    className={`flex items-center gap-3 rounded-lg border px-3.5 py-3.5 bg-gray-100/60 transition focus-within:ring-2 ${
                      emailError
                        ? "border-red-400 bg-red-50 focus-within:ring-red-500/40 focus-within:border-red-500"
                        : "border-gray-200 focus-within:ring-blue-600/30 focus-within:border-blue-600/40"
                    }`}
                  >
                    <Mail
                      className={`h-4 w-4 ${
                        emailError ? "text-red-500" : "text-gray-500"
                      }`}
                    />
                    <input
                      id={emailId}
                      type="email"
                      placeholder="admin@bizz2credit.com"
                      className="w-full bg-transparent outline-none text-sm text-gray-800 placeholder:text-gray-400"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (emailError) setEmailError("");
                      }}
                    />
                  </div>
                  {emailError && (
                    <p className="text-xs text-red-500 mt-1">{emailError}</p>
                  )}
                </div>

                {/* PASSWORD */}
                <div className="space-y-1.5">
                  <label htmlFor={passwordId} className="block text-sm text-gray-700">
                    Password
                  </label>
                  <div
                    className={`flex items-center gap-3 rounded-lg border px-3.5 py-3.5 bg-gray-100/60 transition focus-within:ring-2 ${
                      passwordError
                        ? "border-red-400 bg-red-50 focus-within:ring-red-500/40 focus-within:border-red-500"
                        : "border-gray-200 focus-within:ring-blue-600/30 focus-within:border-blue-600/40"
                    }`}
                  >
                    <Lock
                      className={`h-4 w-4 ${
                        passwordError ? "text-red-500" : "text-gray-500"
                      }`}
                    />

                    <input
                      id={passwordId}
                      type={showPw ? "text" : "password"}
                      placeholder="Enter your password"
                      className="w-full bg-transparent outline-none text-sm text-gray-800 placeholder:text-gray-400"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (passwordError) setPasswordError("");
                      }}
                    />

                    {/* 🔥 FIXED TOGGLE (OPPOSITE BEHAVIOR IMPLEMENTED) */}
                    <button
                      type="button"
                      onClick={() => setShowPw((s) => !s)}
                      className="p-1.5 rounded-md hover:bg-gray-200/60 transition"
                      aria-label={showPw ? "Hide password" : "Show password"}
                    >
                      {showPw ? (
                        <Eye className="h-4 w-4 text-gray-600" /> // password visible
                      ) : (
                        <EyeOff className="h-4 w-4 text-gray-600" /> // password hidden
                      )}
                    </button>
                  </div>

                  {passwordError && (
                    <p className="text-xs text-red-500 mt-1">{passwordError}</p>
                  )}
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
