export function startFilm(opts: {
  canvas: HTMLCanvasElement;
  root: HTMLElement;
  base: string;
  clock?: HTMLElement | null;
  onProgress?: (p: number) => void;
  onReady?: () => void;
}): () => void;
