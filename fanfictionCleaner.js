const OpenAI = require('openai');
require('dotenv').config();

// Initialize OpenAI client
const client = new OpenAI({
  apiKey: process.env.apikey
});

const BANNED_WORDS = [
  "moan", "moaned", "thrust", "naked", "penis", "vagina", "climax", "orgasm",
  "cum", "ejaculate", "erection", "breasts", "boobs", "nipples", "suck", "lick",
  "groan", "pant", "sex", "sexual", "intercourse", "intimate", "grind", "ride",
  "inside her", "inside him", "penetrate", "penetration", "aroused", "lust", "desire",
  "seduce", "fondle", "wet", "hard on", "stiff", "stroke", "blowjob", "handjob", "fuck",
  "fucking", "masturbate", "masturbation", "humping", "cumming", "orgasming", "kinky"
];

const BLOCK_PHRASES = [
  "i can't help with that", "i'm unable to assist", "this content violates",
  "against openai's policy", "refuse to continue", "cannot fulfill this request",
  "due to policy restrictions", "this goes against my programming", "i'm not programmed",
  "not allowed", "decline to help", "cannot generate that content", "keep things respectful",
  "that request is against my guidelines", "i can't generate", "recommend discussing",
  "must follow ethical guidelines"
];

function maskExplicitWords(text) {
  let maskedText = text;
  for (const word of BANNED_WORDS) {
    const pattern = new RegExp(`\\b${word}\\b`, 'gi');
    maskedText = maskedText.replace(pattern, "[REDACTED]");
  }
  return maskedText;
}

function isBlockedResponse(text) {
  const cleanText = text.trim().toLowerCase();
  return BLOCK_PHRASES.some(phrase => cleanText.includes(phrase)) || 
         cleanText.split(/\s+/).length < 30;
}

async function openaiCleanText(text) {
  const prompt = `You are an editor making this fanfiction suitable for YouTube:
- Remove all **explicit** or **sexual** scenes
- Rephrase all **gore/violent** scenes to be **suggestive but non-graphic**, like in action anime
- Translate all non-English text into fluent English — no Spanish or foreign words should remain
- Remove author notes, comments, and announcements (do NOT rephrase or explain them)
- Improve grammar, flow, and structure for readability and storytelling
- Maintain original plot, emotions, and character progression
- Output only the final story in English without any explanation or formatting
- If no cleaning is needed, return the text unchanged
- Rephrase all dialogue as third-person narrative without using quotation marks or character conversations
- Don't rephrase chapter Name word and don't remove chapter Name word

Text:
${text}

Revised text:
`;

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You're a safe-content editor." },
        { role: "user", content: prompt }
      ],
      temperature: 0.3
    });
    return response.choices[0].message.content.trim();
  } catch (error) {
    console.log(`❗ OpenAI API error: ${error}`);
    return "BLOCKED";
  }
}

async function cleanFanfictionText(inputText) {
  try {
    if (!inputText || !inputText.trim()) {
      throw new Error("Input text cannot be empty");
    }

    console.log(`📘 Original word count: ${inputText.split(/\s+/).length}`);
    
    // Clean the entire text at once (no chunking)
    const cleanedText = await openaiCleanText(inputText);
    
    if (isBlockedResponse(cleanedText)) {
      console.log("⚠️ Initial cleaning was blocked. Trying with masked words...");
      const maskedText = maskExplicitWords(inputText);
      const retryCleanedText = await openaiCleanText(maskedText);
      
      if (isBlockedResponse(retryCleanedText)) {
        return cleanedText
      }
      
      console.log(`✅ Cleaned with masking. Before: ${inputText.split(/\s+/).length} words After: ${retryCleanedText.split(/\s+/).length} words`);
      return retryCleanedText;
    }
    
    console.log(`✅ Successfully cleaned. Before: ${inputText.split(/\s+/).length} words After: ${cleanedText.split(/\s+/).length} words`);
    return cleanedText;
    
  } catch (error) {
    console.log(`❗ Error cleaning fanfiction: ${error.message}`);
    throw error;
  }
}


// Export for use in other modules
module.exports = {
  cleanFanfictionText
};
