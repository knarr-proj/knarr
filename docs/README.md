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

Each construct page has a **Comparison with Helm** section at the bottom.

### Documents

| Construct | Guide |
|-----------|-------|
| `!bind` | [bind](guide/bind.md) |
| `!emit` | [emit](guide/emit.md) |
| `!emit-foreach` | [emit-foreach](guide/emit-foreach.md) |
| `!import` | [import](guide/import.md) |
| `!policy` | [policy](guide/policy.md) |
| `!typedef` / `!$Type` | [typedef](guide/typedef.md) |
| `!validation` | [validation](guide/validation.md) |

### Control flow

| Construct | Guide |
|-----------|-------|
| `$when` | [when](guide/when.md) |
| `!foreach` | [foreach](guide/foreach.md) |
| `!match` | [match](guide/match.md) |
| Omit (`?:`, `?.`, `??`) | [omit](guide/omit.md) |

### Access and expressions

| Construct | Guide |
|-----------|-------|
| `!ref` | [ref](guide/ref.md) — path, `?.`, one `??` |
| `!expr` | [expr](guide/expr.md) — operators / dyn-index / literals; `??` on the whole formula |
| `!not` | [not](guide/not.md) |
| `!read` | [read](guide/read.md) |
| `!pick` | [pick](guide/pick.md) |

### Bind-only transforms

These tags are **only** allowed as the value of `$Name:` (or `$Name?:` where noted) inside `!bind`. Use `!ref` in the manifest.

| Construct | Guide |
|-----------|-------|
| `!concat` | [concat](guide/concat.md) |
| `!join` | [join](guide/join.md) |
| `!split` | [split](guide/split.md) |
| `!format` | [format](guide/format.md) |
| `!range` | [range](guide/range.md) |
| `!merge` | [merge](guide/merge.md) |
| `!sha256` | [sha256](guide/sha256.md) |

### Strings, JSON, and hashing

| Construct | Guide |
|-----------|-------|
| `!b64enc` | [b64enc](guide/b64enc.md) |
| `!b64dec` | [b64dec](guide/b64dec.md) |
| `!len` | [len](guide/len.md) |
| `!to-json-str` | [to-json-str](guide/to-json-str.md) |
| `!from-json-str` | [from-json-str](guide/from-json-str.md) |
| `!sha256-json` | [sha256-json](guide/sha256-json.md) |

### Predicates and coercion

| Construct | Guide |
|-----------|-------|
| `!empty` | [empty](guide/empty.md) |
| `!not-empty` | [not-empty](guide/not-empty.md) |
| `!and` | [and](guide/and.md) |
| `!or` | [or](guide/or.md) |
| `!int` | [int](guide/int.md) |
| `!str` | [str](guide/str.md) |
| `!bool` | [bool](guide/bool.md) |
| `!float` | [float](guide/float.md) |

## Best practices

- [General Conventions](best-practices/general-conventions.md)
