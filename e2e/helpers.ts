import { expect, type Page } from '@playwright/test';

/** Posição atual do <audio> único do app, em segundos. */
export const audioTime = (page: Page) => page.locator('audio').evaluate((el: HTMLAudioElement) => el.currentTime);
export const audioPaused = (page: Page) => page.locator('audio').evaluate((el: HTMLAudioElement) => el.paused);

/** Abre o app do zero (sem dados salvos) na tela pedida. */
export async function abrirLimpo(page: Page, hash = '#/') {
  await page.goto('./');
  await page.evaluate(() => localStorage.clear());
  await page.goto(`./${hash}`);
  await page.reload();
}

/** Espera o áudio avançar além de `segundos`. */
export async function esperarTocar(page: Page, segundos = 0.8) {
  await expect.poll(() => audioTime(page), { timeout: 15_000 }).toBeGreaterThan(segundos);
}
