import os

with open('src/lib/email.ts', 'r', encoding='utf-8') as f:
    content = f.read()

old_style = 'background: linear-gradient(135deg, #4f46e5 0%, #ec4899 100%);'
new_style = 'background: #ea580c;'

if old_style in content:
    new_content = content.replace(old_style, new_style)
    with open('src/lib/email.ts', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Replaced background color successfully!")
else:
    print("Could not find the old background style.")
