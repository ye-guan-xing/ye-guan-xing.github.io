#!/usr/bin/env python3
"""Strip structural numbering prefixes from markdown heading lines in blog posts."""

import re
from pathlib import Path

SKIP_FILES = {
    "从数学与工程底层看懂大语言模型：它为何能对话、执行任务",
    "拆解Claude内部\u201c思考\u201d机制：可解释性研究揭开大模型的真相",
}

CN_NUM = "一二三四五六七八九十百千万"

PATTERNS = [
    re.compile(rf"^(#{{1,4}}\s*)[{CN_NUM}]+、\s*"),
    re.compile(rf"^(#{{1,4}}\s*[^#\n]*?)阶段[{CN_NUM}]+[：:]\s*"),
    re.compile(r"^(#{1,4}\s*)第\s*\d+\s*步[：:]\s*"),
    re.compile(r"^(#{1,4}\s*)Step\s*\d+[：:]\s*", re.IGNORECASE),
    re.compile(r"^(#{1,4}\s*)\*\*步骤\s*\d+[：:]\s*"),
    re.compile(r"^(#{1,4}\s*)步骤\s*\d+[：:]\s*"),
    re.compile(r"^(#{1,4}\s*)\*\*问题\s*\d+[：:]\s*"),
    re.compile(r"^(#{1,4}\s*)\d+\.\d+\s+"),
    re.compile(r"^(#{1,4}\s*)\d+\\\.\d+\s+"),
    re.compile(r"^(#{1,4}\s*)\*\*\d+\.\s+"),
    re.compile(r"^(#{1,4}\s*)\d+\\\.\s+"),
    re.compile(r"^(#{1,4}\s*)\d+\.\s+"),
    re.compile(r"^(#{1,4}\s*)（\d+）\s*"),
    re.compile(r"^(#{1,4}\s*)模板\d+[：:]\s*"),
    re.compile(r"^(#{1,4}\s*)\d+\s+(?=[\u4e00-\u9fffA-Za-z])"),
]


def strip_heading(line: str) -> str:
    if not re.match(r"^#{1,4}\s", line):
        return line
    prev = None
    while prev != line:
        prev = line
        for pattern in PATTERNS:
            line = pattern.sub(r"\1", line, count=1)
            if line != prev:
                break
    return line


def process_file(path: Path) -> int:
    text = path.read_text(encoding="utf-8")
    lines = text.splitlines(keepends=True)
    changed = 0
    new_lines = []
    for line in lines:
        stripped = line.rstrip("\n\r")
        new_stripped = strip_heading(stripped)
        if new_stripped != stripped:
            changed += 1
        ending = ""
        if line.endswith("\r\n"):
            ending = "\r\n"
        elif line.endswith("\n"):
            ending = "\n"
        new_lines.append(new_stripped + ending)
    if changed:
        path.write_text("".join(new_lines), encoding="utf-8")
    return changed


def main():
    post_dir = Path(__file__).parent / "post"
    total_files = 0
    total_changes = 0
    for path in sorted(post_dir.glob("**/index.md")):
        if path.parent.name in SKIP_FILES:
            print(f"SKIP  {path.parent.name}")
            continue
        n = process_file(path)
        if n:
            total_files += 1
            total_changes += n
            print(f"OK    {path.parent.name}: {n} headings")
    print(f"\nDone: {total_files} files, {total_changes} headings updated")


if __name__ == "__main__":
    main()
