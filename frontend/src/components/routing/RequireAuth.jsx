// src/components/routing/RequireAuth.jsx
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";

export default function RequireAuth({ children }) {
  let ctx;
  try {
    ctx = useAuth();
  } catch {
    ctx = null;
  }

  const authed = ctx?.authed ?? api.hasToken();
  const loc = useLocation();

  if (!authed) {
    return <Navigate to="/register" replace state={{ from: loc }} />;
  }
  return children;
}
