import { Navigate } from 'react-router-dom';
import { useAdmin } from '../hooks/useAdmin';

export default function AdminRoute({ children }) {
  const { isAdmin, loading } = useAdmin();

  if (loading) return <div>Checking permissions…</div>;

  if (!isAdmin) {
    return <Navigate to="/not-authorized" replace />;
  }

  return children;
}
