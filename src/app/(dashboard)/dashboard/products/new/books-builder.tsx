'use client'

import { useState, useActionState, useRef } from 'react'
import { useDraftAutoSave } from '../hooks/useDraftAutoSave'
import { ArrowLeft, Check, Upload, X, Loader2, PlusCircle, Trash2, BookOpen, Book, GraduationCap, Baby, Calendar, PenTool, Palette, Ruler, FileText, Paperclip, Folder, Briefcase, Scissors, Tag, Printer, Calculator, Mail, Heart, Gift, MoreHorizontal } from 'lucide-react'
import Link from 'next/link'
import { createBooksProductAction } from '../actions'

const STEPS = [
  { id: 'type', label: 'Books Category' },
  { id: 'photos', label: 'Photos' },
  { id: 'specs', label: 'Details' },
  { id: 'basic', label: 'Basic Info' },
  { id: 'options', label: 'Options' },
  { id: 'variants', label: 'Variants' },
  { id: 'review', label: 'Review' },
]

const BOOKS_CATEGORIES = [
  { id: 'fiction', label: 'Fiction Books', icon: BookOpen, subs: ['Novels', 'Romance', 'Mystery & Thriller', 'Fantasy', 'Science Fiction', 'Historical Fiction', 'Adventure', 'Short Stories', 'Poetry', 'African Fiction', 'Children’s Fiction', 'Young Adult Fiction', 'Other Fiction Books'] },
  { id: 'non_fiction', label: 'Non-Fiction Books', icon: Book, subs: ['Biography & Memoir', 'Self-Help', 'Personal Development', 'Business', 'Entrepreneurship', 'Finance', 'History', 'Politics & Government', 'Psychology', 'Philosophy', 'Religion & Spirituality', 'Leadership', 'Productivity', 'Other Non-Fiction Books'] },
  { id: 'academic', label: 'Academic & Educational Books', icon: GraduationCap, subs: ['Textbooks', 'University Textbooks', 'Secondary School Textbooks', 'Primary School Textbooks', 'Study Guides', 'Revision Books', 'Exam Preparation Books', 'Professional Study Materials', 'Reference Books', 'Educational Workbooks', 'Other Educational Books'] },
  { id: 'childrens', label: 'Children’s Books', icon: Baby, subs: ['Picture Books', 'Story Books', 'Activity Books', 'Learning Books', 'Coloring Books', 'Early Reading Books', 'Children’s Bible Books', 'Educational Books', 'Teen Books', 'Children’s Series', 'Other Children’s Books'] },
  { id: 'notebooks', label: 'Notebooks & Journals', icon: Book, subs: ['Exercise Books', 'Notebooks', 'Spiral Notebooks', 'Hardcover Notebooks', 'Softcover Notebooks', 'Writing Journals', 'Bullet Journals', 'Gratitude Journals', 'Prayer Journals', 'Diaries', 'Planners', 'Sketchbooks', 'Other Notebooks & Journals'] },
  { id: 'planners', label: 'Planners & Organizers', icon: Calendar, subs: ['Daily Planners', 'Weekly Planners', 'Monthly Planners', 'Yearly Planners', 'Academic Planners', 'Business Planners', 'Budget Planners', 'Goal Planners', 'Habit Trackers', 'To-Do Pads', 'Desk Planners', 'Other Planners'] },
  { id: 'writing', label: 'Writing Instruments', icon: PenTool, subs: ['Ballpoint Pens', 'Gel Pens', 'Fountain Pens', 'Rollerball Pens', 'Pencils', 'Mechanical Pencils', 'Colored Pencils', 'Markers', 'Highlighters', 'Permanent Markers', 'Whiteboard Markers', 'Calligraphy Pens', 'Pen Sets', 'Pencil Sets', 'Other Writing Instruments'] },
  { id: 'art', label: 'Art & Drawing Supplies', icon: Palette, subs: ['Crayons', 'Colored Pencils', 'Drawing Pencils', 'Charcoal', 'Pastels', 'Markers', 'Sketch Pens', 'Paint Brushes', 'Watercolors', 'Acrylic Paint', 'Oil Paint', 'Drawing Kits', 'Art Sets', 'Canvas', 'Sketch Pads', 'Other Art Supplies'] },
  { id: 'school_supplies', label: 'School & Classroom Supplies', icon: Ruler, subs: ['Rulers', 'Mathematical Sets', 'Geometry Sets', 'Protractors', 'Compasses', 'Pencil Cases', 'Erasers', 'Sharpeners', 'Chalk', 'Whiteboards', 'Whiteboard Accessories', 'Flash Cards', 'School Supply Sets', 'Other School Supplies'] },
  { id: 'paper', label: 'Paper & Printing Supplies', icon: FileText, subs: ['A4 Paper', 'A3 Paper', 'Colored Paper', 'Cardstock', 'Construction Paper', 'Photo Paper', 'Sticky Notes', 'Index Cards', 'Printer Paper', 'Notepads', 'Graph Paper', 'Tracing Paper', 'Envelopes', 'Other Paper Products'] },
  { id: 'office', label: 'Office Stationery', icon: Paperclip, subs: ['Staplers', 'Staples', 'Paper Clips', 'Binder Clips', 'Rubber Bands', 'Scissors', 'Tape', 'Glue', 'Correction Fluid', 'Correction Tape', 'File Folders', 'Document Folders', 'Clipboards', 'Hole Punchers', 'Desk Organizers', 'Other Office Stationery'] },
  { id: 'files', label: 'Files & Document Storage', icon: Folder, subs: ['Ring Binders', 'Lever Arch Files', 'Document Folders', 'Expanding Files', 'File Wallets', 'Presentation Folders', 'Clear Files', 'Document Holders', 'Certificate Holders', 'Passport Holders', 'Business Card Holders', 'Other File Products'] },
  { id: 'bags', label: 'Pencil Cases & School Bags', icon: Briefcase, subs: ['Pencil Cases', 'Pencil Pouches', 'Pen Holders', 'School Backpacks', 'Kids’ Backpacks', 'Laptop Backpacks', 'Lunch Bags', 'Drawstring Bags', 'Book Bags', 'School Bag Sets', 'Other School Bags'] },
  { id: 'crafts', label: 'Craft & DIY Supplies', icon: Scissors, subs: ['Craft Paper', 'Foam Sheets', 'Beads', 'Ribbons', 'Craft Glue', 'Craft Scissors', 'Stickers', 'Glitter', 'Craft Kits', 'DIY Kits', 'Scrapbooking Supplies', 'Origami Paper', 'Other Craft Supplies'] },
  { id: 'stickers', label: 'Stickers & Labels', icon: Tag, subs: ['Decorative Stickers', 'Planner Stickers', 'Educational Stickers', 'Name Labels', 'Product Labels', 'Shipping Labels', 'Address Labels', 'Sticker Sheets', 'Custom Stickers', 'Label Rolls', 'Other Stickers & Labels'] },
  { id: 'printing', label: 'Printing & Binding Supplies', icon: Printer, subs: ['Binding Covers', 'Binding Combs', 'Spiral Binding Supplies', 'Laminating Pouches', 'Laminating Sheets', 'Printing Accessories', 'Ink Cartridges', 'Toner', 'Stamp Pads', 'Other Printing Supplies'] },
  { id: 'calculators', label: 'Calculators & Educational Tools', icon: Calculator, subs: ['Basic Calculators', 'Scientific Calculators', 'Financial Calculators', 'Graphing Calculators', 'Counting Tools', 'Flash Cards', 'Learning Cards', 'Educational Charts', 'Educational Kits', 'Other Educational Tools'] },
  { id: 'mailing', label: 'Mailing & Packaging Stationery', icon: Mail, subs: ['Envelopes', 'Bubble Mailers', 'Mailing Bags', 'Gift Bags', 'Gift Wrap', 'Wrapping Paper', 'Tissue Paper', 'Packaging Labels', 'Thank You Cards', 'Greeting Cards', 'Other Mailing Supplies'] },
  { id: 'cards', label: 'Cards & Invitations', icon: Heart, subs: ['Birthday Cards', 'Wedding Invitations', 'Thank You Cards', 'Greeting Cards', 'Anniversary Cards', 'Valentine’s Cards', 'Christmas Cards', 'Graduation Cards', 'Religious Cards', 'Custom Invitations', 'Invitation Sets', 'Other Cards'] },
  { id: 'learning', label: 'Educational & Learning Materials', icon: BookOpen, subs: ['Flash Cards', 'Alphabet Cards', 'Number Cards', 'Learning Charts', 'Educational Posters', 'Workbooks', 'Activity Sheets', 'Montessori Materials', 'Learning Kits', 'Revision Materials', 'Other Learning Materials'] },
  { id: 'sets', label: 'Book & Stationery Sets', icon: Gift, subs: ['Stationery Sets', 'Writing Sets', 'School Supply Sets', 'Art Sets', 'Journal Sets', 'Planner Sets', 'Gift Sets', 'Study Kits', 'Office Starter Kits', 'Children’s Learning Sets', 'Other Sets'] },
  { id: 'other', label: 'Other', icon: MoreHorizontal, subs: ['Other Books & Stationery'] }
]

