
import { useEffect, useState } from "react";

type TestimonialEntry = {
    text: string;
    author: string;
}

type TestimonialsArg = {
    testimonials: TestimonialEntry[];
}
export default function Testimonials({ testimonials }:TestimonialsArg) {

    const [currentTestimonial, setCurrentTestimonial] = useState(0);

    //Rotate between testimonials
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col justify-center items-center xl:max-w-2xl w-full animate-fi z-20">
            <div className="bg-white/80 w-fit backdrop-blur-md rounded-lg p-6 border transition-all z-20 duration-300 hover:bg-white/100 hover:scale-105 border-white/20 min-h-32 flex flex-col justify-center w-full xl:min-w-[28rem]">
                <p className="text-xl italic mb-3">"{testimonials[currentTestimonial].text}"</p>
                <p className="text-sm font-semibold text-emerald-300">— {testimonials[currentTestimonial].author}</p>
                <div className="flex justify-center gap-2 mt-4">
                    {testimonials.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setCurrentTestimonial(i)}
                            className={`w-2 h-2 rounded-full transition-all ${i === currentTestimonial ? 'bg-white w-8' : 'bg-white/40'
                            }`}
                            aria-label={`Show testimonial ${i + 1}`}
                        />
                    ))}
                </div>
            </div>

        </div>
    );
}