import React, { useState } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Clock, 
  Filter,
  Search,
  User,
  BookOpen,
  Calendar,
  Check,
  X,
  Eye,
  MessageSquare
} from 'lucide-react';

const PendingReviews = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedReviews, setSelectedReviews] = useState([]);

  // Mock pending reviews data
  const pendingReviews = [
    {
      id: 1,
      student: "John Smith",
      studentId: "STU2024001",
      course: "Mathematics",
      issueType: "grade_discrepancy",
      issue: "Quiz score mismatch - Student claims 85% but system shows 75%",
      submittedDate: "2024-01-15",
      priority: "high",
      status: "pending",
      reviewer: null,
      attachments: 2
    },
    {
      id: 2,
      student: "Emma Johnson",
      studentId: "STU2024002", 
      course: "Physics",
      issueType: "missing_marks",
      issue: "Final exam marks missing from transcript",
      submittedDate: "2024-01-14",
      priority: "medium",
      status: "in_review",
      reviewer: "Prof. Wilson",
      attachments: 1
    },
    {
      id: 3,
      student: "Michael Brown",
      studentId: "STU2024003",
      course: "Chemistry",
      issueType: "attendance",
      issue: "Attendance below 75% threshold",
      submittedDate: "2024-01-13",
      priority: "low",
      status: "pending",
      reviewer: null,
      attachments: 0
    },
    {
      id: 4,
      student: "Sarah Davis",
      studentId: "STU2024004",
      course: "Computer Science",
      issueType: "grade_discrepancy",
      issue: "Assignment grading inconsistency",
      submittedDate: "2024-01-12",
      priority: "high",
      status: "resolved",
      reviewer: "Dr. Johnson",
      attachments: 3
    },
    {
      id: 5,
      student: "Robert Wilson",
      studentId: "STU2024005",
      course: "Biology",
      issueType: "missing_marks",
      issue: "Lab report marks not recorded",
      submittedDate: "2024-01-11",
      priority: "medium",
      status: "pending",
      reviewer: null,
      attachments: 1
    },
  ];

  const filters = [
    { id: 'all', label: 'All Reviews', count: pendingReviews.length },
    { id: 'pending', label: 'Pending', count: pendingReviews.filter(r => r.status === 'pending').length },
    { id: 'in_review', label: 'In Review', count: pendingReviews.filter(r => r.status === 'in_review').length },
    { id: 'resolved', label: 'Resolved', count: pendingReviews.filter(r => r.status === 'resolved').length },
  ];

  const filteredReviews = pendingReviews.filter(review => {
    const matchesSearch = review.student.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         review.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         review.course.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || review.status === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const getPriorityBadge = (priority) => {
    const styles = {
      high: "bg-red-100 text-red-800",
      medium: "bg-yellow-100 text-yellow-800",
      low: "bg-blue-100 text-blue-800"
    };
    
    const icons = {
      high: <AlertCircle size={12} className="inline mr-1" />,
      medium: <Clock size={12} className="inline mr-1" />,
      low: <Clock size={12} className="inline mr-1" />
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[priority]}`}>
        {icons[priority]}
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-800",
      in_review: "bg-blue-100 text-blue-800",
      resolved: "bg-green-100 text-green-800"
    };
    
    const icons = {
      pending: <Clock size={12} className="inline mr-1" />,
      in_review: <Eye size={12} className="inline mr-1" />,
      resolved: <CheckCircle size={12} className="inline mr-1" />
    };
    
    const labels = {
      pending: "Pending",
      in_review: "In Review",
      resolved: "Resolved"
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {icons[status]}
        {labels[status]}
      </span>
    );
  };

  const getIssueTypeBadge = (type) => {
    const labels = {
      grade_discrepancy: "Grade Issue",
      missing_marks: "Missing Marks",
      attendance: "Attendance"
    };
    
    const styles = {
      grade_discrepancy: "bg-purple-100 text-purple-800",
      missing_marks: "bg-orange-100 text-orange-800",
      attendance: "bg-indigo-100 text-indigo-800"
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[type]}`}>
        {labels[type]}
      </span>
    );
  };

  const handleApprove = (id) => {
    alert(`Review ${id} approved!`);
    // In real app, this would update the review status
  };

  const handleReject = (id) => {
    alert(`Review ${id} rejected!`);
    // In real app, this would update the review status
  };

  const handleAssignToMe = (id) => {
    alert(`Assigned review ${id} to yourself!`);
    // In real app, this would assign the review to current user
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Pending Reviews</h1>
          <p className="text-gray-600">Review and resolve student requests and issues</p>
        </div>
        <div className="flex space-x-3">
          <button className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            Export Report
          </button>
          <button className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Bulk Actions
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Reviews</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{pendingReviews.length}</p>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg">
              <AlertCircle className="text-blue-600" size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending Action</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{pendingReviews.filter(r => r.status === 'pending').length}</p>
            </div>
            <div className="p-2 bg-yellow-50 rounded-lg">
              <Clock className="text-yellow-600" size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">In Review</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{pendingReviews.filter(r => r.status === 'in_review').length}</p>
            </div>
            <div className="p-2 bg-green-50 rounded-lg">
              <Eye className="text-green-600" size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">High Priority</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{pendingReviews.filter(r => r.priority === 'high').length}</p>
            </div>
            <div className="p-2 bg-red-50 rounded-lg">
              <AlertCircle className="text-red-600" size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search reviews by student, course, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter size={18} className="text-gray-500" />
              <select 
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in_review">In Review</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>

            <div className="flex flex-wrap gap-2">
              {filters.map(filter => (
                <button
                  key={filter.id}
                  onClick={() => setSelectedFilter(filter.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    selectedFilter === filter.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filter.label} ({filter.count})
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Table */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden mb-6">
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student & Issue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Course & Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority & Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Reviewer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredReviews.map((review) => (
                <tr key={review.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full"></div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{review.student}</div>
                        <div className="text-sm text-gray-500">{review.studentId}</div>
                        <div className="text-sm text-gray-700 mt-1 max-w-xs">{review.issue}</div>
                        {review.attachments > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            {review.attachments} attachment{review.attachments !== 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <BookOpen size={16} className="text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">{review.course}</span>
                    </div>
                    <div className="mt-2">
                      {getIssueTypeBadge(review.issueType)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-2">
                      {getPriorityBadge(review.priority)}
                      {getStatusBadge(review.status)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      <div className="flex items-center space-x-2">
                        <Calendar size={14} className="text-gray-400" />
                        <span>{review.submittedDate}</span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500 mt-2">
                      {review.reviewer ? (
                        <div className="flex items-center space-x-2">
                          <User size={14} className="text-gray-400" />
                          <span>Assigned to: {review.reviewer}</span>
                        </div>
                      ) : (
                        <span className="text-yellow-600">Unassigned</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col space-y-2">
                      {review.status === 'pending' && !review.reviewer && (
                        <button
                          onClick={() => handleAssignToMe(review.id)}
                          className="px-3 py-1.5 bg-blue-100 text-blue-700 text-sm rounded hover:bg-blue-200 transition-colors"
                        >
                          Assign to Me
                        </button>
                      )}
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleApprove(review.id)}
                          className="flex-1 px-3 py-1.5 bg-green-100 text-green-700 text-sm rounded hover:bg-green-200 transition-colors flex items-center justify-center"
                        >
                          <Check size={14} className="mr-1" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(review.id)}
                          className="flex-1 px-3 py-1.5 bg-red-100 text-red-700 text-sm rounded hover:bg-red-200 transition-colors flex items-center justify-center"
                        >
                          <X size={14} className="mr-1" />
                          Reject
                        </button>
                      </div>
                      
                      <button className="px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50 transition-colors flex items-center justify-center">
                        <MessageSquare size={14} className="mr-1" />
                        Add Note
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredReviews.length}</span> of{' '}
              <span className="font-medium">{pendingReviews.length}</span> reviews
            </div>
            <div className="flex items-center space-x-2">
              <button className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                Previous
              </button>
              <button className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                1
              </button>
              <button className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Review Statistics */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-medium text-gray-800 mb-4">Review Statistics</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Pending Reviews</span>
                <span className="font-medium">{pendingReviews.filter(r => r.status === 'pending').length}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-yellow-500 h-2 rounded-full" 
                  style={{ width: `${(pendingReviews.filter(r => r.status === 'pending').length / pendingReviews.length) * 100}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">In Review</span>
                <span className="font-medium">{pendingReviews.filter(r => r.status === 'in_review').length}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full" 
                  style={{ width: `${(pendingReviews.filter(r => r.status === 'in_review').length / pendingReviews.length) * 100}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Resolved</span>
                <span className="font-medium">{pendingReviews.filter(r => r.status === 'resolved').length}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{ width: `${(pendingReviews.filter(r => r.status === 'resolved').length / pendingReviews.length) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Priority Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-medium text-gray-800 mb-4">Priority Breakdown</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                  <span className="text-sm">High Priority</span>
                </div>
                <span className="text-sm font-medium">{pendingReviews.filter(r => r.priority === 'high').length}</span>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                  <span className="text-sm">Medium Priority</span>
                </div>
                <span className="text-sm font-medium">{pendingReviews.filter(r => r.priority === 'medium').length}</span>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                  <span className="text-sm">Low Priority</span>
                </div>
                <span className="text-sm font-medium">{pendingReviews.filter(r => r.priority === 'low').length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-medium text-gray-800 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full text-left px-4 py-3 border border-blue-200 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Review All High Priority</p>
                  <p className="text-sm">Process all high priority reviews first</p>
                </div>
                <AlertCircle className="text-blue-600" size={18} />
              </div>
            </button>

            <button className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Generate Report</p>
                  <p className="text-sm">Create review status report</p>
                </div>
                <span className="text-gray-400">PDF</span>
              </div>
            </button>

            <button className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Settings</p>
                  <p className="text-sm">Configure review workflow</p>
                </div>
                <span className="text-gray-400">⚙️</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PendingReviews;