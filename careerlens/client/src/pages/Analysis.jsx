import React, { useEffect, useState } from 'react';

import { useNavigate } from 'react-router-dom';
import { Sparkles, Brain, Compass, ArrowLeft, LayoutDashboard, AlertCircle, Loader2 } from 'lucide-react';
import Logo from '../components/Logo';
import BackgroundShapes from '../components/BackgroundShapes';


const Analysis = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [report, setReport] = useState(null);
    const [error, setError] = useState(null);



    useEffect(() => {
        const startAnalysis = async () => {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            try {
                const token = localStorage.getItem('token');

                const response = await fetch('http://127.0.0.1:3000/careerlens/analysis/analyze', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                    },
                    body: JSON.stringify({ userID: user._id })
                });

                const data = await response.json();
                console.log("Analysis Response:", data);

                if (data.success === false) {
                    throw new Error(data.message || data.error?.message || "Server reported failure.");
                }

                if (!data.analysis) {
                    throw new Error("No analysis received. The AI may have failed to generate a response.");
                }

                setReport(data.analysis);
            } catch (err) {
                console.error("Analysis Error:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        startAnalysis();
    }, []);

    const createMarkup = (html) => ({ __html: html });

    return (
        <div className="bg-[#00002E] font-display text-white min-h-screen relative overflow-x-hidden selection:bg-[#F2B42D]/30">
            <BackgroundShapes />


            <div className="relative z-10 flex h-full flex-col">
                <header className="flex items-center justify-between border-b border-white/5 px-6 md:px-20 py-6 sticky top-0 z-50 bg-[#00002E]/80 backdrop-blur-md">
                    <div className="flex items-center gap-4 text-white">
                        <Logo />
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="px-3 py-1 rounded-full border border-white/10 bg-white/5">
                            <span className="text-[10px] uppercase tracking-[0.2em] text-white/60 font-bold">Analysis Phase</span>
                        </div>
                    </div>
                </header>

                <main className="relative flex flex-1 flex-col items-center justify-center px-4 py-12">
                    {/* Decorative Elements */}
                    <div className="hidden xl:block absolute top-[15%] left-[10%] border border-white/10 bg-white/5 backdrop-blur-xl p-5 rounded-2xl w-56 rotate-[-8deg] hover:rotate-0 transition-transform duration-500">
                        <div className="flex items-center gap-3 mb-4">
                            <Brain className="text-[#48A8E2]" size={20} />
                            <div className="h-1.5 w-20 bg-white/20 rounded"></div>
                        </div>
                        <div className="space-y-2 opacity-40">
                            <div className="h-1 w-full bg-white/10 rounded"></div>
                            <div className="h-1 w-2/3 bg-white/10 rounded"></div>
                        </div>
                    </div>

                    {/* Main Pulse Animation */}
                    <div className="relative flex items-center justify-center mb-16 scale-75 md:scale-100">
                        <div className="absolute size-[400px] bg-[#48A8E2]/20 rounded-full blur-[80px] animate-pulse"></div>
                        <div className="absolute size-[350px] bg-[#D7425E]/20 rounded-full blur-[60px] animate-pulse delay-700"></div>
                        <div className="absolute size-[300px] bg-[#F2B42D]/20 rounded-full blur-[40px] animate-pulse delay-1000"></div>

                        <div className="relative size-72 flex items-center justify-center">
                            <div className="absolute inset-0 border-[3px] border-transparent border-t-[#48A8E2]/60 rounded-full animate-spin duration-[10s] linear infinite"></div>
                            <div className="absolute inset-6 border-[2px] border-transparent border-b-[#D7425E]/60 rounded-full animate-spin duration-[15s] linear infinite reverse"></div>
                            <div className="absolute inset-12 border-[2px] border-transparent border-l-[#F2B42D]/60 rounded-full animate-spin duration-[6s] linear infinite"></div>

                            <div className="size-36 rounded-full bg-[#00002E]/80 backdrop-blur-xl border border-white/10 flex items-center justify-center shadow-2xl relative z-10 transition-all duration-500 hover:scale-110 hover:shadow-[0_0_50px_rgba(242,180,45,0.2)]">
                                <Sparkles className="text-white animate-pulse" size={48} />
                                <div className="absolute inset-0 rounded-full bg-white/5 animate-ping opacity-20"></div>
                            </div>
                        </div>
                    </div>

                    <div className="max-w-2xl text-center z-20 space-y-6">
                        <h1 className="text-white text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.1] animate-fade-in">
                            Analyzing your intent and mapping your future...
                        </h1>
                        <div className="flex flex-col items-center gap-3 animate-fade-in delay-100">
                            <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-full border border-white/10 backdrop-blur-sm">
                                <div className="size-2 rounded-full bg-[#48A8E2] animate-pulse"></div>
                                <p className="text-white/80 text-sm font-medium tracking-wide uppercase">Synthesizing Aspirations & Market Data</p>
                            </div>
                        </div>
                    </div>

                    {/* Report Section */}
                    <div className="w-full max-w-5xl mx-auto px-6 mt-12 mb-12 animate-pop">
                        <div className="bg-white/5 backdrop-blur-xl border border-[#F2B42D]/20 rounded-2xl p-8 relative overflow-hidden transition-all duration-300 hover:border-[#F2B42D]/40">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-[#F2B42D]/10 rounded-lg">
                                    <Sparkles className="text-[#F2B42D] animate-spin-slow" size={24} />
                                </div>
                                <h2 className="text-2xl font-bold text-white">Gemini Career Analysis</h2>
                            </div>

                            <div className="text-slate-300 text-lg leading-relaxed min-h-[120px] max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                                {loading && (
                                    <div className="flex flex-col items-center justify-center h-40 gap-4">
                                        <Loader2 className="text-[#F2B42D] animate-spin" size={32} />
                                        <div className="flex items-center gap-2">
                                            <span className="size-2 bg-[#F2B42D] rounded-full animate-bounce"></span>
                                            <span className="size-2 bg-[#48A8E2] rounded-full animate-bounce delay-150"></span>
                                            <span className="size-2 bg-[#D7425E] rounded-full animate-bounce delay-300"></span>
                                            <span className="text-sm font-medium text-slate-400 ml-2">Connecting to CareerLens Neural Network...</span>
                                        </div>
                                    </div>
                                )}

                                {error && (
                                    <div className="text-red-400 p-4 border border-red-500/30 rounded-lg bg-red-500/10 flex items-start gap-3">
                                        <AlertCircle size={20} className="shrink-0 mt-0.5" />
                                        <div>
                                            <strong className="block mb-1">Analysis Failed</strong>
                                            <span className="text-sm opacity-80">{error}</span>
                                        </div>
                                    </div>
                                )}

                                {!loading && !error && report && (
                                    <div className="animate-fade-in space-y-4" dangerouslySetInnerHTML={createMarkup(report)} />
                                )}
                            </div>

                            {/* Decorative Glow */}
                            <div className="absolute -top-10 -right-10 w-64 h-64 bg-[#F2B42D]/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>
                        </div>
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex items-center justify-between w-full max-w-4xl mx-auto pb-12 gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-2 px-8 py-4 rounded-xl bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all border border-white/5 hover:border-white/10"
                        >
                            <ArrowLeft size={20} />
                            <span className="font-bold">Back</span>
                        </button>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="flex-1 max-w-xs group relative flex items-center justify-center gap-3 rounded-xl px-8 h-16 bg-gradient-to-r from-[#F2B42D] to-[#DD785E] text-[#0a0e1a] text-lg font-bold shadow-lg hover:shadow-[#F2B42D]/25 hover:-translate-y-0.5 transition-all"
                        >
                            <span>View Dashboard</span>
                            <LayoutDashboard size={20} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Analysis;
