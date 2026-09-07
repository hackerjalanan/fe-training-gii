import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, BookOpen, Trophy, TrendingUp, Calendar, Award, Activity, Target } from 'lucide-react';

const StatisticParticipant = () => {
  // Sample data - dalam implementasi nyata, data ini akan diambil dari API
  const [participants] = useState([
    { id: 1, name: 'Ahmad Rizki', class: 'Web Development', age: 25, position: 'Developer', institution: 'PT Tech Solutions', attendance: 95, finalScore: 85, status: 'Lulus', active: true, batch: '2024-A', joinDate: '2024-01-15' },
    { id: 2, name: 'Sari Dewi', class: 'Data Science', age: 28, position: 'Analyst', institution: 'Bank ABC', attendance: 88, finalScore: 78, status: 'Lulus', active: true, batch: '2024-A', joinDate: '2024-01-20' },
    { id: 3, name: 'Budi Santoso', class: 'Web Development', age: 30, position: 'Manager', institution: 'Startup XYZ', attendance: 92, finalScore: 82, status: 'Lulus', active: false, batch: '2024-B', joinDate: '2024-02-10' },
    { id: 4, name: 'Nina Kusuma', class: 'Mobile App', age: 26, position: 'Designer', institution: 'Creative Agency', attendance: 75, finalScore: 65, status: 'Tidak Lulus', active: true, batch: '2024-B', joinDate: '2024-02-15' },
    { id: 5, name: 'Eko Prasetyo', class: 'Data Science', age: 32, position: 'Senior Analyst', institution: 'Consulting Firm', attendance: 98, finalScore: 92, status: 'Lulus', active: true, batch: '2024-A', joinDate: '2024-01-25' },
    { id: 6, name: 'Maya Sari', class: 'Mobile App', age: 24, position: 'Junior Developer', institution: 'Tech Startup', attendance: 85, finalScore: 75, status: 'Lulus', active: true, batch: '2024-C', joinDate: '2024-03-05' },
    { id: 7, name: 'Rudi Hartono', class: 'Web Development', age: 29, position: 'Lead Developer', institution: 'Software House', attendance: 90, finalScore: 88, status: 'Lulus', active: true, batch: '2024-C', joinDate: '2024-03-10' },
    { id: 8, name: 'Lisa Permata', class: 'Data Science', age: 27, position: 'Data Scientist', institution: 'E-commerce', attendance: 93, finalScore: 89, status: 'Lulus', active: false, batch: '2024-B', joinDate: '2024-02-20' },
  ]);

  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [selectedClass, setSelectedClass] = useState('all');

  // Filter data berdasarkan periode dan kelas
  const filteredData = useMemo(() => {
    let filtered = participants;
    
    if (selectedClass !== 'all') {
      filtered = filtered.filter(p => p.class === selectedClass);
    }
    
    if (selectedPeriod !== 'all') {
      const currentDate = new Date();
      const filterDate = new Date();
      
      switch (selectedPeriod) {
        case 'month':
          filterDate.setMonth(currentDate.getMonth() - 1);
          break;
        case 'quarter':
          filterDate.setMonth(currentDate.getMonth() - 3);
          break;
        case 'year':
          filterDate.setFullYear(currentDate.getFullYear() - 1);
          break;
      }
      
      filtered = filtered.filter(p => new Date(p.joinDate) >= filterDate);
    }
    
    return filtered;
  }, [participants, selectedPeriod, selectedClass]);

  // Statistik dasar
  const basicStats = useMemo(() => {
    const totalParticipants = filteredData.length;
    const activeParticipants = filteredData.filter(p => p.active).length;
    const passedParticipants = filteredData.filter(p => p.status === 'Lulus').length;
    const avgAttendance = filteredData.reduce((sum, p) => sum + p.attendance, 0) / totalParticipants || 0;
    
    return {
      total: totalParticipants,
      active: activeParticipants,
      passed: passedParticipants,
      avgAttendance: avgAttendance.toFixed(1)
    };
  }, [filteredData]);

  // Data untuk chart peserta per kelas
  const classData = useMemo(() => {
    const classCount = {};
    filteredData.forEach(p => {
      classCount[p.class] = (classCount[p.class] || 0) + 1;
    });
    return Object.entries(classCount).map(([name, value]) => ({ name, value }));
  }, [filteredData]);

  // Data distribusi usia
  const ageData = useMemo(() => {
    const ageGroups = { '20-25': 0, '26-30': 0, '31-35': 0, '36+': 0 };
    filteredData.forEach(p => {
      if (p.age <= 25) ageGroups['20-25']++;
      else if (p.age <= 30) ageGroups['26-30']++;
      else if (p.age <= 35) ageGroups['31-35']++;
      else ageGroups['36+']++;
    });
    return Object.entries(ageGroups).map(([name, value]) => ({ name, value }));
  }, [filteredData]);

  // Data distribusi jabatan
  const positionData = useMemo(() => {
    const positionCount = {};
    filteredData.forEach(p => {
      positionCount[p.position] = (positionCount[p.position] || 0) + 1;
    });
    return Object.entries(positionCount).map(([name, value]) => ({ name, value }));
  }, [filteredData]);

  // Data kehadiran per sesi (simulasi)
  const attendanceData = useMemo(() => {
    return [
      { sesi: 'Sesi 1', kehadiran: 95 },
      { sesi: 'Sesi 2', kehadiran: 92 },
      { sesi: 'Sesi 3', kehadiran: 88 },
      { sesi: 'Sesi 4', kehadiran: 90 },
      { sesi: 'Sesi 5', kehadiran: 85 },
      { sesi: 'Sesi 6', kehadiran: 87 },
    ];
  }, []);

  // Data perbandingan per angkatan
  const batchData = useMemo(() => {
    const batchCount = {};
    filteredData.forEach(p => {
      batchCount[p.batch] = (batchCount[p.batch] || 0) + 1;
    });
    return Object.entries(batchCount).map(([name, value]) => ({ name, value }));
  }, [filteredData]);

  // Data status kelulusan
  const passStatusData = useMemo(() => {
    const statusCount = { 'Lulus': 0, 'Tidak Lulus': 0 };
    filteredData.forEach(p => {
      statusCount[p.status]++;
    });
    return Object.entries(statusCount).map(([name, value]) => ({ name, value }));
  }, [filteredData]);

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <div className="bg-white rounded-lg shadow-md p-6 border-l-4" style={{ borderLeftColor: color }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <Icon className="h-12 w-12" style={{ color }} />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Statistik Peserta Pelatihan</h1>
          <p className="text-gray-600">Dashboard analisis dan laporan peserta pelatihan</p>
        </div>

        {/* Filter Controls */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Periode</label>
              <select 
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Semua Periode</option>
                <option value="month">1 Bulan Terakhir</option>
                <option value="quarter">3 Bulan Terakhir</option>
                <option value="year">1 Tahun Terakhir</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Kelas</label>
              <select 
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Semua Kelas</option>
                <option value="Web Development">Web Development</option>
                <option value="Data Science">Data Science</option>
                <option value="Mobile App">Mobile App</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Peserta"
            value={basicStats.total}
            icon={Users}
            color="#3B82F6"
            subtitle="Peserta terdaftar"
          />
          <StatCard
            title="Peserta Aktif"
            value={basicStats.active}
            icon={Activity}
            color="#10B981"
            subtitle={`${((basicStats.active / basicStats.total) * 100).toFixed(1)}% dari total`}
          />
          <StatCard
            title="Tingkat Kelulusan"
            value={`${((basicStats.passed / basicStats.total) * 100).toFixed(1)}%`}
            icon={Trophy}
            color="#F59E0B"
            subtitle={`${basicStats.passed} peserta lulus`}
          />
          <StatCard
            title="Rata-rata Kehadiran"
            value={`${basicStats.avgAttendance}%`}
            icon={Target}
            color="#EF4444"
            subtitle="Kehadiran keseluruhan"
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Peserta per Kelas */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Peserta per Kelas</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={classData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Distribusi Usia */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribusi Usia</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={ageData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {ageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Kehadiran per Sesi */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Persentase Kehadiran per Sesi</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="sesi" />
                <YAxis domain={[70, 100]} />
                <Tooltip formatter={(value) => [`${value}%`, 'Kehadiran']} />
                <Line type="monotone" dataKey="kehadiran" stroke="#10B981" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Status Kelulusan */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Kelulusan</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={passStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {passStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.name === 'Lulus' ? '#10B981' : '#EF4444'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Additional Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Distribusi Jabatan */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribusi Jabatan</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={positionData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Peserta per Angkatan */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Peserta per Angkatan</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={batchData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#06B6D4" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detailed Statistics Table */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Detail Statistik Peserta</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kelas</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jabatan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kehadiran</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nilai Akhir</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Angkatan</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.map((participant) => (
                  <tr key={participant.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {participant.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {participant.class}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {participant.position}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${participant.attendance}%` }}
                          ></div>
                        </div>
                        {participant.attendance}%
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {participant.finalScore}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        participant.status === 'Lulus' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {participant.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {participant.batch}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatisticParticipant;