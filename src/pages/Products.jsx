import { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../api/axios';
import { Search, Filter, Plus, Package, Tag, Upload, Trash2, Edit, Download, FileText, Image as ImageIcon } from 'lucide-react';
import ProductModal from '../components/ProductModal';
import ProductDetailModal from '../components/ProductDetailModal';
import * as XLSX from 'xlsx';

const Products = () => {
    const { darkMode, t } = useOutletContext();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [brandFilter, setBrandFilter] = useState('All');
    const [categoryFilter, setCategoryFilter] = useState('All');

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
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await api.get('/products');
            setProducts(res.data);
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

    const brands = ['All', ...new Set(products.map(p => p.brand).filter(Boolean))];
    const categories = ['All', ...new Set(products.map(p => p.category).filter(Boolean))];

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.sku?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesBrand = brandFilter === 'All' || p.brand === brandFilter;
        const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
        return matchesSearch && matchesBrand && matchesCategory;
    });

    if (loading) return <div className="p-8">{t.loading}</div>;

    return (
        <div className="space-y-6 pb-20 animate-fade-in">
            {/* Header & Filters */}
            <div className={`p-6 rounded-2xl shadow-sm border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                        <h1 className={`text-3xl font-bold ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>{t.products}</h1>
                        <p className={`mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            {t.noData.includes('yuklanmadi') ? `Barcha mavjud mahsulotlar: ${products.length} xil` : `Все доступные товары: ${products.length} видов`}
                        </p>
                    </div>
                    {hasFullAccess && (
                        <div className="flex flex-col sm:flex-row flex-wrap gap-2 w-full md:w-auto justify-end">
                            <button
                                onClick={handleDownloadTemplate}
                                className={`w-full sm:w-auto px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 border transition-all ${darkMode ? 'border-blue-800/50 hover:bg-blue-900/40 text-blue-400' : 'border-blue-200 hover:bg-blue-50 text-blue-600'}`}
                            >
                                <Download size={20} /> {t.reports.slice(0, -1)}
                            </button>

                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                ref={imageInputRef}
                                onChange={handleImagesUpload}
                            />
                            <button
                                onClick={() => imageInputRef.current?.click()}
                                disabled={uploadingImages}
                                className={`w-full sm:w-auto px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 border transition-all ${darkMode ? 'border-purple-800/50 hover:bg-purple-900/40 text-purple-400' : 'border-purple-200 hover:bg-purple-50 text-purple-600'}`}
                            >
                                <ImageIcon size={20} /> {uploadingImages ? t.loading : (t.productImage || 'Rasmlar')}
                            </button>

                            <input
                                type="file"
                                accept=".xlsx, .xls"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                            />
                            <button
                                onClick={handleImportClick}
                                className={`w-full sm:w-auto px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 border transition-all ${darkMode ? 'border-green-800/50 hover:bg-green-900/40 text-green-400' : 'border-green-200 hover:bg-green-50 text-green-700'}`}
                            >
                                <Upload size={20} /> {t.receiveToStock.split(' ')[0]}
                            </button>
                            <button
                                onClick={handleExportProducts}
                                className={`w-full sm:w-auto px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 border transition-all ${darkMode ? 'border-amber-800/50 hover:bg-amber-900/40 text-amber-500' : 'border-amber-200 hover:bg-amber-50 text-amber-600'}`}
                            >
                                <FileText size={20} /> {t.report}
                            </button>
                            <button
                                onClick={() => { setEditingProduct(null); setIsModalOpen(true); }}
                                className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all active:scale-95"
                            >
                                <Plus size={20} /> {t.add}
                            </button>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Search */}
                    <div className="md:col-span-2 relative">
                        <Search className={`absolute left-3 top-3 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`} size={18} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder={t.search}
                            className={`w-full pl-10 pr-4 py-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400'}`}
                        />
                    </div>

                    {/* Brand Filter */}
                    <div className="relative">
                        <Filter className={`absolute left-3 top-3 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`} size={18} />
                        <select
                            value={brandFilter}
                            onChange={e => setBrandFilter(e.target.value)}
                            className={`w-full pl-10 pr-4 py-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                        >
                            {brands.map(brand => <option key={brand} value={brand}>{brand}</option>)}
                        </select>
                    </div>

                    {/* Category Filter */}
                    <div className="relative">
                        <Tag className={`absolute left-3 top-3 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`} size={18} />
                        <select
                            value={categoryFilter}
                            onChange={e => setCategoryFilter(e.target.value)}
                            className={`w-full pl-10 pr-4 py-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                        >
                            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map(product => (
                    <div key={product.id} className={`group rounded-2xl overflow-hidden shadow-sm border transition-all hover:shadow-xl hover:-translate-y-1 relative ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>

                        {/* Admin Actions */}
                        {hasFullAccess && (
                            <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => { setEditingProduct(product); setIsModalOpen(true); }}
                                    className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm"
                                >
                                    <Edit size={16} />
                                </button>
                                <button
                                    onClick={() => handleDelete(product.id)}
                                    className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-sm"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        )}

                        {/* Image Area */}
                        <div className="h-48 p-3 flex items-center justify-center relative bg-white rounded-t-2xl">
                            {product.image ? (
                                <img
                                    src={product.image}
                                    alt={product.name}
                                    className="h-full w-full object-contain transition-transform group-hover:scale-105 duration-300"
                                />
                            ) : (
                                <Package size={48} className={darkMode ? 'text-slate-600' : 'text-slate-300'} />
                            )}

                            {/* Brand Badge */}
                            {product.brand && (
                                <span className="absolute top-3 left-3 px-2 py-1 text-xs font-bold rounded-lg bg-black/50 text-white backdrop-blur-sm">
                                    {product.brand}
                                </span>
                            )}
                        </div>

                        {/* Content */}
                        <div className="p-4 space-y-2">
                            <div className="flex justify-between items-start gap-2">
                                <div>
                                    <div className={`text-xs font-semibold mb-1 uppercase tracking-wider ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                                        {product.category || t.notSelected}
                                    </div>
                                    <h3 className={`font-bold text-lg leading-tight ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                                        {product.name}
                                    </h3>
                                </div>
                                <div className={`text-lg font-bold whitespace-nowrap ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                                    ${product.price}
                                </div>
                            </div>

                            <p className={`text-sm line-clamp-2 min-h-[40px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                {product.description || t.noData}
                            </p>

                            <div className="pt-4 flex items-center justify-between border-t border-dashed mt-4 dark:border-slate-700">
                                <div className={`px-2 py-1 rounded text-xs font-medium ${product.quantity > 10
                                    ? (darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-50 text-green-700')
                                    : (darkMode ? 'bg-rose-900/30 text-rose-400' : 'bg-rose-50 text-rose-700')
                                    }`}>
                                    {product.quantity > 0 ? `${product.quantity} ${t.auditLog.includes('Audit') ? 'ta mavjud' : 'шт в наличии'}` : t.noData}
                                </div>
                                <button
                                    onClick={() => { setViewingProduct(product); setIsDetailModalOpen(true); }}
                                    className={`text-sm font-medium hover:underline ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}
                                >
                                    {t.view}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredProducts.length === 0 && (
                <div className={`text-center py-20 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                    <Package size={48} className="mx-auto mb-4 opacity-50" />
                    <p>{t.noData}</p>
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
