import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Plus, Trash2, Save, AlertTriangle, CheckCircle2, User, UserPlus, Package, AlertCircle } from 'lucide-react';

const CustomerOrderForm = () => {
    const navigate = useNavigate();
    const { darkMode, t } = useOutletContext();

    const [products, setProducts] = useState([]);
    const [customers, setCustomers] = useState([]);

    // Mijoz turi: 'existing' | 'new'
    const [customerType, setCustomerType] = useState('existing');
    const [customerId, setCustomerId] = useState('');
    // Yangi mijoz ma'lumotlari
    const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', address: '' });

    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [stockWarning, setStockWarning] = useState(false);

    const [items, setItems] = useState([
        { productId: '', productName: '', quantity: 1, price: 0, availableStock: null, category: '' }
    ]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [pRes, cRes] = await Promise.all([api.get('/products'), api.get('/customers')]);
                setProducts(pRes.data);
                setCustomers(cRes.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchData();
    }, []);

    const handleProductSelect = (index, productId) => {
        const product = products.find(p => p.id === parseInt(productId));
        const newItems = [...items];
        newItems[index] = {
            ...newItems[index],
            productId: productId ? parseInt(productId) : '',
            productName: product ? product.name : '',
            price: product ? product.price : 0,
            availableStock: product ? product.quantity : null,
            category: product ? (product.category || '') : ''
        };
        setItems(newItems);
        checkStockWarning(newItems);
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
        checkStockWarning(newItems);
    };

    const checkStockWarning = (itemsList) => {
        const hasInsufficient = itemsList.some(item =>
            item.availableStock !== null && parseInt(item.quantity) > item.availableStock
        );
        setStockWarning(hasInsufficient);
    };

    const addItem = () => {
        setItems([...items, { productId: '', productName: '', quantity: 1, price: 0, availableStock: null, category: '' }]);
    };

    const removeItem = (index) => {
        if (items.length > 1) {
            const newItems = items.filter((_, i) => i !== index);
            setItems(newItems);
            checkStockWarning(newItems);
        }
    };

    const total = items.reduce((sum, i) => sum + (parseFloat(i.price) || 0) * (parseInt(i.quantity) || 0), 0);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (customerType === 'existing' && !customerId) return alert(t.selectCustomer);
        if (customerType === 'new' && !newCustomer.name.trim()) return alert(t.required);

        const invalidItems = items.filter(i => !i.productId || !i.productName);
        if (invalidItems.length > 0) return alert(t.atLeastOneProduct);

        setSubmitting(true);
        try {
            const payload = {
                orderSource: 'CUSTOMER_ISSUE',
                destinationType: 'CUSTOMER',
                notes,
                items: items.map(i => ({
                    productId: parseInt(i.productId),
                    productName: i.productName,
                    quantity: parseInt(i.quantity),
                    price: parseFloat(i.price),
                    category: i.category
                }))
            };

            if (customerType === 'existing') {
                payload.customerId = parseInt(customerId);
            } else {
                payload.newCustomer = {
                    name: newCustomer.name.trim(),
                    phone: newCustomer.phone.trim(),
                    address: newCustomer.address.trim(),
                    type: 'regular'
                };
            }

            const res = await api.post('/orders', payload);
            const { stockInsufficient } = res.data;

            if (stockInsufficient) {
                alert(t.insufficientStock);
            } else {
                alert(t.issuedSuccessfully);
            }
            navigate('/orders');
        } catch (err) {
            alert(t.errorOccurred + ": " + (err.response?.data?.error || err.message));
        } finally {
            setSubmitting(false);
        }
    };

    const card = darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100';
    const inputCls = darkMode
        ? 'bg-slate-700 border-slate-600 text-slate-100 focus:border-blue-400'
        : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500';

    // Mijoz turi kartalari
    const customerCards = [
        {
            id: 'existing',
            label: t.existingCustomer,
            desc: t.existingCustomerDesc,
            icon: User,
        },
        {
            id: 'new',
            label: t.newCustomerLabel,
            desc: t.newCustomerDesc,
            icon: UserPlus,
        },
    ];

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-24">
            {/* Header */}
            <header>
                <h1 className={`text-3xl font-light ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                    {t.issuedForCustomer}
                </h1>
                <p className={`mt-1 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    {t.issuedForCustomerDesc}
                </p>
            </header>

            {/* Sklad ogohlantirish */}
            {stockWarning && (
                <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 animate-fade-in">
                    <AlertTriangle size={20} className="mt-0.5 shrink-0 text-amber-500" />
                    <div>
                        <p className="font-semibold text-sm">{t.stockInsufficientTitle}</p>
                        <p className="text-xs mt-0.5">
                            {t.stockInsufficientDesc}
                        </p>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">

                {/* 1. Mijoz bo'limi */}
                <section className={`p-6 rounded-2xl shadow-sm border ${card}`}>
                    <h2 className={`text-base font-medium mb-4 flex items-center gap-2 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                        <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${darkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>1</span>
                        {t.customerLabel}
                    </h2>

                    {/* Karta tanlash */}
                    <div className="flex gap-3 mb-5">
                        {customerCards.map(c => {
                            const Icon = c.icon;
                            const isSelected = customerType === c.id;
                            return (
                                <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => { setCustomerType(c.id); setCustomerId(''); }}
                                    className={`flex-1 flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${isSelected
                                        ? 'border-blue-500 bg-blue-500/10'
                                        : darkMode
                                            ? 'border-slate-600 hover:border-slate-500 bg-slate-700/50'
                                            : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                                        }`}
                                >
                                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${isSelected
                                        ? 'bg-blue-500 text-white'
                                        : darkMode ? 'bg-slate-600 text-slate-400' : 'bg-slate-200 text-slate-500'
                                        }`}>
                                        <Icon size={18} />
                                    </div>
                                    <div>
                                        <p className={`text-sm font-semibold ${isSelected ? 'text-blue-500' : darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                                            {c.label}
                                        </p>
                                        <p className={`text-xs mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{c.desc}</p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Doimiy Mijoz — ro'yxatdan tanlash */}
                    {customerType === 'existing' && (
                        <div className="max-w-md animate-fade-in">
                            <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                                {t.selectCustomer}
                            </label>
                            <div className="relative">
                                <User size={16} className={`absolute left-3 top-3.5 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                                <select
                                    className={`w-full pl-9 pr-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-sm ${inputCls}`}
                                    value={customerId}
                                    onChange={e => setCustomerId(e.target.value)}
                                    required={customerType === 'existing'}
                                >
                                    <option value="">{t.selectPlaceholder}</option>
                                    {customers.map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.name} {c.companyName ? `(${c.companyName})` : ''} — {c.phone || '-'}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Yangi Mijoz — qo'lda kiritish */}
                    {customerType === 'new' && (
                        <div className="space-y-3 animate-fade-in">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                    <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                                        {t.firstNameLastName} *
                                    </label>
                                    <input
                                        type="text"
                                        className={`w-full px-4 py-3 border rounded-xl outline-none text-sm transition-all ${inputCls}`}
                                        placeholder="Abdullayev Alibek"
                                        value={newCustomer.name}
                                        onChange={e => setNewCustomer(p => ({ ...p, name: e.target.value }))}
                                        required={customerType === 'new'}
                                    />
                                </div>
                                <div>
                                    <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                                        {t.phone}
                                    </label>
                                    <input
                                        type="text"
                                        className={`w-full px-4 py-3 border rounded-xl outline-none text-sm transition-all ${inputCls}`}
                                        placeholder="+998 90 123 45 67"
                                        value={newCustomer.phone}
                                        onChange={e => setNewCustomer(p => ({ ...p, phone: e.target.value }))}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                                    {t.addressLabel}
                                </label>
                                <input
                                    type="text"
                                    className={`w-full px-4 py-3 border rounded-xl outline-none text-sm transition-all ${inputCls}`}
                                    placeholder="Toshkent sh., Yunusobod tumani..."
                                    value={newCustomer.address}
                                    onChange={e => setNewCustomer(p => ({ ...p, address: e.target.value }))}
                                />
                            </div>
                        </div>
                    )}
                </section>

                {/* 2. Mahsulotlar */}
                <section className={`p-6 rounded-2xl shadow-sm border ${card}`}>
                    <h2 className={`text-base font-medium mb-4 flex items-center gap-2 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                        <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${darkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>2</span>
                        {t.products}
                    </h2>

                    <div className="space-y-3">
                        {items.map((item, index) => {
                            const insufficient = item.availableStock !== null && parseInt(item.quantity) > item.availableStock;
                            return (
                                <div
                                    key={index}
                                    className={`p-4 rounded-xl border transition-all ${insufficient
                                        ? darkMode ? 'border-rose-500/60 bg-rose-900/20' : 'border-rose-300 bg-rose-50/60'
                                        : darkMode ? 'bg-slate-700/50 border-slate-600' : 'bg-slate-50 border-slate-100'
                                        }`}
                                >
                                    <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-end">

                                        {/* Mahsulot tanlash */}
                                        <div className="flex-1 min-w-0">
                                            <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t.product}</label>
                                            <div className="relative">
                                                <Package size={14} className={`absolute left-3 top-3.5 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                                                <select
                                                    className={`w-full pl-8 pr-3 py-2.5 border rounded-lg outline-none text-sm transition-all ${insufficient
                                                        ? darkMode ? 'border-rose-500/60 bg-rose-900/20 text-rose-300' : 'border-rose-300 bg-rose-50 text-rose-800'
                                                        : inputCls}`}
                                                    value={item.productId}
                                                    onChange={e => handleProductSelect(index, e.target.value)}
                                                    required
                                                >
                                                    <option value="">{t.selectPlaceholder}</option>
                                                    {products.map(p => (
                                                        <option key={p.id} value={p.id}>
                                                            {p.name} [{t.warehouse}: {p.quantity}]
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            {item.availableStock !== null && (
                                                <div className={`mt-1 flex items-center gap-1.5 text-xs ${insufficient
                                                    ? darkMode ? 'text-rose-400' : 'text-rose-600'
                                                    : darkMode ? 'text-emerald-400' : 'text-emerald-600'
                                                    }`}>
                                                    {insufficient
                                                        ? <><AlertCircle size={12} /> {typeof t.availableStockLabel === 'function' ? t.availableStockLabel(item.availableStock, item.quantity) : `Stock: ${item.availableStock}, Need: ${item.quantity}`}</>
                                                        : <><CheckCircle2 size={12} /> {typeof t.stockSufficientLabel === 'function' ? t.stockSufficientLabel(item.availableStock) : `Stock: ${item.availableStock}`}</>
                                                    }
                                                </div>
                                            )}
                                        </div>

                                        {/* Soni */}
                                        <div className="w-full lg:w-24">
                                            <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t.quantityShort}</label>
                                            <input
                                                type="number" min="1"
                                                className={`w-full px-3 py-2.5 border rounded-lg outline-none text-center font-medium text-sm ${insufficient
                                                    ? darkMode ? 'border-rose-500/60 bg-rose-900/20 text-rose-300' : 'border-rose-300 bg-rose-50 text-rose-800'
                                                    : inputCls}`}
                                                value={item.quantity}
                                                onChange={e => handleItemChange(index, 'quantity', e.target.value)}
                                                required
                                            />
                                        </div>

                                        {/* Narxi */}
                                        <div className="w-full lg:w-32">
                                            <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                                {t.price} ($) <span className="text-blue-500 font-normal">({t.editLabel.toLowerCase()})</span>
                                            </label>
                                            <input
                                                type="number" min="0" step="0.01"
                                                className={`w-full px-3 py-2.5 border rounded-lg outline-none font-medium text-sm ${inputCls}`}
                                                value={item.price}
                                                onChange={e => handleItemChange(index, 'price', e.target.value)}
                                                required
                                            />
                                        </div>

                                        {/* Jami */}
                                        <div className="w-full lg:w-28">
                                            <label className={`block text-xs font-medium mb-1 text-right ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t.total}</label>
                                            <div className={`text-right font-bold text-base py-2.5 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                                                ${((parseFloat(item.price) || 0) * (parseInt(item.quantity) || 0)).toFixed(2)}
                                            </div>
                                        </div>

                                        {/* O'chirish */}
                                        <button
                                            type="button"
                                            onClick={() => removeItem(index)}
                                            className={`p-2.5 rounded-lg transition-colors ${darkMode ? 'text-slate-500 hover:text-rose-400 hover:bg-rose-900/20' : 'text-slate-400 hover:text-rose-500 hover:bg-rose-50'}`}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-4 flex justify-between items-center">
                        <div className={`font-medium ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                            {t.total}: <span className="text-xl font-bold text-blue-600 ml-1">${total.toFixed(2)}</span>
                        </div>
                        <button
                            type="button"
                            onClick={addItem}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${darkMode ? 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'}`}
                        >
                            <Plus size={16} /> {t.addProduct}
                        </button>
                    </div>
                </section>

                {/* 3. Izoh */}
                <section className={`p-6 rounded-2xl shadow-sm border ${card}`}>
                    <h2 className={`text-base font-medium mb-3 flex items-center gap-2 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                        <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${darkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>3</span>
                        {t.notesOptional}
                    </h2>
                    <textarea
                        rows={3}
                        className={`w-full px-4 py-3 border rounded-xl outline-none text-sm resize-none transition-all ${inputCls}`}
                        placeholder={t.optionalNotesPlaceholder}
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                    />
                </section>

                {/* Submit */}
                <div className="sticky bottom-6 z-10 flex justify-end">
                    <button
                        type="submit"
                        disabled={submitting}
                        className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-semibold shadow-lg transition-all hover:-translate-y-0.5 ${stockWarning
                            ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/30 text-white'
                            : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30 text-white'
                            } disabled:opacity-60 disabled:cursor-not-allowed`}
                    >
                        {submitting ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : stockWarning ? (
                            <AlertTriangle size={20} />
                        ) : (
                            <Save size={20} />
                        )}
                        {stockWarning ? t.sendToAdmin : t.confirmIssue}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CustomerOrderForm;
