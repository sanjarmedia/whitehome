import { useState, useEffect } from 'react';
import api from '../api/axios';
import { X, Plus, Trash2, Save, Package, AlertTriangle } from 'lucide-react';

const STATUS_OPTIONS = [
    { value: 'NEW', label: 'Yangi' },
    { value: 'EXPECTED', label: 'Kutilmoqda' },
    { value: 'CHECKED', label: 'Tekshirildi' },
    { value: 'COMPLETED', label: 'Yakunlangan' },
    { value: 'DELIVERED', label: 'Yetkazildi' },
    { value: 'CANCELLED', label: 'Bekor' },
    { value: 'PENDING_APPROVAL', label: 'Tasdig\'ini kutmoqda' },
    { value: 'REJECTED', label: 'Rad etildi' },
];

const OrderEditModal = ({ order, onClose, onSaved, darkMode, t }) => {
    const STATUS_OPTIONS = [
        { value: 'NEW', label: t.status_NEW },
        { value: 'EXPECTED', label: t.status_EXPECTED },
        { value: 'CHECKED', label: t.status_CHECKED },
        { value: 'COMPLETED', label: t.status_COMPLETED },
        { value: 'DELIVERED', label: t.status_DELIVERED },
        { value: 'CANCELLED', label: t.status_CANCELLED },
        { value: 'PENDING_APPROVAL', label: t.status_PENDING_APPROVAL },
        { value: 'REJECTED', label: t.status_REJECTED },
        { value: 'PAID_WAITING', label: t.status_PAID_WAITING },
    ];

    const [products, setProducts] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [items, setItems] = useState([]);
    const [notes, setNotes] = useState('');
    const [status, setStatus] = useState('');
    const [customerId, setCustomerId] = useState('');
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);

    useEffect(() => {
        if (!order) return;
        setItems(order.items.map(i => ({
            id: i.id,
            productId: i.productId || '',
            productName: i.productName,
            quantity: i.quantity,
            price: i.price,
            category: i.category || '',
        })));
        setNotes(order.notes || '');
        setStatus(order.status);
        setCustomerId(order.customerId || '');

        const loadData = async () => {
            try {
                const [pRes, cRes] = await Promise.all([api.get('/products'), api.get('/customers')]);
                setProducts(pRes.data);
                setCustomers(cRes.data);
            } catch (e) { console.error(e); }
        };
        loadData();
    }, [order]);

    const handleItemChange = (index, field, value) => {
        const updated = [...items];
        if (field === 'productId' && value) {
            const p = products.find(p => p.id === parseInt(value));
            if (p) {
                updated[index] = {
                    ...updated[index],
                    productId: parseInt(value),
                    productName: p.name,
                    price: p.price,
                    category: p.category || '',
                };
                setItems(updated);
                return;
            }
        }
        updated[index] = { ...updated[index], [field]: value };
        setItems(updated);
    };

    const addItem = () => {
        setItems(prev => [...prev, { productId: '', productName: '', quantity: 1, price: 0, category: '' }]);
    };

    const removeItem = (index) => {
        if (items.length > 1) setItems(items.filter((_, i) => i !== index));
    };

    const total = items.reduce((s, i) => s + (parseFloat(i.price) || 0) * (parseInt(i.quantity) || 0), 0);

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put(`/orders/${order.id}`, {
                items: items.map(i => ({
                    productId: i.productId ? parseInt(i.productId) : null,
                    productName: i.productName,
                    quantity: parseInt(i.quantity),
                    price: parseFloat(i.price),
                    category: i.category,
                })),
                notes,
                customerId: customerId ? parseInt(customerId) : undefined,
            });
            // status alohida yangilanadi
            if (status !== order.status) {
                await api.put(`/orders/${order.id}/status`, { status });
            }
            onSaved();
        } catch (err) {
            alert('Xatolik: ' + (err.response?.data?.error || err.message));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirmDelete) { setConfirmDelete(true); return; }
        setDeleting(true);
        try {
            await api.delete(`/orders/${order.id}`);
            onSaved();
        } catch (err) {
            alert('Xatolik: ' + (err.response?.data?.error || err.message));
        } finally {
            setDeleting(false);
        }
    };

    const card = darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100';
    const inputCls = `w-full px-3 py-2 border rounded-lg outline-none text-sm transition-all ${darkMode
        ? 'bg-slate-700 border-slate-600 text-slate-100 focus:border-blue-400'
        : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500'
        }`;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className={`relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl border ${card}`}>
                {/* Header */}
                <div className={`sticky top-0 z-10 flex items-center justify-between p-5 border-b ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
                    <div>
                        <h2 className={`text-lg font-semibold ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                            {t.order} #{order.id} — {t.edit}
                        </h2>
                        <p className={`text-xs mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            {t.editOrderWarning}
                        </p>
                    </div>
                    <button onClick={onClose} className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
                        <X size={20} />
                    </button>
                </div>

                <div className="p-5 space-y-5">
                    {/* Status + Mijoz */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={`block text-xs font-semibold mb-1.5 uppercase tracking-wide ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                {t.status}
                            </label>
                            <select className={inputCls} value={status} onChange={e => setStatus(e.target.value)}>
                                {STATUS_OPTIONS.map(s => (
                                    <option key={s.value} value={s.value}>{s.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={`block text-xs font-semibold mb-1.5 uppercase tracking-wide ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                {t.customers}
                            </label>
                            <select className={inputCls} value={customerId} onChange={e => setCustomerId(e.target.value)}>
                                <option value="">{t.notSelected}</option>
                                {customers.map(c => (
                                    <option key={c.id} value={c.id}>
                                        {c.name} {c.phone ? `— ${c.phone}` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Mahsulotlar */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className={`text-xs font-semibold uppercase tracking-wide ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                {t.products}
                            </label>
                            <button onClick={addItem} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${darkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
                                <Plus size={13} /> {t.add}
                            </button>
                        </div>

                        <div className="space-y-2">
                            {items.map((item, idx) => (
                                <div key={idx} className={`p-3 rounded-xl border ${darkMode ? 'bg-slate-700/50 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
                                    <div className="flex gap-2 flex-wrap md:flex-nowrap items-end">
                                        {/* Mahsulot */}
                                        <div className="flex-1 min-w-[160px]">
                                            {idx === 0 && <label className={`block text-[10px] font-semibold mb-1 uppercase ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>{t.product}</label>}
                                            <div className="relative">
                                                <Package size={13} className={`absolute left-2.5 top-2.5 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                                                <select
                                                    className={`${inputCls} pl-7`}
                                                    value={item.productId || ''}
                                                    onChange={e => handleItemChange(idx, 'productId', e.target.value)}
                                                >
                                                    <option value="">{t.enterManually}</option>
                                                    {products.map(p => (
                                                        <option key={p.id} value={p.id}>
                                                            {p.name} [{t.stockLabel}: {p.quantity}]
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            {!item.productId && (
                                                <input
                                                    type="text"
                                                    className={`${inputCls} mt-1`}
                                                    placeholder={t.productNamePlaceholder}
                                                    value={item.productName}
                                                    onChange={e => handleItemChange(idx, 'productName', e.target.value)}
                                                />
                                            )}
                                        </div>

                                        {/* Soni */}
                                        <div className="w-20">
                                            {idx === 0 && <label className={`block text-[10px] font-semibold mb-1 uppercase ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>{t.quantityLabel}</label>}
                                            <input
                                                type="number" min="1"
                                                className={`${inputCls} text-center`}
                                                value={item.quantity}
                                                onChange={e => handleItemChange(idx, 'quantity', e.target.value)}
                                            />
                                        </div>

                                        {/* Narx */}
                                        <div className="w-28">
                                            {idx === 0 && <label className={`block text-[10px] font-semibold mb-1 uppercase ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>{t.price} ($)</label>}
                                            <input
                                                type="number" min="0" step="0.01"
                                                className={inputCls}
                                                value={item.price}
                                                onChange={e => handleItemChange(idx, 'price', e.target.value)}
                                            />
                                        </div>

                                        {/* Jami */}
                                        <div className="w-24 text-right">
                                            {idx === 0 && <label className={`block text-[10px] font-semibold mb-1 uppercase ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>{t.total}</label>}
                                            <div className={`py-2 text-sm font-bold ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                                                ${((parseFloat(item.price) || 0) * (parseInt(item.quantity) || 0)).toFixed(0)}
                                            </div>
                                        </div>

                                        {/* O'chirish */}
                                        <button
                                            onClick={() => removeItem(idx)}
                                            disabled={items.length <= 1}
                                            className={`p-2 rounded-lg transition-colors ${darkMode ? 'text-slate-500 hover:text-rose-400 hover:bg-rose-900/20' : 'text-slate-400 hover:text-rose-500 hover:bg-rose-50'} disabled:opacity-30`}
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Jami */}
                        <div className={`flex justify-end mt-3 pt-3 border-t ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                            <span className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                {t.total}: <span className="text-xl font-bold text-blue-600 ml-1">${total.toFixed(0)}</span>
                            </span>
                        </div>
                    </div>

                    {/* Izoh */}
                    <div>
                        <label className={`block text-xs font-semibold mb-1.5 uppercase tracking-wide ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            {t.notes}
                        </label>
                        <textarea
                            rows={2}
                            className={inputCls}
                            placeholder={t.optionalNotesPlaceholder}
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className={`sticky bottom-0 flex items-center justify-between p-5 border-t ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
                    {/* Delete */}
                    <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${confirmDelete
                            ? 'bg-rose-600 text-white border-rose-600 hover:bg-rose-700'
                            : darkMode ? 'border-slate-600 text-rose-400 hover:bg-rose-900/20 hover:border-rose-700' : 'border-rose-200 text-rose-600 hover:bg-rose-50'
                            } disabled:opacity-60`}
                    >
                        {deleting
                            ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            : <Trash2 size={15} />
                        }
                        {confirmDelete ? t.confirmDeleteWarning : t.delete}
                    </button>
                    {confirmDelete && (
                        <button onClick={() => setConfirmDelete(false)} className={`text-xs px-3 py-2 rounded-lg ${darkMode ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-500 hover:bg-slate-100'}`}>
                            {t.cancel}
                        </button>
                    )}

                    {/* Save */}
                    <div className="flex gap-2 ml-auto">
                        <button onClick={onClose} className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${darkMode ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-500 hover:bg-slate-100'}`}>
                            {t.close}
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-0.5 disabled:opacity-60"
                        >
                            {saving
                                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                : <Save size={15} />
                            }
                            {t.save}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderEditModal;
