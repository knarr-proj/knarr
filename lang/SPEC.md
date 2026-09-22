# Knarr — норматив языка (v1)

Авторское описание: корневой [README.md](../README.md) и [docs/](../docs/README.md).  
Q&A 1–159: [DECISIONS.md](DECISIONS.md). Запреты: [NONGOALS.md](NONGOALS.md). Язык: [SPEC_TODO.md](SPEC_TODO.md) / [SPEC_TODO_v2.md](SPEC_TODO_v2.md). CLI: [CLI_TODO.md](CLI_TODO.md) / [CLI_TODO_v2.md](CLI_TODO_v2.md).

Инвентарь языка v1 **закрыт**. Носитель YAML 1.2; нет Go `{{ }}`; нет CLI `-f` / `--set`. Knarr делает только то, что явно записано: нет скрытого omit, нет неявного default, нет **значения** `null` (`a: null` ≡ нет ключа, решение **130**).

---

## 1. Цель продукта

Декларативная трансформация **любого YAML**: значения, типы (`!typedef` / `!$Type`), `$Name`, доступ `!ref` / `!not` (путь, `?.`, **`??`**), формулы `!expr` (операторы / dyn-index / `$` в list-map; **`??` на весь скаляр — 83**; не чистый путь и не константа — **84–85**) → multi-document YAML на stdout.

---

## 2. Зафиксированные решения (Q&A)

Таблица и обоснования — [DECISIONS.md](DECISIONS.md). Не пересматривать без явного запроса.

---

## 3. Модель языка

### 3.1 Носитель

- YAML 1.2, **несколько документов** в одном потоке/файле. **Кавычки tagged scalar (89):** `!ref` / `!expr` / `!not` / coerce — plain или quoted **как YAML 1.2**. Нет исключения knarr «не в начале строки». `/` без кавычек ок.
- Порядок документов **после** раскрытия **`!import`**: опционально **`!policy`** (только первым), затем опционально **`!typedef`**, затем **`!bind`**, **`!validation`**, **`!emit`**, **`!emit?`**, **`!emit-foreach`**, **`!emit-foreach?`**, **`!emit-range`**, **`!emit-range?`** (вперемешку)
- Локальные теги языка (`!policy`, `!typedef`, `!bind`, `!ref`, `!foreach`, `!emit`, **`!emit?`**, `!emit-foreach`, **`!emit-foreach?`**, **`!emit-range`**, **`!emit-range?`**, `!import`, `!read`, `!not`, `!expr`, `!match`, **`!concat`**, **`!join`**, **`!split`**, **`!format`**, **`!b64enc`**, **`!b64dec`**, **`!len`**, **`!sha256`**, **`!merge`**, **`!range`**, **`!is-empty`**, **`!is-not-empty`**, **`!skip-empty`**, **`!and`**, **`!or`**, **`!int`**, **`!str`**, **`!bool`**, **`!float`**, **`!to-json-str`**, **`!from-json-str`**, **`!sha256-json`**, **`!pick`**, **`!validation`**); типы — **`!$Type`** (решение 28D). **Только handle `!` (54, 55):** в документе knarr **любой `!!` — ошибка** (`!!ref` / `!!str` / `!!null` в т.ч.).
- Непомеченный документ — **ошибка** (нужен `!bind` / `!emit` / **`!emit?`** / `!emit-foreach` / **`!emit-foreach?`** / **`!emit-range`** / **`!emit-range?`** / **`!import`** / **`!validation`**, либо prelude `!policy`/`!typedef`)
- Документы и поля с ролью «мета» / именованные значения — через **`$…`**
- **Служебные ключи mapping (решение 77):** на knarr-meta (`!foreach`, `!join`, `!match`, `$when` у `!emit`, …) каждый служебный ключ **обязан** начинаться с `$`. Голый ident (`when:`, `over:`, `sep:`, `of:`, `if:`) — **ошибка**, не синоним `$when` / `$over` / …. Не относится к ключам K8s в теле `!emit` / `$yield` (`apiVersion:`). Sequence-теги (`!concat` / `!format` / `!pick` / …) и scalar (`!ref` / `!len`) именованных служебных полей не имеют. Новый служебный ключ — тоже только `$…`.
- **Якоря (решение 70):** в документе knarr (`!bind` / `!emit` / `!import` / …) `&anchor` / `*alias` / merge-key **`<<`** — **ошибка**. Копия — `!ref` / `!merge`. Файл **`!read`**: якоря YAML 1.2 и `<<:` допустимы; в граф knarr попадает **уже дерево** (алиасов нет). Цикл якорей — ошибка.
- **Числа (81):** YAML `1` — int; `0.5` / `1.0` / `1e-3` — float. `.nan` / `.inf` / `-.inf` — ошибка (в knarr и в `!read`).
- **Явность (решения 24–25, 32, 51, 52, 53, 60, 73, **94**, **97**, **99**, **100**, **102**, **103**, **104**, **105**, **106**, **107**, **108**, **110**, **111**):** нет скрытого поведения. Omit листа — **`?:`** **и** `?.` / `$Name?`. Optional mapping: все дети `?:` ↔ родитель `?:`; пустой `{}` → omit. **`[]` — значение (94)**, не схлопывание. **`$yield?:`** + omit → нет элемента цикла, не дырка. **`!foreach` (97, 100, **108**, **109**):** `имя?:` / **`$Name?:`** ↔ `$over` omit-способный **или** **`$yield?:`**. Omit `$over` → omit ключа / bind. **`имя?:` + `$yield?:`** + печатать нечего → omit ключа / bind. **`имя?:` + `$yield?:` + `?? []`/`{}` на `$over` — ок (109).** `имя?:` + `$yield:` + живой `$over` / `?? []` → `[]` / ошибка пары. `имя:` / `$Name:` ↔ `$over` всегда значение (`?? []` / обязательный путь); пустой результат → `[]`. **`!join` (99, **110**, **114**, **115**, **147**):** `$over` только sequence (не map / не `?? {}`); элемент — `!str`; опц. `$filter`↔`$as`. Опц. `$prefix`/`$suffix` как `$sep` (нет omit / `""`). `$Name?:` ↔ omit `$over` → omit bind; `$Name:` ↔ `$over` значение; живой пустой `$over` → `""` или обёртка. **`!split` (102) / `!sha256` (103):** `$Name?:` ↔ omit `$of` → omit bind; `$Name:` ↔ `$of` значение; пусто у split → `[]`, у sha256 → хэш `""`. **`!concat` (104):** `$Name?:` ↔ omit-ребёнок → omit bind; `$Name:` ↔ все дети значения. **`!format` (149):** то же на **`имя?:` / `$yield?:`**; литерал рядом ок (**106**, не сужать до «все дети»). **`!merge` (105):** `$Name?:` ↔ **все** дети omit-способны; живые сливают; все omit → omit bind. **`!range` (107, **144**):** `$from` явный; ключа `$step` нет → `1`; обязательны `$as` и `$yield`/`$yield?:`; **`$Name?:`** ↔ omit границы или `$yield?:` (как foreach). **`!pick` всегда значение — `$Name?: !pick` ошибка.** **`имя?: … ?? …` на листе — ошибка (111).** **`$over?:` / `$of?:` нет.** Default omit — **`??`** (бинарный) или **`!pick`**. Иначе ошибка.

### 3.2 Имена и `$`

- Пользовательские bindings: **`$Name`** (Capital после `$`)
- В **`!expr`** те же `$Name` (решение 21 / P2); после лексера ident без `$`
- Служебные ключи: `$when`, `$if`, `$yield`, **`$yield?:`**, `$else-yield`, `$over`, `$as`, `$key`, `$filter`, **`$rules`**, **`$fail`**, **`$warning`**, **`$sep`**, **`$prefix`**, **`$suffix`**, **`$of`**, **`$from`**, **`$to`**, **`$until`**, **`$step`**. **Только с `$` (77).**
- **Зарезервированные BindingName (решение 31):** `$Release`, `$Chart`, `$Capabilities`. Объявление в `!bind`/`!typedef`, `$as`, путь в `!ref`/`!expr`/`!not`, тег `!$Release` — **ошибка**. Инжекта нет. Helm `.Release`/`.Chart`/`.Capabilities` в v1 **не реализуются**. `$Rel` / `$Values` — обычные bind.

### 3.2.1 Bind — документ `!bind`

**`!bind` (v1, закрыто; решение 29B):** тег на **документе**, mapping. Ключи — один или несколько **`$Name`**. Несколько документов `!bind` можно; их можно чередовать с `!emit` / **`!emit?`** / `!emit-foreach` / **`!emit-foreach?`** / **`!emit-range`** / **`!emit-range?`**. Не больше ограничений позиции, чем у emit (после `!policy` / `!typedef`).

```yaml
---
!bind
$Values: !$T
  name: api
```

```yaml
---
!bind
$Tls?: !ref $Values.tls?
---
!emit
spec:
  tls?: !ref $Tls?
  host?: !ref $Tls?.cert
```

- `$Name: !bind` — ошибка (как `$Name: !emit` / `$Name: !emit-foreach` / **`$Name: !emit-foreach?`** / **`$Name: !emit-range`** / **`$Name: !emit-range?`** / **`$Name: !validation`**).
- Ключ — **`BindingName`** или **`$Name?:`** (решение **51**). Пустой `!bind` / иной ключ — ошибка.
- **`$Name?:` (51, **120**):** имя **в графе** (форс как обычный bind). Значение **обязано** быть omit-способным (`?.` / `$Other?` / `$Other?.…`). Во **всех** `!ref` / `!expr` / `!not` / **`!is-empty` / `!is-not-empty` / `!skip-empty` / `!int` / `!str` / `!bool` / `!float` / `!to-json-str` / `!from-json-str` / `!sha256-json` / `!b64enc` / `!b64dec` / `!len` / `!format`** это имя пишется только как **`$Name?`** (маркер omit), дальше обычный trail: `!ref $Tls?`, `!ref $Tls.cert?`, `!expr "$Tls.host? == $H"`, **`!len $X.y?`**. Голый `$Tls` / `$Tls.cert` — ошибка (**проверять**). Если значение содержит `$Name?` / omit-путь, ключ YAML **обязан** `?:` (`tls?: !ref $Tls?`, **`$N?: !len $X.y?`**). `имя: !ref $Tls?` / `имя?: !ref $Tls` / **`$N: !len $X.y?`** — ошибка. Обязательный bind → `$Name?` в ссылке — ошибка (**проверять**).
- **`$Name?: !$T`** — ошибка (v1). Объявить и `$Name:` и `$Name?:` — дубликат.
- Ключ **`$Release` / `$Chart` / `$Capabilities`** — ошибка (решение 31), в т.ч. `$Release?:`.
- Значения — обычные узлы knarr (`!$Type`, `!ref`, `!expr`, `!foreach`, `!read`, `!match`, **`!concat` (59)**, **`!join`/`!split` (62)**, **`!format` (75, `$Name?:` — 76, **149**)**, **`!b64enc`/`!b64dec`/`!len` (76)**, **`!sha256` (63)**, **`!merge` (64)**, **`!range` (65)**, **`!is-empty`/`!is-not-empty`/`!and`/`!or` (66)**, **`!int`/`!str`/`!bool` (67)**, **`!float` (81)**, **`!to-json-str`/`!from-json-str`/`!sha256-json` (71)**, **`!pick` (73)**, литералы). **`!import` не значение** (решение **44**). **`!range` (107, **144**, **146**):** корень `$Name` / **`$Name?:`** или поле как **`!foreach`**. Пара с `$from`/`$to`/`$until` и/или **`$yield?:`**. Обязательны **`$as`** и **`$yield`/`$yield?:`**. **`!foreach` (97, 100, **108**):** корень `$Name` или **`$Name?:`** (пара с `$over` и/или **`$yield?:`**). **`!join` (99):** корень `$Name` или **`$Name?:`** (пара с `$over`). **`!split` (102) / `!sha256` (103):** корень `$Name` или **`$Name?:`** (пара с `$of`). **`!concat` (104, **150**):** корень или поле как **`!foreach`**. **`!format` (149):** корень или поле как **`!str`**. **`!join` / `!merge` (150):** то же. **`!merge` (105):** корень `$Name` или **`$Name?:`** (все дети omit-способны). На **`$Name?:`** литерал / mapping без omit-пути — ошибка. **`!is-empty`/`!is-not-empty`/`!and`/`!or`** всегда bool, не omit: `$Name?:` с ними — ошибка. **`!skip-empty` (140):** `$Name?: !skip-empty` ок; `$Name: !skip-empty` — ошибка. **`!pick`** всегда значение: `$Name?: !pick` — ошибка. **`!int`/`!str`/`!bool`/`!float`/`!to-json-str`/`!from-json-str`/`!sha256-json`/`!b64enc`/`!b64dec`/`!len`** omit-способны (`?.` / `$Name?`). **`$N?: !len $X.y?`** / **`$Fmt?: !format`** с omit-детьми — ок (**76**).
- `!bind` не в stdout. Имена из всех `!bind` + ключи `!typedef` — глобальный граф; дубликат `$Name` — ошибка.

### 3.2.2 Зарезервированные `$Release` / `$Chart` / `$Capabilities`

**Закрыто (решение 31, снимает 30 E1; Comparison — 131):** в v1 эти три `BindingName` **зарезервированы**. Не bind автора, не инжект, не host `release.*`. Проблему Helm-объектов **в v1 не решаем**. В guide Helm **`.Release.Name`** — **Impossible**, не пара с `$Rel`.

```yaml
# BAD
---
!bind
$Release: { name: myrel }
$Chart: { name: demo }
$Capabilities: { kubeVersion: "1.29" }
```

После v1 имена остаются за будущей семантикой Helm-like объектов.

`--namespace` / `--release-name` на CLI — нет.

### 3.2.3 Склейка списков — `!concat`

