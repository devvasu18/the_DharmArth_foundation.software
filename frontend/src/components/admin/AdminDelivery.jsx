import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { MapPin, Plus, Trash, Truck, Clock, Navigation, PlusCircle, LayoutGrid, ChevronRight, Settings, Edit2, Trash2, CheckCircle, AlertTriangle, X, Moon } from 'lucide-react';
import './AdminDelivery.css';

const AdminDelivery = () => {
    const [routes, setRoutes] = useState([]);
    const [routeName, setRouteName] = useState('');
    const [stops, setStops] = useState(['']);
    const [selectedRoute, setSelectedRoute] = useState(null);
    const [buses, setBuses] = useState([]);
    const [newBus, setNewBus] = useState({ 
        busNumber: '', 
        mobileNumber: '', 
        comment: '', 
        image: '',
        stopTimings: [] 
    });
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [viewMode, setViewMode] = useState('empty');
    const [showBusForm, setShowBusForm] = useState(false);
    const [editRouteId, setEditRouteId] = useState(null);

    // Custom Modal State
    const [modal, setModal] = useState({
        isOpen: false,
        type: 'success', 
        title: '',
        message: '',
        onConfirm: null
    });

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

    const triggerModal = (type, title, message, onConfirm = null) => {
        setModal({ isOpen: true, type, title, message, onConfirm });
    };

    const closeModal = () => setModal({ ...modal, isOpen: false });

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
            triggerModal('error', 'Upload Failed', 'There was an issue uploading the vehicle image.');
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

    const handleSaveRoute = async (e) => {
        e.preventDefault();
        try {
            const payload = { routeName, stops: stops.filter(s => s.trim() !== '') };
            if (editRouteId) {
                await api.put(`/delivery/routes/${editRouteId}`, payload);
                triggerModal('success', 'Route Updated', 'The transportation line identity has been successfully modified.');
            } else {
                await api.post('/delivery/routes', payload);
                triggerModal('success', 'Route Activated', 'A new logistics line has been established in your network.');
            }
            setRouteName('');
            setStops(['']);
            setEditRouteId(null);
            fetchRoutes();
            setViewMode('empty');
        } catch (err) {
            triggerModal('error', 'Action Failed', err.response?.data?.message || 'Failed to save the route identity.');
        }
    };

    const handleEditRoute = (e, route) => {
        e.stopPropagation();
        setEditRouteId(route._id);
        setRouteName(route.routeName);
        setStops(route.stops);
        setViewMode('create');
    };

    const handleDeleteRoute = (e, routeId) => {
        e.stopPropagation();
        triggerModal('confirm', 'Confirm Deletion', 'Are you sure you want to permanently remove this route identity? This action cannot be undone.', async () => {
            try {
                await api.delete(`/delivery/routes/${routeId}`);
                fetchRoutes();
                if (selectedRoute?._id === routeId) {
                    setSelectedRoute(null);
                    setViewMode('empty');
                }
                triggerModal('success', 'Route Deleted', 'The identity has been purged from the system.');
            } catch (err) {
                triggerModal('error', 'Deletion Blocked', err.response?.data?.message || 'Could not delete route.');
            }
        });
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
            
            setShowBusForm(res.data.length === 0);
            setNewBus({
                busNumber: '', 
                mobileNumber: '', 
                comment: '', 
                image: '',
                stopTimings: route ? route.stops.map(s => ({ 
                    stopName: s, 
                    arrivalTime: '', 
                    arrivalDayOffset: 0,
                    departureTime: '',
                    departureDayOffset: 0
                })) : []
            });
        } catch (err) {
            console.error(err);
        }
    };

    const handleStopTimingChange = (index, field, value) => {
        const updatedTimings = [...newBus.stopTimings];
        updatedTimings[index][field] = value;

        // Auto-detect Intra-Stop Midnight Rollover
        if (field === 'departureTime' || field === 'arrivalTime') {
            const arr = updatedTimings[index].arrivalTime;
            const dep = updatedTimings[index].departureTime;
            
            if (arr && dep) {
                const arrTotal = (parseInt(arr.split(':')[0]) * 60) + parseInt(arr.split(':')[1]);
                const depTotal = (parseInt(dep.split(':')[0]) * 60) + parseInt(dep.split(':')[1]);
                
                // If departure time is earlier than arrival time, it must be next day
                if (depTotal < arrTotal) {
                    updatedTimings[index].departureDayOffset = 1;
                } else {
                    // Reset if user corrects it to a later time
                    updatedTimings[index].departureDayOffset = updatedTimings[index].arrivalDayOffset;
                }
            }
        }
        
        setNewBus({ ...newBus, stopTimings: updatedTimings });
    };

    const handleDayOffsetToggle = (index, field) => {
        const updatedTimings = [...newBus.stopTimings];
        updatedTimings[index][field] = updatedTimings[index][field] === 0 ? 1 : 0;
        setNewBus({ ...newBus, stopTimings: updatedTimings });
    };

    const handleAddBus = async (e) => {
        e.preventDefault();
        try {
            await api.post('/delivery/buses', { ...newBus, routeId: selectedRoute._id });
            setShowBusForm(false);
            fetchBuses(selectedRoute._id);
            triggerModal('success', 'Fleet Expanded', 'Your vehicle has been successfully deployed and scheduled.');
        } catch (err) {
            triggerModal('error', 'Deployment Failed', 'There was a critical error while updating the route fleet.');
        }
    };

    return (
        <div className="admin-delivery-premium">
            {/* Custom Modal */}
            {modal.isOpen && (
                <div className="custom-modal-overlay">
                    <div className="custom-modal-card animate-pop-in">
                        <div className={`modal-icon-wrap ${modal.type}`}>
                            {modal.type === 'success' && <CheckCircle size={40} />}
                            {modal.type === 'error' && <AlertTriangle size={40} />}
                            {modal.type === 'confirm' && <Navigation size={40} />}
                        </div>
                        <h2>{modal.title}</h2>
                        <p>{modal.message}</p>
                        <div className="modal-actions-p">
                            {modal.type === 'confirm' ? (
                                <>
                                    <button className="btn-modal-cancel" onClick={closeModal}>Cancel</button>
                                    <button className="btn-modal-confirm" onClick={() => { modal.onConfirm(); closeModal(); }}>Confirm</button>
                                </>
                            ) : (
                                <button className="btn-modal-primary" onClick={closeModal}>Got it</button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <header className="page-header-admin">
                <div className="title-area">
                    <h1>Logistics Command Center</h1>
                    <p>Standardized management for routes and fleet scheduling</p>
                </div>
            </header>

            <div className="delivery-master-container">
                <aside className="route-navigator">
                    <div className="nav-header">
                        <div className="h-top">
                            <h3>Route Navigator</h3>
                            <span className="count-pill">{routes.length}</span>
                        </div>
                        <button className="btn-add-primary" onClick={() => {
                            setEditRouteId(null);
                            setRouteName('');
                            setStops(['']);
                            setViewMode('create');
                        }}>
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
                                <div className="nav-actions">
                                    <button className="nav-btn edit" onClick={(e) => handleEditRoute(e, r)}>
                                        <Edit2 size={14} />
                                    </button>
                                    <button className="nav-btn delete" onClick={(e) => handleDeleteRoute(e, r._id)}>
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                                <ChevronRight size={16} className="arr-icon" />
                            </div>
                        ))}
                    </div>
                </aside>

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
                                    <h3>{editRouteId ? 'Update Route Identity' : 'Initialize Route Identity'}</h3>
                                    <p>{editRouteId ? 'Modify the parameters of this existing transport line' : 'Establish the foundation for a new logistics line'}</p>
                                </div>
                            </div>
                            <form onSubmit={handleSaveRoute} className="w-form">
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
                                    <button type="submit" className="btn-pri">{editRouteId ? 'Update Identity' : 'Activate Route Identity'}</button>
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
                                                    <input 
                                                        type="text" 
                                                        placeholder="XX XX XX XXXX" 
                                                        value={newBus.busNumber} 
                                                        onChange={e => {
                                                            let val = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
                                                            let formatted = "";
                                                            for(let i=0; i<val.length && i<10; i++) {
                                                                if(i === 2 || i === 4 || i === 6) formatted += " ";
                                                                formatted += val[i];
                                                            }
                                                            setNewBus({...newBus, busNumber: formatted});
                                                        }} 
                                                        required 
                                                    />
                                                </div>
                                                <div className="f-group">
                                                    <label>Driver Phone</label>
                                                    <input type="text" placeholder="+91 XXXXX XXXXX" value={newBus.mobileNumber} onChange={e => setNewBus({...newBus, mobileNumber: e.target.value})} required />
                                                </div>
                                            </div>
                                            <div className="f-row">
                                                <div className="f-group">
                                                    <label>Identity Image (Upload)</label>
                                                    <div className="up-container-p">
                                                        {newBus.image ? (
                                                            <div className="up-preview-wrap">
                                                                <img src={newBus.image} alt="Preview" className="up-preview-img" />
                                                                <button type="button" className="btn-remove-img" onClick={() => setNewBus({ ...newBus, image: '' })}>✕</button>
                                                            </div>
                                                        ) : (
                                                            <label className={`up-trigger-p ${uploading ? 'loading' : ''}`}>
                                                                <input type="file" style={{ display: 'none' }} onChange={handleFileUpload} accept="image/*" disabled={uploading}/>
                                                                {uploading ? <div className="up-loader-dots"><span></span><span></span><span></span></div> : <><Plus size={20} /><span>Add Image</span></>}
                                                            </label>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="f-group"></div>
                                            </div>
                                            
                                            <div className="timing-schedule">
                                                <div className="schedule-header-p">
                                                    <label>Stop-by-Stop Schedule</label>
                                                    <span className="audit-badge">Chronological Audit Active</span>
                                                </div>
                                                <div className="schedule-timeline">
                                                    {newBus.stopTimings.map((st, idx) => {
                                                        // Integrated Chronology Audit (Inter-Stop & Intra-Stop)
                                                        let isInvalid = false;
                                                        const currArrTotal = (st.arrivalDayOffset * 1440) + 
                                                                           (parseInt(st.arrivalTime?.split(':')[0]) * 60) + 
                                                                           parseInt(st.arrivalTime?.split(':')[1] || 0);
                                                        const currDepTotal = (st.departureDayOffset * 1440) + 
                                                                           (parseInt(st.departureTime?.split(':')[0]) * 60) + 
                                                                           parseInt(st.departureTime?.split(':')[1] || 0);

                                                        // 1. Check Intra-Stop (Arr vs Dep at same stop)
                                                        if (st.arrivalTime && st.departureTime && currDepTotal < currArrTotal) {
                                                            isInvalid = true;
                                                        }

                                                        // 2. Check Inter-Stop (Prev Dep vs Curr Arr)
                                                        if (!isInvalid && idx > 0) {
                                                            const prev = newBus.stopTimings[idx-1];
                                                            const prevDepTotal = (prev.departureDayOffset * 1440) + 
                                                                             (parseInt(prev.departureTime?.split(':')[0]) * 60) + 
                                                                             parseInt(prev.departureTime?.split(':')[1] || 0);
                                                            if (st.arrivalTime && prev.departureTime && currArrTotal < prevDepTotal) {
                                                                isInvalid = true;
                                                            }
                                                        }

                                                        return (
                                                            <div key={idx} className={`s-row-premium ${isInvalid ? 'invalid-sequence' : 'valid-sequence'}`}>
                                                                {isInvalid && (
                                                                    <div className="seq-warning animate-shake">
                                                                        <AlertTriangle size={12} /> 
                                                                        <span>Sequence Error: Check Day Offset</span>
                                                                    </div>
                                                                )}
                                                                <div className="s-name-group">
                                                                    <div className="p-dot"></div>
                                                                    <span className="s-name">{st.stopName}</span>
                                                                </div>
                                                                <div className="s-time-pickers">
                                                                    <div className="time-field">
                                                                        <div className="time-label-row">
                                                                            <span className="time-label">Arr</span>
                                                                            {st.arrivalDayOffset > 0 && <span className="day-tag">+1 Day</span>}
                                                                        </div>
                                                                        <div className="time-input-wrap">
                                                                            <input type="time" value={st.arrivalTime} onChange={e => handleStopTimingChange(idx, 'arrivalTime', e.target.value)} />
                                                                            <button type="button" className={`btn-day-toggle ${st.arrivalDayOffset > 0 ? 'active' : ''}`} onClick={() => handleDayOffsetToggle(idx, 'arrivalDayOffset')} title="Toggle Next Day Offset">
                                                                                <Moon size={12} />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                    <div className="time-field">
                                                                        <div className="time-label-row">
                                                                            <span className="time-label">Dep</span>
                                                                            {st.departureDayOffset > 0 && <span className="day-tag">+1 Day</span>}
                                                                        </div>
                                                                        <div className="time-input-wrap">
                                                                            <input type="time" value={st.departureTime} onChange={e => handleStopTimingChange(idx, 'departureTime', e.target.value)} />
                                                                            <button type="button" className={`btn-day-toggle ${st.departureDayOffset > 0 ? 'active' : ''}`} onClick={() => handleDayOffsetToggle(idx, 'departureDayOffset')} title="Toggle Next Day Offset">
                                                                                <Moon size={12} />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
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
                                                        <span>
                                                            {st.arrivalTime || '--:--'} {st.arrivalDayOffset > 0 ? '(+1)' : ''} / 
                                                            {st.departureTime || '--:--'} {st.departureDayOffset > 0 ? '(+1)' : ''}
                                                        </span>
                                                    </div>
                                                ))}
                                                {b.stopTimings.length > 3 && <p className="v-more">+{b.stopTimings.length - 3} more stations</p>}
                                            </div>
                                        </div>
                                    ))}
                                    {buses.length === 0 && !showBusForm && <div className="empty-fleet-w"><p>No vehicles assigned yet.</p></div>}
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
