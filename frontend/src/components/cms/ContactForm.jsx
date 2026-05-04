import React, { useState } from 'react';
import { Send, CheckCircle2 } from 'lucide-react';

const ContactForm = ({ data }) => {
    const [submitted, setSubmitted] = useState(false);
    
    const handleSubmit = (e) => {
        e.preventDefault();
        setSubmitted(true);
    };

    return (
        <section className="cms-section py-24 bg-white">
            <div className="cms-container">
                <div className="max-w-5xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        <div>
                            <h2 className="cms-heading text-left">{data?.title || 'Get in Touch'}</h2>
                            <p className="cms-subheading text-left mb-10">{data?.subtitle || 'Have questions? We are here to help you.'}</p>
                            
                            <div className="space-y-6">
                                <div className="flex gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center flex-shrink-0">
                                        <Send size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900">Our Email</h4>
                                        <p className="text-gray-500">contact@foundation.org</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="cms-card bg-teal-50/30 border-teal-100 p-10 relative overflow-hidden">
                            {submitted ? (
                                <div className="text-center py-10">
                                    <div className="w-20 h-20 bg-teal-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-teal-500/20">
                                        <CheckCircle2 size={40} />
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Message Sent!</h3>
                                    <p className="text-gray-500">Thank you for reaching out. We will get back to you shortly.</p>
                                    <button onClick={() => setSubmitted(false)} className="mt-8 text-teal-600 font-bold hover:underline">Send another message</button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-teal-600 px-1">First Name</label>
                                            <input type="text" placeholder="John" className="w-full px-5 py-4 rounded-xl border border-teal-100 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/5 transition-all outline-none" required />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-teal-600 px-1">Last Name</label>
                                            <input type="text" placeholder="Doe" className="w-full px-5 py-4 rounded-xl border border-teal-100 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/5 transition-all outline-none" required />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-teal-600 px-1">Email Address</label>
                                        <input type="email" placeholder="john@example.com" className="w-full px-5 py-4 rounded-xl border border-teal-100 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/5 transition-all outline-none" required />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-teal-600 px-1">How can we help?</label>
                                        <textarea rows="4" placeholder="Your message here..." className="w-full px-5 py-4 rounded-xl border border-teal-100 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/5 transition-all outline-none resize-none" required></textarea>
                                    </div>
                                    <button type="submit" className="w-full py-5 bg-teal-600 text-white rounded-xl font-bold shadow-xl shadow-teal-600/10 hover:bg-teal-700 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3">
                                        Send Message <Send size={18} />
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ContactForm;
