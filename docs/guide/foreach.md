# `!foreach`

Build a **sequence** for one field (env, ports, volumeMounts). It does not emit documents.

Many resources: [`!emit-foreach`](emit-foreach.md).

## Syntax

```yaml
# $Values = {deployEnv: true, env: [{name: N, value: x, enabled: true}]}
field: !foreach
  $over: !ref $Values.env
  $as: $E
  $when: !is-not-empty $Values.deployEnv?  # optional pack gate
  $filter: !ref $E.enabled   # optional
  $key: $K                      # optional; maps only
  $yield:
    name: !ref $E.name
    value: !ref $E.value
# field: [{name: N, value: x}]
```

`$when` is an optional bool for the **whole** loop (same slot as [`!emit-foreach`](emit-foreach.md)). False → empty result; `$over` is not evaluated. `$as` / `$key` are not in `$when`. Omit `$when` is an error. `$when?:` is an error.

`$filter` is an optional bool per item (same family: tags or YAML `true` / `false`).

`$yield` may be scalar, sequence, or mapping — **one sort** for the whole loop.

One `$over` for a sequence **or** a mapping (`?? []` or `?? {}` — you pick the literal). Wrong sort is a `$over` error. There is no `$map` / `$seq`.

`env?: !foreach` / `$Items?: !foreach` ↔ omit-capable `$over` (`?.`) **or** `$yield?:`. Missing collection → no key / omit bind. `env?:` + `$yield:` + a live `$over` → `[]`. `env?:` + `$yield?:` + nothing to print (`[]` / `{}` / `$when` false / all `$filter` false / all yields omit) → no key / omit bind. `env?:` + `$yield?:` + `$over: … ?? []` is allowed (missing becomes `[]`, then nothing to print). `env: !foreach` / `$Items: !foreach` ↔ `$over` always a value (`?? []` or a required path): empty → `[]`. Pair error: `?:` + `?? []` + `$yield:`; `?:` + required `$over` + `$yield:`.

`$yield?:` — if the value omits, **skip the iteration** (list shrinks). On `env?:` / `$Items?:`, a fully empty result also **omits the key / bind**. `$yield:` + omit is an error. `$yield?` without `:` is an error.

An empty list **value** (`[]` in values) stays `[]` unless the field is `?:` **and** the loop uses `$yield?:`. Otherwise skip empty lists with [`!skip-empty`](skip-empty.md) on a `?:` key.

`$over?:` is an error. Omit **value** of `$over` is allowed with `key?:`, `$Name?:` in bind, or on [`!emit-foreach`](emit-foreach.md) → zero documents.

No `$index`.

## Examples

### Container env

```yaml
# $Values = {env: [{name: N, value: x}]}
env: !foreach
  $over: !ref $Values.env
  $as: $E
  $yield:
    name: !ref $E.name
    value: !ref $E.value
# env: [{name: N, value: x}]
```

### Gate the whole list

```yaml
# $Values = {deployEnv: false, env: [{name: N}]}
env: !foreach
  $when: !is-not-empty $Values.deployEnv?
  $over: !ref $Values.env
  $as: $E
  $yield:
    name: !ref $E.name
# env: []
```

```yaml
# $Values = {deployEnv: false, env: [{name: N}]}
env?: !foreach
  $when: !is-not-empty $Values.deployEnv?
  $over: !ref $Values.env
  $as: $E
  $yield?:
    name: !ref $E.name
# no env
```

### Ports from ints

```yaml
# $Values = {ports: [80]}
ports: !foreach
  $over: !ref $Values.ports
  $as: $P
  $yield:
    containerPort: !ref $P
# ports: [{containerPort: 80}]
```

### Map of labels → env vars

```yaml
# $Values = {labels: {app: api}}
env: !foreach
  $over: !ref $Values.labels
  $as: $V
  $key: $K
  $yield:
    name: !ref $K
    value: !ref $V
# env: [{name: app, value: api}]
```

### Optional env block

```yaml
# $Values = {}
env?: !foreach
  $over: !ref $Values.env?
  $as: $E
  $yield:
    name: !ref $E.name
    value: !ref $E.value
# no env
```

Missing `env` → no key. `env: []` in values → `env: []` (`$yield:`). Nothing to print (empty `$over`, all filters false, all yields omit) → no key:

