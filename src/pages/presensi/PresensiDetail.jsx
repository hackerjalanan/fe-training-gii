import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import React, { useEffect, useState } from 'react';
import { fetchPresent } from '../../service/present.service';

const DetailPresence = ({ trainingDetail, trainingSesiId, onClose }) => {
  const [presenceData, setPresenceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get training_sesi_id from either direct prop or trainingDetail
        const sesiId = trainingSesiId || trainingDetail?.training_sesi_id;
        
        if (!sesiId) {
          console.error('Training Session ID is missing');
          setError('ID sesi training tidak ditemukan');
          setLoading(false);
          return;
        }
        console.log('Fetching presence data for training_sesi_id:', sesiId);
        // Call the service with correct parameters (ID first, then search string)
        const data = await fetchPresent(sesiId, "");
        
        console.log('Received presence data:', data);
        if (data?.response) {
          setPresenceData(data.response);
        } else {
          setError('Format data tidak valid');
          console.error('Invalid response format:', data);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching presence data:', err);
        setError('Gagal memuat data presensi. Silakan coba lagi.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [trainingDetail, trainingSesiId]); // Added trainingSesiId to dependency array

  // Handler untuk menutup popup ketika background di-klik
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Function untuk mendapatkan status kehadiran
  const getAttendanceStatus = (status) => {
    if (status === 'hadir') return { text: 'H', color: 'bg-green-500', tooltip: 'Hadir' };
    if (status === 'absen') return { text: 'T', color: 'bg-red-500', tooltip: 'Tidak Hadir' };
    if (status === 'izin') return { text: 'I', color: 'bg-yellow-500', tooltip: 'Izin' };
    if (status === 'sakit') return { text: 'S', color: 'bg-blue-500', tooltip: 'Sakit' };
    return { text: '-', color: 'bg-gray-300', tooltip: 'Tidak ada data' };
  };

  // Function untuk load jsPDF library dari CDN
  const loadJsPDFLibrary = () => {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (window.jsPDF) {
        resolve();
        return;
      }

      // Load jsPDF
      const jsPDFScript = document.createElement('script');
      jsPDFScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      jsPDFScript.onload = () => {
        // Load autoTable plugin
        const autoTableScript = document.createElement('script');
        autoTableScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js';
        autoTableScript.onload = () => resolve();
        autoTableScript.onerror = () => reject(new Error('Failed to load autoTable'));
        document.head.appendChild(autoTableScript);
      };
      jsPDFScript.onerror = () => reject(new Error('Failed to load jsPDF'));
      document.head.appendChild(jsPDFScript);
    });
  };

  // Function untuk generate PDF
  const generatePDF = async () => {
    if (!presenceData?.data?.length) {
      alert('Tidak ada data untuk diunduh');
      return;
    }

    setIsGeneratingPdf(true);

    try {
      const doc = new jsPDF('l', 'mm', 'a4'); // landscape
      doc.setFont('helvetica');

      doc.setFontSize(16);
      doc.text('LAPORAN PRESENSI PESERTA TRAINING', 15, 20);

      doc.setFontSize(12);
      doc.text(`Training: ${trainingDetail?.name || 'Training Session'}`, 15, 30);
      doc.text(`Total Peserta: ${presenceData.data.length}`, 15, 38);
      doc.text(`Total Pertemuan: ${presenceData.meetings?.length || 0}`, 15, 46);
      doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`, 15, 54);

      const tableColumns = [
        { header: 'No', dataKey: 'no' },
        { header: 'Nama Peserta', dataKey: 'name' },
        { header: 'Institusi', dataKey: 'agency' },
        { header: 'Email', dataKey: 'email' },
      ];

      presenceData.meetings?.forEach((_, index) => {
        tableColumns.push({ header: `P${index + 1}`, dataKey: `meeting_${index}` });
      });

      tableColumns.push({ header: 'Tingkat Kehadiran', dataKey: 'present_rate' });

      const tableRows = presenceData.data.map((participant, index) => {
        const row = {
          no: index + 1,
          name: participant.name || 'N/A',
          agency: participant.agency || 'N/A',
          email: participant.email || 'N/A',
          present_rate: participant.present_rate || '0%',
        };
        participant.presences?.forEach((status, i) => {
          const { text } = getAttendanceStatus(status);
          row[`meeting_${i}`] = text;
        });
        return row;
      });

      autoTable(doc, {
        columns: tableColumns,
        body: tableRows,
        startY: 65,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [63, 81, 181], textColor: 255, fontSize: 8 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        columnStyles: {
          no: { halign: 'center', cellWidth: 10 },
          name: { cellWidth: 40 },
          agency: { cellWidth: 35 },
          email: { cellWidth: 40 },
          present_rate: { halign: 'center', cellWidth: 20 },
        },
        didDrawPage: (data) => {
          const pageCount = doc.internal.getNumberOfPages();
          const pageHeight = doc.internal.pageSize.height;
          doc.setFontSize(8);
          doc.text(`Halaman ${data.pageNumber} dari ${pageCount}`, data.settings.margin.left, pageHeight - 10);
        },
      });

      const finalY = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(10).text('Keterangan:', 15, finalY);
      ['H = Hadir', 'T = Tidak Hadir', 'I = Izin', 'S = Sakit', '- = Tidak ada data'].forEach((text, i) => {
        doc.setFontSize(8).text(text, 15 + i * 40, finalY + 8);
      });

      const fileName = `Presensi_${(trainingDetail?.name || 'Training').replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Gagal membuat PDF. Coba lagi.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };


  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300"
    >
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-auto max-h-[90vh] overflow-hidden transform transition-all duration-300 ease-in-out"
      >
        {/* Header dengan judul dan tombol close */}
        <div className="relative border-b px-6 py-5">
          <h2 className="text-xl font-bold text-gray-800">Detail Presensi Peserta</h2>
          <p className="text-sm text-gray-600 mt-1">
            {trainingDetail?.name || 'Training Session'}
          </p>
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
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin relative">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
                <div className="w-12 h-12 border-4 border-indigo-300 border-b-transparent rounded-full absolute top-0 animate-ping opacity-60"></div>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-12 px-6">
              <svg className="mx-auto h-16 w-16 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <p className="mt-4 text-red-600 font-medium">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-3 text-blue-500 hover:text-blue-700 underline font-medium"
              >
                Coba lagi
              </button>
            </div>
          ) : !presenceData?.data?.length ? (
            <div className="text-center py-12 px-6">
              <svg className="mx-auto h-16 w-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="mt-4 text-gray-600 font-medium">Data presensi tidak ditemukan</p>
            </div>
          ) : (
            <div className="px-6 py-5">
              {/* Summary Info */}
              <div className="bg-gradient-to-r from-indigo-100 to-purple-100 rounded-lg p-5 shadow-sm mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-indigo-800 mb-1">Ringkasan Presensi</h3>
                    <p className="text-indigo-600">Total {presenceData.data.length} peserta</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-indigo-600">Total Pertemuan</div>
                    <div className="text-2xl font-bold text-indigo-800">{presenceData.meetings?.length || 0}</div>
                  </div>
                </div>
              </div>

              {/* Attendance Table */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    {/* Table Header */}
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 sticky left-0 bg-gray-50 z-10">
                          <div>
                            <div className="font-semibold">Nama Peserta</div>
                            <div className="text-gray-400 font-normal normal-case">Institusi</div>
                          </div>
                        </th>
                        {presenceData.meetings?.map((meeting, index) => (
                          <th key={index} className="px-4 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                            <div className="flex flex-col items-center">
                              <div className="bg-indigo-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm mb-1">
                                {index + 1}
                              </div>
                              <div className="text-xs text-gray-600 normal-case font-medium text-center leading-tight">
                                {meeting}
                              </div>
                            </div>
                          </th>
                        )) || []}
                        <th className="px-4 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <div className="flex flex-col items-center">
                            <svg className="w-5 h-5 text-indigo-500 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            <div>Tingkat Kehadiran</div>
                          </div>
                        </th>
                      </tr>
                    </thead>
                    {/* Table Body */}
                    <tbody className="bg-white divide-y divide-gray-200">
                      {presenceData.data.map((participant, participantIndex) => (
                        <tr key={participant.participant_id} className={participantIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          {/* Participant Info - Sticky Column */}
                          <td className="px-6 py-4 border-r border-gray-200 sticky left-0 bg-inherit z-10">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center">
                                  <span className="text-white font-medium text-sm">
                                    {participant.name?.charAt(0).toUpperCase() || 'N'}
                                  </span>
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{participant.name || 'Nama tidak tersedia'}</div>
                                <div className="text-xs text-gray-500">{participant.agency || 'Institusi tidak tersedia'}</div>
                                <div className="text-xs text-gray-400">{participant.email || 'Email tidak tersedia'}</div>
                              </div>
                            </div>
                          </td>
                          {/* Attendance Status */}
                          {participant.presences?.map((status, statusIndex) => {
                            const attendanceStatus = getAttendanceStatus(status);
                            return (
                              <td key={statusIndex} className="px-4 py-4 text-center">
                                <div className="flex justify-center">
                                  <div 
                                    className={`w-8 h-8 rounded-full ${attendanceStatus.color} text-white font-bold text-sm flex items-center justify-center cursor-help transition-all duration-200 hover:scale-110`}
                                    title={attendanceStatus.tooltip}
                                  >
                                    {attendanceStatus.text}
                                  </div>
                                </div>
                              </td>
                            );
                          }) || []}
                          {/* Attendance Rate */}
                          <td className="px-4 py-4 text-center">
                            <div className="flex flex-col items-center">
                              <div className="text-lg font-bold text-gray-900 mb-1">
                                {participant.present_rate || '0%'}
                              </div>
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-300"
                                  style={{ width: participant.present_rate || '0%' }}
                                ></div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Legend */}
              <div className="mt-6 bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Keterangan Status:</h4>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-green-500 rounded-full text-white text-xs font-bold flex items-center justify-center">H</div>
                    <span className="text-sm text-gray-600">Hadir</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-red-500 rounded-full text-white text-xs font-bold flex items-center justify-center">T</div>
                    <span className="text-sm text-gray-600">Tidak Hadir</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-yellow-500 rounded-full text-white text-xs font-bold flex items-center justify-center">I</div>
                    <span className="text-sm text-gray-600">Izin</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-blue-500 rounded-full text-white text-xs font-bold flex items-center justify-center">S</div>
                    <span className="text-sm text-gray-600">Sakit</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-gray-300 rounded-full text-white text-xs font-bold flex items-center justify-center">-</div>
                    <span className="text-sm text-gray-600">Tidak ada data</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer dengan tombol */}
        <div className="border-t px-6 py-4 flex justify-end gap-3 bg-white">
          {/* Download PDF Button */}
          {presenceData?.data?.length > 0 && (
            <button
              onClick={generatePDF}
              disabled={isGeneratingPdf}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 hover:shadow-sm transition-all duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isGeneratingPdf ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Membuat PDF...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Unduh PDF
                </>
              )}
            </button>
          )}
          
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

export default DetailPresence;