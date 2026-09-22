# Tips and Tricks

Short recipes. Each links to the full construct page.

## Name everything you format

`!format` cannot sit in `!emit`. Bind first, then `!ref`.

```yaml
# $Values = {env: prod, name: api}
!bind
$FullName: !format
  - "%s-%s"
  - !ref $Values.env
  - !ref $Values.name
---
!emit
name: !ref $FullName  # name: prod-api
```

Details: [`!format`](guide/format.md).

## Optional nested mapping

```yaml
# $Values = {}
affinity?: !ref $Values.affinity?  # no affinity
```

Not a `!with` tag. Details: [`!ref`](guide/ref.md) (Omit).

## Default vs omit

```yaml
# $Values = {}
# default — key stays
host: !ref "$Values.tls?.host ?? 'localhost'"  # host: localhost
# omit
host?: !ref $Values.tls?.host  # no host
```

`??` is one default on the whole `!ref` or `!expr`. A field with no operator: [`!ref`](guide/ref.md). A formula: [`!expr`](guide/expr.md). A constant (`true`, `[80, 443]`): YAML. More than two candidates: [`!pick`](guide/pick.md).

## One Service, maybe

Document-level `if`:

```yaml
# $Values = {service: {enabled: true}, name: api}
!emit?
$when: !ref $Values.service.enabled
$then:
  apiVersion: v1
  kind: Service
  name: !ref $Values.name  # name: api
```

Field-level `if` / `else if`: [`!match`](guide/match.md). Details: [`$when`](guide/when.md).

## Ports on a Pod vs a Pod per worker

| Need | Construct |
|------|-----------|
| env/ports **inside** one spec | [`!foreach`](guide/foreach.md) |
| one Deployment **per** item | [`!emit-foreach`](guide/emit-foreach.md) |

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

## Labels with dots in the key

```yaml
# $Values = {labels: {'app.kubernetes.io/name': api}}
app: !ref "$Values.labels['app.kubernetes.io/name']"  # app: api
```

Quotes are YAML, required because of `[`. Details: [`!ref`](guide/ref.md).

## Secret data

```yaml
# $Values = {password: x}
password: !b64enc $Values.password  # password: eA==
```

Details: [`!b64enc`](guide/b64enc.md). Decode: [`!b64dec`](guide/b64dec.md).

## ConfigMap checksum

```yaml
# $Values = {config: {a: 1}}
checksum/config: !sha256-json $Values.config
config.json: !to-json-str $Values.config
# checksum/config: … / config.json: {"a":1}
```

Canon is Go `json.Marshal` (sorted keys, HTML-escape). Details: [`!sha256-json`](guide/sha256-json.md), [`!to-json-str`](guide/to-json-str.md).

## Concatenate container args

```yaml
# $Values = {extraArgs: ["--port", "80"]}
!bind
$Args: !concat
  - [ "--verbose" ]
  - !ref $Values.extraArgs
---
!emit
args: !ref $Args  # args: ["--verbose", "--port", "80"]
```

`+` does not concatenate lists. Details: [`!concat`](guide/concat.md).

## Integer from a string in values

```yaml
# $Values = {port: "8080"}
!bind
$Port: !int $Values.port
---
!emit
containerPort: !ref $Port  # containerPort: 8080
```

There is no `int()` inside `!expr`. Details: [`!int`](guide/int.md).

## Last element of a list

No `[-1]`. Bind length, then index:

```yaml
# $Values = {workers: [a, b, c]}
$N: !len $Values.workers
$I: !expr "$N - 1"
last: !expr "$Values.workers[$I]"  # last: c
```

Details: [`!len`](guide/len.md), [`!expr`](guide/expr.md).

## Skip a loop iteration

```yaml
# $Worker = {}
$yield?: !ref $Worker.sidecar?
# skip iteration
```

Omit yield → no element (foreach) / no document (emit-foreach). Details: [`!foreach`](guide/foreach.md).

## Fail the render if a value is missing

```yaml
# $Values = {}
!validation
$rules:
  - !is-not-empty $Values.name?
$fail: "set Values.name"
# error: set Values.name
```

Details: [`!validation`](guide/validation.md), [`!is-not-empty`](guide/is-not-empty.md).

## Load values.yaml

```yaml
# $Values = {a: 1}
!bind
$Values: !read values.yaml
# no stdout
```

One YAML document, not knarr tags. Split **program** files with [`!import`](guide/import.md).

## CPU `0.5`

YAML `0.5` is a **float**. `"500m"` is a **string**. Arithmetic: `$Replicas + 0.5` promotes int to float. Details: [`!float`](guide/float.md).
