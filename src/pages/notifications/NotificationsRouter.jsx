import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useRole } from "@/hooks/useRole";

export default function NotificationsRouter() {
  const role = useRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (role && role !== "guest") {
      navigate(`/notifications/${role}`, { replace: true });
    }
  }, [role, navigate]);

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
      Opening your inbox…
    </div>
  );
}
