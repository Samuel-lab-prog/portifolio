# Portfolio

Landing page pessoal estática feita com Astro, TypeScript e Tailwind CSS v4.

## Desenvolvimento

```sh
bun install
bun run dev
```

O conteúdo está em [`src/data/portfolio.json`](./src/data/portfolio.json). As rotas
`/` e `/en/` usam o mesmo conteúdo traduzido; a URL define o idioma, sem redirecionamento
automático. O currículo é renderizado a partir do mesmo JSON e pode ser impresso ou salvo
como PDF pelo navegador.

## SEO e domínio

Defina `SITE_URL` como a origem permanente do site (protocolo e domínio, sem caminho)
antes de gerar a versão destinada à publicação. Com essa variável, o build configura
canonicals, alternates `hreflang`, `x-default` e o sitemap XML. Sem ela, o build local
continua funcionando, `robots.txt` não anuncia um sitemap e esses metadados absolutos
ficam intencionalmente omitidos. O domínio ainda precisa ser definido antes de considerar
SEO e sitemap completos.

No PowerShell, configure `SITE_URL` para a origem que você escolher e então execute:

```powershell
bun run build
```

Não há hospedagem ou publicação configurada pelo projeto.

## Verificações

```sh
bun run typecheck
bun run test
bun run test:e2e
bun run build
```

Na primeira execução dos testes E2E, instale o Chromium usado pelo Playwright:

```sh
bunx playwright install chromium
```

## Screenshots e demos dos projetos

Guarde screenshots reais em `public/projects/<slug-do-projeto>/`, usando nomes
ordenados e descritivos, por exemplo `01-dashboard.webp` e `02-class-details.webp`.
Prefira WebP otimizado; PNG pode ser usado quando a compressão prejudicar a nitidez de
textos pequenos. Para manter a composição do carrossel, prefira imagens 16:9 em
1280×720 ou 1600×900. Informe no JSON as dimensões reais do arquivo otimizado.

No objeto do projeto em `src/data/portfolio.json`, preencha `demoUrl` somente quando
houver uma aplicação publicamente acessível e confirmada. Enquanto não houver, mantenha
`null`. Cadastre cada captura em `screenshots` com caminho relativo à pasta `public`
(iniciando com `/`), largura, altura e descrição alternativa traduzida:

```json
{
  "demoUrl": null,
  "screenshots": [
    {
      "path": "/projects/agias/01-dashboard.webp",
      "width": 1600,
      "height": 900,
      "alt": {
        "pt": "Painel docente do AGIAS com resumo das turmas e próximas aulas.",
        "en": "AGIAS teacher dashboard with a class summary and upcoming lessons."
      }
    }
  ]
}
```

O texto alternativo deve descrever o que a captura realmente mostra, sem repetir apenas
o nome do projeto. Não inclua dados pessoais, acadêmicos ou credenciais nas imagens. As
rotas `/e2e-fixture/pt` e `/e2e-fixture/en` usam SVGs inline somente durante o servidor
de desenvolvimento; o build estático não contém as fixtures nem as imagens temporárias.
