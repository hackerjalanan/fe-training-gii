import { useEffect, useState, useCallback } from 'react';
import { updateReport } from '../../service/report.service';
import { showfile, scheduleReport } from '../../service/master-data.service';
import { formatDatetime } from '../../utils/date.utils';
import { fetchTrainingSesi, fetchReportContent } from '../../service/master-data.service';
import { X, Loader2, FileImage, FileText, Trash2 } from "lucide-react";
import Swal from 'sweetalert2';

const UpdateReportForm = ({ closeModal, onSubmit, reportData }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [trainingSesiOptions, setTrainingSesiOptions] = useState([]);
    const [scheduleReportOptions, setScheduleReportOptions] = useState([]);
    const [reportContents, setReportContents] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [attachmentPreviews, setAttachmentPreviews] = useState({});
    const [deletedAttachmentIds, setDeletedAttachmentIds] = useState([]);
    // Tambahan state untuk menyimpan base64 dari file yang sudah ada
    const [existingAttachmentsBase64, setExistingAttachmentsBase64] = useState({});

    const [loadingStates, setLoadingStates] = useState({
        trainingSesi: false,
        scheduleReport: false,
        attachments: false
    });

    const [formData, setFormData] = useState({
        report_id: '',
        training_sesi_id: '',
        report_schedule_id: '',
        name: '',
        start_time: '',
        finish_time: '',
        attachment: [],
        details: [{ report_detail_id: '', report_content_id: '', content_text: '' }],
    });

    // Utility functions
    const detectFileType = (base64, name) => {
        if (base64.startsWith('data:image')) return 'image';
        if (name?.endsWith('.pdf')) return 'pdf';
        return 'other';
    };

    const compressImage = useCallback((file, maxWidth = 800, quality = 0.7) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const reader = new FileReader();

            reader.onload = () => {
                img.src = reader.result;
            };

            img.onload = () => {
                const canvas = document.createElement('canvas');
                const scaleSize = maxWidth / img.width;
                canvas.width = maxWidth;
                canvas.height = img.height * scaleSize;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
                resolve(compressedBase64);
            };

            reader.onerror = reject;
            img.onerror = reject;

            reader.readAsDataURL(file);
        });
    }, []);

    // Initialize form data when reportData is provided
    useEffect(() => {
        if (reportData) {
            setFormData({
                report_id: reportData.report_id || '',
                training_sesi_id: reportData.training_sesi_id || '',
                report_schedule_id: reportData.report_schedule_id || '',
                name: reportData.name || '',
              
                attachment: [],
                details: Array.isArray(reportData.details) && reportData.details.length > 0
                    ? reportData.details.map(detail => ({
                        report_detail_id: detail.report_detail_id || '',
                        report_content_id: detail.report_content_id || '',
                        content_text: detail.content_text || '',
                    }))
                    : [{ report_detail_id: '', report_content_id: '', content_text: '' }]
            });

            if (reportData.training_sesi_id) {
                loadScheduleReportData(reportData.training_sesi_id, reportData.report_schedule);
            }
        }
    }, [reportData]);

    // Load existing attachments
    const loadAttachments = useCallback(async () => {
        if (reportData?.attachments?.length > 0) {
            setLoadingStates(prev => ({ ...prev, attachments: true }));
            const previews = {};
            const base64Data = {};
            
            try {
                await Promise.all(
                    reportData.attachments.map(async (file) => {
                        try {
                            const result = await showfile(file.attachment_id);
                            const base64String = result?.response || '';
                            
                            previews[file.attachment_id] = {
                                data: base64String,
                                type: detectFileType(base64String, file.name),
                                name: file.name || `file-${file.attachment_id}`,
                                id: file.attachment_id
                            };
                            
                            // Simpan base64 data untuk digunakan saat submit
                            base64Data[file.attachment_id] = {
                                data: base64String,
                                name: file.name || `file-${file.attachment_id}`,
                                type: file.type || ''
                            };
                            
                        } catch (error) {
                            console.error(`Failed to load attachment ${file.attachment_id}:`, error);
                        }
                    })
                );
                setAttachmentPreviews(previews);
                setExistingAttachmentsBase64(base64Data);
            } catch (error) {
                console.error('Error loading attachments:', error);
            } finally {
                setLoadingStates(prev => ({ ...prev, attachments: false }));
            }
        }
    }, [reportData]);

    useEffect(() => {
        loadAttachments();
    }, [loadAttachments]);

    // Load schedule report data when training session changes
    const loadScheduleReportData = async (trainingSesiId, currentReportSchedule = null) => {
        if (!trainingSesiId) return;
        
        setLoadingStates(prev => ({ ...prev, scheduleReport: true }));
        try {
            const data = await scheduleReport(trainingSesiId);
            let scheduleOptions = data.response || [];
            
            // If we have current report schedule data and it's not in the list, add it
            if (currentReportSchedule && currentReportSchedule.report_schedule_id) {
                const existingSchedule = scheduleOptions.find(
                    schedule => schedule.report_schedule_id === currentReportSchedule.report_schedule_id
                );
                
                if (!existingSchedule) {
                    // Add the current report schedule to the options
                    const currentScheduleOption = {
                        report_schedule_id: currentReportSchedule.report_schedule_id,
                        name: currentReportSchedule.report_type?.name || 'Current Schedule',
                        report_type_id: currentReportSchedule.report_type_id || currentReportSchedule.report_type?.report_type_id
                    };
                    scheduleOptions = [currentScheduleOption, ...scheduleOptions];
                }
            }
            
            setScheduleReportOptions(scheduleOptions);
        } catch (err) {
            console.error('Failed to load schedule reports:', err);
            setScheduleReportOptions([]);
        } finally {
            setLoadingStates(prev => ({ ...prev, scheduleReport: false }));
        }
    };

    // File handling
    const handleFileChange = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setError(null);
        setLoading(true);

        try {
            const processFiles = files.map(file => {
                if (file.type.startsWith('image/')) {
                    return compressImage(file);
                } else {
                    return new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve({
                            data: reader.result,
                            name: file.name,
                            type: file.type
                        });
                        reader.onerror = reject;
                        reader.readAsDataURL(file);
                    });
                }
            });

            const processedFiles = await Promise.all(processFiles);
            setFormData(prev => ({
                ...prev,
                attachment: [...prev.attachment, ...processedFiles]
            }));
        } catch (error) {
            console.error('Error processing files:', error);
            setError('Gagal memproses file. Pastikan format file valid.');
        } finally {
            setLoading(false);
        }
    };

    // Remove new attachment
    const removeNewAttachment = (index) => {
        setFormData(prev => ({
            ...prev,
            attachment: prev.attachment.filter((_, i) => i !== index)
        }));
    };

    // Remove existing attachment
    const removeExistingAttachment = (attachmentId) => {
        setDeletedAttachmentIds(prev => [...prev, attachmentId]);
        setAttachmentPreviews(prev => {
            const newPreviews = { ...prev };
            delete newPreviews[attachmentId];
            return newPreviews;
        });
        // Juga hapus dari existingAttachmentsBase64
        setExistingAttachmentsBase64(prev => {
            const newBase64 = { ...prev };
            delete newBase64[attachmentId];
            return newBase64;
        });
    };

    // Form handlers
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const newValue = type === 'checkbox' ? checked : value;
        
        setFormData(prev => ({ ...prev, [name]: newValue }));
        
        if (name === 'training_sesi_id' && value) {
            loadScheduleReportData(value);
            // Reset schedule report when training session changes
            setFormData(prev => ({ ...prev, report_schedule_id: '' }));
        }
    };

    const handleClear = (fieldName) => {
        setFormData(prev => ({ ...prev, [fieldName]: "" }));
        
        if (fieldName === 'report_schedule_id') {
            setFormData(prev => ({
                ...prev,
                details: [{ report_detail_id: '', report_content_id: '', content_text: '' }]
            }));
            setReportContents([]);
        }
        
        if (fieldName === 'training_sesi_id') {
            setFormData(prev => ({
                ...prev,
                report_schedule_id: '',
                details: [{ report_detail_id: '', report_content_id: '', content_text: '' }]
            }));
            setScheduleReportOptions([]);
            setReportContents([]);
        }
    };

    // Load initial data
    useEffect(() => {
        const loadInitialData = async () => {
            const loadSesi = async () => {
                setLoadingStates(prev => ({ ...prev, trainingSesi: true }));
                try {
                    const data = await fetchTrainingSesi();
                    setTrainingSesiOptions(data.response);
                } catch (err) {
                    console.error('Failed to load training sessions:', err);
                } finally {
                    setLoadingStates(prev => ({ ...prev, trainingSesi: false }));
                }
            };
            
            await loadSesi();
        };

        loadInitialData();
    }, []);

    // Load report contents when schedule report changes
    useEffect(() => {
        const loadReportContents = async () => {
            if (!formData.report_schedule_id) return;
            
            // Find the selected schedule report to get its report_type_id
            const selectedSchedule = scheduleReportOptions.find(
                schedule => schedule.report_schedule_id === formData.report_schedule_id
            );
            
            if (!selectedSchedule?.report_type_id) return;
            
            try {
                const data = await fetchReportContent(selectedSchedule.report_type_id);
                setReportContents(data.response);
                
                // If we already have details from reportData, don't override them
                // Only create new details if they don't exist
                if (data.response && data.response.length > 0) {
                    // Check if we already have details from the existing report
                    const hasExistingDetails = formData.details && 
                        formData.details.length > 0 && 
                        formData.details.some(detail => detail.report_detail_id);
                    
                    if (!hasExistingDetails) {
                        // Create new empty details based on report contents
                        setFormData(prev => ({
                            ...prev,
                            details: data.response.map(item => ({
                                report_detail_id: '',
                                report_content_id: item.report_content_id,
                                content_text: ''
                            }))
                        }));
                    }
                }
            } catch (err) {
                console.error('Failed to load report contents:', err);
            }
        };
        
        loadReportContents();
    }, [formData.report_schedule_id, scheduleReportOptions]);

    // Submit handler
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (isSubmitting) return;

        setIsSubmitting(true);
        setLoading(true);
        setError(null);

        try {
            // Gabungkan file yang sudah ada (yang tidak dihapus) dengan file baru
            const existingAttachments = Object.entries(existingAttachmentsBase64)
                .filter(([id]) => !deletedAttachmentIds.includes(id))
                .map(([id, file]) => file.data); // Ambil base64 data

            // Gabungkan dengan file baru
            const allAttachments = [
                ...existingAttachments,
                ...formData.attachment.map(att => {
                    // Jika attachment sudah berupa string base64, gunakan langsung
                    if (typeof att === 'string') {
                        return att;
                    }
                    // Jika attachment berupa object dengan property data
                    return att.data || att;
                })
            ];

            const updateData = {
                report_id: formData.report_id,
                training_sesi_id: formData.training_sesi_id,
                report_schedule_id: formData.report_schedule_id,
                name: formData.name,
                details: formData.details,
                attachment: allAttachments, // Gunakan gabungan file lama dan baru
                deleted_attachment_ids: deletedAttachmentIds
            };

            await updateReport(updateData);

            await Swal.fire({
                title: 'Berhasil!',
                text: 'Laporan berhasil diperbarui.',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });

            if (onSubmit) {
                await onSubmit(updateData);
            }

            closeModal();

        } catch (error) {
            console.error('Error updating report:', error);
            setError('Gagal memperbarui laporan. Silakan cek kembali input Anda.');
            Swal.fire({
                title: 'Error',
                text: 'Gagal memperbarui laporan: ' + (error.message || 'Silakan cek kembali input Anda'),
                icon: 'error',
            });
        } finally {
            setLoading(false);
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            // onClick={(e) => e.target === e.currentTarget && closeModal()}
            >
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-y-auto max-h-[90vh]"
                // onClick={(e) => e.stopPropagation()}
                >

                {/* Header */}
                <div className="flex justify-between items-center border-b px-6 py-4 bg-gray-50">
                    <h2 className="text-xl font-semibold text-gray-800">Edit Laporan</h2>
                    <button onClick={closeModal} className="text-gray-500 hover:text-gray-700" aria-label="Close">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mx-6 mt-4 p-3 bg-red-50 text-red-700 rounded-md">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
                    {/* Training Session Dropdown */}
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
                                {trainingSesiOptions.map((sesi) => (
                                    <option key={sesi.training_sesi_id} value={sesi.training_sesi_id}>
                                        {sesi.name} ({formatDatetime(sesi.start_date)})
                                    </option>
                                ))}
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
                                ) : null}
                            </div>
                        </div>
                    </div>

                    {/* Schedule Report Dropdown */}
                    <div className="relative">
                        <label htmlFor="report_schedule_id" className="block mb-1 font-medium text-sm text-gray-700">
                            Schedule Report
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
                                {scheduleReportOptions.map((schedule) => (
                                    <option key={schedule.report_schedule_id} value={schedule.report_schedule_id}>
                                        {schedule.name}
                                    </option>
                                ))}
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
                                ) : null}
                            </div>
                        </div>
                    </div>
                    
                    {/* Basic Form Fields */}
                    <div>
                        <label htmlFor="name" className="block mb-1 font-medium text-sm text-gray-700">Nama Laporan</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full border px-3 py-2 rounded focus:outline-none focus:ring focus:border-blue-300"
                            required
                        />
                    </div>
                    {/* Report Details */}
                    {reportContents.length > 0 && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Detail Laporan</label>
                            {reportContents.map((content) => {
                                const detail = formData.details.find(d => d.report_content_id === content.report_content_id) || 
                                              { report_detail_id: '', report_content_id: content.report_content_id, content_text: '' };
                                
                                return (
                                    <div key={content.report_content_id} className="border p-4 mb-2 rounded space-y-2 bg-gray-50">
                                        <label className="text-sm text-gray-600">{content.content_name}</label>
                                        <textarea
                                            value={detail.content_text || ''}
                                            onChange={(e) => {
                                                const updatedDetails = [...formData.details];
                                                const detailIndex = updatedDetails.findIndex(d => d.report_content_id === content.report_content_id);
                                                
                                                if (detailIndex >= 0) {
                                                    updatedDetails[detailIndex].content_text = e.target.value;
                                                } else {
                                                    updatedDetails.push({
                                                        report_detail_id: '',
                                                        report_content_id: content.report_content_id,
                                                        content_text: e.target.value
                                                    });
                                                }
                                                
                                                setFormData(prev => ({ ...prev, details: updatedDetails }));
                                            }}
                                            className="w-full border px-3 py-2 rounded focus:outline-none focus:ring focus:border-blue-300"
                                            rows="3"
                                            required
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* File Attachments */}
                    <div>
                        <label className="block mb-1 font-medium text-sm text-gray-700">Lampiran Dokumen</label>
                        <input
                            type="file"
                            accept="image/*,application/pdf,.doc,.docx"
                            multiple
                            onChange={handleFileChange}
                            className="block w-full border p-2 rounded focus:outline-none focus:ring focus:border-blue-300"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Maksimal ukuran file: 5MB. Format yang didukung: gambar, PDF, DOC, DOCX
                        </p>

                        {/* Loading attachments */}
                        {loadingStates.attachments && (
                            <div className="mt-4 flex items-center justify-center py-4">
                                <Loader2 className="h-5 w-5 animate-spin text-blue-500 mr-2" />
                                <span className="text-sm text-gray-600">Memuat lampiran...</span>
                            </div>
                        )}

                        {/* Existing Attachments */}
                        {Object.keys(attachmentPreviews).length > 0 && (
                            <div className="mt-4 space-y-2">
                                <p className="text-sm text-gray-600 font-semibold">Lampiran Sebelumnya:</p>
                                {Object.entries(attachmentPreviews).map(([id, att]) => (
                                    <div key={id} className="flex items-center justify-between border p-3 rounded bg-blue-50">
                                        <div className="flex items-center">
                                            {att.type === 'image' ? (
                                                <img 
                                                    src={att.data} 
                                                    alt={att.name} 
                                                    className="h-12 w-12 object-cover rounded border mr-3" 
                                                />
                                            ) : (
                                                <div className="h-12 w-12 bg-gray-200 flex items-center justify-center rounded border mr-3">
                                                    <FileText size={20} className="text-gray-500" />
                                                </div>
                                            )}
                                            <span className="text-sm text-gray-700 font-medium">{att.name}</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeExistingAttachment(att.id)}
                                            className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded transition-colors"
                                            title="Hapus lampiran"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* New Attachments */}
                        {formData.attachment.length > 0 && (
                            <div className="mt-4 space-y-2">
                                <p className="text-sm text-gray-600 font-semibold">Lampiran Baru:</p>
                                {formData.attachment.map((att, index) => (
                                    <div key={index} className="flex items-center justify-between border p-3 rounded bg-green-50">
                                        <div className="flex items-center">
                                            {typeof att === 'string' && att.startsWith("data:image") ? (
                                                <img
                                                    src={att}
                                                    alt={`attachment-${index}`}
                                                    className="h-12 w-12 object-cover rounded border mr-3"
                                                />
                                            ) : att?.data?.startsWith("data:image") ? (
                                                <img
                                                    src={att.data}
                                                    alt={att.name || `attachment-${index}`}
                                                    className="h-12 w-12 object-cover rounded border mr-3"
                                                />
                                            ) : (
                                                <div className="h-12 w-12 bg-gray-200 rounded border mr-3 flex items-center justify-center">
                                                    <FileText size={20} className="text-gray-500" />
                                                </div>
                                            )}
                                            <span className="text-sm text-gray-700 font-medium">
                                                {att?.name || `File ${index + 1}`}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeNewAttachment(index)}
                                            className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded transition-colors"
                                            title="Hapus lampiran"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end border-t pt-4 space-x-2">
                        <button
                            type="button"
                            onClick={closeModal}
                            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors disabled:opacity-50"
                            disabled={loading}
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={loading || isSubmitting}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center transition-colors"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Memperbarui...
                                </>
                            ) : (
                                'Perbarui Laporan'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UpdateReportForm;