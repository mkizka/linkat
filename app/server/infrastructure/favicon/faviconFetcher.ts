import type { IIcoConverter } from "~/server/infrastructure/favicon/icoConverter";

const maxIconSize = 100000;

export interface IFaviconFetcher {
  fetchPng: (url: string) => Promise<Buffer | null>;
}

export const faviconFetcherFactory = ({
  icoConverter,
}: {
  icoConverter: IIcoConverter;
}): IFaviconFetcher => {
  const toPng = async (response: Response) => {
    const bytes = Buffer.from(await response.arrayBuffer());
    const isPng = response.headers.get("content-type") === "image/png";
    return (
      (await icoConverter.toPng(bytes, maxIconSize)) ??
      (isPng && bytes.byteLength <= maxIconSize ? bytes : null)
    );
  };
  return {
    async fetchPng(url) {
      try {
        const response = await fetch(
          `https://icons.duckduckgo.com/ip3/${new URL(url).hostname}.ico`,
          { signal: AbortSignal.timeout(5000) },
        );
        return response.ok ? await toPng(response) : null;
      } catch {
        return null;
      }
    },
  };
};
