import API from './api.service'; // API instance yang sudah siap

const API_URL = '/meeting/v1';


// 1. get all meeting
export const fetchMeetingList = async ({
    meeting_id = "",
    training_sesi_id,
    batch = "",
    size = "",
    search = "",
}) => {
  try {
    const response = await API.post(`${API_URL}/list`, {
        meeting_id,
        training_sesi_id,
        batch,
        search,
        size,
      });

    return response.data;
  } catch (error) {
    console.error('Error fetching meeting:', error);
    throw error;
  }
};

// 2. get detail meeting
export const fetchMeetingDetail = async ({
    meeting_id = "",
    training_sesi_id,
    search = "",
}) => {
  try {
    const response = await API.post(`${API_URL}/list`, {
        meeting_id,
        training_sesi_id,
        search,
      });

    return response.data;
  } catch (error) {
    console.error('Error fetching meeting:', error);
    throw error;
  }
};

// 2. create meeting
export const createMeeting = async ({
  training_sesi_id = "",
  name = "",
  start_date = "",
  end_date = "",
}) => {
  try {
    const response = await API.post(`${API_URL}/create`, {
      training_sesi_id,
      name,
      start_date,
      end_date,
    });
    return response.data;
  } catch (error) {
    console.error('Error create meeting:', error);
    throw error;
  }
};
     
// 3. Update staff information
export const updateMeeting = async (id, MeetingData) => {
  try {
    const response = await API.patch(`${API_URL}/update/${id}`, MeetingData);
    return response.data;
  } catch (error) {
    console.error('Error meeting:', error);
    throw error;
  }
};

// 4. delete
export const deleteMeeting= async ({ id = "" }) => {
  try {
    const response = await API.patch(`${API_URL}/deleted/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error delete type:', error);
    throw error;
  }
};
