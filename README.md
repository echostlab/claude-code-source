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

## Instalar localmente sin publicar en npm

Genera el tarball local:

```sh
npm pack
```

Esto crea un archivo como `claude-code-source-<version>.tgz`.

Instalación local (proyecto actual):

```sh
npm install ./claude-code-source-<version>.tgz
```

Instalación global sin `sudo` (recomendada):

```sh
npm config set prefix ~/.local
export PATH="$HOME/.local/bin:$PATH"
npm install -g ./claude-code-source-<version>.tgz
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

## CI + Azure models

`claudecode` soporta selección por `workflow_dispatch` con inputs opcionales: `provider`, `model_id`, `base_url`, `api_version` (además de `prompt`).

> Alcance real de `provider` en este workflow: **solo Azure Foundry**.
> Aliases aceptados: `azure`, `azure-foundry`, `azure-openai`, `foundry` (todos se normalizan a `azure-foundry`).
> Cualquier otro valor falla con error.

Aliases Azure soportados en CI (además de los actuales):

- Endpoint: `AZURE_OPENAI_ENDPOINT`
- Deployment/model id: `AZURE_OPENAI_DEPLOYMENT`
- API version: `AZURE_OPENAI_API_VERSION`

Seguridad de `base_url` en CI:

- Se exige URL válida con `https`.
- Host allowlist por defecto: `*.openai.azure.com` y `*.services.ai.azure.com`.
- Para endpoints no estándar, se requiere override explícito: `CLAUDECODE_ALLOW_NON_AZURE_BASE_URL=true` (usar solo en endpoints de confianza).

Ejemplos de `model_id` en Azure:

- GPT: `gpt-4.1` (o tu deployment equivalente)
- DeepSeek: `deepseek-r1` (o tu deployment equivalente)

También acepta formato con prefijo (`azure-foundry/deepseek-r1`) y CI lo normaliza para exportar `ANTHROPIC_MODEL=deepseek-r1`.
