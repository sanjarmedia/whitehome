import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({ 
    currentPage, 
    totalPages, 
    onPageChange, 
    onLimitChange, // New prop
    darkMode, 
    t,
    totalItems,
    itemsPerPage,
    compact = false
}) => {
    if (!totalItems || totalItems === 0) return null;

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

    const showingFrom = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const showingTo = Math.min(currentPage * itemsPerPage, totalItems || 0);

    const limitOptions = [10, 20, 24, 30, 50, 100];

    return (
        <div className={`flex flex-col items-center w-full overflow-hidden ${compact ? 'gap-2 py-2' : 'gap-4 py-6 sm:py-10'}`}>
            {/* Info and Limit Selector */}
            <div className={`flex flex-col sm:flex-row items-center gap-3 sm:gap-10 w-full justify-center ${compact ? 'px-1' : 'px-4'}`}>
                {totalItems > 0 && (
                    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4">
                        <p className={`text-[9px] sm:text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                            {t.showing || 'Showing'} <span className={darkMode ? 'text-slate-300' : 'text-slate-700'}>{showingFrom}-{showingTo}</span> 
                            {t.of ? ` ${t.of} ` : ' - '} 
                            <span className={darkMode ? 'text-slate-300' : 'text-slate-700'}>{totalItems}</span> {t.items || 'items'}
                        </p>
                        
                        {onLimitChange && (
                            <div className="flex items-center gap-2">
                                <span className={`hidden sm:inline text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-600' : 'text-slate-300'}`}>|</span>
                                <div className="flex items-center gap-2 bg-slate-500/5 px-2 py-1 rounded-lg">
                                    <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Limit:</span>
                                    <select 
                                        value={itemsPerPage}
                                        onChange={(e) => onLimitChange(Number(e.target.value))}
                                        className={`bg-transparent text-[9px] sm:text-[10px] font-black uppercase outline-none cursor-pointer transition-colors ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
                                    >
                                        {limitOptions.map(opt => (
                                            <option key={opt} value={opt} className={darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white'}>
                                                {opt}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className={`flex items-center gap-1.5 p-1.5 rounded-2xl border shadow-xl ${darkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-100 shadow-slate-200/50'}`}>
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

                    {/* Page Numbers */}
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
            )}
            
            {/* Mobile Touch Helper */}
            {totalPages > 1 && (
                <div className={`sm:hidden text-[9px] font-black uppercase tracking-tighter opacity-50 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                    {t.page || 'Page'} {currentPage} {t.of || 'of'} {totalPages}
                </div>
            )}
        </div>
    );
};

export default Pagination;
