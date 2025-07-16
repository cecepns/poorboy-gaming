import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, DollarSign, Calendar, ToggleLeft, ToggleRight, Search } from 'lucide-react';
import axios from 'axios';
import Pagination from './Pagination';

const SubscriptionManagement = () => {
  const [plans, setPlans] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
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
    duration_days: '',
    price: '',
    currency: 'IDR',
    is_active: true
  });

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchPlans();
  }, [currentPage, debouncedSearchTerm]);

  const fetchPlans = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20'
      });
      
      if (debouncedSearchTerm) {
        params.append('search', debouncedSearchTerm);
      }
      
      const response = await axios.get(`/admin/subscription-plans?${params}`);
      setPlans(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleEdit = (plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      duration_days: plan.duration_days,
      price: plan.price,
      currency: plan.currency,
      is_active: plan.is_active
    });
    setShowModal(true);
  };

  const handleDelete = async (planId) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus paket berlangganan ini?')) {
      try {
        await axios.delete(`/admin/subscription-plans/${planId}`);
        fetchPlans();
      } catch (error) {
        console.error('Error deleting subscription plan:', error);
        alert('Error menghapus paket berlangganan');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (editingPlan) {
        await axios.put(`/admin/subscription-plans/${editingPlan.id}`, formData);
      } else {
        await axios.post('/admin/subscription-plans', formData);
      }
      fetchPlans();
      closeModal();
    } catch (error) {
      console.error('Error saving subscription plan:', error);
      alert('Error menyimpan paket berlangganan');
    }
    
    setLoading(false);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingPlan(null);
    setFormData({
      name: '',
      duration_days: '',
      price: '',
      currency: 'IDR',
      is_active: true
    });
  };

  const formatPrice = (price, currency) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: currency || 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-3xl font-bold text-white">Manajemen Paket Berlangganan</h2>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Paket</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-2 focus-within:ring-2 focus-within:ring-purple-400/20 transition-all">
        <Search className="w-4 h-4 text-gray-400 mr-2" />
        <input
          type="text"
          placeholder="Cari paket berlangganan..."
          value={searchTerm}
          onChange={handleSearch}
          className="w-full bg-transparent text-white placeholder-gray-400 focus:outline-none"
        />
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {plans.map((plan) => (
          <div key={plan.id} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 hover:bg-white/15 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">{plan.name}</h3>
                  <p className="text-gray-400 text-sm">{plan.duration_days} hari</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {plan.is_active ? (
                  <ToggleRight className="w-4 h-4 text-green-400" />
                ) : (
                  <ToggleLeft className="w-4 h-4 text-gray-400" />
                )}
              </div>
            </div>
            
            <div className="mb-4">
              <div className="text-2xl font-bold text-white mb-1">
                {formatPrice(plan.price, plan.currency)}
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <Calendar className="w-4 h-4" />
                <span>{plan.duration_days} hari</span>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => handleEdit(plan)}
                className="flex-1 flex items-center justify-center space-x-1 p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
              >
                <Edit className="w-4 h-4" />
                <span className="text-sm">Edit</span>
              </button>
              <button
                onClick={() => handleDelete(plan.id)}
                className="flex-1 flex items-center justify-center space-x-1 p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span className="text-sm">Hapus</span>
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
      {plans.length === 0 && (
        <div className="text-center py-12">
          <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-300 mb-2">Tidak Ada Paket Berlangganan</h3>
          <p className="text-gray-400">Mulai dengan menambahkan paket berlangganan pertama.</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-white/20 rounded-2xl p-8 w-full max-w-md">
            <h3 className="text-2xl font-bold text-white mb-6">
              {editingPlan ? 'Edit Paket Berlangganan' : 'Tambah Paket Berlangganan Baru'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">Nama Paket</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all"
                  placeholder="Masukkan nama paket"
                  required
                  disabled={loading}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">Durasi (Hari)</label>
                <input
                  type="number"
                  value={formData.duration_days}
                  onChange={(e) => setFormData({ ...formData, duration_days: e.target.value })}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all"
                  placeholder="30"
                  min="1"
                  required
                  disabled={loading}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">Harga</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all"
                  placeholder="100000"
                  min="0"
                  step="1000"
                  required
                  disabled={loading}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">Mata Uang</label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all"
                  disabled={loading}
                >
                  <option value="IDR">IDR (Rupiah)</option>
                  <option value="USD">USD (Dollar)</option>
                  <option value="EUR">EUR (Euro)</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-purple-600 bg-white/10 border-white/20 rounded focus:ring-purple-400 focus:ring-2"
                  disabled={loading}
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-200">
                  Paket Aktif
                </label>
              </div>
              
              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
                >
                  {loading ? 'Menyimpan...' : (editingPlan ? 'Perbarui Paket' : 'Tambah Paket')}
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

export default SubscriptionManagement;