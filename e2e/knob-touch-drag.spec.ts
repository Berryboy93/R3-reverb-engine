/**
 * E2E — Knob touch dragging must not scroll the page
 *
 * The knob canvas sets `touch-action: none` so that dragging a knob on a
 * touch screen adjusts the parameter instead of scrolling the page. This
 * suite guards that behaviour two ways:
 *
 * 1. A style assertion: every knob canvas must have a computed
 *    `touch-action` of `none`. Removing the inline style makes this fail
 *    immediately with a clear message.
 * 2. A behavioural test: a real touch drag (dispatched via the Chrome
 *    DevTools Protocol so the browser performs native scroll handling)
 *    across a knob must leave the page scroll position at 0, while the
 *    same drag on a scrollable background region does scroll — proving
 *    the page was genuinely scrollable and the knob suppressed it.
 */

import { test, expect, Page } from '@playwright/test';

// All tests in this file run with a touch-enabled context.
test.use({ hasTouch: true, viewport: { width: 480, height: 640 } });

const KNOB = '[data-testid="knob-canvas"]';

/** Navigate and make sure the page is actually vertically scrollable. */
async function openScrollablePage(page: Page): Promise<void> {
  await page.goto('/');
  await page.waitForSelector(KNOB, { state: 'visible' });
  // Guarantee scrollable overflow regardless of viewport/layout changes.
  await page.evaluate(() => {
    const spacer = document.createElement('div');
    spacer.id = 'e2e-scroll-spacer';
    spacer.style.height = '3000px';
    document.body.appendChild(spacer);
    window.scrollTo(0, 0);
  });
}

/**
 * Dispatch a native touch drag through CDP. Unlike synthetic DOM events,
 * these go through the browser's input pipeline, so default touch
 * scrolling occurs unless `touch-action: none` suppresses it.
 */
async function touchDrag(
  page: Page,
  x: number,
  startY: number,
  endY: number,
): Promise<void> {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x, y: startY }],
  });
  const steps = 12;
  for (let i = 1; i <= steps; i++) {
    const y = startY + ((endY - startY) * i) / steps;
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x, y }],
    });
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await cdp.detach();
}

test.describe('Knob touch-drag scroll suppression', () => {
  test('every knob canvas has touch-action: none', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector(KNOB, { state: 'visible' });

    const touchActions = await page.$$eval(KNOB, (els) =>
      els.map((el) => getComputedStyle(el).touchAction),
    );
    expect(touchActions.length).toBeGreaterThan(0);
    for (const ta of touchActions) {
      expect(ta, 'knob canvas must set touch-action: none to prevent scroll during drag').toBe('none');
    }
  });

  test('touch drag on a knob does not scroll the page', async ({ page }) => {
    await openScrollablePage(page);

    const knob = page.locator(KNOB).first();
    const box = await knob.boundingBox();
    expect(box).not.toBeNull();
    const cx = box!.x + box!.width / 2;
    const cy = box!.y + box!.height / 2;

    // Drag upward across the knob (the gesture that would normally scroll down).
    await touchDrag(page, cx, cy + 15, cy - 60);
    await page.waitForTimeout(300); // let any scroll momentum settle

    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY, 'page must not scroll while dragging a knob').toBe(0);
  });

  test('sanity: the same touch drag on the page background does scroll', async ({ page }) => {
    await openScrollablePage(page);

    // Drag on the spacer region, far from any control.
    const viewport = page.viewportSize()!;
    await touchDrag(page, viewport.width - 10, viewport.height - 40, 40);
    await page.waitForTimeout(300);

    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY, 'background drag should scroll — otherwise the knob test proves nothing').toBeGreaterThan(0);
  });
});
