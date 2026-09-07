import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, 
  Search, 
  UserPlus, 
  Users, 
  Building, 
  Mail,
  MapPin,
  Calendar,
  Plus,
  Loader2,
  CheckCircle
} from 'lucide-react';
import { fetchParticipants, updateParticipant } from '../../../service/participant.service'; // Adjust path as needed

const AddExistingParticipantPopup = ({ 
  trainingSesiId, 
  onClose, 
  onSuccess 
}) => {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [addingParticipants, setAddingParticipants] = useState(new Set());
  const [addedParticipants, setAddedParticipants] = useState(new Set());
  
  const pageSize = 5;

  // Load participants function - removed useCallback to prevent dependency issues
  const loadParticipants = async (page = currentPage, search = searchTerm) => {
    if (!trainingSesiId) {
      console.error('trainingSesiId is required');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const params = {
        batch: page,
        size: pageSize,
        not_sesi_training: trainingSesiId, // Parameter untuk exclude participants dari training sesi ini
        ...(search && { search: search })
      };

      console.log('Fetching participants with params:', params); // Debug log

      const data = await fetchParticipants(params);
      
      console.log('Received data:', data); // Debug log
      
      if (data && data.response) {
        setParticipants(data.response.records || []);
        setTotalPages(data.response.page?.maxPage || 1);
        setTotalRecords(data.response.page?.totalRecords || 0);
      } else {
        console.warn('Unexpected data structure:', data);
        setParticipants([]);
        setTotalPages(1);
        setTotalRecords(0);
      }
      
    } catch (error) {
      console.error('Error fetching participants:', error);
      setParticipants([]);
      setTotalPages(1);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  };

  // Add participant to training session
  const handleAddParticipant = async (participantId) => {
    setAddingParticipants(prev => new Set([...prev, participantId]));
    
    try {
      // Menggunakan updateParticipant service
      const participantData = {
        only_sesi_training_id: trainingSesiId
      };

      console.log('Updating participant with data:', participantData); // Debug log

      const result = await updateParticipant(participantId, participantData);
      console.log('Update participant response:', result); // Debug log

      // Mark as successfully added
      setAddedParticipants(prev => new Set([...prev, participantId]));
      
      // Remove from available participants list
      setParticipants(prev => prev.filter(p => p.participant_id !== participantId));
      
      // Update total records count
      setTotalRecords(prev => prev - 1);
      
      // Show success notification (you can customize this)
      console.log('Participant successfully added to training session');
      
    } catch (error) {
      console.error('Error adding participant:', error);
      // Show user-friendly error message
      const errorMessage = error.response?.data?.message || 'Gagal menambahkan peserta. Silakan coba lagi.';
      alert(errorMessage);
    } finally {
      setAddingParticipants(prev => {
        const newSet = new Set(prev);
        newSet.delete(participantId);
        return newSet;
      });
    }
  };

  // Handle search with debounce - fixed to prevent double execution
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (currentPage !== 1) {
        setCurrentPage(1);
      } else {
        loadParticipants(1, searchTerm); // Call loadParticipants directly with parameters
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]); // Removed loadParticipants from dependencies

  // Load participants when page changes - fixed to prevent double execution
  useEffect(() => {
    loadParticipants(currentPage, searchTerm); // Call loadParticipants directly with parameters
  }, [currentPage]); // Removed loadParticipants and searchTerm from dependencies

  // Initial load - separate effect for component mount
  useEffect(() => {
    loadParticipants(1, ''); // Initial load with default values
  }, [trainingSesiId]); // Only depend on trainingSesiId

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleSave = () => {
    if (addedParticipants.size > 0) {
      onSuccess?.();
    }
  };

  // Early return if trainingSesiId is not provided
  if (!trainingSesiId) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error</h3>
            <p className="text-gray-500 mb-4">Training session ID is required</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <UserPlus className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Tambah Peserta
              </h2>
              <p className="text-sm text-gray-500">
                {/* Pilih peserta yang sudah ada untuk ditambahkan ke sesi training (ID: {trainingSesiId}) */}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-6 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari peserta berdasarkan nama, instansi, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Content - Fixed height container */}
        <div className="flex-1 overflow-y-auto">
          {/* Fixed minimum height container for consistent sizing */}
          <div className="min-h-[400px] p-6 relative">
            {loading ? (
              /* Loading state - centered spinner only */
              <div className="flex items-center justify-center absolute inset-0">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
                  <p className="text-gray-500">Memuat daftar peserta...</p>
                </div>
              </div>
            ) : participants.length === 0 ? (
              /* Empty state with same height as content */
              <div className="flex items-center justify-center h-full min-h-[350px]">
                <div className="text-center">
                  <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Tidak ada peserta tersedia
                  </h3>
                  <p className="text-gray-500 mb-4">
                    {searchTerm 
                      ? 'Tidak ditemukan peserta yang sesuai dengan pencarian'
                      : 'Semua peserta sudah terdaftar di sesi training ini'
                    }
                  </p>
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Hapus filter pencarian
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* Content state */
              <div className="space-y-4">
                {participants.map((participant) => (
                  <div
                    key={participant.participant_id}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-start space-x-4">
                          {/* Avatar */}
                          <div className="flex-shrink-0 h-12 w-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                            <span className="text-lg font-semibold text-blue-800">
                              {participant.name?.charAt(0)?.toUpperCase() || 'U'}
                            </span>
                          </div>
                          
                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                              {participant.name || 'Nama tidak tersedia'}
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                              <div className="flex items-center text-gray-600">
                                <Building className="h-4 w-4 mr-2 text-gray-400" />
                                <span>{participant.agency || 'Instansi tidak tersedia'}</span>
                              </div>
                              
                              <div className="flex items-center text-gray-600">
                                <Mail className="h-4 w-4 mr-2 text-gray-400" />
                                <span>{participant.email || 'Email tidak tersedia'}</span>
                              </div>
                              
                              <div className="flex items-center text-gray-600">
                                <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                                <span>{participant.domicile || 'Domisili tidak tersedia'}</span>
                              </div>
                              
                              <div className="flex items-center text-gray-600">
                                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                                <span>Bergabung: {formatDate(participant.created_at)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Action Button */}
                      <div className="flex-shrink-0 ml-4">
                        {addedParticipants.has(participant.participant_id) ? (
                          <div className="flex items-center text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                            <CheckCircle className="h-5 w-5 mr-2" />
                            <span className="text-sm font-medium">Ditambahkan</span>
                          </div>
                        ) : (
                          <button
                  
                            onClick={() => handleAddParticipant(participant.participant_id)}
                            disabled={addingParticipants.has(participant.participant_id)}
                            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {addingParticipants.has(participant.participant_id) ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                <span className="text-sm font-medium">Menambahkan...</span>
                              </>
                            ) : (
                              <>
                                <Plus className="h-4 w-4 mr-2" />
                                <span className="text-sm font-medium">Tambah</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && !loading && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Menampilkan {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, totalRecords)} dari {totalRecords} peserta
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Sebelumnya
                </button>
                <span className="px-3 py-1 text-sm text-gray-600">
                  {currentPage} dari {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {addedParticipants.size > 0 && (
                <span className="text-green-600 font-medium">
                  {addedParticipants.size} peserta berhasil ditambahkan
                </span>
              )}
            </div>
            <div className="flex space-x-3">

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddExistingParticipantPopup;