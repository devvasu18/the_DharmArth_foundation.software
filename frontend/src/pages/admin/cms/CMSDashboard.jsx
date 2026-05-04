import React from 'react';
import PageManager from './PageManager';
import { Shield } from 'lucide-react';

const CMSDashboard = () => {
    return (
        <div className="cms-dashboard admin-content min-h-screen bg-[#fcfcfc] relative overflow-hidden">
            {/* Background Glows */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-teal-500/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-teal-500/5 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4" />

            <div className="max-w-7xl mx-auto px-8 py-12 relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16">
                    <div className="max-w-2xl">

                        <h1 className="text-5xl font-black text-gray-900 tracking-tight mb-4 leading-tight">
                            Digital <span className="text-teal-500">Experience</span> Manager
                        </h1>

                    </div>
                </div>

                <PageManager />
            </div>
        </div>
    );
};

export default CMSDashboard;
