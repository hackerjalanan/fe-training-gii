import React, { useState, useEffect, useCallback } from 'react';
import { Search, Users, Save, Check  , RotateCcw, RefreshCw, ChevronDown, Calendar, Clock, User, Building, Mail, X } from 'lucide-react';
import { fetchTrainingSesi } from '../../service/master-data.service';
import { fetchMeetingPresent, fetchSavePresent, dropdownMeeting } from '../../service/present.service';
import Swal from 'sweetalert2';
import { useLocation, useParams } from 'react-router-dom';

const PresenceFormPage = () => {
  // Get training session ID from URL params
  const { trainingSesiId: sesiId } = useParams();
  const routerLocation = useLocation();
  
  const trainingSesiId = sesiId || new URLSearchParams(routerLocation.search).get('training_sesi_id');
  
  console.log('Training Sesi ID:', trainingSesiId);
  
  // State management
  const [trainingSesiInfo, setTrainingSesiInfo] = useState(null);
  const [loadingTrainingSesi, setLoadingTrainingSesi] = useState(false);
  const [meetingOptions, setMeetingOptions] = useState([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [presenceData, setPresenceData] = useState({
    meeting: '',
    data: [],
    filter_info: {
      meeting_id: '',
      total_participants: 0
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pendingChanges, setPendingChanges] = useState(new Map());
  const [isSaving, setIsSaving] = useState(false);

  // Load Training Sesi Info
  const loadTrainingSesiInfo = useCallback(async () => {
    if (!trainingSesiId) {
      setError('Training Session ID is required');
      setLoadingTrainingSesi(false);
      return;
    }

    try {
      setLoadingTrainingSesi(true);
      const response = await fetchTrainingSesi();
      
      let trainingSesiList = [];
      if (response?.response) {
        trainingSesiList = response.response;
      } else if (response?.data) {
        trainingSesiList = response.data;
      } else if (Array.isArray(response)) {
        trainingSesiList = response;
      }
      
      const trainingSesi = trainingSesiList.find(item => {
        const itemId = String(item.training_sesi_id || item.id);
        const searchId = String(trainingSesiId);
        return itemId === searchId && 
               item.status_active === 'active' && 
               (item.status_deleted === 1 || item.status_deleted === true);
      });
      
      if (trainingSesi) {
        setTrainingSesiInfo(trainingSesi);
      } else {
        const fallbackTrainingSesi = trainingSesiList.find(item => {
          const itemId = String(item.training_sesi_id || item.id);
          const searchId = String(trainingSesiId);
          return itemId === searchId;
        });
        
        if (fallbackTrainingSesi) {
          setTrainingSesiInfo(fallbackTrainingSesi);
        } else {
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

  // Load Meeting Dropdown Options
  const loadMeetingOptions = useCallback(async () => {
    if (!trainingSesiId) return;

    try {
      const response = await dropdownMeeting(trainingSesiId);
      setMeetingOptions(response.response || []);
    } catch (err) {
      console.error('Error loading meeting options:', err);
      setMeetingOptions([]);
    }
  }, [trainingSesiId]);

  // Load Presence Data
  const loadPresenceData = useCallback(async () => {
    if (!trainingSesiId || !selectedMeetingId) return;

    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetchMeetingPresent(trainingSesiId, selectedMeetingId, searchQuery);
      setPresenceData(response.response);
      setPendingChanges(new Map()); // Clear pending changes when loading new data
    } catch (err) {
      setError('Failed to load presence data. Please try again.');
      console.error('Error loading presence data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [trainingSesiId, selectedMeetingId, searchQuery]);

  // Initial data loading
  useEffect(() => {
    if (trainingSesiId) {
      loadTrainingSesiInfo();
      loadMeetingOptions();
    }
  }, [loadTrainingSesiInfo, loadMeetingOptions]);

  // Load presence data when meeting is selected
  useEffect(() => {
    if (selectedMeetingId) {
      loadPresenceData();
    }
  }, [loadPresenceData]);

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
      return '-';
    }
  };

  // Handle presence status change
  const handlePresenceChange = (participantId, status) => {
    const newPendingChanges = new Map(pendingChanges);
    newPendingChanges.set(participantId, status);
    setPendingChanges(newPendingChanges);
  };

  // Get current status for participant (including pending changes)
  const getCurrentStatus = (participant) => {
    const participantId = participant.participant_id;
    if (pendingChanges.has(participantId)) {
      return pendingChanges.get(participantId);
    }
    return participant.presences?.status || '-';
  };

  // Save all pending changes
  const handleSaveAll = async () => {
    if (pendingChanges.size === 0) {
      await Swal.fire({
        title: 'Info',
        text: 'Tidak ada perubahan untuk disimpan.',
        icon: 'info',
        timer: 1500,
        showConfirmButton: false
      });
      return;
    }

    try {
      setIsSaving(true);
      
      const savePromises = Array.from(pendingChanges.entries()).map(([participantId, status]) => 
        fetchSavePresent(selectedMeetingId, participantId, status)
      );

      await Promise.all(savePromises);

      await Swal.fire({
        title: 'Berhasil!',
        text: `${pendingChanges.size} data presensi berhasil disimpan.`,
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });

      setPendingChanges(new Map());
      loadPresenceData(); // Reload data to get updated status
    } catch (error) {
      await Swal.fire({
        title: 'Gagal!',
        text: `Gagal menyimpan data presensi: ${error.message}`,
        icon: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Reset search
  const resetSearch = () => {
    setSearchQuery('');
  };

  // Apply search filter
  const applySearch = () => {
    loadPresenceData();
  };

  const isAllPresenceFilled = () => {
    if (!presenceData?.data) return false;
    return presenceData.data.every(participant => getCurrentStatus(participant) !== '-');
  };


    // Fungsi untuk menghandle bulk actions (set semua peserta dengan status yang sama)
  const handleBulkAction = (status) => {
    if (!presenceData.data || presenceData.data.length === 0) {
      return;
    }

    // Konfirmasi dari user
    const statusText = {
      'hadir': 'HADIR',
      'izin': 'IZIN', 
      'absen': 'ABSEN',
      '-': 'BELUM DIISI'
    };

    const confirmMessage = `Apakah Anda yakin ingin mengubah status semua peserta (${presenceData.data.length} orang) menjadi "${statusText[status]}"?`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    // Set semua peserta dengan status yang dipilih
    presenceData.data.forEach(participant => {
      handlePresenceChange(participant.participant_id, status);
    });

    // Optional: Tampilkan notifikasi sukses
    // toast.success(`Berhasil mengubah status ${presenceData.data.length} peserta menjadi ${statusText[status]}`);
  };

  // Fungsi untuk mendapatkan ringkasan status presensi
  const getPresenceSummary = () => {
    if (!presenceData.data || presenceData.data.length === 0) {
      return { hadir: 0, izin: 0, absen: 0, belumDiisi: 0, total: 0 };
    }

    const summary = {
      hadir: 0,
      izin: 0, 
      absen: 0,
      belumDiisi: 0,
      total: presenceData.data.length
    };

    presenceData.data.forEach(participant => {
      const status = getCurrentStatus(participant);
      switch(status) {
        case 'hadir':
          summary.hadir++;
          break;
        case 'izin':
          summary.izin++;
          break;
        case 'absen':
          summary.absen++;
          break;
        default:
          summary.belumDiisi++;
      }
    });

    return summary;
  };



  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="mx-auto">
        <div className="bg-white rounded-lg shadow border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 py-4 px-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <div className="flex-1">
                <h1 className="text-xl font-bold text-white mb-1">Form Input Presensi</h1>
                <p className="text-blue-100 text-sm">Kelola kehadiran peserta training</p>
                
                {/* Training Session Info */}
                <div className="mt-2">
                  {loadingTrainingSesi ? (
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1 flex items-center">
                      <div className="mr-1 h-3 w-3 border-t-2 border-white/60 rounded-full animate-spin"></div>
                      <span className="text-white/80 text-sm">Memuat training sesi...</span>
                    </div>
                  ) : trainingSesiInfo ? (
                    <div className="rounded-lg px-3 py-1">
                      <div className="text-white font-medium text-sm">
                        📚 Training: {trainingSesiInfo.name}
                      </div>
                      <div className="text-blue-100 text-xs">
                        <div>📍 Tempat: {trainingSesiInfo.location || 'Tidak tersedia'}</div>
                        <div>📅 Periode: {formatDate(trainingSesiInfo.start_date)} - {formatDate(trainingSesiInfo.end_date)}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-red-500/20 backdrop-blur-sm rounded-lg px-3 py-1">
                      <div className="text-red-100 text-xs">
                        ⚠️ Training session tidak ditemukan (ID: {trainingSesiId})
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Save Button */}
              {pendingChanges.size > 0 && (
                <button 
                  onClick={handleSaveAll}
                  disabled={isSaving || !isAllPresenceFilled()}
                  className="mt-2 md:mt-0 flex items-center justify-center gap-1 px-3 py-1.5 
                    bg-green-500 hover:bg-green-600 
                    disabled:bg-green-400 disabled:cursor-not-allowed 
                    text-white rounded-lg text-sm font-medium transition-all shadow-sm"
                >
                  {isSaving ? (
                    <div className="h-3 w-3 border-t-2 border-white rounded-full animate-spin"></div>
                  ) : (
                    <Save size={14} />
                  )}
                  <span>Simpan ({pendingChanges.size})</span>
                </button>
              )}
            </div>
          </div>

          {/* Filters Section */}
          <div className="p-4 border-b border-gray-100 space-y-3">
            {/* Meeting Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pilih Pertemuan
                </label>
                <div className="relative">
                  <select
                    value={selectedMeetingId}
                    onChange={(e) => setSelectedMeetingId(e.target.value)}
                    className="block w-full pl-2 pr-8 py-1.5 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="">-- Pilih Pertemuan --</option>
                    {meetingOptions.map((meeting) => (
                      <option key={meeting.meeting_id} value={meeting.meeting_id}>
                        {meeting.nama}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cari Peserta
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                    <Search size={14} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Cari berdasarkan nama atau agency..."
                    className="block w-full pl-8 pr-8 py-1.5 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        applySearch();
                      }
                    }}
                  />
                  {searchQuery && (
                    <button
                      onClick={resetSearch}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-all"
                      title="Reset"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Meeting Info */}
            <div className="flex justify-between items-center">
              {/* Meeting Info on the right */}
              {selectedMeetingId && presenceData.meeting && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                  <div className="flex items-center text-blue-800 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} />
                      <span className="font-medium">{presenceData.meeting}</span>
                      <span className="text-blue-600">•</span>
                      <Users size={14} />
                      <span>{presenceData.filter_info?.total_participants || 0} Peserta</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Bulk Actions on the left */}
              {selectedMeetingId && presenceData.data && presenceData.data.length > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-2">
                  <div className="flex items-center text-gray-700 text-sm">
                    <div className="flex items-center gap-2">
                      <Users size={14} className="text-gray-500" />
                      <span className="font-medium">Aksi Massal:</span>
                    </div>
                    <div className="flex flex-wrap gap-1 ml-4">
                      <button
                        onClick={() => handleBulkAction('hadir')}
                        className="flex items-center gap-1 px-2 py-1 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-all shadow-sm"
                      >
                        <Check size={12} />
                        <span>Hadir Semua</span>
                      </button>
                      <button
                        onClick={() => handleBulkAction('izin')}
                        className="flex items-center gap-1 px-2 py-1 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium rounded-lg transition-all shadow-sm"
                      >
                        <Clock size={12} />
                        <span>Izin Semua</span>
                      </button>
                      <button
                        onClick={() => handleBulkAction('absen')}
                        className="flex items-center gap-1 px-2 py-1 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-all shadow-sm"
                      >
                        <X size={12} />
                        <span>Absen Semua</span>
                      </button>
                      <button
                        onClick={() => handleBulkAction('-')}
                        className="flex items-center gap-1 px-2 py-1 bg-gray-500 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-all shadow-sm"
                      >
                        <RotateCcw size={12} />
                        <span>Reset Semua</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>


          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center items-center p-8">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <p className="mt-2 text-sm text-gray-500">Memuat data presensi...</p>
              </div>
            </div>
          )}
          
          {/* Error State */}
          {error && (
            <div className="m-4 p-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center">
              <div className="mr-2 flex-shrink-0">
                <svg className="h-4 w-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div>{error}</div>
            </div>
          )}

          {/* Content */}
          {!isLoading && !error && selectedMeetingId && (
            <>
              {/* Mobile Card View */}
              <div className="block md:hidden p-2 space-y-2">
                {presenceData.data && presenceData.data.length > 0 ? (
                  presenceData.data.map((participant, index) => (
                    <div key={participant.participant_id} className="bg-white rounded-lg shadow border border-gray-200 p-2">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                            <User  size={16} />
                          </div>
                          <div className="ml-2">
                            <h3 className="font-semibold text-gray-800 text-sm">{participant.name}</h3>
                            <p className="text-xs text-gray-600">{participant.agency}</p>
                          </div>
                        </div>
                      </div>

                      <div className="mb-2">
                        <p className="text-xs text-gray-600 flex items-center">
                          <Mail size={12} className="mr-1" />
                          {participant.email}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-gray-100">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Status Kehadiran</label>
                        <select
                          value={getCurrentStatus(participant)}
                          onChange={(e) => handlePresenceChange(participant.participant_id, e.target.value)}
                          className="block w-full px-2 py-1 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        >
                          <option value="-">Belum Diisi</option>
                          <option value="hadir">Hadir</option>
                          <option value="izin">Izin</option>
                          <option value="absen">Absen</option>
                        </select>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-4">
                    <Users size={36} className="mx-auto text-gray-300 mb-2" />
                    <p>Tidak ada data peserta</p>
                  </div>
                )}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agency</th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status Kehadiran</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {presenceData.data && presenceData.data.length > 0 ? (
                      presenceData.data.map((participant, index) => (
                        <tr key={participant.participant_id} className="hover:bg-blue-50/30 transition-colors">
                          <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">
                            {index + 1}
                          </td>
                          <td className="px-2 py-2 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                                <User  size={14} />
                              </div>
                              <div className="ml-2">
                                <div className="text-sm font-medium text-gray-900">{participant.name}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-2 py-2 whitespace-nowrap">
                            <div className="flex items-center text-sm text-gray-600">
                              <Building size={12} className="mr-1 text-gray-400" />
                              {participant.agency}
                            </div>
                          </td>
                          <td className="px-2 py-2 whitespace-nowrap">
                            <div className="flex items-center text-sm text-gray-600">
                              <Mail size={12} className="mr-1 text-gray-400" />
                              {participant.email}
                            </div>
                          </td>
                          <td className="px-2 py-2 whitespace-nowrap text-center">
                            <select
                              value={getCurrentStatus(participant)}
                              onChange={(e) => handlePresenceChange(participant.participant_id, e.target.value)}
                              className={`px-2 py-1 border rounded-lg text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                getCurrentStatus(participant) === 'hadir' 
                                  ? 'bg-green-50 border-green-200 text-green-700'
                                  : getCurrentStatus(participant) === 'izin'
                                  ? 'bg-yellow-50 border-yellow-200 text-yellow-700'
                                  : getCurrentStatus(participant) === 'absen'
                                  ? 'bg-red-50 border-red-200 text-red-700'
                                  : 'bg-gray-50 border-gray-200 text-gray-600'
                              }`}
                            >
                              <option value="-">Belum Diisi</option>
                              <option value="hadir">Hadir</option>
                              <option value="izin">Izin</option>
                              <option value="absen">Absen</option>
                            </select>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-2 py-8 text-center text-gray-500">
                          <div className="flex flex-col items-center">
                            <Users size={36} className="text-gray-300 mb-2" />
                            <p className="text-gray-600 font-medium">Tidak ada data peserta</p>
                            <p className="text-gray-500 text-sm mt-1">Pastikan Anda sudah memilih pertemuan yang benar</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Empty State - No Meeting Selected */}
          {!isLoading && !error && !selectedMeetingId && (
            <div className="p-8 text-center">
              <div className="flex flex-col items-center">
                <div className="bg-gray-100 p-4 rounded-full mb-2">
                  <Calendar size={24} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">Pilih Pertemuan</h3>
                <p className="text-gray-500 text-sm">Silakan pilih pertemuan terlebih dahulu untuk melihat daftar peserta dan mengisi presensi.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

};

export default PresenceFormPage;