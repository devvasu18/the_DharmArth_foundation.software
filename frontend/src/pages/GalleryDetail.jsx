import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import './GalleryDetail.css';

const GalleryDetail = () => {
    const { id } = useParams();
    const [gallery, setGallery] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const timerRef = useRef(null);

    useEffect(() => {
        const fetchGallery = async () => {
            try {
                const res = await axios.get(`http://localhost:5000/api/galleries/${id}`);
                setGallery(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchGallery();
    }, [id]);

    useEffect(() => {
        if (!gallery || gallery.images.length === 0) return;

        timerRef.current = setInterval(() => {
            setCurrentIndex(prev => (prev + 1) % gallery.images.length);
        }, 3000);

        return () => clearInterval(timerRef.current);
    }, [gallery]);

    const handleNext = () => {
        if (!gallery) return;
        clearInterval(timerRef.current);
        setCurrentIndex(prev => (prev + 1) % gallery.images.length);
    };

    const handlePrev = () => {
        if (!gallery) return;
        clearInterval(timerRef.current);
        setCurrentIndex(prev => (prev - 1 + gallery.images.length) % gallery.images.length);
    };

    if (!gallery) return <div>Loading...</div>;

    return (
        <div className="gallery-detail-page">
            <div className="gallery-viewer">
                <Link to="/gallery" className="close-btn"><X size={24} /></Link>

                <div className="slider-main">
                    <button className="nav-btn prev" onClick={handlePrev}><ChevronLeft size={32} /></button>

                    <div className="slide-frame">
                        <img
                            src={gallery.images[currentIndex] || gallery.coverImage}
                            alt={`Slide ${currentIndex}`}
                            className="active-slide"
                        />
                    </div>

                    <button className="nav-btn next" onClick={handleNext}><ChevronRight size={32} /></button>
                </div>

                <div className="viewer-footer">
                    <h2>{gallery.title}</h2>
                    <p className="image-counter">{currentIndex + 1} / {gallery.images.length}</p>
                </div>
            </div>
        </div>
    );
};

export default GalleryDetail;
