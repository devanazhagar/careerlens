import React from 'react';
import { ScanEye } from 'lucide-react';

const Logo = ({ className = "", theme = "dark" }) => {
    // Theme 'dark' means dark background, so text is white/gradient
    // Theme 'light' means light background, so text is dark/gradient

    const textColor = theme === 'dark'
        ? 'bg-gradient-to-r from-white to-gray-300'
        : 'bg-gradient-to-r from-[#00002E] to-gray-600';

    const iconBg = theme === 'dark'
        ? 'bg-white/5 border border-white/10'
        : 'bg-[#F2B42D]/10 border border-[#F2B42D]/20';

    return (
        <div className={`flex items-center gap-3 ${className}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center backdrop-blur-md shadow-lg ${iconBg} group hover:scale-105 transition-transform duration-300`}>
                <ScanEye className="h-6 w-6 text-[#F2B42D]" />
            </div>
            <div className="flex flex-col">
                <span className={`text-xl font-bold tracking-brand ${textColor} bg-clip-text text-transparent leading-none`}>
                    CareerLens
                </span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-[#F2B42D] font-medium leading-none mt-1">
                    AI Guided
                </span>
            </div>
        </div>
    );
};

export default Logo;
