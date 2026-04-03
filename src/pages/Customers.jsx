import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../api/axios';
import { Users, Pencil, Trash2, Plus, MapPin, Package, Eye, Phone } from 'lucide-react';
import CustomerModal from '../components/CustomerModal';
import CustomerHistoryModal from '../components/CustomerHistoryModal';
import Pagination from '../components/ui/Pagination';

const Customers = () => {
    const { darkMode, lang, t } = useOutletContext();
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState({ total: 0, totalPages: 0, limit: 24 });

    const [editingCustomer, setEditingCustomer] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [historyCustomerId, setHistoryCustomerId] = useState(null);
    const [historyModalOpen, setHistoryModalOpen] = useState(false);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchCustomers(true);
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [search, filterType, currentPage]);

    const fetchCustomers = async (showLoading = false) => {
        if (showLoading) setLoading(true);
        try {
            const params = {
                page: currentPage,
                limit: 24,
                search,
                type: filterType
            };
            const res = await api.get('/customers', { params });
            setCustomers(res?.data?.data || []);
            setPagination(res?.data?.pagination || { total: 0, totalPages: 0, limit: 24 });
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setEditingCustomer(null);
        setIsModalOpen(true);
    };

    const handleEdit = (customer) => {
        setEditingCustomer(customer);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!confirm(t.confirmDelete)) return;
        try {
            await api.delete(`/customers/${id}`);
            fetchCustomers();
        } catch (err) {
            alert(t.errorOccurred + ": " + err.message);
        }
    };

    const handleSave = async (data) => {
        try {
            if (editingCustomer) {
                await api.put(`/customers/${editingCustomer.id}`, data);
            } else {
                await api.post('/customers', data);
            }
            setIsModalOpen(false);
            fetchCustomers();
        } catch (err) {
            alert(t.errorOccurred + ": " + err.message);
        }
    };

    const tb = darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100';
    const sec = darkMode ? 'text-slate-400' : 'text-slate-500';
    const inputCls = `px-4 py-2 rounded-xl border transition-all outline-none focus:ring-2 focus:ring-blue-500/20 ${darkMode ? 'bg-slate-900/50 border-slate-700 text-slate-200 focus:border-blue-500' : 'bg-slate-50 border-slate-200 text-slate-700 focus:border-blue-500'}`;

    if (loading) return (
        <div className="p-8 flex justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
            <span className="ml-3">{t.loading}</span>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className={`text-3xl font-black ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>{t.customers}</h1>
                    <p className={`text-sm mt-1 font-bold ${sec}`}>
                        {t.customerManagementDesc || 'Mijozlar va hamkorlar ro\'yxati'}
                    </p>
                </div>
                <button
                    onClick={handleAdd}
                    className="bg-blue-600 text-white w-full md:w-auto px-6 py-3.5 rounded-2xl flex items-center justify-center gap-2 hover:bg-blue-700 shadow-xl shadow-blue-500/30 transition-all active:scale-95 font-black uppercase text-xs tracking-widest"
                >
                    <Plus size={20} strokeWidth={3} /> {t.add}
                </button>
            </div>

            {/* High Density Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className={`p-4 rounded-3xl border shadow-sm transition-all hover:shadow-md ${darkMode ? 'bg-slate-800/40 border-slate-700 hover:border-slate-600' : 'bg-white border-slate-100 hover:border-slate-200'}`}>
                    <div className="flex items-center gap-2.5 mb-2">
                        <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                            <Users size={18} />
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t.all.toUpperCase()}</span>
                    </div>
                    <div className={`text-2xl font-black ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>{customers.length}</div>
                    <div className="text-[10px] font-bold text-slate-500 mt-1">{(t.partnersNotFound || 'Mijoz').split(' ')[0]}</div>
                </div>

                <div className={`p-4 rounded-3xl border shadow-sm transition-all hover:shadow-md ${darkMode ? 'bg-slate-800/40 border-slate-700 hover:border-slate-600' : 'bg-white border-slate-100 hover:border-slate-200'}`}>
                    <div className="flex items-center gap-2.5 mb-2">
                        <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                            <Eye size={18} />
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>VIP</span>
                    </div>
                    <div className={`text-2xl font-black ${darkMode ? 'text-amber-500' : 'text-amber-600'}`}>
                        {customers.filter(c => c.type === 'vip').length}
                    </div>
                    <div className="text-[10px] font-bold text-slate-500 mt-1">{t.customer.toLowerCase()}</div>
                </div>

                <div className={`p-4 rounded-3xl border shadow-sm transition-all hover:shadow-md ${darkMode ? 'bg-slate-800/40 border-slate-700 hover:border-slate-600' : 'bg-white border-slate-100 hover:border-slate-200'}`}>
                    <div className="flex items-center gap-2.5 mb-2">
                        <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
                            <Package size={18} />
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t.organizationType.toUpperCase()}</span>
                    </div>
                    <div className={`text-2xl font-black ${darkMode ? 'text-indigo-500' : 'text-indigo-600'}`}>
                        {customers.filter(c => c.type === 'organization').length}
                    </div>
                    <div className="text-[10px] font-bold text-slate-500 mt-1">{(t.jamiLabel || 'Jami').toLowerCase()}</div>
                </div>

                <div className={`p-4 rounded-3xl border shadow-sm transition-all hover:shadow-md ${darkMode ? 'bg-slate-800/40 border-slate-700 hover:border-slate-600' : 'bg-white border-slate-100 hover:border-slate-200'}`}>
                    <div className="flex items-center gap-2.5 mb-2">
                        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                            <Plus size={18} />
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t.active.toUpperCase()}</span>
                    </div>
                    <div className={`text-2xl font-black ${darkMode ? 'text-emerald-500' : 'text-emerald-600'}`}>
                        {customers.filter(c => c._count?.orders > 0).length}
                    </div>
                    <div className="text-[10px] font-bold text-slate-500 mt-1">{t.partnersNotFound.split(' ')[0]}</div>
                </div>
            </div>

            {/* Filters Area */}
            <div className={`p-2 rounded-[2rem] border overflow-x-auto flex items-center gap-2 no-scrollbar shadow-inner ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                 <div className="relative flex-1 min-w-[200px] group">
                    <Users size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${darkMode ? 'text-slate-600 group-focus-within:text-blue-400' : 'text-slate-400 group-focus-within:text-blue-500'}`} />
                    <input
                        type="text"
                        placeholder={t.search}
                        className={`w-full pl-10 pr-4 py-2 rounded-2xl border-2 outline-none text-sm transition-all ${darkMode ? 'bg-slate-800 border-transparent text-slate-100 focus:bg-slate-900 focus:border-blue-500/30' : 'bg-white border-transparent text-slate-800 focus:shadow-md focus:border-blue-500/30'}`}
                        value={search}
                        onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                    />
                </div>
                <div className="flex gap-1.5 px-2">
                    {['ALL', 'individual', 'organization', 'vip'].map((type) => (
                        <button
                            key={type}
                            onClick={() => { setFilterType(type); setCurrentPage(1); }}
                            className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap active:scale-95 ${
                                filterType === type
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                    : darkMode ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-white text-slate-500 border border-slate-100 hover:bg-slate-100 shadow-sm'
                            }`}
                        >
                            {type === 'ALL' ? t.all : type === 'individual' ? t.ordinaryLabel : type === 'organization' ? t.organization : 'VIP'}
                        </button>
                    ))}
                </div>
            </div>

            <div className={`rounded-3xl shadow-sm overflow-hidden border ${tb}`}>
                {/* Mobile Card View */}
                <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-700/50">
                    {customers.length === 0 ? (
                        <div className="p-10 text-center opacity-50 font-black uppercase tracking-widest text-xs">{t.partnersNotFound}</div>
                    ) : customers.map(customer => (
                        <div key={customer.id} className="p-5 space-y-4 active:bg-slate-50 dark:active:bg-slate-700/20 transition-all relative group overflow-hidden">
                            <div className="flex items-start justify-between relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg transition-transform group-hover:scale-105 ${darkMode ? 'bg-slate-800 text-blue-400' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                                        {customer.type === 'organization' ? <Package size={24} strokeWidth={2.5} /> : <Users size={24} strokeWidth={2.5} />}
                                    </div>
                                    <div>
                                        <div className={`font-black text-lg leading-tight tracking-tight ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>{customer.name}</div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md ${darkMode ? 'bg-white/10 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                                                ID: #{customer.id}
                                            </span>
                                            <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-md border tracking-tighter ${
                                                customer.type === 'vip' 
                                                    ? (darkMode ? 'bg-amber-500/20 text-amber-500 border-amber-500/30' : 'bg-amber-50 text-amber-600 border-amber-200') 
                                                    : customer.type === 'organization' 
                                                        ? (darkMode ? 'bg-blue-600/20 text-blue-400 border-blue-600/30' : 'bg-blue-50 text-blue-600 border-blue-200') 
                                                        : (darkMode ? 'bg-slate-100/10 text-slate-400 border-slate-700' : 'bg-slate-50 text-slate-500 border-slate-200')
                                            }`}>
                                                {customer.type === 'organization' ? t.organization : (customer.type === 'vip' ? t.vipLabel : t.ordinaryLabel)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3 relative z-10">
                                <div className={`p-3.5 rounded-2xl border transition-all ${darkMode ? 'bg-slate-900/40 border-slate-700/50 hover:bg-slate-900' : 'bg-slate-50 border-slate-100 hover:bg-white hover:shadow-sm'}`}>
                                    <div className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1.5 flex items-center gap-1.5"><Phone size={12} strokeWidth={3} className="text-blue-500" /> {t.contact}</div>
                                    <div className={`text-[13px] font-black truncate font-mono ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>{customer.phone || '—'}</div>
                                </div>
                                <div className={`p-3.5 rounded-2xl border transition-all ${darkMode ? 'bg-slate-900/40 border-slate-700/50 hover:bg-slate-900' : 'bg-slate-50 border-slate-100 hover:bg-white hover:shadow-sm'}`}>
                                    <div className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1.5 flex items-center gap-1.5"><Package size={12} strokeWidth={3} className="text-emerald-500" /> {t.orders}</div>
                                    <div className={`text-[13px] font-black ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>{customer._count?.orders || 0} <span className="text-[10px] opacity-50">{t.unitPiece}</span></div>
                                </div>
                            </div>

                            {customer.address && (
                                <div className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-all relative z-10 ${darkMode ? 'bg-slate-900/20 border-slate-700/30 text-slate-400 hover:bg-slate-900/40' : 'bg-slate-50/50 border-slate-100 text-slate-600 hover:bg-white hover:shadow-sm'}`}>
                                    <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                                        <MapPin size={14} strokeWidth={3} />
                                    </div>
                                    <span className="text-xs font-bold truncate leading-tight">{customer.address}</span>
                                </div>
                            )}
                            
                            <div className="flex gap-2.5 pt-2 relative z-10">
                                <button onClick={() => { setHistoryCustomerId(customer.id); setHistoryModalOpen(true); }} className={`flex-1 h-12 rounded-2xl font-black text-[10px] uppercase border-2 flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm ${darkMode ? 'bg-indigo-900/20 border-indigo-500/20 text-indigo-400 hover:bg-indigo-900/40' : 'bg-indigo-50 border-indigo-100 text-indigo-600 hover:bg-indigo-100'}`}>
                                    <Eye size={18} strokeWidth={3} /> {t.historyLabel}
                                </button>
                                <button onClick={() => handleEdit(customer)} className={`flex-1 h-12 rounded-2xl font-black text-[10px] uppercase border-2 flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm ${darkMode ? 'bg-blue-900/20 border-blue-500/20 text-blue-400 hover:bg-blue-900/40' : 'bg-blue-50 border-blue-100 text-blue-600 hover:bg-blue-100'}`}>
                                    <Pencil size={18} strokeWidth={3} /> {t.editLabel}
                                </button>
                                <button onClick={() => handleDelete(customer.id)} className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all active:scale-95 border-2 shadow-sm ${darkMode ? 'bg-rose-900/20 border-rose-500/20 text-rose-400 hover:bg-rose-900/40' : 'bg-rose-50 border-rose-100 text-rose-600 hover:bg-rose-100'}`}>
                                    <Trash2 size={20} strokeWidth={2.5} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full text-left">
                        <thead>
                            <tr className={`border-b text-[10px] font-black uppercase tracking-widest ${darkMode ? 'bg-slate-900/60 border-slate-700 text-slate-500' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                                <th className="px-6 py-4">{t.name}</th>
                                <th className="px-6 py-4">{t.contact}</th>
                                <th className="px-6 py-4">{t.addressLabel}</th>
                                <th className="px-6 py-4">{t.status}</th>
                                <th className="px-6 py-4 text-center">{t.orders}</th>
                                <th className="px-6 py-4 text-right">{t.actions}</th>
                            </tr>
                        </thead>
                        <tbody className={`divide-y ${darkMode ? 'divide-slate-700/50' : 'divide-slate-100'}`}>
                            {customers.map(customer => (
                                <tr key={customer.id} className={`transition-all ${darkMode ? 'hover:bg-slate-700/30' : 'hover:bg-slate-50/50'}`}>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-white text-blue-600 border border-slate-100'}`}>
                                                {customer.type === 'organization' ? <Package size={18} /> : <Users size={18} />}
                                            </div>
                                            <div>
                                                <div className={`font-black text-sm ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{customer.name}</div>
                                                {customer.type === 'organization' && customer.companyName && (
                                                    <div className={`text-[10px] font-bold ${sec}`}>{customer.companyName}</div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className={`px-6 py-4 text-sm font-bold ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                        {customer.phone || '-'}
                                    </td>
                                    <td className="px-6 py-4 max-w-[200px]">
                                        {customer.address ? (
                                            <div className="flex items-center gap-2 truncate" title={customer.address}>
                                                <MapPin size={14} className="text-slate-400 shrink-0" />
                                                <span className={`text-xs font-medium truncate ${sec}`}>{customer.address}</span>
                                            </div>
                                        ) : <span className="opacity-30">—</span>}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-xl border tracking-tight ${
                                            customer.type === 'vip' 
                                                ? (darkMode ? 'bg-amber-500 text-slate-900 border-amber-500' : 'bg-amber-400 text-slate-900 border-amber-500 shadow-sm shadow-amber-400/50') 
                                                : customer.type === 'organization' 
                                                    ? (darkMode ? 'bg-blue-600 text-white border-blue-600' : 'bg-blue-600 text-white border-blue-700 shadow-sm shadow-blue-500/50') 
                                                    : (darkMode ? 'bg-white text-slate-900 border-white' : 'bg-slate-100 text-slate-600 border-slate-300')
                                        }`}>
                                            {customer.type === 'organization' ? t.organization : (customer.type === 'vip' ? t.vipLabel : t.ordinaryLabel)}
                                        </span>
                                    </td>
                                    <td className={`px-6 py-4 text-center font-black ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                                        {customer._count?.orders || 0}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => { setHistoryCustomerId(customer.id); setHistoryModalOpen(true); }}
                                                className={`p-2.5 rounded-xl transition-all active:scale-90 border ${darkMode ? 'text-indigo-400 border-indigo-900/50 hover:bg-indigo-900/20' : 'text-indigo-600 border-indigo-100 hover:bg-indigo-50 shadow-sm'}`}
                                                title={t.historyLabel}
                                            >
                                                <Eye size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleEdit(customer)}
                                                className={`p-2.5 rounded-xl transition-all active:scale-90 border ${darkMode ? 'text-blue-400 border-blue-900/50 hover:bg-blue-900/20' : 'text-blue-600 border-blue-100 hover:bg-blue-50 shadow-sm'}`}
                                                title={t.editLabel}
                                            >
                                                <Pencil size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(customer.id)}
                                                className={`p-2.5 rounded-xl transition-all active:scale-90 border ${darkMode ? 'text-rose-400 border-rose-900/50 hover:bg-rose-900/20' : 'text-rose-600 border-rose-100 hover:bg-rose-50 shadow-sm'}`}
                                                title={t.deleteLabel}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {customers.length === 0 && (
                    <div className={`p-8 text-center border-t ${darkMode ? 'border-slate-700 text-slate-500' : 'border-slate-100 text-slate-400'}`}>
                        {t.partnersNotFound}
                    </div>
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

            <CustomerModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                customer={editingCustomer}
                darkMode={darkMode}
                t={t}
            />

            <CustomerHistoryModal
                isOpen={historyModalOpen}
                onClose={() => setHistoryModalOpen(false)}
                customerId={historyCustomerId}
                darkMode={darkMode}
                t={t}
                lang={lang}
            />
        </div>
    );
};

export default Customers;
