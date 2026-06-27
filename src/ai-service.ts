import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import type { ClozeReviewSettings } from './settings';
import type { Locale } from './i18n';
import type { ApiFormat } from './providers';

const DIFFICULTY_DENSITY: Record<string, number> = {
	easy: 250,
	medium: 120,
	hard: 60,
	extreme: 30,
};

function getDifficultyHint(difficulty: string, t: Locale): string {
	switch (difficulty) {
		case 'easy': return t.diffHintEasy;
		case 'hard': return t.diffHintHard;
		case 'extreme': return t.diffHintExtreme;
		default: return t.diffHintMedium;
	}
}

export class AIService {
	private settings: ClozeReviewSettings;
	private openaiClient: OpenAI;
	private anthropicClient: Anthropic;

	constructor(settings: ClozeReviewSettings) {
		this.settings = settings;
		this.openaiClient = this.createOpenAIClient();
		this.anthropicClient = this.createAnthropicClient();
	}

	private createOpenAIClient(): OpenAI {
		return new OpenAI({
			baseURL: this.settings.apiEndpoint,
			apiKey: this.settings.apiKey || 'placeholder',
			dangerouslyAllowBrowser: true,
		});
	}

	private createAnthropicClient(): Anthropic {
		return new Anthropic({
			baseURL: this.settings.apiEndpoint,
			apiKey: this.settings.apiKey || 'placeholder',
			dangerouslyAllowBrowser: true,
		});
	}

	updateSettings(settings: ClozeReviewSettings): void {
		this.settings = settings;
		this.openaiClient = this.createOpenAIClient();
		this.anthropicClient = this.createAnthropicClient();
	}

	private get format(): ApiFormat {
		return this.settings.apiFormat || 'openai';
	}

	async testConnection(): Promise<void> {
		if (!this.settings.apiEndpoint) {
			throw new Error('No API endpoint');
		}
		if (!this.settings.apiKey) {
			throw new Error('No API key');
		}
		if (!this.settings.model) {
			throw new Error('No model');
		}

		if (this.format === 'anthropic') {
			const response = await this.anthropicClient.messages.create({
				model: this.settings.model,
				max_tokens: 5,
				messages: [{ role: 'user', content: 'Hi' }],
			});
			if (!response.content?.[0]?.type) {
				throw new Error('Empty response from API');
			}
		} else {
			const response = await this.openaiClient.chat.completions.create({
				model: this.settings.model,
				messages: [{ role: 'user', content: 'Hi' }],
				max_tokens: 5,
			});
			if (!response.choices?.[0]?.message?.content) {
				throw new Error('Empty response from API');
			}
		}
	}

	private calcClozeCount(content: string): number {
		const density = DIFFICULTY_DENSITY[this.settings.difficulty] || DIFFICULTY_DENSITY.medium;
		const count = Math.round(content.length / density);
		return Math.max(3, Math.min(count, 200));
	}

	async generateCloze(content: string, customPrompt: string, locale: Locale): Promise<string> {
		const difficultyHint = getDifficultyHint(this.settings.difficulty, locale);
		const targetCount = this.calcClozeCount(content);
		const clozeHint = locale.clozeCountHint.replace('{0}', String(targetCount));

		const basePrompt = customPrompt || locale.defaultPrompt;
		const systemMessage = `${basePrompt}\n\n${difficultyHint}\n${clozeHint}\n\n${locale.systemSuffix}`;

		const chunks = this.splitContent(content, 6000);
		const chunkTarget = Math.round(targetCount / chunks.length);

		const promises = chunks.map((chunk, i) => {
			const chunkHint = chunks.length > 1 ? `\n${locale.chunkHint.replace('{0}', String(chunkTarget))}` : '';
			const userMessage = `${locale.userMessagePrefix}${chunkHint}\n\n${chunk}`;
			return this.callAPI(systemMessage, userMessage).then(resp => this.extractContent(resp));
		});

		const results = await Promise.all(promises);
		return results.join('\n\n');
	}

	private splitContent(content: string, maxLen: number): string[] {
		if (content.length <= maxLen) return [content];

		const lines = content.split('\n');
		const chunks: string[] = [];
		let current = '';

		for (const line of lines) {
			if ((current + '\n' + line).length > maxLen && current) {
				chunks.push(current);
				current = line;
			} else {
				current = current ? current + '\n' + line : line;
			}
		}
		if (current) chunks.push(current);
		return chunks;
	}

	private async callAPI(
		systemMessage: string,
		userMessage: string,
	): Promise<unknown> {
		if (!this.settings.apiKey) {
			throw new Error('API key not configured');
		}

		if (this.format === 'anthropic') {
			return this.anthropicClient.messages.create({
				model: this.settings.model,
				max_tokens: 4096,
				temperature: this.settings.temperature,
				system: systemMessage,
				messages: [{ role: 'user', content: userMessage }],
			});
		}

		return this.openaiClient.chat.completions.create({
			model: this.settings.model,
			messages: [
				{ role: 'system', content: systemMessage },
				{ role: 'user', content: userMessage },
			],
			temperature: this.settings.temperature,
			max_tokens: 4096,
		});
	}

	private extractContent(response: unknown): string {
		if (this.format === 'anthropic') {
			const msg = response as Anthropic.Messages.Message;
			const textBlocks = msg.content.filter(
				(block): block is Anthropic.Messages.TextBlock => block.type === 'text'
			);
			const content = textBlocks.map(b => b.text).join('\n');
			if (!content) throw new Error('Empty AI response');
			return this.stripCodeFences(content);
		}

		const completion = response as OpenAI.Chat.Completions.ChatCompletion;
		const content = completion?.choices?.[0]?.message?.content;
		if (!content) throw new Error('Empty AI response');
		return this.stripCodeFences(content);
	}

	private stripCodeFences(content: string): string {
		let result = content.trim();
		if (result.startsWith('```')) {
			result = result.replace(/^```(?:markdown)?\n?/, '').replace(/\n?```$/, '');
		}
		return result;
	}
}
