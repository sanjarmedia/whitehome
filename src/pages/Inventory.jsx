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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex border-b border-slate-200 dark:border-slate-700 gap-1.5">
                <button
                    onClick={() => setActiveTab('stock')}
                    className={`px-4 lg:px-6 py-3 font-bold transition-all flex items-center justify-center lg:justify-start gap-2 border-b-2 text-xs lg:text-sm ${activeTab === 'stock'
                        ? 'border-blue-500 text-blue-600 bg-blue-50/50 dark:bg-blue-900/10'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                >
                    <Package size={18} className="shrink-0" /> 
                    <span className="truncate">Skladda: {products.length} xil / {products.reduce((acc, curr) => acc + curr.quantity, 0)} dona</span>
                </button>
                <button
                    onClick={() => setActiveTab('issued')}
                    className={`px-4 lg:px-6 py-3 font-bold transition-all flex items-center justify-center lg:justify-start gap-2 border-b-2 text-xs lg:text-sm ${activeTab === 'issued'
                        ? 'border-blue-500 text-blue-600 bg-blue-50/50 dark:bg-blue-900/10'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                >
                    <History size={18} className="shrink-0" />
                    <span className="truncate">Mijozlarga Berilgan ({issuedItems.length})</span>
                </button>
            </div>

            <div className={`rounded-2xl shadow-sm border overflow-hidden ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
                {activeTab === 'stock' ? (
                    <>
                        {/* Desktop Table */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="min-w-full">
                                <thead>
                                    <tr className={darkMode ? 'bg-slate-900/50' : 'bg-slate-50'}>
                                        <th className="px-4 py-4 text-left w-12 text-center">
                                            <div className="flex justify-center">
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
                                                        <div className="w-2.5 h-2.5 bg-white rounded-sm"></div>
                                                    )}
                                                </label>
                                            </div>
                                        </th>
                                        <th className={`px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Mahsulot</th>
                                        <th className={`px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Soni</th>
                                        <th className={`px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Narxi</th>
                                        <th className={`px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Holat</th>
                                        <th className={`px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Harakat</th>
                                    </tr>
                                </thead>
                                <tbody className={`divide-y ${darkMode ? 'divide-slate-700' : 'divide-slate-100'}`}>
                                    {filteredProducts.map(product => (
                                        <tr key={product.id} className={`transition-colors ${darkMode ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50/50'} ${selectedIds.includes(product.id) ? (darkMode ? 'bg-blue-900/10' : 'bg-blue-50') : ''}`}>
                                            <td className="px-4 py-4 text-center">
                                                <div className="flex justify-center">
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
                                                            <div className="w-2.5 h-2.5 bg-white rounded-sm transition-transform scale-110"></div>
                                                        )}
                                                    </label>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className={`font-bold ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>{product.name}</div>
                                                <div className="text-xs text-slate-500 font-mono uppercase truncate max-w-[150px]">{product.sku || "SKU yo'q"}</div>
                                            </td>
                                            <td className={`px-6 py-4 font-black ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>{product.quantity}</td>
                                            <td className={`px-6 py-4 font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>${product.price}</td>
                                            <td className="px-6 py-4">
                                                {product.quantity < 10 ? (
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border flex items-center w-fit gap-1 ${darkMode ? 'bg-rose-900/20 border-rose-900/50 text-rose-400' : 'bg-rose-50 border-rose-100 text-rose-600'}`}>
                                                        <AlertCircle size={12} /> Kam qolgan
                                                    </span>
                                                ) : (
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border flex items-center w-fit gap-1 ${darkMode ? 'bg-emerald-900/20 border-emerald-900/50 text-emerald-400' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
                                                        Yetarli
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleIssueToggle(product)}
                                                    disabled={product.quantity === 0}
                                                    className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase flex items-center gap-1 ml-auto shadow-sm transition-all active:scale-95 ${product.quantity === 0
                                                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed border'
                                                        : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20'
                                                        }`}
                                                >
                                                    <ShoppingCart size={14} /> Berish
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile List View */}
                        <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-700">
                            {filteredProducts.map(product => (
                                <div key={product.id} className={`p-4 flex flex-col space-y-3 ${selectedIds.includes(product.id) ? (darkMode ? 'bg-blue-900/10' : 'bg-blue-50') : ''}`}>
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-3">
                                            <div className="flex items-center pt-1">
                                                <input
                                                    type="checkbox"
                                                    id={`m-select-${product.id}`}
                                                    className="hidden"
                                                    checked={selectedIds.includes(product.id)}
                                                    onChange={() => toggleSelectProduct(product.id)}
                                                />
                                                <label
                                                    htmlFor={`m-select-${product.id}`}
                                                    className={`w-6 h-6 rounded-md border-2 flex items-center justify-center cursor-pointer transition-all ${selectedIds.includes(product.id)
                                                        ? 'bg-blue-600 border-blue-600'
                                                        : darkMode ? 'border-slate-700' : 'border-slate-200'}`}
                                                >
                                                    {selectedIds.includes(product.id) && (
                                                        <div className="w-2.5 h-2.5 bg-white rounded-sm"></div>
                                                    )}
                                                </label>
                                            </div>
                                            <div>
                                                <h3 className={`font-bold leading-tight ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>{product.name}</h3>
                                                <p className="text-[10px] text-slate-500 font-mono mt-1">{product.sku || 'N/A'}</p>
                                            </div>
                                        </div>
                                        <div className={`text-lg font-black ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>${product.price}</div>
                                    </div>
                                    
                                    <div className="flex items-center justify-between pt-2">
                                        <div className="flex items-center gap-4">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black uppercase text-slate-500">Zaxirada</span>
                                                <span className={`text-xl font-black ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>{product.quantity} ta</span>
                                            </div>
                                            <div className="flex items-center">
                                                {product.quantity < 10 ? (
                                                    <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter border flex items-center gap-1 ${darkMode ? 'bg-rose-900/20 border-rose-900/50 text-rose-400' : 'bg-rose-50 border-rose-100 text-rose-600'}`}>
                                                        <AlertCircle size={10} /> Kam
                                                    </span>
                                                ) : (
                                                    <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter border flex items-center gap-1 ${darkMode ? 'bg-emerald-900/20 border-emerald-900/50 text-emerald-400' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
                                                        OK
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleIssueToggle(product)}
                                            disabled={product.quantity === 0}
                                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase flex items-center gap-2 shadow-sm transition-all active:scale-95 ${product.quantity === 0
                                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border'
                                                : 'bg-blue-600 text-white shadow-blue-500/20'
                                                }`}
                                        >
                                            <ShoppingCart size={14} /> Berish
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <>
                        {/* Desktop Table */}
                        <div className="hidden md:block">
                            <table className="min-w-full">
                                <thead>
                                    <tr className={darkMode ? 'bg-slate-900/50' : 'bg-slate-50'}>
                                        <th className={`px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Sana</th>
                                        <th className={`px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Mijoz</th>
                                        <th className={`px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Status</th>
                                        <th className={`px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Summa</th>
                                    </tr>
                                </thead>
                                <tbody className={`divide-y ${darkMode ? 'divide-slate-700' : 'divide-slate-100'}`}>
                                    {filteredIssued.map((order) => {
                                        const isExpanded = expandedOrderIds.includes(order.id);
                                        return (
                                            <tr key={order.id} className={`group transition-all ${darkMode ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50/50'}`}>
                                                <td colSpan="4" className="p-0">
                                                    <div
                                                        onClick={() => toggleExpandOrder(order.id)}
                                                        className="px-6 py-4 flex items-center justify-between cursor-pointer"
                                                    >
                                                        <div className="flex items-center gap-4 flex-1">
                                                            <div className={`p-2 rounded-lg ${darkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
                                                                {isExpanded ? <ChevronDown size={18} className="text-blue-500" /> : <ChevronRight size={18} className="text-slate-400" />}
                                                            </div>
                                                            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-10">
                                                                <div className={`text-[10px] font-bold ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>{new Date(order.date).toLocaleDateString()}</div>
                                                                <div className={`font-black tracking-tight text-lg ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{order.customerName}</div>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-8">
                                                            <div className="text-right hidden sm:block">
                                                                <div className={`text-xs font-black uppercase tracking-tighter ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{order.items.length} turdagi mahsulot</div>
                                                                <div className="text-[10px] font-bold opacity-60">${order.totalAmount.toFixed(2)}</div>
                                                            </div>
                                                            <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${darkMode ? 'bg-blue-900/30 text-blue-400 border border-blue-900/50' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                                                                Mijozda
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {isExpanded && (
                                                        <div className={`px-16 pb-6 animate-fade-in`}>
                                                            <div className={`rounded-2xl border p-5 space-y-4 ${darkMode ? 'bg-slate-900/50 border-slate-700 shadow-inner' : 'bg-slate-50 border-slate-200'}`}>
                                                                <div className="grid grid-cols-12 text-[10px] font-black uppercase tracking-widest text-slate-500 pb-2 border-b border-slate-700/10">
                                                                    <div className="col-span-1 border-r text-center">#</div>
                                                                    <div className="col-span-6 px-3">Mahsulot nomi</div>
                                                                    <div className="col-span-2 text-center">Soni</div>
                                                                    <div className="col-span-3 text-right">Summa</div>
                                                                </div>
                                                                {order.items.map((item, i) => (
                                                                    <div key={i} className="grid grid-cols-12 items-center">
                                                                        <div className="col-span-1 text-center text-xs opacity-40">{i+1}</div>
                                                                        <div className="col-span-6 px-3 flex flex-col">
                                                                            <span className={`font-bold text-sm ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>{item.productName}</span>
                                                                            <span className="text-[10px] text-slate-500 font-black uppercase tracking-tighter">{item.category}</span>
                                                                        </div>
                                                                        <div className={`col-span-2 text-center font-black text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{item.quantity}</div>
                                                                        <div className={`col-span-3 text-right font-black text-sm ${darkMode ? 'text-blue-500' : 'text-blue-600'}`}>${(item.quantity * item.price).toFixed(2)}</div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile List View (Issued) */}
                        <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-700">
                             {filteredIssued.map((order) => {
                                const isExpanded = expandedOrderIds.includes(order.id);
                                return (
                                    <div key={order.id} className="flex flex-col">
                                        <div 
                                            onClick={() => toggleExpandOrder(order.id)}
                                            className="p-4 flex flex-col space-y-2 active:bg-slate-50 dark:active:bg-slate-700/30 transition-colors"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{new Date(order.date).toLocaleDateString()}</span>
                                                <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${darkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                                                    Mijozda
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <h3 className={`font-black text-lg tracking-tight ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>{order.customerName}</h3>
                                                <div className={isExpanded ? 'text-blue-500' : 'text-slate-400'}>
                                                    {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-end">
                                                <div className="text-xs font-bold opacity-60">{order.items.length} turdagi tovar</div>
                                                <div className={`text-lg font-black ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>${order.totalAmount.toFixed(2)}</div>
                                            </div>
                                        </div>

                                        {isExpanded && (
                                            <div className={`px-4 pb-4 animate-fade-in ${darkMode ? 'bg-slate-900/20' : 'bg-slate-50/50'}`}>
                                                <div className="space-y-3 pt-3 border-t border-slate-700/10">
                                                    {order.items.map((item, i) => (
                                                        <div key={i} className="flex justify-between items-center">
                                                            <div className="flex flex-col">
                                                                <span className={`font-bold text-sm ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>{item.productName}</span>
                                                                <span className="text-[10px] text-slate-500 font-bold uppercase">{item.quantity} ta × ${item.price}</span>
                                                            </div>
                                                            <div className={`font-black text-sm ${darkMode ? 'text-blue-500' : 'text-blue-600'}`}>${(item.quantity * item.price).toFixed(2)}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                             })}
                        </div>
                    </>
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
