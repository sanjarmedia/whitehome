import React from 'react';

const Input = ({
    label,
    value,
    onChange,
    placeholder,
    icon: Icon,
    darkMode,
    type = "text",
    className = ""
}) => {
    return (
        <div className={className}>
            {label && (
                <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    {label}
                </label>
            )}
            <div className="relative">
                {Icon && (
                    <Icon className={`absolute left-3 top-3 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`} size={18} />
                )}
                <input
                    type={type}
                    className={`w-full ${Icon ? 'pl-10' : 'px-4'} py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all ${darkMode
                            ? 'bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-500'
                            : 'bg-slate-50 border-slate-200 text-slate-800'
                        }`}
                    placeholder={placeholder}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                />
            </div>
        </div>
    );
};

export default Input;
