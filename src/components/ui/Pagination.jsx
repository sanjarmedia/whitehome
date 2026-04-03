import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({ 
    currentPage, 
    totalPages, 
    onPageChange, 
    darkMode, 
    t,
    totalItems,
    itemsPerPage
}) => {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
        const pages = [];
        const maxVisiblePages = 5;
        
        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            if (currentPage <= 3) {
                for (let i = 1; i <= 4; i++) pages.push(i);
                pages.push('...');
                pages.push(totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1);
                pages.push('...');
                for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
            } else {
                pages.push(1);
                pages.push('...');
                pages.push(currentPage - 1);
                pages.push(currentPage);
                pages.push(currentPage + 1);
                pages.push('...');
                pages.push(totalPages);
            }
        }
        return pages;
    };

    const showingFrom = (currentPage - 1) * itemsPerPage + 1;
    const showingTo = Math.min(currentPage * itemsPerPage, totalItems || 0);

    return (
        <div className="flex flex-col items-center gap-4 py-8">
            {/* Info Text */}
            {totalItems > 0 && (
                <p className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                    {t.showing} <span className={darkMode ? 'text-slate-300' : 'text-slate-700'}>{showingFrom}-{showingTo}</span> 
                    {t.of ? ` ${t.of} ` : ' - '} 
                    <span className={darkMode ? 'text-slate-300' : 'text-slate-700'}>{totalItems}</span> {t.items}
                </p>
            )}

            {/* Pagination Controls */}
            <div className={`flex items-center gap-1.5 p-1.5 rounded-2xl border shadow-lg ${darkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-100 shadow-slate-200/50'}`}>
                {/* Previous Button */}
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`p-2.5 rounded-xl transition-all active:scale-90 disabled:opacity-30 disabled:pointer-events-none ${
                        darkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-50 text-slate-600'
                    }`}
                >
                    <ChevronLeft size={20} strokeWidth={3} />
                </button>

                {/* Page Numbers - Hidden on very small screens, shown as range */}
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar max-w-[240px] sm:max-w-none">
                    {getPageNumbers().map((page, index) => (
                        <React.Fragment key={index}>
                            {page === '...' ? (
                                <span className={`px-2 text-slate-500 font-black`}>&middot;&middot;&middot;</span>
                            ) : (
                                <button
                                    onClick={() => onPageChange(page)}
                                    className={`min-w-[40px] h-10 rounded-xl text-[11px] font-black transition-all active:scale-95 ${
                                        currentPage === page
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                            : darkMode 
                                                ? 'hover:bg-slate-800 text-slate-400' 
                                                : 'hover:bg-slate-50 text-slate-600'
                                    }`}
                                >
                                    {page}
                                </button>
                            )}
                        </React.Fragment>
                    ))}
                </div>

                {/* Next Button */}
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`p-2.5 rounded-xl transition-all active:scale-90 disabled:opacity-30 disabled:pointer-events-none ${
                        darkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-50 text-slate-600'
                    }`}
                >
                    <ChevronRight size={20} strokeWidth={3} />
                </button>
            </div>
            
            {/* Mobile Touch Helper */}
            <div className={`sm:hidden text-[9px] font-black uppercase tracking-tighter opacity-50 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                {t.page} {currentPage} {t.of} {totalPages}
            </div>
        </div>
    );
};

export default Pagination;
