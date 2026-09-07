import React, { useState } from 'react';
import { Users, Clock, TrendingUp, Star, BookOpen, Calendar, ChevronDown, Filter, Search } from 'lucide-react';

const StatisticTrainer = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedTrainer, setSelectedTrainer] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Sample data - dalam implementasi nyata, data ini akan diambil dari API
  const trainersData = [
    {
      id: 1,
      name: "Dr. Ahmad Wijaya",
      avatar: "AW",
      totalClasses: 45,
      totalHours: 180,
      avgAttendance: 92,
      feedbackScore: 4.8,
      specialization: ["Leadership", "Management", "Communication"],
      trainings: [
        { topic: "Leadership", count: 18 },
        { topic: "Management", count: 15 },
        { topic: "Communication", count: 12 }
      ],
      monthlyHours: [20, 18, 22, 15, 25, 20],
      attendanceHistory: [88, 90, 95, 89, 92, 94]
    },
    {
      id: 2,
      name: "Sari Indrawati, M.Pd",
      avatar: "SI",
      totalClasses: 38,
      totalHours: 152,
      avgAttendance: 89,
      feedbackScore: 4.6,
      specialization: ["Digital Marketing", "Social Media", "Content Strategy"],
      trainings: [
        { topic: "Digital Marketing", count: 20 },
        { topic: "Social Media", count: 10 },
        { topic: "Content Strategy", count: 8 }
      ],
      monthlyHours: [18, 16, 20, 18, 22, 18],
      attendanceHistory: [85, 87, 91, 88, 89, 92]
    },
    {
      id: 3,
      name: "Budi Santoso",
      avatar: "BS",
      totalClasses: 52,
      totalHours: 208,
      avgAttendance: 94,
      feedbackScore: 4.9,
      specialization: ["Technical Skills", "Programming", "Data Analysis"],
      trainings: [
        { topic: "Programming", count: 25 },
        { topic: "Data Analysis", count: 15 },
        { topic: "Technical Skills", count: 12 }
      ],
      monthlyHours: [22, 20, 25, 20, 28, 25],
      attendanceHistory: [92, 94, 96, 93, 95, 94]
    },
    {
      id: 4,
      name: "Maya Puspita",
      avatar: "MP",
      totalClasses: 30,
      totalHours: 120,
      avgAttendance: 87,
      feedbackScore: 4.5,
      specialization: ["HR Development", "Soft Skills", "Team Building"],
      trainings: [
        { topic: "HR Development", count: 12 },
        { topic: "Soft Skills", count: 10 },
        { topic: "Team Building", count: 8 }
      ],
      monthlyHours: [15, 12, 18, 15, 20, 15],
      attendanceHistory: [84, 86, 89, 85, 87, 90]
    }
  ];

  const filteredTrainers = trainersData.filter(trainer =>
    trainer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trainer.specialization.some(spec => spec.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const StatCard = ({ icon: Icon, title, value, subtitle, color = "blue" }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className={`text-2xl font-bold text-${color}-600`}>{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 bg-${color}-50 rounded-lg`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
      </div>
    </div>
  );

  const TrainerCard = ({ trainer }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
            {trainer.avatar}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{trainer.name}</h3>
            <div className="flex items-center space-x-2 mt-1">
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <span className="text-sm text-gray-600">{trainer.feedbackScore}/5.0</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">Total Jam</div>
          <div className="text-lg font-semibold text-blue-600">{trainer.totalHours}h</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-lg font-semibold text-gray-900">{trainer.totalClasses}</div>
          <div className="text-xs text-gray-600">Kelas</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-lg font-semibold text-green-600">{trainer.avgAttendance}%</div>
          <div className="text-xs text-gray-600">Kehadiran</div>
        </div>
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <div className="text-lg font-semibold text-purple-600">{trainer.trainings.length}</div>
          <div className="text-xs text-gray-600">Topik</div>
        </div>
      </div>

      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Spesialisasi</h4>
        <div className="flex flex-wrap gap-2">
          {trainer.specialization.map((spec, index) => (
            <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
              {spec}
            </span>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Distribusi Pelatihan</h4>
        <div className="space-y-2">
          {trainer.trainings.slice(0, 3).map((training, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{training.topic}</span>
              <div className="flex items-center space-x-2">
                <div className="w-16 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ width: `${(training.count / trainer.totalClasses) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900">{training.count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const totalStats = {
    totalTrainers: trainersData.length,
    totalClasses: trainersData.reduce((sum, trainer) => sum + trainer.totalClasses, 0),
    totalHours: trainersData.reduce((sum, trainer) => sum + trainer.totalHours, 0),
    avgFeedback: (trainersData.reduce((sum, trainer) => sum + trainer.feedbackScore, 0) / trainersData.length).toFixed(1)
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Data Trainer</h1>
              <p className="text-gray-600 mt-1">Monitor performa dan beban kerja trainer</p>
            </div>
            <div className="flex space-x-3">
              <div className="relative">
                <select 
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="week">Minggu Ini</option>
                  <option value="month">Bulan Ini</option>
                  <option value="quarter">Kuartal Ini</option>
                  <option value="year">Tahun Ini</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex space-x-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari trainer atau spesialisasi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Filter className="w-4 h-4" />
              <span>Filter</span>
            </button>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <StatCard
              icon={Users}
              title="Total Trainer"
              value={totalStats.totalTrainers}
              subtitle="Trainer aktif"
              color="blue"
            />
            <StatCard
              icon={BookOpen}
              title="Total Kelas"
              value={totalStats.totalClasses}
              subtitle="Kelas terlaksana"
              color="green"
            />
            <StatCard
              icon={Clock}
              title="Total Jam"
              value={`${totalStats.totalHours}h`}
              subtitle="Jam mengajar"
              color="purple"
            />
            <StatCard
              icon={Star}
              title="Rata-rata Rating"
              value={totalStats.avgFeedback}
              subtitle="Dari 5.0"
              color="yellow"
            />
          </div>
        </div>

        {/* Trainer Cards */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Daftar Trainer ({filteredTrainers.length})
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredTrainers.map((trainer) => (
              <TrainerCard key={trainer.id} trainer={trainer} />
            ))}
          </div>
        </div>

        {/* Performance Insights */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Insights Performa</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <h4 className="font-medium text-green-900">Top Performer</h4>
              <p className="text-sm text-green-700">Budi Santoso dengan rating 4.9/5.0</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <h4 className="font-medium text-blue-900">Tertinggi Jam Mengajar</h4>
              <p className="text-sm text-blue-700">Budi Santoso dengan 208 jam</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Users className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <h4 className="font-medium text-purple-900">Kehadiran Terbaik</h4>
              <p className="text-sm text-purple-700">Budi Santoso dengan 94% kehadiran</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatisticTrainer;