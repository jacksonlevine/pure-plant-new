import { HIDDEN_PRODUCT_TAG, SHOPIFY_GRAPHQL_API_ENDPOINT } from "@/lib/constants";
import { isShopifyError } from "@/lib/typeGuards";
import { ensureStartsWith } from "@/lib/utils";
import type {
    Cart,
    Collection,
    Connection,
    Image,
    Money,
    PageInfo,
    Product,
    ProductVariant,
    ShopifyCart,
    ShopifyCollection,
    ShopifyProduct,
} from "./types";

const domain = import.meta.env.PUBLIC_SHOPIFY_STORE_DOMAIN
    ? ensureStartsWith(import.meta.env.PUBLIC_SHOPIFY_STORE_DOMAIN, "https://")
    : "";
const endpoint = `${domain}${SHOPIFY_GRAPHQL_API_ENDPOINT}`;
const key = import.meta.env.PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN!;

type GraphQLResponse<T> = {
    data: T;
    errors?: { message: string }[];
};

type ExtractVariables<T> = T extends { variables: object }
    ? T["variables"]
    : never;

async function shopifyFetch<T>({
    query,
    variables,
}: {
    query: string;
    variables?: ExtractVariables<T>;
}): Promise<{ status: number; body: GraphQLResponse<T["data"]> }> {
    try {
        const result = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Shopify-Storefront-Access-Token": key,
            },
            body: JSON.stringify({
                query,
                variables,
            }),
        });

        if (!result.ok) {
            throw new Error(`Request failed with status ${result.status}`);
        }

        const body = (await result.json()) as GraphQLResponse<T["data"]>;

        if (body.errors?.length) {
            throw body.errors[0];
        }

        return { status: result.status, body };
    } catch (e) {
        if (isShopifyError(e)) {
            throw {
                cause: e.cause?.toString() || "unknown",
                status: e.status || 500,
                message: e.message,
                query,
            };
        }

        throw { error: e, query };
    }
}

const flattenConnection = <T>(connection: Connection<T> | null | undefined): T[] => {
    if (!connection?.edges) return [];
    return connection.edges.map((edge) => edge.node).filter(Boolean);
};

const withDefaultAltText = (images: Connection<Image>, productTitle: string) => {
    return flattenConnection(images).map((image) => {
        const filenameMatch = image.url.match(/.*\/(.*)\..*/);
        const fallbackAlt = filenameMatch?.[1]
            ? `${productTitle} - ${filenameMatch[1]}`
            : productTitle;

        return {
            ...image,
            altText: image.altText || fallbackAlt,
        };
    });
};

const reshapeProduct = (
    product: ShopifyProduct,
    filterHiddenProducts: boolean = true,
): Product | undefined => {
    if (!product || (filterHiddenProducts && product.tags.includes(HIDDEN_PRODUCT_TAG))) {
        return undefined;
    }

    return {
        ...product,
        images: withDefaultAltText(product.images, product.title),
        variants: flattenConnection<ProductVariant>(product.variants),
    };
};

const reshapeProducts = (products: ShopifyProduct[]) => {
    const reshapedProducts: Product[] = [];

    for (const product of products) {
        const reshapedProduct = product ? reshapeProduct(product) : undefined;
        if (reshapedProduct) reshapedProducts.push(reshapedProduct);
    }

    return reshapedProducts;
};

const reshapeCollection = (collection: ShopifyCollection): Collection => ({
    ...collection,
    path: `/pure-plant-new/products/${collection.handle}`,
});

const reshapeCart = (cart: ShopifyCart): Cart => {
    const totalTaxAmount: Money =
        cart.cost.totalTaxAmount || ({ amount: "0.0", currencyCode: "USD" } as Money);

    return {
        ...cart,
        cost: {
            ...cart.cost,
            totalTaxAmount,
        },
        lines: flattenConnection(cart.lines),
    };
};

const PRODUCT_FIELDS = /* GraphQL */ `
  id
  handle
  availableForSale
  title
  description
  descriptionHtml
  options {
    id
    name
    values
  }
  priceRange {
    maxVariantPrice { amount currencyCode }
    minVariantPrice { amount currencyCode }
  }
  compareAtPriceRange { maxVariantPrice { amount currencyCode } }
  variants(first: 250) {
    edges {
      node {
        id
        title
        availableForSale
        selectedOptions { name value }
        price { amount currencyCode }
        compareAtPrice { amount currencyCode }
      }
    }
  }
  featuredImage { url altText width height }
  images(first: 20) {
    edges {
      node { url altText width height }
    }
  }
  tags
  updatedAt
  vendor
  collections(first: 100) {
    nodes {
      handle
      title
      products(first: 100) {
        edges { node { title vendor } }
      }
    }
  }
`;

