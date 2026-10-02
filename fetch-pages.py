import urllib.request
import re
import html

urls = [
    "https://fez-delivery-co.gitbook.io/fezcorporate-api-docs/api-endpoints/orders/fetch-delivery-cost",
    "https://fez-delivery-co.gitbook.io/fezcorporate-api-docs/api-endpoints/orders/create",
    "https://fez-delivery-co.gitbook.io/fezcorporate-api-docs/api-endpoints/orders/track",
    "https://fez-delivery-co.gitbook.io/fezcorporate-api-docs/api-endpoints/webhook/order-webhook-request",
    "https://fez-delivery-co.gitbook.io/fezcorporate-api-docs/api-endpoints/orders/states"
]

def clean_html(raw_html):
    # Remove script and style elements
    text = re.sub(r'<(script|style).*?>.*?</\1>', '', raw_html, flags=re.IGNORECASE | re.DOTALL)
    # Remove all HTML tags
    text = re.sub(r'<[^>]+>', ' ', text)
    # Replace HTML entities
    text = html.unescape(text)
    # Condense whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    return text

for url in urls:
    print("\n---", url, "---")
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        raw = urllib.request.urlopen(req).read().decode('utf-8')
        # We can try to extract the main content area by looking for <main> or article
        main_match = re.search(r'<main.*?>(.*?)</main>', raw, flags=re.IGNORECASE | re.DOTALL)
        if main_match:
            print(clean_html(main_match.group(1)))
        else:
            print("No main tag found. First 500 chars:")
            print(clean_html(raw)[:500])
    except Exception as e:
        print(e)
