import React, { useState, useEffect } from 'react';
import { Search, AlertTriangle, CheckCircle, Clock, XCircle, MessageSquare, User, GamepadIcon } from 'lucide-react';
import axios from 'axios';
import Pagination from './Pagination';

const ReportManagement = () => {
  const [reports, setReports] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });
  const [formData, setFormData] = useState({
    status: '',
    admin_notes: ''
  });

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchReports();
  }, [currentPage, debouncedSearchTerm, statusFilter]);

  const fetchReports = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20'
      });
      
      if (debouncedSearchTerm) {
        params.append('search', debouncedSearchTerm);
      }
      
      if (statusFilter && statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      
      const response = await axios.get(`/admin/reports?${params}`);
      setReports(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleStatusFilter = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleUpdateReport = (report) => {
    setSelectedReport(report);
    setFormData({
      status: report.status,
      admin_notes: report.admin_notes || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await axios.put(`/admin/reports/${selectedReport.id}`, formData);
      fetchReports();
      closeModal();
    } catch (error) {
      console.error('Error updating report:', error);
      alert('Error memperbarui laporan');
    }
    
    setLoading(false);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedReport(null);
    setFormData({
      status: '',
      admin_notes: ''
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'investigating':
        return <AlertTriangle className="w-4 h-4 text-orange-400" />;
      case 'resolved':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-400 bg-yellow-400/10';
      case 'investigating':
        return 'text-orange-400 bg-orange-400/10';
      case 'resolved':
        return 'text-green-400 bg-green-400/10';
      case 'rejected':
        return 'text-red-400 bg-red-400/10';
      default:
        return 'text-gray-400 bg-gray-400/10';
    }
  };

  const getReportTypeLabel = (type) => {
    switch (type) {
      case 'login_error':
        return 'Error Login';
      case 'password_error':
        return 'Error Password';
      case 'account_locked':
        return 'Akun Terkunci';
      case 'game_not_working':
        return 'Game Tidak Berfungsi';
      case 'other':
        return 'Lainnya';
      default:
        return type;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-3xl font-bold text-white">Manajemen Laporan</h2>
        <div className="flex items-center space-x-2 text-sm text-gray-300">
          <span>Total: {pagination.total}</span>
          <span>•</span>
          <span className="text-yellow-400">Pending: {reports.filter(r => r.status === 'pending').length}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Cari laporan..."
            value={searchTerm}
            onChange={handleSearch}
            className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all"
          />
        </div>
        <select
          value={statusFilter}
          onChange={handleStatusFilter}
          className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all"
        >
          <option value="all">Semua Status</option>
          <option value="pending">Pending</option>
          <option value="investigating">Sedang Diteliti</option>
          <option value="resolved">Selesai</option>
          <option value="rejected">Ditolak</option>
        </select>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {reports.map((report) => (
          <div key={report.id} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 hover:bg-white/15 transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${getStatusColor(report.status)}`}>
                  {getStatusIcon(report.status)}
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg">{report.title}</h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-400 mt-1">
                    <span className="flex items-center space-x-1">
                      <GamepadIcon className="w-4 h-4" />
                      <span>{report.game_name}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <User className="w-4 h-4" />
                      <span>{report.user_username}</span>
                    </span>
                    <span>{getReportTypeLabel(report.report_type)}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                  {getStatusIcon(report.status)}
                  <span className="capitalize">{report.status}</span>
                </div>
                <p className="text-gray-400 text-sm mt-1">{formatDate(report.created_at)}</p>
              </div>
            </div>
            
            <div className="mb-4">
              <p className="text-gray-300">{report.description}</p>
            </div>
            
            {report.admin_notes && (
              <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-sm font-medium text-blue-300 mb-1">Catatan Admin:</p>
                <p className="text-sm text-blue-200">{report.admin_notes}</p>
              </div>
            )}
            
            {report.resolved_at && (
              <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="text-sm font-medium text-green-300 mb-1">
                  Diselesaikan oleh {report.admin_username} pada {formatDate(report.resolved_at)}
                </p>
              </div>
            )}
            
            <div className="flex justify-end">
              <button
                onClick={() => handleUpdateReport(report)}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Update Status</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        total={pagination.total}
        limit={pagination.limit}
        onPageChange={handlePageChange}
      />

      {/* Empty State */}
      {reports.length === 0 && (
        <div className="text-center py-12">
          <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-300 mb-2">Tidak Ada Laporan Ditemukan</h3>
          <p className="text-gray-400">Belum ada laporan game yang masuk atau tidak ada yang sesuai dengan filter.</p>
        </div>
      )}

      {/* Modal */}
      {showModal && selectedReport && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-white/20 rounded-2xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-white mb-6">Update Status Laporan</h3>
            
            <div className="mb-6 p-4 bg-white/5 rounded-lg">
              <h4 className="text-white font-semibold mb-2">{selectedReport.title}</h4>
              <p className="text-gray-300 text-sm mb-2">{selectedReport.description}</p>
              <div className="flex items-center space-x-4 text-sm text-gray-400">
                <span>Game: {selectedReport.game_name}</span>
                <span>User: {selectedReport.user_username}</span>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all"
                  required
                  disabled={loading}
                >
                  <option value="">Pilih Status</option>
                  <option value="pending">Pending</option>
                  <option value="investigating">Sedang Diteliti</option>
                  <option value="resolved">Selesai</option>
                  <option value="rejected">Ditolak</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">Catatan Admin</label>
                <textarea
                  value={formData.admin_notes}
                  onChange={(e) => setFormData({ ...formData, admin_notes: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all resize-none"
                  placeholder="Tambahkan catatan untuk laporan ini..."
                  disabled={loading}
                />
              </div>
              
              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
                >
                  {loading ? 'Menyimpan...' : 'Update Status'}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={loading}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg font-semibold transition-colors"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportManagement; 