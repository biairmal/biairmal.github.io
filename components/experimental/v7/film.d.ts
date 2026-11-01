export function startFilm(opts: {
  canvas: HTMLCanvasElement;
  root: HTMLElement;
  base: string;
  onProgress?: (p: number) => void;
  onReady?: () => void;
}): () => void;
