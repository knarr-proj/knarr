# knarr

A YAML-only language for **transforming any YAML**: values in, documents out. You write valid YAML 1.2 with local tags (`!bind`, `!emit`, `!ref`, …) instead of embedding Go `{{ }}` in strings.

Kubernetes manifests are a common target (and the docs often use them as examples). The language itself is not Kubernetes-specific.

The name is a Viking cargo ship (*knǫrr*) — it carries YAML.

> **Proof of concept.** This repository documents a language. It is **not** a finished tool, not a Helm replacement for install/upgrade, and **not** production-ready.

## Status

| Area | State |
|------|--------|
| Language v1 | Specified and documented |
| Public guide | Yes — [docs/](docs/README.md) |
| CLI / renderer | **Not implemented** |
| Helm lifecycle (`install`, releases, hooks) | Out of scope |
| Stability | Expect breaking changes while the renderer is built |

Do not use knarr to generate production YAML today. There is nothing to install.

## What this PoC is for

- Show that parameterized YAML (Helm charts, Compose files, CRDs, app config, CI pipelines, …) can be expressed as **YAML 1.2 + local tags**, without embedding templates in strings.
- Freeze a small, declarative language so a future Rust CLI (`knarr render`) has a target.
- Give authors a [Getting Started](docs/getting-started.md) path and a construct-by-construct [guide](docs/README.md) (Helm is compared because it is the usual baseline, not because knarr is Kubernetes-only).

## What this PoC is not

- Not a cluster operator, chart museum, or `helm install`.
- Not a drop-in for existing Helm CLI flags (`-f`, `--set`, `--namespace`).
- Not a running binary. `knarr render` below is the **intended** interface.

## Example (language)

```yaml
---
!bind
$Values:
  name: api
  region: eu-west
  replicas: 3
---
!emit
service:
  name: !ref $Values.name
  region: !ref $Values.region
  replicas: !ref $Values.replicas
```

Bindings use `$Name`. Lookup is `!ref`. There is no `{{ .Values.name }}`. The output is a YAML document of any shape — a Deployment, a Compose service, or your own schema.

## Planned CLI

When a renderer exists:

```text
knarr render app.knarr
knarr render app.knarr -o manifests.yaml
knarr render app.knarr --trace
```

One input file, local files only. No stdin, no `-f` / `--set`. Values live in the program (`!bind`) or in files loaded with `!read` / `!import`.

## Documentation

| Document | What it is |
|----------|------------|
| [Getting Started](docs/getting-started.md) | Smallest program: values → YAML documents |
| [Language guide](docs/README.md) | Every construct: syntax, examples |
| [Tips and Tricks](docs/tips-and-tricks.md) | Everyday patterns |
| [General Conventions](docs/best-practices/general-conventions.md) | Naming, `$` keys, omit, bind vs emit |

## Limitations (PoC)

- **No evaluator.** Examples in the docs are illustrative until a renderer exists.
- **No Helm release objects.** `$Release`, `$Chart`, and `$Capabilities` are reserved and unused.
- **No snippet macros** (`define` / `include`) in v1; split files with `!import`.
- **Strict omit.** A missing path is an error unless you mark both the key (`?:`) and the field (`$Values.tls?`).
- **`??` is one default on the whole `!ref` or computing `!expr`.** A bare path is `!ref`. `true || omit` is true.
- **Expressions have no function calls.** `len()`, `printf()`, `int()` in `!expr` are errors; those are YAML tags (`!len`, `!format`, `!int`).

## Contributing

This is an early public sketch. Useful input:

- Does the [guide](docs/README.md) match how you would generate real YAML (Helm charts or otherwise)?
- Which patterns are still awkward or missing from the docs?

Please open an issue. Language syntax is intentionally conservative: it is better to forbid a construct than to ship it and take it back.

Implementation of the Rust CLI is not solicited until the project asks for it.

## License

No license file is published yet. Do not treat this repository as redistributable software until one is added.
