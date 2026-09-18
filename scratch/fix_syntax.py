import os

file_path = 'src/app/(dashboard)/dashboard/products/actions.ts'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the broken string interpolation that PowerShell corrupted
content = content.replace("fullDescription += - **:** \\n", "fullDescription += `\\n- **${key}:** ${value}`")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

