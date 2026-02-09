import React, { useState, useEffect } from 'react';

import { useNavigate } from 'react-router-dom';
import { Loader2, Mic, StopCircle, ArrowRight, CheckCircle, Code, HelpCircle, Brain, Play } from 'lucide-react';
import Logo from '../components/Logo';
import BackgroundShapes from '../components/BackgroundShapes';
import VerbalGame from '../components/games/VerbalGame';
import FluencyGame from '../components/games/FluencyGame';
import NumberGame from '../components/games/NumberGame';
import SpatialGame from '../components/games/SpatialGame';
import MemoryGame from '../components/games/MemoryGame';
import PerceptualGame from '../components/games/PerceptualGame';
import ReasoningGame from '../components/games/ReasoningGame';

const GAMES = [
    { id: 'verbal', title: 'Verbal Comprehension', component: VerbalGame },
    { id: 'fluency', title: 'Word Fluency', component: FluencyGame },
    { id: 'number', title: 'Number Ability', component: NumberGame },
    { id: 'spatial', title: 'Spatial Ability', component: SpatialGame },
    { id: 'memory', title: 'Associative Memory', component: MemoryGame },
    { id: 'perceptual', title: 'Perceptual Speed', component: PerceptualGame },
    { id: 'reasoning', title: 'Inductive Reasoning', component: ReasoningGame },
];

