export type Review = {
    author: string;
    text: string;
    ratingValue: number;
    datePublished?: string;
};

const reviewSource: Record<string, Review[]> = {
    serophan: [
        {
            author: "Sarah M.",
            text: "Serophan helped me find calm without any sluggish side effects.",
            ratingValue: 5,
            datePublished: "2024-01-12",
        },
        {
            author: "James K.",
            text: "My sleep quality improved within the first week of using Serophan.",
            ratingValue: 5,
            datePublished: "2024-02-02",
        },
        {
            author: "Emily T.",
            text: "It delivers a steady, balanced mood lift that feels completely natural.",
            ratingValue: 4.8,
            datePublished: "2024-03-18",
        },
    ],
    neurozine: [
        {
            author: "Michael R.",
            text: "Neurozine gives me the mental clarity I need without any crash.",
            ratingValue: 5,
            datePublished: "2024-01-28",
        },
        {
            author: "Ava L.",
            text: "Focus and productivity both jumped noticeably after starting Neurozine.",
            ratingValue: 4.9,
            datePublished: "2024-02-19",
        },
        {
            author: "David L.",
            text: "It's the first supplement that actually sharpened my memory recall.",
            ratingValue: 4.8,
            datePublished: "2024-03-07",
        },
    ],
    pureplantd3: [
        {
            author: "Olivia P.",
            text: "I switched to PurePlant D3 and immediately felt the difference in energy.",
            ratingValue: 5,
            datePublished: "2024-01-05",
        },
        {
            author: "Noah W.",
            text: "Knowing it's plant-based makes it an easy daily choice for my family.",
            ratingValue: 4.9,
            datePublished: "2024-02-11",
        },
        {
            author: "Sofia G.",
            text: "Lab results confirmed my vitamin D levels climbed faster than before.",
            ratingValue: 4.8,
            datePublished: "2024-03-22",
        },
    ],
};

const normalizeProductKey = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");

const reviewsByProduct: Record<string, Review[]> = Object.fromEntries(
    Object.entries(reviewSource).map(([key, value]) => [normalizeProductKey(key), value])
);

export function getProductReviews(slug: string): Review[] {
    const key = normalizeProductKey(slug);
    return reviewsByProduct[key] ?? [];
}

export function getProductReviewStructuredData(slug: string) {
    return getProductReviews(slug).map((review) => ({
        "@type": "Review",
        reviewBody: review.text,
        author: {
            "@type": "Person",
            name: review.author,
        },
        reviewRating: {
            "@type": "Rating",
            ratingValue: review.ratingValue,
            bestRating: 5,
            worstRating: 1,
        },
        ...(review.datePublished
            ? { datePublished: review.datePublished }
            : {}),
    }));
}

export function getProductAggregateRating(slug: string) {
    const reviews = getProductReviews(slug);
    if (!reviews.length) {
        return undefined;
    }

    const total = reviews.reduce((sum, review) => sum + review.ratingValue, 0);
    const average = Number((total / reviews.length).toFixed(1));

    return {
        "@type": "AggregateRating",
        ratingValue: average,
        reviewCount: reviews.length,
        bestRating: 5,
        worstRating: 1,
    };
}

export { reviewsByProduct };