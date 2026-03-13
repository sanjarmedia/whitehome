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
            <div className={`p-8 rounded-3xl shadow-sm border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                    <div>
                        <h1 className={`text-3xl font-black flex items-center gap-3 ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                            <Shield className="text-blue-500" size={32} /> Foydalanuvchilar
                        </h1>
                        <p className={`mt-1 font-bold text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            Tizim kirish huquqlari va profil boshqaruvi
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                        {currentUser.role === 'admin' && (
                            <button
                                onClick={handleResetSystem}
                                disabled={clearingSystem}
                                className={`px-5 py-3 rounded-2xl flex items-center justify-center gap-2 font-black uppercase text-[10px] tracking-widest transition-all active:scale-95 ${
                                    darkMode ? 'bg-rose-900/30 text-rose-400 border border-rose-800/50 hover:bg-rose-900/50' : 'bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100'
                                }`}
                            >
                                <Trash2 size={16} />
                                {clearingSystem ? 'O\'chirilmoqda...' : 'Tizimni Nollash'}
                            </button>
                        )}
                        <button
                            onClick={() => { setEditingUser(null); setIsModalOpen(true); }}
                            className="bg-blue-600 text-white px-6 py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-blue-700 shadow-xl shadow-blue-500/30 transition-all active:scale-95 font-black uppercase text-[10px] tracking-widest"
                        >
                            <Plus size={18} /> Yangi Qo'shish
                        </button>
                    </div>
                </div>

                <div className="relative max-w-md">
                    <Search className={`absolute left-4 top-3.5 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`} size={18} />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Login yoki ism orqali qidirish..."
                        className={`w-full pl-12 pr-4 py-3 border rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold ${darkMode ? 'bg-slate-900/50 border-slate-700 text-slate-100 placeholder:text-slate-600' : 'bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400'}`}
                    />
                </div>
            </div>

            {error && (
                <div className={`p-4 rounded-2xl border flex items-center gap-3 font-bold text-sm ${darkMode ? 'bg-rose-900/20 border-rose-800 text-rose-400' : 'bg-rose-50 border-rose-100 text-rose-600'}`}>
                    <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredUsers.map(user => {
                    const isOnline = user.lastActive && Date.now() - new Date(user.lastActive).getTime() < 5 * 60 * 1000;
                    
                    return (
                        <div key={user.id} className={`group rounded-[2.5rem] overflow-hidden shadow-sm border transition-all hover:shadow-2xl hover:-translate-y-1 relative ${darkMode ? 'bg-slate-800 border-slate-700/50' : 'bg-white border-slate-100'}`}>
                            {/* Status Badge */}
                            <div className="absolute top-5 left-6 flex items-center gap-2" title={user.lastActive ? `Ohirgi faollik: ${new Date(user.lastActive).toLocaleString('uz-UZ')}` : 'Tizimga kirmagan'}>
                                <div className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)]' : 'bg-slate-400'}`}></div>
                                <span className={`text-[10px] uppercase font-black tracking-tighter ${isOnline ? 'text-emerald-500' : 'text-slate-500'}`}>
                                    {isOnline ? 'Online' : 'Offline'}
                                </span>
                            </div>

                            {/* Actions */}
                            <div className="absolute top-4 right-4 z-10 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100">
                                <button
                                    onClick={() => { setEditingUser(user); setIsModalOpen(true); }}
                                    className="w-10 h-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-lg flex items-center justify-center border border-slate-100 dark:border-slate-700"
                                >
                                    <Edit size={16} />
                                </button>
                                {currentUser.id !== user.id && (
                                    <button
                                        onClick={() => handleDelete(user.id)}
                                        className="w-10 h-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm text-rose-600 dark:text-rose-400 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-lg flex items-center justify-center border border-slate-100 dark:border-slate-700"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>

                            <div className={`p-8 flex flex-col items-center border-b ${darkMode ? 'border-slate-700/50 bg-slate-900/20' : 'border-slate-100 bg-slate-50/50'}`}>
                                <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center mb-4 rotate-3 group-hover:rotate-0 transition-transform shadow-xl ${darkMode ? 'bg-slate-700 text-blue-400' : 'bg-white text-blue-600 border border-slate-100'}`}>
                                    <UserIcon size={36} />
                                </div>
                                <h3 className={`font-black text-lg text-center leading-tight mb-1 ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                                    {user.name || user.username}
                                </h3>
                                <p className={`text-xs font-bold ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>@{user.username}</p>
                            </div>
                            
                            <div className="p-5 flex justify-center">
                                <span className={`inline-flex items-center px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border
                                    ${user.role === 'admin' ? (darkMode ? 'bg-purple-900/20 text-purple-400 border-purple-800/50' : 'bg-purple-50 text-purple-700 border-purple-200 shadow-sm shadow-purple-100') : ''}
                                    ${user.role === 'full' ? (darkMode ? 'bg-blue-900/20 text-blue-400 border-blue-800/50' : 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm shadow-blue-100') : ''}
                                    ${user.role === 'restricted' ? (darkMode ? 'bg-slate-700/50 text-slate-300 border-slate-600' : 'bg-slate-100 text-slate-600 border-slate-200 shadow-sm shadow-slate-100') : ''}
                                    ${user.role === 'worker' ? (darkMode ? 'bg-green-900/20 text-green-400 border-green-800/50' : 'bg-green-50 text-green-700 border-green-200 shadow-sm shadow-green-100') : ''}
                                `}>
                                    {user.role === 'admin' ? 'Administrator' : user.role === 'full' ? 'To\'liq ruxsat' : user.role === 'worker' ? 'Ishchi' : 'Cheklangan'}
                                </span>
                            </div>
                        </div>
                    );
                })}
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
