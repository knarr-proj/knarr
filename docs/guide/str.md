# `!str`

Coerce to **string**.

**Helm:** `toString` / `print` — [vs Helm](str-vs-helm.md).

## Syntax

```yaml
replicas: !str $Values.replicas
```

- String: unchanged.
- Int → decimal (`-3` → `"-3"`).
- Bool → `"true"` / `"false"`.
- Float → Go `strconv.FormatFloat(..., 'g', -1, 64)`.
- seq/map → error (not `toYaml`).

## Examples

### Label from replica count

```yaml
metadata:
  labels:
    replicas: !str $Values.replicas
```

### Annotation from bool

```yaml
annotations:
  ha: !str $Values.ha
```

### Float CPU as text

```yaml
annotations:
  cpu: !str $Values.cpu
```

### Indexed Job name

```yaml
metadata:
  name: !str $I
```

Job names and labels must be strings. Loop indexes from [`!range`](range.md) are ints.

### Service port as annotation

```yaml
metadata:
  annotations:
    prometheus.io/port: !str $Values.port
```

## Common mistakes

**Wrong — `string()` in `!expr`**

```yaml
replicas: !expr "string($Values.replicas)"
```

**Right**

```yaml
replicas: !str $Values.replicas
```

**Wrong — `!str` of a mapping**

Use [`!to-json-str`](to-json-str.md) if you need JSON text, or emit the mapping as YAML.

**Wrong — `%s` in `!format` with an int**

`!str` first, or use `%d`.

## See also

- [vs Helm](str-vs-helm.md)
- [`!int`](int.md)
- [`!to-json-str`](to-json-str.md)
