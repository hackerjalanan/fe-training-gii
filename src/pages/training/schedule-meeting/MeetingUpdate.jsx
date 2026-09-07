import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useLocation } from 'react-router-dom';
import { updateMeeting, fetchMeetingDetail  } from '../../../service/meeting-schedule.service';
import { fetchTrainingSesi } from '../../../service/master-data.service'; // Sesuaikan path

const UpdateMeetingPopup = ({ meetingId, trainingSessionId, onClose, onSuccess }) => {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    start_time: '',
    end_time: '',
    batch: 1,
    size: 5,
  });
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState(null);
  const [trainingSesiInfo, setTrainingSesiInfo] = useState(null);
  const [loadingTrainingSesi, setLoadingTrainingSesi] = useState(true);
  const [currentTrainingSessionId, setCurrentTrainingSessionId] = useState(trainingSessionId);

  // Get min and max date from training session
  const getDateConstraints = () => {
    if (!trainingSesiInfo) return { min: '', max: '' };
    
    const formatDateForInput = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toISOString().split('T')[0];
    };

    return {
      min: formatDateForInput(trainingSesiInfo.start_date),
      max: formatDateForInput(trainingSesiInfo.end_date)
    };
  };

  // Load Meeting data first to get the correct training_session_id
  useEffect(() => {
    const loadMeetingData = async () => {
      try {
        setLoadingData(true);
        setError(null);
        
        console.log('Loading meeting data for meetingId:', meetingId);
        
        // Fetch Meeting data
        const meetingResponse = await fetchMeetingDetail({ meeting_id: meetingId });
        console.log('Meeting Response:', meetingResponse);

        // Process Meeting data
        let meetingData = null;
        
        if (meetingResponse && 
            meetingResponse.response && 
            meetingResponse.response.records && 
            Array.isArray(meetingResponse.response.records)) {
          
          if (meetingResponse.response.records.length > 0) {
            meetingData = meetingResponse.response.records[0];
          }
          
          if (!meetingData && meetingResponse.response.records.length > 1) {
            meetingData = meetingResponse.response.records.find(item => item.meeting_id === meetingId);
          }
        }

        console.log('Found meeting data:', meetingData);

        if (meetingData) {
          // Set the correct training_session_id from meeting data
          const trainingId = meetingData.training_session_id || meetingData.training_sesi_id;
          setCurrentTrainingSessionId(trainingId);
          
          // Format dates for date and time inputs separately
          const formatDateOnly = (dateString) => {
            if (!dateString) return '';
            try {
              const date = new Date(dateString);
              if (isNaN(date.getTime())) {
                console.warn('Invalid date:', dateString);
                return '';
              }
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const day = String(date.getDate()).padStart(2, '0');
              return `${year}-${month}-${day}`;
            } catch (error) {
              console.error('Error formatting date:', error);
              return '';
            }
          };

          const formatTimeOnly = (dateString) => {
            if (!dateString) return '';
            try {
              const date = new Date(dateString);
              if (isNaN(date.getTime())) {
                console.warn('Invalid date:', dateString);
                return '';
              }
              const hours = String(date.getHours()).padStart(2, '0');
              const minutes = String(date.getMinutes()).padStart(2, '0');
              return `${hours}:${minutes}`;
            } catch (error) {
              console.error('Error formatting time:', error);
              return '';
            }
          };

          setFormData({
            name: meetingData.name || '',
            date: formatDateOnly(meetingData.start_date),
            start_time: formatTimeOnly(meetingData.start_date),
            end_time: formatTimeOnly(meetingData.end_date),
            batch: meetingData.batch || 1,
            size: meetingData.size || 5,
          });
        } else {
          setError(`Data Meeting dengan ID ${meetingId} tidak ditemukan.`);
          console.error('Meeting not found. Response:', meetingResponse);
        }

      } catch (error) {
        console.error('Gagal mengambil data meeting:', error);
        setError(`Gagal mengambil data: ${error.message || 'Unknown error'}`);
      } finally {
        setLoadingData(false);
      }
    };

    if (meetingId) {
      loadMeetingData();
    } else {
      setError('Meeting ID tidak tersedia.');
      setLoadingData(false);
    }
  }, [meetingId]);

  // Fetch training sesi data when currentTrainingSessionId is available
  useEffect(() => {
    const loadTrainingSesi = async () => {
      if (!currentTrainingSessionId) {
        setLoadingTrainingSesi(false);
        return;
      }

      try {
        setLoadingTrainingSesi(true);
        console.log('Loading training sesi for ID:', currentTrainingSessionId);
        
        const response = await fetchTrainingSesi({ training_session_id: currentTrainingSessionId });
        console.log('Training Sesi Response:', response);
        
        // Handle different response structures
        let trainingSesi = null;
        
        if (response && response.response && response.response.records && Array.isArray(response.response.records)) {
          // Structure: response.response.records[]
          trainingSesi = response.response.records.find(
            item => item.training_session_id == currentTrainingSessionId || item.training_sesi_id == currentTrainingSessionId
          );
        } else if (response && response.response && Array.isArray(response.response)) {
          // Structure: response.response[]
          trainingSesi = response.response.find(
            item => (item.training_session_id == currentTrainingSessionId || item.training_sesi_id == currentTrainingSessionId) &&
                    // item.status_active === 'active' && 
                    item.status_deleted === 1
          );
        } else if (response && Array.isArray(response)) {
          // Structure: response[]
          trainingSesi = response.find(
            item => (item.training_session_id == currentTrainingSessionId || item.training_sesi_id == currentTrainingSessionId) &&
                    item.status_active === 'active' && 
                    item.status_deleted === 1
          );
        }
        
        if (trainingSesi) {
          setTrainingSesiInfo(trainingSesi);
          console.log('Training sesi loaded:', trainingSesi);
          
          // Validate current date against training session range
          if (formData.date) {
            const selectedDate = new Date(formData.date);
            const trainingStartDate = new Date(trainingSesi.start_date);
            const trainingEndDate = new Date(trainingSesi.end_date);
            
            if (selectedDate < trainingStartDate || selectedDate > trainingEndDate) {
              setError(`Tanggal meeting (${formData.date}) tidak sesuai dengan periode training session (${trainingSesi.start_date} - ${trainingSesi.end_date}). Silakan sesuaikan tanggal.`);
            }
          }
        } else {
          console.warn('Training session not found in response:', response);
          setError('Data training session tidak ditemukan.');
        }
      } catch (error) {
        console.error('Error loading training sesi:', error);
        setError('Gagal memuat data training sesi.');
      } finally {
        setLoadingTrainingSesi(false);
      }
    };

    loadTrainingSesi();
  }, [currentTrainingSessionId, formData.date]);

  // Handle form input changes with validation
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Special handling for date validation
    if (name === 'date' && trainingSesiInfo && value) {
      const selectedDate = new Date(value);
      const trainingStartDate = new Date(trainingSesiInfo.start_date);
      const trainingEndDate = new Date(trainingSesiInfo.end_date);
      
      if (selectedDate < trainingStartDate || selectedDate > trainingEndDate) {
        setError(`Tanggal harus berada dalam rentang training session: ${new Date(trainingSesiInfo.start_date).toLocaleDateString('id-ID')} - ${new Date(trainingSesiInfo.end_date).toLocaleDateString('id-ID')}`);
      } else {
        setError(null);
      }
    }
    
    // Special handling for start_time - if changed and >= end_time, reset end_time
    if (name === 'start_time' && formData.end_time && value >= formData.end_time) {
      setFormData(prev => ({ 
        ...prev, 
        [name]: value,
        end_time: '' // Reset end_time if start_time is >= end_time
      }));
      setError(null);
      return;
    }
    
    // Special handling for end_time to ensure it's after start_time
    if (name === 'end_time' && formData.start_time && value) {
      const [startHour, startMin] = formData.start_time.split(':').map(Number);
      const [endHour, endMin] = value.split(':').map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      
      if (startMinutes >= endMinutes) {
        setError('Jam selesai harus lebih lambat dari jam mulai.');
        return;
      } else {
        setError(null);
      }
    }
    
    // Clear error when start_time changes
    if (name === 'start_time') {
      setError(null);
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle form submission with improved validation
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    // Basic validation
    if (!formData.name.trim()) {
      setError('Nama meeting harus diisi.');
      setLoading(false);
      return;
    }
    
    if (!formData.date) {
      setError('Tanggal harus diisi.');
      setLoading(false);
      return;
    }

    if (!formData.start_time) {
      setError('Jam mulai harus diisi.');
      setLoading(false);
      return;
    }
    
    if (!formData.end_time) {
      setError('Jam selesai harus diisi.');
      setLoading(false);
      return;
    }
    
    // Validate date is within training session range
    if (trainingSesiInfo) {
      const selectedDate = new Date(formData.date);
      const trainingStartDate = new Date(trainingSesiInfo.start_date);
      const trainingEndDate = new Date(trainingSesiInfo.end_date);
      
      if (selectedDate < trainingStartDate || selectedDate > trainingEndDate) {
        setError(`Tanggal harus berada dalam rentang training session: ${new Date(trainingSesiInfo.start_date).toLocaleDateString('id-ID')} - ${new Date(trainingSesiInfo.end_date).toLocaleDateString('id-ID')}`);
        setLoading(false);
        return;
      }
    }
    
    // Validate time range
    const [startHour, startMin] = formData.start_time.split(':').map(Number);
    const [endHour, endMin] = formData.end_time.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    if (startMinutes >= endMinutes) {
      setError('Jam selesai harus lebih lambat dari jam mulai.');
      setLoading(false);
      return;
    }
    
    try {
      // Format dates for API (YYYY-MM-DD HH:mm:ss)
      const formatDateTimeForAPI = (date, time) => {
        const dateTime = new Date(`${date}T${time}`);
        const year = dateTime.getFullYear();
        const month = String(dateTime.getMonth() + 1).padStart(2, '0');
        const day = String(dateTime.getDate()).padStart(2, '0');
        const hours = String(dateTime.getHours()).padStart(2, '0');
        const minutes = String(dateTime.getMinutes()).padStart(2, '0');
        const seconds = String(dateTime.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      };

      // Prepare data for API call
      const updateData = {
        name: formData.name.trim(),
        start_date: formatDateTimeForAPI(formData.date, formData.start_time),
        end_date: formatDateTimeForAPI(formData.date, formData.end_time)
      };

      console.log('Updating meeting with data:', updateData);

      // Call the updateMeeting service function
      const response = await updateMeeting(meetingId, updateData);
      
      console.log('Update response:', response);
      
      // Show success message
      alert('Meeting berhasil diupdate!');
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess(response);
      }
      
      // Close the form
      onClose();
    } catch (error) {
      console.error('Error updating Meeting:', error);
      if (error?.response?.data?.metaData?.message) {
        setError(error.response.data.metaData.message);
      } else {
        setError(`Gagal mengupdate Meeting: ${error.message || 'Periksa input Anda dan coba lagi.'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const dateConstraints = getDateConstraints();

  if (loadingData || loadingTrainingSesi) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-4 w-80">
          <div className="flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-t-2 border-blue-500 border-solid rounded-full animate-spin mb-2"></div>
            <p className="text-sm text-gray-700">
              {loadingData ? 'Memuat data Meeting...' : 'Memuat training sesi...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-y-auto max-h-[95vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Compact */}
        <div className="flex justify-between items-center border-b px-4 py-2 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-800">Edit Meeting</h2>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700 p-1"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Training Sesi Info - Compact */}
        {trainingSesiInfo && (
          <div className="px-4 py-2 bg-blue-50 border-b">
            <div className="text-xs font-medium text-blue-800 truncate">
              {trainingSesiInfo.name} - {trainingSesiInfo.location}
            </div>
            {trainingSesiInfo.start_date && trainingSesiInfo.end_date && (
              <div className="text-xs text-blue-600">
                Periode: {new Date(trainingSesiInfo.start_date).toLocaleDateString('id-ID')} - {new Date(trainingSesiInfo.end_date).toLocaleDateString('id-ID')}
              </div>
            )}
          </div>
        )}

        {/* Error Message - Compact */}
        {error && (
          <div className="mx-4 mt-2 p-2 bg-red-50 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        {/* Form - Compact */}
        <form onSubmit={handleSubmit} className="px-4 py-3 space-y-3">
          {/* Name Field */}
          <div>
            <label htmlFor="name" className="block text-xs text-gray-600 mb-1">
              Nama Meeting <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Masukkan nama meeting"
              className="w-full border px-2 py-1.5 rounded text-sm focus:outline-none focus:ring-1 focus:border-blue-300"
              required
            />
          </div>

          {/* Date Field */}
          <div>
            <label htmlFor="date" className="block text-xs text-gray-600 mb-1">
              Tanggal <span className="text-red-500">*</span>
            </label>
            <input
              id="date"
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              min={dateConstraints.min}
              max={dateConstraints.max}
              className="w-full border px-2 py-1.5 rounded text-sm focus:outline-none focus:ring-1 focus:border-blue-300"
              required
            />
            {trainingSesiInfo && (dateConstraints.min || dateConstraints.max) && (
              <div className="text-xs text-gray-500 mt-0.5">
                Harus dalam rentang: {new Date(dateConstraints.min).toLocaleDateString('id-ID')} - {new Date(dateConstraints.max).toLocaleDateString('id-ID')}
              </div>
            )}
          </div>

          {/* Time Fields - Side by side */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="start_time" className="block text-xs text-gray-600 mb-1">
                Jam Mulai <span className="text-red-500">*</span>
              </label>
              <input
                id="start_time"
                type="time"
                name="start_time"
                value={formData.start_time}
                onChange={handleChange}
                className="w-full border px-2 py-1.5 rounded text-sm focus:outline-none focus:ring-1 focus:border-blue-300"
                required
              />
            </div>

            <div>
              <label htmlFor="end_time" className="block text-xs text-gray-600 mb-1">
                Jam Selesai <span className="text-red-500">*</span>
              </label>
              <input
                id="end_time"
                type="time"
                name="end_time"
                value={formData.end_time}
                onChange={handleChange}
                min={formData.start_time || "00:00"}
                className="w-full border px-2 py-1.5 rounded text-sm focus:outline-none focus:ring-1 focus:border-blue-300"
                required
              />
              {formData.start_time && (
                <div className="text-xs text-gray-500 mt-0.5">
                  Minimal: {formData.start_time}
                </div>
              )}
            </div>
          </div>

          {/* Duration Info - Compact */}
          {formData.start_time && formData.end_time && (
            <div className="text-xs text-gray-500 text-center">
              {(() => {
                const [startHour, startMin] = formData.start_time.split(':').map(Number);
                const [endHour, endMin] = formData.end_time.split(':').map(Number);
                const startMinutes = startHour * 60 + startMin;
                const endMinutes = endHour * 60 + endMin;
                const duration = endMinutes - startMinutes;
                
                if (duration > 0) {
                  const hours = Math.floor(duration / 60);
                  const minutes = duration % 60;
                  return `Durasi: ${hours > 0 ? `${hours}j ` : ''}${minutes > 0 ? `${minutes}m` : ''}`.trim();
                }
                return '';
              })()}
            </div>
          )}

          {/* Buttons - Compact */}
          <div className="flex justify-end border-t pt-3 gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-sm bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              disabled={loading}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center"
            >
              {loading ? (
                <>
                  <div className="mr-1 h-3 w-3 border-t-2 border-white rounded-full animate-spin"></div>
                  Menyimpan...
                </>
              ) : (
                'Simpan'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateMeetingPopup;