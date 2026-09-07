import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-5">
      <div className="max-w-lg w-full text-center bg-white rounded-lg p-10 shadow-md">
        <h1 className="text-7xl font-bold text-blue-500 m-0 leading-none">404</h1>
        
        <div className="h-0.5 bg-gray-200 mx-auto w-16 my-5"></div>
        
        <h2 className="text-2xl text-gray-800 mb-4">Halaman Tidak Ditemukan</h2>
        
        <p className="text-gray-600 mb-8 text-lg leading-relaxed">
          Maaf, halaman yang Anda cari tidak dapat ditemukan.
        </p>
        
        <div className="flex justify-center">
          <Link 
            to="/dashboard" 
            className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-medium py-2.5 px-5 rounded transition-colors duration-200"
          >
            Kembali ke Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;