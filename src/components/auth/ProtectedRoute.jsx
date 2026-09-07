import React from 'react';
import { Navigate, useLocation  } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
const ProtectedRoute = ({ children, requiredRole = [] }) => {
  const { user, loading, isAuthenticated, checkAuth } = useAuth();
  const location = useLocation();

  React.useEffect(() => {
    if (!isAuthenticated && !loading) {
      // Coba cek ulang status autentikasi dari server saat pertama kali mount
      checkAuth?.(); // pastikan ini tersedia di context
    }
  }, [isAuthenticated, loading, checkAuth]);

  if (loading) {
    return <div className="text-center py-10">Memuat...</div>;
  }

  // Redirect ke login jika tidak autentikasi
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Jika tidak memerlukan role khusus, izinkan akses
  if (!requiredRole || requiredRole.length === 0) {
    return children;
  }

  // Ambil role user dengan fallback string kosong
  const userRole = user?.role_name ?? '';

  // Cek apakah role user termasuk dalam daftar role yang diizinkan
  if (requiredRole.includes(userRole)) {
    return children;
  }

  // Jika role tidak cocok, redirect ke halaman forbidden
  return <Navigate to="/forbidden" replace />;
};

export default ProtectedRoute;
