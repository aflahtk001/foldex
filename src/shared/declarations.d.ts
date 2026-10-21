declare module 'bmp-js' {
  export function decode(buffer: Buffer): {
    data: Buffer;
    width: number;
    height: number;
  };
  export function encode(imgData: {
    data: Buffer;
    width: number;
    height: number;
  }): {
    data: Buffer;
  };
}
