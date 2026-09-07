import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft } from "lucide-react";

const StatisticsReport = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const mockData = {
          totalTrainings: 24,
          totalParticipants: 312,
          completionRate: 87,
          departmentBreakdown: [
            { department: 'IT', count: 85 },
            { department: 'HR', count: 42 },
            { department: 'Finance', count: 63 },
            { department: 'Marketing', count: 55 },
            { department: 'Operations', count: 67 }
          ],
          monthlyParticipation: [
            { month: 'Jan', count: 28 },
            { month: 'Feb', count: 32 },
            { month: 'Mar', count: 41 },
            { month: 'Apr', count: 35 },
            { month: 'May', count: 29 }
          ]
        };
        setTimeout(() => {
          setStats(mockData);
          setLoading(false);
        }, 800);
      } catch (error) {
        console.error('Error fetching statistics:', error);
        setLoading(false);
      }
    };

    fetchStatistics();
  }, []);

  if (loading) {
    return <div className="text-center py-10 text-gray-600">Loading statistics data...</div>;
  }

  return (
    <div className=" space-y-8">
      <button className="inline-flex items-center  px-4 py-2 border bg-white hover:bg-gray-200 text-gray-800 text-sm font-medium rounded-xl shadow-sm transition duration-200">
      <ArrowLeft className="w-4 h-4 mr-2" />
      Kembali
      </button>
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Training Statistics</h1>
        <p className="text-gray-600">Welcome, {currentUser?.name}. Here you can view training program statistics and analytics.</p>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-600 text-sm font-medium mb-2">Total Trainings</h3>
          <div className="text-3xl font-bold text-blue-600">{stats.totalTrainings}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-600 text-sm font-medium mb-2">Total Participants</h3>
          <div className="text-3xl font-bold text-blue-600">{stats.totalParticipants}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-600 text-sm font-medium mb-2">Completion Rate</h3>
          <div className="text-3xl font-bold text-blue-600">{stats.completionRate}%</div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Department Breakdown</h3>
          <ul className="space-y-3">
            {stats.departmentBreakdown.map((item, index) => (
              <li key={index}>
                <div className="text-gray-700 font-medium">{item.department}: {item.count} participants</div>
                <div className="h-3 mt-1 bg-gray-200 rounded">
                  <div
                    className="h-3 rounded"
                    style={{
                      width: `${(item.count / Math.max(...stats.departmentBreakdown.map(d => d.count))) * 100}%`,
                      backgroundColor: `hsl(${index * 60}, 70%, 60%)`,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Monthly Participation</h3>
          <ul className="space-y-3">
            {stats.monthlyParticipation.map((item, index) => (
              <li key={index}>
                <div className="text-gray-700 font-medium">{item.month}: {item.count} participants</div>
                <div className="h-3 mt-1 bg-gray-200 rounded">
                  <div
                    className="h-3 rounded"
                    style={{
                      width: `${(item.count / Math.max(...stats.monthlyParticipation.map(m => m.count))) * 100}%`,
                      backgroundColor: `hsl(200, 70%, ${40 + (index * 10)}%)`,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex gap-4 justify-end">
        <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">Export Report</button>
        <button className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition">Print Statistics</button>
      </div>
    </div>
  );
};

export default StatisticsReport;