const CART_FIELDS = /* GraphQL */ `
  id
  checkoutUrl
  cost {
    subtotalAmount { amount currencyCode }
    totalAmount { amount currencyCode }
    totalTaxAmount { amount currencyCode }
  }
  lines(first: 100) {
    edges {
      node {
        id
        quantity
        cost { totalAmount { amount currencyCode } }
        merchandise {
          ... on ProductVariant {
            id
            title
            selectedOptions { name value }
            product { ${PRODUCT_FIELDS} }
          }
        }
      }
    }
  }
  totalQuantity
`;

export async function createCart(): Promise<Cart> {
    const res = await shopifyFetch<{ data: { cartCreate: { cart: ShopifyCart } } }>({
        query: /* GraphQL */ `
      mutation createCart {
        cartCreate { cart { ${CART_FIELDS} } }
      }
    `,
    });

    return reshapeCart(res.body.data.cartCreate.cart);
}

export async function addToCart(
    cartId: string,
    lines: { merchandiseId: string; quantity: number }[],
): Promise<Cart> {
    const res = await shopifyFetch<{ data: { cartLinesAdd: { cart: ShopifyCart } } }>({
        query: /* GraphQL */ `
      mutation addToCart($cartId: ID!, $lines: [CartLineInput!]!) {
        cartLinesAdd(cartId: $cartId, lines: $lines) { cart { ${CART_FIELDS} } }
      }
    `,
        variables: { cartId, lines },
    });

    return reshapeCart(res.body.data.cartLinesAdd.cart);
}

export async function removeFromCart(cartId: string, lineIds: string[]): Promise<Cart> {
    const res = await shopifyFetch<{ data: { cartLinesRemove: { cart: ShopifyCart } } }>({
        query: /* GraphQL */ `
      mutation removeFromCart($cartId: ID!, $lineIds: [ID!]!) {
        cartLinesRemove(cartId: $cartId, lineIds: $lineIds) { cart { ${CART_FIELDS} } }
      }
    `,
        variables: { cartId, lineIds },
    });

    return reshapeCart(res.body.data.cartLinesRemove.cart);
}

export async function updateCart(
    cartId: string,
    lines: { id: string; merchandiseId: string; quantity: number }[],
): Promise<Cart> {
    const res = await shopifyFetch<{ data: { cartLinesUpdate: { cart: ShopifyCart } } }>({
        query: /* GraphQL */ `
      mutation updateCart($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
        cartLinesUpdate(cartId: $cartId, lines: $lines) { cart { ${CART_FIELDS} } }
      }
    `,
        variables: { cartId, lines },
    });

    return reshapeCart(res.body.data.cartLinesUpdate.cart);
}

export async function getCart(cartId: string): Promise<Cart | undefined> {
    const res = await shopifyFetch<{ data: { cart: ShopifyCart | null } }>({
        query: /* GraphQL */ `
      query getCart($cartId: ID!) {
        cart(id: $cartId) { ${CART_FIELDS} }
      }
    `,
        variables: { cartId },
    });

    if (!res.body.data.cart) return undefined;
    return reshapeCart(res.body.data.cart);
}

export async function getCollections(): Promise<Collection[]> {
    const res = await shopifyFetch<{ data: { collections: Connection<ShopifyCollection> } }>({
        query: /* GraphQL */ `
      query getCollections {
        collections(first: 100) {
          edges {
            node {
              handle
              title
              description
              updatedAt
              products(first: 100) { edges { node { title vendor } } }
            }
          }
        }
      }
    `,
    });

    return flattenConnection(res.body.data.collections).map(reshapeCollection);
}

