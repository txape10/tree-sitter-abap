# Mini-plan — Repo 8: tree-sitter-abap (fork del parser)

Ruta: `C:\Users\rchapado\Proyectos Claude\8 - tree-sitter-abap\`

**Objetivo:** mantener un fork del parser ABAP que, si hace falta, se extienda para cubrir
construcciones (legacy) que el original no parsea. La mayoría del tiempo este repo está quieto.

> Aplican los principios Karpathy del CLAUDE.md. Este repo es secundario: solo se activa si la Fase 3
> del repo 6 decide "extender la gramática".

---

## Estado actual — Fase 1 completada ✅

**Gramática:** 2026-06-14 · **Binding recompilado y verificado en repo 6:** 2026-06-15

Se han añadido 5 nuevas construcciones al parser, motivadas por el análisis del repo 7 sobre
los edges de más impacto para el grafo de código. Tests: 418 passing, 0 regresiones.
`_binding.pyd` recompilado con MSVC 14.51 (VS BuildTools 18); repo 6 confirma los 6 nodos nuevos sin ERROR.

### Construcciones añadidas en esta iteración

| Construcción | Archivo | Nodo AST | Edge para el grafo |
|---|---|---|---|
| `FUNCTION-POOL name.` | `grammar/program/function_pool_statement.js` | `function_pool_statement` | identifica el grupo de funciones |
| `FUNCTION name. ... ENDFUNCTION.` | `grammar/program_units/function_definition.js` | `function_definition` | identifica FMs dentro del grupo |
| `SUBMIT prog [AND RETURN] [WITH ...]` | `grammar/program/submit_statement.js` | `submit_statement` | programa → programa |
| `RAISE EVENT` / `SET HANDLER` / `EVENTS` | `grammar/oo/events.js` | `raise_event_statement`, `set_handler_statement`, `events_declaration` | edges por eventos OO |
| `GET BADI` / `CALL BADI` | `grammar/program_units/calling/call_badi.js` | `get_badi_statement`, `call_badi_statement` | programa → extensión BADI |

### Fix incluido

- Compatibilidad con Node.js v24: `f.path` → `f.parentPath || f.path` en `grammar.js` (el
  campo `Dirent.path` fue renombrado a `parentPath` en Node.js v22+).

---

## Pendiente — construcciones no cubiertas

| Construcción | Prioridad | Motivo |
|---|---|---|
| `CALL TRANSACTION tcode` | Media | Edge programa → tcode, pero el nombre de tcode no siempre es estático |
| `DEFINE ... END-OF-DEFINITION` (macros) | Baja | Difíciles de resolver estáticamente, poco beneficio para el grafo |
| Dynamic dispatch `(cls)=>(meth)` | Baja | Imposible resolver estáticamente; identificar el patrón sin generar falsos stubs |

---

## Fase 0 — Crear el fork y clonarlo ✅ (completado)

1. Fork de `kennyhml/tree-sitter-abap` → txape10, en el navegador.
2. Clonar como la carpeta 8:
   ```bash
   git clone https://github.com/txape10/tree-sitter-abap.git "8 - tree-sitter-abap"
   ```
3. Verificar el toolchain: `tree-sitter --version`, y un compilador de C disponible (en Windows, el
   Build Tools de Visual C++ o equivalente).

---

## Fase 1 — Extender la gramática ✅ (completada el 2026-06-14)

Disparador: análisis del repo 7 reveló 5 categorías de construcciones ABAP de alto impacto para
el grafo que no estaban cubiertas.

### Procedimiento estándar (para futuras extensiones)

1. Tomar el/los fragmento(s) ABAP que fallan (vienen del corpus del repo 6).
2. Añadirlos primero como caso de test en `test/corpus/` (deben fallar → rojo).
3. Extender la gramática (`grammar/`, `grammar.js`) con reglas para esa construcción, usando `prec()`
   para resolver ambigüedades sin descartar variantes antiguas.
4. `tree-sitter generate` y `tree-sitter test` hasta que el nuevo caso pase y los previos sigan verdes.
5. Recompilar y reinstalar en editable en el repo 6; reparsear el corpus allí para confirmar que el
   ERROR desapareció.

> **PROMPT para extensión de gramática:**
> "El repo 6 reporta que esta construcción ABAP da nodos ERROR: [pegar fragmento]. Añádela primero
> como caso de test en test/corpus/, luego extiende la gramática (grammar/, grammar.js) para
> parsearla, usando prec() para ambigüedades y SIN eliminar ni romper reglas existentes. Ejecuta
> tree-sitter generate y tree-sitter test hasta que el nuevo caso pase y los anteriores sigan verdes.
> Recuérdame al final los pasos para recompilar y reinstalar en el repo 6."

---

## Fase 2 — Mantenimiento

- Cada construcción nueva que falle en el futuro: mismo ciclo (test de regresión primero, luego regla).
- Si SAP saca sintaxis nueva: igual.
- Rebase ocasional contra el upstream de kennyhml para no divergir de más, conservando las extensiones.

---

## Recordatorios clave

- **Permisivo > estricto.** Nunca quitar reglas "porque ya no se usan".
- **Test de regresión siempre.** Si no hay test, el cambio no está hecho.
- **Los cambios no llegan solos al repo 6:** recompilar con el comando documentado en `CLAUDE.md` (sección "Compilar y reinstalar el binding Python").
- En Windows, la compilación necesita `DISTUTILS_USE_SDK=1` + `vswhere` en PATH; el comando exacto está en `CLAUDE.md`.
- **Node.js v24+:** `Dirent.path` fue renombrado a `parentPath` — ya corregido en `grammar.js`.
