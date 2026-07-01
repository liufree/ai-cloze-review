export type ApiFormat = 'openai' | 'anthropic';

export interface ProviderPreset {
	id: string;
	name: string;
	apiFormat: ApiFormat;
	baseURL: string;
	defaultModel: string;
	defaultApiKey: string;
}

export const PROVIDER_PRESETS: Record<string, ProviderPreset> = {
	openai: {
		id: 'openai',
		name: 'OpenAI',
		apiFormat: 'openai',
		baseURL: 'https://api.openai.com/v1',
		defaultModel: 'gpt-4o-mini',
		defaultApiKey: 'sk-...',
	},
	anthropic: {
		id: 'anthropic',
		name: 'Anthropic (Claude)',
		apiFormat: 'anthropic',
		baseURL: 'https://api.anthropic.com/v1',
		defaultModel: 'claude-sonnet-4-20250514',
		defaultApiKey: 'sk-ant-...',
	},
	deepseek: {
		id: 'deepseek',
		name: 'DeepSeek',
		apiFormat: 'openai',
		baseURL: 'https://api.deepseek.com/v1',
		defaultModel: 'deepseek-chat',
		defaultApiKey: '',
	},
	zhipu: {
		id: 'zhipu',
		name: '智谱 (Zhipu)',
		apiFormat: 'openai',
		baseURL: 'https://open.bigmodel.cn/api/paas/v4',
		defaultModel: 'glm-4-flash',
		defaultApiKey: '',
	},
	moonshot: {
		id: 'moonshot',
		name: 'Moonshot (月之暗面)',
		apiFormat: 'openai',
		baseURL: 'https://api.moonshot.cn/v1',
		defaultModel: 'moonshot-v1-8k',
		defaultApiKey: '',
	},
	ollama: {
		id: 'ollama',
		name: 'Ollama (Local)',
		apiFormat: 'openai',
		baseURL: 'http://localhost:11434/v1',
		defaultModel: 'llama3',
		defaultApiKey: 'ollama',
	},
	groq: {
		id: 'groq',
		name: 'Groq',
		apiFormat: 'openai',
		baseURL: 'https://api.groq.com/openai/v1',
		defaultModel: 'llama-3.3-70b-versatile',
		defaultApiKey: '',
	},
	openrouter: {
		id: 'openrouter',
		name: 'OpenRouter',
		apiFormat: 'openai',
		baseURL: 'https://openrouter.ai/api/v1',
		defaultModel: 'openai/gpt-4o-mini',
		defaultApiKey: '',
	},
	siliconflow: {
		id: 'siliconflow',
		name: 'SiliconFlow (硅基流动)',
		apiFormat: 'openai',
		baseURL: 'https://api.siliconflow.cn/v1',
		defaultModel: 'Qwen/Qwen2.5-7B-Instruct',
		defaultApiKey: '',
	},
	custom: {
		id: 'custom',
		name: 'Custom',
		apiFormat: 'openai',
		baseURL: '',
		defaultModel: '',
		defaultApiKey: '',
	},
};
