import type { MetaFunction } from "@remix-run/node";

export const createMeta = ({
  title,
  url,
  description,
  ogImageUrl,
  canonicalUrl,
}: {
  title: string;
  url: string;
  description?: string;
  ogImageUrl?: string;
  canonicalUrl?: string;
}) => {
  const meta = [
    {
      title,
    },
    {
      name: "description",
      content: description,
    },
    {
      property: "og:title",
      content: title,
    },
    {
      property: "og:description",
      content: description,
    },
    {
      property: "og:image",
      content: ogImageUrl,
    },
    {
      property: "og:site_name",
      content: "Linkat",
    },
    {
      property: "og:type",
      content: "website",
    },
    {
      property: "og:url",
      content: url,
    },
    {
      tagName: "link",
      rel: "canonical",
      href: canonicalUrl,
    },
  ] satisfies ReturnType<MetaFunction>;
  // undefinedな値がある要素を除外
  return meta.filter((item) => Object.values(item).every(Boolean));
};
