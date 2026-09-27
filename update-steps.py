import glob, os, re

files = glob.glob('src/app/(dashboard)/dashboard/products/new/*-builder.tsx')

changed = 0
for file in files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()

    if '<LogisticsFields' not in content: continue
    if '{ id: \'logistics\', label: \'Shipping\' }' in content: continue

    # 1. Update STEPS
    content = re.sub(
        r'\{\s*id:\s*\'review\'\s*,\s*label:\s*\'Review\'\s*\}',
        '{ id: \'logistics\', label: \'Shipping\' },\n  { id: \'review\', label: \'Review\' }',
        content
    )

    # 2. Wrap LogisticsFields in step 6
    logistics_replacement = """<div className={currentStep === 6 ? 'block' : 'hidden'}>
          <div className="text-center mb-8">
            <div className="mx-auto h-16 w-16 bg-black text-white rounded-full flex items-center justify-center mb-4">
              <Check className="h-8 w-8" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">Package Details</h2>
            <p className="text-gray-500 mt-2">Set the physical dimensions and weight for logistics.</p>
          </div>
          <LogisticsFields productType={productType} />
          
          <div className="mt-12 flex justify-between gap-4">
            <button type="button" onClick={handleBack} className="px-6 py-3 border rounded-lg font-medium text-gray-700 hover:bg-gray-50">Back</button>
            <button type="button" onClick={handleNext} className="bg-black text-white px-6 py-3 rounded-lg font-medium">
              Continue to Review
            </button>
          </div>
        </div>"""
    
    content = re.sub(
        r'<LogisticsFields\s+productType=\{productType\}\s*/>',
        logistics_replacement,
        content
    )

    # 3. Change review step from currentStep === 6 to currentStep === 7
    target_regex = r'<div className=\{currentStep === 6 \? \'block\' : \'hidden\'\}>(\s*<div className="text-center mb-8">\s*<div className="mx-auto h-16 w-16 bg-black text-white rounded-full flex items-center justify-center mb-4">\s*<Check className="h-8 w-8" />\s*</div>\s*<h2 className="text-3xl font-bold tracking-tight text-gray-900">Ready to Publish</h2>)'
    content = re.sub(target_regex, r'<div className={currentStep === 7 ? \'block\' : \'hidden\'}>\g<1>', content)

    # 4. Also update the comment if present
    content = content.replace('{/* --- STEP 6: REVIEW --- */}', '{/* --- STEP 7: REVIEW --- */}')

    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)
    changed += 1

print(f'Changed {changed} files')
