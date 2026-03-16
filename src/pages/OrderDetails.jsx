import { useState, useEffect } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import api from '../api/axios';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import {
    ArrowLeft, Calendar, User, Phone, FileText, CheckCircle,
    Truck, Package, AlertCircle, Upload, CheckSquare, Square, MapPin
} from 'lucide-react';

const OrderDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { darkMode, t } = useOutletContext();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [verifying, setVerifying] = useState(false);

    const [confirmationModal, setConfirmationModal] = useState({ isOpen: false, status: null });

    useEffect(() => {
        fetchOrder();
    }, [id]);

    const fetchOrder = async () => {
        try {
            const res = await api.get(`/orders/${id}`);
            setOrder(res.data);
            setLoading(false);
        } catch (err) {
            setError(t.noData);
            setLoading(false);
        }
    };

    // 1. Trigger Modal
    const handleStatusUpdate = (newStatus) => {
        setConfirmationModal({ isOpen: true, status: newStatus });
    };

    // 2. Execute Action on Confirm
    const proceedWithStatusUpdate = async () => {
        const newStatus = confirmationModal.status;
        try {
            await api.put(`/orders/${id}/status`, { status: newStatus });
            setOrder(prev => ({ ...prev, status: newStatus })); // Optimistic UI update
            setConfirmationModal({ isOpen: false, status: null }); // Close modal
            fetchOrder(); // Refresh full data
        } catch (err) {
            console.error(t.errorOccurred + ": " + err.message);
            alert(t.errorOccurred + ": " + err.message);
        }
    };

    const toggleItemCheck = async (itemId, currentStatus) => {
        try {
            // Optimistic update
            setOrder(prev => ({
                ...prev,
                items: prev.items.map(item =>
                    item.id === itemId ? { ...item, checked: !currentStatus } : item
                )
            }));

            await api.put(`/orders/items/${itemId}/verify`, { checked: !currentStatus });
        } catch (err) {
            console.error(err);
            fetchOrder(); // Revert on error
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'NEW': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'EXPECTED': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'CHECKED': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
            case 'DISTRIBUTION': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'COMPLETED': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'CANCELLED': return 'bg-red-100 text-red-700 border-red-200';
            case 'PENDING_APPROVAL': return 'bg-rose-100 text-rose-700 border-rose-200';
            case 'REJECTED': return 'bg-slate-100 text-slate-700 border-slate-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const getStatusLabel = (status) => {
        const labels = {
            'NEW': t.status_NEW,
            'EXPECTED': t.status_EXPECTED,
            'CHECKED': t.status_CHECKED,
            'DISTRIBUTION': t.status_DISTRIBUTION,
            'COMPLETED': t.status_COMPLETED,
            'CANCELLED': t.status_CANCELLED,
            'PENDING_APPROVAL': t.status_PENDING_APPROVAL,
            'REJECTED': t.status_REJECTED
        };
        return labels[status] || status;
    };

    if (loading) return <div className="p-10 text-center">{t.loading}</div>;
    if (error) return <div className="p-10 text-center text-red-500">{error}</div>;

    const allChecked = order.items.every(i => i.checked);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className={`p-2 rounded-xl border transition-colors ${darkMode ? 'border-slate-700 hover:bg-slate-700 text-slate-300' : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                        }`}
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className={`text-2xl font-bold flex items-center gap-3 ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                        {order.orderSource === 'COMPANY' ? t.companyOrder : t.issueOrder} #{order.id}
                        <span className={`text-xs px-3 py-1 rounded-full border ${getStatusColor(order.status)}`}>
                            {getStatusLabel(order.status)}
                        </span>
                    </h1>
                    <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        {t.createdTime}: {new Date(order.createdAt).toLocaleString()}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content - Items */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Items List */}
                    <div className={`p-6 rounded-3xl border shadow-sm ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
                        <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                            <Package className="text-blue-500" size={20} />
                            {t.orderComposition}
                        </h2>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className={`text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-slate-400 border-slate-700' : 'text-slate-50 border-slate-100'} border-b`}>
                                    <tr>
                                        <th className="px-4 py-3">{t.product}</th>
                                        <th className="px-4 py-3">{t.type}</th>
                                        <th className="px-4 py-3 text-center">{t.quantityShort}</th>
                                        <th className="px-4 py-3 text-right">{t.price}</th>
                                        <th className="px-4 py-3 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className={`divide-y ${darkMode ? 'divide-slate-700' : 'divide-slate-50'}`}>
                                    {order.items.map((item) => (
                                        <tr key={item.id} className={`group ${darkMode ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50'} transition-colors`}>
                                            <td className={`px-4 py-4 font-medium ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                                                {item.productName}
                                            </td>
                                            <td className={`px-4 py-4 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                                {item.category || '-'}
                                            </td>
                                            <td className={`px-4 py-4 text-center font-bold ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                                                {item.quantity}
                                            </td>
                                            <td className={`px-4 py-4 text-right ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                                                ${item.price.toLocaleString()}
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <button
                                                    onClick={() => toggleItemCheck(item.id, item.checked)}
                                                    disabled={order.status !== 'CHECKED'}
                                                    className={`p-1 rounded transition-colors ${item.checked
                                                        ? 'text-green-500 hover:bg-green-50'
                                                        : (darkMode ? 'text-slate-600 hover:text-slate-400' : 'text-slate-300 hover:text-slate-500')
                                                        } ${order.status !== 'CHECKED' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    title={order.status === 'CHECKED' ? (item.checked ? t.verified : t.verify) : t.onlyInCheckMode}
                                                >
                                                    {item.checked ? <CheckSquare size={20} /> : <Square size={20} />}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className={`border-t ${darkMode ? 'border-slate-700' : 'border-slate-100'}`}>
                                    <tr>
                                        <td colSpan="3" className={`px-4 py-4 text-right font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t.total}:</td>
                                        <td className={`px-4 py-4 text-right font-bold text-lg ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                                            ${order.totalAmount.toLocaleString()}
                                        </td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Sidebar - Workflow Actions */}
                <div className="space-y-6">
                    {/* Customer / Destination Info */}
                    <div className={`p-6 rounded-3xl border shadow-sm ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
                        <h3 className={`text-sm font-semibold uppercase tracking-wider mb-4 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            {order.destinationType === 'WAREHOUSE' ? t.destinationInfo : t.customerInfo}
                        </h3>

                        {order.destinationType === 'WAREHOUSE' ? (
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <div className={`p-2 rounded-lg ${darkMode ? 'bg-slate-700 text-amber-400' : 'bg-amber-50 text-amber-600'}`}>
                                        <Package size={24} />
                                    </div>
                                    <div>
                                        <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t.addressLabel}</p>
                                        <p className={`font-medium ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>{t.mainWarehouse}</p>
                                        <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                            {t.itemsAddedToStock}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <div className={`p-2 rounded-lg ${darkMode ? 'bg-slate-700 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                                        <User size={18} />
                                    </div>
                                    <div>
                                        <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>F.I.O</p>
                                        <p className={`font-medium ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                                            {order.customer?.name}
                                            {order.customer?.type === 'vip' && <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">VIP</span>}
                                        </p>
                                        <p className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                            ({order.customer?.type === 'vip' ? t.vipLabel : t.ordinaryLabel})
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className={`p-2 rounded-lg ${darkMode ? 'bg-slate-700 text-purple-400' : 'bg-purple-50 text-purple-600'}`}>
                                        <Phone size={18} />
                                    </div>
                                    <div>
                                        <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t.phone}</p>
                                        <p className={`font-medium ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>{order.customer?.phone || '-'}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Workflow Actions */}
                    <div className={`p-6 rounded-3xl border shadow-sm ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
                        <h3 className={`text-sm font-semibold uppercase tracking-wider mb-4 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            {t.actions}
                        </h3>

                        <div className="space-y-3">
                            {/* ALL ORDERS: Start Picking/Finance Step */}
                            {order.status === 'NEW' && (
                                <>
                                    <button
                                        onClick={() => handleStatusUpdate('EXPECTED')}
                                        className="w-full py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-200/50"
                                    >
                                        <Upload size={18} />
                                        {order.orderSource === 'COMPANY' ? t.confirmPayment : t.confirmAction}
                                    </button>
                                    <p className="text-xs text-center text-slate-400">{t.uploadReceiptLaterHint}</p>
                                </>
                            )}

                            {/* ALL ORDERS: Start Check Step */}
                            {order.status === 'EXPECTED' && (
                                <button
                                    onClick={() => handleStatusUpdate('CHECKED')}
                                    className="w-full py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-200/50"
                                >
                                    <CheckCircle size={18} />
                                    {t.startCheck}
                                </button>
                            )}

                            {/* ALL ORDERS: Checking Items */}
                            {order.status === 'CHECKED' && (
                                <div className="space-y-3">
                                    <div className={`p-3 rounded-xl border ${allChecked ? 'bg-green-50 border-green-100 text-green-700' : 'bg-amber-50 border-amber-100 text-amber-700'}`}>
                                        <div className="flex items-center gap-2 text-sm font-medium">
                                            <AlertCircle size={16} />
                                            {allChecked ? t.allCheckedMsg : t.someNotCheckedMsg}
                                        </div>
                                    </div>
                                    
                                    {/* For Company orders: Go to Distribution or Complete */}
                                    {order.orderSource === 'COMPANY' ? (
                                        <button
                                            onClick={() => handleStatusUpdate('DISTRIBUTION')}
                                            disabled={!allChecked}
                                            className={`w-full py-3 rounded-xl text-white font-medium transition-colors flex items-center justify-center gap-2 shadow-lg ${allChecked
                                                ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-200/50'
                                                : 'bg-slate-300 cursor-not-allowed'
                                                }`}
                                        >
                                            <Package size={18} />
                                            {t.goToDistribution}
                                        </button>
                                    ) : (
                                        /* For Customer orders: Complete directly */
                                        <button
                                            onClick={() => handleStatusUpdate('COMPLETED')}
                                            disabled={!allChecked}
                                            className={`w-full py-3 rounded-xl text-white font-medium transition-colors flex items-center justify-center gap-2 shadow-lg ${allChecked
                                                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200/50'
                                                : 'bg-slate-300 cursor-not-allowed'
                                                }`}
                                        >
                                            <CheckCircle size={18} />
                                            {t.issue}
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* COMPANY ORDER: Distribution Mode */}
                            {order.status === 'DISTRIBUTION' && (
                                <div className="space-y-4">
                                    <button
                                        onClick={() => navigate('/customer-order', { state: { items: order.items } })}
                                        className="w-full py-3 rounded-xl bg-orange-500 text-white font-medium hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-orange-200/50"
                                    >
                                        <User size={18} />
                                        {t.issueOrder} (Direct)
                                    </button>
                                    
                                    <button
                                        onClick={() => handleStatusUpdate('COMPLETED')}
                                        className="w-full py-3 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-200/50"
                                    >
                                        <Package size={18} />
                                        {t.receiveToWarehouseSubmit}
                                    </button>
                                </div>
                            )}

                            {/* COMPLETED STATUS */}
                            {order.status === 'COMPLETED' && (
                                <div className="text-center py-4">
                                    <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <CheckCircle size={24} />
                                    </div>
                                    <h4 className="font-semibold text-green-700">{t.orderCompleted}</h4>
                                    <p className="text-sm text-green-600 mt-1">
                                        {order.orderSource === 'COMPANY' ? t.itemsAddedToStock : t.issuedSuccessfully}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Reusable Confirmation Modal */}
            <ConfirmationModal
                isOpen={confirmationModal.isOpen}
                onClose={() => setConfirmationModal({ isOpen: false, status: null })}
                onConfirm={proceedWithStatusUpdate}
                title={t.confirmAction}
                message={
                    <span>
                        {t.statusUpdateWarning(getStatusLabel(confirmationModal.status))}
                    </span>
                }
                status={confirmationModal.status}
                darkMode={darkMode}
            />
        </div>
    );
};

export default OrderDetails;
