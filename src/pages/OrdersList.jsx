import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
    Plus, Eye, CheckCircle, Clock, Truck, FileText,
    AlertTriangle, ThumbsUp, ThumbsDown, ChevronDown, Users, Building2, Pencil, XCircle, Upload
} from 'lucide-react';
import OrderModal from '../components/OrderModal';
import Pagination from '../components/ui/Pagination';

const OrdersList = () => {
    const navigate = useNavigate();
    const { darkMode, t } = useOutletContext();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('ALL');
    const [sourceFilter, setSourceFilter] = useState('ALL'); // ALL | COMPANY | CUSTOMER_ISSUE
    const [activeModal, setActiveModal] = useState(null);   // { order, mode: 'view'|'edit' }
    const [lowStockProducts, setLowStockProducts] = useState([]);
    const [newOrderMenu, setNewOrderMenu] = useState(false);
    const [approving, setApproving] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState({ total: 0, totalPages: 0, limit: 24 });

    const fetchOrders = async (isFirstLoad = false) => {
        if (isFirstLoad) setLoading(true);
        try {
            const params = { 
                page: currentPage, 
                limit: 24,
                orderSource: sourceFilter === 'ALL' ? undefined : sourceFilter
            };
            if (activeTab !== 'ALL') params.status = activeTab;

            const [ordRes, lowRes] = await Promise.all([
                api.get('/orders', { params }),
                api.get('/orders/low-stock-alert').catch(() => ({ data: [] }))
            ]);
            
            setOrders(ordRes.data.data);
            setPagination(ordRes.data.pagination);
            setLowStockProducts(lowRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            if (isFirstLoad) setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders(true);
    }, [currentPage, sourceFilter, activeTab]);

    useEffect(() => {
        const intervalId = setInterval(() => fetchOrders(false), 45000);
        return () => clearInterval(intervalId);
    }, [currentPage, sourceFilter, activeTab]);

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
        const confirmMsg = typeof t.confirmBulkOrder === 'function' ? t.confirmBulkOrder(lowStockProducts.length) : `Order all ${lowStockProducts.length} low stock items?`;
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
                notes: t.bulkOrderAutoNote,
                items: items
            });

            alert(t.orderCreatedSuccess);
            setSourceFilter('COMPANY');
            setActiveTab('ALL');
            fetchOrders();
        } catch (err) {
            alert(t.errorOccurred + ": " + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    const getTabs = () => {
        const isCustomer = sourceFilter === 'CUSTOMER_ISSUE';
        const tabs = [
            { id: 'ALL', label: t.all, icon: FileText },
        ];
        if (!isCustomer) {
            tabs.push({ id: 'NEW', label: t.new, icon: Clock });
            tabs.push({ id: 'ACTIVE', label: t.active, icon: Truck });
        }
        tabs.push({ id: 'PENDING_APPROVAL', label: t.pendingApproval, icon: AlertTriangle, special: true });
        tabs.push({ id: 'COMPLETED', label: t.completed, icon: CheckCircle });
        tabs.push({ id: 'REJECTED', label: t.rejected, icon: XCircle });
        return tabs;
    };

    if (loading) return (
        <div className="p-8 flex flex-col items-center gap-4 py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            <p className={darkMode ? 'text-slate-400 font-black uppercase tracking-widest text-[10px]' : 'text-slate-500 font-black uppercase tracking-widest text-[10px]'}>{t.loading}</p>
        </div>
    );

    const tabs = getTabs();
    const sourceOptions = [
        { id: 'ALL', label: t.all, icon: null },
        { id: 'COMPANY', label: t.company, icon: Building2, color: 'blue' },
        { id: 'CUSTOMER_ISSUE', label: t.customerIssue, icon: Users, color: 'emerald' },
    ];

    return (
        <div className="space-y-6 pb-20">
            {/* Header - Premium Mobile-First */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
                <div>
                    <h1 className={`text-4xl font-black tracking-tight ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                        {t.orders}
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                        <div className={`w-2 h-2 rounded-full bg-blue-500 animate-pulse`} />
                        <p className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                            {t.totalOrders}: <span className={darkMode ? 'text-slate-300' : 'text-slate-700'}>{pagination.total}</span>
                        </p>
                    </div>
                </div>
                <div className="relative w-full sm:w-auto">
                    <button
                        onClick={() => setNewOrderMenu(v => !v)}
                        className="w-full sm:w-auto bg-blue-600 text-white px-8 py-4 sm:py-3 rounded-2xl sm:rounded-xl font-black uppercase text-[11px] tracking-widest hover:bg-blue-700 flex items-center justify-center gap-3 shadow-xl shadow-blue-500/30 transition-all active:scale-95"
                    >
                        <Plus size={20} strokeWidth={3} />
                        {t.newOrders.slice(0, -1)}
                        <ChevronDown size={16} strokeWidth={3} className={`transition-transform duration-300 ${newOrderMenu ? 'rotate-180' : ''}`} />
                    </button>
                    {newOrderMenu && (
                        <div className={`absolute right-0 top-16 sm:top-14 z-[100] w-full sm:w-64 rounded-3xl shadow-2xl border-2 animate-in fade-in zoom-in duration-200 ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-100'}`}>
                            <div className="p-2 space-y-1">
                                <button
                                    onClick={() => { setNewOrderMenu(false); navigate('/orders/new'); }}
                                    className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all ${darkMode ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-50 text-slate-700'}`}
                                >
                                    <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                                        <Building2 size={20} strokeWidth={2.5} />
                                    </div>
                                    <div className="text-left">
                                        <div className="text-xs font-black uppercase tracking-widest">{t.company}</div>
                                        <div className="text-[10px] text-slate-500 font-medium">{t.companyOrderHint}</div>
                                    </div>
                                </button>
                                <button
                                    onClick={() => { setNewOrderMenu(false); navigate('/orders/customer-issue'); }}
                                    className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all ${darkMode ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-50 text-slate-700'}`}
                                >
                                    <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                                        <Users size={20} strokeWidth={2.5} />
                                    </div>
                                    <div className="text-left">
                                        <div className="text-xs font-black uppercase tracking-widest">{t.issue}</div>
                                        <div className="text-[10px] text-slate-500 font-medium">{t.issuedForCustomerDesc}</div>
                                    </div>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Low Stock Alert - Premium Design */}
            {lowStockProducts.length > 0 && (
                <div className={`p-5 rounded-3xl border-2 flex flex-col sm:flex-row items-center justify-between gap-5 transition-all hover:scale-[1.01] ${darkMode ? 'bg-amber-900/10 border-amber-500/20 shadow-lg shadow-amber-950/20' : 'bg-amber-50 border-amber-200 shadow-lg shadow-amber-100/50'}`}>
                    <div className="flex items-start gap-4 flex-1 w-full">
                        <div className={`p-3 rounded-2xl ${darkMode ? 'bg-amber-500/20 text-amber-400' : 'bg-white text-amber-500 shadow-md'}`}>
                            <AlertTriangle size={24} strokeWidth={2.5} className="animate-pulse" />
                        </div>
                        <div className="w-full">
                            <h4 className={`text-sm font-black uppercase tracking-widest ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                                {lowStockProducts.length} {t.lowStockAlert}
                            </h4>
                            <p className={`text-[11px] font-bold mt-1 line-clamp-2 ${darkMode ? 'text-amber-500/80' : 'text-amber-700/80'}`}>
                                {lowStockProducts.map(p => `${p.name} (${p.quantity} ${t.items})`).join(', ')}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Source Filter Pills - Premium Interactive */}
            <div className={`flex p-1.5 rounded-[2rem] shadow-inner ${darkMode ? 'bg-slate-900 border border-slate-800' : 'bg-slate-100'}`}>
                {sourceOptions.map(opt => {
                    const Icon = opt.icon;
                    const isActive = sourceFilter === opt.id;
                    const activeColors = {
                        blue: darkMode 
                            ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/40 border border-blue-500/30' 
                            : 'bg-white text-blue-600 shadow-lg shadow-blue-100 border border-blue-100',
                        emerald: darkMode 
                            ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-900/40 border border-emerald-500/30' 
                            : 'bg-white text-emerald-600 shadow-lg shadow-emerald-100 border border-emerald-100',
                    };
                    const inactiveColors = darkMode 
                        ? 'text-slate-500 hover:text-slate-300' 
                        : 'text-slate-500 hover:text-slate-700';

                    return (
                        <button
                            key={opt.id}
                            onClick={() => { setSourceFilter(opt.id); setCurrentPage(1); }}
                            className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex-1 justify-center relative ${isActive ? (opt.color ? activeColors[opt.color] : (darkMode ? 'bg-slate-700 text-white border border-slate-600 shadow-lg' : 'bg-white text-slate-800 border border-slate-100 shadow-lg')) : inactiveColors}`}
                        >
                            {Icon && <Icon size={14} strokeWidth={3} />}
                            <span className="hidden sm:inline">{opt.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Status Tabs - Premium Grid */}
            <div className="pb-4">
                <div className={`grid grid-cols-2 sm:grid-cols-4 lg:flex lg:flex-row gap-2 ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        const isPending = tab.special;
                        
                        return (
                            <button
                                key={tab.id}
                                onClick={() => { setActiveTab(tab.id); setCurrentPage(1); }}
                                className={`flex flex-col lg:flex-row items-center justify-center lg:justify-start gap-1 lg:gap-3 px-4 py-4 rounded-3xl transition-all border-2 text-center lg:text-left flex-1 ${
                                    isActive
                                        ? isPending 
                                            ? 'bg-amber-500 border-amber-500 text-white shadow-xl shadow-amber-500/30 font-black' 
                                            : 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-500/30 font-black'
                                        : darkMode
                                            ? 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-500'
                                            : 'bg-white border-slate-50 hover:border-blue-100 text-slate-500 shadow-sm shadow-slate-100'
                                }`}
                            >
                                <Icon size={isActive ? 18 : 16} strokeWidth={isActive ? 3 : 2} className={isPending && !isActive ? 'text-amber-500 animate-pulse' : ''} />
                                <span className={`text-[10px] sm:text-[11px] font-black uppercase tracking-widest ${isActive ? 'text-white' : ''}`}>
                                    {tab.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Orders List - Premium Action Cards */}
            <div className="grid gap-4">
                {orders.length === 0 ? (
                    <div className={`text-center py-24 rounded-[2.5rem] border-4 border-dashed transition-all ${darkMode ? 'bg-slate-900/50 border-slate-800 text-slate-600' : 'bg-slate-50/50 border-slate-200 text-slate-400'}`}>
                        <div className="p-6 rounded-full bg-slate-500/10 w-fit mx-auto mb-4">
                            <FileText size={48} strokeWidth={1} />
                        </div>
                        <p className="font-black uppercase tracking-widest text-xs">{t.noData}</p>
                    </div>
                ) : (
                    orders.map(order => {
                        const isCustomerIssue = order.orderSource === 'CUSTOMER_ISSUE' || order.destinationType === 'CUSTOMER';

                        return (
                            <div
                                key={order.id}
                                className={`p-6 rounded-[2.5rem] shadow-xl border-2 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-6 group hover:translate-y-[-4px]
                                    ${isCustomerIssue
                                        ? darkMode
                                            ? 'bg-slate-900 border-emerald-500/20 hover:border-emerald-500/40 shadow-emerald-950/20'
                                            : 'bg-white border-emerald-100 hover:border-emerald-200 shadow-emerald-100/50'
                                        : darkMode
                                            ? 'bg-slate-900 border-slate-800 hover:border-blue-500/20 shadow-black/40'
                                            : 'bg-white border-slate-100 hover:border-blue-100 shadow-slate-200/50'
                                    }`}
                            >
                                <div className="flex-1 w-full min-w-0">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3.5 rounded-2xl ${isCustomerIssue ? (darkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600') : (darkMode ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600')}`}>
                                                {isCustomerIssue ? <Users size={20} strokeWidth={3} /> : <Building2 size={20} strokeWidth={3} />}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-2xl font-black ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>#{order.id}</span>
                                                    <span className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest border-2 ${getStatusColor(order.status)}`}>
                                                        {t[order.status.toLowerCase()] || order.status}
                                                    </span>
                                                </div>
                                                <p className={`text-[10px] font-black uppercase tracking-widest mt-0.5 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                                    {new Date(order.createdAt).toLocaleDateString(t.noData.includes('yuklanmadi') ? 'uz-UZ' : 'ru-RU')}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <h3 className={`text-lg font-black truncate mb-5 ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                                        {order.customer?.name || (order.destinationType === 'WAREHOUSE' ? (t.auditLog.includes('Audit') ? 'Bosh Omborxona' : 'Главный склад') : (t.auditLog.includes('Audit') ? 'Noma\'lum' : 'Неизвестно'))}
                                    </h3>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className={`p-4 rounded-3xl border-2 transition-all ${darkMode ? 'bg-black/20 border-slate-800/50' : 'bg-slate-50/50 border-slate-100'}`}>
                                            <p className={`text-[9px] font-black uppercase tracking-widest mb-1.5 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>{t.products}</p>
                                            <p className={`text-sm font-black ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>{order.items?.length || 0} {t.items}</p>
                                        </div>
                                        <div className={`p-4 rounded-3xl border-2 transition-all ${darkMode ? 'bg-black/20 border-slate-800/50' : 'bg-slate-50/50 border-slate-100'}`}>
                                            <p className={`text-[9px] font-black uppercase tracking-widest mb-1.5 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>{t.revenue}</p>
                                            <p className={`text-sm font-black ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>${(order.totalAmount || 0).toLocaleString()}</p>
                                        </div>
                                        <div className={`p-4 rounded-3xl border-2 transition-all ${darkMode ? 'bg-black/20 border-slate-800/50' : 'bg-slate-50/50 border-slate-100'}`}>
                                            <p className={`text-[9px] font-black uppercase tracking-widest mb-1.5 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>{t.paidAmount}</p>
                                            <p className="text-sm font-black text-emerald-500">${order.status === 'NEW' ? 0 : (order.paidAmount || 0).toLocaleString()}</p>
                                        </div>
                                        {((order.totalAmount || 0) > (order.status === 'NEW' ? 0 : (order.paidAmount || 0))) && (
                                            <div className={`p-4 rounded-3xl border-2 transition-all ${darkMode ? 'bg-black/20 border-slate-800/50' : 'bg-slate-50/50 border-slate-100'}`}>
                                                <p className={`text-[9px] font-black uppercase tracking-widest mb-1.5 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>{t.debt}</p>
                                                <p className={`text-sm font-black ${darkMode ? 'text-rose-400' : 'text-rose-600'}`}>${((order.totalAmount || 0) - (order.status === 'NEW' ? 0 : (order.paidAmount || 0))).toLocaleString()}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto pt-6 md:pt-0 border-t md:border-t-0 border-slate-500/10 mt-2 md:mt-0">
                                    {/* Action Buttons */}
                                    <div className="flex flex-wrap items-center gap-3 w-full">
                                        {order.status === 'NEW' && order.orderSource === 'COMPANY' && (
                                            <button onClick={() => setActiveModal({ order, mode: 'view' })}
                                                className={`flex-1 sm:flex-none px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95 ${darkMode ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-900/40' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-100'}`}>
                                                <Upload size={16} strokeWidth={3} /> {t.auditLog.includes('Audit') ? 'Tasdiq' : 'Tasdiq'}
                                            </button>
                                        )}
                                        {['EXPECTED', 'PAID_WAITING'].includes(order.status) && order.orderSource === 'COMPANY' && (
                                            <button onClick={() => setActiveModal({ order, mode: 'view' })}
                                                className={`flex-1 sm:flex-none px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95 ${darkMode ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-900/40' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100'}`}>
                                                <CheckCircle size={16} strokeWidth={3} /> {t.auditLog.includes('Audit') ? 'Qabul' : 'Qabul'}
                                            </button>
                                        )}
                                        {order.status === 'CHECKED' && order.orderSource === 'COMPANY' && (
                                            <button onClick={() => setActiveModal({ order, mode: 'view' })}
                                                className={`flex-1 sm:flex-none px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95 ${darkMode ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-900/40' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-100'}`}>
                                                <Truck size={16} strokeWidth={3} /> {t.auditLog.includes('Audit') ? 'Taqsim' : 'Taqsim'}
                                            </button>
                                        )}

                                        {order.status === 'PENDING_APPROVAL' && (
                                            <div className="flex gap-2 flex-1 sm:flex-none">
                                                <button onClick={() => handleApprove(order.id)} disabled={approving === order.id + '_approve'}
                                                    className={`flex-1 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 ${darkMode ? 'bg-emerald-600 text-white hover:bg-emerald-500' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-100'} disabled:opacity-60`}>
                                                    {approving === order.id + '_approve' ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <ThumbsUp size={16} strokeWidth={3} />}
                                                    Ok
                                                </button>
                                                <button onClick={() => handleReject(order.id)} disabled={approving === order.id + '_reject'}
                                                    className={`flex-1 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 ${darkMode ? 'bg-rose-600 text-white hover:bg-rose-500' : 'bg-rose-600 text-white hover:bg-rose-700 shadow-lg shadow-rose-100'} disabled:opacity-60`}>
                                                    {approving === order.id + '_reject' ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <ThumbsDown size={16} strokeWidth={3} />}
                                                    Rad
                                                </button>
                                            </div>
                                        )}

                                        <div className="flex gap-2 w-full sm:w-auto">
                                            <button onClick={() => setActiveModal({ order, mode: 'edit' })}
                                                className={`flex-1 sm:p-4 p-3.5 rounded-2xl flex items-center justify-center transition-all active:scale-95 border-2 ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-blue-400 hover:border-blue-500/30' : 'bg-white border-slate-100 text-slate-500 hover:text-blue-600 hover:border-blue-100 shadow-sm'}`}
                                                title="Tahrirlash">
                                                <Pencil size={20} strokeWidth={2.5} />
                                            </button>
                                            <button onClick={() => setActiveModal({ order, mode: 'view' })}
                                                className={`flex-1 sm:p-4 p-3.5 rounded-2xl flex items-center justify-center transition-all active:scale-95 border-2 ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-blue-400 hover:border-blue-500/30' : 'bg-white border-slate-100 text-slate-500 hover:text-blue-600 hover:border-blue-100 shadow-sm'}`}
                                                title="Ko'rish">
                                                <Eye size={20} strokeWidth={2.5} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <Pagination 
                currentPage={currentPage}
                totalPages={pagination.totalPages}
                onPageChange={setCurrentPage}
                darkMode={darkMode}
                t={t}
                totalItems={pagination.total}
                itemsPerPage={pagination.limit}
            />

            {activeModal && (
                <OrderModal
                    order={activeModal.order}
                    defaultMode={activeModal.mode}
                    darkMode={darkMode}
                    t={t}
                    onClose={() => setActiveModal(null)}
                    onSaved={() => { setActiveModal(null); fetchOrders(); }}
                />
            )}
        </div>
    );
};

export default OrdersList;
