import React, { useState } from 'react';
import { createReportType } from '../../service/report-type.service';

const CreateReportTypeForm = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    report_type_name: '',
    content_names: [''] // Array untuk multiple content names
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handle form input changes untuk report_type_name
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle content name changes
  const handleContentNameChange = (index, value) => {
    const updatedContentNames = [...formData.content_names];
    updatedContentNames[index] = value;
    setFormData(prev => ({ ...prev, content_names: updatedContentNames }));
  };

  // Add new content name field
  const addContentNameField = () => {
    setFormData(prev => ({
      ...prev,
      content_names: [...prev.content_names, '']
    }));
  };

  // Remove content name field
  const removeContentNameField = (index) => {
    if (formData.content_names.length > 1) {
      const updatedContentNames = formData.content_names.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, content_names: updatedContentNames }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    // Filter out empty content names
    const filteredContentNames = formData.content_names.filter(name => name.trim() !== '');
    
    if (filteredContentNames.length === 0) {
      setError('Minimal satu content name harus diisi.');
      setLoading(false);
      return;
    }
    
    try {
      // Call the createReportType service function
      const response = await createReportType({
        report_type_name: formData.report_type_name,
        content_names: filteredContentNames
      });
      
      // Show success message
      alert('Jenis Laporan berhasil ditambahkan!');
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
      // Close the form
      onClose();
    } catch (error) {
      console.error('Error creating Jenis Laporan:', error);
      setError('Failed to create Jenis Laporan. Please check your inputs and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-y-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center border-b px-6 py-4 bg-gray-50">
          <h2 className="text-xl font-semibold text-gray-800">Tambah Jenis Laporan</h2>
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
            <label htmlFor="report_type_name" className="block text-sm text-gray-600 mb-1">
              Jenis Laporan Name
            </label>
            <input
              id="report_type_name"
              type="text"
              name="report_type_name"
              value={formData.report_type_name}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded focus:outline-none focus:ring focus:border-blue-300"
              required
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm text-gray-600">Content Names</label>
              <button
                type="button"
                onClick={addContentNameField}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                disabled={loading}
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                </svg>
                Tambah Content
              </button>
            </div>
            
            <div className="space-y-2">
              {formData.content_names.map((contentName, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={contentName}
                    onChange={(e) => handleContentNameChange(index, e.target.value)}
                    placeholder={`Content Name ${index + 1}`}
                    className="flex-1 border px-3 py-2 rounded focus:outline-none focus:ring focus:border-blue-300"
                  />
                  {formData.content_names.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeContentNameField(index)}
                      className="text-red-500 hover:text-red-700 p-1"
                      disabled={loading}
                      aria-label="Remove content name"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Minimal satu content name harus diisi. Klik "Tambah Content" untuk menambah field baru.
            </p>
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

export default CreateReportTypeForm;