import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Users, Award, Clock } from 'lucide-react';

const Dashboard = () => {
  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard Overview</h1>
        <p className="text-gray-600">Welcome back! Here's the students' updates today.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Students</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">1,247</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <Users className="text-blue-600" size={24} />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm text-green-600">
            <TrendingUp size={16} />
            <span className="ml-1">+12% from last month</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Average Score</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">85.6%</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <TrendingUp className="text-green-600" size={24} />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm text-green-600">
            <TrendingUp size={16} />
            <span className="ml-1">+3.2% improvement</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Top Performer</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">98.2%</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <Award className="text-purple-600" size={24} />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">John Smith - Grade 12</p>
        </div>

        {/* Pending Reviews Card - Fixed */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending Reviews</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">24</p>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <Clock className="text-orange-600" size={24} />
            </div>
          </div>
          <Link 
            to="/pending-reviews"
            className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium inline-block"
          >
            Review now →
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-800">Recent Activity</h2>
          <button className="text-sm text-blue-600 hover:text-blue-700">View All</button>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp size={16} className="text-green-600" />
              </div>
              <div>
                <p className="font-medium">Math Scores Updated</p>
                <p className="text-sm text-gray-500">Grade 10 final exam marks uploaded</p>
              </div>
            </div>
            <span className="text-sm text-gray-500">2 hours ago</span>
          </div>
          <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Users size={16} className="text-blue-600" />
              </div>
              <div>
                <p className="font-medium">New Student Added</p>
                <p className="text-sm text-gray-500">Sarah Johnson joined Grade 11</p>
              </div>
            </div>
            <span className="text-sm text-gray-500">1 day ago</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;