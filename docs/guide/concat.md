# `!concat`

Concatenate **sequences**. Bind-only. Result is a sequence.

**Helm:** `concat`, `append` — [vs Helm](concat-vs-helm.md).

## Syntax

```yaml
$Args: !concat
  - !ref $Base
  - !ref $Values.extraArgs
```

- Tagged sequence of children; each child evaluates to a **sequence**.
- Only `$Name:` in `!bind` (not `$Name?:`, not `!emit`).
- Nested `!concat` is an error; list siblings instead.
- `+` does not concatenate lists.

## Examples

### Container args

```yaml
---
!bind
$Args: !concat
  - ["--verbose", "--alsologtostderr"]
  - !ref $Values.extraArgs
---
!emit
spec:
  containers:
    - name: app
      args: !ref $Args
```

### Default extra list

```yaml
$Args: !concat
  - !ref $Base
  - !expr "$Values?.extraArgs ?? []"
```

### Merge two port lists

```yaml
$Ports: !concat
  - !ref $Values.fixedPorts
  - !ref $Values.dynamicPorts
```

## Common mistakes

**Wrong — in the manifest**

```yaml
args: !concat
  - [ "--verbose" ]
  - !ref $Values.extraArgs
```

**Right — bind, then `args: !ref $Args`.**

**Wrong — splicing with YAML**

```yaml
args:
  - --verbose
  - !ref $Values.extraArgs
```

That nests a list. Use `!concat`.

**Wrong — `$A + $B` on sequences**

## See also

- [vs Helm](concat-vs-helm.md)
- [`!join`](join.md)
- [`!foreach`](foreach.md)
