import React, { useState, useEffect } from 'react';
import { createReportSchedule , dropdownMeeting, dropdownTypeReport} from '../../../service/report-schedule.service';
import { fetchTrainingSesi  } from '../../../service/master-data.service';

const CreateMeetingPopup = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    report_type_id: '',
    meeting_id: '',
    start_date: '',
    end_date: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null); 
  const [trainingSesiInfo, setTrainingSesiInfo] = useState(null);
  const [loadingTrainingSesi, setLoadingTrainingSesi] = useState(true);
  const [reportTypes, setReportTypes] = useState([]);
  const [trainingSesiId, setTrainingSesiId] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState('');

  // Get training_sesi_id from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const trainingId = urlParams.get('training_sesi_id');
    
    if (trainingId) {
      setTrainingSesiId(trainingId);
    } else {
      setError('Training Session ID tidak ditemukan di URL.');
      setLoadingTrainingSesi(false);
    }
  }, []);

  // Fetch list of report types
  useEffect(() => {
    const loadReportTypes = async () => {
      if (!selectedMeetingId) return;
      try {
        const response = await dropdownTypeReport({
          meeting_id: selectedMeetingId,
          report_type_id: formData.report_type_id, // untuk update, jika ada
        });
        const reportTypeData = response?.response || response?.data || response || [];
        setReportTypes(Array.isArray(reportTypeData) ? reportTypeData : []);
      } catch (err) {
        console.error('Gagal memuat tipe report:', err);
        setError('Gagal memuat tipe report.');
      }
    };

    loadReportTypes();
  }, [selectedMeetingId]);

  useEffect(() => {
    const loadMeetings = async () => {
      if (!trainingSesiId) return;
      try {
        const response = await dropdownMeeting({ training_sesi_id: trainingSesiId });
        const meetingData = response?.response || response?.data || response || [];
        setMeetings(Array.isArray(meetingData) ? meetingData : []);
      } catch (err) {
        console.error('Gagal memuat meeting:', err);
        setError('Gagal memuat daftar meeting.');
      }
    };

    loadMeetings();
  }, [trainingSesiId]);


  // Fetch training sesi info by ID
  useEffect(() => {
    const loadTrainingSesi = async () => {
      if (!trainingSesiId) return;

      try {
        setLoadingTrainingSesi(true);
        const response = await fetchTrainingSesi();
        const trainingSesiData = response?.response || response?.data || response || [];
        
        if (Array.isArray(trainingSesiData)) {
          const trainingSesi = trainingSesiData.find(
            item => {
              // Convert both to string for safer comparison
              const itemId = String(item.training_sesi_id);
              const searchId = String(trainingSesiId);
              return itemId === searchId && item.status_deleted === 1;
            }
          );
          setTrainingSesiInfo(trainingSesi);
          
          if (!trainingSesi) {
            setError('Training session tidak ditemukan atau tidak aktif.');
          }
        } else {
          setError('Format data training session tidak valid.');
        }
      } catch (error) {
        console.error('Error loading training sesi:', error);
        setError('Gagal memuat data training sesi.');
      } finally {
        setLoadingTrainingSesi(false);
      }
    };

    loadTrainingSesi();
  }, [trainingSesiId]);

  // Form field handler
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'meeting_id') {
      setSelectedMeetingId(value);
      setFormData(prev => ({
        ...prev,
        report_type_id: '', // reset tipe report saat meeting berubah
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    if (error) setError(null);
  };


  // Validate form data
  const validateForm = () => {
    if (!trainingSesiId) {
      return 'Training Session ID tidak valid.';
    }

    if (!formData.report_type_id) {
      return 'Jenis report harus dipilih.';
    }

    if (!formData.start_date) {
      return 'Tanggal mulai harus diisi.';
    }

    if (!formData.end_date) {
      return 'Tanggal selesai harus diisi.';
    }

    const startDate = new Date(formData.start_date);
    const endDate = new Date(formData.end_date);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return 'Format tanggal tidak valid.';
    }

    if (startDate >= endDate) {
      return 'Tanggal mulai harus lebih kecil dari tanggal selesai.';
    }

    // Check if training session exists
    if (!trainingSesiInfo) {
      return 'Training session tidak ditemukan. Silakan refresh halaman.';
    }

    return null;
  };

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Use the original training_sesi_id without modification
      const payload = {
        training_sesi_id: trainingSesiId, // Keep original ID format
        meeting_id: selectedMeetingId,
        report_type_id: formData.report_type_id,
        start_date: formData.start_date,
        end_date: formData.end_date
      };

      console.log('Sending payload:', payload);
      console.log('Training_sesi_id (original format):', trainingSesiId);

      const response = await createReportSchedule(payload);
      
      console.log('Response:', response);

      // Check if response indicates success
      if (response && (
        response.success === true || 
        response.status === 'success' || 
        response.metaData?.status === 'success' ||
        response.metaData?.code === 200 ||
        response.metaData?.response_code === '0001'
      )) {
        // Show success message from API or default message
        const successMessage = response?.metaData?.message || 'Meeting berhasil ditambahkan!';
        alert(successMessage);
        
        if (onSuccess) onSuccess(response);
        onClose(); // Auto close popup on success
      } else {
        // Handle case where API returns response but indicates failure
        const errorMessage = response?.message || 
                           response?.metaData?.message || 
                           response?.error || 
                           'Gagal membuat meeting. Response tidak valid.';
        setError(errorMessage);
      }
    } catch (error) {
      console.error('Error creating meeting:', error);
      
      let errorMessage = 'Gagal membuat meeting. Silakan coba lagi.';
      
      // Handle different error formats
      if (error?.response?.data) {
        const errorData = error.response.data;
        errorMessage = errorData?.metaData?.message || 
                      errorData?.message || 
                      errorData?.error || 
                      `Server error: ${error.response.status}`;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-y-auto max-h-[90vh]"
      >
        <div className="flex justify-between items-center border-b px-6 py-4 bg-gray-50">
          <h2 className="text-xl font-semibold text-gray-800">Tambah Meeting</h2>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
            disabled={loading}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 text-red-700 rounded-md border border-red-200">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-red-400 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
              </svg>
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Training Session
            </label>
            {loadingTrainingSesi ? (
              <div className="w-full border px-3 py-2 rounded bg-gray-50 flex items-center">
                <div className="mr-2 h-4 w-4 border-t-2 border-gray-400 rounded-full animate-spin"></div>
                <span className="text-gray-500">Memuat training sesi...</span>
              </div>
            ) : trainingSesiInfo ? (
              <div className="w-full border px-3 py-2 rounded bg-gray-100 text-gray-700">
                {trainingSesiInfo.name} - {trainingSesiInfo.location}
                {trainingSesiInfo.start_date && ` (${new Date(trainingSesiInfo.start_date).toLocaleDateString('id-ID')})`}
                {/* <div className="text-xs text-gray-500 mt-1">
                  ID: {trainingSesiId}
                </div> */}
              </div>
            ) : (
              <div className="w-full border px-3 py-2 rounded bg-red-50 text-red-700">
                Training session tidak ditemukan
              </div>
            )}
          </div>

          <div>
            <label htmlFor="meeting_id" className="block text-sm text-gray-600 mb-1">
              Pilih Meeting <span className="text-red-500">*</span>
            </label>
            <select
              id="meeting_id"
              name="meeting_id"
              value={selectedMeetingId}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300"
              required
              disabled={loading}
            >
              <option value="">-- Pilih Meeting --</option>
              {meetings.map((meeting) => (
                <option key={meeting.meeting_id} value={meeting.meeting_id}>
                  {meeting.name || `Meeting pada ${new Date(meeting.start_date).toLocaleString('id-ID')}`}
                </option>
              ))}
            </select>
          </div>


          <div>
            <label htmlFor="report_type_id" className="block text-sm text-gray-600 mb-1">
              Tipe Report <span className="text-red-500">*</span>
            </label>
            <select
              id="report_type_id"
              name="report_type_id"
              value={formData.report_type_id}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300"
              required
              disabled={loading}
            >
              <option value="">-- Pilih Tipe Report --</option>
              {reportTypes.map((type) => (
                <option key={type.report_type_id} value={type.report_type_id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="start_date" className="block text-sm text-gray-600 mb-1">
              Tanggal & Waktu Mulai <span className="text-red-500">*</span>
            </label>
            <input
              id="start_date"
              type="datetime-local"
              name="start_date"
              value={formData.start_date}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="end_date" className="block text-sm text-gray-600 mb-1">
              Tanggal & Waktu Selesai <span className="text-red-500">*</span>
            </label>
            <input
              id="end_date"
              type="datetime-local"
              name="end_date"
              value={formData.end_date}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300"
              required
              disabled={loading}
            />
          </div>

          <div className="flex justify-end border-t pt-4 space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors disabled:opacity-50"
              disabled={loading}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || !trainingSesiInfo || !trainingSesiId}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors"
            >
              {loading ? (
                <>
                  <div className="mr-2 h-4 w-4 border-t-2 border-white rounded-full animate-spin"></div>
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

export default CreateMeetingPopup;