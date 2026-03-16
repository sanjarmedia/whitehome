import React, { useState, useEffect } from 'react';
import { X, Clock, FileText, CreditCard, ChevronDown, ChevronUp, Package, Building2 } from 'lucide-react';
import api from '../api/axios';

const CustomerHistoryModal = ({ isOpen, onClose, customerId, darkMode, t, lang }) => {
    const [customerInfo, setCustomerInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expandedOrders, setExpandedOrders] = useState({});

    useEffect(() => {
        if (isOpen && customerId) {
            fetchCustomerHistory();
        }
    }, [isOpen, customerId]);

    const fetchCustomerHistory = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/customers/${customerId}`);
            setCustomerInfo(res.data);
        } catch (error) {
            console.error(error);
            alert(lang === 'uz' ? "Ma'lumotlarni yuklashda xatolik yuz berdi" : "Ошибка при загрузке данных");
        } finally {
            setLoading(false);
        }
    };

    const toggleOrder = (id) => {
        setExpandedOrders(prev => ({ ...prev, [id]: !prev[id] }));
    };

    if (!isOpen) return null;

    const bg = darkMode ? 'bg-slate-800' : 'bg-white';
    const textMain = darkMode ? 'text-slate-100' : 'text-slate-800';
    const textMuted = darkMode ? 'text-slate-400' : 'text-slate-500';
    const border = darkMode ? 'border-slate-700' : 'border-slate-100';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
            <div className={`${bg} rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-slide-up relative`}>
                
                {/* Header */}
                <div className={`p-6 border-b ${border} flex justify-between items-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white shrink-0`}>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-bold">
                            {customerInfo?.name?.[0] || 'M'}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">{customerInfo?.name || t.history}</h2>
                            {customerInfo?.companyName && (
                                <p className="text-blue-100 text-sm flex items-center gap-1 mt-0.5">
                                    <Building2 size={14} /> {customerInfo.companyName}
                                </p>
                            )}
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/20 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {loading ? (
                    <div className="flex-1 flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
                    </div>
                ) : customerInfo ? (
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                        
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className={`p-4 rounded-2xl border ${border} ${darkMode ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
                                <div className="flex items-center gap-2 text-blue-500 mb-1">
                                    <FileText size={16} />
                                    <span className="text-sm font-medium">{t.totalPurchases}</span>
                                </div>
                                <div className={`text-2xl font-bold ${textMain}`}>
                                    ${(customerInfo.summary?.totalPurchases || 0).toFixed(2)}
                                </div>
                            </div>
                            <div className={`p-4 rounded-2xl border ${border} ${darkMode ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
                                <div className="flex items-center gap-2 text-emerald-500 mb-1">
                                    <CreditCard size={16} />
                                    <span className="text-sm font-medium">{t.totalPaid}</span>
                                </div>
                                <div className={`text-2xl font-bold ${textMain}`}>
                                    ${(customerInfo.summary?.totalPaid || 0).toFixed(2)}
                                </div>
                            </div>
                            <div className={`p-4 rounded-2xl border ${border} ${darkMode ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
                                <div className="flex items-center gap-2 text-rose-500 mb-1">
                                    <Clock size={16} />
                                    <span className="text-sm font-medium">{t.remainingDebt}</span>
                                </div>
                                <div className={`text-2xl font-bold ${textMain}`}>
                                    ${(customerInfo.summary?.debt || 0).toFixed(2)}
                                </div>
                            </div>
                        </div>

                        {/* Combined History Timeline */}
                        <div>
                            <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${textMain}`}>
                                <Clock size={20} className="text-indigo-500" /> {t.transactions}
                            </h3>

                            {/* Merge and sort Orders and Payments */}
                            {(() => {
                                const orders = (customerInfo.orders || []).map(o => ({ ...o, type: 'ORDER', date: new Date(o.createdAt).getTime() }));
                                // Collect all payments from all orders
                                const payments = (customerInfo.orders || []).flatMap(o => (o.payments || []).map(p => ({ ...p, type: 'PAYMENT', date: new Date(p.createdAt).getTime() })));
                                const history = [...orders, ...payments].sort((a, b) => b.date - a.date);

                                if (history.length === 0) {
                                    return <div className={`text-center py-8 ${textMuted}`}>{t.noData}</div>;
                                }

                                return (
                                    <div className="space-y-4">
                                        {history.map((item, idx) => {
                                            if (item.type === 'ORDER') {
                                                const order = item;
                                                const isExpanded = expandedOrders[order.id];
                                                return (
                                                    <div key={`order-${order.id}`} className={`border ${border} rounded-2xl overflow-hidden`}>
                                                        {/* Order Header */}
                                                        <div 
                                                            className={`p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3 cursor-pointer transition-colors ${darkMode ? 'bg-slate-700/30 hover:bg-slate-700/50' : 'bg-slate-50 hover:bg-blue-50/50'}`}
                                                            onClick={() => toggleOrder(order.id)}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                 <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                                                                    <Package size={20} />
                                                                </div>
                                                                <div>
                                                                    <div className={`font-bold ${textMain}`}>{t.order} #{order.id}</div>
                                                                    <div className={`text-xs ${textMuted}`}>
                                                                        {new Date(order.createdAt).toLocaleString(lang === 'uz' ? 'uz-UZ' : 'ru-RU')}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-auto w-full">
                                                                <div className="text-left sm:text-right">
                                                                    <div className={`font-bold ${textMain}`}>${(order.totalAmount || 0).toFixed(2)}</div>
                                                                    <div className={`text-xs font-semibold px-2 py-0.5 rounded-full inline-block mt-1 ${order.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                                                        {t[`status_${order.status}`] || order.status}
                                                                    </div>
                                                                </div>
                                                                <div className={textMuted}>
                                                                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Order Details (Items) */}
                                                        {isExpanded && (
                                                            <div className={`p-4 border-t ${border} ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>
                                                                <div className="space-y-3">
                                                                    {order.items && order.items.map((it, i) => (
                                                                        <div key={i} className="flex justify-between items-center text-sm">
                                                                            <div className="flex items-center gap-2">
                                                                                <div className={`w-1.5 h-1.5 rounded-full ${darkMode ? 'bg-slate-600' : 'bg-slate-300'}`} />
                                                                                <span className={textMain}>{it.product?.name || t.unknown}</span>
                                                                                <span className={textMuted}>x {it.quantity}</span>
                                                                            </div>
                                                                            <span className={`font-medium ${textMain}`}>${((it.price || 0) * (it.quantity || 0)).toFixed(2)}</span>
                                                                        </div>
                                                                    ))}
                                                                    
                                                                    {/* Order Payment Summary */}
                                                                    <div className={`mt-3 pt-3 border-t border-dashed ${border} flex justify-between items-center text-sm`}>
                                                                        <span className={textMuted}>{t.paidAmount}:</span>
                                                                        <span className="font-semibold text-emerald-500">${(order.paidAmount || 0).toFixed(2)}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            } else {
                                                const payment = item;
                                                return (
                                                    <div key={`payment-${payment.id}`} className={`p-4 border ${border} rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-3 ${darkMode ? 'bg-emerald-900/10' : 'bg-emerald-50/50'}`}>
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                                                                <CreditCard size={20} />
                                                            </div>
                                                            <div>
                                                                <div className={`font-bold ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>{t.payment}</div>
                                                                <div className={`text-xs ${textMuted}`}>
                                                                    {new Date(payment.createdAt).toLocaleString(lang === 'uz' ? 'uz-UZ' : 'ru-RU')}
                                                                    {payment.paymentMethod && ` • ${payment.paymentMethod}`}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="text-left sm:text-right ml-12 sm:ml-0">
                                                            <div className="font-bold text-emerald-500">+ ${(payment.amount || 0).toFixed(2)}</div>
                                                            {payment.notes && <div className={`text-xs mt-0.5 ${textMuted}`}>{payment.notes}</div>}
                                                        </div>
                                                    </div>
                                                );
                                            }
                                        })}
                                    </div>
                                );
                            })()}
                        </div>

                    </div>
                ) : null}

                {/* Footer */}
                <div className={`p-4 border-t ${border} bg-slate-50/50 dark:bg-slate-800/80 shrink-0 text-right`}>
                    <button onClick={onClose} className="px-6 py-2.5 rounded-xl font-medium border bg-white dark:bg-slate-700 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors">
                        {t.close}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CustomerHistoryModal;
