const Anthropic = require('@anthropic-ai/sdk').default;

const apiKey = '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';
const client = new Anthropic({ apiKey });

(async () => {
  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 100,
      messages: [
        { role: 'user', content: 'Say "Test successful"' }
      ]
    });
    console.log('✅ SDK test successful');
    console.log('Response:', message.content[0].text);
  } catch (err) {
    console.error('SDK test failed:', err.message);
  }
})();
