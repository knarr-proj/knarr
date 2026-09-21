# knarr

A YAML-only transform language for Kubernetes manifests. A **render-only** alternative to `helm template`: you describe values and output with YAML tags instead of Go `{{ }}`.

The name is a Viking cargo ship (*knǫrr*) — it carries manifests.

> **Proof of concept.** This repository documents a language. It is **not** a finished tool, not a Helm replacement for install/upgrade, and **not** production-ready.

## Status

| Area | State |
|------|--------|
| Language v1 | Specified and documented |
| Public guide | Yes — [docs/](docs/README.md) |
| CLI / renderer | **Not implemented** |
| Helm lifecycle (`install`, releases, hooks) | Out of scope |
| Stability | Expect breaking changes while the renderer is built |

Do not use knarr to ship cluster config today. There is nothing to install.

## What this PoC is for

- Show that Helm-chart complexity can be expressed as **YAML 1.2 + local tags** (`!bind`, `!emit`, `!ref`, …), without embedding templates in strings.
- Freeze a small, declarative language so a future Rust CLI (`knarr render`) has a target.
- Give authors a [Getting Started](docs/getting-started.md) path and a construct-by-construct [guide](docs/README.md) (including Helm comparisons).

## What this PoC is not

- Not a cluster operator, chart museum, or `helm install`.
- Not a drop-in for existing Helm CLI flags (`-f`, `--set`, `--namespace`).
- Not a running binary. `knarr render` below is the **intended** interface.

## Example (language)

```yaml
---
!bind
$Values:
  name: demo
  image: ghcr.io/acme/demo:1.2.3
  replicas: 2
  port: 8080
---
!emit
apiVersion: apps/v1
kind: Deployment
metadata:
  name: !ref $Values.name
spec:
  replicas: !ref $Values.replicas
  selector:
    matchLabels:
      app: !ref $Values.name
  template:
    metadata:
      labels:
        app: !ref $Values.name
    spec:
      containers:
        - name: app
          image: !ref $Values.image
          ports:
            - containerPort: !ref $Values.port
```

Bindings use `$Name`. Lookup is `!ref`. There is no `{{ .Values.name }}`.

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
| [Getting Started](docs/getting-started.md) | Smallest chart: values → Deployment + Service |
| [Language guide](docs/README.md) | Every construct: syntax, Kubernetes examples, Helm mapping |
| [Tips and Tricks](docs/tips-and-tricks.md) | Everyday patterns |
| [General Conventions](docs/best-practices/general-conventions.md) | Naming, `$` keys, omit, bind vs emit |

## Limitations (PoC)

- **No evaluator.** Examples in the docs are illustrative until a renderer exists.
- **No Helm release objects.** `$Release`, `$Chart`, and `$Capabilities` are reserved and unused.
- **No snippet macros** (`define` / `include`) in v1; split files with `!import`.
- **Strict omit.** A missing path is an error unless you mark both the key (`?:`) and the path (`?.`).
- **Expressions have no function calls.** `len()`, `printf()`, `int()` in `!expr` are errors; those are YAML tags (`!len`, `!format`, `!int`).

## Contributing

This is an early public sketch. Useful input:

- Does the [guide](docs/README.md) match how you would rewrite a real chart?
- Which Helm patterns are still awkward or missing from the docs?

Please open an issue. Language syntax is intentionally conservative: it is better to forbid a construct than to ship it and take it back.

Implementation of the Rust CLI is not solicited until the project asks for it.

## License

No license file is published yet. Do not treat this repository as redistributable software until one is added.
