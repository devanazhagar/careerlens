import React, { useState } from 'react';

const SpatialGame = ({ data, onComplete }) => {
    const questions = data?.questions || [];
    const [qIndex, setQIndex] = useState(0);
    const [score, setScore] = useState(0);

    const handleAnswer = (isCorrect) => {
        if (isCorrect) setScore(s => s + 1);

        if (qIndex < questions.length - 1) {
            setQIndex(qIndex + 1);
        } else {
            onComplete({ score: isCorrect ? score + 1 : score, total: questions.length });
        }
    };

    const q = questions[qIndex];

    return (
        <div className="w-full max-w-2xl select-none text-center">
            <h3 className="text-xl text-gray-300 mb-8">Which option matches the shape on the left?</h3>

            <div className="flex items-center justify-center gap-12 mb-12">
                {q ? (
                    <div className="p-8 bg-blue-500/20 rounded-2xl border-2 border-blue-400/50">
                        <div className={`text-6xl font-black text-white ${q.rotation} transition-transform`}>{q.target}</div>
                    </div>
                ) : (
                    <div className="text-gray-500">Loading...</div>
                )}
                <div className="text-2xl text-gray-500">→</div>
            </div>

            <div className="grid grid-cols-4 gap-4">
                {q?.options?.map((opt, i) => (
                    <button
                        key={i}
                        onClick={() => handleAnswer(opt.correct)}
                        className="aspect-square flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#F2B42D] rounded-xl transition-all"
                    >
                        <div className={`text-4xl font-black text-white ${opt.style}`}>{opt.val}</div>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default SpatialGame;
