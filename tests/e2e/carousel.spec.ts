import { expect, test } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const fixturePath = '/e2e-fixture/pt';

function carousel(page: import('@playwright/test').Page, projectName: string, locale = 'pt') {
  const label = locale === 'pt'
    ? `Capturas de tela do projeto: ${projectName}`
    : `Project screenshots: ${projectName}`;
  return page.getByRole('region', { name: label });
}

test('zero and one screenshot render without unnecessary carousel controls', async ({ page }) => {
  await page.goto(fixturePath);

  const emptyCard = page.getByTestId('zero-card');
  await expect(emptyCard.locator('img')).toHaveCount(0);
  await expect(emptyCard.locator('[data-carousel]')).toHaveCount(0);
  await expect(emptyCard.getByText('Conteúdo do card permanece disponível.')).toBeVisible();

  const singleCard = page.getByTestId('single-card');
  await expect(singleCard.locator('img')).toHaveCount(1);
  await expect(singleCard.locator('[data-carousel-previous], [data-carousel-next], [data-carousel-indicator]')).toHaveCount(0);
  await expect(singleCard.locator('img')).toHaveAttribute('alt', 'Captura de teste: Single image');
});

test('arrows and indicators navigate to the selected screenshot', async ({ page }) => {
  await page.goto(fixturePath);
  const region = carousel(page, 'Carousel one');

  const previous = region.getByRole('button', { name: 'Captura anterior' });
  const next = region.getByRole('button', { name: 'Próxima captura' });
  const indicators = region.locator('[data-carousel-indicator]');

  await expect(previous).toBeDisabled();
  await expect(next).toBeEnabled();
  await next.click();
  await expect(indicators.nth(1)).toHaveAttribute('aria-current', 'true');
  await expect(region.locator('[data-carousel-status]')).toHaveText('2 de 3');

  await region.getByRole('button', { name: 'Ir para a captura 3 de 3' }).click();
  await expect(indicators.nth(2)).toHaveAttribute('aria-current', 'true');
  await expect(next).toBeDisabled();

  await previous.click();
  await expect(indicators.nth(1)).toHaveAttribute('aria-current', 'true');
});

test('keyboard and manual scrolling keep the active indicator synchronized', async ({ page }) => {
  await page.goto(fixturePath);
  const region = carousel(page, 'Carousel one');
  const track = region.locator('[data-carousel-track]');
  const indicators = region.locator('[data-carousel-indicator]');

  await track.focus();
  await page.keyboard.press('ArrowRight');
  await expect(indicators.nth(1)).toHaveAttribute('aria-current', 'true');
  await page.keyboard.press('End');
  await expect(indicators.nth(2)).toHaveAttribute('aria-current', 'true');
  await page.keyboard.press('Home');
  await expect(indicators.nth(0)).toHaveAttribute('aria-current', 'true');

  await track.evaluate((element) => {
    const scrollTrack = element as HTMLElement;
    scrollTrack.scrollTo({ left: scrollTrack.clientWidth * 2, behavior: 'instant' });
  });
  await expect(indicators.nth(2)).toHaveAttribute('aria-current', 'true');
});

test('multiple carousels keep independent state', async ({ page }) => {
  await page.goto(fixturePath);
  const first = carousel(page, 'Carousel one');
  const second = carousel(page, 'Carousel two');

  await second.getByRole('button', { name: 'Próxima captura' }).click();
  await expect(second.locator('[data-carousel-indicator]').nth(1)).toHaveAttribute('aria-current', 'true');
  await expect(first.locator('[data-carousel-indicator]').nth(0)).toHaveAttribute('aria-current', 'true');
});

test('mobile touch swipe advances the active slide', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.use.isMobile, 'touch gesture is validated in the mobile browser project');
  await page.goto(fixturePath);

  const region = carousel(page, 'Carousel one');
  const track = region.locator('[data-carousel-track]');
  const box = await track.boundingBox();
  expect(box).not.toBeNull();
  if (!box) return;

  const session = await page.context().newCDPSession(page);
  const y = box.y + box.height / 2;
  const startX = box.x + box.width * 0.82;
  const endX = box.x + box.width * 0.18;
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: startX, y }],
  });
  for (let step = 1; step <= 4; step += 1) {
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: startX + ((endX - startX) * step) / 4, y }],
    });
  }
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });

  await expect(region.locator('[data-carousel-indicator]').nth(1)).toHaveAttribute('aria-current', 'true');
  await session.detach();
});

