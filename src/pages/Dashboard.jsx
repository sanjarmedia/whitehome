import { useEffect, useState, memo } from 'react';
import ReactDOM from 'react-dom';
import { useOutletContext } from 'react-router-dom';
import api from '../api/axios';
import { RefreshCw, TrendingUp, ShoppingBag, CheckCircle, AlertTriangle, ArrowUpRight, ArrowDownRight, Minus, Users, PieChart as PieIcon, Phone, MapPin, X, Building2, CreditCard, Package, Globe } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, AreaChart, Area, Legend } from 'recharts';

const Dashboard = () => {
    const { darkMode, t } = useOutletContext();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedCustomer, setSelectedCustomer] = useState(null);

    const fetchStats = async (isFirstLoad = false) => {
        if (isFirstLoad) setLoading(true);
        try {
            const res = await api.get('/dashboard');
            setStats(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            if (isFirstLoad) setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats(true);
        // Set up real-time polling every 30 seconds
        const intervalId = setInterval(() => fetchStats(false), 30000);
        return () => clearInterval(intervalId);
    }, []);

    if (loading) return (
        <div className="flex justify-center items-center h-[60vh]">
            <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
        </div>
    );

    if (!stats) return <div className="text-center p-10 text-slate-500">{t.dataLoadError}</div>;

    const pieData = stats?.topSelling || [];
    const areaData = stats?.monthlyStats || [];
    const debtData = stats?.customerBalances || [];
    const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

    return (
        <>

            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 animate-slide-in relative z-10">
                <div>
                    <h1 className={`text-3xl sm:text-4xl font-thin tracking-tight ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>{t.dashboard}</h1>
                    <p className={`mt-1 sm:mt-2 font-light ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t.dailyStatus}</p>
                </div>
                <button
                    onClick={() => fetchStats(true)}
                    className={`p-3 rounded-2xl shadow-sm border transition-all active:scale-95 group self-end sm:self-auto ${darkMode
                        ? 'bg-slate-800 text-slate-400 hover:text-blue-400 border-slate-700'
                        : 'bg-white text-slate-600 hover:text-blue-600 border-slate-200 hover:bg-blue-50'
                        }`}
                >
                    <RefreshCw size={20} className="group-hover:rotate-180 transition-transform duration-500" />
                </button>
            </header>

            {/* Stat Cards */}
            <div className="space-y-6 md:space-y-8 pb-20 relative">
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6 relative z-10">
                    <div className="col-span-2 lg:col-span-1">
                        <StatCard
                            title={t.totalOrders}
                            value={String(stats?.counts?.total || 0)}
                            icon={ShoppingBag}
                            color="bg-blue-50 text-blue-600"
                            trend={t.totalOrders}
                            trendType="info"
                            delay="0.1s"
                            darkMode={darkMode}
                        />
                    </div>
                    <StatCard
                        title={t.newOrders}
                        value={String(stats?.counts?.new || 0)}
                        icon={AlertTriangle}
                        color="bg-amber-50 text-amber-600"
                        trend={t.newOrders}
                        trendType="neutral"
                        delay="0.2s"
                        darkMode={darkMode}
                    />
                    <StatCard
                        title={t.completed}
                        value={String(stats?.counts?.completed || 0)}
                        icon={CheckCircle}
                        color="bg-emerald-50 text-emerald-600"
                        trend={t.completed}
                        trendType="up"
                        delay="0.3s"
                        darkMode={darkMode}
                    />
                    <div className="col-span-2 lg:col-span-1">
                        <StatCard
                            title={t.revenue}
                            value={`$${(stats?.revenue || 0).toLocaleString()}`}
                            icon={TrendingUp}
                            color="bg-indigo-50 text-indigo-600"
                            trend={t.revenue}
                            trendType="up"
                            delay="0.4s"
                            darkMode={darkMode}
                        />
                    </div>
                    <StatCard
                        title={t.expense}
                        value={`$${(stats?.totalExpense || 0).toLocaleString()}`}
                        icon={ShoppingBag}
                        color="bg-orange-50 text-orange-600"
                        trend={t.expense}
                        trendType="down"
                        delay="0.5s"
                        darkMode={darkMode}
                    />
                    <StatCard
                        title={t.debt}
                        value={`$${(stats?.totalDebt || 0).toLocaleString()}`}
                        icon={Users}
                        color="bg-rose-50 text-rose-600"
                        trend={t.debt}
                        trendType="down"
                        delay="0.6s"
                        darkMode={darkMode}
                    />
                    <div className="col-span-2 lg:col-span-1">
                        <StatCard
                            title={t.stockValue}
                            value={`$${(stats?.totalStockValue || 0).toLocaleString()}`}
                            icon={Package}
                            color="bg-emerald-50 text-emerald-600"
                            trend={`${stats?.totalStockItems || 0} ${t.unitPiece || 'ta'}`}
                            trendType="info"
                            delay="0.7s"
                            darkMode={darkMode}
                        />
                    </div>
                    <div className="col-span-2 lg:col-span-1">
                        <StatCard
                            title={t.onlineOrders}
                            value={String(stats?.counts?.online || 0)}
                            icon={Globe}
                            color="bg-purple-50 text-purple-600"
                            trend={t.onlineOrders}
                            trendType="info"
                            delay="0.8s"
                            darkMode={darkMode}
                        />
                    </div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 relative z-10">
                    {/* Growth Chart (Area) - Revenue & Customers */}
                    <div className={`lg:col-span-2 p-5 md:p-8 rounded-3xl shadow-sm border animate-slide-in hover:shadow-md transition-shadow duration-300 relative overflow-hidden ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'
                        }`} style={{ animationDelay: '0.5s' }}>
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-t-3xl"></div>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                            <div>
                                <h2 className={`text-lg md:text-xl font-medium flex items-center gap-2 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                                    <TrendingUp className="text-blue-500" size={20} />
                                    {t.financialGrowth}
                                </h2>
                                <p className="text-xs text-slate-400 mt-1">{t.last6months}</p>
                            </div>
                            <div className="flex gap-4 text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-400">
                                <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> {t.profitLabel}</div>
                                <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span> {t.customersLabel}</div>
                            </div>
                        </div>

                        <div className="h-[280px] md:h-[320px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={areaData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorCustomers" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#334155' : '#f1f5f9'} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} dy={10} />
                                    <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                    <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                    <Tooltip
                                        contentStyle={{
                                            borderRadius: '16px',
                                            border: 'none',
                                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                            padding: '12px',
                                            backgroundColor: darkMode ? '#1e293b' : '#fff',
                                            color: darkMode ? '#fff' : '#000'
                                        }}
                                        itemStyle={{ fontSize: '12px', fontWeight: 600 }}
                                    />
                                    <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" name={t.profitLabel} animationDuration={2000} />
                                    <Area yAxisId="right" type="monotone" dataKey="customers" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorCustomers)" name={t.customersLabel} animationDuration={2500} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Top Selling Products (Donut/Pie) */}
                    <div className={`lg:col-span-1 p-5 md:p-8 rounded-3xl shadow-sm border animate-slide-in hover:shadow-md transition-shadow duration-300 relative overflow-hidden ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'
                        }`} style={{ animationDelay: '0.6s' }}>
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-rose-500 rounded-t-3xl"></div>
                        <h2 className={`text-lg md:text-xl font-medium mb-1 flex items-center gap-2 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                            <PieIcon className="text-amber-500" size={20} />
                            {t.topProducts}
                        </h2>
                        <p className="text-xs text-slate-400 mb-6">{t.bySalesVolume}</p>

                        <div className="h-[280px] w-full flex justify-center items-center relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={55}
                                        outerRadius={85}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {pieData.map((entry, index) => (
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
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                                </PieChart>
                            </ResponsiveContainer>
                            {/* Center Text */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                                <span className={`text-2xl font-black ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>{pieData.reduce((a, b) => a + b.value, 0)}</span>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.jamiLabel || 'Jami'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Recent Activity List */}
                    <div className={`lg:col-span-3 p-5 md:p-8 rounded-3xl shadow-sm border animate-slide-in ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'
                        }`} style={{ animationDelay: '0.7s' }}>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className={`text-lg md:text-xl font-medium flex items-center gap-2 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                                <Users className="text-indigo-500" size={20} />
                                {t.recentActivity}
                            </h2>
                            <button className="text-blue-500 text-xs font-black uppercase tracking-wider hover:underline">{t.viewAllLabel || 'Barchasi'}</button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                            {stats?.recent?.map((order, i) => (
                                <div key={order.id}
                                    className={`flex items-center gap-3 p-3 rounded-2xl border transition-all hover:shadow-sm ${darkMode
                                        ? 'bg-slate-700/50 border-slate-600 hover:border-slate-500'
                                        : 'bg-slate-50 border-slate-100 hover:border-blue-200'
                                        }`}
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-md ${COLORS[i % COLORS.length]} shadow-${COLORS[i % COLORS.length]}/30 shrink-0`}>
                                        {order.destinationType === 'WAREHOUSE' ? 'S' : (order.customer?.name?.[0] || '#')}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`font-bold text-sm truncate ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                                            {order.destinationType === 'WAREHOUSE' ? t.mainWarehouse : (order.customer?.name || t.customer)}
                                        </p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px] font-bold text-slate-400 capitalize">
                                                {t[`status_${order.status}`] || order.status}
                                            </span>
                                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                            <span className="text-[10px] text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <div className={`font-black text-sm whitespace-nowrap ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>${order.totalAmount}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 1. BarChart: Eng Yirik Qarzdorlar */}
                    <div className={`lg:col-span-1 p-5 md:p-8 rounded-3xl shadow-sm border animate-slide-in relative overflow-hidden ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'
                        }`} style={{ animationDelay: '0.8s' }}>
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-400 to-rose-600 rounded-t-3xl"></div>
                        <div className="mb-6">
                            <h2 className={`text-lg md:text-xl font-medium flex items-center gap-2 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                                <Users className="text-rose-500" size={20} />
                                {t.largestDebtors}
                            </h2>
                            <p className="text-xs text-slate-400 mt-1">{t.byDebtVolume}</p>
                        </div>

                        {debtData.length === 0 ? (
                            <div className={`flex flex-col items-center justify-center h-[280px] text-sm ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                {t.noDebtors}
                            </div>
                        ) : (
                            <div className="h-[280px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={debtData} layout="vertical" margin={{ top: 0, right: 30, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={darkMode ? '#334155' : '#f1f5f9'} />
                                        <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                        <YAxis dataKey="name" type="category" width={80} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                        <Tooltip
                                            cursor={{ fill: darkMode ? '#1e293b' : '#f8fafc' }}
                                            contentStyle={{
                                                borderRadius: '12px',
                                                border: 'none',
                                                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                                backgroundColor: darkMode ? '#1e293b' : '#fff',
                                                color: darkMode ? '#fff' : '#000'
                                            }}
                                            formatter={(value) => [`$${value.toLocaleString()}`, t.debtLabelShort]}
                                        />
                                        <Bar dataKey="debt" name={t.debtLabelShort} radius={[0, 4, 4, 0]} barSize={16}>
                                            {debtData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={['#ef4444', '#f43f5e', '#fb7185', '#fda4af'][index % 4]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>

                    {/* 2. Jadval (Table): Balans summary */}
                    <div className={`lg:col-span-2 p-5 md:p-8 rounded-3xl shadow-sm border animate-slide-in relative overflow-hidden ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'
                        }`} style={{ animationDelay: '0.9s' }}>
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-t-3xl"></div>
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className={`text-lg md:text-xl font-medium flex items-center gap-2 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                                    <CheckCircle className="text-emerald-500" size={20} />
                                    {t.customerBalanceSummary}
                                </h2>
                                <p className="text-xs text-slate-400 mt-1">{t.balanceReportSubtitle}</p>
                            </div>
                        </div>

                        {/* Responsive Table Wrapper */}
                        <div className="overflow-x-auto -mx-5 px-5 md:mx-0 md:px-0">
                            <div className="min-w-[450px]">
                                <div className={`grid grid-cols-[1.5fr_1fr_1fr_1fr] gap-4 px-4 py-3 border-b text-[10px] font-black uppercase tracking-widest ${darkMode ? 'border-slate-700 text-slate-500' : 'border-slate-200 text-slate-400'}`}>
                                    <div>{t.customerName}</div>
                                    <div className="text-right">{t.totalPurchaseAmountShort || 'Kirim'}</div>
                                    <div className="text-right">{t.totalPaidAmountShort || 'To\'lov'}</div>
                                    <div className="text-right">{t.remainingDebtAmountShort || 'Qarz'}</div>
                                </div>

                                <div className="divide-y divide-transparent mt-2">
                                    {debtData.length === 0 ? (
                                        <div className={`text-center py-10 text-sm ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                            {t.noBalanceData}
                                        </div>
                                    ) : (
                                        debtData.map((c, i) => (
                                            <div
                                                key={c.id || i}
                                                onClick={() => setSelectedCustomer(c)}
                                                className={`grid grid-cols-[1.5fr_1fr_1fr_1fr] gap-4 px-4 py-3.5 rounded-2xl cursor-pointer transition-all duration-200 group ${darkMode ? 'hover:bg-slate-700/50' : 'hover:bg-blue-50'}`}
                                            >
                                                <div className={`flex items-center gap-3 font-bold text-sm ${darkMode ? 'text-slate-200' : 'text-slate-800'} truncate`}>
                                                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black bg-amber-100 text-amber-700 shrink-0 group-hover:scale-110 transition-transform">
                                                        {c.name?.[0] || 'U'}
                                                    </div>
                                                    <span className="truncate">{c.name}</span>
                                                </div>
                                                <div className={`text-right font-bold text-xs self-center ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                                    ${(c.totalPurchases || 0).toLocaleString()}
                                                </div>
                                                <div className="text-right font-bold text-xs text-emerald-500 self-center">
                                                    ${(c.totalPaid || 0).toLocaleString()}
                                                </div>
                                                <div className="text-right font-black text-sm text-rose-500 self-center">
                                                    ${(c.debt || 0).toLocaleString()}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Customer Info Popup — rendered via portal at document.body for true viewport centering */}
            {selectedCustomer && ReactDOM.createPortal(
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
                    style={{ backdropFilter: 'blur(6px)', backgroundColor: 'rgba(0,0,0,0.5)' }}
                    onClick={() => setSelectedCustomer(null)}
                >
                    <div
                        className={`relative w-full max-w-sm rounded-3xl shadow-2xl border p-6 space-y-4 overflow-hidden ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Top stripe */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-t-3xl" />

                        {/* Close */}
                        <button
                            onClick={() => setSelectedCustomer(null)}
                            className={`absolute top-4 right-4 p-1.5 rounded-full transition-colors ${darkMode ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
                        >
                            <X size={16} />
                        </button>

                        {/* Avatar + Name */}
                        <div className="flex items-center gap-4 pt-2">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-blue-500/30">
                                {selectedCustomer.name?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div>
                                <h3 className={`text-lg font-bold ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>{selectedCustomer.name}</h3>
                                {selectedCustomer.companyName && (
                                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                        <Building2 size={12} /> {selectedCustomer.companyName}
                                    </p>
                                )}
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1 inline-block ${selectedCustomer.type === 'organization' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'
                                    }`}>{selectedCustomer.type === 'organization' ? t.organizationType : t.individualType}</span>
                            </div>
                        </div>

                        {/* Info rows */}
                        <div className={`space-y-3 rounded-2xl p-4 ${darkMode ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
                            {selectedCustomer.phone && (
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center">
                                        <Phone size={14} className="text-emerald-600" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-400 uppercase tracking-wide">{t.phoneLabel}</p>
                                        <a href={`tel:${selectedCustomer.phone}`} className="text-sm font-semibold text-emerald-500 hover:underline">{selectedCustomer.phone}</a>
                                    </div>
                                </div>
                            )}
                            {selectedCustomer.address && (
                                <a
                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedCustomer.address)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`flex items-center gap-3 rounded-xl transition-colors hover:bg-blue-50 dark:hover:bg-slate-600/40 -mx-1 px-1 py-1`}
                                >
                                    <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                                        <MapPin size={12} className="text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-400 uppercase tracking-wide">{t.addressPlaceholder}</p>
                                        <p className={`text-sm font-medium hover:underline ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>{selectedCustomer.address}</p>
                                    </div>
                                </a>
                            )}
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center">
                                    <CreditCard size={14} className="text-rose-600" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">{t.remainingDebtAmount}</p>
                                    <p className="text-sm font-bold text-rose-500">${(selectedCustomer.debt || 0).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className={`p-3 rounded-2xl text-center ${darkMode ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
                                <p className="text-[10px] text-slate-400 uppercase tracking-wide">{t.totalPurchaseAmount}</p>
                                <p className={`text-lg font-bold mt-0.5 ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>${(selectedCustomer.totalPurchases || 0).toLocaleString()}</p>
                            </div>
                            <div className={`p-3 rounded-2xl text-center ${darkMode ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
                                <p className="text-[10px] text-slate-400 uppercase tracking-wide">{t.totalPaidAmount}</p>
                                <p className="text-lg font-bold mt-0.5 text-emerald-500">${(selectedCustomer.totalPaid || 0).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div >
                , document.body)
            }
        </>
    );
};

const StatCard = memo(({ title, value, icon: Icon, color, trend, trendType = 'up', delay, darkMode }) => {
    const blobColor = color.includes('blue') ? 'bg-blue-400' :
        color.includes('amber') ? 'bg-amber-400' :
            color.includes('orange') ? 'bg-orange-400' :
                color.includes('rose') ? 'bg-rose-400' :
                    color.includes('emerald') ? 'bg-emerald-400' : 'bg-indigo-400';

    const trendStyles = {
        up: { cls: 'text-emerald-500', Icon: ArrowUpRight },
        down: { cls: 'text-rose-500', Icon: ArrowDownRight },
        neutral: { cls: 'text-amber-500', Icon: Minus },
        info: { cls: 'text-blue-500', Icon: ArrowUpRight },
    };
    const ts = trendStyles[trendType] || trendStyles.up;
    const TrendIcon = ts.Icon;

    return (
        <div
            className={`p-6 rounded-3xl shadow-sm border flex flex-col justify-between h-36 relative overflow-hidden group hover:shadow-lg transition-all duration-500 hover:-translate-y-1 animate-slide-in opacity-0 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'
                }`}
            style={{ animationDelay: delay, animationFillMode: 'forwards' }}
        >
            <div className="flex justify-between items-start z-10">
                <div>
                    <p className="text-slate-500 text-[10px] sm:text-sm font-black uppercase tracking-widest">{title}</p>
                    <h3 className={`font-black tracking-tighter group-hover:scale-105 transition-transform origin-left ${darkMode ? 'text-slate-100' : 'text-slate-800'} ${
                        String(value).length > 12 ? 'text-xl sm:text-2xl mt-1' : 
                        String(value).length > 8 ? 'text-2xl sm:text-3xl mt-1.5' : 
                        'text-3xl sm:text-4xl mt-2'
                    }`}>{value}</h3>
                </div>
                <div className={`p-3 rounded-2xl ${color} bg-opacity-20 backdrop-blur-sm transition-transform group-hover:rotate-12`}>
                    <Icon size={24} />
                </div>
            </div>
            <div className={`mt-auto flex items-center gap-1 text-xs font-medium z-10 ${ts.cls}`}>
                <TrendIcon size={14} />
                <span>{trend}</span>
            </div>

            {/* Decorative Background Blob */}
            <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-10 blur-2xl transition-all duration-700 group-hover:scale-150 ${blobColor}`}></div>
        </div>
    );
});

StatCard.displayName = 'StatCard';

export default Dashboard;
