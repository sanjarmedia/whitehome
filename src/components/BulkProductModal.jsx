import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Trash2, Save, AlertCircle } from 'lucide-react';
import useScrollLock from '../hooks/useScrollLock';
import api from '../api/axios';

const BulkProductModal = ({ isOpen, onClose, onSaved, darkMode, t }) => {
    const [rows, setRows] = useState([
        { name: '', sku: '', category: '', brand: '', quantity: '', price: '' }
    ]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useScrollLock(isOpen);

    if (!isOpen) return null;

    const addRow = () => {
        setRows([...rows, { name: '', sku: '', category: '', brand: '', quantity: '', price: '' }]);
    };

    const removeRow = (index) => {
        if (rows.length > 1) {
            setRows(rows.filter((_, i) => i !== index));
        }
    };

    const handleCellChange = (index, field, value) => {
        const newRows = [...rows];
        newRows[index][field] = value;
        setRows(newRows);
    };

    const handleSave = async () => {
        // Validation
        const validRows = rows.filter(r => r.name && r.quantity && r.price);
        if (validRows.length === 0) {
            setError ("Iltimos, kamida bitta mahsulot ma'lumotlarini (nomi, soni, narxi) to'liq kiriting.");
            return;
        }

        setLoading(true);
        setError(null);
        
        try {
            await api.post('/products/import', {
                products: validRows.map(row => ({
                    ...row,
                    quantity: parseInt(row.quantity) || 0,
                    price: parseFloat(row.price) || 0
                })),
                updateExisting: true // Always update if adding via bulk modal for convenience
            });
            
            alert(t.bulkSaveSuccess);
            onSaved();
            onClose();
        } catch (err) {
            console.error(err);
            setError(t.bulkSaveError + ": " + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-0 sm:p-4">
            <div className={`w-full h-full sm:h-auto sm:max-w-6xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col sm:max-h-[95vh] ${darkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white'}`}>
                {/* Header */}
                <div className={`px-6 py-5 flex items-center justify-between border-b shrink-0 ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                    <div>
                        <h2 className={`text-xl font-black tracking-tight ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                            {t.bulkAddTitle}
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">Excel kabi jadval orqali bir necha mahsulotni kiritishingiz mumkin</p>
                    </div>
                    <button onClick={onClose} className={`p-2 rounded-xl transition-all hover:bg-slate-100 dark:hover:bg-slate-800 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-auto p-4 sm:p-6 bg-slate-50/30 dark:bg-slate-900/30">
                    {error && (
                        <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm flex items-center gap-3">
                            <AlertCircle size={18} /> {error}
                        </div>
                    )}

                    {/* Desktop Header (Hidden on Mobile) */}
                    <div className="hidden md:grid grid-cols-12 gap-3 mb-3 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <div className="col-span-3">{t.name} *</div>
                        <div className="col-span-2">{t.sku}</div>
                        <div className="col-span-2">{t.category}</div>
                        <div className="col-span-2">{t.brand}</div>
                        <div className="col-span-1 text-center">{t.quantity} *</div>
                        <div className="col-span-1 text-center">{t.price} *</div>
                        <div className="col-span-1 text-center">X</div>
                    </div>

                    <div className="space-y-4 md:space-y-2 pb-20">
                        {rows.map((row, idx) => (
                            <div 
                                key={idx} 
                                className={`
                                    relative p-4 rounded-2xl border transition-all
                                    md:p-0 md:border-0 md:bg-transparent md:grid md:grid-cols-12 md:gap-3 md:items-center
                                    ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-100 shadow-sm md:shadow-none'}
                                `}
                            >
                                {/* Mobile Header Badge */}
                                <div className="md:hidden flex items-center justify-between mb-4 pb-3 border-b border-slate-700/50">
                                    <span className="text-xs font-black text-blue-500 uppercase tracking-widest">Mahsulot #{idx + 1}</span>
                                    <button
                                        onClick={() => removeRow(idx)}
                                        disabled={rows.length === 1}
                                        className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg disabled:opacity-0"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>

                                {/* Inputs */}
                                <div className="md:col-span-3 space-y-1 md:space-y-0">
                                    <label className="md:hidden text-[10px] font-black text-slate-500 uppercase ml-1 italic">{t.name} *</label>
                                    <input
                                        type="text"
                                        placeholder={t.name}
                                        className={`w-full px-4 py-3 md:py-2.5 rounded-xl border-2 outline-none transition-all text-sm font-medium ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-100 focus:border-blue-500' : 'bg-slate-50 border-slate-100 focus:border-blue-500'}`}
                                        value={row.name}
                                        onChange={(e) => handleCellChange(idx, 'name', e.target.value)}
                                    />
                                </div>

                                <div className="md:col-span-2 mt-3 md:mt-0 grid grid-cols-2 md:block gap-3">
                                    <div className="space-y-1 md:space-y-0">
                                        <label className="md:hidden text-[10px] font-black text-slate-500 uppercase ml-1 italic">SKU</label>
                                        <input
                                            type="text"
                                            placeholder="SKU"
                                            className={`w-full px-4 py-3 md:py-2.5 rounded-xl border-2 outline-none transition-all text-sm font-medium ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-100 focus:border-blue-500' : 'bg-slate-50 border-slate-100 focus:border-blue-500'}`}
                                            value={row.sku}
                                            onChange={(e) => handleCellChange(idx, 'sku', e.target.value)}
                                        />
                                    </div>
                                    <div className="md:hidden space-y-1 md:space-y-0">
                                        <label className="md:hidden text-[10px] font-black text-slate-500 uppercase ml-1 italic">{t.category}</label>
                                        <input
                                            type="text"
                                            placeholder={t.category}
                                            className={`w-full px-4 py-3 md:py-2.5 rounded-xl border-2 outline-none transition-all text-sm font-medium ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-100 focus:border-blue-500' : 'bg-slate-50 border-slate-100 focus:border-blue-500'}`}
                                            value={row.category}
                                            onChange={(e) => handleCellChange(idx, 'category', e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="hidden md:block col-span-2">
                                    <input
                                        type="text"
                                        placeholder={t.category}
                                        className={`w-full px-4 py-2.5 rounded-xl border-2 outline-none transition-all text-sm font-medium ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-100 focus:border-blue-500' : 'bg-slate-50 border-slate-100 focus:border-blue-500'}`}
                                        value={row.category}
                                        onChange={(e) => handleCellChange(idx, 'category', e.target.value)}
                                    />
                                </div>

                                <div className="md:col-span-2 mt-3 md:mt-0 grid grid-cols-2 md:block gap-3">
                                    <div className="space-y-1 md:space-y-0">
                                        <label className="md:hidden text-[10px] font-black text-slate-500 uppercase ml-1 italic">{t.brand}</label>
                                        <input
                                            type="text"
                                            placeholder={t.brand}
                                            className={`w-full px-4 py-3 md:py-2.5 rounded-xl border-2 outline-none transition-all text-sm font-medium ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-100 focus:border-blue-500' : 'bg-slate-50 border-slate-100 focus:border-blue-500'}`}
                                            value={row.brand}
                                            onChange={(e) => handleCellChange(idx, 'brand', e.target.value)}
                                        />
                                    </div>
                                    <div className="md:hidden space-y-1 md:space-y-0">
                                        <label className="md:hidden text-[10px] font-black text-slate-500 uppercase ml-1 italic">{t.quantity} *</label>
                                        <input
                                            type="number"
                                            placeholder="0"
                                            className={`w-full px-4 py-3 md:py-2.5 rounded-xl border-2 border-dashed outline-none transition-all text-sm font-black text-center ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-100 focus:border-blue-500' : 'bg-white border-slate-200 focus:border-blue-500'}`}
                                            value={row.quantity}
                                            onChange={(e) => handleCellChange(idx, 'quantity', e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="hidden md:block col-span-1">
                                    <input
                                        type="number"
                                        placeholder="0"
                                        className={`w-full px-4 py-2.5 rounded-xl border-2 border-dashed outline-none transition-all text-sm font-black text-center ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-100 focus:border-blue-500' : 'bg-white border-slate-200 focus:border-blue-500'}`}
                                        value={row.quantity}
                                        onChange={(e) => handleCellChange(idx, 'quantity', e.target.value)}
                                    />
                                </div>

                                <div className="md:col-span-1 mt-3 md:mt-0 space-y-1 md:space-y-0 text-center">
                                    <label className="md:hidden text-[10px] font-black text-slate-500 uppercase ml-1 italic">{t.price} *</label>
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        className={`w-full px-4 py-3 md:py-2.5 rounded-xl border-2 border-dashed outline-none transition-all text-sm font-black text-center ${darkMode ? 'bg-slate-800 border-slate-700 text-blue-400 focus:border-blue-500' : 'bg-white border-slate-200 text-blue-600 focus:border-blue-500'}`}
                                        value={row.price}
                                        onChange={(e) => handleCellChange(idx, 'price', e.target.value)}
                                    />
                                </div>

                                <div className="hidden md:flex col-span-1 justify-center">
                                    <button
                                        onClick={() => removeRow(idx)}
                                        disabled={rows.length === 1}
                                        className={`p-2 rounded-xl transition-all ${darkMode ? 'text-slate-600 hover:text-rose-400 hover:bg-rose-500/10' : 'text-slate-300 hover:text-rose-500 hover:bg-rose-50'} disabled:opacity-0`}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}

                        <button
                            onClick={addRow}
                            className={`mt-4 w-full py-5 rounded-2xl border-2 border-dashed flex items-center justify-center gap-2 font-black uppercase text-xs tracking-widest transition-all ${darkMode ? 'border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-400 hover:bg-slate-800/30' : 'border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-500 hover:bg-slate-50'}`}
                        >
                            <Plus size={20} /> {t.addRow}
                        </button>
                    </div>
                </div>

                {/* Footer (Sticky) */}
                <div className={`px-6 py-5 border-t shrink-0 flex items-center justify-between safe-bottom ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]'}`}>
                    <div className="hidden sm:block text-xs text-slate-500 font-black uppercase tracking-tighter">
                        * {t.required}
                    </div>
                    <div className="flex gap-3 w-full sm:w-auto">
                        <button
                            onClick={onClose}
                            className={`flex-1 sm:flex-none px-6 py-3 rounded-xl font-bold transition-all ${darkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-100'}`}
                        >
                            {t.cancel}
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="flex-[2] sm:flex-none bg-blue-600 text-white px-10 py-3 rounded-xl font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-500/30 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={18} />}
                            {t.save}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default BulkProductModal;
