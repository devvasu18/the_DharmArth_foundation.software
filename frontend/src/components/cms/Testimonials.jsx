import React from 'react';
import { Quote, Star } from 'lucide-react';

const Testimonials = ({ data }) => {
    const items = data?.items || [];

    if (!items || items.length === 0) return null;

    return (
        <section className="cms-section py-24 bg-teal-50/50">
            <div className="cms-container">
                <div className="text-center mb-16">
                    <h2 className="cms-heading">{data?.title || 'What Our Donors Say'}</h2>
                    <p className="cms-subheading mx-auto">{data?.subtitle || 'Join thousands of satisfied supporters making a real difference.'}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {items.map((item, index) => (
                        <div key={index} className="cms-card border-none bg-white relative flex flex-col h-full shadow-md hover:shadow-xl">


                            <div className="flex gap-1 mb-6">
                                {[...Array(item.rating || 5)].map((_, i) => (
                                    <Star key={i} size={16} fill="var(--primary)" className="text-primary" />
                                ))}
                            </div>

                            <p className="text-gray-700 italic leading-relaxed mb-8 flex-grow">
                                "{item.text}"
                            </p>

                            <div className="flex items-center gap-4 border-t border-gray-50 pt-6 mt-auto">
                                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-teal-100 shadow-sm">
                                    <img src={item.photo || `https://i.pravatar.cc/150?u=${index}`} alt={item.name} className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900">{item.name}</h4>
                                    <p className="text-xs text-teal-600 font-bold uppercase tracking-wider">Verified Donor</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Testimonials;
