import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
    Check, X, Eye, Package, Truck, Search, User, Phone, Calendar, 
    AlertCircle, Trash2, Plus, Edit2, Lock, Share2, MapPin, Copy, ShoppingBag
} from 'lucide-react';
import { useConfirm } from '../../context/ConfirmContext';
import toast from 'react-hot-toast';
import './AdminOrderMedicine.css';
import '../admin/AdminPrescriptions.css'; // Leverage existing premium styles for the editor list

const AdminOrderMedicine = () => {
    const { showAlert } = useConfirm();
    
    // User info state
    const [userMobile, setUserMobile] = useState('');
    const [userName, setUserName] = useState('');
    const [userLookupLoading, setUserLookupLoading] = useState(false);
    const [userLookupError, setUserLookupError] = useState('');

    // Medicine items state
    const defaultItem = { 
        medicineName: '', 
        frequency: '', 
        time: '', 
        foodRelation: '', 
        intakeMethod: '', 
        quantity: 1, 
        price: '', 
        margPack: 0, 
        margBatch: '', 
        margExpiry: '', 
        margBillNo: '', 
        batches: [] 
    };
    const [verifiedItems, setVerifiedItems] = useState([{ ...defaultItem }]);
    const [errors, setErrors] = useState([]);
    const [searchingIndex, setSearchingIndex] = useState(null);
    const [suggestions, setSuggestions] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    // Address state
    const [shippingAddress, setShippingAddress] = useState({
        street: '',
        city: '',
        state: '',
        zip: '',
        phone: '',
        altPhone: ''
    });
    const [isDetecting, setIsDetecting] = useState(false);
    const [pharmacyConfig, setPharmacyConfig] = useState(null);

    // Comments & General states
    const [adminNote, setAdminNote] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [createdPrescription, setCreatedPrescription] = useState(null);

    useEffect(() => {
        fetchPharmacyConfig();
    }, []);

    const fetchPharmacyConfig = async () => {
        try {
            const res = await api.get('/settings/pharmacy/public');
            setPharmacyConfig(res.data);
        } catch (err) {
            console.error("Failed to fetch pharmacy config", err);
        }
    };

    // Auto lookup user by mobile (exactly when 10 digits are filled)
    useEffect(() => {
        const lookupUser = async () => {
            const cleanMobile = userMobile.replace(/\D/g, '');
            if (cleanMobile.length === 10) {
                setUserLookupLoading(true);
                setUserLookupError('');
                try {
                    const res = await api.get(`/prescriptions/user-lookup/${cleanMobile}`);
                    setUserName(res.data.name);
                    setShippingAddress(prev => ({ ...prev, phone: cleanMobile }));
                    toast.success(`Registered User Found: ${res.data.name}`);
                } catch (err) {
                    setUserName('');
                    setUserLookupError('User not registered. A new guest profile will be automatically registered.');
                    setShippingAddress(prev => ({ ...prev, phone: cleanMobile }));
                } finally {
                    setUserLookupLoading(false);
                }
            } else {
                setUserName('');
                setUserLookupError('');
            }
        };
        lookupUser();
    }, [userMobile]);

    // Handle Google Maps Location Detection
    const handleDetectLocation = () => {
        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by your browser");
            return;
        }

        setIsDetecting(true);
        toast.loading("Detecting location...", { id: 'detect-location' });
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
                    const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`);
                    const data = await response.json();

                    if (data.status === 'OK' && data.results[0]) {
                        const components = data.results[0].address_components;
                        let street = data.results[0].formatted_address;
                        let city = '';
                        let state = '';
                        let zip = '';

                        components.forEach(c => {
                            if (c.types.includes('locality')) city = c.long_name;
                            if (c.types.includes('administrative_area_level_1')) state = c.long_name;
                            if (c.types.includes('postal_code')) zip = c.long_name;
                        });

                        setShippingAddress(prev => ({
                            ...prev,
                            street,
                            city: city || prev.city,
                            state: state || prev.state,
                            zip: zip || prev.zip
                        }));
                        toast.success("Location auto-detected successfully!", { id: 'detect-location' });
                    } else {
                        toast.error("Failed to parse address. Enter manually.", { id: 'detect-location' });
                    }
                } catch (error) {
                    console.error("Location detection error:", error);
                    toast.error("Error reverse-geocoding coordinates.", { id: 'detect-location' });
                } finally {
                    setIsDetecting(false);
                }
            },
            (error) => {
                setIsDetecting(false);
                toast.dismiss('detect-location');
                toast.error("Geolocation access failed or denied.");
            }
        );
    };

    // MARG ERP Product Search & Auto-complete handlers
    const handleAddItem = () => {
        setVerifiedItems([...verifiedItems, { ...defaultItem }]);
    };

    const handleRemoveItem = (index) => {
        const newItems = verifiedItems.filter((_, i) => i !== index);
        setVerifiedItems(newItems.length ? newItems : [{ ...defaultItem }]);
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...verifiedItems];
        newItems[index][field] = value;
        setVerifiedItems(newItems);
        // Clear error if typing
        if (errors.includes(index)) {
            setErrors(errors.filter(e => e !== index));
        }

        // Handle Medicine Name Autocomplete Search
        if (field === 'medicineName') {
            newItems[index].margPID = undefined;
            newItems[index].batches = [];
            newItems[index].margBatch = '';
            newItems[index].margExpiry = '';
            newItems[index].isManualAllowed = false;

            if (value.length > 2) {
                searchMargProducts(index, value);
            } else {
                setSuggestions([]);
                setSearchingIndex(null);
            }
        }
    };

    let searchTimeout;
    const searchMargProducts = (index, query) => {
        setSearchingIndex(index);
        setIsSearching(true);
        if (searchTimeout) clearTimeout(searchTimeout);
        
        searchTimeout = setTimeout(async () => {
            try {
                const res = await api.get(`/marg/search-products?search=${query}`);
                const products = res.data.products || [];
                setSuggestions(products);
                
                if (products.length === 0) {
                    setVerifiedItems(prev => {
                        const updated = [...prev];
                        if (updated[index]) {
                            updated[index].isManualAllowed = true;
                        }
                        return updated;
                    });
                }
            } catch (err) {
                console.error("MARG Search failed", err);
                setVerifiedItems(prev => {
                    const updated = [...prev];
                    if (updated[index]) {
                        updated[index].isManualAllowed = true;
                    }
                    return updated;
                });
            } finally {
                setIsSearching(false);
            }
        }, 300);
    };

    const handleSelectProduct = (index, product) => {
        const newItems = [...verifiedItems];
        newItems[index] = {
            ...newItems[index],
            medicineName: product.Name,
            price: product.mrp || product.rateA || 0,
            fulfillmentStatus: product.totalStock > 0 ? 'In Stock' : 'Shortlisted',
            margPID: product.PID,
            margPack: product.Pack || 0,
            batches: product.stocks || []
        };
        
        if (product.stocks && product.stocks.length > 0) {
            newItems[index].margBatch = product.stocks[0].Batch || '';
            if (product.stocks[0].Expiry) {
                newItems[index].margExpiry = new Date(product.stocks[0].Expiry).toISOString().split('T')[0] || '';
            }
            newItems[index].price = product.stocks[0].MRP || product.stocks[0].RateA || newItems[index].price;
        }

        setVerifiedItems(newItems);
        setSuggestions([]);
        setSearchingIndex(null);
        toast.success(`Selected product: ${product.Name}`);
    };

    // Copy checkout payment link
    const handleCopyLink = () => {
        if (!createdPrescription) return;
        const url = `${window.location.origin}/checkout/${createdPrescription._id}`;
        navigator.clipboard.writeText(url);
        toast.success('Checkout link copied successfully!');
    };

    // Manual creation submit handler
    const handleSubmit = async (e) => {
        e.preventDefault();

        // 1. Mobile verification
        const cleanMobile = userMobile.replace(/\D/g, '');
        if (cleanMobile.length !== 10) {
            toast.error("Please enter a valid 10-digit mobile number.");
            return;
        }

        // 2. Validate complete address fields
        if (!shippingAddress.street || !shippingAddress.city || !shippingAddress.state || !shippingAddress.zip) {
            toast.error("Complete delivery address (Street, City, State, Pin Code) is required.");
            return;
        }

        // 3. Serviceable area checks
        const userPincode = shippingAddress.zip.trim();
        if (pharmacyConfig?.acceptedPincodes && pharmacyConfig.acceptedPincodes.trim() !== '') {
            const allowedPincodes = pharmacyConfig.acceptedPincodes.split(',').map(pin => pin.trim());
            if (!allowedPincodes.includes(userPincode)) {
                toast.error(`Sorry, we do not deliver to this pin code. Serviceable pin codes are: ${allowedPincodes.join(', ')}`);
                return;
            }
        }

        // 4. Validate medicine items list
        const newErrors = [];
        verifiedItems.forEach((item, index) => {
            if (!item.frequency || !item.time || !item.foodRelation || !item.intakeMethod || !item.medicineName || !item.quantity || item.price === '' || item.price === null || item.price === undefined) {
                newErrors.push(index);
            }
        });
        if (newErrors.length > 0) {
            setErrors(newErrors);
            toast.error("Please fill all details and dosage instructions for all medicines.");
            return;
        }

        setSubmitting(true);
        try {
            const res = await api.post('/prescriptions/admin-create', {
                userMobile: cleanMobile,
                userName: userName || 'Guest User',
                shippingAddress,
                verifiedItems,
                adminNote
            });
            setCreatedPrescription(res.data);
            toast.success("Manual Medicine Order created successfully!");
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to generate admin order');
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setCreatedPrescription(null);
        setUserMobile('');
        setUserName('');
        setShippingAddress({
            street: '',
            city: '',
            state: '',
            zip: '',
            phone: '',
            altPhone: ''
        });
        setVerifiedItems([{ ...defaultItem }]);
        setErrors([]);
        setAdminNote('');
    };

    if (createdPrescription) {
        const checkoutUrl = `${window.location.origin}/checkout/${createdPrescription._id}`;
        return (
            <div className="admin-order-medicine-premium">
                <header className="page-header-admin">
                    <div className="title-area">
                        <h1>Order Generated Successfully!</h1>
                        <p>Share checkout payment link directly with the customer</p>
                    </div>
                </header>
                <div className="glass-card-admin order-success-card">
                    <div className="success-icon-circle">
                        <Check size={48} />
                    </div>
                    <h2>Medicine Order generated!</h2>
                    <p style={{ color: '#475569', maxWidth: '600px', fontSize: '1.05rem' }}>
                        Manual order has been successfully created under <b>{userName || 'Guest User'}</b> ({userMobile}).
                        The order defaults to a <b>Verified</b> status and is awaiting payment completion from the user.
                    </p>

                    <div className="checkout-link-box">
                        <span className="checkout-link-text">{checkoutUrl}</span>
                        <button className="btn-copy" onClick={handleCopyLink}>
                            <Copy size={16} /> Copy
                        </button>
                    </div>

                    <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
                        <a 
                            href={checkoutUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            style={{ textDecoration: 'none' }}
                        >
                            <button className="btn-copy" style={{ background: '#2563eb', padding: '12px 24px', fontSize: '0.95rem' }}>
                                <Share2 size={16} /> Open Checkout page
                            </button>
                        </a>
                        <button className="btn-primary-action" onClick={resetForm}>
                            Create Another Order
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-order-medicine-premium">
            <header className="page-header-admin">
                <div className="title-area">
                    <h1>Manual Order Generation</h1>
                    <p>Create a pharmacy order directly on behalf of a user</p>
                </div>
            </header>

            <form onSubmit={handleSubmit} className="glass-card-admin">
                
                {/* Section 1: Customer Profile */}
                <section>
                    <div className="form-section-header">
                        <User size={18} />
                        <span>Customer Profile Identification</span>
                    </div>
                    <div className="grid-2-col">
                        <div className="input-group-premium">
                            <label>Customer Mobile Number (10 digit)</label>
                            <input 
                                type="text" 
                                value={userMobile}
                                onChange={(e) => setUserMobile(e.target.value.replace(/\D/g, '').substring(0, 10))}
                                placeholder="Enter mobile number..."
                                required
                            />
                            {userLookupLoading && <span style={{ fontSize: '0.8rem', color: '#3b82f6' }}>Looking up database records...</span>}
                            {userLookupError && <span style={{ fontSize: '0.8rem', color: '#ea580c' }}>{userLookupError}</span>}
                        </div>
                        <div className="input-group-premium">
                            <label>Customer Full Name</label>
                            <input 
                                type="text" 
                                value={userName}
                                onChange={(e) => setUserName(e.target.value)}
                                placeholder="Enter customer name..."
                                required
                            />
                        </div>
                    </div>
                </section>

                {/* Section 2: Delivery Address details */}
                <section>
                    <div className="form-section-header" style={{ justifyContent: 'space-between', display: 'flex' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <MapPin size={18} />
                            <span>Delivery Shipping Address</span>
                        </div>
                        <button 
                            type="button" 
                            className="btn-detect" 
                            onClick={handleDetectLocation}
                            disabled={isDetecting}
                        >
                            <MapPin size={14} /> {isDetecting ? "Auto Fetching..." : "Detect via Google Maps"}
                        </button>
                    </div>
                    <div className="input-group-premium" style={{ marginBottom: '20px' }}>
                        <label>Street Address</label>
                        <input 
                            type="text" 
                            value={shippingAddress.street}
                            onChange={(e) => setShippingAddress({ ...shippingAddress, street: e.target.value })}
                            placeholder="Apartment, block, street, landmark details..."
                            required
                        />
                    </div>
                    <div className="grid-2-col">
                        <div className="input-group-premium">
                            <label>City</label>
                            <input 
                                type="text" 
                                value={shippingAddress.city}
                                onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                                placeholder="Enter City..."
                                required
                            />
                        </div>
                        <div className="input-group-premium">
                            <label>State</label>
                            <input 
                                type="text" 
                                value={shippingAddress.state}
                                onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                                placeholder="Enter State..."
                                required
                            />
                        </div>
                        <div className="input-group-premium">
                            <label>Pin Code (Serviceability Whitelist Checked)</label>
                            <input 
                                type="text" 
                                value={shippingAddress.zip}
                                onChange={(e) => setShippingAddress({ ...shippingAddress, zip: e.target.value.replace(/\D/g, '').substring(0, 6) })}
                                placeholder="Enter 6-digit Pincode..."
                                required
                            />
                        </div>
                        <div className="input-group-premium">
                            <label>Alternate Mobile Number (Optional)</label>
                            <input 
                                type="text" 
                                value={shippingAddress.altPhone}
                                onChange={(e) => setShippingAddress({ ...shippingAddress, altPhone: e.target.value.replace(/\D/g, '').substring(0, 10) })}
                                placeholder="Enter alternative contact..."
                            />
                        </div>
                    </div>
                </section>

                {/* Section 3: Medicine entry list */}
                <section>
                    <div className="form-section-header">
                        <ShoppingBag size={18} />
                        <span>Medicines & Prescription Specifications</span>
                    </div>

                    <div className="admin-prescriptions-premium" style={{ background: 'none', padding: 0, minHeight: 'auto' }}>
                        <div className="medicines-editor">
                            {verifiedItems.map((item, index) => (
                                <div key={index} className="medicine-row-premium" style={{ flexDirection: 'column', gap: '15px', border: '1px solid #cbd5e0', background: '#f8fafc', padding: '20px', borderRadius: '16px' }}>
                                    <div style={{ display: 'flex', gap: '10px', width: '100%', alignItems: 'flex-end' }}>
                                        <div className="input-group-p name" style={{ flex: 1, position: 'relative' }}>
                                            <label>Medicine Name</label>
                                            <input 
                                                type="text" 
                                                value={item.medicineName}
                                                onChange={(e) => handleItemChange(index, 'medicineName', e.target.value)}
                                                placeholder="Search MARG ERP..."
                                                autoComplete="off"
                                                style={{ borderColor: errors.includes(index) && !item.medicineName ? '#ef4444' : undefined }}
                                            />
                                            {searchingIndex === index && (suggestions.length > 0 || isSearching) && (
                                                <div className="marg-suggestions-dropdown">
                                                    {isSearching && <div className="suggestion-loading">Searching MARG...</div>}
                                                    {suggestions.map((p) => (
                                                        <div 
                                                            key={p.PID} 
                                                            className="suggestion-item"
                                                            onClick={() => handleSelectProduct(index, p)}
                                                        >
                                                            <div className="s-info">
                                                                <span className="s-name">{p.Name}</span>
                                                                <span className="s-meta">{p.Unit} | {p.Pack} Pack</span>
                                                            </div>
                                                            <div className="s-pricing">
                                                                <span className="s-price">₹{p.mrp || p.rateA || 0}</span>
                                                                <span className={`s-stock ${p.totalStock > 0 ? 'in' : 'out'}`}>
                                                                    {p.totalStock > 0 ? `${p.totalStock} in stock` : 'Out of Stock'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {!isSearching && suggestions.length === 0 && (
                                                        <div className="suggestion-item no-match" style={{ padding: '12px', textAlign: 'center', color: '#ea580c', fontWeight: '600', cursor: 'pointer' }} onClick={() => {
                                                            const newItems = [...verifiedItems];
                                                            newItems[index].isManualAllowed = true;
                                                            setVerifiedItems(newItems);
                                                            setSuggestions([]);
                                                            setSearchingIndex(null);
                                                            toast.success("Manual entry unlocked for this item!");
                                                        }}>
                                                            ⚠️ No MARG products found. Click here to allow manual entry.
                                                        </div>
                                                    )}
                                                    {!isSearching && suggestions.length > 0 && (
                                                        <div className="suggestion-item custom-fallback" style={{ borderTop: '1px dashed #cbd5e1', padding: '10px', textAlign: 'center', color: '#3b82f6', fontWeight: '600', cursor: 'pointer' }} onClick={() => {
                                                            const newItems = [...verifiedItems];
                                                            newItems[index].isManualAllowed = true;
                                                            setVerifiedItems(newItems);
                                                            setSuggestions([]);
                                                            setSearchingIndex(null);
                                                            toast.success("Manual entry unlocked for this item!");
                                                        }}>
                                                            ➕ Not in list? Force unlock manual entry
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <div className="input-group-p qty" style={{ width: '70px', position: 'relative' }}>
                                            <label>Qty (Tabs)</label>
                                            <input 
                                                type="number" 
                                                value={item.quantity}
                                                onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                                onWheel={(e) => e.target.blur()}
                                                min="1"
                                                style={{ borderColor: errors.includes(index) && (!item.quantity) ? '#ef4444' : undefined }}
                                            />
                                            {item.margPack > 1 && item.quantity > 0 && (
                                                <div style={{ position: 'absolute', top: '100%', left: '0', fontSize: '0.65rem', color: '#10b981', whiteSpace: 'nowrap', marginTop: '2px', fontWeight: '600' }}>
                                                    {Math.floor(item.quantity / item.margPack)} Strip, {item.quantity % item.margPack} Tab
                                                </div>
                                            )}
                                        </div>
                                        <div className="input-group-p status" style={{ width: '120px' }}>
                                            <label>Fulfillment</label>
                                            <select 
                                                value={item.fulfillmentStatus || 'In Stock'} 
                                                onChange={(e) => handleItemChange(index, 'fulfillmentStatus', e.target.value)}
                                                style={{ padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0', width: '100%', fontSize: '0.9rem' }}
                                            >
                                                <option value="In Stock">In Stock (Pack)</option>
                                                <option value="Shortlisted">Shortlist (Wait)</option>
                                            </select>
                                        </div>
                                        {item.fulfillmentStatus === 'Shortlisted' && (
                                            <div className="input-group-p eta" style={{ width: '80px' }}>
                                                <label>Days</label>
                                                <input 
                                                    type="number" 
                                                    value={item.estimatedArrivalDays || ''}
                                                    onChange={(e) => handleItemChange(index, 'estimatedArrivalDays', e.target.value)}
                                                    onWheel={(e) => e.target.blur()}
                                                    placeholder="ETA"
                                                    min="1"
                                                />
                                            </div>
                                        )}
                                        <div className="input-group-p price" style={{ width: '90px' }}>
                                            <label>Price (₹)</label>
                                            <input 
                                                type="number" 
                                                value={item.price}
                                                onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                                                onWheel={(e) => e.target.blur()}
                                                placeholder="Auto"
                                                min="0"
                                                style={{ borderColor: errors.includes(index) && (item.price === '' || item.price === null || item.price === undefined) ? '#ef4444' : undefined }}
                                            />
                                        </div>
                                        {verifiedItems.length > 1 && (
                                            <button type="button" className="btn-remove" style={{ padding: '10px' }} onClick={() => handleRemoveItem(index)}>
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', width: '100%', flexWrap: 'wrap', backgroundColor: '#ffffff', padding: '12px', borderRadius: '8px', border: errors.includes(index) ? '1px solid #ef4444' : 'none' }}>
                                        <div className="input-group-p" style={{ flex: 1, minWidth: '120px' }}>
                                            <label style={{ fontSize: '0.75rem' }}>Frequency</label>
                                            <select value={item.frequency || ''} onChange={(e) => handleItemChange(index, 'frequency', e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: errors.includes(index) && !item.frequency ? '1px solid #ef4444' : '1px solid #cbd5e0', width: '100%', fontSize: '0.85rem' }}>
                                                <option value="" disabled>Select...</option>
                                                <option value="once a day">Once a day</option>
                                                <option value="twice a day">Twice a day</option>
                                                <option value="thrice a day">Thrice a day</option>
                                                <option value="four times a day">Four times a day</option>
                                                <option value="as needed">As needed</option>
                                            </select>
                                        </div>
                                        <div className="input-group-p" style={{ flex: 2, minWidth: '220px' }}>
                                            <label style={{ fontSize: '0.75rem' }}>Time (Multi-select)</label>
                                            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '4px' }}>
                                                {['morning', 'afternoon', 'evening', 'night'].map(t => {
                                                    const isSelected = item.time?.includes(t);
                                                    return (
                                                        <button 
                                                            key={t}
                                                            type="button"
                                                            onClick={() => {
                                                                let maxTimes = 1;
                                                                const freq = item.frequency || 'once a day';
                                                                if (freq === 'twice a day') maxTimes = 2;
                                                                else if (freq === 'thrice a day') maxTimes = 3;
                                                                else if (freq === 'four times a day') maxTimes = 4;
                                                                else if (freq === 'as needed') maxTimes = 4;

                                                                let currentTimes = item.time ? item.time.split(',').map(x=>x.trim()).filter(x=>x) : [];
                                                                
                                                                if (currentTimes.includes(t)) {
                                                                    currentTimes = currentTimes.filter(x => x !== t);
                                                                } else {
                                                                    if (maxTimes === 1) {
                                                                        currentTimes = [t];
                                                                    } else if (currentTimes.length < maxTimes) {
                                                                        currentTimes.push(t);
                                                                    } else {
                                                                        currentTimes.shift();
                                                                        currentTimes.push(t);
                                                                    }
                                                                }
                                                                handleItemChange(index, 'time', currentTimes.join(', '));
                                                            }}
                                                            style={{
                                                                padding: '4px 8px',
                                                                borderRadius: '12px',
                                                                border: isSelected ? '1px solid #3b82f6' : (errors.includes(index) && !item.time ? '1px solid #ef4444' : '1px solid #cbd5e0'),
                                                                backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
                                                                color: isSelected ? '#1d4ed8' : (errors.includes(index) && !item.time ? '#ef4444' : '#64748b'),
                                                                fontSize: '0.75rem',
                                                                cursor: 'pointer',
                                                                textTransform: 'capitalize',
                                                                fontWeight: isSelected ? '600' : 'normal'
                                                            }}
                                                        >
                                                            {t}
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                        <div className="input-group-p" style={{ flex: 1, minWidth: '120px' }}>
                                            <label style={{ fontSize: '0.75rem' }}>Food Relation</label>
                                            <select value={item.foodRelation || ''} onChange={(e) => handleItemChange(index, 'foodRelation', e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: errors.includes(index) && !item.foodRelation ? '1px solid #ef4444' : '1px solid #cbd5e0', width: '100%', fontSize: '0.85rem' }}>
                                                <option value="" disabled>Select...</option>
                                                <option value="before food">Before food</option>
                                                <option value="after food">After food</option>
                                                <option value="empty stomach">Empty stomach</option>
                                                <option value="with food">With food</option>
                                            </select>
                                        </div>
                                        <div className="input-group-p" style={{ flex: 1, minWidth: '100px' }}>
                                            <label style={{ fontSize: '0.75rem' }}>Intake Method</label>
                                            <select value={item.intakeMethod || ''} onChange={(e) => handleItemChange(index, 'intakeMethod', e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: errors.includes(index) && !item.intakeMethod ? '1px solid #ef4444' : '1px solid #cbd5e0', width: '100%', fontSize: '0.85rem' }}>
                                                <option value="" disabled>Select...</option>
                                                <option value="with water">With water</option>
                                                <option value="with milk">With milk</option>
                                                <option value="dry">Dry</option>
                                                <option value="dissolved in water">Dissolve in water</option>
                                            </select>
                                        </div>
                                        <div className="input-group-p" style={{ flex: 1, minWidth: '120px' }}>
                                            <label style={{ fontSize: '0.75rem' }}>Batch</label>
                                            {item.batches && item.batches.length > 0 ? (
                                                <select 
                                                    value={item.margBatch || ''} 
                                                    onChange={(e) => {
                                                        const b = item.batches.find(x => x.Batch === e.target.value);
                                                        handleItemChange(index, 'margBatch', e.target.value);
                                                        if (b && b.Expiry) handleItemChange(index, 'margExpiry', new Date(b.Expiry).toISOString().split('T')[0]);
                                                        if (b && (b.MRP || b.RateA)) handleItemChange(index, 'price', b.MRP || b.RateA);
                                                    }} 
                                                    style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e0', width: '100%', fontSize: '0.85rem' }}
                                                >
                                                    <option value="">Select...</option>
                                                    {item.batches.map(b => (
                                                        <option key={b.Batch} value={b.Batch}>{b.Batch} (Stk: {b.Stock})</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <input 
                                                    type="text" 
                                                    value={item.margBatch || ''} 
                                                    onChange={(e) => handleItemChange(index, 'margBatch', e.target.value)} 
                                                    disabled={!item.isManualAllowed} 
                                                    style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e0', width: '100%', fontSize: '0.85rem', backgroundColor: (!item.isManualAllowed) ? '#f1f5f9' : '#ffffff' }} 
                                                    placeholder={(!item.isManualAllowed && !item.margPID) ? "Search MARG first..." : "Batch No"}
                                                />
                                            )}
                                        </div>
                                        <div className="input-group-p" style={{ flex: 1, minWidth: '120px' }}>
                                            <label style={{ fontSize: '0.75rem' }}>Expiry</label>
                                            <input 
                                                type="month" 
                                                value={item.margExpiry ? item.margExpiry.substring(0, 7) : ''} 
                                                onChange={(e) => handleItemChange(index, 'margExpiry', e.target.value)} 
                                                disabled={!item.isManualAllowed && !item.margPID} 
                                                style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e0', width: '100%', fontSize: '0.85rem', backgroundColor: (!item.isManualAllowed && !item.margPID) ? '#f1f5f9' : '#ffffff' }}
                                            />
                                        </div>
                                        <div className="input-group-p" style={{ flex: 1, minWidth: '100px' }}>
                                            <label style={{ fontSize: '0.75rem' }}>Bill No (VCN)</label>
                                            <input 
                                                type="text" 
                                                value={item.margBillNo || ''} 
                                                onChange={(e) => handleItemChange(index, 'margBillNo', e.target.value)} 
                                                disabled={!item.isManualAllowed} 
                                                style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e0', width: '100%', fontSize: '0.85rem', backgroundColor: (!item.isManualAllowed) ? '#f1f5f9' : '#ffffff' }} 
                                                placeholder={(!item.isManualAllowed && !item.margPID) ? "Search MARG first..." : "Auto/Man"}
                                            />
                                        </div>
                                        {errors.includes(index) && (
                                            <div style={{ width: '100%', color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', fontWeight: '500' }}>
                                                * Please complete all medicine details and dosage instructions.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            
                            <button type="button" className="btn-add-p" onClick={handleAddItem} style={{ marginTop: '15px' }}>
                                <Plus size={16} /> Add another item
                            </button>
                        </div>
                    </div>
                </section>

                {/* Section 4: Admin Note comments */}
                <section>
                    <div className="form-section-header">
                        <AlertCircle size={18} />
                        <span>Admin Comments & Specifications</span>
                    </div>
                    <div className="input-group-premium">
                        <textarea 
                            value={adminNote}
                            onChange={(e) => setAdminNote(e.target.value)}
                            placeholder="Add additional order creation comments or special handling instructions..."
                            rows="4"
                        />
                    </div>
                </section>

                <div className="action-footer" style={{ border: 'none', margin: '20px 0 0 0', padding: 0, position: 'static' }}>
                    <button 
                        type="submit" 
                        className="btn-approve-p" 
                        disabled={submitting}
                        style={{ width: '100%', height: '55px', fontSize: '1.05rem' }}
                    >
                        <Check size={20} /> {submitting ? "Generating Order..." : "Create manual checkout order"}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AdminOrderMedicine;
