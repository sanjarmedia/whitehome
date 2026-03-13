import { createPortal } from 'react-dom';
import { X, Package, Tag, Building2, Layers, DollarSign, Archive } from 'lucide-react';

const ProductDetailModal = ({ isOpen, onClose, product, darkMode }) => {
    if (!isOpen || !product) return null;

    return createPortal(
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6 animate-fade-in pointer-events-auto">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
                onClick={onClose}
            />
            
            <div className={`w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row relative animate-scale-in max-h-[90vh] overflow-y-auto md:overflow-visible ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className={`absolute top-4 right-4 z-50 p-2 rounded-full backdrop-blur-md transition-all active:scale-90 ${darkMode ? 'bg-slate-900/50 hover:bg-slate-700 text-slate-300' : 'bg-white/80 hover:bg-slate-100 text-slate-600 shadow-sm border border-slate-100'}`}
                >
                    <X size={20} />
                </button>

                {/* Left Side - Image */}
                <div className="w-full md:w-2/5 p-6 md:p-10 flex items-center justify-center relative bg-white md:rounded-l-3xl rounded-t-3xl md:rounded-tr-none min-h-[300px]">
                    {product.brand && (
                        <div className="absolute top-6 left-6 px-3 py-1 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg shadow-blue-500/30 z-10">
                            {product.brand}
                        </div>
                    )}

                    {product.image ? (
                        <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-auto max-h-[350px] object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-500"
                        />
                    ) : (
                        <Package size={120} className={`opacity-10 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                    )}
                </div>

                {/* Right Side - Details */}
                <div className="w-full md:w-3/5 p-6 md:p-10 flex flex-col justify-center">
                    <div className="mb-6">
                        <div className={`text-xs font-black uppercase tracking-widest mb-3 flex items-center gap-2 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                            <div className="w-1.5 h-1.5 rounded-full bg-current shadow-[0_0_8px_currentColor]"></div>
                            {product.category || 'Kategoriyasiz'}
                        </div>
                        <h2 className={`text-3xl md:text-4xl font-black leading-tight mb-4 ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                            {product.name}
                        </h2>
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border ${darkMode ? 'bg-slate-700/50 border-slate-600 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
                            SKU: <span className="font-black font-mono tracking-tighter text-blue-500">{product.sku || 'N/A'}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className={`rounded-2xl p-5 border transition-all ${darkMode ? 'bg-slate-900/40 border-slate-700/50 hover:bg-slate-900/60' : 'bg-blue-50/50 border-blue-100 hover:bg-blue-50'}`}>
                            <div className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-2 flex items-center gap-1.5">
                                <DollarSign size={14} /> Narxi
                            </div>
                            <div className={`text-3xl font-black ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                                ${product.price?.toLocaleString()}
                            </div>
                        </div>

                        <div className={`rounded-2xl p-5 border transition-all ${darkMode ? 'bg-slate-900/40 border-slate-700/50 hover:bg-slate-900/60' : 'bg-slate-50 border-slate-200 hover:bg-slate-100/50'}`}>
                            <div className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-2 flex items-center gap-1.5">
                                <Archive size={14} /> Zaxira
                            </div>
                            <div className={`text-3xl font-black ${product.quantity > 10 ? (darkMode ? 'text-emerald-400' : 'text-emerald-600') :
                                    product.quantity > 0 ? (darkMode ? 'text-amber-400' : 'text-amber-600') :
                                        (darkMode ? 'text-rose-400' : 'text-rose-600')
                                }`}>
                                {product.quantity} <span className="text-xs font-bold opacity-60">ta</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                            Mahsulot Tavsifi
                        </h3>
                        <div className={`p-5 rounded-2xl text-sm leading-relaxed max-h-[160px] overflow-y-auto custom-scrollbar border transition-all ${darkMode ? 'bg-slate-700/30 border-slate-700/50 text-slate-300' : 'bg-slate-50/50 border-slate-100 text-slate-600 hover:bg-slate-50'}`}>
                            {product.description || "Ushbu mahsulot uchun qo'shimcha ma'lumot kiritilmagan."}
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ProductDetailModal;
