# Non-goals (v1)

Сознательно **не** делаем в v1:

## Helm lifecycle
- `install` / `upgrade` / `rollback` / releases / hooks / chart repos
- Совместимость с форматом Helm Chart.yaml как runtime
- Инжект и реализация Helm **`.Release` / `.Chart` / `.Capabilities`** в v1 (имена **`$Release` `$Chart` `$Capabilities` зарезервированы**, использовать нельзя)
- Host `release.*` / `chart.*`; CLI `--namespace` / `--release-name`; `IsInstall`/`IsUpgrade` как факт релиза

## Templating style
- Go templates / Helm `tpl` **как синтаксис** (цель — та же мощность другим языком)
- Встраивание **документа кода** (Starlark, JS, Lua, `!code`, CEL-крейт как норма) внутрь YAML — формулы только в **`!expr`** (грамматика knarr, **79**)
- Голое выражение без тега (`$when: $Values.replicas > 1`); `!expr` как mapping/sequence
- Исключение knarr из YAML 1.2 для tagged scalar: разрешить `[` `{` `]` `}` `,` / `: ` / ` #` в plain `!ref`/`!expr` «потому что не в начале строки» (решение **89**). `/` уже без кавычек. Синтаксис носителя в v2 не менять.
- Служебный ключ mapping **без `$`**: `when:`, `over:`, `sep:`, `of:`, `if:` (решение **77**; канон `$when` / `$over` / …). Не путать с K8s-ключами `apiVersion:` в `!emit`
- Теги на **ключах** (`!case`, `spec !else:`); тег **`!when`**; **`!match` как sequence веток** (`- $if` / несколько `$if`) — нужен mapping `$if`/`$then`/`$else` (решение 37)
- `имя: !match` без `$else` (omit только **`имя?:`**); `$else: {}` вместо sequence, если `$then` — list
- Ident без `$` в теле `!expr` (`Values.name` — ошибка; нужен `$Values.name`); regex по всей строке `!expr` (только лексер токенов)
- Авторские **`has()` / `get()` / `opt()`** и любые **вызовы** `ident(` (`size`, `string`, `int`, `exists`, …) в `!expr` v1
- **`??` на подывыражении** (`($a ?? 0) + $b`); цепочка `a ?? b ?? c` (решения **83**, **87**: один `??` на весь скаляр; так и в v2)
- Все операторы спрашивают всех: `true || omit` → omit (решение **88**: `||` Kleene, `+` оба; так и в v2)
- Чистый путь в **`!expr`**: `$Values.name` / `$Values.x? ?? false` (решение **84**: нет вычисления, нужен `!ref`; совпадение тегов — v2)
- Запрет **`?.` в `!expr` без `??`**: `replicas?: !expr "$Values.n? + 1"` законно; обязательный ключ ловит **пара** (решение **98**)
- Один тег вместо **`!ref` + `!expr`**: операторы на `!ref` или путь как весь `!expr` (решение **90**). Синтаксис обоих тегов в v2 не менять.
- Константа как весь **`!expr`**: `"true"` / `"1"` / `"[80, 443]"` / `"{'k': 1}"` без оператора, dyn-index и `$` (решение **85**: нет вычисления; YAML / `!ref`)
- **`??` на `!not`**: `!not $X.y? ?? false`. В v1 ошибка (**86**). Invert optional — bind `!ref … ??` + `!not`, или `!expr "!$X.y? ?? false"`. Разрешить снова — здесь.
- Тернарник **`c ? t : f`** (не путать с knarr `?.` / `??`)
- Default-сахара **`LHS : RHS`**, **`LHS ?: RHS`**, **`LHS !?: RHS`** (канон Elvis — **`??`**)
- **`имя?: … ?? …` / `$Name?: … ?? …`** на листе `!ref` / `!expr` / coerce (решение **111**: `??` держит ключ). Не Helm «default и ключ можно опустить»
- Скрытый omit: обычный ключ + значение-omit; **`$when?:`**; **`$filter?:`**; **`$over?:`**; **`$of?:`**; **`$as?:`**; **`$key?:`**
- Пустой **`имя: !foreach`** / **`$Name: !foreach`** как omit (нужен **`имя?:`** / **`$Name?:`**; пустой результат на `?:` — только с **`$yield?:`**, решения **60**, **97**, **100**, **108**)
- **`$Name?: !join`** + живой `$over: []` как omit bind (решение **110**: результат `""`). То же для пустого **`!split`** (`[]`) и **`!sha256`** от `""` (хэш)
- **`$Name?: !$T`**; **`$yield?: !$T`**; `tls: !ref $Tls?` / `tls?: !ref $Tls` / `$Tls.cert` при optional bind (нужен `$Tls?` везде в `!ref`/`!expr`)
- **`$yield: !ref $S.x?`** / **`$yield?: !ref $S.x`** (пара 25/51/52: omit-способное значение ↔ `$yield?:`)
- **`spec:`** со всеми детьми `?:`; **`spec?:`** с обязательным ребёнком (решение 32: все дети `?:` ↔ родитель `?:`)
- Тег **`!applyDefaults`** и ключ **`$type`** (канон — `!typedef` + **`!$Type`**)
- **`!policy` как режим missing `!ref`**: soft не прячет дыры в путях; документ `!policy` без ни одного **`!$Type`** — ошибка (решение 27B)
- Тег типа **без `$`**: `!ValuesType` — ошибка; нужен **`!$ValuesType`**. `!$T` не синоним `!ref $T`
- Вложенный **`!$U`** на поле bind / в `!emit` / на `$then` (v1: корень `$Name` или **`$yield: !$T`**, решения **34–35**)
- Тег **`!walk`** (решение **49**: нет навсегда; пути — `!ref` / `!expr` / `!foreach`)
- `$Name: !emit` / **`$Name: !bind`** / **`$Name: !emit-foreach`** / **`$Name: !validation`** (все — только документ)
- Host **`fail` / `required`** в `!expr`; **`$fail` и `$warning` вместе** на `!validation`; правило-sequence `!match`
- Ключ **`$items`** на `!emit`; splat **`!emit-foreach`** без `$as`/`$yield`; документ с тегом **`!foreach`** (N манифестов — `!emit-foreach`)
- **`$filter?:` / `$when?:` / `$if?:`**; `$when` / `$filter` / `$if` с omit из `?.` без `??` (решение **112**: нужен `?? false` или `!empty` / `!not-empty`; omit ≠ false)
- Схлопывать пустой sequence **`[]`** как omit / как пустой `{}` (решение **94**: `[]` — значение; empty — **`!empty` / `!not-empty`**). Исключение — **`имя?: !foreach` + `$yield?:`** (решение **108**)
- Служебный ключ **`$yield?`** без `:` (решение **108**: только **`$yield?:`**)
- **`имя?: !foreach`** / **`$Name?: !foreach` + `?? []`/`{}` + `$yield:`**; **`$Name?: !join`** + **`?? []`** на `$over`; **`$Name?: !split`** / **`$Name?: !sha256`** + **`?? ''`** на `$of`; **`$Name?: !concat`** / **`$Name?: !format`** + все дети с `??` / без omit-пути; **`$Name?: !merge`** + литерал / не все дети omit; omit ключа / bind из пустого результата при **`$yield:`** и живом `$over`; пропуск omit-сиблинга у `!concat`; сужать **`!concat` / `!format`** до «все дети omit» как у merge (решения **97**, **99**, **100**, **102**, **103**, **104**, **105**, **106**, **76**, **108**, **109**: `?:` + `?? []` + `$yield?:` — ок; без `$yield?:` — ошибка)
- Ключ **`$over?:`** (решение **53**; omit значения `$over` у foreach — **97**, у `!join` — **99**). Ключ **`$of?:`** (решения **102**, **103**). **`$over` на `!split` / `!sha256`** (решения **101**, **103**: канон `$of`)
- Второй ключ коллекции **`$map` / `$seq`** у `!foreach` (решение **113**: один `$over`). **`!join` `$over` mapping** / **`?? {}`** (решение **114**: только sequence строк)
- **`$prefix?:` / `$suffix?:`**; omit / `""` у написанных `$prefix`/`$suffix`; эти ключи на **`!split` / `!format` / `!concat`** (решение **115**)
- Голый mapping-документ `$Name:` без **`!bind`** (решение 29B)
- **Значение** `null` в языке и **`null` в stdout** (решение **130**: `a: null` ≡ нет ключа; отсутствие = omit / `?` / `$else: ""`)
- **`$key`** при `$over`-sequence; **`$index`** у `!foreach` / `!emit-foreach` (не в v1)
- `$yield` не mapping у **`!emit-foreach`**; flatten sequence-`$yield` в родителя
- Теги knarr с handle **`!!`** (`!!ref`, `!!bind`, `!!$T`, `!!emit`, …) — канон только локальный **`!`** (решение **54**). Не `%TAG` knarr
- В документе knarr **любой `!!`**, включая ядро YAML **`!!str` / `!!int` / `!!bool` / `!!null`** (решение **55**). В **`!read`** core `!!str`/`!!int` можно; **`!!null`** = YAML null ≡ нет ключа (**130**)
- Тег **`!each`** (канон — `!foreach`)
- Тег **`!path`** (решение **48**: не-Ident в `!ref` `['ключ']` или в `!expr`)
- Host fn **`toYaml` / `fromYaml`**, **`files.get` / `files.glob`** (YAML-дерево — `!read`; knarr-файлы — `!import`; сырой текст не читаем). **`!to-yaml-str` / `!sha256-yaml` — v2** (71)
- Host **`toJson` / `fromJson`**; pretty JSON; `SetEscapeHTML(false)`; JSON-ключи first-seen (канон **71** = Helm `toJson`)
- Multi-doc / dual-type `!read` по числу `---` (решение **69**; `!read-docs` — v2)
- Якоря **`&` / `*` / `<<` в документе knarr** (решение **70**; в `!read` можно)
- Host **`concat` / `append` / `prepend`**; **`+` на sequence**; **`+` на string** (решение **75**); **`args: !expr "concat(…)"`**; **`args: !concat`** (канон — **`!concat` в `!bind`**, решение **59**)
- Host **`join` / `split`**; **`!join`/`!split` в `!emit`** (канон — bind, решение **62**)
- Host **`printf`**; **`!printf`** (не синоним, **78**); **`!format` в `!emit` / `$yield`**; голые `$X` в sequence `!format`; **`+` строк в `!expr`**; **`%n` `%p` `%T` `%w`**; синтаксис Rust `{}` / `{:.2}`; Go-вставка `%!s(int=…)` вместо ошибки (решение **80**: диалект Go `fmt` на скалярах; mismatch — ошибка)
- Host **`b64enc` / `b64dec` / `len`**; mapping `$of` у этих тегов; **`$when: !len`** (решение **76**: tagged scalar как `!int`; `$N?: !len $X.y?`)
- Host **`sha256sum`**; **`!sha256` в `!emit`**; тихий хэш mapping без JSON (решение **63**; дерево — **`!sha256-json`**, **71**)
- Host **`merge`**; **`!merge` в `!emit`**; **`!merge-overwrite`** / тихий overwrite вложенного map (решение **64**)
- Host **`until` / `untilStep` / `seq`**; **`!range` в `$over` / `!emit`**; один `$to` с двумя смыслами; нет ключа **`$from`** → `0`; omit написанного **`$step`** → `1`; **`$Name?: !range`** без omit `$from`/`$to`/`$until` (решения **65**, **107**: `$from` явный; ключа `$step` нет → `1`; `?:` как concat)
- Host **`empty`**; тег **`!nempty`**; **`!not` вокруг `!empty`/`!and`/`!or`** (решение **66**: `!empty` / `!not-empty` / `!and` / `!or`)
- Host **`int` / `str` / `bool` / `float64`**; `string()`/`int()` в `!expr`; **`!!int`/`!!bool` как coerce**; `1`/`yes` → bool; **`!int` от float** (усечение); **`.nan`/`.inf`**; тип Quantity/`500m` как число (решение **67**, **81**: `!float`; Inf ошибка)
- Host **`list` / `dict`**; YAML-вид `{a: 1}` внутри `!expr`; `[a, b]` как concat (решение **68**)
- Host **`keys` / `values`**; теги **`!keys` / `!values`** (решение **72**: `!foreach` + `$key`)
- Host **`coalesce`**; n-ary **`??`**; **`!coalesce` по empty**; снять **`!pick`** в пользу стопки `??` или `||`; запрет 2-элементного **`!pick`** (только ≥3); warning на 2-way `!pick`; **`$Name?: !pick` / `имя?: !pick`** (решения **73**, **91**, **93**, **96**, **105**: `!pick` всегда значение)
- Host **`last`**; тег **`!last`**; **`$Xs[-1]`** / формула в `[ ]` (решение **74**: `$I` + `$Xs[$I]`)
- Теги **`!define` / `!include`**; **`!import` на значении** (`labels: !import x.yaml`)
- Тег **`!with`**, ключ **`$with`**, скоуп как Helm `.` внутри блока (решение **45**: `ключ?: !ref $X.obj?`)
- Knarr-теги внутри файла **`!read`**; голый YAML через **`!import`** (нужен тег документа)

## Input overlays
- CLI `-f` / `--set` / `--values` поверх файлов
- Remote `!import` / `!read` (HTTP, OCI, git URL)
- stdin как вход (`knarr render -`, пайпы) — не в v1; вывод без `-o` по-прежнему stdout
- несколько positional на `knarr render` — не в v1 (см. [CLI_TODO_v2.md](CLI_TODO_v2.md))

## Cluster ops
- `kubectl apply`, wait, health checks
- CRD install orchestration

## Packaging ecosystem (пока)
- Публичный chart registry для knarr-пакетов
- Плагины сторонних тегов в v1

Если фича похожа на одно из выше — сначала проверить SPEC и этот файл.
