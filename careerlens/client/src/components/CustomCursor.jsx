import React, { useEffect, useRef } from 'react';

const CustomCursor = () => {
    const cursorDotRef = useRef(null);
    const cursorOutlineRef = useRef(null);

    useEffect(() => {
        const cursorDot = cursorDotRef.current;
        const cursorOutline = cursorOutlineRef.current;

        const moveCursor = (e) => {
            const { clientX, clientY } = e;

            // Move dot immediately
            cursorDot.style.left = `${clientX}px`;
            cursorDot.style.top = `${clientY}px`;

            // Move outline with some delay/smoothing (using animate for better perf if possible, or just standard tracking)
            // For simple tracking we can just set positions, existing CSS transition handles the smoothing
            cursorOutline.animate({
                left: `${clientX}px`,
                top: `${clientY}px`
            }, { duration: 500, fill: "forwards" });
        };

        window.addEventListener('mousemove', moveCursor);

        return () => {
            window.removeEventListener('mousemove', moveCursor);
        };
    }, []);

    return (
        <>
            <div ref={cursorDotRef} className="cursor-dot"></div>
            <div ref={cursorOutlineRef} className="cursor-outline"></div>
        </>
    );
};

export default CustomCursor;
