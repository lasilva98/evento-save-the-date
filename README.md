# Save the Date — AI Agents Zendesk · 8CX

Página estática (HTML/CSS/JS puro, sem build).

## Rodar localmente
```bash
python3 -m http.server 5173 --directory "/Users/lucas/Desktop/forms 8cx/site"
```
Abra http://localhost:5173

## Ajustes rápidos (topo do `app.js`, objeto `CONFIG`)
- `endpoint`: URL do seu servidor que grava no Google Sheets. Enquanto for `null`, as
  inscrições ficam no `localStorage` do navegador (chave `inscricoes_aiagents`).
  O POST envia JSON: `nome, email, empresa, cargo, whatsapp, cliente_zendesk, criado_em, origem`.
- `eventStart` / `eventEnd`: horário (usado no convite de agenda).
- `lat` / `lng` / `address`: localização para Maps, Waze e previsão do tempo.

## Imagens
A foto do networking fica em `assets/img/network.webp` (gerada por IA). Para trocar, substitua o arquivo mantendo o nome.

## Logo 3D
`logo3d.js` monta o logo da 8CX em 3D (Three.js) a partir de `assets/logos/8cx.svg`.
Se o navegador não suportar WebGL, aparece o logo em SVG no lugar.

## Logos dos clientes
Ficam em `assets/logos/`, versões brancas com fundo transparente. Para adicionar um cliente,
inclua o arquivo e um `<li>` na lista `.guests` do `index.html`.

## Vídeos
Vídeos oficiais do canal @zendesk no YouTube, carregados só quando a pessoa clica.
Para trocar, altere o `data-yt` (ID do vídeo) nos botões `.video` do `index.html`.

## Bibliotecas (via CDN)
GSAP + ScrollTrigger (animações no scroll) e Lenis (scroll suave). Sem internet,
a página continua funcionando, só que sem as animações.
