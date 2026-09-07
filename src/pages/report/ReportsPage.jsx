import { useState, useEffect } from "react";
import { Search, Calendar, FileText, User, ChevronRight, Filter, RotateCcw , Download, Plus, Eye, Edit, Trash2, ChevronLeft, ChevronDown } from "lucide-react";
import { fetchReportList, deleteReport, createReport } from "../../service/report.service";
import { useAuth } from '../../context/AuthContext';
import CreateReportForm from './ReportInput';
import ReportDetailModal from './ReportDertail';
import UpdateReportForm from './ReportUpdate';
import Swal from 'sweetalert2';


function formatDate(startTime, finishTime) {

  const start = new Date(startTime);
  const finish = new Date(finishTime);
  const sameDate = start.toDateString() === finish.toDateString();
  const optionsDate = { day: '2-digit', month: 'short', year: 'numeric' };
  const optionsTime = { hour: '2-digit', minute: '2-digit' };

  if (sameDate) {
    return `${start.toLocaleDateString('en-GB', optionsDate)}, ${start.toLocaleTimeString('en-GB', optionsTime)} - ${finish.toLocaleTimeString('en-GB', optionsTime)}`;
  } else {
    return `${start.toLocaleDateString('en-GB', optionsDate)}, ${start.toLocaleTimeString('en-GB', optionsTime)} - ${finish.toLocaleDateString('en-GB', optionsDate)}, ${finish.toLocaleTimeString('en-GB', optionsTime)}`;
  }
}

  function isSameDate(startTime, finishTime) {
    const start = new Date(startTime);
    const finish = new Date(finishTime);
    return start.toDateString() === finish.toDateString();
  }


