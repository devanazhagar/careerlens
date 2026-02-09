import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, User, BookOpen, Settings,
    LogOut, Bell, Search, Briefcase, FileText,
    CheckSquare, Activity, Calendar, Menu, X, Zap
} from 'lucide-react';
import Logo from './Logo';

const SidebarLink = ({ icon: Icon, label, onClick, isActive, badge }) => (
    <a
        onClick={onClick}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-300 group ${isActive ? 'bg-[#F2B42D]/20 text-[#F2B42D] border border-[#F2B42D]/30' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
    >
        <Icon size={20} className={`group-hover:text-[#F2B42D] transition-colors ${isActive ? 'text-[#F2B42D]' : ''}`} />
        <span className="font-medium">{label}</span>
        {badge && (
            <span className="ml-auto bg-[#D7425E] text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold shadow-sm">{badge}</span>
        )}
    </a>
);

const MainLayout = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || '{}'));

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
    const closeSidebar = () => setIsSidebarOpen(false);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const navItems = [
        { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
        { type: 'header', label: 'Growth' },
        { icon: FileText, label: "Resume Analyzer", path: "/resume-analyzer" },
        { icon: Briefcase, label: "Openings", path: "/opening", badge: "12" },
        { icon: Activity, label: "Skill Analyzer", path: "/skill-analysis" },
        { icon: BookOpen, label: "Profile Guide", path: "/career-guide" },
        { type: 'header', label: 'Daily' },
        { icon: Calendar, label: "Habit Tracker", path: "/habit-tracker" },
        { icon: CheckSquare, label: "Tasks", path: "/tasks" },
    ];

    return (
        <div className="bg-[#00002E] min-h-screen font-display text-white flex overflow-hidden relative selection:bg-[#F2B42D] selection:text-black">
            {/* MATCHING GRADIENTS */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#F2B42D] rounded-full opacity-10 blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#D7425E] rounded-full opacity-10 blur-[120px] pointer-events-none"></div>

            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] md:hidden transition-all duration-300"
                    onClick={closeSidebar}
                ></div>
            )}

            {/* Sidebar */}
            <aside className={`
                fixed md:relative inset-y-0 left-0 w-64 bg-[#00002E]/95 backdrop-blur-xl border-r border-[#ffffff14] flex-shrink-0 flex flex-col z-[101] 
                transition-transform duration-300 ease-in-out
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
             shadow-2xl`}>
                <div className="h-16 flex items-center justify-between px-6 border-b border-[#ffffff14]">
                    <Logo />
                    <button onClick={closeSidebar} className="md:hidden text-gray-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>
                <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
                    {navItems.map((item, index) => {
                        if (item.type === 'header') {
                            return (
                                <div key={index} className="pt-4 pb-1 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider opacity-70">
                                    {item.label}
                                </div>
                            );
                        }
                        return (
                            <SidebarLink
                                key={index}
                                icon={item.icon}
                                label={item.label}
                                isActive={location.pathname === item.path}
                                onClick={() => {
                                    if (item.path !== '#') navigate(item.path);
                                    closeSidebar();
                                }}
                                badge={item.badge}
                            />
                        );
                    })}
                </nav>
                <div className="p-4 border-t border-[#ffffff14]">
                    <SidebarLink icon={Settings} label="Settings" onClick={() => { navigate('/settings'); closeSidebar(); }} />
                    <SidebarLink icon={LogOut} label="Logout" onClick={handleLogout} />
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden relative z-10 transition-all duration-300 w-full">
                {/* Header */}
                <header className="h-16 flex items-center justify-between px-6 md:px-10 border-b border-[#ffffff14] bg-[#00002E]/60 backdrop-blur-md z-50 sticky top-0 shrink-0">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={toggleSidebar}
                            className="p-2 -ml-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all md:hidden"
                        >
                            <Menu size={24} />
                        </button>
                        <div className="flex flex-col">
                            <h2 className="text-white text-lg font-bold leading-none capitalize">
                                {location.pathname.split('/')[1].replace('-', ' ') || 'Dashboard'}
                            </h2>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 md:gap-6">
                        <div className="relative hidden lg:block w-64 lg:w-80">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                                <Search size={18} />
                            </div>
                            <input
                                className="block w-full pl-10 pr-3 py-2 border border-[#ffffff14] rounded-lg leading-5 bg-white/5 text-gray-300 placeholder-gray-500 focus:outline-none focus:bg-[#00002E]/60 focus:border-[#F2B42D] focus:ring-1 focus:ring-[#F2B42D] sm:text-sm transition-all"
                                placeholder="Search..."
                                type="text"
                            />
                        </div>

                        <div className="flex items-center gap-2 md:gap-3">
                            <button className="relative p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                                <Bell size={20} />
                                <span className="absolute top-2 right-2 block h-2 w-2 rounded-full bg-[#D7425E] ring-2 ring-[#00002E]"></span>
                            </button>
                            <div
                                onClick={() => navigate('/settings')}
                                className="h-8 w-8 md:h-9 md:w-9 rounded-full bg-gradient-to-br from-[#F2B42D] to-[#DD785E] border border-[#ffffff14] flex items-center justify-center text-[#00002E] font-bold cursor-pointer hover:ring-2 hover:ring-[#F2B42D] transition-all overflow-hidden shrink-0"
                            >
                                {user.profilePhoto ? (
                                    <img src={user.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    user.Name ? user.Name.charAt(0) : 'U'
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content */}
                <main className="flex-1 overflow-y-auto relative scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
