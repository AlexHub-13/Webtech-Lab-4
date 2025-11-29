import React, { useState } from "react";
import LoginPage from "./pages/LoginPage";
import AdminPage from "./pages/AdminPage";
import TAPage from "./pages/TAPage";
import StudentPage from "./pages/StudentPage";
import ChangePassword from "./components/ChangePassword";

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [role, setRole] = useState(localStorage.getItem("role"));
  const [mustChangePass, setMustChangePass] = useState(false);
  const [pendingToken, setPendingToken] = useState(null);

  const onLogin = (newToken, newRole) => {
    setToken(newToken);
    setRole(newRole);

    localStorage.setItem("token", newToken);
    localStorage.setItem("role", newRole);
  };

  const onLogout = () => {
    setToken(null);
    setRole(null);

    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setMustChangePass(false);
  };

  const onForcePassChange = (tempToken) => {
    setPendingToken(tempToken);
    setMustChangePass(true);
  }

  if (mustChangePass) {
    return <ChangePassword pendingToken={pendingToken} onLogout={onLogout} />;
  }

  if (!token && !mustChangePass) {
    return <LoginPage onLogin={onLogin} onForcePassChange={onForcePassChange} />;
  }

  if (token && !mustChangePass) {
    if (role === "admin") return <AdminPage onLogout={onLogout} />;
    if (role === "ta") return <TAPage onLogout={onLogout} />;
    if (role === "student") return <StudentPage onLogout={onLogout} />;
  }
}