import { useState, useEffect } from "react";

// Import your badges
const badgeModules = import.meta.glob("/src/assets/images/badges/*", { eager: true });
const badges = Object.values(badgeModules).map((mod) => mod.default.src);

const headlinesForBadges = [
    "Trusted by Experts",
    "USDA Organic Certified",
    "Non-GMO Project Verified",
    "NSF® Contents Certified",
    "NSF® Certified Gluten-Free",
    "American Vegetarian Association Vegan Certified®",
];

const pointsForBadges = [
    ["Verified organic ingredients with full traceability.", "Renewable plant source sustainability."],
    ["Verified organic ingredients with full traceability.", "Renewable plant source sustainability."],
    ["Genetic modification-free assurance.", "Natural biological integrity maintained."],
    ["Third-party ingredient verification.", "Label claim accuracy guaranteed."],
    ["Safe for celiac and gluten-sensitive consumers.", "Cross-contamination prevention protocols."],
    ["100% plant-based with no animal-derived ingredients.", "Ethical and sustainable sourcing verified."],
];

export default function TrustSignalsCertificationShowcase() {
    const [activeBadge, setActiveBadge] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [fade, setFade] = useState(true);

    // Auto-cycle badges
    useEffect(() => {
        if (isPaused) return;
        const interval = setInterval(() => {
            setFade(false);
            setTimeout(() => {
                setActiveBadge((prev) => (prev + 1) % headlinesForBadges.length);
                setFade(true);
            }, 200);
        }, 3000);
        return () => clearInterval(interval);
    }, [isPaused]);

    const handleBadgeHover = (index) => {
        setFade(false);
        setTimeout(() => {
            setActiveBadge(index);
            setFade(true);
        }, 200);
        setIsPaused(true);
    };

    const handleMouseLeave = () => setIsPaused(false);

    return (
        <div className="flex flex-col-reverse xl:flex-row justify-center items-center w-full px-[5%] gap-8 min-h-[22rem] xl:h-[12rem] my-[4rem]">
            {/* Badge Wall */}
            <div className="xl:w-1/2 flex flex-col gap-4 ">
                <div className="xl:max-w-[70%]  mx-auto">
                    
                
                    <div className="flex flex-row mr-[10%]">
                        {badges.slice(0, 3).map((url, i) => (
                            <img
                                key={i}
                                src={url}
                                alt={`badge ${i}`}
                                className={`w-full min-h-[7rem] object-contain transition-all duration-300ms cursor-pointer ${
                                    activeBadge === i ? "scale-100" : "scale-90"
                                }`}
                                onMouseEnter={() => handleBadgeHover(i)}
                                onMouseLeave={handleMouseLeave}
                            />
                        ))}
                    </div>
                    <div className="flex flex-row ml-[10%]">
                        {badges.slice(3, 6).map((url, i) => (
                            <img
                                key={i + 3}
                                src={url}
                                alt={`badge ${i + 3}`}
                                className={`w-full min-h-[7rem] object-contain transition-all duration-300ms cursor-pointer ${
                                    activeBadge === i + 3 ? "scale-100" : "scale-90"
                                }`}
                                onMouseEnter={() => handleBadgeHover(i + 3)}
                                onMouseLeave={handleMouseLeave}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Badge Texts - all in DOM for SEO */}
            <div className="xl:w-1/2 px-[5%] flex flex-col justify-center items-center h-40 pointer-events-none">
                <div className="">
                    {headlinesForBadges.map((headline, i) => (
                        <div
                            key={i}
                            
                            
                            style={{ position: activeBadge === i ? "relative" : "absolute" }}
                            className={`transition-opacity duration-300 ${
                                activeBadge === i && fade ? "opacity-100" : "opacity-0 absolute"
                            }`}
                            
                        >
                            <h2 className="xl:text-4xl font-bold">{headline}</h2>
                            <ul className="list-disc pl-5 mt-2">
                                {pointsForBadges[i].map((point, j) => (
                                    <li key={j}>{point}</li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
}