```yaml
# $Values = {env: [{}]}
env?: !foreach
  $over: !ref $Values.env
  $as: $E
  $yield?:
    name: !ref $E.name?
# no env
```

Missing filled to empty, then the same omit:

```yaml
# $Values = {}
env?: !foreach
  $over: !ref "$Values.env? ?? []"
  $as: $E
  $yield?:
    name: !ref $E.name?
# no env
```

Always print a list (possibly empty):

```yaml
# $Values = {}
env: !foreach
  $over: !ref "$Values.env? ?? []"
  $as: $E
  $yield:
    name: !ref $E.name
    value: !ref $E.value
# env: []
```

### Optional bind list

```yaml
# $Values = {}
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
# no env
```

Missing `env` → no `$Items` → no key. `env: []` + `$yield:` → `$Items: []`. `$Items?:` + `$yield?:` + nothing to print → no `$Items`. `$Items?:` + `$yield?:` + `$over: … ?? []` is allowed. `$Items?:` + `$yield:` + `?? []` is a pair error. Always keep a list in the graph:

```yaml
# $Values = {}
!bind
$Items: !foreach
  $over: !ref "$Values.env? ?? []"
  $as: $E
  $yield:
    name: !ref $E.name
# $Items: []
```

### Skip disabled sidecars

```yaml
# $S = {}
$yield?: !ref $S.container?
# skip iteration
```

## Common mistakes

<table>
<tr><th>Wrong</th><th>Right</th></tr>
<tr><td>

```yaml
# $Values = {workers: [{name: w1}]}
!foreach
$over: !ref $Values.workers
$as: $W
$yield:
  kind: Pod
  name: !ref $W.name
# error: !foreach is not a root document
```

</td><td>

```yaml
# $Values = {workers: [{name: w1}]}
!emit-foreach
$over: !ref $Values.workers
$as: $W
$yield:
  kind: Pod
  name: !ref $W.name
# kind: Pod / name: w1
```

</td></tr>
<tr><td>

```yaml
# $Values = {}
!emit
containers: !foreach
  $over: !ref $Values.workers?
  $as: $W
  $yield:
    name: !ref $W.name
# error: required key + omit-capable $over
```

</td><td>

```yaml
# $Values = {}
!emit
containers: !foreach
  $over: !ref "$Values.workers? ?? []"
  $as: $W
  $yield:
    name: !ref $W.name
# containers: []
```

</td></tr>
<tr><td>

```yaml
# $Values = {}
!emit
env?: !foreach
  $over: !ref "$Values.env? ?? []"
  $as: $E
  $yield:
    name: !ref $E.name
# error: ?: + ?? [] : key cannot vanish
```

```yaml
# $Values = {env: []}
!emit
env?: !foreach
  $over: !ref $Values.env
  $as: $E
  $yield:
    name: !ref $E.name
# error: ?: + required $over + $yield:
```

</td><td>

```yaml
# $Values = {}
!emit
env?: !foreach
  $over: !ref $Values.env?
  $as: $E
  $yield:
    name: !ref $E.name
# no env
```

```yaml
# $Values = {env: [{}]}
!emit
env?: !foreach
  $over: !ref $Values.env
  $as: $E
  $yield?:
    name: !ref $E.name?
# no env
```

```yaml
# $Values = {}
!emit
env?: !foreach
  $over: !ref "$Values.env? ?? []"
  $as: $E
  $yield?:
    name: !ref $E.name?
# no env
```

</td></tr>
<tr><td>

```yaml
# $Values = {}
!bind
$Items: !foreach
  $over: !ref $Values.env?
  $as: $E
  $yield: !ref $E
# error: required bind + omit-capable $over
```

</td><td>

```yaml
# $Values = {}
!bind
$Items?: !foreach
  $over: !ref $Values.env?
  $as: $E
  $yield: !ref $E
# no $Items
```

```yaml
# $Values = {}
!bind
$Items: !foreach
  $over: !ref "$Values.env? ?? []"
  $as: $E
  $yield: !ref $E
# $Items: []
```

</td></tr>
<tr><td>

```yaml
# $Values = {env: [{name: N, value: x, plain: true}]}
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
# error: mixed string and mapping $yield
```

</td><td>

```yaml
# $Values = {env: [{name: N, value: x}]}
!emit
env: !foreach
  $over: !ref $Values.env
  $as: $E
  $yield:
    name: !ref $E.name
    value: !ref $E.value
# env: [{name: N, value: x}]
```

</td></tr>
</table>

## Omit

`env?: !foreach` ↔ omit-capable `$over` **or** `$yield?:`. Missing collection → no key. `env: []` + `$yield:` → `env: []`. `$when` false is an empty loop (`$over` not read): `$yield:` → `[]`; `env?:` + `$yield?:` → no key. `$over?:` is an error. `$when?:` is an error.

```yaml
# $Values = {}
env?: !foreach
  $over: !ref $Values.env?
  $as: $E
  $yield:
    name: !ref $E.name
# no env
```

Drop other empty lists with [`!skip-empty`](skip-empty.md) on a `?:` key.

## See also

- [`!emit-foreach`](emit-foreach.md)
- [`!emit-range`](emit-range.md)
- [`!join`](join.md)

## Comparison with Helm

`!foreach` fills a **sequence field**. One document per item is `!emit-foreach`. Skip a document when the body omits: `!emit-foreach?` + `$yield?:`.

<table>
<tr><th>Helm</th><td>

```gotemplate
# $Values = {env: [{name: N, value: x}]}
env:
{{- range .Values.env }}
  - name: {{ .name }}
    value: {{ .value | quote }}
{{- end }}
# env: [{name: N, value: x}]
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
# $Values = {env: [{name: N, value: x}]}
!emit
env?: !foreach
  $over: !ref $Values.env?
  $as: $E
  $yield?:
    name: !ref $E.name
    value: !ref $E.value
# env: [{name: N, value: x}]
```

</td></tr>
<tr><th>Difference</th><td>

Empty range: Helm `env: null` ≡ no `env`. `| quote` is text quotes.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
# $Values = {ports: [80]}
ports:
{{- range .Values.ports }}
  - containerPort: {{ . }}
{{- end }}
# ports: [{containerPort: 80}]
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
# $Values = {ports: [80]}
!emit
ports?: !foreach
  $over: !ref $Values.ports?
  $as: $P
  $yield?:
    containerPort: !ref $P
# ports: [{containerPort: 80}]
```

</td></tr>
<tr><th>Difference</th><td>

Empty range: Helm `ports: null` ≡ no `ports`.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
# $Values = {labels: {app: api}}
env:
{{- range $k, $v := .Values.labels }}
  - name: {{ $k }}
    value: {{ $v | quote }}
{{- end }}
# env: [{name: app, value: api}]
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
# $Values = {labels: {app: api}}
!emit
env?: !foreach
  $over: !ref $Values.labels?
  $as: $V
  $key: $K
  $yield?:
    name: !ref $K
    value: !ref $V
# env: [{name: app, value: api}]
```

</td></tr>
<tr><th>Difference</th><td>

Empty map: Helm `env: null` ≡ no `env`. `| quote` is text quotes.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
# $Values = {env: [{name: N, value: x, enabled: true}]}
env:
{{- range .Values.env }}
{{- if .enabled }}
  - name: {{ .name }}
    value: {{ .value | quote }}
{{- end }}
{{- end }}
# env: [{name: N, value: x}]
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
# $Values = {env: [{name: N, value: x, enabled: true}]}
!emit
env?: !foreach
  $over: !ref $Values.env?
  $as: $E
  $filter: !is-not-empty $E.enabled?
  $yield?:
    name: !ref $E.name
    value: !ref $E.value
# env: [{name: N, value: x}]
```

</td></tr>
<tr><th>Difference</th><td>

All filtered out: Helm `env: null` ≡ no `env`. Helm `if` ≡ `!is-not-empty`. `| quote` is text quotes.

</td></tr>
</table>

<table>
<tr><th>Helm</th><td>

```gotemplate
# $Values = {env: [{name: N, value: x}]}
{{- if .Values.env }}
env:
{{- range .Values.env }}
  - name: {{ .name }}
    value: {{ .value | quote }}
{{- end }}
{{- end }}
# env: [{name: N, value: x}]
```

</td></tr>
<tr><th>Knarr</th><td>

```yaml
# $Values = {env: [{name: N, value: x}]}
!emit
env?: !foreach
  $over: !ref $Values.env?
  $as: $E
  $yield?:
    name: !ref $E.name
    value: !ref $E.value
# env: [{name: N, value: x}]
```

</td></tr>
<tr><th>Difference</th><td>

Missing or empty `env` → no key in both. Helm `| quote` is text quotes.

</td></tr>
</table>
