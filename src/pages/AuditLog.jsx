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
                <div className="flex gap-2">
                    {currentUser.role === 'admin' && (
                        <button
                            onClick={handleClearLogs}
                            disabled={clearing}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-colors ${
                                darkMode ? 'bg-rose-900/40 hover:bg-rose-900/60 text-rose-400 border border-rose-800' : 'bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200'
                            }`}
                        >
                            {clearing ? 'Tozalanmoqda...' : 'Tarixni Tozalash'}
                        </button>
                    )}
                    <button onClick={fetchLogs} className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm transition-colors ${darkMode ? 'border-slate-700 hover:bg-slate-700 text-slate-300' : 'border-slate-200 hover:bg-slate-50 text-slate-600'}`}>
                        <RefreshCw size={15} /> Yangilash
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className={`p-4 rounded-2xl border ${tb} space-y-3`}>
                {/* Row 1: Search (full width) */}
                <div className="relative">
                    <Search size={15} className={`absolute left-3.5 top-2.5 ${sec}`} />
                    <input
                        type="text"
                        className={`${inputCls} pl-10 w-full`}
                        placeholder="Foydalanuvchi, amal, ID bo'yicha qidirish..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>

                {/* Row 2: Selects + Date pickers + Clear */}
                <div className="flex flex-wrap gap-2 items-center">
                    {/* Action filter */}
                    <select value={filterAction} onChange={e => setFilterAction(e.target.value)} className={`${inputCls} w-56 pr-8`}>
                        <option value="">Barcha amallar</option>
                        {Object.entries(ACTION_CONFIG).map(([key, cfg]) => (
                            <option key={key} value={key}>{cfg.label}</option>
                        ))}
                    </select>

                    {/* Entity filter */}
                    <select value={filterEntity} onChange={e => setFilterEntity(e.target.value)} className={`${inputCls} w-48 pr-8`}>
                        <option value="">Barcha ob'yektlar</option>
                        <option value="order">Buyurtma</option>
                        <option value="product">Mahsulot</option>
                        <option value="customer">Mijoz</option>
                        <option value="payment">To'lov</option>
                    </select>

                    {/* Date range */}
                    <div className="w-44">
                        <CustomDatePicker
                            selected={filterFrom}
                            onChange={date => setFilterFrom(date)}
                            placeholder="Dan (sana)"
                            darkMode={darkMode}
                        />
                    </div>
                    <div className="w-44">
                        <CustomDatePicker
                            selected={filterTo}
                            onChange={date => setFilterTo(date)}
                            placeholder="Gacha (sana)"
                            darkMode={darkMode}
                        />
                    </div>

                    {/* Clear button */}
                    {(filterAction || filterEntity || filterFrom || filterTo) && (
                        <button
                            onClick={() => { setFilterAction(''); setFilterEntity(''); setFilterFrom(null); setFilterTo(null); }}
                            className={`px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${darkMode ? 'border-rose-800 text-rose-400 hover:bg-rose-900/30' : 'text-rose-500 border-rose-200 hover:bg-rose-50'}`}>
                            Tozalash ✕
                        </button>
                    )}
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { label: 'Jami harakatlar', value: logs.length, color: 'blue' },
                    { label: 'Bugungi', value: logs.filter(l => new Date(l.createdAt).toDateString() === new Date().toDateString()).length, color: 'emerald' },
                    { label: "O'chirilganlar", value: logs.filter(l => l.action.startsWith('DELETE')).length, color: 'rose' },
                    { label: "Buyurtmalar", value: logs.filter(l => l.entity === 'order').length, color: 'amber' },
                ].map(stat => (
                    <div key={stat.label} className={`p-4 rounded-xl border ${tb}`}>
                        <p className={`text-xs ${sec}`}>{stat.label}</p>
                        <p className={`text-2xl font-bold mt-1 text-${stat.color}-500`}>{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Log Table */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
                </div>
            ) : filteredLogs.length === 0 ? (
                <div className={`text-center py-12 rounded-2xl border border-dashed ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-300'}`}>
                    <Clock size={32} className={`mx-auto mb-2 ${sec}`} />
                    <p className={sec}>Hozircha hech qanday harakat qayd etilmagan.</p>
                </div>
            ) : (
                <div className={`rounded-2xl border overflow-hidden ${tb}`}>
                    <div className="overflow-x-auto w-full -mx-4 sm:mx-0 px-4 sm:px-0">
                        <table className="min-w-full text-sm whitespace-nowrap">
                            <thead>
                                <tr className={`border-b text-xs uppercase ${darkMode ? 'bg-slate-800/80 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                                    <th className={`px-4 xl:px-6 py-3 text-left ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Sana</th>
                                    <th className={`px-4 xl:px-6 py-3 text-left ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Foydalanuvchi</th>
                                    <th className={`px-4 xl:px-6 py-3 text-left ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Amal</th>
                                    <th className={`hidden sm:table-cell px-4 xl:px-6 py-3 text-left ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Ob'yekt</th>
                                    <th className={`hidden md:table-cell px-4 xl:px-6 py-3 text-left ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>ID</th>
                                    <th className={`hidden lg:table-cell px-4 xl:px-6 py-3 text-left ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Tafsilot</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                {filteredLogs.map(log => {
                                    const cfg = ACTION_CONFIG[log.action];
                                    const colors = COLOR_CLASSES[cfg?.color || 'blue'];
                                    const EntityIcon = ENTITY_ICONS[log.entity] || Clock;
                                    let detail = {};
                                    try { detail = log.detail ? JSON.parse(log.detail) : {}; } catch { }

                                    return (
                                        <tr key={log.id} className={`transition-colors ${darkMode ? 'hover:bg-slate-700/30' : 'hover:bg-slate-50/50'}`}>
                                            {/* Date */}
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <p className={`text-xs ${sec}`}>
                                                    {new Date(log.createdAt).toLocaleDateString('uz-UZ')}
                                                </p>
                                                <p className={`text-[11px] ${sec} opacity-70`}>
                                                    {new Date(log.createdAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                </p>
                                            </td>

                                            {/* User */}
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${darkMode ? 'bg-slate-700 text-slate-200' : 'bg-slate-200 text-slate-700'}`}>
                                                        {(log.username || '?')[0].toUpperCase()}
                                                    </div>
                                                    <span className={`font-medium ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                                                        {log.username || 'Unknown'}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Action */}
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${colors.bg} ${colors.text}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                                                    {cfg?.label || log.action}
                                                </span>
                                            </td>

                                            {/* Entity */}
                                            <td className="hidden sm:table-cell px-4 xl:px-6 py-3">
                                                <div className={`flex items-center gap-1.5 text-xs ${sec}`}>
                                                    <EntityIcon size={13} />
                                                    {log.entity}
                                                </div>
                                            </td>

                                            {/* EntityId */}
                                            <td className="hidden md:table-cell px-4 xl:px-6 py-3">
                                                {log.entityId ? (
                                                    <span className={`text-xs font-mono px-2 py-0.5 rounded ${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                                                        #{log.entityId}
                                                    </span>
                                                ) : <span className={sec}>—</span>}
                                            </td>

                                            {/* Detail */}
                                            <td className="hidden lg:table-cell px-4 xl:px-6 py-3 max-w-[200px]">
                                                <p className={`text-xs ${sec} truncate`} title={log.detail}>
                                                    {Object.entries(detail).map(([k, v]) => `${k}: ${v}`).join(' • ') || '—'}
                                                </p>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <div className={`px-4 py-3 border-t text-xs ${sec} ${darkMode ? 'border-slate-700' : 'border-slate-100'}`}>
                        {filteredLogs.length} ta yozuv ko'rsatilmoqda
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuditLog;
