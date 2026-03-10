import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Moon, Sun, Menu } from 'lucide-react';

const Layout = () => {
    // Initialize from localStorage or default
    const [darkMode, setDarkMode] = useState(() => {
        const saved = localStorage.getItem('darkMode');
        return saved === 'true';
    });

    const [fontSize, setFontSize] = useState(() => {
        return localStorage.getItem('fontSize') || 'base';
    });

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const toggleTheme = () => {
        const newMode = !darkMode;
        setDarkMode(newMode);
        localStorage.setItem('darkMode', newMode);
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

    return (
        <div className={`flex min-h-screen font-sans selection:bg-blue-100 selection:text-blue-900 relative transition-colors duration-500 ${darkMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-800'
            } ${getFontSizeClass()}`}>

            <Sidebar
                darkMode={darkMode}
                isOpen={isMobileMenuOpen}
                onClose={() => setIsMobileMenuOpen(false)}
            />

            {/* Mobile Menu Overlay Background */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            <div className="flex-1 md:ml-72 p-3 md:p-8 lg:p-12 overflow-y-auto transition-all duration-300 relative z-10 w-full flex flex-col">
                {/* Header Controls */}
                <div className="max-w-7xl mx-auto w-full flex justify-end md:mb-6">
                    <div className="absolute top-3 right-3 md:static z-30 flex gap-2 md:gap-3">
                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsMobileMenuOpen(true)}
                        className={`md:hidden p-3 rounded-full shadow-lg transition-all duration-300 w-12 h-12 flex items-center justify-center ${darkMode
                            ? 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700'
                            : 'bg-white text-slate-600 hover:text-blue-600 border border-slate-200'
                            }`}
                    >
                        <Menu size={20} />
                    </button>

                    {/* Font Size Toggle */}
                    <button
                        onClick={cycleFontSize}
                        className={`hidden md:flex p-3 rounded-full shadow-lg transition-all duration-300 font-bold items-center justify-center w-12 h-12 ${darkMode
                            ? 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700'
                            : 'bg-white text-slate-600 hover:text-blue-600 border border-slate-200'
                            }`}
                        title="Yozuv hajmini o'zgartirish"
                    >
                        {fontSize === 'base' && <span className="text-xs">A</span>}
                        {fontSize === 'lg' && <span className="text-sm">A+</span>}
                        {fontSize === 'xl' && <span className="text-lg">A++</span>}
                    </button>

                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className={`p-3 rounded-full shadow-lg transition-all duration-300 w-12 h-12 flex items-center justify-center ${darkMode
                            ? 'bg-slate-800 text-yellow-400 hover:bg-slate-700 border border-slate-700'
                            : 'bg-white text-slate-600 hover:text-blue-600 border border-slate-200'
                            }`}
                    >
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto w-full animate-fade-in pt-14 md:pt-0">
                    <Outlet context={{ darkMode }} />
                </div>
            </div>
        </div>
    );
};

export default Layout;
