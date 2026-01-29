import React from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const DashboardLayout = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      {/* Main Content Area */}
      <div className="flex-1 ml-64">
        <Navbar />
        
        <main className="p-6">
          {/* Page-specific content goes here */}
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;