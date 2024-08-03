import { QuickLink, QuickLinks } from "@/components/quick-links";
import { filterPosts, PostSchema, readingTime } from "@/lib/models";
import Markdoc from "@markdoc/markdoc";
import glob from "fast-glob";
import yaml from "js-yaml";
import fs from "node:fs";
import path from "node:path";

export const dynamic = "force-static";

const base = path.resolve(process.cwd(), "src", "app");
const POSTS_PATH = path.resolve(process.cwd(), "src", "posts.json");

const getPosts = () => {
    if (process.env.NODE_ENV === "production") {
        try {
            const data = fs.readFileSync(POSTS_PATH, "utf-8");
            return JSON.parse(data);
        } catch (err) {
            console.error("Error reading posts.json:", err);
            return [];
        }
    } else {
        const files = glob.sync("**/page.md", { cwd: path.join(base, "posts") });
        console.log("Found files:", files);

        const items = files.map((file) => {
            try {
                const href = file.replace(/\/page\.mdx?$/, "").replace(base, "");
                const fullPath = path.resolve(base, "posts", file);
                const content = fs.readFileSync(fullPath, "utf-8");
                const doc = Markdoc.parse(content);
                const info = PostSchema.parse(yaml.load(doc.attributes.frontmatter));
                const date = info.date;
                return { href, info, date, readingTime: readingTime(content) };
            } catch (err) {
                console.error(`Error processing file ${file}:`, err);
                return null;
            }
        }).filter(item => item !== null).sort((a, b) => (a.date < b.date ? 1 : -1));

        const currentData = fs.existsSync(POSTS_PATH) ? JSON.parse(fs.readFileSync(POSTS_PATH, "utf-8")) : [];
        if (JSON.stringify(currentData) !== JSON.stringify(items)) {
            fs.writeFileSync(POSTS_PATH, JSON.stringify(items, null, 4), "utf-8");
        }
        return items;
    }
};

export function Posts(props: { search: string }) {
    const items = getPosts();
    console.log(items, 'items');

    const filter = filterPosts(props.search, items);
    return (
        <QuickLinks>
            {filter.map((post) => (
                <QuickLink
                    date={post.info.date}
                    readingTime={post.readingTime}
                    tags={post.info.subjects}
                    description={post.info.description}
                    href={post.href}
                    key={post.href}
                    title={post.info.title}
                />
            ))}
        </QuickLinks>
    );
}