**`!concat` (решения 59, **104**, **150**):** tagged **sequence**. Значение как **`!foreach` / `!format`**: bind или поле. Helm `concat` в поле манифеста.

```yaml
---
!bind
$Base:
  - --verbose
$Args: !concat
  - !ref $Base
  - !ref $Values.extraArgs
$ArgsOpt?: !concat
  - !ref $Base
  - !ref $Values.extraArgs?
---
!emit
spec:
  args: !concat
    - !ref $Base
    - !ref $Values.extraArgs
  argsOpt?: !ref $ArgsOpt?
```

- Документ `!concat` / вложенный **`!concat`** / элемент чужого sequence — **ошибка**. Целое `$yield` у `!emit` — mapping, не `!concat`. **`$yield`** у `!emit-foreach` / `!emit-range` — mapping, не `!concat`.
- Носитель — **sequence** (≥0 элементов). Mapping `!concat` — ошибка.
- Каждый ребёнок после оценки — **sequence**. Склейка **по порядку** (17). Пусто / все `[]` → `[]` (значение, не omit).
- Ребёнок: литерал sequence, **`!ref`**, **`!foreach`**, **`!expr`** (результат sequence). Не scalar/mapping. Вложенный **`!concat`** — ошибка (брать сиблингами).
- **Пара (104)** — тот же закон, что у `!format` / `!ref` / `??`:
  - **`$Name?: !concat` / `имя?: !concat` / `$yield?: !concat`** ↔ есть omit-способный ребёнок (`?.` / `$Name?`, **без** `?? []`). Любой omit-ребёнок → **omit всего** (bind / ключ / итерация).
  - **`$Name: !concat` / `имя: !concat` / `$yield: !concat`** ↔ все дети значения (обязательный путь или `?? []`).
  - `?:` без omit-пути / все дети с `?? []` / ключ без `?:` + omit-ребёнок — **ошибка пары**.
- Второй тег `!$T` — ошибка. Пустой ребёнок `[]` на **`$Name?:`** остаётся в склейке. Omit bind — **только omit ребёнка**.
- **`!expr`:** нет host `concat` / `append` / `prepend`. Оператор **`+`**: int+int → int; если есть float — оба как float, результат float (**81**). string / seq — ошибка (`!format` / `!join` / `!concat`).
- Сплайс `!ref` списка как элемента голого YAML-sequence **без** `!concat` — вложенный list (43), не склейка.

### 3.2.4 Валидация — `!validation`

**`!validation` (решение 61):** тег на **документе**, mapping. Не значение (`$Name: !validation` — ошибка). Не эмитит в stdout.

Ровно ключи **`$rules`** и **один** из **`$fail`** / **`$warning`**. Оба или ни одного — ошибка. Других ключей нет. **`$fail?:`** / **`$warning?:`** / **`$rules?:`** — ошибка.

```yaml
---
!bind
$Values: !read values.yaml
$Legacy: !ref $Values.legacy? ?? false
---
!validation
$rules:
  - !ref $Values.name?
  - !not $Legacy
$fail: "задайте name, уберите legacy"
---
!emit
metadata:
  name: !ref $Values.name
```

```yaml
---
!bind
$Values: !read values.yaml
$Legacy: !ref $Values.legacy? ?? false
$Warn: !format
  - "legacy is set: %s"
  - !ref $Values.name
---
!validation
$rules:
  - !not $Legacy
$warning: !ref $Warn
```

- **`$rules`:** sequence (≥1). Элемент — `!expr` / `!ref` / `!not` / **`!is-empty` / `!is-not-empty` / `!and` / `!or` (66)**. Пустой список / не sequence — ошибка. **`$rules` — утверждения: результат должен быть истинным** (must-true). Required values: **`!is-not-empty`**, не `!is-empty` (`!is-empty` как правило = «должно быть пусто»).
- Результат элемента: **omit** или **`false`** — нарушение; **`true`** или любое другое конкретное значение (string / seq / map / int) — ок (presence). Не bool-закон на непустую строку: `""` — ок. Смесь типов в списке можно.
- Первое нарушение: сообщение из `$fail` / `$warning` (после оценки — **string**; `!expr` можно). Не string / omit сообщения — ошибка. Дальнейшие правила этого документа **не считают**.
- **`$fail`:** сообщение в **stderr** (+ `\n`); **stdout пустой**; **exit 1**; остальные `!validation` / `!emit` **не считают**.
- **`$warning`:** сообщение в **stderr** (+ `\n`); emit **продолжается**; если больше нет ошибок — **exit 0**. Несколько `$warning`-документов — все сработавшие сообщения, по порядку файла.
- Оценка: **после** всего графа `!bind`, **до** `!emit` / **`!emit?`** / `!emit-foreach` / **`!emit-foreach?`** / **`!emit-range`** / **`!emit-range?`**. Порядок документов `!validation` — порядок файла (после flatten `!import`). Forward-ref bind виден.
- Несколько `!validation` можно. Документ без нарушения — нет вывода.

### 3.2.5 Join / split — `!join` / `!split`

**`!join` / `!split` (решения 62, **99**, **101**, **102**, **110**, **115**, **147**, **150**, **151**):** tagged **mapping**. Оба — значение как **`!format`**. Нет host `join`/`split` в `!expr`.

```yaml
---
!bind
$Csv: !join
  $sep: ","
  $over: !ref $Values.hosts
$CsvOpt?: !join
  $sep: ","
  $over: !ref $Values.hosts?
$Parts: !split
  $sep: ","
  $of: !ref $Values.csv
$PartsOpt?: !split
  $sep: ","
  $of: !ref $Values.csv?
---
!emit
metadata:
  annotations:
    hosts: !join
      $sep: ","
      $over: !ref $Values.hosts
    hostsOpt?: !ref $CsvOpt?
  parts: !split
    $sep: ","
    $of: !ref $Values.csv
```

**`!join`:** `$sep` + `$over`; опц. **`$prefix`** / **`$suffix` (115)**. Не цикл (**147**): нет `$yield` / `$when` / `$key`. Опц. **`$filter`** + **`$as`** (пара).

- **`$sep`:** string, **непустой**. Omit / `""` / не string — ошибка.
- **`$prefix` / `$suffix` (115):** ключа нет — нет обёртки с этой стороны. Ключ есть → как `$sep`: string, **непустой**; omit / `""` / не string — ошибка. **`$prefix?:` / `$suffix?:` нет.** В пару `$Name?:` не входят.
- **`$over` (114, **147**):** sequence. Mapping / **`?? {}`** — ошибка сорта. Ключи map — `!foreach` + `$yield`, потом join.
- **Элемент (147):** перед склейкой как **`!str`**: string как есть; int / bool / float — та же запись; seq / map — ошибка. **`$filter`** видит **исходный** элемент (`$as`), потом `!str`.
- **`$filter` / `$as` (147):** оба ключа или ни одного. **`$as`:** `$Name` элемента (как у `!foreach` на sequence). **`$as?:` нет.** **`$filter`:** bool; omit — ошибка (**112**); **`$filter?:` нет.** Ложь → элемент не клеят. `$as` не виден в `$sep` / `$prefix` / `$suffix`.
- Результат = (`$prefix` если есть) + join(`$over`, `$sep`) + (`$suffix` если есть). Пустой `$over` (`[]`) → только обёртка (напр. `$prefix: "["` + `$suffix: "]"` → `"[]"`).
- **Пара (99)** — тот же закон, что у `!foreach` / `!ref` / `??`:
  - **`$Name?: !join` / `имя?: !join` / `$yield?: !join`** ↔ `$over` omit-способный (`?.` / `$Name?`, **без** `?? []`). Omit `$over` → **omit bind / ключа / итерации**.
  - **`$Name: !join` / `имя: !join` / `$yield: !join`** ↔ `$over` всегда значение (обязательный путь или `?? []`). Пустой `$over` без обёртки → **`""`**; с `$prefix`/`$suffix` → только обёртка (**115**).
  - `?:` + `$over` с `?? []` / ключ без `?:` + omit-способный `$over` без `??` — **ошибка пары**.
- Результат — string (или omit). Второй тег `!$T` — ошибка. **`$over?:` / `$prefix?:` / `$suffix?:` / `$as?:` / `$filter?:` нет.**
- Пустой `$over` (`[]` в values) на **`?:`** → строка (пустая или обёртка), не omit (**110**, **115**). Omit — **только omit `$over`**. Нет сахара «пустая склейка → нет ключа».
- Документ `!join` / целое `$yield` у `!emit` / `$yield` у `!emit-foreach` — ошибка (не mapping-документ).

**`!split`:** ровно `$sep` + `$of`. **`$over` на split — ошибка (101)**, не синоним.

- **`$sep`:** как у join.
- **`$of`:** string. Не string / seq / map — ошибка.
- **Пара (102)** — тот же закон, что у `!join` / `!len` / `!ref` / `??`:
  - **`$Name?: !split` / `имя?: !split` / `$yield?: !split`** ↔ `$of` omit-способный (`?.` / `$Name?`, **без** `?? ''`). Omit `$of` → **omit**.
  - **`$Name: !split` / `имя: !split` / `$yield: !split`** ↔ `$of` всегда значение (обязательный путь или `?? ''`). Пустой `$of` (`""`) → **`[]`**.
  - `?:` + `$of` с `?? ''` / ключ без `?:` + omit-способный `$of` без `??` — **ошибка пары**.
- Результат — sequence строк (или omit bind). Куски как Go `strings.Split` (пустые между сепараторами **сохраняются**: `"a,,b"` + `","` → `[a, "", b]`). Второй тег `!$T` — ошибка. **`$of?:` нет.**
- Пустой `$of` (`""` в values) на **`$Name?:`** → `$Name: []`, не omit. Omit bind — **только omit `$of`**.

Документ `!join` / `!split` — ошибка. Целое `$yield` у `!emit` — mapping. **`$yield`** у `!emit-foreach` / `!emit-range` — mapping, не `!split`.

### 3.2.6 Хэш — `!sha256`

**`!sha256` (решения 63, **103**, **151**):** tagged **mapping**. Значение как **`!format`**. Ровно ключ **`$of`**. **`$over` на sha256 — ошибка.**

```yaml
---
!bind
$Sum: !sha256
  $of: !ref $Values.password
$SumOpt?: !sha256
  $of: !ref $Values.password?
---
!emit
metadata:
  annotations:
    checksum/secret: !sha256
      $of: !ref $Values.password
    checksum/secretOpt?: !ref $SumOpt?
```

- **`$of`:** string после оценки (в т.ч. `""`; можно **`!to-json-str`**). Mapping/seq/int/bool — ошибка. Нет тихого `toYaml`. Хэш дерева — **`!sha256-json` (71)** или `$of: !to-json-str …`.
- **Пара (103)** — тот же закон, что у `!split` / `!len` / `!ref` / `??`:
  - **`$Name?: !sha256` / `имя?: !sha256` / `$yield?: !sha256`** ↔ `$of` omit-способный (`?.` / `$Name?`, **без** `?? ''`). Omit `$of` → **omit**.
  - **`$Name: !sha256` / `имя: !sha256` / `$yield: !sha256`** ↔ `$of` всегда значение (обязательный путь или `?? ''`). Пустой `$of` (`""`) → **хэш пустой строки**.
  - `$Name?:` + `$of` с `?? ''` / `$Name:` + omit-способный `$of` без `??` — **ошибка пары**.
- Результат — 64 символа **hex lowercase**, SHA-256 от **UTF-8 байт** строки (без добавленного `\n`) — или omit. **Тождественно Helm `sha256sum`** той же строки. Второй тег `!$T` / документ `!sha256` — ошибка. Целое `$yield` у `!emit` / `$yield` у `!emit-foreach` — не `!sha256` (не mapping). **`$of?:` нет.**
- Пустой `$of` (`""` в values) на **`$Name?:`** → живой hex, не omit. Omit bind — **только omit `$of`**.
- Host **`sha256sum`** в `!expr` — ошибка.

### 3.2.7 Слияние mapping — `!merge`

**`!merge` (решения 64, **105**, **150**):** tagged **sequence**. Значение как **`!format`**. Helm `merge` в поле.

```yaml
---
!bind
$Cfg: !merge
  - !ref $Defaults
  - !ref $Values.config
$Res?: !merge
  - !ref $Values.requests?
  - !ref $Values.limits?
---
!emit
spec: !merge
  - !ref $Defaults
  - !ref $Values.config
resources?: !ref $Res?
```

- Документ `!merge` / вложенный **`!merge`** / элемент чужого sequence — **ошибка**. Целое `$yield` у `!emit` — YAML-mapping, не тег. **`$yield`** у `!emit-foreach` / `!emit-range` — mapping: **`!merge` ок**.
- Носитель — **sequence** (≥0). Mapping `!merge` — ошибка. Пустой `[]` на **`$Name:`** → `{}`.
- Каждый **живой** ребёнок после оценки — **mapping**. Scalar/seq — ошибка. Вложенный **`!merge`** — ошибка (брать сиблингами).
- **Пара (105)** — как дерево `?:` (все дети optional ↔ родитель optional), не как `!concat` (один omit убивает всё):
  - **`$Name?: !merge` / `имя?: !merge` / `$yield?: !merge`** ↔ **все** дети omit-способны (`?.` / `$Name?`, **без** `?? {}`). Результат = merge **живых**. Все omit → **omit**.
  - Литерал / обязательный путь на `?:` — **ошибка пары** (результат всегда mapping).
  - **`$Name: !merge` / `имя: !merge` / `$yield: !merge`** ↔ все дети значения (`?? {}` или обязательный путь).
  - `?:` + `?? {}` на ребёнке / ключ без `?:` + omit-ребёнок — **ошибка пары**.
