import { decodeIco, isIco } from "icojs";

const maxIconSize = 100000;

export interface IFaviconFetcher {
  fetchPng: (url: string) => Promise<Buffer | null>;
}

const toPng = async (response: Response) => {
  const bytes = Buffer.from(await response.arrayBuffer());
  if (!isIco(bytes)) {
    return response.headers.get("content-type") === "image/png" ? bytes : null;
  }
  const images = await decodeIco(bytes, "image/png");
  const image = images
    .sort((a, b) => b.width - a.width)
    .find(({ buffer }) => buffer.byteLength <= maxIconSize);
  return image ? Buffer.from(image.buffer) : null;
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
