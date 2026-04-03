import { useEffect, useState, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../api/axios';
import { Package, AlertCircle, ShoppingCart, ArrowUpRight, History, Search, ChevronDown, ChevronRight, Download, Upload, PlusSquare, ChevronLeft } from 'lucide-react';
import IssueModal from '../components/IssueModal';
import BulkProductModal from '../components/BulkProductModal';

const Inventory = () => {
    const { darkMode, t } = useOutletContext();
    const [products, setProducts] = useState([]);
    const [issuedItems, setIssuedItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('stock'); // stock, issued
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ totalItems: 0, totalPages: 1 });
    const limit = 24;

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
                api.get('/orders?status=COMPLETED')
            ]);
            
            setProducts(productsRes.data.data || productsRes.data);
            if (productsRes.data.pagination) {
                setPagination(productsRes.data.pagination);
            }

            // Group items from completed customer orders
            const orders = orderRes.data
                .filter(order => order.destinationType === 'CUSTOMER')
                .map(order => ({
                    id: order.id,
                    customerName: order.customer?.name || t.unknown,
                    date: order.createdAt,
                    items: order.items,
                    totalQuantity: order.items.reduce((sum, item) => sum + item.quantity, 0),
                    totalAmount: order.totalAmount || order.items.reduce((sum, item) => sum + (item.quantity * item.price), 0)
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
    }, [page]);

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

    const filteredIssued = issuedItems.filter(order =>
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.items.some(item => item.productName.toLowerCase().includes(searchTerm.toLowerCase()))
    );

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
                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                    {activeTab === 'stock' && (
                        <div className="flex flex-wrap items-center gap-2 animate-fade-in">
                            <label className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all cursor-pointer mr-2 ${updateExisting ? 'border-blue-600 bg-blue-600/5' : darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                                <input 
                                    type="checkbox" 
                                    className="accent-blue-600"
                                    checked={updateExisting} 
                                    onChange={(e) => setUpdateExisting(e.target.checked)} 
                                />
                                <span className={`text-[10px] font-bold uppercase tracking-tight ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{t.updateDuplicates}</span>
                            </label>

                            <button
                                onClick={handleDownloadTemplate}
                                className={`p-2 rounded-xl border flex items-center gap-2 transition-all font-bold text-xs uppercase tracking-tight ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm'}`}
                                title={t.downloadTemplate}
                            >
                                <Download size={18} className="text-blue-500" />
                                <span className="hidden lg:inline">{t.downloadTemplate.split(' ')[0]} (Namuna)</span>
                            </button>

                            <button
                                onClick={() => setIsBulkModalOpen(true)}
                                className={`p-2 rounded-xl border flex items-center gap-2 transition-all font-bold text-xs uppercase tracking-tight ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm'}`}
                            >
                                <PlusSquare size={18} className="text-blue-500" />
                                <span className="hidden sm:inline">{t.bulkAdd}</span>
                            </button>

                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className={`p-2 rounded-xl border flex items-center gap-2 transition-all font-bold text-xs uppercase tracking-tight ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm'}`}
                            >
                                <Upload size={18} className="text-emerald-500" />
                                <span className="hidden sm:inline">{t.importCsv}</span>
                            </button>

                            <button
                                onClick={handleExportCsv}
                                className={`p-2 rounded-xl border flex items-center gap-2 transition-all font-bold text-xs uppercase tracking-tight ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm'}`}
                            >
                                <Download size={18} className="text-amber-500" />
                                <span className="hidden sm:inline">{t.exportCsv}</span>
                            </button>

                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept=".csv"
                                onChange={handleImportCsv}
                            />
                        </div>
                    )}

                    {selectedIds.length > 0 && activeTab === 'stock' && (
                        <button
                            onClick={() => handleIssueToggle(bulkSelectedProducts)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-500/30 animate-fade-in"
                        >
                            <ShoppingCart size={18} /> {t.issue} ({selectedIds.length})
                        </button>
                    )}
                    <div className="relative flex-1 md:w-64">
                        <Search className={`absolute left-3 top-2.5 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`} size={18} />
                        <input
                            type="search"
                            placeholder={t.search}
                            className={`w-full pl-10 pr-4 py-2 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-slate-200'}`}
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="pb-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-row gap-2">
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
                                    {products.map(product => (
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
                            {products.map(product => (
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
                                                <p className="text-[10px] text-slate-500 font-mono mt-1">{product.sku || t.unknown}</p>
                                            </div>
                                        </div>
                                        <div className={`text-lg font-black ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>${product.price}</div>
                                    </div>
                                    
                                    <div className="flex items-center justify-between pt-2">
                                        <div className="flex items-center gap-4">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black uppercase text-slate-500">{t.stock}</span>
                                                <span className={`text-xl font-black ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>{product.quantity} {t.quantity.toLowerCase()}</span>
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
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <h3 className={`font-black text-lg tracking-tight ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>{order.customerName}</h3>
                                                <div className={isExpanded ? 'text-blue-500' : 'text-slate-400'}>
                                                    {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                                </div>
                                            </div>
                                        </div>

                                        {isExpanded && (
                                            <div className={`px-4 pb-4 animate-fade-in ${darkMode ? 'bg-slate-900/20' : 'bg-slate-50/50'}`}>
                                                <div className="space-y-3 pt-3 border-t border-slate-700/10">
                                                    {order.items.map((item, i) => (
                                                        <div key={i} className="flex justify-between items-center">
                                                            <div className="flex flex-col">
                                                                <span className={`font-bold text-sm ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>{item.productName}</span>
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

            {activeTab === 'stock' && pagination.totalPages > 1 && (
                <div className={`mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 px-2 animate-fade-in`}>
                    <p className={`text-xs font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                        {t.page} {page} {t.of} {pagination.totalPages}
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className={`p-2 rounded-xl border transition-all ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-300 disabled:opacity-20' : 'bg-white border-slate-200 text-slate-600 disabled:opacity-30'} active:scale-95`}
                        >
                            <ChevronLeft size={20} />
                        </button>
                        {[...Array(pagination.totalPages)].map((_, i) => {
                            const p = i + 1;
                            if (p === 1 || p === pagination.totalPages || (p >= page - 1 && p <= page + 1)) {
                                return (
                                    <button
                                        key={p}
                                        onClick={() => setPage(p)}
                                        className={`w-10 h-10 rounded-xl font-black text-xs transition-all active:scale-90 ${page === p
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                            : (darkMode ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-100')
                                        }`}
                                    >
                                        {p}
                                    </button>
                                );
                            }
                            if (p === 2 || p === pagination.totalPages - 1) return <span key={p} className="mx-1 text-slate-400">...</span>;
                            return null;
                        })}
                        <button
                            onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                            disabled={page === pagination.totalPages}
                            className={`p-2 rounded-xl border transition-all ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-300 disabled:opacity-20' : 'bg-white border-slate-200 text-slate-600 disabled:opacity-30'} active:scale-95`}
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
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
