import json
import re

with open(r'C:\Users\USER\.gemini\antigravity\brain\4d16257e-9c31-4904-a0c6-caae2f47d325\.system_generated\steps\8661\content.md', 'r', encoding='utf-8') as f:
    html = f.read()

# Try to find __NEXT_DATA__ script
match = re.search(r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>', html)
if match:
    data = json.loads(match.group(1))
    print("Found NEXT_DATA")
    # Dig into the data to find pages/routes
else:
    print("No NEXT_DATA found.")
    
# Or let's just use beautifulsoup to extract all text
from bs4 import BeautifulSoup
soup = BeautifulSoup(html, 'html.parser')
print(soup.get_text()[:2000])

