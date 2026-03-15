import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, ShoppingCart, Package, FileText, LogOut, Home, Tag, X, Shield, ShieldCheck } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const Sidebar = ({ isOpen, onClose, t }) => {
    const location = useLocation();

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isAdmin = user.role === 'admin';

    const handleLogout = async () => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                await fetch(`${API_URL}/api/auth/logout`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            } catch (err) {
                console.error("Logout error:", err);
            }
        }
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    };

    const links = [
        { to: '/', label: t.dashboard, icon: LayoutDashboard },
        { to: '/orders', label: t.orders, icon: ShoppingCart },
        { to: '/products', label: t.products, icon: Tag },
        { to: '/inventory', label: t.inventory, icon: Package },
        { to: '/customers', label: t.customers, icon: Users },
        ...(isAdmin ? [
            { to: '/users', label: t.users, icon: ShieldCheck },
            { to: '/reports', label: t.reports, icon: FileText },
            { to: '/audit-log', label: t.auditLog, icon: Shield },
        ] : []),
    ];

    return (
        <div className={`
            bg-slate-900/95 text-slate-300 flex-col backdrop-blur-md shadow-2xl transition-all duration-300
            md:translate-x-0 md:fixed md:left-0 md:top-0 md:h-screen md:w-72 md:flex z-50
            fixed inset-y-0 left-0 w-72 h-screen transform ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
            {/* Logo Area */}
            <div className="p-8 flex items-center justify-between border-b border-slate-800/50">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-500/30">
                        <Home className="text-white" size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-wide">SmartInventory</h1>
                        <p className="text-xs text-slate-500">{user.username === 'owner_root' ? 'Admin' : 'v1.0.2'}</p>
                    </div>
                </div>
                {/* Close Button (Mobile Only) */}
                <button onClick={onClose} className="md:hidden text-slate-400 hover:text-white">
                    <X size={24} />
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                {links.map((link) => {
                    const Icon = link.icon;
                    const isActive = location.pathname === link.to;
                    return (
                        <Link
                            key={link.to}
                            to={link.to}
                            onClick={() => onClose?.()} // Close sidebar on mobile when link clicked
                            className={`flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-200 group ${isActive
                                ? 'bg-blue-600/10 text-blue-400 font-medium shadow-sm border border-blue-500/20'
                                : 'hover:bg-slate-800/50 hover:text-white hover:translate-x-1'
                                }`}
                        >
                            <Icon size={20} className={`transition-colors ${isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-white'}`} />
                            <span>{link.label}</span>
                            {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]"></div>}
                        </Link>
                    );
                })}
            </nav>

            {/* User Profile / Logout */}
            <div className="p-4 border-t border-slate-800/50">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 w-full rounded-xl hover:bg-rose-500/10 hover:text-rose-400 transition-all duration-200 group text-sm font-medium"
                >
                    <LogOut size={18} className="text-slate-500 group-hover:text-rose-400" />
                    <span>{t.logout}</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
