import React from "react";
import FadeInOnScroll from "./FadeInOnScroll";
import Model3D from "./Model3D.jsx";
import CTAButton from "./CTAButton";

import ph32 from "../assets/images/ph32.png"

export interface ProductShowcaseContent {
    title: string;
    description: string;
    benefits: string[];
    productLink: string;
    reverse?: boolean;
    modelSrc: string;
}

interface ProductShowcaseSectionProps {
    content: ProductShowcaseContent;
}

export default function ProductShowcaseSection({
                                                   content,
                                               }: ProductShowcaseSectionProps) {
    const { title, description, benefits, productLink, reverse = false, modelSrc } = content;

    const layoutOrder = reverse ? "md:flex-row-reverse" : "md:flex-row";

    return (
        <div>
            <FadeInOnScroll>
                {/* Top Row: Title + Description */}
                <div className={`flex flex-col ${layoutOrder} justify-center items-center mx-[10%]`}>
                    <div className="w-full flex flex-col px-[2rem]">
                        <h1 className="xl:!text-7xl lg:!text-4xl"><a href={productLink}>{title}</a></h1>
                    </div>

                    <div className="w-full flex flex-col py-[6rem]">
                        <div className="px-[2rem]">
                            <h3>{description}</h3>
                        </div>
                    </div>
                </div>

                {/* Bottom Row: Model + Benefits */}
                <div className={`flex flex-col ${layoutOrder} justify-center items-center mx-[10%]`}>
                    {typeof window !== "undefined" && (
                        <Model3D
                            src={modelSrc}
                            alt={`${title} bottle`}
                            size={{ width: "100%", height: "48rem" }}
                            className="origin-center"
                        />
                    )}

                    <div className="grid grid-cols-2 grid-rows-2 md:flex-row justify-around w-full">
                        {benefits.map((benefit, index) => (
                            <div
                                key={index}
                                className="flex flex-col w-full px-[1rem] hover:scale-102 transition-all duration-400ms"
                            >
                                <img className="w-full" src={ph32.src} alt="" />
                                <h3>{benefit}</h3>
                            </div>
                        ))}
                    </div>
                </div>
            </FadeInOnScroll>


            <div className="py-[3rem]" /> 
            <CTAButton label="Continue to product" href={productLink} />
            <div className="py-[5rem]" />
        </div>
    );
}
