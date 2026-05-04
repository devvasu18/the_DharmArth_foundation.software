import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import ComponentRenderer from '../components/cms/ComponentRenderer';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

const DynamicPage = () => {
    const { slug } = useParams();
    const [pageData, setPageData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPage = async () => {
            try {
                setLoading(true);
                const { data } = await api.get(`/cms/pages/public/${slug}`);
                setPageData(data);
                
                // Update SEO
                if (data.seo) {
                    document.title = data.seo.metaTitle || data.title;
                    const metaDesc = document.querySelector('meta[name="description"]');
                    if (metaDesc) metaDesc.setAttribute('content', data.seo.metaDescription || '');
                }
            } catch (err) {
                console.error("Page fetch error:", err);
                setError(err.response?.data?.message || "Page not found");
            } finally {
                setLoading(false);
            }
        };

        fetchPage();
    }, [slug]);

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    if (error) return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;
    if (!pageData) return null;

    return (
        <div className="dynamic-page min-h-screen bg-white">
            <Navbar />
            <main className="w-full pb-32">
                {pageData.components.map((item, index) => (
                    <ComponentRenderer 
                        key={item._id || index}
                        type={item.type}
                        data={item.data}
                        config={item.config}
                    />
                ))}
            </main>
            <Footer />
        </div>
    );
};

export default DynamicPage;
