import { decodeIco, isIco } from "icojs";

export const icoToPng = async (bytes: Buffer, maxSize: number) => {
  if (!isIco(bytes)) {
    return null;
  }
  const images = await decodeIco(bytes, "image/png");
  const image = images
    .sort((a, b) => b.width - a.width)
    .find(({ buffer }) => buffer.byteLength <= maxSize);
  return image ? Buffer.from(image.buffer) : null;
};
