import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, User, BookOpen, Settings,
    LogOut, Bell, Search, Briefcase, FileText,
    CheckSquare, Activity, Calendar, Menu, MoreVertical, ChevronLeft, ChevronRight,
    Check, Edit, Zap, Linkedin, Github, Link as LinkIcon, Save
} from 'lucide-react';
import Logo from '../components/Logo';

const Dashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || '{}'));
    const [progress, setProgress] = useState(0);
    const [score, setScore] = useState(0);
    const [linkedinUrl, setLinkedinUrl] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchUserData();

        // Check for GitHub Token from redirect
        const urlParams = new URLSearchParams(window.location.search);
        const githubToken = urlParams.get('githubToken');
        if (githubToken) {
            handleSaveGithubToken(githubToken);
        }
    }, []);

    const handleSaveGithubToken = async (token) => {
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        const userID = storedUser.id || storedUser._id;

        if (!userID) return;

        try {
            const response = await fetch('http://127.0.0.1:3000/careerlens/github/save-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userID, token })
            });
            const data = await response.json();
            if (data.success) {
                alert("GitHub connected successfully!");
                // Update local user
                const updatedUser = { ...storedUser, githubAccessToken: token };
                setUser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));

                // Clear URL
                window.history.replaceState({}, document.title, "/dashboard");
            }
        } catch (error) {
            console.error("Error saving GitHub token:", error);
        }
    };

    const fetchUserData = async () => {
        const token = localStorage.getItem('token');
        if (!token) return navigate('/login');

        try {
            const response = await fetch('http://127.0.0.1:3000/careerlens/data', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (data.success) {
                const userData = data.userdata;
                setUser(userData);
                localStorage.setItem('user', JSON.stringify(userData));

                // Pre-fill LinkedIn URL if exists (not currently sent in userdata, need to ensure it is)
                // Assuming it might be added to user object in future or we need to request it
                // For now, if we saved it in local state or if it comes from backend
                // NOTE: We need to make sure 'userdata' endpoint returns 'userLinkedinProfileUrl'
                // But typically it returns what's in schema if we query correctly.
                // Let's fallback to checking if it's in the root of user object
                // We'll update this once backend definitely sends it.
                // Actually, backend 'userdata' returns specific fields, we might need to update backend 'userdata' controller to return this field too.
                // Let's assume it's there for now or we will update controller.

                // WAIT: Looking at my backend change for 'userdata' controller... I didn't update what 'userdata' returns in the 'res.json'. 
                // In 'server/controller/user.js', 'userdata' function returns:
                // res.json({ success: true, userdata: { ..., ...profileDetails, profilePhoto: ..., stats: ... } });
                // It does NOT explicitly include 'userLinkedinProfileUrl' from the User model! 
                // The 'user' object is fetched: const user = await UserModels.findById(userID);
                // But it's not being spread into the response fully.
                // I need to update the backend controller 'userdata' to include 'userLinkedinProfileUrl'.

                // For now, I'll write the frontend code assuming it WILL be there.
                if (data.userdata.userLinkedinProfileUrl) {
                    setLinkedinUrl(data.userdata.userLinkedinProfileUrl);
                }

                // Animate progress
                const targetReadiness = userData.readiness || 0;
                setProgress(targetReadiness);
                let start = 0;
                const timer = setInterval(() => {
                    start += targetReadiness / 75;
                    if (start >= targetReadiness) {
                        start = targetReadiness;
                        clearInterval(timer);
                    }
                    setScore(Math.round(start));
                }, 20);

                // Redirect if profile is not completed
                if (userData.status === 'User') {
                    navigate('/path');
                }
            }
        } catch (err) {
            console.error("Dashboard Fetch Error:", err);
            const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
            setUser(storedUser);
            if (storedUser.readiness) {
                setProgress(storedUser.readiness);
                setScore(storedUser.readiness);
            }
        }
    };

    const handleSaveLinkedinUrl = async () => {
        if (!linkedinUrl) return;
        setIsSaving(true);
        const token = localStorage.getItem('token');
        try {
            const response = await fetch('http://127.0.0.1:3000/careerlens/update-linkedin-url', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    userID: user.id || user._id, // Handle both cases just in case
                    linkedinUrl
                })
            });
            const data = await response.json();
            if (data.success) {
                // Ideally show a toast here
                alert("LinkedIn URL saved successfully!");
                // Update local user state
                const updatedUser = { ...user, userLinkedinProfileUrl: linkedinUrl };
                setUser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));
            } else {
                alert("Failed to save: " + data.message);
            }
        } catch (error) {
            console.error("Save URL Error:", error);
            alert("An error occurred while saving.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-6 md:p-10 relative">
            <div className="max-w-7xl mx-auto space-y-8 pb-20">
                {/* Welcome Check-in */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 animate-fade-in">
                    <h1 className="text-3xl font-bold text-white tracking-tight max-w-2xl">
                        Good morning, <span className="bg-gradient-to-r from-[#F2B42D] to-[#DD785E] bg-clip-text text-transparent">{user.Name?.split(' ')[0] || 'User'}</span>.<br />
                        <span className="text-gray-400 font-medium text-xl">Let's make some progress today.</span>
                    </h1>
                </div>

                {/* Animated Progress Bar - USES GLASS CARD */}
                <div className="glass-card p-6 shadow-2xl relative overflow-hidden group">
                    <div className="flex justify-between items-end mb-3">
                        <div>
                            <h3 className="text-white font-bold text-lg">Readiness Score</h3>
                            <p className="text-gray-400 text-sm">Based on your activity & skills</p>
                        </div>
                        <span className="text-[#F2B42D] font-bold text-3xl">{score}%</span>
                    </div>
                    <div className="h-6 w-full bg-white/5 rounded-full overflow-hidden relative shadow-inner">
                        <div
                            className="h-full bg-gradient-to-r from-[#F2B42D] to-[#DD785E] relative transition-all duration-[1500ms] ease-out flex items-center justify-end pr-2"
                            style={{ width: `${progress}%` }}
                        >
                            <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem] animate-pulse"></div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Column */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* Profile Card - USES GLASS CARD */}
                        <div className="glass-card p-6 relative overflow-hidden group hover:border-[#F2B42D]/30 transition-all">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
                                <User size={120} className="text-white" />
                            </div>
                            <div className="relative z-10 flex flex-col items-center text-center">
                                <div className="h-24 w-24 rounded-full p-1 bg-gradient-to-tr from-[#F2B42D] to-[#DD785E] mb-4 shadow-lg shadow-[#F2B42D]/20 overflow-hidden">
                                    <div className="h-full w-full rounded-full bg-[#00002E] flex items-center justify-center text-3xl font-bold text-white border-2 border-transparent overflow-hidden">
                                        {user.profilePhoto ? (
                                            <img src={user.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            user.Name ? user.Name.charAt(0) : 'U'
                                        )}
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-white">{user.Name || 'Guest User'}</h3>
                                <p className="text-gray-400 text-sm mb-4">Target: {user.targetRole || user.status || 'Career Explorer'}</p>
                                <span className="px-3 py-1 rounded-full bg-[#59ABA9]/10 text-[#59ABA9] text-xs font-bold border border-[#59ABA9]/30">
                                    Status: Active Learner
                                </span>
                            </div>
                            <div className="mt-6 pt-6 border-t border-[#ffffff14] grid grid-cols-2 gap-4 text-center">
                                <div>
                                    <p className="text-2xl font-bold text-white">{user.stats?.tasks?.completed || 0}</p>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider">Tasks Done</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-white">{user.stats?.tasks?.total || 0}</p>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider">Total Tasks</p>
                                </div>
                            </div>
                        </div>

                        {/* Skills Card - USES GLASS CARD */}
                        <div className="glass-card p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-bold text-white">Skill Gap Analysis</h3>
                                <button className="text-xs text-[#F2B42D] hover:text-white transition-colors font-semibold">View Details</button>
                            </div>
                            <div className="flex flex-col items-center justify-center mb-6">
                                <div className="relative h-40 w-40 flex items-center justify-center">
                                    <div className="w-full h-full rounded-full border-[10px] border-white/5 flex items-center justify-center relative">
                                        <div className="absolute top-0 left-0 w-full h-full rounded-full border-[10px] border-[#F2B42D] border-t-transparent border-l-transparent rotate-45 shadow-[0_0_15px_rgba(242,180,45,0.3)]"></div>
                                        <div className="flex flex-col items-center">
                                            <span className="text-3xl font-bold text-white">78%</span>
                                            <span className="text-xs text-gray-400">Ready</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                {[
                                    { label: 'Technical Assessment', val: 92, col: 'bg-[#48A8E2]' },
                                    { label: 'Aptitude Test', val: 85, col: 'bg-[#D7425E]' },
                                    { label: 'Communication Scan', val: 64, col: 'bg-[#DD785E]' }
                                ].map((skill, i) => (
                                    <div key={i}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-gray-300">{skill.label}</span>
                                            <span className="text-white font-medium">{skill.val}%</span>
                                        </div>
                                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                            <div className={`h-full ${skill.col} rounded-full shadow-[0_0_10px_${skill.col.replace('bg-', '')}]`} style={{ width: `${skill.val}%` }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Social Connect Card - NEW */}
                        <div className="glass-card p-6">
                            <h3 className="font-bold text-white mb-4">Social Profiles</h3>

                            {/* Social Sign-in Buttons */}
                            <div className="flex gap-3 mb-6">
                                <button
                                    onClick={() => {
                                        // This logic mimics the user's login.html
                                        const width = 600;
                                        const height = 700;
                                        const left = (window.innerWidth - width) / 2;
                                        const top = (window.innerHeight - height) / 2;
                                        const url = "https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=77t1ug94kb0mde&redirect_uri=https://escloop-n8n.escloop-gym.com.de/webhook/linkedin-auth&scope=w_member_social%20openid%20profile%20email";

                                        const popup = window.open(
                                            url,
                                            "LinkedInAuth",
                                            `width=${width},height=${height},top=${top},left=${left}`
                                        );

                                        // AUTOMATION: Listen for the message from the popup
                                        const handleMessage = async (event) => {
                                            if (!event.data) return;

                                            console.log("Received LinkedIn Data:", event.data); // Debug logging

                                            // Logic to handle both Array (n8n standard) and Object
                                            let payload = event.data;
                                            if (Array.isArray(payload)) {
                                                payload = payload.reduce((acc, curr) => ({ ...acc, ...curr }), {});
                                            }

                                            const { sub, access_token } = payload;

                                            if (sub && access_token) {
                                                try {
                                                    const token = localStorage.getItem('token');
                                                    const response = await fetch('http://127.0.0.1:3000/careerlens/save-linkedin-credentials', {
                                                        method: 'POST',
                                                        headers: {
                                                            'Content-Type': 'application/json',
                                                            'Authorization': `Bearer ${token}`
                                                        },
                                                        body: JSON.stringify({
                                                            userID: user.id || user._id,
                                                            sub,
                                                            accessToken: access_token
                                                        })
                                                    });
                                                    const result = await response.json();
                                                    if (result.success) {
                                                        alert("LinkedIn connected successfully!");
                                                        popup?.close();
                                                        window.removeEventListener('message', handleMessage);

                                                        // Update local user state
                                                        const updatedUser = { ...user, linkedinSub: sub, linkedinAccessToken: access_token };
                                                        setUser(updatedUser);
                                                        localStorage.setItem('user', JSON.stringify(updatedUser));
                                                    }
                                                } catch (err) {
                                                    console.error("Auto-save creds error", err);
                                                }
                                            }
                                        };

                                        window.addEventListener('message', handleMessage);

                                        // Cleanup listener after 2 minutes
                                        setTimeout(() => window.removeEventListener('message', handleMessage), 120000);
                                    }}
                                    className="flex-1 bg-[#0077b5] hover:bg-[#006396] text-white py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-[#0077b5]/20 group"
                                >
                                    <Linkedin size={18} className="group-hover:scale-110 transition-transform" />
                                    <span>LinkedIn</span>
                                </button>
                                <button
                                    onClick={() => {
                                        window.location.href = 'http://127.0.0.1:3000/careerlens/github/login';
                                    }}
                                    className="flex-1 bg-[#24292e] hover:bg-[#1b1f23] text-white py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-black/20 group">
                                    <Github size={18} className="group-hover:scale-110 transition-transform" />
                                    <span>GitHub</span>
                                </button>
                            </div>

                            {/* LinkedIn URL Input */}
                            <div className="relative">
                                <label className="text-xs text-gray-400 font-medium mb-1.5 block">LinkedIn Profile URL</label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <LinkIcon size={14} className="text-gray-500" />
                                        </div>
                                        <input
                                            type="text"
                                            value={linkedinUrl}
                                            onChange={(e) => setLinkedinUrl(e.target.value)}
                                            placeholder="https://linkedin.com/in/username"
                                            className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-9 pr-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#F2B42D] transition-colors"
                                        />
                                    </div>
                                    <button
                                        onClick={handleSaveLinkedinUrl}
                                        disabled={isSaving}
                                        className="bg-[#F2B42D] hover:bg-[#d99e1f] text-black rounded-lg px-3 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSaving ? (
                                            <div className="h-4 w-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                                        ) : (
                                            <Save size={18} />
                                        )}
                                    </button>
                                </div>
                                <p className="text-[10px] text-gray-500 mt-2 text-center">
                                    Link your profile to generate better career insights.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="lg:col-span-8 space-y-6">
                        {/* Tasks - USES GLASS CARD */}
                        <div className="glass-card overflow-hidden">
                            <div className="p-6 border-b border-[#ffffff14] flex justify-between items-center">
                                <h3 className="font-bold text-white">Priority Tasks</h3>
                                <button className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 transition-colors">
                                    <MoreVertical size={16} />
                                </button>
                            </div>
                            <div className="w-full overflow-x-auto">
                                <table className="w-full text-left text-sm text-gray-400">
                                    <thead className="bg-white/5 text-xs uppercase font-semibold text-gray-300">
                                        <tr>
                                            <th className="px-6 py-4">Task Name</th>
                                            <th className="px-6 py-4">Category</th>
                                            <th className="px-6 py-4">Priority</th>
                                            <th className="px-6 py-4 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#ffffff14]">
                                        {user.stats?.tasks?.pending?.length > 0 ? user.stats.tasks.pending.map((task, i) => {
                                            const config = {
                                                career: 'bg-[#48A8E2]',
                                                skill: 'bg-[#D7425E]',
                                                social: 'bg-[#D7425E]',
                                                resume: 'bg-[#59ABA9]'
                                            };
                                            return (
                                                <tr key={i} className="hover:bg-white/5 transition-colors group">
                                                    <td className="px-6 py-4 font-medium text-white flex items-center gap-3">
                                                        <div className={`h-2 w-2 rounded-full ${config[task.category] || 'bg-white'} shadow-[0_0_6px_rgba(255,255,255,0.4)]`}></div>
                                                        <span className="group-hover:text-[#F2B42D] transition-colors line-clamp-1">{task.title}</span>
                                                    </td>
                                                    <td className="px-6 py-4 capitalize">{task.category}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 rounded text-[10px] font-bold border ${task.priority === 'High' ? 'text-[#D7425E] bg-[#D7425E]/10 border-[#D7425E]/20' :
                                                            task.priority === 'Medium' ? 'text-[#F2B42D] bg-[#F2B42D]/10 border-[#F2B42D]/20' :
                                                                'text-gray-400 bg-white/5 border-white/10'
                                                            }`}>{task.priority}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button onClick={() => navigate('/tasks')} className="text-[#F2B42D] hover:underline text-xs font-bold">Verify</button>
                                                    </td>
                                                </tr>
                                            );
                                        }) : (
                                            <tr>
                                                <td colSpan="4" className="px-6 py-10 text-center text-gray-500 italic">No pending tasks. Generate a new plan!</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Habits - USES GLASS CARD */}
                        <div className="glass-card p-6">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                                <div>
                                    <h3 className="font-bold text-white">Daily Habits</h3>
                                    <p className="text-sm text-gray-400">Current Streak: <span className="text-[#F2B42D] font-bold drop-shadow-[0_0_5px_rgba(242,180,45,0.4)]">{user.stats?.habits?.streak || 0} Days</span> 🔥</p>
                                </div>
                                <div className="flex gap-2">
                                    <button className="p-1 text-gray-400 hover:text-white"><ChevronLeft size={20} /></button>
                                    <button className="p-1 text-gray-400 hover:text-white"><ChevronRight size={20} /></button>
                                </div>
                            </div>
                            <div className="grid grid-cols-7 gap-2">
                                {['Mon', 'Tue', 'Wed'].map((day, i) => (
                                    <div key={i} className="flex flex-col items-center gap-2">
                                        <span className="text-xs text-gray-500 uppercase">{day}</span>
                                        <div className="h-10 w-10 rounded-lg bg-[#59ABA9]/10 border border-[#59ABA9]/30 flex items-center justify-center text-[#59ABA9]">
                                            <Check size={16} strokeWidth={3} />
                                        </div>
                                    </div>
                                ))}
                                <div className="flex flex-col items-center gap-2">
                                    <span className="text-xs text-gray-500 uppercase">Thu</span>
                                    <div className="h-10 w-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-500">
                                        <span className="text-xs font-bold">-</span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-center gap-2">
                                    <span className="text-xs text-[#F2B42D] font-bold uppercase">Today</span>
                                    <div className="h-10 w-10 rounded-lg bg-[#F2B42D] text-black shadow-[0_0_15px_rgba(242,180,45,0.4)] flex items-center justify-center cursor-pointer hover:scale-105 transition-transform">
                                        <Edit size={16} strokeWidth={3} />
                                    </div>
                                </div>
                                {['Sat', 'Sun'].map((day, i) => (
                                    <div key={i} className="flex flex-col items-center gap-2 opacity-40">
                                        <span className="text-xs text-gray-500 uppercase">{day}</span>
                                        <div className="h-10 w-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center"></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Widget */}
                <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end group">
                    <div className="mb-4 glass-card p-4 rounded-2xl rounded-tr-none shadow-[0_0_20px_rgba(242,180,45,0.15)] w-72 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none group-hover:pointer-events-auto bg-[#00002E]/90">
                        <p className="text-sm text-white font-medium mb-2">👋 Hi {user.Name?.split(' ')[0] || 'there'}!</p>
                        <p className="text-sm text-gray-400">I noticed you haven't completed your daily mock interview. Need help preparing?</p>
                        <div className="mt-3 flex gap-2">
                            <button className="flex-1 bg-white/10 hover:bg-white/20 text-xs text-white py-2 rounded-lg transition-colors border border-white/5">Not now</button>
                            <button className="flex-1 bg-[#F2B42D] hover:bg-[#D99E1F] text-xs text-black font-bold py-2 rounded-lg transition-colors shadow-lg shadow-[#F2B42D]/20">Let's start</button>
                        </div>
                    </div>
                    <div className="h-14 w-14 rounded-full bg-[#F2B42D] text-black shadow-[0_0_20px_rgba(242,180,45,0.5)] flex items-center justify-center cursor-pointer hover:scale-110 active:scale-95 transition-all relative border-2 border-[#D99E1F]">
                        <Zap size={24} fill="currentColor" />
                        <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-4 w-4">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#DD785E] opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-4 w-4 bg-[#DD785E] border-2 border-[#00002E]"></span>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
