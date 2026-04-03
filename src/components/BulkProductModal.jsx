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
            // Since we don't have a bulk API, we iterate
            // To be more efficient and avoid sequence issues, we could use Promise.all
            // but for inventory bulk entry, sequence often doesn't matter.
            await Promise.all(validRows.map(row => 
                api.post('/products', {
                    ...row,
                    quantity: parseInt(row.quantity) || 0,
                    price: parseFloat(row.price) || 0
                })
            ));
            
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
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-2 sm:p-4">
            <div className={`w-full max-w-6xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] ${darkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white'}`}>
                {/* Header */}
                <div className={`px-6 py-5 flex items-center justify-between border-b ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
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

                {/* Table Body */}
                <div className="flex-1 overflow-auto p-4 sm:p-6">
                    {error && (
                        <div className="mb-4 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm flex items-center gap-3">
                            <AlertCircle size={18} /> {error}
                        </div>
                    )}

                    <div className="min-w-[800px]">
                        <div className={`grid grid-cols-12 gap-3 mb-3 px-2 text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                            <div className="col-span-3">{t.name} *</div>
                            <div className="col-span-2">{t.sku}</div>
                            <div className="col-span-2">{t.category}</div>
                            <div className="col-span-2">{t.brand}</div>
                            <div className="col-span-1">{t.quantity} *</div>
                            <div className="col-span-1">{t.price} *</div>
                            <div className="col-span-1 text-center">X</div>
                        </div>

                        <div className="space-y-2">
                            {rows.map((row, idx) => (
                                <div key={idx} className="grid grid-cols-12 gap-3 items-center group">
                                    <div className="col-span-3">
                                        <input
                                            type="text"
                                            placeholder={t.name}
                                            className={`w-full px-3 py-2.5 rounded-xl border-2 outline-none transition-all text-sm font-medium ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-100 focus:border-blue-500' : 'bg-slate-50 border-slate-100 focus:border-blue-500'}`}
                                            value={row.name}
                                            onChange={(e) => handleCellChange(idx, 'name', e.target.value)}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <input
                                            type="text"
                                            placeholder="SKU"
                                            className={`w-full px-3 py-2.5 rounded-xl border-2 outline-none transition-all text-sm font-medium ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-100 focus:border-blue-500' : 'bg-slate-50 border-slate-100 focus:border-blue-500'}`}
                                            value={row.sku}
                                            onChange={(e) => handleCellChange(idx, 'sku', e.target.value)}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <input
                                            type="text"
                                            placeholder={t.category}
                                            className={`w-full px-3 py-2.5 rounded-xl border-2 outline-none transition-all text-sm font-medium ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-100 focus:border-blue-500' : 'bg-slate-50 border-slate-100 focus:border-blue-500'}`}
                                            value={row.category}
                                            onChange={(e) => handleCellChange(idx, 'category', e.target.value)}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <input
                                            type="text"
                                            placeholder={t.brand}
                                            className={`w-full px-3 py-2.5 rounded-xl border-2 outline-none transition-all text-sm font-medium ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-100 focus:border-blue-500' : 'bg-slate-50 border-slate-100 focus:border-blue-500'}`}
                                            value={row.brand}
                                            onChange={(e) => handleCellChange(idx, 'brand', e.target.value)}
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <input
                                            type="number"
                                            placeholder="0"
                                            className={`w-full px-3 py-2.5 rounded-xl border-2 border-dashed outline-none transition-all text-sm font-black text-center ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-100 focus:border-blue-500' : 'bg-white border-slate-200 focus:border-blue-500'}`}
                                            value={row.quantity}
                                            onChange={(e) => handleCellChange(idx, 'quantity', e.target.value)}
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <input
                                            type="number"
                                            placeholder="0.00"
                                            className={`w-full px-3 py-2.5 rounded-xl border-2 border-dashed outline-none transition-all text-sm font-black text-center ${darkMode ? 'bg-slate-800 border-slate-700 text-blue-400 focus:border-blue-500' : 'bg-white border-slate-200 text-blue-600 focus:border-blue-500'}`}
                                            value={row.price}
                                            onChange={(e) => handleCellChange(idx, 'price', e.target.value)}
                                        />
                                    </div>
                                    <div className="col-span-1 flex justify-center">
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
                        </div>

                        <button
                            onClick={addRow}
                            className={`mt-6 w-full py-4 rounded-2xl border-2 border-dashed flex items-center justify-center gap-2 font-bold transition-all ${darkMode ? 'border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-400 hover:bg-slate-800/30' : 'border-slate-100 text-slate-400 hover:border-slate-200 hover:text-slate-500 hover:bg-slate-50'}`}
                        >
                            <Plus size={20} /> {t.addRow}
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className={`px-6 py-5 border-t flex items-center justify-between ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                    <div className="text-xs text-slate-500 font-medium">
                        * {t.required.toLowerCase()} maydonlar
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className={`px-6 py-2.5 rounded-xl font-bold transition-all ${darkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-100'}`}
                        >
                            {t.cancel}
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="bg-blue-600 text-white px-10 py-2.5 rounded-xl font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-500/30 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
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
