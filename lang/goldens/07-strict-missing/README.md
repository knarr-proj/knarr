# 07-strict-missing
Негативный: `!ref $Values.image` без `?.` → exit ≠ 0 **всегда** (решение 27: не зависит от `!policy`).
