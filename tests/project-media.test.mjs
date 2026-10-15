import { describe, expect, it } from 'bun:test';
import { getProjectMediaMode } from '../src/data/project-media.ts';

describe('project media presentation', () => {
  it('omits the media area when there are no screenshots', () => {
    expect(getProjectMediaMode([])).toBe('none');
  });

  it('shows one screenshot without carousel controls', () => {
    expect(getProjectMediaMode([{ path: '/projects/one.webp', width: 1280, height: 720, alt: { pt: 'Tela', en: 'Screen' } }])).toBe('single');
  });

  it('enables carousel controls only for multiple screenshots', () => {
    const screenshots = [
      { path: '/projects/one.webp', width: 1280, height: 720, alt: { pt: 'Tela 1', en: 'Screen 1' } },
      { path: '/projects/two.webp', width: 1280, height: 720, alt: { pt: 'Tela 2', en: 'Screen 2' } },
    ];

    expect(getProjectMediaMode(screenshots)).toBe('carousel');
  });
});