- Живой ребёнок `{}` на **`$Name?:`** → `$Name: {}`, не omit. Omit bind — **только все дети omit**.
- **Глубокий merge:** вложенные mapping сливаются рекурсивно. Sequence на одном пути **заменяется** целиком (не `!concat`). Scalar на одном пути — позже бьёт раньше (в т.ч. int vs string).
- **Конфликт типов:** mapping vs не-mapping (seq/scalar) на одном пути — ошибка. Нет тихого overwrite вложенного map целиком (`mergeOverwrite` / `!merge-overwrite` — не v1).
- Порядок ключей результата: **first-seen** (ключ базы, затем новые ключи следующих детей в их порядке).
- Второй тег `!$T` — ошибка. Host **`merge`** в `!expr` — ошибка.

### 3.2.8 Числовой range — `!range` / документ `!emit-range`

**`!range` (решения 65, **107**, **144**, **146**):** tagged **mapping**. Цикл по int-ряду: границы + тело как **`!foreach`**. Носитель как **`!foreach`**: bind **или** поле `!emit` / `$yield`. **Нет** результата «просто `[0, 1, 2]`» без **`$yield`**. Документы из ряда — **`!emit-range`** (§3.7), не документ `!range`.

```yaml
---
!bind
$Idx: !range
  $from: 0
  $until: !ref $Values.count
  $as: $I
  $yield: !ref $I
$Seq: !range
  $from: 1
  $to: !ref $Values.count
  $as: $I
  $yield: !ref $I
$IdxOpt?: !range
  $from: 0
  $until: !ref $Values.count?
  $as: $I
  $yield: !ref $I
```

`$Idx` при `count: 3` → `[0, 1, 2]`. `$Seq` → `[1, 2, 3]`. Нет `count` → нет `$IdxOpt`.

- Документ `!range` / `$over` другого цикла — **ошибка**. Поле `!emit` / `$yield` — ок (**146**), как `!foreach`.
- Обязательны **`$as`** и ровно один из **`$yield` / `$yield?:`**. Без `$yield` — ошибка (**144**). **`$over` / `$key` нет.**
- Границы: **`$from`** (слот обязателен), опц. **`$step`**, XOR **`$to`** / **`$until`**. Оба конца или ни одного — ошибка. **`$from?:` / `$to?:` / `$until?:` / `$step?:` / `$as?:` / `$when?:` / `$filter?:`** — ошибка.
- **`$from` (107):** на живом ряде — значение (литерал / обязательный путь / `?? 0`). Нет ключа — ошибка, не `0`.
- **`$step` (107):** ключа нет → **`1`**. Ключ есть → только значение. Omit написанного `$step` — ошибка, не `1`. **`$step: 0`** — ошибка.
- `$from` / `$to` / `$until` / `$step` — **int**. string/bool/float/seq/map — ошибка.
- **`$as` / `$filter` / `$yield` / `$yield?:`:** как у **`!foreach`** (в т.ч. один YAML-сорт выданных элементов; `$filter` ложь → `$yield` не считают; `$as` виден в `$filter`/`$yield`).
- **`$when` (144):** опц. bool, как у **`!emit-foreach`**. Не видит `$as`. Omit `$when` — ошибка (**112**). Ложь → границы / `$filter` / `$yield` **не считают**; результат как у **пустого** `!foreach` (`$yield:` → `[]`; `$Name?:` + `$yield?:` + печатать нечего → omit bind).
- **Пара (107, **108**, **144**, **146**)** — как `!foreach`:
  - **`$Name?: !range`** / **`имя?: !range`** ↔ хотя бы один из **`$from` / `$to` / `$until`** omit-способен (**без** `??`) **или** ключ **`$yield?:`**. `$step` в пару не входит.
  - Omit любой границы → **omit всего bind / ключа**, цикл не считают.
  - **`?:` + `$yield:`** + живые границы + пустой интервал / все `$filter` ложны → **`[]`**.
  - **`?:` + `$yield?:`** + печатать нечего → **omit bind / ключа**.
  - Все границы значения на `?:` + **`$yield:`** — **ошибка пары** (`?:` не сработает).
  - **`$Name:` / `имя:` + omit границы** — **ошибка пары**. Пустой интервал на обязательном ключе + `$yield:` → **`[]`**.
- **`$to`:** конец **включительно**. Индексы `$from: 0`, `$to: 5` → `0…5`. `$from: 5`, `$to: 5` → один индекс `5`.
- **`$until`:** конец **исключён**. `$from: 0`, `$until: 5` → `0…4`. `$from: 5`, `$until: 5` → пустой ряд.
- Знак шага не совпадает с направлением → пустой ряд, не ошибка.
- Отрицательный шаг: `$from: 5`, `$to: 0`, `$step: -1` → индексы `5…0`; с `$until: 0` → `5…1`.
- Второй тег `!$T` — ошибка. Host **`until` / `untilStep` / `seq`** в `!expr` — ошибка. Inclusive `seq 1 n` — `$from: 1` + `$to`.

**`!emit-range` (144, **148**):** тег на **документе**. Границы и `$as` / `$when` / `$filter` как у `!range`. **`!emit-range`:** только **`$yield:`** (mapping). **`!emit-range?`:** только **`$yield?:`** (mapping); omit → нет документа. Нет `$over` / `$key` / `$yield` / `$else-yield`. `$Name: !emit-range` / `$Name: !emit-range?` — ошибка. `$when` ложь / omit границы (`?.`) / пустой ряд / все `$filter` ложны / все `$yield?:` omit на **`!emit-range?`** → **ноль документов**. `$as` не в `$when`.

**Comparison Helm `range until` документов (143, **144**, **149**):** в guide сниппет с **`---`** на каждый Job = **`!emit-range`** + `name: !str $I` или **`!format`** (`printf`). Без `---` — не пара.

### 3.2.9 Приведение типов — `!int` / `!str` / `!bool` / `!float`

**Решения 67 / 81:** tagged **scalar**, тот же `RefScalar`, что у `!ref`. Eval-time coerce (Helm `int` / `toString` / `float64`), **не** YAML `!!int` / `!!bool` / `!!float` (55). Один узел — один тег. Не mapping `$of`. Документ с этими тегами — ошибка.

В **`!expr` нет host** `int()`/`string()`/`float()`. Смесь int+float в операторах — **81** (повышение), не тег. Строку `"0.5"` в формулу — сначала **`!float`**.

```yaml
---
!bind
$Port: !int $Values.port
$Label: !str $Values.replicas
$Cpu: !float $Values.cpuStr
$Name: !format
  - "%s-%d"
  - !ref $Values.env
  - !ref $Port
$CpuLabel: !format
  - "%.1f"
  - !ref $Values.cpu
---
!emit
spec:
  port: !ref $Port
  name: !ref $Name
  replicas: !str $Values.replicas
  enabled?: !bool $Values.enabled?
  cpu: !ref $Values.cpu
```

- **`!int`:** уже int — как есть. string: опциональный `-`, затем десятичные цифры (ведущие нули = десятичное, `"08"` → `8`). `""` / `"+1"` / **float** / hex / bool / seq / map — ошибка (нет усечения `1.9` → `1`).
- **`!str`:** string — как есть. int → десятичная запись (`-3` → `"-3"`). bool → `"true"` / `"false"`. **float → ≡ Go `strconv.FormatFloat(f, 'g', -1, 64)`**. seq/map — ошибка (не `toYaml`).
- **`!bool`:** уже bool — как есть. string **только** `"true"` / `"false"` (нижний регистр; не `yes`/`on`/`TRUE`/`1`). int / float — ошибка (не `1`/`1.0`→true).
- **`!float`:** уже float — как есть. **int → f64** того же числа. string — десятичная запись с опц. `.` / `e`/`E` (как Go `ParseFloat` 64). `""` / `"500m"` / `"1.2.3"` / bool / seq / map — ошибка. Inf/NaN после разбора — ошибка.
- Omit пути с `?.` / `$Name?` → **omit** (пара `?:`). Missing без `?.` — ошибка (8).
- Host **`int` / `str` / `bool` / `float64`** в `!expr` — ошибка. `!!int` / `!!bool` / `!!float` в документе knarr — ошибка (55).

### 3.2.10 JSON как строка — `!to-json-str` / `!from-json-str` / `!sha256-json`

**Решение 71 (P2):** tagged **scalar**, тот же `RefScalar`, что у `!ref`. На любом value-узле. Документ с этими тегами / второй тег на узле — ошибка. Host `toJson` / `fromJson` / `toYaml` нет. **`!to-yaml-str` / `!from-yaml-str` / `!sha256-yaml` — не v1.**

```yaml
---
!emit
metadata:
  annotations:
    checksum/config: !sha256-json $Values.config
data:
  config.json: !to-json-str $Values.config
spec:
  extra: !from-json-str $Values.extraJson
```

**Канон JSON (заморожен, ≡ Helm / sprig `toJson` = Go `encoding/json.Marshal`):** compact (нет пробелов после `:` / `,`); ключи mapping **отсортированы** (bytes, как Go); HTML-escape по умолчанию json (`&` `<` `>` → `\u0026` `\u003c` `\u003e`); UTF-8. В дереве knarr нет узла `null` (поле JSON `null` уже снято, **130**). **Float (81)** ≡ Go Marshal `float64` (shortest; `1.0` как float может стать `1`). Pretty / `SetEscapeHTML(false)` / first-seen ключи — **нет** (сломает checksum Helm). Inf/NaN в JSON — ошибка (как у Go).

- **`!to-json-str`:** bool/int/**float**/string/seq/map → string JSON. **Байт-в-байт** с Helm `toJson` на том же дереве (типы knarr ⊂ JSON). Omit с `?.` → omit.
- **`!from-json-str`:** только string. JSON object → mapping, array → seq, `true`/`false` → bool, целый number **без** `.` и экспоненты → int, number с `.` / `e`/`E` → **float**, JSON-string → string. Пробелы RFC вокруг токенов можно. `\u0026` → `&`. поле объекта **`null`** ≡ **ключа нет (130)**; **`null` в array** / дубликат ключа / не JSON / Inf — **ошибка**. Корень JSON **`null`** ≡ omit значения. Omit → omit. `1e2` → float `100.0`, не int. JSON `1` → int; YAML/knarr float `1.0` через JSON может стать int `1` (как Helm).
- **`!sha256-json`:** SHA-256 hex lowercase от UTF-8 байт `!to-json-str`. **Тождественно Helm `sha256sum (toJson .)`** и `$of: !to-json-str …` у `!sha256`. Mapping/seq можно. Omit → omit.
- В `!expr` функций нет. Хэш **`toYaml`** — не v1 (`!sha256-yaml`).

### 3.2.11 N-way omit — `!pick`

**Решения 73, **91**, **93**, **96**:** tagged **sequence**. На любом value-узле. Не Helm `coalesce` (`empty`). **`??` не меняется** (ровно один, два операнда). **Тег не снимать:** N-way не стопка `??` и не `||`. **≥2 не сужать (93):** два элемента законны; канон доков — 2-way через `??`. **Нет warning (96)** на двух элементах. **Golden (116):** 2-way `!pick` ≡ `??` на тех же операндах.

```yaml
---
!emit
metadata:
  name: !pick
    - !ref $Values.name?
    - !ref $Values.alias?
    - app
```

- ≥2 элементов. Пустой / mapping-носитель / документ `!pick` — ошибка.
- Все дети **кроме последнего** — omit-способные (`?.` / `$Name?`). Без `?.` missing — ошибка пути (8), не «взять следующего».
- **Последний** — конкретное значение (не omit). Omit последнего — ошибка.
- Результат — первое не-omit. **Всегда значение.** `$Name?: !pick` / `имя?: !pick` / `$Res?: !pick` — **ошибка** (последний ребёнок — конкретное значение; `?:` не сработает).
- Не-omit дети — **один YAML-сорт**. Смесь — ошибка. `""` / `0` / `false` — значения, не omit (не Helm empty).
- Host **`coalesce`** нет. N-ary `??` на **`!ref` / `!expr`** — ошибка (по-прежнему один `??` на весь скаляр, **83**).

### 3.2.12 Формат строки — `!format`

**Решения 75 / 78 / 80 / 76 / **149**:** tagged **sequence**. Имя тега **`!format`**. Значение как **`!str`**: bind **`$Name` / `$Name?:`**, поле `!emit` / `$yield` / `$else-yield` `!match` / `$yield` / `$yield?:`. Результат — string. Диалект fmt — **Go `fmt.Sprintf`**, не Rust `std::fmt` / `format!`. Host `printf` в `!expr` **нет**. **`+` строк нет.**

```yaml
---
!bind
$MyValue: !format
  - "%s-%s"
  - !ref $X
  - !ref $Y
$Addr: !format
  - "%s:%d"
  - !ref $Values.host
  - !ref $Port
$Quoted: !format
  - "%q"
  - !ref $Values.name
$Pad: !format
  - "%04d"
  - !ref $I
$Fmt?: !format
  - "%s-app"
  - !ref $Values.name?
---
!emit
metadata:
  name: !ref $MyValue
  padded: !format
    - "w-%04d"
    - !ref $I
```

