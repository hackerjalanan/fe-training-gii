import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { fetchParticipants, fetchParticipantById, deleteParticipant } from '../../service/participant.service';
import { fetchProgramTraining, fetchTrainingSesi } from '../../service/master-data.service';
import CreateParticipantForm from './ParticipantForm';
import UpdateParticipantForm from './ParticipantUpdate';
import ParticipantDetail from './ParticipantDetail';

import { 
  Plus, 
  Download, 
  Search, 
  ChevronDown, 
  Eye, 
  Edit, 
  Trash2, 
  User, 
  Home, 
  Calendar, 
  BookOpen, 
  UserX, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight 
} from "lucide-react";

const Participants = () => {
  const { currentUser } = useAuth();
  const { user } = useAuth();
  const currentUse = user?.name || 'staff';
  const pageSize = 5;
  
  // Use ref to prevent unnecessary re-renders
  const loadingRef = useRef(false);
  const searchTimeoutRef = useRef(null);

  // State management
  const [participants, setParticipants] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [programTraining, setProgramTrainings] = useState([]);
  const [trainingSesi, setTrainingSesi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [selectedSesiTraining, setSelectedSesiTraining] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  
  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [participantToDelete, setParticipantToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAddParticipantPopup, setShowAddParticipantPopup] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [showModal, setShowModal] = useState(false);
  
  // Memoized date formatter
  const formatDate = useMemo(() => (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, []);

  // Load master data (training sessions and programs) - only once
  const loadMasterData = useCallback(async () => {
    try {
      const [trainingResponse, programResponse] = await Promise.all([
        fetchTrainingSesi(),
        fetchProgramTraining()
      ]);
      
      if (trainingResponse?.response) {
        setTrainingSesi(trainingResponse.response || []);
      }
      
      if (programResponse?.response) {
        setProgramTrainings(programResponse.response || []);
      }
    } catch (error) {
      console.error('Failed to load master data:', error);
    }
  }, []);

  // Main function to load participants
  const loadParticipants = useCallback(async (options = {}) => {
    // Prevent multiple simultaneous calls

    const params = {
      batch: options.page || currentPage,
      size: pageSize,
      search: options.search !== undefined ? options.search : searchTerm,
      training_sesi_id: options.sesiId !== undefined ? options.sesiId : selectedSesiTraining,
      program_training_id: options.programId !== undefined ? options.programId : selectedProgram,
    };

    // Clean up empty parameters
    Object.keys(params).forEach(key => {
      if (params[key] === '' || params[key] === null || params[key] === undefined) {
        delete params[key];
      }
    });

    try {
      const response = await fetchParticipants(params);
      if (response?.response) {
        setParticipants(response.response.records || []);
        setPermissions(response.response.permissions || []);
        setTotalPages(response.response.page?.maxPage || 1);
        setTotalRecords(response.response.page?.total_record_count || 0);
      } else {
        setParticipants([]);
        setPermissions([]);
        setTotalPages(1);
        setTotalRecords(0);
      }
    } catch (error) {
      console.error('Error loading participants:', error);
      setParticipants([]);
      setPermissions([]);
      setTotalPages(1);
      setTotalRecords(0);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [currentPage, pageSize, searchTerm, selectedSesiTraining, selectedProgram]);

  // Initial load effect - runs only once
  useEffect(() => {
    const initializeData = async () => {
      await loadMasterData();
      await loadParticipants();
    };
    
    initializeData();
  }, []); // Empty dependency array - runs only once

  // Effect for pagination and filter changes (excluding search)
  useEffect(() => {
    loadParticipants();
  }, [currentPage, selectedProgram, selectedSesiTraining]);

  // Debounced search effect
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      // Reset to page 1 and search
      if (currentPage !== 1) {
        setCurrentPage(1);
        // Don't call loadParticipants here, let the currentPage effect handle it
      } else {
        // If already on page 1, load participants with search term
        loadParticipants({ page: 1, search: searchTerm });
      }
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);
  
  // --- Event Handlers ---
  const handleSearch = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleProgramChange = useCallback((e) => {
    const value = e.target.value;
    setSelectedProgram(value);
    setCurrentPage(1);
  }, []);

  const handleSesiChange = useCallback((e) => {
    const value = e.target.value;
    setSelectedSesiTraining(value);
    setCurrentPage(1);
  }, []);
  
  const handleAddParticipant = useCallback(() => {
    setShowAddParticipantPopup(true);
  }, []);
  
  const handleParticipantCreationSuccess = useCallback(() => {
    loadParticipants();
  }, [loadParticipants]);
  
  const handleViewDetail = useCallback(async (participant_id) => {
    try {
      const result = await fetchParticipantById(participant_id);
      const record = result?.response?.records?.[0];
      
      if (record) {
        setSelectedParticipant(record);
        setShowModal(true);
      } else {
        alert('Failed to load participant details.');
      }
    } catch (error) {
      console.error('Error loading participant details:', error);
      alert('Error loading details.');
    }
  }, []);
  
  const handleUpdateParticipant = useCallback(async (participantId) => {
    try {
      const record = await fetchParticipantById(participantId);
      const detail = record?.response?.records?.[0];

      if (detail) {
        setSelectedParticipant(detail);
        setShowUpdateForm(true);
      } else {
        alert('Peserta tidak ditemukan');
      }
    } catch (error) {
      console.error('Gagal mengambil detail peserta:', error);
      alert('Gagal mengambil detail peserta.');
    }
  }, []);
  
  const handleCloseForm = useCallback(() => {
    setShowUpdateForm(false);
    setSelectedParticipant(null);
  }, []);
  
  const handleSuccessUpdate = useCallback(() => {
    loadParticipants();
  }, [loadParticipants]);
  
  const confirmDelete = useCallback((participant) => {
    setParticipantToDelete(participant);
    setShowDeleteModal(true);
  }, []);
  
  const handleDelete = useCallback(async () => {
    if (!participantToDelete) return;
    
    setIsDeleting(true);
    try {
      await deleteParticipant(participantToDelete.participant_id);
      await loadParticipants();
      setShowDeleteModal(false);
      setParticipantToDelete(null);
    } catch (error) {
      console.error('Error deleting participant:', error);
    } finally {
      setIsDeleting(false);
    }
  }, [participantToDelete, loadParticipants]);

  const handleClearFilters = useCallback(() => {
    setSearchTerm('');
    setSelectedProgram('');
    setSelectedSesiTraining('');
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  const handlePrevPage = useCallback(() => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  }, [totalPages]);

  // Helper functions
  const getTrainingNames = useCallback((participant) => {
    if (!participant?.participant_training || participant.participant_training.length === 0) {
      return "-";
    }
    
    return participant.participant_training.map(pt => 
      pt?.training_sesi?.program_training?.alias || '-'
    ).join(', ');
  }, []);

  // Memoized pagination numbers
  const pageNumbers = useMemo(() => {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }, [totalPages]);

    return (
    <div className="min-h-screen   pb-10">
      {/* Header */}
      <div className="bg-gradient-to-r rounded-t-xl   from-blue-600 to-indigo-700 shadow-lg">
        <div className="px-4 py-6 sm:px-6">
          <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-white">Manajemen Peserta</h1>
      
            </div>

            <div className="flex gap-2 mt-2 md:mt-0">
              {permissions?.canCreate && (
                <button  
                   onClick={handleAddParticipant}
                  className="px-4 py-2 bg-green-600 text-white rounded-md shadow-sm text-sm font-medium hover:bg-green-700 transition-colors flex items-center"
                > 
                  <Plus size={16} className="mr-2" />
                  Tambah
                </button>
              )}

              {/* {permissions?.canRead && (
                <button 
                  className="px-4 py-2 bg-white text-blue-600 rounded-md shadow text-sm font-medium hover:bg-gray-100 transition-colors flex items-center"
                >
                  <Download size={16} className="mr-2" />
                  Simpan
                </button>
              )} */}
            </div>
          </div>
        </div>
      </div>
      <div className="mx-auto px-0 sm:px-0 mt-6">
        {/* Card */}
      <div className=" overflow-hidden bg-white p-0 rounded-xl shadow-md">

          {/* Search & Filters */}
          <div className="p-5 bg-white border-b border-gray-100">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input 
                  type="text" 
                  placeholder="Cari peserta berdasarkan nama, instansi atau detail lainnya..." 
                  value={searchTerm}
                  onChange={handleSearch}
                  className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-4 sm:w-2/3 lg:w-auto">
                <div className="relative flex-1">
                  <select 
                    className="pl-3 pr-10 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 transition-all duration-200 bg-white appearance-none w-full"
                    value={selectedProgram}
                    onChange={handleProgramChange}
                  >
                    <option value="">Semua Program Training</option>
                    {programTraining.map(program => (
                      <option key={program.program_training_id} value={program.program_training_id}>
                        {program.name} {program.alias ? `(${program.alias})` : ''}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
                <div className="relative flex-1">
                  <select 
                    className="pl-3 pr-10 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 transition-all duration-200 bg-white appearance-none w-full"
                    value={selectedSesiTraining}
                    onChange={handleSesiChange}
                  >
                    <option value="">Semua Sesi Training</option>
                    {trainingSesi.map(sesi => (
                      <option key={sesi.training_sesi_id} value={sesi.training_sesi_id}>
                        {sesi.name} {sesi.alias ? `(${sesi.alias})` : ''}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Data table - Desktop view */}
          <div className="hidden overflow-x-auto shadow-inner md:block min-h-[400px]">
            {loading ? (
              <div className="flex justify-center items-center h-[400px]">
                <div className="relative">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-6 w-6 bg-white rounded-full"></div>
                  </div>
                </div>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
                    <th scope="col" className="px-0 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Peserta</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Instansi</th>
                    <th scope="col" className="hidden px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider  md:table-cell">Program</th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {participants.length > 0 ? (
                    participants.map(( participant, index) => (
                      <tr
                        key={participant.participant_id}
                        className="hover:bg-blue-50 transition-colors min-h-[64px]"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {index + 1 + (currentPage - 1) * pageSize}
                        </td>
                        <td className="px-0 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-800 leading-none">
                                {participant.name ? participant.name.charAt(0).toUpperCase() : 'U'}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 truncate max-w-[160px]">
                                {participant?.name || 'Tanpa Nama'}
                              </div>
                              <div className="text-sm text-gray-500">
                                <span className="inline-flex items-center">
                                  dibuat: {formatDate(participant.created_at)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {participant?.agency || 'Tanpa Instansi'}
                          </span>
                        </td>
                        <td className="hidden px-6 py-4 whitespace-nowrap text-sm text-gray-500 md:table-cell max-w-xs truncate">
                          {getTrainingNames(participant) || 'Tidak ada program yang ditugaskan'}
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"> 
                          <div className="flex justify-center space-x-2">
                            
                            {permissions?.canRead && (     
                              <button
                                onClick={() => handleViewDetail(participant.participant_id)}
                                className="p-1 bg-blue-100 text-blue-600 hover:bg-blue-200 hover:text-blue-800 rounded"
                                title="Detail"
                              >
                                <Eye size={16} />
                              </button>
                            )}                             
                            {permissions?.canUpdate && ( 
                              <button
                                onClick={() => handleUpdateParticipant(participant.participant_id)}
                                className="p-1 bg-yellow-100 text-yellow-600 hover:bg-yellow-200 hover:text-yellow-800 rounded"
                                title="Ubah"
                              >
                                <Edit size={16} />
                              </button>
                            )}

                            {permissions?.canDelete && (     
                              <button
                                onClick={() => confirmDelete(participant)}
                                className="p-1 bg-red-100 text-red-600 hover:bg-red-200 hover:text-red-800 rounded"
                                title="Hapus"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}

                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center py-32 text-sm text-gray-500">
                        <div className="flex flex-col items-center">
                          <UserX className="h-12 w-12 text-gray-400 mb-3" />
                          <p className="font-medium text-gray-700">Tidak ada peserta ditemukan</p>
                          <p className="text-sm text-gray-500 mt-1">Coba sesuaikan pencarian atau filter Anda</p>
                          <button 
                            onClick={handleClearFilters}
                            className="mt-4 flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            <RefreshCw className="h-4 w-4 mr-1.5" />
                            Hapus semua filter
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Mobile cards view */}
          <div className="md:hidden w-full top-0 px-2 py-4 space-y-4 min-h-[400px]">
            {loading ? (
              <div className="flex justify-center items-center h-[400px]">
                <div className="relative">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-6 w-6 bg-white rounded-full"></div>
                  </div>
                </div>
              </div>
            ) : participants.length > 0 ? (
              participants.map((participant, index) => (
                <div key={participant.participant_id} className="overflow-hidden bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 min-h-[200px]">
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-base items-center justify-center flex font-medium text-gray-900 truncate">
                            <User className="h-4 w-4 mr-1 text-gray-400" />
                            {participant?.name || 'Tanpa Nama'}
                          </h3>
                          <span className="p-1 rounded-xl text-xs text-gray-500">
                            # {index + 1 + (currentPage - 1) * pageSize}
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap gap-y-2 text-sm">
                          <div className="flex items-center text-gray-500">
                            <Home className="h-4 w-4 mr-1 text-gray-400" />
                            Instansi : 
                            <span className="px-2 py-0.5 inline-flex text-ms leading-5 font-semibold rounded-full text-gray-500">
                              {participant?.agency || 'Tanpa Instansi'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center text-gray-500">
                          <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                          Dibuat : 
                          <span className="px-2 py-0.5 inline-flex text-ms leading-5 font-semibold rounded-full text-gray-500">
                            {formatDate(participant.created_at)}
                          </span>
                        </div>
                        <div className="text-sm flex ml-0.5 flex-row text-gray-600">
                          <div className="font-medium flex items-center justify-center gap-1 text-gray-500 mb-0.5">
                            <BookOpen size={14} className="text-gray-500 mt-1"/>
                            Program: 
                          </div>
                          <div className="pl-1 text-sm text-gray-600 line-clamp-2">
                            {getTrainingNames(participant) || "Tidak ada program yang ditugaskan"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action buttons with consistent styling */}
                  <div className="p-3 border-t border-gray-100 flex justify-end space-x-3">

                    {permissions?.canRead && ( 
                      <button
                        onClick={() => handleViewDetail(participant.participant_id)}
                        className="p-1 text-blue-600 hover:text-blue-800"
                        title="Detail"
                        >
                        <Eye size={16} />
                      </button>
                    )}
                    {permissions?.canUpdate && ( 
                      <button
                        onClick={() => handleUpdateParticipant(participant.participant_id)}
                        className="p-1 text-yellow-600 hover:text-yellow-800"
                        title="Ubah"
                      >
                        <Edit size={16} />
                      </button>
                    )}
                    {permissions?.canCreate && ( 
                    <button
                      onClick={() => confirmDelete(participant)}
                      className="p-1 text-red-600 hover:text-red-800"
                      title="Hapus"
                    >
                      <Trash2 size={16} />
                    </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-16 px-4 text-center rounded-lg border border-gray-200 bg-gray-50 h-[400px] flex items-center justify-center">
                <div className="flex flex-col items-center">
                  <UserX className="h-12 w-12 text-gray-400 mb-3" />
                  <p className="font-medium text-gray-700">Tidak ada peserta ditemukan</p>
                  <p className="text-sm text-gray-500 mt-1">Coba sesuaikan pencarian atau filter Anda</p>
                  <button 
                    onClick={handleClearFilters}
                    className="mt-4 flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <RefreshCw className="h-4 w-4 mr-1.5" />
                    Hapus semua filter
                  </button>
                </div>
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="bg-white border-t border-gray-200 px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="hidden sm:block">
                  <p className="text-sm text-gray-700">
                    Menampilkan <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> sampai <span className="font-medium">{Math.min(currentPage * pageSize, totalRecords)}</span> dari{' '}
                    <span className="font-medium">{totalRecords}</span> peserta
                  </p>
                </div>
                <div className="flex flex-1 justify-between sm:justify-end items-center">
                  <p className="sm:hidden text-sm text-gray-700 mr-4 ">
                    Halaman {currentPage} dari {totalPages}
                  </p>
                  <nav className="relative z-0 inline-flex shadow-sm rounded-md" aria-label="Pagination">
                    <button
                      onClick={handlePrevPage}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-3 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <span className="sr-only">Sebelumnya</span>
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    
                    {/* Page numbers */}
                    {pageNumbers.map((page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`relative inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium transition-colors ${
                          currentPage === page 
                            ? 'bg-blue-500 text-white border-blue-500 z-10' 
                            : 'bg-white text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    
                    <button
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-3 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <span className="sr-only">Selanjutnya</span>
                      <ChevronRight className="h-5 w-5" />
                    </button>
                    </nav>
                </div>
              </div>
            </div>
          )}

          {/* Pagination section */}
        </div>
      </div>

      {/* Modals */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="overflow-hidden bg-white rounded-lg shadow-xl max-w-md w-full ">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-medium text-gray-900">Konfirmasi Hapus</h3>
            </div>
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-700">
                    Apakah Anda yakin ingin menghapus peserta <span className="font-semibold">{participantToDelete?.name || 'Tidak Diketahui'}</span>?
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Tindakan ini tidak dapat dibatalkan. Semua data yang terkait dengan peserta ini akan dihapus secara permanen.
                  </p>
                </div>
              </div>
            </div>
            <div className="px-6 py-3 bg-gray-50 text-right">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 mr-2"
                disabled={isDeleting}
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Memproses...
                  </div>
                ) : 'Hapus Peserta'}
              </button>
              </div>
          </div>
        </div>
      )}

      {showAddParticipantPopup && (
        <CreateParticipantForm
          onClose={() => setShowAddParticipantPopup(false)}
          onSuccess={() => {
            setShowAddParticipantPopup(false);
            handleParticipantCreationSuccess();
          }}
        />
      )}

      {showUpdateForm && selectedParticipant && (
        <UpdateParticipantForm
          participant={selectedParticipant}
          onClose={handleCloseForm}
          onSuccess={handleSuccessUpdate}
        />
      )}

      {showModal && selectedParticipant && (
        <ParticipantDetail
          participant={selectedParticipant}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

export default Participants;

