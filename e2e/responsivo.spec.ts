import { expect, test, type Page } from '@playwright/test';
import { abrirLimpo, esperarTocar } from './helpers';

const WIDTHS = [
  { name: '360', width: 360, height: 740 },
  { name: '768', width: 768, height: 1024 },
  { name: '1280', width: 1280, height: 800 },
];

async function semRolagemHorizontal(page: Page, onde: string) {
  const { scrollWidth, innerWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
  expect(scrollWidth, `rolagem horizontal da página em ${onde}`).toBeLessThanOrEqual(innerWidth);
  // Nenhuma área rolável principal pode ter conteúdo mais largo que ela mesma (exceto os carrosséis, que rolam de propósito).
  const estouros = await page.evaluate(() => {
    const ruins: string[] = [];
    const vw = window.innerWidth;
    document.querySelectorAll<HTMLElement>('main *, .sidebar *, .bottom *, .player-bar *').forEach((el) => {
      if (el.closest('.carousel__list, dialog, .multiselect__list, .genre-card, svg')) return;
      const r = el.getBoundingClientRect();
      if (r.width > 0 && (r.right > vw + 1 || r.left < -1)) ruins.push(`${el.tagName.toLowerCase()}.${el.className}`);
    });
    return [...new Set(ruins)].slice(0, 5);
  });
  expect(estouros, `elementos fora da tela em ${onde}`).toEqual([]);
}

async function captura(page: Page, nome: string, largura: string) {
  // Só regrava as imagens do README com `npm run capturas`, para o teste não sujar o Git.
  if (!process.env.CAPTURAS) return;
  await page.screenshot({ path: `docs/screenshots/${nome}-${largura}.png` });
}

for (const { name, width, height } of WIDTHS) {
  test(`sem estouro horizontal e com capturas em ${name}px`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await abrirLimpo(page, '#/');
    const mobile = width < 1024;

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await semRolagemHorizontal(page, 'início');
    await captura(page, '01-inicio', name);

    await page.goto('./#/buscar');
    await expect(page.getByRole('heading', { name: 'Navegar por todas as seções' })).toBeVisible();
    await semRolagemHorizontal(page, 'buscar (gêneros)');
    await captura(page, '02-buscar', name);

    await page.getByRole('searchbox', { name: 'O que você quer ouvir?' }).fill('a');
    await expect(page.getByRole('heading', { name: /Resultados para/ })).toBeVisible();
    await semRolagemHorizontal(page, 'resultados da busca');
    await page.getByRole('button', { name: 'Gênero' }).click();
    await semRolagemHorizontal(page, 'combobox aberto');
    await captura(page, '03-busca-filtro', name);
    await page.keyboard.press('Escape');

    await page.goto('./#/album/sal-e-neon');
    await expect(page.getByRole('heading', { level: 1, name: 'Sal e Neon' })).toBeVisible();
    await page.getByRole('button', { name: 'Tocar Sal e Neon' }).click();
    await esperarTocar(page, 0.5);
    await semRolagemHorizontal(page, 'álbum tocando');
    await captura(page, '04-album', name);

    await page.goto('./#/artista/mar-de-cobre');
    await expect(page.getByRole('heading', { level: 1, name: 'Mar de Cobre' })).toBeVisible();
    await semRolagemHorizontal(page, 'artista');
    await captura(page, '05-artista', name);

    await page.goto('./#/playlist/madrugada-tranquila');
    await expect(page.getByRole('heading', { level: 1, name: 'Madrugada Tranquila' })).toBeVisible();
    await semRolagemHorizontal(page, 'playlist');
    await captura(page, '06-playlist', name);

    await page.goto('./#/biblioteca');
    await expect(page.getByRole('heading', { level: 1, name: 'Sua Biblioteca' })).toBeVisible();
    await semRolagemHorizontal(page, 'biblioteca');
    await captura(page, '07-biblioteca', name);

    await page.goto('./#/curtidas');
    await expect(page.getByRole('heading', { level: 1, name: 'Músicas Curtidas' })).toBeVisible();
    await semRolagemHorizontal(page, 'curtidas');
    await captura(page, '08-curtidas', name);

    await page.goto('./#/configuracoes');
    await expect(page.getByRole('heading', { level: 1, name: 'Configurações' })).toBeVisible();
    await semRolagemHorizontal(page, 'configurações');

    // Janelas: ações da faixa e fila.
    await page.goto('./#/playlist/foco-total');
    await page.getByRole('button', { name: /^Mais opções para / }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await semRolagemHorizontal(page, 'ações da faixa');
    await captura(page, '09-acoes-faixa', name);
    await page.getByRole('button', { name: 'Adicionar à fila' }).click();

    if (mobile) {
      await page.getByRole('button', { name: /^Abrir o player/ }).click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await semRolagemHorizontal(page, 'player expandido');
      await captura(page, '10-player-expandido', name);
      await page.getByRole('dialog').getByRole('button', { name: 'Fila de reprodução' }).click();
    } else {
      await page.getByRole('button', { name: 'Fila de reprodução' }).click();
    }
    await expect(page.getByRole('dialog', { name: 'Fila de reprodução' })).toBeVisible();
    const caixa = await page.getByRole('dialog', { name: 'Fila de reprodução' }).boundingBox();
    expect(caixa && caixa.x >= 0 && caixa.x + caixa.width <= width, 'fila dentro da tela').toBe(true);
    await captura(page, '11-fila', name);
  });
}
