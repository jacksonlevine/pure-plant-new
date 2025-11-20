export type Testimonial = {
    text: string;
    author: string;
};

export type HeroCopy = {
    hook: string,
    headline: string,
    subheadline: string,
    credibility: string,
    cta: string
};

export type InfoCopy = {
    title: string,
    p1?: string,
    p2?: string,
    p3?: string,
    p4?: string,
    p5?: string,
    conclusion?: string,
}

export type ProductCopy = {
    title: string,
    description: string,
    benefits: string[],
    productLink: string,
    modelSrc: string,
}