export default function LaporanPelatihan() {
  
  // States untuk simulasi data dan fungsionalitas
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const { user } = useAuth();
  const currentUser = user?.name || 'staff';
  const [reports, setReports] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedUpdateReport, setSelectedUpdateReport] = useState(null);


  const [showUpdateModal, setShowUpdateModal] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const pageSize = 5;
  
  // Open update modal with report data
  const handleEditReport = (report) => {
    // Logika yang diperbaiki: tidak bisa edit jika Manager sudah setuju DAN Direktur tidak menolak
    const managerApproved = report.status_acc === 'disetujui';
    const directorRejected = report.acc_director_status === 'ditolak';
    const cannotEdit = managerApproved && !directorRejected;
    
    if (cannotEdit) {
      // Tampilkan pesan peringatan
      Swal.fire({
        title: 'Tidak Dapat Mengedit',
        text: 'Laporan ini sudah disetujui oleh Manager dan tidak dapat diedit lagi.',
        icon: 'warning',
        confirmButtonText: 'OK'
      });
      return;
    }
    
    // Jika aman untuk diedit, buka modal update
    setSelectedUpdateReport(report);
  };



  // Fetch reports with pagination
  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const res = await fetchReportList({
          batch: currentPage,
          size: pageSize,
          search: searchTerm,
          report_type_id: filterType,
          status_delete: "1",
          report_inout: "out",
          staff_id: "",
          status_acc: statusFilter,
        });

        const data = res?.response?.records || [];
        const permissions = res?.response?.permissions  || [];
        setReports(data);
        setPermissions(permissions);
        
        // Calculate pagination data from response
        const pageInfo = res?.response?.page || {};
        setTotalRecords(pageInfo.total_record_count || 0);
        setTotalPages(pageInfo.maxPage || 1);
      } catch (err) {
        console.error("Gagal mengambil laporan", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [searchTerm, filterType, statusFilter, currentPage]);

  // Versi dengan reset filter
  const handleRefreshWithReset = async () => {
    try {
      setLoading(true);
      
      // Reset semua filter
      setSearchTerm("");
      setFilterType("");
      setStatusFilter("");
      setCurrentPage(1);
      
      const res = await fetchReportList({
        batch: 1,
        size: pageSize,
        search: "",
        report_type_id: "",
        status_delete: "1",
        report_inout: "out",
        staff_id: "",
        status_acc: "",
      });

      const data = res?.response?.records || [];
      const permissions = res?.response?.permissions || [];
      setReports(data);
      setPermissions (permissions);
      
      // Calculate pagination data
      const pageInfo = res?.response?.page || {};
      setTotalRecords(pageInfo.total_record_count || 0);
      setTotalPages(pageInfo.maxPage || 1);
      
    } catch (err) {
      console.error("Gagal mengambil laporan", err);
    } finally {
      setLoading(false);
    }
  };

  // Fungsi handler
  const handleSearch = () => {
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleFilterChange = (e) => {
    setFilterType(e.target.value);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1); // Reset to first page when status changes
  };

  // Pagination handlers
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToPage = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  //-------------------- handle action -------------------
  const handleDeleteReportClick = async (reportId) => {
    // Cari report berdasarkan ID untuk validasi
    const report = reports.find(r => r.report_id === reportId);
    
    if (report) {
      // Logika yang diperbaiki: tidak bisa hapus jika Manager sudah setuju DAN Direktur tidak menolak
      const managerApproved = report.status_acc === 'disetujui';
      const directorRejected = report.acc_director_status === 'ditolak';
      const cannotDelete = managerApproved && !directorRejected;
      
      if (cannotDelete) {
        // Tampilkan pesan peringatan
        Swal.fire({
          title: 'Tidak Dapat Menghapus',
          text: 'Laporan ini sudah disetujui oleh Manager dan tidak dapat dihapus.',
          icon: 'warning',
          confirmButtonText: 'OK'
        });
        return;
      }
    }

    // Jika aman untuk dihapus, lanjutkan dengan konfirmasi delete
    try {
      const confirmResult = await Swal.fire({
        title: 'Are you sure?',
        text: 'This action will permanently delete the report.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete it',
        cancelButtonText: 'Cancel'
      });

      if (confirmResult.isConfirmed) {
        const result = await deleteReport({ report_id: reportId });

        await Swal.fire({
          title: 'Deleted!',
          text: 'Report successfully deleted.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });

        handleRefreshWithReset();
        return result;
      }
    } catch (error) {
      Swal.fire({
        title: 'Error',
        text: 'Failed to delete report: ' + error.message,
        icon: 'error',
      });
    }
  };


  // ------------- create laporan----------
  const [isModalOpen, setIsModalOpen] = useState(false);
    
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
    
  const handleSubmit = async (formData) => {
    try {
      // await createReport(formData);

      // Form akan menampilkan success popup
      setTimeout(() => {
        handleRefreshWithReset();
        closeModal();
      }, 2000);

    } catch (error) {
      // Error ditangani di form
    }
  };

  // Helper function to generate page numbers
  const generatePageNumbers = () => {
    if (totalPages <= 5) {
      // If 5 or fewer pages, show all
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    } else if (currentPage <= 3) {
      // Near start
      return [1, 2, 3, 4, '...', totalPages];
    } else if (currentPage >= totalPages - 2) {
      // Near end
      return [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    } else {
      // Middle
      return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
    }
  };
  

  return (
  <div className="max-w-8xl mx-auto  min-h-screen">
    {/* Header */}
    <header className="flex flex-col justify-between rounded-t-xl sm:flex-row bg-gradient-to-r from-blue-600 to-indigo-700 shadow-lg ">
      <div className="p-6">
        <h1 className="text-3xl font-bold text-white mb-2">Laporan Pelatihan</h1>
       
      </div>
      {/* Action Buttons */}
      <div className="flex p-6 items-center gap-3 ">
        {permissions?.canCreate && (
          <button
            onClick={openModal}
            className="inline-flex w-15 gap-2 px-6 py-2.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md shadow transition"
          >
            <Plus size={16} />
            Lapor
          </button>
        )}  

        {/* {permissions?.canRead && (
          <button
            // onClick={handleExportPDF}
            className="inline-flex gap-2 px-4 py-2.5 text-sm font-medium text-blue-600 border-blue-200 bg-white hover:bg-blue-50 rounded-md shadow transition"
          >
            <Download size={16} />
            Simpan
          </button>
        )}   */}
      </div>
    </header>
    {/* Search & Filter Section */}
    <div className="bg-white rounded-t-1 border-b-2 shadow-sm p-6  border border-gray-100">
   
      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="flex-1 relative">
          {/* Ikon Search di kiri input */}
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />

          {/* Input */}
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari laporan..." 
            className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        {/* Filter Button (Mobile) */}
        {/* <div className="md:hidden">
          <button 
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-lg"
          >
            <Filter size={18} />
            Filter
          </button>
        </div> */}

        {/* Filters (Desktop) */}
        <div className="hidden md:flex gap-3 items-center">
          {/* <select 
            value={filterType}
            onChange={handleFilterChange}
            className="px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Semua Jenis</option>
            <option value="1">Berita Acara Kegiatan</option>
            <option value="2">Laporan Pelatihan</option>
            <option value="3">Evaluasi Program</option>
          </select> */}
          
          {/* <select 
            value={statusFilter}
            onChange={handleStatusChange}
            className="px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Semua Status</option>
            <option value="menunggu">Menunggu</option>
            <option value="disetujui">Disetujui</option>
            <option value="ditolak">Ditolak</option>
          </select> */}

          {/* Reset Button */}
          <button
            onClick={handleRefreshWithReset}
            className="flex items-center gap-2 px-4 py-3 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition duration-200"
          >
            <RotateCcw size={18} />
            Reset
          </button>
        </div>
      </div>
      {/* Mobile Filters (Collapsible) */}
      {isFilterOpen && (
        <div className="mt-4 md:hidden flex flex-col gap-3">
          {/* <select 
            value={filterType}
            onChange={handleFilterChange}
            className="px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Semua Jenis</option>
            <option value="1">Berita Acara Kegiatan</option>
            <option value="2">Laporan Pelatihan</option>
            <option value="3">Evaluasi Program</option>
          </select> */}
          
          {/* <select 
            value={statusFilter}
            onChange={handleStatusChange}
            className="px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Semua Status</option>
            <option value="menunggu">Menunggu</option>
            <option value="disetujui">Disetujui</option>
            <option value="ditolak">Ditolak</option>    
          </select> */}
        </div>
      )}
    </div>

   
    
    {/* Table for Desktop */}
    <div className="hidden md:block bg-white shadow-sm overflow-hidden  border border-gray-100">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 text-left border-b border-gray-200">
              <th className="px-4 py-4 text-gray-600 font-medium text-sm">Laporan</th>
              <th className="px-4 py-4 text-gray-600 font-medium text-sm">Kategori</th>
              <th className="px-4 py-4 text-gray-600 font-medium text-sm">Petugas</th>
              <th className="px-4 py-4 text-gray-600 font-medium text-sm">Tanggal</th>
              <th className="px-4 py-4 text-gray-600 font-medium text-sm">Persetujuan</th>
              <th className="px-4 py-4 text-center text-gray-600 font-medium text-sm">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {reports.map((report) => {
              // Logika untuk menentukan apakah tombol edit dan hapus harus dinonaktifkan
              const isFullyApproved = report.status_acc === 'disetujui' && report.acc_director_status === 'disetujui';
              const canEditDelete = !isFullyApproved; // Bisa edit/hapus jika belum fully approved
              
              return (
                <tr key={report.report_id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4 text-gray-900 font-medium text-sm">
                    <div className="max-w-xs break-words">{report.name}</div>
                  </td>
                  <td className="px-4 py-4 text-gray-600 text-sm">{report.report_schedule.report_type?.name}</td>
                  <td className="px-4 py-4 text-gray-600 text-sm">{report.staff?.name}</td>
                  <td className="px-4 py-4 text-gray-600 text-sm">
                    {isSameDate(report.start_time, report.finish_time) ? (
                      <div>
                        {formatDate(report.start_time, report.finish_time)}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="text-xs">
                          {new Date(report.start_time).toLocaleString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                        <div className="text-xs">
                          {new Date(report.finish_time).toLocaleString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="space-y-2">
                      {/* Status Supervisor/Manager */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 font-medium min-w-[60px]">Manager:</span>
                        <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${
                          report.status_acc === 'disetujui'
                            ? 'bg-green-100 text-green-700 border border-green-200'
                            : report.status_acc === 'ditolak'
                            ? 'bg-red-100 text-red-700 border border-red-200'
                            : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                        }`}>
                          {report.status_acc}
                        </span>
                      </div>
                      
                      {/* Status Director */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 font-medium min-w-[60px]">Direktur:</span>
                        <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${
                          report.acc_director_status === 'disetujui'
                            ? 'bg-green-100 text-green-700 border border-green-200'
                            : report.acc_director_status === 'ditolak'
                            ? 'bg-red-100 text-red-700 border border-red-200'
                            : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                        }`}>
                          {report.acc_director_status}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center gap-2">
                      {permissions?.canRead && (
                        <button 
                          className="p-2 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                          onClick={() => setSelectedReport(report)}
                          title="Lihat Detail"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      {permissions?.canUpdate && (
                        <button 
                          className={`p-2 rounded-full transition-colors ${
                            canEditDelete 
                              ? 'bg-green-100 text-green-600 hover:bg-green-200 cursor-pointer'
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          }`}
                          onClick={() => canEditDelete && handleEditReport(report)}
                          disabled={!canEditDelete}
                          title={canEditDelete ? "Edit Laporan" : "Laporan sudah disetujui, tidak dapat diedit"}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                      {permissions?.canDelete && (
                        <button 
                          className={`p-2 rounded-full transition-colors ${
                            canEditDelete 
                              ? 'bg-red-100 text-red-600 hover:bg-red-200 cursor-pointer'
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          }`}
                          onClick={() => canEditDelete && handleDeleteReportClick(report.report_id)}
                          disabled={!canEditDelete}
                          title={canEditDelete ? "Hapus Laporan" : "Laporan sudah disetujui, tidak dapat dihapus"}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}  
                    </div>
                  </td>
                </tr>
              );
            })}
            
            {/* Empty table state */}
            {reports.length === 0 && !loading && (
              <tr>
                <td colSpan="6" className="px-4 py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center gap-3">
                    <FileText size={48} className="text-gray-300" />
                    <p>Tidak ada laporan yang ditemukan</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
    
    {/* Cards for Mobile */}
    <div className="md:hidden space-y-4 mb-6">
      {reports.map((report) => (
        <div key={report.report_id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-3">
            <h3 className="font-medium text-blue-600 flex-1 mr-3">{report.name}</h3>
            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
              report.status_acc === 'sudah acc'
                ? 'bg-green-100 text-green-700'
                : report.status_acc === 'tidak acc'
                ? 'bg-red-100 text-red-700'
                : 'bg-yellow-100 text-yellow-700'
            }`}>
              {report.status_acc}
            </span>
          </div>
          
          <div className="space-y-2 mb-4">
            <div className="flex items-center text-sm text-gray-600">
              <FileText size={16} className="mr-2 text-gray-400 flex-shrink-0" />
              <span>Kategori: {report.report_schedule.report_type?.name}</span>
            </div>
            
            <div className="flex items-center text-sm text-gray-600">
              <User size={16} className="mr-2 text-gray-400 flex-shrink-0" />
              <span>Petugas: {report.staff?.name}</span>
            </div>
            
            <div className="flex items-center text-sm text-gray-600">
              <Calendar size={16} className="mr-2 text-gray-400 flex-shrink-0" />
              <span>Tanggal: {formatDate(report.start_time, report.finish_time)}</span>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100">
            {permissions?.canRead && (
              <button 
                className="bg-blue-50 hover:bg-blue-100 text-blue-600 p-2 rounded-lg flex items-center transition-colors"
                onClick={() => setSelectedReport(report)}
                title="Lihat Detail"
              >
                <Eye size={16} />
              </button>
            )}
            {permissions?.canUpdate && (
              <button 
                className="bg-green-50 hover:bg-green-100 text-green-600 p-2 rounded-lg flex items-center transition-colors"
                onClick={() => handleEditReport(report)}
                title="Edit Laporan"
              >
                <Edit size={16} />
              </button>
            )}
            {permissions?.canDelete && (
              <button 
                className="bg-red-50 hover:bg-red-100 text-red-600 p-2 rounded-lg flex items-center transition-colors"
                onClick={() => handleDeleteReportClick(report.report_id)}
                title="Hapus Laporan"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>
      ))}
      
      {/* Empty state for mobile */}
      {reports.length === 0 && !loading && (
        <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-100">
          <FileText size={48} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Tidak ada laporan yang ditemukan</p>
        </div>
      )}
    </div>
    
    {/* Loading States */}
    {loading && (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )}
    
    {/* Pagination Controls */}
    {!loading && reports.length > 0 && (
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          {/* Page info */}
          <div className="text-sm text-gray-600">
            Menampilkan {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, totalRecords)} dari {totalRecords} laporan
          </div>
          
          {/* Pagination controls */}
          <div className="flex items-center space-x-1">
            {/* First page button */}
            <button 
              onClick={() => goToPage(1)}
              disabled={currentPage === 1}
              className={`p-2 rounded-md border ${
                currentPage === 1 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-white text-blue-600 hover:bg-blue-50'
              }`}
              aria-label="First page"
            >
              <span className="sr-only">First</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="11 17 6 12 11 7"></polyline>
                <polyline points="18 17 13 12 18 7"></polyline>
              </svg>
            </button>
            
            {/* Previous button */}
            <button 
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
              className={`p-2 rounded-md border ${
                currentPage === 1 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-white text-blue-600 hover:bg-blue-50'
              }`}
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>
            
            {/* Page numbers */}
            <div className="hidden sm:flex space-x-1">
              {generatePageNumbers().map((page, index) => (
                page === '...' ? (
                  <span key={`ellipsis-${index}`} className="px-3 py-1 text-gray-500">...</span>
                ) : (
                  <button
                    key={`page-${page}`}
                    onClick={() => goToPage(page)}
                    className={`w-8 h-8 flex items-center justify-center rounded-md ${
                      currentPage === page
                        ? 'bg-blue-500 text-white'
                        : 'bg-white text-blue-600 hover:bg-blue-50 border'
                    }`}
                  >
                    {page}
                  </button>
                )
              ))}
            </div>
            
            {/* Mobile dropdown for page selection */}
            <div className="sm:hidden relative">
              <select
                value={currentPage}
                onChange={(e) => goToPage(Number(e.target.value))}
                className="appearance-none pl-3 pr-8 py-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <option key={page} value={page}>
                    Page {page}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2 top-2 text-gray-500 pointer-events-none" />
            </div>
            
            {/* Next button */}
            <button 
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-md border ${
                currentPage === totalPages 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-white text-blue-600 hover:bg-blue-50'
              }`}
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>
            
            {/* Last page button */}
            <button 
              onClick={() => goToPage(totalPages)}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-md border ${
                currentPage === totalPages 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-white text-blue-600 hover:bg-blue-50'
              }`}
              aria-label="Last page"
            >
              <span className="sr-only">Last</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="13 17 18 12 13 7"></polyline>
                <polyline points="6 17 11 12 6 7"></polyline>
              </svg>
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Modals */}
    {/* Create Modal */}
    {isModalOpen && (
      <div className="fixed inset-0 z-[999] bg-black bg-opacity-40 flex items-center justify-center p-4">
        <CreateReportForm 
          onSubmit={handleSubmit}
          closeModal={closeModal} 
        />
      </div>
    )}

    {/* Detail Modal */}
    {selectedReport && (
      <ReportDetailModal
        report={selectedReport}
        onClose={() => setSelectedReport(null)}
      />
    )}

    {/* Update Modal */}
    {selectedUpdateReport && (
      <UpdateReportForm
        reportData={selectedUpdateReport}
        onSubmit={handleSubmit}
        closeModal={() => setSelectedUpdateReport(null)}
      />
    )}
  </div>
);
}