import type { MetaFunction } from "react-router";

export const createMeta = ({
  title,
  url,
  description,
  ogImageUrl,
}: {
  title: string;
  url: string;
  description?: string;
  ogImageUrl?: string;
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
      rel: "alternate",
      hrefLang: "ja",
      href: `${url}?lng=ja`,
    },
    {
      tagName: "link",
      rel: "alternate",
      hrefLang: "en",
      href: `${url}?lng=en`,
    },
    {
      tagName: "link",
      rel: "alternate",
      hrefLang: "x-default",
      href: url,
    },
    {
      tagName: "link",
      rel: "canonical",
      href: url,
    },
  ] satisfies ReturnType<MetaFunction>;
  // undefinedな値がある要素を除外
  return meta.filter((item) => Object.values(item).every(Boolean));
};
