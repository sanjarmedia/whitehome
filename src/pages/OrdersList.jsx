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
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <span className={`text-base font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>#{order.id}</span>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                                            {STATUS_LABELS[order.status] || order.status}
                                        </span>

                                        {/* Manba tegi — ko'zga tashlanadigan */}
                                        {isCustomerIssue ? (
                                            <span className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${darkMode ? 'bg-emerald-900/40 text-emerald-400 border-emerald-700/50' : 'bg-emerald-100 text-emerald-700 border-emerald-200'}`}>
                                                <Users size={11} />
                                                Mijozga Berilgan
                                            </span>
                                        ) : (
                                            <span className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${darkMode ? 'bg-slate-700 text-slate-400 border-slate-600' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                                <Building2 size={11} />
                                                Korxona
                                            </span>
                                        )}

                                        <span className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                            {new Date(order.createdAt).toLocaleDateString('uz-UZ')}
                                        </span>
                                    </div>
                                    <h3 className={`font-medium truncate ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                        {order.customer?.name || (order.destinationType === 'WAREHOUSE' ? 'Bosh Omborxona' : 'Noma\'lum')}
                                    </h3>
                                    <div className={`mt-0.5 flex flex-wrap gap-x-3 sm:gap-x-4 gap-y-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                        <p className="text-sm">
                                            {order.items?.length || 0} ta mahsulot
                                        </p>
                                        <p className="text-sm border-l pl-3 sm:pl-4 border-slate-300 dark:border-slate-600">
                                            Jami: <span className={`font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>${(order.totalAmount || 0).toLocaleString()}</span>
                                        </p>
                                        {(order.paidAmount > 0 || order.status === 'NEW') && (
                                            <p className="hidden xs:block text-sm border-l pl-3 sm:pl-4 border-slate-300 dark:border-slate-600">
                                                To'landi: <span className="font-semibold text-emerald-500">${order.status === 'NEW' ? 0 : (order.paidAmount || 0).toLocaleString()}</span>
                                            </p>
                                        )}
                                        {((order.totalAmount || 0) > (order.status === 'NEW' ? 0 : (order.paidAmount || 0))) && (
                                            <p className="hidden md:block text-sm border-l pl-3 sm:pl-4 border-slate-300 dark:border-slate-600">
                                                Qarz: <span className={`font-semibold ${darkMode ? 'text-rose-400' : 'text-rose-600'}`}>${((order.totalAmount || 0) - (order.status === 'NEW' ? 0 : (order.paidAmount || 0))).toLocaleString()}</span>
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-1.5 sm:gap-2 w-full md:w-auto flex-wrap justify-end">
                                    {/* Korxona buyurtmasi tugmalari */}
                                    {order.status === 'NEW' && order.orderSource === 'COMPANY' && (
                                        <button onClick={() => setActiveModal({ order, mode: 'view' })}
                                            className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors ${darkMode ? 'bg-blue-900/30 text-blue-400 hover:bg-blue-900/50' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}>
                                            <Upload size={16} /> Tasdiqlash
                                        </button>
                                    )}
                                    {['EXPECTED', 'PAID_WAITING'].includes(order.status) && order.orderSource === 'COMPANY' && (
                                        <button onClick={() => setActiveModal({ order, mode: 'view' })}
                                            className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors ${darkMode ? 'bg-indigo-900/30 text-indigo-400 hover:bg-indigo-900/50' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}>
                                            <CheckCircle size={16} /> Qabul Qilish
                                        </button>
                                    )}
                                    {order.status === 'CHECKED' && order.orderSource === 'COMPANY' && (
                                        <button onClick={() => setActiveModal({ order, mode: 'view' })}
                                            className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors ${darkMode ? 'bg-green-900/30 text-green-400 hover:bg-green-900/50' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                                            <Truck size={16} /> Taqsimlash
                                        </button>
                                    )}

                                    {/* PENDING_APPROVAL — admin tasdiq/rad */}
                                    {order.status === 'PENDING_APPROVAL' && (
                                        <>
                                            <button onClick={() => handleApprove(order.id)} disabled={approving === order.id + '_approve'}
                                                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${darkMode ? 'bg-green-900/30 text-green-400 hover:bg-green-900/50' : 'bg-green-50 text-green-700 hover:bg-green-100'} disabled:opacity-60`}>
                                                {approving === order.id + '_approve'
                                                    ? <div className="w-3.5 h-3.5 border border-current border-t-transparent rounded-full animate-spin" />
                                                    : <ThumbsUp size={15} />
                                                }
                                                Tasdiqlash
                                            </button>
                                            <button onClick={() => handleReject(order.id)} disabled={approving === order.id + '_reject'}
                                                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${darkMode ? 'bg-rose-900/30 text-rose-400 hover:bg-rose-900/50' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'} disabled:opacity-60`}>
                                                {approving === order.id + '_reject'
                                                    ? <div className="w-3.5 h-3.5 border border-current border-t-transparent rounded-full animate-spin" />
                                                    : <ThumbsDown size={15} />
                                                }
                                                Rad etish
                                            </button>
                                        </>
                                    )}

                                    <button onClick={() => setActiveModal({ order, mode: 'edit' })}
                                        className={`p-2 rounded-lg transition-colors border border-transparent ${darkMode ? 'text-slate-400 hover:text-yellow-400 hover:bg-slate-700' : 'text-slate-400 hover:text-yellow-600 hover:bg-yellow-50 hover:border-yellow-200'}`}
                                        title="Tahrirlash">
                                        <Pencil size={16} />
                                    </button>
                                    <button onClick={() => setActiveModal({ order, mode: 'view' })}
                                        className={`p-2 rounded-lg transition-colors border border-transparent ${darkMode ? 'text-slate-400 hover:text-blue-400 hover:bg-slate-700' : 'text-slate-400 hover:text-blue-600 hover:bg-slate-50 hover:border-slate-200'}`}
                                        title="Ko'rish">
                                        <Eye size={18} />
                                    </button>
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
