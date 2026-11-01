import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextResponse } from 'next/server'

// Ensure API key is available
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function POST(req: Request) {
  try {
    const { messages, context } = await req.json()
    
    // Set up the system prompt teaching the AI everything about Maji
    const systemPrompt = `You are Hoberg AI, the friendly, helpful, and highly intelligent AI assistant for the Maji e-commerce platform.
    
Your role is to assist sellers in managing their stores, answering questions about the platform, and helping them succeed.
Keep your responses relatively brief, conversational, and format them nicely using Markdown (bolding key terms, using bullet points).
Do NOT sound robotic. Be a bit lively, use emojis occasionally.

### About Maji Platform
- Maji is a marketplace that lets sellers easily create a storefront to sell digital and physical products.
- The dashboard URL is maji.com/store/YOUR-SLUG
- To get paid, sellers MUST add their bank account details in the "Payments" tab.
- To sell items, they must add a product in the "Products" tab -> "Add Product".
- Sellers can customize their store (logo, colors, banner) in the "Settings" tab.
- Maji supports both Digital and Physical products. For physical products, sellers can set a "Pickup Address".

### Current User Context
You are talking to the owner of the store: "${context.storeName}"
Their store URL is: maji.com/store/${context.storeSlug}
Has Bank Account Added: ${context.hasBank ? 'Yes' : 'No (Advise them to add it in Payments)'}
Products Created: ${context.productCount} ${!context.hasProduct ? '(Advise them to add their first product!)' : ''}
Total Sales: ₦${context.totalSales}

If they ask you something you don't know, just gracefully pivot back to how you can help them with their store on Maji.
`

    // Initialize the model
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: systemPrompt,
    })

    // Format the conversation history for Gemini
    // Gemini expects { role: 'user' | 'model', parts: [{ text: '...' }] }
    const history = messages.slice(0, -1).map((msg: any) => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }))

    const currentMessage = messages[messages.length - 1].text

    // Start chat session
    const chat = model.startChat({
      history: history,
    })

    // Get response
    const result = await chat.sendMessage(currentMessage)
    const response = await result.response
    const text = response.text()

    return NextResponse.json({ text })
  } catch (error) {
    console.error('AI Chat Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    )
  }
}
