import { useEffect, useRef, useState } from "react";



///Simple fade-in-on-scroll wrapper to fade in a section when the user scrolls down to it, for niceness.
export default function FadeInOnScroll({ children, className = "" }) {
    const ref = useRef(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(entry.target);
                }
            },
            ///Amount visible before starting fade-in
            { threshold: 0.1 }
        );

        if (ref.current) observer.observe(ref.current);

        return () => observer.disconnect();
    }, []);

    return (
        <div

            ref={ref}
            className={`transition-opacity duration-[1000ms] w-full ${
                isVisible ? "opacity-100" : "opacity-0"
            } ${className}`}
        >
            {children}
        </div>
    );
}
