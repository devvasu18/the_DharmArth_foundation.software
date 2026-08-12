import React from 'react';
import './TextBlock.css';

const TextBlock = ({ data }) => {
    const alignment = data?.alignment || 'left';

    return (
        <section className="cms-section text-cms-section">
            <div className="cms-container">
                <div className={`text-block-box ${alignment === 'center' ? 'align-center' : alignment === 'right' ? 'align-right' : 'align-left'}`}>
                    {data?.title && <h2 className="cms-section-title" dangerouslySetInnerHTML={{ __html: data.title }} />}
                    {data?.subtitle && <p className="cms-section-subtitle" dangerouslySetInnerHTML={{ __html: data.subtitle }} />}
                    <div
                        className="text-block-content"
                        dangerouslySetInnerHTML={{ __html: data.content }}
                    />
                </div>
            </div>
        </section>
    );
};

export default TextBlock;
