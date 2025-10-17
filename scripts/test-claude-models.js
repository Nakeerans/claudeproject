import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

const modelsToTest = [
  'claude-3-5-sonnet-20241022',
  'claude-3-5-sonnet-20240620',
  'claude-3-sonnet-20240229',
  'claude-3-opus-20240229',
  'claude-3-haiku-20240307',
  'claude-3-5-sonnet-latest',
  'claude-2.1',
  'claude-2.0'
];

console.log('Testing Claude model access...\n');

for (const model of modelsToTest) {
  try {
    const message = await anthropic.messages.create({
      model: model,
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Hi' }]
    });
    console.log(`✓ ${model} - WORKS`);
  } catch (error) {
    console.log(`✗ ${model} - ${error.error?.type || error.message}`);
  }
}
