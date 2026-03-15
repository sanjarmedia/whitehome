import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../api/axios';
import { Users, Pencil, Trash2, Plus, MapPin, Package, Eye, Phone } from 'lucide-react';
import CustomerModal from '../components/CustomerModal';
import CustomerHistoryModal from '../components/CustomerHistoryModal';

const Customers = () => {
    const { darkMode, t } = useOutletContext();
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('ALL');

    const [editingCustomer, setEditingCustomer] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [historyCustomerId, setHistoryCustomerId] = useState(null);
    const [historyModalOpen, setHistoryModalOpen] = useState(false);

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            const res = await api.get('/customers');
            setCustomers(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const filteredCustomers = customers.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || 
                             (c.phone && c.phone.includes(search));
        const matchesType = filterType === 'ALL' || c.type === filterType;
        return matchesSearch && matchesType;
    });

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
                        {t.totalPartners(customers.length)}
                    </p>
                </div>
                <button
                    onClick={handleAdd}
                    className="bg-blue-600 text-white w-full md:w-auto px-6 py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-blue-700 shadow-xl shadow-blue-500/30 transition-all active:scale-95 font-black uppercase text-xs tracking-widest"
                >
                    <Plus size={18} /> {t.add}
                </button>
            </div>

            {/* Filters */}
            <div className={`p-5 rounded-3xl border ${tb} shadow-sm space-y-4`}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative md:col-span-2">
                        <Users size={18} className={`absolute left-3.5 top-3 ${sec}`} />
                        <input
                            type="text"
                            placeholder={t.search}
                            className={`${inputCls} pl-11 w-full h-[48px]`}
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <select 
                        value={filterType} 
                        onChange={e => setFilterType(e.target.value)}
                        className={`${inputCls} h-[48px] font-bold`}
                    >
                        <option value="ALL">{t.all}</option>
                        <option value="individual">{t.ordinaryCustomer}</option>
                        <option value="organization">{t.organization}</option>
                        <option value="vip">VIP {t.customer}</option>
                    </select>
                </div>
            </div>

            <div className={`rounded-3xl shadow-sm overflow-hidden border ${tb}`}>
                {/* Mobile Card View */}
                <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-700/50">
                    {filteredCustomers.length === 0 ? (
                        <div className="p-10 text-center opacity-50">{t.partnersNotFound}</div>
                    ) : filteredCustomers.map(customer => (
                        <div key={customer.id} className="p-5 space-y-4 active:bg-slate-50 dark:active:bg-slate-700/20 transition-colors">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${darkMode ? 'bg-slate-700 text-blue-400' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                                        {customer.type === 'organization' ? <Package size={22} /> : <Users size={22} />}
                                    </div>
                                    <div>
                                        <div className={`font-black text-lg ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>{customer.name}</div>
                                        <div className={`text-[10px] font-black uppercase tracking-widest mt-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                            ID: #{customer.id}
                                        </div>
                                    </div>
                                </div>
                                <span className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-xl border tracking-tight ${
                                    customer.type === 'vip' 
                                        ? (darkMode ? 'bg-purple-900/30 text-purple-400 border-purple-800' : 'bg-purple-100 text-purple-700 border-purple-200 shadow-sm shadow-purple-200/50') 
                                        : customer.type === 'organization' 
                                            ? (darkMode ? 'bg-amber-900/30 text-amber-400 border-amber-800' : 'bg-amber-100 text-amber-700 border-amber-200 shadow-sm shadow-amber-200/50') 
                                            : (darkMode ? 'bg-slate-900/50 text-slate-400 border-slate-700' : 'bg-slate-50 text-slate-500 border-slate-200')
                                }`}>
                                    {customer.type === 'organization' ? t.organization : (customer.type === 'vip' ? t.vipLabel : t.ordinaryLabel)}
                                </span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                                <div className={`p-3 rounded-2xl border ${darkMode ? 'bg-slate-900/40 border-slate-700/50' : 'bg-slate-50 border-slate-100'}`}>
                                    <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1.5"><Phone size={12} /> {t.contact}</div>
                                    <div className={`text-xs font-black truncate ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>{customer.phone || '-'}</div>
                                </div>
                                <div className={`p-3 rounded-2xl border ${darkMode ? 'bg-slate-900/40 border-slate-700/50' : 'bg-slate-50 border-slate-100'}`}>
                                    <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1.5"><Package size={12} /> {t.orders}</div>
                                    <div className={`text-xs font-black ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>{customer._count?.orders || 0} {t.unitPiece}</div>
                                </div>
                            </div>

                            {customer.address && (
                                <div className={`p-3 rounded-2xl border flex items-center gap-2 ${darkMode ? 'bg-slate-900/20 border-slate-700/30 text-slate-400' : 'bg-slate-50/50 border-slate-100 text-slate-500'}`}>
                                    <MapPin size={14} className="shrink-0 opacity-50" />
                                    <span className="text-xs font-bold truncate">{customer.address}</span>
                                </div>
                            )}
                            
                            <div className="flex gap-2 pt-1">
                                <button onClick={() => { setHistoryCustomerId(customer.id); setHistoryModalOpen(true); }} className={`flex-1 h-11 rounded-xl font-black text-[10px] uppercase border flex items-center justify-center gap-2 transition-all active:scale-95 ${darkMode ? 'bg-indigo-900/30 border-indigo-800 text-indigo-400' : 'bg-indigo-50 border-indigo-200 text-indigo-600'}`}>
                                    <Eye size={16} /> {t.historyLabel}
                                </button>
                                <button onClick={() => handleEdit(customer)} className={`flex-1 h-11 rounded-xl font-black text-[10px] uppercase border flex items-center justify-center gap-2 transition-all active:scale-95 ${darkMode ? 'bg-blue-900/30 border-blue-800 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-600'}`}>
                                    <Pencil size={16} /> {t.editLabel}
                                </button>
                                <button onClick={() => handleDelete(customer.id)} className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all active:scale-95 ${darkMode ? 'bg-rose-900/30 text-rose-400 hover:bg-rose-900/50' : 'bg-rose-50 text-rose-600 hover:bg-rose-100'}`}>
                                    <Trash2 size={18} />
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
                            {filteredCustomers.map(customer => (
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
                                                ? (darkMode ? 'bg-purple-900/30 text-purple-400 border-purple-800' : 'bg-purple-100 text-purple-700 border-purple-200 shadow-sm shadow-purple-200/50') 
                                                : customer.type === 'organization' 
                                                    ? (darkMode ? 'bg-amber-900/30 text-amber-400 border-amber-800' : 'bg-amber-100 text-amber-700 border-amber-200 shadow-sm shadow-amber-200/50') 
                                                    : (darkMode ? 'bg-slate-900/50 text-slate-400 border-slate-700' : 'bg-slate-50 text-slate-500 border-slate-200')
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
            />
        </div>
    );
};

export default Customers;
