# knarr documentation

**knarr** is a YAML 1.2 language for transforming **any YAML**. You write valid YAML with local tags (`!bind`, `!emit`, `!ref`, …). Bindings use `$Name`. Output is a multi-document YAML stream of whatever documents you emit.

Kubernetes manifests are a common use. Helm is a useful comparison (`helm template` without install/upgrade/rollback), not a limit of the language.

> The CLI contract is `knarr render <file> [-o out] [--trace]`. There is no `-f` / `--set` overlay: values live in files (`!bind`, `!read`, `!import`).

## Start here

| Document | What it is |
|----------|------------|
| [Getting Started](getting-started.md) | Smallest working chart: values → Deployment + Service |
| [Tips and Tricks](tips-and-tricks.md) | Patterns you will use on every chart, with links into the guide |
| [General Conventions](best-practices/general-conventions.md) | Naming, `$` keys, omit, tags, what never to do |

## Language guide

Each construct has a **syntax page** and a **Helm comparison** (`*-vs-helm.md`).

### Documents

| Construct | Guide | vs Helm |
|-----------|-------|---------|
| `!bind` | [bind](guide/bind.md) | [Helm](guide/bind-vs-helm.md) |
| `!emit` | [emit](guide/emit.md) | [Helm](guide/emit-vs-helm.md) |
| `!emit-foreach` | [emit-foreach](guide/emit-foreach.md) | [Helm](guide/emit-foreach-vs-helm.md) |
| `!import` | [import](guide/import.md) | [Helm](guide/import-vs-helm.md) |
| `!policy` | [policy](guide/policy.md) | [Helm](guide/policy-vs-helm.md) |
| `!typedef` / `!$Type` | [typedef](guide/typedef.md) | [Helm](guide/typedef-vs-helm.md) |
| `!validation` | [validation](guide/validation.md) | [Helm](guide/validation-vs-helm.md) |

### Control flow

| Construct | Guide | vs Helm |
|-----------|-------|---------|
| `$when` | [when](guide/when.md) | [Helm](guide/when-vs-helm.md) |
| `!foreach` | [foreach](guide/foreach.md) | [Helm](guide/foreach-vs-helm.md) |
| `!match` | [match](guide/match.md) | [Helm](guide/match-vs-helm.md) |
| Omit (`?:`, `?.`, `??`) | [omit](guide/omit.md) | [Helm](guide/omit-vs-helm.md) |

### Access and expressions

| Construct | Guide | vs Helm |
|-----------|-------|---------|
| `!ref` | [ref](guide/ref.md) | [Helm](guide/ref-vs-helm.md) |
| `!expr` | [expr](guide/expr.md) | [Helm](guide/expr-vs-helm.md) |
| `!not` | [not](guide/not.md) | [Helm](guide/not-vs-helm.md) |
| `!read` | [read](guide/read.md) | [Helm](guide/read-vs-helm.md) |
| `!pick` | [pick](guide/pick.md) | [Helm](guide/pick-vs-helm.md) |

### Bind-only transforms

These tags are **only** allowed as the value of `$Name:` (or `$Name?:` where noted) inside `!bind`. Use `!ref` in the manifest.

| Construct | Guide | vs Helm |
|-----------|-------|---------|
| `!concat` | [concat](guide/concat.md) | [Helm](guide/concat-vs-helm.md) |
| `!join` | [join](guide/join.md) | [Helm](guide/join-vs-helm.md) |
| `!split` | [split](guide/split.md) | [Helm](guide/split-vs-helm.md) |
| `!format` | [format](guide/format.md) | [Helm](guide/format-vs-helm.md) |
| `!range` | [range](guide/range.md) | [Helm](guide/range-vs-helm.md) |
| `!merge` | [merge](guide/merge.md) | [Helm](guide/merge-vs-helm.md) |
| `!sha256` | [sha256](guide/sha256.md) | [Helm](guide/sha256-vs-helm.md) |

### Strings, JSON, and hashing

| Construct | Guide | vs Helm |
|-----------|-------|---------|
| `!b64enc` | [b64enc](guide/b64enc.md) | [Helm](guide/b64enc-vs-helm.md) |
| `!b64dec` | [b64dec](guide/b64dec.md) | [Helm](guide/b64dec-vs-helm.md) |
| `!len` | [len](guide/len.md) | [Helm](guide/len-vs-helm.md) |
| `!to-json-str` | [to-json-str](guide/to-json-str.md) | [Helm](guide/to-json-str-vs-helm.md) |
| `!from-json-str` | [from-json-str](guide/from-json-str.md) | [Helm](guide/from-json-str-vs-helm.md) |
| `!sha256-json` | [sha256-json](guide/sha256-json.md) | [Helm](guide/sha256-json-vs-helm.md) |

### Predicates and coercion

| Construct | Guide | vs Helm |
|-----------|-------|---------|
| `!empty` | [empty](guide/empty.md) | [Helm](guide/empty-vs-helm.md) |
| `!not-empty` | [not-empty](guide/not-empty.md) | [Helm](guide/not-empty-vs-helm.md) |
| `!and` | [and](guide/and.md) | [Helm](guide/and-vs-helm.md) |
| `!or` | [or](guide/or.md) | [Helm](guide/or-vs-helm.md) |
| `!int` | [int](guide/int.md) | [Helm](guide/int-vs-helm.md) |
| `!str` | [str](guide/str.md) | [Helm](guide/str-vs-helm.md) |
| `!bool` | [bool](guide/bool.md) | [Helm](guide/bool-vs-helm.md) |
| `!float` | [float](guide/float.md) | [Helm](guide/float-vs-helm.md) |

## Best practices

- [General Conventions](best-practices/general-conventions.md)

## Specification (normative)

Public docs explain how to write knarr. The language law is still:

- [SPEC.md](../lang/SPEC.md)
- [DECISIONS.md](../lang/DECISIONS.md)
- [EXAMPLES.md](../lang/EXAMPLES.md)
- [NONGOALS.md](../lang/NONGOALS.md)
