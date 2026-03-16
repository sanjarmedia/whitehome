import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { User, Lock, LogIn, ShieldCheck, Sun, Moon, Globe } from 'lucide-react';
import { translations } from '../translations';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'uz');
    const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
    const [fontSize, setFontSize] = useState(() => localStorage.getItem('fontSize') || 'base');

    const navigate = useNavigate();
    const vantaRef = useRef(null);
    const [vantaEffect, setVantaEffect] = useState(null);

    useEffect(() => {
        if (vantaEffect) vantaEffect.destroy();

        if (window.VANTA) {
            setVantaEffect(window.VANTA.BIRDS({
                el: vantaRef.current,
                mouseControls: true,
                touchControls: true,
                gyroControls: false,
                minHeight: 200.00,
                minWidth: 200.00,
                scale: 1.00,
                scaleMobile: 1.00,
                backgroundColor: darkMode ? 0x030712 : 0xf8fafc,
                backgroundAlpha: 0.0, // Make Vanta background transparent to show CSS bg
                color1: darkMode ? 0x3b82f6 : 0x2563eb,
                color2: darkMode ? 0x6366f1 : 0x4f46e5,
                birdSize: 1.5,
                quantity: 3.0
            }))
        }
        return () => {
            if (vantaEffect) vantaEffect.destroy()
        }
    }, [darkMode]);

    const t = translations[lang];

    const toggleLang = () => {
        const newLang = lang === 'uz' ? 'ru' : 'uz';
        setLang(newLang);
        localStorage.setItem('lang', newLang);
    };

    const cycleFontSize = () => {
        let newSize = 'base';
        if (fontSize === 'base') newSize = 'lg';
        else if (fontSize === 'lg') newSize = 'xl';
        setFontSize(newSize);
        localStorage.setItem('fontSize', newSize);
    };

    const getFontSizeClass = () => {
        if (fontSize === 'lg') return 'text-lg';
        if (fontSize === 'xl') return 'text-xl';
        return 'text-base';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await api.post('/auth/login', { username, password });
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            
            setIsSuccess(true);
            setIsLoading(false);
            
            // Success message then navigate
            setTimeout(() => {
                navigate('/');
            }, 1000);
        } catch (err) {
            setError(err.response?.data?.message || (lang === 'uz' ? 'Foydalanuvchi nomi yoki parol noto\'g\'ri' : 'Неверное имя пользователя или пароль'));
            setIsLoading(false);
            setIsSuccess(false);
        }
    };

    return (
        <div ref={vantaRef} className={`min-h-screen ${darkMode ? 'dark bg-slate-950 text-white' : 'bg-slate-50 text-slate-800'} flex items-center justify-center overflow-hidden p-4 transition-colors duration-500 ${getFontSizeClass()}`}>
            {/* Glassmorphism Login Card */}
            <div className={`relative z-10 backdrop-blur-xl p-8 sm:p-10 rounded-3xl border animate-fade-in group transition-all duration-500 w-full sm:w-[420px] max-w-md ${darkMode 
                ? 'bg-slate-900/40 border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] hover:shadow-[0_8px_40px_0_rgba(0,0,0,0.5)] text-white' 
                : 'bg-white/70 border-slate-200 shadow-[0_8px_32px_0_rgba(0,0,0,0.1)] hover:shadow-[0_8px_40px_0_rgba(0,0,0,0.15)] text-slate-800'
                }`}>

                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-tr from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-blue-500/50 transform group-hover:scale-105 transition-transform duration-500">
                        <ShieldCheck size={32} />
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight drop-shadow-sm">{t.loginTitle}</h2>
                    <p className={`text-sm font-medium mt-2 ${darkMode ? 'text-blue-100/80' : 'text-slate-500'}`}>{t.welcomeToPanel}</p>
                </div>

                {error && (
                    <div className={`bg-rose-500/20 backdrop-blur-md border border-rose-500/50 px-4 py-3 rounded-xl text-sm font-medium mb-6 text-center animate-slide-in ${darkMode ? 'text-rose-200' : 'text-rose-600'}`}>
                        {error}
                    </div>
                )}

                {isSuccess && (
                    <div className={`bg-emerald-500/20 backdrop-blur-md border border-emerald-500/50 px-4 py-3 rounded-xl text-sm font-medium mb-6 text-center animate-slide-in ${darkMode ? 'text-emerald-200' : 'text-emerald-600'}`}>
                        {t.successLoading}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <label className={`text-xs font-bold uppercase tracking-wider px-1 ${darkMode ? 'text-blue-200/70' : 'text-slate-400'}`}>{t.usernameLabel}</label>
                        <div className="relative group/input">
                            <User className="absolute left-4 top-3.5 text-blue-400 group-focus-within/input:text-blue-500 transition-colors z-10" size={20} />
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className={`w-full pl-11 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all font-medium [&:-webkit-autofill]:[transition-delay:9999s] relative z-0 cursor-pointer ${darkMode 
                                    ? 'bg-slate-900/50 border-white/10 text-white placeholder:text-slate-400 focus:bg-slate-900/80' 
                                    : 'bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:bg-white'
                                    }`}
                                placeholder={t.enterUsername}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5 mb-2">
                        <label className={`text-xs font-bold uppercase tracking-wider px-1 ${darkMode ? 'text-blue-200/70' : 'text-slate-400'}`}>{t.password}</label>
                        <div className="relative group/input">
                            <Lock className="absolute left-4 top-3.5 text-blue-400 group-focus-within/input:text-blue-500 transition-colors z-10" size={20} />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={`w-full pl-11 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all font-medium [&:-webkit-autofill]:[transition-delay:9999s] relative z-0 cursor-pointer ${darkMode 
                                    ? 'bg-slate-900/50 border-white/10 text-white placeholder:text-slate-400 focus:bg-slate-900/80' 
                                    : 'bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:bg-white'
                                    }`}
                                placeholder={t.enterPassword}
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full mt-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-blue-500/40 hover:shadow-blue-500/60 hover:from-blue-600 hover:to-indigo-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group/btn disabled:opacity-70 disabled:pointer-events-none border border-white/10 cursor-pointer"
                    >
                        {isLoading ? (
                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        ) : (
                            <>
                                <LogIn size={20} className="group-hover/btn:-translate-x-1 transition-transform" />
                                {t.loginConfirm}
                            </>
                        )}
                    </button>
                </form>

                {/* Settings Widget Inside Login Card (Premium Style) */}
                <div className={`mt-8 pt-6 border-t flex items-center justify-center gap-3 ${darkMode ? 'border-white/5' : 'border-slate-100'}`}>
                    {/* Language Badge */}
                    <button
                        onClick={toggleLang}
                        className={`w-10 h-10 rounded-2xl border transition-all flex items-center justify-center cursor-pointer active:scale-90 ${darkMode 
                            ? 'bg-white/5 hover:bg-white/10 text-white border-white/10' 
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                        title={t.changeLanguage}
                    >
                        <span className="text-[10px] font-black uppercase tracking-tighter">{lang}</span>
                    </button>

                    {/* Theme Toggle */}
                    <button
                        onClick={() => {
                            const newMode = !darkMode;
                            setDarkMode(newMode);
                            localStorage.setItem('darkMode', newMode);
                        }}
                        className={`w-10 h-10 rounded-2xl border transition-all flex items-center justify-center cursor-pointer active:scale-90 ${darkMode 
                            ? 'bg-white/5 hover:bg-white/10 text-white border-white/10' 
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                    >
                        {darkMode ? <Sun size={16} className="text-yellow-400" /> : <Moon size={16} className="text-indigo-400" />}
                    </button>

                    {/* Font Size Cycle */}
                    <button
                        onClick={cycleFontSize}
                        className={`w-10 h-10 rounded-2xl border transition-all flex items-center justify-center cursor-pointer active:scale-90 ${darkMode 
                            ? 'bg-white/5 hover:bg-white/10 text-white border-white/10' 
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                        title={t.changeFontSize}
                    >
                        <div className="flex items-baseline gap-0.5">
                            <span className="text-xs font-bold">A</span>
                            {fontSize !== 'base' && <span className="text-[10px] font-black">{fontSize === 'lg' ? '+' : '++'}</span>}
                        </div>
                    </button>
                </div>

                {/* Decorative Elements */}
                <div className="absolute top-10 -right-10 w-32 h-32 bg-blue-400 rounded-full blur-3xl opacity-20 pointer-events-none"></div>
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-400 rounded-full blur-3xl opacity-20 pointer-events-none"></div>
            </div>
        </div>
    );
};

export default Login;
