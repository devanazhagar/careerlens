import React, { useState } from 'react';

const ReasoningGame = ({ data, onComplete }) => {
    const sequences = data?.sequences || [];
    const [idx, setIdx] = useState(0);
    const [score, setScore] = useState(0);

    const handleAnswer = (opt) => {
        if (sequences.length === 0) return;
        const isCorrect = opt === sequences[idx].ans;
        if (isCorrect) setScore(s => s + 1);

        if (idx < sequences.length - 1) {
            setIdx(i => i + 1);
        } else {
            onComplete({ score: isCorrect ? score + 1 : score, total: sequences.length });
        }
    };

    const current = sequences[idx];

    return (
        <div className="w-full max-w-2xl text-center select-none">
            <h3 className="text-xl text-gray-300 mb-12">Complete the pattern</h3>

            <div className="flex gap-4 justify-center mb-12">
                {current?.seq ? current.seq.map((item, i) => (
                    <div key={i} className={`text-4xl font-bold ${item === '?' ? 'text-[#F2B42D] animate-pulse' : 'text-white'}`}>
                        {item}
                    </div>
                )) : (
                    <div className="text-gray-500">Loading sequence...</div>
                )}
            </div>

            <div className="flex gap-4 justify-center">
                {current?.options?.map((opt, i) => (
                    <button
                        key={i}
                        onClick={() => handleAnswer(opt)}
                        className="px-8 py-4 bg-white/5 hover:bg-[#F2B42D]/20 border border-white/10 hover:border-[#F2B42D] rounded-xl text-2xl text-white transition-all"
                    >
                        {opt}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default ReasoningGame;
