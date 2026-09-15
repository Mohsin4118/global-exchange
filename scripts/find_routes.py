#!/usr/bin/env python3
"""Find internal links/routes in the homepage HTML."""
import json
import re
from collections import Counter

with open('/home/z/my-project/scripts/globexchange_home.json') as f:
    data = json.load(f)
html = data['data']['html']

hrefs = re.findall(r'href=["\']([^"\']*)["\']', html)
uniq = sorted(set(h for h in hrefs if h and not h.startswith('mailto:')))
print('INTERNAL HREFS:')
for h in uniq:
    print(' ', h)

routes = re.findall(r'"(/[a-zA-Z0-9\-_/]*)"', html)
c = Counter(routes)
print('\nROUTE-LIKE STRINGS (top 40):')
for r, n in c.most_common(40):
    print(f'  {r} x{n}')

# Look for nav menu items in JSON payload (Next.js often embeds page data)
for kw in ['markets', 'trading', 'investing', 'about', 'help', 'security', 'login', 'register', 'signup']:
    matches = re.findall(r'[^"\']*' + kw + r'[^"\']*', html.lower())
    if matches:
        sample = sorted(set(m[:80] for m in matches))[:5]
        print(f'\nKEYWORD {kw}: {len(matches)} occurrences, samples:')
        for s in sample:
            print('   ', s[:100])
