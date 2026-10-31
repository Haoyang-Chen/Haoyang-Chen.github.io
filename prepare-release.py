#!/usr/bin/env python3
"""Prepare an isolated publishable site; leave the original routes untouched."""
import argparse
from collections import deque
from html.parser import HTMLParser
from pathlib import Path
import re
import shutil
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parent
PAGES = {'glass.html': 'index.html', **{f'{p}/preview.html': f'{p}/index.html' for p in ('editable-xrl', 'trellis', 'editable-xai')}}

class Resources(HTMLParser):
    def __init__(self):
        super().__init__()
        self.urls = []
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        self.urls += [attrs[k] for k in ('src', 'href') if attrs.get(k)]
        self.urls += [entry.strip().split()[0] for entry in attrs.get('srcset', '').split(',') if entry.strip()]

def prepare(destination):
    if destination == ROOT or destination in ROOT.parents or ROOT in destination.parents:
        raise ValueError('Choose an output directory outside the source repository.')
    if destination.exists() and any(destination.iterdir()):
        raise ValueError('Output directory must be new or empty; existing files are never deleted.')
    destination.mkdir(parents=True, exist_ok=True)
    queued = deque()
    for source, target in PAGES.items():
        text = (ROOT / source).read_text()
        for project in ('editable-xrl', 'trellis', 'editable-xai'):
            text = text.replace(f'{project}/preview.html', f'{project}/')
        text = text.replace('../glass.html', '../')
        output = destination / target
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_text(text)
        parser = Resources()
        parser.feed(text)
        queued.extend((Path(target).parent, url) for url in parser.urls)
    copied = set()
    while queued:
        parent, url = queued.popleft()
        parsed = urlsplit(url)
        if parsed.scheme or parsed.netloc or not parsed.path:
            continue
        relative = Path(unquote(parsed.path))
        source = (ROOT / (relative.as_posix().lstrip('/') if relative.is_absolute() else parent / relative)).resolve()
        if source.is_dir():
            target = source.relative_to(ROOT) / 'index.html'
            if target.as_posix() not in PAGES.values():
                raise ValueError(f'Unknown local page: {url}')
            continue
        if not source.is_relative_to(ROOT) or not source.is_file():
            raise ValueError(f'Missing or out-of-repository resource: {url}')
        relative = source.relative_to(ROOT)
        if relative in copied:
            continue
        if source.suffix == '.html':
            raise ValueError(f'Unexpected old HTML route in release: {url}')
        output = destination / relative
        output.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, output)
        copied.add(relative)
        if source.suffix == '.css':
            queued.extend((relative.parent, match.strip(' \"\'')) for match in re.findall(r'url\(([^)]+)\)', source.read_text()))
    (destination / '.nojekyll').touch()
    print(f'Ready: {destination} ({len(PAGES)} pages, {len(copied)} resources). No publication performed.')

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('destination', type=lambda value: Path(value).expanduser().resolve())
    prepare(parser.parse_args().destination)
