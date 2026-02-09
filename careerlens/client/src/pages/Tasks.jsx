import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Plus, Trash2, Check, Sparkles,
    ClipboardList, AlertCircle, Clock, CheckCircle2,
    Calendar as CalendarIcon, Loader2, Brain, X, Info
} from 'lucide-react';

const Tasks = () => {
    const navigate = useNavigate();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('all');

    // Test Modal State
    const [showTestModal, setShowTestModal] = useState(false);
    const [activeTask, setActiveTask] = useState(null);
    const [testLoading, setTestLoading] = useState(false);
    const [testData, setTestData] = useState(null);
    const [selectedAnswer, setSelectedAnswer] = useState('');
    const [testFeedback, setTestFeedback] = useState(null);

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userID = user.id || user._id;

    useEffect(() => {
        if (userID) {
            fetchTasks();
        } else {
            setError('User session expired. Please log in again.');
            setLoading(false);
        }
    }, [userID]);

    const fetchTasks = async () => {
        if (!userID) return;
        setLoading(true);
        try {
            const response = await fetch(`http://127.0.0.1:3000/careerlens/tasks?userID=${userID}`);
            const data = await response.json();
            if (data.success) {
                setTasks(data.tasks);
            }
        } catch (err) {
            setError('Neural link disconnected. Check your connection.');
        } finally {
            setLoading(false);
        }
    };

    const generateAIPlan = async () => {
        setGenerating(true);
        setError('');
        try {
            const response = await fetch('http://127.0.0.1:3000/careerlens/tasks/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userID })
            });
            const data = await response.json();
            if (data.success) {
                setTasks(data.tasks);
            } else {
                setError(data.message || 'AI synthesis failed.');
            }
        } catch (err) {
            setError('Neural link error. Connection unstable.');
        } finally {
            setGenerating(false);
        }
    };

    const handleCheckClick = async (task) => {
        setActiveTask(task);
        setShowTestModal(true);
        setTestLoading(true);
        setTestData(null);
        setSelectedAnswer('');
        setTestFeedback(null);

        try {
            const response = await fetch(`http://127.0.0.1:3000/careerlens/tasks/test/${task._id}`);
            const data = await response.json();
            if (data.success) {
                setTestData(data.test);
            } else {
                setError(data.message || 'Failed to load certification test.');
            }
        } catch (err) {
            setError('Test generation failed.');
        } finally {
            setTestLoading(false);
        }
    };

    const submitTest = async () => {
        if (!selectedAnswer) return;
        setTestLoading(true);
        try {
            const response = await fetch('http://127.0.0.1:3000/careerlens/tasks/submit-test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ taskId: activeTask._id, answer: selectedAnswer })
            });
            const data = await response.json();
            if (data.success) {
                if (data.passed) {
                    setTestFeedback({ type: 'success', message: data.message });
                    setTimeout(() => {
                        setTasks(prev => prev.filter(t => t._id !== activeTask._id));
                        setShowTestModal(false);
                    }, 2000);
                } else {
                    setTestFeedback({ type: 'error', message: data.message, explanation: data.explanation });
                }
            }
        } catch (err) {
            setError('Verification linked failed.');
        } finally {
            setTestLoading(false);
        }
    };

    const getCategoryStyles = (cat) => {
        switch (cat?.toLowerCase()) {
            case 'career': return { color: '#F2B42D', bg: 'bg-[#F2B42D]/10', border: 'border-[#F2B42D]/20' };
            case 'skill': return { color: '#48A8E2', bg: 'bg-[#48A8E2]/10', border: 'border-[#48A8E2]/20' };
            case 'social': return { color: '#D7425E', bg: 'bg-[#D7425E]/10', border: 'border-[#D7425E]/20' };
            case 'resume': return { color: '#59ABA9', bg: 'bg-[#59ABA9]/10', border: 'border-[#59ABA9]/20' };
            default: return { color: '#ffffff', bg: 'bg-white/10', border: 'border-white/20' };
        }
    };

    return (
        <div className="p-6 md:p-10 relative">
            <div className="w-full max-w-5xl relative z-10 space-y-10 pb-20 animate-in fade-in duration-700 mx-auto">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div className="space-y-4">
                        <h1 className="text-5xl font-black tracking-tight text-white leading-tight">
                            Strategic <span className="text-[#F2B42D]">Tasks</span>
                        </h1>
                        <p className="text-gray-400 font-medium max-w-lg">Actionable development steps synthesized from your professional analysis. Pass the AI verification test to complete each milestone.</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={generateAIPlan}
                            disabled={generating || loading}
                            className="bg-white/5 border border-white/10 hover:border-[#F2B42D]/50 text-white font-black px-6 py-3 rounded-2xl flex items-center gap-3 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {generating ? <Loader2 className="animate-spin" size={18} /> : <Sparkles className="text-[#F2B42D]" size={18} />}
                            {tasks.length > 0 ? "Regenerate Plan" : "Generate AI Plan"}
                        </button>
                    </div>
                </div>

                {/* Task List Container */}
                <div className="bg-[#00003E]/40 backdrop-blur-3xl border border-white/10 rounded-[40px] shadow-3xl overflow-hidden min-h-[500px] p-2">
                    <div className="p-6 md:p-10 space-y-4">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-[400px] space-y-4">
                                <Loader2 className="animate-spin text-[#F2B42D]" size={40} />
                                <p className="text-gray-500 font-black uppercase tracking-widest text-[10px]">Loading Strategy...</p>
                            </div>
                        ) : tasks.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-[400px] text-center space-y-6">
                                <div className="size-20 bg-white/5 rounded-[30px] flex items-center justify-center text-gray-700 border border-white/5">
                                    <Brain size={40} />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-black text-white">Your Action Plan is Empty</h3>
                                    <p className="text-gray-500 text-sm max-w-sm mx-auto">Generate a new set of strategic tasks based on your latest career and skill reports.</p>
                                </div>
                                <button
                                    onClick={generateAIPlan}
                                    className="bg-[#F2B42D] text-[#00002E] font-black px-10 py-4 rounded-2xl shadow-2xl shadow-[#F2B42D]/20 hover:scale-105 transition-all"
                                >
                                    Initiate AI Synthesis
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {tasks.map((task, idx) => {
                                    const styles = getCategoryStyles(task.category);
                                    return (
                                        <div
                                            key={task._id}
                                            className="group bg-white/[0.03] border border-white/5 hover:border-white/10 rounded-3xl p-6 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
                                            style={{ animationDelay: `${idx * 100}ms` }}
                                        >
                                            <div className="flex items-start gap-6">
                                                <div
                                                    onClick={() => handleCheckClick(task)}
                                                    className="size-10 rounded-2xl border-2 flex items-center justify-center cursor-pointer transition-all hover:scale-110 active:scale-90"
                                                    style={{ borderColor: `${styles.color}40`, backgroundColor: 'rgba(0,0,0,0.2)' }}
                                                >
                                                    <div className="size-4 rounded-full" style={{ backgroundColor: `${styles.color}20` }}></div>
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-3">
                                                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${styles.bg} ${styles.border}`} style={{ color: styles.color }}>
                                                            {task.category}
                                                        </span>
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">{task.priority} Priority</span>
                                                    </div>
                                                    <h3 className="text-lg font-bold text-white group-hover:text-[#F2B42D] transition-colors">{task.title}</h3>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleCheckClick(task)}
                                                className="bg-white/5 hover:bg-white/10 border border-white/5 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                            >
                                                Verify Task
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Info Tip */}
                <div className="flex items-center gap-3 px-10 py-6 bg-white/5 border border-white/10 rounded-[30px] opacity-60">
                    <div className="size-8 rounded-xl bg-[#48A8E2]/20 flex items-center justify-center text-[#48A8E2]">
                        <Info size={16} />
                    </div>
                    <p className="text-xs text-gray-400 font-medium">Verify completion by passing a quick modular test tailored to each specific growth task.</p>
                </div>
            </div>

            {/* AI Test Modal */}
            {showTestModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-2xl bg-black/60">
                    <div className="bg-[#00003E] border border-white/10 w-full max-w-xl max-h-[90vh] rounded-[40px] shadow-3xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col">
                        {/* Modal Header */}
                        <div className="px-10 py-8 border-b border-white/5 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="size-12 rounded-2xl bg-[#F2B42D]/10 flex items-center justify-center text-[#F2B42D]">
                                    <Brain size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-white">Verification Test</h3>
                                    <p className="text-xs text-gray-500 font-medium">{activeTask?.title}</p>
                                </div>
                            </div>
                            <button onClick={() => setShowTestModal(false)} className="text-gray-500 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-10 space-y-8 overflow-y-auto flex-1 custom-scrollbar">
                            {testLoading ? (
                                <div className="h-60 flex flex-col items-center justify-center space-y-4">
                                    <Loader2 className="animate-spin text-[#F2B42D]" size={30} />
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Synthesizing Challenge...</p>
                                </div>
                            ) : testData ? (
                                <div className="space-y-8">
                                    <p className="text-lg font-bold text-white">{testData.question}</p>

                                    <div className="grid grid-cols-1 gap-3">
                                        {testData.options.map((opt, i) => (
                                            <button
                                                key={i}
                                                onClick={() => !testFeedback && setSelectedAnswer(opt)}
                                                className={`w-full text-left p-5 rounded-2xl border-2 transition-all font-medium flex justify-between items-center group
                                                    ${selectedAnswer === opt ? 'border-[#F2B42D] bg-[#F2B42D]/5 text-white' : 'border-white/5 hover:border-white/20 bg-black/20 text-gray-400'}
                                                    ${testFeedback?.type === 'success' && testData.correctAnswer === opt ? 'border-emerald-500 bg-emerald-500/10' : ''}
                                                `}
                                            >
                                                <span>{opt}</span>
                                                <div className={`size-5 rounded-full border-2 transition-all ${selectedAnswer === opt ? 'border-[#F2B42D] scale-110' : 'border-white/10'}`}>
                                                    {selectedAnswer === opt && <div className="size-full rounded-full border-[5px] border-[#00003E] bg-[#F2B42D]" />}
                                                </div>
                                            </button>
                                        ))}
                                    </div>

                                    {testFeedback && (
                                        <div className={`p-6 rounded-3xl border animate-in slide-in-from-bottom-2 duration-300 ${testFeedback.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-red-500/10 border-red-500/20 text-red-300'}`}>
                                            <div className="flex items-center gap-3 mb-2">
                                                {testFeedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                                                <p className="font-black uppercase tracking-widest text-[10px]">{testFeedback.type === 'success' ? 'Verification Passed' : 'Verification Failed'}</p>
                                            </div>
                                            <p className="text-sm font-medium leading-relaxed">{testFeedback.message}</p>
                                            {testFeedback.explanation && <p className="mt-3 text-[11px] font-bold text-white/40">Hint: {testFeedback.explanation}</p>}
                                        </div>
                                    )}
                                </div>
                            ) : null}
                        </div>

                        {/* Modal Footer */}
                        {!testLoading && testData && (
                            <div className="px-10 py-8 bg-black/20 border-t border-white/5 flex justify-end gap-4 shrink-0">
                                <button
                                    onClick={() => setShowTestModal(false)}
                                    className="px-6 py-2 text-gray-500 font-bold hover:text-white transition-all text-sm"
                                >
                                    Cancel
                                </button>
                                {testFeedback?.type !== 'success' && (
                                    <button
                                        onClick={submitTest}
                                        disabled={!selectedAnswer}
                                        className="bg-[#F2B42D] disabled:opacity-50 text-[#00002E] font-black px-10 py-2 rounded-xl transition-all shadow-xl shadow-[#F2B42D]/20 active:scale-95"
                                    >
                                        Submit Answer
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Tasks;
