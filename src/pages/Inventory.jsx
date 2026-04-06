import { useEffect, useState, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../api/axios';
import { Package, AlertCircle, ShoppingCart, ArrowUpRight, History, Search, ChevronDown, ChevronRight, Download, Upload, PlusSquare, ChevronLeft } from 'lucide-react';
import IssueModal from '../components/IssueModal';
import BulkProductModal from '../components/BulkProductModal';
import Pagination from '../components/ui/Pagination';

const Inventory = () => {
    const { darkMode, t } = useOutletContext();
    const [products, setProducts] = useState([]);
    const [issuedItems, setIssuedItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('stock'); // stock, issued
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [historyPage, setHistoryPage] = useState(1);
    const [pagination, setPagination] = useState({ total: 0, totalPages: 0, limit: 24 });
    const [historyPagination, setHistoryPagination] = useState({ total: 0, totalPages: 0, limit: 24 });
    const [limit, setLimit] = useState(24);
    const [historyLimit, setHistoryLimit] = useState(24);

    const [selectedIds, setSelectedIds] = useState([]);
    const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [updateExisting, setUpdateExisting] = useState(true);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [expandedOrderIds, setExpandedOrderIds] = useState([]);
    const fileInputRef = useRef(null);

    const fetchData = async (isInitial = false) => {
        if (isInitial) setLoading(true);
        try {
            const [productsRes, orderRes] = await Promise.all([
                api.get('/products', {
                    params: {
                        page: page,
                        limit: limit,
                        search: searchTerm
                    }
                }),
                api.get('/orders', {
                    params: {
                        status: 'COMPLETED',
                        page: historyPage,
                        limit: historyLimit,
                        orderSource: 'CUSTOMER_ISSUE'
                    }
                })
            ]);
            
            const pData = productsRes.data?.data || (Array.isArray(productsRes.data) ? productsRes.data : []);
            setProducts(pData);
            if (productsRes.data?.pagination) {
                setPagination(productsRes.data.pagination);
            } else if (pData.length > 0) {
                setPagination({ total: pData.length, totalPages: Math.ceil(pData.length / limit), limit: limit });
            }

            if (orderRes.data?.pagination) {
                setHistoryPagination(orderRes.data.pagination);
            } else if (Array.isArray(orderRes.data)) {
                setHistoryPagination({ total: orderRes.data.length, totalPages: Math.ceil(orderRes.data.length / historyLimit), limit: historyLimit });
            }

            // Group items from completed customer orders
            const rawOrders = orderRes.data?.data || (Array.isArray(orderRes.data) ? orderRes.data : []);
            const orders = rawOrders
                .map(order => ({
                    id: order.id,
                    customerName: order.customer?.name || t.unknown,
                    date: order.createdAt,
                    items: order.items || [],
                    totalQuantity: parseInt(order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0),
                    totalAmount: order.totalAmount || order.items?.reduce((sum, item) => sum + (item.quantity * item.price), 0) || 0
                }));
            setIssuedItems(orders);
        } catch (err) {
            console.error(err);
        } finally {
            if (isInitial) setLoading(false);
        }
    };

    useEffect(() => {
        fetchData(true);
    }, [page, historyPage, limit, historyLimit]);

    useEffect(() => {
        if (page !== 1) setPage(1);
        else fetchData();
    }, [searchTerm]);

    const handleIssueToggle = (productsToIssue) => {
        const array = Array.isArray(productsToIssue) ? productsToIssue : [productsToIssue];
        setSelectedProducts(array);
        setIsIssueModalOpen(true);
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === products.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(products.map(p => p.id));
        }
    };

    const toggleSelectProduct = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const toggleExpandOrder = (orderId) => {
        setExpandedOrderIds(prev => prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]);
    };

    const filteredIssued = issuedItems; // Handled by backend pagination now

    const handleExportCsv = () => {
        if (products.length === 0) return;
        
        const headers = ["ID", "Name", "SKU", "Category", "Brand", "Quantity", "Price", "Description"];
        const rows = products.map(p => [
            p.id,
            `"${p.name.replace(/"/g, '""')}"`,
            `"${(p.sku || '').replace(/"/g, '""')}"`,
            `"${(p.category || '').replace(/"/g, '""')}"`,
            `"${(p.brand || '').replace(/"/g, '""')}"`,
            p.quantity,
            p.price,
            `"${(p.description || '').replace(/"/g, '""')}"`
        ]);

        const csvContent = "data:text/csv;charset=utf-8," 
            + headers.join(",") + "\n" 
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `inventory_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDownloadTemplate = () => {
        const headers = ["Name", "SKU", "Category", "Brand", "Quantity", "Price", "Description"];
        const rows = [
            ["Mahsulot nomi", "ART-001", "Kategoriya", "Brend", "10", "150.50", "Tavsif uchun joy..."],
        ];

        const csvContent = "data:text/csv;charset=utf-8," 
            + headers.join(",") + "\n" 
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `inventory_template.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleImportCsv = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target.result;
            const lines = text.split('\n');
            const dataRows = lines.slice(1).filter(line => line.trim() !== '');
            
            if (dataRows.length === 0) return alert(t.invalidCsv);

            setLoading(true);
            
            const productsToImport = dataRows.map(line => {
                const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
                return {
                    name: parts[0]?.replace(/^"|"$/g, '').trim(),
                    sku: parts[1]?.replace(/^"|"$/g, '').trim(),
                    category: parts[2]?.replace(/^"|"$/g, '').trim(),
                    brand: parts[3]?.replace(/^"|"$/g, '').trim(),
                    quantity: parseInt(parts[4]) || 0,
                    price: parseFloat(parts[5]) || 0,
                    description: parts[6]?.replace(/^"|"$/g, '').trim(),
                };
            }).filter(p => p.name);

            try {
                const response = await api.post('/products/import', { 
                    products: productsToImport, 
                    updateExisting 
                });
                
                const { createdCount, updatedCount } = response.data;
                alert(t.importSummary(createdCount, updatedCount));
                fetchData();
            } catch (err) {
                console.error("Import error:", err);
                alert(t.importError + ": " + (err.response?.data?.error || err.message));
            } finally {
                setLoading(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };
        reader.readAsText(file);
    };

    if (loading) return <div className="p-8">{t.loading}</div>;

    const bulkSelectedProducts = products.filter(p => selectedIds.some(id => String(id) === String(p.id)));

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className={`text-3xl font-bold ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>{t.inventory}</h1>
                    <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        {t.inventoryDesc}
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-72 group">
                        <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${darkMode ? 'text-slate-500 group-focus-within:text-blue-400' : 'text-slate-400 group-focus-within:text-blue-500'}`} size={18} />
                        <input
                            type="search"
                            placeholder={t.search}
                            className={`w-full pl-11 pr-4 py-2.5 rounded-2xl border-2 outline-none transition-all shadow-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-100 focus:border-blue-500/50 focus:bg-slate-900' : 'bg-white border-slate-100 text-slate-800 focus:border-blue-500/50 focus:shadow-md'}`}
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {selectedIds.length > 0 && activeTab === 'stock' && (
                        <button
                            onClick={() => handleIssueToggle(bulkSelectedProducts)}
                            className="bg-blue-600 text-white px-5 py-2.5 rounded-2xl flex items-center justify-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-500/30 animate-scale-in font-bold transition-all active:scale-95"
                        >
                            <ShoppingCart size={18} /> {t.issue} ({selectedIds.length})
                        </button>
                    )}
                </div>
            </div>

            {/* High Density Stats for Mobile/Tablet */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className={`p-4 rounded-3xl border shadow-sm transition-all hover:shadow-md ${darkMode ? 'bg-slate-800/40 border-slate-700 hover:border-slate-600' : 'bg-white border-slate-100 hover:border-slate-200'}`}>
                    <div className="flex items-center gap-2.5 mb-2">
                        <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                            <Package size={18} />
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t.total.toUpperCase()}</span>
                    </div>
                    <div className={`text-2xl font-black ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>{pagination.total}</div>
                    <div className="text-[10px] font-bold text-slate-500 mt-1">{t.product.toLowerCase()}</div>
                </div>

                <div className={`p-4 rounded-3xl border shadow-sm transition-all hover:shadow-md ${darkMode ? 'bg-slate-800/40 border-slate-700 hover:border-slate-600' : 'bg-white border-slate-100 hover:border-slate-200'}`}>
                    <div className="flex items-center gap-2.5 mb-2">
                        <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
                            <AlertCircle size={18} />
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t.lowStock.toUpperCase()}</span>
                    </div>
                    <div className={`text-2xl font-black ${darkMode ? 'text-rose-500' : 'text-rose-600'}`}>
                        {products.filter(p => p.quantity < 10).length}
                    </div>
                    <div className="text-[10px] font-bold text-slate-500 mt-1">{t.itemsOrdered.split(' ')[1]}</div>
                </div>

                <div className={`col-span-2 hidden md:block p-4 rounded-3xl border shadow-sm ${darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-white border-slate-100'}`}>
                     <div className="flex items-center justify-between h-full">
                        <div className="space-y-1">
                            <span className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Inventory Value</span>
                            <div className={`text-2xl font-black ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                ${products.reduce((acc, p) => acc + (p.price * p.quantity), 0).toLocaleString()}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                             <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500">
                                <ArrowUpRight size={24} />
                             </div>
                        </div>
                     </div>
                </div>
            </div>

            {/* Actions Toolbar - Optimized for Mobile */}
            <div className={`p-3 rounded-[2rem] border flex flex-col lg:flex-row items-stretch lg:items-center gap-3 ${darkMode ? 'bg-slate-900 border-slate-800 shadow-xl shadow-black/20' : 'bg-white border-slate-100 shadow-lg shadow-slate-200/50'}`}>
                <div className="flex items-center gap-2 px-1 lg:border-r border-slate-200 dark:border-slate-800 lg:pr-4 shrink-0">
                    <label className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border-2 transition-all cursor-pointer ${updateExisting ? (darkMode ? 'border-blue-500/30 bg-blue-500/10 text-blue-400' : 'border-blue-100 bg-blue-50 text-blue-600') : (darkMode ? 'border-slate-800 text-slate-500' : 'border-slate-100 text-slate-400 focus-within:border-blue-200')}`}>
                        <input 
                            type="checkbox" 
                            className="accent-blue-600 w-4 h-4 rounded-md"
                            checked={updateExisting} 
                            onChange={(e) => setUpdateExisting(e.target.checked)} 
                        />
                        <span className="text-[10px] font-black uppercase tracking-widest">{t.updateDuplicates}</span>
                    </label>
                </div>

                <div className="grid grid-cols-2 lg:flex lg:items-center gap-2 flex-1">
                    <button onClick={handleDownloadTemplate} className={`px-4 py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all font-black text-[10px] uppercase tracking-widest border-2 ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:border-blue-500/30' : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50 hover:border-blue-100 shadow-sm'}`}>
                        <Download size={14} strokeWidth={3} className="text-blue-500" /> {t.reports.slice(0, -1)}
                    </button>
                    <button onClick={() => setIsBulkModalOpen(true)} className={`px-4 py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all font-black text-[10px] uppercase tracking-widest border-2 ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:border-blue-500/30' : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50 hover:border-blue-100 shadow-sm'}`}>
                        <PlusSquare size={14} strokeWidth={3} className="text-blue-500" /> {t.bulkAdd}
                    </button>
                    <button onClick={() => fileInputRef.current?.click()} className={`px-4 py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all font-black text-[10px] uppercase tracking-widest border-2 ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:border-blue-500/30' : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50 hover:border-blue-100 shadow-sm'}`}>
                        <Upload size={14} strokeWidth={3} className="text-emerald-500" /> {t.importCsv}
                    </button>
                    <button onClick={handleExportCsv} className={`px-4 py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all font-black text-[10px] uppercase tracking-widest border-2 ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:border-blue-500/30' : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50 hover:border-blue-100 shadow-sm'}`}>
                        <Download size={14} strokeWidth={3} className="text-amber-500" /> Export
                    </button>
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleImportCsv} />
            </div>

            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 py-2">
                <div className="grid grid-cols-2 lg:flex lg:flex-row gap-2">
                    <button
                        onClick={() => setActiveTab('stock')}
                        className={`flex flex-col lg:flex-row items-center justify-center lg:justify-start gap-1 lg:gap-3 px-4 py-4 rounded-2xl transition-all border-2 text-center lg:text-left ${
                            activeTab === 'stock'
                                ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/30 font-black'
                                : darkMode
                                    ? 'bg-slate-800/50 border-slate-700 hover:border-slate-600 text-slate-400 font-bold'
                                    : 'bg-white border-slate-200 hover:border-blue-300 text-slate-600 shadow-sm font-bold'
                        }`}
                    >
                        <Package size={20} className="shrink-0" /> 
                        <div className="flex flex-col">
                            <span className="text-[11px] lg:text-sm uppercase tracking-tight">{t.inventory}</span>
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('issued')}
                        className={`flex flex-col lg:flex-row items-center justify-center lg:justify-start gap-1 lg:gap-3 px-4 py-4 rounded-2xl transition-all border-2 text-center lg:text-left ${
                            activeTab === 'issued'
                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/30 font-black'
                                : darkMode
                                    ? 'bg-slate-800/50 border-slate-700 hover:border-slate-600 text-slate-400 font-bold'
                                    : 'bg-white border-slate-200 hover:border-indigo-300 text-slate-600 shadow-sm font-bold'
                        }`}
                    >
                        <History size={20} className="shrink-0" />
                        <div className="flex flex-col">
                            <span className="text-[11px] lg:text-sm uppercase tracking-tight">{t.orders}</span>
                        </div>
                    </button>
                </div>

                {/* Top Pagination controls - Compact mode placed inline with tabs */}
                <div className="flex-1 lg:max-w-md xl:max-w-xl">
                    {activeTab === 'stock' ? (
                        <Pagination 
                            currentPage={page}
                            totalPages={pagination.totalPages}
                            onPageChange={setPage}
                            onLimitChange={(l) => { setLimit(l); setPage(1); }}
                            darkMode={darkMode}
                            t={t}
                            totalItems={pagination.total}
                            itemsPerPage={limit}
                            compact={true}
                        />
                    ) : (
                        <Pagination 
                            currentPage={historyPage}
                            totalPages={historyPagination.totalPages}
                            onPageChange={setHistoryPage}
                            onLimitChange={(l) => { setHistoryLimit(l); setHistoryPage(1); }}
                            darkMode={darkMode}
                            t={t}
                            totalItems={historyPagination.total}
                            itemsPerPage={historyLimit}
                            compact={true}
                        />
                    )}
                </div>
            </div>

            <div className={`rounded-2xl shadow-sm border overflow-hidden ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
                {activeTab === 'stock' ? (
                    <>
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
                                                    checked={selectedIds.length > 0 && selectedIds.length === products.length}
                                                    onChange={toggleSelectAll}
                                                />
                                                <label
                                                    htmlFor="select-all"
                                                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center cursor-pointer transition-all ${selectedIds.length > 0 && selectedIds.length === products.length
                                                        ? 'bg-blue-600 border-blue-600'
                                                        : darkMode ? 'border-slate-600 hover:border-slate-500' : 'border-slate-300 hover:border-slate-400'}`}
                                                >
                                                    {(selectedIds.length > 0 && selectedIds.length === products.length) && (
                                                        <div className="w-2.5 h-2.5 bg-white rounded-sm"></div>
                                                    )}
                                                </label>
                                            </div>
                                        </th>
                                        <th className={`px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t.name}</th>
                                        <th className={`px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t.quantity}</th>
                                        <th className={`px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t.price}</th>
                                        <th className={`px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t.status}</th>
                                        <th className={`px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t.actions}</th>
                                    </tr>
                                </thead>
                                <tbody className={`divide-y ${darkMode ? 'divide-slate-700' : 'divide-slate-100'}`}>
                                    {products.slice(0, limit).map(product => (
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
                                                <div className="text-xs text-slate-500 font-mono uppercase truncate max-w-[150px]">{product.sku || `- ${t.sku} -`}</div>
                                            </td>
                                            <td className={`px-6 py-4 font-black ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>{product.quantity}</td>
                                            <td className={`px-6 py-4 font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>${product.price}</td>
                                            <td className="px-6 py-4">
                                                {product.quantity < 10 ? (
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border flex items-center w-fit gap-1 ${darkMode ? 'bg-rose-900/20 border-rose-900/50 text-rose-400' : 'bg-rose-50 border-rose-100 text-rose-600'}`}>
                                                        <AlertCircle size={12} /> {t.lowStock}
                                                    </span>
                                                ) : (
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border flex items-center w-fit gap-1 ${darkMode ? 'bg-emerald-900/20 border-emerald-900/50 text-emerald-400' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
                                                        {t.inStock}
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
                                                    <ShoppingCart size={14} /> {t.issue}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-700">
                            {products.slice(0, limit).map(product => (
                                <div key={product.id} className={`p-4 flex flex-col space-y-4 transition-all active:scale-[0.98] ${selectedIds.includes(product.id) ? (darkMode ? 'bg-blue-900/10' : 'bg-blue-50') : ''}`}>
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-start gap-3">
                                            <div className="flex items-center pt-1 shrink-0">
                                                <input
                                                    type="checkbox"
                                                    id={`m-select-${product.id}`}
                                                    className="hidden"
                                                    checked={selectedIds.includes(product.id)}
                                                    onChange={() => toggleSelectProduct(product.id)}
                                                />
                                                <label
                                                    htmlFor={`m-select-${product.id}`}
                                                    className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center cursor-pointer transition-all ${selectedIds.includes(product.id)
                                                        ? 'bg-blue-600 border-blue-600 shadow-md shadow-blue-500/20'
                                                        : darkMode ? 'border-slate-700' : 'border-slate-200 bg-white'}`}
                                                >
                                                    {selectedIds.includes(product.id) && (
                                                        <div className="w-2.5 h-2.5 bg-white rounded-sm transition-transform scale-110"></div>
                                                    )}
                                                </label>
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-0.5">{product.category}</div>
                                                <h3 className={`font-black tracking-tight leading-tight mb-1 text-base ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>{product.name}</h3>
                                                <p className="text-[10px] font-bold text-slate-500 font-mono tracking-tighter truncate">{product.sku || 'N/A'}</p>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <div className={`text-lg font-black ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>${product.price}</div>
                                            {product.quantity < 10 && (
                                                <span className="text-[9px] font-black uppercase text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded-md border border-rose-500/20">Kam qoldi</span>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className={`flex items-center justify-between p-3 rounded-2xl border ${darkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                                        <div className="flex gap-4">
                                            <div>
                                                <div className="text-[9px] font-black uppercase text-slate-500 tracking-tighter mb-0.5">{t.stock}</div>
                                                <div className={`text-lg font-black ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>{product.quantity}</div>
                                            </div>
                                            <div className="w-px h-8 bg-slate-200 dark:bg-slate-800 my-auto"></div>
                                            <div>
                                                <div className="text-[9px] font-black uppercase text-slate-500 tracking-tighter mb-0.5">{t.brand}</div>
                                                <div className={`text-[13px] font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{product.brand || '—'}</div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleIssueToggle(product)}
                                            disabled={product.quantity === 0}
                                            className={`px-5 py-2.5 rounded-2xl text-[11px] font-black uppercase flex items-center gap-2 shadow-lg transition-all active:scale-95 ${product.quantity === 0
                                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200 shadow-none'
                                                : 'bg-blue-600 text-white shadow-blue-500/30 hover:bg-blue-700'
                                                }`}
                                        >
                                            <ShoppingCart size={14} /> {t.issue}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <>
                        <div className="hidden md:block">
                            <table className="min-w-full">
                                <thead>
                                    <tr className={darkMode ? 'bg-slate-900/50' : 'bg-slate-50'}>
                                        <th className={`px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t.date}</th>
                                        <th className={`px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t.customers.slice(0, -1)}</th>
                                        <th className={`px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t.status}</th>
                                        <th className={`px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t.sum}</th>
                                    </tr>
                                </thead>
                                <tbody className={`divide-y ${darkMode ? 'divide-slate-700' : 'divide-slate-100'}`}>
                                    {filteredIssued.slice(0, historyLimit).map((order) => {
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
                                                                <div className={`text-xs font-black uppercase tracking-tighter ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{order.items.length} {t.products.toLowerCase()}</div>
                                                                <div className="text-[10px] font-bold opacity-60">${order.totalAmount.toFixed(2)}</div>
                                                            </div>
                                                            <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${darkMode ? 'bg-blue-900/30 text-blue-400 border border-blue-900/50' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                                                                {t.atCustomer}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {isExpanded && (
                                                        <div className={`px-16 pb-6 animate-fade-in`}>
                                                            <div className={`rounded-2xl border p-5 space-y-4 ${darkMode ? 'bg-slate-900/50 border-slate-700 shadow-inner' : 'bg-slate-50 border-slate-200'}`}>
                                                                <div className="grid grid-cols-12 text-[10px] font-black uppercase tracking-widest text-slate-500 pb-2 border-b border-slate-700/10">
                                                                    <div className="col-span-1 border-r text-center">#</div>
                                                                    <div className="col-span-6 px-3">{t.name}</div>
                                                                    <div className="col-span-2 text-center">{t.quantity}</div>
                                                                    <div className="col-span-3 text-right">{t.sum}</div>
                                                                </div>
                                                                {order.items.map((item, i) => (
                                                                    <div key={i} className="grid grid-cols-12 items-center">
                                                                        <div className="col-span-1 text-center text-xs opacity-40">{i+1}</div>
                                                                        <div className="col-span-6 px-3 flex flex-col">
                                                                            <span className={`font-bold text-sm ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>{item.productName}</span>
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

                        <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-700">
                             {filteredIssued.slice(0, historyLimit).map((order) => {
                                const isExpanded = expandedOrderIds.includes(order.id);
                                return (
                                    <div key={order.id} className={`flex flex-col transition-all ${isExpanded ? (darkMode ? 'bg-slate-900/40' : 'bg-slate-50/50') : ''}`}>
                                        <div 
                                            onClick={() => toggleExpandOrder(order.id)}
                                            className="p-5 flex flex-col space-y-3 active:bg-slate-50 dark:active:bg-slate-700/30 transition-colors"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${darkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-700'}`}>
                                                        #{order.id}
                                                    </span>
                                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{new Date(order.date).toLocaleDateString()}</span>
                                                </div>
                                                <div className={`text-sm font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>${order.totalAmount.toFixed(0)}</div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h3 className={`font-black text-lg tracking-tight leading-tight ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>{order.customerName}</h3>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <div className={`p-1 rounded-md ${darkMode ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-400'}`}>
                                                            <Package size={10} />
                                                        </div>
                                                        <span className="text-[11px] font-bold text-slate-500">{order.items.length} {t.products.toLowerCase()}</span>
                                                    </div>
                                                </div>
                                                <div className={`p-2 rounded-xl transition-all ${isExpanded ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : darkMode ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-400'}`}>
                                                    {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                                </div>
                                            </div>
                                        </div>

                                        {isExpanded && (
                                            <div className={`px-5 pb-5 animate-scale-in`}>
                                                <div className={`space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800`}>
                                                    {order.items.map((item, i) => (
                                                        <div key={i} className="flex justify-between items-center bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                                                            <div className="flex flex-col">
                                                                <span className={`font-black text-[13px] leading-tight ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>{item.productName}</span>
                                                                <span className="text-[10px] font-bold text-slate-500 mt-0.5">{item.quantity} ta • ${item.price}</span>
                                                            </div>
                                                            <div className={`font-black text-sm p-2 rounded-xl bg-blue-500/5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>${(item.quantity * item.price).toFixed(0)}</div>
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

            {activeTab === 'stock' ? (
                <Pagination 
                    currentPage={page}
                    totalPages={pagination.totalPages}
                    onPageChange={setPage}
                    onLimitChange={(l) => { setLimit(l); setPage(1); }}
                    darkMode={darkMode}
                    t={t}
                    totalItems={pagination.total}
                    itemsPerPage={limit}
                />
            ) : (
                <Pagination 
                    currentPage={historyPage}
                    totalPages={historyPagination.totalPages}
                    onPageChange={setHistoryPage}
                    onLimitChange={(l) => { setHistoryLimit(l); setHistoryPage(1); }}
                    darkMode={darkMode}
                    t={t}
                    totalItems={historyPagination.total}
                    itemsPerPage={historyLimit}
                />
            )}

            <IssueModal
                isOpen={isIssueModalOpen}
                onClose={() => setIsIssueModalOpen(false)}
                products={selectedProducts}
                darkMode={darkMode}
                onIssued={() => {
                    fetchData();
                    setSelectedIds([]);
                }}
                t={t}
            />

            <BulkProductModal
                isOpen={isBulkModalOpen}
                onClose={() => setIsBulkModalOpen(false)}
                onSaved={() => fetchData()}
                darkMode={darkMode}
                t={t}
            />
        </div>
    );
};

export default Inventory;
