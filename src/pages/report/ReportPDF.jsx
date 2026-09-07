import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Function to format date for PDF
// reportpdf
function formatDateForPDF(startTime, finishTime) {
  const start = new Date(startTime);
  const finish = new Date(finishTime);
  const sameDate = start.toDateString() === finish.toDateString();
  
  const optionsDate = { 
    day: '2-digit', 
    month: 'long', 
    year: 'numeric',
    timeZone: 'Asia/Jakarta'
  };
  const optionsTime = { 
    hour: '2-digit', 
    minute: '2-digit',
    timeZone: 'Asia/Jakarta'
  };

  if (sameDate) {
    return `${start.toLocaleDateString('id-ID', optionsDate)}\nPukul ${start.toLocaleTimeString('id-ID', optionsTime)} - ${finish.toLocaleTimeString('id-ID', optionsTime)} WIB`;
  } else {
    return `${start.toLocaleDateString('id-ID', optionsDate)} pukul ${start.toLocaleTimeString('id-ID', optionsTime)} WIB\nsampai dengan\n${finish.toLocaleDateString('id-ID', optionsDate)} pukul ${finish.toLocaleTimeString('id-ID', optionsTime)} WIB`;
  }
}

// Function to get status text in Indonesian
function getStatusText(status) {
  switch(status) {
    case 'disetujui': return 'Disetujui';
    case 'ditolak': return 'Ditolak';
    case 'menunggu': return 'Menunggu Persetujuan';
    default: return 'Menunggu Persetujuan';
  }
}

// Main PDF export function
export const handleExportPDF = (reports, currentUser, filters = {}) => {
  try {
    // Create new PDF document
    const doc = new jsPDF('p', 'mm', 'a4');
    
    // Page dimensions
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    
    // Colors
    const primaryColor = [41, 98, 255]; // Blue
    const secondaryColor = [107, 114, 128]; // Gray
    const headerBgColor = [243, 244, 246]; // Light gray
    
    // Add company header/letterhead
    addOfficialHeader(doc, pageWidth, margin, primaryColor);
    
    // Add document title
    let yPosition = addDocumentTitle(doc, pageWidth, margin, primaryColor);
    
    // Add report metadata
    yPosition = addReportMetadata(doc, margin, yPosition, currentUser, reports.length, filters);
    
    // Add reports table
    yPosition = addReportsTable(doc, reports, yPosition, margin, pageWidth, primaryColor, secondaryColor, headerBgColor);
    
    // Add footer
    addOfficialFooter(doc, pageWidth, pageHeight, margin, secondaryColor);
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `Laporan_Pelatihan_${timestamp}.pdf`;
    
    // Save the PDF
    doc.save(filename);
    
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Gagal membuat file PDF: ' + error.message);
  }
};

// Function to add official header
function addOfficialHeader(doc, pageWidth, margin, primaryColor) {
  // Company logo placeholder (you can replace with actual base64 image)
  // doc.addImage(logoBase64, 'PNG', margin, margin, 25, 25);
  
  // Company header
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('PT. NAMA PERUSAHAAN', margin + 30, margin + 8);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('Jl. Alamat Perusahaan No. 123, Kota, Provinsi 12345', margin + 30, margin + 15);
  doc.text('Telp: (021) 1234-5678 | Email: info@perusahaan.com', margin + 30, margin + 20);
  
  // Horizontal line
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryCode[2]);
  doc.setLineWidth(0.5);
  doc.line(margin, margin + 28, pageWidth - margin, margin + 28);
  
  return margin + 35;
}

// Function to add document title
function addDocumentTitle(doc, pageWidth, margin, primaryColor) {
  const yPos = 70;
  
  // Main title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  const titleText = 'LAPORAN REKAPITULASI KEGIATAN PELATIHAN';
  const titleWidth = doc.getTextWidth(titleText);
  doc.text(titleText, (pageWidth - titleWidth) / 2, yPos);
  
  // Underline
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(0.3);
  doc.line((pageWidth - titleWidth) / 2, yPos + 2, (pageWidth + titleWidth) / 2, yPos + 2);
  
  return yPos + 15;
}

