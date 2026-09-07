import React, { useEffect, useState } from 'react';
import { fetchStaffList } from '../../service/staff.service';

const DetailStaff = ({ staffId, onClose }) => {
  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Cek apakah staff_id ada
        if (!staffId) {
          console.error('Staff ID is missing');
          setLoading(false);
          return;
        }
        // console.log('Memuat data untuk staff ID:', staffId);
        const data = await fetchStaffList({
          staff_id: staffId,
          size: 1
        });
        // console.log('Data response:', data);
        const record = data?.response?.records?.[0];
        setStaff(record || null);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching detail staff:', err);
        setLoading(false);
      }
    };
    
    fetchData();
  }, [staffId]);

  // Handler untuk menutup popup ketika background di-klik
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300"
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-md h-auto max-h-[90vh] overflow-y-auto transform transition-all duration-300 ease-in-out"
        onClick={e => e.stopPropagation()}
      >
        {/* Header dengan judul dan tombol close */}
        <div className="relative border-b px-6 py-5">
          <h2 className="text-xl font-bold text-gray-800">Detail Staff</h2>
          <button 
            onClick={onClose}
            className="absolute right-5 top-5 text-gray-400 hover:text-gray-700 transition-colors duration-200 focus:outline-none hover:bg-gray-100 p-1 rounded-full"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        {/* Body content */}
        <div className="px-6 py-5">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin relative">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
                <div className="w-12 h-12 border-4 border-indigo-300 border-b-transparent rounded-full absolute top-0 animate-ping opacity-60"></div>
              </div>
            </div>
          ) : !staff ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-16 w-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="mt-4 text-gray-600 font-medium">Staff tidak ditemukan</p>
              <p className="text-gray-500 text-sm">ID: {staffId}</p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="bg-gradient-to-r from-indigo-100 to-purple-100 rounded-lg p-4 shadow-sm mb-6">
                <h3 className="text-xl font-bold text-indigo-800 mb-1">{staff.name}</h3>
                <p className="text-indigo-600 font-medium">{staff.role?.name || '-'}</p>
              </div>
              
              <div className="grid grid-cols-1 gap-5">
                <InfoItem label="Username" value={staff.username} icon={
                  <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                } />
                
                <InfoItem label="Email" value={staff.email} icon={
                  <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                } />
                
                <InfoItem 
                  label="Status" 
                  customValue={
                    <span 
                      className={`px-3 py-1 rounded-full text-xs font-medium flex items-center w-fit ${
                        staff.status_deleted === 1 
                          ? 'bg-green-100 text-green-700 border border-green-200' 
                          : 'bg-red-100 text-red-700 border border-red-200'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full mr-2 ${
                        staff.status_deleted === 1 ? 'bg-green-500' : 'bg-red-500'
                      }`}></span>
                      {staff.status_deleted === 1 ? 'Aktif' : 'Nonaktif'}
                    </span>
                  }
                  icon={
                    <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                />
                
                <InfoItem 
                  label="Dibuat Pada" 
                  value={new Date(staff.created_at).toLocaleString('id-ID')} 
                  icon={
                    <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  } 
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer dengan tombol */}
        <div className="border-t px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:shadow-sm transition-all duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

// Component untuk item info
const InfoItem = ({ label, value, customValue, icon }) => {
  return (
    <div className="flex items-start space-x-3 p-3 rounded-lg border border-gray-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all duration-200">
      <div className="bg-indigo-100 p-2 rounded-lg">
        {icon}
      </div>
      <div>
        <div className="text-sm text-gray-500 mb-1">{label}</div>
        {customValue || <div className="font-medium text-gray-800">{value || '-'}</div>}
      </div>
    </div>
  );
};

export default DetailStaff;