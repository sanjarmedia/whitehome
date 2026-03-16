import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { X, Save, User, Package, CheckCircle } from 'lucide-react';
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
                <div className={`px-6 py-4 flex items-center justify-between border-b ${darkMode ? 'border-slate-700' : 'border-slate-100'}`}>
                    <h2 className={`text-xl font-bold flex items-center gap-2 ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                        <Package className="text-blue-500" size={24} /> {t.issue} ({formData.items.length})
                    </h2>
                    <button onClick={onClose} className={`p-2 rounded-full transition-colors ${darkMode ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Customer Selection */}
                    <div className="space-y-4">
                        <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-700 rounded-xl">
                            <button
                                type="button"
                                onClick={() => setOrderType('existing')}
                                className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-all ${orderType === 'existing' ? 'bg-white dark:bg-slate-600 shadow-sm' : 'text-slate-500'}`}
                            > {t.regularCustomer} </button>
                            <button
                                type="button"
                                onClick={() => setOrderType('new')}
                                className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-all ${orderType === 'new' ? 'bg-white dark:bg-slate-600 shadow-sm' : 'text-slate-500'}`}
                            > {t.newCustomer} </button>
                        </div>

                        {orderType === 'existing' ? (
                            <div>
                                <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t.selectCustomer}</label>
                                <select
                                    required
                                    className={`w-full px-4 py-2.5 rounded-xl border outline-none focus:ring-2 focus:border-blue-500 transition-all ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                                    value={formData.customerId}
                                    onChange={e => setFormData({ ...formData, customerId: e.target.value })}
                                >
                                    <option value="">{t.selectPlaceholder}</option>
                                    {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.phone || '-'})</option>)}
                                </select>
                            </div>
                        ) : (
                            <div className="space-y-3 animate-fade-in">
                                <input
                                    required
                                    placeholder={t.name}
                                    className={`w-full px-4 py-2.5 rounded-xl border outline-none focus:ring-2 focus:border-blue-500 transition-all ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                                    value={formData.newCustomer.name}
                                    onChange={e => setFormData({ ...formData, newCustomer: { ...formData.newCustomer, name: e.target.value } })}
                                />
                                <div className="grid grid-cols-2 gap-3">
                                    <input
                                        placeholder={t.phone}
                                        className={`w-full px-4 py-2.5 rounded-xl border outline-none focus:ring-2 focus:border-blue-500 transition-all ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                                        value={formData.newCustomer.phone}
                                        onChange={e => setFormData({ ...formData, newCustomer: { ...formData.newCustomer, phone: e.target.value } })}
                                    />
                                    <input
                                        placeholder={t.address}
                                        className={`w-full px-4 py-2.5 rounded-xl border outline-none focus:ring-2 focus:border-blue-500 transition-all ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                                        value={formData.newCustomer.address}
                                        onChange={e => setFormData({ ...formData, newCustomer: { ...formData.newCustomer, address: e.target.value } })}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <hr className={darkMode ? 'border-slate-700' : 'border-slate-100'} />

                    {/* Items List */}
                    <div className="space-y-4">
                        <label className={`block text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t.products}</label>
                        <div className="space-y-4">
                            {formData.items.map((item, idx) => (
                                <div key={idx} className={`p-5 rounded-2xl border relative group transition-all duration-200 ${darkMode ? 'bg-slate-900/40 border-slate-700 hover:border-slate-500' : 'bg-slate-50 border-slate-100 hover:border-slate-300'}`}>
                                    <button
                                        type="button"
                                        onClick={() => removeItem(idx)}
                                        className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/30 scale-0 group-hover:scale-100 transition-transform z-10 hover:bg-rose-600"
                                        title={t.delete}
                                    >
                                        <X size={16} />
                                    </button>

                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex-1">
                                            <div className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-1">{item.category}</div>
                                            <div className={`font-bold text-lg leading-tight ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>{item.productName}</div>
                                            <div className="text-xs text-slate-500 mt-1">{t.inStockLabel} <span className="font-bold">{item.maxQuantity} {t.unitPiece}</span></div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-5">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">{t.quantity}</label>
                                            <input
                                                type="number"
                                                min="1"
                                                max={item.maxQuantity}
                                                className={`w-full px-4 py-2 rounded-xl border-2 outline-none font-bold transition-all ${darkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-blue-500/50' : 'bg-white border-slate-200 text-slate-800 focus:border-blue-500/50'}`}
                                                value={item.quantity}
                                                onChange={e => handleItemChange(idx, 'quantity', e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">{t.price} ($)</label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    className={`w-full px-4 py-2 rounded-xl border-2 outline-none font-bold transition-all ${darkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-blue-500/50' : 'bg-white border-slate-200 text-slate-800 focus:border-blue-500/50'}`}
                                                    value={item.price}
                                                    onChange={e => handleItemChange(idx, 'price', e.target.value)}
                                                />
                                                <div className={`absolute right-3 top-2.5 text-xs font-bold ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>{t.total.toUpperCase()}: ${(item.quantity * item.price).toFixed(2)}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t.notesOptional}</label>
                        <textarea
                            className={`w-full px-4 py-2 rounded-xl border outline-none h-20 resize-none ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                            value={formData.notes}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                        />
                    </div>
                </form>

                {/* Footer */}
                <div className={`px-6 py-4 flex items-center justify-between border-t ${darkMode ? 'border-slate-700' : 'border-slate-100'}`}>
                    <div>
                        <div className="text-[10px] font-bold uppercase text-slate-500">{t.revenue}</div>
                        <div className={`text-xl font-black ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>${totalAmount.toFixed(2)}</div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button type="button" onClick={onClose} className={`px-5 py-2 rounded-xl font-medium ${darkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}> {t.cancel} </button>
                        <button
                            type="submit"
                            onClick={handleSubmit}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-500/30 flex items-center gap-2 transition-all active:scale-95"
                        >
                            <CheckCircle size={20} /> {t.issue}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default IssueModal;
