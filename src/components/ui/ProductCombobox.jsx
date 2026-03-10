import React from 'react';
import { Search, Package } from 'lucide-react';

const ProductCombobox = ({
    value,
    onChange,
    products,
    darkMode,
    placeholder = "Mahsulot nomini qidiring..."
}) => {

    // Find exact match object for image preview
    const selectedProduct = products.find(p => p.name === value);

    // Filter products for dropdown
    const filteredProducts = value && !selectedProduct
        ? products.filter(p => p.name.toLowerCase().includes(value.toLowerCase()))
        : [];

    return (
        <div className="relative group">
            <div className="relative flex items-center">
                <Search className={`absolute left-3 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`} size={18} />
                <input
                    type="text"
                    className={`w-full pl-10 pr-12 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-500' : 'bg-white border-slate-200 text-slate-800 placeholder:text-slate-400'}`}
                    placeholder={placeholder}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    autoComplete="off"
                />
                {/* Selected Product Image Preview in Input */}
                {selectedProduct?.image && (
                    <div className="absolute right-2 top-1.5 w-8 h-8 rounded-md overflow-hidden bg-white border">
                        <img
                            src={selectedProduct.image}
                            alt=""
                            className="w-full h-full object-contain"
                        />
                    </div>
                )}
            </div>

            {/* Dropdown Results */}
            {filteredProducts.length > 0 && (
                <div className={`absolute z-50 left-0 right-0 top-[110%] rounded-xl shadow-2xl border overflow-hidden max-h-60 overflow-y-auto ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                    {filteredProducts.map(p => (
                        <div
                            key={p.id}
                            onClick={() => onChange(p.name)}
                            className={`p-3 flex items-center gap-3 cursor-pointer transition-colors border-b last:border-0 ${darkMode ? 'border-slate-700 hover:bg-slate-700' : 'border-slate-100 hover:bg-blue-50'}`}
                        >
                            <div className="w-10 h-10 rounded-lg bg-white border flex-shrink-0 p-0.5">
                                {p.image ? <img src={p.image} className="w-full h-full object-contain" alt="" /> : <Package className="text-slate-300 w-full h-full" />}
                            </div>
                            <div className="flex-1">
                                <div className={`font-medium text-sm ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{p.name}</div>
                                <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{p.brand} &bull; {p.category}</div>
                            </div>
                            <div className={`font-bold text-sm ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                                ${p.price}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Show 'No results' only if user typed something, no exact match, and no filtered results */}
            {value && !selectedProduct && filteredProducts.length === 0 && (
                <div className={`absolute z-50 left-0 right-0 top-[110%] rounded-xl shadow-2xl border overflow-hidden p-4 text-center text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-500' : 'bg-white border-slate-200 text-slate-400'}`}>
                    Natija topilmadi
                </div>
            )}
        </div>
    );
};

export default ProductCombobox;
