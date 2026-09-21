# `!from-json-str` vs Helm

Helm `fromJson` vs knarr tag. Integer vs float split follows Go JSON (no exponent → int). `null` fails in knarr; Helm may produce nil.
