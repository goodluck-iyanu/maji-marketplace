const { GoogleGenerativeAI } = require('@google/generative-ai');

async function test() {
  try {
    console.log('Testing key:', process.env.GEMINI_API_KEY);
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-lite-latest' });
    const result = await model.generateContent('Say hello');
    console.log('Success:', result.response.text());
  } catch (err) {
    console.error('Error:', err.message);
  }
}

test();
