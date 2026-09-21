# `!not-empty` vs Helm

Helm `if .Values.sidecars` treats many empties as false. knarr `!not-empty` uses the Helm `empty` table (omit, `""`, `[]`, `{}`, `false`, `0`). Missing still needs `?.`.
