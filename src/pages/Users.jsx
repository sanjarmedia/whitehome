import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../api/axios';
import { Search, Plus, Trash2, Edit, Shield, User as UserIcon } from 'lucide-react';
import UserModal from '../components/UserModal';

const Users = () => {
    const { darkMode, t } = useOutletContext();
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
            setError(t.userFetchError);
        } finally {
            setLoading(false);
        }
    };

    const handleResetSystem = async () => {
        const confirm1 = window.confirm(t.systemResetWarning);
        if (!confirm1) return;

        const confirm2 = window.prompt(t.systemResetPrompt);
        if (confirm2 !== t.systemResetConfirmWord) {
            alert(t.notSelected); // reused or just hardcoded, but t.systemResetConfirmWord check is key
            return;
        }

        setClearingSystem(true);
        try {
            const res = await api.post('/system/reset');
            alert(res.data.message || t.systemResetSuccess);
            window.location.reload(); // Sahifani yangilaymiz
        } catch (err) {
            console.error(err);
            alert(t.systemResetError);
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
            alert(error.response?.data?.message || t.errorOccurred);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm(t.userDeleteConfirm)) return;
        try {
            await api.delete(`/users/${id}`);
            fetchUsers();
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || t.errorOccurred);
        }
    };

    const filteredUsers = users.filter(u => 
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="p-8">{t.loading}</div>;

    return (
        <div className="space-y-6 pb-20 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className={`text-3xl font-black flex items-center gap-3 ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                        <Shield className="text-blue-500" size={32} /> {t.users}
                    </h1>
                    <p className={`mt-1 font-bold text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        {t.userManagementDesc}
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    {currentUser.role === 'admin' && (
                        <button
                            onClick={handleResetSystem}
                            disabled={clearingSystem}
                            className={`px-5 py-3.5 rounded-2xl flex items-center justify-center gap-2 font-black uppercase text-[10px] tracking-widest transition-all active:scale-95 ${
                                darkMode ? 'bg-rose-900/30 text-rose-400 border border-rose-800/50 hover:bg-rose-900/50' : 'bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100'
                            }`}
                        >
                            <Trash2 size={16} />
                            {clearingSystem ? t.deleteLabel + '...' : t.systemReset}
                        </button>
                    )}
                    <button
                        onClick={() => { setEditingUser(null); setIsModalOpen(true); }}
                        className="bg-blue-600 text-white px-6 py-3.5 rounded-2xl flex items-center justify-center gap-2 hover:bg-blue-700 shadow-xl shadow-blue-500/30 transition-all active:scale-95 font-black uppercase text-[10px] tracking-widest"
                    >
                        <Plus size={20} strokeWidth={3} /> {t.addUserBtn}
                    </button>
                </div>
            </div>

            {/* High Density Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className={`p-4 rounded-3xl border shadow-sm transition-all hover:shadow-md ${darkMode ? 'bg-slate-800/40 border-slate-700 hover:border-slate-600' : 'bg-white border-slate-100 hover:border-slate-200'}`}>
                    <div className="flex items-center gap-2.5 mb-2">
                        <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                            <UserIcon size={18} />
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t.jamiLabel.toUpperCase()}</span>
                    </div>
                    <div className={`text-2xl font-black ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>{users.length}</div>
                    <div className="text-[10px] font-bold text-slate-500 mt-1">{t.users.toLowerCase()}</div>
                </div>

                <div className={`p-4 rounded-3xl border shadow-sm transition-all hover:shadow-md ${darkMode ? 'bg-slate-800/40 border-slate-700 hover:border-slate-600' : 'bg-white border-slate-100 hover:border-slate-200'}`}>
                    <div className="flex items-center gap-2.5 mb-2">
                        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t.onlineStatus.toUpperCase()}</span>
                    </div>
                    <div className={`text-2xl font-black ${darkMode ? 'text-emerald-500' : 'text-emerald-600'}`}>
                        {users.filter(u => u.lastActive && Date.now() - new Date(u.lastActive).getTime() < 5 * 60 * 1000).length}
                    </div>
                    <div className="text-[10px] font-bold text-slate-500 mt-1">{t.active.toLowerCase()}</div>
                </div>

                <div className={`p-4 rounded-3xl border shadow-sm transition-all hover:shadow-md ${darkMode ? 'bg-slate-800/40 border-slate-700 hover:border-slate-600' : 'bg-white border-slate-100 hover:border-slate-200'}`}>
                    <div className="flex items-center gap-2.5 mb-2">
                        <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
                            <Shield size={18} />
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>ADMIN</span>
                    </div>
                    <div className={`text-2xl font-black ${darkMode ? 'text-purple-500' : 'text-purple-600'}`}>
                        {users.filter(u => u.role === 'admin').length}
                    </div>
                    <div className="text-[10px] font-bold text-slate-500 mt-1">{t.users.toLowerCase()}</div>
                </div>

                <div className="p-2 rounded-[2rem] border overflow-hidden flex items-center bg-slate-900 shadow-inner group">
                    <div className="relative w-full">
                        <Search className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${darkMode ? 'text-slate-600 group-focus-within:text-blue-400' : 'text-slate-500 group-focus-within:text-blue-500'}`} size={16} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder={t.search}
                            className={`w-full pl-11 pr-4 py-2.5 border-none bg-transparent outline-none text-sm font-black text-slate-200 placeholder:text-slate-600`}
                        />
                    </div>
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
                        <div key={user.id} className={`group rounded-[2.5rem] overflow-hidden shadow-sm border transition-all hover:shadow-2xl hover:-translate-y-1 relative active:scale-[0.98] ${darkMode ? 'bg-slate-800 border-slate-700/50' : 'bg-white border-slate-100'}`}>
                            {/* Online Ripple Status */}
                            {isOnline && (
                                <div className="absolute top-5 left-6 flex items-center gap-2 z-10">
                                    <span className="relative flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,1)]"></span>
                                    </span>
                                    <span className="text-[10px] font-black uppercase tracking-tighter text-emerald-500">ONLINE</span>
                                </div>
                            )}

                            {/* Actions Overlay for Desktop, persistent touch targets for mobile */}
                            <div className="absolute top-4 right-4 z-20 flex gap-2 sm:opacity-0 group-hover:opacity-100 transition-all transform sm:translate-y-[-10px] group-hover:translate-y-0">
                                <button
                                    onClick={() => { setEditingUser(user); setIsModalOpen(true); }}
                                    className={`w-11 h-11 backdrop-blur-md rounded-2xl transition-all shadow-xl flex items-center justify-center border-2 border-transparent active:scale-90 ${darkMode ? 'bg-slate-900/80 text-blue-400 hover:border-blue-500/50' : 'bg-white/80 text-blue-600 hover:border-blue-200'}`}
                                >
                                    <Edit size={18} strokeWidth={3} />
                                </button>
                                {currentUser.id !== user.id && (
                                    <button
                                        onClick={() => handleDelete(user.id)}
                                        className={`w-11 h-11 backdrop-blur-md rounded-2xl transition-all shadow-xl flex items-center justify-center border-2 border-transparent active:scale-90 ${darkMode ? 'bg-slate-900/80 text-rose-400 hover:border-rose-500/50' : 'bg-white/80 text-rose-600 hover:border-rose-200'}`}
                                    >
                                        <Trash2 size={20} strokeWidth={2.5} />
                                    </button>
                                )}
                            </div>

                            <div className={`p-8 flex flex-col items-center border-b pt-14 ${darkMode ? 'border-slate-700/50 bg-slate-900/30' : 'border-slate-100 bg-slate-50/50'}`}>
                                <div className={`relative w-24 h-24 rounded-[2.5rem] flex items-center justify-center mb-5 rotate-3 group-hover:rotate-0 transition-transform shadow-2xl ${darkMode ? 'bg-slate-800 text-blue-400' : 'bg-white text-blue-600 border-4 border-white'}`}>
                                    <UserIcon size={44} strokeWidth={2.5} />
                                    {!isOnline && user.lastActive && (
                                         <div className="absolute -bottom-1 -right-1 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[8px] font-black uppercase text-slate-500">
                                            {t.offlineStatus}
                                         </div>
                                    )}
                                </div>
                                <h3 className={`font-black text-xl text-center leading-tight mb-1 truncate w-full ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                                    {user.name || user.username}
                                </h3>
                                <p className={`text-xs font-black tracking-tight ${darkMode ? 'text-blue-500' : 'text-blue-600'}`}>@{user.username}</p>
                            </div>
                            
                            <div className="p-4 flex flex-col items-center gap-3">
                                <span className={`inline-flex items-center px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${
                                    user.role === 'admin' ? (darkMode ? 'bg-purple-900/30 text-purple-400 border-purple-500/30' : 'bg-purple-50 text-purple-700 border-purple-100') :
                                    user.role === 'full' ? (darkMode ? 'bg-blue-900/30 text-blue-400 border-blue-500/30' : 'bg-blue-50 text-blue-700 border-blue-100') :
                                    user.role === 'worker' ? (darkMode ? 'bg-emerald-900/30 text-emerald-400 border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border-emerald-100') :
                                    (darkMode ? 'bg-slate-900/30 text-slate-500 border-slate-700' : 'bg-slate-50 text-slate-500 border-slate-200')
                                }`}>
                                    <Shield size={12} className="mr-2" strokeWidth={3} />
                                    {user.role === 'admin' ? 'Administrator' : user.role === 'full' ? t.fullRole : user.role === 'worker' ? t.workerRole : t.restrictedRole}
                                </span>
                                
                                {user.lastActive && (
                                    <div className="text-[9px] font-black text-slate-500 uppercase tracking-tighter opacity-50">
                                        {t.lastActiveLabel}: {new Date(user.lastActive).toLocaleDateString()}
                                    </div>
                                )}
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
                t={t}
            />
        </div>
    );
};

export default Users;
