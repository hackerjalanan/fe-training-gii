import React, { useState, useEffect } from 'react';
import { updateReportType, fetchReportTypeList } from '../../service/report-type.service';

const ReportTypeUpdate = ({ reportTypeId, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    report_type_name: '',
    contents: []
  });
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState(null);

  // Load Jenis Laporan data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingData(true);
        
        // Fetch Jenis Laporan data
        const response = await fetchReportTypeList({
          report_type_id: reportTypeId
        });

        // Access the Jenis Laporan data from the response
        let reportTypeData = null;
        if (response && 
            response.response && 
            response.response.records && 
            Array.isArray(response.response.records)) {
          reportTypeData = response.response.records.find(item => item.report_type_id === reportTypeId);
        }

        if (reportTypeData) {
          setFormData({
            report_type_name: reportTypeData.name || '',
            contents: reportTypeData.contents || []
          });
        } else {
          setError('Data Jenis Laporan tidak ditemukan.');
        }

      } catch (error) {
        console.error('Gagal mengambil data:', error);
        setError('Gagal mengambil data. Silakan coba lagi.');
      } finally {
        setLoadingData(false);
      }
    };

    if (reportTypeId) {
      loadData();
    }
  }, [reportTypeId]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle content name changes
  const handleContentChange = (index, value) => {
    const updatedContents = [...formData.contents];
    updatedContents[index] = {
      ...updatedContents[index],
      content_name: value
    };
    setFormData(prev => ({ ...prev, contents: updatedContents }));
  };

  // Add new content
  const addContent = () => {
    const newContent = {
      report_content_id: `temp_${Date.now()}`, // Temporary ID for new content
      content_name: ''
    };
    setFormData(prev => ({
      ...prev,
      contents: [...prev.contents, newContent]
    }));
  };

  // Remove content
  const removeContent = (index) => {
    const updatedContents = formData.contents.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, contents: updatedContents }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Prepare data for API call - FIXED: use report_type_name instead of name
      const updateData = {
        report_type_name: formData.report_type_name,
        contents: formData.contents.map(content => ({
          report_content_id: content.report_content_id || '',
          content_name: content.content_name
        }))
      };

      // Call the updateReportType service function
      const response = await updateReportType(reportTypeId, updateData);
      
      // Show success message
      alert('Jenis Laporan berhasil diupdate!');
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
      // Close the form
      onClose();
    } catch (error) {
      console.error('Error updating Jenis Laporan:', error);
      setError('Gagal mengupdate Jenis Laporan. Periksa input Anda dan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
          <div className="flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-t-4 border-blue-500 border-solid rounded-full animate-spin mb-4"></div>
            <p className="text-gray-700">Memuat data Jenis Laporan...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-y-auto max-h-[90vh]"
      >
        <div className="flex justify-between items-center border-b px-6 py-4 bg-gray-50">
          <h2 className="text-xl font-semibold text-gray-800">Edit Jenis Laporan</h2>
          <button 
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

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-6">
          {/* Jenis Laporan Name - FIXED: use report_type_name instead of name */}
          <div>
            <label htmlFor="report_type_name" className="block text-sm font-medium text-gray-600 mb-2">
              Nama Jenis Laporan
            </label>
            <input
              id="report_type_name"
              type="text"
              name="report_type_name"
              value={formData.report_type_name}
              onChange={handleChange}
              className="w-full border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              placeholder="Masukkan nama Jenis Laporan"
            />
          </div>

          {/* Contents Section */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-medium text-gray-600">
                Konten Report
              </label>
              <button
                type="button"
                onClick={addContent}
                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
                </svg>
                Tambah Konten
              </button>
            </div>

            {formData.contents.length === 0 ? (
              <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-md">
                <p>Belum ada konten. Klik "Tambah Konten" untuk menambahkan.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {formData.contents.map((content, index) => (
                  <div key={content.report_content_id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-md bg-gray-50">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={content.content_name}
                        onChange={(e) => handleContentChange(index, e.target.value)}
                        className="w-full border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Nama konten"
                        required
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeContent(index)}
                      disabled={content.isUsedContent}
                      className={`px-2 py-2 rounded text-white ${
                        content.isUsedContent
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-red-600 hover:bg-red-700'
                      }`}
                      title={
                        content.isUsedContent
                          ? "Tidak dapat dihapus karena sudah digunakan"
                          : "Hapus konten"
                      }
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>

                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3 border-t pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50"
              disabled={loading}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || formData.contents.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
            >
              {loading ? (
                <>
                  <div className="mr-2 h-4 w-4 border-t-2 border-white rounded-full animate-spin"></div>
                  Menyimpan...
                </>
              ) : (
                'Simpan Perubahan'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportTypeUpdate;