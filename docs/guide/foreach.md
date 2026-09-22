# `!foreach`

Build a **sequence** for one field (env, ports, volumeMounts). It does not emit documents.

Many resources: [`!emit-foreach`](emit-foreach.md).

## Syntax

```yaml
field: !foreach
  $over: !ref $Values.env
  $as: $E
  $filter: !ref $E.enabled   # optional
  $key: $K                      # optional; maps only
  $yield:
    name: !ref $E.name
    value: !ref $E.value
```

`$filter` is an optional bool (same family as `$when`: tags or YAML `true` / `false`).

`$yield` may be scalar, sequence, or mapping — **one sort** for the whole loop.

One `$over` for a sequence **or** a mapping (`?? []` or `?? {}` — you pick the literal). Wrong sort is a `$over` error. There is no `$map` / `$seq`.

`env?: !foreach` / `$Items?: !foreach` ↔ omit-capable `$over` (`?.`) **or** `$yield?:`. Missing collection → no key / omit bind. `env?:` + `$yield:` + a live `$over` → `[]`. `env?:` + `$yield?:` + nothing to print (`[]` / `{}` / all `$filter` false / all yields omit) → no key / omit bind. `env?:` + `$yield?:` + `$over: … ?? []` is allowed (missing becomes `[]`, then nothing to print). `env: !foreach` / `$Items: !foreach` ↔ `$over` always a value (`?? []` or a required path): empty → `[]`. Pair error: `?:` + `?? []` + `$yield:`; `?:` + required `$over` + `$yield:`.

`$yield?:` — if the value omits, **skip the iteration** (list shrinks). On `env?:` / `$Items?:`, a fully empty result also **omits the key / bind**. `$yield:` + omit is an error. `$yield?` without `:` is an error.

An empty list **value** (`[]` in values) stays `[]` unless the field is `?:` **and** the loop uses `$yield?:`. Otherwise skip empty lists with [`!skip-empty`](skip-empty.md) on a `?:` key.

`$over?:` is an error. Omit **value** of `$over` is allowed with `key?:`, `$Name?:` in bind, or on [`!emit-foreach`](emit-foreach.md) → zero documents.

No `$index`.

## Examples

### Container env

```yaml
env: !foreach
  $over: !ref $Values.env
  $as: $E
  $yield:
    name: !ref $E.name
    value: !ref $E.value
```

### Ports from ints

```yaml
ports: !foreach
  $over: !ref $Values.ports
  $as: $P
  $yield:
    containerPort: !ref $P
```

### Map of labels → env vars

```yaml
env: !foreach
  $over: !ref $Values.labels
  $as: $V
  $key: $K
  $yield:
    name: !ref $K
    value: !ref $V
```

### Optional env block

```yaml
env?: !foreach
  $over: !ref $Values.env?
  $as: $E
  $yield:
    name: !ref $E.name
    value: !ref $E.value
```

Missing `env` → no key. `env: []` in values → `env: []` (`$yield:`). Nothing to print (empty `$over`, all filters false, all yields omit) → no key:

```yaml
env?: !foreach
  $over: !ref $Values.env
  $as: $E
  $yield?:
    name: !ref $E.name?
```

Missing filled to empty, then the same omit:

```yaml
env?: !foreach
  $over: !ref "$Values.env? ?? []"
  $as: $E
  $yield?:
    name: !ref $E.name?
```

Always print a list (possibly empty):

```yaml
env: !foreach
  $over: !ref "$Values.env? ?? []"
  $as: $E
  $yield:
    name: !ref $E.name
    value: !ref $E.value
```

### Optional bind list

```yaml
!bind
$Items?: !foreach
  $over: !ref $Values.env?
  $as: $E
  $yield:
    name: !ref $E.name
    value: !ref $E.value
---
!emit
env?: !ref $Items?
```

Missing `env` → no `$Items` → no key. `env: []` + `$yield:` → `$Items: []`. `$Items?:` + `$yield?:` + nothing to print → no `$Items`. `$Items?:` + `$yield?:` + `$over: … ?? []` is allowed. `$Items?:` + `$yield:` + `?? []` is a pair error. Always keep a list in the graph:

```yaml
!bind
$Items: !foreach
  $over: !ref "$Values.env? ?? []"
  $as: $E
  $yield:
    name: !ref $E.name
```

### Skip disabled sidecars

```yaml
$yield?: !ref $S.container?
```

## Common mistakes

<table>
<tr><th>Wrong</th><th>Right</th></tr>
<tr><td>

```yaml
!foreach
$over: !ref $Values.workers
$as: $W
$yield:
  kind: Pod
  name: !ref $W.name
# !foreach is not a root document for many Pods
```

</td><td>

```yaml
!emit-foreach
$over: !ref $Values.workers
$as: $W
$yield:
  kind: Pod
  name: !ref $W.name
# one document per item is !emit-foreach
```

</td></tr>
<tr><td>

```yaml
!emit
containers: !foreach
  $over: !ref $Values.workers?
  $as: $W
  $yield:
    name: !ref $W.name
# required key + omit-capable $over is a pair error
```

