import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Upload, Save } from 'lucide-react';
import api from '../api/axios';

const ProductModal = ({ isOpen, onClose, onSave, initialData, darkMode, t, categories = [], brands = [] }) => {
    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        description: '',
        quantity: 0,
        price: 0,
        brand: '',
        category: '',
        image: ''
    });

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        } else {
            setFormData({
                name: '',
                sku: '',
                description: '',
                quantity: 0,
                price: 0,
                brand: '',
                category: '',
                image: ''
            });
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in p-4">
            <div className={`w-[98%] sm:w-[95%] md:w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>
                {/* Header */}
                <div className={`px-6 py-4 flex items-center justify-between border-b ${darkMode ? 'border-slate-700' : 'border-slate-100'}`}>
                    <h2 className={`text-xl font-bold ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                        {initialData ? t.edit : t.add}
                    </h2>
                    <button onClick={onClose} className={`p-2 rounded-full transition-colors ${darkMode ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Name */}
                        <div className="md:col-span-2">
                            <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{t.name} *</label>
                            <input
                                required
                                type="text"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className={`w-full px-4 py-2.5 rounded-xl border outline-none focus:ring-2 focus:border-blue-500 transition-all ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                                placeholder={t.name}
                            />
                        </div>

                        {/* SKU */}
                        <div>
                            <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{t.sku}</label>
                            <input
                                type="text"
                                value={formData.sku || ''}
                                onChange={e => setFormData({ ...formData, sku: e.target.value })}
                                className={`w-full px-4 py-2.5 rounded-xl border outline-none focus:ring-2 focus:border-blue-500 transition-all ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                                placeholder={t.sku.split(' / ')[0]}
                            />
                        </div>

                        {/* Price */}
                        <div>
                            <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{t.price} ($)</label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={formData.price}
                                onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                                className={`w-full px-4 py-2.5 rounded-xl border outline-none focus:ring-2 focus:border-blue-500 transition-all ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                            />
                        </div>

                        {/* Brand */}
                        <div>
                            <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{t.brand}</label>
                            <input
                                type="text"
                                list="brands-list"
                                value={formData.brand || ''}
                                onChange={e => setFormData({ ...formData, brand: e.target.value })}
                                className={`w-full px-4 py-2.5 rounded-xl border outline-none focus:ring-2 focus:border-blue-500 transition-all ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                                placeholder={t.brand}
                            />
                            <datalist id="brands-list">
                                {brands.map(b => <option key={b} value={b} />)}
                            </datalist>
                        </div>

                        {/* Category */}
                        <div>
                            <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{t.category}</label>
                            <input
                                type="text"
                                list="categories"
                                value={formData.category || ''}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                className={`w-full px-4 py-2.5 rounded-xl border outline-none focus:ring-2 focus:border-blue-500 transition-all ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                                placeholder={t.category}
                            />
                            <datalist id="categories">
                                {categories.map(c => <option key={c} value={c} />)}
                            </datalist>
                        </div>

                        {/* Quantity */}
                        <div>
                            <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{t.quantity}</label>
                            <input
                                type="number"
                                min="0"
                                value={formData.quantity}
                                onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                                className={`w-full px-4 py-2.5 rounded-xl border outline-none focus:ring-2 focus:border-blue-500 transition-all ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                            />
                        </div>

                        {/* Image Upload */}
                        <div className="md:col-span-2">
                            <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{t.productImage}</label>
                            <div className="flex gap-2 items-center">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={async (e) => {
                                        const file = e.target.files[0];
                                        if (!file) return;
                                        const uploadData = new FormData();
                                        uploadData.append('file', file);
                                        try {
                                            const res = await api.post('/upload', uploadData, {
                                                headers: { 'Content-Type': 'multipart/form-data' }
                                            });
                                            setFormData({ ...formData, image: res.data.url });
                                        } catch (error) {
                                            console.error('Rasm yuklashda xatolik:', error);
                                            alert(t.imageUploadError);
                                        }
                                    }}
                                    className="hidden"
                                    id="image-upload"
                                />
                                <label
                                    htmlFor="image-upload"
                                    className={`px-4 py-2.5 rounded-xl border border-dashed cursor-pointer flex items-center justify-center gap-2 transition-all flex-1 ${
                                        darkMode ? 'bg-slate-700/50 hover:bg-slate-700 border-slate-600' : 'bg-slate-50 hover:bg-slate-100 border-slate-300'
                                    }`}
                                >
                                    <Upload size={20} className={darkMode ? 'text-slate-400' : 'text-slate-500'} />
                                    <span className={darkMode ? 'text-slate-300' : 'text-slate-600'}>{t.selectImage}</span>
                                </label>
                                {formData.image && (
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, image: '' })}
                                        className={`px-3 py-2.5 rounded-xl border transition-all ${
                                            darkMode ? 'bg-rose-900/30 text-rose-400 border-rose-800/50 hover:bg-rose-900/50' : 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100'
                                        }`}
                                        title="Rasmni o'chirish"
                                    >
                                        <X size={20} />
                                    </button>
                                )}
                            </div>
                            {formData.image && (
                                <div className="mt-3 h-40 w-full rounded-xl border border-dashed flex items-center justify-center relative overflow-hidden bg-white dark:bg-slate-800 p-2">
                                    <img src={formData.image} alt="Preview" className="h-full object-contain" />
                                </div>
                            )}
                        </div>

                        {/* Description */}
                        <div className="md:col-span-2">
                            <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{t.description}</label>
                            <textarea
                                rows={3}
                                value={formData.description || ''}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                className={`w-full px-4 py-2.5 rounded-xl border outline-none focus:ring-2 focus:border-blue-500 transition-all ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className={`px-6 py-2.5 rounded-xl font-medium transition-colors ${darkMode ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
                        >
                            {t.cancel}
                        </button>
                        <button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-medium shadow-lg shadow-blue-500/30 transition-all active:scale-95 flex items-center gap-2"
                        >
                            <Save size={20} /> {t.save}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};

export default ProductModal;
