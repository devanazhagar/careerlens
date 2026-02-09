import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import BackgroundShapes from '../components/BackgroundShapes';

const Path = () => {
    const navigate = useNavigate();
    const [selectedPath, setSelectedPath] = useState(null);
    const [message, setMessage] = useState('');

    const paths = [
        { id: 'school', type: 'school', icon: 'school', title: 'School Student', desc: 'Exploring foundations and early career interests.', glow: 'glow-blue', ringBg: 'bg-blue-500/20', ringText: 'text-blue-400' },
        { id: 'college', type: 'college', icon: 'terminal', title: 'College Student', desc: 'Specializing in fields and preparing for the market.', glow: 'glow-teal', ringBg: 'bg-teal-500/20', ringText: 'text-teal-400' },
        { id: 'professional', type: 'professional', icon: 'work', title: 'Industry Professional', desc: 'Advancing skills or transitioning between roles.', glow: 'glow-pink', ringBg: 'bg-pink-500/20', ringText: 'text-pink-400' }
    ];

    const handleContinue = () => {
        setMessage('');
        if (selectedPath) {
            navigate(`/details?type=${selectedPath}`);
        } else {
            setMessage('Please select a path to continue.');
        }
    };

    return (
        <div className="bg-[#00002E] font-display text-white transition-colors duration-300 min-h-screen relative flex flex-col overflow-x-hidden text-center">
            <BackgroundShapes />

            {/* Branding */}
            <div className="absolute top-6 left-6 z-20">
                <Logo />
            </div>

            {/* Main Content Container */}
            <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative z-10">
                {/* Headline Text Section */}
                <div className="max-w-[720px] w-full mb-12 text-center">
                    <h1 className="text-white tracking-tight text-4xl md:text-5xl font-bold leading-tight mb-4 bg-gradient-to-r from-[#F2B42D] to-[#D7425E] bg-clip-text text-transparent">
                        Choose Your Path
                    </h1>
                    <p className="text-gray-400 text-lg font-normal leading-relaxed">
                        Select the stage that best describes your current journey to personalize your AI experience.
                    </p>
                </div>

                {/* Path Selection Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-[1024px]">
                    {paths.map((path) => (
                        <div
                            key={path.id}
                            className={`glass-card ${path.glow} group flex flex-col items-center p-8 rounded-xl cursor-pointer transition-all duration-300 ${selectedPath === path.type ? 'selected-card' : ''} border border-white/10 hover:border-[#F2B42D]/50`}
                            onClick={() => { setSelectedPath(path.type); setMessage(''); }}
                        >
                            <div className={`w-16 h-16 rounded-2xl ${path.ringBg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                <span className={`material-symbols-outlined ${path.ringText} text-3xl`}>{path.icon}</span>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">{path.title}</h3>
                            <p className="text-gray-400 text-center text-sm leading-relaxed">
                                {path.desc}
                            </p>
                            <div className={`mt-6 transition-opacity ${selectedPath === path.type ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                <span className="text-[#F2B42D] text-xs font-bold flex items-center gap-1">
                                    {selectedPath === path.type ? 'SELECTED' : 'SELECT'} <span className="material-symbols-outlined text-sm">chevron_right</span>
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            {/* Footer / Action Section */}
            <footer className="w-full max-w-[960px] mx-auto pb-12 px-6 relative z-10">
                <div className="flex flex-col items-center gap-4">
                    {message && (
                        <div className="p-3 rounded-lg text-sm text-center bg-red-500/10 text-red-400 border border-red-500/20 w-full max-w-sm animate-fade-in">
                            {message}
                        </div>
                    )}
                    <button
                        onClick={handleContinue}
                        className="flex min-w-[240px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-14 px-8 bg-gradient-to-r from-[#F2B42D] to-[#DD785E] text-[#00002E] text-base font-bold leading-normal tracking-[0.015em] hover:shadow-[0_0_20px_rgba(242,180,45,0.4)] transform hover:scale-[1.02] transition-all"
                    >
                        <span className="truncate">Continue</span>
                    </button>
                </div>
            </footer>
        </div>
    );
};

export default Path;