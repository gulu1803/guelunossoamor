
# Nosso amor — Build rosé/dark (FINAL)

## Como rodar
1. Abra a pasta no VS Code.
2. Clique com o botão direito em `index.html` → **Open with Live Server**.
3. Permita **Geolocalização** no navegador para o clima (opcional).
4. Login: **gustavo / bbgu** ou **luiza / bblu**.

> PWA: em `localhost` o Service Worker fica desativado para facilitar o dev. Ao publicar (https:// ou domínio), o SW é registrado automaticamente.

## O que há em cada página
- **Início**: contador de dias sem brigas (com reset), dias de relacionamento, contagem para aniversário do Gustavo e da Luiza (mostra “🎂 Feliz aniversário” no dia!), slideshow das fotos e player do Spotify quando online.
- **Galeria**: fotos ordenadas por data (desc). Clique para abrir com animação + preview grande (legenda, local, data, autor) e **excluir**.
- **Cartas**: lista com título/autor/data; abrir mostra animação romântica; é possível **excluir** a própria carta. Cartas podem ser agendadas (o outro só vê no dia).
- **Linha do tempo**: carrossel horizontal + **setas** para navegar; botão para **adicionar momento** (data, título, descrição, imagem).
- **Conquistas**: adicionar conquista (ícone), ficam bloqueadas por padrão; **desbloquear** pergunta data e cria evento na linha do tempo.
- **Mapa**: adicionar/remover país com data; **lista** atualiza; quando online, países ficam **verdes** no mapa. Nomes normalizados (Brasil→Brazil, EUA→United States, etc.).

## Dicas e resolução de problemas
- **Nada salva?** Vá em DevTools → Application → **IndexedDB** e apague o DB `na-db` para reiniciar dados. Recarregue a página.
- **Clima não aparece?** Verifique permissões de geolocalização e teste novamente online.
- **Mapa não pinta?** A pintura precisa de internet (para baixar o GeoJSON). A lista funciona offline.
- **Cache “preso”**: no DevTools → Application → Clear storage → marque tudo → **Clear site data**.

## Estrutura
```
index.html
manifest.json
sw.js
css/styles.css
js/app.js
js/router.js
js/util.js
js/db/indexed.js
js/auth/users.js
js/auth/auth.js
pages/home.js
pages/gallery.js
pages/letters.js
pages/timeline.js
pages/achievements.js
pages/map.js
data/achievements.json
data/timeline.json
assets/icons/ (placeholders)
assets/images/ (placeholders)
```

## Notas
- Imagens de exemplo estão em `/assets/images`. Substitua pelos seus arquivos mantendo os nomes ou carregue via **Galeria**.
- Para trocar textos fixos, procure nos arquivos em `pages/*` e `js/*`.
- Segurança: login simples com senhas fixas; adequado para uso pessoal/privado.


## Atualizações v3
- Ícones (inline SVG) em botões e ações (sem depender de CDN).
- Botões alinhados, com espaçamento e responsividade melhorados.
- **Galeria**: animação ao abrir + excluir foto; data corrigida (fallback para `createdAt`).
- **Cartas**: animação mais perceptível; data mostrada é a **de publicação**.
- **Linha do tempo**: setas esquerda/direita para navegar.
- **Mapa**: agora dá para **adicionar clicando no país**; lista atualiza imediatamente; remover na lista.


## Atualizações v4
- Ícones na **navbar** e efeito de hover com brilho rosé.
- **Slideshow** com crossfade suave.
- Botões reposicionados/alinhados em **Cartas**, **Linha do tempo** e **Conquistas**; botão **Resetar** menor.
- **Conquistas** reescritas: agora é possível **adicionar** novas e **desbloquear** corretamente (persistido no IndexedDB).
- **Mapa** clicável: clique no país para adicionar; lista atualiza e o país fica verde.


### Mapa (offline-stable)
- Sem dependência de GeoJSON externo: países são adicionados via nome e pintados por **retângulos aproximados**.
- Lista atualiza e persistência no IndexedDB.
- Para centralizar, uso o bbox interno; se o país não estiver no catálogo embutido, ainda é possível listar.


## v22-fix2 — 2025-08-09 21:10
- **Modais de adicionar** (foto, carta, linha do tempo, conquista): adicionado **botão Fechar** em todos.
- **Carta (abrir)**: modal com **botão Fechar** no topo.
- **Galeria (excluir)**: ao clicar em **Excluir**, a **foto fecha e o modal é removido** antes da confirmação (nada fica por cima da confirmação).
- **Calendário & textos**: inputs de **data** agora têm texto claro; ícone do calendário **invertido para branco** no WebKit (`::-webkit-calendar-picker-indicator`).


## v22-fix3 — 2025-08-09 21:14
- **Botão Fechar** adicionado nos modais de **criar carta** e **criar linha do tempo**.
- Padronizei o cabeçalho de **todos os modais** com a classe `.modal-head` (posicionamento consistente do botão Fechar).
- **Login**: todo o texto do diálogo fica **branco** (inclusive placeholders).
- Mantidas correções anteriores da galeria (fechar modal antes de confirmar exclusão).

## v22-fix10 — 2025-08-09 21:50
- **Cartas**: validação no formulário — exibe toast de erro se faltar **título**, **conteúdo** ou **data**.


## v22-map1 — 2025-08-09 22:04
**Mapa (SVG + GeoJSON local)**
- Clique no país para **alternar** visitado ↔ não visitado.
- Ao marcar, pede **data** (obrigatória, BRT) — pinta de **verde** e adiciona na **lista** (ordenada por ordem de visita).
- **Editar**/ **Remover** itens na lista.
- Integra com **Linha do tempo** (“Visitamos X”) e cria **Conquista** automática por país (`visit_ISO3`).
- **Offline**: use `data/world.geo.json`. Incluí `data/world.geo.sample.json` apenas para teste (Brasil/Argentina com formas retangulares).

### Como ativar o mapa completo
1. Baixe um **GeoJSON de países** (ex.: derivado de *Natural Earth* / *world-atlas*).  
2. Salve como `data/world.geo.json` (coordenadas em lon/lat WGS84).  
3. Campos esperados em `properties`:  
   - `iso_a3` (ou `ISO_A3`, `iso3`) — código ISO3.  
   - `name_pt` (ou `name`) — nome do país (PT-BR preferível).  
4. Atualize o site; o mapa será renderizado e ficará disponível **offline** após o primeiro acesso.

### Cores
- Não visitado: `#444`  
- Visitado: `#6fbf73` (borda média)

> Dica: se quiser muito detalhe, use um GeoJSON simplificado (~200–400KB) para manter fluidez no mobile.

## v22-map2 — 2025-08-09 22:23
- **Mapa**: altura visível (`aspect-ratio` + `min-height`).
- **Fallback extra**: se nenhum arquivo for carregado, usa **dataset embutido** (BRA/ARG) — assim o mapa **sempre aparece**.

## v22-map3 — 2025-08-09 22:26
- **Mapa**: correção crítica — elementos SVG agora são criados com `createElementNS` (antes o mapa podia não aparecer).

## v22-map5 — 2025-08-09 22:44
- Mapa: borda **média** aplicada (stroke ajustado).

## v22-map-fix-allgreen — 2025-08-09 22:55
- Reescrevi `pages/map.js` com toggling por país correto.
- `visited` agora é aplicado **só** aos `path` cujo `data-iso3` estiver salvo.
- Corrigi helpers SVG e fluxos de clique, edição e remoção.
