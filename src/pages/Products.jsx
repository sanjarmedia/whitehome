import { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../api/axios';
import { Search, Filter, Plus, Package, Tag, Upload, Trash2, Edit, Download, FileText, Image as ImageIcon, ChevronLeft, ChevronRight, Eye, ImageIcon as LucideImage, ChevronDown } from 'lucide-react';
import ProductModal from '../components/ProductModal';
import ProductDetailModal from '../components/ProductDetailModal';
import Pagination from '../components/ui/Pagination';
import * as XLSX from 'xlsx';

const Products = () => {
    const { darkMode, t } = useOutletContext();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [brandFilter, setBrandFilter] = useState('All');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ total: 0, totalPages: 0, limit: 24 });
    const [limit, setLimit] = useState(24);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [viewingProduct, setViewingProduct] = useState(null);
    const [uploadingImages, setUploadingImages] = useState(false);

    const fileInputRef = useRef(null);
    const imageInputRef = useRef(null);

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const hasFullAccess = ['admin', 'full'].includes(user.role);

    const [error, setError] = useState(null);

    useEffect(() => {
        fetchProducts();
    }, [page, brandFilter, categoryFilter, limit]);

    useEffect(() => {
        if (page !== 1) setPage(1);
        else fetchProducts();
    }, [searchTerm]);

    const fetchProducts = async () => {
        try {
            const res = await api.get('/products', {
                params: {
                    page,
                    limit,
                    search: searchTerm,
                    brand: brandFilter,
                    category: categoryFilter
                }
            });
            const productsData = res?.data?.data || (Array.isArray(res?.data) ? res?.data : []);
            setProducts(productsData);
            
            if (res?.data?.pagination) {
                setPagination(res.data.pagination);
            } else if (productsData.length > 0) {
                // Fallback if pagination info is missing but data exists
                setPagination({
                    total: productsData.length,
                    totalPages: Math.ceil(productsData.length / limit),
                    limit: limit
                });
            }
            setError(null);
        } catch (err) {
            console.error(err);
            setError(t.noData.includes('yuklanmadi') ? "Ma'lumotlarni yuklashda xatolik" : "Ошибка при загрузке данных");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8">{t.loading}</div>;
    if (error) return <div className="p-8 text-red-500">{error}</div>;

    const handleSave = async (formData) => {
        try {
            if (editingProduct) {
                await api.put(`/products/${editingProduct.id}`, formData);
            } else {
                await api.post('/products', formData);
            }
            fetchProducts();
            setIsModalOpen(false);
            setEditingProduct(null);
        } catch (error) {
            console.error("Error saving product:", error);
            alert("Xatolik yuz berdi");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Rostdan ham o'chirmoqchimisiz?")) return;
        try {
            await api.delete(`/products/${id}`);
            fetchProducts();
        } catch (error) {
            console.error(error);
            alert("O'chirishda xatolik");
        }
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            const bstr = evt.target.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws);

            // Map Excel columns to our schema
            // Expected columns: name, sku, price, quantity, brand, category, image
            const formattedData = data.map(item => ({
                name: item.name || item.Name || item.Nomi,
                sku: item.sku || item.SKU,
                price: item.price || item.Price || item.Narx,
                quantity: item.quantity !== undefined ? item.quantity : (item.Quantity || item.Soni),
                brand: item.brand || item.Brand,
                category: item.category || item.Category || item.Kategoriya,
                image: item.image || item.Image || item.Rasm,
                description: item.description || item.Description || item.Tavsif
            }));

            try {
                const res = await api.post('/products/import', { products: formattedData });
                alert(res.data.message);
                fetchProducts();
            } catch (error) {
                console.error("Import error:", error);
                alert("Import qilishda xatolik");
            }
        };
        reader.readAsBinaryString(file);
        e.target.value = null; // Reset input
    };

    const handleDownloadTemplate = async () => {
        try {
            const res = await api.get('/products/template', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'ShablonYuklabOlish.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error(error);
            alert("Shablonni yuklab olishda xatolik");
        }
    };

    const handleExportProducts = async () => {
        try {
            const res = await api.get('/products/export', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'BarchaMahsulotlar.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error(error);
            alert("Eksport qilishda xatolik");
        }
    };

    const handleImagesUpload = async (e) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const formData = new FormData();
        for (let i = 0; i < files.length; i++) {
            formData.append('files', files[i]);
        }

        setUploadingImages(true);
        try {
            // 1. Rasmlarni yuklash
            const uploadRes = await api.post('/upload/multiple', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            const uploadedFiles = uploadRes.data.files;
            
            // 2. Biriktirish (assign)
            if (uploadedFiles && uploadedFiles.length > 0) {
                const assignRes = await api.post('/products/assign-images', { files: uploadedFiles });
                alert(assignRes.data.message);
                fetchProducts();
            }
        } catch (error) {
            console.error("Image upload error:", error);
            alert("Rasmlarni yuklashda yoki biriktirishda xatolik yuz berdi");
        } finally {
            setUploadingImages(false);
            e.target.value = null;
        }
    };

    const brands = ['All', 'Akuvox', 'Akubela']; // Basic list, could be fetched
    const categories = ['All', 'Monitor', 'Doorphone', 'Ichki Tizim', 'Aksesuar'];

    if (loading) return <div className="p-8">{t.loading}</div>;

    return (
        <div className="space-y-6 pb-20 animate-fade-in">
            {/*            {/* Header & Quick Actions - Premium Design */}
            <div className={`p-5 rounded-3xl border-2 transition-all duration-500 shadow-xl ${darkMode ? 'bg-slate-900 border-slate-800 shadow-slate-950/20' : 'bg-white border-slate-100 shadow-slate-100'}`}>
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-6">
                    <div>
                        <h1 className={`text-4xl font-black tracking-tight ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                            {t.products}
                        </h1>
                        <div className="flex items-center gap-2 mt-1">
                            <div className={`w-2 h-2 rounded-full bg-blue-500 animate-pulse`} />
                            <p className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                {t.totalProductsCount(pagination.total)}
                            </p>
                        </div>
                    </div>
                    
                    {hasFullAccess && (
                        <div className="grid grid-cols-2 sm:flex sm:flex-row flex-wrap gap-2 w-full lg:w-auto">
                            <button
                                onClick={handleDownloadTemplate}
                                className={`flex-1 sm:w-auto px-4 py-3 rounded-2xl flex items-center justify-center gap-2 border-2 transition-all active:scale-95 text-[10px] font-black uppercase tracking-tight ${darkMode ? 'border-blue-500/20 bg-blue-500/5 text-blue-400 hover:bg-blue-500/10' : 'border-blue-50 bg-blue-50/30 text-blue-600 hover:bg-blue-50'}`}
                            >
                                <Download size={18} strokeWidth={3} /> {t.reports.slice(0, -1)}
                            </button>

                            <button
                                onClick={() => imageInputRef.current?.click()}
                                disabled={uploadingImages}
                                className={`flex-1 sm:w-auto px-4 py-3 rounded-2xl flex items-center justify-center gap-2 border-2 transition-all active:scale-95 text-[10px] font-black uppercase tracking-tight ${darkMode ? 'border-purple-500/20 bg-purple-500/5 text-purple-400 hover:bg-purple-500/10' : 'border-purple-50 bg-purple-50/30 text-purple-600 hover:bg-purple-50'}`}
                            >
                                <ImageIcon size={18} strokeWidth={3} /> {uploadingImages ? '...' : t.images}
                            </button>

                            <button
                                onClick={handleImportClick}
                                className={`flex-1 sm:w-auto px-4 py-3 rounded-2xl flex items-center justify-center gap-2 border-2 transition-all active:scale-95 text-[10px] font-black uppercase tracking-tight ${darkMode ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/10' : 'border-emerald-50 bg-emerald-50/30 text-emerald-700 hover:bg-emerald-50'}`}
                            >
                                <Upload size={18} strokeWidth={3} /> {t.import}
                            </button>
                            
                            <button
                                onClick={() => { setEditingProduct(null); setIsModalOpen(true); }}
                                className="col-span-2 sm:w-auto bg-blue-600 text-white px-8 py-4 sm:py-3 rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-blue-700 flex items-center justify-center gap-3 shadow-xl shadow-blue-500/30 transition-all active:scale-95"
                            >
                                <Plus size={20} strokeWidth={3} /> {t.add}
                            </button>
                        </div>
                    )}
                </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Search - Premium Interactive */}
                    <div className="sm:col-span-2 relative group">
                        <Search size={18} strokeWidth={3} className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${darkMode ? 'text-slate-600 group-focus-within:text-blue-500' : 'text-slate-400 group-focus-within:text-blue-600'}`} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder={t.search}
                            className={`w-full pl-12 pr-4 py-4 sm:py-3.5 border-2 rounded-[1.25rem] outline-none transition-all ${darkMode ? 'bg-slate-800/50 border-slate-700/50 text-slate-100 placeholder:text-slate-600 focus:border-blue-500/50 focus:bg-slate-800' : 'bg-slate-50 border-slate-50 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-100 focus:shadow-md'}`}
                        />
                    </div>

                    {/* Brand Filter */}
                    <div className="relative group">
                        <Filter size={18} strokeWidth={3} className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${darkMode ? 'text-slate-600 group-focus-within:text-blue-500' : 'text-slate-400 group-focus-within:text-blue-600'}`} />
                        <select
                            value={brandFilter}
                            onChange={e => setBrandFilter(e.target.value)}
                            className={`w-full pl-12 pr-10 py-4 sm:py-3.5 border-2 rounded-[1.25rem] outline-none transition-all appearance-none cursor-pointer ${darkMode ? 'bg-slate-800/50 border-slate-700/50 text-slate-100 focus:border-blue-500/50' : 'bg-slate-50 border-slate-50 text-slate-800 focus:bg-white focus:border-blue-100 focus:shadow-md'}`}
                        >
                            {brands.map(brand => <option key={brand} value={brand}>{brand}</option>)}
                        </select>
                        <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 opacity-40 pointer-events-none" />
                    </div>

                    {/* Category Filter */}
                    <div className="relative group">
                        <Tag size={18} strokeWidth={3} className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${darkMode ? 'text-slate-600 group-focus-within:text-blue-500' : 'text-slate-400 group-focus-within:text-blue-600'}`} />
                        <select
                            value={categoryFilter}
                            onChange={e => setCategoryFilter(e.target.value)}
                            className={`w-full pl-12 pr-10 py-4 sm:py-3.5 border-2 rounded-[1.25rem] outline-none transition-all appearance-none cursor-pointer ${darkMode ? 'bg-slate-800/50 border-slate-700/50 text-slate-100 focus:border-blue-500/50' : 'bg-slate-50 border-slate-50 text-slate-800 focus:bg-white focus:border-blue-100 focus:shadow-md'}`}
                        >
                            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                        <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 opacity-40 pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Top Pagination controls */}
            <div className="mb-4">
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
            </div>

            {/* Products Grid - High Density Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.slice(0, limit).map(product => (
                    <div key={product.id} className={`group rounded-[2rem] overflow-hidden shadow-xl border-2 transition-all hover:shadow-2xl hover:-translate-y-2 relative ${darkMode ? 'bg-slate-900 border-slate-800 shadow-slate-950/40' : 'bg-white border-white shadow-slate-200/50'}`}>

                        {/* Admin Actions - Touch Friendly Visibility On Mobile */}
                        {hasFullAccess && (
                            <div className="absolute top-4 right-4 z-10 flex gap-2 opacity-100 translate-y-0 lg:opacity-0 lg:translate-y-2 lg:group-hover:opacity-100 lg:group-hover:translate-y-0 transition-all duration-300">
                                <button
                                    onClick={(e) => { e.stopPropagation(); setEditingProduct(product); setIsModalOpen(true); }}
                                    className="p-3 bg-blue-600/90 backdrop-blur-md text-white rounded-2xl hover:bg-blue-600 shadow-lg active:scale-90"
                                >
                                    <Edit size={18} strokeWidth={3} />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDelete(product.id); }}
                                    className="p-3 bg-rose-600/90 backdrop-blur-md text-white rounded-2xl hover:bg-rose-600 shadow-lg active:scale-90"
                                >
                                    <Trash2 size={18} strokeWidth={3} />
                                </button>
                            </div>
                        )}

                        {/* Image Area - Clean Backdrop */}
                        <div className={`h-52 p-6 flex items-center justify-center relative transition-colors ${darkMode ? 'bg-slate-800' : 'bg-slate-50'}`}>
                            {product.image ? (
                                <img
                                    src={product.image}
                                    alt={product.name}
                                    className={`h-full w-full object-contain transition-transform duration-500 group-hover:scale-110 ${darkMode ? 'brightness-110 contrast-110' : 'mix-blend-multiply'}`}
                                />
                            ) : (
                                <div className="flex flex-col items-center gap-3 opacity-20">
                                    <Package size={56} strokeWidth={1} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">{t.noData}</span>
                                </div>
                            )}

                            {/* Brand Badge */}
                            {product.brand && (
                                <span className="absolute bottom-4 left-4 px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg bg-black text-white shadow-lg">
                                    {product.brand}
                                </span>
                            )}
                        </div>

                        {/* Content Area */}
                        <div className="p-6 space-y-4">
                            <div className="space-y-1">
                                <div className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                                    <Tag size={12} strokeWidth={3} />
                                    {product.category || t.notSelected}
                                </div>
                                <h3 className={`font-black text-xl leading-tight tracking-tight line-clamp-1 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                                    {product.name}
                                </h3>
                                <p className={`text-[11px] font-bold line-clamp-2 leading-relaxed opacity-60 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                    {product.description || (t.noData.includes('yuklanmadi') ? 'Mahsulot haqida ma\'lumotlar kiritilmagan' : 'Информация о продукте не введена')}
                                </p>
                            </div>

                            <div className="flex items-center justify-between pt-2">
                                <div className={`text-2xl font-black ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                    ${product.price?.toLocaleString()}
                                </div>
                                <div className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 ${product.quantity > 10
                                    ? (darkMode ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-100 text-emerald-600')
                                    : (darkMode ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-rose-50 border-rose-100 text-rose-600')
                                    }`}>
                                    {product.quantity > 0 ? `${product.quantity} ${t.unitPiece}` : t.noData}
                                </div>
                            </div>

                            <button
                                onClick={() => { setViewingProduct(product); setIsDetailModalOpen(true); }}
                                className={`w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] border-2 transition-all active:scale-95 flex items-center justify-center gap-3 overflow-hidden group/btn ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:border-blue-500/50' : 'bg-slate-50 border-slate-100 text-slate-500 hover:text-blue-600 hover:bg-white hover:border-blue-100 shadow-sm'}`}
                            >
                                <Eye size={18} strokeWidth={3} className="transition-transform group-hover/btn:scale-110" />
                                {t.view}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Pagination controls */}
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

            {products.length === 0 && (
                <div className={`text-center py-20 rounded-[2rem] border-2 border-dashed ${darkMode ? 'bg-slate-900/50 border-slate-800 text-slate-600' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                    <Package size={64} strokeWidth={1} className="mx-auto mb-4 opacity-20" />
                    <p className="font-black uppercase tracking-[0.2em] text-xs">{t.noData}</p>
                </div>
            )}

            <ProductModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                initialData={editingProduct}
                darkMode={darkMode}
                t={t}
                categories={categories}
                brands={brands}
            />

            <ProductDetailModal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                product={viewingProduct}
                darkMode={darkMode}
                t={t}
            />
        </div>
    );
};

export default Products;
