import React, { useState, useEffect } from 'react';



const PerceptualGame = ({ data, onComplete }) => {
    const grids = data?.grids || [];
    const [level, setLevel] = useState(0);
    const [startTime, setStartTime] = useState(Date.now());
    const [score, setScore] = useState(0);

    const handleSelect = (idx) => {
        if (grids.length === 0) return;
        const isCorrect = idx === grids[level].correctIdx;
        if (isCorrect) setScore(s => s + 1);

        if (level < grids.length - 1) {
            setLevel(l => l + 1);
        } else {
            const timeTaken = (Date.now() - startTime) / 1000;
            onComplete({ score: isCorrect ? score + 1 : score, time: timeTaken });
        }
    };

    const current = grids[level];

    return (
        <div className="w-full max-w-2xl text-center select-none">
            <h3 className="text-xl text-gray-300 mb-8">Find the unique item: <span className="text-[#F2B42D] font-bold text-2xl mx-2">{current?.target || "?"}</span></h3>

            <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
                {current?.items ? current.items.map((item, i) => (
                    <button
                        key={i}
                        onClick={() => handleSelect(i)}
                        className="aspect-square bg-white/5 hover:bg-white/20 border border-white/10 rounded-xl text-3xl font-bold text-white flex items-center justify-center transition-all"
                    >
                        {item}
                    </button>
                )) : (
                    <div className="text-gray-500">Loading grid...</div>
                )}
            </div>
        </div>
    );
};

export default PerceptualGame;
