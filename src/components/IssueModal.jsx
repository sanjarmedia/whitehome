import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { X, Save, User, Package, CheckCircle } from 'lucide-react';
import useScrollLock from '../hooks/useScrollLock';
import api from '../api/axios';

const IssueModal = ({ isOpen, onClose, products, darkMode, onIssued, t }) => {
    const navigate = useNavigate();
    const [orderType, setOrderType] = useState('existing'); // existing, new
    const [customers, setCustomers] = useState([]);
    const [formData, setFormData] = useState({
        customerId: '',
        newCustomer: {
            name: '',
            phone: '',
            address: '',
            type: 'regular'
        },
        items: [], // [{ productId, productName, category, quantity, price }]
        notes: ''
    });

    useScrollLock(isOpen);

    useEffect(() => {
        if (isOpen) {
            fetchCustomers();
            if (products && products.length > 0) {
                setFormData(prev => ({
                    ...prev,
                    items: products.map(p => ({
                        productId: p.id,
                        productName: p.name,
                        category: p.category,
                        quantity: 1,
                        price: p.price,
                        maxQuantity: p.quantity
                    }))
                }));
            }
        }
    }, [isOpen, products]);

    const fetchCustomers = async () => {
        try {
            const res = await api.get('/customers');
            setCustomers(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    if (!isOpen || !products || products.length === 0) return null;

    const handleItemChange = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index][field] = value;
        setFormData({ ...formData, items: newItems });
    };

    const removeItem = (index) => {
        if (formData.items.length === 1) return alert(t.atLeastOneProduct);
        setFormData({ ...formData, items: formData.items.filter((_, i) => i !== index) });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const payload = {
            destinationType: 'CUSTOMER',
            orderSource: 'CUSTOMER_ISSUE',
            status: 'NEW',
            items: formData.items.map(item => ({
                productId: item.productId,
                productName: item.productName,
                category: item.category,
                quantity: parseInt(item.quantity),
                price: parseFloat(item.price)
            })),
            notes: formData.notes
        };

        if (orderType === 'existing') {
            if (!formData.customerId) return alert(t.selectCustomer);
            payload.customerId = parseInt(formData.customerId);
        } else {
            if (!formData.newCustomer.name) return alert(t.name);
            payload.newCustomer = formData.newCustomer;
        }

        try {
            await api.post('/orders', payload);
            alert(t.issuedSuccessfully);
            onIssued();
            onClose();
            navigate('/orders');
        } catch (err) {
            console.error(err);
            alert("Xatolik: " + (err.response?.data?.error || err.message));
        }
    };

    const totalAmount = formData.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in p-4">
            <div className={`w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>
                {/* Header */}
                <div className={`px-5 py-4 flex items-center justify-between border-b ${darkMode ? 'border-slate-700 bg-slate-900/20' : 'border-slate-100 bg-slate-50/20'}`}>
                    <div>
                        <h2 className={`text-xl font-black flex items-center gap-3 ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                            <Package className="text-blue-500" size={24} strokeWidth={2.5} /> {t.issue}
                        </h2>
                        <p className={`text-[10px] font-black uppercase tracking-widest mt-0.5 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                            {formData.items.length} {t.products.toLowerCase()}
                        </p>
                    </div>
                    <button onClick={onClose} className={`p-2.5 rounded-2xl transition-all active:scale-95 ${darkMode ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
                        <X size={22} strokeWidth={3} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-hide">
                    {/* Customer Selection - Premium Toggle */}
                    <div className="space-y-4">
                        <div className={`flex p-1 rounded-2xl shadow-inner ${darkMode ? 'bg-slate-900 border border-slate-800' : 'bg-slate-100'}`}>
                            <button
                                type="button"
                                onClick={() => setOrderType('existing')}
                                className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${orderType === 'existing' ? (darkMode ? 'bg-slate-700 text-blue-400 shadow-lg border border-slate-600' : 'bg-white text-blue-600 shadow-md') : 'text-slate-500 hover:text-slate-400'}`}
                            > {t.regularCustomer} </button>
                            <button
                                type="button"
                                onClick={() => setOrderType('new')}
                                className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${orderType === 'new' ? (darkMode ? 'bg-slate-700 text-blue-400 shadow-lg border border-slate-600' : 'bg-white text-blue-600 shadow-md') : 'text-slate-500 hover:text-slate-400'}`}
                            > {t.newCustomer} </button>
                        </div>

                        {orderType === 'existing' ? (
                            <div className="animate-in fade-in slide-in-from-top-1 duration-300">
                                <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ml-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>{t.selectCustomer}</label>
                                <select
                                    required
                                    className={`w-full px-4 py-3 rounded-2xl border-2 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-100 text-slate-800'}`}
                                    value={formData.customerId}
                                    onChange={e => setFormData({ ...formData, customerId: e.target.value })}
                                >
                                    <option value="">{t.selectPlaceholder}</option>
                                    {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.phone || '-'})</option>)}
                                </select>
                            </div>
                        ) : (
                            <div className="space-y-3 animate-in fade-in slide-in-from-top-1 duration-300">
                                <div>
                                    <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ml-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>{t.name}</label>
                                    <input
                                        required
                                        placeholder={t.name}
                                        className={`w-full px-4 py-3 rounded-2xl border-2 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-100 text-slate-800'}`}
                                        value={formData.newCustomer.name}
                                        onChange={e => setFormData({ ...formData, newCustomer: { ...formData.newCustomer, name: e.target.value } })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ml-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>{t.phone}</label>
                                        <input
                                            placeholder={t.phone}
                                            className={`w-full px-4 py-3 rounded-2xl border-2 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-100 text-slate-800'}`}
                                            value={formData.newCustomer.phone}
                                            onChange={e => setFormData({ ...formData, newCustomer: { ...formData.newCustomer, phone: e.target.value } })}
                                        />
                                    </div>
                                    <div>
                                        <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ml-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>{t.address}</label>
                                        <input
                                            placeholder={t.address}
                                            className={`w-full px-4 py-3 rounded-2xl border-2 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-100 text-slate-800'}`}
                                            value={formData.newCustomer.address}
                                            onChange={e => setFormData({ ...formData, newCustomer: { ...formData.newCustomer, address: e.target.value } })}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Items List - High Density Redesign */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                            <label className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>{t.products}</label>
                            <div className="h-px flex-1 mx-4 bg-slate-200 dark:bg-slate-700 opacity-50" />
                        </div>
                        
                        <div className="space-y-4">
                            {formData.items.map((item, idx) => (
                                <div key={idx} className={`p-5 rounded-[2.5rem] border-2 relative group transition-all duration-300 ${darkMode ? 'bg-slate-800 border-slate-700/50 hover:bg-slate-800 hover:border-blue-500/30' : 'bg-white border-slate-100 hover:shadow-xl hover:border-blue-100'}`}>
                                    <button
                                        type="button"
                                        onClick={() => removeItem(idx)}
                                        className="absolute -top-1 -right-1 w-9 h-9 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/30 sm:scale-0 group-hover:scale-100 transition-all z-10 hover:bg-rose-600 active:scale-90"
                                        title={t.delete}
                                    >
                                        <X size={18} strokeWidth={3} />
                                    </button>

                                    <div className="flex justify-between items-start mb-5">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${darkMode ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-blue-50 text-blue-600 border border-blue-100 shadow-sm'}`}>
                                                    {item.category}
                                                </span>
                                            </div>
                                            <div className={`font-black text-xl leading-tight ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>{item.productName}</div>
                                            <div className="flex items-center gap-1.5 mt-2">
                                                <div className={`p-1 rounded-md ${darkMode ? 'bg-slate-700 text-slate-500' : 'bg-slate-100 text-slate-400'}`}>
                                                    <Package size={10} />
                                                </div>
                                                <div className="text-[10px] font-black uppercase text-slate-500 tracking-tighter">{t.inStockLabel}: <span className={darkMode ? 'text-slate-300' : 'text-slate-700'}>{item.maxQuantity} {t.unitPiece}</span></div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">{t.quantityLabel}</label>
                                            <input
                                                type="number"
                                                min="1"
                                                max={item.maxQuantity}
                                                className={`w-full px-4 py-2.5 rounded-2xl border-2 outline-none font-black text-center transition-all ${darkMode ? 'bg-slate-900 border-slate-700 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500 focus:bg-white'}`}
                                                value={item.quantity}
                                                onChange={e => handleItemChange(idx, 'quantity', e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">{t.price} ($)</label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    className={`w-full px-4 py-2.5 rounded-2xl border-2 outline-none font-black transition-all ${darkMode ? 'bg-slate-900 border-slate-700 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500 focus:bg-white'}`}
                                                    value={item.price}
                                                    onChange={e => handleItemChange(idx, 'price', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className={`mt-4 pt-4 border-t flex justify-between items-center ${darkMode ? 'border-slate-700/50' : 'border-slate-100'}`}>
                                        <span className={`text-[9px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>{t.total}</span>
                                        <span className={`text-lg font-black ${darkMode ? 'text-blue-500' : 'text-blue-600'}`}>${(item.quantity * item.price).toLocaleString()}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ml-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>{t.notesOptional}</label>
                        <textarea
                            className={`w-full px-4 py-3 rounded-2xl border-2 outline-none h-24 resize-none font-bold transition-all ${darkMode ? 'bg-slate-900 border-slate-700 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500 focus:bg-white'}`}
                            placeholder={t.notes}
                            value={formData.notes}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                        />
                    </div>
                </form>

                {/* Footer - High Impact Checkout Style */}
                <div className={`px-6 py-5 flex items-center justify-between border-t shadow-[0_-10px_20px_rgba(0,0,0,0.02)] ${darkMode ? 'border-slate-700 bg-slate-900' : 'border-slate-100 bg-white'}`}>
                    <div>
                        <div className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-0.5">{t.revenue}</div>
                        <div className={`text-2xl font-black font-mono ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>${totalAmount.toLocaleString()}</div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button type="button" onClick={onClose} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${darkMode ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}> {t.cancel} </button>
                        <button
                            type="submit"
                            onClick={handleSubmit}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-3.5 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl shadow-blue-500/40 flex items-center gap-3 transition-all active:scale-95 hover:-translate-y-0.5"
                        >
                            <CheckCircle size={20} strokeWidth={3} /> {t.issue}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default IssueModal;
