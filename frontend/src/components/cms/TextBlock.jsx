import React from 'react';

const TextBlock = ({ data }) => {
    const alignment = data?.alignment || 'left';
    
    return (
        <section className="cms-section py-20 bg-white">
            <div className="cms-container">
                <div className={`max-w-4xl mx-auto ${alignment === 'center' ? 'text-center' : alignment === 'right' ? 'text-right' : 'text-left'}`}>
                    {data?.title && <h2 className="cms-heading">{data.title}</h2>}
                    {data?.subtitle && <p className="cms-subheading mb-8 mx-auto">{data.subtitle}</p>}
                    <div className="text-xl text-gray-600 leading-relaxed space-y-6 font-light">
                        {data?.content?.split('\n').map((para, i) => (
                            <p key={i}>{para}</p>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default TextBlock;
