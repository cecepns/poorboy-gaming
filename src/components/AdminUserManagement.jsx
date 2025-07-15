import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import UserManagement from './UserManagement';

const AdminUserManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleBack = () => {
    navigate('/admin');
  };

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="bg-black/40 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Users className="w-8 h-8 text-purple-400" />
              <span className="text-2xl font-bold text-white">Manajemen Pengguna</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-white">Admin: {user.username}</span>
              <button
                onClick={handleBack}
                className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali ke Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <UserManagement />
      </div>
    </div>
  );
};

export default AdminUserManagement; 