- ≥1 элемент. Mapping-носитель / пустой `[]` / документ `!format` — ошибка.
- **Первый** ребёнок после оценки — **string** (fmt). Литерал или `!ref` / `!expr` (результат string). Не int/bool/seq/map.
- Дальше — аргументы **по порядку глаголов и `*`**. Лишние или недостающие — ошибка.
- **Канон** для скаляров knarr ≡ Go **`fmt.Sprintf`** той же форматной строки: string → Go `string`; int → `int64`; bool → `bool`; float → `float64`. Реализация — **свой интерпретатор**, не `format!`.
- Флаги / ширина / точность / `*` (ширина или точность из следующего int-аргумента) — как в Go.
- Глаголы скаляров: **`%%` `%s` `%q` `%v` `%+v` `%#v` `%t` `%d` `%b` `%c` `%o` `%O` `%x` `%X` `%U`** и float **`%f` `%F` `%e` `%E` `%g` `%G`** (операнд — **float**, **81**). `%d` от float — ошибка (не усечение).
- **`%v`:** string как `%s`, int как `%d`, bool как `%t`, float как `%g`. Это **не** замена `!str` в `!expr`; только аргумент `!format`.
- Несовпадение сорта и глагола (`%d` от string, `%s` от int) — **ошибка render**, не вставка Go `%!d(string=…)`.
- seq / mapping — ошибка любого глагола (дерево → **`!to-json-str`**, потом `%s`).
- **Запрещены:** **`%n`** (side-effect), **`%p`**, **`%T`**, **`%w`**. Синтаксис Rust (`{}` / `{:.2}` / `{:04}`) — ошибка.
- Omit ребёнка: операнд omit-способный (`?.` / `$Name?`) **и** ключ **`$Name?:` / `имя?:` / `$yield?:`** → omit bind / ключа / итерации (**76**, **149**). **`$Name:` / `имя:` / `$yield:`** + omit-ребёнок / **`?:`** без omit-пути — ошибка пары (51).
- Голый скаляр `$X` в sequence — строка `"$X"`, не bind (нужен **`!ref $X`**).
- Документ `!format` / вложенный **`!format`** / элемент чужого sequence (не своё тело тега) — ошибка. Целое `$yield` у `!emit` — mapping, не `!format`. Простой `"%s-%s"` с одним разделителем — также **`!join`**.
- **`!$T`** на том же узле — ошибка.
- Host **`printf`** в `!expr` — ошибка. **`$A + $B`**: int+int — сумма int; любой float — сумма float (**81**); string / seq — ошибка.
### 3.2.13 Base64 и длина — `!b64enc` / `!b64dec` / `!len`

**Решение 76:** tagged **scalar**, тот же `RefScalar`, что у `!ref` / `!int`. На любом value-узле. Документ / второй тег / mapping `$of` — ошибка. Host `b64enc` / `b64dec` / `len` в `!expr` **нет**.

```yaml
---
!bind
$N?: !len $Values.workers?
---
!emit
spec:
  replicas?: !ref $N?
data:
  password: !b64enc $Values.password
  token?: !b64dec $Values.tokenB64?
```

- **`!b64enc` / `!b64dec`:** аргумент и результат — **string**. Encode = UTF-8 байты, RFC 4648 без переносов. Decode: невалидный алфавит / не-UTF-8 — ошибка. Не string — ошибка. `""` → `""`.
- **`!len`:** результат **int**. Sequence — число элементов; mapping — число ключей; string — **байты UTF-8** (не руны). bool / int / **float** / не тот сорт — ошибка. Пустой список / map / `""` → `0` (это значение, не omit). Не `size()`. `$when: !len` — ошибка (нужен bool: **`!is-not-empty`**).
- Omit операнда (`?.` / `$Name?`) → omit тега. Пара **51**: `$N?: !len $X.y?` ок; `$N: !len $X.y?` / `$N?: !len $X.y` — ошибка.
- Last (74): `$N: !len $Xs` затем `$I: !expr "$N - 1"` затем `$Xs[$I]`.

### 3.3 Политика типов — `!policy`

**`!policy` (v1, закрыто; решение 27B):** не bind. Опциональный **первый** YAML-документ входа — tagged scalar `soft` | `strict`. Действует **только** на **`!typedef` + тег `!$Type`** (обязательные поля без default; extra-ключи; неверный тип скаляра — **всегда ошибка**, даже в soft).

**Не** относится к `!ref` / `!expr`: missing шага без `?.` / `?[` / `?.['…']` — **всегда ошибка**, независимо от `!policy`.

```yaml
---
!policy strict
---
!typedef
$ValuesType:
  name: string
---
!bind
$Values: !$ValuesType
  name: demo
```

- Документ есть — **обязан быть первым**. Второй `!policy` или тег не первым — ошибка.
- `$Name: !policy …` — ошибка. Документ не создаёт `$Name`.
- **Вариант B:** есть `!policy` и **ни одного** `!$Type` (ни корень bind, ни `$yield`) — **ошибка** (политика без схемы бессмысленна).
- Нет документа `!policy`:
  - есть хотя бы один **`!$Type`** → для схемы режим **`strict`** (явный `!policy strict` можно не писать);
  - нет ни одного typed bind → ок, схема не применяется.
- **strict** (схема): нет ключа и нет `default` в типе — ошибка; extra-ключ instance — ошибка.
- **soft** (схема): нет ключа и нет `default` — ключ **опускается** (не `null`); extra-ключи **разрешены**.

**`!typedef` + `!$Type` (v1, закрыто; решение 28D):** каталог типов — отдельный документ (tagged mapping). Дефолты живут в типе.

```yaml
---
!policy strict
---
!typedef
$ValuesType:
  name: string
  replicas: { type: int, default: 1 }
  image: string
---
!bind
$Values: !$ValuesType
  name: api
  image: ghcr.io/acme/api:0.1.0
```

Документ `!typedef`:

- Не bind-документ целиком: тег висит на mapping. Ключи — `$Name` типов; они **попадают в глобальный граф** (`!ref $ValuesType` читает **схему**, не instance).
- Не больше **одного** на render. Стоит **сразу после** `!policy`, либо **первым**, если `!policy` нет. Иначе — ошибка.
- Значение ключа — схема (ниже). Корень типа можно **`!read`** (`$ValuesType: !read types.yaml` внутри `!typedef`) — схема = обычный YAML. Либо целиком документ **`!typedef`** через **`!import`**.

Схема поля:

```text
TypeName := string | int | bool | float
Field    := TypeName | { type: TypeName, default?: <литерал> }
           | mapping<Ident, Field>
```

- `name: string` — обязательное поле, без default.
- `replicas: { type: int, default: 1 }` — default только **литерал YAML** (не `!ref`).
- Вложенные объекты — вложенный mapping тех же правил.
- List-of-T в v1: одноэлементный list в схеме, напр. `ports: [{ containerPort: int }]`.

**Тег `!$Type` (решение 28D, **34**, **54**):** YAML **local** tag (`!` + `$` + BindingName). Суффикс тега = **`BindingName`** (`!$ValuesType` ↔ ключ `$ValuesType` в `!typedef`). Не `!ValuesType` (без `$`). Не `!!$ValuesType`. Не `!ref $ValuesType` (это взять объект схемы как значение).

Где можно (ровно один тег на узел):

- корень top-level bind: **`$Name: !$Type`**;
- mapping **`$yield`** у `!foreach`: **`$yield: !$Type`** (решение 34). Не **`$yield?: !$Type`** (52).

- Узел — **mapping**. Scalar/sequence с `!$Type` — ошибка.
- Вложенный `nested: !$U` в instance bind / в теле `!emit` / на `$yield` — **ошибка** (решение **35**, не в v1). Не на документе `!emit`. Не на ключе `$over` / `$as`.
- `$X` должен быть объявлен **в `!typedef`**. `!$Foo`, если `$Foo` нет в typedef (или это data-bind) — ошибка.
- Один тег на узел YAML: `$Values: !$T` и `$Values: !read` одновременно нельзя. `$Items: !foreach` и `$Items: !$T` одновременно нельзя (тип элемента — на `$yield`). Typed instance из файла — документ **`!bind`** со сплайсом **`!import`**, не тег на `!read`.
- `!T` / **`!!ref`** / **`!!str`** / **`!!null`** / **`!!bind`** / **`!!$T`** / любой `!!` в документе knarr — ошибка (54, **55**).
- После применения тег **не** часть значения.

Применение (когда на узле есть `!$Type`):

1. Вычислить mapping instance (для `$yield` — уже с подставленным `$as` / `!ref` / `!expr`).
2. Взять схему `$Type`.
3. Для каждого поля схемы: если в instance нет ключа и есть `default` — подставить; нет ключа и нет default — в **strict** ошибка, в **soft** ключ **опускается** (не `null`).
4. Instance побеждает default.
5. **strict:** ключ instance вне схемы — ошибка; неверный тип скаляра — ошибка.
6. Результат — mapping **без** тега (порядок ключей схемы, затем extra в soft). Для `$yield` это элемент списка.

Bind / `$yield` **без** `!$Type`: схема к этому узлу не применяется (даже если `!policy` есть — рычаг для *других* typed узлов). Если `!policy` есть, **хотя бы один** `!$Type` обязан быть: на корне bind **или** на `$yield`.

### 3.4 Доступ к данным

**`!ref` (решения 16, 20–21, **48**, **54**, **79**, **82**, **83**, **90**):** tagged scalar, тот же класс узла, что `!not`. Тег только **`!ref`**, не **`!!ref`**. **Доступ к полю:** путь, `?.`, ровно один **`??`** на весь скаляр. Не формула: нет `+` `&&` `||` `!` сравнений; нет dyn-index `$X[$K]` (это **`!expr`**, **50**). **`!expr` не снимать (90).** Перед оценкой снимается ведущий `$` у `BindingName`. `??` — маркер knarr (как `?.`): сначала разрез скаляра, не токен Pratt. Аргумент — `RefScalar`:

```text
BindingName := '$' [A-Z] [A-Za-z0-9]*
Ident       := [A-Za-z_][A-Za-z0-9_]*
Index       := [0-9]+                    # ≥ 0, без знака, без пробелов
KeyLit      := [^'\n\\]+                 # v1: нет ', \, перевода строки; не пусто
Step        := '.' Ident | '[' Index ']' | "['" KeyLit "']"
RefTrail    := Step '?'? 
RefPath     := BindingName '?' RefTrail* | BindingName RefTrail*
Default     := knarr-литерал (bool / int / float / string / list / map; **68**, **81**) | RefPath
RefScalar   := RefPath ( '??' Default )?
```

**`??` (82, **83**, **87**):** ровно один на **весь** скаляр `!ref` или `!expr` (решение **73**: N-way — **`!pick`**, не цепочка `??`). Не внутри формулы и не на подывыражении (`($a ?? 0) + $b` — ошибка). Разные default — промежуточный bind. Справа после оценки — **значение** (не omit); типы совпадают с не-omit слева, если слева было значение. Результат с `??` — всегда значение → ключ YAML **без** `?:`. `имя?: … ?? …` / `$Name?: … ?? …` — ошибка пары (**111**). Исключение — **`имя?: !foreach` + `$yield?:` + `?? []`/`{}` на `$over` (109)**. Omit справа — ошибка. Слева — omit-способный путь или формула с `?.` / `$Name?`. `!ref $Values.host ?? 'x'` без `?.` — ошибка. **`!expr` та же пара (98):** `replicas: !expr "$Values.n? + 1"` — ошибка; `replicas?:` / `?? 1` — ок. Не запрещать `?.` в формуле без `??`. Путь+`??` в `!expr` **тождествен** тому же `!ref`; **канон — `!ref`**.

Тот же `RefScalar` (путь + опц. `??`) у **`!int` / `!str` / `!bool` / `!float` / `!len` / `!b64enc` / `!b64dec` / `!to-json-str` / `!from-json-str` / `!sha256-json`**: сначала default, потом тег. **`!not` (86):** только `RefPath`, **без `??`**. `!not $Values.debug? ?? false` — ошибка.

Разбор **`$Name?.…`** зависит от объявления (51): optional bind — сначала маркер **`$Name?`**, затем trail (`.cert` обязателен, `?.cert` — поле omit). Обязательный bind — `$Name` + `?.cert` как раньше. Если bind omit, весь путь после `$Name?` omit.

```yaml
!ref $Tls?
!ref $Tls?.cert
!ref $Tls?.host?
```

Примеры:

```yaml
!ref $Values
!ref $Values.name
!ref "$Workers[0].name"         # кавычки YAML из-за [ (89)
!ref $Values.tls?.cert          # optional: нет tls → ключ-родитель опускается
!ref "$Workers[0]?.name"        # кавычки YAML из-за [
!ref "$Values.labels['app.kubernetes.io/name']"
!ref "$Values.labels?.['app.kubernetes.io/name']"
!ref "$Values.ports['0']"       # ключ-строка, не индекс [0]
!ref $Tls?                      # optional bind (51)
!ref $Tls?.cert                 # bind omit → omit всего; bind есть → cert обязателен
!ref $Values.deployWorkers? ?? false
!ref "$Values.tls?.host ?? 'localhost'"
!ref "$Values.ports? ?? [80, 443]"
!ref "$Values.probe? ?? {}"
```

- `['…']` — ключ mapping строкой (Helm `index`). Ident в скобках допустим (`['host']` ≡ `.host`).
- Ключ пустой / с `'` / `\` / переводом строки — ошибка в `!ref`; нужен **`!expr`**.
- `["…"]` внутри `!ref` — не форма v1 (двойные кавычки ключа — только `!expr`).
- Индекс **только** `[n]`, не `.0`. Отрицательный индекс, **`$X[$I]` в `!ref` нет** (динамика — `!expr`, решение **50**).
- Тега **`!path` нет** (решение **48**). Корень не `$Name` (бывший `from: !expr`) — целиком **`!expr`**. Тега **`!walk` нет** (решение **49**, навсегда).

**Нет значения `null` (130).** `a: null` / `a: ~` / `a:` (YAML 1.2 null) на ключе mapping ≡ **ключа нет**. Пользователь не получает `null` в stdout (Helm `a: null` в Comparison ≡ нет `a`).

- **strict**, шаг без `?` на поле — **ошибка** (решение 8);
- шаг с **`?`** даёт omit **значения**; в stdout ключ пропадает **только** при явном `ключ?:` (решение 25) **или** если ключ был `null` (его нет);
- **soft** не опускает unmarked-ключи (нет скрытого omit);
- omit как элемент sequence или как единственное тело `!emit` (кроме `$else-yield: ""`) — ошибка; **`- null` / JSON `[null]` — ошибка**;
- YAML/JSON `null` во входе (литерал, values, `!read`, поле `!from-json-str`) ≡ «ключа нет»; корень `null` ≡ omit значения;
- `$else-yield: null` ≡ ключа `$else-yield` нет.

**Кавычки (89):** правило — **YAML 1.2**, не позиция в строке. Flow-индикаторы `[` `{` `]` `}` `,` **нелегальны в plain scalar в любом месте**. `: ` (двоеточие и пробел) начинает mapping. ` #` (пробел и `#`) — комментарий: хвост **тихо отрезается**. `/` **не** flow-индикатор — без кавычек ок. `?? false` / `?? 0` / `||` / `&&` / сравнения без `: ` — без кавычек ок. Вольность парсера (`?? [80, 443]` без кавычек) **не** knarr (**119**): слой knarr **отвергает**, даже если парсер склеил одно тело. Разрез на два узла — ошибка YAML. Плановый негативный golden.

