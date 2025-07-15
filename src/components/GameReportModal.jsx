import React, { useState } from 'react';
import { AlertTriangle, X, Send, GamepadIcon, User, Lock, AlertCircle, Bug, MessageSquare } from 'lucide-react';
import axios from 'axios';

const GameReportModal = ({ game, isOpen, onClose, onReportSubmitted }) => {
  const [formData, setFormData] = useState({
    report_type: 'login_error',
    title: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const reportTypes = [
    { value: 'login_error', label: 'Error Login', icon: User, description: 'Tidak bisa login ke akun game' },
    { value: 'password_error', label: 'Error Password', icon: Lock, description: 'Password tidak berfungsi' },
    { value: 'account_locked', label: 'Akun Terkunci', icon: AlertCircle, description: 'Akun game terkunci atau dibanned' },
    { value: 'game_not_working', label: 'Game Tidak Berfungsi', icon: Bug, description: 'Game tidak bisa dimainkan atau error' },
    { value: 'other', label: 'Lainnya', icon: MessageSquare, description: 'Masalah lain yang tidak tercantum' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await axios.post(`/user/games/${game.id}/report`, formData);
      onReportSubmitted();
      onClose();
      // Reset form
      setFormData({
        report_type: 'login_error',
        title: '',
        description: ''
      });
    } catch (error) {
      console.error('Error submitting report:', error);
      if (error.response?.status === 403) {
        setError('Berlangganan Anda telah berakhir. Silakan perpanjang berlangganan untuk mengirim laporan.');
      } else {
        setError(error.response?.data?.error || 'Error mengirim laporan. Silakan coba lagi.');
      }
    }

    setLoading(false);
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
      setFormData({
        report_type: 'login_error',
        title: '',
        description: ''
      });
      setError('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-white/20 rounded-2xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-white">Laporkan Masalah Game</h3>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Game Info */}
        <div className="mb-6 p-4 bg-white/5 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
              <GamepadIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="text-white font-semibold">{game.name}</h4>
              <p className="text-gray-400 text-sm">Game yang dilaporkan</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-3">
              Jenis Masalah
            </label>
            <div className="space-y-2">
              {reportTypes.map((type) => {
                const IconComponent = type.icon;
                return (
                  <label
                    key={type.value}
                    className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      formData.report_type === type.value
                        ? 'border-purple-400 bg-purple-500/10'
                        : 'border-white/20 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <input
                      type="radio"
                      name="report_type"
                      value={type.value}
                      checked={formData.report_type === type.value}
                      onChange={(e) => setFormData({ ...formData, report_type: e.target.value })}
                      className="sr-only"
                      disabled={loading}
                    />
                    <IconComponent className="w-5 h-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-white font-medium">{type.label}</p>
                      <p className="text-gray-400 text-sm">{type.description}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Judul Laporan
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all"
              placeholder="Masukkan judul laporan singkat"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Deskripsi Detail
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all"
              placeholder="Jelaskan masalah yang Anda alami secara detail..."
              rows="4"
              required
              disabled={loading}
            />
          </div>

          <div className="flex space-x-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Mengirim...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Kirim Laporan</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg font-semibold transition-colors"
            >
              Batal
            </button>
          </div>
        </form>

        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-blue-400 mt-0.5" />
            <div>
              <p className="text-blue-300 text-sm font-medium mb-1">Tips Laporan yang Baik</p>
              <ul className="text-blue-200 text-sm space-y-1">
                <li>• Jelaskan masalah secara detail dan spesifik</li>
                <li>• Sertakan pesan error jika ada</li>
                <li>• Berikan langkah-langkah yang sudah dicoba</li>
                <li>• Tim admin akan segera menindaklanjuti laporan Anda</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameReportModal; 