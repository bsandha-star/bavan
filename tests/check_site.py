#!/usr/bin/env python3
"""Static checks for the Huddle marketing site (no dependencies, no network).

  python3 tests/check_site.py

Checks every page in site/:
  - HTML is well-formed: every element that needs an end tag is closed, in order
    (optional end tags such as </p>, </li>, </option> may be left out, as HTML allows);
  - no duplicate id on a page; <html lang>, one <title> and a viewport meta are present;
  - every local link and asset (href, src, CSS url()) points at a file in site/, and every
    #anchor points at an id that exists on the target page.
And the publishing files:
  - site/CNAME is exactly the live domain (changing it moves huddle.dental);
  - _headers, netlify.toml and vercel.json keep the X-Frame-Options and X-Content-Type-Options headers.
Exits 1 and lists every problem if anything fails.
"""
import json
import os
import re
import sys
from html.parser import HTMLParser
from urllib.parse import unquote, urlsplit

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = os.path.join(ROOT, "site")
LIVE_DOMAIN = "huddle.dental"

VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta",
        "param", "source", "track", "wbr"}
# Elements whose end tag HTML lets authors leave out.
OPTIONAL_END = {"p", "li", "dt", "dd", "option", "optgroup", "tr", "td", "th", "thead",
                "tbody", "tfoot", "colgroup", "rt", "rp", "html", "head", "body"}
LINK_ATTRS = {"href", "src", "xlink:href", "action", "poster"}
EXTERNAL = re.compile(r"^(?:[a-z][a-z0-9+.-]*:|//)", re.I)  # http:, https:, mailto:, tel:, data:, javascript:, //host


class Page(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack, self.errors, self.ids, self.links = [], [], {}, []
        self.titles, self.lang, self.viewport = 0, None, False

    def _attrs(self, tag, attrs):
        line = self.getpos()[0]
        for name, value in attrs:
            if value is None:
                continue
            if name == "id":
                if value in self.ids:
                    self.errors.append(f"line {line}: duplicate id \"{value}\" (first on line {self.ids[value]})")
                else:
                    self.ids[value] = line
            if name in LINK_ATTRS:
                self.links.append((line, value.strip()))
            if name == "srcset":
                for part in value.split(","):
                    if part.strip():
                        self.links.append((line, part.strip().split()[0]))
        a = dict(attrs)
        if tag == "html":
            self.lang = a.get("lang")
        if tag == "title":
            self.titles += 1
        if tag == "meta" and (a.get("name") or "").lower() == "viewport":
            self.viewport = True

    def handle_starttag(self, tag, attrs):
        self._attrs(tag, attrs)
        if tag not in VOID:
            self.stack.append((tag, self.getpos()[0]))

    def handle_startendtag(self, tag, attrs):  # <path .../> in SVG, <br/>
        self._attrs(tag, attrs)

    def handle_endtag(self, tag):
        line = self.getpos()[0]
        if tag in VOID:
            return
        if not any(t == tag for t, _ in self.stack):
            self.errors.append(f"line {line}: </{tag}> has no matching <{tag}>")
            return
        while self.stack:
            t, opened = self.stack.pop()
            if t == tag:
                return
            if t not in OPTIONAL_END:
                self.errors.append(f"line {line}: </{tag}> closes <{tag}> but <{t}> from line {opened} is still open")

    def finish(self):
        self.close()
        for t, opened in self.stack:
            if t not in OPTIONAL_END:
                self.errors.append(f"<{t}> from line {opened} is never closed")
        if not self.lang:
            self.errors.append("<html> has no lang attribute")
        if self.titles != 1:
            self.errors.append(f"expected one <title>, found {self.titles}")
        if not self.viewport:
            self.errors.append("no <meta name=\"viewport\">")


def resolve(ref, from_file):
    """Return (local file path or None for external/same-page, fragment)."""
    if not ref or EXTERNAL.match(ref):
        return None, None
    parts = urlsplit(ref)
    frag = unquote(parts.fragment) if parts.fragment else None
    path = unquote(parts.path)
    if not path:
        return from_file, frag
    base = SITE if path.startswith("/") else os.path.dirname(from_file)
    target = os.path.normpath(os.path.join(base, path.lstrip("/")))
    if os.path.isdir(target):
        target = os.path.join(target, "index.html")
    elif not os.path.exists(target) and os.path.exists(target + ".html"):
        target += ".html"  # clean URLs (/privacy -> privacy.html) work on Pages, Netlify and Vercel
    return target, frag


def main():
    problems = []
    pages = {}
    for dirpath, _, files in os.walk(SITE):
        for f in sorted(files):
            if f.endswith(".html"):
                full = os.path.join(dirpath, f)
                p = Page()
                with open(full, encoding="utf-8") as fh:
                    p.feed(fh.read())
                p.finish()
                pages[full] = p
    if not pages:
        problems.append("site/: no HTML pages found")

    for full, p in pages.items():
        rel = os.path.relpath(full, ROOT)
        problems += [f"{rel}: {e}" for e in p.errors]
        for line, ref in p.links:
            target, frag = resolve(ref, full)
            if target is None:
                continue
            if not target.startswith(SITE + os.sep):
                problems.append(f"{rel}:{line}: \"{ref}\" points outside site/")
            elif not os.path.exists(target):
                problems.append(f"{rel}:{line}: \"{ref}\" -> missing file {os.path.relpath(target, ROOT)}")
            elif frag and target.endswith(".html") and frag not in pages[target].ids:
                problems.append(f"{rel}:{line}: \"{ref}\" -> no id=\"{frag}\" on {os.path.relpath(target, ROOT)}")

    for dirpath, _, files in os.walk(SITE):
        for f in files:
            if f.endswith(".css"):
                full = os.path.join(dirpath, f)
                with open(full, encoding="utf-8") as fh:
                    css = fh.read()
                for m in re.finditer(r"url\(\s*['\"]?([^'\")]+)['\"]?\s*\)", css):
                    target, _ = resolve(m.group(1).strip(), full)
                    if target and not os.path.exists(target):
                        problems.append(f"{os.path.relpath(full, ROOT)}: url({m.group(1)}) -> missing file")

    cname = os.path.join(SITE, "CNAME")
    try:
        with open(cname, encoding="utf-8") as fh:
            value = fh.read().strip()
        if value != LIVE_DOMAIN:
            problems.append(f"site/CNAME is \"{value}\", expected \"{LIVE_DOMAIN}\" (changing it moves the live domain; "
                            "if that is intended, update LIVE_DOMAIN in tests/check_site.py in the same PR)")
    except OSError:
        problems.append("site/CNAME is missing (GitHub Pages would drop the huddle.dental custom domain)")

    for name in ("site/_headers", "netlify.toml", "vercel.json"):
        path = os.path.join(ROOT, name)
        try:
            with open(path, encoding="utf-8") as fh:
                text = fh.read()
        except OSError:
            problems.append(f"{name} is missing")
            continue
        if name.endswith(".json"):
            try:
                json.loads(text)
            except ValueError as e:
                problems.append(f"{name} is not valid JSON: {e}")
        for header in ("X-Frame-Options", "X-Content-Type-Options"):
            if header not in text:
                problems.append(f"{name} no longer sets {header}")

    links = sum(len(p.links) for p in pages.values())
    if problems:
        print(f"FAIL: {len(problems)} problem(s) in {len(pages)} page(s):")
        for pr in problems:
            print("  - " + pr)
        return 1
    print(f"OK: {len(pages)} pages well-formed, {links} links/assets checked, CNAME and security headers in place")
    return 0


if __name__ == "__main__":
    sys.exit(main())
