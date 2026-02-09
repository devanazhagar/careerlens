import React, { useEffect, useState } from 'react';
import Logo from './Logo';
import BackgroundShapes from './BackgroundShapes';
import FloatingTags from './FloatingTags';

const AuthLayout = ({ children, title, subtitle, className }) => {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e) => {
            setMousePosition({
                x: (e.clientX / window.innerWidth) * 20 - 10,
                y: (e.clientY / window.innerHeight) * 20 - 10,
            });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <div className="relative min-h-screen w-full overflow-hidden flex items-center justify-center bg-[#00002E]">
            {/* Branding */}
            <div className="absolute top-6 left-6 z-20">
                <Logo />
            </div>

            {/* Dynamic Background Gradients */}
            <BackgroundShapes />
            <FloatingTags />

            {/* Floating Card */}
            <div
                className={`glass-card p-1 relative z-10 w-full mx-4 transform transition-transform duration-100 ease-out animate-pop ${className || 'max-w-md'}`}
                style={{
                    transform: `perspective(1000px) rotateX(${-mousePosition.y}deg) rotateY(${mousePosition.x}deg)`
                }}
            >
                <div className="bg-[#00002E]/80 backdrop-blur-xl rounded-xl p-8 border border-white/5 shadow-2xl">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-[#F2B42D] to-[#D7425E] bg-clip-text text-transparent mb-2">
                            {title}
                        </h2>
                        {subtitle && (
                            <p className="text-gray-400 text-sm">
                                {subtitle}
                            </p>
                        )}
                    </div>
                    {children}
                </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute top-10 right-10 w-4 h-4 rounded-full bg-[#59ABA9] opacity-50 blur-[2px]" />
            <div className="absolute bottom-20 left-20 w-6 h-6 rounded-full bg-[#DD785E] opacity-50 blur-[4px]" />
        </div>
    );
};

export default AuthLayout;
