import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
    Plus, Eye, CheckCircle, Clock, Truck, FileText, Upload,
    AlertTriangle, ThumbsUp, ThumbsDown, ChevronDown, Users, Building2, Pencil, XCircle
} from 'lucide-react';
import OrderModal from '../components/OrderModal';

const STATUS_LABELS = {
    NEW: 'Yangi',
    EXPECTED: 'Kutilmoqda',
    CHECKED: 'Tekshirildi',
    COMPLETED: 'Yakunlangan',
    DELIVERED: 'Yetkazildi',
    CANCELLED: 'Bekor',
    PENDING_APPROVAL: 'Tasdig\'ini kutmoqda',
    APPROVED: 'Tasdiqlandi',
    REJECTED: 'Rad etildi',
};

const OrdersList = () => {
    const navigate = useNavigate();
    const { darkMode } = useOutletContext();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('ALL');
    const [sourceFilter, setSourceFilter] = useState('ALL'); // ALL | COMPANY | CUSTOMER_ISSUE
    const [activeModal, setActiveModal] = useState(null);   // { order, mode: 'view'|'edit' }
    const [lowStockProducts, setLowStockProducts] = useState([]);
    const [newOrderMenu, setNewOrderMenu] = useState(false);
    const [approving, setApproving] = useState(null);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const [ordRes, lowRes] = await Promise.all([
                api.get('/orders'),
                api.get('/orders/low-stock-alert').catch(() => ({ data: [] }))
            ]);
            setOrders(ordRes.data);
            setLowStockProducts(lowRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchOrders(); }, []);

    // Manba bo'yicha filtrlangan buyurtmalar
    const sourceFiltered = orders.filter(o => {
        if (sourceFilter === 'COMPANY') {
            // Faqat sof korxona: COMPANY source VA warehouse destination
            return o.orderSource === 'COMPANY' || (!o.orderSource && o.destinationType !== 'CUSTOMER');
        }
        if (sourceFilter === 'CUSTOMER_ISSUE') {
            // Yangi CUSTOMER_ISSUE YOKI eski destinationType=CUSTOMER buyurtmalar
            return o.orderSource === 'CUSTOMER_ISSUE' || o.destinationType === 'CUSTOMER';
        }
        return true;
    });

    // Status bo'yicha tablar logikasi
    const getTabOrders = (tabId, list) => list.filter(o => {
        if (tabId === 'ALL') return true;
        if (tabId === 'NEW') return o.status === 'NEW';
        if (tabId === 'PENDING_APPROVAL') return o.status === 'PENDING_APPROVAL';
        if (tabId === 'ACTIVE') return ['EXPECTED', 'PAID_WAITING', 'CHECKED', 'ARRIVED'].includes(o.status);
        if (tabId === 'COMPLETED') return ['COMPLETED', 'DELIVERED'].includes(o.status);
        if (tabId === 'REJECTED') return ['REJECTED', 'CANCELLED'].includes(o.status);
        return false;
    });

    const filteredOrders = getTabOrders(activeTab, sourceFiltered);

    // Tab tanlanishi manba filterga qarab o'zgaradi
    const getTabs = () => {
        const isCustomer = sourceFilter === 'CUSTOMER_ISSUE';
        const isCompany = sourceFilter === 'COMPANY';
        const tabs = [
            { id: 'ALL', label: 'Barchasi', icon: FileText },
        ];
        if (!isCustomer) {
            tabs.push({ id: 'NEW', label: 'Yangi', icon: Clock });
            tabs.push({ id: 'ACTIVE', label: 'Faol', icon: Truck });
        }
        tabs.push({ id: 'PENDING_APPROVAL', label: 'Tasdig\'ini kutmoqda', icon: AlertTriangle, special: true });
        tabs.push({ id: 'COMPLETED', label: 'Yakunlangan', icon: CheckCircle });
        tabs.push({ id: 'REJECTED', label: 'Bekor / Rad etilgan', icon: XCircle });
        return tabs;
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'NEW': return 'bg-amber-100 text-amber-800 border-amber-200';
            case 'EXPECTED': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'CHECKED': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
            case 'COMPLETED': return 'bg-green-100 text-green-800 border-green-200';
            case 'DELIVERED': return 'bg-green-100 text-green-800 border-green-200';
            case 'CANCELLED': return 'bg-rose-100 text-rose-800 border-rose-200';
            case 'PENDING_APPROVAL': return 'bg-amber-100 text-amber-800 border-amber-200';
            case 'REJECTED': return 'bg-rose-100 text-rose-800 border-rose-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const handleApprove = async (orderId) => {
        setApproving(orderId + '_approve');
        try {
            await api.put(`/orders/${orderId}/approve`);
            fetchOrders();
        } catch (err) {
            alert('Xatolik: ' + (err.response?.data?.error || err.message));
        } finally { setApproving(null); }
    };

    const handleReject = async (orderId) => {
        const reason = prompt('Rad etish sababi (ixtiyoriy):');
        setApproving(orderId + '_reject');
        try {
            await api.put(`/orders/${orderId}/reject`, { notes: reason || '' });
            fetchOrders();
        } catch (err) {
            alert('Xatolik: ' + (err.response?.data?.error || err.message));
        } finally { setApproving(null); }
    };

    const handleBulkOrder = async () => {
        if (!lowStockProducts || lowStockProducts.length === 0) return;
        const confirmMsg = `Haqiqatdan ham yetishmayotgan barcha ${lowStockProducts.length} turdagi mahsulotlarni korxona buyurtmasi qilib yubormoqchimisiz? (Har biriga 10 ta miqdor yoziladi, keyin tahrirlashingiz mumkin)`;
        if (!window.confirm(confirmMsg)) return;

        setLoading(true);
        try {
            const items = lowStockProducts.map(p => ({
                productName: p.name,
                productId: p.id,
                quantity: 10,
                price: p.price || 0,
                category: p.category || ''
            }));

            await api.post('/orders', {
                orderSource: 'COMPANY',
                destinationType: 'WAREHOUSE',
                status: 'NEW',
                notes: 'Avtomatik ravishda yetishmayotgan mahsulotlar asosida tuzildi.',
                items: items
            });

            alert('Buyurtma muvaffaqiyatli shakllantirildi!');
            setSourceFilter('COMPANY');
            setActiveTab('ALL');
            fetchOrders();
        } catch (err) {
            alert('Xatolik: ' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="p-8 flex justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        </div>
    );

    const tabs = getTabs();
    const pendingCount = orders.filter(o => o.status === 'PENDING_APPROVAL').length;

    // Manba filter pills
    const sourceOptions = [
        { id: 'ALL', label: 'Barchasi', icon: null },
        { id: 'COMPANY', label: 'Korxona Buyurtmasi', icon: Building2, color: 'blue' },
        { id: 'CUSTOMER_ISSUE', label: 'Mijozga Berilgan', icon: Users, color: 'emerald' },
    ];

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className={`text-3xl font-light ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>Buyurtmalar</h1>
                    <p className={`text-sm mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        Jami {orders.length} ta buyurtma
                    </p>
                </div>
                <div className="relative">
                    <button
                        onClick={() => setNewOrderMenu(v => !v)}
                        className="bg-blue-600 text-white px-6 py-2.5 rounded-xl hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-0.5"
                    >
                        <Plus size={20} />
                        Yangi Buyurtma
                        <ChevronDown size={16} className={`transition-transform ${newOrderMenu ? 'rotate-180' : ''}`} />
                    </button>
                    {newOrderMenu && (
                        <div className={`absolute right-0 top-12 z-20 w-56 rounded-xl shadow-xl border overflow-hidden ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                            <button
                                onClick={() => { setNewOrderMenu(false); navigate('/orders/new'); }}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors text-left ${darkMode ? 'text-slate-200 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-50'}`}
                            >
                                <Building2 size={16} className="text-blue-500" />
                                <div>
                                    <div className="font-medium">Korxona Buyurtmasi</div>
                                    <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Sklad uchun import</div>
                                </div>
                            </button>
                            <div className={`border-t ${darkMode ? 'border-slate-700' : 'border-slate-100'}`} />
                            <button
                                onClick={() => { setNewOrderMenu(false); navigate('/orders/customer-issue'); }}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors text-left ${darkMode ? 'text-slate-200 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-50'}`}
                            >
                                <Users size={16} className="text-emerald-500" />
                                <div>
                                    <div className="font-medium">Mijoz Shakillantirish</div>
                                    <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Sklad ichidan berish</div>
                                </div>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Kam qolgan mahsulotlar ogohlantirish */}
            {lowStockProducts.length > 0 && (
                <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl border ${darkMode ? 'bg-amber-900/20 border-amber-700/50' : 'bg-amber-50 border-amber-200'}`}>
                    <div className="flex items-start gap-3 flex-1 w-full">
                        <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-500" />
                        <div className="w-full">
                            <p className={`font-semibold text-sm ${darkMode ? 'text-amber-300' : 'text-amber-800'}`}>
                                {lowStockProducts.length} ta mahsulot kam qoldi!
                            </p>
                            <p className={`text-xs mt-0.5 ${darkMode ? 'text-amber-400' : 'text-amber-700'}`}>
                                {lowStockProducts.slice(0, 4).map(p => `${p.name} (${p.quantity} ta)`).join(', ')}
                                {lowStockProducts.length > 4 && ` va yana ${lowStockProducts.length - 4} ta...`}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleBulkOrder}
                        className={`shrink-0 w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl shadow-sm transition-all hover:-translate-y-0.5 ${darkMode ? 'bg-amber-600 text-white hover:bg-amber-500 shadow-amber-900/40' : 'bg-amber-500 text-white hover:bg-amber-400 shadow-amber-500/30'}`}
                    >
                        <Building2 size={16} /> Barchasini buyurtma qilish
                    </button>
                </div>
            )}

            {/* ── MANBA FILTER (Korxona / Mijozga Berilgan) ── */}
            <div className={`flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-1.5 rounded-2xl ${darkMode ? 'bg-slate-800/80' : 'bg-slate-100'}`}>
                {sourceOptions.map(opt => {
                    const Icon = opt.icon;
                    const isActive = sourceFilter === opt.id;
                    const activeColors = {
                        blue: darkMode
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                            : 'bg-blue-600 text-white shadow-md shadow-blue-500/30',
                        emerald: darkMode
                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40'
                            : 'bg-emerald-600 text-white shadow-md shadow-emerald-500/30',
                    };
                    const inactiveColors = darkMode
                        ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-white/70';

                    return (
                        <button
                            key={opt.id}
                            onClick={() => { setSourceFilter(opt.id); setActiveTab('ALL'); }}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex-1 justify-center ${isActive
                                ? (opt.color ? activeColors[opt.color] : `${darkMode ? 'bg-slate-700 text-slate-100' : 'bg-white text-slate-800'} shadow-md`)
                                : inactiveColors
                                }`}
                        >
                            {Icon && <Icon size={15} />}
                            {opt.label}
                            <span className={`px-1.5 py-0.5 rounded-full text-xs ${isActive ? 'bg-white/20' : darkMode ? 'bg-slate-700' : 'bg-slate-200'}`}>
                                {orders.filter(o => {
                                    if (opt.id === 'COMPANY') return o.orderSource === 'COMPANY' || (!o.orderSource && o.destinationType !== 'CUSTOMER');
                                    if (opt.id === 'CUSTOMER_ISSUE') return o.orderSource === 'CUSTOMER_ISSUE' || o.destinationType === 'CUSTOMER';
                                    return true;
                                }).length}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* ── STATUS TABS ── */}
            <div className={`flex space-x-1 overflow-x-auto pb-2 border-b no-scrollbar ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    const count = getTabOrders(tab.id, sourceFiltered).length;
                    const isPending = tab.special;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-5 py-3 rounded-t-xl transition-all whitespace-nowrap text-sm ${activeTab === tab.id
                                ? `border-b-2 font-medium shadow-sm ${isPending ? 'border-amber-500 text-amber-600' : 'border-blue-600 text-blue-600'} ${darkMode ? 'bg-slate-800' : 'bg-white'}`
                                : `text-slate-500 hover:text-slate-700 ${darkMode ? 'hover:bg-slate-800/50 hover:text-slate-300' : 'hover:bg-slate-50'}`
                                }`}
                        >
                            <Icon size={16} className={isPending && count > 0 ? 'text-amber-500 animate-pulse' : ''} />
                            {tab.label}
                            <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs font-medium ${count > 0 && isPending
                                ? 'bg-amber-100 text-amber-700'
                                : darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'
                                }`}>
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* ── BUYURTMALAR RO'YXATI ── */}
            <div className="grid gap-3">
                {filteredOrders.length === 0 ? (
                    <div className={`text-center py-12 rounded-2xl border border-dashed ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-300'}`}>
                        <p className={darkMode ? 'text-slate-400' : 'text-slate-500'}>Bu bo'limda buyurtmalar yo'q.</p>
                    </div>
                ) : (
                    filteredOrders.map(order => {
                        const isCustomerIssue = order.orderSource === 'CUSTOMER_ISSUE' || order.destinationType === 'CUSTOMER';

                        return (
                            <div
                                key={order.id}
                                className={`p-5 rounded-2xl shadow-sm border transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4
                                    ${isCustomerIssue
                                        ? darkMode
                                            ? 'bg-emerald-900/10 border-emerald-700/40 hover:border-emerald-600/60'
                                            : 'bg-emerald-50/60 border-emerald-200 hover:border-emerald-300'
                                        : darkMode
                                            ? 'bg-slate-800 border-slate-700 hover:border-slate-600'
                                            : 'bg-white border-slate-100 hover:border-blue-200'
                                    }`}
                            >
                                <div className="flex-1 w-full min-w-0">
                                    <div className="flex items-center justify-between md:justify-start gap-2 mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-lg font-black ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>#{order.id}</span>
                                            <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase border tracking-tight ${getStatusColor(order.status)}`}>
                                                {STATUS_LABELS[order.status] || order.status}
                                            </span>
                                        </div>
                                        <span className={`text-[10px] font-bold md:hidden ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                            {new Date(order.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>

                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {/* Manba tegi */}
                                        {isCustomerIssue ? (
                                            <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase border tracking-tight ${darkMode ? 'bg-emerald-900/40 text-emerald-400 border-emerald-700/50' : 'bg-emerald-100 text-emerald-700 border-emerald-200'}`}>
                                                <Users size={12} className="text-emerald-500" />
                                                Mijoz issue
                                            </span>
                                        ) : (
                                            <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase border tracking-tight ${darkMode ? 'bg-slate-700 text-slate-300 border-slate-600' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                                <Building2 size={12} className="text-blue-500" />
                                                Korxona
                                            </span>
                                        )}
                                        <span className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase border tracking-tight ${darkMode ? 'bg-slate-900/40 text-slate-500 border-slate-700' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                                            {new Date(order.createdAt).toLocaleDateString('uz-UZ')}
                                        </span>
                                    </div>
                                    <h3 className={`text-base font-black truncate mb-2 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                                        {order.customer?.name || (order.destinationType === 'WAREHOUSE' ? 'Bosh Omborxona' : 'Noma\'lum')}
                                    </h3>

                                    <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4`}>
                                        <div className={`p-2 rounded-xl border ${darkMode ? 'bg-slate-900/40 border-slate-700/50' : 'bg-slate-50/50 border-slate-100'}`}>
                                            <p className={`text-[9px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Mahsulotlar</p>
                                            <p className={`text-sm font-black ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{order.items?.length || 0} ta</p>
                                        </div>
                                        <div className={`p-2 rounded-xl border ${darkMode ? 'bg-slate-900/40 border-slate-700/50' : 'bg-slate-50/50 border-slate-100'}`}>
                                            <p className={`text-[9px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Jami Summa</p>
                                            <p className={`text-sm font-black ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>${(order.totalAmount || 0).toLocaleString()}</p>
                                        </div>
                                        {(order.paidAmount > 0 || order.status === 'NEW') && (
                                            <div className={`p-2 rounded-xl border ${darkMode ? 'bg-slate-900/40 border-slate-700/50' : 'bg-slate-50/50 border-slate-100'}`}>
                                                <p className={`text-[9px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>To'langan</p>
                                                <p className="text-sm font-black text-emerald-500">${order.status === 'NEW' ? 0 : (order.paidAmount || 0).toLocaleString()}</p>
                                            </div>
                                        )}
                                        {((order.totalAmount || 0) > (order.status === 'NEW' ? 0 : (order.paidAmount || 0))) && (
                                            <div className={`p-2 rounded-xl border ${darkMode ? 'bg-slate-900/40 border-slate-700/50' : 'bg-slate-50/50 border-slate-100'}`}>
                                                <p className={`text-[9px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Qarz</p>
                                                <p className={`text-sm font-black ${darkMode ? 'text-rose-400' : 'text-rose-600'}`}>${((order.totalAmount || 0) - (order.status === 'NEW' ? 0 : (order.paidAmount || 0))).toLocaleString()}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-slate-700/10 dark:border-slate-700/50 mt-1 md:mt-0">
                                    <div className="grid grid-cols-2 md:flex items-center gap-2 w-full">
                                        {/* Korxona buyurtmasi tugmalari */}
                                        {order.status === 'NEW' && order.orderSource === 'COMPANY' && (
                                            <button onClick={() => setActiveModal({ order, mode: 'view' })}
                                                className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all active:scale-95 ${darkMode ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/20'}`}>
                                                <Upload size={14} /> Tasdiq
                                            </button>
                                        )}
                                        {['EXPECTED', 'PAID_WAITING'].includes(order.status) && order.orderSource === 'COMPANY' && (
                                            <button onClick={() => setActiveModal({ order, mode: 'view' })}
                                                className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all active:scale-95 ${darkMode ? 'bg-indigo-600 text-white hover:bg-indigo-500' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-500/20'}`}>
                                                <CheckCircle size={14} /> Qabul
                                            </button>
                                        )}
                                        {order.status === 'CHECKED' && order.orderSource === 'COMPANY' && (
                                            <button onClick={() => setActiveModal({ order, mode: 'view' })}
                                                className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all active:scale-95 ${darkMode ? 'bg-emerald-600 text-white hover:bg-emerald-500' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-500/20'}`}>
                                                <Truck size={14} /> Taqsim
                                            </button>
                                        )}

                                        {/* PENDING_APPROVAL — admin tasdiq/rad */}
                                        {order.status === 'PENDING_APPROVAL' && (
                                            <>
                                                <button onClick={() => handleApprove(order.id)} disabled={approving === order.id + '_approve'}
                                                    className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all active:scale-95 ${darkMode ? 'bg-emerald-600 text-white hover:bg-emerald-500' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-500/20'} disabled:opacity-60`}>
                                                    {approving === order.id + '_approve'
                                                        ? <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                                        : <ThumbsUp size={14} />
                                                    }
                                                    Ok
                                                </button>
                                                <button onClick={() => handleReject(order.id)} disabled={approving === order.id + '_reject'}
                                                    className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all active:scale-95 ${darkMode ? 'bg-rose-600 text-white hover:bg-rose-500' : 'bg-rose-600 text-white hover:bg-rose-700 shadow-md shadow-rose-500/20'} disabled:opacity-60`}>
                                                    {approving === order.id + '_reject'
                                                        ? <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                                        : <ThumbsDown size={14} />
                                                    }
                                                    Rad
                                                </button>
                                            </>
                                        )}

                                        <div className="flex gap-2 col-span-2 md:col-span-1 justify-end">
                                            <button onClick={() => setActiveModal({ order, mode: 'edit' })}
                                                className={`p-2.5 rounded-xl flex-1 md:flex-none flex items-center justify-center transition-all active:scale-95 border ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'}`}
                                                title="Tahrirlash">
                                                <Pencil size={16} />
                                            </button>
                                            <button onClick={() => setActiveModal({ order, mode: 'view' })}
                                                className={`p-2.5 rounded-xl flex-1 md:flex-none flex items-center justify-center transition-all active:scale-95 border ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'}`}
                                                title="Ko'rish">
                                                <Eye size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {activeModal && (
                <OrderModal
                    order={activeModal.order}
                    defaultMode={activeModal.mode}
                    darkMode={darkMode}
                    onClose={() => setActiveModal(null)}
                    onSaved={() => { setActiveModal(null); fetchOrders(); }}
                />
            )}
        </div>
    );
};

export default OrdersList;
