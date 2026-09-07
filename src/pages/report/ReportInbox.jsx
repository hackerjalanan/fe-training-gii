import { useState, useEffect } from "react";
import { Search, Calendar, FileText, User, ChevronRight, Filter, RotateCcw, Ban, BadgeCheck, Download, Eye, ChevronLeft, ChevronDown } from "lucide-react";
import { fetchReportList, deleteReport, updateACCReport } from "../../service/report.service";
import { fetchStaffId } from "../../service/master-data.service";
import { useAuth } from '../../context/AuthContext';
import ReportDetailModal from './ReportDertail';
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

export default function ReportInbox() {
  // States untuk simulasi data dan fungsionalitas
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const { user } = useAuth();
  const currentUser = user?.name || 'staff';
  const currentRole = user?.role_name || '';
  const [reports, setReports] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [manager, setManager] = useState(null);
  const [director, setDirector] = useState(null);


  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const pageSize = 5;

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
          report_inout: "in",
          staff_id: "",
          status_acc: statusFilter,
        });

        const data = res?.response?.records || [];
        const permissions = res?.response?.permissions || [];
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

  // Reset filter function
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
        report_inout: "in",
        staff_id: "",
        status_acc: "",
      });

      const data = res?.response?.records || [];
      const permissions = res?.response?.permissions || [];
      setReports(data);
      setPermissions(permissions);
      
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

  // Filter change handlers
  const handleFilterChange = (e) => {
    setFilterType(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
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

  // Fungsi helper untuk menentukan apakah direktur bisa mengubah persetujuan
  const canDirectorChangeApproval = (currentRole) => {
    return currentRole.toLowerCase() === 'direktur';
  };

  // Handle approve report
  const handleApproveReport = async (report_id, name) => {
    try {
      const confirmResult = await Swal.fire({
        title: 'Setujui Laporan?',
        text: `Apakah Anda yakin ingin menyetujui laporan "${name}"?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#10b981',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Ya, Setujui',
        cancelButtonText: 'Batal'
      });

      if (confirmResult.isConfirmed) {
        await updateACCReport({
          report_id: report_id,
          status_acc: "disetujui"
        });

        await Swal.fire({
          title: 'Berhasil!',
          text: 'Laporan berhasil disetujui.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });

        // Refresh data
        handleRefreshWithReset();
      }
    } catch (error) {
      Swal.fire({
        title: 'Error',
        text: 'Gagal menyetujui laporan: ' + (error?.response?.data?.message || error.message),
        icon: 'error',
      });
    }
  };

  // Handle reject report
  const handleRejectReport = async (report_id,name) => {
    try {
      const confirmResult = await Swal.fire({
        title: 'Tolak Laporan?',
        text: `Apakah Anda yakin ingin menolak laporan "${name}"?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Ya, Tolak',
        cancelButtonText: 'Batal'
      });

      if (confirmResult.isConfirmed) {
        await updateACCReport({
          report_id: report_id,
          status_acc: "ditolak"
        });

        await Swal.fire({
          title: 'Berhasil!',
          text: 'Laporan berhasil ditolak.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });

        // Refresh data
        handleRefreshWithReset();
      }
    } catch (error) {
      Swal.fire({
        title: 'Error',
        text: 'Gagal menolak laporan: ' + (error?.response?.data?.message || error.message),
        icon: 'error',
      });
    }
  };

  // Helper function to generate page numbers
  const generatePageNumbers = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    } else if (currentPage <= 3) {
      return [1, 2, 3, 4, '...', totalPages];
    } else if (currentPage >= totalPages - 2) {
      return [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    } else {
      return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
    }
  };

  return (
    <div className="max-w-9xl mx-auto  min-h-screen">
      {/* Header */}
      <header className="flex flex-col justify-between  sm:items-center rounded-t-xl sm:flex-row bg-gradient-to-r from-blue-600 to-indigo-700 shadow-lg">
        <div className="p-6">
          <h1 className="text-3xl font-bold text-white mb-2">Laporan Pelatihan</h1>
         
        </div>
                {/* Action Buttons */}
        {/* <div className=" justify-center sm:items-center"> 
          {permissions?.canRead && (
            <button
              className="inline-flex  m-5 gap-2 px-4 py-2 text-sm font-medium text-blue-600 border border-blue-200 bg-white hover:bg-blue-50 rounded-md shadow transition"
            >
              <Download size={16} />
              Simpan
            </button>
          )}  
        </div> */}
      </header>

      {/* Search & Filter Section */}
      <div className="bg-white rounded-t-1 border-b-2 shadow-sm p-6 border border-gray-100">


        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
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
        {/* {isFilterOpen && (
          <div className="mt-4 md:hidden flex flex-col gap-3">
            <select 
              value={filterType}
              onChange={handleFilterChange}
              className="px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Semua Jenis</option>
              <option value="1">Berita Acara Kegiatan</option>
              <option value="2">Laporan Pelatihan</option>
              <option value="3">Evaluasi Program</option>
            </select>
            
            <select 
              value={statusFilter}
              onChange={handleStatusChange}
              className="px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Semua Status</option>
              <option value="menunggu">Menunggu</option>
              <option value="disetujui">Disetujui</option>
              <option value="ditolak">Ditolak</option>
            </select>
          </div>
        )} */}
      </div>
    
      {/* Table for Desktop */}
      <div className="hidden md:block bg-white shadow-sm overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 text-left border-b border-gray-200">
                <th className="px-4 py-4 text-gray-600 font-medium text-sm">Laporan</th>
                <th className="px-4 py-4 text-gray-600 font-medium text-sm">Kategori</th>
                <th className="px-4 py-4 text-gray-600 font-medium text-sm">Petugas</th>
                <th className="px-4 py-4 text-gray-600 font-medium text-sm">Tanggal</th>
                <th className="px-4 py-4 text-gray-600 font-medium text-sm min-w-[200px]">Persetujuan</th>
                <th className="px-4 py-4 text-center text-gray-600 font-medium text-sm">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reports.map((report) => (
                <tr key={report.report_id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4 text-gray-900 font-medium text-sm">
                    <div className="max-w-xs break-words">{report.name}</div>
                  </td>
                  <td className="px-4 py-4 text-gray-600 text-sm">{report?.report_schedule.report_type.name}</td>
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

                      {/* === LIHAT DETAIL === */}
                      {permissions?.canRead && (
                        <button 
                          className="p-2 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                          onClick={() => setSelectedReport(report)}
                          title="Lihat Detail"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}

                      {/* === MANAGER === */}
                      {permissions?.canAprove && (
                        <>
                          {/* Tombol SETUJUI */}
                          <button
                            className={`p-2 rounded-full transition-colors ${
                              report.acc_director_status === 'menunggu' &&
                              (report.status_acc === 'menunggu' || report.status_acc === 'ditolak')
                                ? 'bg-green-100 text-green-600 hover:bg-green-200 cursor-pointer'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                            }`}
                            onClick={() => handleApproveReport(report.report_id, report.name)}
                            title="Setujui Laporan"
                            disabled={
                              report.acc_director_status !== 'menunggu' ||
                              (report.status_acc !== 'menunggu' && report.status_acc !== 'ditolak')
                            }
                          >
                            <BadgeCheck className="w-4 h-4" />
                          </button>

                          {/* Tombol TOLAK */}
                          <button
                            className={`p-2 rounded-full transition-colors ${
                              report.acc_director_status === 'menunggu' &&
                              (report.status_acc === 'menunggu' || report.status_acc === 'disetujui')
                                ? 'bg-red-100 text-red-600 hover:bg-red-200 cursor-pointer'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                            }`}
                            onClick={() => handleRejectReport(report.report_id, report.name)}
                            title="Tolak Laporan"
                            disabled={
                              report.acc_director_status !== 'menunggu' ||
                              (report.status_acc !== 'menunggu' && report.status_acc !== 'disetujui')
                            }
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        </>
                      )}



                      {/* === DIREKTUR === */}
                      {permissions?.canAproveDorektur && (
                        <>
                          {/* Tombol SETUJUI (Direktur) */}
                          <button
                            className={`p-2 rounded-full transition-colors ${
                              report.acc_director_status === 'menunggu' || report.acc_director_status === 'ditolak'
                                ? 'bg-green-100 text-green-600 hover:bg-green-200 cursor-pointer'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                            }`}
                            onClick={() => handleApproveReport(report.report_id, report.name)}
                            title="Setujui Laporan (Direktur)"
                            disabled={!(report.acc_director_status === 'menunggu' || report.acc_director_status === 'ditolak')}
                          >
                            <BadgeCheck className="w-4 h-4" />
                          </button>

                          {/* Tombol TOLAK (Direktur) */}
                          <button
                            className={`p-2 rounded-full transition-colors ${
                              report.acc_director_status === 'menunggu' || report.acc_director_status === 'disetujui'
                                ? 'bg-red-100 text-red-600 hover:bg-red-200 cursor-pointer'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                            }`}
                            onClick={() => handleRejectReport(report.report_id, report.name)}
                            title="Tolak Laporan (Direktur)"
                            disabled={!(report.acc_director_status === 'menunggu' || report.acc_director_status === 'disetujui')}
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        </>
                      )}



                    </div>
                  </td>


                </tr>
              ))}

              
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
            </div>
            
            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm text-gray-600">
                <FileText size={16} className="mr-2 text-gray-400 flex-shrink-0" />
                <span>Kategori: {report.report_schedule?.report_type.name}</span>
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
            
            {/* Status Section for Mobile */}
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Persetujuan:</h4>
              <div className="space-y-2">
                {/* Status Supervisor */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Manager:</span>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
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
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Direktur:</span>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
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

              {/* === MANAGER === */}
              {permissions?.canAprove && (
                <>
                  {/* Tombol SETUJUI */}
                  <button
                    className={`p-2 rounded-lg flex items-center transition-colors ${
                      report.acc_director_status === 'menunggu' &&
                      (report.status_acc === 'menunggu' || report.status_acc === 'ditolak')
                        ? 'bg-green-100 text-green-600 hover:bg-green-200 cursor-pointer'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                    }`}
                    onClick={() => handleApproveReport(report.report_id, report.name)}
                    title="Setujui Laporan"
                    disabled={
                      report.acc_director_status !== 'menunggu' ||
                      (report.status_acc !== 'menunggu' && report.status_acc !== 'ditolak')
                    }
                  >
                    <BadgeCheck size={16} />
                  </button>

                  {/* Tombol TOLAK */}
                  <button
                    className={`p-2 rounded-lg flex items-center transition-colors ${
                      report.acc_director_status === 'menunggu' &&
                      (report.status_acc === 'menunggu' || report.status_acc === 'disetujui')
                        ? 'bg-red-100 text-red-600 hover:bg-red-200 cursor-pointer'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                    }`}
                    onClick={() => handleRejectReport(report.report_id, report.name)}
                    title="Tolak Laporan"
                    disabled={
                      report.acc_director_status !== 'menunggu' ||
                      (report.status_acc !== 'menunggu' && report.status_acc !== 'disetujui')
                    }
                  >
                    <Ban size={16} />
                  </button>
                </>
              )}

              {/* === DIREKTUR === */}
              {permissions?.canAproveDorektur && (
                <>
                  {/* Tombol SETUJUI (Direktur) */}
                  <button
                    className={`p-2 rounded-lg flex items-center transition-colors ${
                      report.acc_director_status === 'menunggu' || report.acc_director_status === 'ditolak'
                        ? 'bg-green-100 text-green-600 hover:bg-green-200 cursor-pointer'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                    }`}
                    onClick={() => handleApproveReport(report.report_id, report.name)}
                    title="Setujui Laporan (Direktur)"
                    disabled={!(report.acc_director_status === 'menunggu' || report.acc_director_status === 'ditolak')}
                  >
                    <BadgeCheck size={16} />
                  </button>

                  {/* Tombol TOLAK (Direktur) */}
                  <button
                    className={`p-2 rounded-lg flex items-center transition-colors ${
                      report.acc_director_status === 'menunggu' || report.acc_director_status === 'disetujui'
                        ? 'bg-red-100 text-red-600 hover:bg-red-200 cursor-pointer'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                    }`}
                    onClick={() => handleRejectReport(report.report_id, report.name)}
                    title="Tolak Laporan (Direktur)"
                    disabled={!(report.acc_director_status === 'menunggu' || report.acc_director_status === 'disetujui')}
                  >
                    <Ban size={16} />
                  </button>
                </>
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

      {/* Detail Modal */}
      {selectedReport && (
        <ReportDetailModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
        />
      )}
    </div>
  );
}