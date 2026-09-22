# General Conventions

These rules apply to every knarr file. This page is the checklist for authors.

## Files and documents

- The program is **YAML 1.2**, multiple documents separated by `---`. Guide examples with two document tags (`!bind` then `!emit`, …) must show that `---` too.
- Tagged scalars (`!ref`, `!expr`, `!not`, coerce) quote as YAML 1.2: `[` `{` `]` `}` `,`, `: ` (colon+space), and ` #` need quotes **anywhere**, not only at line start. `/` and `?? false` / `||` do not. A parser that accepts `?? [80, 443]` unquoted is not the knarr rule: knarr still rejects it. A planned negative golden covers that.
- Every document has a **local tag**: `!bind`, `!emit`, `!emit?`, `!emit-foreach`, `!emit-range`, `!import`, `!validation`, or prelude `!policy` / `!typedef`.
- After `!import` flattening, order is: optional `!policy` (must be first), optional `!typedef`, then `!bind` / `!validation` / `!emit` / `!emit?` / `!emit-foreach` / `!emit-range` mixed.
- **No anchors** (`&`, `*`, `<<`) in knarr documents. Data files loaded with [`!read`](../guide/read.md) may use them; knarr sees the expanded tree.
- **No `!!` tags** in knarr documents (`!!str`, `!!int`, `!!null` included). Core YAML tags are allowed **inside** a `!read` file.
- **No null value.** YAML/JSON `a: null` / `a: ~` / `a:` ≡ **the key is absent** (omit). Stdout never prints `null`. Helm `a: null` in a Comparison is the same as knarr without `a`. A sequence item `null` is an error.

## Names

| Kind | Form | Examples |
|------|------|----------|
| Your bindings | `$` + Capital | `$Values`, `$AppName`, `$Worker` |
| Language keys | `$` + lowercase word | `$when`, `$over`, `$yield`, `$sep` |
| Type tag | `!$` + BindingName | `$Values: !$ValuesType` |

- Bare `when:`, `over:`, `sep:`, `of:` on knarr meta mappings is an **error**, not a synonym.
- Keys in `!emit` / `$yield` stay unprefixed. They are ordinary YAML keys of your schema (`apiVersion:`, `services:`, `metadata:`, …), not knarr `$` keys.
- **`$Release`**, **`$Chart`**, **`$Capabilities`** are reserved. Do not bind or reference them in v1.

## One tag per node

```yaml
# $Values = {port: 8080}
# Wrong
port: !int !expr "$Values.port"
$when: !not !is-empty $Values.x?
# error: one tag per node
# Right
$Port: !int $Values.port
port: !ref $Port  # port: 8080
$when: !is-not-empty $Values.x?
```

[`!not`](../guide/not.md) takes a path scalar, not another tagged node.

## Bind vs emit

- **Compute in the field or in `!bind`.** `!format` / `!concat` / `!join` / `!split` / `!merge` / `!sha256` are values.
- **Print with `!ref` or a value tag.** Manifest fields hold paths, `!match`, `!foreach`, `!range`, combine tags, literals, or omit.
- Forward references between `$Name`s are allowed. Cycles are errors. A bind is **atomic**: `$A.y` cannot see `$A.x`.

## Explicit omit

knarr never drops a key because a value “looks empty”.

| Intent | Write |
|--------|--------|
| Field may vanish | `affinity?: !ref $Values.affinity?` |
| Field always present, default | `host: !ref "$Values.tls?.host ?? 'localhost'"` |
| N candidates | [`!pick`](../guide/pick.md) — not `\|\|` in [`!expr`](../guide/expr.md) |

Both markers are required for omit: key `?:` **and** an omit-capable value (`$Values.tls?` / `$Name?`). See **Omit** on [`!bind`](../guide/bind.md) and [`!ref`](../guide/ref.md).

Optional mappings: every child key uses `?:` if and only if the parent does. An optional mapping that evaluates to `{}` is omitted (no `spec: {}`). An empty list `[]` stays, except [`!foreach`](../guide/foreach.md) on a `?:` key with `$yield?:` and nothing to print. To drop other empty lists, [`!skip-empty`](../guide/skip-empty.md) on a `?:` key.

## Expressions

- [`!expr`](../guide/expr.md) is a knarr grammar (CEL-shaped tokens, not the CEL spec).
- **No function calls:** `len()`, `printf()`, `size()`, `has()` are parse errors.
- One `??` defaults a whole [`!ref`](../guide/ref.md) or whole `!expr` that computes. A bare path or constant in `!expr` is an error.
- String glue is [`!format`](../guide/format.md) or [`!join`](../guide/join.md), not `+`.
- `+` on two ints is addition; if either side is float, both become float.
- List/map literals in `!expr` need `$Name` or an operator: `[80, $Port]`, `{'app': $Values.name}` — not YAML `{app: 1}`. A constant `[80, 443]` is a YAML list.

## Types

Scalar sorts: `string`, `int`, `bool`, `float` (IEEE f64). YAML `1` is int; `0.5` / `1.0` is float. `.nan` / `.inf` are errors.

Coerce with tags, not YAML `!!int` and not functions inside `!expr`: [`!int`](../guide/int.md), [`!str`](../guide/str.md), [`!bool`](../guide/bool.md), [`!float`](../guide/float.md).

Kubernetes quantities like `"500m"` stay **strings**.

## Output

- Key order in a mapping is **source order**, not sorted (JSON checksums are the exception: sorted keys, Go `json.Marshal` canon).
- Stdout is YAML 1.2, UTF-8, LF, 2-space block style.
- Zero manifests (all `!emit?` with false `$when`, all `$else-yield: ""`, empty loops, false `$when` on `!emit-foreach`) → empty stdout, exit 0.

## Helm comparison in the guide

Construct pages compare Helm only when the **result matches**, or they state **impossible** with no fake knarr snippet. “Almost the same” is not a row.

Helm `required` that fails **aborts**: no stdout, stderr only. In a pair that is [`!validation`](../guide/validation.md) (`$fail` + `!is-not-empty` on the same path). A successful `required` still prints in Helm; knarr prints with `!emit` / `!ref`, not with `!validation` alone. Every Helm `required` in a Comparison row has a knarr `!validation`.

Helm **`| default`** (empty → fallback) is [`!match`](../guide/match.md) with [`!is-empty`](../guide/is-empty.md), not `??` / [`!pick`](../guide/pick.md) (those fill omit only).

## Habits to drop

| Don't | Do |
|--------|-----|
| `{{ }}` in YAML text | Tags on YAML nodes |
| CLI value overlays | Files only |
| Nested “with” scope | `field?: !ref $X.obj?` |
| Snippet macros | Not in v1; split files with [`!import`](../guide/import.md) (documents, not values) |
| Dump a mapping as YAML text | Emit the mapping, or JSON via [`!to-json-str`](../guide/to-json-str.md) |
| `a: null` as a value | The key is absent; emit with `?:` when the path may omit |
