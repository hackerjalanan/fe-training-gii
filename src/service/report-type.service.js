import API from './api.service'; // API instance yang sudah siap

const API_URL = '/report-type/v1';


// 1. get all report type
export const fetchReportTypeList = async ({
    report_type_id = "",
    batch = "",
    size = "",
    search = "",
}) => {
  try {
    const response = await API.post(`${API_URL}/list`, {
        report_type_id,
        batch,
        search,
        size,
      });

    return response.data;
  } catch (error) {
    console.error('Error fetching staff list:', error);
    throw error;
  }
};

// 2. create report type
export const createReportType = async ({
  report_type_name = "",
  content_names = [],
}) => {
  try {
    const response = await API.post(`${API_URL}/create`, {
      report_type_name,
      content_names,
    });
    return response.data;
  } catch (error) {
    console.error('Error create report type:', error);
    throw error;
  }
};
     
// 3. Update staff information
export const updateReportType = async (reportTypeId, ReportTypeData) => {
  try {
    const response = await API.patch(`${API_URL}/update/${reportTypeId}`, ReportTypeData);
    return response.data;
  } catch (error) {
    console.error('Error report type:', error);
    throw error;
  }
};

// 4. delete
export const deletereportType= async ({ reportTypeId = "" }) => {
  try {
    const response = await API.patch(`${API_URL}/deleted/${reportTypeId}`);
    return response.data;
  } catch (error) {
    console.error('Error delete type:', error);
    throw error;
  }
};
