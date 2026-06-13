# ivos-skills

Coleccion personal de skills para herramientas, frameworks y librerias usadas por agentes de IA (Codex, OpenCode, Claude Code, Copilot CLI, Gemini CLI, etc.).

## Instalacion

La instalacion varia segun el agente que uses. Si usas mas de uno, instala ivos-skills por separado en cada uno.

Para instrucciones detalladas de instalacion, consulta [INSTALL.md](INSTALL.md).

### Claude Code

```bash
# Agregar el marketplace y luego instalar el plugin
claude plugins marketplace add ivomiyashiro/ivos-skills
claude plugins install ivos-skills@ivos-skills
```

Reinicia Claude Code. Todas las skills quedan disponibles automaticamente. Para actualizar:

```bash
claude plugins update ivos-skills
```

### OpenCode

OpenCode usa su propio sistema de plugins. Instala ivos-skills por separado aunque ya lo uses en otro agente.

1. Abre tu `opencode.json` global (o de proyecto) y agrega ivos-skills al array `plugin`:

```json
{
  "plugin": ["ivos-skills@git+https://github.com/ivomiyashiro/ivos-skills.git"]
}
```

2. Reinicia OpenCode. El plugin se instala automaticamente a traves del gestor de plugins de OpenCode y registra todas las skills.

3. Verifica preguntando: "List my available skills" o usa la herramienta `skill`.

Para mas detalles, consulta [`.opencode/INSTALL.md`](.opencode/INSTALL.md).

### Codex

Codex usa su propio sistema de plugins. Instala ivos-skills por separado aunque ya lo uses en otro agente.

```bash
# Agregar el marketplace y luego instalar el plugin
codex plugin marketplace add https://github.com/ivomiyashiro/ivos-skills.git
codex plugin add ivos-skills@ivos-skills
```

Reinicia Codex. Todas las skills quedan disponibles automaticamente. Para actualizar:

```bash
codex plugin marketplace upgrade ivos-skills
```

### Antigravity CLI

```bash
# Instalar el plugin desde el repositorio remoto
agy plugin install https://github.com/ivomiyashiro/ivos-skills.git
```

Reinicia el CLI de Antigravity (`agy`). Las skills estaran disponibles automaticamente. Para desinstalar:

```bash
agy plugin uninstall ivos-skills
```

### Skills CLI (multi-agente)

Si prefieres usar el CLI de skills para instalar todo el paquete o skills individuales:

```bash
# Instalar todo el paquete globalmente
npx skills add ivomiyashiro/ivos-skills -g -y

# Instalar una skill especifica
npx skills add ivomiyashiro/ivos-skills --skill nombre-skill -g -y

# Listar skills disponibles en el paquete
npx skills add ivomiyashiro/ivos-skills -l

# Actualizar todas las skills instaladas
npx skills update -g

# Actualizar solo esta skill
npx skills update ivos-skills -g
```

## Skills incluidas

| Skill | Descripcion |
|-------|-------------|
| `flutter-add-integration-test` | Configures Flutter Driver for app interaction and converts MCP actions into permanent integration tests |
| `flutter-add-widget-preview` | Adds interactive widget previews to the project using the previews.dart system |
| `flutter-add-widget-test` | Implement a component-level test using `WidgetTester` to verify UI rendering and user interactions |
| `flutter-apply-architecture-best-practices` | Architects a Flutter application using the recommended layered approach (UI, Logic, Data) |
| `flutter-build-responsive-layout` | Use `LayoutBuilder`, `MediaQuery`, or `Expanded/Flexible` to create a layout that adapts to different screen sizes |
| `flutter-fix-layout-issues` | Fixes Flutter layout errors (overflows, unbounded constraints) using Dart and Flutter MCP tools |
| `flutter-implement-json-serialization` | Create model classes with `fromJson` and `toJson` methods using `dart:convert` |
| `flutter-setup-declarative-routing` | Configure `MaterialApp.router` using a package like `go_router` for advanced URL-based navigation |
| `flutter-setup-localization` | Add `flutter_localizations` and `intl` dependencies, enable "generate true" in `pubspec.yaml` |
| `flutter-use-http-package` | Use the `http` package to execute GET, POST, PUT, or DELETE requests |
| `hono-bun-api` | Construir APIs TypeScript opinadas con Hono + Bun siguiendo vertical slice, CQRS lite, Result pattern, Zod |
| `react-best-practices` | React and Next.js performance optimization guidelines from Vercel Engineering |
| `supabase` | Use when doing any task involving Supabase products, client libraries, SSR integrations, RLS, and Postgres extensions |
| `supabase-postgres-best-practices` | Postgres performance optimization and best practices from Supabase |

## Mantener actualizado

### Claude Code (plugin)

```bash
claude plugins update ivos-skills
```

### OpenCode (plugin)

OpenCode detecta cambios automaticamente al reiniciar. Si no detecta la ultima version:

```bash
# Forzar reinstalacion (elimina cache)
rm -rf ~/.config/opencode/node_modules/ivos-skills
# Luego reinicia OpenCode
```

O actualiza manualmente via npm:
```bash
npm install ivos-skills@git+https://github.com/ivomiyashiro/ivos-skills.git --prefix ~/.config/opencode
```

### Codex (plugin)

```bash
codex plugin marketplace upgrade ivos-skills
```

Si todavia no lo instalaste:

```bash
codex plugin marketplace add https://github.com/ivomiyashiro/ivos-skills.git
codex plugin add ivos-skills@ivos-skills
```

### Antigravity CLI

Para actualizar el plugin a la ultima version, reinstalalo ejecutando:
```bash
agy plugin uninstall ivos-skills
agy plugin install https://github.com/ivomiyashiro/ivos-skills.git
```

### Skills CLI

```bash
# Actualizar todas las skills globales
npx skills update -g

# Actualizar solo ivos-skills
npx skills update ivos-skills -g

# Verificar si hay actualizaciones
npx skills check
```

### Versionado

Para mantener una version especifica y no recibir actualizaciones automaticas, pinnala con un tag o commit:

```json
{
  "plugin": ["ivos-skills@git+https://github.com/ivomiyashiro/ivos-skills.git#v1.0.0"]
}
```

## Estructura

Cada skill sigue la convencion estandar:
```
skills/
  nombre-skill/
    SKILL.md              # Documentacion principal (requerido)
    archivos-adicionales  # Scripts, templates, referencias (opcional)
```

## Requisitos

- [Node.js](https://nodejs.org/) (para usar `npx skills` o el plugin de OpenCode)
- Un agente compatible con el ecosistema de skills (Codex, OpenCode, Claude Code, etc.)

## Licencia

Las skills de terceros mantienen sus licencias originales. Consulta los archivos `LICENSE` o metadatos dentro de cada directorio de skill.
