import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, Search, GamepadIcon, Image, User, Lock, Tag, ChevronDown, X, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import Pagination from './Pagination';

// Searchable Select Component
const SearchableSelect = ({ 
  options, 
  value, 
  onChange, 
  placeholder, 
  disabled = false,
  searchPlaceholder = "Cari..."
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOption, setSelectedOption] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const selected = Array.isArray(options) ? options.find(option => option.id.toString() === value?.toString()) : null;
    setSelectedOption(selected);
  }, [value, options]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = Array.isArray(options) ? options.filter(option =>
    option.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  const handleSelect = (option) => {
    setSelectedOption(option);
    onChange(option.id.toString());
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = () => {
    setSelectedOption(null);
    onChange('');
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        className={`w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus-within:border-purple-400 focus-within:ring-2 focus-within:ring-purple-400/20 transition-all cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {selectedOption ? (
              <>
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: selectedOption.color }}
                />
                <span>{selectedOption.name}</span>
              </>
            ) : (
              <span className="text-gray-400">{placeholder}</span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {selectedOption && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-white/20 rounded-lg shadow-lg max-h-60 overflow-hidden">
          <div className="p-2 border-b border-white/10">
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-gray-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all"
              autoFocus
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div
                  key={option.id}
                  className="flex items-center space-x-3 px-4 py-3 hover:bg-white/10 cursor-pointer transition-colors"
                  onClick={() => handleSelect(option)}
                >
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: option.color }}
                  />
                  <span className="text-white">{option.name}</span>
                </div>
              ))
            ) : (
              <div className="px-4 py-3 text-gray-400 text-center">
                Tidak ada kategori ditemukan
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const GameManagement = ({ onStatsUpdate }) => {
  const [games, setGames] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingGame, setEditingGame] = useState(null);
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
    name: '',
    image_url: '',
    username: '',
    password: '',
    category_id: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchGames();
    fetchCategories();
  }, [currentPage, debouncedSearchTerm]);

  const fetchGames = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20'
      });
      
      if (debouncedSearchTerm) {
        params.append('search', debouncedSearchTerm);
      }
      
      const response = await axios.get(`/admin/games?${params}`);
      setGames(response.data.data);
      setPagination(response.data.pagination);
      if (onStatsUpdate) onStatsUpdate();
    } catch (error) {
      console.error('Error fetching games:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/admin/categories?limit=100');
      // Handle both array and object response formats
      const categoriesData = response.data?.data || response.data || [];
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleEdit = (game) => {
    setEditingGame(game);
    setFormData({
      name: game.name,
      image_url: game.image_url,
      username: game.username,
      password: game.password,
      category_id: game.category_id ? game.category_id.toString() : ''
    });
    setShowModal(true);
  };

  const handleDelete = async (gameId) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus game ini?')) {
      try {
        await axios.delete(`/admin/games/${gameId}`);
        fetchGames();
      } catch (error) {
        console.error('Error deleting game:', error);
        alert('Error menghapus game');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (editingGame) {
        await axios.put(`/admin/games/${editingGame.id}`, formData);
      } else {
        await axios.post('/admin/games', formData);
      }
      fetchGames();
      closeModal();
    } catch (error) {
      console.error('Error saving game:', error);
      alert('Error menyimpan game');
    }
    
    setLoading(false);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingGame(null);
    setShowPassword(false);
    setFormData({
      name: '',
      image_url: '',
      username: '',
      password: '',
      category_id: ''
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-3xl font-bold text-white">Manajemen Game</h2>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Game</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Cari game..."
          value={searchTerm}
          onChange={handleSearch}
          className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all"
        />
      </div>

      {/* Games Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {games.map((game) => (
          <div key={game.id} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl overflow-hidden hover:bg-white/15 transition-all duration-300 transform hover:-translate-y-1">
            <div className="aspect-video bg-gradient-to-br from-purple-600 to-pink-600 relative overflow-hidden">
              {game.image_url ? (
                <img
                  src={game.image_url}
                  alt={game.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <GamepadIcon className="w-12 h-12 text-white/50" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-2 left-2 right-2">
                <h3 className="text-white font-semibold text-lg truncate">{game.name}</h3>
              </div>
            </div>
            
            <div className="p-4">
              <div className="flex items-center justify-between text-sm text-gray-300 mb-3">
                <span>Ditambahkan: {new Date(game.created_at).toLocaleDateString()}</span>
                {game.category_name && (
                  <span 
                    className="px-2 py-1 rounded-full text-xs font-medium"
                    style={{ 
                      backgroundColor: `${game.category_color}20`,
                      color: game.category_color
                    }}
                  >
                    {game.category_name}
                  </span>
                )}
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center space-x-2 text-sm">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-300">Nama Pengguna: {game.username}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Lock className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-300">Kata Sandi: {'•'.repeat(game.password.length)}</span>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(game)}
                  className="flex-1 flex items-center justify-center space-x-1 p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  <span className="text-sm">Edit</span>
                </button>
                <button
                  onClick={() => handleDelete(game.id)}
                  className="flex-1 flex items-center justify-center space-x-1 p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="text-sm">Hapus</span>
                </button>
              </div>
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
      {games.length === 0 && (
        <div className="text-center py-12">
          <GamepadIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-300 mb-2">Tidak Ada Game Ditemukan</h3>
          <p className="text-gray-400">Mulai dengan menambahkan game pertama ke perpustakaan.</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-white/20 rounded-2xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-white mb-6">
              {editingGame ? 'Edit Game' : 'Tambah Game Baru'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  <GamepadIcon className="w-4 h-4 inline mr-1" />
                  Nama Game
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all"
                  placeholder="Masukkan nama game"
                  required
                  disabled={loading}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  <Image className="w-4 h-4 inline mr-1" />
                  URL Gambar
                </label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all"
                  placeholder="Masukkan URL gambar"
                  disabled={loading}
                />
                {formData.image_url && (
                  <div className="mt-2 aspect-video bg-gray-800 rounded-lg overflow-hidden">
                    <img
                      src={formData.image_url}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = '';
                      }}
                    />
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  Nama Pengguna Akun
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all"
                  placeholder="Nama pengguna akun Steam"
                  required
                  disabled={loading}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  <Lock className="w-4 h-4 inline mr-1" />
                  Kata Sandi Akun
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-3 pr-12 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all"
                    placeholder="Kata sandi akun Steam"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  <Tag className="w-4 h-4 inline mr-1" />
                  Kategori Game
                </label>
                <SearchableSelect
                  options={Array.isArray(categories) ? categories.filter(cat => cat.is_active).map(cat => ({
                    id: cat.id,
                    name: cat.name,
                    color: cat.color
                  })) : []}
                  value={formData.category_id}
                  onChange={(id) => setFormData({ ...formData, category_id: id })}
                  placeholder="Pilih kategori (Opsional)"
                  searchPlaceholder="Cari kategori..."
                  disabled={loading}
                />
              </div>
              
              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
                >
                  {loading ? 'Menyimpan...' : (editingGame ? 'Perbarui Game' : 'Tambah Game')}
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

export default GameManagement;