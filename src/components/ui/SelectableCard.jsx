import React from 'react';

const SelectableCard = ({
    label,
    icon: Icon,
    selected,
    onClick,
    darkMode,
    className = ""
}) => {
    return (
        <div
            onClick={onClick}
            className={`flex-1 min-w-[140px] cursor-pointer p-4 rounded-xl border transition-all duration-200 flex flex-col items-center gap-3 text-center ${selected
                    ? (darkMode ? 'bg-blue-900/20 border-blue-500 text-blue-400 ring-2 ring-blue-500/20' : 'bg-blue-50 border-blue-500 text-blue-700 ring-2 ring-blue-500/20')
                    : (darkMode ? 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50')
                } ${className}`}
        >
            {Icon && (
                <Icon size={24} className={selected ? 'text-blue-600' : (darkMode ? 'text-slate-500' : 'text-slate-400')} />
            )}
            <span className="font-medium text-sm">{label}</span>
        </div>
    );
};

export default SelectableCard;
