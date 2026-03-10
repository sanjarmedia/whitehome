import { useState, useRef, useEffect } from 'react';
import { Download, FileText, Table } from 'lucide-react';

const ExportMenu = ({ onExportExcel, onExportPDF, darkMode }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`cursor-pointer px-6 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors border h-[42px] ${darkMode
                    ? 'bg-slate-700 text-blue-400 border-slate-600 hover:bg-slate-600'
                    : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50'}`}
            >
                <Download size={18} /> Export
            </button>

            {isOpen && (
                <div className={`absolute right-0 mt-2 w-48 rounded-xl shadow-xl border overflow-hidden z-50 animate-fade-in ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
                    <button
                        onClick={() => { onExportExcel(); setIsOpen(false); }}
                        className={`cursor-pointer w-full px-4 py-3 text-left flex items-center gap-3 transition-colors ${darkMode ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-gray-50 text-slate-700'}`}
                    >
                        <Table size={18} className="text-green-500" />
                        <span>Excel (.xlsx)</span>
                    </button>
                    <button
                        onClick={() => { onExportPDF(); setIsOpen(false); }}
                        className={`cursor-pointer w-full px-4 py-3 text-left flex items-center gap-3 transition-colors ${darkMode ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-gray-50 text-slate-700'}`}
                    >
                        <FileText size={18} className="text-red-500" />
                        <span>PDF Hujjat</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default ExportMenu;
