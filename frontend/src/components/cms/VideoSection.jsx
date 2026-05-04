import React from 'react';
import { Play } from 'lucide-react';

const VideoSection = ({ data }) => {
    if (!data?.videoUrl) return null;

    return (
        <section className="cms-section py-24 bg-white">
            <div className="cms-container">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="cms-heading">{data?.title || 'Watch Our Story'}</h2>
                        <p className="cms-subheading mx-auto">{data?.subtitle}</p>
                    </div>
                    
                    <div className="relative aspect-video rounded-[3rem] overflow-hidden shadow-2xl group border-8 border-teal-50">
                        <iframe 
                            className="w-full h-full"
                            src={data.videoUrl.replace('watch?v=', 'embed/')} 
                            title={data.title}
                            frameBorder="0" 
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                            allowFullScreen
                        ></iframe>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default VideoSection;
