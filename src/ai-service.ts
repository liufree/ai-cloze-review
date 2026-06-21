import { requestUrl } from 'obsidian';
import type { ClozeReviewSettings } from './settings';
import type { Locale } from './i18n';

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
	constructor(private settings: ClozeReviewSettings) {}

	updateSettings(settings: ClozeReviewSettings): void {
		this.settings = settings;
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

		const body = JSON.stringify({
			model: this.settings.model,
			messages: [{ role: 'user', content: 'Hi' }],
			max_tokens: 5,
		});

		const response = await requestUrl({
			url: this.settings.apiEndpoint,
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${this.settings.apiKey}`,
			},
			body,
			throw: false,
		});

		if (response.status >= 400) {
			let errorMsg = `API ${response.status}`;
			try {
				const errorJson = typeof response.json === 'string' ? JSON.parse(response.json) : response.json;
				if (errorJson?.error?.message) {
					errorMsg += `: ${errorJson.error.message}`;
				}
			} catch {
				if (response.text) errorMsg += `: ${response.text.slice(0, 200)}`;
			}
			throw new Error(errorMsg);
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

		const chunks = this.splitContent(content, 3000);
		const chunkTarget = Math.round(targetCount / chunks.length);
		const results: string[] = [];

		for (let i = 0; i < chunks.length; i++) {
			const chunkHint = chunks.length > 1 ? `\n${locale.chunkHint.replace('{0}', String(chunkTarget))}` : '';
			const userMessage = `${locale.userMessagePrefix}${chunkHint}\n\n${chunks[i]}`;
			const response = await this.callAPI(systemMessage, userMessage);
			results.push(this.extractContent(response));
		}

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

	private async callAPI(systemMessage: string, userMessage: string): Promise<any> {
		if (!this.settings.apiKey) {
			throw new Error('API key not configured');
		}

		const body = JSON.stringify({
			model: this.settings.model,
			messages: [
				{ role: 'system', content: systemMessage },
				{ role: 'user', content: userMessage },
			],
			temperature: this.settings.temperature,
			max_tokens: 8192,
		});

		const response = await requestUrl({
			url: this.settings.apiEndpoint,
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${this.settings.apiKey}`,
			},
			body,
			throw: false,
		});

		if (response.status >= 400) {
			let errorMsg = `API ${response.status}`;
			try {
				const errorJson = typeof response.json === 'string' ? JSON.parse(response.json) : response.json;
				if (errorJson?.error?.message) {
					errorMsg += `: ${errorJson.error.message}`;
				}
			} catch {
				if (response.text) errorMsg += `: ${response.text.slice(0, 200)}`;
			}
			throw new Error(errorMsg);
		}

		return response.json;
	}

	private extractContent(response: any): string {
		const content = response?.choices?.[0]?.message?.content;
		if (!content) {
			throw new Error('Empty AI response');
		}
		let result = content.trim();
		if (result.startsWith('```')) {
			result = result.replace(/^```(?:markdown)?\n?/, '').replace(/\n?```$/, '');
		}
		return result;
	}
}
