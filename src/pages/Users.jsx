import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../api/axios';
import { Search, Plus, Trash2, Edit, Shield, User as UserIcon } from 'lucide-react';
import UserModal from '../components/UserModal';

const Users = () => {
    const { darkMode } = useOutletContext();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [error, setError] = useState(null);

    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

    const [clearingSystem, setClearingSystem] = useState(false);

    // Only admin can access this section based on roles

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/users');
            setUsers(res.data);
            setError(null);
        } catch (err) {
            console.error(err);
            setError("Ma'lumotlarni yuklashda xatolik");
        } finally {
            setLoading(false);
        }
    };

    const handleResetSystem = async () => {
        const confirm1 = window.confirm("DIQQAT! Siz butun tizimdagi barcha buyurtmalar, to'lovlar, mijozlar va loglarni o'chirib yuborasiz! Mahsulotlar soni 0 ta bo'lib qoladi. Rozimisiz?");
        if (!confirm1) return;

        const confirm2 = window.prompt('Buni amalda oshirish uchun "O\'CHIRISH" deb yozing:');
        if (confirm2 !== "O'CHIRISH") {
            alert("Noto'g'ri taqdim etildi. Bekor qilindi.");
            return;
        }

        setClearingSystem(true);
        try {
            const res = await api.post('/system/reset');
            alert(res.data.message || "Tizim ma'lumotlari muvaffaqiyatli tozalandi!");
            window.location.reload(); // Sahifani yangilaymiz
        } catch (err) {
            console.error(err);
            alert("Tizimni nollashda muammo yuzaga keldi.");
        } finally {
            setClearingSystem(false);
        }
    };

    const handleSave = async (formData) => {
        try {
            if (editingUser) {
                await api.put(`/users/${editingUser.id}`, formData);
            } else {
                await api.post('/users', formData);
            }
            fetchUsers();
            setIsModalOpen(false);
            setEditingUser(null);
        } catch (error) {
            console.error("Error saving user:", error);
            alert(error.response?.data?.message || "Xatolik yuz berdi");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Rostdan ham o'chirmoqchimisiz?")) return;
        try {
            await api.delete(`/users/${id}`);
            fetchUsers();
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || "O'chirishda xatolik");
        }
    };

    const filteredUsers = users.filter(u => 
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="p-8">Yuklanmoqda...</div>;

    return (
        <div className="space-y-6 pb-20 animate-fade-in">
            <div className={`p-6 rounded-2xl shadow-sm border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                        <h1 className={`text-3xl font-bold flex items-center gap-3 ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                            <Shield className="text-blue-500" /> Foydalanuvchilar
                        </h1>
                        <p className={`mt-1 flex items-center gap-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            Tizim foydalanuvchilarini boshqarish qismi
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {currentUser.role === 'admin' && (
                            <button
                                onClick={handleResetSystem}
                                disabled={clearingSystem}
                                className={`px-4 py-2.5 rounded-xl flex items-center gap-2 font-medium transition-all ${
                                    darkMode ? 'bg-rose-900/30 text-rose-400 border border-rose-800/50 hover:bg-rose-900/50' : 'bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100'
                                }`}
                            >
                                <Trash2 size={20} />
                                {clearingSystem ? 'O\'chirilmoqda...' : 'Tizimni Nollash (Reset)'}
                            </button>
                        )}
                        <button
                            onClick={() => { setEditingUser(null); setIsModalOpen(true); }}
                            className="bg-blue-600 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all active:scale-95"
                        >
                            <Plus size={20} /> Yangi Qo'shish
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                        <Search className={`absolute left-3 top-3 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`} size={18} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="Qidirish (Ism, Login)..."
                            className={`w-full pl-10 pr-4 py-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400'}`}
                        />
                    </div>
                </div>
            </div>

            {error && <div className="p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredUsers.map(user => (
                    <div key={user.id} className={`group rounded-2xl overflow-hidden shadow-sm border transition-all hover:shadow-xl relative ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
                        <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => { setEditingUser(user); setIsModalOpen(true); }}
                                className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm"
                            >
                                <Edit size={14} />
                            </button>
                            {currentUser.id !== user.id && (
                                <button
                                    onClick={() => handleDelete(user.id)}
                                    className="p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-sm"
                                >
                                    <Trash2 size={14} />
                                </button>
                            )}
                        </div>

                        <div className={`p-6 flex flex-col items-center border-b ${darkMode ? 'border-slate-700 bg-slate-800/50' : 'border-slate-100 bg-slate-50'}`}>
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 shadow-inner ${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-600'}`}>
                                <UserIcon size={32} />
                            </div>
                            <h3 className={`font-bold text-lg text-center ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                                {user.name || user.username}
                            </h3>
                            <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>@{user.username}</p>
                        </div>
                        <div className="p-4 text-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wider
                                ${user.role === 'admin' ? (darkMode ? 'bg-purple-900/30 text-purple-400 border border-purple-800/50' : 'bg-purple-100 text-purple-800 border border-purple-200') : ''}
                                ${user.role === 'full' ? (darkMode ? 'bg-blue-900/30 text-blue-400 border border-blue-800/50' : 'bg-blue-100 text-blue-800 border border-blue-200') : ''}
                                ${user.role === 'restricted' ? (darkMode ? 'bg-slate-700 text-slate-300 border border-slate-600' : 'bg-slate-100 text-slate-600 border border-slate-200') : ''}
                                ${user.role === 'worker' ? (darkMode ? 'bg-green-900/30 text-green-400 border border-green-800/50' : 'bg-green-100 text-green-800 border border-green-200') : ''}
                            `}>
                                {user.role}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            <UserModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                initialData={editingUser}
                darkMode={darkMode}
            />
        </div>
    );
};

export default Users;
