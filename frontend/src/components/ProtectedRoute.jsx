import { Navigate } from 'react-router-dom';
import { getAuth } from '../lib/auth';

export default function ProtectedRoute({ children, role }) {
  const auth = getAuth();
  if (!auth?.token) return <Navigate to="/login" replace />;
  if (role && auth?.user?.role !== role) return <Navigate to="/" replace />;
  return children;
}
