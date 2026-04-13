import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { MapPin, Plus, Trash, Truck, Clock, Navigation, PlusCircle, LayoutGrid, ChevronRight, Settings } from 'lucide-react';
import './AdminDelivery.css';

const AdminDelivery = () => {
    const [routes, setRoutes] = useState([]);
    const [routeName, setRouteName] = useState('');
    const [stops, setStops] = useState(['']);
    const [selectedRoute, setSelectedRoute] = useState(null);
    const [buses, setBuses] = useState([]);
    const [newBus, setNewBus] = useState({ 
        busNumber: '', 
        timing: '', 
        mobileNumber: '', 
        comment: '', 
        image: '',
        stopTimings: [] 
    });
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [viewMode, setViewMode] = useState('empty'); // 'empty', 'create', 'details'
    const [showBusForm, setShowBusForm] = useState(false);

    useEffect(() => {
        fetchRoutes();
    }, []);

    const fetchRoutes = async () => {
        try {
            const res = await api.get('/delivery/routes');
            setRoutes(res.data.routes || res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('image', file);

        setUploading(true);
        try {
            const res = await api.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setNewBus({ ...newBus, image: res.data.imageUrl });
        } catch (err) {
            console.error(err);
            alert('Failed to upload image');
        } finally {
            setUploading(false);
        }
    };

    const handleAddStop = () => setStops([...stops, '']);
    
    const handleStopChange = (index, value) => {
        const newStops = [...stops];
        newStops[index] = value;
        setStops(newStops);
    };

    const handleRemoveStop = (index) => {
        if (stops.length > 1) {
            setStops(stops.filter((_, i) => i !== index));
        }
    };

    const handleCreateRoute = async (e) => {
        e.preventDefault();
        try {
            await api.post('/delivery/routes', { routeName, stops: stops.filter(s => s.trim() !== '') });
            setRouteName('');
            setStops(['']);
            fetchRoutes();
            setViewMode('empty');
        } catch (err) {
            alert('Failed to create route');
        }
    };

    const selectRoute = async (route) => {
        setSelectedRoute(route);
        setViewMode('details');
        fetchBuses(route._id);
    };

    const fetchBuses = async (routeId) => {
        try {
            const res = await api.get(`/delivery/routes/${routeId}/buses`);
            setBuses(res.data);
            const route = routes.find(r => r._id === routeId) || selectedRoute;
            
            // Get last bus to use timings as template
            const lastBus = res.data.length > 0 ? res.data[res.data.length - 1] : null;

            setShowBusForm(res.data.length === 0);
            setNewBus({
                busNumber: '', 
                mobileNumber: '', 
                comment: '', 
                image: '',
                timing: lastBus ? lastBus.timing : '',
                stopTimings: lastBus 
                    ? lastBus.stopTimings.map(st => ({ stopName: st.stopName, arrivalTime: st.arrivalTime, departureTime: st.departureTime }))
                    : (route ? route.stops.map(s => ({ stopName: s, arrivalTime: '', departureTime: '' })) : [])
            });
        } catch (err) {
            console.error(err);
        }
    };

    const handleStopTimingChange = (index, field, value) => {
        const updatedTimings = [...newBus.stopTimings];
        updatedTimings[index][field] = value;
        setNewBus({ ...newBus, stopTimings: updatedTimings });
    };

    const handleAddBus = async (e) => {
        e.preventDefault();
        try {
            await api.post('/delivery/buses', { ...newBus, routeId: selectedRoute._id });
            setShowBusForm(false);
            fetchBuses(selectedRoute._id);
            alert('Vehicle Deployed Successfully');
        } catch (err) {
            alert('Failed to add bus');
        }
    };

    return (
        <div className="admin-delivery-premium">
            <header className="page-header-admin">
                <div className="title-area">
                    <h1>Logistics Command Center</h1>
                    <p>Standardized management for routes and fleet scheduling</p>
                </div>
            </header>

            <div className="delivery-master-container">
                {/* 1. Master List: Route Navigator */}
                <aside className="route-navigator">
                    <div className="nav-header">
                        <div className="h-top">
                            <h3>Route Navigator</h3>
                            <span className="count-pill">{routes.length}</span>
                        </div>
                        <button className="btn-add-primary" onClick={() => setViewMode('create')}>
                            <Plus size={18} /> New Route Identity
                        </button>
                    </div>

                    <div className="nav-list">
                        {routes.map(r => (
                            <div 
                                key={r._id} 
                                className={`route-nav-item ${selectedRoute?._id === r._id && viewMode === 'details' ? 'active' : ''}`}
                                onClick={() => selectRoute(r)}
                            >
                                <div className="nav-item-icon">
                                    <Navigation size={18} />
                                </div>
                                <div className="nav-item-info">
                                    <span className="nav-name">{r.routeName}</span>
                                    <span className="nav-meta">{r.stops.length} Stops configured</span>
                                </div>
                                <ChevronRight size={16} className="arr-icon" />
                            </div>
                        ))}
                        {routes.length === 0 && !loading && (
                            <div className="nav-empty">No routes found</div>
                        )}
                    </div>
                </aside>

                {/* 2. Detail Workspace: Action Area */}
                <main className="delivery-workspace">
                    {viewMode === 'empty' && (
                        <div className="workspace-placeholder">
                            <div className="p-icon"><LayoutGrid size={48} /></div>
                            <h2>Welcome to Mission Control</h2>
                            <p>Select a route from the sidebar to manage its fleet, or initialize a new route identity to get started.</p>
                        </div>
                    )}

                    {viewMode === 'create' && (
                        <div className="workspace-card animate-fade-in">
                            <div className="w-header">
                                <PlusCircle className="text-primary" />
                                <div>
                                    <h3>Initialize Route Identity</h3>
                                    <p>Establish the foundation for a new logistics line</p>
                                </div>
                            </div>
                            <form onSubmit={handleCreateRoute} className="w-form">
                                <div className="w-group">
                                    <label>Route Identity Name</label>
                                    <input 
                                        type="text" 
                                        value={routeName} 
                                        onChange={(e) => setRouteName(e.target.value)}
                                        placeholder="e.g. North City Bypass (Line 104)"
                                        required
                                    />
                                </div>
                                <div className="w-group">
                                    <label>Defined Stops (Sequential Order)</label>
                                    <div className="stops-sequence">
                                        {stops.map((stop, index) => (
                                            <div key={index} className="stop-input-row">
                                                <div className="stop-idx">{index + 1}</div>
                                                <input 
                                                    type="text" 
                                                    value={stop} 
                                                    onChange={(e) => handleStopChange(index, e.target.value)}
                                                    placeholder="Enter location name"
                                                    required
                                                />
                                                {stops.length > 1 && (
                                                    <button type="button" className="btn-rem-stop" onClick={() => handleRemoveStop(index)}>
                                                        <Trash size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        <button type="button" className="btn-add-stop-w" onClick={handleAddStop}>
                                            <Plus size={16} /> Add Next Station
                                        </button>
                                    </div>
                                </div>
                                <div className="w-actions">
                                    <button type="button" className="btn-sec" onClick={() => setViewMode('empty')}>Cancel</button>
                                    <button type="submit" className="btn-pri">Activate Route Identity</button>
                                </div>
                            </form>
                        </div>
                    )}

                    {viewMode === 'details' && selectedRoute && (
                        <div className="workspace-details animate-fade-in">
                            <div className="details-header-card">
                                <div className="h-left-p">
                                    <Truck size={32} className="text-primary" />
                                    <div>
                                        <h2>{selectedRoute.routeName}</h2>
                                        <div className="h-stops-p">
                                            {selectedRoute.stops.map((s, i) => (
                                                <span key={i}>{s}{i < selectedRoute.stops.length - 1 ? ' → ' : ''}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="h-right-p">
                                    <div className="stat-box">
                                        <span className="s-val">{buses.length}</span>
                                        <span className="s-lbl">Deployed</span>
                                    </div>
                                </div>
                            </div>

                            <div className="fleet-management-sec">
                                <div className="fleet-header-row">
                                    <h3>Scheduled Fleet</h3>
                                    {!showBusForm && (
                                        <button className="btn-add-fleet-trigger" onClick={() => setShowBusForm(true)}>
                                            <Plus size={16} /> Deploy New Vehicle
                                        </button>
                                    )}
                                </div>

                                {showBusForm && (
                                    <div className="fleet-form-card">
                                        <h4>Vehicle Deployment Parameters</h4>
                                        <form onSubmit={handleAddBus} className="fleet-form-w">
                                            <div className="f-row">
                                                <div className="f-group">
                                                    <label>Bus / Van No.</label>
                                                    <input type="text" placeholder="RJ-14-XX-0000" value={newBus.busNumber} onChange={e => setNewBus({...newBus, busNumber: e.target.value})} required />
                                                </div>
                                                <div className="f-group">
                                                    <label>Driver Phone</label>
                                                    <input type="text" placeholder="+91 XXXXX XXXXX" value={newBus.mobileNumber} onChange={e => setNewBus({...newBus, mobileNumber: e.target.value})} required />
                                                </div>
                                            </div>
                                            <div className="f-row">
                                                <div className="f-group">
                                                    <label>Departure Time</label>
                                                    <input type="text" placeholder="08:30 AM" value={newBus.timing} onChange={e => setNewBus({...newBus, timing: e.target.value})} required />
                                                </div>
                                                <div className="f-group">
                                                    <label>Identity Image (Upload)</label>
                                                    <div className="up-box">
                                                        <input type="text" value={newBus.image} placeholder="Image URL..." readOnly />
                                                        <label className="up-lbl">
                                                            <input type="file" style={{display: 'none'}} onChange={handleFileUpload} />
                                                            {uploading ? '...' : <Plus size={14} />}
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="timing-schedule">
                                                <label>Stop-by-Stop Schedule</label>
                                                <div className="schedule-grid">
                                                    {newBus.stopTimings.map((st, idx) => (
                                                        <div key={idx} className="s-row">
                                                            <span className="s-name">{st.stopName}</span>
                                                            <input type="text" placeholder="Arr" value={st.arrivalTime} onChange={e => handleStopTimingChange(idx, 'arrivalTime', e.target.value)} />
                                                            <input type="text" placeholder="Dep" value={st.departureTime} onChange={e => handleStopTimingChange(idx, 'departureTime', e.target.value)} />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="f-actions">
                                                <button type="button" className="btn-sec" onClick={() => setShowBusForm(false)}>Discard</button>
                                                <button type="submit" className="btn-pri">Confirm Deployment</button>
                                            </div>
                                        </form>
                                    </div>
                                )}

                                <div className="fleet-grid">
                                    {buses.map(b => (
                                        <div key={b._id} className="vehicle-card-w">
                                            <div className="v-top">
                                                {b.image ? <img src={b.image} alt="Bus" /> : <div className="v-ph">🚌</div>}
                                                <div className="v-info">
                                                    <span className="v-no">{b.busNumber}</span>
                                                    <span className="v-ph-no">{b.mobileNumber}</span>
                                                </div>
                                            </div>
                                            <div className="v-sched">
                                                {b.stopTimings.slice(0, 3).map((st, i) => (
                                                    <div key={i} className="v-row-s">
                                                        <span>{st.stopName}</span>
                                                        <span>{st.arrivalTime} / {st.departureTime}</span>
                                                    </div>
                                                ))}
                                                {b.stopTimings.length > 3 && <p className="v-more">+{b.stopTimings.length - 3} more stations</p>}
                                            </div>
                                        </div>
                                    ))}
                                    {buses.length === 0 && !showBusForm && (
                                        <div className="empty-fleet-w">
                                            <p>No vehicles assigned to this route identity yet.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default AdminDelivery;