test('language selector changes routes and screenshot alternative text', async ({ page }) => {
  await page.goto(fixturePath);
  await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
  await expect(page.getByAltText('Captura de teste: Dashboard')).toBeAttached();
  await page.getByRole('link', { name: 'EN', exact: true }).click();
  await expect(page).toHaveURL(/\/e2e-fixture\/en$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByAltText('Test screenshot: Dashboard')).toBeAttached();

  await page.goto('/');
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  await page.getByRole('link', { name: 'EN', exact: true }).click();
  await expect(page).toHaveURL(/\/en\/$/);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('link', { name: 'Projects' }).first()).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.getByRole('link', { name: 'PT', exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
});

test('WhatsApp contact opens with a localized prefilled message', async ({ page }) => {
  for (const [route, label, expectedMessage] of [
    ['/', 'Conversar pelo WhatsApp', 'Olá, Samuel! Encontrei seu portfólio e gostaria de conversar.'],
    ['/en/', 'Message me on WhatsApp', 'Hi, Samuel! I found your portfolio and would like to get in touch.'],
  ]) {
    await page.goto(route);
    const link = page.getByRole('link', { name: label });
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    const href = await link.getAttribute('href');
    expect(href).not.toBeNull();
    const url = new URL(href!);
    expect(url.origin + url.pathname).toBe('https://wa.me/5551991669896');
    expect(url.searchParams.get('text')).toBe(expectedMessage);
  }
});

test('back-to-top button appears after scrolling and returns to the page top', async ({ page }) => {
  await page.goto('/');
  const button = page.getByRole('button', { name: 'Voltar ao topo' });
  await expect(button).toBeHidden();

  await page.evaluate(() => window.scrollTo(0, 500));
  await expect(button).toBeVisible();
  await button.click();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await expect(button).toBeHidden();
});

test('printable resume remains separate from the project screenshot area', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-print]')).toBeDisabled();
  await page.emulateMedia({ media: 'print' });

  const resume = page.locator('.resume-print');
  await expect(resume).toBeVisible();
  await expect(resume.locator('img')).toHaveCount(0);
  await expect(page.locator('[data-print]')).toBeHidden();
});

test('real AGIAS screenshots load with localized descriptions in the portfolio', async ({ page }, testInfo) => {
  const device = testInfo.project.name.includes('mobile') ? 'mobile' : 'desktop';
  const screenshots = [
    { width: '1595', height: '673', pt: /Tela de frequência do AGIAS/, en: /AGIAS attendance screen/ },
    { width: '1589', height: '685', pt: /Formulário de nova atividade do AGIAS/, en: /AGIAS new activity form/ },
    { width: '1579', height: '669', pt: /Central de notificações do AGIAS/, en: /AGIAS notifications center/ },
  ];

  for (const locale of ['pt', 'en'] as const) {
    await page.goto(locale === 'pt' ? '/' : '/en/');
    const card = page.locator('#projects article').filter({ hasText: 'AGIAS' }).first();
    const images = card.locator('img');
    await expect(images).toHaveCount(3);

    for (const [index, expected] of screenshots.entries()) {
      const image = images.nth(index);
      await image.scrollIntoViewIfNeeded();
      await expect(image).toHaveAttribute('width', expected.width);
      await expect(image).toHaveAttribute('height', expected.height);
      await expect(image).toHaveCSS('object-fit', 'contain');
      await expect(image).toHaveAttribute('alt', locale === 'pt' ? expected.pt : expected.en);
      await expect(image).toHaveJSProperty('naturalWidth', Number(expected.width));
    }

    if (locale === 'pt') {
      const track = card.locator('[data-carousel-track]');
      await track.evaluate((element) => element.scrollTo({ left: 0, behavior: 'instant' }));
      await expect(card.locator('[data-carousel-indicator]').first()).toHaveAttribute('aria-current', 'true');
      const pageWidth = await page.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        content: document.documentElement.scrollWidth,
      }));
      expect(pageWidth.content).toBeLessThanOrEqual(pageWidth.viewport);
      await page.addStyleTag({ content: 'astro-dev-toolbar { display: none !important; }' });
      await card.screenshot({ path: `test-results/visual/agias-project-${device}.png` });
    }
  }
});

test('desktop and mobile layout stays within the viewport and captures visual fixtures', async ({ page }, testInfo) => {
  await page.goto(fixturePath);
  const viewportWidth = testInfo.project.use.viewport?.width ?? 1440;
  const layout = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
    cards: Array.from(document.querySelectorAll('[data-testid$="-card"]')).map((card) => {
      const rect = card.getBoundingClientRect();
      return { left: rect.left, right: rect.right, width: rect.width };
    }),
  }));

  expect(layout.document).toBeLessThanOrEqual(layout.viewport);
  expect(layout.viewport).toBe(viewportWidth);
  expect(layout.cards.every((card) => card.left >= 0 && card.right <= layout.viewport)).toBe(true);

  const portraitImage = carousel(page, 'Carousel one').locator('[data-carousel-slide]').nth(1).locator('img');
  await expect(portraitImage).toHaveCSS('object-fit', 'contain');
  await expect(portraitImage).toHaveAttribute('width', '480');
  await expect(portraitImage).toHaveAttribute('height', '800');

  await mkdir('test-results/visual', { recursive: true });
  const device = testInfo.project.name.includes('mobile') ? 'mobile' : 'desktop';
  await page.addStyleTag({ content: 'astro-dev-toolbar { display: none !important; }' });
  await page.screenshot({ path: `test-results/visual/carousel-${device}.png`, fullPage: true });
});

test('keyboard focus is visible and the fixture has no relevant JavaScript errors', async ({ page }) => {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  await page.goto(fixturePath);

  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  const track = carousel(page, 'Carousel one').locator('[data-carousel-track]');
  await expect(track).toBeFocused();
  await expect(track).toHaveCSS('outline-style', 'solid');
  await expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
