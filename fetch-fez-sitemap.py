import urllib.request
import re

url = "https://fez-delivery-co.gitbook.io/fezcorporate-api-docs/sitemap.xml"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    xml = urllib.request.urlopen(req).read().decode('utf-8')
    urls = re.findall(r'<loc>(.*?)</loc>', xml)
    for u in urls:
        print(u)
except Exception as e:
    print(e)
