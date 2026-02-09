import React from 'react';

const FloatingTags = () => {
    // Data from goals.html
    const tags = [
        {
            text: "Leadership",
            className: "absolute top-100 -right-0 text-primary/80",
            dotColor: "bg-[#F2B42D]", // primary
            style: { animationDelay: '0s', top: '35%', right: '5%' }
        },
        {
            text: "AI Research",
            className: "absolute top-20 -right-12 text-blue-400/80",
            dotColor: "bg-blue-400",
            style: { animationDelay: '1s', top: '20%', right: '10%' }
        },
        {
            text: "Sustainability",
            className: "absolute -bottom-6 left-20 text-emerald-400/80",
            dotColor: "bg-emerald-400",
            style: { animationDelay: '2s', bottom: '15%', left: '15%' }
        },
        {
            text: "FinTech",
            className: "absolute top-1/2 -left-16 text-purple-400/80",
            dotColor: "bg-purple-400",
            style: { animationDelay: '1.5s', top: '45%', left: '8%' }
        },
        {
            text: "Product Strategy",
            className: "absolute -top-4 right-1/4 text-orange-400/80",
            dotColor: "bg-orange-400",
            style: { animationDelay: '0.5s', top: '15%', right: '25%' }
        }
    ];

    return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
            {/* We use a container that matches the content max-width roughly or absolute positioning relative to viewport */}
            <div className="relative w-full h-full max-w-3xl mx-auto">
                {tags.map((tag, index) => (
                    <div
                        key={index}
                        className={`absolute px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 animate-float-star bg-white/5 backdrop-blur-md border border-white/10 ${tag.className}`}
                        style={tag.style}
                    >
                        <span className={`w-2 h-2 rounded-full ${tag.dotColor} animate-pulse`}></span>
                        {tag.text}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FloatingTags;
