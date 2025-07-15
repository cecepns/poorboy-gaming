import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  GamepadIcon,
  Copy,
  Check,
  LogOut,
  Clock,
  AlertCircle,
  AlertTriangle,
  MessageSquare,
  Tag,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import GameReportModal from "./GameReportModal";
import Pagination from "./Pagination";
import Notification from "./Notification";

const UserDashboard = () => {
  const [games, setGames] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [copiedTokens, setCopiedTokens] = useState({});
  const [loading, setLoading] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [notification, setNotification] = useState({
    isVisible: false,
    type: 'success',
    message: ''
  });

  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchGames();
  }, [currentPage]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get("/user/categories");
      setCategories(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchGames = async () => {
    try {
      const response = await axios.get(
        `/user/games?page=${currentPage}&limit=20`
      );
      setGames(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      if (error.response?.status === 403) {
        // Subscription expired
        navigate("/");
      } else {
        console.error("Error fetching games:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleCopyToken = async (gameId) => {
    try {
      const response = await axios.get(`/user/games/${gameId}/token`);
      await navigator.clipboard.writeText(response.data.token);

      setCopiedTokens({ ...copiedTokens, [gameId]: true });

      // Reset copy status after 2 seconds
      setTimeout(() => {
        setCopiedTokens((prev) => ({ ...prev, [gameId]: false }));
      }, 2000);
    } catch (error) {
      console.error("Failed to copy token:", error);
      if (error.response?.status === 403) {
        navigate("/");
      }
    }
  };

  const handleReportGame = (game) => {
    setSelectedGame(game);
    setShowReportModal(true);
  };

  const handleReportSubmitted = () => {
    setNotification({
      isVisible: true,
      type: 'success',
      message: 'Laporan berhasil dikirim! Tim admin akan segera menindaklanjuti.'
    });
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const isSubscriptionExpired =
    user.subscription_expiry &&
    new Date(user.subscription_expiry) <= new Date();

  // Calculate remaining days
  const getRemainingDays = () => {
    if (!user.subscription_expiry) return 0;
    const expiryDate = new Date(user.subscription_expiry);
    const now = new Date();
    const diffTime = expiryDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const remainingDays = getRemainingDays();

  // Filtered games by search and category
  const filteredGames = games.filter((game) => {
    const matchesSearch = game.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory
      ? game.category_name === selectedCategory
      : true;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Memuat game...</p>
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
              <GamepadIcon className="w-8 h-8 text-purple-400" />
              <h1 className="text-2xl font-bold text-white">Poorboy Gaming</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/reports')}
                className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Laporan Saya</span>
              </button>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-white font-medium">{user.username}</p>
                <div className="flex items-center space-x-2 text-sm">
                  {isSubscriptionExpired ? (
                    <div className="flex items-center text-red-400">
                      <AlertTriangle className="w-4 h-4 mr-1" />
                      <span>Berlangganan Berakhir</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-green-400">
                      <Check className="w-4 h-4 mr-1" />
                      <span>Berlangganan Aktif</span>
                    </div>
                  )}
                </div>
              </div>

              {/* <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Keluar</span>
              </button> */}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Message */}
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-white mb-2">
            Selamat datang, {user.username}! 👋
          </h2>
          <p className="text-gray-300">
            Akses game favorit Anda dengan token yang tersedia
          </p>
        </div>

        {/* Subscription Status */}
        <div className="mb-6 p-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {isSubscriptionExpired ? (
                <AlertTriangle className="w-6 h-6 text-red-400" />
              ) : (
                <Check className="w-6 h-6 text-green-400" />
              )}
              <div>
                <h3
                  className={`font-semibold ${
                    isSubscriptionExpired ? "text-red-400" : "text-green-400"
                  }`}
                >
                  {isSubscriptionExpired
                    ? "Berlangganan Telah Berakhir"
                    : "Berlangganan Aktif"}
                </h3>
                <p className="text-gray-300 text-sm">
                  {isSubscriptionExpired
                    ? `Berakhir pada ${new Date(
                        user.subscription_expiry
                      ).toLocaleDateString("id-ID")}`
                    : remainingDays > 0
                    ? `${remainingDays} hari tersisa`
                    : "Berakhir hari ini"}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-gray-400">
              <Clock className="w-4 h-4" />
              <span className="text-sm">
                {user.subscription_expiry
                  ? new Date(user.subscription_expiry).toLocaleDateString(
                      "id-ID"
                    )
                  : "Tidak ada data"}
              </span>
            </div>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Cari game..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all"
            />
            <GamepadIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all"
            >
              <option value="">Semua Kategori</option>
              {Array.isArray(categories) && categories.length > 0 ? (
                categories
                  .filter((cat) => cat.is_active !== false)
                  .map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))
              ) : (
                <option value="" disabled>
                  Belum ada kategori
                </option>
              )}
            </select>
          </div>
        </div>

        {/* Games Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredGames.map((game) => (
            <div
              key={game.id}
              className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl overflow-hidden hover:bg-white/15 transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="aspect-video bg-gradient-to-br from-purple-600 to-pink-600 relative overflow-hidden">
                {game.image_url ? (
                  <img
                    src={game.image_url}
                    alt={game.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <GamepadIcon className="w-12 h-12 text-white/50" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-2 left-2 right-2">
                  <h3 className="text-white font-semibold text-lg truncate">
                    {game.name}
                  </h3>
                </div>
                {/* Category badge */}
                {game.category_name && (
                  <div
                    className="absolute top-2 left-2 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1"
                    style={{
                      backgroundColor: game.category_color || "#6366f1",
                      color: "#fff",
                      opacity: 0.9,
                    }}
                  >
                    <Tag className="w-3 h-3 mr-1" />
                    {game.category_name}
                  </div>
                )}
              </div>

              <div className="p-4">
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleCopyToken(game.id)}
                    disabled={isSubscriptionExpired}
                    className="flex-1 flex items-center justify-center space-x-2 p-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                  >
                    {copiedTokens[game.id] ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span className="text-sm">Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span className="text-sm">Salin Token</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleReportGame(game)}
                    disabled={isSubscriptionExpired}
                    className="flex-1 flex items-center justify-center space-x-2 p-3 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span className="text-sm">Laporkan</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="mt-8">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            limit={pagination.limit}
            onPageChange={handlePageChange}
          />
        </div>

        {/* Token Usage Tutorial (moved below pagination) */}
        <div className="mt-10 mb-8 p-6 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-xl mx-auto">
          <h3 className="text-xl font-bold text-white mb-4">
            Cara Menggunakan Token Game
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-200">
            <li>
              Unduh dan instal{" "}
              <span className="font-semibold text-white">
                Poorboy Gaming launcher
              </span>
            </li>
            <li>Salin token untuk game yang ingin Anda mainkan</li>
            <li>Tempel token pada kolom autentikasi di launcher</li>
            <li>
              Launcher akan mendekripsi token dan secara otomatis masuk ke game
            </li>
            <li>Selamat bermain!</li>
          </ol>
        </div>

        {/* Empty State */}
        {filteredGames.length === 0 && !loading && (
          <div className="text-center py-12">
            <GamepadIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">
              Tidak Ada Game Tersedia
            </h3>
            <p className="text-gray-400">
              Belum ada game yang ditambahkan ke perpustakaan.
            </p>
          </div>
        )}
      </div>

      {/* Report Modal */}
      {showReportModal && selectedGame && (
        <GameReportModal
          game={selectedGame}
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          onReportSubmitted={handleReportSubmitted}
        />
      )}

      {/* Notification */}
      <Notification
        type={notification.type}
        message={notification.message}
        isVisible={notification.isVisible}
        onClose={() => setNotification({ ...notification, isVisible: false })}
      />
    </div>
  );
};

export default UserDashboard;
