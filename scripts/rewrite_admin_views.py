#!/usr/bin/env python3
"""Rewrite admin-views.tsx: keep AdminLoginView, replace old AdminPanelView with Backoffice wrapper."""
import re

PATH = "/home/z/my-project/src/components/site/admin-views.tsx"
with open(PATH, "r", encoding="utf-8") as f:
    lines = f.readlines()

# 1) Truncate to end of AdminLoginView (line 225, 1-indexed)
lines = lines[:225]

# 2) Remove old data-seed / shared-bits block (lines 17-103, 1-indexed)
del lines[16:103]

text = "".join(lines)

# 3) Replace the react + lucide import block with the trimmed one
old_imports = '''import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ShieldCheck, Users, ArrowLeftRight, FileCheck2, LogOut, Search, Wallet,
  TrendingUp, Ticket, Activity, CheckCircle2, XCircle, Ban, RotateCcw, Info, ArrowLeft,
} from "lucide-react";'''
new_imports = '''import { useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Info, ArrowLeft } from "lucide-react";'''
assert old_imports in text, "import block not found"
text = text.replace(old_imports, new_imports)

# 4) Add Backoffice import after the cn import
old_cn = 'import { cn } from "@/lib/utils";'
new_cn = 'import { cn } from "@/lib/utils";\nimport { Backoffice } from "@/components/admin/shell";'
assert old_cn in text, "cn import not found"
text = text.replace(old_cn, new_cn, 1)

# 5) Append the new thin AdminPanelView
text = text.rstrip() + '''

/* ---------------- Admin panel (full backoffice replica) ---------------- */

export function AdminPanelView({ onSignOut }: { t?: (k: StringKey) => string; onSignOut: () => void }) {
  return <Backoffice onSignOut={onSignOut} />;
}
'''

with open(PATH, "w", encoding="utf-8") as f:
    f.write(text)

print("admin-views.tsx rewritten OK")