```yaml
name: !ref $Values.name           # OK без кавычек
$path: !ref $Values.path/to       # / ок
$when: !ref $Values.enabled? ?? false
$Show: !expr $Values.x || $Values.y
name: !ref "$Workers[0].name"     # [ ] — кавычки
app: !ref "$Values.labels['app.kubernetes.io/name']"
host: !ref "$Values.tls?.host ?? 'localhost'"
$over: !ref "$Values.ports? ?? [80, 443]"
$Kind: !expr '$Values.kind == "Deployment"'
```

Без кавычек `$Workers[0].name` / `?? [80, 443]` / `?? {k: 1}` / `$Values.kind: Deployment` — невалидный YAML 1.2.

### 3.4.1 Выражения — `!expr`

**`!expr` (решения 20–21, **79**, **82**, **83**, **84**, **85**, **90**, **92**):** tagged **scalar**. **Вычислить:** операторы, dyn-index, пути и `$Name` **внутри** формулы / list-map-литерала. **`!ref` не снимать (90).** **`?.` в путях формулы остаётся (92):** не требовать промежуточный bind. **Default:** ровно один top-level **`??`** на весь скаляр (**83**, **87**). **Чистый путь (84)** и **константа без вычисления (85)** — ошибка: нет вычисления. CLI (**118**): «нужен `!ref`» (или YAML-литерал). Нужен **`!ref`** или YAML-литерал. В YAML тело слева от `??` — **грамматика knarr** с токенами `BindingName` (`$Name`). **CEL spec / cel-go / cel-rust / evalexpr / Rhai не норматив и не зависимость.** Host functions **в v1 нет** (решения **22**, **75–76**):

| Функция | Есть в v1 | Заметки |
|---------|-----------|---------|
| `b64enc` / `b64dec` | **нет (76)** | теги **`!b64enc` / `!b64dec`** |
| `printf(fmt, …)` | **нет (75)** | тег **`!format`** в bind; диалект **Go `fmt` (80)** |
| `len(x)` | **нет (76)** | тег **`!len`**; семантика **47** |
| `toYaml` / `fromYaml` | **нет** | дерево уже YAML; сериализация — emit, не expr |
| `files.get` / `files.glob` | **нет** | YAML-дерево — **`!read`**; knarr — **`!import`** |

**`+` / арифметика (решения 75, **81**):** int+int → int. Если **хотя бы один** операнд float — другой int повышается до f64, результат float. `$Replicas + 0.5` → `2.5`. `$Name + '-svc'` / `$A + $B` на string / seq — ошибка (`!format` / `!join` / `!concat`). То же повышение для **`-` `*` `/`** и сравнений **`==` `!=` `<` `>` `<=` `>=`**. int/int деление — целое (как Go). `%` (остаток) — только int. Индекс sequence — только int (`$Xs[0.5]` / `$Xs[$F]` если float — ошибка).

**Float (решение 81):** сорт IEEE **f64**. YAML `0.5` / `1.0` / `1e-3` в документе knarr и в `!read` — float (`1` — int). Литерал в `!expr`: `0.5`, `1.0`, `1e-3`. `.nan` / `.inf` / `-.inf` / JSON Inf — **ошибка**. `"500m"` / `"128Mi"` — **string**, не Quantity. `0.1 + 0.2` не равно `0.3` (двоичный float, как Helm/Go).

**Динамический индекс (решение 50, D3):** только в **`!expr`**. В `[ ]` — либо литерал (`0`, `"ключ"`), либо **`DynIndex`**:

```text
DynIndex := BindingName ( '.' Ident )*
```

Примеры: `$Values.images[$Worker.name]`, `$Values.workers[$I]`, `$Values[$Key]`. После strip: `Values.images[Worker.name]`.

- Mapping + индекс **string**; sequence + индекс **int**. Иначе ошибка.
- Нет ключа / нет элемента, и на контейнере нет `?.` — ошибка (8).
- `$Values.images?[$Worker.name]`: нет `images` → omit всего выражения; map есть, ключа нет → ошибка.
- Индекс-omit (`[$Worker.kind?]`, `[$Tls?]`) — ошибка, **`??` это не чинит**.
- Default, если контейнер omit: **`!expr "$Values.images?[$Worker.name] ?? 'nginx'"`** (83). Ключ в живом map без `?.` — по-прежнему ошибка (8).
- **Нельзя** в `[ ]`: операторы, `len(…)`, `+`, отрицательный литерал, вложенный `[n]`, `['ключ']`, `?.` внутри DynIndex. Нужен промежуточный `$K: !ref …`.
- В **`!ref`** по-прежнему нет `$X[$I]` / `$X[$Key]`.
- **Последний элемент (решение 74):** нет `!last`, нет host `last`, нет `$Xs[-1]`. Канон — три шага. Пустой список / выход за длину — ошибка (нет элемента).

```yaml
$N: !len $Values.workers
$I: !expr "$N - 1"
last: !expr "$Values.workers[$I]"
```

```yaml
image: !expr "$Values.images[$Worker.name]"
item: !expr "$Values.workers[$I]"
```

```yaml
# BAD
image: !ref $Values.images[$Worker.name]
last: !expr "$Values.workers[len($Values.workers) - 1]"
image: !expr "$Values.images[$Worker.name + '-dbg']"
```

**Грамматика knarr в v1 (решения 26, **79**, **83**, **87**):** сначала разрез **одного** top-level `??` вне строк (нет `??` — формула целиком). Слева после strip `$` / переписи `?.` — выражение без вызовов. **`??` не токен Pratt.**

```yaml
# BAD (87)
$sum: !expr "($Values.a? ?? 0) + ($Values.b? ?? 1)"
# OK
$A: !ref $Values.a? ?? 0
$B: !ref $Values.b? ?? 1
$sum: !expr "$A + $B"
```

Разрешены: литералы (**list/map — 68**, если в формуле есть вычисление — **85**; **float, 81**), пути/`$Name` **внутри** формулы, операторы (`&&` `\|\|` `!` `==` `!=` `<` `>` **`+` int или float (81)** `-` `*` `/` …). **Вызовов нет:** `ident(` — **ошибка разбора**, не «парсер CEL принял, потом reject». Нет тернарника **`c ? t : f`** (это не knarr `?.` и не `??`). **`+` не склеивает string и sequence** (59, **75**). Внутренний `get` после `?.` автор не пишет. Константа без оператора / dyn-index / `$` в list-map — ошибка (**85**).

Реализатор — **свой парсер** (Pratt/PEG). Не подключать CEL-крейт «и обрезать».

**Литералы list/map в `!expr` и справа `??` (68, 82, 83, 85):** синтаксис knarr (вид как у CEL-литералов), не YAML.

- List: `[1, $Port]`, `[80, 443]` только если в том же `!expr` есть вычисление (**85**: иначе YAML `[80, 443]`). Элемент-omit — ошибка.
- Map: `{'app': $Values.name}`, `{"env": $Values.env}`. Ключ — **string-выражение в кавычках**. Константа `{'k': 1}` как весь `!expr` — ошибка (**85**). YAML `{app: $Values.name}` / `{a: 1}` внутри `!expr` — ошибка.
- Дубликат ключа в map-литерале — ошибка. Вложение list/map можно.
- `[ $A, $B ]` при seq-детях — **вложенные** списки, не `!concat`. `$A + [1]` — ошибка (59).
- Индекс **50** не меняется: `$Xs[0]` / `$M[$K]` — доступ, не литерал. Литерал `[1,2]` в `[ ]` индекса — ошибка.

```yaml
$over: !ref "$Values.ports? ?? [80, 443]"
$Ports: [80, 443]
$Labels: !expr "{'app': $Values.name, 'env': $Values.env}"
```

Норматив — эта грамматика (20–26, 46–50, **68**, **79**), не «CEL этой версии». Документа `!code` / Starlark **нет**.

```yaml
$ShowSvc: !expr "$Values.service.enabled && $Values.replicas > 1"
# strip → Values.service.enabled && Values.replicas > 1
spec:
  replicas: !expr "$Values.replicas + 1"
$when: !expr "$Values.ingress?.enabled || $Values.mesh?.enabled ?? false"
$sum: !expr "$Values.a? + $Values.b? ?? 0"
```

**Оценка omit в `!expr` (83, **88**).** Omit ≠ false и ≠ `0`. Оператор берёт только **спрошенные** операнды. Спрос так и в v2.

`||`:
- левый **true** → **true**, правый **не считают** (`true || omit || omit` = **true**; `??` не берут);
- левый **false** → результат правого;
- левый **omit** → считают правый: **true** → true; **false** или **omit** → omit.

Спрошенный операнд `||` / `&&` не **bool** и не omit (string / int / seq / map) — **ошибка типа** (**95**, **117**). Не coalesce имён: `!expr "$Values.fullnameOverride? || $Values.name? ?? 'app'"` — ошибка, не `"myname"`. Канон: **`!ref … ??`** или **`!pick`**. Отдельного CLI-текста про `!pick` нет — общая ошибка типа.

`&&`:
- левый **false** → **false**, правый не считают;
- левый **true** → результат правого;
- левый **omit** → считают правый: **false** → false; **true** или **omit** → omit.

Унарный **`!`**: omit → omit.

`+` `-` `*` `/` `%` и сравнения: **оба** операнда спрошены (missing без `?.` — ошибка 8, даже если другой omit). Любой спрошенный omit → omit оператора.

После формулы: значение → оно; omit и есть `??` → справа; omit без `??` → omit узла.

**Нет вычисления (84, 85, **118**).** После разреза `??` формула обязана содержать **хотя бы одно**: оператор (`+` `||` `&&` `!` сравнения …), dyn-index `$M[$K]`, `$Name` внутри list/map-литерала. Иначе ошибка: нет вычисления; stderr — «нужен `!ref`».

```yaml
# BAD — путь
!expr "$Values.name"
!expr "$Values.enabled? ?? false"

# BAD — константа
!expr "true"
!expr "1"
!expr "[80, 443]"
!expr "{'k': 1}"

# OK
!expr "$Values.replicas + 1"
!expr "$Values.a? || $Values.b? ?? false"
!expr "$Values.images[$Worker.name]"
!expr "[80, $Port]"
!expr "{'app': $Values.name}"
!expr "0.1 + 0.2"
```

Чистый путь → **`!ref`**. Константа → YAML (`$when: true`, `$over: [80, 443]`, `replicas: 1`).

`??` — default **результата формулы**, не каждого пути. `!($Values.debug?) ?? false`: нет debug → **false**. **`!not` + `??` — ошибка (86).** Invert optional: `$D: !ref $Values.debug? ?? false` затем `!not $D` (нет debug → **true**).

**Имена (P2, закрыто):**
- В декларации knarr bind и пути — **только `$Name`** (Capital). Голый ident `Values` в `!expr` — ошибка («нужен `$Values`»).
- Среда имён: ключ = `BindingName` **без** `$` (`$Values` → `Values`). Значение — YAML-узел как map/list/скаляр.
- Лексер трогает **только** токены `BindingName` вне строковых литералов (`'…'` / `"…"`). `'price is $Values'` остаётся строкой с долларом.
- **`$Name?` (51)** в `!expr` / `!ref` — маркер knarr (как `?.`), не токен грамматики сравнения. Optional bind без `?` (`$Tls.cert`) — ошибка.
- `--trace` / ошибки: показывать исходный скаляр и текст после strip; колонки смещены на число снятых `$` (карта смещений обязательна).

**Где можно:** любой **value-узел** — значение top-level `$Name`, поле манифеста, `$when`, `$over`, поля `$yield`, элементы sequence.

**Где нельзя:** `$as` (объявление `BindingName`, не value); документ `!policy` / `!typedef` / корень `!bind` (только ключи `$Name`); второй тег на том же узле (в т.ч. на **`!$Type`**).

**Форма:** только tagged scalar. `!expr { … }` / `!expr [ … ]` / второй тег на том же узле — ошибка (как у `!not`).

**Результат** становится узлом knarr: `bool` / `int` / `string` / sequence / mapping. **`null` / отсутствие как null — ошибка** (решение 8: в языке нет `null`). Тип должен быть осмыслен для места (`$when` — только bool; `$over` — только sequence).

**Ошибки** разбора и оценки (тип операнда, missing ident, вызов) — ошибка render с указанием узла / `$Name`.

Кавычки — **YAML 1.2 (89)**, не «только с начала строки»: `:` / `#` / flow-индикаторы в plain scalar недопустимы **нигде**; `/` без кавычек ок; строки внутри выражения — вложенные кавычки (`!expr '$Values.kind == "Deployment"'`).

