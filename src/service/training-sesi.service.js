import API from './api.service'; // API instance yang sudah siap

const API_URL = '/training-sesi/v1';


// 1. detail
export const getTrainingSesiDetail = async (id) => {
  try {
    const response = await API.post(`${API_URL}/list`, {
      training_sesi_id: id
    });
    
    // Transform API response to match the DetailTraining component props
    if (response.data && response.data.response && response.data.response.records && response.data.response.records.length > 0) {
      const trainingData = response.data.response.records[0];
      const programTraining = trainingData.program_training || {};
      const staff = trainingData.staff || {};
      
      // Map API response to match DetailTraining props structure
      return {
        id: trainingData.training_sesi_id,
        name: trainingData.name,
        status: trainingData.status_active,
        startDate: trainingData.start_date,
        endDate: trainingData.end_date || null,
        meeting_mode: trainingData.meeting_mode || '-',
        location: trainingData.location || '-',
        totalParticipant: trainingData.total_participant || 0,
        staff_id: trainingData.staff_id || '-',
        staff: {
          id: staff.staff_id,
          name: staff.name,
          email: staff.email,
          username: staff.username,
          role_id: staff.role_id
        },
        program: {
          id: programTraining.program_training_id,
          name: programTraining.name,
          alias: programTraining.alias
        },
        createdAt: trainingData.created_at,
        statusDeleted: trainingData.status_deleted,
        participants: []  // If you have participants data, you can map it here
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching training session detail:', error);
    throw error;
  }
};

// 2. Create new training session
export const createTrainingSesi = async (data) => {
  try {
    const response = await API.post(`${API_URL}/create`, data);
    return response.data;
  } catch (error) {
    console.error('Error creating training session:', error);
    throw error;
  }
};

// 3. Update training session
export const updateTrainingSesi = async (id, data) => {
  try {
    const requestData = {
      name: data.name || '',
      program_training_id: data.program_training_id || data.program?.id || null,
      status_active: data.status_active || 'no active',
      meeting_mode : data.meeting_mode || null,
      location: data.location || '',
      start_date: data.startDate ? new Date(data.startDate).toISOString() : '',
      end_date: data.endDate ? new Date(data.endDate).toISOString() : '',
      staff_id: data.staff_id || null,
    };

    const response = await API.patch(`${API_URL}/update/${id}`, requestData);

    if (!response.data || response.data.error) {
      throw new Error(response.data?.message || 'Gagal memperbarui sesi training');
    }

    return response.data;
  } catch (error) {
    console.error('Error updating training session:', error);
    throw error;
  }
};

// 4. Delete training session
export const deleteTrainingSesi = async (id) => {
  try {
    const response = await API.patch(`${API_URL}/deleted/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting training session:', error);
    throw error;
  }
};

// 4. Delete training session participant (soft-delete)
export const deleteTrainingSesiParticipant = async (participantId, trainingSesiId) => {
  try {
    const response = await API.patch(`${API_URL}/deleted/${trainingSesiId}`, {
      only_participant_delete: participantId
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting participant from session:', error);
    throw error;
  }
};

// 5. Activate/deactivate training session
export const toggleTrainingSesiStatus = async (id, isActive) => {
  try {
    const status = isActive ? 'activate' : 'deactivate';
    const response = await API.put(`${API_URL}/${status}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error ${isActive ? 'activating' : 'deactivating'} training session:`, error);
    throw error;
  }
};

// 6. Fetch training session list with pagination scroll
export const fetchTrainingSesiList = async (params = {}) => {
  try {
    const {
      training_sesi_id = "",
      search = "",
      batch = 1,
      start_date = "",
      end_date = "",
      size = 7,
    } = params;

    const response = await API.post(`${API_URL}/list`, {
      training_sesi_id,
      search,
      start_date,
      end_date,
      batch,
      size,
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching training sessions:", error);
    throw error;
  }
};


