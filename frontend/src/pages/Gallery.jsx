import React, { useState, useEffect } from 'react';
import api, { API_BASE_URL } from '../services/api';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { Image, ArrowRight } from 'lucide-react';
import './Gallery.css';

const Gallery = () => {
    const [galleries, setGalleries] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGalleries = async () => {
            try {
                const res = await api.get('/galleries');
                setGalleries(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchGalleries();
    }, []);

    return (
        <div className="gallery-page">
            <Navbar />

            <div className="gallery-header">
                <div className="container">
                    <h1>Our Gallery</h1>
                    <p>Capturing moments of hope, joy, and change.</p>
                </div>
            </div>

            <div className="container" style={{ padding: '60px 20px', minHeight: '50vh' }}>
                <div className="gallery-grid">
                    {galleries.map(gallery => (
                        <Link to={`/gallery/${gallery._id}`} key={gallery._id} className="gallery-card">
                            <div className="gallery-card-img">
                                <img 
                                    src={gallery.coverImage.startsWith('http') 
                                        ? gallery.coverImage 
                                        : `${API_BASE_URL}${gallery.coverImage.startsWith('/') ? '' : '/'}${gallery.coverImage}`
                                    } 
                                    alt={gallery.title} 
                                />
                                <div className="gallery-overlay">
                                    <span className="view-text">View Gallery</span>
                                </div>
                            </div>
                            <div className="gallery-card-content">
                                <h3>{gallery.title}</h3>
                                <p>{gallery.images.length} Photos</p>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default Gallery;
