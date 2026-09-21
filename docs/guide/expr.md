# `!expr`

A formula: operators, paths, list/map literals. **No function calls.**

**Helm:** `eq`, `gt`, `and`, `add` in templates — [vs Helm](expr-vs-helm.md).

## Syntax

```yaml
$Show: !expr "$Values.service.enabled && $Values.replicas > 1"
```

Tagged **scalar** only (not `{ }` / `[ ]` as the tag body).

The lexer strips `$` from binding names outside quotes. You still **write** `$Values`.

Allowed: literals (including `[80, 443]` and `{'app': $X}`), `$Name` paths, `&&` `||` `!` `==` `!=` `<` `>` `<=` `>=`, `+ - * /` (int, or float with promotion), binary `??`.

Forbidden: `ident(`, ternary `c ? t : f`, string/list `+`.

Dynamic index: `$Map[$Key]` where the index is `$Name` or `$Name.ident` — not a formula inside `[ ]`.

## Examples

### Enable a Service

```yaml
$ShowSvc: !expr "$Values.service.enabled && $Values.replicas > 1"
```

### replicas + 1

```yaml
spec:
  replicas: !expr "$Values.replicas + 1"
```

### Default list of ports

```yaml
$Ports: !expr "$Values?.ports ?? [80, 443]"
```

### Labels map literal

```yaml
$Labels: !expr "{'app': $Values.name, 'env': $Values.env}"
```

Keys in map literals must be quoted strings.

### Image by worker name

```yaml
image: !expr "$Values.images[$Worker.name]"
```

### Int + float (CPU)

```yaml
$Limit: !expr "$Values.replicas + 0.5"
```

Result is float. `0.1 + 0.2` is IEEE, not decimal `0.3`.

## Common mistakes

**Wrong**

```yaml
$n: !expr "len($Values.workers)"
name: !expr "$Values.name + '-svc'"
$x: !expr "$On ? 1 : 0"
$bad: !expr "{app: $Values.name}"
```

**Right**

```yaml
$n: !len $Values.workers
$Name: !format
  - "%s-svc"
  - !ref $Values.name
replicas: !match
  $if: !ref $On
  $then: 1
  $else: 0
$Labels: !expr "{'app': $Values.name}"
```

**Wrong — `Values.replicas` without `$`**

**Right — `$Values.replicas`.**

## See also

- [vs Helm](expr-vs-helm.md)
- [`!ref`](ref.md)
- [`!format`](format.md)
- [`!len`](len.md)
- [`!float`](float.md)
