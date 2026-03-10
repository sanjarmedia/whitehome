import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../api/axios';
import { Users, Pencil, Trash2, Plus, MapPin, Package } from 'lucide-react';
import CustomerModal from '../components/CustomerModal';

const Customers = () => {
    const { darkMode } = useOutletContext();
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);

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
            <div className="flex justify-between items-center mb-6">
                <h1 className={`text-3xl font-bold ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>Mijozlar</h1>
                <button
                    onClick={handleAdd}
                    className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 transition-all active:scale-95"
                >
                    <Plus size={20} /> Mijoz Qo'shish
                </button>
            </div>

            <div className={`rounded-xl shadow overflow-hidden border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
                <div className="overflow-x-auto w-full">
                    <table className="min-w-full text-left whitespace-nowrap">
                        <thead className={darkMode ? 'bg-slate-900/50' : 'bg-gray-50'}>
                            <tr>
                                <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Ism</th>
                                <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Aloqa</th>
                                <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Manzil</th>
                                <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Turi</th>
                                <th className={`px-6 py-4 text-center text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Buyurtmalar</th>
                                <th className={`px-6 py-4 text-right text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Amallar</th>
                            </tr>
                        </thead>
                        <tbody className={`divide-y ${darkMode ? 'divide-slate-700 bg-slate-800' : 'divide-gray-100 bg-white'}`}>
                            {customers.map(customer => (
                                <tr key={customer.id} className={`transition-colors ${darkMode ? 'hover:bg-slate-700/50' : 'hover:bg-blue-50/50'}`}>
                                    <td className={`px-6 py-4 whitespace-nowrap font-medium ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-blue-100 text-blue-600'}`}>
                                                {customer.type === 'organization' ? <Package size={16} /> : <Users size={16} />}
                                            </div>
                                            <div>
                                                <div className="font-semibold">{customer.name}</div>
                                                {customer.type === 'organization' && customer.companyName && (
                                                    <div className="text-xs text-slate-500">{customer.companyName}</div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className={`px-6 py-4 whitespace-nowrap ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{customer.phone || '-'}</td>
                                    <td className={`px-6 py-4 whitespace-nowrap max-w-xs truncate ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                        {customer.address ? (
                                            <div className="flex items-center gap-1.5" title={customer.address}>
                                                <MapPin size={14} className="text-slate-400 shrink-0" />
                                                <span className="truncate">{customer.address}</span>
                                            </div>
                                        ) : '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full border ${customer.type === 'vip'
                                            ? (darkMode ? 'bg-purple-900/30 text-purple-300 border-purple-700' : 'bg-purple-100 text-purple-800 border-purple-200')
                                            : customer.type === 'organization'
                                                ? (darkMode ? 'bg-amber-900/30 text-amber-300 border-amber-700' : 'bg-amber-100 text-amber-800 border-amber-200')
                                                : (darkMode ? 'bg-slate-700 text-slate-300 border-slate-600' : 'bg-slate-100 text-slate-600 border-slate-200')
                                            }`}>
                                            {customer.type === 'organization' ? 'Tashkilot' : (customer.type === 'vip' ? 'VIP' : 'Oddiy')}
                                        </span>
                                    </td>
                                    <td className={`px-6 py-4 whitespace-nowrap text-center font-bold ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                                        {customer._count?.orders || 0}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => handleEdit(customer)}
                                                className={`p-2 rounded-lg transition-colors ${darkMode ? 'text-blue-400 hover:bg-blue-900/30' : 'text-blue-600 hover:bg-blue-50'}`}
                                                title="Tahrirlash"
                                            >
                                                <Pencil size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(customer.id)}
                                                className={`p-2 rounded-lg transition-colors ${darkMode ? 'text-rose-400 hover:bg-rose-900/30' : 'text-rose-600 hover:bg-rose-50'}`}
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
        </div>
    );
};

export default Customers;
