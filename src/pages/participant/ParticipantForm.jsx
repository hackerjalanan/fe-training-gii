import React, { useState, useEffect } from 'react';
import { fetchProgramTraining, fetchTrainingSesi } from '../../service/master-data.service';
import { createParticipant } from '../../service/participant.service';

const CreateParticipantForm = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    agency: ''
  });
  const [programTrainings, setProgramTrainings] = useState([]);
  const [trainingSessions, setTrainingSessions] = useState([]);
  const [selectedTrainingSessions, setSelectedTrainingSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load master data
  useEffect(() => {
    const loadMasterData = async () => {
      try {
        const [programResponse, sessionResponse] = await Promise.all([
          fetchProgramTraining(),
          fetchTrainingSesi()
        ]);
        
        if (programResponse?.response) {
          setProgramTrainings(programResponse.response);
        }
        
        if (sessionResponse?.response) {
          setTrainingSessions(sessionResponse.response);
        }
      } catch (error) {
        console.error('Failed to load master data:', error);
        setError('Failed to load necessary data. Please try again.');
      }
    };
    
    loadMasterData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTrainingSessionChange = (e) => {
    const { value, checked } = e.target;
    
    if (checked) {
      setSelectedTrainingSessions(prev => [...prev, value]);
    } else {
      setSelectedTrainingSessions(prev => prev.filter(id => id !== value));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // Prepare data for creation
      const createData = {
        name: formData.name,
        agency: formData.agency,
        training_sesi_ids: selectedTrainingSessions
      };
      
      await createParticipant(createData);
      setSuccess('Participant created successfully!');
      
      // Notify parent component
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      }
    } catch (error) {
      console.error('Failed to create participant:', error);
      setError('Failed to create participant. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Group training sessions by program
  const groupedTrainingSessions = trainingSessions.reduce((acc, session) => {
    const programId = session.program_training_id;
    if (!acc[programId]) {
      acc[programId] = [];
    }
    acc[programId].push(session);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full h-full max-h-[90vh] flex flex-col">
        {/* Fixed Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-2xl font-bold">Create New Participant</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium border-b pb-2">Basic Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Participant Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Agency/Institution
                  </label>
                  <input
                    type="text"
                    name="agency"
                    value={formData.agency}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Training Sessions */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium border-b pb-2">Training Sessions</h3>

              {programTrainings.length > 0 ? (
                <div className="space-y-6">
                  {programTrainings.map(program => {
                    const programSessions = groupedTrainingSessions[program.program_training_id] || [];
                    
                    if (programSessions.length === 0) return null;
                    
                    return (
                      <div key={program.program_training_id} className="border rounded-md p-4">
                        <h4 className="font-medium text-md mb-3">
                          {program.name} {program.alias ? `(${program.alias})` : ''}
                        </h4>
                        
                        <div className="space-y-2">
                          {programSessions.map(session => (
                            <div key={session.training_sesi_id} className="flex items-center">
                              <input
                                type="checkbox"
                                id={`session-${session.training_sesi_id}`}
                                value={session.training_sesi_id}
                                checked={selectedTrainingSessions.includes(session.training_sesi_id)}
                                onChange={handleTrainingSessionChange}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <label htmlFor={`session-${session.training_sesi_id}`} className="ml-2 block text-sm text-gray-900">
                                {session.name} - {session.location} ({session.start_date})
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 italic">No training sessions available.</p>
              )}
            </div>
          </form>
        </div>

        {/* Fixed Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : 'Create Participant'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateParticipantForm;