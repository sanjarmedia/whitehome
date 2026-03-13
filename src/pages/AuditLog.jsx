import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../api/axios';
import { Clock, Search, RefreshCw, ShoppingCart, Package, Users, CreditCard } from 'lucide-react';
import CustomDatePicker from '../components/ui/DatePicker';

const ACTION_CONFIG = {
    CREATE_ORDER: { label: 'Buyurtma yaratildi', color: 'emerald', entity: 'order' },
    UPDATE_ORDER: { label: 'Buyurtma tahrirlandi', color: 'amber', entity: 'order' },
    UPDATE_ORDER_STATUS: { label: 'Buyurtma statusi o\'zgardi', color: 'blue', entity: 'order' },
    DELETE_ORDER: { label: 'Buyurtma o\'chirildi', color: 'rose', entity: 'order' },
    APPROVE_ORDER: { label: 'Buyurtma tasdiqlandi', color: 'emerald', entity: 'order' },
    REJECT_ORDER: { label: 'Buyurtma rad etildi', color: 'rose', entity: 'order' },
    ADD_PAYMENT: { label: 'To\'lov qo\'shildi', color: 'blue', entity: 'payment' },
    CREATE_PRODUCT: { label: 'Mahsulot yaratildi', color: 'emerald', entity: 'product' },
    UPDATE_PRODUCT: { label: 'Mahsulot tahrirlandi', color: 'amber', entity: 'product' },
    DELETE_PRODUCT: { label: 'Mahsulot o\'chirildi', color: 'rose', entity: 'product' },
    IMPORT_PRODUCTS: { label: 'Mahsulotlar import qilindi', color: 'purple', entity: 'product' },
    CREATE_CUSTOMER: { label: 'Mijoz yaratildi', color: 'emerald', entity: 'customer' },
    UPDATE_CUSTOMER: { label: 'Mijoz tahrirlandi', color: 'amber', entity: 'customer' },
    DELETE_CUSTOMER: { label: 'Mijoz o\'chirildi', color: 'rose', entity: 'customer' },
    CREATE_USER: { label: 'Foydalanuvchi yaratildi', color: 'emerald', entity: 'user' },
    UPDATE_USER: { label: 'Foydalanuvchi tahrirlandi', color: 'amber', entity: 'user' },
    DELETE_USER: { label: 'Foydalanuvchi o\'chirildi', color: 'rose', entity: 'user' },
    LOGIN: { label: 'Tizimga Kirdi', color: 'emerald', entity: 'user' },
    LOGOUT: { label: 'Tizimdan Chiqdi', color: 'slate', entity: 'user' },
};

const COLOR_CLASSES = {
    emerald: { bg: 'bg-emerald-500/10 border-emerald-500/20', text: 'text-emerald-400', dot: 'bg-emerald-400' },
    amber: { bg: 'bg-amber-500/10 border-amber-500/20', text: 'text-amber-400', dot: 'bg-amber-400' },
    blue: { bg: 'bg-blue-500/10 border-blue-500/20', text: 'text-blue-400', dot: 'bg-blue-400' },
    rose: { bg: 'bg-rose-500/10 border-rose-500/20', text: 'text-rose-400', dot: 'bg-rose-400' },
    purple: { bg: 'bg-purple-500/10 border-purple-500/20', text: 'text-purple-400', dot: 'bg-purple-400' },
    slate: { bg: 'bg-slate-500/10 border-slate-500/20', text: 'text-slate-400', dot: 'bg-slate-400' },
};

const ENTITY_ICONS = {
    order: ShoppingCart,
    product: Package,
    customer: Users,
    payment: CreditCard,
    user: Users,
};

const AuditLog = () => {
    const { darkMode } = useOutletContext();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterAction, setFilterAction] = useState('');
    const [filterEntity, setFilterEntity] = useState('');
    const [filterFrom, setFilterFrom] = useState(new Date()); // Default: Bugun
    const [filterTo, setFilterTo] = useState(new Date());     // Default: Bugun
    const [clearing, setClearing] = useState(false);

    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filterAction) params.append('action', filterAction);
            if (filterEntity) params.append('entity', filterEntity);
            if (filterFrom) params.append('from', filterFrom.toISOString().split('T')[0]);
            if (filterTo) params.append('to', filterTo.toISOString().split('T')[0]);
            params.append('limit', '500');
            const res = await api.get(`/audit?${params.toString()}`);
            setLogs(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleClearLogs = async () => {
        if (!window.confirm("Barcha audit tarixini O'CHIRMOQCHIMISIZ? Bu amolni orqaga qaytarib bo'lmaydi!")) return;
        setClearing(true);
        try {
            await api.delete('/audit');
            setLogs([]);
        } catch (err) {
            console.error(err);
            alert("Tozalashda xatolik yuz berdi");
        } finally {
            setClearing(false);
        }
    };

    useEffect(() => { fetchLogs(); }, [filterAction, filterEntity, filterFrom, filterTo]);

    const filteredLogs = logs.filter(log => {
        if (!search) return true;
        const s = search.toLowerCase();
        return (
            log.username?.toLowerCase().includes(s) ||
            log.action?.toLowerCase().includes(s) ||
            log.detail?.toLowerCase().includes(s) ||
            String(log.entityId || '').includes(s)
        );
    });

    const tb = darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100';
    const sec = darkMode ? 'text-slate-400' : 'text-slate-500';
    const inputCls = `px-3 py-2 rounded-xl text-sm border outline-none transition-colors ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200 focus:border-blue-500' : 'bg-white border-slate-200 text-slate-800 focus:border-blue-400'}`;

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className={`text-3xl font-light ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>Audit Log</h1>
                    <p className={`text-sm mt-0.5 ${sec}`}>Tizimda amalga oshirilgan barcha harakatlar tarixi</p>
                </div>
                <div className="flex flex-col sm:flex-row w-full md:w-auto gap-2">
                    {currentUser.role === 'admin' && (
                        <button
                            onClick={handleClearLogs}
                            disabled={clearing}
                            className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm transition-colors ${
                                darkMode ? 'bg-rose-900/40 hover:bg-rose-900/60 text-rose-400 border border-rose-800' : 'bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200'
                            }`}
                        >
                            {clearing ? 'Tozalanmoqda...' : 'Tarixni Tozalash'}
                        </button>
                    )}
                    <button onClick={fetchLogs} className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-xl border text-sm transition-colors ${darkMode ? 'border-slate-700 hover:bg-slate-700 text-slate-300' : 'border-slate-200 hover:bg-slate-50 text-slate-600'}`}>
                        <RefreshCw size={15} /> Yangilash
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className={`p-5 rounded-3xl border ${tb} shadow-sm space-y-4`}>
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                    {/* Search */}
                    <div className="lg:col-span-2 relative">
                        <Search size={16} className={`absolute left-3.5 top-3 ${sec}`} />
                        <input
                            type="text"
                            className={`${inputCls} pl-10 w-full py-2.5 h-[46px]`}
                            placeholder="Qidirish (ism, amal, ID)..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>

                    {/* Action filter */}
                    <select value={filterAction} onChange={e => setFilterAction(e.target.value)} className={`${inputCls} w-full h-[46px] truncate`}>
                        <option value="">Barcha amallar</option>
                        {Object.entries(ACTION_CONFIG).map(([key, cfg]) => (
                            <option key={key} value={key}>{cfg.label}</option>
                        ))}
                    </select>

                    {/* Entity filter */}
                    <select value={filterEntity} onChange={e => setFilterEntity(e.target.value)} className={`${inputCls} w-full h-[46px]`}>
                        <option value="">Barcha ob'yektlar</option>
                        <option value="order">Buyurtma</option>
                        <option value="product">Mahsulot</option>
                        <option value="customer">Mijoz</option>
                        <option value="payment">To'lov</option>
                        <option value="user">Foydalanuvchi</option>
                    </select>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center border-t border-slate-700/10 pt-4">
                    <div className="flex-1 grid grid-cols-2 gap-3">
                        <CustomDatePicker
                            selected={filterFrom}
                            onChange={date => setFilterFrom(date)}
                            placeholder="Dan"
                            darkMode={darkMode}
                        />
                        <CustomDatePicker
                            selected={filterTo}
                            onChange={date => setFilterTo(date)}
                            placeholder="Gacha"
                            darkMode={darkMode}
                        />
                    </div>

                    {(filterAction || filterEntity || filterFrom || filterTo) && (
                        <button
                            onClick={() => { setFilterAction(''); setFilterEntity(''); setFilterFrom(null); setFilterTo(null); }}
                            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase border transition-all active:scale-95 ${darkMode ? 'border-rose-900/50 text-rose-400 hover:bg-rose-900/20' : 'text-rose-500 border-rose-200 hover:bg-rose-50'}`}>
                            Filtrni Tozalash
                        </button>
                    )}
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Jami', value: logs.length, color: 'blue', icon: Clock },
                    { label: 'Bugun', value: logs.filter(l => new Date(l.createdAt).toDateString() === new Date().toDateString()).length, color: 'emerald', icon: RefreshCw },
                    { label: "O'chirishlar", value: logs.filter(l => l.action.startsWith('DELETE')).length, color: 'rose', icon: Package },
                    { label: "Buyurtmalar", value: logs.filter(l => l.entity === 'order').length, color: 'amber', icon: ShoppingCart },
                ].map(stat => (
                    <div key={stat.label} className={`p-4 rounded-2xl border ${tb} relative overflow-hidden group`}>
                        <stat.icon size={40} className={`absolute -right-2 -bottom-2 opacity-10 transition-transform group-hover:scale-110 text-${stat.color}-500`} />
                        <p className={`text-[10px] font-black uppercase tracking-widest ${sec}`}>{stat.label}</p>
                        <p className={`text-2xl font-black mt-1 text-${stat.color}-500`}>{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Log Content */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600" />
                </div>
            ) : filteredLogs.length === 0 ? (
                <div className={`text-center py-20 rounded-3xl border border-dashed ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-300'}`}>
                    <Clock size={48} className={`mx-auto mb-4 opacity-20 ${sec}`} />
                    <p className={`font-medium ${sec}`}>Hech qanday harakat topilmadi.</p>
                </div>
            ) : (
                <div className={`rounded-3xl border shadow-sm overflow-hidden ${tb}`}>
                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className={`border-b text-[10px] font-black uppercase tracking-widest ${darkMode ? 'bg-slate-900/60 border-slate-700 text-slate-500' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                                    <th className="px-6 py-4 text-left">Vaqt & Sana</th>
                                    <th className="px-6 py-4 text-left">Foydalanuvchi</th>
                                    <th className="px-6 py-4 text-left">Harakat</th>
                                    <th className="px-6 py-4 text-left">ID</th>
                                    <th className="px-6 py-4 text-left">Tafsilot</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                {filteredLogs.slice(0, 100).map(log => {
                                    const cfg = ACTION_CONFIG[log.action];
                                    const colors = COLOR_CLASSES[cfg?.color || 'blue'];
                                    const EntityIcon = ENTITY_ICONS[log.entity] || Clock;
                                    let detail = {};
                                    try { detail = log.detail ? JSON.parse(log.detail) : {}; } catch { }

                                    return (
                                        <tr key={log.id} className={`transition-all ${darkMode ? 'hover:bg-slate-700/30' : 'hover:bg-slate-50/50'}`}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <p className={`font-bold ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                                                    {new Date(log.createdAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                                <p className={`text-[10px] ${sec} opacity-60`}>
                                                    {new Date(log.createdAt).toLocaleDateString()}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2.5">
                                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shadow-sm ${darkMode ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-slate-700 border border-slate-200'}`}>
                                                        {(log.username || '?')[0].toUpperCase()}
                                                    </div>
                                                    <span className={`font-bold ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                                                        {log.username || 'Noma\'lum'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase border tracking-tight ${colors.bg} ${colors.text}`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${colors.dot} shadow-[0_0_8px_currentColor]`} />
                                                    {cfg?.label || log.action}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {log.entityId ? (
                                                    <span className={`text-[10px] font-black font-mono px-2 py-1 rounded-lg ${darkMode ? 'bg-slate-900/60 text-slate-400' : 'bg-slate-50 text-slate-500 border border-slate-100'}`}>
                                                        #{log.entityId}
                                                    </span>
                                                ) : <span className={sec}>—</span>}
                                            </td>
                                            <td className="px-6 py-4 max-w-[250px]">
                                                <p className={`text-xs ${sec} truncate font-medium`} title={log.detail}>
                                                    {Object.entries(detail).map(([k, v]) => `${k}: ${v}`).join(' • ') || '—'}
                                                </p>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-700/50">
                        {filteredLogs.slice(0, 50).map(log => {
                            const cfg = ACTION_CONFIG[log.action];
                            const colors = COLOR_CLASSES[cfg?.color || 'blue'];
                            let detail = {};
                            try { detail = log.detail ? JSON.parse(log.detail) : {}; } catch { }

                            return (
                                <div key={log.id} className="p-4 space-y-3 active:bg-slate-50 dark:active:bg-slate-700/20 transition-colors">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black ${darkMode ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-slate-700'}`}>
                                                {(log.username || '?')[0].toUpperCase()}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className={`text-sm font-black ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>{log.username || 'Noma\'lum'}</span>
                                                <span className={`text-[10px] font-bold ${sec} opacity-60`}>
                                                    {new Date(log.createdAt).toLocaleDateString()} • {new Date(log.createdAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                        {log.entityId && (
                                            <span className="text-[10px] font-black font-mono opacity-50">#{log.entityId}</span>
                                        )}
                                    </div>
                                    
                                    <div className="flex flex-wrap gap-2">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[9px] font-black uppercase border tracking-tight ${colors.bg} ${colors.text}`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                                            {cfg?.label || log.action}
                                        </span>
                                        <span className={`inline-flex items-center px-2 py-1.5 rounded-xl text-[9px] font-black uppercase border border-slate-700/10 ${sec} opacity-60`}>
                                            {log.entity}
                                        </span>
                                    </div>

                                    {log.detail && (
                                        <div className={`p-3 rounded-xl text-[11px] font-medium leading-relaxed ${darkMode ? 'bg-slate-900/40 text-slate-400' : 'bg-slate-50 text-slate-500'}`}>
                                            {Object.entries(detail).slice(0, 3).map(([k, v]) => (
                                                <div key={k} className="flex justify-between border-b border-white/5 last:border-0 py-0.5">
                                                    <span className="opacity-60">{k}:</span>
                                                    <span className="font-bold">{String(v)}</span>
                                                </div>
                                            )) || 'Tafsilotlar mavjud emas'}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className={`px-6 py-4 border-t text-[10px] font-black uppercase tracking-widest ${sec} ${darkMode ? 'border-slate-700 bg-slate-900/20' : 'border-slate-100 bg-slate-50/50'}`}>
                        {filteredLogs.length} ta umumiy yozuv • Oxirgi 100 tasi ko'rinmoqda
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuditLog;
