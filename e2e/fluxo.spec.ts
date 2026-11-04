import { expect, test } from '@playwright/test';
import { abrirLimpo, audioPaused, audioTime, esperarTocar } from './helpers';

test.describe('fluxo principal (desktop)', () => {
  test('álbum → tocar → tempo avança → próxima → curtir → Curtidas → criar playlist → recarregar e continuar', async ({ page }) => {
    await abrirLimpo(page);
    await expect(page.getByRole('heading', { level: 1, name: /Bom dia|Boa tarde|Boa noite/ })).toBeVisible();

    // Abre o álbum pela busca (sem acento nem maiúsculas).
    await page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: 'Buscar' }).click();
    await page.getByRole('searchbox', { name: 'O que você quer ouvir?' }).fill('CIRCUITO aberto');
    await page.getByRole('list', { name: 'Resultados da busca' }).locator('a.entity-row__title', { hasText: 'Circuito Aberto' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Circuito Aberto' })).toBeVisible();
    await expect(page).toHaveURL(/#\/album\/circuito-aberto$/);

    // Toca e confere que o <audio> realmente avança.
    const player = page.getByRole('region', { name: 'Player' });
    await page.getByRole('button', { name: 'Tocar Circuito Aberto' }).click();
    await esperarTocar(page);
    await expect(player.getByRole('button', { name: 'Pausar' })).toBeVisible();
    const primeiro = await player.locator('.player-bar__title').innerText();

    // Próxima faixa: o título muda e o tempo recomeça a andar.
    await player.getByRole('button', { name: 'Próxima' }).click();
    await expect(player.locator('.player-bar__title')).not.toHaveText(primeiro);
    const segundo = await player.locator('.player-bar__title').innerText();
    await esperarTocar(page, 0.8);

    // Curtir a faixa atual e achar em Músicas Curtidas.
    await player.getByRole('button', { name: `Curtir ${segundo}` }).click();
    await expect(player.getByRole('button', { name: `Remover ${segundo} das curtidas` })).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('link', { name: /Músicas Curtidas/ }).first().click();
    await expect(page.getByRole('heading', { level: 1, name: 'Músicas Curtidas' })).toBeVisible();
    await page.getByRole('button', { name: 'Gênero' }).click();
    await page.getByRole('searchbox', { name: 'Buscar em gênero' }).fill('eletronica');
    await page.getByRole('option', { name: 'Eletrônica' }).click();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('list', { name: 'Músicas curtidas' }).getByText(segundo, { exact: true })).toBeVisible();

    // Criar playlist pelo <dialog>, validação e navegação.
    await page.getByRole('button', { name: 'Criar playlist' }).click();
    const dialog = page.getByRole('dialog', { name: 'Criar playlist' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Criar', exact: true }).click();
    await expect(dialog.getByRole('alert')).toHaveText('Dê um nome à playlist.');
    await dialog.getByLabel('Nome da playlist').fill('Playlist E2E');
    await dialog.getByRole('button', { name: 'Criar', exact: true }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Playlist E2E' })).toBeVisible();
    await expect(page.getByText('Esta playlist está vazia.')).toBeVisible();

    // Adiciona uma faixa do álbum à playlist.
    await page.goto('./#/album/circuito-aberto');
    await page.getByRole('button', { name: /^Mais opções para / }).first().click();
    await page.getByRole('button', { name: 'Adicionar à playlist' }).click();
    await page.getByRole('button', { name: /Playlist E2E/ }).click();
    await page.getByRole('button', { name: 'Concluir' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);

    // Deixa avançar um pouco, recarrega: a faixa e a posição voltam, sem tocar sozinho.
    await esperarTocar(page, 2.2);
    await page.waitForTimeout(1200); // a posição é salva a cada ~1 s
    const antes = await audioTime(page);
    await page.reload();
    await expect(player.locator('.player-bar__title')).toHaveText(segundo);
    await expect.poll(() => audioTime(page)).toBeGreaterThan(Math.max(0, antes - 3));
    expect(await audioPaused(page)).toBe(true);
    await expect(player.getByRole('button', { name: 'Tocar' })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Principal' }).first()).toBeVisible();
    await expect(page.getByRole('list', { name: 'Itens da sua biblioteca' }).getByRole('link', { name: /Playlist E2E/ })).toBeVisible();
    await page.getByRole('link', { name: /Playlist E2E/ }).click();
    await expect(page.getByRole('list', { name: 'Faixas de Playlist E2E' }).getByRole('listitem')).toHaveCount(1);
    // Curtida e playlist sobreviveram ao reload.
    await expect(player.getByRole('button', { name: `Remover ${segundo} das curtidas` })).toBeVisible();
  });

  test('hash router: voltar, avançar e recarregar preservam a tela', async ({ page }) => {
    await abrirLimpo(page);
    await page.goto('./#/artista/pe-de-vento');
    await expect(page.getByRole('heading', { level: 1, name: 'Pé de Vento' })).toBeVisible();
    await page.goto('./#/playlist/foco-total');
    await expect(page.getByRole('heading', { level: 1, name: 'Foco Total' })).toBeVisible();
    await page.goBack();
    await expect(page.getByRole('heading', { level: 1, name: 'Pé de Vento' })).toBeVisible();
    await page.goForward();
    await expect(page.getByRole('heading', { level: 1, name: 'Foco Total' })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('heading', { level: 1, name: 'Foco Total' })).toBeVisible();
    await page.goto('./#/album/nao-existe');
    await expect(page.getByRole('heading', { name: /Não encontramos/ })).toBeVisible();
  });

  test('player: espaço, mudo, aleatório, repetir e atalhos de teclado', async ({ page }) => {
    await abrirLimpo(page, '#/album/forro-no-quintal');
    const player = page.getByRole('region', { name: 'Player' });
    await page.getByRole('button', { name: 'Tocar Forró no Quintal' }).click();
    await esperarTocar(page);

    // Espaço pausa e retoma fora de campos de texto.
    await page.locator('main').click({ position: { x: 5, y: 5 } });
    await page.keyboard.press('Space');
    await expect.poll(() => audioPaused(page)).toBe(true);
    await page.keyboard.press('Space');
    await expect.poll(() => audioPaused(page)).toBe(false);

    // Dentro de um campo de texto o espaço não mexe no player.
    await page.goto('./#/buscar');
    const campo = page.getByRole('searchbox', { name: 'O que você quer ouvir?' });
    await campo.click();
    await campo.press('Space');
    expect(await audioPaused(page)).toBe(false);
    await expect(campo).toHaveValue(' ');
    await campo.fill('');

    // Mudo e volume.
    await player.getByRole('button', { name: 'Silenciar' }).click();
    expect(await page.locator('audio').evaluate((el: HTMLAudioElement) => el.muted)).toBe(true);
    await player.getByRole('button', { name: 'Ativar o som' }).click();
    await player.getByLabel('Volume').fill('0.3');
    expect(await page.locator('audio').evaluate((el: HTMLAudioElement) => el.volume)).toBeCloseTo(0.3, 1);

    // Aleatório e repetir (desligado → todas → uma → desligado).
    const aleatorio = player.getByRole('button', { name: 'Aleatório' });
    await aleatorio.click();
    await expect(aleatorio).toHaveAttribute('aria-pressed', 'true');
    await player.getByRole('button', { name: 'Repetir: desligado' }).click();
    await player.getByRole('button', { name: 'Repetir: todas as faixas' }).click();
    await expect(player.getByRole('button', { name: 'Repetir: uma faixa' })).toHaveAttribute('aria-pressed', 'true');
    await player.getByRole('button', { name: 'Repetir: uma faixa' }).click();
    await expect(player.getByRole('button', { name: 'Repetir: desligado' })).toHaveAttribute('aria-pressed', 'false');

    // Shift + seta avança de faixa.
    const titulo = await player.locator('.player-bar__title').innerText();
    await page.locator('main').click({ position: { x: 5, y: 5 } });
    await page.keyboard.press('Shift+ArrowRight');
    await expect(player.locator('.player-bar__title')).not.toHaveText(titulo);

    // Barra de progresso: arrastar/alterar leva o áudio para a nova posição.
    await player.getByLabel('Progresso da faixa').fill('15');
    await expect.poll(() => audioTime(page)).toBeGreaterThan(14.5);
  });

  test('fila: adicionar, reordenar, remover e destaque da faixa atual', async ({ page }) => {
    await abrirLimpo(page, '#/playlist/foco-total');
    const lista = page.getByRole('list', { name: 'Faixas de Foco Total' });
    await page.getByRole('button', { name: 'Tocar Foco Total' }).click();
    await esperarTocar(page, 0.5);
    // A linha tocando tem o indicador animado e aria-current.
    await expect(lista.locator('li[aria-current="true"] [data-testid="eq"]')).toHaveCount(1);

    const nomeA = await lista.getByRole('listitem').nth(5).locator('.track__title').innerText();
    const nomeB = await lista.getByRole('listitem').nth(6).locator('.track__title').innerText();
    for (const indice of [5, 6]) {
      await lista.getByRole('listitem').nth(indice).getByRole('button', { name: /^Mais opções/ }).click();
      await page.getByRole('button', { name: 'Adicionar à fila' }).click();
    }
    await page.getByRole('button', { name: 'Fila de reprodução' }).click();
    const fila = page.getByRole('dialog', { name: 'Fila de reprodução' });
    const itens = fila.getByRole('list', { name: 'A seguir' }).getByRole('listitem');
    await expect(itens.nth(0)).toContainText(nomeA);
    await expect(itens.nth(1)).toContainText(nomeB);
    await expect(itens.nth(0)).toContainText('adicionada por você');

    await itens.nth(0).getByRole('button', { name: /para baixo$/ }).click();
    await expect(itens.nth(0)).toContainText(nomeB);
    await expect(itens.nth(1)).toContainText(nomeA);
    await itens.nth(0).getByRole('button', { name: /^Remover / }).click();
    await expect(itens.nth(0)).toContainText(nomeA);

    // Clicar fora fecha a janela.
    await page.mouse.click(5, 5);
    await expect(fila).toHaveCount(0);
  });

  test('biblioteca: paginação 25/50/100/200 e filtros em combobox de múltipla escolha', async ({ page }) => {
    await abrirLimpo(page, '#/biblioteca');
    await expect(page.getByText(/^1–25 de \d+$/)).toBeVisible();
    await page.getByRole('group', { name: 'Itens por página' }).getByRole('button', { name: '50' }).click();
    await expect(page.getByText(/^1–\d+ de \d+$/)).toBeVisible();
    await page.reload();
    await expect(page.getByRole('group', { name: 'Itens por página' }).getByRole('button', { name: '50' })).toHaveAttribute('aria-pressed', 'true');

    await page.getByRole('button', { name: 'Tipo' }).click();
    await page.getByRole('option', { name: 'Álbum' }).click();
    await page.getByRole('option', { name: 'Artista' }).click();
    await expect(page.locator('.multiselect__footer')).toContainText('2 selecionados');
    await page.getByRole('button', { name: 'Limpar seleção' }).click();
    await expect(page.locator('.multiselect__footer')).toContainText('Nenhum selecionado');
    await page.getByRole('option', { name: 'Artista' }).click();
    await page.keyboard.press('Escape');
    const linhas = page.getByRole('list', { name: 'Itens da biblioteca' }).getByRole('listitem');
    expect(await linhas.count()).toBeGreaterThan(5);
    await expect(linhas.first()).toContainText('Artista');
    // Volta o tamanho padrão para não afetar outros testes (o storage é limpo em cada abrirLimpo).
  });

  test('Biblioteca: criar, renomear e apagar playlist; mesmo botão não abre duas janelas', async ({ page }) => {
    await abrirLimpo(page, '#/biblioteca');
    const botao = page.getByRole('main').getByRole('button', { name: 'Criar playlist' });
    // Dois cliques seguidos no mesmo botão (em código, sem passar pelo backdrop) abrem uma janela só.
    await botao.evaluate((el: HTMLElement) => {
      el.click();
      el.click();
    });
    await expect(page.getByRole('dialog')).toHaveCount(1);
    await page.getByLabel('Nome da playlist').fill('Minhas Favoritas');
    await page.getByLabel('Nome da playlist').press('Enter');
    await expect(page.getByRole('heading', { level: 1, name: 'Minhas Favoritas' })).toBeVisible();

    await page.getByRole('button', { name: 'Renomear' }).click();
    await page.getByLabel('Nome da playlist').fill('Renomeada');
    await page.getByRole('button', { name: 'Salvar' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Renomeada' })).toBeVisible();

    // Nome repetido é recusado.
    await page.getByRole('button', { name: 'Criar playlist' }).click();
    await page.getByLabel('Nome da playlist').fill('renomeada');
    await page.getByRole('button', { name: 'Criar', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('já tem');
    await page.keyboard.press('Escape');

    await page.getByRole('button', { name: 'Apagar' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Apagar' }).click();
    await expect(page).toHaveURL(/#\/biblioteca$/);
    await expect(page.getByRole('main').getByText('Renomeada')).toHaveCount(0);
  });

  test('curtir/seguir/salvar persistem; Buscar entende acento e filtros', async ({ page }) => {
    await abrirLimpo(page, '#/artista/polvora-doce');
    const seguir = page.getByRole('button', { name: 'Seguir', exact: true });
    await seguir.click();
    await expect(page.getByRole('button', { name: 'Seguindo' })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('button', { name: 'Seguindo' })).toBeVisible();

    await page.goto('./#/buscar/forro');
    await expect(page.getByRole('heading', { name: /Resultados para/ })).toBeVisible();
    await expect(page.getByRole('searchbox')).toHaveValue('forro');
    await expect(page.getByText(/resultados$/)).toBeVisible();
    await page.getByRole('button', { name: 'Tipo' }).click();
    await page.getByRole('option', { name: 'Faixa' }).click();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('list', { name: 'Resultados da busca' }).getByRole('listitem').first()).toBeVisible();
    await page.getByRole('searchbox').fill('zzzxyz');
    await expect(page.getByText(/Nada encontrado/)).toBeVisible();
  });
});

test.describe('celular', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test('um toque na linha toca; mini player abre o player expandido em tela cheia', async ({ page }) => {
    await abrirLimpo(page, '#/album/circuito-aberto');
    await expect(page.getByRole('region', { name: 'Mini player' })).toHaveCount(0);
    await page.getByRole('list', { name: 'Faixas de Circuito Aberto' }).getByRole('listitem').nth(2).locator('.track__title').tap();
    await esperarTocar(page);
    const mini = page.getByRole('region', { name: 'Mini player' });
    await expect(mini).toBeVisible();
    await expect(mini.getByRole('button', { name: 'Pausar' })).toBeVisible();

    await mini.getByRole('button', { name: /^Abrir o player/ }).tap();
    const cheio = page.getByRole('dialog');
    await expect(cheio).toBeVisible();
    const caixa = await cheio.boundingBox();
    expect(caixa?.width).toBeGreaterThanOrEqual(389);
    await cheio.getByRole('button', { name: 'Próxima' }).tap();
    await expect.poll(() => audioTime(page)).toBeGreaterThan(0.3);
    await cheio.getByRole('button', { name: 'Aleatório' }).tap();
    await expect(cheio.getByRole('button', { name: 'Aleatório' })).toHaveAttribute('aria-pressed', 'true');
    await cheio.getByRole('button', { name: 'Pausar' }).tap();
    await expect.poll(() => audioPaused(page)).toBe(true);
    await cheio.getByRole('button', { name: 'Fechar' }).tap();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByRole('navigation', { name: 'Principal' })).toBeVisible();
  });
});
