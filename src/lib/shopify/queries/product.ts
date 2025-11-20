import productFragment from "../fragments/product";

export const getProductQuery = /* GraphQL */ `
  query getProduct($handle: String!) {
    product(handle: $handle) {
      ...product
    }
  }
  ${productFragment}
`;

export const getProductsQuery = /* GraphQL */ `
  query getProducts(
    $sortKey: ProductSortKeys
    $reverse: Boolean
    $query: String
    $cursor: String
  ) {
    products(
      sortKey: $sortKey
      reverse: $reverse
      query: $query
      first: 100
      after: $cursor
    ) {
      pageInfo {
        hasNextPage
        hasPreviousPage
        endCursor
      }
      edges {
        node {
          ...product
        }
      }
    }
  }
  ${productFragment}
`;

