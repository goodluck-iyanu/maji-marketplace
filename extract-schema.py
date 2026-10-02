import os
import re

migrations_dir = 'supabase/migrations'
files = sorted([f for f in os.listdir(migrations_dir) if f.endswith('.sql')])

schema = {}

for f in files:
    with open(os.path.join(migrations_dir, f), 'r', encoding='utf-8') as file:
        content = file.read()
        
        # very basic CREATE TABLE extraction
        creates = re.findall(r'create table if not exists\s+public\.(\w+)\s*\((.*?)\);', content, re.IGNORECASE | re.DOTALL)
        for tbl, cols in creates:
            schema[tbl.lower()] = cols.strip()
            
        creates_no_public = re.findall(r'create table\s+(\w+)\s*\((.*?)\);', content, re.IGNORECASE | re.DOTALL)
        for tbl, cols in creates_no_public:
            if tbl.lower() not in ['public', 'if']:
                schema[tbl.lower()] = cols.strip()

for tbl, cols in schema.items():
    print(f"\n--- TABLE: {tbl} ---")
    lines = [l.strip() for l in cols.split('\n') if l.strip()]
    for l in lines:
        print(l)
