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

// ── Smart AI Responses (Conversational & Lightweight) ──
const getAIResponse = (message: string, context: {
  storeName: string
  storeSlug: string
  hasBank: boolean
  hasProduct: boolean
  productCount: number
  totalSales: number
}): string => {
  const m = message.toLowerCase().trim()

  // 1. Greetings
  if (m.match(/^(hi|hello|hey|yo|greetings|sup)\b/)) {
    const greetings = [
      `Hello there! I'm Hoberg AI. How can I help you grow **${context.storeName}** today?`,
      `Hi! Welcome back to the dashboard for **${context.storeName}**. What's on your mind?`,
      `Hey! Hoberg AI at your service. Need help setting things up or checking sales?`
    ]
    return greetings[Math.floor(Math.random() * greetings.length)]
  }

  // 2. Identity / Easter Eggs
  if (m.includes('who are you') || m.includes('what are you') || m.includes('your name')) {
    return "I am **Hoberg AI**, your personal assistant here on Maji. I'm built right into your dashboard to help you manage your store, answer questions, and get you more sales!"
  }
  if (m.includes('joke')) {
    return "Why did the e-commerce store break up with the bank? ...Because it lost interest! 😂 How else can I help you today?"
  }
  if (m.includes('love you') || m.includes('smart') || m.includes('cool')) {
    return "Aww, thanks! I'm just doing my best to make your experience on Maji awesome. 💙 What can we work on next?"
  }

  // 3. Settings / Customization
  if (m.match(/\b(profile|picture|color|logo|banner|appearance|theme|setting|custom|edit)\b/)) {
    return "You can completely customize how your storefront looks in the **Settings** tab (the gear icon). You can upload a new logo, change your store's primary and secondary colors, add a beautiful banner, and update your social media links so customers can find you!"
  }

  // 4. Onboarding / What's next
  if (m.match(/\b(what to do|start|next step|how to|help|confused|stuck)\b/)) {
    if (!context.hasBank) {
      return "Since you're just getting started, the most important step is to **add your bank account** so you can get paid! 💸 Head over to the **Payments** tab to set that up."
    }
    if (!context.hasProduct) {
      return "Your bank account is all set! The next big step is to **add your first product**. Go to the **Products** tab and click 'Add Product' to start building your catalog."
    }
    return `Your store is looking great with ${context.productCount} product(s)! To get more sales, you should copy your store link (**maji.com/store/${context.storeSlug}**) and share it on WhatsApp, Twitter, and your Instagram bio.`
  }

  // 5. Bank / Payments
  if (m.match(/\b(bank|account|payout|withdraw|money|get paid|payment)\b/)) {
    return "All your payout details are managed in the **Payments** section. You can add or update your bank account there to ensure your sales money goes straight to you."
  }

  // 6. Products / Selling
  if (m.match(/\b(product|upload|sell|item|create|add)\b/)) {
    return "Ready to add a product? Head to the **Products** tab on the left menu and click 'Add Product'. We have dedicated builders for digital products, physical items, tickets, and more. It only takes a few minutes!"
  }

  // 7. Sales / Orders / Analytics
  if (m.match(/\b(sale|sales|order|analytics|stat|customer|bought)\b/)) {
    if (context.totalSales === 0) {
      return "You haven't made any sales *just* yet, but don't worry! Keep sharing your link (**maji.com/store/${context.storeSlug}**) on your socials. The first sale is always the hardest!"
    }
    return `You're crushing it! 🎉 You have **₦${context.totalSales.toLocaleString()}** in total sales so far. You can view all the detailed information and customer details in the **Orders** tab on your dashboard.`
  }

  // 8. Sharing / Links
  if (m.match(/\b(share|link|url|website|domain)\b/)) {
    return `Here is your unique, live store URL:\n\n👉 **maji.com/store/${context.storeSlug}**\n\nCopy this and share it everywhere!`
  }

  // 9. Gratitude
  if (m.match(/\b(thank|thanks|appreciate|good job|awesome)\b/)) {
    return "You're very welcome! I'm always floating right here in the corner if you need anything else. Good luck growing your store! 🚀"
  }

  // 10. Dynamic Fallback
  return `I'm not exactly sure what you mean by that. I'm still learning! But as your Hoberg AI, I can help you with:\n- Setting up your store\n- Adding products\n- Checking your sales\n- Updating your settings/colors\n\nTry asking me something like "How do I add a product?"`
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
  const [isClosing, setIsClosing] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showContact, setShowContact] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Store-specific storage key
  const storageKey = `hoberg_ai_messages_${storeSlug}`

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
      const greeting = `Hello! I'm Hoberg AI, here to assist you with ${storeName}. ${
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

    // Simulate AI thinking and typing time based on response length
    setTimeout(() => {
      const aiResponseText = getAIResponse(userMsg.text, { storeName, storeSlug, hasBank, hasProduct, productCount, totalSales })
      
      // Minimum 600ms, plus 15ms per character, capped at 2.5 seconds
      const typingTime = Math.min(2500, 600 + (aiResponseText.length * 15))
      
      setTimeout(() => {
        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          text: aiResponseText,
          sender: 'ai',
          time: new Date()
        }
        
        setMessages(prev => [...prev, aiMsg])
        setIsTyping(false)
      }, typingTime)
      
    }, 400) // Initial "seen" delay before typing indicator starts processing text
  }

  const closeChat = () => {
    setIsClosing(true)
    setTimeout(() => {
      setIsOpen(false)
      setIsClosing(false)
    }, 200) // matches duration-200
  }

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 md:bottom-6 md:right-6 h-14 w-14 bg-blue-600 text-white rounded-full shadow-xl flex items-center justify-center hover:bg-blue-700 transition-all hover:scale-110 z-50 group animate-in zoom-in-50 fade-in duration-300 ease-out"
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
        <div className={`fixed bottom-0 right-0 left-0 md:bottom-6 md:right-6 md:left-auto md:w-[350px] h-[75vh] md:h-[500px] md:max-h-[80vh] bg-white md:rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden md:border md:border-gray-200 transform-gpu origin-bottom md:origin-bottom-right ${isClosing ? 'animate-out zoom-out-95 slide-out-to-bottom-5 fade-out duration-200 ease-in' : 'animate-in zoom-in-95 slide-in-from-bottom-5 fade-in duration-300 ease-out'}`}>
          
          {/* Header */}
          <div className="bg-blue-600 p-4 text-white flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Hoberg AI Assistant</h3>
                <p className="text-blue-100 text-xs">Online & ready to help</p>
              </div>
            </div>
            <button onClick={closeChat} className="text-blue-100 hover:text-white transition-colors p-1">
              <X className="h-6 w-6" />
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
                
                <div className={`max-w-[80%] md:max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
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
          <div className="p-3 bg-white border-t border-gray-100 pb-safe">
            <form onSubmit={handleSend} className="flex items-center gap-2 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything..."
                className="flex-1 bg-gray-100 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-full pl-4 pr-10 py-3 md:py-2 text-sm outline-none transition-all"
              />
              <button 
                type="submit" 
                disabled={!input.trim() || isTyping}
                className="absolute right-1 h-10 w-10 md:h-8 md:w-8 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors"
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