**`!ref` / `!not` (82, **83**, **86**):**  
`!ref $Values.name` ≡ после strip `Values.name`.  
`!ref "$Workers[0].name"` — кавычки **YAML** из‑за `[`; после parse это всё ещё `$Workers[0].name` → `Workers[0].name`.  
`!ref "$Values.tls?.host ?? 'localhost'"` — `??` на `!ref`.  
`!expr "$Values.tls?.?host ?? 'localhost'"` / `!expr "$Values.name"` — **ошибка (84)**: нет вычисления; CLI (**118**): нужен **`!ref`**.  
`!ref "$Values.name + '-svc'"` / `!ref "$Map[$K]"` — **ошибка**: не `RefPath`; CLI (**118**): нужен **`!expr`**.  
`!not $ShowSvc` ≡ `!ShowSvc`.  
`!not $Values.debug? ?? false` — **ошибка (86)**. Нужен bind `!ref … ??` + `!not`, или `!expr "!$Values.debug? ?? false"`.  
`?.` в декларации **остаётся**; перед оценкой путь переписывается во внутренний `get` (решение 24), не отдаётся в грамматику как `?.`. Формула с оператором и default — **`!expr` … `??`**, не промежуточный bind.

### 3.4.2 Optional путь `?.`, default `??`, ключ `?:`

**Явность:** knarr не опускает и не подставляет ничего, что не записано. Нет авторского `has()`.

**Путь.** В YAML остаются `?.` / `?[`. Лексер (не regex) отличает `?.` (шаг), `??` (default), не трогает строки. После strip `$`:

```text
$Values.tls?.host     → get(Values, opt("tls"), "host")
$Workers[0]?.name     → get(Workers, 0, opt("name"))
$Values.affinity?     → get(Values, opt("affinity"))
```

`get` / `opt` / `def` — только codegen; в декларации запрещены.

- Шаг без `?.` в **strict**, ключа нет → **ошибка missing** (даже если ключ манифеста с `?:`).
- Шаг `?.` / `?[`, ключа нет → значение-узла **omit** (не `null`), если нет `??`.

**Ключ манифеста `…?:` (решение 25).** Неquoted ключ, который оканчивается на ровно один `?`, в теле `!emit` / `$yield`:

- мета knarr: в stdout имя **без** `?` (`affinity?:` → `affinity`);
- **разрешает** omit этого поля.

Служебный **`$yield?:`** — не поле stdout, а ключ `!foreach` (решение **52**, §3.6).

Omit в stdout (ключа нет), только если **оба** явные:

1. ключ с суффиксом `?:`;
2. значение дало omit (`?.` на пути, **без** `??`) **или** (решение 32) optional mapping **`{}`** **или** (**97**) **`!foreach`**, у которого **omit `$over`**, **или** (**108**) **`имя?: !foreach`** + **`$yield?:`** + печатать нечего.

**`[]` не omit (94).** Пустой sequence — значение. `имя?: !ref $Values.init?` при `init: []` → `init: []` в stdout. Не схлопывать `[]` как пустой `{}`. **Исключение 108:** `имя?: !foreach` + `$yield?:` + пустой результат → нет ключа. Пропуск empty на ключе `?:` — **`!skip-empty` (140)**; иначе **`!is-not-empty` + `!match` без `$else-yield`** / **`$yield?:` (154)**, либо `$when` / `$filter`. **`!is-empty` как значение поля** — bool, не omit списка.

**Дерево `?:` (решение 32).** В mapping в `!emit` / `$yield` (не bind):

- все **исходные** дочерние ключи с суффиксом `?:` ↔ родитель **обязан** `?:`;
- родитель `?:` ↔ все дети `?:`.

Иначе ошибка. После оценки детей: optional mapping **`{}`** → ключ родителя **нет** (не `spec: {}`).

**Helm `with` (решение 45 B):** тега **`!with`** / ключа **`$with`** нет (NONGOALS). `{{- with .Values.affinity }}` + `toYaml .` → `affinity?: !ref $Values.affinity?`. Частичная пересборка — дети `?:` и пути `?.` (collapse 32). **`!foreach` не имитирует `with`:** `$yield` — элемент списка.

```yaml
# OK: оба omit → нет spec
spec?:
  affinity?: !ref $Values.affinity?
  tls?: !ref $Values.tls?

# OK: обязательное поле → spec без ?
spec:
  replicas: !ref $Values.replicas
  affinity?: !ref $Values.affinity?
```

```yaml
# BAD: все дети ?: но родитель без ?
spec:
  affinity?: !ref $Values.affinity?
  tls?: !ref $Values.tls?

# BAD: родитель ?: но есть обязательный ребёнок
spec?:
  replicas: !ref $Values.replicas
```

Предикат (`replicas > 1`) / иначе — **`!match`** (§3.5.1), не collapse `?:`.

**Лист (решение 25):**

```yaml
# OK omit
affinity?: !ref $Values.affinity?

# всегда значение (ключ обязателен, ?? явный default)
host: !ref "$Values.tls?.host ?? 'localhost'"
# codegen → get(Values, opt("tls"), "host", def("localhost"))

# ОШИБКА: omit на обязательном ключе
affinity: !ref $Values.affinity?

# ОШИБКА: ключ optional, путь без ?. → missing, не omit
replicas?: !ref $Values.replicas

# ОШИБКА: ключ optional, узел всегда значение (??)
host?: !ref "$Values.tls?.host ?? 'localhost'"
```

`'affinity?':` в кавычках — литеральный K8s-ключ `affinity?`, не мета.  
Запрещено: `x??:`; optional суффикс не на Ident. **`$Name?:` на bind — решение 51** (пара с `$Name?`).

**`??` (весь скаляр `!ref` / `!expr` / тот же `RefScalar` у coerce / `!len` / JSON / b64; **не `!not` (86)**; решения **82**, **83**, **84**, **85**):** ровно один (решение **73**: N-way — **`!pick`**). Слева путь (`!ref`) или **формула** (`!expr`, не чистый `RefPath` и не константа). Справа значение; результат всегда значение → ключ YAML есть. Поле: **`!ref $X.y? ?? '…'`**. Формула: **`!expr "$X.a? || $X.b? ?? false"`**. `$when` / `$filter`: `?? false` или YAML **`true`/`false`**. `$over` у **`имя: !foreach`** / **`$Name: !foreach`** / **`$Name: !join`**: **`?? []`** / **`?? {}`**. `$of` у **`$Name: !split`** / **`$Name: !sha256`**: **`?? ''`**. `$over` у **`имя?: !foreach`** / **`$Name?: !foreach`**: **без `??`**, кроме **`$yield?:` + `?? []`/`{}` (109)**. `$over` у **`$Name?: !join`**: **без `??` (99)**. `$of` у **`$Name?: !split`** / **`$Name?: !sha256`**: **без `??` (102, 103)**. **`!not … ??` — ошибка.**  
Не канон: `?:`, ` : `, `!?:` как Elvis.

Omit нельзя: элемент sequence, тело `!emit` кроме `$else-yield: ""`, **`$when` / `$filter` / `$if`** с результатом omit (**112**: нужен `?? false`, обязательный bool или **`!is-empty` / `!is-not-empty`**; omit ≠ false).

Не-Ident ключ в **`!ref`**: `"$Values.labels['app.kubernetes.io/name']"` (решение **48**). То же в `!expr`: `$Values.labels["app.kubernetes.io/name"]`. Тега **`!path` нет**.

### 3.5 Условия — `$when`

`$when` живёт на **`!emit`** (обязательны `$yield` **и** `$else-yield`), опционально на **`!emit?` / `!foreach` / `!emit-foreach` / `!emit-foreach?` / `!emit-range` / `!emit-range?` / `!range`** (**145**, **148**, **155**; без `$else-yield`; `$yield` / `$yield?:` — тело). Ложь → нет документа / пустой цикл; тело не считают. Значение — предикат **bool (66):** `!ref` / `!not` / **`!expr`** / **`!is-empty` / `!is-not-empty` / `!and` / `!or`** / YAML **`true`/`false`** (**85**: не `!expr "true"`). Ключ есть, значение omit — **ошибка (112)**, не `false`. Нет ключа `$when` на `!emit?` — законно (**155**).

```yaml
$when: true
```

```yaml
---
!emit
  $when: !ref $ServiceEnabled
  $yield:
    apiVersion: v1
    kind: Service
    metadata:
      name: !ref $Values.name
  $else-yield: ""
```

- **`!emit?` (133, **153**, **155**):** только **`$yield?:`**. `$when` опц. Нет `$else-yield`. Ложь `$when` или omit `$yield?:` → нет документа. `$else-yield` / нет `$yield?:` / **`$yield:`** — ошибка пары. `$Name: !emit?` — ошибка.
- **`!emit` + `$when`:** обязательны `$yield` и `$else-yield`; других ключей нет.
- `$yield` — mapping манифеста (один документ, если ветка истинна; **любое число ключей — 132**). Не **`!foreach`** / **`!emit-foreach`** / **`!emit-foreach?`** / **`!emit-range`** / **`!emit-range?`** как всё тело `$yield`.
- `$else-yield: ""` (пустая строка) — **не эмитить** ничего. Это не документ и не `null`.
- `$else-yield:` может быть другим mapping манифеста (ветка else).
- `$else-yield: null` / `~` ≡ ключа `$else-yield` нет (**130**): на `!emit` — ошибка пары; на `!emit?` — как будто `$else-yield` не писали.

**`!not` (v1, закрыто; **86**):** только tagged scalar, **`RefPath`** (включая `$X[0].name`, `?.` и кавычки при `[`). **Без `??`.** Один узел — один тег. `!not $Values.debug? ?? false` — ошибка.

```yaml
# BAD
$when: !not $Values.debug? ?? false

# OK — default-then-not
$Debug: !ref $Values.debug? ?? false
$when: !not $Debug

# OK — not-then-default (нет debug → false)
$when: !expr "!$Values.debug? ?? false"
```

Не является формой v1:

```yaml
$when: !not               # BAD: два тега на одном узле
  !ref $SomeBool
$when: !not [ !ref $SomeBool ]
$when: !not
  of: !ref $SomeBool
```

### 3.5.0 Предикаты — `!is-empty` / `!is-not-empty` / `!and` / `!or`

**Решение 66:** пустота и булева сборка — теги, не host `empty`. Результат — **bool**. Документ с этими тегами — ошибка.

**`!is-empty` / `!is-not-empty`:** tagged **scalar**, тот же `RefScalar`, что у `!ref`. Один узел — один тег. Не `!is-empty { $of: … }`.

Helm `empty` (заморожено, **128**): **true** для omit (`?` на поле / `$Name?` без значения), `""`, `[]`, `{}`, `false`, int **`0`**, float **`0.0` / `-0.0`**. Иначе **false** (непустая строка / seq / map, `true`, ненулевой int / float). Missing **без** `?` на шаге — ошибка пути (8). **`!is-not-empty`** ≡ отрицание `!is-empty` того же пути. Helm **`| default`** в guide (**134**) = **`!match`** + **`!is-empty`**, не `??`.

```yaml
---
!emit
$when: !is-not-empty $Values.sidecars?
$yield:
  kind: ConfigMap
$else-yield: ""
```

**`!skip-empty` (140, **141**):** tagged **scalar**, тот же `RefScalar`. Empty (как у `!is-empty`) → **omit значения**; иначе значение без изменения. Не bool. Не предикат.

Целое значение:

- ключа **`имя?:`** в mapping `!emit` / `$yield` / `$else-yield` тела манифеста;
- **`$Name?:`** в `!bind`;
- **`$yield?:`**;
- **`$yield` / `$else-yield` у `!match` (141)**, если этот `!match` сам в одном из слотов выше (вложение `$yield: !match` … `$yield: !skip-empty` ок).

Иначе **ошибка**: `имя:` без `?:`; `$when` / `$filter` / `$if`; **`$yield` / `$else-yield` документа `!emit`** (у **`!emit?`** слот — **`$yield?:`**, **153**); `$over` / `$of`; элемент sequence; ребёнок **`!pick`** / `!and` / `!or` / `!concat`. На `имя: !match` omit `$yield` ловит пара `!match` без `?:`. `??` на том же скаляре с `имя?:` — ошибка пары листа (**111**).

**Comparison `if .Values.tls` + поле (140, снимает 135):** `tls?: !skip-empty $Values.tls?`. Не `tls?: !ref` (печатает `false` / `""` / `[]`).

```yaml
tls?: !skip-empty $Values.tls?
initContainers?: !skip-empty $Values.init?
$Tls?: !skip-empty $Values.tls?
$yield?: !skip-empty $Worker.sidecar?
name?: !match
  $if: !is-not-empty $Values.name?
  $yield: !skip-empty $Values.image?
```

**`!and` / `!or`:** tagged **sequence**. Дети — предикаты bool: `!ref` / `!not` / `!is-empty` / `!is-not-empty` / `!and` / `!or` / `!expr` (результат bool) / литерал bool. ≥1 элемент. Пустой `[]` — ошибка. Mapping-носитель — ошибка. Вложение `!and`/`!or` можно. Считают **всех** детей (нет short-circuit). Omit ребёнка — ошибка. Не bool — ошибка. **`!skip-empty` в `!and` / `!or` — ошибка.**

**Comparison Helm `and` + `gt` (136):** `if and .Values.service.enabled (gt .Values.replicas 1)` — пара `!emit?` + `$when: !and` (`!is-not-empty` на `service?.enabled?`; `!expr "$Values.replicas? > 1 ?? false"`). Не Impossible.

**Comparison Helm `range` + `if and .ports .enabled` (138):** `env:` + фильтр элемента = `env?: !foreach` + `$filter: !and` двух `!is-not-empty` + `$yield?:` mapping `name`. Не Impossible. Не `!and` сырого seq/bool.

**Comparison Helm `and` строк в поле (139, канон **141**):** `name: {{ and .Values.name .Values.image }}` — `name?: !match` `$if: !is-not-empty $Values.name?` / `$yield: !skip-empty $Values.image?`. Не Impossible. Не `!and` строк.

**Comparison Helm `if and enabled tls` документ (142):** `kind: Service` = `!emit?` + `$when: !and` двух `!is-not-empty` (`service?.enabled?`, `tls?`). Не поле `tls?:`.

