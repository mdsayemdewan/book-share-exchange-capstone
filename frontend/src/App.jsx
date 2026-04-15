import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import Pending from './pages/Pending.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminShares from './pages/AdminShares.jsx';
import AdminExchanges from './pages/AdminExchanges.jsx';
import AdminUserProfiles from './pages/AdminUserProfiles.jsx';
import UserDashboard from './pages/UserDashboard.jsx';
import Home from './pages/Home.jsx';
import Exchange from './pages/Exchange.jsx';
import Share from './pages/Share.jsx';
import RatingRanking from './pages/RatingRanking.jsx';
import Profile from './pages/Profile.jsx';


export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/pending" element={<Pending />} />

          <Route path="/rating" element={<RatingRanking />} />
          <Route
            path="/share"
            element={
              <ProtectedRoute role="user">
                <Share />
              </ProtectedRoute>
            }
          />
          <Route
            path="/exchange"
            element={
              <ProtectedRoute role="user">
                <Exchange />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute role="user">
                <UserDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute role="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/shares"
            element={
              <ProtectedRoute role="admin">
                <AdminShares />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/exchanges"
            element={
              <ProtectedRoute role="admin">
                <AdminExchanges />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/user-profiles"
            element={
              <ProtectedRoute role="admin">
                <AdminUserProfiles />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute role="user">
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
