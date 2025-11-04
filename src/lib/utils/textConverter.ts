import { slug } from "github-slugger";
// slugify
export const slugify = (content: string) => {
    return slug(content);
};


// humanize
export const humanize = (content: string) => {
    return content
        .replace(/^[\s_]+|[\s_]+$/g, "")
        .replace(/[_\s]+/g, " ")
        .replace(/[-\s]+/g, " ")
        .replace(/^[a-z]/, function (m) {
            return m.toUpperCase();
        });
};


// strip entities for plainify
const htmlEntityDecoder = (htmlWithEntities: string) => {
    let entityList: { [key: string]: string } = {
        "&nbsp;": " ",
        "&lt;": "<",
        "&gt;": ">",
        "&amp;": "&",
        "&quot;": '"',
        "&#39;": "'",
    };
    let htmlWithoutEntities: string = htmlWithEntities.replace(
        /(&amp;|&lt;|&gt;|&quot;|&#39;)/g,
        (entity: string): string => {
            return entityList[entity];
        },
    );
    return htmlWithoutEntities;
};
