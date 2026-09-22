# Golden tests

## Layout
```text
lang/goldens/
  NN-name/
    input.yaml       # вход knarr
    expected.yaml    # ожидаемый multi-doc stdout (для успешных)
    expected.err     # опционально: фрагмент/код ошибки (для негативных)
    README.md        # что проверяет кейс
```

## Rules
- Имена `NN-...` с нумерацией; ≥10 кейсов для v1
- Успешные: **byte-for-byte** с `expected.yaml` (LF, сериализатор SPEC §3.9)
- Негативные: nonzero exit + стабильное сообщение (путь / `$Name`)
- Без сети, без CLI overlay
- Не коммитить CRLF в `expected.yaml`

## Suite map (planned)

| Dir | Intent |
|-----|--------|
| 01-basic-deploy | values → Deployment |
| 02-defaults | `!typedef` + `!$Type`: default `replicas` |
| 03-when-else | `!emit` + `$when` / `$else: ""` / `!not` |
| 04-emit-items | `!emit-foreach` → несколько Deployment (имя каталога историческое) |
| 05-path-non-ident | `!ref` `['не-Ident']` (48; имя каталога историческое) |
| 06-import | local `!read` values.yaml (имя каталога историческое) |
| 07-strict-missing | missing `!ref` без `?.` — всегда ошибка |
| 08-multi-doc | несколько emit |
| 09-when-xor-items | `$items` на `!emit` — ошибка (38; имя каталога историческое) |
| 10-helm-rewrite-min | мини-chart rewrite (Deploy+Svc) |
| 11-expr-cel | `??` на весь `!ref` / формулу `!expr`; нет вычисления в `!expr` — ошибка (84, 85) |
| 12-policy-no-type | `!policy` без `!$Type` — ошибка (27B) |
| 13-match | `!match` mapping: if/else `replicas`; omit `topologySpreadConstraints?:` |
| 14-yield-type | `$yield: !$T`: схема на элемент foreach |
| 15-match-yield | `!match` в `$yield` (решение 36) |
| 16-filter | `$filter` на `!emit-foreach` (решение 39) |
| 17-when-emit-foreach | `$when` ложь на `!emit-foreach` → пустой stdout (40) |
| 18-over-map | `$over` mapping + `$key` (решение 41) |
| 19-foreach-scalar-yield | `!foreach` `$yield` scalar (43) |
| 20-import-doc | document `!import` сплайс `!bind` (44) |
| 21-host-len | `!len` sequence → int (76; имя каталога историческое) |
| 22-dyn-index | `!expr` `$Map[$Key]` (50) |
| 23-opt-bind | `$Name?:` / `$Name?` omit (51) |
| 45-opt-bind-bare | `$Tls?:` + `!ref $Tls.cert` — ошибка (**120**) |
| 24-yield-opt | `$yield?:` пропуск элемента (52) |
| 25-concat | `!concat` в `!bind` → `args` (59) |
| 26-foreach-empty-omit | `containers?: !foreach` + omit `$over` → нет ключа (**97**); `имя?:` + `$yield?:` + печатать нечего → нет ключа (**108**) |
| 27-validation-fail | `!validation` `$fail` → exit 1 (61) |
| 28-validation-warn | `$warning` + invert optional через bind, не `!not … ??` (61, 86) |
| 29-join-split | `!join` / `!split` в `!bind` (62) |
| 30-sha256 | `!sha256` `$of` string → hex (63) |
| 31-merge | `!merge` deep mapping в `!bind` (64) |
| 32-range | `!range` `$until` / `$to` + `$yield` (65, **144**) |
| 33-empty-or | `!is-not-empty` / `!or` в `$rules` и `$when` (66) |
| 34-coerce | `!int` / `!str` / `!bool` (67) |
| 35-expr-lits | `?? [80, 443]` в `!ref` (кавычки YAML, **89**); map с `$` в `!expr` (68, 85) |
| 44-unquoted-default-list | `!ref $X.p? ?? [80, 443]` без кавычек — ошибка (**119**) |
| 36-read-anchors | `!read` values с `&` / `<<:` (70) |
| 37-json-str | `!to-json-str` / `!sha256-json` / `!from-json-str` (71) |
| 38-pick | `!pick` N-way omit (73) |
| 43-pick-2way | 2-way `!pick` ≡ `??` тот же stdout (**116**) |
| 39-printf | `!format` в `!bind` (75, Go `fmt` 80) |
| 40-b64enc | `!b64enc` в Secret (76) |
| 41-opt-len | `$N?: !len $Values.workers?` omit (76) |
| 42-float | f64 `0.5`; int+float в `!expr` (81) |

## Run (future)
```text
knarr test lang/goldens/    # или cargo test — golden runner
```

Пока CLI нет — каталоги содержат README-заготовки и черновики input.