**Comparison Helm `or` (142):** `if or .Values.ingress.enabled .Values.mesh.enabled` — пара `!emit?` + `$when: !or` двух `!is-not-empty` на `?.enabled?`. `host: {{ or .Values.host "localhost" }}` — пара `!match` + `!is-empty` (как `\| default`), не `!or` строк и не `??`.

```yaml
$when: !or
  - !is-empty $Values.tls?
  - !is-empty $Values.cert?

$filter: !and
  - !is-not-empty $S.ports?
  - !is-not-empty $S.enabled?
```

**`!not` не оборачивает** `!is-empty` / `!and` / `!or` (по-прежнему только scalar-путь). Invert `!or` — De Morgan: `!and` + `!is-not-empty`, либо `||` / `&&` в `!expr` для уже-bool.

`$Name?: !is-empty` / `!$T` на том же узле — ошибка (всегда bool, не omit).

Host **`empty`** в `!expr` — ошибка. `has()` нет.

### 3.5.1 Предикат в значении — `!match`

**Закрыто (решения 33, 36, 37, **154**):** ветвление **поля** — тег **`!match` на значении**. Носитель — **mapping** `$if` + ровно один из **`$yield` / `$yield?:`**; при **`$yield:`** опционально `$else-yield` (решение **37**). Sequence веток — **ошибка**.

```yaml
spec:
  replicas: !match
    $if: !expr "$Values.replicas > 0"
    $yield: !ref $Values.replicas
    $else-yield: 1
  topologySpreadConstraints?: !match
    $if: !expr "$Values.replicas > 1"
    $yield:
      - maxSkew: 1
        topologyKey: kubernetes.io/hostname
```

- Ровно **`$if`** + один из **`$yield` / `$yield?:`**. При **`$yield:`** можно **`$else-yield`**. **`$yield?:` + `$else-yield` / оба тела / ни одного — ошибка пары (154).** Других ключей нет. `$when` внутри `!match` — ошибка.
- **`$if` обязателен (158):** нет ключа — ошибка (не как опц. `$when` на `!emit?`). Предикат bool (66): `!ref` / `!not` / **`!expr`** / **`!is-empty` / `!is-not-empty` / `!and` / `!or`** / YAML **`true`/`false`**. Голое `$if: $Values.ha` — ошибка. Omit без `??` — **ошибка (112)**.
- **`!match` как sequence** (список веток `- $if` / `- $else-yield`) — **ошибка** (37). Else-if — только вложенный `$else-yield: !match` (тот же mapping).
- `$if` истинно → `$yield` / `$yield?:`; иначе `$else-yield`; нет `$else-yield` → **omit**. `$if` истинно + omit **`$yield?:`** → omit результата. Невзятую сторону **не считают** (36).
- Omit ключа stdout: **`имя?: !match`** (ложный `$if` без else **или** omit `$yield?:`). **`имя: !match` / `$Name: !match` + `$yield?:` — ошибка пары (154).** **`имя: !match`** + `$yield:` без `$else-yield` — ошибка, если `$if` ложен. Omit как элемент sequence — ошибка. Omit корня **`$yield:`** цикла — ошибка (дырка). Omit корня **`$yield?:`** цикла — пропуск итерации (**52**).
- **`$yield` (36, 52):** обычное значение; omit без `$else-yield` на обязательном ключе — ошибка. **`$yield?:` (154):** только omit-слот (`имя?:` / `$Name?:` / `$yield?:` / вложенный результат такого `!match`).
- **Где можно (36):** как `!expr` — поле `!emit`, поле `$yield` / `$yield?:`, `$Name` / `$Name?:` в bind, `$yield`/`$else-yield`. **Нельзя:** `$as`; корень `!policy` / `!typedef` / `!bind` / `!emit`; второй тег на том же узле.
- **Сорт `$yield`/`$yield?:`/`$else-yield` (36):** литерал scalar / sequence / mapping; вложенный **`!match` прозрачен**; `!ref` / `!expr` / `!foreach` непрозрачны. Разные конкретные сорта — ошибка parse. `$else-yield: {}` при `$yield`-sequence — ошибка.
- Presence без формулы — `?:` / **32**, не `!match`.
- Не заменяет документный `$when`.

### 3.6 Цикл — `!foreach`

**`!foreach` (v1, закрыто; **39**, **41**, **52**, **108**):** tagged mapping, строит **sequence**. Не эмитит. Обязательны `$over` / `$as` и ровно один из **`$yield`** / **`$yield?:`**; опционально **`$filter`**, **`$key`**.

```yaml
---
!bind
$Items: !foreach
  $over: !ref $Values.workers
  $as: $Worker
  $filter: !ref $Worker.enabled? ?? false
  $yield:
    name: !ref $Worker.name
```

**`$yield?:` (52)** — тот же ключ с суффиксом omit: значение omit-способно; omit → элемента нет.

```yaml
containers?: !foreach
  $over: !ref $Values.sidecars?
  $as: $S
  $yield?: !ref $S.container?
```

**Пара `?:` / `$over` (97, **100**, **108**)** — тот же закон, что у `!ref` / `??` / `$Name?: !join`, плюс сахар **`$yield?:`**:

```yaml
# ключ всегда есть; нет env → env: []
env: !foreach
  $over: !ref "$Values.env? ?? []"
  $as: $E
  $yield:
    name: !ref $E.name
    value: !ref $E.value

# нет env → нет ключа; env: [] → env: []
env?: !foreach
  $over: !ref $Values.env?
  $as: $E
  $yield:
    name: !ref $E.name
    value: !ref $E.value

# печатать нечего → нет ключа (env: [] / все yield omit / все filter ложны)
env?: !foreach
  $over: !ref $Values.env
  $as: $E
  $yield?:
    name: !ref $E.name?

# нет env → [] → печатать нечего → нет ключа (109)
env?: !foreach
  $over: !ref "$Values.env? ?? []"
  $as: $E
  $yield?:
    name: !ref $E.name?

# bind: нет env → нет $Items
$Items?: !foreach
  $over: !ref $Values.env?
  $as: $E
  $yield:
    name: !ref $E.name

# bind: печатать нечего → нет $Items
$Items?: !foreach
  $over: !ref $Values.env
  $as: $E
  $yield?: !ref $E.name?

# bind: нет env → [] → нет $Items (109)
$Items?: !foreach
  $over: !ref "$Values.env? ?? []"
  $as: $E
  $yield?: !ref $E.name?
```

| Ключ | Значение | Смысл |
|------|----------|--------|
| `$over` | sequence **или mapping** (41, **113**) | один ключ; автор `?? []` / `?? {}`; неверный сорт — ошибка слота |
| `$as` | scalar **`BindingName`** | элемент sequence **или значение** поля mapping |
| `$key` | опц. scalar **`BindingName`** | только если `$over` — mapping; имя ключа (string) |
| `$when` | опц. предикат bool (**145**) | ложь ≡ пустой `$over`; `$over` / `$filter` / `$yield` не считают; `$as` / `$key` не видны |
| `$filter` | опц. предикат bool (66): теги или YAML **`true`/`false`** | ложь → элемента нет (список сжимается) |
| `$yield` / **`$yield?:`** | узел knarr (**43**, **52**) | шаблон элемента; у **`!foreach`** — scalar/seq/map одного сорта; **`!$Type`** только на **`$yield:`** (не на `$yield?:`) |

- Других ключей нет. **`$index` нет** (решение **42**, не в v1). **`keys` / `values` / `!keys` / `!values` нет** (решение **72**): список ключей — `$yield: !ref $K`, список значений — `$yield: !ref $V`.
- `$over` не sequence и не mapping — ошибка. Пустой `$over` (значение `[]` / `{}`) / **`$when` ложь** / все `$filter` ложны / все **`$yield?:`** omit → **`[]`**, кроме **108**.
- **`$over?:` (53)** — ошибка.
- **Пара (97, **108**, **109**):** **`имя?: !foreach`** ↔ `$over` omit-способный (`?.` / `$Name?`) **или** ключ **`$yield?:`**. Omit `$over` → **omit ключа**, `$filter` / `$yield` **не считают**. **`имя?:` + `$yield:`** + живой `$over` → **`[]`**. **`имя?:` + `$yield?:`** + печатать нечего (`[]` / `{}` / `$when` ложь / все `$filter` ложны / все `$yield?:` omit) → **omit ключа**. **`имя?:` + `$yield?:` + `?? []`/`{}` на `$over` — ок (109):** missing → `[]`/`{}` → печатать нечего → нет ключа. **`имя: !foreach`** ↔ `$over` всегда значение (обязательный путь или `?? []` / `?? {}`); пусто → `[]` (даже с `$yield?:`). `имя?:` + `$over` с `?? []`/`?? {}` + **`$yield:`** — **ошибка пары**. `имя?:` + обязательный `$over` + `$yield:` — **ошибка пары**. `имя:` + omit-способный `$over` без `??` — **ошибка пары**. `$over: !ref $Values.env` + `$yield:` — только `имя:`. `$over: !ref $Values.env` + `$yield?:` — `имя?:` законно.
- В **`!bind` (100, **108**, **109**):** **`$Name?: !foreach`** ↔ `$over` omit-способный **или** **`$yield?:`**. Omit `$over` → **omit bind**. **`$Name?:` + `$yield?:`** + печатать нечего → **omit bind**. **`$Name?:` + `$yield?:` + `?? []`/`{}` — ок.** **`$Name: !foreach`** ↔ `$over` всегда значение; пусто → `[]`. `$Name?:` + `?? []`/`{}` + `$yield:` / `$Name:` + omit `$over` / `$Name?:` + обязательный `$over` + `$yield:` — **ошибка пары**. Тот же закон, что `имя?: !foreach`.
- **`$key`** есть, `$over` sequence — ошибка. `$key` нет, `$over` mapping — ок (`$as` = значение).
- `$key` / `$as`: не `!ref`; не служебное имя; не дубликат друг друга и не существующий `$Name`.
- `$key` и `$as` видны в `$filter` и `$yield`, **не** в `$when` (`!foreach` / `!emit-foreach` / **`!emit-foreach?`** / `!emit-range` / **`!emit-range?`** / `!range`).
- Значение `$key` — **string** (ключ YAML как строка).
- `$filter` не bool / omit из `?.` без `??` — ошибка (**112**). **`$filter?:`** / **`$key?:`** / **`$over?:`** / **`$as?:`** / **`$when?:`** — ошибка.
- `$filter` ложь → **`$yield` не считают**.
- В `$yield` **нельзя** `!emit` / **`!emit?`** / `!emit-foreach` / **`!emit-foreach?`** / `!emit-range` / **`!emit-range?`**.
- Ровно один из **`$yield`** / **`$yield?:`**. Оба или ни одного — ошибка.
- **`$yield` (43):** у **`!foreach`** — любой узел (scalar / sequence / mapping). Все **выданные** итерации (прошедшие `$filter` и не-omit `$yield?:`) — **один YAML-сорт**. Смесь сортов — ошибка. Sequence в `$yield` — элемент списка (вложенный list), **не** flatten. **`!emit-foreach` / `!emit-range`**: только **`$yield:`**, mapping. **`!emit-foreach?` / `!emit-range?`**: только **`$yield?:`**, mapping (**148**).
- **`$yield?:` (52):** omit-способное значение ↔ ключ **`$yield?:`** (пара 25/51). Omit → **нет элемента** (`!foreach`: список сжимается; **`!emit-foreach?` / `!emit-range?`**: нет документа), не дырка. Значение есть → элемент как у `$yield`. **`$yield:`** + omit — ошибка (дырка). **`$yield: !ref $S.x?`** / **`$yield?: !ref $S.x`** — ошибка пары. Символ `?` в `??` пару не включает (`$filter: !ref $S.en? ?? false` — ключ без `?:`).
- Mapping **`$yield?:`** — дерево **32**: все дети `?:`; после оценки `{}` → пропуск элемента.
- **`$yield?: !$T`** — ошибка. **`$yield: !$T`**: только mapping; только выданные элементы.
- Пустой результат `!foreach` (**60**, **97**, **100**, **108**, **145**): `$over` было значение + **`$yield:`** → **`[]`** (в т.ч. на **`имя?:`** / **`$Name?:`**: `env: []` в values; **`$when` ложь** — то же). **`имя?:` / `$Name?:` + `$yield?:`** + печатать нечего (в т.ч. `$when` ложь) → **omit ключа / bind**. Omit `$over` + **`имя?:`** / **`$Name?:`** → omit, цикл не считают. **`$when` ложь** → `$over` не считают. **`$yield?` без `:`** — ошибка. `!emit-foreach` / **`!emit-foreach?`** + omit `$over` / пустой `$over` → ноль документов. **`!emit-range` / `!emit-range?`** + omit границы / пустой ряд → ноль документов (**144**).
- Вложенный `!foreach` можно, разные `$as` / `$key`.
- **`!foreach` как значение** (38): поле `!emit` / `$yield` / bind. Документ `!foreach` — ошибка. Корень `!emit` / тело `$yield` не `!foreach`.

### 3.7 Эмит — `!emit` / `!emit?` / `!emit-foreach` / `!emit-foreach?` / `!emit-range` / `!emit-range?`

**`!emit` / `!emit?` (v1, решения 38, **133**):** тег на **документе**, не на значении. `$Name: !emit` / `$Name: !emit?` — ошибка. Непомеченный манифест — ошибка.

Ровно одна из **трёх** форм:

**1. Один манифест** — tagged mapping без `$when`:

```yaml
---
!bind
$Values:
  name: demo
---
!emit
apiVersion: apps/v1
kind: Deployment
metadata:
  name: !ref $Values.name
spec:
  template:
    spec:
      containers: !foreach
        $over: !ref $Values.sidecars
        $as: $C
        $yield:
          name: !ref $C.name
          image: !ref $C.image
```

