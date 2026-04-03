import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Tag, Package, Menu } from 'lucide-react';

const BottomNav = ({ darkMode, onOpenMenu, isMenuOpen, t }) => {
    const location = useLocation();

    const navItems = [
        { to: '/', label: t.homeShort, icon: LayoutDashboard },
        { to: '/orders', label: t.ordersShort, icon: ShoppingCart },
        { to: '/products', label: t.productsShort, icon: Tag },
        { to: '/inventory', label: t.inventoryShort, icon: Package },
    ];

    return (
        <div 
            className={`md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-4 w-full max-w-sm pointer-events-none transition-all duration-500 ease-out transform ${
                isMenuOpen ? 'opacity-0 translate-y-12 scale-90' : 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
            }`}
        >
            <div className={`
                h-16 rounded-2xl flex items-center justify-around px-2 pointer-events-auto
                backdrop-blur-xl border shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-all duration-300
                ${darkMode 
                    ? 'bg-slate-900/80 border-slate-700/50' 
                    : 'bg-white/80 border-slate-200/50'}
            `}>
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.to;
                    return (
                        <Link
                            key={item.to}
                            to={item.to}
                            className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-all duration-300 relative ${
                                isActive 
                                    ? (darkMode ? 'text-blue-400' : 'text-blue-600') 
                                    : 'text-slate-500 hover:text-slate-400'
                            }`}
                        >
                            <div className={`
                                p-2 rounded-xl transition-all duration-300
                                ${isActive 
                                    ? (darkMode ? 'bg-blue-400/10' : 'bg-blue-600/10') 
                                    : ''}
                            `}>
                                <Icon size={isActive ? 20 : 18} strokeWidth={isActive ? 2.5 : 2} className="transition-all duration-300" />
                            </div>
                            <span className={`text-[10px] font-black uppercase tracking-tighter text-center transition-all ${isActive ? 'scale-105' : 'opacity-70'}`}>
                                {item.label}
                            </span>
                            {isActive && (
                                <div className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
                            )}
                        </Link>
                    );
                })}
                
                <button
                    onClick={onOpenMenu}
                    className="flex flex-col items-center justify-center flex-1 h-full gap-0.5 text-slate-500 hover:text-blue-500 transition-all duration-300"
                >
                    <div className="p-2 rounded-xl">
                        <Menu size={18} strokeWidth={2} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-tighter opacity-70">
                        {t.allShort}
                    </span>
                </button>
            </div>
        </div>
    );
};

export default BottomNav;
