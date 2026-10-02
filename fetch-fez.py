import urllib.request
import json
import re

url = "https://fez-delivery-co.gitbook.io/fezcorporate-api-docs/orders/delivery-cost"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    html = urllib.request.urlopen(req).read().decode('utf-8')
    match = re.search(r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>', html)
    if match:
        data = json.loads(match.group(1))
        # save the whole data to inspect
        with open('fez-docs-cost.json', 'w') as f:
            json.dump(data, f, indent=2)
        print("Saved to fez-docs-cost.json")
    else:
        print("No NEXT_DATA found.")
except Exception as e:
    print(e)
