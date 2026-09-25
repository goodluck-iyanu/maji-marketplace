'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Bot, User, Sparkles, Loader2 } from 'lucide-react'
import Link from 'next/link'

type Message = {
  id: string
  text: string
  sender: 'ai' | 'user'
  time: Date
}

// ── Smart AI Responses (Keyword Matching) ──
const getAIResponse = (message: string, context: {
  storeName: string
  storeSlug: string
  hasBank: boolean
  hasProduct: boolean
  productCount: number
  totalSales: number
}): string => {
  const m = message.toLowerCase()

  if (m.includes('hello') || m.includes('hi ') || m.match(/^hi$/) || m.includes('hey')) {
    return `Hello there! I'm Maji AI. How can I help you grow ${context.storeName} today?`
  }

  // Settings / Store Customization
  if (m.includes('profile') || m.includes('picture') || m.includes('color') || m.includes('logo') || m.includes('banner') || m.includes('appearance') || m.includes('setting')) {
    return "You can customize your storefront in the **Settings** tab. There you can upload a new logo (profile picture), change your store's primary and secondary colors, upload a banner, and update your social media links!"
  }

  // Onboarding questions
  if (m.includes('what to do') || m.includes('start') || m.includes('next step') || m.includes('how to')) {
    if (!context.hasBank) {
      return "Since you just created your store, the very first step is to **add your bank account** so you can receive payments. You can do this in the Payments tab."
    }
    if (!context.hasProduct) {
      return "Your bank account is set up! The next step is to **add your first product**. Go to the Products tab and click 'Add Product'."
    }
    return `Your store is completely set up! You have ${context.productCount} product(s). Your next step is to share your store link (maji.com/store/${context.storeSlug}) with your audience to get sales!`
  }

  if (m.includes('bank') || m.includes('account number') || m.includes('payout')) {
    return "You can add or update your bank account details in the **Payments** section of your dashboard. This is where your sales money will be sent."
  }

  if (m.includes('product') || m.includes('upload') || m.includes('sell')) {
    return "To add a product, go to the **Products** tab on the left sidebar and click 'Add Product'. We'll guide you through adding photos, descriptions, and pricing."
  }

  if (m.includes('sales') || m.includes('money') || m.includes('order')) {
    if (context.totalSales === 0) {
      return "You haven't made any sales yet. Try sharing your store link on your social media to get your first customer!"
    }
    return `You're doing great! You have ${context.totalSales} total sales. You can view detailed information in the Orders tab.`
  }

  if (m.includes('share') || m.includes('link') || m.includes('url')) {
    return `Your live store URL is: **maji.com/store/${context.storeSlug}**\n\nCopy this link and put it in your Instagram bio, Twitter, or send it directly to customers!`
  }

  if (m.includes('thank') || m.includes('thanks')) {
    return "You're very welcome! I'm always here floating in the corner if you need anything else. Good luck with your store!"
  }

  // Default fallback
  return "I'm Maji AI! I can help you with setting up your store, editing settings (like colors and logos), adding bank accounts, adding products, and understanding your dashboard. What would you like to know?"
}


export function MajiAIAssistant({
  storeName,
  storeSlug,
  hasBank,
  hasProduct,
  productCount,
  totalSales
}: {
  storeName: string
  storeSlug: string
  hasBank: boolean
  hasProduct: boolean
  productCount: number
  totalSales: number
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showContact, setShowContact] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Store-specific storage key
  const storageKey = `maji_ai_messages_${storeSlug}`

  // Initialize welcome message from localStorage or create new
  useEffect(() => {
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      try {
        const parsed = JSON.parse(saved).map((m: any) => ({ ...m, time: new Date(m.time) }))
        setMessages(parsed)
      } catch (e) {
        setMessages([])
      }
    } else {
      // First time greeting
      const greeting = `Hello! I'm Maji AI, here to assist you with ${storeName}. ${
        !hasBank ? 'I noticed you still need to add a bank account. Let me know if you need help!' :
        !hasProduct ? 'Great job adding your bank! Ready to add your first product?' :
        'Your store is fully set up! How can I help you today?'
      }`
      
      setMessages([{
        id: 'welcome',
        text: greeting,
        sender: 'ai',
        time: new Date()
      }])
    }
  }, [storeName, hasBank, hasProduct, storageKey])

  // Save to localStorage when messages change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(messages))
    }
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, storageKey])

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const userMsg: Message = {
      id: Date.now().toString(),
      text: input.trim(),
      sender: 'user',
      time: new Date()
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    // Simulate AI thinking time
    setTimeout(() => {
      const aiResponseText = getAIResponse(userMsg.text, { storeName, storeSlug, hasBank, hasProduct, productCount, totalSales })
      
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponseText,
        sender: 'ai',
        time: new Date()
      }
      
      setMessages(prev => [...prev, aiMsg])
      setIsTyping(false)
    }, 1000 + Math.random() * 1000)
  }

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 bg-blue-600 text-white rounded-full shadow-xl flex items-center justify-center hover:bg-blue-700 transition-all hover:scale-110 z-50 group"
        >
          <Bot className="h-7 w-7 group-hover:scale-110 transition-transform" />
          
          {/* Subtle pulse animation for attention if not set up */}
          {(!hasBank || !hasProduct) && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
            </span>
          )}
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[350px] h-[500px] max-h-[80vh] bg-white rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden border border-gray-200 animate-in slide-in-from-bottom-10 fade-in duration-300">
          
          {/* Header */}
          <div className="bg-blue-600 p-4 text-white flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Maji AI Assistant</h3>
                <p className="text-blue-100 text-xs">Online & ready to help</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-blue-100 hover:text-white transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Contact Support Toggle */}
          {showContact && (
            <div className="bg-blue-50 border-b border-blue-100 p-3 text-sm text-blue-900 animate-in slide-in-from-top-2">
              <p className="font-semibold mb-1">Customer Support:</p>
              <p className="flex items-center gap-2"><span className="opacity-75">WhatsApp:</span> +2347077745253</p>
              <p className="flex items-center gap-2"><span className="opacity-75">Email:</span> support.hoberg@gmail.com</p>
            </div>
          )}

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 flex flex-col gap-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.sender === 'ai' && (
                  <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-2 mt-1 shrink-0">
                    <Bot className="h-3 w-3" />
                  </div>
                )}
                
                <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                  msg.sender === 'user' 
                    ? 'bg-blue-600 text-white rounded-br-sm' 
                    : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm'
                }`}>
                  {/* Basic markdown parsing for bold text **text** */}
                  {msg.text.split(/(\*\*.*?\*\*)/).map((part, i) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                      return <strong key={i}>{part.slice(2, -2)}</strong>
                    }
                    return <span key={i}>{part}</span>
                  })}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-2 mt-1 shrink-0">
                  <Bot className="h-3 w-3" />
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex items-center gap-1">
                  <span className="h-1.5 w-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="h-1.5 w-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="h-1.5 w-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Contact Button */}
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
            <button 
              onClick={() => setShowContact(!showContact)}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              {showContact ? 'Hide contact info' : 'Talk to someone (Customer Care)'}
            </button>
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-gray-100">
            <form onSubmit={handleSend} className="flex items-center gap-2 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything..."
                className="flex-1 bg-gray-100 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-full pl-4 pr-10 py-2 text-sm outline-none transition-all"
              />
              <button 
                type="submit" 
                disabled={!input.trim() || isTyping}
                className="absolute right-1 h-8 w-8 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors"
              >
                <Send className="h-4 w-4 ml-0.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
