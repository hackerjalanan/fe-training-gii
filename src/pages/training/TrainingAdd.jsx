//Training
import PropTypes from 'prop-types';
import React, { useEffect, useState  } from 'react';
import { createTrainingSesi } from '../../service/training-sesi.service';
import { fetchProgramTraining ,fetchStaffId} from '../../service/master-data.service';

const CreateTrainingModal = ({ isOpen, onClose, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingPrograms, setIsFetchingPrograms] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    program_training_id: '',
    meeting_mode: '',
    location: '',
    start_date: '',
    staff_id: '',
    end_date:  '',
  });

  
  // Inside your component
  const [programTrainingOptions, setProgramTrainingOptions] = useState([]);
  const [trainers, setTrainers] = useState([]);



  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    setIsFetchingPrograms(true);
    try {
      const programData = await fetchProgramTraining();
      setProgramTrainingOptions(programData.response || []);

      const trainerData = await fetchStaffId(null, 4); // role_id = 4 (Trainer)
      setTrainers(Array.isArray(trainerData.response) ? trainerData.response : []);
    } catch (error) {
      console.error('Gagal memuat data:', error);
      setError('Gagal memuat data program training atau trainer');
    } finally {
      setIsFetchingPrograms(false);
    }
  };


  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Validasi: jika yang diubah adalah end_date
    if (name === "end_date" && value < formData.start_date) {
      alert("Tanggal selesai harus lebih besar dari tanggal mulai.");
      return;
    }

    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };


  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Send data to API
      await createTrainingSesi(formData);
      
      // Reset form
      setFormData({
        name: '',
        program_training_id: '',
        meeting_mode: '',
        location: '',
        start_date: '',
        staff_id: '',
        end_date:  '',
      });
      
      // Notify parent of success
      if (onSuccess) {
        onSuccess();
      }
      
      // Close modal
      onClose();
    } catch (err) {
      setError('Gagal membuat sesi training');
      console.error('Error creating training session:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // If modal is not open, don't render anything
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">Tambah Sesi Training Baru</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
            disabled={isSubmitting}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        <div className="p-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          {isSubmitting ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Sesi
                  </label>
                  <input
                    type="text"
                    name="name"

                    value={formData.name}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Program Training
                  </label>
                  {isFetchingPrograms ? (
                    <div className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-500">
                      Loading programs...
                    </div>
                  ) : (
                    <select
                      name="program_training_id"
                      value={formData.program_training_id}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Pilih Program</option>
                      {programTrainingOptions.map((program) => (
                        <option key={program.program_training_id} value={program.program_training_id}>
                          {program.name} ({program.alias})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trainer
                  </label>
                  <select
                    name="staff_id"
                    value={formData.staff_id}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Pilih Trainer</option>
                    {trainers.map((staff) => (
                      <option key={staff.staff_id} value={staff.staff_id}>
                        {staff.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mode Pertemuan
                  </label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                      Link Meeting/Alamat 
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tanggal Mulai
                  </label>
                  <input
                    type="date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tanggal Selesai
                  </label>
                  <input
                    type="date"
                    name="end_date"
                    min={formData.start_date} // Mencegah pilih tanggal sebelum start_date
                    value={formData.end_date}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>


              



              </div>

              <div className="flex justify-end mt-6 space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100"
                  disabled={isSubmitting}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  disabled={isSubmitting || isFetchingPrograms}
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

// PropTypes for component props
CreateTrainingModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired
};

export default CreateTrainingModal;