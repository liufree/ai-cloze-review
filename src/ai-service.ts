import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
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
	private openaiProvider: ReturnType<typeof createOpenAI>;
	private anthropicProvider: ReturnType<typeof createAnthropic>;

	constructor(settings: ClozeReviewSettings) {
		this.settings = settings;
		this.openaiProvider = this.createOpenAIProvider();
		this.anthropicProvider = this.createAnthropicProvider();
	}

	private createOpenAIProvider() {
		return createOpenAI({
			baseURL: this.settings.apiEndpoint,
			apiKey: this.settings.apiKey || 'placeholder',
			compatibility: 'compatible',
		});
	}

	private createAnthropicProvider() {
		return createAnthropic({
			baseURL: this.settings.apiEndpoint,
			apiKey: this.settings.apiKey || 'placeholder',
		});
	}

	updateSettings(settings: ClozeReviewSettings): void {
		this.settings = settings;
		this.openaiProvider = this.createOpenAIProvider();
		this.anthropicProvider = this.createAnthropicProvider();
	}

	private get format(): ApiFormat {
		return this.settings.apiFormat || 'openai';
	}

	private getModel() {
		if (this.format === 'anthropic') {
			return this.anthropicProvider(this.settings.model);
		}
		return this.openaiProvider(this.settings.model);
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

		const model = this.getModel();
		const result = await generateText({
			model,
			messages: [{ role: 'user', content: 'Hi' }],
			maxTokens: 5,
		});
		if (!result.text) {
			throw new Error('Empty response from API');
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
			return this.callAPI(systemMessage, userMessage);
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
	): Promise<string> {
		if (!this.settings.apiKey) {
			throw new Error('API key not configured');
		}

		const model = this.getModel();
		const result = await generateText({
			model,
			system: systemMessage,
			messages: [{ role: 'user', content: userMessage }],
			temperature: this.settings.temperature,
			maxTokens: 4096,
		});

		const content = result.text;
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
