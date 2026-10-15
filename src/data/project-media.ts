export interface ProjectScreenshot {
  path: string;
  width: number;
  height: number;
  alt: {
    pt: string;
    en: string;
  };
}

export type ProjectMediaMode = 'none' | 'single' | 'carousel';

export function getProjectMediaMode(
  screenshots: readonly ProjectScreenshot[] = [],
): ProjectMediaMode {
  if (screenshots.length === 0) return 'none';
  if (screenshots.length === 1) return 'single';
  return 'carousel';
}
