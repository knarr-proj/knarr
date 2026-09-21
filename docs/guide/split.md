# `!split`

Split a **string** on a separator. Bind-only. Result is a sequence of strings.

**Helm:** `splitList` / `split` — [vs Helm](split-vs-helm.md).

## Syntax

```yaml
$Parts: !split
  $sep: ","
  $of: !ref $Values.hostCsv
```

- `$sep` non-empty string; `$of` string (may be `""` → `[]`).
- Only `$Name:` in `!bind`.

## Examples

### CSV hosts → list

```yaml
---
!bind
$Hosts: !split
  $sep: ","
  $of: !ref $Values.hostCsv
---
!emit
spec:
  hostAliases: !foreach
    $over: !ref $Hosts
    $as: $H
    $yield:
      ip: "127.0.0.1"
      hostnames:
        - !ref $H
```

### Image repo / tag

```yaml
$Bits: !split
  $sep: ":"
  $of: !ref $Values.image
```

Then index with `!expr` / `!len` (no `[-1]`).

### Newline lists

```yaml
$Lines: !split
  $sep: "\n"
  $of: !ref $Values.allowlist
```

## Common mistakes

**Wrong — empty `$sep`**

Error.

**Wrong — splitting in `!expr`**

No `split()` function.

## See also

- [vs Helm](split-vs-helm.md)
- [`!join`](join.md)
- [`!foreach`](foreach.md)