**2. If без else — `!emit?` (133, **153**, **155**)** — только **`$yield?:`**; `$when` опц. Ложь `$when` или omit `$yield?:` → нет документа. **`$yield:`** — ошибка пары. Ключ `$when` с omit — ошибка (112). Нет ключа `$when` — считают `$yield?:`.

**3. If / else — `!emit`** — только `$when` / `$yield` / `$else-yield` (см. §3.5). `$else-yield: ""` = пропуск. В полях `$yield` можно вложенный `!foreach`.

**`!emit-foreach` / `!emit-foreach?` (решения 38–41, 52, **148**):** тег на **документе**. Ключи `!foreach` (`$over` / `$as` / опц. **`$filter`** / **`$key`**) плюс опциональный **`$when`**. **Пара (148):** **`!emit-foreach`** ↔ **`$yield:`**; **`!emit-foreach?`** ↔ **`$yield?:`**. Каждый выданный mapping → **один** YAML-документ. `$Name: !emit-foreach` / `$Name: !emit-foreach?` — ошибка. Нет `$else-yield` (не if/else документа). Нет splat «только `$over`».

```yaml
---
!emit-foreach
  $when: !is-not-empty $Values.deployWorkers?
  $over: !ref $Values.workers?
  $as: $Worker
  $filter: !ref $Worker.enabled? ?? false
  $yield:
    apiVersion: apps/v1
    kind: Deployment
    metadata:
      name: !ref $Worker.name
```

```yaml
---
!emit-foreach?
  $over: !ref $Values.workers
  $as: $W
  $yield?: !ref $W.sidecar?
```

**Comparison Helm `if` + `range` документов (137):** в guide сниппет с **`---`** на каждый ресурс = этот тег; без `---` — не пара.

- **`$when` (40):** как предикат `!emit`, но **без** `$yield`/`$else-yield`. Нет `$when` — цикл как без ворот. Ложь → **ноль документов**; `$over` / `$filter` / `$yield` **не считают**. `$as` / `$key` в `$when` нет. Не bool / omit без `??` — ошибка. **`$when?:`** — ошибка. `has()` нет.
- **Omit `$over` (97):** `$over: !ref $Values.workers?` — нет workers → **ноль документов**, `$filter` / `$yield` не считают. **`$over?:` нет.** `$over: !ref "$Values.workers? ?? []"` — нет workers → пустой `$over` → тоже ноль документов.
- Пустой `$over` (в т.ч. `{}`) / все `$filter` ложны / все **`$yield?:`** omit на **`!emit-foreach?`** / `$when` ложь / **omit `$over`** → ноль документов, exit 0.
- Порядок внутри emit-foreach — порядок sequence **или ключей mapping** `$over` (17, **41**).
- В stdout **нет** `null`. `$yield` / `$yield?:` не mapping — ошибка. `$filter` ложь → `$yield` не считают. **`$yield?:`** на **`!emit?` / `!emit-foreach?` / `!emit-range?`** (и на `!foreach` / `!range`): omit → нет документа / нет элемента (**52**, **148**, **153**). **`$yield?:`** на **`!emit-foreach` / `!emit-range`** / **`$yield:`** на `?`-теге — ошибка пары. **`$yield:`** + omit — ошибка.

**`!emit-range` / `!emit-range?` (144, **148**):** те же `$as` / `$when` / `$filter`, что у `!emit-foreach`, плюс границы `!range` вместо `$over`. Нет `$over` / `$key`. **`!emit-range`** ↔ **`$yield:`**; **`!emit-range?`** ↔ **`$yield?:`**. Только mapping.

```yaml
---
!emit-range
  $from: 0
  $until: !ref $Values.completions
  $as: $I
  $yield:
    kind: Job
    name: !str $I
```

```yaml
---
!emit-range?
  $from: 0
  $until: !ref $Values.n
  $as: $I
  $yield?: !ref $Values.extra[$I]?
```

**Comparison Helm `range until` документов (143, **144**):** сниппет с **`---`** = этот тег. Без `---` — не пара.

- `$when` ложь → ноль документов, границы не считают (как `$over` у emit-foreach).
- Omit `$until` / `$from` / `$to` (`?.`) → ноль документов.
- Пустой интервал / все `$filter` ложны / все `$yield?:` omit на **`!emit-range?`** → ноль документов.
- Порядок документов — порядок индексов ряда.

### 3.8 Чтение данных `!read` и сплайс `!import`

**Закрыто (решение 44, пути — 13).** Два тега, два закона.

**`!read`:** tagged scalar на **значении**. Файл — **обычный YAML 1.2**, не knarr. Корень единственного документа становится значением узла.

**Решение 69:** ровно **один** документ. JSON, который валидный YAML 1.2 (один объект/массив/скаляр), читается тем же тегом — отдельного `!read-json` нет. Multi-doc (`---` повторно) — **ошибка**. Сырой текст / `Files.Get` — нет. Корень JSON/YAML **`null`** ≡ omit значения (**130**). `!!null` в файле `!read` = YAML null. Расширение multi-doc (`!read-docs` и аналоги) — **не в v1** ([SPEC_TODO_v2.md](SPEC_TODO_v2.md)).

```yaml
---
!bind
$Values: !read values.yaml
$Shared: !read ../shared/values.yaml
$Abs: !read /opt/knarr/base.yaml
---
!typedef
$ValuesType: !read types.yaml
```

**`!import`:** только **документ** `--- !import path`. Файл — knarr. Его YAML-документы вставляются **на место** этого документа (как будто они написаны во входном потоке). После раскрытия всех `!import` — один поток; дальше действуют правила `!policy` / `!typedef` / графа `$Name`.

```yaml
---
!import helpers.yaml
---
!import templates/deploy.yaml
---
!emit
metadata:
  labels: !ref $Labels
```

Общее для обоих:

- Относительный путь — от **каталога файла, где стоит тег** (не от cwd).
- **`..` и абсолютные пути разрешены.** URI (`http://`, `oci://`, `git+…`) — нет (NONGOALS).
- Mapping/sequence у тега — не форма v1 (нужен scalar-путь).
- Вложенность: `!read` только из knarr; в файле `!read` тегов knarr нет. `!import` может содержать `!import` / `!read`. Цикл файлов — ошибка.
- Нет CLI `-f` / `--set`: все значения — в YAML / `!read` / сплайсе `!import`.

**`!read` — дополнительно:**

- Ровно **один** YAML-документ (**69**); JSON как YAML 1.2 — ок; multi-doc — ошибка. Пустой файл — ошибка.
- **Якоря (70):** `&` / `*` / `<<:` в файле `!read` допустимы; результат — развёрнутое дерево. Цикл — ошибка. В knarr-документе (в т.ч. `!import`) те же конструкции — ошибка.
- Локальные теги knarr (`!bind`, `!ref`, `!expr`, `!match`, `!foreach`, `!concat`, `!join`, `!split`, `!format`, `!b64enc`, `!b64dec`, `!len`, `!sha256`, `!merge`, `!range`, `!is-empty`, `!is-not-empty`, `!skip-empty`, `!and`, `!or`, `!int`, `!str`, `!bool`, `!float`, `!to-json-str`, `!from-json-str`, `!sha256-json`, `!pick`, `!validation`, `!emit`, `!emit?`, `!emit-foreach`, `!emit-foreach?`, `!emit-range`, `!emit-range?`, `!import`, `!read`, `!policy`, `!typedef`, `!not`, `!$Type`) — **ошибка**. Core-теги YAML 1.2 (`!!str`, `!!int`, …) **в файле `!read` допустимы** (данные, не knarr; решение **55**). **`!!ref`** в `!read` — ошибка. **`!!null`** в `!read` = YAML null ≡ нет ключа / omit корня (**130**).
- `$Name: !$T` и `$Name: !read` — два тега, нельзя.
- Свои ключи файла **не** становятся `$Name`.

**`!import` — дополнительно:**

- Не значение: `$Values: !import x.yaml`, `labels: !import x.yaml`, `$yield: !import x.yaml` — **ошибка**.
- Каждый документ файла — валидный knarr (`!bind` / `!emit` / **`!emit?`** / `!emit-foreach` / **`!emit-foreach?`** / **`!emit-range`** / **`!emit-range?`** / `!import` / **`!validation`** / prelude `!policy`/`!typedef`). Голый mapping — ошибка (29B).
- Multi-doc **можно** (в этом смысл нарезки).
- `$Name` из вставленных `!bind` / ключи `!typedef` — **в глобальный граф**; дубликат — ошибка.
- `!emit` / **`!emit?`** / `!emit-foreach` / **`!emit-foreach?`** / **`!emit-range`** / **`!emit-range?`** из файла попадают в stdout в порядке **составного** потока.
- `!policy` / единственный `!typedef` проверяются **после** flatten: `!policy` только первый документ всего render; второй `!policy` — ошибка.
- Тегов **`!define` / `!include` нет**. Фрагмент поля с `$as` через файл — не в v1.

### 3.9 Вывод: порядок ключей и сериализация

**Закрыто (вариант C):** порядок ключей **как во входе** (не алфавит). Goldens — **byte-for-byte**.

Порядок:

- mapping в `!emit` / `$yield` — как в исходном YAML;
- typed bind **`!$Type`**: ключи **схемы**, затем extra (**soft**) в порядке instance;
- sequence и `$over` у `!foreach` / `!emit-foreach` — порядок списка **или ключей mapping** (17, 41);
- документы stdout — порядок `!emit` / **`!emit?`** / `!emit-foreach` / **`!emit-range`** в **составном** потоке (после flatten `!import`).

Сериализатор stdout:

- YAML 1.2, UTF-8 без BOM, только **LF**;
- отступ **2 пробела**, block-style (не flow `{ }` / `[ ]`);
- первый документ **без** ведущего `---`; следующие разделены `\n---\n`;
- ровно один `\n` в конце потока, если был хотя бы один документ;
- ноль `!emit` / все `!emit?` с ложным `$when` или omit **`$yield?:`** / `!emit-foreach` / **`!emit-range`** / все `$else-yield: ""` / `$when` ложь на emit-цикле / пустой `$over` / пустой ряд / все `$filter` ложны / все **`$yield?:`** omit → **пустой** stdout (0 байт), exit 0;
- `true` / `false`; десятичные int без кавычек; finite **float** — YAML plain (`0.5`, `2.5`), round-trip к тому же f64; не `.inf`;
- строки без кавычек, если допустим YAML plain scalar, иначе `"`;
- **`null` / `~` в выводе нет**.

Goldens: сравнение stdout с `expected.yaml` **байт-в-байт** (файлы в репо — LF).

### 3.10 Граф `$Name`: forward-ref и циклы

**Закрыто (вариант A):** язык **декларативный**. Порядок документов не задаёт видимость bind.

1. Собрать все `$Name` из документов **`!bind`** и ключи `!typedef`. Дубликат имени — ошибка.
2. Оценивать лениво с мемоизацией. Неизвестный `$Foo` — ошибка.
3. **Forward-ref можно:** `!emit` / `$A` выше в файле может делать `!ref $Values`, объявленный ниже.
4. **Цикл** (`$A → $B → $A`, `$X: !ref $X`, цикл файлов **`!import`**) — ошибка; в сообщении цепочка `$Name` или путей.
5. Bind **атомарный:** пока `$A` считается, любой `!ref $A` / `!ref $A.x` — цикл. Поле `$A.y: !ref $A.x` **нельзя** (нужны отдельные `$Name`).
6. Все top-level `$Name` **форсятся** даже если нигде не referenced (чтобы поймать strict/ошибки).
7. `$as` у `!foreach` — не глобальный граф, только `$yield`.
8. Документы **`!emit`** пишутся в **порядке составного потока** (после flatten `!import`), не в порядке зависимостей. Слоты emit набираются при обходе исходника после того, как нужные bind уже можно вычислить (в т.ч. вперёд).
9. **`!validation` (61):** после форса bind, до emit; см. §3.2.4.

`!policy` / `!typedef` — prelude. Имена instance — только из **`!bind`**. Теги **`!$Type`** применяются при оценке этих bind.

---

## 4. CLI (v1)

Один Rust binary, без зависимости от Helm.

```text
knarr render <file> [-o <output>] [--trace]
```

| Arg / flag | Meaning |
|------------|---------|
| `<file>` | Путь к YAML-файлу knarr (обязателен; не `-`, не stdin) |
| `-o <output>` | Файл вывода; если нет — stdout (UTF-8, LF, §3.9) |
| `--trace` | След вычислений в **stderr**; **не** меняет stdout |

- **v1: ровно один** positional `<file>`. `knarr render a.yaml b.yaml` → **≠ 0**.
- **v1: вход только файл.** Нет stdin, нет `-` как input. Нет args → usage, **≠ 0**.
- `!read` / `!import`: пути от каталога **файла с тегом**. `..` и абсолютные пути допустимы. Нет URI.
- **Exit (57, 61):** **0** = успех (в т.ч. только `$warning`). **`$fail` у `!validation` → 1**. Прочие ошибки языка / YAML / I/O / usage → **≠ 0** (коды 2/3 — не норматив v1).

Запрещены: `--set`, `-f` / `--values`, `--namespace` / `--release-name`, `--repo` / remote fetch.

`--trace` (информативно): load / `!read` / flatten `!import` → `!bind` / `$Name` → `!$Type` / `!policy` → when / `!match` / foreach / emit-foreach / `!validation` → `!expr` / `!ref` / `?:` → emit. Формат **не в v1** (решение **56**): stderr only. Несколько positional / stdin — [CLI_TODO_v2.md](CLI_TODO_v2.md) (решение **126**).

---

## 5. Реализация

CLI + evaluator + ≥10 goldens — [CLI_TODO.md](CLI_TODO.md) (решение **125**; по явному запросу). Suite: [goldens/README.md](goldens/README.md). Вывод детерминированный (§3.9); ошибки с документом / путём / `$Name`. В guide Helm **`required`** (сбой: нет stdout) = **`!validation`** (**129**).
