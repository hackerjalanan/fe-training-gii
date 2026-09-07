import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts';
import { Calendar, Clock, Users, FileText, TrendingUp, Award, BookOpen, Activity, AlertCircle, CheckCircle } from 'lucide-react';
import { fetchStatctTotalReport } from '../../service/statics.service';

const TrainingStatsDashboard = () => {
  const [apiData, setApiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState('month');

  // Function to calculate date ranges based on current date
  const getDateRange = useCallback((range) => {
    const now = new Date();
    const currentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Reset time to 00:00:00
    let startDate, endDate;

    switch (range) {
      case 'week':
        // Get start of current week (Monday)
        const dayOfWeek = currentDate.getDay();
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday = 0, so we need 6 days back
        startDate = new Date(currentDate);
        startDate.setDate(currentDate.getDate() - daysToMonday);
        
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6); // End of week (Sunday)
        break;

      case 'month':
        // Start of current month
        startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        // End of current month
        endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        break;

      case 'quarter':
        // Get current quarter
        const currentQuarter = Math.floor(currentDate.getMonth() / 3);
        startDate = new Date(currentDate.getFullYear(), currentQuarter * 3, 1);
        endDate = new Date(currentDate.getFullYear(), (currentQuarter + 1) * 3, 0);
        break;

      case 'year':
        // Start of current year
        startDate = new Date(currentDate.getFullYear(), 0, 1);
        // End of current year
        endDate = new Date(currentDate.getFullYear(), 11, 31);
        break;

      default:
        // Default to current month
        startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    }

    // Format dates to YYYY-MM-DD
    const formatDate = (date) => {
      return date.toISOString().split('T')[0];
    };

    return {
      startDate: formatDate(startDate),
      endDate: formatDate(endDate)
    };
  }, []);

  const fetchData = useCallback(async (range) => {
    try {
      setLoading(true);
      const { startDate, endDate } = getDateRange(range);
      
      console.log(`Fetching data for ${range}:`, { startDate, endDate });
      
      const data = await fetchStatctTotalReport({ startDate, endDate });
      setApiData(data);
      setError(null);
    } catch (err) {
      setError('Gagal memuat data statistik');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }, [getDateRange]);

  // Initial data fetch
  useEffect(() => {
    fetchData(dateRange);
  }, []);

  // Handle date range change
  const handleDateRangeChange = (newRange) => {
    setDateRange(newRange);
    fetchData(newRange);
  };

  // Get current date range info for display
  const getCurrentDateRangeInfo = useMemo(() => {
    const { startDate, endDate } = getDateRange(dateRange);
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const formatDisplayDate = (date) => {
      return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
    };

    const rangeLabels = {
      week: 'Minggu Ini',
      month: 'Bulan Ini',
      quarter: 'Kuartal Ini',
      year: 'Tahun Ini'
    };

    return {
      label: rangeLabels[dateRange],
      dateRange: `${formatDisplayDate(start)} - ${formatDisplayDate(end)}`,
      startDate,
      endDate
    };
  }, [dateRange, getDateRange]);

  const processedData = useMemo(() => {
    if (!apiData?.response) return null;

    const { response } = apiData;

    // Process status breakdown for pie chart
    const statusData = [
      { name: 'Selesai', value: response.selesai, color: '#10B981' },
      { name: 'Belum Selesai', value: response.belum_selesai, color: '#EF4444' }
    ];

    // Process approval status breakdown
    const approvalStatusData = response.statusBreakdown.map((item, index) => ({
      name: `${item.status_acc} - ${item.acc_director_status}`,
      value: item.count,
      color: ['#3B82F6', '#10B981', '#F59E0B'][index % 3]
    }));

    // Process program data for bar chart
    const programData = response.program_summary.map(program => ({
      program: program.program,
      kelas: program.jumlah_kelas,
      sesi: program.total_sesi
    }));

    // Process trainer performance
    const trainerData = response.trainer_report_stats.map(trainer => ({
      ...trainer,
      completionRate: parseInt(trainer.percent.replace('%', ''))
    }));

    return {
      statusData,
      approvalStatusData,
      programData,
      trainerData,
      summary: response
    };
  }, [apiData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data statistik...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 text-lg">{error}</p>
          <button 
            onClick={() => fetchData(dateRange)} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  if (!processedData) return null;

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Statistik Pelatihan</h1>
          <p className="text-gray-600">Ringkasan lengkap aktivitas pelatihan dan laporan</p>
          {apiData?.metaData && (
            <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
              <CheckCircle className="h-4 w-4 mr-1" />
              {apiData.metaData.message}
            </div>
          )}
        </div>

        {/* Filter with Date Range Display */}
        <div className="mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Periode Data
              </label>
              <select 
                value={dateRange} 
                onChange={(e) => handleDateRangeChange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="week">Minggu Ini</option>
                <option value="month">Bulan Ini</option>
                <option value="quarter">Kuartal Ini</option>
                <option value="year">Tahun Ini</option>
              </select>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-gray-700">{getCurrentDateRangeInfo.label}</div>
              <div className="text-sm text-gray-500">{getCurrentDateRangeInfo.dateRange}</div>
            </div>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Laporan</p>
                <p className="text-3xl font-bold text-gray-900">{processedData.summary.total}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Laporan Selesai</p>
                <p className="text-3xl font-bold text-green-600">{processedData.summary.selesai}</p>
                <p className="text-sm text-gray-500">{processedData.summary.progress_percent} dari total</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Jadwal</p>
                <p className="text-3xl font-bold text-gray-900">{processedData.summary.schedule_report_summary.total_schedule}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Calendar className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Dengan Laporan</p>
                <p className="text-3xl font-bold text-gray-900">{processedData.summary.schedule_report_summary.with_report}</p>
                <p className="text-sm text-gray-500">dari {processedData.summary.schedule_report_summary.total_schedule} jadwal</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <BookOpen className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Report Status Chart */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Laporan</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={processedData.statusData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {processedData.statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Program Distribution */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribusi Program</h3>
            <div className="space-y-4">
              {processedData.programData.map((item, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-100 hover:shadow-sm transition-all">
                  <div className="flex items-start justify-between">
                    <div className="text-gray-900 font-medium">{item.program}</div>
                    <div className="text-right text-sm text-gray-700">
                      <div><span className="font-semibold text-blue-600">{item.kelas}</span> kelas</div>
                      <div><span className="font-semibold text-emerald-600">{item.sesi}</span> sesi</div>
                    </div>
                  </div>
                </div>
              ))}
              <div className="text-sm text-gray-600 text-right italic">
                Total program: {processedData.programData.length}
              </div>
            </div>
          </div>
        </div>

        {/* Approval Status and Trainer Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Approval Status Breakdown */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Persetujuan</h3>

            <div className="space-y-4">
              {processedData.approvalStatusData.map((item, index) => {
                const statusKeterangan = (() => {
                  const managerStatus = item.name.split(' - ')[0];
                  const directorStatus = item.name.split(' - ')[1];

                  return (
                    <div className="text-sm text-gray-500">
                      <span>Manager: <strong>{managerStatus}</strong>, </span>
                      <span>Direktur: <strong>{directorStatus}</strong></span>
                    </div>
                  );
                })();

                return (
                  <div key={index} className="flex items-start justify-between p-4 bg-gray-50 rounded-lg border border-gray-100 hover:shadow transition-all">
                    <div className="flex items-start space-x-3">
                      <div
                        className="w-4 h-4 mt-1 rounded-full"
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <div>
                        <span className="text-gray-900 font-medium">{item.name}</span>
                        {statusKeterangan}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-gray-900">{item.value}</span>
                      <div className="text-sm text-gray-500">laporan</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Trainer Performance */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performa Trainer</h3>
            <div className="space-y-4">
              {processedData.trainerData.map((trainer, index) => (
                <div key={trainer.staff_id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{trainer.name}</span>
                    <span className="text-sm text-gray-500">{trainer.ratio} laporan</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${trainer.completionRate}%` }}
                    ></div>
                  </div>
                  <div className="mt-1 text-sm text-gray-600">
                    Tingkat penyelesaian: {trainer.percent}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Summary Section */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Ringkasan Insights</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• Tingkat penyelesaian laporan mencapai {processedData.summary.progress_percent} dari total {processedData.summary.total} laporan</li>
                <li>• {processedData.summary.schedule_report_summary.with_report} dari {processedData.summary.schedule_report_summary.total_schedule} jadwal sudah memiliki laporan</li>
                <li>• Program "{processedData.programData[0]?.program}" memiliki aktivitas tertinggi</li>
                <li>• {processedData.summary.belum_selesai} laporan masih perlu diselesaikan untuk mencapai target 100%</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainingStatsDashboard;