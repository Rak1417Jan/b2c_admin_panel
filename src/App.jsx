// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard.jsx"; // <— now a separate page
import Login from "./pages/Login";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
