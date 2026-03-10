import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import api from '../api/axios';
import { X, Upload, Check, AlertCircle, Camera, FileText } from 'lucide-react';

const OrderCheckModal = ({ order, onClose, darkMode }) => {
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState(null);
    const [items, setItems] = useState(order.items || []);
    const [notes, setNotes] = useState(order.notes || '');

    // Status Logic
    const isNew = order.status === 'NEW';
    const isExpected = order.status === 'EXPECTED' || order.status === 'PAID_WAITING';
    const isChecked = order.status === 'CHECKED';

    const isFullyReceived = items.every(item => (item.receivedQuantity || 0) === item.quantity);

    const handleFileUpload = (e) => {
        setFile(e.target.files[0]);
    };

    const handlePaymentSubmit = async () => {
        if (!file) return alert("Iltimos, to'lov chekini yuklang!");
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const uploadRes = await api.post('/upload', formData);

            await api.put(`/orders/${order.id}/status`, {
                status: 'EXPECTED',
                paymentReceipt: uploadRes.data.filePath,
                notes
            });
            onClose();
        } catch (err) {
            console.error(err);
            alert("Xatolik bo'ldi");
        } finally {
            setLoading(false);
        }
    };

    const handleItemCheck = async (itemId, receivedQuantity) => {
        const val = parseInt(receivedQuantity) || 0;
        // Update local state (optimistic)
        const newItems = items.map(i => i.id === itemId ? { ...i, receivedQuantity: val, checked: true } : i);
        setItems(newItems);

        try {
            await api.put(`/orders/items/${itemId}/verify`, { receivedQuantity: val });
        } catch (err) {
            console.error("Check failed", err);
        }
    };

    const handleCancelOrder = async () => {
        if (!confirm("Haqiqatan ham ushbu buyurtmani bekor qilmoqchimisiz?")) return;
        setLoading(true);
        try {
            await api.put(`/orders/${order.id}/status`, { status: 'CANCELLED' });
            onClose();
        } catch (err) {
            alert("Xatolik: " + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProgress = async () => {
        setLoading(true);
        try {
            await api.put(`/orders/${order.id}/status`, {
                status: order.status,
                notes: notes.trim()
            });
            onClose();
        } catch (err) {
            alert("Xatolik: " + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleArrivalSubmit = async () => {
        if (!isFullyReceived && !notes.trim()) {
            return alert("Buyurtma to'liq emas! Iltimos, nima yetishmasligini izohda yozib qoldiring.");
        }

        setLoading(true);
        try {
            await api.put(`/orders/${order.id}/status`, {
                status: 'CHECKED',
                notes: notes.trim()
            });
            onClose();
        } catch (err) {
            alert("Xatolik: " + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleDistributionSubmit = async () => {
        setLoading(true);
        try {
            const finalStatus = order.destinationType === 'WAREHOUSE' ? 'COMPLETED' : 'DELIVERED';
            await api.put(`/orders/${order.id}/status`, {
                status: finalStatus,
                notes: notes.trim()
            });
            onClose();
        } catch (err) {
            alert("Xatolik: " + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 sm:p-6 animate-fade-in text-slate-800">
            <div className={`rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] m-auto overflow-hidden flex flex-col ${darkMode ? 'bg-slate-900' : 'bg-white'}`}>
                {/* Header */}
                <div className={`p-6 border-b flex justify-between items-center ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                    <div>
                        <h2 className={`text-2xl font-black tracking-tight ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                            {isNew ? "To'lovni Tasdiqlash" :
                                isExpected ? "Qabul Qilish va Tekshirish" :
                                    isChecked ? "Taqsimlash" : "Buyurtma Tafsilotlari"}
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${darkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>ID: #{order.id}</span>
                            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/10 text-blue-500`}>{order.destinationType}</span>
                        </div>
                    </div>
                    <button onClick={onClose} className={`p-2 rounded-xl transition-all hover:rotate-90 ${darkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-400'}`}>
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-blue-500 scrollbar-track-transparent">
                    {/* Order Info Summary */}
                    <div className={`p-5 rounded-3xl border transition-all ${darkMode ? 'bg-slate-800/30 border-slate-800/50 text-slate-300' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1">Mijoz va Manzil</label>
                                <div className={`font-bold ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>{order.customer?.name}</div>
                                {order.customer?.phone && <div className="text-xs opacity-70 mt-1">{order.customer.phone}</div>}
                                {order.customer?.address && (
                                    <div className="text-xs mt-2 p-2 rounded-xl bg-blue-500/5 border border-blue-500/10 inline-block w-full">
                                        <div className="font-medium flex items-start gap-2">
                                            <span className="text-blue-500">📍</span>
                                            {order.customer.address}
                                        </div>
                                        {order.customer?.lat && (
                                            <a
                                                href={`https://www.google.com/maps?q=${order.customer.lat},${order.customer.lng}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="mt-2 text-blue-500 hover:underline flex items-center gap-1 font-bold"
                                            >
                                                Xaritada ochish →
                                            </a>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="text-right flex flex-col justify-between">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1">Jami Summa</label>
                                    <div className="font-black text-2xl text-blue-500">${order.totalAmount.toFixed(2)}</div>
                                </div>
                                <div className="mt-4">
                                    <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase ${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-white shadow-sm text-slate-600'}`}>
                                        Status: {order.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Step 1: Payment Upload */}
                    {isNew && (
                        <div className="space-y-4">
                            <label className={`block w-full border-3 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all ${darkMode
                                ? 'border-slate-800 hover:border-blue-500 hover:bg-slate-800/50'
                                : 'border-slate-200 hover:border-blue-500 hover:bg-blue-50/50'
                                }`}>
                                <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*,.pdf" />
                                <div className={`flex flex-col items-center gap-3 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                    <div className={`p-4 rounded-2xl ${darkMode ? 'bg-slate-800' : 'bg-white shadow-sm'}`}>
                                        <Upload size={32} className="text-blue-500" />
                                    </div>
                                    <span className="font-bold text-lg">{file ? file.name : "To'lov chekini yuklang"}</span>
                                    <p className="text-xs opacity-60">PDF yoki Rasm holatida (max 5MB)</p>
                                </div>
                            </label>

                            <div className="grid grid-cols-2 gap-4 pt-4">
                                <button
                                    onClick={handleCancelOrder}
                                    className={`py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${darkMode ? 'bg-slate-800 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500' : 'bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-500'}`}
                                >
                                    Bekor Qilish
                                </button>
                                <button
                                    onClick={handlePaymentSubmit}
                                    disabled={loading || !file}
                                    className="py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-500/30 hover:bg-blue-700 disabled:opacity-50 transition-all active:scale-95"
                                >
                                    {loading ? "Yuborilmoqda..." : "Tasdiqlash"}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Checklist / Receipt / Details */}
                    {!isNew && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-end mb-2">
                                <h3 className={`text-sm font-black uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Mahsulotlar Tekshiruvi</h3>
                                {!isNew && (
                                    <span className={`text-[10px] font-bold ${isFullyReceived ? 'text-emerald-500' : 'text-amber-500'}`}>
                                        {isFullyReceived ? "Hammasi to'liq" : "Qisman kelgan/topshirilgan"}
                                    </span>
                                )}
                            </div>

                            <div className="space-y-3">
                                {items.map((item) => (
                                    <div key={item.id} className={`p-4 rounded-2xl border transition-all ${item.receivedQuantity > 0
                                        ? (item.receivedQuantity < item.quantity ? (darkMode ? 'bg-amber-900/10 border-amber-900/50' : 'bg-amber-50/50 border-amber-100') : (darkMode ? 'bg-emerald-900/10 border-emerald-900/50' : 'bg-emerald-50/50 border-emerald-100'))
                                        : (darkMode ? 'bg-slate-800/40 border-slate-800' : 'bg-white border-slate-100')
                                        }`}>
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex-1">
                                                <p className={`font-bold ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>{item.productName}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] font-black uppercase text-blue-500">{item.category}</span>
                                                    <span className="w-1 h-1 rounded-full bg-slate-500"></span>
                                                    <span className="text-[10px] font-black uppercase text-slate-500">{item.quantity} ta buyurtma</span>
                                                </div>
                                            </div>

                                            {(isExpected || isChecked) ? (
                                                <div className="flex items-center gap-3">
                                                    <div className="flex flex-col items-center">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max={item.quantity}
                                                            placeholder="0"
                                                            className={`w-20 px-3 py-2 rounded-xl border-2 text-center font-black transition-all outline-none ${darkMode
                                                                ? 'bg-slate-900 border-slate-700 text-white focus:border-blue-500'
                                                                : 'bg-white border-slate-200 text-slate-900 focus:border-blue-500'} ${item.receivedQuantity < item.quantity && item.receivedQuantity > 0 ? 'border-amber-500' : ''}`}
                                                            value={item.receivedQuantity || ''}
                                                            onChange={(e) => handleItemCheck(item.id, e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-end">
                                                    <div className={`text-sm font-black ${item.receivedQuantity < item.quantity ? 'text-amber-500' : (darkMode ? 'text-slate-100' : 'text-slate-900')}`}>{item.receivedQuantity || 0} ta</div>
                                                    <div className="text-[10px] font-bold text-slate-500 uppercase">Qabul qilindi</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Notes Section */}
                            <div className="pt-4">
                                <label className={`text-xs font-black uppercase tracking-widest mb-2 block ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                    Izoh / Kommentariy {!isFullyReceived && isExpected && <span className="text-rose-500">* (Majburiy)</span>}
                                </label>
                                <textarea
                                    className={`w-full p-4 rounded-2xl border-2 transition-all outline-none text-sm resize-none ${darkMode
                                        ? 'bg-slate-800 border-slate-700 text-slate-200 focus:border-blue-500'
                                        : 'bg-slate-50 border-slate-100 text-slate-800 focus:border-blue-500'}`}
                                    rows="3"
                                    placeholder={isFullyReceived ? "Ixtiyoriy izoh..." : "Nima to'liq emasligini tushuntiring..."}
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    readOnly={!isExpected && !isChecked}
                                ></textarea>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mt-6">
                                {(isExpected || isChecked) && (
                                    <button
                                        onClick={handleCancelOrder}
                                        className={`py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all ${darkMode ? 'bg-slate-800 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500' : 'bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-500'}`}
                                    >
                                        Bekor Qilish
                                    </button>
                                )}

                                {isExpected && (
                                    <div className="grid grid-cols-1 gap-2">
                                        <button
                                            onClick={handleSaveProgress}
                                            disabled={loading}
                                            className={`py-2 rounded-xl font-bold uppercase tracking-wider text-[10px] border-2 transition-all ${darkMode ? 'border-slate-800 text-slate-400 hover:bg-slate-800' : 'border-slate-100 text-slate-500 hover:bg-slate-50'}`}
                                        >
                                            {loading ? "..." : "Hozircha Saqlash"}
                                        </button>
                                        <button
                                            onClick={handleArrivalSubmit}
                                            disabled={loading}
                                            className={`py-3 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-xl transition-all active:scale-95 ${!isFullyReceived && !notes.trim() ? 'bg-slate-400 cursor-not-allowed opacity-50' : 'bg-indigo-600 shadow-indigo-500/30 hover:bg-indigo-700'}`}
                                        >
                                            {loading ? "..." : "Taqsimlashga O'tish"}
                                        </button>
                                    </div>
                                )}

                                {isChecked && (
                                    <div className="grid grid-cols-1 gap-2">
                                        <button
                                            onClick={handleSaveProgress}
                                            disabled={loading}
                                            className={`py-2 rounded-xl font-bold uppercase tracking-wider text-[10px] border-2 transition-all ${darkMode ? 'border-slate-800 text-slate-400 hover:bg-slate-800' : 'border-slate-100 text-slate-500 hover:bg-slate-50'}`}
                                        >
                                            {loading ? "..." : "O'zgarishlarni Saqlash"}
                                        </button>
                                        <button
                                            onClick={handleDistributionSubmit}
                                            disabled={loading}
                                            className="py-3 bg-emerald-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-emerald-500/30 hover:bg-emerald-700 disabled:opacity-50 transition-all active:scale-95"
                                        >
                                            {loading ? "..." : order.destinationType === 'WAREHOUSE' ? "Skladga Kirim Qilish" : "Yetkazib Berish"}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default OrderCheckModal;
