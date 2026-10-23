import { icoToPng } from "~/utils/icoToPng";

const maxIconSize = 100000;

export interface IFaviconFetcher {
  fetchPng: (url: string) => Promise<Buffer | null>;
}

const toPng = async (response: Response) => {
  const bytes = Buffer.from(await response.arrayBuffer());
  return (
    (await icoToPng(bytes, maxIconSize)) ??
    (response.headers.get("content-type") === "image/png" ? bytes : null)
  );
};

export const faviconFetcherFactory = (): IFaviconFetcher => ({
  async fetchPng(url) {
    try {
      const response = await fetch(
        `https://icons.duckduckgo.com/ip3/${new URL(url).hostname}.ico`,
        { signal: AbortSignal.timeout(5000) },
      );
      const png = response.ok ? await toPng(response) : null;
      return png && png.byteLength <= maxIconSize ? png : null;
    } catch {
      return null;
    }
  },
});
