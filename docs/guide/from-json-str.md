# `!from-json-str`

Parse a JSON **string** into a knarr node.

**Helm:** `fromJson` — [vs Helm](from-json-str-vs-helm.md).

## Syntax

```yaml
$Extra: !from-json-str $Values.extraJson
```

- Object → mapping, array → seq, bool/string as usual.
- JSON integer without `.` or exponent → **int**.
- Number with `.` / `e`/`E` → **float** (`1e2` is float `100.0`).
- `null`, duplicate keys, invalid JSON, Inf → error.

## Examples

### Extra overlay from a string value

```yaml
---
!bind
$Values:
  extraJson: '{"replicas":3}'
$Extra: !from-json-str $Values.extraJson
---
!emit
spec:
  replicas: !ref $Extra.replicas
```

### Read JSON file as YAML

Prefer [`!read`](read.md) when the file is a document. Use `!from-json-str` when the JSON is already a **string** in values.

### HTML unescape

JSON `\u0026` becomes `&` in the string node.

## Common mistakes

**Wrong — `fromJson()` in `!expr`**

**Wrong — expecting JSON `1` to stay float**

Bare `1` becomes int (same as Helm/Go).

**Wrong — `null` in JSON**

knarr has no null.

## See also

- [vs Helm](from-json-str-vs-helm.md)
- [`!to-json-str`](to-json-str.md)
- [`!read`](read.md)
