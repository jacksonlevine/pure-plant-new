export type Connection<T> = {
    edges: Array<{ node: T }>;
};

export type Money = {
    amount: string;
    currencyCode: string;
};

export type Image = {
    url: string;
    altText: string | null;
    width: number;
    height: number;
};

export type ProductVariant = {
    id: string;
    title: string;
    availableForSale: boolean;
    selectedOptions: { name: string; value: string }[];
    price: Money;
    compareAtPrice: Money;
};

export type ShopifyProduct = {
    id: string;
    handle: string;
    availableForSale: boolean;
    title: string;
    description: string;
    descriptionHtml: string;
    options: { id: string; name: string; values: string[] }[];
    priceRange: {
        maxVariantPrice: Money;
        minVariantPrice: Money;
    };
    compareAtPriceRange: {
        maxVariantPrice: Money;
    };
    variants: Connection<ProductVariant>;
    featuredImage: Image | null;
    images: Connection<Image>;
    tags: string[];
    updatedAt: string;
    vendor: string;
    collections: {
        nodes: Array<{
            handle?: string;
            title: string;
            products: { edges: Array<{ node: { title: string; vendor: string } }> };
        }>;
    };
};

export type Product = Omit<ShopifyProduct, "variants" | "images"> & {
    variants: ProductVariant[];
    images: Image[];
};

export type PageInfo = {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    endCursor: string;
};

export type ShopifyCollection = {
    handle: string;
    title: string;
    description: string;
    updatedAt: string;
    products?: { edges: Array<{ node: { title: string; vendor: string } }> };
};

export type Collection = ShopifyCollection & {
    path: string;
};

export type CartItem = {
    id: string;
    quantity: number;
    cost: {
        totalAmount: Money;
    };
    merchandise: {
        id: string;
        title: string;
        selectedOptions: { name: string; value: string }[];
        product: ShopifyProduct;
    };
};

export type ShopifyCart = {
    id: string;
    checkoutUrl: string;
    cost: {
        subtotalAmount: Money;
        totalAmount: Money;
        totalTaxAmount: Money;
    };
    lines: Connection<CartItem>;
    totalQuantity: number;
};

export type Cart = Omit<ShopifyCart, "lines"> & {
    lines: CartItem[];
};
