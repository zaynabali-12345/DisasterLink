const asyncHandler = require('express-async-handler');

// @desc    Generate a response from the chatbot
// @route   POST /api/chatbot/chat
// @access  Public
const generateChatResponse = asyncHandler(async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    res.status(400);
    throw new Error('A prompt is required to chat with the assistant.');
  }

  try {
    // --- DEMO FALLBACK: Hardcoded Q&A ---
    const predefinedResponses = {
      'hi': 'Hello! I am the DisasterLink AI Assistant. How can I help you today?',
      'what should i do if there is heavy rain': "During heavy rain, it's important to stay indoors and avoid walking or driving through flooded areas. Stay informed through local news channels for any evacuation orders. If you are in immediate danger, please contact emergency services.",
      'how should i safe myself in earthquake': "If you are indoors during an earthquake, 'Drop, Cover, and Hold On'. Get under a sturdy table or desk. Stay away from windows, and do not use elevators. If you are outdoors, move to an open area away from buildings, trees, and power lines.",
    };

    const fallbackResponse = "I'm sorry, I can't answer that. I can only answer specific questions related to disaster safety for DisasterLink.";

    // Normalize the user's prompt to make matching easier
    const normalizedPrompt = prompt.toLowerCase().trim();

    // Find a response or use the fallback
    const text = predefinedResponses[normalizedPrompt] || fallbackResponse;

    res.json({ response: text });

  } catch (error) {
    // This catch block will now only trigger for unexpected server errors,
    // as we are no longer making an external API call.
    console.error('Chatbot controller error:', error);
    res.status(500);
    throw new Error('An internal error occurred in the AI assistant.');
  }
});

module.exports = { generateChatResponse };
