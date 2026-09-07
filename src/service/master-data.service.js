import API from './api.service'; // axios instance yang sudah siap
const API_URL = '/master-data/v1';
const API_URLReport = '/report/v1';

// 1. Get all roles (dengan optional filter jika ingin ditambahkan nanti)
export const fetchRoleList = async () => {
  try {
    const response = await API.post(`${API_URL}/role`);
    return response.data;
  } catch (error) {
    console.error('Error fetching roles:', error);
    throw error;
  }
};
// 1. Get all roles (dengan optional filter jika ingin ditambahkan nanti)
export const getRoleList = async () => {
  try {
    const response = await API.get(`${API_URL}/role`);
    return response.data;
  } catch (error) {
    console.error('Error fetching roles:', error);
    throw error;
  }
};

// 2. program training
export const fetchProgramTraining = async () => {
  try {
    const response = await API.get(`${API_URL}/program-training`);
    return response.data;
  } catch (error) {
    console.error('Error fetching training program=:', error);
    throw error;
  }
};

// 3. training sesi
export const fetchTrainingSesi = async () => {
  try {
    const response = await API.get(`${API_URL}/training-sesi`);
    return response.data;
  } catch (error) {
    console.error('Error fetching training sesi:', error);
    throw error;
  }
};

// 4. training sesi
export const fetchReportTypeSesi = async () => {
  try {
    const response = await API.get(`${API_URL}/report-type`);
    return response.data;
  } catch (error) {
    console.error('Error fetching training sesi:', error);
    throw error;
  }
};

// 5. training sesi
export const fetchReportContent = async (reportTypeId) => {
  try {
    const response = await API.get(`${API_URL}/report-content/${reportTypeId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching report content:', error);
    throw error;
  }
};

// 6. tampilkan file
export const showfile = async (attachmentId) => {
  try {
    const response = await API.get(`${API_URLReport}/attachment/${attachmentId}.txt`);
    return response.data;
  } catch (error) {
    console.error('Error fetching attachment:', error);
    throw error;
  }
};

// 7. training sesi
export const fetchStaffId = async (staffId, roleId) => {
  try {
    const response = await API.get(`${API_URL}/staff-id`, {
      params: {
        staff_id: staffId,
        role_id: roleId,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching staff:', error);
    throw error;
  }
};


// schedule report
// report-1. training sesi
export const ScheduleTrainingSesi = async () => {
  try {
    const response = await API.get(`${API_URL}/training-schedule-report`);
    return response.data;
  } catch (error) {
    console.error('Error fetching training sesi:', error);
    throw error;
  }
};

export const scheduleReport = async (training_sesi_id) => {
  try {
    const response = await API.get(`${API_URL}/schedule-report/${training_sesi_id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching training sesi:', error);
    throw error;
  }
};