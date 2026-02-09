import React, { useState, useEffect } from 'react';
import { Timer, ArrowRight } from 'lucide-react';

const NumberGame = ({ data, onComplete }) => {
    const problems = data?.problems || [];
    const [qIndex, setQIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(60);
    const [score, setScore] = useState(0);
    const [isActive, setIsActive] = useState(true);

    useEffect(() => {
        if (!isActive || problems.length === 0) return;
        const timer = setInterval(() => {
            setTimeLeft(p => {
                if (p <= 1) {
                    clearInterval(timer);
                    finishGame();
                    return 0;
                }
                return p - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [isActive, problems]);

    const handleAnswer = (val) => {
        if (val === problems[qIndex].ans) {
            setScore(s => s + 1);
        }

        if (qIndex < problems.length - 1) {
            setQIndex(qIndex + 1);
        } else {
            finishGame();
        }
    };

    const finishGame = () => {
        setIsActive(false);
        const accuracy = problems.length > 0 ? (score / problems.length).toFixed(2) : 0;
        onComplete({ score, accuracy, total: problems.length });
    };

    return (
        <div className="w-full max-w-2xl text-center select-none">
            <div className="flex justify-between items-center mb-8 text-[#F2B42D]">
                <div className="flex gap-2 items-center"><Timer size={20} /> {timeLeft}s</div>
                <div>{qIndex + 1}/{problems.length}</div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-10 mb-8">
                <h3 className="text-4xl text-white font-bold tracking-wider">{problems[qIndex]?.q || "Loading..."}</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {problems[qIndex]?.options?.map((opt, i) => (
                    <button
                        key={i}
                        onClick={() => handleAnswer(opt)}
                        className="p-6 bg-white/5 hover:bg-[#F2B42D]/20 border border-white/10 hover:border-[#F2B42D] rounded-xl text-2xl font-bold transition-all text-white"
                    >
                        {opt}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default NumberGame;
