import React, { useState, useEffect, useRef } from 'react';
import { Timer, Send } from 'lucide-react';

const FluencyGame = ({ data, onComplete }) => {
    const [timeLeft, setTimeLeft] = useState(60);
    const [input, setInput] = useState('');
    const [words, setWords] = useState([]);
    const [gameActive, setGameActive] = useState(true);
    const inputRef = useRef(null);

    useEffect(() => {
        if (!gameActive) return;

        inputRef.current?.focus();

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    finishGame();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [gameActive]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        if (!words.includes(input.trim().toLowerCase())) {
            setWords([...words, input.trim().toLowerCase()]);
        }
        setInput('');
    };

    const finishGame = () => {
        setGameActive(false);
        const scoreData = {
            count: words.length,
            accuracy: 'N/A',
            speed: 'High'
        };
        setTimeout(() => onComplete(scoreData), 1000);
    };

    return (
        <div className="w-full max-w-2xl select-none">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2 text-[#F2B42D]">
                    <Timer className="w-5 h-5" />
                    <span className="font-mono text-xl font-bold">{timeLeft}s</span>
                </div>
                <div className="text-gray-400 text-sm"> Word Fluency </div>
            </div>

            <div className="text-center mb-8">
                <h3 className="text-2xl text-white font-bold mb-2 uppercase tracking-widest">Category: {data?.category || "Loading..."}</h3>
                <p className="text-gray-400">{data?.instruction || "Type as many words as you can relate to the category."}</p>
            </div>

            <form onSubmit={handleSubmit} className="relative mb-8">
                <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={!gameActive}
                    className="w-full bg-white/5 border border-white/20 rounded-xl px-6 py-4 text-xl text-white focus:outline-none focus:border-[#F2B42D] transition-colors"
                    placeholder="Type a word and press Enter..."
                />
                <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 text-[#F2B42D]">
                    <Send className="w-6 h-6" />
                </button>
            </form>

            <div className="flex flex-wrap gap-2 justify-center">
                {words.map((word, i) => (
                    <span key={i} className="px-3 py-1 bg-white/10 rounded-full text-sm text-gray-300 border border-white/5">
                        {word}
                    </span>
                ))}
            </div>
        </div>
    );
};

export default FluencyGame;
