import React from 'react';

const ImageGallery = ({ data }) => {
    const images = data?.images || [];
    
    return (
        <section className="cms-section py-24 bg-teal-50/20">
            <div className="cms-container">
                <div className="text-center mb-16">
                    <h2 className="cms-heading">{data?.title || 'Our Gallery'}</h2>
                    <p className="cms-subheading mx-auto">{data?.subtitle}</p>
                </div>
                
                <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                    {images.map((img, index) => (
                        <div key={index} className="break-inside-avoid rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 group border-4 border-white">
                            <img src={img} alt="" className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700" />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default ImageGallery;
