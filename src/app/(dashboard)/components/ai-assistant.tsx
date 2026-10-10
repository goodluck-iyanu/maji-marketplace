'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Send, Bot } from 'lucide-react'
import { MajiLogo } from '@/components/brand/maji-brand'

type Message = {
  id: string
  text: string
  sender: 'ai' | 'user'
  time: Date
}

export function MajiAIAssistant({
  storeName,
  storeSlug,
  hasBank,
  hasProduct,
  productCount,
  totalSales,
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
      const greeting = `Hello! I'm Hoberg AI, here to assist you with ${storeName}. ${
        !hasBank
          ? 'I noticed you still need to add a bank account. Let me know if you need help!'
          : !hasProduct
          ? 'Great job adding your bank! Ready to add your first product?'
          : 'Your store is fully set up! How can I help you today?'
      }`

      setMessages([
        {
          id: 'welcome',
          text: greeting,
          sender: 'ai',
          time: new Date(),
        },
      ])
    }
  }, [storeName, hasBank, hasProduct, storageKey])

  // Save to localStorage when messages change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(messages))
    }
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, storageKey])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const userMsg: Message = {
      id: Date.now().toString(),
      text: input.trim(),
      sender: 'user',
      time: new Date(),
    }

    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setInput('')
    setIsTyping(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages,
          context: { storeName, storeSlug, hasBank, hasProduct, productCount, totalSales },
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Unknown API Error')
      }

      const aiResponseText = data.text

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponseText,
        sender: 'ai',
        time: new Date(),
      }

      setMessages((prev) => [...prev, aiMsg])
    } catch (error: any) {
      console.error(error)
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: `Error: ${
          error.message || "I'm having trouble connecting."
        } (If testing locally, please restart npm run dev!)`,
        sender: 'ai',
        time: new Date(),
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setIsTyping(false)
    }
  }

  const closeChat = () => {
    setIsClosing(true)
    setTimeout(() => {
      setIsOpen(false)
      setIsClosing(false)
    }, 200)
  }

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 md:bottom-6 md:right-6 h-14 w-14 bg-[#111111] text-white rounded-2xl shadow-xl border border-white/10 flex items-center justify-center hover:bg-[#F05A28] transition-all hover:scale-105 z-50 group animate-in zoom-in-50 fade-in duration-300 ease-out cursor-pointer"
          aria-label="Open Hoberg AI Assistant"
        >
          <MajiLogo
            variant="symbol-small"
            colorway="ember-duotone-dark"
            size={28}
            className="group-hover:scale-110 transition-transform"
          />

          {/* Subtle pulse animation for attention if not set up */}
          {(!hasBank || !hasProduct) && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF8559] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-[#F05A28]"></span>
            </span>
          )}
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className={`fixed bottom-0 right-0 left-0 md:bottom-6 md:right-6 md:left-auto md:w-[360px] h-[75vh] md:h-[520px] md:max-h-[82vh] bg-white md:rounded-3xl shadow-2xl flex flex-col z-50 overflow-hidden md:border md:border-[#111111]/10 transform-gpu origin-bottom md:origin-bottom-right ${
            isClosing
              ? 'animate-out zoom-out-95 slide-out-to-bottom-5 fade-out duration-200 ease-in'
              : 'animate-in zoom-in-95 slide-in-from-bottom-5 fade-in duration-300 ease-out'
          }`}
        >
          {/* Header */}
          <div className="bg-[#111111] p-4 text-white flex justify-between items-center border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 bg-white/10 rounded-xl flex items-center justify-center">
                <MajiLogo variant="symbol-small" colorway="ember-duotone-dark" size={22} />
              </div>
              <div>
                <h3 className="font-bold text-sm">Hoberg AI Assistant</h3>
                <p className="text-neutral-400 text-xs flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#F05A28]" />
                  Online &amp; ready to help
                </p>
              </div>
            </div>
            <button
              onClick={closeChat}
              className="text-neutral-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Contact Support Toggle */}
          {showContact && (
            <div className="bg-[#FAF8F5] border-b border-neutral-200 p-3 text-xs text-[#111111] animate-in slide-in-from-top-2">
              <p className="font-bold mb-1 text-[#F05A28]">Customer Support:</p>
              <p className="flex items-center gap-2">
                <span className="text-neutral-500">WhatsApp:</span> +2347077745253
              </p>
              <p className="flex items-center gap-2">
                <span className="text-neutral-500">Email:</span> support.hoberg@gmail.com
              </p>
            </div>
          )}

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 bg-[#FAF8F5] flex flex-col gap-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'ai' && (
                  <div className="h-6 w-6 rounded-lg bg-white border border-neutral-200 text-[#F05A28] flex items-center justify-center mr-2 mt-1 shrink-0">
                    <Bot className="h-3.5 w-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-[80%] md:max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-[#111111] text-white rounded-br-sm'
                      : 'bg-white border border-neutral-200/80 text-[#111111] rounded-bl-sm shadow-2xs'
                  }`}
                >
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
                <div className="h-6 w-6 rounded-lg bg-white border border-neutral-200 text-[#F05A28] flex items-center justify-center mr-2 mt-1 shrink-0">
                  <Bot className="h-3.5 w-3.5" />
                </div>
                <div className="bg-white border border-neutral-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-2xs flex items-center gap-1.5">
                  <span
                    className="h-1.5 w-1.5 bg-[#F05A28] rounded-full animate-bounce"
                    style={{ animationDelay: '0ms' }}
                  ></span>
                  <span
                    className="h-1.5 w-1.5 bg-[#F05A28] rounded-full animate-bounce"
                    style={{ animationDelay: '150ms' }}
                  ></span>
                  <span
                    className="h-1.5 w-1.5 bg-[#F05A28] rounded-full animate-bounce"
                    style={{ animationDelay: '300ms' }}
                  ></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Contact Button */}
          <div className="px-4 py-2 bg-white border-t border-neutral-100">
            <button
              onClick={() => setShowContact(!showContact)}
              className="text-xs text-[#F05A28] hover:underline font-semibold"
            >
              {showContact ? 'Hide contact info' : 'Talk to someone (Customer Care)'}
            </button>
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-neutral-100 pb-safe">
            <form onSubmit={handleSend} className="flex items-center gap-2 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything..."
                className="flex-1 bg-[#FAF8F5] border border-neutral-200 focus:bg-white focus:border-[#F05A28] focus:ring-2 focus:ring-[#F05A28]/20 rounded-full pl-4 pr-11 py-2.5 text-sm outline-none transition-all"
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                className="absolute right-1.5 h-8 w-8 bg-[#F05A28] text-white rounded-full flex items-center justify-center hover:bg-[#d94b1c] disabled:opacity-40 transition-colors"
              >
                <Send className="h-3.5 w-3.5 ml-0.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
