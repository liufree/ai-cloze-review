import { requestUrl } from 'obsidian';
import type { ClozeReviewSettings } from './settings';
import { DEFAULT_PROMPT } from './settings';

const DIFFICULTY_DENSITY: Record<string, number> = {
	easy: 250,
	medium: 120,
	hard: 60,
	extreme: 30,
};

const DIFFICULTY_HINTS: Record<string, string> = {
	easy: '只对最核心的关键词、专有名词、重要数字进行挖空，每段最多1-2个挖空。',
	medium: '对关键概念、定义中的核心词、重要术语进行挖空，适度覆盖重点内容。',
	hard: '密集挖空，对所有重要信息点都进行挖空，包括细节性的数字、日期、人名等。',
	extreme: '超密集挖空，几乎对每个有意义的词组都进行挖空，最大限度地覆盖知识点，让复习极具挑战性。',
};

export class AIService {
	constructor(private settings: ClozeReviewSettings) {}

	updateSettings(settings: ClozeReviewSettings): void {
		this.settings = settings;
	}

	private calcClozeCount(content: string): number {
		const density = DIFFICULTY_DENSITY[this.settings.difficulty] || DIFFICULTY_DENSITY.medium;
		const count = Math.round(content.length / density);
		return Math.max(3, Math.min(count, 200));
	}

	async generateCloze(content: string, customPrompt: string): Promise<string> {
		const difficultyHint = DIFFICULTY_HINTS[this.settings.difficulty] || DIFFICULTY_HINTS.medium;
		const targetCount = this.calcClozeCount(content);
		const clozeHint = `根据内容长度，大约挖空 ${targetCount} 个，根据实际重点灵活调整。`;

		const basePrompt = customPrompt || DEFAULT_PROMPT;
		const systemMessage = `${basePrompt}\n\n${difficultyHint}\n${clozeHint}\n\n重要：你必须使用 {{c1::内容}} 格式包裹重要信息。直接返回修改后的完整内容，不要添加任何解释或说明。`;

		const chunks = this.splitContent(content, 3000);
		const chunkTarget = Math.round(targetCount / chunks.length);
		const results: string[] = [];

		for (let i = 0; i < chunks.length; i++) {
			const chunkHint = chunks.length > 1 ? `\n（本段大约挖空 ${chunkTarget} 个）` : '';
			const userMessage = `请对以下笔记内容进行挖空处理，用 {{c1::内容}} 格式包裹重要信息，返回完整的修改后内容：${chunkHint}\n\n${chunks[i]}`;
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
			throw new Error('请先在设置中配置 API Key');
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
			let errorMsg = `API 请求失败 (${response.status})`;
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
			throw new Error('AI 返回内容为空');
		}
		let result = content.trim();
		if (result.startsWith('```')) {
			result = result.replace(/^```(?:markdown)?\n?/, '').replace(/\n?```$/, '');
		}
		return result;
	}
}
