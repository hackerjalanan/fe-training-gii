import React, { useState, useEffect, useCallback, useRef } from 'react';
import { fetchTrainingSesiList, getTrainingSesiDetail, updateTrainingSesi, deleteTrainingSesi } from '../../service/training-sesi.service';
import { Search, Plus, Edit, Trash2, Eye, Calendar, CalendarCheck, User, MapPin, Clock } from 'lucide-react';
import Pagination from '../../components/pagination.jsx';
import PresensiDetail from './PresensiDetail.jsx';
import PresensiForm from './PresensiForm.jsx';
import { useNavigate } from 'react-router-dom';
import { formatDateNum } from '../../utils/date.utils.js';
import Swal from 'sweetalert2';

const TrainingPresensi = () => {
  // State for data
  const [trainingSessions, setTrainingSessions] = useState([]);
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [selectedTraining, setSelectedTraining] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [selectedTrainingSesiId, setSelectedTrainingSesiId] = useState(null);

  // Search and pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({
    currentBatch: 1,
    size: 8,
    totalRecords: 0,
    maxPage: 1
  });

  // Refs for preventing unwanted reloads
  const isLoadingRef = useRef(false);
  const modalOpenRef = useRef(false);
  
  const navigate = useNavigate();
  
  // Load training sessions data
  const loadData = useCallback(async (forceReload = false) => {
    if (modalOpenRef.current && !forceReload) return;
    if (isLoadingRef.current) return;

    try {
      isLoadingRef.current = true;
      setLoading(true);
      setError(null);
      
      const response = await fetchTrainingSesiList({
        search: searchQuery,
        batch: pagination.currentBatch,
        size: pagination.size
      });
      
      if (response?.response) {
        setTrainingSessions(response.response.records || []);
        setPermissions(response.response.permissions || {});
        
        const { page } = response.response;
        if (page) {
          setPagination(prev => ({
            ...prev,
            totalRecords: page.total_record_count || 0,
            maxPage: page.maxPage || 1
          }));
        }
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Error fetching training sessions:', err);
      setError('Gagal memuat daftar sesi training. Silakan coba lagi.');
      setTrainingSessions([]);
    } finally {
      setLoading(false);
      setInitialLoading(false);
      isLoadingRef.current = false;
    }
  }, [pagination.currentBatch, searchQuery, pagination.size]);
  
  // Effects
  useEffect(() => {
    if (!modalOpenRef.current) {
      loadData();
    }
  }, [pagination.currentBatch, searchQuery]);

  useEffect(() => {
    modalOpenRef.current = showModal || showUpdateForm;
  }, [showModal, showUpdateForm]);

  // Presensi-related handlers
  const handleViewDetail = async (session) => {
    if (!session?.training_sesi_id) {
      console.error('Invalid session data');
      return;
    }

    try {
      setLoadingDetail(true);
      
      const detailData = await getTrainingSesiDetail(session.training_sesi_id);
      setSelectedTraining(detailData);
      setShowModal(true);
    } catch (error) {
      console.error('Error fetching training detail:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Gagal',
        text: 'Gagal memuat detail sesi training',
        confirmButtonText: 'OK'
      });
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleScheduleReport = (session) => {
    if (!session?.training_sesi_id) {
      console.error('Invalid session data');
      return;
    }
    navigate(`/presensi/form?training_sesi_id=${session.training_sesi_id}`);
  };

  const handleSchedule = (session) => {
    if (!session?.training_sesi_id) {
      console.error('Invalid session data');
      return;
    }
    navigate(`/training/schedule?training_sesi_id=${session.training_sesi_id}`);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedTraining(null);
  };

  // Search and pagination handlers
  const handlePageChange = (page) => {
    if (page !== pagination.currentBatch && page > 0 && page <= pagination.maxPage) {
      setPagination(prev => ({ ...prev, currentBatch: page }));
      
      if (!modalOpenRef.current) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };
  
  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, currentBatch: 1 }));
  };
  
  // Utility functions
  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <span className="bg-green-500 text-white px-1.5 py-0.5 rounded text-xs font-medium">Aktif</span>;
      case 'finish':
        return <span className="bg-blue-500 text-white px-1.5 py-0.5 rounded text-xs font-medium">Selesai</span>;
      default:
        return <span className="bg-red-500 text-white px-1.5 py-0.5 rounded text-xs font-medium">Nonaktif</span>;
    }
  };

  return (
    <div className="p-3">
      {/* Compact Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold text-gray-800">Presensi Training</h1>
        
        {/* Compact Search */}
        <form onSubmit={handleSearch} className="flex">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari training..."
            className="text-sm border rounded-l-md px-2 py-1.5 w-48 focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-3 py-1.5 rounded-r-md hover:bg-blue-600 transition-colors"
          >
            <Search size={14} />
          </button>
        </form>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm border border-red-200">
          <p>{error}</p>
          <button 
            onClick={() => loadData(true)}
            className="mt-1 text-xs underline hover:no-underline"
          >
            Coba lagi
          </button>
        </div>
      )}
      
      {/* Loading state */}
      {initialLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : trainingSessions.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded">
          <p className="text-gray-500">
            {searchQuery ? 'Tidak ada data yang sesuai dengan pencarian.' : 'Tidak ada data training.'}
          </p>
          {searchQuery && (
            <button 
              onClick={() => {
                setSearchQuery('');
                setPagination(prev => ({ ...prev, currentBatch: 1 }));
              }}
              className="mt-2 text-blue-500 hover:text-blue-700 underline text-sm"
            >
              Reset pencarian
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Compact Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {trainingSessions.map((session, index) => {
              const recordNumber = (pagination.currentBatch - 1) * pagination.size + index + 1;
              
              return (
                <div 
                  key={session.training_sesi_id || index} 
                  className="bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                >
                  {/* Header with Status */}
                  <div className="p-3 border-b border-gray-100">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-medium text-sm text-gray-800 leading-tight flex-1 mr-2">
                        {session.name || 'Nama tidak tersedia'}
                      </h3>
                      {getStatusBadge(session.status_active)}
                    </div>
                    <p className="text-xs text-gray-600 font-medium">
                      {session.program_training?.name || 'Program tidak tersedia'}
                    </p>
                  </div>

                  {/* Content */}
                  <div className="p-3 space-y-2">
                    <div className="flex items-center text-xs text-gray-600">
                      <Clock size={12} className="mr-1.5 text-gray-400" />
                      <span>{formatDateNum(session.start_date)} - {formatDateNum(session.end_date)}</span>
                    </div>
                    
                    <div className="flex items-center text-xs text-gray-600">
                      <MapPin size={12} className="mr-1.5 text-gray-400" />
                      <span className="truncate">{session.location}</span>
                    </div>
                    
                    <div className="flex items-center text-xs text-gray-600">
                      <User size={12} className="mr-1.5 text-gray-400" />
                      <span className="truncate">{session.staff?.name || 'N/A'}</span>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="text-center">
                        <div className="text-xs font-semibold text-gray-800">{session.total_meeting || 0}</div>
                        <div className="text-xs text-gray-500">Pertemuan</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs font-semibold text-gray-800">{session.total_participant || 0}</div>
                        <div className="text-xs text-gray-500">Peserta</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex border-t border-gray-100">
                    {permissions?.canRead && (
                      <button
                        onClick={() => handleSchedule(session)}
                        className="flex-1 py-2 px-2 text-purple-600 hover:bg-purple-50 transition-colors border-r border-gray-100 flex items-center justify-center gap-1"
                        title="Jadwal"
                      >
                        <Calendar size={12} />
                        <span className="text-xs">{session.total_meeting || 0}</span>
                      </button>
                    )}

                    {permissions?.canPresent && (
                      <button
                        onClick={() => handleScheduleReport(session)}
                        disabled={session.status_active === 'finish'}
                        className="flex-1 py-2 px-2 text-indigo-600 hover:bg-indigo-50 transition-colors border-r border-gray-100 flex items-center justify-center gap-1 disabled:text-gray-400 disabled:cursor-not-allowed"
                        title="Form Presensi"
                      >   
                        <CalendarCheck size={12} />
                        <span className="text-xs">{session.total_meeting || 0}</span>
                      </button>
                    )}



                    {permissions?.canRead && (
                      <button
                        onClick={() => handleViewDetail(session)}
                        className="flex-1 py-2 px-2 text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center"
                        title="Detail Presensi"
                        disabled={loadingDetail}
                      >
                        <Eye size={12} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        
          {/* Compact Pagination */}
          {pagination.maxPage > 1 && (
            <div className="mt-6">
              <Pagination 
                currentBatch={pagination.currentBatch}
                maxPage={pagination.maxPage}
                totalRecords={pagination.totalRecords}
                pageSize={pagination.size}
                onPageChange={handlePageChange}
                loading={loading}
              />
            </div>
          )}
        </>
      )}
      
      {/* Modal Components */}
      {showModal && selectedTraining && (
        <PresensiDetail
          isOpen={showModal}
          onClose={closeModal}
          trainingDetail={selectedTraining}
          trainingSesiId={selectedTraining.training_sesi_id || selectedTraining.id}
          loading={loadingDetail}
        />
      )}

      {showUpdateForm && (
        <PresensiForm 
          trainingSesiId={selectedTrainingSesiId}
          isOpen={showUpdateForm}
          onClose={() => {
            setShowUpdateForm(false);
            setSelectedTrainingSesiId(null);
          }}
          onSuccess={async () => {
            try {
              await Swal.fire({
                title: 'Berhasil!',
                text: 'Training session berhasil diperbarui!',
                icon: 'success',
                confirmButtonText: 'OK'
              });
              
              setShowUpdateForm(false);
              setSelectedTrainingSesiId(null);
              await loadData(true);
            } catch (error) {
              console.error('Error after update success:', error);
            }
          }}
        />
      )}

      {/* Loading overlay */}
      {(loading && !initialLoading) && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg shadow-lg flex items-center space-x-3">
            <div className="w-6 h-6 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-medium">Memuat data...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainingPresensi;