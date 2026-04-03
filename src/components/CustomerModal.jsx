import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, MapPin, User, Phone, Package } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import useScrollLock from '../hooks/useScrollLock';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const LocationPicker = ({ position, onLocationSelect }) => {
    const map = useMapEvents({
        click(e) {
            onLocationSelect(e.latlng);
        },
    });

    return position ? <Marker position={position} /> : null;
};

const CustomerModal = ({ isOpen, onClose, onSave, customer, darkMode, t }) => {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        type: 'regular',
        address: '',
        lat: 41.2995, // Default Tashkent
        lng: 69.2401,
        telegram: ''
    });

    useScrollLock(isOpen);

    useEffect(() => {
        if (customer) {
            setFormData({
                name: customer.name || '',
                phone: customer.phone || '',
                type: customer.type || 'regular',
                address: customer.address || '',
                lat: customer.lat || 41.2995,
                lng: customer.lng || 69.2401,
                companyName: customer.companyName || '',
                telegram: customer.telegram || ''
            });
        } else {
            // Reset for new customer
            setFormData({
                name: '',
                phone: '',
                type: 'regular',
                address: '',
                lat: 41.2995,
                lng: 69.2401,
                companyName: '',
                telegram: ''
            });
        }
    }, [customer, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    const fetchAddress = async (lat, lng) => {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            const data = await response.json();
            if (data && data.display_name) {
                setFormData(prev => ({ ...prev, address: data.display_name }));
            }
        } catch (error) {
            console.error("Error fetching address:", error);
        }
    };

    const fetchCoordinates = async (address) => {
        if (!address) return;
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
            const data = await response.json();
            if (data && data.length > 0) {
                const { lat, lon } = data[0];
                setFormData(prev => ({
                    ...prev,
                    lat: parseFloat(lat),
                    lng: parseFloat(lon)
                }));
            }
        } catch (error) {
            console.error("Error fetching coordinates:", error);
        }
    };

    const handleLocationSelect = (latlng) => {
        setFormData(prev => ({
            ...prev,
            lat: latlng.lat,
            lng: latlng.lng
        }));
        fetchAddress(latlng.lat, latlng.lng);
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className={`w-[98%] sm:w-[95%] md:w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh] m-auto ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>

                {/* Header */}
                <div className={`p-6 border-b flex justify-between items-center ${darkMode ? 'border-slate-700' : 'border-slate-100'}`}>
                    <h2 className={`text-xl font-semibold ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                        {customer ? t.editCustomer : t.addCustomer}
                    </h2>
                    <button onClick={onClose} className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <form id="customer-form" onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Left Column: Details */}
                            <div className="space-y-4">
                                <div>
                                    <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{t.name}</label>
                                    <div className="relative">
                                        <User className={`absolute left-3 top-3 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`} size={18} />
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            className={`w-full pl-10 pr-4 py-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                                            placeholder={t.name}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{t.phone}</label>
                                    <div className="relative">
                                        <Phone className={`absolute left-3 top-3 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`} size={18} />
                                        <input
                                            type="text"
                                            value={formData.phone}
                                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                            className={`w-full pl-10 pr-4 py-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                                            placeholder="+998..."
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{t.telegram}</label>
                                    <input
                                        type="text"
                                        value={formData.telegram || ''}
                                        onChange={e => setFormData({ ...formData, telegram: e.target.value })}
                                        className={`w-full px-4 py-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                                        placeholder="@mijoz_tele"
                                    />
                                </div>

                                <div>
                                    <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{t.customerType}</label>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, type: 'regular' })}
                                            className={`flex-1 py-2.5 rounded-xl border transition-all text-sm font-black uppercase tracking-widest ${formData.type === 'regular'
                                                ? (darkMode ? 'bg-white text-slate-900 border-white' : 'bg-slate-100 border-slate-300 text-slate-800 shadow-sm')
                                                : (darkMode ? 'bg-slate-700 border-slate-600 text-slate-400' : 'bg-white border-slate-200 text-slate-600')
                                                }`}
                                        >
                                            {t.regular}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, type: 'vip' })}
                                            className={`flex-1 py-2.5 rounded-xl border transition-all text-sm font-black uppercase tracking-widest ${formData.type === 'vip'
                                                ? (darkMode ? 'bg-amber-500 border-amber-500 text-slate-900' : 'bg-amber-400 border-amber-500 text-slate-900 shadow-lg shadow-amber-500/20')
                                                : (darkMode ? 'bg-slate-700 border-slate-600 text-slate-400' : 'bg-white border-slate-200 text-slate-600')
                                                }`}
                                        >
                                            VIP
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, type: 'organization' })}
                                            className={`flex-1 py-2.5 rounded-xl border transition-all text-sm font-black uppercase tracking-widest ${formData.type === 'organization'
                                                ? (darkMode ? 'bg-blue-600 border-blue-600 text-white' : 'bg-blue-600 border-blue-700 text-white shadow-lg shadow-blue-500/20')
                                                : (darkMode ? 'bg-slate-700 border-slate-600 text-slate-400' : 'bg-white border-slate-200 text-slate-600')
                                                }`}
                                        >
                                            {t.organization}
                                        </button>
                                    </div>
                                </div>

                                {formData.type === 'organization' && (
                                    <div className="animate-fade-in">
                                        <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{t.organization} {t.name.toLowerCase()}</label>
                                        <div className="relative">
                                            <Package className={`absolute left-3 top-3 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`} size={18} />
                                            <input
                                                type="text"
                                                required={formData.type === 'organization'}
                                                value={formData.companyName || ''}
                                                onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                                                className={`w-full pl-10 pr-4 py-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                                                placeholder={t.organization}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{t.address}</label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <MapPin className={`absolute left-3 top-3 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`} size={18} />
                                            <input
                                                type="text"
                                                value={formData.address}
                                                onChange={e => setFormData({ ...formData, address: e.target.value })}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        fetchCoordinates(formData.address);
                                                    }
                                                }}
                                                className={`w-full pl-10 pr-4 py-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                                                placeholder={t.search}
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => fetchCoordinates(formData.address)}
                                            className={`px-4 py-2.5 rounded-xl border transition-all ${darkMode ? 'bg-slate-700 hover:bg-slate-600 border-slate-600 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600'}`}
                                        >
                                            {t.search.replace('...', '')}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Map */}
                            <div className="h-[250px] md:h-full md:min-h-[300px] rounded-xl overflow-hidden border relative z-0">
                                <MapContainer
                                    center={[formData.lat, formData.lng]}
                                    zoom={13}
                                    style={{ height: '100%', width: '100%' }}
                                >
                                    <TileLayer
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                    />
                                    <LocationPicker
                                        position={[formData.lat, formData.lng]}
                                        onLocationSelect={handleLocationSelect}
                                    />
                                </MapContainer>
                                <div className={`absolute bottom-2 left-2 right-2 p-2 rounded-lg text-xs text-center z-[1000] ${darkMode ? 'bg-slate-800/90 text-slate-300' : 'bg-white/90 text-slate-600'}`}>
                                    {t.coordinates}: {formData.lat.toFixed(6)}, {formData.lng.toFixed(6)}
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className={`p-6 border-t flex justify-end gap-3 ${darkMode ? 'border-slate-700' : 'border-slate-100'}`}>
                    <button
                        type="button"
                        onClick={onClose}
                        className={`px-5 py-2.5 rounded-xl font-medium transition-colors ${darkMode ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-100'}`}
                    >
                        {t.cancel}
                    </button>
                    <button
                        type="submit"
                        form="customer-form"
                        className="bg-blue-600 text-white px-6 py-2.5 rounded-xl hover:bg-blue-700 font-semibold shadow-lg shadow-blue-500/30 flex items-center gap-2"
                    >
                        <Save size={18} />
                        {t.save}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default CustomerModal;
