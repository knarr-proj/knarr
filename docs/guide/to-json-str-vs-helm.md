# `!to-json-str` vs Helm

## Mapping

| Helm | knarr |
|------|--------|
| `toJson .Values.config` | `!to-json-str $Values.config` |
| `toPrettyJson` | not in v1 |
| `toYaml` | not in v1 |

Canon is frozen to Go `json.Marshal` (sorted keys, HTML escape) so checksums match `helm template`.
