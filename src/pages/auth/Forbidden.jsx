import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// 1. page not acces
const Forbidden = () => {
  const { currentUser } = useAuth();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-5">
      <div className="max-w-md w-full text-center bg-white rounded-lg p-10 shadow-md">
        <h1 className="text-7xl font-bold text-red-500 leading-none mb-4">403</h1>
        <div className="h-0.5 bg-gray-200 w-16 mx-auto mb-6" />
        <h2 className="text-2xl text-gray-800 mb-4">Akses Ditolak</h2>
        <p className="text-gray-600 text-lg leading-relaxed mb-8">
          Maaf, Anda tidak memiliki izin untuk mengakses halaman ini.
        </p>

        <div className="flex justify-center">
          {currentUser ? (
            <Link
              to="/dashboard"
              className="inline-block bg-blue-500 hover:bg-blue-400 text-white px-5 py-2 rounded font-medium transition-colors"
            >
              Kembali ke Dashboard
            </Link>
          ) : (
            <Link
              to="/login"
              className="inline-block bg-blue-500 hover:bg-blue-400 text-white px-5 py-2 rounded font-medium transition-colors"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default Forbidden;
