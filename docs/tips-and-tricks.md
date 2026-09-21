# Tips and Tricks

Short recipes. Each links to the full construct page.

## Name everything you format

`!format` cannot sit in `!emit`. Bind first, then `!ref`.

```yaml
---
!bind
$FullName: !format
  - "%s-%s"
  - !ref $Values.env
  - !ref $Values.name
---
!emit
metadata:
  name: !ref $FullName
```

Details: [`!format`](guide/format.md).

## Optional nested mapping

```yaml
affinity?: !ref $Values?.affinity
```

Not a `!with` tag. Details: [Omit](guide/omit.md).

## Default that keeps the key

```yaml
host: !expr "$Values.tls?.host ?? 'localhost'"
```

`??` is binary and only in `!expr`. More than two candidates: [`!pick`](guide/pick.md).

## One Service, maybe

Document-level `if`:

```yaml
---
!emit
$when: !expr "$Values.service.enabled"
$then:
  apiVersion: v1
  kind: Service
  metadata:
    name: !ref $Values.name
$else: ""
```

Field-level `if` / `else if`: [`!match`](guide/match.md). Details: [`$when`](guide/when.md).

## Ports on a Pod vs a Pod per worker

| Need | Construct |
|------|-----------|
| env/ports **inside** one spec | [`!foreach`](guide/foreach.md) |
| one Deployment **per** item | [`!emit-foreach`](guide/emit-foreach.md) |

```yaml
env: !foreach
  $over: !ref $Values.env
  $as: $E
  $yield:
    name: !ref $E.name
    value: !ref $E.value
```

## Labels with dots in the key

```yaml
app: !ref "$Values.labels['app.kubernetes.io/name']"
```

Quotes are YAML, required because of `[`. Details: [`!ref`](guide/ref.md).

## Secret data

```yaml
data:
  password: !b64enc $Values.password
```

Details: [`!b64enc`](guide/b64enc.md). Decode: [`!b64dec`](guide/b64dec.md).

## ConfigMap checksum

```yaml
metadata:
  annotations:
    checksum/config: !sha256-json $Values.config
data:
  config.json: !to-json-str $Values.config
```

Canon is Go `json.Marshal` (sorted keys, HTML-escape). Details: [`!sha256-json`](guide/sha256-json.md), [`!to-json-str`](guide/to-json-str.md).

## Concatenate container args

```yaml
---
!bind
$Args: !concat
  - [ "--verbose" ]
  - !ref $Values.extraArgs
---
!emit
spec:
  containers:
    - args: !ref $Args
```

`+` does not concatenate lists. Details: [`!concat`](guide/concat.md).

## Integer from a string in values

```yaml
---
!bind
$Port: !int $Values.port
---
!emit
spec:
  ports:
    - containerPort: !ref $Port
```

There is no `int()` inside `!expr`. Details: [`!int`](guide/int.md).

## Last element of a list

No `[-1]`. Bind length, then index:

```yaml
$N: !len $Values.workers
$I: !expr "$N - 1"
last: !expr "$Values.workers[$I]"
```

Details: [`!len`](guide/len.md), [`!expr`](guide/expr.md).

## Skip a loop iteration

```yaml
$yield?: !ref $Worker?.sidecar
```

Omit yield → no element (foreach) / no document (emit-foreach). Details: [`!foreach`](guide/foreach.md).

## Fail the render if a value is missing

```yaml
---
!validation
$rules:
  - !not-empty $Values?.name
$fail: "set Values.name"
```

Details: [`!validation`](guide/validation.md), [`!not-empty`](guide/not-empty.md).

## Load values.yaml

```yaml
---
!bind
$Values: !read values.yaml
```

One YAML document, not knarr tags. Split **program** files with [`!import`](guide/import.md).

## CPU `0.5`

YAML `0.5` is a **float**. `"500m"` is a **string**. Arithmetic: `$Replicas + 0.5` promotes int to float. Details: [`!float`](guide/float.md).
