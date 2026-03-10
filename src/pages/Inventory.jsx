import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../api/axios';
import { Package, AlertCircle, ShoppingCart, ArrowUpRight, History, Search, ChevronDown, ChevronRight } from 'lucide-react';
import IssueModal from '../components/IssueModal';

const Inventory = () => {
    const { darkMode } = useOutletContext();
    const [products, setProducts] = useState([]);
    const [issuedItems, setIssuedItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('stock'); // stock, issued
    const [searchTerm, setSearchTerm] = useState('');

    const [selectedIds, setSelectedIds] = useState([]);
    const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [expandedOrderIds, setExpandedOrderIds] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [prodRes, orderRes] = await Promise.all([
                api.get('/products'),
                api.get('/orders?status=COMPLETED')
            ]);
            setProducts(prodRes.data.filter(p => p.quantity > 0));

            // Group items from completed customer orders
            const orders = orderRes.data
                .filter(order => order.destinationType === 'CUSTOMER')
                .map(order => ({
                    id: order.id,
                    customerName: order.customer?.name || 'Noma\'lum',
                    date: order.createdAt,
                    items: order.items,
                    totalQuantity: order.items.reduce((sum, item) => sum + item.quantity, 0),
                    totalAmount: order.totalAmount || order.items.reduce((sum, item) => sum + (item.quantity * item.price), 0)
                }));
            setIssuedItems(orders);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleIssueToggle = (productsToIssue) => {
        const array = Array.isArray(productsToIssue) ? productsToIssue : [productsToIssue];
        setSelectedProducts(array);
        setIsIssueModalOpen(true);
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === filteredProducts.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredProducts.map(p => p.id));
        }
    };

    const toggleSelectProduct = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const toggleExpandOrder = (orderId) => {
        setExpandedOrderIds(prev => prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]);
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredIssued = issuedItems.filter(order =>
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.items.some(item => item.productName.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (loading) return <div className="p-8">Yuklanmoqda...</div>;

    const bulkSelectedProducts = products.filter(p => selectedIds.some(id => String(id) === String(p.id)));

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className={`text-3xl font-bold ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>Sklad va Inventar</h1>
                    <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Mahsulotlar harakati va zaxira boshqaruvi</p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    {selectedIds.length > 0 && activeTab === 'stock' && (
                        <button
                            onClick={() => handleIssueToggle(bulkSelectedProducts)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-500/30 animate-fade-in"
                        >
                            <ShoppingCart size={18} /> Tanlanganlarni berish ({selectedIds.length})
                        </button>
                    )}
                    <div className="relative w-full md:w-64">
                        <Search className={`absolute left-3 top-2.5 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`} size={18} />
                        <input
                            type="search"
                            placeholder="Qidirish..."
                            className={`w-full pl-10 pr-4 py-2 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-slate-200'}`}
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-700">
                <button
                    onClick={() => setActiveTab('stock')}
                    className={`px-6 py-3 font-medium transition-all flex items-center gap-2 border-b-2 ${activeTab === 'stock'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                >
                    <Package size={18} /> Skladda: {products.length} xil, jami {products.reduce((acc, curr) => acc + curr.quantity, 0)} ta
                </button>
                <button
                    onClick={() => setActiveTab('issued')}
                    className={`px-6 py-3 font-medium transition-all flex items-center gap-2 border-b-2 ${activeTab === 'issued'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                >
                    <History size={18} /> Mijozlarga Berilgan ({issuedItems.length})
                </button>
            </div>

            <div className={`rounded-2xl shadow-sm border overflow-hidden ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
                {activeTab === 'stock' ? (
                    <table className="min-w-full">
                        <thead>
                            <tr className={darkMode ? 'bg-slate-900/50' : 'bg-slate-50'}>
                                <th className="px-4 py-4 text-left w-12">
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="select-all"
                                            className="hidden"
                                            checked={selectedIds.length > 0 && selectedIds.length === filteredProducts.length}
                                            onChange={toggleSelectAll}
                                        />
                                        <label
                                            htmlFor="select-all"
                                            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center cursor-pointer transition-all ${selectedIds.length > 0 && selectedIds.length === filteredProducts.length
                                                ? 'bg-blue-600 border-blue-600'
                                                : darkMode ? 'border-slate-600 hover:border-slate-500' : 'border-slate-300 hover:border-slate-400'}`}
                                        >
                                            {(selectedIds.length > 0 && selectedIds.length === filteredProducts.length) && (
                                                <div className="w-2.5 h-2.5 bg-white rounded-sm shadow-sm"></div>
                                            )}
                                        </label>
                                    </div>
                                </th>
                                <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Mahsulot</th>
                                <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Soni</th>
                                <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Narxi</th>
                                <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Holat</th>
                                <th className={`px-6 py-4 text-right text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Harakat</th>
                            </tr>
                        </thead>
                        <tbody className={`divide-y ${darkMode ? 'divide-slate-700' : 'divide-slate-100'}`}>
                            {filteredProducts.map(product => (
                                <tr key={product.id} className={`transition-colors ${darkMode ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50/50'} ${selectedIds.includes(product.id) ? (darkMode ? 'bg-blue-900/10' : 'bg-blue-50') : ''}`}>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                id={`select-${product.id}`}
                                                className="hidden"
                                                checked={selectedIds.includes(product.id)}
                                                onChange={() => toggleSelectProduct(product.id)}
                                            />
                                            <label
                                                htmlFor={`select-${product.id}`}
                                                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center cursor-pointer transition-all ${selectedIds.includes(product.id)
                                                    ? 'bg-blue-600 border-blue-600 shadow-lg shadow-blue-500/20'
                                                    : darkMode ? 'border-slate-700 hover:border-slate-600' : 'border-slate-200 hover:border-slate-300'}`}
                                            >
                                                {selectedIds.includes(product.id) && (
                                                    <div className="w-2.5 h-2.5 bg-white rounded-sm shadow-sm transition-transform scale-110"></div>
                                                )}
                                            </label>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className={`font-bold ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>{product.name}</div>
                                        <div className="text-xs text-slate-500">{product.sku || "SKU yo'q"}</div>
                                    </td>
                                    <td className={`px-6 py-4 font-bold ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>{product.quantity}</td>
                                    <td className={`px-6 py-4 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>${product.price}</td>
                                    <td className="px-6 py-4">
                                        {product.quantity < 10 ? (
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center w-fit gap-1 ${darkMode ? 'bg-rose-900/20 border-rose-900/50 text-rose-400' : 'bg-rose-50 border-rose-100 text-rose-600'}`}>
                                                <AlertCircle size={14} /> Kam qolgan
                                            </span>
                                        ) : (
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center w-fit gap-1 ${darkMode ? 'bg-emerald-900/20 border-emerald-900/50 text-emerald-400' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
                                                Yetarli
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleIssueToggle(product)}
                                            disabled={product.quantity === 0}
                                            className={`px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1 ml-auto shadow-sm transition-all active:scale-95 ${product.quantity === 0
                                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border'
                                                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20'
                                                }`}
                                        >
                                            <ShoppingCart size={16} /> Berish
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <table className="min-w-full">
                        <thead>
                            <tr className={darkMode ? 'bg-slate-900/50' : 'bg-slate-50'}>
                                <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Sana</th>
                                <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Mijoz</th>
                                <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Mahsulot</th>
                                <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Soni</th>
                                <th className={`px-6 py-4 text-right text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Holat</th>
                            </tr>
                        </thead>
                        <tbody className={`divide-y ${darkMode ? 'divide-slate-700' : 'divide-slate-100'}`}>
                            {filteredIssued.map((order) => {
                                const isExpanded = expandedOrderIds.includes(order.id);
                                return (
                                    <tr key={order.id} className={`group transition-all ${darkMode ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50/50'}`}>
                                        <td colSpan="5" className="p-0">
                                            <div
                                                onClick={() => toggleExpandOrder(order.id)}
                                                className="px-6 py-4 flex items-center justify-between cursor-pointer"
                                            >
                                                <div className="flex items-center gap-4 flex-1">
                                                    <div className={`p-2 rounded-lg ${darkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
                                                        {isExpanded ? <ChevronDown size={18} className="text-blue-500" /> : <ChevronRight size={18} className="text-slate-400" />}
                                                    </div>
                                                    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-10">
                                                        <div className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>{new Date(order.date).toLocaleDateString()}</div>
                                                        <div className={`font-bold text-lg ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{order.customerName}</div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-8">
                                                    <div className="text-right hidden sm:block">
                                                        <div className={`text-sm font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{order.items.length} turdagi mahsulot</div>
                                                        <div className="text-xs opacity-60">${order.totalAmount.toFixed(2)}</div>
                                                    </div>
                                                    <span className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${darkMode ? 'bg-blue-900/30 text-blue-400 border border-blue-900/50' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                                                        Mijozda
                                                    </span>
                                                </div>
                                            </div>

                                            {isExpanded && (
                                                <div className={`px-16 pb-6 animate-fade-in`}>
                                                    <div className={`rounded-xl border p-4 space-y-3 ${darkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                                                        <div className="grid grid-cols-12 text-[10px] font-black uppercase tracking-widest text-slate-500 px-2 pb-2 border-b border-slate-700/20">
                                                            <div className="col-span-6">Mahsulot nomi</div>
                                                            <div className="col-span-3 text-center">Soni</div>
                                                            <div className="col-span-3 text-right">Summa</div>
                                                        </div>
                                                        {order.items.map((item, i) => (
                                                            <div key={i} className="grid grid-cols-12 items-center px-2 py-1">
                                                                <div className="col-span-6 flex flex-col">
                                                                    <span className={`font-bold text-sm ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>{item.productName}</span>
                                                                    <span className="text-[10px] text-slate-500 uppercase">{item.category}</span>
                                                                </div>
                                                                <div className={`col-span-3 text-center font-bold text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{item.quantity} ta</div>
                                                                <div className={`col-span-3 text-right font-bold text-sm ${darkMode ? 'text-blue-500' : 'text-blue-600'}`}>${(item.quantity * item.price).toFixed(2)}</div>
                                                            </div>
                                                        ))}
                                                        <div className="pt-2 border-t border-slate-700/20 flex justify-between items-center px-2">
                                                            <span className="text-[10px] font-black uppercase text-slate-500">Jami Soni: {order.totalQuantity} ta</span>
                                                            <span className="font-black text-blue-500">TOTAL: ${order.totalAmount.toFixed(2)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredIssued.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-10 text-center text-slate-500">
                                        Hozircha rasmiylashtirilgan tovarlar yo'q
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            <IssueModal
                isOpen={isIssueModalOpen}
                onClose={() => setIsIssueModalOpen(false)}
                products={selectedProducts}
                darkMode={darkMode}
                onIssued={() => {
                    fetchData();
                    setSelectedIds([]);
                }}
            />
        </div>
    );
};

export default Inventory;