const SkillAnalyzer = () => {
    const navigate = useNavigate();
    const [currentPhase, setCurrentPhase] = useState('intro');
    const [loading, setLoading] = useState(false);
    const [userId, setUserId] = useState(null);

    // Data States
    const [aptitudeQuestions, setAptitudeQuestions] = useState([]);
    const [currentAptitudeIndex, setCurrentAptitudeIndex] = useState(0);
    const [aptitudeAnswers, setAptitudeAnswers] = useState({});

    const [gameData, setGameData] = useState(null);
    const [gameIndex, setGameIndex] = useState(0);
    const [gameScores, setGameScores] = useState({});
    const [countdown, setCountdown] = useState(null);

    const [practicalTask, setPracticalTask] = useState(null);
    const [practicalCode, setPracticalCode] = useState("");

    const [interviewQuestion, setInterviewQuestion] = useState("Tell me about a time you handled a difficult challenge.");
    const [interviewAnswer, setInterviewAnswer] = useState("");
    const [isRecording, setIsRecording] = useState(false);

    const [finalReport, setFinalReport] = useState(null);

    // NEW: Phase Tracking
    const [completedPhases, setCompletedPhases] = useState({
        aptitude: false,
        games: false,
        practical: false,
        interview: false
    });

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user && user.id) setUserId(user.id);
        else if (user && user._id) setUserId(user._id);

        // Load Persistence
        const saved = localStorage.getItem('assessmentProgress');
        if (saved) {
            const parsed = JSON.parse(saved);
            setCompletedPhases(parsed.completedPhases || {});
            setAptitudeAnswers(parsed.aptitudeAnswers || {});
            setGameScores(parsed.gameScores || {});
            setPracticalCode(parsed.practicalCode || "");
            setInterviewAnswer(parsed.interviewAnswer || "");
            if (parsed.gameData) setGameData(parsed.gameData);
            if (parsed.aptitudeQuestions) setAptitudeQuestions(parsed.aptitudeQuestions);
            if (parsed.practicalTask) setPracticalTask(parsed.practicalTask);
        }
    }, []);

    // Save Progress Helper
    const saveProgress = (updates) => {
        const current = {
            completedPhases,
            aptitudeAnswers,
            gameScores,
            practicalCode,
            interviewAnswer,
            gameData,
            aptitudeQuestions,
            practicalTask,
            ...updates
        };
        localStorage.setItem('assessmentProgress', JSON.stringify(current));
    };

    const resetAssessment = () => {
        if (window.confirm("Are you sure you want to reset all progress? This will delete your current scores.")) {
            localStorage.removeItem('assessmentProgress');
            window.location.reload();
        }
    };

    // --- APTITUDE PHASE ---
    const startAptitude = async () => {
        if (completedPhases.aptitude) {
            setCurrentPhase('aptitude');
            return;
        }
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const headers = { 'Content-Type': 'application/json' };
            if (token && token !== 'undefined') headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch('http://127.0.0.1:3000/careerlens/skill/aptitude', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({ userID: userId })
            });
            const data = await res.json();
            if (data.success) {
                setAptitudeQuestions(data.questions);
                saveProgress({ aptitudeQuestions: data.questions });
                setCurrentPhase('aptitude');
            }
        } catch (e) {
            console.error(e);
            alert("Error starting aptitude test.");
        } finally {
            setLoading(false);
        }
    };

    const handleAptitudeOption = (option) => {
        const newAnswers = { ...aptitudeAnswers, [currentAptitudeIndex]: option };
        setAptitudeAnswers(newAnswers);
        saveProgress({ aptitudeAnswers: newAnswers });
    };

    const nextAptitude = () => {
        if (currentAptitudeIndex < aptitudeQuestions.length - 1) {
            setCurrentAptitudeIndex(prev => prev + 1);
        } else {
            const newCompleted = { ...completedPhases, aptitude: true };
            setCompletedPhases(newCompleted);
            saveProgress({ completedPhases: newCompleted });
            setCurrentPhase('intro');
        }
    };

    const startCountdown = (nextPhase) => {
        let count = 3;
        setCountdown(count);
        const timer = setInterval(() => {
            count--;
            if (count === 0) {
                clearInterval(timer);
                setCountdown(null);
                setCurrentPhase(nextPhase);
            } else {
                setCountdown(count);
            }
        }, 1000);
    };

    // --- GAMES PHASE ---
    const startGames = async () => {
        if (gameData) {
            setCurrentPhase('games');
            return;
        }
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const headers = { 'Content-Type': 'application/json' };
            if (token && token !== 'undefined') headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch('http://127.0.0.1:3000/careerlens/skill/games', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({ userID: userId })
            });
            const data = await res.json();
            if (data.success) {
                setGameData(data.gameData);
                saveProgress({ gameData: data.gameData });
                startCountdown('games');
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleGameComplete = (gameId, scoreData) => {
        const newScores = { ...gameScores, [gameId]: scoreData };
        setGameScores(newScores);
        saveProgress({ gameScores: newScores });

        if (gameIndex < GAMES.length - 1) {
            setGameIndex(prev => prev + 1);
            startCountdown('games');
        } else {
            const newCompleted = { ...completedPhases, games: true };
            setCompletedPhases(newCompleted);
            saveProgress({ completedPhases: newCompleted });
            setGameIndex(0); // Reset for next time
            setCurrentPhase('intro');
        }
    };

    // --- PRACTICAL PHASE ---
    const startPractical = async () => {
        if (practicalTask) {
            setCurrentPhase('practical');
            return;
        }
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const headers = { 'Content-Type': 'application/json' };
            if (token && token !== 'undefined') headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch('http://127.0.0.1:3000/careerlens/skill/practical', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({ userID: userId })
            });
            const data = await res.json();
            if (data.success) {
                setPracticalTask(data.task);
                saveProgress({ practicalTask: data.task });
                setCurrentPhase('practical');
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const submitPractical = () => {
        const newCompleted = { ...completedPhases, practical: true };
        setCompletedPhases(newCompleted);
        saveProgress({ completedPhases: newCompleted, practicalCode });
        setCurrentPhase('intro');
    };

    // --- INTERVIEW PHASE ---
    const startInterview = () => {
        setCurrentPhase('interview');
    };

    const toggleRecording = () => {
        if (isRecording) {
            setIsRecording(false);
        } else {
            setIsRecording(true);
            setTimeout(() => {
                const newAns = interviewAnswer + " [Transcript recorded]";
                setInterviewAnswer(newAns);
                saveProgress({ interviewAnswer: newAns });
            }, 2000);
        }
    };

    const finalizeInterview = () => {
        const newCompleted = { ...completedPhases, interview: true };
        setCompletedPhases(newCompleted);
        saveProgress({ completedPhases: newCompleted, interviewAnswer });
        setCurrentPhase('intro');
    };

    const finishAssessment = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const headers = { 'Content-Type': 'application/json' };
            if (token && token !== 'undefined') headers['Authorization'] = `Bearer ${token}`;

            const aptitudeScore = aptitudeQuestions.reduce((acc, q, idx) => {
                return acc + (aptitudeAnswers[idx] === q.correctAnswer ? 1 : 0);
            }, 0);

            const res = await fetch('http://127.0.0.1:3000/careerlens/skill/finalize', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    userID: userId,
                    aptitudeResults: { score: aptitudeScore, total: aptitudeQuestions.length },
                    gameResults: gameScores,
                    practicalResults: { code: practicalCode, task: practicalTask },
                    interviewResults: { answer: interviewAnswer, question: interviewQuestion }
                })
            });
            const data = await res.json();
            if (data.success) {
                setFinalReport(data.report);
                setCurrentPhase('results');
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };


    // --- RENDERS ---

    const renderIntro = () => {
        const allDone = completedPhases.aptitude && completedPhases.games && completedPhases.practical && completedPhases.interview;

        const phases = [
            { id: 'aptitude', title: "Aptitude", desc: "12 Adaptive MCQs", color: "text-[#F2B42D]", border: "group-hover:border-[#F2B42D]/50", action: startAptitude },
            { id: 'games', title: "Cognitive", desc: "7 Mental Games", color: "text-[#D7425E]", border: "group-hover:border-[#D7425E]/50", action: startGames },
            { id: 'practical', title: "Practical", desc: "Real-world Task", color: "text-[#48A8E2]", border: "group-hover:border-[#48A8E2]/50", action: startPractical },
            { id: 'interview', title: "Interview", desc: "Voice Analysis", color: "text-[#59ABA9]", border: "group-hover:border-[#59ABA9]/50", action: startInterview },
        ];

        return (
            <div className="w-full max-w-5xl flex flex-col items-center text-center animate-fade-in z-10">
                <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/70 tracking-tight mb-4 italic">
                    Career DNA <span className="text-[#F2B42D]">Hub</span>
                </h1>
                <p className="text-gray-400 text-lg max-w-2xl mb-12">
                    Complete all 4 modules to unlock your hyper-personalized career roadmap.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full mb-12">
                    {phases.map((item, i) => (
                        <div
                            key={i}
                            onClick={item.action}
                            className={`glass-card p-6 rounded-2xl border border-white/5 transition-all duration-300 hover:-translate-y-1 group cursor-pointer relative overflow-hidden ${item.border}`}
                        >
                            {completedPhases[item.id] && (
                                <div className="absolute top-2 right-2 text-green-500">
                                    <CheckCircle size={20} fill="currentColor" className="text-white" />
                                </div>
                            )}
                            <div className={`text-sm font-bold uppercase tracking-widest mb-2 ${item.color}`}>Module {i + 1}</div>
                            <h3 className="text-xl font-bold text-white mb-1">{item.title}</h3>
                            <p className="text-sm text-gray-400">{item.desc}</p>
                            <div className="mt-4 pt-4 border-t border-white/5">
                                <span className={`text-xs font-bold uppercase tracking-widest ${completedPhases[item.id] ? 'text-green-500' : 'text-gray-500'}`}>
                                    {completedPhases[item.id] ? 'Completed' : 'Start Now'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                    {allDone ? (
                        <button
                            onClick={finishAssessment}
                            disabled={loading}
                            className="group relative px-10 py-5 bg-gradient-to-r from-[#F2B42D] to-[#D7425E] rounded-full font-bold text-white text-lg shadow-xl shadow-orange-500/20 hover:scale-105 hover:shadow-orange-500/40 transition-all disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin inline-block mr-2" /> : "Unlock Full Reports 🚀"}
                        </button>
                    ) : (
                        <p className="text-gray-500 font-bold italic">Complete all modules to generate report</p>
                    )}

                    <button
                        onClick={resetAssessment}
                        className="px-10 py-5 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-full font-bold transition-all"
                    >
                        Retake Test
                    </button>
                </div>
            </div>
        );
    };

    const renderAptitude = () => {
        const question = aptitudeQuestions[currentAptitudeIndex];
        return (
            <div className="w-full max-w-4xl animate-fade-in z-10">
                <div className="flex justify-between items-end mb-6 px-2">
                    <div>
                        <span className="text-[#F2B42D] font-bold uppercase tracking-widest text-xs block mb-1">Phase 1</span>
                        <h2 className="text-2xl font-bold text-white">Aptitude Assessment</h2>
                    </div>
                    <div className="text-right">
                        <span className="text-3xl font-bold text-white/20">{String(currentAptitudeIndex + 1).padStart(2, '0')}</span>
                        <span className="text-sm text-gray-500">/{aptitudeQuestions.length}</span>
                    </div>
                </div>

                <div className="glass-card p-8 md:p-12 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
                    {/* Progress Bar */}
                    <div className="absolute top-0 left-0 h-1 bg-gradient-to-r from-[#F2B42D] to-[#D7425E]" style={{ width: `${((currentAptitudeIndex + 1) / aptitudeQuestions.length) * 100}%` }}></div>

                    <h3 className="text-xl md:text-2xl font-medium leading-relaxed mb-10 text-white">
                        {question?.question}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {question?.options?.map((opt, i) => (
                            <button
                                key={i}
                                onClick={() => handleAptitudeOption(opt)}
                                className={`p-5 rounded-xl text-left border transition-all duration-200 group relative overflow-hidden ${aptitudeAnswers[currentAptitudeIndex] === opt
                                    ? 'bg-[#F2B42D] border-[#F2B42D] text-[#00002E] font-bold shadow-lg shadow-[#F2B42D]/20'
                                    : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 text-gray-300'
                                    }`}
                            >
                                <div className="flex items-center justify-between relative z-10">
                                    <span>{opt}</span>
                                    {aptitudeAnswers[currentAptitudeIndex] === opt && <CheckCircle size={20} />}
                                </div>
                            </button>
                        ))}
                    </div>

                    <div className="mt-10 flex justify-end">
                        <button
                            onClick={nextAptitude}
                            disabled={!aptitudeAnswers[currentAptitudeIndex]}
                            className="flex items-center gap-2 bg-[#D7425E] hover:bg-[#c13650] text-white px-8 py-3 rounded-xl font-bold transition-all disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed shadow-lg shadow-[#D7425E]/20"
                        >
                            Confirm Selection <ArrowRight size={18} />
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderGames = () => {
        const CurrentGame = GAMES[gameIndex].component;
        const currentData = gameData ? gameData[GAMES[gameIndex].id] : null;

        return (
            <div className="w-full max-w-5xl animate-fade-in z-10">
                <div className="flex justify-between items-center mb-6 px-2">
                    <div>
                        <span className="text-[#D7425E] font-bold uppercase tracking-widest text-xs block mb-1">Phase 2</span>
                        <h2 className="text-2xl font-bold text-white uppercase tracking-tighter">{GAMES[gameIndex].title}</h2>
                    </div>
                    <div className="flex gap-2">
                        {GAMES.map((_, i) => (
                            <div key={i} className={`h-2 w-2 rounded-full transition-all ${i === gameIndex ? 'bg-[#D7425E] w-6' : i < gameIndex ? 'bg-white' : 'bg-white/20'}`}></div>
                        ))}
                    </div>
                </div>

                <div className="glass-card rounded-3xl p-8 overflow-hidden border border-white/10 shadow-2xl min-h-[600px] flex flex-col relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-[#D7425E]/20">
                        <div className="h-full bg-[#D7425E] transition-all duration-500" style={{ width: `${((gameIndex + 1) / GAMES.length) * 100}%` }}></div>
                    </div>
                    <CurrentGame
                        data={currentData}
                        onComplete={(data) => handleGameComplete(GAMES[gameIndex].id, data)}
                    />
                </div>
            </div>
        );
    };

    const renderPractical = () => (
        <div className="w-full max-w-5xl animate-fade-in z-10">
            <div className="flex justify-between items-center mb-6 px-2">
                <div>
                    <span className="text-[#48A8E2] font-bold uppercase tracking-widest text-xs block mb-1">Phase 3</span>
                    <h2 className="text-2xl font-bold text-white">Practical Challenge</h2>
                </div>
            </div>

            <div className="glass-card border border-white/10 p-8 md:p-10 rounded-3xl shadow-2xl relative overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 space-y-6">
                        <div>
                            <h3 className="text-xl font-bold text-white mb-2">{practicalTask?.title || "Loading Task..."}</h3>
                            <p className="text-sm text-gray-400 leading-relaxed">{practicalTask?.description}</p>
                        </div>

                        <div className="bg-[#48A8E2]/10 border border-[#48A8E2]/20 rounded-xl p-4">
                            <h4 className="font-bold text-[#48A8E2] text-sm mb-3 flex items-center gap-2">
                                <CheckCircle size={14} /> Requirements
                            </h4>
                            <ul className="space-y-2">
                                {practicalTask?.requirements?.map((req, i) => (
                                    <li key={i} className="text-xs text-gray-300 flex items-start gap-2">
                                        <div className="w-1 h-1 rounded-full bg-[#48A8E2] mt-1.5 flex-shrink-0"></div>
                                        {req}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div className="lg:col-span-2 flex flex-col h-full">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Workspace</span>
                            <span className="px-2 py-1 bg-white/5 rounded text-[10px] text-gray-400 border border-white/10">Markdown / Code Supported</span>
                        </div>
                        <textarea
                            value={practicalCode}
                            onChange={(e) => setPracticalCode(e.target.value)}
                            placeholder="// Write your solution here..."
                            className="flex-1 w-full min-h-[400px] bg-[#00002E]/50 border border-white/10 rounded-xl p-6 font-mono text-sm text-gray-300 focus:border-[#48A8E2] focus:ring-1 focus:ring-[#48A8E2] focus:outline-none resize-none transition-all placeholder:text-gray-600"
                        ></textarea>

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={submitPractical}
                                className="bg-[#48A8E2] hover:bg-[#398aca] text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-[#48A8E2]/20 flex items-center gap-2 hover:-translate-y-0.5"
                            >
                                <Code size={18} /> Finish Module
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderInterview = () => (
        <div className="w-full max-w-3xl animate-fade-in z-10">
            <div className="text-center mb-8">
                <span className="text-[#59ABA9] font-bold uppercase tracking-widest text-xs block mb-2">Phase 4</span>
                <h2 className="text-3xl font-bold text-white">Final Interview</h2>
            </div>

            <div className="glass-card border border-white/10 p-10 rounded-3xl text-center shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-[#59ABA9]"></div>

                <div className="w-24 h-24 bg-[#59ABA9]/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-[#59ABA9]/20 shadow-[0_0_30px_rgba(89,171,169,0.15)]">
                    <Brain size={40} className="text-[#59ABA9]" />
                </div>

                <h3 className="text-2xl font-medium text-white mb-10 leading-snug">"{interviewQuestion}"</h3>

                <div className="mb-10 flex justify-center">
                    <button
                        onClick={toggleRecording}
                        className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${isRecording
                            ? 'bg-red-500 shadow-[0_0_40px_rgba(239,68,68,0.4)] scale-110'
                            : 'bg-white/10 hover:bg-white/20 border border-white/10'
                            }`}
                    >
                        {isRecording ? <StopCircle size={32} className="text-white animate-pulse" /> : <Mic size={32} className="text-white" />}
                    </button>
                </div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-widest mb-8">
                    {isRecording ? "Listening..." : "Click Mic to Answer"}
                </p>

                <div className="max-w-xl mx-auto">
                    <textarea
                        value={interviewAnswer}
                        onChange={(e) => setInterviewAnswer(e.target.value)}
                        placeholder="Alternatively, type your response here..."
                        className="w-full h-32 bg-[#00002E] border border-white/10 rounded-xl p-4 text-sm text-white focus:border-[#59ABA9] focus:outline-none mb-6 resize-none transition-all placeholder:text-gray-600"
                    />
                    <button
                        onClick={finalizeInterview}
                        disabled={loading}
                        className="w-full bg-[#59ABA9] hover:bg-[#478f8d] text-white py-4 rounded-xl font-bold transition-all shadow-lg shadow-[#59ABA9]/20 flex items-center justify-center gap-3"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <>Finish Module <CheckCircle size={20} /></>}
                    </button>
                </div>
            </div>
        </div>
    );
    const renderResults = () => (
        <div className="text-center max-w-5xl mx-auto animate-fade-in z-10 w-full mb-20 px-4">
            <div className="w-24 h-24 bg-[#F2B42D]/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-[#F2B42D]/30 shadow-[0_0_40px_rgba(242,180,45,0.2)]">
                <Brain size={48} className="text-[#F2B42D]" />
            </div>

            <div className="mb-12">
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 italic tracking-tighter">Your Career DNA</h1>
                <p className="text-[#F2B42D] text-2xl font-black uppercase tracking-widest">{finalReport?.targetRole || "Analytically Matched Role"}</p>
                <div className="h-1 w-32 bg-gradient-to-r from-[#F2B42D] to-[#D7425E] mx-auto mt-4 rounded-full"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 text-left">
                <div className="space-y-8">
                    {/* Score Chart */}
                    <div className="glass-card p-8 rounded-3xl border border-white/10">
                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[#D7425E]"></div> Cognitive Performance
                        </h3>
                        <div className="space-y-5">
                            {finalReport && Object.entries(finalReport.performanceAnalysis).map(([area, analysisData], i) => (
                                <div key={i}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-400 capitalize">{area}</span>
                                        <span className="text-white font-bold">{analysisData.score || 85}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-[#D7425E] to-[#F2B42D] transition-all duration-1000"
                                            style={{ width: `${analysisData.score || 85}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-[10px] text-gray-500 mt-2 leading-relaxed">{analysisData.text}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    {/* Strengths */}
                    <div className="glass-card p-8 rounded-3xl border border-white/10 bg-gradient-to-tr from-[#F2B42D]/10 to-transparent">
                        <h3 className="text-xl font-bold text-[#F2B42D] mb-4">Key Strengths</h3>
                        <div className="flex flex-wrap gap-2">
                            {finalReport?.strengths?.map((skill, i) => (
                                <span key={i} className="px-4 py-2 bg-[#F2B42D]/20 border border-[#F2B42D]/30 text-white text-xs font-bold rounded-full">
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Skill Gaps */}
                    <div className="glass-card p-8 rounded-3xl border border-white/10 bg-gradient-to-br from-[#D7425E]/10 to-transparent">
                        <h3 className="text-xl font-bold text-[#D7425E] mb-4">Critical Skill Gaps</h3>
                        <div className="space-y-2">
                            {finalReport?.skillGaps?.map((gap, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#D7425E]"></div>
                                    <p className="text-sm text-gray-400">{gap}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="glass-card p-8 rounded-3xl border border-white/10">
                        <h3 className="text-xl font-bold text-[#59ABA9] mb-4">Growth Strategy</h3>
                        <div className="space-y-4">
                            {finalReport?.improvementRoadmap?.map((step, i) => (
                                <div key={i} className="flex gap-4 items-start group">
                                    <div className="w-8 h-8 rounded-xl bg-[#59ABA9]/10 border border-[#59ABA9]/20 flex items-center justify-center text-[#59ABA9] text-sm font-black shrink-0 transition-all group-hover:bg-[#59ABA9] group-hover:text-white">
                                        {i + 1}
                                    </div>
                                    <p className="text-sm text-gray-300 leading-relaxed pt-1">{step}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <button
                onClick={() => navigate('/path')}
                className="bg-gradient-to-r from-[#F2B42D] to-[#D7425E] text-white px-12 py-5 rounded-full font-bold transition-all hover:scale-105 shadow-xl shadow-orange-500/20"
            >
                Unlock My Path Report 🚀
            </button>
        </div>
    );

    return (
        <div className="min-h-full relative font-display text-white flex flex-col select-none">
            {/* Countdown Overlay */}
            {countdown !== null && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#00002E]/80 backdrop-blur-xl animate-fade-in">
                    <div className="text-center">
                        <div className="text-sm font-bold text-[#D7425E] uppercase tracking-widest mb-4">Get Ready</div>
                        <div className="text-9xl font-black text-white animate-ping">{countdown}</div>
                        <div className="text-2xl font-bold text-white mt-8 italic">Next Ability: {GAMES[gameIndex].title}</div>
                    </div>
                </div>
            )}

            <main className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 relative z-10 w-full">
                {currentPhase === 'intro' && renderIntro()}
                {currentPhase === 'aptitude' && renderAptitude()}
                {currentPhase === 'games' && renderGames()}
                {currentPhase === 'practical' && renderPractical()}
                {currentPhase === 'interview' && renderInterview()}
                {currentPhase === 'results' && renderResults()}
            </main>
        </div>
    );
};


export default SkillAnalyzer;
