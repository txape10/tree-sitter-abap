# CLAUDE.md — Repo 8: tree-sitter-abap (fork del parser)

Ruta: `C:\Users\rchapado\Proyectos Claude\8 - tree-sitter-abap\`

Léelo entero antes de actuar.

## Principios Karpathy (marco general, aplica a TODO el trabajo)

1. **Think Before Coding** — No asumir, preguntar ante ambigüedad, exponer tradeoffs, parar y nombrar
   lo confuso.
2. **Simplicity First** — Mínimo necesario, nada especulativo.
3. **Surgical Changes** — Tocar solo lo imprescindible; respetar lo existente; no refactorizar lo que
   no está roto.
4. **Goal-Driven Execution** — Criterios de éxito verificables; loop hasta cumplirlos.

Equilibrio: cautela sobre velocidad; tareas triviales con juicio.

## Estructura física del conjunto (tres repos)

```
C:\Users\rchapado\Proyectos Claude\
  6 - Parser ABAP + integración en Graphify\   ← fork de graphify (consume ESTE parser)
  7 - ZCode+grafos\                             ← datos y grafos
  8 - tree-sitter-abap\                         ← ESTE repo (fork del parser ABAP)
```

## Qué es este repo

Fork de `kennyhml/tree-sitter-abap` — la gramática tree-sitter de ABAP. Es la base del soporte ABAP
que el repo 6 enchufa a Graphify. **Este repo solo se toca si hay que extender la gramática** para
cubrir construcciones (normalmente legacy) que el parser original no soporta.

- Upstream: https://github.com/kennyhml/tree-sitter-abap
- Tu fork: https://github.com/txape10/tree-sitter-abap
- Vive en GitHub (fork público). Es código de gramática, no contiene nada propietario.

## Cuándo se trabaja aquí

La mayoría del tiempo, NO. El flujo normal usa este parser tal cual. Solo se entra aquí si la Fase 2
del repo 6 (validar cobertura del parser contra tu corpus) revela construcciones ABAP que generan
nodos `ERROR` y se decide (en la Fase 3 del repo 6) extender la gramática en vez de ignorar o
preprocesar.

## Naturaleza del repo — IMPORTANTE

- La gramática se escribe en `grammar/` (modular) y `grammar.js`; tree-sitter **genera** el parser en
  C a partir de ella (`tree-sitter generate`). No se edita el C generado a mano.
- Es un paquete con **extensión C compilada**. Cambiar la gramática implica: editar la gramática →
  `tree-sitter generate` → recompilar → reinstalar en el repo 6 (editable). Ver el mini-plan.
- En Windows la compilación necesita toolchain de C disponible. Si falla por falta de compilador, es
  un problema de entorno, no de la gramática.

## Reglas de trabajo

1. **No reescribir la gramática; extenderla quirúrgicamente** (Surgical Changes). Añadir reglas para
   las construcciones concretas que fallan, sin tocar las que ya funcionan.
2. **Regla de oro de cobertura:** preferir un parser permisivo (que acepte código raro/antiguo) a uno
   estricto que falle. NUNCA eliminar reglas existentes "porque ya no se usan" — el mantenimiento del
   código legacy de Roberto depende de ellas.
3. **Cada extensión, su test de regresión.** Añadir el fragmento ABAP que fallaba como caso de prueba
   (`test/corpus/`) para que no vuelva a romperse.
4. **No tocar el C generado** ni la infraestructura de bindings salvo necesidad real y explicada.
5. **Coordinación con el repo 6:** tras regenerar, hay que recompilar y reinstalar en editable en el
   repo 6 para que los cambios surtan efecto allí. No se da por hecho que el repo 6 ve los cambios
   automáticamente.

## Definición de "hecho" (Goal-Driven Execution)

- La construcción ABAP que antes daba `ERROR` ahora parsea con nodos correctos.
- `tree-sitter generate` y la suite de tests (`tree-sitter test`) pasan, incluido el nuevo caso de
  regresión.
- Ninguna regla preexistente se ha eliminado ni roto (verificar que los tests previos siguen verdes).
- El repo 6, tras recompilar/reinstalar, parsea el corpus sin el ERROR que motivó el cambio.

## Cobertura actual (2026-06-14)

Construcciones añadidas en el fork txape10 respecto al upstream:

| Construcción | Nodo AST |
|---|---|
| `FUNCTION-POOL` | `function_pool_statement` |
| `FUNCTION / ENDFUNCTION` (con IMPORTING/EXPORTING/CHANGING/TABLES/RAISING/EXCEPTIONS) | `function_definition` |
| `SUBMIT` (AND RETURN, VIA SELECTION-SCREEN, WITH, USING SELECTION-SET, dinámico) | `submit_statement` |
| `RAISE EVENT` | `raise_event_statement` |
| `SET HANDLER` (FOR obj, FOR ALL INSTANCES, ACTIVATION, múltiples handlers) | `set_handler_statement` |
| `EVENTS` / `CLASS-EVENTS` (declaración con EXPORTING) | `events_declaration`, `class_events_declaration` |
| `GET BADI` (TYPE, FILTERS) | `get_badi_statement` |
| `CALL BADI` (con lista de parámetros completa) | `call_badi_statement` |

Fix adicional: compatibilidad Node.js v24+ (`Dirent.parentPath` vs `Dirent.path`) en `grammar.js`.

## Compilar y reinstalar el binding Python (Windows)

Tras cualquier cambio de gramática (`tree-sitter generate` → nuevo `src/parser.c`) hay que
recompilar la extensión C. El paquete está instalado en editable desde este repo, así que repo 6
ve el cambio inmediatamente sin reinstalar.

**Prerequisitos (una sola vez):**
```
pip install setuptools wheel
```

**Compilación (cada vez que cambie la gramática):**
```powershell
$pyexe = "C:\Users\rchapado\AppData\Local\Programs\Python\Python313\python.exe"
$vswhere = "C:\Program Files (x86)\Microsoft Visual Studio\Installer"
& cmd.exe /c "set PATH=%PATH%;$vswhere && `"C:\Program Files (x86)\Microsoft Visual Studio\18\BuildTools\VC\Auxiliary\Build\vcvarsall.bat`" x64 && set DISTUTILS_USE_SDK=1 && set MSSdk=1 && cd `"C:\Users\rchapado\Proyectos Claude\8 - tree-sitter-abap`" && `"$pyexe`" setup.py build_ext --inplace"
```

El `.pyd` se copia automáticamente a `bindings/python/tree_sitter_abap/_binding.pyd`.

**Verificación rápida:**
```python
import tree_sitter_abap as abap
from tree_sitter import Language, Parser
p = Parser(Language(abap.language()))
assert not p.parse(b"FUNCTION-POOL zfugr.").root_node.has_error
```

> `DISTUTILS_USE_SDK=1` + `vswhere` en PATH son necesarios porque `setuptools` lanza `cl.exe`
> en un subproceso que no hereda el entorno de `vcvarsall.bat`.

## Estilo

Consistente con la gramática existente del upstream. Commits: `feat:`/`fix:`/`docs:`. Mantener la
posibilidad de rebase contra el upstream de kennyhml (no divergir más de lo necesario).
