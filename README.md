# ivos-skills

Coleccion personal de skills para agentes de IA (OpenCode, Claude Code, Copilot CLI, Gemini CLI, etc.).

## Instalacion

La instalacion varia segun el agente que uses. Si usas mas de uno, instala ivos-skills por separado en cada uno.

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
| `brainstorming` | Use when starting any creative work, creating features, building components, adding functionality, or modifying behavior |
| `clean-code` | Write readable, maintainable code through disciplined naming, small functions, and clean error handling |
| `dispatching-parallel-agents` | Use when facing 2+ independent tasks that can be worked on without shared state or sequential dependencies |
| `executing-plans` | Use when you have a written implementation plan to execute in a separate session with review checkpoints |
| `find-skills` | Helps users discover and install agent skills when they ask questions like "how do I do X" |
| `finishing-a-development-branch` | Use when implementation is complete, all tests pass, and you need to decide how to integrate the work |
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
| `frontend-design` | Create distinctive, production-grade frontend interfaces with high design quality |
| `hono-bun-api` | Construir APIs TypeScript opinadas con Hono + Bun siguiendo vertical slice, CQRS lite, Result pattern, Zod |
| `react-best-practices` | React and Next.js performance optimization guidelines from Vercel Engineering |
| `receiving-code-review` | Use when receiving code review feedback, before implementing suggestions |
| `requesting-code-review` | Use when completing tasks, implementing major features, or before merging to verify work meets requirements |
| `subagent-driven-development` | Use when executing implementation plans with independent tasks in the current session |
| `systematic-debugging` | Use when encountering any bug, test failure, or unexpected behavior, before proposing fixes |
| `test-driven-development` | Use when implementing any feature or bugfix, before writing implementation code |
| `using-git-worktrees` | Use when starting feature work that needs isolation from current workspace or before executing implementation plans |
| `using-superpowers` | Use when starting any conversation - establishes how to find and use skills |
| `verification-before-completion` | Use when about to claim work is complete, fixed, or passing, before committing or creating PRs |
| `writing-plans` | Use when you have a spec or requirements for a multi-step task, before touching code |
| `writing-skills` | Use when creating new skills, editing existing skills, or verifying skills work before deployment |

## Mantener actualizado

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
- Un agente compatible con el ecosistema de skills (OpenCode, Claude Code, etc.)

## Licencia

Las skills de terceros mantienen sus licencias originales. Consulta los archivos `LICENSE` o metadatos dentro de cada directorio de skill.
