import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useNavigate, useOutletContext } from 'react-router-dom';
import ProductCombobox from '../components/ui/ProductCombobox';
import { Plus, Trash2, Save, Tag, Building2 } from 'lucide-react';



const OrderForm = () => {
    const navigate = useNavigate();
    const { darkMode, t } = useOutletContext();
    const [products, setProducts] = useState([]);

    const [items, setItems] = useState([
        { category: 'Hammasi', productName: '', quantity: 1, price: 0, productId: null }
    ]);

    const [notes, setNotes] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const prodRes = await api.get('/products');
                setProducts(prodRes.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchData();
    }, []);


    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        const item = { ...newItems[index] };

        if (field === 'productName') {
            item.productName = value;
            // Auto-search and fill price/id/category
            const found = products.find(p => p.name.toLowerCase() === value.toLowerCase());
            if (found) {
                item.price = found.price;
                item.productId = found.id;
                if (found.category) item.category = found.category; // Auto-select category
            } else {
                item.productId = null;
            }
        } else {
            item[field] = value;
        }

        newItems[index] = item;
        setItems(newItems);
    };

    const addItem = () => {
        setItems([...items, { category: 'Hammasi', productName: '', quantity: 1, price: 0, productId: null }]);
    };

    const removeItem = (index) => {
        if (items.length > 1) {
            setItems(items.filter((_, i) => i !== index));
        }
    };

    const calculateTotal = () => {
        return items.reduce((acc, item) => acc + (item.quantity * item.price), 0);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const payload = {
            destinationType: 'WAREHOUSE',
            orderSource: 'COMPANY',
            items: items.map(i => ({
                category: i.category === 'Hammasi' ? (products.find(p => p.name === i.productName)?.category || 'Boshqa') : i.category,
                productName: i.productName,
                quantity: parseInt(i.quantity),
                price: parseFloat(i.price),
                productId: i.productId
            })),
            notes
        };

        try {
            await api.post('/orders', payload);
            navigate('/orders');
        } catch (err) {
            console.error(err);
            alert(t.errorOccurred + ": " + (err.response?.data?.error || err.message));
        }
    };

    // Extract unique categories from products, plus default ones if needed
    const validCategories = products.map(p => p.category).filter(Boolean);
    const uniqueCategories = [...new Set(validCategories)];
    const categories = ['Hammasi', ...uniqueCategories];

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-20">
            <header className="mb-8">
                <h1 className={`text-3xl font-light ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>{t.companyOrder}</h1>
                <p className={`mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t.companyOrderDesc}</p>
            </header>

            {/* Korxona belgisi */}
            <div className={`flex items-center gap-3 px-5 py-3 rounded-xl border ${darkMode ? 'bg-slate-800/50 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                <Building2 size={18} className="text-blue-500" />
                <span className="text-sm">{t.companyOrderHint}</span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

                {/* 1. Mahsulotlar */}
                <section className={`p-6 rounded-2xl shadow-sm border animate-slide-in ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
                    <h2 className={`text-lg font-medium mb-4 flex items-center gap-2 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${darkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>1</span>
                        {t.productsList}
                    </h2>

                    <div className="space-y-3">
                        {items.map((item, index) => (
                            <div key={index} className={`flex flex-col lg:flex-row gap-4 items-start lg:items-end p-4 rounded-xl border transition-colors ${darkMode ? 'bg-slate-700/50 border-slate-600 hover:border-slate-500' : 'bg-slate-50 border-slate-100 hover:border-blue-200'
                                }`}>

                                {/* 0. Item Category */}
                                <div className="w-full lg:w-48">
                                    <label className={`block text-xs font-medium mb-1 ml-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t.typeCategory}</label>
                                    <div className="relative">
                                        <Tag className={`absolute left-3 top-3.5 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`} size={16} />
                                        <select
                                            className={`w-full pl-10 pr-8 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm appearance-none cursor-pointer ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-200' : 'bg-white border-slate-200 text-slate-800'}`}
                                            value={item.category}
                                            onChange={e => handleItemChange(index, 'category', e.target.value)}
                                        >
                                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                        {/* Custom Arrow Icon */}
                                        <div className={`absolute right-3 top-4 pointer-events-none ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                            <svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 1L5 5L9 1" /></svg>
                                        </div>
                                    </div>
                                </div>

                                {/* 1. Product Name (Search/Input) with Custom Combobox */}
                                <div className="flex-1 w-full relative group">
                                    <label className={`block text-xs font-medium mb-1 ml-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t.productName}</label>
                                    <ProductCombobox
                                        value={item.productName}
                                        onChange={(val) => handleItemChange(index, 'productName', val)}
                                        products={products}
                                        darkMode={darkMode}
                                        placeholder={t.productNamePlaceholder}
                                    />
                                </div>

                                {/* Quantity, Price, Total - Same as before */}
                                <div className="w-full lg:w-24">
                                    <label className={`block text-xs font-medium mb-1 ml-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t.quantityShort}</label>
                                    <input
                                        type="number"
                                        className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-center font-medium ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                                            }`}
                                        value={item.quantity}
                                        onChange={e => handleItemChange(index, 'quantity', e.target.value)}
                                        min="1"
                                        required
                                    />
                                </div>

                                <div className="w-full lg:w-32">
                                    <label className={`block text-xs font-medium mb-1 ml-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t.price} ($)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-medium ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                                            }`}
                                        value={item.price}
                                        onChange={e => handleItemChange(index, 'price', e.target.value)}
                                        min="0"
                                        required
                                    />
                                </div>

                                <div className="w-full lg:w-28 pt-2 lg:pt-0">
                                    <label className="block text-xs font-medium text-slate-400 mb-1 text-right">{t.total}</label>
                                    <div className={`text-right font-bold text-lg py-2 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                                        ${(item.quantity * item.price).toFixed(2)}
                                    </div>
                                </div>

                                <button type="button" onClick={() => removeItem(index)} className={`p-2.5 rounded-lg mt-1 transition-colors ${darkMode ? 'text-slate-500 hover:text-rose-400 hover:bg-rose-900/20' : 'text-slate-400 hover:text-rose-500 hover:bg-rose-50'
                                    }`}>
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 flex justify-between items-center">
                        <div className={`text-lg font-medium ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                            {t.totalSum}: <span className="text-2xl font-bold text-blue-600 ml-2">${calculateTotal().toFixed(2)}</span>
                        </div>
                        <button type="button" onClick={addItem} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-colors font-medium border ${darkMode ? 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                            }`}>
                            <Plus size={18} /> <span>{t.addProduct}</span>
                        </button>
                    </div>
                </section >

                <div className="sticky bottom-6 z-10 flex justify-end">
                    <button type="submit" className="bg-blue-600 text-white px-8 py-4 rounded-2xl hover:bg-blue-700 font-semibold shadow-lg shadow-blue-500/30 flex items-center gap-3 transition-transform hover:-translate-y-1">
                        <Save size={20} /> {t.confirmOrder}
                    </button>
                </div>
            </form >
        </div>
    );
};

export default OrderForm;
