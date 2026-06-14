# tree-sitter-abap
**ABAP grammar for [Tree-sitter](https://github.com/tree-sitter/tree-sitter)**, based on the [official ABAP keyword documentation](https://help.sap.com/doc/abapdocu_latest_index_htm/latest).

> [!NOTE]  
> This grammar is designed to parse a **superset** of valid ABAP syntax. Its goal is to produce a concrete syntax tree (CST) suitable 
> for code analysis and syntax highlighting, without over-restricting the grammar to perfectly valid ABAP forms.  
>
> In other words, it is intentionally **permissive**.

## Limitations
ABAP is a very unique language in many ways and, likely due to its long history, is often very difficult to parse.
### Ambiguity
Consider the following expression:
```abap
new bar( 'Hello World' )
```
It's impossible to know whether the constructor of the class `bar` is being invoked or if a char-like anonymous data object is being created.
This could only be determined by having context of the codebase and knowing the concrete type of `bar`. For this reason, the parser outputs a fairly
generic `argument_list`. If further detail is required, a semantic analysis is needed (with access to things such as the DDIC).

### Keyword chaining
You're likely aware that you can chain e.g data object declarations:
```abap
data: foo type i, bar type string, baz type zmytab.
```
This is easily supported. However, chaining is far more dynamic than many are aware of.
The following statement:
```abap
replace all occurrences of foo in bar with ''.
replace all occurrences of foo in baz with ''.
```
Can also be expressed, without changing the effects, as **any** of these variation:
```abap
replace all occurrences of foo in: bar with '', baz with ''.
replace all occurrences of foo: in bar with '', in baz with ''.
replace all occurrences: of foo in bar with '', of foo in baz with ''.
replace all: occurrences of foo in bar with '', occurrences of foo in baz with ''.
replace: all occurrences of foo in bar with '', all occurrences of foo in baz with ''.
```
You get the gist, ABAP effectively yanks everything before the `:` and inserts it before each comma seperated section after it.
Needless to say, this isnt only annoying to parse but practically impossible, as
- All the possible variations, even if the permutations are generated, would massively blow up the parsers internal state count
- You can no longer assign nodes in the resulting CST a meaningful grouping, as context may be split.
- Due to the unclear grouping of tokens, its not feasible to preprocess the code to make parsing easier.

As a result, the grammar makes an effort to support chained statements where they often times used. For example, when declaring
a structure type or defining dynpro parameters. Excessively using this "quirk" has been discouraged for a long time and tools 
such as the official ABAP Formatter provide the ability to transform such statements into their longform (and proper) variant.

## Grammar Coverage

The following table summarises what the grammar currently recognises. Items marked ✅ produce named nodes suitable for graph analysis (edges between program entities); items marked 🔲 are not yet implemented.

### Program structure

| Construct | Status | Node |
|---|---|---|
| `REPORT` / `PROGRAM` | ✅ | `report_statement` |
| `FUNCTION-POOL` | ✅ | `function_pool_statement` |
| `FUNCTION` / `ENDFUNCTION` | ✅ | `function_definition` |
| `FORM` / `ENDFORM` | ✅ | `form_definition` |
| `INCLUDE` | ✅ | `include_statement` |
| `TABLES` | ✅ | `tables_declaration` |
| `INITIALIZATION` / `START-OF-SELECTION` / `LOAD-OF-PROGRAM` | ✅ | event blocks |

### Calls & cross-program flow

| Construct | Status | Node | Graph edge |
|---|---|---|---|
| `CALL FUNCTION` (local, RFC, aRFC, bgRFC) | ✅ | `call_function_statement` | program → FM |
| `CALL METHOD` (explicit form) | ✅ | `call_method_statement` | — |
| `obj->meth( )` / `Class=>meth( )` | ✅ | `method_call` | program → method |
| `PERFORM` / `PERFORM ... IN PROGRAM` | ✅ | `perform_statement` | program → FORM (cross-program) |
| `SUBMIT` | ✅ | `submit_statement` | program → program |
| `CALL BADI` | ✅ | `call_badi_statement` | program → BADI method |
| `GET BADI` | ✅ | `get_badi_statement` | program → BADI instance |
| `CALL TRANSACTION` | 🔲 | — | program → tcode |

### Object-oriented

| Construct | Status | Node |
|---|---|---|
| `CLASS DEFINITION` / `IMPLEMENTATION` | ✅ | `class_definition`, `class_implementation` |
| `INHERITING FROM` | ✅ | `superclass_spec` (inside `class_definition`) |
| `INTERFACES` (implements) | ✅ | `interfaces_declaration` |
| `INTERFACE` / `ENDINTERFACE` | ✅ | `interface_definition` |
| `METHODS` / `CLASS-METHODS` | ✅ | `methods_declaration`, `class_methods_declaration` |
| `METHOD` / `ENDMETHOD` | ✅ | `method_implementation` |
| `EVENTS` / `CLASS-EVENTS` | ✅ | `events_declaration`, `class_events_declaration` |
| `RAISE EVENT` | ✅ | `raise_event_statement` |
| `SET HANDLER` | ✅ | `set_handler_statement` |
| `RAISE EXCEPTION TYPE` | ✅ | `raise_exception_statement` |
| `CAST #( )` | ✅ | `cast_expression` |
| `NEW` / `VALUE` / `COND` / `SWITCH` / `REDUCE` / `FILTER` | ✅ | constructor expressions |

### Declarations & types

| Construct | Status |
|---|---|
| `DATA` / `CLASS-DATA` / `TYPES` / `CONSTANTS` | ✅ |
| `TYPE REF TO` / `LIKE REF TO` | ✅ |
| `FIELD-SYMBOLS` | ✅ |
| `INCLUDE TYPE` / `INCLUDE STRUCTURE` | ✅ |
| Standard / sorted / hashed table types | ✅ |

### Dynpro / selection screen

| Construct | Status |
|---|---|
| `PARAMETERS` / `SELECT-OPTIONS` | ✅ |
| `SELECTION-SCREEN` | ✅ |
| `AT SELECTION-SCREEN` / `CALL SELECTION-SCREEN` | ✅ |

### Processing statements

All common processing statements are supported: `LOOP AT`, `IF`, `CASE`, `DO`, `WHILE`, `TRY/CATCH`, `READ TABLE`, `APPEND`, `INSERT`, `DELETE`, `SORT`, `FIND`, `REPLACE`, `SPLIT`, `CONCATENATE`, `SHIFT`, `CONDENSE`, string templates, messages, `COMMIT WORK`, `ROLLBACK WORK`.

## Obsolete Language Elements
Many obsolete language elements, as specified in the official ABAP documentation, are currently out of scope and will not be supported.
Some language elements that are still commonly found in On Premise / Private Cloud Systems may be supported despite officially marked as obsolete - 
for example the addition `IN BACKGROUND TASK` of a function call, or subroutines (`FORM`/`PERFORM`).

## Design
### Project Layout
As ABAP contains an excessively large number of syntax variants to cover, parts of the grammar are split apart into their own sub-directories
within the `grammar/` folder and later consolidated into the main `grammar.js`. This allows for cohesive grouping of language features, such
as Dynpro-, ABAP OO-, or ABAP SQL Elements.

## Why tree-sitter?
Tree-sitter performs **incremental parsing**, making it ideal for working with large or legacy ABAP codebases that often span thousands of lines in a single report. The resulting 
parser is compiled to **native C**, enabling significantly better performance than typical regex-based parsers (such as TextMate).

