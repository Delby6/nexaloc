import { Navigate, Outlet } from "react-router-dom";
import { useRole } from "@/hooks/useRole";

export default function RoleRoute({ allowed }) {
  const role = useRole();

  if (role === "guest") {
    return <Navigate to="/user-login" replace />;
  }

  if (!allowed.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
