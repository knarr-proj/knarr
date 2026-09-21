# `!sha256-json`

SHA-256 of `!to-json-str` (UTF-8), hex lowercase.

≡ Helm `sha256sum (toJson .)` ≡ `!sha256` of `!to-json-str`.

**Helm:** `toJson | sha256sum` — [vs Helm](sha256-json-vs-helm.md).

## Syntax

```yaml
checksum/config: !sha256-json $Values.config
```

Tagged scalar. Mapping/seq allowed (hashed as JSON). Omit → omit.

## Examples

### Roll pods when config changes

```yaml
---
!emit
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
  annotations:
    checksum/config: !sha256-json $Values.config
spec:
  template:
    metadata:
      annotations:
        checksum/config: !sha256-json $Values.config
```

### Same via two binds

```yaml
$Json: !to-json-str $Values.config
$Sum: !sha256
  $of: !ref $Json
```

Must equal `!sha256-json`.

### Secret data object

```yaml
checksum/secret: !sha256-json $Values.secretData
```

## Common mistakes

**Wrong — hashing YAML text**

Would not match Helm `toJson` checksums. YAML hash is v2.

**Wrong — unsorted pretty JSON**

The tag uses the frozen Helm JSON canon.

## See also

- [vs Helm](sha256-json-vs-helm.md)
- [`!to-json-str`](to-json-str.md)
- [`!sha256`](sha256.md)