// Function to add report metadata
function addReportMetadata(doc, margin, yPosition, currentUser, totalReports, filters) {
  const currentDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long', 
    year: 'numeric',
    timeZone: 'Asia/Jakarta'
  });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  
  // Report info
  const reportInfo = [
    `Tanggal Cetak: ${currentDate}`,
    `Dicetak oleh: ${currentUser}`,
    `Total Laporan: ${totalReports} item`,
    filters.statusFilter ? `Filter Status: ${getStatusText(filters.statusFilter)}` : '',
    filters.searchTerm ? `Kata Kunci: "${filters.searchTerm}"` : ''
  ].filter(Boolean);
  
  reportInfo.forEach((info, index) => {
    doc.text(info, margin, yPosition + (index * 5));
  });
  
  return yPosition + (reportInfo.length * 5) + 10;
}

// Function to add reports table
function addReportsTable(doc, reports, yPosition, margin, pageWidth, primaryColor, secondaryColor, headerBgColor) {
  if (reports.length === 0) {
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text('Tidak ada data laporan untuk ditampilkan.', margin, yPosition + 20);
    return yPosition + 40;
  }
  
  // Prepare table data
  const tableData = reports.map((report, index) => [
    (index + 1).toString(),
    report.name || '-',
    report.report_schedule?.report_type?.name || '-',
    report.staff?.name || '-',
    formatDateForPDF(report.start_time, report.finish_time),
    getStatusText(report.status_acc),
    getStatusText(report.acc_director_status)
  ]);
  
  // Table configuration
  const tableConfig = {
    startY: yPosition,
    margin: { left: margin, right: margin },
    theme: 'grid',
    headStyles: {
      fillColor: headerBgColor,
      textColor: [60, 60, 60],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'center',
      valign: 'middle'
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [40, 40, 40],
      valign: 'top'
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 15 }, // No
      1: { cellWidth: 40 }, // Nama Laporan
      2: { cellWidth: 30 }, // Kategori
      3: { cellWidth: 25 }, // Petugas
      4: { cellWidth: 35 }, // Tanggal
      5: { halign: 'center', cellWidth: 20 }, // Status Manager
      6: { halign: 'center', cellWidth: 20 }  // Status Direktur
    },
    tableLineColor: [200, 200, 200],
    tableLineWidth: 0.1,
    showHead: 'everyPage',
    didDrawPage: function(data) {
      // Add page number
      const pageNum = doc.internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(`Halaman ${data.pageNumber} dari ${pageNum}`, 
        pageWidth - margin - 30, 
        doc.internal.pageSize.height - 10
      );
    }
  };
  
  // Add table
  doc.autoTable({
    head: [[
      'No',
      'Nama Laporan',
      'Kategori',
      'Petugas',
      'Tanggal & Waktu',
      'Status\nManager',
      'Status\nDirektur'
    ]],
    body: tableData,
    ...tableConfig
  });
  
  return doc.lastAutoTable.finalY + 20;
}

// Function to add official footer
function addOfficialFooter(doc, pageWidth, pageHeight, margin, secondaryColor) {
  const footerY = pageHeight - 30;
  
  // Signature section
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  
  // Date and place
  const currentDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta'
  });
  
  doc.text(`Jakarta, ${currentDate}`, pageWidth - margin - 60, footerY);
  
  // Signature blocks
  const signatureY = footerY + 10;
  
  // Left signature - Dibuat oleh
  doc.text('Dibuat oleh,', margin, signatureY);
  doc.text('_____________________', margin, signatureY + 25);
  doc.text('Staff Pelatihan', margin, signatureY + 30);
  
  // Right signature - Disetujui oleh  
  doc.text('Disetujui oleh,', pageWidth - margin - 60, signatureY);
  doc.text('_____________________', pageWidth - margin - 60, signatureY + 25);
  doc.text('Manager Pelatihan', pageWidth - margin - 60, signatureY + 30);
  
  // Footer line
  doc.setDrawColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setLineWidth(0.2);
  doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
  
  // Footer text
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text('Dokumen ini dibuat secara otomatis oleh sistem dan telah terverifikasi.', 
    margin, pageHeight - 8);
}