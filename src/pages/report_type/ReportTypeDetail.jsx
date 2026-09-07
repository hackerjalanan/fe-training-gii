import React, { useEffect, useState } from 'react';
import { fetchReportTypeList } from '../../service/report-type.service';

const DetailReportType = ({ reportTypeId, onClose }) => {
  const [reportType, setReportType] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Cek apakah report_type_id ada
        if (!reportTypeId) {
          console.error('Jenis Laporan ID is missing');
          setLoading(false);
          return;
        }
        // console.log('Memuat data untuk Jenis Laporan ID:', reportTypeId);
        const data = await fetchReportTypeList({
          report_type_id: reportTypeId
        });
        // console.log('Data response:', data);
        const record = data?.response?.records?.[0];
        setReportType(record || null);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching detail Jenis Laporan:', err);
        setLoading(false);
      }
    };
    
    fetchData();
  }, [reportTypeId]);

  // Handler untuk menutup popup ketika background di-klik
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300"
    >
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl h-auto max-h-[90vh] overflow-y-auto transform transition-all duration-300 ease-in-out"
      >
        {/* Header dengan judul dan tombol close */}
        <div className="relative border-b px-6 py-5">
          <h2 className="text-xl font-bold text-gray-800">Detail Jenis Laporan</h2>
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
          ) : !reportType ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-16 w-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="mt-4 text-gray-600 font-medium">Jenis Laporan tidak ditemukan</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header Info */}
              <div className="bg-gradient-to-r from-indigo-100 to-purple-100 rounded-lg p-5 shadow-sm">
                <h3 className="text-xl font-bold text-indigo-800 mb-2">{reportType.name}</h3>
              </div>
              
              {/* Basic Info */}
              <div className="grid grid-cols-1 gap-4">
                <InfoItem 
                  label="Dibuat Pada" 
                  value={new Date(reportType.created_at).toLocaleString('id-ID')} 
                  icon={
                    <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  } 
                />
              </div>

              {/* Contents Section */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h4 className="text-lg font-semibold text-gray-800">Konten Laporan</h4>
                  <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    {reportType.contents?.length || 0} konten
                  </span>
                </div>
                
                {reportType.contents && reportType.contents.length > 0 ? (
                  <div className="space-y-3">
                    {reportType.contents.map((content, index) => (
                      <ContentItem 
                        key={content.report_content_id} 
                        content={content} 
                        index={index + 1}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                    <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="mt-3 text-gray-500">Belum ada konten laporan</p>
                  </div>
                )}
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

// Component untuk content item
const ContentItem = ({ content, index }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:border-indigo-200 hover:shadow-sm transition-all duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className="bg-indigo-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              {index}
            </span>
            <h5 className="font-semibold text-gray-800">{content.content_name}</h5>
          </div>
          <div className="text-sm text-gray-500 space-y-1">
            <div className="flex flex-wrap gap-4">
              <span>Dibuat: {new Date(content.created_at).toLocaleString('id-ID')}</span>
              <span>Diperbarui: {new Date(content.updated_at).toLocaleString('id-ID')}</span>
            </div>
          </div>
        </div>
        <div className="ml-3">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default DetailReportType;