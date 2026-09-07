import React, { useState, useEffect } from 'react';
import { createMeeting } from '../../../service/meeting-schedule.service'; // Sesuaikan path
import { fetchTrainingSesi } from '../../../service/master-data.service'; // Sesuaikan path

const CreateMeetingPopup = ({ onClose, onSuccess, trainingSesiId }) => {
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    start_time: '',
    end_time: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [trainingSesiInfo, setTrainingSesiInfo] = useState(null);
  const [loadingTrainingSesi, setLoadingTrainingSesi] = useState(true);

  // Fetch training sesi data on component mount
  useEffect(() => {
    const loadTrainingSesi = async () => {
      try {
        setLoadingTrainingSesi(true);
        const response = await fetchTrainingSesi();
        // Find the specific training session
        const trainingSesi = response.response?.find(
          (item) =>
            item?.training_sesi_id === trainingSesiId &&
            item?.status_deleted === 1
        );

        // const trainingSesi = response.response?.find(
        //   item => item.training_sesi_id == trainingSesiId && 
        //           item.status_deleted === 1
        //           // item.status_active === 'active' && 
        // );
        setTrainingSesiInfo(trainingSesi);
      } catch (error) {
        console.error('Error loading training sesi:', error);
        setError('Gagal memuat data training sesi.');
      } finally {
        setLoadingTrainingSesi(false);
      }
    };

    if (trainingSesiId) {
      loadTrainingSesi();
    } else {
      setError('Training Session ID tidak ditemukan.');
      setLoadingTrainingSesi(false);
    }
  }, [trainingSesiId]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // If start_time is changed and it's greater than or equal to end_time, reset end_time
    if (name === 'start_time' && formData.end_time && value >= formData.end_time) {
      setFormData(prev => ({ 
        ...prev, 
        [name]: value,
        end_time: '' // Reset end_time if start_time is >= end_time
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Get min and max date from training session
  const getDateConstraints = () => {
    if (!trainingSesiInfo) return { min: '', max: '' };
    
    const startDate = trainingSesiInfo.start_date ? new Date(trainingSesiInfo.start_date).toISOString().split('T')[0] : '';
    const endDate = trainingSesiInfo.end_date ? new Date(trainingSesiInfo.end_date).toISOString().split('T')[0] : '';
    
    return { min: startDate, max: endDate };
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    // Basic validation
    if (!trainingSesiId) {
      setError('Training Session ID tidak valid.');
      setLoading(false);
      return;
    }
    
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
    
    // Validate time range
    if (formData.start_time >= formData.end_time) {
      setError('Jam mulai harus lebih kecil dari jam selesai.');
      setLoading(false);
      return;
    }
    
    // Validate date is within training session range
    if (trainingSesiInfo) {
      const selectedDate = new Date(formData.date);
      const trainingStartDate = new Date(trainingSesiInfo.start_date);
      const trainingEndDate = new Date(trainingSesiInfo.end_date);
      
      if (selectedDate < trainingStartDate || selectedDate > trainingEndDate) {
        setError('Tanggal harus berada dalam rentang training session.');
        setLoading(false);
        return;
      }
    }
    
    try {
      // Combine date and time for start_date and end_date
      const startDateTime = `${formData.date}T${formData.start_time}`;
      const endDateTime = `${formData.date}T${formData.end_time}`;
      
      // Call the createMeeting service function
      const response = await createMeeting({
        training_sesi_id: trainingSesiId,
        name: formData.name.trim(),
        start_date: startDateTime,
        end_date: endDateTime
      });
      
      // Show success message
      alert('Meeting berhasil ditambahkan!');
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess(response);
      }
      
      // Close the form
      onClose();
    } catch (error) {
        console.error('Error creating meeting:', error);
        if (error?.response?.data?.metaData?.message) {
            setError(error.response.data.metaData.message);
        } else {
            setError('Gagal membuat meeting. Silakan periksa input dan coba lagi.');
        }

    } finally {
      setLoading(false);
    }
  };

  const dateConstraints = getDateConstraints();

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-y-auto max-h-[90vh]"
      >
        <div className="flex justify-between items-center border-b px-6 py-4 bg-gray-50">
          <h2 className="text-xl font-semibold text-gray-800">Buat Pertemuan</h2>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 text-red-700 rounded-md">
            {error}
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
                {trainingSesiInfo.start_date && trainingSesiInfo.end_date && (
                  <div className="text-sm text-gray-500 mt-1">
                    Periode: {new Date(trainingSesiInfo.start_date).toLocaleDateString('id-ID')} - {new Date(trainingSesiInfo.end_date).toLocaleDateString('id-ID')}
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full border px-3 py-2 rounded bg-red-50 text-red-700">
                Training session tidak ditemukan
              </div>
            )}
          </div>

          <div>
            <label htmlFor="name" className="block text-sm text-gray-600 mb-1">
              Nama Pertemuan <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Masukkan nama pertemuan"
              className="w-full border px-3 py-2 rounded focus:outline-none focus:ring focus:border-blue-300"
              required
            />
          </div>

          <div>
            <label htmlFor="date" className="block text-sm text-gray-600 mb-1">
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
              className="w-full border px-3 py-2 rounded focus:outline-none focus:ring focus:border-blue-300"
              required
            />
            {trainingSesiInfo && (
              <div className="text-xs text-gray-500 mt-1">
                Harus dalam rentang: {dateConstraints.min} sampai {dateConstraints.max}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="start_time" className="block text-sm text-gray-600 mb-1">
                Jam Mulai <span className="text-red-500">*</span>
              </label>
              <input
                id="start_time"
                type="time"
                name="start_time"
                value={formData.start_time}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded focus:outline-none focus:ring focus:border-blue-300"
                required
              />
            </div>

            <div>
              <label htmlFor="end_time" className="block text-sm text-gray-600 mb-1">
                Jam Selesai <span className="text-red-500">*</span>
              </label>
              <input
                id="end_time"
                type="time"
                name="end_time"
                value={formData.end_time}
                onChange={handleChange}
                min={formData.start_time || "00:00"}
                className="w-full border px-3 py-2 rounded focus:outline-none focus:ring focus:border-blue-300"
                required
              />
              {formData.start_time && (
                <div className="text-xs text-gray-500 mt-1">
                  Minimal: {formData.start_time}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end border-t pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 mr-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              disabled={loading}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center"
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