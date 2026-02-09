import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Upload, FileText, CheckCircle, AlertTriangle, MessageSquare, Send, X, Loader2, Award, Zap, ChevronRight, Bot, FileDown } from 'lucide-react';
import Logo from '../components/Logo';


const ResumeAnalyzer = () => {
    const [file, setFile] = useState(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [result, setResult] = useState(null);
    const [resumeText, setResumeText] = useState(null); // Will hold base64 or text context
    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [generatedContent, setGeneratedContent] = useState(null);
    const [chatOpen, setChatOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'system', content: 'You are a helpful career assistant.' },
        { role: 'assistant', content: 'Hi! I have analyzed your resume. Feel free to ask me any questions about how to improve it!' }
    ]);
    const [inputMessage, setInputMessage] = useState('');
    const chatEndRef = useRef(null);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setResult(null);
            setResumeText(null);
        }
    };

    const handleAnalyze = async () => {
        if (!file) return;

        setAnalyzing(true);
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const userID = user.id || user._id;

        const formData = new FormData();
        formData.append('resume', file);
        if (userID) formData.append('userID', userID);

        try {
            const response = await fetch('http://127.0.0.1:3000/careerlens/resume/analyze', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();
            if (data.success) {
                setResult(data.analysis);
                setResumeText(data.extracted_text);
                setMessages([
                    { role: 'system', content: `You are a helpful career assistant. Context: analyzed resume of user.` },
                    { role: 'assistant', content: `I've finished analyzing ${file.name}. Here is what I found. What would you like to know more about?` }
                ]);
            } else {
                alert('Analysis failed: ' + (data.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Something went wrong during analysis.');
        } finally {
            setAnalyzing(false);
        }
    };

    const handleGenerateResume = async () => {
        if (!resumeText) {
            alert("Please analyze a resume first to generate a new version.");
            return;
        }
        setGenerating(true);
        setShowGenerateModal(true);

        try {
            const response = await fetch('http://127.0.0.1:3000/careerlens/resume/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ current_resume_text: resumeText })
            });
            const data = await response.json();

            if (data.success) {
                setGeneratedContent(data.data);
            } else {
                alert("Generation failed: " + (data.message || 'Unknown error'));
                setShowGenerateModal(false);
            }

        } catch (error) {
            console.error("Generation Error:", error);
            alert("Error generating resume.");
            setShowGenerateModal(false);
        } finally {
            setGenerating(false);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputMessage.trim()) return;

        const newUserMsg = { role: 'user', content: inputMessage };
        setMessages(prev => [...prev, newUserMsg]);
        setInputMessage('');

        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

        try {
            const contextMessages = result ?
                [
                    { role: 'system', content: `Current Resume Analysis Context: ${JSON.stringify(result)}` },
                    ...messages.filter(m => m.role !== 'system'),
                    newUserMsg
                ] :
                [...messages, newUserMsg];

            const response = await fetch('http://127.0.0.1:3000/careerlens/resume/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: contextMessages })
            });
            const data = await response.json();

            if (data.success) {
                setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
            }

        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="min-h-full text-white font-inter relative select-none">
            {/* Generate Modal */}
            {showGenerateModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#0a0e1a] border border-white/10 rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col relative animate-pop shadow-2xl">
                        <button
                            onClick={() => setShowGenerateModal(false)}
                            className="absolute top-4 right-4 p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors z-10"
                        >
                            <X size={20} className="text-gray-400 hover:text-white" />
                        </button>

                        <div className="flex-none p-6 border-b border-white/10 bg-[#0a0e1a]">
                            <h2 className="text-2xl font-bold bg-gradient-to-r from-[#F2B42D] to-[#D7425E] bg-clip-text text-transparent flex items-center gap-3">
                                <Zap className="text-[#F2B42D]" fill="currentColor" /> AI Resume Generator
                            </h2>
                            <p className="text-gray-400 text-sm mt-1">Refined version & improvement guide based on your profile.</p>
                        </div>

                        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                            {generating ? (
                                <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-12">
                                    <Loader2 className="animate-spin text-[#F2B42D]" size={48} />
                                    <div>
                                        <h3 className="text-xl font-semibold">Crafting your perfect resume...</h3>
                                        <p className="text-gray-500">Optimizing keywords, formatting, and structure.</p>
                                    </div>
                                </div>
                            ) : generatedContent && (
                                <>
                                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 border-r border-white/10 bg-white/5">
                                        <h3 className="text-[#48A8E2] font-semibold mb-4">Refined Resume Sample</h3>
                                        <div className="markdown-content text-sm text-gray-300">
                                            <ReactMarkdown>{generatedContent.refined_resume_markdown}</ReactMarkdown>
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-[#0a0e1a]">
                                        <h3 className="text-[#D7425E] font-semibold mb-4">Improvement Guide</h3>
                                        <div className="markdown-content text-sm text-gray-300">
                                            <ReactMarkdown>{generatedContent.improvement_guide_markdown}</ReactMarkdown>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Action Bar */}
            <div className="p-4 sm:p-8 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">Resume <span className="text-[#F2B42D]">Analyzer</span></h2>
                <button
                    onClick={handleGenerateResume}
                    disabled={!result || analyzing}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <FileDown size={18} className="text-[#F2B42D] group-hover:scale-110 transition-transform" />
                    <span className="font-semibold text-sm">Generate Resume</span>
                </button>
            </div>

            {/* Main Content - Scrollable Areas */}
            <main className="flex-1 overflow-hidden relative z-10 p-4 sm:p-8 pt-0">
                <div className="max-w-7xl mx-auto h-full grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* Left Column: Upload - Scrollable */}
                    <div className="h-full overflow-y-auto custom-scrollbar pr-2">
                        <div className="glass-card p-8 border border-white/10 rounded-2xl bg-[#00002E]/50 mb-6">
                            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                                <Upload className="text-[#F2B42D]" size={20} />
                                Upload Resume
                            </h2>

                            <div className="relative group cursor-pointer">
                                <input
                                    type="file"
                                    onChange={handleFileChange}
                                    accept=".pdf,.doc,.docx,.txt"
                                    className="absolute inset-0 w-full h-full opacity-0 z-20 cursor-pointer"
                                />
                                <div className={`border-2 border-dashed border-gray-600 rounded-xl p-10 flex flex-col items-center justify-center transition-all duration-300 group-hover:border-[#F2B42D] group-hover:bg-white/5 ${file ? 'border-[#F2B42D] bg-white/5' : ''}`}>
                                    {file ? (
                                        <div className="text-center">
                                            <FileText size={48} className="mx-auto text-[#F2B42D] mb-4" />
                                            <p className="text-lg font-medium">{file.name}</p>
                                            <p className="text-sm text-gray-500 mt-2">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                        </div>
                                    ) : (
                                        <div className="text-center">
                                            <Upload size={48} className="mx-auto text-gray-500 mb-4 group-hover:scale-110 transition-transform" />
                                            <p className="text-lg font-medium text-gray-300">Drag & Drop or Click to Upload</p>
                                            <p className="text-sm text-gray-500 mt-2">PDF, DOCX, TXT (Max 10MB)</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <button
                                onClick={handleAnalyze}
                                disabled={!file || analyzing}
                                className={`mt-6 w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all duration-300 ${!file || analyzing ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-[#F2B42D] to-[#D7425E] text-[#00002E] hover:shadow-[0_0_20px_rgba(242,180,45,0.4)] hover:scale-[1.02]'}`}
                            >
                                {analyzing ? (
                                    <>
                                        <Loader2 className="animate-spin" /> Analyzing...
                                    </>
                                ) : (
                                    <>
                                        Analyze Resume <Zap size={20} fill="currentColor" />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Right Column: Results - Scrollable */}
                    <div className="h-full overflow-y-auto custom-scrollbar pr-2 pb-24">
                        {analyzing && (
                            <div className="glass-card p-12 flex flex-col items-center justify-center min-h-[400px]">
                                <div className="relative w-24 h-24 mb-6">
                                    <div className="absolute inset-0 rounded-full border-4 border-gray-700"></div>
                                    <div className="absolute inset-0 rounded-full border-4 border-t-[#F2B42D] border-r-[#D7425E] border-b-transparent border-l-transparent animate-spin"></div>
                                </div>
                                <h3 className="text-xl font-semibold animate-pulse">Analyzing your profile...</h3>
                                <p className="text-gray-400 mt-2">Checking ATS compatibility and keywords</p>
                            </div>
                        )}

                        {!analyzing && result && (
                            <div className="space-y-6 animate-pop">
                                {/* Score Card */}
                                <div className="glass-card p-6 bg-gradient-to-br from-[#00002E]/80 to-[#151545]/80">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-xl font-bold">ATS Score</h3>
                                        <span className={`px-4 py-1 rounded-full text-sm font-bold ${result.score >= 80 ? 'bg-green-500/20 text-green-400' : result.score >= 50 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                                            {result.score >= 80 ? 'Excellent' : result.score >= 50 ? 'Average' : 'Needs Work'}
                                        </span>
                                    </div>
                                    <div className="relative h-4 bg-gray-700 rounded-full overflow-hidden">
                                        <div
                                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#D7425E] to-[#F2B42D] transition-all duration-1000 ease-out"
                                            style={{ width: `${result.score}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-right mt-2 text-2xl font-bold text-[#F2B42D]">{result.score}/100</p>
                                </div>

                                {/* Analysis Details */}
                                <div className="glass-card p-6">
                                    <h3 className="text-lg font-semibold mb-4 text-[#48A8E2]">Summary</h3>
                                    <p className="text-gray-300 leading-relaxed text-sm">{result.summary}</p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="glass-card p-5 border-l-4 border-red-500">
                                        <h4 className="font-semibold mb-3 flex items-center gap-2 text-red-400">
                                            <AlertTriangle size={16} /> Key Issues
                                        </h4>
                                        <ul className="space-y-2">
                                            {result.key_issues?.map((issue, i) => (
                                                <li key={i} className="text-xs text-gray-300 flex items-start gap-2">
                                                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0"></span>
                                                    {issue}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="glass-card p-5 border-l-4 border-green-500">
                                        <h4 className="font-semibold mb-3 flex items-center gap-2 text-green-400">
                                            <CheckCircle size={16} /> Improvements
                                        </h4>
                                        <ul className="space-y-2">
                                            {result.improvements?.map((imp, i) => (
                                                <li key={i} className="text-xs text-gray-300 flex items-start gap-2">
                                                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0"></span>
                                                    {imp}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}
                        {!analyzing && !result && (
                            <div className="glass-card p-8 flex flex-col items-center justify-center min-h-[400px] border border-dashed border-white/10">
                                <FileText size={48} className="text-white/20 mb-4" />
                                <p className="text-white/40 text-center">Your analysis results will appear here</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Floating Chatbot Widget - Re-added outside of scrollable areas */}
            <div className={`fixed bottom-24 right-8 w-96 transform transition-all duration-300 z-50 ${chatOpen ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-10 opacity-0 scale-95 pointer-events-none'}`}>
                <div className="glass-card flex flex-col h-[500px] border border-[#F2B42D]/30 shadow-2xl bg-[#00002E]/90 backdrop-blur-xl">
                    <div className="p-4 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-[#F2B42D]/20 to-[#D7425E]/20 rounded-t-2xl">
                        <h3 className="font-semibold flex items-center gap-2">
                            <Bot size={20} className="text-[#F2B42D]" /> AI Career Coach
                        </h3>
                        <button onClick={() => setChatOpen(false)}><X size={18} className="text-gray-400 hover:text-white" /></button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                        {messages.filter(m => m.role !== 'system').map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-3 rounded-2xl text-sm markdown-content ${msg.role === 'user' ? 'bg-[#F2B42D] text-[#00002E] rounded-br-none' : 'bg-[#151545] border border-white/10 text-gray-200 rounded-bl-none'}`}>
                                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                                </div>
                            </div>
                        ))}
                        <div ref={chatEndRef} />
                    </div>

                    <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10 flex gap-2">
                        <input
                            type="text"
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            placeholder={result ? "Ask about your resume..." : "Upload resume to chat..."}
                            disabled={!result}
                            className="flex-1 bg-[#00002E] border border-gray-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-[#F2B42D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <button type="submit" disabled={!result} className="p-2 bg-[#F2B42D] rounded-xl text-[#00002E] hover:bg-[#D7425E] hover:text-white transition-colors disabled:opacity-50">
                            <Send size={18} />
                        </button>
                    </form>
                    {!result && (
                        <div className="absolute inset-0 bg-[#00002E]/80 backdrop-blur-sm flex items-center justify-center rounded-2xl z-10">
                            <div className="text-center p-6">
                                <Upload className="mx-auto text-gray-500 mb-2" size={32} />
                                <p className="text-gray-300 font-medium">Upload a resume to unlock<br />AI Chat Assistance</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Floating Toggle Button */}
            <button
                onClick={() => setChatOpen(!chatOpen)}
                className="fixed bottom-8 right-8 w-14 h-14 bg-gradient-to-r from-[#F2B42D] to-[#D7425E] rounded-full shadow-[0_0_20px_rgba(242,180,45,0.4)] flex items-center justify-center z-50 hover:scale-110 transition-transform group"
            >
                {chatOpen ? <X size={28} className="text-[#00002E]" /> : <Bot size={28} className="text-[#00002E] animate-bounce-slow" />}
                {!chatOpen && !result && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></span>
                )}
            </button>
        </div>
    );
};

export default ResumeAnalyzer;