const COMMON_OPTION_TYPES = ['Format', 'Cover Type', 'Color', 'Size', 'Count', 'Set Size', 'Language', 'Ink Color']

const compressImage = async (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new window.Image()
      img.src = event.target?.result as string
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX_WIDTH = 1200
        let width = img.width, height = img.height
        if (width > height) { if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH } } 
        else { if (height > MAX_WIDTH) { width *= MAX_WIDTH / height; height = MAX_WIDTH } }
        canvas.width = width; canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, width, height)
        canvas.toBlob((blob) => {
          if (blob) resolve(new File([blob], file.name, { type: 'image/jpeg' }))
          else reject(new Error('Failed'))
        }, 'image/jpeg', 0.8)
      }
      img.onerror = (e) => reject(e)
    }
    reader.onerror = (e) => reject(e)
  })
}

export default function BooksProductBuilder({ productType }: { productType: string | null }) {
  const [currentStep, setCurrentStep] = useState(0)
  
  const [category, setCategory] = useState('')
  const [subCategory, setSubCategory] = useState('')
  const [photos, setPhotos] = useState<File[]>([])
  
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [attributes, setAttributes] = useState<Record<string, string>>({})
  
  const [hasOptions, setHasOptions] = useState<boolean | null>(null)
  
  const [optionsDef, setOptionsDef] = useState<{name: string, values: string[]}[]>([
    { name: 'Shade', values: [] }
  ])
  const [customValueInputs, setCustomValueInputs] = useState<Record<number, string>>({})
  
  const [basePrice, setBasePrice] = useState('')
  const [baseStock, setBaseStock] = useState('')
  const [variants, setVariants] = useState<any[]>([])

  

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [state, formAction, isPending] = useActionState(createBooksProductAction, null)
  const [isCompressing, setIsCompressing] = useState(false)
  const isLoading = isPending || isCompressing
  // ── Auto-save draft to localStorage ──
  const draftState = { currentStep, category, subCategory, name, description, attributes, hasOptions, optionsDef, customValueInputs, basePrice, baseStock, variants }
  const { clearDraft } = useDraftAutoSave('books', draftState, (data) => {
    if (data.currentStep !== undefined) setCurrentStep(data.currentStep)
    if (data.category !== undefined) setCategory(data.category)
    if (data.subCategory !== undefined) setSubCategory(data.subCategory)
    if (data.name !== undefined) setName(data.name)
    if (data.description !== undefined) setDescription(data.description)
    if (data.attributes !== undefined) setAttributes(data.attributes)
    if (data.hasOptions !== undefined) setHasOptions(data.hasOptions)
    if (data.optionsDef !== undefined) setOptionsDef(data.optionsDef)
    if (data.customValueInputs !== undefined) setCustomValueInputs(data.customValueInputs)
    if (data.basePrice !== undefined) setBasePrice(data.basePrice)
    if (data.baseStock !== undefined) setBaseStock(data.baseStock)
    if (data.variants !== undefined) setVariants(data.variants)
  })

  


  const handleNext = () => setCurrentStep(c => Math.min(c + 1, STEPS.length - 1))
  const handleBack = () => setCurrentStep(c => Math.max(c - 1, 0))

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setPhotos(prev => [...prev, ...newFiles].slice(0, 5))
    }
  }
  const handleAttributeChange = (key: string, value: string) => {
    setAttributes(prev => ({ ...prev, [key]: value }))
  }

  const handleAddOptionAxis = () => {
    if (optionsDef.length < 3) {
      setOptionsDef([...optionsDef, { name: 'Volume', values: [] }])
    }
  }

  const handleRemoveOptionAxis = (idx: number) => {
    setOptionsDef(optionsDef.filter((_, i) => i !== idx))
  }

  const handleUpdateOptionName = (idx: number, name: string) => {
    const newDef = [...optionsDef]
    newDef[idx].name = name
    setOptionsDef(newDef)
  }

  const handleAddOptionValue = (idx: number) => {
    const val = customValueInputs[idx]?.trim()
    if (val && !optionsDef[idx].values.includes(val)) {
      const newDef = [...optionsDef]
      newDef[idx].values.push(val)
      setOptionsDef(newDef)
      setCustomValueInputs({ ...customValueInputs, [idx]: '' })
    }
  }

  const handleRemoveOptionValue = (idx: number, val: string) => {
    const newDef = [...optionsDef]
    newDef[idx].values = newDef[idx].values.filter(v => v !== val)
    setOptionsDef(newDef)
  }

  const generateVariants = () => {
    const validAxes = optionsDef.filter(o => o.name && o.values.length > 0)
    if (validAxes.length === 0) {
      setVariants([])
      return
    }

    const cartesian = (arrays: any[][]) => {
      return arrays.reduce((a, b) => a.flatMap(d => b.map(e => [d, e].flat())))
    }

    let permutations = []
    if (validAxes.length === 1) {
      permutations = validAxes[0].values.map(v => [v])
    } else {
      permutations = cartesian(validAxes.map(a => a.values))
    }

    const newVariants = permutations.map(combo => {
      const comboArr = Array.isArray(combo) ? combo : [combo]
      const title = comboArr.join(' / ')
      const optionsObj: Record<string, string> = {}
      validAxes.forEach((axis, i) => {
        optionsObj[axis.name] = comboArr[i]
      })
      return {
        title,
        options: optionsObj,
        price: basePrice,
        stock: baseStock,
        sku: ''
      }
    })
    setVariants(newVariants)
  }

  const activeCategory = BOOKS_CATEGORIES.find(c => c.id === category)

  const renderDynamicSpecs = () => {
    const lowerSub = subCategory.toLowerCase()
    
    if (lowerSub.includes('book') || lowerSub.includes('novel') || lowerSub.includes('guide') || lowerSub.includes('fiction') || lowerSub.includes('material')) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium mb-1">Author</label><input type="text" value={attributes.Author || ''} onChange={e => handleAttributeChange('Author', e.target.value)} className="w-full border rounded-md px-3 py-2" /></div>
          <div><label className="block text-sm font-medium mb-1">Publisher</label><input type="text" value={attributes.Publisher || ''} onChange={e => handleAttributeChange('Publisher', e.target.value)} className="w-full border rounded-md px-3 py-2" /></div>
          <div><label className="block text-sm font-medium mb-1">Format / Cover Type</label>
            <select value={attributes.CoverType || ''} onChange={e => handleAttributeChange('CoverType', e.target.value)} className="w-full border rounded-md px-3 py-2 bg-white">
              <option value="">Select...</option>
              <option value="Paperback">Paperback</option>
              <option value="Hardcover">Hardcover</option>
              <option value="Board Book">Board Book</option>
              <option value="Spiral Bound">Spiral Bound</option>
              <option value="Audiobook CD">Audiobook CD</option>
            </select>
          </div>
          <div><label className="block text-sm font-medium mb-1">Language</label><input type="text" value={attributes.Language || ''} onChange={e => handleAttributeChange('Language', e.target.value)} placeholder="e.g. English, French" className="w-full border rounded-md px-3 py-2" /></div>
          <div><label className="block text-sm font-medium mb-1">ISBN (Optional)</label><input type="text" value={attributes.ISBN || ''} onChange={e => handleAttributeChange('ISBN', e.target.value)} className="w-full border rounded-md px-3 py-2" /></div>
        </div>
      )
    }

    if (lowerSub.includes('pen') || lowerSub.includes('marker') || lowerSub.includes('highlighter') || lowerSub.includes('pencil') || lowerSub.includes('crayon')) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium mb-1">Ink / Lead Color</label><input type="text" value={attributes.InkColor || ''} onChange={e => handleAttributeChange('InkColor', e.target.value)} placeholder="e.g. Black, Blue, Multicolor" className="w-full border rounded-md px-3 py-2" /></div>
          <div><label className="block text-sm font-medium mb-1">Tip Size</label><input type="text" value={attributes.TipSize || ''} onChange={e => handleAttributeChange('TipSize', e.target.value)} placeholder="e.g. 0.5mm, 0.7mm, Fine, Bold" className="w-full border rounded-md px-3 py-2" /></div>
          <div><label className="block text-sm font-medium mb-1">Pack Size / Count</label><input type="text" value={attributes.Count || ''} onChange={e => handleAttributeChange('Count', e.target.value)} placeholder="e.g. 1 Piece, Pack of 10" className="w-full border rounded-md px-3 py-2" /></div>
          <div><label className="block text-sm font-medium mb-1">Brand</label><input type="text" value={attributes.Brand || ''} onChange={e => handleAttributeChange('Brand', e.target.value)} className="w-full border rounded-md px-3 py-2" /></div>
        </div>
      )
    }

    if (lowerSub.includes('notebook') || lowerSub.includes('journal') || lowerSub.includes('planner') || lowerSub.includes('diary')) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium mb-1">Size / Format</label><input type="text" value={attributes.Size || ''} onChange={e => handleAttributeChange('Size', e.target.value)} placeholder="e.g. A4, A5, B5" className="w-full border rounded-md px-3 py-2" /></div>
          <div><label className="block text-sm font-medium mb-1">Page Type</label>
            <select value={attributes.PageType || ''} onChange={e => handleAttributeChange('PageType', e.target.value)} className="w-full border rounded-md px-3 py-2 bg-white">
              <option value="">Select...</option>
              <option value="Ruled / Lined">Ruled / Lined</option>
              <option value="Dotted">Dotted</option>
              <option value="Squared / Graph">Squared / Graph</option>
              <option value="Blank / Plain">Blank / Plain</option>
              <option value="Pre-printed / Planner">Pre-printed / Planner</option>
            </select>
          </div>
          <div><label className="block text-sm font-medium mb-1">Number of Pages / Leaves</label><input type="text" value={attributes.Pages || ''} onChange={e => handleAttributeChange('Pages', e.target.value)} placeholder="e.g. 100 pages, 60 leaves" className="w-full border rounded-md px-3 py-2" /></div>
          <div><label className="block text-sm font-medium mb-1">Cover Type</label><input type="text" value={attributes.CoverType || ''} onChange={e => handleAttributeChange('CoverType', e.target.value)} placeholder="e.g. Hardcover, Spiral, Leather PU" className="w-full border rounded-md px-3 py-2" /></div>
          <div><label className="block text-sm font-medium mb-1">Brand</label><input type="text" value={attributes.Brand || ''} onChange={e => handleAttributeChange('Brand', e.target.value)} className="w-full border rounded-md px-3 py-2" /></div>
        </div>
      )
    }

    if (lowerSub.includes('paper') || lowerSub.includes('card') || lowerSub.includes('envelope')) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium mb-1">Size</label><input type="text" value={attributes.Size || ''} onChange={e => handleAttributeChange('Size', e.target.value)} placeholder="e.g. A4, Letter, 4x6" className="w-full border rounded-md px-3 py-2" /></div>
          <div><label className="block text-sm font-medium mb-1">Weight / Thickness (gsm)</label><input type="text" value={attributes.Weight || ''} onChange={e => handleAttributeChange('Weight', e.target.value)} placeholder="e.g. 80gsm, 250gsm" className="w-full border rounded-md px-3 py-2" /></div>
          <div><label className="block text-sm font-medium mb-1">Pack Size / Count</label><input type="text" value={attributes.Count || ''} onChange={e => handleAttributeChange('Count', e.target.value)} placeholder="e.g. 500 Sheets, Pack of 50" className="w-full border rounded-md px-3 py-2" /></div>
          <div><label className="block text-sm font-medium mb-1">Color / Finish</label><input type="text" value={attributes.Color || ''} onChange={e => handleAttributeChange('Color', e.target.value)} placeholder="e.g. White, Matte, Glossy" className="w-full border rounded-md px-3 py-2" /></div>
          <div><label className="block text-sm font-medium mb-1">Brand</label><input type="text" value={attributes.Brand || ''} onChange={e => handleAttributeChange('Brand', e.target.value)} className="w-full border rounded-md px-3 py-2" /></div>
        </div>
      )
    }

    if (lowerSub.includes('bag') || lowerSub.includes('backpack') || lowerSub.includes('case')) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium mb-1">Material</label><input type="text" value={attributes.Material || ''} onChange={e => handleAttributeChange('Material', e.target.value)} placeholder="e.g. Canvas, Nylon, Polyester" className="w-full border rounded-md px-3 py-2" /></div>
          <div><label className="block text-sm font-medium mb-1">Dimensions</label><input type="text" value={attributes.Dimensions || ''} onChange={e => handleAttributeChange('Dimensions', e.target.value)} placeholder="Optional sizing" className="w-full border rounded-md px-3 py-2" /></div>
          <div><label className="block text-sm font-medium mb-1">Color / Design</label><input type="text" value={attributes.Color || ''} onChange={e => handleAttributeChange('Color', e.target.value)} className="w-full border rounded-md px-3 py-2" /></div>
          <div><label className="block text-sm font-medium mb-1">Brand</label><input type="text" value={attributes.Brand || ''} onChange={e => handleAttributeChange('Brand', e.target.value)} className="w-full border rounded-md px-3 py-2" /></div>
        </div>
      )
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><label className="block text-sm font-medium mb-1">Brand (Optional)</label><input type="text" value={attributes.Brand || ''} onChange={e => handleAttributeChange('Brand', e.target.value)} className="w-full border rounded-md px-3 py-2" /></div>
        <div><label className="block text-sm font-medium mb-1">Count / Set Size</label><input type="text" value={attributes.Count || ''} onChange={e => handleAttributeChange('Count', e.target.value)} placeholder="e.g. 1 Piece, Pack of 5" className="w-full border rounded-md px-3 py-2" /></div>
        <div><label className="block text-sm font-medium mb-1">Color / Theme</label><input type="text" value={attributes.Color || ''} onChange={e => handleAttributeChange('Color', e.target.value)} className="w-full border rounded-md px-3 py-2" /></div>
        <div><label className="block text-sm font-medium mb-1">Material / Other Details</label><input type="text" value={attributes.Details || ''} onChange={e => handleAttributeChange('Details', e.target.value)} className="w-full border rounded-md px-3 py-2" /></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto pb-24">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard/products" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Add Books & Stationery</h1>
      </div>

      <div className="flex justify-between mb-8 overflow-x-auto pb-4 hide-scrollbar">
        {STEPS.map((step, idx) => (
          <div key={step.id} className="flex flex-col items-center min-w-[100px] opacity-100">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center font-semibold mb-2 transition-colors ${idx === currentStep ? 'bg-black text-white' : idx < currentStep ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
              {idx < currentStep ? <Check className="h-5 w-5" /> : idx + 1}
            </div>
            <span className={`text-xs font-medium text-center ${idx === currentStep ? 'text-black' : 'text-gray-400'}`}>{step.label}</span>
          </div>
        ))}
      </div>

      {state?.error && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 font-medium">{state.error}</div>}

      <form action={async (formData) => {
        setIsCompressing(true)
        try {
          const compressedFormData = new FormData()
          for (const [key, value] of formData.entries()) {
            if (key !== 'photos') compressedFormData.append(key, value)
          }
          for (const file of photos) {
            try {
              const compressed = await compressImage(file)
              compressedFormData.append('photos', compressed)
            } catch (e) {
              compressedFormData.append('photos', file) 
            }
          }
          clearDraft()
          formAction(compressedFormData)
        } finally { setIsCompressing(false) }
      }}>
        <input type="hidden" name="subCategory" value={subCategory} />
        <input type="hidden" name="brand" value={attributes.Brand || ''} />
        <input type="hidden" name="condition" value={attributes.Condition || ''} />
        <input type="hidden" name="attributesJson" value={JSON.stringify(attributes)} />
        <input type="hidden" name="hasOptions" value={hasOptions ? 'true' : 'false'} />
        <input type="hidden" name="optionsDef" value={JSON.stringify(optionsDef)} />
        <input type="hidden" name="variantsJson" value={JSON.stringify(variants)} />

        {/* STEP 0: TYPE */}
        <div className={currentStep === 0 ? 'block animate-in fade-in' : 'hidden'}>
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold mb-6">What are you selling?</h2>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              {BOOKS_CATEGORIES.map((cat) => (
                <button
                  key={cat.id} type="button"
                  onClick={() => { setCategory(cat.id); setSubCategory('') }}
                  className={`flex flex-col items-center justify-center p-4 sm:p-6 border-2 rounded-xl transition-all ${category === cat.id ? 'border-black bg-gray-50' : 'border-gray-100 hover:border-gray-200'}`}
                >
                  <cat.icon className={`h-8 w-8 mb-3 ${category === cat.id ? 'text-black' : 'text-gray-400'}`} />
                  <span className="font-medium text-xs sm:text-sm text-center leading-tight">{cat.label}</span>
                </button>
              ))}
            </div>

            {activeCategory && (
              <div className="animate-in slide-in-from-top-4">
                <h3 className="font-semibold mb-4 border-t pt-6">Select specific item for {activeCategory.label}</h3>
                <div className="flex flex-wrap gap-3">
                  {activeCategory.subs.map(sub => (
                    <button
                      key={sub} type="button" onClick={() => setSubCategory(sub)}
                      className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors ${subCategory === sub ? 'bg-black text-white border-black' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <div className="mt-10 flex justify-end">
              <button type="button" disabled={!subCategory} onClick={handleNext} className="bg-black text-white px-8 py-3 rounded-xl font-bold disabled:opacity-50 flex items-center">
                Next <ArrowLeft className="ml-2 h-5 w-5 rotate-180" />
              </button>
            </div>
          </div>
        </div>

        {/* STEP 1: PHOTOS */}
        <div className={currentStep === 1 ? 'block animate-in fade-in' : 'hidden'}>
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold mb-2">Upload Product Photos</h2>
            <p className="text-gray-500 mb-6">Upload up to 5 clear photos of the {subCategory}. Clear, bright pictures sell faster!</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              {photos.map((file, idx) => (
                <div key={idx} className="relative aspect-square bg-gray-50 rounded-xl overflow-hidden border">
                  <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" alt="Preview" />
                  <button type="button" onClick={() => setPhotos(p => p.filter((_, i) => i !== idx))} className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full text-red-600 hover:bg-white shadow-sm"><X className="h-4 w-4" /></button>
                </div>
              ))}
              {photos.length < 5 && (
                <button type="button" onClick={() => fileInputRef.current?.click()} className="aspect-square border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 hover:border-gray-400 transition-colors">
                  <Upload className="h-8 w-8 mb-2" /><span className="font-medium">Upload</span><span className="text-xs mt-1 text-gray-400">{5 - photos.length} remaining</span>
                </button>
              )}
            </div>
            <input type="file" name="photos" accept="image/jpeg, image/png, image/webp" multiple className="hidden" ref={fileInputRef} onChange={handlePhotoUpload} />
            <div className="flex justify-between">
              <button type="button" onClick={handleBack} className="px-8 py-3 border rounded-xl font-medium text-gray-700 hover:bg-gray-50">Back</button>
              <button type="button" disabled={photos.length === 0} onClick={handleNext} className="bg-black text-white px-8 py-3 rounded-xl font-bold disabled:opacity-50">Next Step</button>
            </div>
          </div>
        </div>

        {/* STEP 2: SPECS */}
        <div className={currentStep === 2 ? 'block animate-in fade-in' : 'hidden'}>
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold mb-6">{subCategory} Details</h2>
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 mb-8">
              {renderDynamicSpecs()}
            </div>
            <div className="flex justify-between">
              <button type="button" onClick={handleBack} className="px-8 py-3 border rounded-xl font-medium text-gray-700 hover:bg-gray-50">Back</button>
              <button type="button" onClick={handleNext} className="bg-black text-white px-8 py-3 rounded-xl font-bold">Next Step</button>
            </div>
          </div>
        </div>

        {/* STEP 3: BASIC INFO */}
        <div className={currentStep === 3 ? 'block animate-in fade-in' : 'hidden'}>
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold mb-6">Price & Details</h2>
            <div className="space-y-6 mb-8">
              <div>
                <label className="block font-medium text-gray-900 mb-1">Product Title</label>
                <input type="text" name="name" value={name} onChange={e => setName(e.target.value)} placeholder={`e.g. Premium ${subCategory}`} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black outline-none" required />
              </div>
              <div>
                <label className="block font-medium text-gray-900 mb-1">Description</label>
                <textarea name="description" value={description} onChange={e => setDescription(e.target.value)} rows={4} placeholder="Describe the item, ingredients, benefits, or usage instructions..." className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black outline-none" required />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block font-medium text-gray-900 mb-1">Price (₦)</label>
                  <input type="number" name="price" value={basePrice} onChange={e => setBasePrice(e.target.value)} placeholder="0.00" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black outline-none" required={!hasOptions} />
                </div>
                <div>
                  <label className="block font-medium text-gray-900 mb-1">Stock Available</label>
                  <input type="number" name="stock" value={baseStock} onChange={e => setBaseStock(e.target.value)} placeholder="0" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black outline-none" required={!hasOptions} />
                </div>
              </div>
            </div>
            <div className="flex justify-between">
              <button type="button" onClick={handleBack} className="px-8 py-3 border rounded-xl font-medium text-gray-700 hover:bg-gray-50">Back</button>
              <button type="button" disabled={!name || !description || (!hasOptions && (!basePrice || !baseStock))} onClick={handleNext} className="bg-black text-white px-8 py-3 rounded-xl font-bold disabled:opacity-50">Next Step</button>
            </div>
          </div>
        </div>

        {/* STEP 4: GENERIC OPTIONS */}
        <div className={currentStep === 4 ? 'block animate-in fade-in' : 'hidden'}>
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold mb-2">Product Options & Variants</h2>
            <p className="text-gray-500 mb-6">Does this come in different shades, volumes (e.g. 30ml, 50ml), lengths (e.g. 18", 20"), or textures?</p>

            <div className="flex gap-4 mb-8">
              <button type="button" onClick={() => setHasOptions(false)} className={`flex-1 py-4 border-2 rounded-xl font-bold transition-all ${hasOptions === false ? 'border-black bg-gray-50 ring-2 ring-black ring-opacity-20' : 'border-gray-200 hover:border-gray-300'}`}>No, it's just one item</button>
              <button type="button" onClick={() => setHasOptions(true)} className={`flex-1 py-4 border-2 rounded-xl font-bold transition-all ${hasOptions === true ? 'border-black bg-gray-50 ring-2 ring-black ring-opacity-20' : 'border-gray-200 hover:border-gray-300'}`}>Yes, add variants</button>
            </div>

            {hasOptions && (
              <div className="space-y-6 mb-8 border-t pt-6 animate-in fade-in">
                {optionsDef.map((opt, idx) => (
                  <div key={idx} className="bg-gray-50 p-6 rounded-xl border relative">
                    {optionsDef.length > 1 && (
                      <button type="button" onClick={() => handleRemoveOptionAxis(idx)} className="absolute top-4 right-4 text-red-500 hover:bg-red-50 p-1.5 rounded-md"><Trash2 className="w-5 h-5" /></button>
                    )}
                    <label className="block font-medium mb-3">Option {idx + 1} Name</label>
                    <div className="flex gap-3 mb-4">
                      <select value={COMMON_OPTION_TYPES.includes(opt.name) ? opt.name : 'Custom'} onChange={e => {
                        if (e.target.value !== 'Custom') handleUpdateOptionName(idx, e.target.value)
                      }} className="border rounded-lg px-3 py-2 bg-white flex-1">
                        {COMMON_OPTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        <option value="Custom">Custom Name...</option>
                      </select>
                      {!COMMON_OPTION_TYPES.includes(opt.name) && (
                        <input type="text" value={opt.name} onChange={e => handleUpdateOptionName(idx, e.target.value)} className="border rounded-lg px-3 py-2 flex-1" placeholder="e.g. Hair Density" />
                      )}
                    </div>
                    
                    <label className="block font-medium text-sm text-gray-500 mb-2">Values for {opt.name}</label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {opt.values.map(val => (
                        <span key={val} className="bg-black text-white px-3 py-1.5 rounded-full text-sm flex items-center">{val} <button type="button" onClick={() => handleRemoveOptionValue(idx, val)} className="ml-2 hover:text-gray-300"><X className="h-3 w-3" /></button></span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input type="text" value={customValueInputs[idx] || ''} onChange={e => setCustomValueInputs({...customValueInputs, [idx]: e.target.value})} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddOptionValue(idx) } }} placeholder={`Add ${opt.name} (e.g. Caramel, 30ml, 18")...`} className="border rounded-lg px-3 py-2 flex-1" />
                      <button type="button" onClick={() => handleAddOptionValue(idx)} className="bg-black text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-800">Add</button>
                    </div>
                  </div>
                ))}
                
                {optionsDef.length < 3 && (
                  <button type="button" onClick={handleAddOptionAxis} className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 font-medium hover:border-gray-400 hover:bg-gray-50 flex items-center justify-center gap-2">
                    <PlusCircle className="w-5 h-5" /> Add Another Option (e.g. Volume)
                  </button>
                )}
              </div>
            )}

            <div className="flex justify-between">
              <button type="button" onClick={handleBack} className="px-8 py-3 border rounded-xl font-medium text-gray-700 hover:bg-gray-50">Back</button>
              <button type="button" disabled={hasOptions === null} onClick={() => { if (hasOptions) { generateVariants(); handleNext() } else { setCurrentStep(STEPS.length - 1) } }} className="bg-black text-white px-8 py-3 rounded-xl font-bold disabled:opacity-50">Next Step</button>
            </div>
          </div>
        </div>

        {/* STEP 5: VARIANTS (if hasOptions) */}
        {hasOptions && (
          <div className={currentStep === 5 ? 'block animate-in fade-in' : 'hidden'}>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Inventory & Pricing</h2>
                <button type="button" onClick={generateVariants} className="text-sm text-blue-600 hover:underline">Regenerate Variants</button>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl mb-6 flex gap-4 items-end flex-wrap">
                <div className="flex-1 min-w-[150px]">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Apply Price to All</label>
                  <input type="number" value={basePrice} onChange={e => setBasePrice(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Price" />
                </div>
                <button type="button" onClick={() => { const v = [...variants]; v.forEach(va => va.price = basePrice); setVariants(v) }} className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium">Apply</button>
                
                <div className="flex-1 min-w-[150px]">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Apply Stock to All</label>
                  <input type="number" value={baseStock} onChange={e => setBaseStock(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Stock" />
                </div>
                <button type="button" onClick={() => { const v = [...variants]; v.forEach(va => va.stock = baseStock); setVariants(v) }} className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium">Apply</button>
              </div>

              <div className="space-y-3 mb-8 max-h-[400px] overflow-y-auto pr-2">
                {variants.map((v, i) => (
                  <div key={i} className="flex items-center gap-4 bg-white border border-gray-200 p-4 rounded-xl shadow-sm">
                    <div className="font-bold w-1/3 truncate">{v.title}</div>
                    <div className="flex-1 relative">
                      <span className="absolute left-3 top-2.5 text-gray-400">₦</span>
                      <input type="number" value={v.price} onChange={e => { const newV = [...variants]; newV[i].price = e.target.value; setVariants(newV) }} className="w-full border rounded-lg pl-8 pr-3 py-2" placeholder="Price" />
                    </div>
                    <div className="w-24">
                      <input type="number" value={v.stock} onChange={e => { const newV = [...variants]; newV[i].stock = e.target.value; setVariants(newV) }} className="w-full border rounded-lg px-3 py-2" placeholder="Stock" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between">
                <button type="button" onClick={handleBack} className="px-8 py-3 border rounded-xl font-medium text-gray-700 hover:bg-gray-50">Back</button>
                <button type="button" disabled={variants.some(v => !v.price || !v.stock)} onClick={handleNext} className="bg-black text-white px-8 py-3 rounded-xl font-bold disabled:opacity-50">Review Product</button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: REVIEW */}
        <div className={currentStep === STEPS.length - 1 ? 'block animate-in fade-in' : 'hidden'}>
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="h-10 w-10" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Ready to Publish</h2>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">Your {subCategory} is ready to go live on your store. Review the details below and hit publish.</p>
            
            <div className="bg-gray-50 rounded-xl p-6 text-left mb-8">
              <div className="font-bold text-lg mb-1">{name}</div>
              <div className="text-gray-500 text-sm mb-4">{attributes.Brand && `${attributes.Brand} • `}{attributes.Type || subCategory}</div>
              <div className="flex justify-between text-sm font-medium py-3 border-t border-gray-200">
                <span className="text-gray-500">Price</span>
                <span>{hasOptions ? 'Varies by variant' : `₦${basePrice}`}</span>
              </div>
              <div className="flex justify-between text-sm font-medium py-3 border-t border-gray-200">
                <span className="text-gray-500">Stock</span>
                <span>{hasOptions ? `${variants.length} variants` : `${baseStock} units`}</span>
              </div>
            </div>

            <div className="flex justify-between gap-4">
              <button type="button" disabled={isLoading} onClick={handleBack} className="flex-1 py-4 border rounded-xl font-medium text-gray-700 hover:bg-gray-50">Back to Edit</button>
              <button type="submit" disabled={isLoading} className="flex-[2] bg-black text-white py-4 rounded-xl font-bold text-lg disabled:opacity-70 flex items-center justify-center">
                {isLoading ? <Loader2 className="h-6 w-6 animate-spin mr-2" /> : null}
                {isLoading ? 'Publishing...' : 'Publish Product'}
              </button>
            </div>
          </div>
        </div>

      </form>
    </div>
  )
}

