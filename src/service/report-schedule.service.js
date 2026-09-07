import API from './api.service'; // API instance yang sudah siap

const API_URL = '/report-schedule/v1';


// 1. get all report schedule
export const fetchReportScheduleList = async ({
    report_schedule_id = "",
    training_sesi_id = "",
    report_type_id = "",
    search = "",
    batch = 1,
    size = 5,
}) => {
  try {
    const response = await API.post(`${API_URL}/list`, {
        report_schedule_id,
        training_sesi_id,
        report_type_id,
        search,
        batch,
        size,
      });

    return response.data;
  } catch (error) {
    console.error('Error fetching report schedule:', error);
    throw error;
  }
};

// 2. create report schedule
export const createReportSchedule = async ({
  training_sesi_id = "",
  report_type_id = "",
  meeting_id = "",
  start_date = "",
  end_date = "",
}) => {
  try {
    const response = await API.post(`${API_URL}/create`, {
      training_sesi_id,
      report_type_id,
      meeting_id,
      start_date,
      end_date,
    });
    return response.data;
  } catch (error) {
    console.error('Error create report schedule:', error);
    throw error;
  }
};
     
// 3. Update staff information
export const updateReportSchedule = async (id, ReportScheduleData) => {
  try {
    const response = await API.patch(`${API_URL}/update/${id}`, ReportScheduleData);
    return response.data;
  } catch (error) {
    console.error('Error report schedule:', error);
    throw error;
  }
};

// 4. delete
export const deleteReportSchedule = async ({ id = "" }) => {
  try {
    const response = await API.patch(`${API_URL}/deleted/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error delete type:', error);
    throw error;
  }
};



// 5. get all report schedule
export const dropdownMeeting = async ({
    training_sesi_id = "",
}) => {
  try {
    const response = await API.post(`${API_URL}/show-meeting`, {
        training_sesi_id,
      });

    return response.data;
  } catch (error) {
    console.error('Error fetching report schedule:', error);
    throw error;
  }
};

// 6. get all report schedule
export const dropdownTypeReport = async ({
    meeting_id = "",
    report_type_id = "",
}) => {
  try {
    const response = await API.post(`${API_URL}/show-type-report`, {
        meeting_id,
        report_type_id,
      });

    return response.data;
  } catch (error) {
    console.error('Error fetching report schedule:', error);
    throw error;
  }
};