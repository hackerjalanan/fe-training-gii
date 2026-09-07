import { useEffect, useState } from 'react';
import { createReport } from '../../service/report.service';
import { ScheduleTrainingSesi, scheduleReport, fetchReportContent } from '../../service/master-data.service';
import { fetchParticipants } from '../../service/participant.service';
import { formatDatetime } from '../../utils/date.utils';
import { X, Loader2, FileImage, FileText } from "lucide-react";
import Swal from 'sweetalert2';

const CreateReportForm = ({ closeModal, onSubmit }) => {
    // Loading states
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loadingStates, setLoadingStates] = useState({
        trainingSesi: false,
        scheduleReport: false,
        participants: false
    });

    // Data states with safe defaults
    const [trainingSesiOptions, setTrainingSesiOptions] = useState([]);
    const [scheduleReportOptions, setScheduleReportOptions] = useState([]);
    const [reportContents, setReportContents] = useState([]);
    const [participants, setParticipants] = useState([]);
    
    // Form state
    const [formData, setFormData] = useState({
        training_sesi_id: '',
        report_schedule_id: '',
        name: '',
        start_time: '',
        finish_time: '',
        status_acc: 'menunggu',
        attachment: [],
        details: [{ report_content_id: '', content_text: '' }]
        
    });

    // Utility function to safely handle array data
    const ensureArray = (data, fallback = []) => {
        if (Array.isArray(data)) return data;
        if (data && Array.isArray(data.response)) return data.response;
        if (data && Array.isArray(data.data)) return data.data;
        if (data && Array.isArray(data.records)) return data.records;
        console.warn('Expected array but received:', typeof data, data);
        return fallback;
    };

    // Safe error handler
    const handleError = (error, context, fallback = null) => {
        console.error(`Error in ${context}:`, error);
        const errorMessage = error?.message || error?.toString() || 'Unknown error occurred';
        setError(`${context}: ${errorMessage}`);
        return fallback;
    };

    // File handling with compression
    const handleFileChange = (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const compressImage = (file, maxWidth = 800, quality = 0.7) => {
            return new Promise((resolve, reject) => {
                try {
                    const img = new Image();
                    const reader = new FileReader();

                    reader.onload = () => {
                        img.src = reader.result;
                    };

                    img.onload = () => {
                        try {
                            const canvas = document.createElement('canvas');
                            const scaleSize = maxWidth / img.width;
                            canvas.width = maxWidth;
                            canvas.height = img.height * scaleSize;

                            const ctx = canvas.getContext('2d');
                            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                            const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
                            resolve(compressedBase64);
                        } catch (canvasError) {
                            reject(canvasError);
                        }
                    };

                    reader.onerror = reject;
                    img.onerror = reject;

                    reader.readAsDataURL(file);
                } catch (error) {
                    reject(error);
                }
            });
        };

        const processFiles = files.map(file => {
            if (file.type.startsWith('image/')) {
                return compressImage(file);
            } else {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
            }
        });

        Promise.all(processFiles)
            .then(base64Files => {
                setFormData(prev => ({
                    ...prev,
                    attachment: [...(prev.attachment || []), ...base64Files]
                }));
                setError(null); // Clear any previous errors
            })
            .catch(error => {
                handleError(error, 'File processing');
            });
    };

    // Form change handler
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        // Clear error when user starts typing
        if (error) setError(null);
        
        // Load dependent data when training sesi changes
        if (name === 'training_sesi_id' && value) {
            loadScheduleReportData(value);
        }
    };

    // Detail change handler
    const handleDetailChange = (index, e) => {
        const { value } = e.target;
        setFormData(prev => {
            const newDetails = [...(prev.details || [])];
            if (newDetails[index]) {
                newDetails[index].content_text = value;
            }
            return { ...prev, details: newDetails };
        });
    };

  
    // Load training sessions
    const loadTrainingSesi = async () => {
        setLoadingStates(prev => ({ ...prev, trainingSesi: true }));
        setError(null);
        
        try {
            const response = await ScheduleTrainingSesi();
            const data = ensureArray(response);
            setTrainingSesiOptions(data);
        } catch (error) {
            handleError(error, 'Loading training sessions');
            setTrainingSesiOptions([]);
        } finally {
            setLoadingStates(prev => ({ ...prev, trainingSesi: false }));
        }
    };

    // Load schedule report data
    const loadScheduleReportData = async (trainingSessionId) => {
        if (!trainingSessionId) {
            setScheduleReportOptions([]);
            return;
        }

        setLoadingStates(prev => ({ ...prev, scheduleReport: true }));

        try {
            const response = await scheduleReport(trainingSessionId);
            const data = ensureArray(response);
            setScheduleReportOptions(data);
        } catch (error) {
            handleError(error, 'Loading schedule reports');
            setScheduleReportOptions([]);
        } finally {
            setLoadingStates(prev => ({ ...prev, scheduleReport: false }));
        }
    };

    

    // Load report contents
    const loadReportContents = async (reportScheduleId) => {
        if (!reportScheduleId) {
            setReportContents([]);
            return;
        }
        
        try {
            const selectedSchedule = scheduleReportOptions.find(
                schedule => schedule.report_schedule_id === reportScheduleId
            );
            
            if (selectedSchedule?.report_type_id) {
                const response = await fetchReportContent(selectedSchedule.report_type_id);
                const contents = ensureArray(response);
                setReportContents(contents);
                
                // Update form details
                if (contents.length > 0) {
                    setFormData(prev => ({
                        ...prev,
                        details: contents.map(item => ({
                            report_content_id: item.report_content_id,
                            content_text: ''
                        }))
                    }));
                }
            }
        } catch (error) {
            handleError(error, 'Loading report contents');
            setReportContents([]);
        }
    };

    // Clear field handler
    const handleClear = (fieldName) => {
        setFormData(prev => ({ ...prev, [fieldName]: "" }));
        
        if (fieldName === 'report_schedule_id') {
            setFormData(prev => ({
                ...prev,
                details: [{ report_content_id: '', content_text: '' }]
            }));
            setReportContents([]);
        }
        
        if (fieldName === 'training_sesi_id') {
            setFormData(prev => ({
                ...prev,
                report_schedule_id: '',
                details: [{ report_content_id: '', content_text: '' }]
            }));
            setParticipants([]);
            setScheduleReportOptions([]);
            setReportContents([]);
        }
    };

    // Remove attachment
    const removeAttachment = (index) => {
        setFormData(prev => ({
            ...prev,
            attachment: (prev.attachment || []).filter((_, i) => i !== index)
        }));
    };

    // Form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (isSubmitting) return;
        
        setIsSubmitting(true);
        setLoading(true);
        setError(null);

        try {
            // Validate required fields
            if (!formData.training_sesi_id) {
                throw new Error('Training sesi is required');
            }
            if (!formData.report_schedule_id) {
                throw new Error('Schedule report is required');
            }

            await createReport(formData);
            
            await Swal.fire({
                title: 'Berhasil!',
                text: 'Laporan berhasil dibuat.',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });
            
            if (onSubmit) {
                await onSubmit(formData);
            }
            
            closeModal();
            
        } catch (error) {
            const errorMsg = error?.message || 'Gagal membuat laporan. Silakan cek kembali input Anda.';
            setError(errorMsg);
            
            Swal.fire({
                title: 'Error',
                text: errorMsg,
                icon: 'error',
            });
        } finally {
            setLoading(false);
            setIsSubmitting(false);
        }
    };

    // Effects
    useEffect(() => {
        loadTrainingSesi();
    }, []);

    useEffect(() => {
        loadReportContents(formData.report_schedule_id);
    }, [formData.report_schedule_id, scheduleReportOptions]);

    // Safe render helpers
    const renderTrainingSesiOptions = () => {
        const options = ensureArray(trainingSesiOptions);
        return options.map((sesi) => (
            <option key={sesi.training_sesi_id || Math.random()} value={sesi.training_sesi_id}>
                {sesi.name} ({formatDatetime(sesi.start_date)})
            </option>
        ));
    };

    const renderScheduleReportOptions = () => {
        const options = ensureArray(scheduleReportOptions);
        return options.map((schedule) => (
            <option key={schedule.report_schedule_id || Math.random()} value={schedule.report_schedule_id}>
                {schedule.name || schedule.report_type_name}
            </option>
        ));
    };

    const renderReportDetails = () => {
        const contents = ensureArray(reportContents);
        return contents.map((content, index) => (
            <div key={content.report_content_id || index} className="border p-4 mb-2 rounded space-y-2 bg-gray-50">
                <div>
                    <label className="text-sm text-gray-600">{content.content_name}</label>
                    <textarea
                        name="content_text"
                        value={formData.details[index]?.content_text || ''}
                        onChange={(e) => handleDetailChange(index, e)}
                        className="w-full border px-3 py-2 rounded focus:outline-none focus:ring focus:border-blue-300"
                        required
                    />
                </div>
            </div>
        ));
    };

    const renderAttachments = () => {
        const attachments = ensureArray(formData.attachment);
        return attachments.map((att, i) => (
            <div key={i} className="flex items-center gap-3">
                {att.startsWith("data:image") ? (
                    <img
                        src={att}
                        alt={`attachment-${i}`}
                        className="h-20 rounded border"
                    />
                ) : (
                    <span className="italic text-blue-600 text-sm truncate">
                        [PDF File]
                    </span>
                )}
                <button
                    type="button"
                    onClick={() => removeAttachment(i)}
                    className="text-red-500 hover:text-red-700 p-1"
                >
                    <X size={16} />
                </button>
            </div>
        ));
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-y-auto max-h-[90vh]">
                <div className="flex justify-between items-center border-b px-6 py-4 bg-gray-50">
                    <h2 className="text-xl font-semibold text-gray-800">Tambah Laporan</h2>
                    <button onClick={closeModal} className="text-gray-500 hover:text-gray-700" aria-label="Close">
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
                    {/* Training Sesi Dropdown */}
                    <div className="relative">
                        <label htmlFor="training_sesi_id" className="block mb-1 font-medium text-sm text-gray-700">
                            Training Sesi
                        </label>
                        <div className="relative">
                            <select
                                id="training_sesi_id"
                                name="training_sesi_id"
                                value={formData.training_sesi_id}
                                onChange={handleChange}
                                className="w-full border px-3 py-2 pr-10 rounded focus:outline-none focus:ring focus:border-blue-300"
                                required
                                disabled={loadingStates.trainingSesi}
                            >
                                <option value="">-- Pilih Sesi --</option>
                                {renderTrainingSesiOptions()}
                            </select>
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                {loadingStates.trainingSesi ? (
                                    <Loader2 className="h-4 w-4 text-gray-500 animate-spin" />
                                ) : formData.training_sesi_id ? (
                                    <button 
                                        type="button" 
                                        onClick={() => handleClear("training_sesi_id")}
                                        className="text-gray-400 hover:text-gray-600 focus:outline-none"
                                    >
                                        <X className="h-4 w-4 mr-2" />
                                    </button>
                                ) : (
                                    <div className="w-4 h-4"></div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Schedule Report Dropdown */}
                    <div className="relative">
                        <label htmlFor="report_schedule_id" className="block mb-1 font-medium text-sm text-gray-700">
                            Jenis Laporan
                        </label>
                        <div className="relative">
                            <select
                                id="report_schedule_id"
                                name="report_schedule_id"
                                value={formData.report_schedule_id}
                                onChange={handleChange}
                                className="w-full border px-3 py-2 pr-10 rounded focus:outline-none focus:ring focus:border-blue-300"
                                required
                                disabled={loadingStates.scheduleReport || !formData.training_sesi_id}
                            >
                                <option value="">-- Pilih Schedule Report --</option>
                                {renderScheduleReportOptions()}
                            </select>
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                {loadingStates.scheduleReport ? (
                                    <Loader2 className="h-4 w-4 text-gray-500 animate-spin" />
                                ) : formData.report_schedule_id ? (
                                    <button 
                                        type="button" 
                                        onClick={() => handleClear("report_schedule_id")}
                                        className="text-gray-400 hover:text-gray-600 focus:outline-none"
                                    >
                                        <X className="h-4 w-4 mr-2" />
                                    </button>
                                ) : (
                                    <div className="w-4 h-4"></div>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    {/* Other Input Fields */}
                    {[
                        { id: 'name', label: 'Nama Laporan' },
                        // { id: 'start_time', label: 'Tanggal Waktu Mulai', type: 'datetime-local' },
                        // { id: 'finish_time', label: 'Tanggal & Waktu Selesai', type: 'datetime-local' },
                    ].map(({ id, label, type = 'text' }) => (
                        <div key={id}>
                            <label htmlFor={id} className="block mb-1 font-medium text-sm text-gray-700">{label}</label>
                            <input
                                type={type}
                                id={id}
                                name={id}
                                value={formData[id] || ''}
                                onChange={handleChange}
                                className="w-full border px-3 py-2 rounded focus:outline-none focus:ring focus:border-blue-300"
                                required
                            />
                        </div>
                    ))}

                    {/* Report Details */}
                    {reportContents.length > 0 && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Detail Laporan</label>
                            {renderReportDetails()}
                        </div>
                    )}

                    {/* File Attachments */}
                    <div>       
                        <label className="block mb-1 font-medium text-sm text-gray-700">
                            Lampiran Dokumen
                        </label>
                        <input
                            type="file"
                            accept="image/*,application/pdf"
                            multiple
                            onChange={handleFileChange}
                            className="block w-full border p-2 rounded"
                        />

                        {formData.attachment.length > 0 && (
                            <div className="mt-2 space-y-2">
                                {renderAttachments()}
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end border-t pt-4">
                        <button
                            type="button"
                            onClick={closeModal}
                            className="px-4 py-2 mr-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                            disabled={loading}
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={loading || isSubmitting}
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

export default CreateReportForm;