import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../api/axios';
import { Users, Pencil, Trash2, Plus, MapPin, Package, Eye, Phone } from 'lucide-react';
import CustomerModal from '../components/CustomerModal';
import CustomerHistoryModal from '../components/CustomerHistoryModal';

const Customers = () => {
    const { darkMode } = useOutletContext();
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [historyModalOpen, setHistoryModalOpen] = useState(false);
    const [historyCustomerId, setHistoryCustomerId] = useState(null);

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

    const handleAdd = () => {
        setEditingCustomer(null);
        setIsModalOpen(true);
    };

    const handleEdit = (customer) => {
        setEditingCustomer(customer);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!confirm("Haqiqatan ham bu mijozni o'chirmoqchimisiz?")) return;
        try {
            await api.delete(`/customers/${id}`);
            fetchCustomers();
        } catch (err) {
            alert("Xatolik: " + err.message);
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
            alert("Saqlashda xatolik: " + err.message);
        }
    };

    if (loading) return <div className="p-8">Yuklanmoqda...</div>;

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h1 className={`text-2xl sm:text-3xl font-bold ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>Mijozlar</h1>
                <button
                    onClick={handleAdd}
                    className="bg-indigo-600 text-white w-full sm:w-auto px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 transition-all active:scale-95"
                >
                    <Plus size={20} /> Mijoz Qo'shish
                </button>
            </div>

            <div className={`rounded-xl shadow overflow-hidden border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
                {/* Mobile Card View */}
                <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-700">
                    {customers.map(customer => (
                        <div key={customer.id} className={`p-4 ${darkMode ? 'hover:bg-slate-700/50' : 'hover:bg-blue-50/50'}`}>
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-blue-100 text-blue-600'}`}>
                                        {customer.type === 'organization' ? <Package size={20} /> : <Users size={20} />}
                                    </div>
                                    <div>
                                        <div className={`font-semibold text-base ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{customer.name}</div>
                                        {customer.type === 'organization' && customer.companyName && (
                                            <div className="text-xs text-slate-500">{customer.companyName}</div>
                                        )}
                                    </div>
                                </div>
                                <span className={`px-2 py-0.5 inline-flex text-[10px] leading-tight font-semibold rounded-full border ${customer.type === 'vip' ? (darkMode ? 'bg-purple-900/30 text-purple-300 border-purple-700' : 'bg-purple-100 text-purple-800 border-purple-200') : customer.type === 'organization' ? (darkMode ? 'bg-amber-900/30 text-amber-300 border-amber-700' : 'bg-amber-100 text-amber-800 border-amber-200') : (darkMode ? 'bg-slate-700 text-slate-300 border-slate-600' : 'bg-slate-100 text-slate-600 border-slate-200')}`}>
                                    {customer.type === 'organization' ? 'Tashkilot' : (customer.type === 'vip' ? 'VIP' : 'Oddiy')}
                                </span>
                            </div>
                            
                            <div className="mt-3 grid grid-cols-1 xs:grid-cols-2 gap-2 text-sm">
                                <div className="flex items-center gap-2 opacity-80">
                                    <Phone size={14} className="text-emerald-500 shrink-0" />
                                    <span className={darkMode ? 'text-slate-300' : 'text-slate-600'}>{customer.phone || '-'}</span>
                                </div>
                                <div className="flex items-center gap-2 opacity-80" title={customer.address}>
                                    <MapPin size={14} className="text-indigo-500 shrink-0" />
                                    <span className={`truncate ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{customer.address || '-'}</span>
                                </div>
                            </div>
                            
                            <div className={`mt-3 pt-3 border-t ${darkMode ? 'border-slate-700' : 'border-slate-100'} flex items-center justify-between`}>
                                <div className="text-sm">
                                    <span className="text-slate-500">Buyurtmalar: </span>
                                    <span className={`font-bold ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>{customer._count?.orders || 0}</span>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => { setHistoryCustomerId(customer.id); setHistoryModalOpen(true); }} className={`p-1.5 rounded-lg border border-transparent ${darkMode ? 'text-indigo-400 hover:bg-slate-700' : 'text-indigo-600 hover:bg-indigo-50'}`}>
                                        <Eye size={18} />
                                    </button>
                                    <button onClick={() => handleEdit(customer)} className={`p-1.5 rounded-lg border border-transparent ${darkMode ? 'text-blue-400 hover:bg-slate-700' : 'text-blue-600 hover:bg-blue-50'}`}>
                                        <Pencil size={18} />
                                    </button>
                                    <button onClick={() => handleDelete(customer.id)} className={`p-1.5 rounded-lg border border-transparent ${darkMode ? 'text-rose-400 hover:bg-slate-700' : 'text-rose-600 hover:bg-rose-50'}`}>
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto w-full">
                    <table className="min-w-full text-left whitespace-nowrap">
                        <thead className={darkMode ? 'bg-slate-900/50' : 'bg-gray-50'}>
                            <tr>
                                <th className={`px-4 lg:px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Ism</th>
                                <th className={`hidden md:table-cell px-4 lg:px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Aloqa</th>
                                <th className={`hidden lg:table-cell px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Manzil</th>
                                <th className={`hidden sm:table-cell px-4 lg:px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Turi</th>
                                <th className={`px-4 lg:px-6 py-4 text-center text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Buyurtmalar</th>
                                <th className={`px-4 lg:px-6 py-4 text-right text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Amallar</th>
                            </tr>
                        </thead>
                        <tbody className={`divide-y ${darkMode ? 'divide-slate-700 bg-slate-800' : 'divide-gray-100 bg-white'}`}>
                            {customers.map(customer => (
                                <tr key={customer.id} className={`transition-colors ${darkMode ? 'hover:bg-slate-700/50' : 'hover:bg-blue-50/50'}`}>
                                    <td className={`px-4 lg:px-6 py-4 whitespace-nowrap font-medium max-w-[150px] sm:max-w-[200px] lg:max-w-xs truncate ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-blue-100 text-blue-600'}`}>
                                                {customer.type === 'organization' ? <Package size={16} /> : <Users size={16} />}
                                            </div>
                                            <div className="truncate">
                                                <div className="font-semibold truncate" title={customer.name}>{customer.name}</div>
                                                {customer.type === 'organization' && customer.companyName && (
                                                    <div className="text-xs text-slate-500 truncate" title={customer.companyName}>{customer.companyName}</div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className={`hidden md:table-cell px-4 lg:px-6 py-4 whitespace-nowrap ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{customer.phone || '-'}</td>
                                    <td className={`hidden lg:table-cell px-6 py-4 whitespace-nowrap max-w-[180px] xl:max-w-xs truncate ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                        {customer.address ? (
                                            <div className="flex items-center gap-1.5" title={customer.address}>
                                                <MapPin size={14} className="text-slate-400 shrink-0" />
                                                <span className="truncate">{customer.address}</span>
                                            </div>
                                        ) : '-'}
                                    </td>
                                    <td className="hidden sm:table-cell px-4 lg:px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full border ${customer.type === 'vip'
                                            ? (darkMode ? 'bg-purple-900/30 text-purple-300 border-purple-700' : 'bg-purple-100 text-purple-800 border-purple-200')
                                            : customer.type === 'organization'
                                                ? (darkMode ? 'bg-amber-900/30 text-amber-300 border-amber-700' : 'bg-amber-100 text-amber-800 border-amber-200')
                                                : (darkMode ? 'bg-slate-700 text-slate-300 border-slate-600' : 'bg-slate-100 text-slate-600 border-slate-200')
                                            }`}>
                                            {customer.type === 'organization' ? 'Tashkilot' : (customer.type === 'vip' ? 'VIP' : 'Oddiy')}
                                        </span>
                                    </td>
                                    <td className={`px-4 lg:px-6 py-4 whitespace-nowrap text-center font-bold ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                                        {customer._count?.orders || 0}
                                    </td>
                                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end gap-1 sm:gap-2">
                                            <button
                                                onClick={() => { setHistoryCustomerId(customer.id); setHistoryModalOpen(true); }}
                                                className={`p-2 rounded-lg transition-colors border border-transparent ${darkMode ? 'text-indigo-400 hover:text-indigo-300 hover:bg-slate-700' : 'text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 hover:border-indigo-100'}`}
                                                title="Tarixni Ko'rish"
                                            >
                                                <Eye size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleEdit(customer)}
                                                className={`p-2 rounded-lg transition-colors border border-transparent ${darkMode ? 'text-blue-400 hover:bg-blue-900/30' : 'text-blue-600 hover:bg-blue-50 hover:border-blue-100'}`}
                                                title="Tahrirlash"
                                            >
                                                <Pencil size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(customer.id)}
                                                className={`p-2 rounded-lg transition-colors border border-transparent ${darkMode ? 'text-rose-400 hover:bg-rose-900/30' : 'text-rose-600 hover:bg-rose-50 hover:border-rose-100'}`}
                                                title="O'chirish"
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
                        Mijozlar topilmadi. Yangi mijoz qo'shing.
                    </div>
                )}
            </div>

            <CustomerModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                customer={editingCustomer}
                darkMode={darkMode}
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
