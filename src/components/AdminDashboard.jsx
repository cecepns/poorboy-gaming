import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, GamepadIcon, LogOut, DollarSign, Tag, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    expiredUsers: 0,
    totalGames: 0,
    pendingReports: 0,
    totalCategories: 0
  });

  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get('/admin/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const renderDashboardContent = () => {
    return (
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">Total Pengguna</p>
                <p className="text-3xl font-bold text-white">{stats.totalUsers}</p>
              </div>
              <Users className="w-10 h-10 text-blue-400" />
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">Pengguna Aktif</p>
                <p className="text-3xl font-bold text-white">{stats.activeUsers}</p>
              </div>
              <Users className="w-10 h-10 text-green-400" />
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">Pengguna Berakhir</p>
                <p className="text-3xl font-bold text-white">{stats.expiredUsers}</p>
              </div>
              <Users className="w-10 h-10 text-red-400" />
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">Total Game</p>
                <p className="text-3xl font-bold text-white">{stats.totalGames}</p>
              </div>
              <GamepadIcon className="w-10 h-10 text-purple-400" />
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">Laporan Pending</p>
                <p className="text-3xl font-bold text-white">{stats.pendingReports}</p>
              </div>
              <AlertTriangle className="w-10 h-10 text-yellow-400" />
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">Total Kategori</p>
                <p className="text-3xl font-bold text-white">{stats.totalCategories}</p>
              </div>
              <Tag className="w-10 h-10 text-purple-400" />
            </div>
          </div>
        </div>

        {/* Welcome Message */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Selamat Datang di Dashboard Admin</h3>
          <p className="text-gray-300">
            Kelola pengguna, game, dan paket berlangganan dari dashboard ini. 
            Gunakan kartu di bawah untuk menavigasi ke bagian manajemen yang berbeda.
          </p>
        </div>

        {/* Management Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div 
            onClick={() => navigate('/admin/users')}
            className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 cursor-pointer hover:bg-white/20 transition-all duration-200"
          >
            <div className="flex items-center space-x-4">
              <Users className="w-12 h-12 text-blue-400" />
              <div>
                <h3 className="text-xl font-semibold text-white">Manajemen Pengguna</h3>
                <p className="text-gray-300 text-sm">Kelola data pengguna dan akses</p>
              </div>
            </div>
          </div>

          <div 
            onClick={() => navigate('/admin/games')}
            className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 cursor-pointer hover:bg-white/20 transition-all duration-200"
          >
            <div className="flex items-center space-x-4">
              <GamepadIcon className="w-12 h-12 text-purple-400" />
              <div>
                <h3 className="text-xl font-semibold text-white">Manajemen Game</h3>
                <p className="text-gray-300 text-sm">Kelola game dan konten</p>
              </div>
            </div>
          </div>

          <div 
            onClick={() => navigate('/admin/categories')}
            className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 cursor-pointer hover:bg-white/20 transition-all duration-200"
          >
            <div className="flex items-center space-x-4">
              <Tag className="w-12 h-12 text-green-400" />
              <div>
                <h3 className="text-xl font-semibold text-white">Kategori Game</h3>
                <p className="text-gray-300 text-sm">Kelola kategori game</p>
              </div>
            </div>
          </div>

          <div 
            onClick={() => navigate('/admin/reports')}
            className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 cursor-pointer hover:bg-white/20 transition-all duration-200"
          >
            <div className="flex items-center space-x-4">
              <AlertTriangle className="w-12 h-12 text-yellow-400" />
              <div>
                <h3 className="text-xl font-semibold text-white">Laporan Game</h3>
                <p className="text-gray-300 text-sm">Kelola laporan dari pengguna</p>
              </div>
            </div>
          </div>

          <div 
            onClick={() => navigate('/admin/subscriptions')}
            className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 cursor-pointer hover:bg-white/20 transition-all duration-200"
          >
            <div className="flex items-center space-x-4">
              <DollarSign className="w-12 h-12 text-green-400" />
              <div>
                <h3 className="text-xl font-semibold text-white">Paket Berlangganan</h3>
                <p className="text-gray-300 text-sm">Kelola paket berlangganan</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="bg-black/40 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <GamepadIcon className="w-8 h-8 text-purple-400" />
              <span className="text-2xl font-bold text-white">Poorboy Gaming</span>
              <span className="text-sm text-gray-400 ml-4">Panel Admin</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-white">Selamat datang, {user.username}</span>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Keluar</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Content */}
        {renderDashboardContent()}
      </div>
    </div>
  );
};

export default AdminDashboard;