import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { X, Save, Calendar, Loader, Clock } from 'lucide-react';
import { fetchProgramTraining, fetchStaffId } from '../../service/master-data.service.js';
import {formatDateNum} from '../../utils/date.utils.js';
import debounce from 'lodash.debounce';

const TrainingDetail = ({ isOpen, onClose, trainingDetail, isEditMode, onUpdate }) => {
  const [isFetchingData, setIsFetchingData] = useState(false);
  const [error, setError] = useState(null);
  const [dataReady, setDataReady] = useState(false);
  
  // Refs untuk scroll management
  const modalRef = useRef(null);
  const scrollPositionRef = useRef(0);
  
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    status: '',
    meeting_mode: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    location: '',
    program_training_id: '',
    staff_id: '',
  });

  // Program training options from API
  const [programTrainingOptions, setProgramTrainingOptions] = useState([]);
  // Trainers from API with role 4
  const [trainers, setTrainers] = useState([]);
  
  // Preserve scroll position dalam modal
  const preserveModalScrollPosition = useCallback(() => {
    if (modalRef.current) {
      scrollPositionRef.current = modalRef.current.scrollTop;
    }
  }, []);

  // Restore scroll position dalam modal
  const restoreModalScrollPosition = useCallback(() => {
    if (modalRef.current && scrollPositionRef.current > 0) {
      requestAnimationFrame(() => {
        modalRef.current.scrollTop = scrollPositionRef.current;
      });
    }
  }, []);
  
  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setDataReady(false);
      setError(null);
      setProgramTrainingOptions([]);
      setTrainers([]);
      scrollPositionRef.current = 0;
      setFormData({
        id: '',
        name: '',
        status: '',
        meeting_mode: '',
        startDate: '',
        startTime: '',
        endDate: '',
        endTime: '',
        location: '',
        program_training_id: '',
        staff_id: '',
      });
    }
  }, [isOpen]);

  // Parse datetime for input fields (separate date and time) - moved up before other functions
  const parseDateTimeForInput = useCallback((dateString) => {
    if (!dateString) return { date: '', time: '' };
    
    const date = new Date(dateString);
    
    // Format date (YYYY-MM-DD)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    
    // Format time (HH:MM)
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const formattedTime = `${hours}:${minutes}`;
    
    return { date: formattedDate, time: formattedTime };
  }, []);

  // Initialize form data with proper staff_id extraction - wrapped in useCallback
  const initializeFormData = useCallback((training, trainersData) => {
    if (!training) return;
    
    // Extract staff_id dengan prioritas yang benar
    let staffId = '';
    
    // Prioritas 1: Dari staff_id langsung (sesuai dengan struktur API response)
    if (training.staff_id) {
      staffId = training.staff_id;
    }
    // Prioritas 2: Dari program_training.staff_id
    else if (training.program_training?.staff_id) {
      staffId = training.program_training.staff_id;
    }
    // Prioritas 3: Dari nested object staff
    else if (training.staff?.staff_id) {
      staffId = training.staff.staff_id;
    } 
    // Prioritas 4: Dari trainer object
    else if (training.trainer?.staff_id) {
      staffId = training.trainer.staff_id;
    } 
    // Prioritas 5: Dari trainer_id
    else if (training.trainer_id) {
      staffId = training.trainer_id;
    }
    
    // Convert to string untuk konsistensi
    staffId = staffId ? String(staffId) : '';
    
    // Parse start date and time
    const { date: startDate, time: startTime } = parseDateTimeForInput(training.start_date || training.startDate);
    // Parse end date and time
    const { date: endDate, time: endTime } = parseDateTimeForInput(training.end_date || training.endDate);

    const initialFormData = {
      id: training.training_sesi_id || training.id || '',
      name: training.name || '',
      status: training.status_active || training.status || '',
      meeting_mode: training.meeting_mode || '',
      startDate: startDate,
      startTime: startTime,
      endDate: endDate,
      endTime: endTime,
      location: training.location || '',
      program_training_id: training.program_training?.program_training_id || 
                          training.program_training_id || 
                          training.program?.program_training_id || 
                          training.program?.id || '',
      staff_id: staffId, // Staff ID yang sudah diverifikasi
    };
    
    setFormData(initialFormData);
  }, [parseDateTimeForInput]);

  // Fetch program training options and trainers when modal opens
  useEffect(() => {
    const fetchData = async () => {
      if (!isOpen || !trainingDetail) return;
      
      setIsFetchingData(true);
      setDataReady(false);
      setError(null);
      
      try {
        const [programsRes, trainersRes] = await Promise.all([
          fetchProgramTraining(),
          fetchStaffId(null, 4)
        ]);
        
        const programs = programsRes.response || [];
        const trainersData = Array.isArray(trainersRes.response) ? trainersRes.response : [];
        
        setProgramTrainingOptions(programs);
        setTrainers(trainersData);
        
        // Initialize form data after data is loaded
        initializeFormData(trainingDetail, trainersData);
        
        setDataReady(true);
        
      } catch (error) {
        setError('Gagal memuat data');
      } finally {
        setIsFetchingData(false);
      }
    };

    fetchData();
  }, [isOpen, trainingDetail, initializeFormData]);

  // Format date for input field (YYYY-MM-DD) - kept for backward compatibility
  const formatDateForInput = useCallback((dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }, []);

  const debouncedUpdate = useCallback(debounce((name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }, 100), []);

  // Optimized handle form input changes dengan scroll preservation
  const handleChange = useCallback((e) => {
    const { name, type, value, checked } = e.target;
    const processedValue = type === 'checkbox'
      ? checked
      : type === 'number'
        ? Number(value)
        : value;

    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));
  }, []);


  // Combine date and time for submission
  const combineDateAndTime = useCallback((date, time) => {
    if (!date) return '';
    if (!time) return `${date}T00:00:00`;
    return `${date}T${time}:00`;
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    preserveModalScrollPosition();
    
    if (!formData.name || !formData.program_training_id || !formData.staff_id) {
      setError('Mohon lengkapi semua field wajib');
      restoreModalScrollPosition();
      return;
    }
    
    try {
      const submitData = {
        ...formData,
        staff_id: formData.staff_id,
        // Combine date and time for API submission
        start_date: combineDateAndTime(formData.startDate, formData.startTime),
        end_date: combineDateAndTime(formData.endDate, formData.endTime),
      };
      
      // Remove separate date/time fields from submission
      delete submitData.startDate;
      delete submitData.startTime;
      delete submitData.endDate;
      delete submitData.endTime;
      
      onUpdate(formData.id, submitData);
    } catch (error) {
      setError('Gagal memperbarui data training');
      restoreModalScrollPosition();
    }
  }, [formData, combineDateAndTime, onUpdate, preserveModalScrollPosition, restoreModalScrollPosition]);

  // Helper function untuk mendapatkan staff_id saat display mode - memoized
  const displayStaffId = useMemo(() => {
    // Prioritas berdasarkan struktur API response
    const staffId = trainingDetail?.staff_id || 
                   trainingDetail?.program_training?.staff_id ||
                   trainingDetail?.staff?.staff_id || 
                   trainingDetail?.trainer?.staff_id || 
                   trainingDetail?.trainer_id;
    return staffId ? String(staffId) : '';
  }, [trainingDetail]);

  // Get trainer name by ID - memoized to prevent re-computation
  const getTrainerName = useCallback((trainerId) => {
    if (!trainerId) return '-';
    
    // Cari di data trainers yang sudah difetch dari API
    const trainer = trainers.find(t => String(t.staff_id) === String(trainerId));
    if (trainer) {
      return `${trainer.name}`;
    }
    
    // Fallback ke data dari trainingDetail.staff (struktur API response)
    if (trainingDetail?.staff?.name && String(trainingDetail.staff.staff_id) === String(trainerId)) {
      return `${trainingDetail.staff.name} (ID: ${trainerId})`;
    }
    
    // Fallback ke data dari trainingDetail.program_training.staff
    if (trainingDetail?.program_training?.staff?.name && 
        String(trainingDetail.program_training.staff.staff_id) === String(trainerId)) {
      return `${trainingDetail.program_training.staff.name} (ID: ${trainerId})`;
    }
    
    // Fallback ke trainer object jika ada
    if (trainingDetail?.trainer?.name && 
        String(trainingDetail.trainer.staff_id) === String(trainerId)) {
      return `${trainingDetail.trainer.name} (ID: ${trainerId})`;
    }
    
    return `ID: ${trainerId}`;
  }, [trainers, trainingDetail]);

  // Get program name for display - memoized
  const programName = useMemo(() => {
    if (trainingDetail?.program_training) {
      return `${trainingDetail.program_training.name} (${trainingDetail.program_training.alias})`;
    } 
    else if (trainingDetail?.program) {
      return `${trainingDetail.program.name} (${trainingDetail.program.alias})`;
    }
    return '-';
  }, [trainingDetail]);

  // Get max present value for display with multiple fallbacks - memoized

  if (!isOpen) return null;

  // Status badge component for cleaner code - memoized
  const StatusBadge = React.memo(({ status }) => {
    let badgeClass = '';
    let badgeText = '';

    switch (status) {
      case 'active':
        badgeClass = 'bg-emerald-100 text-emerald-800';
        badgeText = 'Aktif';
        break;
      case 'no active':
        badgeClass = 'bg-gray-100 text-gray-800';
        badgeText = 'Tidak Aktif';
        break;
      case 'finish':
        badgeClass = 'bg-blue-100 text-blue-800';
        badgeText = 'Selesai';
        break;
      default:
        badgeClass = 'bg-slate-100 text-slate-600';
        badgeText = status;
    }

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${badgeClass}`}>
        {badgeText}
      </span>
    );
  });

  // Loading spinner component - memoized
  const LoadingSpinner = React.memo(() => (
    <div className="flex justify-center items-center py-12">
      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      <span className="ml-3 text-gray-600">Memuat data...</span>
    </div>
  ));

  // Memoized form field components to prevent re-renders
  const FormField = React.memo(({ label, children }) => (
    <div className="mb-5">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      {children}
    </div>
  ));

  const OptimizedInput = React.memo(({ type = "text", name, value, onChange, className, placeholder, required, min, max }) => (
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      className={className}
      placeholder={placeholder}
      required={required}
      min={min}
      max={max}
    />
  ));

  const OptimizedSelect = React.memo(({ name, value, onChange, className, style, required, children }) => (
    <select
      name={name}
      value={value}
      onChange={onChange}
      className={className}
      style={style}
      required={required}
    >
      {children}
    </select>
  ));

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-gray-100">
        {/* Modal Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50 rounded-t-xl sticky top-0 z-10">
          <h2 className="text-xl font-semibold text-gray-800">
            {isEditMode ? 'Edit Sesi Training' : 'Detail Sesi Training'}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 bg-white rounded-full p-1.5 hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Modal Body - dengan scroll container yang terkontrol */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]" ref={modalRef}>
          <div className="p-6">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded mb-6 flex items-start">
                <span className="mr-2">⚠️</span>
                <span>{error}</span>
              </div>
            )}
            
            {!dataReady || isFetchingData ? (
              <LoadingSpinner />
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Training Session Name */}
                <FormField label="Nama Sesi Training">
                  {isEditMode ? (
                    <OptimizedInput
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Masukkan nama sesi training"
                      required
                    />
                  ) : (
                    <p className="py-2.5 px-4 bg-gray-50 rounded-lg text-gray-800 border border-gray-200">
                      {trainingDetail.name || '-'}
                    </p>
                  )}
                </FormField>

                {/* Program Training */}
                <FormField label="Program Training">
                  {isEditMode ? (
                    <OptimizedSelect
                      name="program_training_id"
                      value={formData.program_training_id}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-no-repeat bg-[center_right_1rem] bg-[length:1rem] transition-colors"
                      style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")" }}
                      required
                    >
                      <option value="">Pilih Program</option>
                      {programTrainingOptions.map((program) => (
                        <option key={program.program_training_id} value={program.program_training_id}>
                          {program.name} ({program.alias})
                        </option>
                      ))}
                    </OptimizedSelect>
                  ) : (
                    <p className="py-2.5 px-4 bg-gray-50 rounded-lg text-gray-800 border border-gray-200">
                      {programName}
                    </p>
                  )}
                </FormField>

              {/* Trainer Display and Selection */}
              <FormField label="Trainer">
                {isEditMode ? (
                  <select
                    name="staff_id"
                    value={formData.staff_id}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-no-repeat bg-[center_right_1rem] bg-[length:1rem] transition-colors"
                    style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")" }}
                    required
                  >
                    <option value="">-- Pilih Trainer --</option>
                    {trainers.map((trainer) => (
                      <option key={trainer.staff_id} value={String(trainer.staff_id)}>
                        {trainer.name} 
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="py-2.5 px-4 bg-gray-50 rounded-lg text-gray-800 border border-gray-200">
                    {getTrainerName(displayStaffId)}
                  </p>
                )}
              </FormField>

              {/* Status */}
              <FormField label="Status">
                {isEditMode ? (
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-no-repeat bg-[center_right_1rem] bg-[length:1rem] transition-colors"
                    style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")" }}
                  >
                    <option value="active">Aktif</option>
                    <option value="no active">Tidak Aktif</option>
                    <option value="finish">Selesai</option>
                  </select>
                ) : (
                  <div className="py-2.5 px-4 bg-gray-50 rounded-lg border border-gray-200">
                    <StatusBadge status={trainingDetail.status_active || trainingDetail.status} />
                  </div>
                )}
              </FormField>
              
              {/* Start Date and Time */}
              <FormField label="Tanggal & Waktu Mulai">
                {isEditMode ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <input
                        type="date"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        required
                      />
                    </div>
                    <div>
                      <input
                        type="time"
                        name="startTime"
                        value={formData.startTime}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        required
                      />
                    </div>
                  </div>
                ) : (
                  <p className="py-2.5 px-4 bg-gray-50 rounded-lg text-blue-800 border border-gray-200 flex items-center">
                    <Calendar size={18} className="mr-2 text-gray-500" />
                    {formatDateNum(trainingDetail.start_date || trainingDetail.startDate)}
                    
                  </p>
                )}
              </FormField>

              {/* End Date and Time */}
              <FormField label="Tanggal & Waktu Selesai">
                {isEditMode ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <input
                        type="date"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        required
                      />
                    </div>
                    <div>
                      <input
                        type="time"
                        name="endTime"
                        value={formData.endTime}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        required
                      />
                    </div>
                  </div>
                ) : (
                  <p className="py-2.5 px-4 bg-gray-50 rounded-lg text-blue-800 border border-gray-200 flex items-center">
                    <Calendar size={18} className="mr-2 text-gray-500" />
                    {formatDateNum(trainingDetail.end_date || trainingDetail.endDate)}
                  </p>
                )}
              </FormField>

              {/* Meeting Mode */}
              <FormField label="Pertemuan">
                {isEditMode ? (
                  <input
                    type="text"
                    name="meeting_mode"
                    value={formData.meeting_mode}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                  />
                ) : (
                  <p className="py-2.5 px-4 bg-gray-50 rounded-lg text-gray-800 border border-gray-200">
                    {trainingDetail.meeting_mode || '-'}
                  </p>
                )}
              </FormField>

              {/* Location */}
              <FormField label="Lokasi">
                {isEditMode ? (
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                  />
                ) : (
                  <p className="py-2.5 px-4 bg-gray-50 rounded-lg text-gray-800 border border-gray-200">
                    {trainingDetail.location || '-'}
                  </p>
                )}
              </FormField>

              {/* Max Present - FIXED */}
             

              {/* Created At - view only */}
              {!isEditMode && (
                <FormField label="Tanggal Dibuat">
                  <p className="py-2.5 px-4 bg-gray-50 rounded-lg text-gray-800 border border-gray-200 flex items-center">
                    <Calendar size={18} className="mr-2 text-gray-500" />
                    {formatDateNum(trainingDetail.created_at || trainingDetail.createdAt)}
                  </p>
                </FormField>
              )}
              
              {/* Action Buttons */}
              {isEditMode && (
                <div className="flex justify-end mt-8 space-x-3 sticky bottom-0 bg-white pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    disabled={isFetchingData}
                  >
                    {/* <Save size={18} className="mr-2" /> */}
                    Ubah
                  </button>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
    </div>
  );
};

export default TrainingDetail;