</td><td>

```yaml
!emit
containers: !foreach
  $over: !ref "$Values.workers? ?? []"
  $as: $W
  $yield:
    name: !ref $W.name
# always a list; missing becomes []
```

</td></tr>
<tr><td>

```yaml
!emit
env?: !foreach
  $over: !ref "$Values.env? ?? []"
  $as: $E
  $yield:
    name: !ref $E.name
# ?: + ?? [] : key cannot vanish
```

```yaml
!emit
env?: !foreach
  $over: !ref $Values.env
  $as: $E
  $yield:
    name: !ref $E.name
# ?: + required $over + $yield: : key cannot vanish
```

</td><td>

```yaml
!emit
env?: !foreach
  $over: !ref $Values.env?
  $as: $E
  $yield:
    name: !ref $E.name
# missing env omits the key
```

```yaml
!emit
env?: !foreach
  $over: !ref $Values.env
  $as: $E
  $yield?:
    name: !ref $E.name?
# required $over + $yield?: : nothing to print omits the key
```

```yaml
!emit
env?: !foreach
  $over: !ref "$Values.env? ?? []"
  $as: $E
  $yield?:
    name: !ref $E.name?
# ?? [] + $yield?: : missing becomes [] then the key omits
```

</td></tr>
<tr><td>

```yaml
!bind
$Items: !foreach
  $over: !ref $Values.env?
  $as: $E
  $yield: !ref $E
# required bind + omit-capable $over is a pair error
```

</td><td>

```yaml
!bind
$Items?: !foreach
  $over: !ref $Values.env?
  $as: $E
  $yield: !ref $E
# $Name?: omits when env is missing
```

```yaml
!bind
$Items: !foreach
  $over: !ref "$Values.env? ?? []"
  $as: $E
  $yield: !ref $E
# required bind: fill omit so $over is a list
```

</td></tr>
<tr><td>

```yaml
!emit
env: !foreach
  $over: !ref $Values.env
  $as: $E
  $yield: !match
    $if: !ref $E.plain
    $then: !ref $E.name
    $else:
      name: !ref $E.name
      value: !ref $E.value
# one loop cannot mix string and mapping $yield
```

</td><td>

```yaml
!emit
env: !foreach
  $over: !ref $Values.env
  $as: $E
  $yield:
    name: !ref $E.name
    value: !ref $E.value
# one YAML sort per loop
```

</td></tr>
</table>

## See also

- [`!emit-foreach`](emit-foreach.md)
- [Omit](omit.md)
- [`!join`](join.md)

## Comparison with Helm

`!foreach` fills a **sequence field**. One document per item is `!emit-foreach`.

<table>
<tr><th>Helm</th><td>

```gotemplate
env:
{{- range .Values.env }}
  - name: {{ .name }}
    value: {{ .value | quote }}
{{- end }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!emit
env?: !foreach
  $over: !ref $Values.env?
  $as: $E
  $yield?:
    name: !ref $E.name
    value: !ref $E.value
```

</td></tr>
<tr><th>Difference</th><td>

Empty range: Helm `env: null` ≡ no `env`. `| quote` is text quotes.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
ports:
{{- range .Values.ports }}
  - containerPort: {{ . }}
{{- end }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!emit
ports?: !foreach
  $over: !ref $Values.ports?
  $as: $P
  $yield?:
    containerPort: !ref $P
```

</td></tr>
<tr><th>Difference</th><td>

Empty range: Helm `ports: null` ≡ no `ports`.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
env:
{{- range $k, $v := .Values.labels }}
  - name: {{ $k }}
    value: {{ $v | quote }}
{{- end }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!emit
env?: !foreach
  $over: !ref $Values.labels?
  $as: $V
  $key: $K
  $yield?:
    name: !ref $K
    value: !ref $V
```

</td></tr>
<tr><th>Difference</th><td>

Empty map: Helm `env: null` ≡ no `env`. `| quote` is text quotes.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
env:
{{- range .Values.env }}
{{- if .enabled }}
  - name: {{ .name }}
    value: {{ .value | quote }}
{{- end }}
{{- end }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!emit
env?: !foreach
  $over: !ref $Values.env?
  $as: $E
  $filter: !is-not-empty $E.enabled?
  $yield?:
    name: !ref $E.name
    value: !ref $E.value
```

</td></tr>
<tr><th>Difference</th><td>

All filtered out: Helm `env: null` ≡ no `env`. Helm `if` ≡ `!is-not-empty`. `| quote` is text quotes.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
{{- if .Values.env }}
env:
{{- range .Values.env }}
  - name: {{ .name }}
    value: {{ .value | quote }}
{{- end }}
{{- end }}
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
!emit
env?: !foreach
  $over: !ref $Values.env?
  $as: $E
  $yield?:
    name: !ref $E.name
    value: !ref $E.value
```

</td></tr>
<tr><th>Difference</th><td>

Missing or empty `env` → no key in both. Helm `| quote` is text quotes.

</td></tr>
</table>
