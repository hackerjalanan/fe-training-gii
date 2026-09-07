import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { fetchParticipants, fetchParticipantById, deleteParticipant } from '../../../service/participant.service';
import { fetchProgramTraining, fetchTrainingSesi } from '../../../service/master-data.service';
import { getTrainingSesiDetail, deleteTrainingSesiParticipant } from '../../../service/training-sesi.service';
import { formatDatetime } from '../../../utils/date.utils';
import CreateParticipantForm from './ParticipantForm';
import CreateParticipantTrainingForm from './AddParticipantTraining';
import UpdateParticipantForm from './ParticipantUpdate';
import ParticipantDetail from './ParticipantDetail';
import { useLocation, useParams } from 'react-router-dom';
import {
  Plus, Download, Search, ChevronDown, Eye, Edit, Trash2,
  User, Home, Calendar, BookOpen, UserX, RefreshCw, 
  ChevronLeft, ChevronRight
} from 'lucide-react';

const pageSize = 5;

const ParticipantsTraining = () => {
  const { currentUser, user } = useAuth();
  const { trainingSesiId: sesiId } = useParams();
  const routerLocation = useLocation();
  const currentUse = user?.name || 'staff';

  const loadingRef = useRef(false);
  const searchTimeoutRef = useRef(null);

  const [participants, setParticipants] = useState([]);
  const [programTraining, setProgramTrainings] = useState([]);
  const [trainingSesi, setTrainingSesi] = useState([]);
  
  // Fixed: Change variable name and structure for training session detail
  const [trainingSessionDetail, setTrainingSessionDetail] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [selectedSesiTraining, setSelectedSesiTraining] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [permissions, setPermissions] = useState([]);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [participantToDelete, setParticipantToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAddParticipantPopup, setShowAddParticipantPopup] = useState(false);
  const [showAddParticipantTrainingPopup, setShowAddParticipantTrainingPopup] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const trainingSesiId = new URLSearchParams(routerLocation.search).get('training_sesi_id') || sesiId;

  const formatDatetime = useMemo(() => (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }, []);

  const loadMasterData = useCallback(async () => {
    try {
      const [trainingRes, programRes] = await Promise.all([
        fetchTrainingSesi(),
        fetchProgramTraining()
      ]);
      setTrainingSesi(trainingRes?.response || []);
      setProgramTrainings(programRes?.response || []);
    } catch (error) {
      console.error('Failed to load master data:', error);
    }
  }, []);

  // Fixed: Load training session detail properly
  const loadTrainingSessionDetail = useCallback(async () => {
    if (!trainingSesiId) return;
    
    try {
      const response = await getTrainingSesiDetail(trainingSesiId);
      setTrainingSessionDetail(response);
    } catch (error) {
      console.error('Failed to load training session detail:', error);
      setTrainingSessionDetail(null);
    }
  }, [trainingSesiId]);

  const loadParticipants = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);

    try {
      const params = {
        batch: currentPage,
        size: pageSize,
        search: searchTerm,
        training_sesi_id: trainingSesiId,
        program_training_id: selectedProgram
      };

      Object.keys(params).forEach((key) => {
        if (!params[key]) delete params[key];
      });

      const response = await fetchParticipants(params);
      const data = response?.response;
      setParticipants(data?.records || []);
      setPermissions(response.response.permissions || []);

      setTotalPages(data?.totalPages || 1);
      setTotalRecords(data?.totalRecords || 0);
    } catch (error) {
      console.error('Failed to load participants:', error);
      setParticipants([]);
      setPermissions([]);
      setTotalPages(1);
      setTotalRecords(0);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [currentPage, searchTerm, trainingSesiId, selectedProgram]);

  useEffect(() => {
    loadMasterData();
  }, [loadMasterData]);

  // Fixed: Load training session detail when trainingSesiId changes
  useEffect(() => {
    loadTrainingSessionDetail();
  }, [loadTrainingSessionDetail]);

  useEffect(() => {
    loadParticipants();
  }, [trainingSesiId, currentPage, selectedProgram, loadParticipants]);

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(searchTimeoutRef.current);
  }, [searchTerm]);

  const handleSearch = useCallback((e) => setSearchTerm(e.target.value), []);
  const handleProgramChange = useCallback((e) => {
    setSelectedProgram(e.target.value);
    setCurrentPage(1);
  }, []);

  const handleSesiChange = useCallback((e) => {
    setSelectedSesiTraining(e.target.value);
    setCurrentPage(1);
  }, []);

  // Fixed: Add Participant handlers with proper error handling
  const handleAddParticipant = useCallback(() => {
    try {
      setShowAddParticipantPopup(true);
    } catch (error) {
      console.error('Error opening add participant form:', error);
      alert('Terjadi kesalahan saat membuka form tambah peserta');
    }
  }, []);

  const handleAddParticipantTraining = useCallback(() => {
    try {
      setShowAddParticipantTrainingPopup(true);
    } catch (error) {
      console.error('Error opening add participant training form:', error);  
      alert('Terjadi kesalahan saat membuka form tambah peserta training');
    }
  }, []);

  // Fixed: Success handler with proper refresh
  const handleParticipantCreationSuccess = useCallback(async () => {
    try {
      // Close the modals first
      setShowAddParticipantPopup(false);
      setShowAddParticipantTrainingPopup(false);
      
      // Reset to first page and reload
      setCurrentPage(1);
      await loadParticipants();
      
      // Show success message
      alert('Peserta berhasil ditambahkan!');
    } catch (error) {
      console.error('Error after participant creation:', error);
    }
  }, [loadParticipants]);

  const handleViewDetail = useCallback(async (id) => {
    try {
      const res = await fetchParticipantById(id);
      const data = res?.response?.records?.[0];
      if (data) {
        setSelectedParticipant(data);
        setShowModal(true);
      } else {
        alert('Gagal mengambil data peserta.');
      }
    } catch (err) {
      console.error('Error loading detail:', err);
      alert('Terjadi kesalahan saat mengambil detail peserta.');
    }
  }, []);

  const handleUpdateParticipant = useCallback(async (id) => {
    try {
      const res = await fetchParticipantById(id);
      const data = res?.response?.records?.[0];
      if (data) {
        setSelectedParticipant(data);
        setShowUpdateForm(true);
      } else {
        alert('Peserta tidak ditemukan.');
      }
    } catch (err) {
      console.error('Error loading for update:', err);
      alert('Terjadi kesalahan saat mengambil data peserta untuk update.');
    }
  }, []);

  const handleCloseForm = useCallback(() => {
    setShowUpdateForm(false);
    setSelectedParticipant(null);
  }, []);

  const handleCloseAddpartForm = useCallback(async (id) => {
    try{
      setShowAddParticipantTrainingPopup(false)
      setShowUpdateForm(false);
      setSelectedParticipant(null);
       
      // Reset to first page and reload
      setCurrentPage(1);
      await loadParticipants();

    } catch (error) {
      console.error('Error after participant creation:', error);
    }
  }, [loadParticipants]);


  const handleSuccessUpdate = useCallback(async () => {
    try {
      await loadParticipants();
      alert('Peserta berhasil diperbarui!');
    } catch (error) {
      console.error('Error after participant update:', error);
    }
  }, [loadParticipants]);

  const confirmDelete = useCallback((participant) => {
    setParticipantToDelete(participant);
    setShowDeleteModal(true);
  }, []);


  const handleDelete = useCallback(async () => {
    if (!participantToDelete) return;
    setIsDeleting(true);
    try {
      await deleteTrainingSesiParticipant(participantToDelete.participant_id, trainingSesiId);
      await loadParticipants();
      setShowDeleteModal(false);
      setParticipantToDelete(null);
      alert('Peserta berhasil dihapus!');
    } catch (error) {
      console.error('Delete error:', error);
      alert('Terjadi kesalahan saat menghapus peserta.');
    } finally {
      setIsDeleting(false);
    }
  }, [participantToDelete, trainingSesiId, loadParticipants]);

  const handleClearFilters = useCallback(() => {
    setSearchTerm('');
    setSelectedProgram('');
    setSelectedSesiTraining('');
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page) => setCurrentPage(page), []);
  const handlePrevPage = useCallback(() => setCurrentPage((prev) => Math.max(prev - 1, 1)), []);
  const handleNextPage = useCallback(() => setCurrentPage((prev) => Math.min(prev + 1, totalPages)), [totalPages]);

  const getTrainingNames = useCallback((participant) => {
    return participant?.participant_training?.map((pt) => pt?.training_sesi?.program_training?.alias || '-').join(', ') || '-';
  }, []);

  const pageNumbers = useMemo(() => Array.from({ length: totalPages }, (_, i) => i + 1), [totalPages]);

  // Fixed: Close handlers for modals
  const handleCloseAddParticipant = useCallback(() => {
    setShowAddParticipantPopup(false);
  }, []);

  const handleCloseAddParticipantTraining = useCallback(() => {
    setShowAddParticipantTrainingPopup(false);


  }, []);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    setSelectedParticipant(null);
  }, []);

  return (
    <div className="min-h-screen pb-10">
      {/* Fixed Header - Modified to white background and smaller content */}
      <div className="bg-white rounded-t w-full overflow-hidden relative border border-gray-200">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gray-50/30">
          <div className="absolute inset-0 bg-gradient-to-br from-white/80 to-gray-100/20"></div>
        </div>
        
        <div className="relative max-w-8xl mx-auto sm:px-2" style={{ height: 'auto', minHeight: '120px' }}>
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-1 h-full">
            {/* Main Title Section */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 m-2">
                <h2 className="text-xl font-bold text-gray-800 tracking-tight">
                  Manajemen Peserta - {trainingSessionDetail?.name} 
                </h2>
                  <span
                    className={`px-2 py-1 rounded-xl text-xs font-semibold
                      ${trainingSessionDetail?.status === "active" ? "bg-green-100 text-green-700" :
                        trainingSessionDetail?.status === "no active" ? "bg-yellow-100 text-yellow-700" :
                        trainingSessionDetail?.status === "finish" ? "bg-gray-100 text-gray-700" :
                        "bg-gray-100 text-gray-500"}`}
                  >
                    {trainingSessionDetail?.status}
                  </span>
              </div>
              
              {trainingSessionDetail ? (
                <div className="bg-gray-50/80 p-2 backdrop-blur-sm  border border-gray-200/50">
                  {/* Info Grid - 2 columns on mobile, 3 on desktop */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                    {/* Program Info */}
                    <div className="flex items-start space-x-2">
                      <div className="flex-shrink-0 p-1 bg-emerald-100 rounded">
                        <svg className="h-3 w-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Program
                        </p>
                        <p className="text-gray-800 font-semibold text-xs">
                          {trainingSessionDetail.program?.name}
                        </p>
                        <p className="text-gray-600 text-xs">
                          ({trainingSessionDetail.program?.alias})
                        </p>
                      </div>
                    </div>

                    {/* Start Date Info */}
                    <div className="flex items-start space-x-2">
                      <div className="flex-shrink-0 p-1 bg-orange-100 rounded">
                        <svg className="h-3 w-3 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Mulai
                        </p>
                        <p className="text-gray-800 font-semibold text-xs">
                          {formatDatetime(trainingSessionDetail.startDate)}
                        </p>
                      </div>
                    </div>

                    {/* Trainer Info */}
                    <div className="flex items-start space-x-2">
                      <div className="flex-shrink-0 p-1 bg-purple-100 rounded">
                        <svg className="h-3 w-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Trainer
                        </p>
                        <p className="text-gray-800 font-semibold text-xs">
                          {trainingSessionDetail.staff?.name}
                        </p>
                      </div>
                    </div>

                    {/* End Date Info */}
                    {trainingSessionDetail.endDate && (
                      <div className="flex items-start space-x-2">
                        <div className="flex-shrink-0 p-1 bg-red-100 rounded">
                          <svg className="h-3 w-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Berakhir
                          </p>
                          <p className="text-gray-800 font-semibold text-xs">
                            {formatDatetime(trainingSessionDetail.endDate)}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Location Info */}
                    <div className="flex items-start space-x-2">
                      <div className="flex-shrink-0 p-1 bg-cyan-100 rounded">
                        <svg className="h-3 w-3 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Lokasi
                        </p>
                        <p className="text-gray-800 font-semibold text-xs">
                          {trainingSessionDetail.location}
                        </p>
                      </div>
                    </div>

                    {/* Capacity Info */}
                    <div className="flex items-start space-x-2">
                      <div className="flex-shrink-0 p-1 bg-teal-100 rounded">
                        <svg className="h-3 w-3 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Kapasitas peserta
                        </p>
                        <p className="text-gray-800 font-semibold text-xs">
                          {trainingSessionDetail.maxPresent} kali
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50/80 backdrop-blur-sm rounded-lg p-3 border border-gray-200/50">
                  <div className="flex items-center space-x-2">
                    <div className="p-1 bg-blue-100 rounded">
                      <svg className="h-3 w-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-8xl mx-auto px-0 sm:px-0 ">
        {/* Card */}
        <div className="overflow-hidden bg-white py-2 rounded-bl shadow-md">
          <div className="p-2 bg-white border-b border-gray-100">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              {/* Search Input - di atas saat mobile */}
              <div className="relative w-full lg:w-1/2">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input 
                  type="text" 
                  placeholder="Cari peserta..." 
                  value={searchTerm}
                  onChange={handleSearch}
                  className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              {/* Tombol Aksi - di bawah saat mobile */}

              <div className="flex flex-raw gap-2 sm:flex-row justify-between items-stretch lg:items-center lg:justify-end">
                {permissions?.canCreate && (
                  <button  
                    onClick={handleAddParticipant}
                    disabled={trainingSessionDetail?.status === 'finish'}
                    className={`px-3 h-10 py-1 text-white rounded-md shadow-sm text-sm font-medium transition-colors flex items-center justify-center ${
                      trainingSessionDetail?.status === 'finish' 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-green-600 hover:bg-green-700'
                    }`}
                  > 
                    <Plus className="h-5 w-5 mr-1" /> Buat Baru
                  </button>
                )}
                {permissions?.canCreate && (
                  <button  
                    onClick={handleAddParticipantTraining}
                    disabled={trainingSessionDetail?.status === 'finish'}
                    className={`px-3 h-10 py-1 text-white rounded-md shadow-sm text-sm font-medium transition-colors flex items-center justify-center ${
                      trainingSessionDetail?.status === 'finish' 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-yellow-600 hover:bg-yellow-700'
                    }`}
                  > 
                    <Plus className="h-5 w-5 mr-1" /> Tambah
                  </button>
                )}
                {permissions?.canRead && (
                  <button 
                    className="px-5 h-10 py-1 bg-blue-600 text-white rounded-md shadow text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
                  >
                    <Download className="h-5 w-5 mr-1" />
                    Simpan
                  </button>
                )}
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
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">EMAIL</th>
                    <th scope="col" className="hidden px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider  md:table-cell">DOMISILI</th>
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
                                {participant?.name || 'Unnamed'}
                              </div>
                              <div className="text-sm text-gray-500">
                                <span className="inline-flex items-center">
                                  dibuat: {formatDatetime(participant.created_at)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full">
                            {participant?.agency || 'No Agency'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full">
                            {participant?.email || 'No email'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full">
                            {participant?.domicile || 'no dimisili'}
                          </span>
                        </td>
                        {/* <td className="hidden px-6 py-4 whitespace-nowrap text-sm text-gray-500 md:table-cell max-w-xs truncate">
                          // {getTrainingNames(participant) || 'No programs assigned'}
                        </td> */}
                        
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"> 
                          <div className="flex justify-center space-x-2">
                            {permissions?.canRead && (     
                              <button
                                onClick={() => handleViewDetail(participant.participant_id)}
                                className={`p-2 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors `}
                                title="Detail"
                              >
                                <Eye size={16} />
                              </button>
                            )}                             
                            {permissions?.canUpdate && ( 
                              <button
                                onClick={() => handleUpdateParticipant(participant.participant_id)}
                                disabled={trainingSessionDetail?.status === 'finish'}
                                className={`p-1 rounded ${
                                  trainingSessionDetail?.status === 'finish'
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200 hover:text-yellow-800'
                                }`}
                                title="Edit"
                              >
                                <Edit size={16} />
                              </button>
                            )}

                            {permissions?.canDelete && (     
                              <button
                                onClick={() => confirmDelete(participant)}
                                disabled={trainingSessionDetail?.status === 'finish'}
                                className={`p-1 rounded ${
                                  trainingSessionDetail?.status === 'finish'
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-red-100 text-red-600 hover:bg-red-200 hover:text-red-800'
                                }`}
                                title="Delete"
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
                          <p className="font-medium text-gray-700">No participants found</p>
                          <p className="text-sm text-gray-500 mt-1">Try adjusting your search or filters</p>
                          <button 
                            onClick={handleClearFilters}
                            className="mt-4 flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            <RefreshCw className="h-4 w-4 mr-1.5" />
                            Clear all filters
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
          <div className="md:hidden w-full top-0 px-2  space-y-4 min-h-[400px]">
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
                            {participant?.name || 'Unnamed'}
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
                              {participant?.agency || 'No Agency'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center text-gray-500">
                          <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                          Bergabung : 
                          <span className="px-2 py-0.5 inline-flex text-ms leading-5 font-semibold rounded-full text-gray-500">
                            {formatDatetime(participant.created_at)}
                          </span>
                        </div>
                        <div className="text-sm flex ml-0.5 flex-row text-gray-600">
                          <div className="font-medium flex items-center justify-center gap-1 text-gray-500 mb-0.5">
                            <BookOpen size={14} className="text-gray-500 mt-1"/>
                            Program: 
                          </div>
                        <div className="pl-1 text-sm text-gray-600 line-clamp-2">
                          {getTrainingNames(participant) || "No programs assigned"}
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
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                    )}
                    {permissions?.canCreate && ( 
                    <button
                      onClick={() => confirmDelete(participant)}
                      className="p-1 text-red-600 hover:text-red-800"
                      title="Delete"
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
                  <p className="font-medium text-gray-700">No participants found</p>
                  <p className="text-sm text-gray-500 mt-1">Try adjusting your search or filters</p>
                  <button 
                    onClick={handleClearFilters}
                    className="mt-4 flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <RefreshCw className="h-4 w-4 mr-1.5" />
                    Clear all filters
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
                    Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to <span className="font-medium">{Math.min(currentPage * pageSize, totalRecords)}</span> of{' '}
                    <span className="font-medium">{totalRecords}</span> participants
                  </p>
                </div>
                <div className="flex flex-1 justify-between sm:justify-end items-center">
                  <p className="sm:hidden text-sm text-gray-700 mr-4 ">
                    Page {currentPage} of {totalPages}
                  </p>
                  <nav className="relative z-0 inline-flex shadow-sm rounded-md" aria-label="Pagination">
                    <button
                      onClick={handlePrevPage}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-3 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <span className="sr-only">Previous</span>
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
                      <span className="sr-only">Next</span>
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
                <h3 className="text-lg font-medium text-gray-900">Confirm Delete</h3>
              </div>
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                    <Trash2 className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-700">
                      Are you sure you want to delete participant <span className="font-semibold">{participantToDelete?.name || 'Unknown'}</span>?
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      This action cannot be undone. All data associated with this participant will be permanently removed.
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
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Processing...
                    </div>
                  ) : 'Delete Participant'}
                </button>
                </div>
            </div>
          </div>
        )}

        {showAddParticipantPopup && (
          <CreateParticipantForm 
            onClose={() => setShowAddParticipantPopup(false)} 
            onSuccess={handleParticipantCreationSuccess} 
          />
        )}
        {showAddParticipantTrainingPopup && (
          <CreateParticipantTrainingForm 
            onClose={() => handleCloseAddpartForm(false)} 
            onSuccess={handleParticipantCreationSuccess} 
            trainingSesiId={trainingSesiId} 
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

export default ParticipantsTraining;

