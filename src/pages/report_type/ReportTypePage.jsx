import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Eye, Edit, Trash2, Search, Filter, RefreshCw, ChevronDown, ChevronUp, FileText, X } from 'lucide-react';
import { fetchReportTypeList , deletereportType} from '../../service/report-type.service';
import Swal from 'sweetalert2';

// Import the child components
import DetailReportType from './ReportTypeDetail';
import UpdateReportTypeForm from './ReportTypeUpdate';
import CreateReportTypeForm from './ReportTypeInput';


const ReportTypeManagement = () => {
  // State for Jenis laporan data and pagination
  const [reportTypeData, setReportTypeData] = useState({
    records: [],
    pagination: {
      current_page: 1,
      page_size: 5,
      total_items: 0,
      total_pages: 1
    },
    permissions: {
      canCreate: false,
      canRead: false,
      canUpdate: false,
      canDelete: false
    }
  });
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentBatch, setCurrentBatch] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  
  // State for popup modals
  const [selectedReportTypeId, setSelectedReportTypeId] = useState(null);
  const [showDetailPopup, setShowDetailPopup] = useState(false);
  const [showAddReportTypePopup, setShowAddReportTypePopup] = useState(false);

  // Load Jenis laporan data - wrapped in useCallback to prevent infinite re-renders
  const loadReportTypeData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetchReportTypeList({
        batch: currentBatch,
        size: 5,
        search: searchQuery,
      });
      
      setReportTypeData(response.response);
    } catch (err) {
      setError('Failed to load Jenis laporan data. Please try again.');
      console.error('Error loading Jenis laporan data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentBatch, searchQuery, ]);

  // Load data on initial render and when dependencies change
  useEffect(() => {
    loadReportTypeData();
  }, [loadReportTypeData]);

  // Function to handle filter application
  const applyFilters = () => {
    setCurrentBatch(1); // Reset to first page when applying filters
    loadReportTypeData();
  };

  // Function to reset filters
  const resetFilters = () => {
    setStatusFilter('');
    setSearchQuery('');
    setCurrentBatch(1);
    // Wait for state updates to finish, then load data
    setTimeout(() => loadReportTypeData(), 0);
  };

  // Handle pagination
  const handleNextPage = () => {
    if (currentBatch < reportTypeData.pagination.total_pages) {
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
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };
  
  const handleUpdateSuccess = () => {
    // Reload the Jenis laporan list after successful update
    loadReportTypeData();
  };
  
  // Update Jenis laporan
  const handleUpdateClick = (reportTypeId) => {
    setSelectedReportTypeId(reportTypeId);
    setShowUpdateForm(true);
  };

  // Function to handle Jenis laporan detail click
  const handleReportTypeClick = (reportTypeId) => {
    setSelectedReportTypeId(reportTypeId);
    setShowDetailPopup(true);
  };
  
  // Function to close detail popup
  const handleClosePopup = () => {
    setShowDetailPopup(false);
    setSelectedReportTypeId(null);
  };

  // Function to handle delete Jenis laporan click
  const handleDeleteReportTypeClick = async (reportTypeId) => {
    try {
      const confirmResult = await Swal.fire({
        title: 'Apakah Anda yakin?',
        text: 'Jenis report ini akan dihapus secara permanen.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#aaa',
        confirmButtonText: 'Ya, hapus!',
        cancelButtonText: 'Batal'
      });

      if (confirmResult.isConfirmed) {
        const result = await deletereportType({ reportTypeId });

        await Swal.fire({
          title: 'Berhasil!',
          text: 'Jenis laporan berhasil dihapus.',
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
        text: `Gagal menghapus Jenis laporan: ${error.message}`,
        icon: 'error'
      });
    }
  };


  // Function to handle add Jenis laporan button click
  const handleAddReportType = () => {
    setShowAddReportTypePopup(true);
  };

  // Function to handle successful Jenis laporan creation
  const handleReportTypeCreationSuccess = () => {
    resetFilters(); // Refresh the Jenis laporan list
    setShowAddReportTypePopup(false);
  };

  // Function to generate pagination buttons
  const renderPaginationButtons = () => {
    const totalPages = reportTypeData.pagination.total_pages;
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

    return pages.map((page, index) => 
      page === '...' ? (
        <span 
          key={`ellipsis-${index}`}
          className="relative inline-flex items-center px-3 py-2 border border-gray-200 bg-white text-gray-400 text-sm"
        >
          ...
        </span>
      ) : (
        <button
          key={page}
          onClick={() => handlePageChange(page)}
          className={`relative inline-flex items-center justify-center w-10 h-10 border text-sm font-medium transition-all ${
            currentPage === page 
              ? 'bg-blue-500 text-white border-blue-500 hover:bg-blue-600'
              : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
          }`}
        >
          {page}
        </button>
      )
    );
  };

  // Get status badge styling
  const getStatusBadgeStyle = (status) => {
    return status === 1
      ? 'bg-green-100 text-green-800 border border-green-200'
      : 'bg-red-100 text-red-800 border border-red-200';
  };

  return (
    <div className="bg-gray-50 ">
      <div className=" ">
        <div className="bg-white rounded-xl w-full shadow-sm border border-gray-100 overflow-hidden">
          {/* Header Modern */}
          <div className="bg-gradient-to-r  from-blue-600 to-indigo-700 shadow-lg py-4 px-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white">Manajemen Jenis Laporan</h1>
                <p className="text-purple-100 mt-1">Kelola dan atur jenis laporan kegiatan </p>
              </div>
              {reportTypeData.permissions?.canCreate && (
                <button 
                  onClick={handleAddReportType}
                  className="mt-4 md:mt-0 flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-purple-50 text-purple-700 rounded-lg text-sm font-medium transition-all shadow-sm"
                >
                  <Plus size={16} />
                  <span>Jenis Laporan</span>
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
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Cari berdasarkan nama atau deskripsi..."
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Status Loading dan Error */}
          {isLoading && (
            <div className="flex justify-center items-center p-12">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500"></div>
                <p className="mt-3 text-sm text-gray-500">Memuat data jenis laporan...</p>
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
                {reportTypeData.records && reportTypeData.records.length > 0 ? (
                  reportTypeData.records.map((  reportType, index) => (
                    <div key={reportType.report_type_id} className="bg-white rounded-xl shadow border border-gray-200 p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h2 className="font-semibold text-gray-800">{reportType.name}</h2>
                        {/* <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getStatusBadgeStyle(reportType.status)}`}>
                          {reportType.status === 1 ? 'Aktif' : 'Tidak Aktif'}
                        </span> */}
                      </div>

                      {/* <p className="text-sm text-gray-600 mb-2">
                        <strong>Deskripsi:</strong> {reportType.description || 'Tidak ada deskripsi'}
                      </p> */}
                      <p className="text-sm text-gray-600 mb-2">
                        <strong>Dibuat:</strong> {formatDate(reportType.created_at)}
                      </p>

                      <div className="flex justify-end gap-2 mt-4">
                        {/* Tombol Lihat */}
                        {reportTypeData.permissions?.canRead && (
                          <button 
                            onClick={() => handleReportTypeClick(reportType.report_type_id)}
                            className="text-blue-500 hover:text-gray-900 px-2 py-1 rounded text-xs"
                            title="Lihat"
                          >
                            <Eye size={14} />
                          </button>
                        )}

                        {/* Tombol Edit */}
                        {reportTypeData.permissions?.canUpdate && (
                          <button 
                            onClick={() => handleUpdateClick(reportType.report_type_id)}
                            className="text-yellow-500 hover:text-blue-900 px-2 py-1 rounded text-xs"
                            title="Edit"
                          >   
                            <Edit size={14} />
                          </button>
                        )}

                        {/* Tombol Hapus */}
                          {reportTypeData.permissions?.canDelete && (
                            <button 
                              onClick={() => handleDeleteReportTypeClick(reportType.report_type_id)}
                              disabled={reportType.status === 0 || reportType.isUsedType}
                              className={`px-2 py-1 rounded text-xs ${
                                reportType.status === 0 || reportType.isUsedType
                                  ? 'text-gray-400 cursor-not-allowed' 
                                  : 'text-red-500 hover:text-red-900'
                              }`}
                              title={
                                reportType.status === 0 
                                  ? "Tidak dapat dihapus karena status non-aktif" 
                                  : reportType.isUsedType 
                                    ? "Tidak dapat dihapus karena sudah digunakan"
                                    : "Hapus"
                              }
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500">
                    Data jenis laporan tidak ditemukan
                  </div>
                )}
              </div>

              {/* Tampilan Tabel Desktop */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th scope="col" className="px-3 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
                      <th scope="col" className="px-3 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                      {/* <th scope="col" className="px-3 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deskripsi</th> */}
                      <th scope="col" className="px-3 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dibuat</th>
                      <th scope="col" className="px-3 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {reportTypeData.records && reportTypeData.records.length > 0 ? (
                      reportTypeData.records.map((reportType, index) => (
                        <tr key={reportType.report_type_id} className="hover:bg-purple-50/30 transition-colors">
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                            {((currentBatch - 1) * reportTypeData.pagination.page_size) + index + 1}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-9 w-9 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                                <FileText size={16} />
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">{reportType.name}</div>
                              </div>
                            </div>
                          </td>
                          {/* <td className="px-3 py-4 text-sm text-gray-500">
                            <div className="max-w-xs truncate">
                              {reportType.description || 'Tidak ada deskripsi'}
                            </div>
                          </td> */}
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(reportType.created_at)}
                          </td>
   
                          <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-center gap-2">
                              {/* Lihat */}
                              {reportTypeData.permissions?.canRead && (
                                <button 
                                  onClick={() => handleReportTypeClick(reportType.report_type_id)}
                                  className="inline-flex items-center text-blue-500 hover:text-gray-900 px-3 py-1.5 rounded-lg text-xs transition-colors"
                                  title="Lihat detail"
                                >
                                  <Eye size={14} className="mr-1" />
                                </button>
                              )}

                              {/* Edit */}
                              {reportTypeData.permissions?.canUpdate && (
                                <button 
                                  onClick={() => handleUpdateClick(reportType.report_type_id)}
                                  className="inline-flex items-center text-yellow-500 hover:text-yellow-900 px-3 py-1.5 rounded-lg text-xs transition-colors"
                                  title="Perbarui jenis laporan"
                                >
                                  <Edit size={14} className="mr-1" />
                                </button>
                              )}

                              {/* Hapus */}
                              {reportTypeData.permissions?.canDelete && (
                                <button 
                                  onClick={() => handleDeleteReportTypeClick(reportType.report_type_id)}
                                  disabled={reportType.status === 0 || reportType.isUsedType}
                                  className={`px-2 py-1 rounded text-xs ${
                                    reportType.status === 0 || reportType.isUsedType
                                      ? 'text-gray-400 cursor-not-allowed' 
                                      : 'text-red-500 hover:text-red-900'
                                  }`}
                                  title={
                                    reportType.status === 0 
                                      ? "Tidak dapat dihapus karena status non-aktif" 
                                      : reportType.isUsedType 
                                        ? "Tidak dapat dihapus karena sudah digunakan"
                                        : "Hapus"
                                  }
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
                              <FileText size={24} className="text-gray-400" />
                            </div>
                            <p className="text-gray-600 font-medium">Jenis laporan tidak ditemukan</p>
                            <p className="text-gray-500 text-sm mt-1">Coba sesuaikan filter Anda atau tambahkan jenis laporan baru</p>
                            {reportTypeData.permissions?.canCreate && (
                              <button 
                                onClick={handleAddReportType}
                                className="mt-4 flex items-center justify-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition-all"
                              >
                                <Plus size={16} />
                                <span>Tambah Jenis Laporan</span>
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
              {reportTypeData.records && reportTypeData.records.length > 0 && (
                <div className="bg-white px-6 py-4 flex flex-col sm:flex-row items-center justify-between border-t border-gray-200">
                  <div className="text-sm text-gray-700 mb-4 sm:mb-0">
                    <p>
                      Menampilkan <span className="font-medium">{((currentBatch - 1) * reportTypeData.pagination.page_size) + 1}</span> sampai{' '}
                      <span className="font-medium">
                        {Math.min(currentBatch * reportTypeData.pagination.page_size, reportTypeData.pagination.total_items)}
                      </span> dari{' '}
                      <span className="font-medium">{reportTypeData.pagination.total_items}</span> hasil
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
                        disabled={currentBatch >= reportTypeData.pagination.total_pages}
                        className={`relative inline-flex items-center justify-center h-10 w-10 rounded-r-lg border border-gray-200 bg-white ${
                          currentBatch >= reportTypeData.pagination.total_pages 
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

      {/* Modal Overlay */}
      {showDetailPopup && selectedReportTypeId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <DetailReportType 
            reportTypeId={selectedReportTypeId} 
            onClose={handleClosePopup} 
          />
        </div>
      )}

      {showUpdateForm && selectedReportTypeId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <UpdateReportTypeForm 
            reportTypeId={selectedReportTypeId} 
            onClose={() => setShowUpdateForm(false)} 
            onSuccess={handleUpdateSuccess}
          />
        </div>
      )}

      {showAddReportTypePopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <CreateReportTypeForm 
            onClose={() => setShowAddReportTypePopup(false)} 
            onSuccess={handleReportTypeCreationSuccess}
          />
        </div>
      )}
    </div>
  );
};

export default ReportTypeManagement;