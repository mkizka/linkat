import { decodeIco, isIco } from "icojs";

export interface IIcoConverter {
  toPng: (bytes: Buffer, maxSize: number) => Promise<Buffer | null>;
}

export const icoConverterFactory = (): IIcoConverter => ({
  async toPng(bytes, maxSize) {
    if (!isIco(bytes)) {
      return null;
    }
    const images = await decodeIco(bytes, "image/png");
    const image = images
      .sort((a, b) => b.width - a.width)
      .find(({ buffer }) => buffer.byteLength <= maxSize);
    return image ? Buffer.from(image.buffer) : null;
  },
});
