import React, { useEffect, useState } from 'react';
import { fetchReportList } from '../../service/report.service';
import { showfile } from '../../service/master-data.service';
import jsPDF from 'jspdf';
import { fetchMeetingPresent } from '../../service/present.service';

import { 
  Clock, FileText, User, Calendar, CheckCircle, Paperclip, CalendarPlus,
  X, Maximize, Download, Eye, AlertCircle, SmartphoneCharging, CalendarCheck,
  Users, UserCheck, Shield, Edit3, MessageSquare, FileDown, Building2
} from 'lucide-react';

// Import jsPDF dan html2canvas untuk generate PDF
import html2canvas from 'html2canvas';

const ReportDetailModal = ({ report, onClose }) => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [attachmentPreviews, setAttachmentPreviews] = useState({});
  const [viewingImage, setViewingImage] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [meetingPresenceData, setMeetingPresenceData] = useState(null);
  const [loadingPresence, setLoadingPresence] = useState(false);
  const [presenceError, setPresenceError] = useState(null);

    // Detect if using mobile device
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      return /android|iphone|ipad|ipod|windows phone/i.test(userAgent);
    };
    
    setIsMobile(checkMobile());
  }, []);

  useEffect(() => {
    const fetchReportDetails = async () => {
      if (!report?.report_id) {
        console.error('Report ID is missing');
        setLoading(false);
        return;
      }

      try {
        const data = await fetchReportList({
          report_id: report.report_id,
          size: 1,
        });

        const record = data?.response?.records?.[0];
        setReportData(record || null);

        // Fetch attachments if available
        if (record?.attachments?.length > 0) {
          const previews = {};
          await Promise.all(
            record.attachments.map(async (file) => {
              try {
                const result = await showfile(file.attachment_id);
                previews[file.attachment_id] = {
                  data: result?.response || '',
                  type: detectFileType(result?.response || '', file.name),
                  name: file.name || `file-${file.attachment_id}`
                };
              } catch (error) {
                console.error(`Failed to load attachment ${file.attachment_id}:`, error);
              }
            })
          );
          setAttachmentPreviews(previews);
        }

      } catch (error) {
        console.error('Error fetching report details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReportDetails();
  }, [report]);

  // Auto-load presence data when reportData is available
  useEffect(() => {
    if (reportData && reportData.training_sesi_id && reportData.report_schedule?.meeting_id) {
      handleFetchMeetingPresence(
        reportData.training_sesi_id,
        reportData.report_schedule.meeting_id,
        '' // optional search parameter
      );
    }
  }, [reportData]); // Trigger when reportData changes

  // Function untuk fetch meeting presence
  const handleFetchMeetingPresence = async (trainingSessionId, meetingId, searchQuery = '') => {
    setLoadingPresence(true);
    setPresenceError(null);
    
    try {
      const response = await fetchMeetingPresent(trainingSessionId, meetingId, searchQuery);
      
      if (response?.response) {
        setMeetingPresenceData(response.response);
        console.log('Meeting presence data loaded:', response.response);
      } else {
        setPresenceError('No presence data found');
      }
    } catch (error) {
      console.error('Error fetching meeting presence:', error);
      setPresenceError('Failed to load presence data');
    } finally {
      setLoadingPresence(false);
    }
  };

  // Function untuk handle button click (manual refresh)
  const handleLoadPresenceData = () => {
    if (reportData?.training_sesi_id && reportData?.report_schedule.meeting_id) {
      handleFetchMeetingPresence(
        reportData.training_sesi_id,
        reportData.report_schedule.meeting_id,
        '' // optional search parameter
      );
    } else {
      console.error('Training session ID or meeting ID not found in report data');
      setPresenceError('Required IDs not found in report');
    }
  };


    // Mendeteksi tipe file dari base64 atau nama file
  const detectFileType = (base64, filename = '') => {
    if (!base64) return 'unknown';
    
    // Deteksi dari base64 header
    if (base64.startsWith('data:image')) return 'image';
    if (base64.startsWith('data:application/pdf')) return 'pdf';
    
    // Deteksi dari nama file
    if (filename) {
      const ext = filename.split('.').pop()?.toLowerCase();
      if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext)) return 'image';
      if (ext === 'pdf') return 'pdf';
    }
    
    return 'other';
  };


  // Fungsi untuk generate PDF laporan
  const generateReportPDF = async () => {
  if (!reportData) return;

  setIsGeneratingPDF(true);
  
  try {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = margin;

    const addNewPage = () => {
      pdf.addPage();
      yPosition = margin;
    };

    const checkNewPage = (requiredHeight) => {
      if (yPosition + requiredHeight > pageHeight - margin) {
        addNewPage();
      }
    };

    const wrapText = (text, maxWidth) => {
      return pdf.splitTextToSize(text, maxWidth);
    };

    // Load logo dengan rasio yang benar
    const loadLogo = async () => {
      const response = await fetch('/logo-GI.png');
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    };

    // Fungsi untuk menghitung dimensi logo dengan rasio asli
    const calculateLogoSize = (img, maxWidth = 35, maxHeight = 25) => {
      const ratio = img.width / img.height;
      let width = maxWidth;
      let height = width / ratio;
      
      if (height > maxHeight) {
        height = maxHeight;
        width = height * ratio;
      }
      
      return { width, height };
    };

    // Header dengan logo
    const logoBase64 = await loadLogo();
    const logoImg = new Image();
    logoImg.src = logoBase64;
    await new Promise(resolve => {
      logoImg.onload = () => resolve();
    });

    const logoSize = calculateLogoSize(logoImg);
    pdf.addImage(logoBase64, 'PNG', margin, margin, logoSize.width, logoSize.height);

    // Header kop surat - lebih kompak
    pdf.setFontSize(13);
    pdf.setFont(undefined, 'bold');
    pdf.text('PT. GAMA INFORMATIKA INTEGRA', margin + logoSize.width + 8, margin + 6);
    
    pdf.setFontSize(9);
    pdf.setFont(undefined, 'normal');
    pdf.text('Jl. Puri Niten Asri No.29, Kenayan Wedomartani', margin + logoSize.width + 8, margin + 13);
    pdf.text('Telp: (021) 12345678 | Email: gamainformatikaintegral@gmail.com', margin + logoSize.width + 8, margin + 19);

    yPosition = margin + Math.max(logoSize.height, 25) + 10;

    // Garis pembatas header
    pdf.setLineWidth(0.5);
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 12;

    // Judul laporan
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    pdf.text(reportData.report_schedule?.report_type?.name, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 8;



    // Informasi Umum dengan layout yang lebih fleksibel
    pdf.setFontSize(11);
    pdf.setFont(undefined, 'bold');
    pdf.text('I. INFORMASI KEGIATAN', margin, yPosition);
    yPosition += 8;

    pdf.setFontSize(9);
    pdf.setFont(undefined, 'normal');

    const infoData = [
      ['Jenis Laporan', reportData?.name || '-'],
      ['Training Sesi', reportData.training_sesis?.name || '-'],
      ['Staff Pelapor', reportData.staff?.name || '-'],
      ['Waktu ', formatDate(reportData.start_time)],
      ['Waktu Selesai', formatDate(reportData.finish_time)]
      // ['Status ACC Manager', reportData.status_acc || 'Pending'],
      // ['Status ACC Direktur', reportData.acc_director_status || 'Pending']
    ];

    // Layout informasi dengan gaya lebih natural
    const leftColWidth = 45;
    const colonSpace = 5;
    
    infoData.forEach(([label, value], index) => {
      if (index % 2 === 0 && index > 0) yPosition += 2; // Spacing setiap 2 baris
      
      pdf.setFont(undefined, 'normal');
      pdf.text(label, margin + 3, yPosition);
      pdf.text(':', margin + leftColWidth, yPosition);
      pdf.text(value, margin + leftColWidth + colonSpace, yPosition);
      yPosition += 6;
    });

      yPosition += 8;
  if (reportData.details && reportData.details.length > 0) {
        checkNewPage(25);
        
        pdf.setFontSize(11);
        pdf.setFont(undefined, 'bold');
        pdf.text('II. DETAIL LAPORAN', margin, yPosition);
        yPosition += 10;

        reportData.details.forEach((detail, index) => {
          checkNewPage(20);
          
          pdf.setFontSize(10);
          pdf.setFont(undefined, 'bold');
          pdf.text(`${index + 1}. ${detail.content?.content_name || `Detail ${index + 1}`}`, margin, yPosition);
          yPosition += 6;

          pdf.setFontSize(9);
          pdf.setFont(undefined, 'normal');
          if (detail.content_text) {
            const wrappedText = wrapText(detail.content_text, pageWidth - (margin * 2) - 5);
            wrappedText.forEach(line => {
              checkNewPage(5);
              pdf.text(line, margin + 5, yPosition);
              yPosition += 4.5;
            });
          }

         
        });
      }
    // Bagian "Mengetahui" di halaman pertama
    const currentDate = new Date().toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',  
      day: 'numeric'
    });

    // Cek apakah masih ada ruang di halaman pertama untuk bagian mengetahui
    const signatureSpaceNeeded = 50;
    const remainingSpace = pageHeight - margin - yPosition;
    
    if (remainingSpace >= signatureSpaceNeeded) {
      // Tempatkan di halaman pertama
      yPosition = Math.max(yPosition, pageHeight - margin - 55);
      const leftX = margin + 15;
      const rightX = pageWidth - margin - 45;
      pdf.setFontSize(10);
      pdf.text(`D.I Yogyakarta, ${currentDate}`, pageWidth - margin - 45, yPosition);
      yPosition += 5
      
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'normal');
      pdf.text('Mengetahui,', leftX, yPosition);
      pdf.text('Mengetahui,', rightX, yPosition);
      yPosition += 6; // Jarak dekat antara "Mengetahui," dan role
      

      pdf.text(reportData.atasan?.role?.name || 'Manager', leftX, yPosition);
      pdf.text(reportData.director?.role?.name || 'Direktur', rightX, yPosition);
      yPosition += 35; // Ruang untuk tanda tangan

      pdf.setFont(undefined, 'bold');
      pdf.text(reportData.director?.name, margin + 15, yPosition);
      pdf.text(reportData.atasan?.name || 'Staff Pelapor', pageWidth - margin - 45, yPosition);
    } else {
      // Jika tidak cukup ruang, buat di halaman baru nanti setelah detail
      yPosition += 10;
    }

    // Detail Laporan - mulai halaman baru jika diperlukan
    

    // Jika bagian mengetahui belum ditempatkan, tempatkan sekarang
    if (remainingSpace < signatureSpaceNeeded) {
      checkNewPage(55);
      yPosition += 10;
      
      pdf.setFontSize(10);
      pdf.text(`Jakarta, ${currentDate}`, pageWidth - margin - 45, yPosition);
      yPosition += 15;
      
      pdf.text('Mengetahui,', margin + 15, yPosition);
      pdf.text('Dibuat oleh,', pageWidth - margin - 45, yPosition);
      yPosition += 25;
      
      pdf.setFont(undefined, 'bold');
      pdf.text('Manager', margin + 15, yPosition);
      pdf.text(reportData.staff?.name || 'Staff Pelapor', pageWidth - margin - 45, yPosition);
      yPosition += 20;
    }

    // LAMPIRAN - Ditempatkan paling akhir
    if (reportData.attachments && reportData.attachments.length > 0) {
      // Mulai halaman baru untuk lampiran
      addNewPage();
      
      const imageAttachments = reportData.attachments.filter(file => {
        const fileInfo = attachmentPreviews[file.attachment_id];
        return fileInfo && fileInfo.type === 'image' && fileInfo.data;
      });

      let sectionNumber = reportData.details && reportData.details.length > 0 ? 'III' : 'II';

      // Lampiran Gambar
      if (imageAttachments.length > 0) {
        pdf.setFontSize(11);
        pdf.setFont(undefined, 'bold');
        pdf.text(`${sectionNumber}. LAMPIRAN GAMBAR`, margin, yPosition);
        yPosition += 12;

        for (const file of imageAttachments) {
          const fileInfo = attachmentPreviews[file.attachment_id];
          if (fileInfo?.data) {
            try {
              const img = new Image();
              img.src = fileInfo.data;
              await new Promise((resolve, reject) => {
                img.onload = () => resolve();
                img.onerror = () => reject();
              });

              const imgRatio = img.width / img.height;
              const maxWidth = pageWidth - margin * 2;
              const maxHeight = 100;
              let imgWidth = maxWidth * 0.75;
              let imgHeight = imgWidth / imgRatio;

              if (imgHeight > maxHeight) {
                imgHeight = maxHeight;
                imgWidth = imgHeight * imgRatio;
              }

              checkNewPage(imgHeight + 25);
              
              pdf.setFontSize(9);
              pdf.setFont(undefined, 'bold');
              pdf.text(`Lampiran ${imageAttachments.indexOf(file) + 1}`, margin, yPosition);
              if (fileInfo.name) {
                pdf.setFont(undefined, 'normal');
                // pdf.text(` - ${fileInfo.name}`, margin + 25, yPosition);
              }
              yPosition += 8;
              
              // Center gambar
              const imgX = (pageWidth - imgWidth) / 2;
              pdf.addImage(fileInfo.data, 'JPEG', imgX, yPosition, imgWidth, imgHeight);
              yPosition += imgHeight + 15;
              
            } catch (err) {
              console.error('Gagal memproses gambar:', err);
            }
          }
        }
        sectionNumber = 'IV';
      }

      // Daftar Kehadiran
      if (meetingPresenceData && meetingPresenceData.data && meetingPresenceData.data.length > 0) {
       addNewPage();
        
        pdf.setFontSize(11);
        pdf.setFont(undefined, 'bold');
        pdf.text(`${sectionNumber}. DAFTAR KEHADIRAN`, margin, yPosition);
        yPosition += 8;
        
        // Info meeting
        pdf.setFontSize(9);
        pdf.setFont(undefined, 'normal');
        pdf.text(`Pertemuan: ${meetingPresenceData.meeting}`, margin + 3, yPosition);
        yPosition += 6;
        pdf.text(`Total Peserta: ${meetingPresenceData.filter_info?.total_participants || 0}`, margin + 3, yPosition);
        yPosition += 10;
        
        // Header tabel
        pdf.setFontSize(8);
        pdf.setFont(undefined, 'bold');
        
        // Background header
        pdf.setFillColor(240, 240, 240);
        pdf.rect(margin, yPosition - 5, pageWidth - 2 * margin, 10, 'F');
        
        // Header columns
        const colWidths = [15, 60, 50, 35, 25];
        let xPos = margin + 2;
        
        pdf.text('No.', xPos, yPosition);
        xPos += colWidths[0];
        
        pdf.text('Nama', xPos, yPosition);
        xPos += colWidths[1];
        
        pdf.text('Instansi', xPos, yPosition);
        xPos += colWidths[2];
        
     
        
        pdf.text('Status', xPos, yPosition);
        
        yPosition += 8;
        
        // Line under header
        pdf.setLineWidth(0.1);
        pdf.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 5;
        
        // Data rows
        pdf.setFont(undefined, 'normal');
        meetingPresenceData.data.forEach((participant, index) => {
          checkNewPage(15);
          
          xPos = margin + 2;
          
          // Nomor
          pdf.text(`${index + 1}.`, xPos, yPosition);
          xPos += colWidths[0];
          
          // Nama
          const name = participant.name || '-';
          pdf.text(name.length > 25 ? name.substring(0, 20) + '...' : name, xPos, yPosition);
          xPos += colWidths[1];
          
          // Instansi
          const agency = participant.agency || '-';
          pdf.text(agency.length > 20 ? agency.substring(0, 20) + '...' : agency, xPos, yPosition);
          xPos += colWidths[2];
          
       
          
          // Status dengan warna
          const status = participant.presences?.status || '-';
          const displayStatus = status === '-' ? 'Not Set' : status;
          
          // Set color based on status
          if (status === 'hadir') {
            pdf.setTextColor(0, 128, 0); // Green
          } else if (status === 'izin') {
            pdf.setTextColor(0, 0, 255); // Blue
          } else if (status === 'absen') {
            pdf.setTextColor(255, 0, 0); // Red
          } else {
            pdf.setTextColor(128, 128, 128); // Gray
          }
          
          pdf.text(displayStatus, xPos, yPosition);
          pdf.setTextColor(0, 0, 0); // Reset to black
          
          yPosition += 8;
          
          // Light separator line every 5 rows
          if ((index + 1) % 5 === 0) {
            pdf.setDrawColor(220, 220, 220);
            pdf.setLineWidth(0.05);
            pdf.line(margin, yPosition, pageWidth - margin, yPosition);
            pdf.setDrawColor(0, 0, 0);
            yPosition += 2;
          }
        });
        
        // Summary statistics
        yPosition += 8;
        checkNewPage(20);
        
        pdf.setFont(undefined, 'bold');
        pdf.text('Ringkasan Kehadiran:', margin + 3, yPosition);
        yPosition += 8;
        
        pdf.setFont(undefined, 'normal');
        
        // Count status
        const statusCounts = {
          hadir: 0,
          izin: 0,
          absen: 0,
          notSet: 0
        };
        
        meetingPresenceData.data.forEach(participant => {
          const status = participant.presences?.status;
          if (status === 'hadir') statusCounts.hadir++;
          else if (status === 'izin') statusCounts.izin++;
          else if (status === 'absen') statusCounts.absen++;
          else statusCounts.notSet++;
        });
        
        pdf.setTextColor(0, 128, 0);
        pdf.text(`• Hadir: ${statusCounts.hadir} orang`, margin + 6, yPosition);
        yPosition += 6;
        
        pdf.setTextColor(0, 0, 255);
        pdf.text(`• Izin: ${statusCounts.izin} orang`, margin + 6, yPosition);
        yPosition += 6;
        
        pdf.setTextColor(255, 0, 0);
        pdf.text(`• Absen: ${statusCounts.absen} orang`, margin + 6, yPosition);
        yPosition += 6;
        
        pdf.setTextColor(128, 128, 128);
        pdf.text(`• Belum Diset: ${statusCounts.notSet} orang`, margin + 6, yPosition);
        
        pdf.setTextColor(0, 0, 0); // Reset color
        yPosition += 10;
      }

      // Footer dengan nomor halaman
      const totalPages = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        
        // Footer line
        pdf.setLineWidth(0.1);
        pdf.line(margin, pageHeight - 18, pageWidth - margin, pageHeight - 18);
        
        pdf.text(`Hal. ${i}/${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
        pdf.text(`Dicetak: ${new Date().toLocaleString('id-ID')}`, margin, pageHeight - 10);
        pdf.text('PT. Gama Informatika Integra', pageWidth - margin, pageHeight - 10, { align: 'right' });
      }

      // Generate filename
      const fileName = `Laporan_${reportData.name?.replace(/[^a-z0-9]/gi, '_') || 'Kegiatan'}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
    }

    // Footer dengan nomor halaman
    const totalPages = pdf.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      
      // Footer line
      pdf.setLineWidth(0.1);
      pdf.line(margin, pageHeight - 18, pageWidth - margin, pageHeight - 18);
      
      pdf.text(`Hal. ${i}/${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      pdf.text(`Dicetak: ${new Date().toLocaleString('id-ID')}`, margin, pageHeight - 10);
      pdf.text('PT. Gama Informatika Integra', pageWidth - margin, pageHeight - 10, { align: 'right' });
    }

    // Generate filename
    const fileName = `Laporan_${reportData.name?.replace(/[^a-z0-9]/gi, '_') || 'Kegiatan'}_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Terjadi kesalahan saat membuat PDF. Silakan coba lagi.');
  }
  }


  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 flex flex-col items-center">
          <div className="w-12 h-12 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-700">Memuat detail laporan...</p>
        </div>
      </div>
    );
  }

  if (!reportData) return null;

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Component untuk modal preview gambar
  const ImageViewerModal = ({ src, alt, onClose }) => {
    if (!src) return null;

    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[60] p-4"
        onClick={() => onClose()}
      >
        <div className="relative max-w-4xl w-full h-full flex items-center justify-center">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="absolute top-4 right-4 bg-white bg-opacity-25 hover:bg-opacity-40 rounded-full p-2 transition-all"
            aria-label="Close"
          >
            <X size={24} className="text-white" />
          </button>
          
          <div 
            className="max-w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={src}
              alt={alt || "Preview gambar"}
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            />
          </div>
          
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-4">
            <a
              href={src}
              download={alt}
              className="bg-white bg-opacity-30 hover:bg-opacity-50 text-white px-4 py-2 rounded-full flex items-center transition-all"
              onClick={(e) => e.stopPropagation()}
            >
              <Download size={16} className="mr-2" />
              Download
            </a>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
       
      >
        <div
          className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
         
        >
          {/* Header */}
          <div className="px-6 py-4 border-b flex justify-between items-center sticky top-0 bg-white z-10">
            <h2 className="text-xl font-semibold text-gray-800">Detail Laporan</h2>
            <div className="flex items-center space-x-3">
              {/* Tombol Download PDF */}
              <button
                onClick={generateReportPDF}
                disabled={isGeneratingPDF}
                className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isGeneratingPDF 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
                }`}
              >
                {isGeneratingPDF ? (
                  <>
                    <div className="w-4 h-4 border-t-2 border-white border-solid rounded-full animate-spin mr-2"></div>
                    Membuat PDF...
                  </>
                ) : (
                  <>
                    <FileDown size={16} className="mr-2" />
                    Download PDF
                  </>
                )}
              </button>
              
              <button
                onClick={onClose}
                className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Report information */}
            <div className="space-y-6">
              {/* Main information */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-lg text-blue-800 mb-3">{reportData.name}</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Jenis Laporan */}
                  <div className="flex items-center">
                    <FileText size={18} className="text-blue-600 mr-2 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-500">Nama Laporan</p>
                      <p className="font-medium">{reportData.report_schedule?.report_type?.name || '-'}</p>
                    </div>
                  </div>

                  {/* Training Mode & Location */}
                  <div className="flex items-center">
                    <Calendar size={18} className="text-blue-600 mr-2 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-500">Mode & Lokasi</p>
                      <p className="font-medium">
                        {reportData.training_sesis?.meeting_mode || '-'} - {reportData.training_sesis?.location || '-'}
                      </p>
                    </div>
                  </div>

                  {/* Training Session */}
                  <div className="flex items-center">
                    <Calendar size={18} className="text-blue-600 mr-2 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-500">Training Sesi</p>
                      <p className="font-medium">{reportData.training_sesis?.name || '-'}</p>
                    </div>
                  </div>

                  {/* Jumlah Peserta */}
                   {meetingPresenceData && (
                  <div className="flex items-center">
                    <Users size={18} className="text-blue-600 mr-2 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-500">Jumlah Peserta</p>
                      <p className="font-medium">{meetingPresenceData.filter_info?.total_participants || '-'}</p>
                    </div>
                  </div>
                   )}
                </div>
              </div>

              {/* Staff and status */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-start">
                  <User size={18} className="text-gray-600 mr-2 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500">Staff</p>
                    <p className="font-medium">{reportData.staff?.name || '-'}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle size={18} className="text-gray-600 mr-2 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500">Status ACC Manager</p>
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      reportData.status_acc === 'disetujui' 
                        ? 'bg-green-100 text-green-800' 
                        : reportData.status_acc === 'ditolak'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {reportData.status_acc || 'Pending'}
                    </div>
                  </div>
                </div>
                <div className="flex items-start">
                  <Shield size={18} className="text-gray-600 mr-2 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500">Status ACC Direktur</p>
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      reportData.acc_director_status === 'disetujui' 
                        ? 'bg-green-100 text-green-800' 
                        : reportData.acc_director_status === 'ditolak'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {reportData.acc_director_status || 'Pending'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Report Details Section */}
              {reportData.details && reportData.details.length > 0 && (
                <div className="border rounded-lg p-5 bg-gray-50">
                  <div className="flex items-center mb-4">
                    <Edit3 size={18} className="text-gray-600 mr-2" />
                    <h4 className="font-medium text-gray-700">Detail Laporan</h4>
                  </div>
                  
                  <div className="space-y-4">
                    {reportData.details.map((detail, index) => (
                      <div key={detail.report_detail_id} className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            <MessageSquare size={16} className="text-blue-500 mt-0.5" />
                          </div>
                          <div className="flex-grow">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-medium text-gray-800">
                                {detail.content?.content_name || `Detail ${index + 1}`}
                              </h5>
                              <span className="text-xs text-gray-400">
                                {formatDate(detail.created_at)}
                              </span>
                            </div>
                            <div className="text-gray-700 whitespace-pre-wrap break-words">
                              {detail.content_text || '-'}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <h4 className="font-medium text-gray-700 mb-3 flex items-center">
                  <Clock size={16} className="mr-2 text-gray-600" />
                  Timeline
                </h4>

                <div className="space-y-4 pl-6 border-l-2 border-gray-200">
                  <div className="relative flex items-start gap-2">
                    <Clock className="w-5 h-5 text-blue-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Waktu Mulai</p>
                      <p className="font-medium">{formatDate(reportData.start_time)}</p>
                    </div>
                  </div>
                  
                  <div className="relative flex items-start gap-2">
                    <CalendarCheck className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Waktu Selesai</p>
                      <p className="font-medium">{formatDate(reportData.finish_time)}</p>
                    </div>
                  </div>
                  
                  <div className="relative flex items-start gap-2">
                    <CalendarPlus className="w-5 h-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Dibuat Pada</p>
                      <p className="font-medium">{formatDate(reportData.created_at)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Attachments */}
              <div className="border rounded-lg p-5">
                <div className="flex items-center mb-4">
                  <Paperclip size={18} className="text-gray-600 mr-2" />
                  <h4 className="font-medium text-gray-700">Lampiran</h4>
                </div>

                {reportData.attachments && reportData.attachments.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {reportData.attachments.map((file) => {
                      const fileInfo = attachmentPreviews[file.attachment_id];
                      if (!fileInfo) {
                        return (
                          <div 
                            key={file.attachment_id} 
                            className="border rounded-lg p-3 bg-gray-50 flex items-center justify-center h-32"
                          >
                            <div className="text-center">
                              <div className="w-6 h-6 border-t-2 border-blue-500 border-solid rounded-full animate-spin mx-auto mb-2"></div>
                              <p className="text-gray-400 italic">Memuat preview...</p>
                            </div>
                          </div>
                        );
                      }
                      
                      const { data, type, name } = fileInfo;
                      
                      if (type === 'image') {
                        return (
                          <div 
                            key={file.attachment_id} 
                            className="border rounded-lg p-3 bg-gray-50 hover:bg-gray-100 transition-colors group"
                          >
                            <div className="flex flex-col items-center">
                              <div className="relative cursor-pointer mb-2 overflow-hidden rounded-lg">
                                <img
                                  src={data}
                                  alt={name}
                                  className="max-h-32 object-contain rounded w-full"
                                />
                                <div 
                                  className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 flex items-center justify-center transition-all rounded"
                                  onClick={() => setViewingImage({ src: data, alt: name })}
                                >
                                  <Maximize size={24} className="text-white transform scale-0 group-hover:scale-100 transition-transform" />
                                </div>
                              </div>
                              <p className="text-sm text-gray-700 font-medium text-center truncate max-w-[180px] mb-2">
                                {/* {name || `Image-${file.attachment_id}`} */}
                              </p>
                              <div className="flex space-x-3 mt-1">
                                <button
                                  onClick={() => setViewingImage({ src: data, alt: name })}
                                  className="text-blue-600 text-sm hover:underline flex items-center"
                                >
                                  <Eye size={14} className="mr-1" />
                                  Lihat
                                </button>
                                <a
                                  href={data}
                                  download={name}
                                  className="text-blue-600 text-sm hover:underline flex items-center"
                                >
                                  <Download size={14} className="mr-1" />
                                  Download
                                </a>
                              </div>
                            </div>
                          </div>
                        );
                      } else if (type === 'pdf') {
                        return (
                          <div 
                            key={file.attachment_id} 
                            className="border rounded-lg p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex flex-col items-center py-3">
                              <div className="relative cursor-pointer">
                                <div className="bg-red-50 p-3 rounded-lg mb-2">
                                  <FileText size={36} className="text-red-500" />
                                </div>
                                <p className="text-center text-gray-800 font-medium truncate max-w-[180px] mb-3">
                                  {/* {name || `PDF-${file.attachment_id}`} */}
                                </p>
                              </div>
                              <div className="flex justify-center">
                                <a
                                  href={data}
                                  download={name}
                                  className="bg-blue-50 text-blue-600 px-4 py-2 rounded hover:bg-blue-100 transition-colors flex items-center text-sm"
                                >
                                  <Download size={16} className="mr-2" />
                                  Download PDF
                                </a>
                              </div>
                            </div>
                          </div>
                        );
                      } else {
                        return (
                          <div 
                            key={file.attachment_id} 
                            className="border rounded-lg p-3 bg-gray-50 flex flex-col items-center justify-center"
                          >
                            <FileText size={36} className="text-gray-500 mb-2" />
                            <p className="text-center text-gray-800 font-medium truncate max-w-[180px] mb-3">
                              {/* {name || `File-${file.attachment_id}`} */}
                            </p>
                            <a
                              href={data}
                              download={name}
                              className="bg-gray-100 text-gray-700 px-3 py-1 rounded hover:bg-gray-200 transition-colors flex items-center text-sm"
                            >
                              <Download size={14} className="mr-1" />
                              Download
                            </a>
                          </div>
                        );
                      }
                    })}
                  </div>
                ) : (
                  <div className="flex items-center justify-center p-8 bg-gray-50 rounded-lg border border-dashed">
                    <p className="text-gray-500 italic">Tidak ada lampiran</p>
                  </div>
                )}
              </div>

              {/* //-------present-- */}

              {reportData && (
                <div className="mt-6 border-t pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Meeting Presence
                    </h3>

                  </div>

                  {/* Error state */}
                  {presenceError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center gap-2 text-red-800">
                        <AlertCircle className="h-5 w-5" />
                        <span>{presenceError}</span>
                      </div>
                    </div>
                  )}

                  {/* Presence data display */}
                  {meetingPresenceData && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="mb-4">
                        <h4 className="font-semibold text-gray-800 mb-2">
                          {meetingPresenceData.meeting}
                        </h4>
                        <p className="text-sm text-gray-600">
                          Total Peserta: {meetingPresenceData.filter_info?.total_participants || 0}
                        </p>
                      </div>

                      {/* Participants list */}
                      <div className="space-y-3">
                        {meetingPresenceData.data?.map((participant) => (
                          <div key={participant.participant_id} className="bg-white rounded-lg p-4 border">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <User className="h-4 w-4 text-gray-500" />
                                  <span className="font-medium">{participant.name}</span>
                                </div>
                                <div className="text-sm text-gray-600 mb-1">
                                  <Building2 className="h-3 w-3 inline mr-1" />
                                  {participant.agency}
                                </div>
                                {/* <div className="text-sm text-gray-600">
                                  {participant.email}
                                </div> */}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  participant.presences?.status === '-' 
                                    ? 'bg-gray-100 text-gray-600' 
                                    : participant.presences?.status === 'hadir'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {participant.presences?.status === '-' ? 'Not Set' : participant.presences?.status}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {meetingPresenceData.data?.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No participants found</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Image Preview Modal */}
      {viewingImage && (
        <ImageViewerModal 
          src={viewingImage.src}
          alt={viewingImage.alt}
          onClose={() => setViewingImage(null)}
        />
      )}
    </>
  );
};

export default ReportDetailModal;