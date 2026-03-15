import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Tag, Package, Menu } from 'lucide-react';

const BottomNav = ({ darkMode, onOpenMenu, t }) => {
    const location = useLocation();

    const navItems = [
        { to: '/', label: t.dashboard.split(' ')[0], icon: LayoutDashboard },
        { to: '/orders', label: t.orders.slice(0, -1), icon: ShoppingCart },
        { to: '/products', label: t.products, icon: Tag },
        { to: '/inventory', label: t.inventory, icon: Package },
    ];

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-[60] px-4 pb-6 pt-2 pointer-events-none">
            <div className={`
                mx-auto max-w-lg h-18 rounded-3xl flex items-center justify-around px-2 pointer-events-auto
                backdrop-blur-xl border shadow-2xl transition-all duration-300
                ${darkMode 
                    ? 'bg-slate-900/80 border-slate-700/50 shadow-blue-900/20' 
                    : 'bg-white/80 border-slate-200/50 shadow-slate-200/50'}
            `}>
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.to;
                    return (
                        <Link
                            key={item.to}
                            to={item.to}
                            className={`flex flex-col items-center justify-center flex-1 py-2 gap-1 transition-all duration-300 rounded-2xl ${
                                isActive 
                                    ? (darkMode ? 'text-blue-400' : 'text-blue-600 font-bold') 
                                    : 'text-slate-500 hover:text-slate-400'
                            }`}
                        >
                            <div className={`
                                p-2 rounded-xl transition-all duration-300
                                ${isActive 
                                    ? (darkMode ? 'bg-blue-400/10 shadow-[0_0_15px_rgba(96,165,250,0.2)]' : 'bg-blue-600/10 shadow-[0_0_15px_rgba(37,99,235,0.1)]') 
                                    : ''}
                            `}>
                                <Icon size={isActive ? 22 : 20} className="transition-transform duration-300" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-tighter">{item.label}</span>
                            {isActive && (
                                <div className="absolute top-1 w-1 h-1 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] animate-pulse" />
                            )}
                        </Link>
                    );
                })}
                
                <button
                    onClick={onOpenMenu}
                    className="flex flex-col items-center justify-center flex-1 py-2 gap-1 text-slate-500 hover:text-slate-400 transition-all duration-300"
                >
                    <div className="p-2 rounded-xl">
                        <Menu size={20} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-tighter">{t.all}</span>
                </button>
            </div>
        </div>
    );
};

export default BottomNav;
