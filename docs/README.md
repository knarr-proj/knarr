# knarr documentation

**knarr** is a YAML 1.2 language for transforming **any YAML**. You write valid YAML with local tags (`!bind`, `!emit`, `!ref`, …). Bindings use `$Name`. Output is a multi-document YAML stream of whatever documents you emit.

Kubernetes manifests are a common use, not a limit of the language.

> The CLI contract is `knarr render <file> [-o out] [--trace]`. There is no `-f` / `--set` overlay: values live in files (`!bind`, `!read`, `!import`).

## Start here

| Document | What it is |
|----------|------------|
| [Getting Started](getting-started.md) | Smallest working chart: values → Deployment + Service |
| [Tips and Tricks](tips-and-tricks.md) | Patterns you will use on every chart, with links into the guide |
| [General Conventions](best-practices/general-conventions.md) | Naming, `$` keys, omit, tags, what never to do |

## Language guide

Each construct page has a **Comparison with Helm** section at the bottom. A pair is either the **same result** (any real difference — quotes, key order — belongs in Difference) or knarr **cannot** do it (say so; do not invent a knarr sample). Prefer more exact matches and more explicit impossibilities.

Purpose is **one sentence**. The construct page is the source of truth; this table does not copy examples.

### Documents

| Construct | Purpose | Guide |
|-----------|---------|-------|
| `!bind` | Name values; never appears in stdout | [bind](guide/bind.md) |
| `!emit` | One output document | [emit](guide/emit.md) |
| `!emit-foreach` | One output document per item | [emit-foreach](guide/emit-foreach.md) |
| `!import` | Splice knarr documents from another file | [import](guide/import.md) |
| `!policy` | Schema-only policy for `!$Type` | [policy](guide/policy.md) |
| `!typedef` / `!$Type` | Declare a type; instantiate a bind | [typedef](guide/typedef.md) |
| `!validation` | Fail or warn after the bind graph | [validation](guide/validation.md) |

### Control flow

| Construct | Purpose | Guide |
|-----------|---------|-------|
| `$when` | Keep or skip one `!emit` / `!emit-foreach` | [when](guide/when.md) |
| `!foreach` | Build a sequence field | [foreach](guide/foreach.md) |
| `!match` | If/else as a value | [match](guide/match.md) |
| Omit (`?:`, `?.`, `??`) | Written absence (hub; tag pages link here) | [omit](guide/omit.md) |

### Access and expressions

| Construct | Purpose | Guide |
|-----------|---------|-------|
| `!ref` | Field access: path, `?.`, one `??` | [ref](guide/ref.md) |
| `!expr` | Compute: operators, dyn-index, `$` in list/map | [expr](guide/expr.md) |
| `!not` | Invert a bool path | [not](guide/not.md) |
| `!read` | Load one local YAML document as a value | [read](guide/read.md) |
| `!pick` | First non-omit of N candidates | [pick](guide/pick.md) |

### Bind-only transforms

These tags are **only** allowed as the value of `$Name:` (or `$Name?:` where noted) inside `!bind`. Use `!ref` in the manifest. `!join` may take `$prefix` / `$suffix` (non-empty strings, like `$sep`). `!join` / `!foreach` may be `$Name?:` when `$over` is omit-capable; `!foreach` also when `$yield?:` is used (empty result omits the bind; `?? []` on that `$over` is then allowed); `!split` / `!sha256` when `$of` is omit-capable; `!concat` / `!format` when a child is omit-capable; `!merge` when **every** child is omit-capable; `!range` when `$from` / `$to` / `$until` can omit. `!pick` is always a value (`$Name?: !pick` is an error).

| Construct | Purpose | Guide |
|-----------|---------|-------|
| `!concat` | Concatenate sequences | [concat](guide/concat.md) |
| `!join` | Join strings with `$sep` | [join](guide/join.md) |
| `!split` | Split a string into a sequence | [split](guide/split.md) |
| `!format` | Go `fmt` string from operands | [format](guide/format.md) |
| `!range` | Integer sequence `$from`…`$to`/`$until` | [range](guide/range.md) |
| `!merge` | Deep-merge mappings, later wins | [merge](guide/merge.md) |
| `!sha256` | Hex SHA-256 of a string | [sha256](guide/sha256.md) |

### Strings, JSON, and hashing

| Construct | Purpose | Guide |
|-----------|---------|-------|
| `!b64enc` | Base64-encode a string | [b64enc](guide/b64enc.md) |
| `!b64dec` | Base64-decode a string | [b64dec](guide/b64dec.md) |
| `!len` | Length of seq / map / string bytes | [len](guide/len.md) |
| `!to-json-str` | JSON string (Helm `toJson` canon) | [to-json-str](guide/to-json-str.md) |
| `!from-json-str` | Parse a JSON string | [from-json-str](guide/from-json-str.md) |
| `!sha256-json` | SHA-256 of Helm `toJson` | [sha256-json](guide/sha256-json.md) |

### Predicates and coercion

| Construct | Purpose | Guide |
|-----------|---------|-------|
| `!empty` | True if omit / empty / false / 0 | [empty](guide/empty.md) |
| `!not-empty` | Inverse of `!empty` | [not-empty](guide/not-empty.md) |
| `!and` | All predicates true | [and](guide/and.md) |
| `!or` | Any predicate true | [or](guide/or.md) |
| `!int` | Coerce to int | [int](guide/int.md) |
| `!str` | Coerce to string | [str](guide/str.md) |
| `!bool` | Coerce to bool | [bool](guide/bool.md) |
| `!float` | Coerce to float | [float](guide/float.md) |

## Best practices

- [General Conventions](best-practices/general-conventions.md)
