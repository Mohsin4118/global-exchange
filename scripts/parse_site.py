#!/usr/bin/env python3
"""Parse globexchange.co.uk pages: extract text, links, and metadata."""
import json
import re
import sys
from html.parser import HTMLParser


class TextExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.text_parts = []
        self.links = []
        self.skip_depth = 0
        self.skip_tags = {'script', 'style', 'noscript'}
        self.current_href = None
        self.link_text = []

    def handle_starttag(self, tag, attrs):
        if tag in self.skip_tags:
            self.skip_depth += 1
            return
        attrs_dict = dict(attrs)
        if tag == 'a':
            href = attrs_dict.get('href', '')
            self.current_href = href
            self.link_text = []
        if tag in ('h1', 'h2', 'h3', 'h4'):
            self.text_parts.append(f"\n\n[{tag.upper()}] ")

    def handle_endtag(self, tag):
        if tag in self.skip_tags:
            self.skip_depth = max(0, self.skip_depth - 1)
            return
        if tag in ('h1', 'h2', 'h3', 'h4', 'p', 'div', 'li', 'tr', 'section'):
            self.text_parts.append("\n")
        if tag == 'a' and self.current_href is not None:
            txt = ' '.join(''.join(self.link_text).split())
            if txt:
                self.links.append((txt, self.current_href))
            self.current_href = None
            self.link_text = []

    def handle_data(self, data):
        if self.skip_depth > 0:
            return
        stripped = data.strip()
        if stripped:
            self.text_parts.append(stripped + " ")
            if self.current_href is not None:
                self.link_text.append(stripped + " ")


def parse_file(path):
    with open(path) as f:
        data = json.load(f)
    d = data.get('data', data)
    html = d.get('html', '')

    # meta description
    meta_desc = d.get('description', '')
    metadata = d.get('metadata', {}) or {}

    parser = TextExtractor()
    try:
        parser.feed(html)
    except Exception as e:
        print(f"[parse warning: {e}]")

    text = ''.join(parser.text_parts)
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = re.sub(r'[ \t]{2,}', ' ', text)

    # dedupe links preserving order
    seen = set()
    unique_links = []
    for txt, href in parser.links:
        key = (txt, href)
        if key not in seen:
            seen.add(key)
            unique_links.append((txt, href))

    return {
        'title': d.get('title', ''),
        'url': d.get('url', ''),
        'description': meta_desc,
        'metadata': metadata,
        'text': text,
        'links': unique_links,
    }


if __name__ == '__main__':
    path = sys.argv[1]
    mode = sys.argv[2] if len(sys.argv) > 2 else 'all'
    result = parse_file(path)
    print(f"=== TITLE: {result['title']}")
    print(f"=== URL: {result['url']}")
    print(f"=== DESCRIPTION: {result['description']}")
    if result['metadata']:
        print(f"=== METADATA: {json.dumps(result['metadata'], indent=2)[:2000]}")
    if mode in ('all', 'text'):
        print("\n=== TEXT CONTENT ===")
        print(result['text'])
    if mode in ('all', 'links'):
        print("\n=== LINKS ===")
        for txt, href in result['links']:
            print(f"  {txt} -> {href}")
