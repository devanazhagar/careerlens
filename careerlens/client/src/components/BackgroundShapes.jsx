import React from 'react';

const BackgroundShapes = () => {
    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
            {/* Blob 1: Blue-ish */}
            <div
                className="absolute top-[5%] left-[-5%] w-[700px] h-[700px] rounded-full blur-[100px] opacity-100 transition-all duration-2000"
                style={{ backgroundColor: 'rgba(37, 99, 235, 0.2)' }}
            />

            {/* Blob 2: Purple-ish */}
            <div
                className="absolute top-[30%] right-[-10%] w-[600px] h-[600px] rounded-full blur-[100px] opacity-100 transition-all duration-2000"
                style={{ backgroundColor: 'rgba(147, 51, 234, 0.2)' }}
            />

            {/* Blob 3: Teal-ish */}
            <div
                className="absolute bottom-[-15%] left-[15%] w-[650px] h-[650px] rounded-full blur-[100px] opacity-100 transition-all duration-2000"
                style={{ backgroundColor: 'rgba(20, 184, 166, 0.15)' }}
            />
        </div>
    );
};

export default BackgroundShapes;
