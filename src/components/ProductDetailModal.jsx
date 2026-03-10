import { X, Package, Tag, Building2, Layers, DollarSign, Archive } from 'lucide-react';

const ProductDetailModal = ({ isOpen, onClose, product, darkMode }) => {
    if (!isOpen || !product) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className={`w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row relative ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className={`absolute top-4 right-4 z-10 p-2 rounded-full backdrop-blur-md transition-colors ${darkMode ? 'bg-slate-900/50 hover:bg-slate-700 text-slate-300' : 'bg-white/80 hover:bg-slate-100 text-slate-600 shadow-sm'}`}
                >
                    <X size={20} />
                </button>

                {/* Left Side - Image */}
                <div className="w-full md:w-2/5 p-8 flex items-center justify-center relative bg-white md:rounded-l-3xl rounded-t-3xl md:rounded-tr-none">
                    {product.brand && (
                        <div className="absolute top-6 left-6 px-3 py-1 bg-blue-600 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm z-10">
                            {product.brand}
                        </div>
                    )}

                    {product.image ? (
                        <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-auto max-h-[300px] object-contain drop-shadow-xl hover:scale-105 transition-transform duration-500"
                        />
                    ) : (
                        <Package size={100} className={`opacity-20 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                    )}
                </div>

                {/* Right Side - Details */}
                <div className="w-full md:w-3/5 p-8 flex flex-col">
                    <div className="mb-6">
                        <div className={`text-sm font-black uppercase tracking-widest mb-2 flex items-center gap-1.5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                            <Tag size={16} /> {product.category || 'Kategoriyasiz'}
                        </div>
                        <h2 className={`text-3xl font-bold leading-tight mb-2 ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                            {product.name}
                        </h2>
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
                            SKU: <span className="font-bold font-mono">{product.sku || 'N/A'}</span>
                        </div>
                    </div>

                    <div className="flex bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-5 mb-6 items-center justify-between border border-blue-100 dark:border-blue-900/50">
                        <div>
                            <div className="text-xs font-bold uppercase tracking-wider text-blue-500 mb-1 flex items-center gap-1">
                                <DollarSign size={14} /> Narxi
                            </div>
                            <div className={`text-4xl font-black ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                                ${product.price?.toLocaleString()}
                            </div>
                        </div>

                        <div className="h-10 w-px bg-blue-200 dark:bg-blue-800/50 mx-4"></div>

                        <div className="text-right">
                            <div className="text-xs font-bold uppercase tracking-wider text-blue-500 mb-1 flex items-center gap-1 justify-end">
                                <Archive size={14} /> Ombor zaxirasi
                            </div>
                            <div className={`text-3xl font-black ${product.quantity > 10 ? (darkMode ? 'text-emerald-400' : 'text-emerald-600') :
                                    product.quantity > 0 ? (darkMode ? 'text-amber-400' : 'text-amber-600') :
                                        (darkMode ? 'text-rose-400' : 'text-rose-600')
                                }`}>
                                {product.quantity} <span className="text-base font-medium opacity-70">dona</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1">
                        <h3 className={`text-sm font-bold uppercase tracking-wider mb-3 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            Tavsif va xususiyatlar
                        </h3>
                        <div className={`p-4 rounded-xl text-sm leading-relaxed max-h-[150px] overflow-y-auto custom-scrollbar ${darkMode ? 'bg-slate-700/50 text-slate-300' : 'bg-slate-50 text-slate-600'}`}>
                            {product.description || "Ushbu mahsulot uchun qo'shimcha ma'lumot kiritilmagan."}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetailModal;
