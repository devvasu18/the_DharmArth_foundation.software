import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const AdminSettings = () => {
    const [settings, setSettings] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const { data } = await api.get('/content/settings');
            setSettings(data);
        } catch (error) {
            console.error("Failed to fetch settings", error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (key, currentValue) => {
        const newValue = !currentValue;
        try {
            await api.put('/content/settings', { [key]: newValue });
            setSettings({ ...settings, [key]: newValue });
        } catch (error) {
            console.error("Update failed", error);
        }
    };

    if (loading) return <div>Loading settings...</div>;

    return (
        <div className="admin-card">
            <h3>Site Configuration</h3>
            <p style={{ marginBottom: '1.5rem', color: '#666' }}>Manage global site settings and feature flags.</p>

            <table className="data-table">
                <thead>
                    <tr>
                        <th>Setting Key</th>
                        <th>Current Value</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {/* Hardcoding specific keys we know exist for better UX, or map all */}
                    <tr>
                        <td><strong>Show "Save a Life" Banner</strong> (Login Page)</td>
                        <td>
                            {settings.show_save_life_banner ?
                                <span className="badge badge-green">Enabled</span> :
                                <span className="badge badge-red">Disabled</span>
                            }
                        </td>
                        <td>
                            <button
                                className="btn btn-outline"
                                onClick={() => handleToggle('show_save_life_banner', settings.show_save_life_banner)}
                            >
                                Toggle
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};

export default AdminSettings;
