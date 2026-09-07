import React, { useState, useEffect, useCallback, useRef } from 'react';
import { fetchTrainingSesiList, getTrainingSesiDetail, updateTrainingSesi, deleteTrainingSesi } from '../../service/training-sesi.service';
import { Search, Plus, Edit, Trash2, Eye, Calendar, Users, FileText, MoreVertical, Filter, X } from 'lucide-react';

import Pagination from '../../components/pagination.jsx';
import TrainingModal from './TrainingDetail.jsx';
import TrainingUpdate from './TrainingUpdate.jsx';
import { useNavigate } from 'react-router-dom';
import TrainingAdd from './TrainingAdd.jsx';
import { formatDateNum} from '../../utils/date.utils.js';
import Swal from 'sweetalert2';

const Training = () => {
  // State for data
  const [trainingSessions, setTrainingSessions] = useState([]);
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedTraining, setSelectedTraining] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState(null);
  // State for update modal
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [selectedTrainingSesiId, setSelectedTrainingSesiId] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [dropdownDirection, setDropdownDirection] = useState('down'); // 'down' atau 'up'
  const [selectedSession, setSelectedSession] = useState(null);
  const dropdownRef = useRef(null);

  // Pagination state
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  
  // Date filter states
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [showDateFilter, setShowDateFilter] = useState(false);
  
  const [pagination, setPagination] = useState({
    currentBatch: 1,
    pageSize: 5,
    totalRecords: 0,
    maxPage: 1
  });

  // Ref untuk mencegah scroll otomatis
  const isLoadingRef = useRef(false);
  const modalOpenRef = useRef(false);
  
  const navigate = useNavigate();
  
  // Memoized load data function dengan dependency yang lebih stabil
  const loadData = useCallback(async (forceReload = false) => {
    // Jangan reload data jika modal sedang terbuka dan bukan force reload
    if (modalOpenRef.current && !forceReload) {
      return;
    }

    // Cegah multiple loading
    if (isLoadingRef.current) {
      return;
    }

    try {
      isLoadingRef.current = true;
      setLoading(true);
      setError(null);
      
      const response = await fetchTrainingSesiList({
        search: searchQuery,
        batch: pagination.currentBatch,
        size: pagination.pageSize,
        start_date: filterStartDate,
        end_date: filterEndDate
      });
      
      if (response?.response) {
        setTrainingSessions(response.response.records || []);
        setPermissions(response.response.permissions || {});
        
        // Update pagination info
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
  }, [pagination.currentBatch, searchQuery, pagination.pageSize, filterStartDate, filterEndDate]);
  
  // Load data based on pagination parameters - hanya saat benar-benar diperlukan
  useEffect(() => {
    // Jangan load data jika modal sedang terbuka
    if (!modalOpenRef.current) {
      loadData();
    }

    const handleClickOutside = () => {
      closeDropdown();
    };
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [pagination.currentBatch, searchQuery, filterStartDate, filterEndDate]); // Hapus pagination.pageSize dari dependency

  
  // Update modal ref ketika modal state berubah
  useEffect(() => {
    modalOpenRef.current = showModal || isModalOpen || showUpdateForm;
  }, [showModal, isModalOpen, showUpdateForm]);

  const handleViewDetail = async (session) => {
    if (!session?.training_sesi_id) {
      console.error('Invalid session data');
      return;
    }

    try {
      setLoadingDetail(true);
      setIsEditMode(false);
      
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

  // Add this function to handle dropdown toggle
  const toggleDropdown = (sessionId, event, session) => {
    event.stopPropagation();

    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    const dropdownWidth = 192; // Lebar dropdown min-w-48

    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    const direction = spaceBelow < 200 && spaceAbove > 200 ? 'up' : 'down';

    setDropdownDirection(direction);
    setOpenDropdown(openDropdown === sessionId ? null : sessionId);
    setSelectedSession(sessionId === openDropdown ? null : session);

    setDropdownPosition({
      top: direction === 'down' ? rect.bottom + window.scrollY : rect.top + window.scrollY,
      left: rect.right + window.scrollX - dropdownWidth,
    });
  };

  // Add this function to close dropdown when clicking outside
  const closeDropdown = () => {
    setOpenDropdown(null);
    setSelectedSession(null);
    setDropdownPosition(null);
  };

  const handleInputParticipant = (session) => {
    if (!session?.training_sesi_id) {
      console.error('Invalid session data');
      return;
    }

    navigate(`/training/participant?training_sesi_id=${session.training_sesi_id}`);
  };

  const handleScheduleReport = (session) => {
    if (!session?.training_sesi_id) {
      console.error('Invalid session data');
      return;
    }

    navigate(`/training/schedule-report?training_sesi_id=${session.training_sesi_id}`);
  };

  const handleSchedule = (session) => {
    if (!session?.training_sesi_id) {
      console.error('Invalid session data');
      return;
    }

    navigate(`/training/schedule?training_sesi_id=${session.training_sesi_id}`);
  };

  const handleDeleteTrainingSesiClick = async (session) => {
    if (!session?.training_sesi_id) {
      console.error('Invalid session data');
      return;
    }

    try {
      const confirmResult = await Swal.fire({
        title: 'Apakah Anda yakin?',
        text: 'Tindakan ini akan menghapus sesi training secara permanen.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Ya, hapus',
        cancelButtonText: 'Batal'
      });

      if (confirmResult.isConfirmed) {
        setLoading(true);
        await deleteTrainingSesi(session.training_sesi_id);

        await Swal.fire({
          title: 'Berhasil!',
          text: 'Sesi training berhasil dihapus.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });

        // Reload data after successful deletion
        await loadData(true); // Force reload
      }
    } catch (error) {
      console.error('Delete error:', error);
      await Swal.fire({
        title: 'Error',
        text: 'Gagal menghapus sesi training: ' + (error.message || 'Unknown error'),
        icon: 'error',
        confirmButtonText: 'OK'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Handle adding a new training session
  const handleAdd = () => {
    setIsModalOpen(true);
  };

  // Handle successful creation
  const handleAddSuccess = async () => {
    try {
      await Swal.fire({
        title: 'Berhasil!',
        text: 'Training session berhasil ditambahkan!',
        icon: 'success',
        confirmButtonText: 'OK'
      });
      
      setIsModalOpen(false);
      await loadData(true); // Force reload
    } catch (error) {
      console.error('Error after add success:', error);
    }
  };

  // Handle modal close
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // Handle update button click - show TrainingUpdate modal
  const handleViewUpdate = async (session) => {
    if (!session?.training_sesi_id) {
      console.error('Invalid session data');
      return;
    }

    setSelectedTrainingSesiId(session.training_sesi_id);
    setShowUpdateForm(true);
  };

  // Handle successful update
  const handleUpdateSuccess = async () => {
    try {
      await Swal.fire({
        title: 'Berhasil!',
        text: 'Training session berhasil diperbarui!',
        icon: 'success',
        confirmButtonText: 'OK'
      });
      
      setShowUpdateForm(false);
      setSelectedTrainingSesiId(null);
      await loadData(true); // Force reload
    } catch (error) {
      console.error('Error after update success:', error);
    }
  };

  // Handle update modal close
  const handleCloseUpdateModal = () => {
    setShowUpdateForm(false);
    setSelectedTrainingSesiId(null);
  };

  const handleUpdateTraining = async (id, updatedData) => {
    if (!id || !updatedData) {
      console.error('Invalid update parameters');
      return;
    }

    try {
      const result = await Swal.fire({
        title: 'Apakah Anda yakin?',
        text: "Data sesi training akan diperbarui.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Ya, perbarui!',
        cancelButtonText: 'Batal',
      });

      if (result.isConfirmed) {
        setLoading(true);
        await updateTrainingSesi(id, updatedData);

        setShowModal(false);
        setSelectedTraining(null);
        setIsEditMode(false);
        
        await loadData(true); // Force reload

        await Swal.fire({
          icon: 'success',
          title: 'Berhasil',
          text: 'Sesi training berhasil diperbarui',
          confirmButtonText: 'OK'
        });
      }
    } catch (error) {
      console.error('Error updating training session:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Gagal',
        text: 'Gagal memperbarui sesi training: ' + (error.message || 'Unknown error'),
        confirmButtonText: 'OK'
      });
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedTraining(null);
    setIsEditMode(false);
  };

  // Handle page change
  const handlePageChange = (page) => {
    if (page !== pagination.currentBatch && page > 0 && page <= pagination.maxPage) {
      setPagination(prev => ({
        ...prev,
        currentBatch: page
      }));
      
      // Scroll to top when changing page - hanya jika modal tidak terbuka
      if (!modalOpenRef.current) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };
  
  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    // Reset to page 1 when searching
    setPagination(prev => ({
      ...prev,
      currentBatch: 1
    }));
    setShowSearch(false);
  };

  // Handle date filter
  const handleDateFilter = (e) => {
    e.preventDefault();
    // Reset to page 1 when filtering
    setPagination(prev => ({
      ...prev,
      currentBatch: 1
    }));
    setShowDateFilter(false);
  };

  // Clear date filter
  const clearDateFilter = () => {
    setFilterStartDate('');
    setFilterEndDate('');
    setPagination(prev => ({
      ...prev,
      currentBatch: 1
    }));
  };

  // Toggle search box visibility (for mobile)
  const toggleSearch = () => {
    setShowSearch(!showSearch);
    if (showSearch) {
      setSearchQuery(''); // Clear search when closing
    }
  };

  // Toggle date filter visibility (for mobile)
  const toggleDateFilter = () => {
    setShowDateFilter(!showDateFilter);
  };
  
  // Format status text
  const getStatusText = (status) => {
    switch (status) {
      case 'active':
        return 'Aktif';
      case 'finish':
        return 'Selesai';
      default:
        return 'Tidak Aktif';
    }
  };

  // Get status color classes
  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'finish':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-red-100 text-red-800';
    }
  };

  // Check if any filters are active
  const hasActiveFilters = searchQuery || filterStartDate || filterEndDate;
  return (
    <div className="">
      {/* Header section - more mobile friendly */}
      <div className="mb-1">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">Daftar Sesi Training</h1>
      </div>
      
      {/* Mobile search, filter and add button layout */}
      <div className="flex flex-col space-y-3 md:hidden mb-1">
        {showSearch ? (
          <div className="space-y-2">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  // Auto search on input change
                  if (e.target.value.trim() === '') {
                    setPagination(prev => ({ ...prev, currentBatch: 1 }));
                  }
                }}
                placeholder="Cari..."
                className="w-full border rounded-lg pl-3 pr-10 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setPagination(prev => ({ ...prev, currentBatch: 1 }));
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            {/* Tombol untuk menutup search */}
            <button
              onClick={() => setShowSearch(false)}
              className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors text-sm"
            >
              Tutup Pencarian
            </button>
          </div>
        ) : showDateFilter ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Tanggal Mulai</label>
                <div className="relative">
                  <input
                    type="date"
                    value={filterStartDate}
                    onChange={(e) => {
                      setFilterStartDate(e.target.value);
                      // Auto filter on change
                      setPagination(prev => ({ ...prev, currentBatch: 1 }));
                    }}
                    className="w-full border rounded-md px-2 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {filterStartDate && (
                    <button
                      onClick={() => {
                        setFilterStartDate('');
                        setPagination(prev => ({ ...prev, currentBatch: 1 }));
                      }}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Tanggal Selesai</label>
                <div className="relative">
                  <input
                    type="date"
                    value={filterEndDate}
                    onChange={(e) => {
                      setFilterEndDate(e.target.value);
                      // Auto filter on change
                      setPagination(prev => ({ ...prev, currentBatch: 1 }));
                    }}
                    className="w-full border rounded-md px-2 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {filterEndDate && (
                    <button
                      onClick={() => {
                        setFilterEndDate('');
                        setPagination(prev => ({ ...prev, currentBatch: 1 }));
                      }}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
            {/* Tombol untuk menutup date filter */}
            <button
              onClick={() => setShowDateFilter(false)}
              className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors text-sm"
            >
              Tutup Filter Tanggal
            </button>
          </div>
        ) : (
          <div className="flex flex-col space-y-2">
            <div className="flex gap-2">
              <button
                onClick={toggleSearch}
                className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Search size={18} />
                <span className="text-sm font-medium">Cari Training</span>
              </button>
              <button
                onClick={toggleDateFilter}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  filterStartDate || filterEndDate 
                    ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Filter size={18} />
                <span className="text-sm font-medium">Filter Tanggal</span>
              </button>
            </div>
            {permissions?.canCreate && (
              <button
                onClick={handleAdd}
                className="flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus size={18} />
                <span className="text-sm font-medium">Tambah Training Baru</span>
              </button>
            )}
          </div>
        )}

        {/* Active filters indicator for mobile */}
        {hasActiveFilters && !showSearch && !showDateFilter && (
          <div className="flex flex-wrap gap-2">
            {searchQuery && (
              <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                Pencarian: "{searchQuery}"
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setPagination(prev => ({ ...prev, currentBatch: 1 }));
                  }}
                  className="hover:bg-blue-200 rounded-full p-0.5"
                >
                  <X size={12} />
                </button>
              </span>
            )}
            {filterStartDate && (
              <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                Dari: {filterStartDate}
                <button
                  onClick={() => {
                    setFilterStartDate('');
                    setPagination(prev => ({ ...prev, currentBatch: 1 }));
                  }}
                  className="hover:bg-green-200 rounded-full p-0.5"
                >
                  <X size={12} />
                </button>
              </span>
            )}
            {filterEndDate && (
              <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
                Sampai: {filterEndDate}
                <button
                  onClick={() => {
                    setFilterEndDate('');
                    setPagination(prev => ({ ...prev, currentBatch: 1 }));
                  }}
                  className="hover:bg-orange-200 rounded-full p-0.5"
                >
                  <X size={12} />
                </button>
              </span>
            )}
          </div>
        )}
      </div>
      
      {/* Desktop search, filter and add button layout */}
      <div className="hidden md:flex md:flex-row gap-4 md:justify-between md:items-start mb-1">
        <div className={`flex flex-col gap-4 ${permissions?.canCreate ? 'flex-1' : 'w-full'}`}>
          {/* Search and Date Filter Row */}
          <div className="flex gap-4 items-end">
            {/* Search Input */}
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    // Auto search on input change
                    if (e.target.value.trim() === '') {
                      setPagination(prev => ({ ...prev, currentBatch: 1 }));
                    }
                  }}
                  placeholder="Cari..."
                  className="w-full border rounded-lg pl-3 pr-10 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  {searchQuery ? (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setPagination(prev => ({ ...prev, currentBatch: 1 }));
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X size={16} />
                    </button>
                  ) : (
                    <Search size={16} className="text-gray-400" />
                  )}
                </div>
              </div>
            </div>

            {/* Date Filter */}
            <div className="flex gap-2 items-end">
              <div className="min-w-[140px]">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Tanggal Mulai
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={filterStartDate}
                    onChange={(e) => {
                      setFilterStartDate(e.target.value);
                      // Auto filter on change
                      setPagination(prev => ({ ...prev, currentBatch: 1 }));
                    }}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Pilih tanggal mulai"
                  />
                  {filterStartDate && (
                    <button
                      onClick={() => {
                        setFilterStartDate('');
                        setPagination(prev => ({ ...prev, currentBatch: 1 }));
                      }}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                      title="Hapus filter tanggal mulai"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
              
              <div className="min-w-[140px]">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Tanggal Selesai
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={filterEndDate}
                    onChange={(e) => {
                      setFilterEndDate(e.target.value);
                      // Auto filter on change
                      setPagination(prev => ({ ...prev, currentBatch: 1 }));
                    }}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Pilih tanggal selesai"
                  />
                  {filterEndDate && (
                    <button
                      onClick={() => {
                        setFilterEndDate('');
                        setPagination(prev => ({ ...prev, currentBatch: 1 }));
                      }}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                      title="Hapus filter tanggal selesai"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
              
              {/* Clear All Button - Optional */}
              {(filterStartDate || filterEndDate) && (
                <div className="flex-shrink-0">
                  <button
                    onClick={() => {
                      setFilterStartDate('');
                      setFilterEndDate('');
                      setPagination(prev => ({ ...prev, currentBatch: 1 }));
                    }}
                    className="px-3 py-2 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors whitespace-nowrap"
                    title="Hapus semua filter"
                  >
                    Reset Filter
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Active filters indicator for desktop */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2">
              {searchQuery && (
                <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full">
                  Pencarian: "{searchQuery}"
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setPagination(prev => ({ ...prev, currentBatch: 1 }));
                    }}
                    className="hover:bg-blue-200 rounded-full p-0.5"
                  >
                    <X size={12} />
                  </button>
                </span>
              )}
              {filterStartDate && (
                <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full">
                  Dari: {filterStartDate}
                  <button
                    onClick={() => {
                      setFilterStartDate('');
                      setPagination(prev => ({ ...prev, currentBatch: 1 }));
                    }}
                    className="hover:bg-green-200 rounded-full p-0.5"
                  >
                    <X size={12} />
                  </button>
                </span>
              )}
              {filterEndDate && (
                <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-800 text-xs px-3 py-1 rounded-full">
                  Sampai: {filterEndDate}
                  <button
                    onClick={() => {
                      setFilterEndDate('');
                      setPagination(prev => ({ ...prev, currentBatch: 1 }));
                    }}
                    className="hover:bg-orange-200 rounded-full p-0.5"
                  >
                    <X size={12} />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {permissions?.canCreate && (
          <button
            onClick={handleAdd}
            className="flex items-center mt-5 justify-center gap-2 bg-green-600 text-white px-4 py-1.5 rounded-lg hover:bg-green-700 transition-colors font-medium whitespace-nowrap"
          >
            <Plus size={18} />
            <span>Tambah</span>
          </button>
        )}
      </div>
      
      {/* Error message */}
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-1 border border-red-200">
          <p className="font-medium">{error}</p>
          <button 
            onClick={() => loadData(true)}
            className="mt-2 text-sm underline hover:no-underline font-medium"
          >
            Coba lagi
          </button>
        </div>
      )}
      
      {/* Initial loading */}
      {initialLoading ? (
        <div className="flex justify-center my-16">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : trainingSessions.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-lg">
          <p className="text-gray-500 text-lg">
            {hasActiveFilters ? 'Tidak ada data sesi training yang sesuai dengan filter.' : 'Tidak ada data sesi training yang ditemukan.'}
          </p>
          {hasActiveFilters && (
            <button 
              onClick={() => {
                setSearchQuery('');
                setFilterStartDate('');
                setFilterEndDate('');
                setPagination(prev => ({ ...prev, currentBatch: 1 }));
              }}
              className="mt-3 text-blue-500 hover:text-blue-700 underline font-medium"
            >
              Hapus semua filter
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Mobile view - card layout */}
          <div className="md:hidden space-y-4">
            {trainingSessions.map((session, index) => {
              const recordNumber = (pagination.currentBatch - 1) * pagination.pageSize + index + 1;
              
              return (
                <div 
                  key={session.training_sesi_id || index} 
                  className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
                >
                  <div className="w-full border-b border-gray-100">
                    <div className="flex items-center justify-between px-4 py-2">
                      <h3 className="font-semibold text-md ">
                        {session.name || 'Nama tidak tersedia'}
                      </h3>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(session.status_active)}`}
                      >
                        {getStatusText(session.status_active)}
                      </span>
                    </div>
                  </div>

                  
                  <div className="p-4 space-y-3 text-sm bg-gray-50">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Program:</span>
                      <span className="font-medium text-gray-800">{session.program_training.name || 0} </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Tanggal Mulai:</span>
                      <span className="font-medium text-gray-800">{formatDateNum(session.start_date)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Tanggal Selesai:</span>
                      <span className="font-medium text-gray-800">{formatDateNum(session.end_date)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Lokasi/Kapasitas:</span>

                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Trainer:</span>
                      <span className="font-medium text-gray-800">{session.staff.name || 0} </span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-1 justify-between p-2 border-t bg-gray-50">
                    <div className='flex flex-raw'>
                    {permissions?.canRead && (
                      <button
                      onClick={() => handleInputParticipant(session)}
                        className="p-2 text-sky-600 hover:text-sky-800 hover:bg-sky-100 rounded transition-colors
                                  items-center justify-center flex flex-row "
                        title="Participant"
                      >
                        <Users size={16} />
                        {session.total_participant || 0} 
                      </button>
                    )}
                    {permissions?.canRead && (
                      <button
                      onClick={() => handleScheduleReport(session)}
                      className="p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded transition-colors
                                  items-center justify-center flex flex-row "
                        title="Report"
                      >

                        <FileText size={16} />
                        {session.total_report_schedule || 0} 
                      </button>
                    )}

                    {permissions?.canRead && (
                      <button
                      onClick={() => handleSchedule(session)}
                      className="p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-100 rounded transition-colors
                                items-center justify-center flex flex-row "
                      title="Jadwal Training"
                      >
                        <Calendar size={16} />
                        {session.total_meeting || 0} 
                      </button>
                    )}
                    </div>
                    <div className='flex'>
                    {permissions?.canRead && (
                      <button
                      onClick={() => handleViewDetail(session)}
                      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors
                                items-center justify-center flex flex-row "
                        title="Detail"
                        disabled={loadingDetail}
                      >
                        <Eye size={16} />
                      </button>
                    )}

                    {permissions?.canUpdate && (
                      <button
                        onClick={() => handleViewUpdate(session)}
                        className="p-2 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50 rounded transition-colors
                                  items-center justify-center flex flex-row "
                        title="Edit"
                        disabled={loadingDetail}
                      >
                        <Edit size={16} />
                      </button>
                    )}


                    {permissions?.canDelete && (
                      <button
                        onClick={() => handleDeleteTrainingSesiClick(session)}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors
                                  items-center justify-center flex flex-row "
                        title="Delete"
                        disabled={loading}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Desktop view - table layout */}
         <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-200 shadow-sm relative">
            <table className="min-w-full bg-white">
               <thead className="bg-gray-100">
                 <tr>
                   <th className="py-4 px-4 text-left font-semibold text-sm text-gray-700 border-b">No</th>
                   <th className="py-4 px-4 text-left font-semibold text-sm text-gray-700 border-b">Nama Training</th>
                   <th className="py-4 px-4 text-left font-semibold text-sm text-gray-700 border-b">Program</th>
                   <th className="py-4 px-4 text-left font-semibold text-sm text-gray-700 border-b">Lokasi</th>
                   <th className="py-4 px-4 text-center font-semibold text-sm text-gray-700 border-b">Trainer</th>
                  <th className="py-4 px-4 text-center font-semibold text-sm text-gray-700 border-b">Status</th>
                   <th className="py-4 px-4 text-center font-semibold text-sm text-gray-700 border-b">Aksi</th>
                 </tr>
               </thead>
               <tbody>
                 {trainingSessions.map((session, index) => {
                  const recordNumber = (pagination.currentBatch - 1) * pagination.pageSize + index + 1;
                  
                  return (
                    <tr 
                      key={session.training_sesi_id || index} 
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-4 px-4 border-b text-lg text-gray-700">{recordNumber}</td>
                      <td className="py-4 px-4 border-b">
                        <div className="font-medium text-md text-gray-800">
                          {session.name || 'Nama tidak tersedia'}
                        </div>
                        <span className="text-sm text-gray-800">
                          Laporan: {' '}  {session.total_report_schedule || 0} {' | '} 
                          Pertemuan : {' '}  {session.total_meeting || 0}  {' | '}
                          Peserta : {' '}  {session.total_participant || 0}  
                        </span>
                      </td>
                      <td className="py-4 px-4 border-b text-lg">
                        <div className="space-y-1 font-medium text-sm ">
                          {session.program_training 
                            ? `${session.program_training.name} (${session.program_training.alias})` 
                            : 'Program tidak tersedia'
                          }
                        </div>
                           <span className="font-smal text-sm text-gray-800">
                         periode: {' '} {formatDateNum(session.start_date)} - {formatDateNum(session.end_date)}
                        </span>                
                      </td>
                  
                      <td className="py-4 px-4 border-b ">
                        <div className='text-md'>
                            {session.location} 
                        </div>
                      </td>
                      <td className="py-4 px-4 border-b text-center">
                        <span className=" rounded-lg text-md font-medium">
                          {session.staff.name}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center border-b">
                        <span className={`px-3 py-1 rounded-full text-md font-medium ${getStatusColor(session.status_active)}`}>
                          {getStatusText(session.status_active)}
                        </span>
                      </td>
                     <td className="py-4 px-4 border-b text-center relative">
                      <button
                        onClick={(e) => toggleDropdown(session.training_sesi_id, e, session)}
                        className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition"
                        title="Aksi"
                      >
                        <MoreVertical size={16} />
                      </button>
                    </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {openDropdown && dropdownPosition && selectedSession && (
              <div
                className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-2 min-w-48"
                style={{
                  top: dropdownDirection === 'down' ? dropdownPosition.top - 40 : undefined,
                  bottom: dropdownDirection === 'up' ? window.innerHeight - dropdownPosition.top - 20 : undefined,
                  left: dropdownPosition.left - 25,
                }}
              >
                {permissions?.canRead && (
                  <button
                    onClick={() => {
                      handleInputParticipant(selectedSession);
                      closeDropdown();
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3"
                  >
                    <Users size={16} className="text-blue-600" />
                    Kelola Peserta
                  </button>
                )}

                {permissions?.canRead && (
                  <button
                    onClick={() => {
                      handleSchedule(selectedSession);
                      closeDropdown();
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3"
                  >
                    <Calendar size={16} className="text-purple-600" />
                    Jadwal Pertemuan
                  </button>
                )}

                {permissions?.canRead && (
                  <button
                    onClick={() => {
                      handleScheduleReport(selectedSession);
                      closeDropdown();
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3"
                  >
                    <FileText size={16} className="text-indigo-600" />
                    Jadwal Laporan
                  </button>
                )}

                {permissions?.canRead && (
                  <button
                    onClick={() => {
                      handleViewDetail(selectedSession);
                      closeDropdown();
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3"
                    disabled={loadingDetail}
                  >
                    <Eye size={16} className="text-sky-600" />
                    Lihat Detail
                  </button>
                )}

                {permissions?.canUpdate && (
                  <button
                    onClick={() => {
                      handleViewUpdate(selectedSession);
                      closeDropdown();
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3"
                    disabled={loadingDetail}
                  >
                    <Edit size={16} className="text-yellow-600" />
                    Edit Training
                  </button>
                )}

                {permissions?.canDelete && (
                  <>
                    <hr className="my-1 border-gray-200" />
                    <button
                      onClick={() => {
                        handleDeleteTrainingSesiClick(selectedSession);
                        closeDropdown();
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"
                      disabled={loading}
                    >
                      <Trash2 size={16} className="text-red-600" />
                      Hapus Training
                    </button>
                  </>
                )}
              </div>
            )}

          </div>
      

        
            {/* Pagination */}
            {pagination.maxPage > 1 && (
              <div className="mt-1.5">
                <Pagination 
                  currentBatch={pagination.currentBatch}
                  maxPage={pagination.maxPage}
                  totalRecords={pagination.totalRecords}
                  pageSize={pagination.pageSize}
                  onPageChange={handlePageChange}
                  loading={loading}
                />
              </div>
            )}
          </>
        )}
      
      {/* Training Detail Modal */}
      {showModal && (
        <TrainingModal
          isOpen={showModal}
          onClose={closeModal}
          trainingDetail={selectedTraining}
          isEditMode={isEditMode}
          onUpdate={handleUpdateTraining}
          loading={loadingDetail}
        />
      )}

      {/* Modal for adding new training session */}
      {isModalOpen && (
        <TrainingAdd 
          isOpen={isModalOpen} 
          onClose={handleCloseModal} 
          onSuccess={handleAddSuccess} 
        />
      )}

      {/* Modal for updating training session */}
      {showUpdateForm && selectedTrainingSesiId && (
        <TrainingUpdate 
          trainingSesiId={selectedTrainingSesiId}
          isOpen={showUpdateForm}
          onClose={handleCloseUpdateModal}
          onSuccess={handleUpdateSuccess}
        />
      )}

      {/* Loading overlay */}
      {(loading && !initialLoading) && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg flex items-center space-x-4">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="font-medium">Memuat data...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Training;