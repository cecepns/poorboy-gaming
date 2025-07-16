import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, AlertTriangle, CheckCircle, Clock, XCircle, MessageSquare, GamepadIcon, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import Pagination from './Pagination';

const UserReports = () => {
  const [reports, setReports] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });

  const navigate = useNavigate();

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
      
      const response = await axios.get(`/user/reports?${params}`);
      setReports(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
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

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending':
        return 'Menunggu';
      case 'investigating':
        return 'Sedang Diteliti';
      case 'resolved':
        return 'Selesai';
      case 'rejected':
        return 'Ditolak';
      default:
        return status;
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Memuat laporan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali</span>
              </button>
              <div className="h-6 w-px bg-white/20"></div>
              <MessageSquare className="w-8 h-8 text-purple-400" />
              <h1 className="text-2xl font-bold text-white">Laporan Saya</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h2 className="text-3xl font-bold text-white">Laporan Game Saya</h2>
            <p className="text-gray-300 mt-2">Lihat status laporan yang telah Anda kirim</p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-300">
            <span>Total: {pagination.total}</span>
            <span>•</span>
            <span className="text-yellow-400">Pending: {reports.filter(r => r.status === 'pending').length}</span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
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
            <option value="pending">Menunggu</option>
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
                      <span>{getReportTypeLabel(report.report_type)}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                    {getStatusIcon(report.status)}
                    <span>{getStatusLabel(report.status)}</span>
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
                    Diselesaikan pada {formatDate(report.resolved_at)}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-8">
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              total={pagination.total}
              limit={pagination.limit}
              onPageChange={handlePageChange}
            />
          </div>
        )}

        {/* Empty State */}
        {reports.length === 0 && !loading && (
          <div className="text-center py-12">
            <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">Tidak Ada Laporan Ditemukan</h3>
            <p className="text-gray-400">
              {searchTerm || statusFilter !== 'all' 
                ? 'Tidak ada laporan yang sesuai dengan filter yang dipilih.'
                : 'Belum ada laporan game yang Anda kirim.'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserReports; 