export async function getCollectionProducts({
    collection,
    reverse,
    sortKey,
    filterCategoryProduct,
}: {
    collection: string;
    reverse?: boolean;
    sortKey?: string;
    filterCategoryProduct?: any[];
}): Promise<{ pageInfo: PageInfo | null; products: Product[] }> {
    const res = await shopifyFetch<{
        data: {
            collection: {
                products: { pageInfo: PageInfo; edges: { node: ShopifyProduct }[] };
            } | null;
        };
    }>({
        query: /* GraphQL */ `
      query getCollectionProducts(
        $handle: String!
        $reverse: Boolean
        $sortKey: ProductCollectionSortKeys
        $filterCategoryProduct: [ProductFilter!]
      ) {
        collection(handle: $handle) {
          products(first: 12, reverse: $reverse, sortKey: $sortKey, filters: $filterCategoryProduct) {
            pageInfo { hasNextPage hasPreviousPage endCursor }
            edges { node { ${PRODUCT_FIELDS} } }
          }
        }
      }
    `,
        variables: {
            handle: collection,
            reverse,
            sortKey: sortKey === "CREATED_AT" ? "CREATED" : sortKey,
            filterCategoryProduct,
        },
    });

    const collectionData = res.body.data.collection;
    if (!collectionData) return { pageInfo: null, products: [] };

    const products = collectionData.products.edges.map((edge) => edge.node);
    const pageInfo = collectionData.products.pageInfo;

    return { pageInfo, products: reshapeProducts(products) };
}

export async function getProducts({
    query,
    reverse,
    sortKey,
    cursor,
}: {
    query?: string;
    reverse?: boolean;
    sortKey?: string;
    cursor?: string;
}): Promise<{ pageInfo: PageInfo; products: Product[] }> {
    const res = await shopifyFetch<{
        data: { products: { pageInfo: PageInfo; edges: { node: ShopifyProduct }[] } };
    }>({
        query: /* GraphQL */ `
      query getProducts(
        $sortKey: ProductSortKeys
        $reverse: Boolean
        $query: String
        $cursor: String
      ) {
        products(first: 12, sortKey: $sortKey, reverse: $reverse, query: $query, after: $cursor) {
          pageInfo { hasNextPage hasPreviousPage endCursor }
          edges { node { ${PRODUCT_FIELDS} } }
        }
      }
    `,
        variables: { query, reverse, sortKey, cursor },
    });

    const pageInfo = res.body.data.products.pageInfo;
    const products = res.body.data.products.edges.map((edge) => edge.node);

    return { pageInfo, products: reshapeProducts(products) };
}

export async function getProduct(handle: string): Promise<Product | undefined> {
    const res = await shopifyFetch<{ data: { product: ShopifyProduct | null } }>({
        query: /* GraphQL */ `
      query getProduct($handle: String!) {
        product(handle: $handle) { ${PRODUCT_FIELDS} }
      }
    `,
        variables: { handle },
    });

    return res.body.data.product ? reshapeProduct(res.body.data.product, false) : undefined;
}

export async function getVendors({
    query,
    reverse,
    sortKey,
}: {
    query?: string;
    reverse?: boolean;
    sortKey?: string;
}): Promise<{ vendor: string; productCount: number }[]> {
    const res = await shopifyFetch<{
        data: { products: { edges: { node: ShopifyProduct }[] } };
    }>({
        query: /* GraphQL */ `
      query getVendors($query: String, $reverse: Boolean, $sortKey: ProductSortKeys) {
        products(first: 250, query: $query, reverse: $reverse, sortKey: $sortKey) {
          edges { node { vendor } }
        }
      }
    `,
        variables: { query, reverse, sortKey },
    });

    const products = res.body.data.products.edges.map((edge) => edge.node);
    const vendorProductCounts: { vendor: string; productCount: number }[] = [];

    products.forEach((product) => {
        const vendor = product.vendor;
        if (!vendor) return;

        const existing = vendorProductCounts.find((entry) => entry.vendor === vendor);
        if (existing) {
            existing.productCount += 1;
        } else {
            vendorProductCounts.push({ vendor, productCount: 1 });
        }
    });

    return vendorProductCounts;
}

export async function getHighestProductPrice(): Promise<{
    amount: string;
    currencyCode: string;
} | null> {
    const res = await shopifyFetch<{
        data: {
            products: { edges: { node: { variants: { edges: { node: { price: Money } }[] } } }[] };
        };
    }>({
        query: /* GraphQL */ `
      query getHighestProductPrice {
        products(first: 1, sortKey: PRICE, reverse: true) {
          edges {
            node {
              variants(first: 1) { edges { node { price { amount currencyCode } } } }
            }
          }
        }
      }
    `,
    });

    const highestProduct = res.body.data.products.edges[0]?.node;
    const highestProductPrice = highestProduct?.variants?.edges?.[0]?.node?.price;

    return highestProductPrice || null;
}
