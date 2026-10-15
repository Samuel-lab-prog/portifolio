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
bun run build
```
