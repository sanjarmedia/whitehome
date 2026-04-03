import React from 'react';
import { createPortal } from 'react-dom';
import useScrollLock from '../../hooks/useScrollLock';
import { Truck, CheckCircle, Upload, AlertCircle } from 'lucide-react';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, status, darkMode, confirmText = "Tasdiqlash", cancelText = "Bekor qilish" }) => {
    useScrollLock(isOpen);
    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>
            <div className={`relative w-full max-w-sm rounded-3xl p-6 shadow-2xl transform transition-all scale-100 ${darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white'}`}>
                <div className="text-center">
                    {/* Animated Icon Area */}
                    <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-5 ${status === 'COMPLETED' ? 'bg-green-100 text-green-600' :
                        status === 'CHECKED' ? 'bg-indigo-100 text-indigo-600' :
                            status === 'EXPECTED' ? 'bg-blue-100 text-blue-600' :
                                'bg-slate-100 text-slate-600'
                        }`}>
                        {status === 'COMPLETED' ? (
                            <Truck size={40} className="animate-bounce" />
                        ) : status === 'CHECKED' ? (
                            <CheckCircle size={40} className="animate-pulse" />
                        ) : status === 'EXPECTED' ? (
                            <Upload size={40} className="animate-bounce" />
                        ) : (
                            <AlertCircle size={40} />
                        )}
                    </div>

                    <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                        {title}
                    </h3>
                    <div className={`text-sm mb-6 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        {message}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={onClose}
                            className={`py-3 rounded-xl font-medium transition-colors ${darkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={onConfirm}
                            className={`py-3 rounded-xl font-medium text-white transition-colors shadow-lg ${status === 'COMPLETED' ? 'bg-green-600 hover:bg-green-700 shadow-green-500/30' :
                                status === 'CHECKED' ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/30' :
                                    'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30'
                                }`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ConfirmationModal;
