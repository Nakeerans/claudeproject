import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../utils/logger.js';

export class AIEngine {
  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    this.model = 'claude-3-5-sonnet-20241022';
    this.ready = !!process.env.ANTHROPIC_API_KEY;
  }

  isReady() {
    return this.ready;
  }

  /**
   * Generate code based on requirements
   * @param {string} prompt - The code generation prompt
   * @param {object} options - Additional options
   * @returns {Promise<string>} - Generated code
   */
  async generateCode(prompt, options = {}) {
    try {
      logger.info('AI Engine: Generating code...');

      const message = await this.client.messages.create({
        model: this.model,
        max_tokens: options.maxTokens || 4096,
        messages: [{
          role: 'user',
          content: prompt
        }],
        system: 'You are an expert software engineer. Generate clean, modular, well-documented code.'
      });

      const generatedCode = message.content[0].text;
      logger.info('AI Engine: Code generation complete');
      return generatedCode;
    } catch (error) {
      logger.error('AI Engine: Code generation failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Analyze and refactor existing code
   * @param {string} code - The code to analyze
   * @param {string} instructions - Refactoring instructions
   * @returns {Promise<object>} - Analysis and refactored code
   */
  async refactorCode(code, instructions) {
    try {
      logger.info('AI Engine: Refactoring code...');

      const prompt = `Analyze and refactor the following code according to these instructions: ${instructions}\n\nCode:\n${code}`;

      const message = await this.client.messages.create({
        model: this.model,
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content: prompt
        }],
        system: 'You are an expert code reviewer and refactoring specialist. Provide detailed analysis and improved code.'
      });

      return {
        analysis: message.content[0].text,
        refactoredCode: this.extractCode(message.content[0].text)
      };
    } catch (error) {
      logger.error('AI Engine: Refactoring failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Validate code for errors and best practices
   * @param {string} code - The code to validate
   * @param {string} language - Programming language
   * @returns {Promise<object>} - Validation results
   */
  async validateCode(code, language = 'javascript') {
    try {
      logger.info(`AI Engine: Validating ${language} code...`);

      const prompt = `Validate the following ${language} code for:\n- Syntax errors\n- Security vulnerabilities\n- Performance issues\n- Best practices\n\nCode:\n${code}`;

      const message = await this.client.messages.create({
        model: this.model,
        max_tokens: 2048,
        messages: [{
          role: 'user',
          content: prompt
        }],
        system: 'You are a code validation expert. Provide detailed feedback on code quality, security, and best practices.'
      });

      return {
        valid: true,
        feedback: message.content[0].text,
        suggestions: this.extractSuggestions(message.content[0].text)
      };
    } catch (error) {
      logger.error('AI Engine: Validation failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Extract code blocks from AI response
   */
  extractCode(text) {
    const codeBlockRegex = /```[\w]*\n([\s\S]*?)```/g;
    const matches = [...text.matchAll(codeBlockRegex)];
    return matches.map(match => match[1].trim());
  }

  /**
   * Extract suggestions from validation response
   */
  extractSuggestions(text) {
    const lines = text.split('\n');
    return lines.filter(line =>
      line.trim().startsWith('-') ||
      line.trim().startsWith('*') ||
      line.toLowerCase().includes('suggest')
    );
  }

  /**
   * Generate test cases for code
   */
  async generateTests(code, framework = 'jest') {
    try {
      logger.info(`AI Engine: Generating ${framework} tests...`);

      const prompt = `Generate comprehensive ${framework} test cases for the following code:\n\n${code}\n\nInclude:\n- Unit tests\n- Edge cases\n- Error handling`;

      const message = await this.client.messages.create({
        model: this.model,
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content: prompt
        }],
        system: `You are a test automation expert. Generate thorough ${framework} test cases with good coverage.`
      });

      return message.content[0].text;
    } catch (error) {
      logger.error('AI Engine: Test generation failed', { error: error.message });
      throw error;
    }
  }
}
