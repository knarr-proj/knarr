# `!concat` vs Helm

## Mapping

| Helm | knarr |
|------|--------|
| `concat list1 list2` | `!concat` in `!bind` |
| `append` / `prepend` | `!concat` with a one-element list |
| `+` on lists (sprig) | error; use `!concat` |

## Side by side

**Helm**

```gotemplate
args: {{ concat (list "--verbose") .Values.extraArgs | toYaml | nindent 2 }}
```

**knarr** — bind `!concat`, `args: !ref $Args`.

## Differences that bite

- Helm concat is a function in the template. knarr concat is a **bind tag**.
- Putting `!ref` of a list as a YAML sequence item nests, like Helm `list .` mistakes.
