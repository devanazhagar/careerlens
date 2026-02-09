import React, { useState, useEffect } from 'react';
import { Timer, CheckCircle, XCircle } from 'lucide-react';

const VerbalGame = ({ data, onComplete }) => {
    const questions = data?.questions || [];
    const [qIndex, setQIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(60);
    const [answers, setAnswers] = useState([]);
    const [gameActive, setGameActive] = useState(true);

    const currentQuestion = questions[qIndex];

    useEffect(() => {
        if (!gameActive || questions.length === 0) return;

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

    const handleAnswer = (option) => {
        const timeTaken = 60 - timeLeft; // Crude measure for now
        const isCorrect = option.correct === true;

        const newAnswers = [...answers, { qId: currentQuestion.id, correct: isCorrect, time: timeTaken }];
        setAnswers(newAnswers);

        if (qIndex < questions.length - 1) {
            setQIndex(prev => prev + 1);
        } else {
            finishGame(newAnswers);
        }
    };

    const finishGame = (finalAnswers = answers) => {
        setGameActive(false);
        // Calc Score
        const correctCount = finalAnswers.filter(a => a.correct).length;
        const accuracy = finalAnswers.length > 0 ? correctCount / finalAnswers.length : 0;

        // Mock complex scoring
        const scoreData = {
            accuracy: accuracy.toFixed(2),
            speed: timeLeft > 30 ? 'High' : 'Medium', // simplified
            raw_score: correctCount
        };

        // Small delay to show completion state if needed, or straight callback
        setTimeout(() => {
            onComplete(scoreData);
        }, 500);
    };

    return (
        <div className="w-full max-w-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2 text-[#F2B42D]">
                    <Timer className="w-5 h-5" />
                    <span className="font-mono text-xl font-bold">{timeLeft}s</span>
                </div>
                <div className="text-gray-400 text-sm">
                    Question {qIndex + 1} of {questions.length}
                </div>
            </div>

            {/* Question Card */}
            <div className="mb-10 text-center">
                {currentQuestion ? (
                    <>
                        <p className="text-2xl md:text-3xl text-white font-medium leading-relaxed">
                            {currentQuestion.text.split(/(\[.*?\])/).map((part, i) => (
                                part.startsWith('[') && part.endsWith(']') ?
                                    <span key={i} className="text-[#F2B42D] font-bold mx-1 border-b-2 border-[#F2B42D] pb-1">
                                        {part.slice(1, -1)}
                                    </span> :
                                    <span key={i}>{part}</span>
                            ))}
                        </p>
                        <p className="mt-4 text-gray-400">Select the correct meaning for the highlighted word.</p>
                    </>
                ) : (
                    <p className="text-gray-400">Loading challenge...</p>
                )}
            </div>

            {/* Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentQuestion.options.map((option) => (
                    <button
                        key={option.id}
                        onClick={() => handleAnswer(option)}
                        className="group relative p-6 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-[#F2B42D]/50 transition-all duration-200 text-left"
                    >
                        <span className="text-lg text-white font-medium group-hover:text-[#F2B42D] transition-colors">
                            {option.text}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default VerbalGame;
