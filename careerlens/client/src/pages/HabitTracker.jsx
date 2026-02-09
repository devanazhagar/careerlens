import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Sparkles, Check,
    Calendar, Flame, Activity, Loader2, Info
} from 'lucide-react';
import Logo from '../components/Logo';

const HabitTracker = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [plan, setPlan] = useState(null);
    const [error, setError] = useState('');
    const [user] = useState(() => JSON.parse(localStorage.getItem('user') || '{}'));

    const currentMonth = new Date().toLocaleString('default', { month: 'long' });
    const currentYear = new Date().getFullYear();
    const daysInMonth = 31; // Simplified to 31 for the matrix UI

    useEffect(() => {
        fetchPlan();
    }, []);

    const fetchPlan = async () => {
        setLoading(true);
        try {
            const response = await fetch(`http://127.0.0.1:3000/careerlens/habit/get-plan?userID=${user.id || user._id}`);
            const data = await response.json();
            if (data.success) {
                setPlan(data.plan);
            }
        } catch (err) {
            setError('Failed to fetch habit plan');
        } finally {
            setLoading(false);
        }
    };

    const generatePlan = async () => {
        setGenerating(true);
        setError('');
        try {
            const response = await fetch('http://127.0.0.1:3000/careerlens/habit/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userID: user.id || user._id })
            });
            const data = await response.json();
            if (data.success) {
                setPlan(data.plan);
            } else {
                // If it's a parsing error but we got a plan/message, we can still show a notice
                setError(data.message || 'AI Generation failed');
                if (data.plan) setPlan(data.plan);
            }
        } catch (err) {
            console.error("Fetch error:", err);
            setError('Neural link unstable. Please verify your connection & try again.');
        } finally {
            setGenerating(false);
        }
    };

    const toggleDay = async (taskId, dayIndex) => {
        // Safe Immutable UI update
        setPlan(prev => {
            if (!prev) return prev;
            const updatedTasks = prev.tasks.map(task => {
                if (task._id === taskId) {
                    const newCompletions = [...task.completions];
                    newCompletions[dayIndex] = !newCompletions[dayIndex];
                    return { ...task, completions: newCompletions };
                }
                return task;
            });
            return { ...prev, tasks: updatedTasks };
        });

        try {
            await fetch('http://127.0.0.1:3000/careerlens/habit/toggle-day', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userID: user.id || user._id,
                    taskId,
                    dayIndex
                })
            });
        } catch (err) {
            console.error("Failed to sync habit toggle");
            // Revert on error if needed, but keeping it simple for now
        }
    };

    if (loading) {
        return (
            <div className="bg-[#00002E] min-h-screen flex flex-col items-center justify-center">
                <Loader2 className="animate-spin text-[#F2B42D] mb-4" size={48} />
                <p className="text-gray-400 font-bold tracking-widest uppercase text-xs">Accessing Neural Matrix...</p>
            </div>
        );
    }

    return (
        <div className="bg-[#00002E] min-h-screen font-display text-white relative overflow-x-hidden p-4 md:p-10 flex flex-col selection:bg-[#F2B42D] selection:text-black">
            {/* GRADIENTS */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#F2B42D] rounded-full opacity-10 blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#D7425E] rounded-full opacity-10 blur-[120px] pointer-events-none"></div>

            <div className="max-w-[1600px] w-full mx-auto relative z-10 space-y-8 pb-20">
                {/* Navbar */}
                <div className="flex items-center justify-between border-b border-white/5 pb-6">
                    <div className="flex items-center gap-6">
                        <Logo />
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-all border border-white/10 group"
                        >
                            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        </button>
                    </div>
                    <div className="hidden md:flex flex-col items-end">
                        <h2 className="text-xl font-black text-white">{currentMonth} {currentYear}</h2>
                        <p className="text-[10px] text-[#F2B42D] font-black uppercase tracking-widest">Growth Cycle Active</p>
                    </div>
                </div>

                {!plan ? (
                    <div className="flex flex-col items-center justify-center py-32 text-center space-y-8 animate-fade-in">
                        <div className="size-24 rounded-[40px] bg-white/5 border border-white/10 flex items-center justify-center relative">
                            <Sparkles className="text-[#F2B42D] animate-pulse" size={40} />
                            <div className="absolute inset-0 rounded-[40px] bg-[#F2B42D] opacity-10 blur-xl animate-pulse"></div>
                        </div>
                        <div className="max-w-md space-y-3">
                            <h1 className="text-3xl font-black">AI Habit Generator</h1>
                            <p className="text-gray-400 text-sm font-medium leading-relaxed">
                                We'll analyze your Career, Social, skills, and Resume reports to construct a scientific 31-day development roadmap.
                            </p>
                        </div>
                        <button
                            onClick={generatePlan}
                            disabled={generating}
                            className="bg-[#F2B42D] hover:bg-[#D99E1F] text-[#00002E] font-black py-4 px-10 rounded-2xl transition-all hover:scale-105 shadow-[0_0_30px_rgba(242,180,45,0.2)] disabled:opacity-50 flex items-center gap-3"
                        >
                            {generating ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
                            {generating ? 'Synthesizing Roadmap...' : 'Generate Monthly Plan'}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6 animate-fade-in">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-4xl font-black text-white">AI Momentum <span className="text-[#F2B42D]">Matrix</span></h1>
                                <p className="text-gray-400 text-sm font-medium mt-1">Daily micro-habits extracted from your professional DNA reports.</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={generatePlan}
                                    disabled={generating}
                                    className="px-4 py-2 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all text-gray-400 flex items-center gap-2"
                                >
                                    {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                                    Refine Plan
                                </button>
                            </div>
                        </div>

                        {/* Habit Grid Table */}
                        <div className="bg-[#00002E]/80 backdrop-blur-3xl border border-white/10 rounded-[40px] shadow-3xl overflow-hidden relative">
                            <div className="overflow-x-auto custom-scrollbar">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="border-b border-white/5 h-20 bg-white/5">
                                            <th className="sticky left-0 z-20 bg-[#00003E] px-8 text-left border-r border-white/5 min-w-[300px]">
                                                <span className="text-[10px] text-[#F2B42D] font-black uppercase tracking-widest">Habits & Strategic Shifts</span>
                                            </th>
                                            {Array.from({ length: 31 }, (_, i) => (
                                                <th key={i} className="min-w-[50px] text-center p-2">
                                                    <span className="text-[10px] font-black text-gray-500">{i + 1}</span>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {plan.tasks.map((task) => (
                                            <tr key={task._id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                                                <td className="sticky left-0 z-10 bg-[#00002E] px-8 py-6 border-r border-white/5 transition-colors group-hover:bg-[#00003E]">
                                                    <div className="space-y-1">
                                                        <p className="text-sm font-black text-white leading-tight group-hover:text-[#F2B42D] transition-colors">{task.taskName}</p>
                                                        <span className="text-[9px] font-black uppercase tracking-widest opacity-40 px-2 py-0.5 rounded border border-white/10">
                                                            {task.category}
                                                        </span>
                                                    </div>
                                                </td>
                                                {task.completions.map((completed, dayIdx) => {
                                                    const categoryColors = {
                                                        career: '#F2B42D',
                                                        skill: '#48A8E2',
                                                        social: '#D7425E',
                                                        resume: '#59ABA9',
                                                        general: '#ffffff'
                                                    };
                                                    const color = categoryColors[task.category] || categoryColors.general;
                                                    return (
                                                        <td key={dayIdx} className="p-1 min-w-[50px]">
                                                            <div className="flex items-center justify-center size-full">
                                                                <div
                                                                    onClick={() => toggleDay(task._id, dayIdx)}
                                                                    className={`size-7 rounded-lg border-2 cursor-pointer transition-all flex items-center justify-center
                                                                        ${completed
                                                                            ? 'shadow-[0_0_12px_rgba(255,255,255,0.2)]'
                                                                            : 'bg-black/40 border-white/10 hover:border-white/30'}
                                                                    `}
                                                                    style={{
                                                                        borderColor: completed ? color : `${color}40`,
                                                                        backgroundColor: completed ? color : 'transparent'
                                                                    }}
                                                                >
                                                                    {completed && <Check size={16} strokeWidth={4} className="text-[#00002E]" />}
                                                                </div>
                                                            </div>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Stats Panel */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex items-center gap-6">
                                <div className="size-16 rounded-2xl bg-[#F2B42D]/10 flex items-center justify-center text-[#F2B42D] border border-[#F2B42D]/20">
                                    <Flame size={28} className="fill-[#F2B42D]" />
                                </div>
                                <div>
                                    <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Active Velocity</p>
                                    <p className="text-3xl font-black text-white">
                                        {Array.from({ length: 31 }).filter((_, i) => plan.tasks.some(t => t.completions[i])).length}
                                        <span className="text-sm font-medium text-gray-500 ml-2">Days Active</span>
                                    </p>
                                </div>
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex items-center gap-6">
                                <div className="size-16 rounded-2xl bg-[#48A8E2]/10 flex items-center justify-center text-[#48A8E2] border border-[#48A8E2]/20">
                                    <Activity size={28} />
                                </div>
                                <div>
                                    <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Monthly Consistency</p>
                                    <p className="text-3xl font-black text-white">
                                        {Math.round((plan.tasks.reduce((acc, t) => acc + t.completions.filter(c => c).length, 0) / (plan.tasks.length * 31)) * 100) || 0}%
                                        <span className="text-sm font-medium text-gray-500 ml-2">Completed</span>
                                    </p>
                                </div>
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex items-center gap-4 border-dashed opacity-50">
                                <div className="size-16 rounded-2xl bg-white/5 flex items-center justify-center text-gray-400">
                                    <Info size={28} />
                                </div>
                                <p className="text-xs text-gray-500 font-medium">Daily resets occur at midnight. Tracking persists across sessions.</p>
                            </div>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center gap-3 text-red-500 text-sm font-bold">
                        <Info size={18} />
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
};

export default HabitTracker;
