# SPEC_TODO_v2

Один список **развёрнутых вопросов**, которые **не решаем в v1**. Решённое в v2 — удалять.

Имена `$Release` / `$Chart` / `$Capabilities` в v1 заняты; семантика Helm-объектов — здесь. CLI «не в v1» — [CLI_TODO_v2.md](CLI_TODO_v2.md).

---

- [ ] Helm **`.Release` / `.Chart` / `.Capabilities`**: объекты, инжект или нет, `APIVersions.Has`, kube version, `IsInstall`/`IsUpgrade`?
- [ ] Host `release.*` / `chart.*` (если вообще понадобятся)?
- [ ] Вложенный **`!$Type`**: поле bind `nested: !$U`; тег в **`!emit` / `$yield`**; тип **`$over`**?
- [ ] Splat готового списка манифестов (`!emit-foreach` только `$over`)?
- [ ] **`$index`** у `!foreach` / `!emit-foreach` (Helm `range $i, $v`)?
- [ ] Named Helm **`define`/`include`**: `!define` / `!include` / `!import` на **значении** (фрагмент knarr в скоупе `$as`)?
- [ ] Вызовы `size` / `string` / `int` / `has` / `exists` / `map` и тернарник **`c ? t : f`**?
- [ ] Host **`quote` / `trim` / `replace` / `semver*`** и прочий sprig?
- [ ] **`$over?:`**: вернуть (в v1 ключ отвергнут; omit **значения** `$over` у foreach уже есть)?
- [ ] Core YAML **`!!str` / `!!int` / `!!bool`** в **документах knarr** (не в `!read`)?
- [ ] Подключать **CEL spec / cel-go / cel-rust** как реализацию `!expr`?
- [ ] **`!read-docs`**: multi-doc YAML → sequence документов (scalar `!read` не менять; не dual-type по числу `---`; не сырой `Files.Get`)?
- [ ] Якоря **`&` / `*` / `<<` в документах knarr** (в `!read` уже можно)?
- [ ] **`!to-yaml-str` / `!from-yaml-str` / `!sha256-yaml`** одним пакетом (канон = сериализатор SPEC §3.9; `!sha256-yaml x` ≡ `!sha256` от `!to-yaml-str x`)?
- [ ] Теги / host **`keys` / `values` / `!keys` / `!values`** (в v1 только `!foreach` + `$key`/`$as`; порядок first-seen vs `sortAlpha`)?
- [ ] Helm **`coalesce` по `empty`** и n-ary **`??`** (в v1 N-way — `!pick`; `""` не пропускается)?
- [ ] **`!last` / host `last` / `$Xs[-1]`** (в v1 — `$I` + `$Xs[$I]`)?
- [ ] K8s **Quantity** (`500m`, `128Mi`) как сорт (в v1 `"500m"` — string; `0.5` — float)?
- [ ] Decimal / точная десятая (`0.1+0.2=0.3`; в v1 IEEE f64)?
- [ ] Чистый путь в **`!expr`**: `$Values.name` / `$Values.x? ?? default` без оператора — разрешить совпадение с `!ref`?
- [ ] Константа как весь **`!expr`**: `"true"` / `"1"` / `"[80, 443]"` / `"{'k': 1}"` — разрешить обёртку константы?
- [ ] **`??` на `!not`**: `!not $X.y? ?? false` — разрешить default-then-not одним тегом?
- [ ] Per-operand default не через смену `??` (`($a ?? 0) + ($b ?? 1)`): другой сахар, не разрез скаляра?
