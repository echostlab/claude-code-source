> **Disclaimer:** Este repositorio contiene código reconstruido desde un source map (`cli.js.map`) incluido en un paquete npm de terceros. **No** es una publicación oficial de Anthropic.

# claude-code-source

![](https://img.shields.io/badge/Node.js-18%2B-brightgreen?style=flat-square) ![](https://img.shields.io/badge/Bun-%3E%3D1.2.0-black?style=flat-square)

Fork orientado a empaquetar este código como paquete npm con nombre **`claude-code-source`** y binario **`claude-code-source`**.

## Instalación (este paquete)

```sh
npm install -g claude-code-source
```

Ejecutar:

```sh
claude-code-source
```

## Nota importante sobre runtime/build

Este fork depende de **Bun** para:

- compilar (`npm run build`)
- empaquetar vía `prepack` (`npm pack`, `npm publish`)
- ejecutar el binario publicado (`claude-code-source`)

## Compilar y empaquetar

Guía paso a paso:

- [Guía de compilación y empaquetado npm](./docs/guia-empaquetado-npm.md)

## CI rápido (workflow `claudecode`)

Variables mínimas recomendadas para GitHub Actions:

- **Secret API key** (cualquiera de estos aliases):
  - `CLAUDECODE_API_KEY` (preferido)
  - `OPENCODE_API_KEY`, `AZURE_OPENAI_API_KEY`, `AZURE_API_KEY`, `API_KEY`, `apiKey`
- **Repo variable model id** (opcional, default `gpt-5.3-codex`):
  - `CLAUDECODE_MODEL_ID` (preferido)
  - `OPENCODE_MODEL_ID`, `MODEL_ID`, `modelid`, `model`
- **Repo variable base URL** (opcional, default Azure Foundry del workflow):
  - `CLAUDECODE_BASE_URL` (preferido)
  - `OPENCODE_BASE_URL`, `BASEURL`, `baseurl`
- **Repo variable API version** (opcional):
  - `CLAUDECODE_API_VERSION` (preferido)
  - `OPENCODE_API_VERSION`, `API_VERSION`, `APIVERSION`, `apiVersion`

El workflow usa `GITHUB_TOKEN` con permisos explícitos mínimos para crear rama/commit/PR y comentar en issues.
