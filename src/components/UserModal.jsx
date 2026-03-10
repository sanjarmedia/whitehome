import { useState, useEffect } from 'react';
import { X, Save, Shield, User as UserIcon } from 'lucide-react';

const UserModal = ({ isOpen, onClose, onSave, initialData, darkMode }) => {
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        password: '',
        role: 'restricted'
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || '',
                username: initialData.username || '',
                password: '', // Bo'sh qoladi, kiritilsa yangilanadi
                role: initialData.role || 'restricted'
            });
        } else {
            setFormData({
                name: '',
                username: '',
                password: '',
                role: 'restricted'
            });
        }
    }, [initialData, isOpen]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className={`w-[90%] sm:w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-slide-up bg-opacity-95 backdrop-blur-lg border ${
                darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
            }`}>
                <div className={`p-6 border-b flex justify-between items-center ${
                    darkMode ? 'border-slate-800' : 'border-slate-100'
                }`}>
                    <h2 className={`text-xl font-bold flex items-center gap-2 ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                        <UserIcon className="text-blue-500" />
                        {initialData ? 'Foydalanuvchini Tahrirlash' : 'Yangi Foydalanuvchi'}
                    </h2>
                    <button 
                        onClick={onClose}
                        className={`p-2 rounded-xl transition-all ${
                            darkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
                        }`}
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                            F.I.SH. (To'liq ism)
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className={`w-full px-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none ${
                                darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900'
                            }`}
                            placeholder="Masalan: Sardor Aliyev"
                        />
                    </div>

                    <div>
                        <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                            Login
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            className={`w-full px-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none ${
                                darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900'
                            }`}
                            placeholder="sardor_"
                        />
                    </div>

                    <div>
                        <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                            Parol {initialData && "(o'zgartirish uchun kiriting)"}
                        </label>
                        <input
                            type="password"
                            required={!initialData}
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className={`w-full px-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none ${
                                darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900'
                            }`}
                            placeholder="********"
                        />
                    </div>

                    <div>
                        <label className={`block text-sm font-medium mb-1.5 flex items-center gap-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                            <Shield size={16} /> Huquq (Rol)
                        </label>
                        <select
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            className={`w-full px-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none appearance-none ${
                                darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                            }`}
                        >
                            <option value="admin">Admin (To'liq boshqaruv)</option>
                            <option value="full">To'liq (Maxsulot/Buyurtma boshqarish)</option>
                            <option value="restricted">Cheklangan (Faqat ko'rish yoki oddiy vazifalar)</option>
                        </select>
                    </div>

                    <div className="pt-4 flex justify-end gap-3 mt-8">
                        <button
                            type="button"
                            onClick={onClose}
                            className={`px-5 py-2.5 rounded-xl transition-all font-medium ${
                                darkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-600'
                            }`}
                        >
                            Bekor qilish
                        </button>
                        <button
                            type="submit"
                            className="bg-blue-600 text-white px-6 py-2.5 rounded-xl hover:bg-blue-700 font-medium shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2 active:scale-95"
                        >
                            <Save size={18} />
                            Saqlash
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserModal;
