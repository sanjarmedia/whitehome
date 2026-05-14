import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import useScrollLock from '../hooks/useScrollLock';
import api from '../api/axios';
import {
    X, Save, Trash2, Plus, Package,
    Upload, Pencil, Eye, AlertTriangle, Printer, FileImage, CheckCircle
} from 'lucide-react';

// Backend static fayl URL ni hosil qilish
const getFileUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const clean = path.replace(/\\/g, '/').replace(/^\//, '');
    return `${window.location.protocol}//${window.location.hostname}:3000/${clean}`;
};

const OrderModal = ({ order, onClose, onSaved, darkMode, defaultMode = 'view', t }) => {
    const [mode, setMode] = useState(defaultMode);
    
    useScrollLock(true); // Since it's only rendered when open

    const STATUS_OPTIONS = [
        { value: 'NEW', label: t.new },
        { value: 'EXPECTED', label: t.expected },
        { value: 'CHECKED', label: t.checked },
        { value: 'COMPLETED', label: t.completed },
        { value: 'DELIVERED', label: t.delivered },
        { value: 'CANCELLED', label: t.cancelled },
        { value: 'PENDING_APPROVAL', label: t.pendingApproval },
        { value: 'REJECTED', label: t.rejected },
    ];

    const STATUS_COLORS = {
        NEW: 'bg-amber-100 text-amber-800',
        EXPECTED: 'bg-blue-100 text-blue-800',
        CHECKED: 'bg-indigo-100 text-indigo-800',
        COMPLETED: 'bg-emerald-100 text-emerald-800',
        DELIVERED: 'bg-green-100 text-green-800',
        CANCELLED: 'bg-rose-100 text-rose-800',
        PENDING_APPROVAL: 'bg-amber-100 text-amber-800',
        REJECTED: 'bg-rose-100 text-rose-800',
    };

    // VIEW state
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState(null);
    const [viewItems, setViewItems] = useState([]);
    const [viewNotes, setViewNotes] = useState('');

    // EDIT state
    const [products, setProducts] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [editItems, setEditItems] = useState([]);
    const [editNotes, setEditNotes] = useState('');
    const [editStatus, setEditStatus] = useState('');
    const [editCustomerId, setEditCustomerId] = useState('');

    // Yangi to'lov kiritish formasi uchun
    const [newPaymentAmount, setNewPaymentAmount] = useState('');
    const [newPaymentNote, setNewPaymentNote] = useState('');
    const [newPaymentFile, setNewPaymentFile] = useState(null);
    const [isAddingPayment, setIsAddingPayment] = useState(false);

    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);

    const isNew = order.status === 'NEW';
    const isExpected = ['EXPECTED', 'PAID_WAITING'].includes(order.status);
    const isChecked = order.status === 'CHECKED';
    const isFullyReceived = viewItems.every(i => (i.receivedQuantity || 0) >= i.quantity);

    useEffect(() => {
        setViewItems(order.items || []);
        setViewNotes(order.notes || '');
        setEditItems((order.items || []).map(i => ({
            id: i.id,
            productId: i.productId || '',
            productName: i.productName,
            quantity: i.quantity,
            price: i.price,
            category: i.category || '',
        })));
        setEditNotes(order.notes || '');
        setEditStatus(order.status);
        setEditCustomerId(order.customerId || '');

        // Yangi to'lov state reset
        setNewPaymentAmount('');
        setNewPaymentNote('');
        setNewPaymentFile(null);

        api.get('/products', { params: { limit: 1000 } }).then(r => setProducts(r.data?.data || r.data)).catch(() => { });
        api.get('/customers', { params: { limit: 1000 } }).then(r => setCustomers(r.data?.data || r.data)).catch(() => { });
    }, [order]);

    // ── VIEW handlers ──
    const handleItemCheck = async (itemId, val, maxQty) => {
        // String boshidagi 0 larni olib tashlaymiz (masalan "04" -> "4")
        let cleanVal = val.replace(/^0+(?=\d)/, '');

        if (cleanVal === '') {
            setViewItems(prev => prev.map(i => i.id === itemId ? { ...i, receivedQuantity: '', checked: true } : i));
            return;
        }

        const raw = parseInt(cleanVal, 10);
        if (isNaN(raw)) return;

        const v = Math.max(0, raw);
        setViewItems(prev => prev.map(i => i.id === itemId ? { ...i, receivedQuantity: String(v), checked: true } : i));
        try { await api.put(`/orders/items/${itemId}/verify`, { receivedQuantity: v }); } catch (e) { console.error(e); }
    };

    const handlePaymentSubmit = async () => {
        setLoading(true);
        try {
            let receiptPath = null;
            if (file) {
                const fd = new FormData();
                fd.append('file', file);
                const upRes = await api.post('/upload', fd);
                receiptPath = upRes.data.filePath;
            }
            const res = await api.put(`/orders/${order.id}/status`, { status: 'EXPECTED', paymentReceipt: receiptPath, notes: viewNotes });
            onSaved ? onSaved(res.data) : onClose();
        } catch { alert(t.errorOccurred); }
        finally { setLoading(false); }
    };

    const handleStatusAction = async (newStatus) => {
        if (newStatus === 'CHECKED' && !isFullyReceived && !viewNotes.trim())
            return alert(t.orderIncompleteNote);
        setLoading(true);
        try {
            const finalStatus = newStatus === 'DISTRIBUTE'
                ? (order.destinationType === 'WAREHOUSE' ? 'COMPLETED' : 'DELIVERED')
                : newStatus;
            const res = await api.put(`/orders/${order.id}/status`, { status: finalStatus, notes: viewNotes.trim() });
            onSaved ? onSaved(res.data) : onClose();
        } catch (err) { alert(t.errorOccurred + ": " + (err.response?.data?.error || err.message)); }
        finally { setLoading(false); }
    };

    // ── Print hisobot ──
    const handlePrint = () => {
        const receiptUrl = getFileUrl(order.paymentReceipt);
        const isPdf = receiptUrl && receiptUrl.toLowerCase().endsWith('.pdf');
        const langCode = t.report.includes('Hisobot') ? 'uz' : 'ru';
        const html = `
<!DOCTYPE html><html lang="${langCode}">
<head>
<meta charset="UTF-8">
<title>${t.order} #${order.id} ${t.report}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; padding: 32px; max-width: 720px; margin: auto; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #3b82f6; padding-bottom: 16px; margin-bottom: 24px; }
  .logo { font-size: 22px; font-weight: 900; color: #3b82f6; }
  .order-id { font-size: 14px; color: #64748b; margin-top: 4px; }
  .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; background: #dbeafe; color: #1d4ed8; }
  .section { margin-bottom: 20px; }
  .section h3 { font-size: 11px; text-transform: uppercase; letter-spacing: .1em; color: #94a3b8; margin-bottom: 8px; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .info-item label { font-size: 11px; color: #94a3b8; display: block; margin-bottom: 2px; }
  .info-item span { font-size: 14px; font-weight: 600; color: #1e293b; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; font-size: 11px; text-transform: uppercase; color: #94a3b8; padding: 8px 10px; border-bottom: 1px solid #e2e8f0; }
  td { padding: 10px 10px; font-size: 13px; border-bottom: 1px solid #f1f5f9; }
  tr:last-child td { border-bottom: none; }
  .total-row { background: #f8fafc; font-weight: 700; }
  .total-amount { font-size: 20px; color: #3b82f6; }
  .receipt-section { margin-top: 24px; padding: 16px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; }
  .receipt-section h3 { color: #16a34a; margin-bottom: 8px; }
  .receipt-img { max-width: 100%; max-height: 280px; border-radius: 6px; border: 1px solid #d1fae5; margin-top: 8px; }
  .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center; }
  @media print { body { padding: 16px; } }
</style>
</head>
<body>
<div class="header">
  <div>
    <div class="logo">📦 WhiteHome Inventory</div>
    <div class="order-id">${t.order} #${order.id} • ${new Date(order.createdAt).toLocaleDateString(langCode === 'uz' ? 'uz-UZ' : 'ru-RU')}</div>
  </div>
  <span class="status-badge">${t[order.status.toLowerCase()] || order.status}</span>
</div>

<div class="section">
  <h3>${t.orderDetails}</h3>
  <div class="info-grid">
    <div class="info-item"><label>${t.customerLabel}</label><span>${order.customer?.name || '—'}</span></div>
    <div class="info-item"><label>${t.phone}</label><span>${order.customer?.phone || '—'}</span></div>
    <div class="info-item"><label>${t.addressLabel}</label><span>${order.customer?.address || '—'}</span></div>
    <div class="info-item"><label>${t.type}</label><span>${order.orderSource === 'CUSTOMER_ISSUE' ? t.customerIssue : t.company}</span></div>
  </div>
</div>

<div class="section">
  <h3>${t.products}</h3>
  <table>
    <thead><tr><th>#</th><th>${t.name}</th><th>${t.quantity}</th><th>${t.price}</th><th>${t.total}</th></tr></thead>
    <tbody>
      ${(order.items || []).map((item, i) => `<tr><td>${i + 1}</td><td>${item.productName}</td><td>${item.quantity} ${langCode === 'uz' ? 'ta' : 'шт'}</td><td>$${Number(item.price).toFixed(2)}</td><td>$${(item.quantity * item.price).toFixed(2)}</td></tr>`).join('')}
      <tr class="total-row"><td colspan="4" style="text-align:right;padding-right:16px">${t.total.toUpperCase()}:</td><td class="total-amount">$${Number(order.totalAmount).toFixed(2)}</td></tr>
    </tbody>
  </table>
</div>

${order.notes ? `<div className="section"><h3>${t.notes}</h3><p style="font-size:13px;color:#475569">${order.notes}</p></div>` : ''}

${receiptUrl ? `<div class="receipt-section"><h3>💳 ${t.paymentReceipt}</h3>${isPdf ? `<a href="${receiptUrl}" target="_blank" style="color:#16a34a;font-weight:600">${t.viewPdfCheque}</a>` : `<img class="receipt-img" src="${receiptUrl}" alt="${t.paymentReceipt}" />`}</div>` : ''}

${(order.payments && order.payments.length > 0) ? `
<div class="section" style="margin-top:24px">
  <h3 style="color:#10b981; border-bottom:1px solid #d1fae5; padding-bottom:8px; margin-bottom:12px">💳 ${t.transactions}</h3>
  <table>
    <thead><tr><th>${t.date}</th><th>${t.notes}</th><th style="text-align:right">${t.sum}</th></tr></thead>
    <tbody>
      ${order.payments.map(p => `<tr><td>${new Date(p.createdAt).toLocaleString(langCode === 'uz' ? 'uz-UZ' : 'ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td><td>${p.note || '—'}</td><td style="text-align:right; font-weight:600; color:#10b981">$${Number(p.amount).toLocaleString()}</td></tr>`).join('')}
    </tbody>
  </table>
  <div style="text-align:right; margin-top:8px; font-size:14px; font-weight:bold; color:#059669">
     ${t.paidAmount}: $${Number(order.paidAmount || 0).toLocaleString()}
  </div>
</div>
` : ''}

<div class="footer">${t.reportGeneratedAt} ${new Date().toLocaleString(langCode === 'uz' ? 'uz-UZ' : 'ru-RU')}</div>
</body></html>`;
        const w = window.open('', '_blank');
        w.document.write(html);
        w.document.close();
        setTimeout(() => w.print(), 600);
    };

    // ── EDIT handlers ──
    const handleEditItemChange = (idx, field, value) => {
        const updated = [...editItems];
        if (field === 'productId' && value) {
            const p = products.find(p => p.id === parseInt(value));
            if (p) {
                updated[idx] = { ...updated[idx], productId: parseInt(value), productName: p.name, price: p.price, category: p.category || '' };
                setEditItems(updated);
                return;
            }
        }
        updated[idx] = { ...updated[idx], [field]: value };
        setEditItems(updated);
    };

    const handleSaveEdit = async () => {
        if (['COMPLETED', 'CANCELLED'].includes(order.status)) {
            const confirmed = window.confirm(t.editCompletedOrderWarning);
            if (!confirmed) return;
        }

        setSaving(true);
        try {
            let updatedOrder;
            const res = await api.put(`/orders/${order.id}`, {
                items: editItems.map(i => ({
                    productId: i.productId ? parseInt(i.productId) : null,
                    productName: i.productName,
                    quantity: parseInt(i.quantity),
                    price: parseFloat(i.price),
                    category: i.category,
                })),
                notes: editNotes,
                customerId: editCustomerId ? parseInt(editCustomerId) : undefined,
            });
            updatedOrder = res.data;
            if (editStatus !== order.status) {
                const statusRes = await api.put(`/orders/${order.id}/status`, { status: editStatus });
                updatedOrder = statusRes.data;
            }
            onSaved ? onSaved(updatedOrder) : onClose();
        } catch (err) { alert(t.errorOccurred + ": " + (err.response?.data?.error || err.message)); }
        finally { setSaving(false); }
    };

    const handleAddPayment = async () => {
        if (!newPaymentAmount || Number(newPaymentAmount) <= 0) return alert(t.required);
        setIsAddingPayment(true);
        try {
            let receiptUrl = null;
            if (newPaymentFile) {
                const formData = new FormData();
                formData.append('file', newPaymentFile);
                const upRes = await api.post('/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                receiptUrl = upRes.data.url;
            }

            const res = await api.post(`/orders/${order.id}/payments`, {
                amount: Number(newPaymentAmount),
                note: newPaymentNote,
                receiptUrl
            });
            setNewPaymentAmount('');
            setNewPaymentNote('');
            setNewPaymentFile(null);
            if (onSaved) onSaved(res.data.order);
            alert(t.paymentSuccess);
        } catch (err) {
            alert(t.errorOccurred + ": " + (err.response?.data?.error || err.message));
        } finally {
            setIsAddingPayment(false);
        }
    };

    const handleDelete = async () => {
        if (!confirmDelete) { setConfirmDelete(true); return; }
        setDeleting(true);
        try {
            await api.delete(`/orders/${order.id}`);
            onSaved ? onSaved() : onClose();
        } catch (err) { alert(t.errorOccurred + ": " + (err.response?.data?.error || err.message)); }
        finally { setDeleting(false); }
    };

    const editTotal = editItems.reduce((s, i) => s + (parseFloat(i.price) || 0) * (parseInt(i.quantity) || 0), 0);

    const base = darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-100';
    const inp = `w-full px-3 py-2 border rounded-lg outline-none text-sm transition-colors ${darkMode
        ? 'bg-slate-700 border-slate-600 text-slate-100 focus:border-blue-400'
        : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500'}`;
    const sec = darkMode ? 'text-slate-400' : 'text-slate-500';

    const content = (
        <>
            {/* Animatsiya style */}
            <style>{`
                @keyframes _om_bg { from{opacity:0} to{opacity:1} }
                @keyframes _om_up { from{opacity:0;transform:translateY(18px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
                ._om_bg   { animation: _om_bg 0.2s ease forwards; }
                ._om_card { animation: _om_up 0.28s cubic-bezier(0.32,1.08,0.58,1) forwards; }
            `}</style>

            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4">
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm _om_bg" onClick={onClose} />

                {/* Karta */}
                <div className={`_om_card relative z-10 w-[98%] sm:w-[95%] md:w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl shadow-2xl border overflow-hidden ${base}`}>

                    {/* ── HEADER ── */}
                    <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 sm:px-5 py-4 border-b shrink-0 ${darkMode ? 'border-slate-700' : 'border-slate-100'}`}>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className={`font-semibold ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                                    {t.orders.slice(0, -1)} #{order.id}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${STATUS_COLORS[order.status] || 'bg-slate-100 text-slate-600'}`}>
                                    {STATUS_OPTIONS.find(s => s.value === order.status)?.label || order.status}
                                </span>
                            </div>
                            <p className={`text-xs mt-0.5 ${sec}`}>
                                {order.customer?.name || t.noCustomer} • {new Date(order.createdAt).toLocaleDateString(t.noData.includes('yuklanmadi') ? 'uz-UZ' : 'ru-RU')}
                            </p>
                        </div>
                        <div className="flex items-center gap-3 self-end sm:self-auto">
                            {/* Tab toggler - Premium Glassmorphism */}
                            <div className={`flex rounded-2xl p-1 shadow-inner ${darkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                                <button
                                    onClick={() => setMode('view')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${mode === 'view'
                                        ? (darkMode ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-blue-600 shadow-md')
                                        : sec + ' hover:text-blue-500'}`}
                                >
                                    <Eye size={14} strokeWidth={3} /> {t.view}
                                </button>
                                <button
                                    onClick={() => setMode('edit')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${mode === 'edit'
                                        ? 'bg-blue-600 text-white shadow-lg'
                                        : sec + ' hover:text-blue-500'}`}
                                >
                                    <Pencil size={14} strokeWidth={3} /> {t.edit}
                                </button>
                            </div>

                            <button onClick={onClose} className={`p-2.5 rounded-2xl transition-all active:scale-95 ${darkMode ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
                                <X size={22} strokeWidth={3} />
                            </button>
                        </div>
                    </div>

                    <div className={`px-5 py-2 border-b flex items-center justify-between gap-4 overflow-x-auto scrollbar-hide ${darkMode ? 'border-slate-700 bg-slate-900/50' : 'border-slate-100 bg-slate-50/50'}`}>
                         <div className="flex items-center gap-4 shrink-0">
                             <button
                                onClick={handlePrint}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-200 border ${darkMode ? 'border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-100' : 'border-slate-200 text-slate-500 hover:bg-white hover:text-slate-800 hover:shadow-sm'}`}
                            >
                                <Printer size={14} strokeWidth={2.5} /> {t.report}
                            </button>
                            {order.status === 'NEW' && (
                                <button onClick={() => handleStatusAction('CANCELLED')} className="text-[9px] font-black uppercase tracking-widest text-rose-500/70 hover:text-rose-500 transition-all">
                                    {t.cancel}
                                </button>
                            )}
                         </div>
                         {order.paymentReceipt && (
                             <a href={getFileUrl(order.paymentReceipt)} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase tracking-widest border border-emerald-500/20 whitespace-nowrap">
                                <FileImage size={12} strokeWidth={3} /> {t.paymentReceipt}
                             </a>
                         )}
                    </div>

                    {/* ── BODY ── */}
                    <div className="flex-1 overflow-y-auto">

                        {/* ══ VIEW MODE ══ */}
                        {mode === 'view' && (
                            <div className="p-5 space-y-4">
                                {/* Summary */}
                                <div className={`p-5 rounded-3xl border shadow-sm ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                                    <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
                                        <div className="space-y-3 w-full">
                                            <div>
                                                <p className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-blue-400' : 'text-blue-500'}`}>{order.destinationType === 'WAREHOUSE' ? t.mainWarehouse : t.customers.slice(0, -1)}</p>
                                                <p className={`text-xl font-black mt-1 ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                                                    {order.customer?.name || (order.destinationType === 'WAREHOUSE' ? t.mainWarehouse : '—')}
                                                </p>
                                            </div>
                                            
                                            <div className="flex flex-wrap gap-4">
                                                {order.customer?.phone && (
                                                    <div className="flex items-center gap-2">
                                                        <div className={`p-1.5 rounded-lg ${darkMode ? 'bg-slate-700 text-slate-400' : 'bg-white text-slate-400 shadow-sm'}`}>
                                                            <Package size={14} />
                                                        </div>
                                                        <p className={`text-xs font-bold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{order.customer.phone}</p>
                                                    </div>
                                                )}
                                                {order.customer?.address && (
                                                    <a
                                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.customer.address)}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${darkMode ? 'border-slate-700 bg-slate-700/50 text-blue-400 hover:border-blue-500/30' : 'border-slate-200 bg-white text-blue-600 hover:border-blue-300 shadow-sm'}`}
                                                    >
                                                        <span className="text-xs font-black uppercase tracking-widest">📍 {t.address}</span>
                                                    </a>
                                                )}
                                            </div>
                                        </div>

                                        <div className="shrink-0 w-full sm:w-auto p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-inner">
                                            <div className="space-y-2">
                                                <div className="flex justify-between gap-8 items-center">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t.total}:</span>
                                                    <span className="text-sm font-black text-slate-200">${(order.totalAmount || 0).toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between gap-8 items-center">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">{t.paidAmount}:</span>
                                                    <span className="text-sm font-black text-emerald-400">${order.status === 'NEW' ? 0 : (order.paidAmount || 0).toLocaleString()}</span>
                                                </div>
                                                <div className="pt-2 mt-2 border-t border-slate-800 flex justify-between gap-8 items-center">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-rose-500">{t.remainingDebt}:</span>
                                                    <span className="text-xl font-black text-rose-500">${Math.max(0, (order.totalAmount || 0) - (order.status === 'NEW' ? 0 : (order.paidAmount || 0))).toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* To'lovlar tarixi View */}
                                {(order.payments && order.payments.length > 0) && (
                                    <div className={`p-4 rounded-xl border ${darkMode ? 'bg-emerald-900/10 border-emerald-700/30' : 'bg-emerald-50 border-emerald-200'}`}>
                                        <h4 className={`text-xs font-semibold uppercase mb-3 ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>💳 {t.transactions}</h4>
                                        <div className="space-y-2">
                                            {order.payments.map((p, pIdx) => (
                                                <div key={p.id || pIdx} className={`flex items-center justify-between p-2.5 rounded-lg bg-white/50 dark:bg-slate-800/50 border ${darkMode ? 'border-slate-700' : 'border-slate-100'} backdrop-blur-sm`}>
                                                    <div className="flex-1">
                                                        <p className={`text-[11px] font-medium ${sec}`}>
                                                            {new Date(p.createdAt).toLocaleString('uz-UZ', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                        <div className="flex items-center gap-2">
                                                            <p className={`text-sm font-medium ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>{p.note || t.notSelected}</p>
                                                            {p.receiptUrl && (
                                                                <a href={getFileUrl(p.receiptUrl)} target="_blank" rel="noreferrer" title={t.viewFull} className="text-blue-500 hover:text-blue-600 transition-colors">
                                                                    <FileImage size={15} />
                                                                </a>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="font-bold text-emerald-500 text-base">
                                                        +${p.amount.toLocaleString()}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Payment upload (NEW) */}
                                {isNew && (
                                    <div>
                                        <label className={`block w-full border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${darkMode ? 'border-slate-700 hover:border-blue-500 hover:bg-slate-800/50' : 'border-slate-200 hover:border-blue-400 hover:bg-blue-50/50'}`}>
                                            <input type="file" className="hidden" onChange={e => setFile(e.target.files[0])} accept="image/*,.pdf" />
                                            <Upload size={28} className="mx-auto mb-2 text-blue-500" />
                                            <p className={`font-semibold text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                                                {file ? file.name : t.uploadReceipt}
                                            </p>
                                            <p className={`text-xs mt-1 ${sec}`}>PDF / Image (max 5MB)</p>
                                        </label>
                                        <div className="flex flex-col sm:flex-row gap-3 mt-4">
                                            <button onClick={() => handleStatusAction('CANCELLED')} className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${darkMode ? 'bg-slate-800 text-rose-400 hover:bg-rose-900/20' : 'bg-slate-100 text-rose-600 hover:bg-rose-50'}`}>
                                                {t.cancel}
                                            </button>
                                            <button onClick={handlePaymentSubmit} disabled={loading} className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-all">
                                                {loading ? t.loading : (file ? t.confirmWithPayment : t.confirmDebt)}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Items checklist */}
                                {!isNew && (
                                    <div className="space-y-2">
                                        <p className={`text-xs font-semibold uppercase ${sec}`}>Mahsulotlar</p>
                                        {viewItems.map(item => (
                                            <div key={item.id} className={`flex items-center justify-between p-3 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
                                                <div>
                                                    <p className={`font-medium text-sm ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{item.productName}</p>
                                                    <p className={`text-xs ${sec}`}>{item.quantity} ta • ${item.price}</p>
                                                </div>
                                                {(isExpected || isChecked) ? (
                                                    <div className="flex flex-col items-end gap-1">
                                                        <input
                                                            type="number" min="0" placeholder="0"
                                                            className={`w-20 px-2 py-1.5 border-2 rounded-lg text-center text-sm font-bold outline-none ${(item.receivedQuantity !== '' && item.receivedQuantity > item.quantity)
                                                                ? 'border-rose-500 bg-rose-900/20 text-rose-400'
                                                                : darkMode ? 'bg-slate-700 border-slate-600 text-white focus:border-blue-400' : 'bg-slate-50 border-slate-200 focus:border-blue-500'
                                                                }`}
                                                            value={item.receivedQuantity ?? ''}
                                                            onChange={e => {
                                                                const val = e.target.value;
                                                                handleItemCheck(item.id, val === '' ? '' : String(parseInt(val, 10)), item.quantity);
                                                            }}
                                                        />
                                                        {(item.receivedQuantity !== '' && item.receivedQuantity > item.quantity) && (
                                                            <span className="text-[10px] text-rose-500 font-semibold animate-pulse">
                                                                {t.auditLog.includes('Audit') ? `Ko'payib ketdi (Buyurtma: ${item.quantity})` : `Превышено (Заказ: ${item.quantity})`}
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className={`text-sm font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                                        {item.receivedQuantity || item.quantity} {t.auditLog.includes('Audit') ? 'ta' : 'шт'}
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Notes */}
                                {!isNew && (
                                    <textarea
                                        rows={2}
                                        className={`w-full px-3 py-2.5 border rounded-xl outline-none text-sm resize-none transition-colors ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200'} ${(!isExpected && !isChecked) ? 'opacity-60' : ''}`}
                                        placeholder={t.notes}
                                        value={viewNotes}
                                        onChange={e => setViewNotes(e.target.value)}
                                        readOnly={!isExpected && !isChecked}
                                    />
                                )}

                                {/* To'lov cheki */}
                                {order.paymentReceipt && (() => {
                                    const recUrl = getFileUrl(order.paymentReceipt);
                                    const isPdf = recUrl?.toLowerCase().endsWith('.pdf');
                                    return (
                                        <div className={`p-3 rounded-xl border ${darkMode ? 'bg-emerald-900/10 border-emerald-700/30' : 'bg-emerald-50 border-emerald-200'}`}>
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-xs font-semibold text-emerald-600 uppercase flex items-center gap-1.5">
                                                    <FileImage size={13} /> {t.auditLog.includes('Audit') ? 'To\'lov Cheki' : 'Чек оплаты'}
                                                </p>
                                                <a href={recUrl} target="_blank" rel="noreferrer"
                                                    className="text-xs text-emerald-600 hover:text-emerald-700 font-medium underline">
                                                    {t.auditLog.includes('Audit') ? 'To\'liq ko\'rish →' : 'Смотреть полностью →'}
                                                </a>
                                            </div>
                                            {isPdf
                                                ? <p className="text-xs text-emerald-700">📄 PDF fayl yuklangan</p>
                                                : <img src={recUrl} alt="To'lov cheki" className="w-full max-h-48 object-contain rounded-lg border border-emerald-200 bg-white" />
                                            }
                                        </div>
                                    );
                                })()}

                                {/* PENDING alert */}
                                {order.status === 'PENDING_APPROVAL' && (
                                    <div className={`flex gap-3 p-4 rounded-xl border ${darkMode ? 'bg-amber-900/10 border-amber-700/30' : 'bg-amber-50 border-amber-200'}`}>
                                        <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                                        <p className={`text-sm ${darkMode ? 'text-amber-300' : 'text-amber-800'}`}>{t.auditLog.includes('Audit') ? 'Sklad yetarli emas. Admin tasdig\'i kutilmoqda.' : 'Недостаточно на складе. Ожидается подтверждение админа.'}</p>
                                    </div>
                                )}

                                {/* Action buttons */}
                                {isExpected && (
                                    <div className="flex flex-col gap-3">
                                        <button 
                                            onClick={() => handleStatusAction('CHECKED')} 
                                            disabled={loading} 
                                            className="w-full py-4 bg-blue-600 text-white rounded-3xl text-sm font-black uppercase tracking-widest shadow-xl shadow-blue-500/40 transform transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                                        >
                                            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Package size={18} strokeWidth={3} />}
                                            {t.distribute}
                                        </button>
                                        <button 
                                            onClick={() => handleStatusAction('CANCELLED')} 
                                            className={`w-full py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-tighter transition-colors ${darkMode ? 'bg-slate-800 text-rose-400 hover:bg-rose-900/20' : 'bg-slate-100 text-rose-600 hover:bg-rose-50'}`}
                                        >
                                            {t.cancel}
                                        </button>
                                    </div>
                                )}
                                {isChecked && (
                                    <div className="flex flex-col gap-3">
                                        <button 
                                            onClick={() => handleStatusAction('DISTRIBUTE')} 
                                            disabled={loading} 
                                            className="w-full py-4 bg-emerald-600 text-white rounded-3xl text-sm font-black uppercase tracking-widest shadow-xl shadow-emerald-500/40 transform transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                                        >
                                            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle size={18} strokeWidth={3} />}
                                            {order.destinationType === 'WAREHOUSE' ? (t.auditLog.includes('Audit') ? 'Skladga kirim' : 'Приход на склад') : (t.auditLog.includes('Audit') ? 'Yetkazib berish' : 'Доставка')}
                                        </button>
                                        <button 
                                            onClick={() => handleStatusAction('CANCELLED')} 
                                            className={`w-full py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-tighter transition-colors ${darkMode ? 'bg-slate-800 text-rose-400 hover:bg-rose-900/20' : 'bg-slate-100 text-rose-600 hover:bg-rose-50'}`}
                                        >
                                            {t.cancel}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ══ EDIT MODE ══ */}
                        {mode === 'edit' && (
                            <div className="p-4 sm:p-5 space-y-4">
                                {/* Status + Mijoz */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className={`block text-xs font-semibold mb-1 uppercase ${sec}`}>{t.status}</label>
                                        <select className={inp} value={editStatus} onChange={e => setEditStatus(e.target.value)}>
                                            {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                        </select>
                                    </div>
                                     <div>
                                        <label className={`block text-xs font-semibold mb-1 uppercase ${sec}`}>{t.customers.slice(0, -1)}</label>
                                        <select className={inp} value={editCustomerId} onChange={e => setEditCustomerId(e.target.value)}>
                                            <option value="">{t.notSelected}</option>
                                            {customers.map(c => <option key={c.id} value={c.id}>{c.name}{c.phone ? ` — ${c.phone}` : ''}</option>)}
                                        </select>
                                    </div>
                                </div>

                                {/* Mahsulotlar */}
                                <div>
                                     <div className="flex justify-between items-center mb-2">
                                        <label className={`text-xs font-semibold uppercase ${sec}`}>{t.products}</label>
                                        <button
                                            onClick={() => setEditItems(p => [...p, { productId: '', productName: '', quantity: 1, price: 0, category: '' }])}
                                            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${darkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                                        >
                                            <Plus size={12} /> {t.add}
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        {editItems.map((item, idx) => (
                                            <div key={idx} className={`p-3 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                                                <div className="flex gap-2 flex-wrap md:flex-nowrap items-end">
                                                    <div className="flex-1 min-w-[120px]">
                                                        {idx === 0 && <label className={`hidden sm:block text-[10px] font-semibold mb-1 uppercase ${sec}`}>{t.product}</label>}
                                                        <div className="relative">
                                                            <Package size={12} className={`absolute left-2.5 top-2.5 ${sec}`} />
                                                            <select className={`${inp} pl-7 w-full`} value={item.productId || ''} onChange={e => handleEditItemChange(idx, 'productId', e.target.value)}>
                                                                <option value="">{t.enterManually}</option>
                                                                {products.map(p => <option key={p.id} value={p.id}>{p.name} [{t.stockLabel}: {p.quantity}]</option>)}
                                                            </select>
                                                        </div>
                                                        {!item.productId && (
                                                            <input type="text" className={`${inp} mt-1 w-full`} placeholder={t.productNamePlaceholder} value={item.productName} onChange={e => handleEditItemChange(idx, 'productName', e.target.value)} />
                                                        )}
                                                    </div>
                                                    <div className="flex gap-2 w-full sm:w-auto">
                                                        <div className="flex-1 sm:w-20">
                                                            {idx === 0 && <label className={`block text-[10px] font-semibold mb-1 uppercase ${sec}`}>{t.quantityLabel}</label>}
                                                            <input type="number" min="1" className={`${inp} text-center w-full`} value={item.quantity} onChange={e => handleEditItemChange(idx, 'quantity', e.target.value)} />
                                                        </div>
                                                        <div className="flex-1 sm:w-28">
                                                            {idx === 0 && <label className={`block text-[10px] font-semibold mb-1 uppercase ${sec}`}>{t.price} ($)</label>}
                                                            <input type="number" min="0" step="0.01" className={`${inp} w-full`} value={item.price} onChange={e => handleEditItemChange(idx, 'price', e.target.value)} />
                                                        </div>
                                                    </div>
                                                    <div className="w-full sm:w-20 text-right sm:text-right flex items-center sm:block justify-between mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-0 border-dashed border-slate-200 dark:border-slate-700">
                                                        {idx === 0 && <label className={`block text-[10px] font-semibold mb-1 uppercase ${sec}`}>{t.total}</label>}
                                                        <div className={`py-2 text-sm font-bold ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                                                            ${((parseFloat(item.price) || 0) * (parseInt(item.quantity) || 0)).toFixed(0)}
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => editItems.length > 1 && setEditItems(editItems.filter((_, i) => i !== idx))}
                                                        disabled={editItems.length <= 1}
                                                        className={`p-2 rounded-lg transition-colors ${darkMode ? 'text-slate-500 hover:text-rose-400 hover:bg-rose-900/20' : 'text-slate-400 hover:text-rose-500 hover:bg-rose-50'} disabled:opacity-30`}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className={`flex flex-col items-end mt-2 pt-2 border-t gap-2 ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                                        <span className={`text-sm ${sec}`}>{t.total}: <span className="text-lg font-bold text-blue-600 ml-2">${editTotal.toFixed(0)}</span></span>
                                    </div>
                                </div>

                                {/* Yangi To'lov qo'shish */}
                                <div className={`p-4 rounded-xl border ${darkMode ? 'bg-emerald-900/10 border-emerald-700/40' : 'bg-emerald-50/50 border-emerald-200'}`}>
                                    <div className="flex items-center justify-between mb-3">
                                        <label className={`text-xs font-semibold uppercase ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>💳 {t.addPayment}</label>
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${darkMode ? 'bg-slate-800 text-slate-300' : 'bg-white text-slate-600 border'}`}>
                                            {t.currentDebt}: ${Math.max(0, (order.totalAmount || 0) - (order.status === 'NEW' ? 0 : (order.paidAmount || 0))).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-3 items-end">
                                        <div className="flex-1 w-full">
                                            <input
                                                type="number" min="0" step="0.01"
                                                className={`w-full px-3 py-2 border rounded-lg outline-none text-sm font-semibold transition-colors ${darkMode ? 'bg-slate-800 border-slate-600 text-slate-100 focus:border-emerald-500' : 'bg-white border-slate-300 text-slate-800 focus:border-emerald-500'}`}
                                                placeholder={`${t.price} ($)`}
                                                value={newPaymentAmount}
                                                onChange={e => setNewPaymentAmount(e.target.value)}
                                            />
                                        </div>
                                        <div className="flex-[2] w-full">
                                            <input
                                                type="text"
                                                className={`w-full px-3 py-2 border rounded-lg outline-none text-sm transition-colors ${darkMode ? 'bg-slate-800 border-slate-600 text-slate-100 focus:border-emerald-500' : 'bg-white border-slate-300 text-slate-800 focus:border-emerald-500'}`}
                                                placeholder={t.paymentNotePlaceholder}
                                                value={newPaymentNote}
                                                onChange={e => setNewPaymentNote(e.target.value)}
                                            />
                                        </div>
                                        <div className="flex-[2] w-full">
                                            <label className={`flex items-center justify-center w-full px-3 py-2 border border-dashed rounded-lg cursor-pointer text-sm font-medium transition-colors ${darkMode ? 'hover:bg-emerald-900/30 text-emerald-400 border-emerald-700' : 'hover:bg-emerald-50 text-emerald-600 border-emerald-300'}`}>
                                                {newPaymentFile ? <span className="truncate max-w-[120px]">{newPaymentFile.name}</span> : <><Upload size={14} className="mr-1" /> {t.uploadReceipt}</>}
                                                <input
                                                    type="file"
                                                    accept="image/*,.pdf"
                                                    className="hidden"
                                                    onChange={e => setNewPaymentFile(e.target.files[0])}
                                                />
                                            </label>
                                        </div>
                                        <button
                                            onClick={handleAddPayment}
                                            disabled={isAddingPayment || !newPaymentAmount}
                                            className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors"
                                        >
                                            {isAddingPayment ? '...' : t.add}
                                        </button>
                                    </div>
                                </div>

                                {/* Izoh */}
                                <div>
                                     <label className={`block text-xs font-semibold mb-1 uppercase ${sec}`}>{t.notes}</label>
                                    <textarea rows={2} className={`${inp} resize-none`} placeholder={t.notes} value={editNotes} onChange={e => setEditNotes(e.target.value)} />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── FOOTER (edit mode only) ── */}
                    {mode === 'edit' && (
                        <div className={`flex items-center justify-between px-5 py-4 border-t shrink-0 ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-100'}`}>
                            <button
                                onClick={handleDelete} disabled={deleting}
                                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all disabled:opacity-60 ${confirmDelete
                                    ? 'bg-rose-600 text-white border-rose-600 hover:bg-rose-700'
                                    : darkMode ? 'border-slate-600 text-rose-400 hover:bg-rose-900/20' : 'border-rose-200 text-rose-600 hover:bg-rose-50'}`}
                            >
                                {deleting ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Trash2 size={14} />}
                                {confirmDelete ? t.confirmDeleteWarning : t.delete}
                            </button>
                            {confirmDelete && (
                                <button onClick={() => setConfirmDelete(false)} className={`text-xs px-3 py-2 rounded-lg ${sec}`}>
                                    {t.cancel}
                                </button>
                            )}
                            <div className="flex gap-2 ml-auto">
                                <button onClick={onClose} className={`px-4 py-2.5 rounded-xl text-sm transition-colors ${sec} ${darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}>
                                    {t.close}
                                </button>
                                <button
                                    onClick={handleSaveEdit} disabled={saving}
                                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/30 disabled:opacity-60 transition-all hover:-translate-y-0.5"
                                >
                                    {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={14} />}
                                    {t.save}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );

    return createPortal(content, document.body);
};

export default OrderModal;
