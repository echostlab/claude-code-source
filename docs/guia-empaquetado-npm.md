# Guía de compilación y empaquetado npm

## Requisitos

- Node.js + npm instalados (`node --version`, `npm --version`)
- Bun instalado (`bun --version`) **obligatorio para build/pack y también para runtime del CLI publicado**

> Este paquete se publica con npm, pero tanto la compilación como la ejecución del binario dependen de Bun.

Nombre/binario del paquete en este repo:

- paquete npm: `claude-code-source`
- ejecutable: `claude-code-source`

## 1) Instalar dependencias

```bash
npm install
```

## 2) Verificar Bun (fail-fast)

```bash
npm run check:bun
```

Si Bun no está instalado, el comando falla con mensaje claro en español/inglés.

## Runtime del CLI publicado

El ejecutable npm (`claude-code-source`) usa un wrapper Node que valida Bun en runtime:

- verifica que Bun exista
- verifica versión mínima `>= 1.2.0`
- si cumple, ejecuta `bun dist/cli.js ...args`

## 3) Compilar el paquete

```bash
npm run build
```

Esto genera el archivo de salida en:

- `dist/cli.js`

## 4) Probar el empaquetado local

```bash
npm run pack:dry
```

También puedes usar:

```bash
npm pack --dry-run
```

Si estás en un entorno sin Bun y solo quieres inspeccionar el contenido del tarball sin ejecutar `prepack`:

```bash
npm pack --dry-run --ignore-scripts
```

## 5) Generar el `.tgz` local

```bash
npm pack
```

El script `prepack` ejecuta automáticamente `npm run build` antes de empaquetar (y por tanto exige Bun).

## 6) Instalar el tarball localmente (sin publicar)

Instalación local en el proyecto actual:

```bash
npm install ./claude-code-source-<version>.tgz
```

Instalación global sin `sudo` (recomendada):

```bash
npm config set prefix ~/.local
export PATH="$HOME/.local/bin:$PATH"
npm install -g ./claude-code-source-<version>.tgz
```

Verificar:

```bash
claude-code-source --version
```

## 7) Publicar en npm

```bash
npm login
npm publish
```

> Si el nombre del paquete ya existe, cambia `name` en `package.json` antes de publicar.
