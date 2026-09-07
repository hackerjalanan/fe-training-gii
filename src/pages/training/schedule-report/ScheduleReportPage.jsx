import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Eye, Edit, Trash2, Search, Filter, RefreshCw, ChevronDown, ChevronUp, Calendar, X } from 'lucide-react';
import { fetchReportScheduleList, deleteReportSchedule } from '../../../service/report-schedule.service';
import { fetchTrainingSesi } from '../../../service/master-data.service'; // Sesuaikan path
import Swal from 'sweetalert2';
import { useLocation, useParams } from 'react-router-dom';

import UpdateScheduleReportForm from './ScheduleReportUpdate';
import CreateScheduleReport from './ScheduleReportInput';

const ScheduleReportPage = () => {
  // State for Report Schedule data and pagination
  const { trainingSesiId: sesiId } = useParams();
  const routerLocation = useLocation();
  
  // Fixed: Get trainingSesiId from either URL params or query params
  const trainingSesiId = sesiId || new URLSearchParams(routerLocation.search).get('training_sesi_id');
  
  console.log('Training Sesi ID:', trainingSesiId); // Debug log
  
  const [reportScheduleData, setReportScheduleData] = useState({
    records: [],
    page: {
      total_record_count: 0,
      maxPage: 1,
      batch_number: 1,
      raw_length: 0,
      max_raw_size: 5
    },
    permissions: {
      canCreate: false,
      canRead: false,
      canUpdate: false,
      canDelete: false
    }
  });
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [currentBatch, setCurrentBatch] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [loadingTrainingSesi, setLoadingTrainingSesi] = useState(false);
  const [trainingSesiInfo, setTrainingSesiInfo] = useState(null);
  
  // State for popup modals
  const [selectedReportScheduleId, setSelectedReportScheduleId] = useState(null);
  const [showDetailPopup, setShowDetailPopup] = useState(false);
  const [showAddReportSchedulePopup, setShowAddReportSchedulePopup] = useState(false);

  // Load Training Sesi Info - separate function
  const loadTrainingSesiInfo = useCallback(async () => {
      if (!trainingSesiId) {
        setError('Training Session ID is required');
        setLoadingTrainingSesi(false);
        return;
      }
  
      try {
        setLoadingTrainingSesi(true);
        const response = await fetchTrainingSesi();
        console.log('Training sesi response:', response); // Debug log
        
        // Cek berbagai kemungkinan struktur response
        let trainingSesiList = [];
        if (response?.response) {
          trainingSesiList = response.response;
        } else if (response?.data) {
          trainingSesiList = response.data;
        } else if (Array.isArray(response)) {
          trainingSesiList = response;
        }
        
        console.log('Training sesi list:', trainingSesiList); // Debug log
        
        // Find the specific training session
        const trainingSesi = trainingSesiList.find(item => {
          // Konversi ke string untuk perbandingan yang lebih aman
          const itemId = String(item.training_sesi_id || item.id);
          const searchId = String(trainingSesiId);
          
          return itemId === searchId && 
                //  item.status_active === 'active' && 
                 (item.status_deleted === 1 || item.status_deleted === true);
        });
        
        console.log('Found training sesi:', trainingSesi); // Debug log
        
        if (trainingSesi) {
          setTrainingSesiInfo(trainingSesi);
        } else {
          // Coba cari tanpa filter status jika tidak ditemukan
          const fallbackTrainingSesi = trainingSesiList.find(item => {
            const itemId = String(item.training_sesi_id || item.id);
            const searchId = String(trainingSesiId);
            return itemId === searchId;
          });
          
          if (fallbackTrainingSesi) {
            setTrainingSesiInfo(fallbackTrainingSesi);
            console.warn('Training sesi ditemukan tapi mungkin tidak aktif:', fallbackTrainingSesi);
          } else {
            console.error('Training session tidak ditemukan untuk ID:', trainingSesiId);
            setTrainingSesiInfo(null);
          }
        }
      } catch (err) {
        console.error('Error loading training sesi:', err);
        setTrainingSesiInfo(null);
      } finally {
        setLoadingTrainingSesi(false);
      }
    }, [trainingSesiId]);

  // Load Report Schedule data - wrapped in useCallback to prevent infinite re-renders
  const loadReportScheduleData = useCallback(async () => {
    // Check if trainingSesiId exists before making API call
    if (!trainingSesiId) {
      setError('Training Session ID is required');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetchReportScheduleList({
        report_schedule_id: "",
        type_report_id: "",
        training_sesi_id: trainingSesiId,
        search: searchQuery,
        batch: currentBatch,
        size: 5
      });
      
      setReportScheduleData(response.response);
    } catch (err) {
      setError('Failed to load jadwal laporan data. Please try again.');
      console.error('Error loading jadwal laporan data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentBatch, searchQuery, trainingSesiId]);

  // Load data on initial render and when dependencies change
  useEffect(() => {
    if (trainingSesiId) {
      loadTrainingSesiInfo();
      loadReportScheduleData();
    }
  }, [loadTrainingSesiInfo, loadReportScheduleData]);

  // Function to handle filter application
  const applyFilters = () => {
    setCurrentBatch(1); // Reset to first page when applying filters
    loadReportScheduleData();
  };

  // Function to reset filters
  const resetFilters = () => {
    setSearchQuery('');
    setCurrentBatch(1);
    // Wait for state updates to finish, then load data
    setTimeout(() => loadReportScheduleData(), 0);
  };

  // Handle pagination
  const handleNextPage = () => {
    if (currentBatch < reportScheduleData.page.maxPage) {
      setCurrentBatch(prev => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentBatch > 1) {
      setCurrentBatch(prev => prev - 1);
    }
  };

  const handlePageChange = (pageNumber) => {
    setCurrentBatch(pageNumber);
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return '-';
    }
  };

  // Format datetime for display
  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting datetime:', error);
      return '-';
    }
  };
  
  const handleUpdateSuccess = () => {
    // Reload the report schedule list after successful update
    loadReportScheduleData();
  };
  
  // Update report schedule
  const handleUpdateClick = (reportScheduleId) => {
    setSelectedReportScheduleId(reportScheduleId);
    setShowUpdateForm(true);
  };

  // Function to handle report schedule detail click
  const handleReportScheduleClick = (reportScheduleId) => {
    setSelectedReportScheduleId(reportScheduleId);
    setShowDetailPopup(true);
  };
  
  // Function to close detail popup
  const handleClosePopup = () => {
    setShowDetailPopup(false);
    setSelectedReportScheduleId(null);
  };

  // Function to handle delete report schedule click
  const handleDeleteReportScheduleClick = async (reportScheduleId) => {
    try {
      const confirmResult = await Swal.fire({
        title: 'Apakah Anda yakin?',
        text: 'Jadwal laporan ini akan dihapus secara permanen.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#aaa',
        confirmButtonText: 'Ya, hapus!',
        cancelButtonText: 'Batal'
      });

      if (confirmResult.isConfirmed) {
        const result = await deleteReportSchedule({ id: reportScheduleId });

        await Swal.fire({
          title: 'Berhasil!',
          text: 'Jadwal laporan berhasil dihapus.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });

        resetFilters(); // Refresh data atau filter
        return result;
      }
    } catch (error) {
      await Swal.fire({
        title: 'Gagal!',
        text: `Gagal menghapus jadwal laporan: ${error.message}`,
        icon: 'error'
      });
    }
  };

  // Function to handle add report schedule button click
  const handleAddReportSchedule = () => {
    setShowAddReportSchedulePopup(true);
  };

  // Function to handle successful report schedule creation
  const handleReportScheduleCreationSuccess = () => {
    resetFilters(); // Refresh the report schedule list
    setShowAddReportSchedulePopup(false);
  };

  // Function to generate pagination buttons
  const renderPaginationButtons = () => {
    const totalPages = reportScheduleData.page.maxPage;
    const currentPage = currentBatch;
    let pages = [];

    // If we have 7 or fewer pages, show all page buttons
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // We have many pages, so we need to show a subset
      pages.push(1);

      if (currentPage < 5) {
        pages.push(2, 3, 4, 5, '...', totalPages);
      }
      else if (currentPage > totalPages - 4) {
        pages.push('...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      }
      else {
        pages.push('...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }

    return pages.map((page, index) => {
      if (page === '...') {
        return (
          <span key={`ellipsis-${index}`} className="relative inline-flex items-center justify-center h-10 w-10 border border-gray-200 bg-white text-gray-500">
            ...
          </span>
        );
      }
      
      return (
        <button
          key={page}
          onClick={() => handlePageChange(page)}
          className={`relative inline-flex items-center justify-center h-10 w-10 border ${
            currentPage === page
              ? 'bg-purple-500 text-white border-purple-500'
              : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
          } transition-all`}
        >
          {page}
        </button>
      );
    });
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Header Modern */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-700 py-6 px-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <div className="flex-1">
                
                {/* Training Session Info */}
                <div className="mb-3">
                  {loadingTrainingSesi ? (
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 flex items-center">
                      <div className="mr-2 h-4 w-4 border-t-2 border-white/60 rounded-full animate-spin"></div>
                      <span className="text-white/80">Memuat training sesi...</span>
                    </div>
                  ) : trainingSesiInfo ? (
                    <div className="rounded-lg px-4 py-2">
                      <div className="text-white font-medium">
                      Jadwal Laporan: {trainingSesiInfo.name}
                      </div>
                      <div className="text-purple-100 text-sm">
                        <div>
                        📍 Tempat: {trainingSesiInfo.location || 'Tidak tersedia'}
                        </div>
                      
                        <div>
                        📅 Periode: {formatDate(trainingSesiInfo.start_date)} - {formatDate(trainingSesiInfo.end_date)}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-red-500/20 backdrop-blur-sm rounded-lg px-4 py-2">
                      <div className="text-red-100 text-sm">
                        ⚠️ Training session tidak ditemukan (ID: {trainingSesiId})
                      </div>
                    </div>
                  )}
                </div>
              </div>
                {reportScheduleData.permissions?.canCreate && (
                  <button
                    onClick={handleAddReportSchedule}
                    disabled={trainingSesiInfo?.status_active === 'finish'}
                    className={`mt-4 md:mt-0 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm
                      ${trainingSesiInfo?.status_active === 'finish'
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-white hover:bg-purple-50 text-purple-700'}
                    `}
                  >
                    <Plus size={16} />
                    <span>Buat Jadwal Laporan</span>
                  </button>
                )}
            </div>
          </div>

          {/* Pencarian dan Filter */}
          <div className="p-5 border-b border-gray-100">
            {/* Bar Pencarian */}
            <div className="mb-4">
              <div className="relative">
                <div className="flex items-center">
                  <div className="flex items-center relative w-full">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search size={18} className="text-gray-400" />
                    </div>

                    <input
                      type="text"
                      placeholder="Cari berdasarkan nama jenis laporan..."
                      className="block w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          applyFilters();
                        }
                      }}
                    />

                    {searchQuery && (
                      <button
                        onClick={resetFilters}
                        className="absolute right-2 text-gray-400 hover:text-gray-600 transition-all"
                        title="Reset"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Status Loading dan Error */}
          {isLoading && (
            <div className="flex justify-center items-center p-12">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500"></div>
                <p className="mt-3 text-sm text-gray-500">Memuat data jadwal laporan...</p>
              </div>
            </div>
          )}
          
          {error && (
            <div className="m-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center">
              <div className="mr-3 flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div>{error}</div>
            </div>
          )}

          {/* Bagian Tabel */}
          {!isLoading && !error && (
            <>
              {/* Tampilan Kartu Mobile */}
              <div className="block md:hidden p-4 space-y-4">
                {reportScheduleData.records && reportScheduleData.records.length > 0 ? (
                  reportScheduleData.records.map((reportSchedule, index) => (
                    <div key={reportSchedule.report_schedule_id} className="bg-white rounded-xl shadow border border-gray-200 p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h2 className="font-semibold text-gray-800">{reportSchedule.report_type?.name || 'Jenis Laporan Tidak Tersedia'}</h2>
                      </div>

                      <p className="text-sm text-gray-600 mb-2">
                        <strong>Mulai:</strong> {formatDateTime(reportSchedule.start_date)}
                      </p>
                      <p className="text-sm text-gray-600 mb-2">
                        <strong>Selesai:</strong> {formatDateTime(reportSchedule.end_date)}
                      </p>
                      <p className="text-sm text-gray-600 mb-2">
                        <strong>Dibuat:</strong> {formatDate(reportSchedule.created_at)}
                      </p>

                      <div className="flex justify-end gap-2 mt-4">
                            {/* Tombol Edit */}
                            {reportScheduleData.permissions?.canUpdate && (
                              <button 
                                onClick={() => handleUpdateClick(reportSchedule.report_schedule_id)}
                                disabled={trainingSesiInfo?.status_active === 'finish'}
                                className={`px-2 py-1 rounded text-xs transition-all
                                  ${trainingSesiInfo?.status_active === 'finish'
                                    ? 'text-gray-400 cursor-not-allowed'
                                    : 'text-yellow-500 hover:text-blue-900'}
                                `}
                                title="Edit"
                              >   
                                <Edit size={14} />
                              </button>
                            )}

                            {/* Tombol Hapus */}
                            {reportScheduleData.permissions?.canDelete && (
                              <button 
                                onClick={() => handleDeleteReportScheduleClick(reportSchedule.report_schedule_id)}
                                disabled={trainingSesiInfo?.status_active === 'finish'}
                                className={`px-2 py-1 rounded text-xs transition-all
                                  ${trainingSesiInfo?.status_active === 'finish'
                                    ? 'text-gray-400 cursor-not-allowed'
                                    : 'text-red-500 hover:text-red-900'}
                                `}
                                title="Hapus"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>

                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500">
                    Data jadwal laporan tidak ditemukan
                  </div>
                )}
              </div>

              {/* Tampilan Tabel Desktop */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th scope="col" className="px-3 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
                      <th scope="col" className="px-3 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jenis Laporan</th>
                      <th scope="col" className="px-3 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jadwal</th>
                      <th scope="col" className="px-3 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pengerjaan</th>
                      <th scope="col" className="px-3 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dibuat</th>
                      <th scope="col" className="px-3 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {reportScheduleData.records && reportScheduleData.records.length > 0 ? (
                      reportScheduleData.records.map((reportSchedule, index) => (
                        <tr key={reportSchedule.report_schedule_id} className="hover:bg-purple-50/30 transition-colors">
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                            {((currentBatch - 1) * reportScheduleData.page.max_raw_size) + index + 1}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-9 w-9 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
                                <Calendar size={16} />
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">
                                  {reportSchedule.report_type?.name || 'Jenis Laporan Tidak Tersedia'}
                                </div>
                              </div>
                            </div>
                          </td>
                            <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                              <p>{formatDateTime(reportSchedule.start_date)}</p>
                              <p>s.d {formatDateTime(reportSchedule.end_date)}</p>
                            </td>

                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                              {reportSchedule.status_dibuat}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(reportSchedule.created_at)}
                          </td>

                          <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-center gap-2">
                              {/* Edit */}
                              {reportScheduleData.permissions?.canUpdate && (
                                <button 
                                  onClick={() => handleUpdateClick(reportSchedule.report_schedule_id)}
                                  disabled={trainingSesiInfo?.status_active === 'finish'}
                                  className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs transition-colors
                                    ${trainingSesiInfo?.status_active === 'finish'
                                      ? 'text-gray-400 cursor-not-allowed'
                                      : 'text-blue-500 hover:text-blue-900'}
                                  `}
                                  title="Perbarui jadwal laporan"
                                >
                                  <Edit size={14} className="mr-1" />
                                </button>
                              )}

                              {/* Hapus */}
                              {reportScheduleData.permissions?.canDelete && (
                                <button 
                                  onClick={() => handleDeleteReportScheduleClick(reportSchedule.report_schedule_id)}
                                  disabled={trainingSesiInfo?.status_active === 'finish'}
                                  className={`px-2 py-1 rounded text-xs transition-colors
                                    ${trainingSesiInfo?.status_active === 'finish'
                                      ? 'text-gray-400 cursor-not-allowed'
                                      : 'text-red-500 hover:text-red-900'}
                                  `}
                                  title="Hapus"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-3 py-10 text-center text-gray-500">
                          <div className="flex flex-col items-center">
                            <div className="bg-gray-100 p-4 rounded-full mb-3">
                              <Calendar size={24} className="text-gray-400" />
                            </div>
                            <p className="text-gray-600 font-medium">Jadwal laporan tidak ditemukan</p>
                            <p className="text-gray-500 text-sm mt-1">Coba sesuaikan filter Anda atau tambahkan jadwal laporan baru</p>
                              {reportScheduleData.permissions?.canCreate && (
                                <button
                                  onClick={handleAddReportSchedule}
                                  disabled={trainingSesiInfo?.status_active === 'finish'}
                                  className={`mt-4 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm
                                    ${trainingSesiInfo?.status_active === 'finish'
                                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                      : 'bg-purple-600 hover:bg-purple-700 text-white'}
                                  `}
                                >
                                  <Plus size={16} />
                                  <span>Buat Jadwal Laporan</span>
                                </button>
                              )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {reportScheduleData.records && reportScheduleData.records.length > 0 && (
                <div className="bg-white px-6 py-4 flex flex-col sm:flex-row items-center justify-between border-t border-gray-200">
                  <div className="text-sm text-gray-700 mb-4 sm:mb-0">
                    <p>
                      Menampilkan <span className="font-medium">{((currentBatch - 1) * reportScheduleData.page.max_raw_size) + 1}</span> sampai{' '}
                      <span className="font-medium">
                        {Math.min(currentBatch * reportScheduleData.page.max_raw_size, reportScheduleData.page.total_record_count)}
                      </span> dari{' '}
                      <span className="font-medium">{reportScheduleData.page.total_record_count}</span> hasil
                    </p>
                  </div>
                  <div className="flex justify-center">
                    <nav className="relative z-0 inline-flex rounded-lg shadow-sm" aria-label="Pagination">
                      <button
                        onClick={handlePrevPage}
                        disabled={currentBatch === 1}
                        className={`relative inline-flex items-center justify-center h-10 w-10 rounded-l-lg border border-gray-200 bg-white ${
                          currentBatch === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                        } transition-all`}
                      >
                        <ChevronUp size={16} className="rotate-90" />
                      </button>
                      
                      {renderPaginationButtons()}
                      
                      <button
                        onClick={handleNextPage}
                        disabled={currentBatch >= reportScheduleData.page.maxPage}
                        className={`relative inline-flex items-center justify-center h-10 w-10 rounded-r-lg border border-gray-200 bg-white ${
                          currentBatch >= reportScheduleData.page.maxPage 
                            ? 'text-gray-300 cursor-not-allowed' 
                            : 'text-gray-500 hover:bg-gray-50'
                        } transition-all`}
                      >
                        <ChevronDown size={16} className="-rotate-90" />
                      </button>
                    </nav>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {showUpdateForm && selectedReportScheduleId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <UpdateScheduleReportForm 
            reportScheduleId={selectedReportScheduleId} 
            onClose={() => setShowUpdateForm(false)} 
            onSuccess={handleUpdateSuccess}
            trainingSesiId={trainingSesiId}
          />
        </div>
      )}

      {showAddReportSchedulePopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <CreateScheduleReport 
            onClose={() => setShowAddReportSchedulePopup(false)} 
            onSuccess={handleReportScheduleCreationSuccess}
            trainingSesiId={trainingSesiId}
          />
        </div>
      )}
    </div>
  );
};

export default ScheduleReportPage;