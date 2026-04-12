import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { MapPin, Plus, Trash, Truck, Clock } from 'lucide-react';
import './AdminDelivery.css';

const AdminDelivery = () => {
    const [routes, setRoutes] = useState([]);
    const [routeName, setRouteName] = useState('');
    const [stops, setStops] = useState(['']);
    const [selectedRoute, setSelectedRoute] = useState(null);
    const [buses, setBuses] = useState([]);
    const [newBus, setNewBus] = useState({ busNumber: '', timing: '' });

    useEffect(() => {
        fetchRoutes();
    }, []);

    const fetchRoutes = async () => {
        try {
            const res = await api.get('/delivery/routes');
            setRoutes(res.data.routes || res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddStop = () => setStops([...stops, '']);
    
    const handleStopChange = (index, value) => {
        const newStops = [...stops];
        newStops[index] = value;
        setStops(newStops);
    };

    const handleCreateRoute = async (e) => {
        e.preventDefault();
        try {
            await api.post('/delivery/routes', { routeName, stops: stops.filter(s => s.trim() !== '') });
            setRouteName('');
            setStops(['']);
            fetchRoutes();
        } catch (err) {
            alert('Failed to create route');
        }
    };

    const fetchBuses = async (routeId) => {
        try {
            const res = await api.get(`/delivery/routes/${routeId}/buses`);
            setBuses(res.data);
            setSelectedRoute(routes.find(r => r._id === routeId));
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddBus = async (e) => {
        e.preventDefault();
        try {
            await api.post('/delivery/buses', { ...newBus, routeId: selectedRoute._id });
            setNewBus({ busNumber: '', timing: '' });
            fetchBuses(selectedRoute._id);
        } catch (err) {
            alert('Failed to add bus');
        }
    };

    return (
        <div className="admin-delivery">
            <header className="admin-header">
                <h2>Transport & Delivery Management</h2>
            </header>

            <div className="delivery-grid">
                {/* Create Route Form */}
                <div className="card glassmorphism">
                    <h3>Create New Route</h3>
                    <form onSubmit={handleCreateRoute}>
                        <div className="form-group">
                            <label>Route Name (e.g. Jaipur → Ajmer)</label>
                            <input 
                                type="text" 
                                value={routeName} 
                                onChange={(e) => setRouteName(e.target.value)}
                                placeholder="Enter route name"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Stops (Locations)</label>
                            {stops.map((stop, index) => (
                                <div key={index} className="stop-input">
                                    <MapPin size={16} />
                                    <input 
                                        type="text" 
                                        value={stop} 
                                        onChange={(e) => handleStopChange(index, e.target.value)}
                                        placeholder={`Stop ${index + 1}`}
                                        required
                                    />
                                </div>
                            ))}
                            <button type="button" className="btn-link" onClick={handleAddStop}>+ Add Stop</button>
                        </div>
                        <button type="submit" className="btn btn-primary btn-block">Create Route</button>
                    </form>
                </div>

                {/* Routes List */}
                <div className="card glassmorphism">
                    <h3>Active Routes</h3>
                    <div className="route-list">
                        {routes.map(r => (
                            <div key={r._id} className={`route-item ${selectedRoute?._id === r._id ? 'selected' : ''}`} onClick={() => fetchBuses(r._id)}>
                                <div className="route-info">
                                    <h4>{r.routeName}</h4>
                                    <p>{r.stops.join(' → ')}</p>
                                </div>
                                <Truck size={20} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bus Management for Selected Route */}
                {selectedRoute && (
                    <div className="card glassmorphism full-width">
                        <div className="card-header-flex">
                            <h3>Buses for {selectedRoute.routeName}</h3>
                            <button className="btn-close" onClick={() => setSelectedRoute(null)}>✕</button>
                        </div>
                        
                        <div className="bus-manager">
                            <form className="bus-form" onSubmit={handleAddBus}>
                                <input 
                                    type="text" 
                                    placeholder="Bus Number" 
                                    value={newBus.busNumber}
                                    onChange={(e) => setNewBus({...newBus, busNumber: e.target.value})}
                                    required
                                />
                                <input 
                                    type="text" 
                                    placeholder="Timing (e.g. 09:00 AM)" 
                                    value={newBus.timing}
                                    onChange={(e) => setNewBus({...newBus, timing: e.target.value})}
                                    required
                                />
                                <button type="submit" className="btn btn-success">Add Bus</button>
                            </form>

                            <div className="bus-grid">
                                {buses.map(b => (
                                    <div key={b._id} className="bus-card">
                                        <div className="bus-icon">🚌</div>
                                        <div className="bus-details">
                                            <h4>{b.busNumber}</h4>
                                            <p><Clock size={14} /> {b.timing}</p>
                                        </div>
                                    </div>
                                ))}
                                {buses.length === 0 && <p className="empty-text">No buses added for this route yet.</p>}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDelivery;
