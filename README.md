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
