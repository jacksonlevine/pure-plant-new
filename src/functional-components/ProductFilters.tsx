import type { ShopifyCollection } from "@/lib/shopify/types";
import { slugify } from "@/lib/utils/textConverter";
import React, { useState } from "react";
import { BsCheckLg } from "react-icons/bs";
import ShowTags from "./product/ShowTags";
import RangeSlider from "./rangeSlider/RangeSlider";

const ProductFilters = ({
                            categories,
                            tags,
                            categoriesWithCounts,
                        }: {
    categories: ShopifyCollection[];
    tags: string[];
    categoriesWithCounts: { category: string; productCount: number }[];
}) => {
    const [searchParams, setSearchParams] = useState(
        new URLSearchParams(window.location.search)
    );

    const selectedBrands = searchParams.getAll("b");
    const selectedCategory = searchParams.get("c");

    const updateSearchParams = (newParams: URLSearchParams) => {
        const newUrl = `${window.location.pathname}?${newParams.toString()}`;
        window.location.href = newUrl.toString();
        setSearchParams(newParams);
    };

    const handleBrandClick = (name: string) => {
        const slugName = slugify(name.toLowerCase());
        const newParams = new URLSearchParams(searchParams.toString());

        const currentBrands = newParams.getAll("b");

        if (currentBrands.includes(slugName)) {
            newParams.delete("b", slugName);
        } else {
            newParams.append("b", slugName);
        }
        updateSearchParams(newParams);
    };

    const handleCategoryClick = (handle: string) => {
        const newParams = new URLSearchParams(searchParams.toString());

        if (handle === selectedCategory) {
            newParams.delete("c");
        } else {
            newParams.set("c", handle);
        }
        updateSearchParams(newParams);
    };

    return (
        <div>

            <div>
                <h5 className="mb-2 mt-4 lg:mt-6 lg:text-xl">Product Categories</h5>
                <hr className="border-border dark:border-darkmode-border" />
                <ul className="mt-4 space-y-4">
                    {categories.map((category) => (
                        <li
                            key={category.handle}
                            className={`flex items-center justify-between cursor-pointer ${selectedCategory === category.handle
                                ? "text-text-dark dark:text-darkmode-text-dark font-semibold"
                                : "text-text-light dark:text-darkmode-text-light"
                            }`}
                            onClick={() => handleCategoryClick(category.handle)}
                        >
                            {category.title}
                            {searchParams.has("c") && !searchParams.has("b") ? (
                                <span>({category?.products?.edges.length || 0})</span>
                            ) : (
                                <span>
                  {categoriesWithCounts.length > 0
                      ? `(${categoriesWithCounts.find(
                          (c) => c.category === category.title
                      )?.productCount || 0
                      })`
                      : `(${category?.products?.edges.length || 0})`}
                </span>
                            )}
                        </li>
                    ))}
                </ul>
            </div>
            

            {tags.length > 0 && (
                <div>
                    <h5 className="mb-2 mt-8 lg:mt-10 lg:text-xl">Tags</h5>
                    <hr className="border-border dark:border-darkmode-border" />
                    <div className="mt-4">
                        <ShowTags tags={tags} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductFilters;
