import React, { useState, useEffect } from 'react';
import { updateTrainingSesi, fetchTrainingSesiList } from '../../service/training-sesi.service';
import { fetchProgramTraining, fetchStaffId } from '../../service/master-data.service';

const UpdateTrainingSesiForm = ({ trainingSesiId, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    program_training_id: '',
    meeting_mode: '',
    location: '',
    startDate: '',
    endDate: '',
    staff_id: '',
  });
  const [programTrainings, setProgramTrainings] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState(null);

  // Load data saat mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingData(true);

        const sesiRes = await fetchTrainingSesiList({ training_sesi_id: trainingSesiId });
        const sesi = sesiRes?.response?.records?.find(s => s.training_sesi_id === trainingSesiId);

        if (sesi) {
          setFormData({
            name: sesi.name || '',
            program_training_id: sesi.program_training_id || '',
            meeting_mode: sesi.meeting_mode || '',
            location: sesi.location || '',
            startDate: sesi.start_date.split('T')[0], // Only date part
            endDate: sesi.end_date.split('T')[0], // Only date part
            staff_id: sesi.staff_id || '',
          });
        } else {
          setError('Data training sesi tidak ditemukan.');
        }

        const programTrainingRes = await fetchProgramTraining();
        setProgramTrainings(programTrainingRes?.response || []);

        const staffRes = await fetchStaffId(null, 4); // Role trainer
        setStaffList(staffRes?.response || []);
      } catch (err) {
        console.error('Gagal load data:', err);
        setError('Gagal mengambil data.');
      } finally {
        setLoadingData(false);
      }
    };

    if (trainingSesiId) loadData();
  }, [trainingSesiId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleStartDateChange = (e) => {
    const { value } = e.target;
    setFormData(prev => {
      const newFormData = {
        ...prev,
        startDate: value
      };
      
      // If end date is already set and is before the new start date, clear it
      if (prev.endDate && new Date(prev.endDate) < new Date(value)) {
        newFormData.endDate = '';
      }
      
      return newFormData;
    });
    
    // Clear any existing error when start date changes
    setError(null);
  };

  const handleEndDateChange = (e) => {
    const { value } = e.target;
    const startDate = new Date(formData.startDate);
    const endDate = new Date(value);

    if (endDate < startDate) {
      setError("Tanggal selesai tidak boleh lebih kecil dari tanggal mulai.");
      return; // Don't update the state if invalid
    } else {
      setError(null);
    }

    setFormData(prev => ({
      ...prev,
      endDate: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Additional validation before submit
    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      setError("Tanggal selesai tidak boleh lebih kecil dari tanggal mulai.");
      return;
    }
    
    setLoading(true);

    try {
      const payload = {
        ...formData,
        start_date: new Date(formData.startDate).toISOString(),
        end_date: new Date(formData.endDate).toISOString(),
      };

      await updateTrainingSesi(trainingSesiId, payload);
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error("Error updating:", err);
      setError("Gagal menyimpan data sesi.");
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return <div className="text-center p-8">Memuat data...</div>;
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-y-auto max-h-[90vh]"
      >
        <div className="flex justify-between items-center border-b px-6 py-4 bg-gray-50">
          <h2 className="text-xl font-semibold text-gray-800">Edit Training Sesi</h2>
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
            <label htmlFor="name" className="block text-sm text-gray-600 mb-1">Nama Training Sesi</label>
            <input
              id="name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded focus:outline-none focus:ring focus:border-blue-300"
              required
            />
          </div>

          <div>
            <label htmlFor="program_training_id" className="block text-sm text-gray-600 mb-1">Program Training</label>
            <select
              id="program_training_id"
              name="program_training_id"
              value={formData.program_training_id}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded focus:outline-none focus:ring focus:border-blue-300"
              required
            >
              <option value="">-- Pilih Program Training --</option>
              {programTrainings.map(program => (
                <option key={program.program_training_id || program.id} value={program.program_training_id || program.id}>
                  {program.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Mode Pertemuan</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="meeting_mode"
                  value="online"
                  checked={formData.meeting_mode === "online"}
                  onChange={handleChange}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span>Online</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="meeting_mode"
                  value="offline"
                  checked={formData.meeting_mode === "offline"}
                  onChange={handleChange}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span>Offline</span>
              </label>
            </div>
          </div>



          <div>
            <label htmlFor="location" className="block text-sm text-gray-600 mb-1">Lokasi</label>
            <input
              id="location"
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded focus:outline-none focus:ring focus:border-blue-300"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm text-gray-600 mb-1">Tanggal Mulai</label>
              <input
                id="startDate"
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleStartDateChange}
                className="w-full border px-3 py-2 rounded focus:outline-none focus:ring focus:border-blue-300"
                required
              />
            </div>

            <div>
              <label htmlFor="endDate" className="block text-sm text-gray-600 mb-1">Tanggal Selesai</label>
              <input
                id="endDate"
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleEndDateChange}
                min={formData.startDate} // This prevents selecting dates before start date
                className="w-full border px-3 py-2 rounded focus:outline-none focus:ring focus:border-blue-300"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="staff_id" className="block text-sm text-gray-600 mb-1">Staff/Trainer</label>
            <select
              id="staff_id"
              name="staff_id"
              value={formData.staff_id}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded focus:outline-none focus:ring focus:border-blue-300"
              required
            >
              <option value="">-- Pilih Staff/Trainer --</option>
              {staffList.map(staff => (
                <option key={staff.staff_id} value={staff.staff_id}>
                  {staff.name}
                </option>
              ))}
            </select>
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

export default UpdateTrainingSesiForm;