import React, { useState, useEffect } from 'react';



const MemoryGame = ({ data, onComplete }) => {
    const pairs = data?.pairs || [];
    const [phase, setPhase] = useState('memorize'); // memorize, recall
    const [timeLeft, setTimeLeft] = useState(5);
    const [currentPairIndex, setCurrentPairIndex] = useState(0);
    const [score, setScore] = useState(0);

    useEffect(() => {
        if (phase === 'memorize') {
            const timer = setInterval(() => {
                setTimeLeft(p => {
                    if (p <= 1) {
                        clearInterval(timer);
                        setPhase('recall');
                        return 0;
                    }
                    return p - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [phase]);

    const handleAnswer = (word) => {
        if (word === pairs[currentPairIndex].word) {
            setScore(s => s + 1);
        }

        if (currentPairIndex < pairs.length - 1) {
            setCurrentPairIndex(p => p + 1);
        } else {
            onComplete({ score: score + (word === pairs[currentPairIndex].word ? 1 : 0), total: pairs.length });
        }
    };

    // Shuffled options for current target
    const getOptions = () => {
        if (pairs.length === 0) return [];
        const correct = pairs[currentPairIndex].word;
        const others = pairs.filter(p => p.word !== correct).map(p => p.word);
        return [correct, ...others.slice(0, 3)].sort(() => Math.random() - 0.5);
    };

    return (
        <div className="w-full max-w-2xl text-center select-none">
            {phase === 'memorize' ? (
                <div className="animate-fade-in">
                    <h3 className="text-2xl text-[#F2B42D] mb-4">Memorize these pairs!</h3>
                    <div className="text-4xl font-mono mb-8">{timeLeft}s</div>
                    <div className="grid grid-cols-2 gap-6">
                        {pairs.map((p, i) => (
                            <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-xl flex items-center justify-center gap-4">
                                <span className="text-4xl">{p.icon}</span>
                                <span className="text-xl font-bold text-white">{p.word}</span>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="animate-fade-in">
                    <h3 className="text-2xl text-white mb-8">What matched with this icon?</h3>
                    <div className="text-8xl mb-12">{pairs[currentPairIndex]?.icon}</div>
                    <div className="grid grid-cols-2 gap-4">
                        {getOptions().map((opt, i) => (
                            <button
                                key={i}
                                onClick={() => handleAnswer(opt)}
                                className="p-4 bg-white/5 hover:bg-[#F2B42D]/20 border border-white/10 hover:border-[#F2B42D] rounded-xl text-lg font-bold text-white transition-all"
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MemoryGame;
