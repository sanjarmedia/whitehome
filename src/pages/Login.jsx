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
        if (!vantaEffect && window.VANTA) {
            setVantaEffect(window.VANTA.BIRDS({
                el: vantaRef.current,
                mouseControls: true,
                touchControls: true,
                gyroControls: false,
                minHeight: 200.00,
                minWidth: 200.00,
                scale: 1.00,
                scaleMobile: 1.00,
                backgroundColor: 0x030712, // bg-slate-950
                color1: 0x3b82f6,
                color2: 0x6366f1,
                birdSize: 1.5,
                quantity: 3.0
            }))
        }
        return () => {
            if (vantaEffect) vantaEffect.destroy()
        }
    }, [vantaEffect]);

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
        <div ref={vantaRef} className={`min-h-screen bg-slate-950 flex items-center justify-center overflow-hidden p-4 ${getFontSizeClass()}`}>
            {/* Glassmorphism Login Card */}
            <div className="relative z-10 bg-slate-900/40 backdrop-blur-xl p-8 sm:p-10 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] border border-white/10 w-full sm:w-[420px] max-w-md animate-fade-in group hover:shadow-[0_8px_40px_0_rgba(0,0,0,0.5)] transition-shadow duration-500">

                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-tr from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-blue-500/50 transform group-hover:scale-105 transition-transform duration-500">
                        <ShieldCheck size={32} />
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight text-white drop-shadow-md">{t.loginTitle}</h2>
                    <p className="text-sm font-medium text-blue-100/80 mt-2">{t.welcomeToPanel}</p>
                </div>

                {error && (
                    <div className="bg-rose-500/20 backdrop-blur-md border border-rose-500/50 text-rose-200 px-4 py-3 rounded-xl text-sm font-medium mb-6 text-center animate-slide-in">
                        {error}
                    </div>
                )}

                {isSuccess && (
                    <div className="bg-emerald-500/20 backdrop-blur-md border border-emerald-500/50 text-emerald-200 px-4 py-3 rounded-xl text-sm font-medium mb-6 text-center animate-slide-in">
                        {t.successLoading}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-blue-200/70 px-1">{t.usernameLabel}</label>
                        <div className="relative group/input">
                            <User className="absolute left-4 top-3.5 text-blue-400 group-focus-within/input:text-blue-500 transition-colors z-10" size={20} />
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:bg-slate-900/80 transition-all text-white font-medium placeholder:text-slate-400 [&:-webkit-autofill]:[transition-delay:9999s] relative z-0 cursor-pointer"
                                placeholder={t.enterUsername}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5 mb-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-blue-200/70 px-1">{t.password}</label>
                        <div className="relative group/input">
                            <Lock className="absolute left-4 top-3.5 text-blue-400 group-focus-within/input:text-blue-500 transition-colors z-10" size={20} />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:bg-slate-900/80 transition-all text-white font-medium placeholder:text-slate-400 [&:-webkit-autofill]:[transition-delay:9999s] relative z-0 cursor-pointer"
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

                {/* Settings Widget Inside Login Card */}
                {/* Settings Widget Inside Login Card (Premium Style) */}
                <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-center gap-3">
                    {/* Language Badge */}
                    <button
                        onClick={toggleLang}
                        className="bg-white/5 hover:bg-white/10 text-white w-10 h-10 rounded-2xl border border-white/10 transition-all flex items-center justify-center cursor-pointer active:scale-90"
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
                        className="bg-white/5 hover:bg-white/10 text-white w-10 h-10 rounded-2xl border border-white/10 transition-all flex items-center justify-center cursor-pointer active:scale-90"
                    >
                        {darkMode ? <Sun size={16} className="text-yellow-400" /> : <Moon size={16} className="text-indigo-300" />}
                    </button>

                    {/* Font Size Cycle */}
                    <button
                        onClick={cycleFontSize}
                        className="bg-white/5 hover:bg-white/10 text-white w-10 h-10 rounded-2xl border border-white/10 transition-all flex items-center justify-center cursor-pointer active:scale-90"
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
