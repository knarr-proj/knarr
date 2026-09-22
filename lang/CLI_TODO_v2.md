# CLI_TODO_v2

Один список **развёрнутых вопросов CLI**, которые **не решаем в v1**. Решённое в v2 — удалять.

CLI v1 — [CLI_TODO.md](CLI_TODO.md). Язык «не в v1» — [SPEC_TODO_v2.md](SPEC_TODO_v2.md).

---

- [ ] Формат **`--trace`**: текст vs JSON Lines vs схема событий (в v1: флаг есть, stderr, stdout не меняет)?
- [ ] Схема **exit codes** 1/2/3 (язык vs usage vs YAML; в v1 только **0 vs ≠ 0**)?
- [ ] Несколько **positional** на `knarr render` без overlay: конкат графа vs независимые render vs запрет?
- [ ] stdin / `-` как вход (не путать с overlay `-f`/`--set`)?
