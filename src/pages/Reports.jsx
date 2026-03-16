import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useOutletContext } from 'react-router-dom';
import { Filter, Calendar, TrendingUp, ShoppingBag, PieChart as PieIcon, BarChart2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExportMenu from '../components/ui/ExportMenu';
import DatePicker from '../components/ui/DatePicker';

const Reports = () => {
    const { darkMode, t } = useOutletContext();
    const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
    const [endDate, setEndDate] = useState(new Date());
    const [salesData, setSalesData] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [summary, setSummary] = useState({ totalRevenue: 0, totalOrders: 0 });
    const [loading, setLoading] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = {};
            if (startDate) params.startDate = startDate.toISOString();
            if (endDate) params.endDate = endDate.toISOString();

            const [salesRes, productsRes] = await Promise.all([
                api.get('/reports/sales', { params }),
                api.get('/reports/top-products', { params })
            ]);

            setSalesData(salesRes.data.chartData);
            setSummary(salesRes.data.summary);
            setTopProducts(productsRes.data);
        } catch (error) {
            console.error("Error fetching reports:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleFilter = () => {
        fetchData();
    };

    const handleExportExcel = () => {
        const wb = XLSX.utils.book_new();
        const salesSheet = XLSX.utils.json_to_sheet(salesData.map(d => ({
            [t.date]: d.date,
            [t.orderCountShort]: d.orders,
            [t.revenueAmount]: d.revenue
        })));
        XLSX.utils.book_append_sheet(wb, salesSheet, t.salesStatistics);

        const productsSheet = XLSX.utils.json_to_sheet(topProducts.map(p => ({
            [t.product]: p.name,
            [t.soldCount]: p.value,
            [t.totalProfit]: p.revenue
        })));
        XLSX.utils.book_append_sheet(wb, productsSheet, t.topProducts);

        const summarySheet = XLSX.utils.json_to_sheet([{
            [t.revenueAmount]: summary.totalRevenue,
            [t.orderCountShort]: summary.totalOrders,
            [t.startDateLabel]: startDate ? startDate.toLocaleDateString() : t.start,
            [t.endDateLabel]: endDate ? endDate.toLocaleDateString() : t.now
        }]);
        XLSX.utils.book_append_sheet(wb, summarySheet, t.all);

        XLSX.writeFile(wb, `${t.report}_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const handleExportPDF = () => {
        try {
            const doc = new jsPDF();

            doc.setFontSize(20);
            doc.text(t.salesReport, 14, 22);

            doc.setFontSize(11);
            doc.text(`${t.date}: ${new Date().toLocaleDateString()}`, 14, 30);
            doc.text(`${t.timeAndDate}: ${startDate ? startDate.toLocaleDateString() : t.start} - ${endDate ? endDate.toLocaleDateString() : t.now}`, 14, 36);

            // Summary
            doc.setFillColor(240, 240, 240);
            doc.rect(14, 45, 180, 25, 'F');
            doc.setFontSize(12);
            doc.text(t.overallIndicators, 20, 55);
            doc.setFontSize(10);
            doc.text(`${t.revenueAmount}: $${summary.totalRevenue.toFixed(2)}`, 20, 63);
            doc.text(`${t.orderCountShort}: ${summary.totalOrders}`, 100, 63);

            // Sales Table
            doc.setFontSize(14);
            doc.text(t.salesStatistics, 14, 85);
            autoTable(doc, {
                startY: 90,
                head: [[t.date, t.orderCountShort, t.revenueAmount]],
                body: salesData.map(d => [d.date, d.orders, `$${(d.revenue || 0).toFixed(2)}`]),
            });

            // Top Products Table
            const finalY = doc.lastAutoTable.finalY || 90;
            doc.text(t.topProducts, 14, finalY + 15);
            autoTable(doc, {
                startY: finalY + 20,
                head: [[t.product, t.soldCount]],
                body: topProducts.map(p => [p.name, p.value]),
            });

            doc.save(`${t.report}_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (error) {
            console.error("PDF Export Error:", error);
            alert(t.errorOccurred);
        }
    };

    const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

    return (
        <div className="max-w-7xl mx-auto pb-20 space-y-8 animate-fade-in">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className={`text-3xl font-light ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>{t.reportsAndAnalysis}</h1>
                    <p className={`mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t.businessOverviewDesc}</p>
                </div>
            </header>

            {/* Filter Section */}
            <div className={`p-6 rounded-2xl shadow-sm border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
                <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-end">
                    <div className="w-full md:w-auto">
                        <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{t.startDateLabel}</label>
                        <DatePicker
                            selected={startDate}
                            onChange={date => setStartDate(date)}
                            placeholder={t.datePlaceholder}
                            darkMode={darkMode}
                        />
                    </div>
                    <div className="w-full md:w-auto">
                        <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{t.endDateLabel}</label>
                        <DatePicker
                            selected={endDate}
                            onChange={date => setEndDate(date)}
                            placeholder={t.datePlaceholder}
                            darkMode={darkMode}
                        />
                    </div>
                    <button
                        onClick={fetchData}
                        className="w-full md:w-auto cursor-pointer bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 font-medium flex items-center justify-center gap-2 transition-colors h-[42px]"
                    >
                        <Filter size={18} /> {t.filter}
                    </button>
                    <div className="flex-1 hidden md:block"></div>

                    <div className="w-full md:w-auto mt-2 md:mt-0 flex justify-end">
                        <ExportMenu
                            onExportExcel={handleExportExcel}
                            onExportPDF={handleExportPDF}
                            darkMode={darkMode}
                        />
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={`p-6 rounded-2xl border shadow-sm flex items-center gap-4 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
                    <div className={`p-4 rounded-xl ${darkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                        <TrendingUp size={32} />
                    </div>
                    <div>
                        <p className={`text-sm font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t.revenue}</p>
                        <h3 className={`text-3xl font-bold ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                            ${summary.totalRevenue.toFixed(2)}
                        </h3>
                    </div>
                </div>
                <div className={`p-6 rounded-2xl border shadow-sm flex items-center gap-4 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
                    <div className={`p-4 rounded-xl ${darkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                        <ShoppingBag size={32} />
                    </div>
                    <div>
                        <p className={`text-sm font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t.totalOrders}</p>
                        <h3 className={`text-3xl font-bold ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                            {summary.totalOrders}
                        </h3>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="h-64 flex justify-center items-center">
                    <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Sales Chart */}
                    <div className={`lg:col-span-2 p-6 rounded-3xl shadow-sm border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
                        <div className="mb-6 flex items-center gap-2">
                            <BarChart2 className="text-blue-500" size={24} />
                            <h2 className={`text-xl font-bold ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>{t.salesStatistics}</h2>
                        </div>
                        <div className="h-[400px]">
                            {salesData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={salesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#334155' : '#f1f5f9'} />
                                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                        <Tooltip
                                            contentStyle={{
                                                borderRadius: '12px',
                                                border: 'none',
                                                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                                backgroundColor: darkMode ? '#1e293b' : '#fff',
                                                color: darkMode ? '#fff' : '#000'
                                            }}
                                            formatter={(value) => [`$${value.toFixed(2)}`, t.revenueAmount]}
                                        />
                                        <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" name={t.revenueAmount} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-slate-400">{t.noData}</div>
                            )}
                        </div>
                    </div>

                    {/* Top Products */}
                    <div className={`p-6 rounded-3xl shadow-sm border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
                        <div className="mb-6 flex items-center gap-2">
                            <PieIcon className="text-emerald-500" size={24} />
                            <h2 className={`text-xl font-bold ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>{t.topProducts}</h2>
                        </div>
                        <div className="h-[400px]">
                            {topProducts.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={topProducts}
                                            cx="50%"
                                            cy="40%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {topProducts.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                borderRadius: '12px',
                                                border: 'none',
                                                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                                backgroundColor: darkMode ? '#1e293b' : '#fff',
                                                color: darkMode ? '#fff' : '#000'
                                            }}
                                        />
                                        <Legend
                                            verticalAlign="bottom"
                                            height={70}
                                            align="center"
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-slate-400">{t.noData}</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Reports;
