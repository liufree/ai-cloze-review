export const LOCALES = {
	zh: {
		ready: '就绪',
		aiGenerate: 'AI 挖空',
		generating: '生成中…',
		aiGenerating: 'AI 生成中…',
		showAnswer: '显示答案',
		reset: '重置',
		exitReview: '退出复习',
		startReview: '开始复习',
		clozesCount: '个挖空',
		reviewOn: '挖空复习模式已开启',
		reviewOff: '挖空复习模式已关闭',
		openNoteFirst: '请先打开一个笔记',
		generateFirst: '请先生成挖空内容',
		allRevealed: '已显示所有答案',
		activateFirst: '请先开启复习模式',
		aiGeneratingTitle: 'AI 正在生成挖空…',
		noContent: '没有可挖空的内容',
		configApiKey: '请先在设置中配置 API Key',
		configModel: '请先在设置中配置模型名称',
		generated: '挖空生成完成！共',
		genFailed: 'AI 生成失败: ',
		noCache: '没有缓存的挖空内容，请先点击 AI 挖空',
		apiFailed: 'API 请求失败',
		aiEmpty: 'AI 返回内容为空',
		aiConfig: 'AI 配置',
		provider: 'AI 提供商',
		providerDesc: '选择 AI 服务提供商，自动填充 API 地址和默认模型',
		apiFormat: 'API 格式',
		apiFormatDesc: 'API 协议格式：OpenAI 兼容 或 Anthropic',
		apiEndpoint: 'API 端点',
		apiEndpointDesc: 'OpenAI 兼容的 API 地址（支持 OpenAI / 智谱 / Moonshot / Ollama 等）',
		apiKey: 'API Key',
		apiKeyDesc: 'API 密钥',
		model: '模型',
		modelDesc: '使用的模型名称',
		temperature: '温度',
		temperatureDesc: '生成温度 (0-1)，越低越确定性',
		clozeSettings: '挖空设置',
		difficulty: '难度',
		difficultyDesc: '挖空密度根据内容长度和难度自动计算',
		easy: '简单 - 稀疏，只挖最核心内容',
		medium: '中等 - 适度挖空',
		hard: '困难 - 密集挖空',
		extreme: '超密集 - 几乎覆盖所有知识点',
		autoReview: '自动进入复习模式',
		autoReviewDesc: 'AI 生成挖空后自动进入复习模式',
		customPrompt: '自定义提示词',
		customPromptDesc: '留空则使用默认提示词',
		language: '语言',
		languageDesc: '界面语言',
		chinese: '中文',
		english: 'English',
		clozeSyntax: '挖空语法',
		basicCloze: '基本挖空',
		hintCloze: '带提示的挖空',
		autoCalc: '挖空数量根据笔记内容长度和难度自动计算，无需手动设置。',
		readingDesc: '在阅读视图中，复习模式会将挖空内容隐藏为空白，点击可显示答案。',
		cmdAiGenerate: 'AI 生成挖空',
		cmdStartReview: '开始复习（使用缓存）',
		cmdToggleReview: '切换复习模式',
		cmdShowReset: '显示/重置答案',
		placeholder: '［ ］',
		defaultPrompt: `你是一个学习辅助工具。请分析以下笔记内容，识别其中的重点内容（如关键概念、定义、术语、日期、数字、公式、人名、地名、核心论点等），并将这些重要内容用挖空格式 {{c1::内容}} 包裹起来。

要求：
1. 只对值得记忆的重要信息进行挖空，不要过度挖空
2. 每个挖空应该是一个完整的、有意义的内容片段
3. 保持原文结构和格式不变，只添加挖空标记
4. 对于需要提示的内容，可以使用 {{c1::内容::提示}} 格式
5. 挖空数量适中，重点突出
6. 不要对标题、列表标记、链接等结构元素进行挖空
7. 直接返回修改后的完整内容，不要添加任何额外说明或解释`,
		diffHintEasy: '只对最核心的关键词、专有名词、重要数字进行挖空，每段最多1-2个挖空。',
		diffHintMedium: '对关键概念、定义中的核心词、重要术语进行挖空，适度覆盖重点内容。',
		diffHintHard: '密集挖空，对所有重要信息点都进行挖空，包括细节性的数字、日期、人名等。',
		diffHintExtreme: '超密集挖空，几乎对每个有意义的词组都进行挖空，最大限度地覆盖知识点，让复习极具挑战性。',
		clozeCountHint: '根据内容长度，大约挖空 {0} 个，根据实际重点灵活调整。',
		systemSuffix: '重要：你必须使用 {{c1::内容}} 格式包裹重要信息。直接返回修改后的完整内容，不要添加任何解释或说明。',
		userMessagePrefix: '请对以下笔记内容进行挖空处理，用 {{c1::内容}} 格式包裹重要信息，返回完整的修改后内容：',
		chunkHint: '（本段大约挖空 {0} 个）',
		testConnection: '测试连接',
		testing: '测试中…',
		testSuccess: '连接成功！模型可用',
		testFailed: '连接失败: ',
		configEndpoint: '请先配置 API 端点',
	},
	en: {
		ready: 'Ready',
		aiGenerate: 'AI Cloze',
		generating: 'Generating…',
		aiGenerating: 'AI generating…',
		showAnswer: 'Reveal',
		reset: 'Reset',
		exitReview: 'Exit',
		startReview: 'Review',
		clozesCount: ' clozes',
		reviewOn: 'Review mode activated',
		reviewOff: 'Review mode deactivated',
		openNoteFirst: 'Please open a note first',
		generateFirst: 'Please generate clozes first',
		allRevealed: 'All answers revealed',
		activateFirst: 'Please activate review mode first',
		aiGeneratingTitle: 'AI generating clozes…',
		noContent: 'No content to cloze',
		configApiKey: 'Please configure API key in settings',
		configModel: 'Please configure model name in settings',
		generated: 'Generated ',
		genFailed: 'AI generation failed: ',
		noCache: 'No cached cloze content. Click AI Cloze first.',
		apiFailed: 'API request failed',
		aiEmpty: 'AI returned empty content',
		aiConfig: 'AI Configuration',
		provider: 'AI Provider',
		providerDesc: 'Select AI provider, auto-fills API URL and default model',
		apiFormat: 'API Format',
		apiFormatDesc: 'API protocol format: OpenAI Compatible or Anthropic',
		apiEndpoint: 'API Endpoint',
		apiEndpointDesc: 'OpenAI-compatible API URL',
		apiKey: 'API Key',
		apiKeyDesc: 'Your API key',
		model: 'Model',
		modelDesc: 'Model name to use',
		temperature: 'Temperature',
		temperatureDesc: 'Generation temperature (0-1)',
		clozeSettings: 'Cloze Settings',
		difficulty: 'Difficulty',
		difficultyDesc: 'Density auto-calculated from content length and difficulty',
		easy: 'Easy - sparse, keywords only',
		medium: 'Medium - moderate coverage',
		hard: 'Hard - dense coverage',
		extreme: 'Extreme - full coverage',
		autoReview: 'Auto enter review',
		autoReviewDesc: 'Automatically enter review after AI generation',
		customPrompt: 'Custom prompt',
		customPromptDesc: 'Leave empty to use default prompt',
		language: 'Language',
		languageDesc: 'Interface language',
		chinese: '中文',
		english: 'English',
		clozeSyntax: 'Cloze Syntax',
		basicCloze: 'Basic cloze',
		hintCloze: 'Cloze with hint',
		autoCalc: 'Cloze count is auto-calculated from content length and difficulty.',
		readingDesc: 'In reading view, review mode hides cloze answers as blanks, click to reveal.',
		cmdAiGenerate: 'AI generate clozes',
		cmdStartReview: 'Start review (use cache)',
		cmdToggleReview: 'Toggle review mode',
		cmdShowReset: 'Show/Reset answers',
		placeholder: '[ __ ]',
		defaultPrompt: `You are a study aid tool. Analyze the following note content, identify key points (such as key concepts, definitions, terms, dates, numbers, formulas, names, places, core arguments, etc.), and wrap these important contents in cloze format {{c1::content}}.

Requirements:
1. Only cloze information worth memorizing, do not over-cloze
2. Each cloze should be a complete, meaningful content fragment
3. Keep the original structure and format unchanged, only add cloze markers
4. For content that needs hints, use {{c1::content::hint}} format
5. Moderate number of clozes, focus on key points
6. Do not cloze structural elements like titles, list markers, links, etc.
7. Return the modified complete content directly, without adding any extra explanation`,
		diffHintEasy: 'Only cloze the most core keywords, proper nouns, and important numbers, at most 1-2 clozes per paragraph.',
		diffHintMedium: 'Cloze key concepts, core words in definitions, and important terms, with moderate coverage of key content.',
		diffHintHard: 'Dense clozing, cloze all important information points, including detailed numbers, dates, names, etc.',
		diffHintExtreme: 'Ultra-dense clozing, cloze almost every meaningful phrase, maximally covering knowledge points for challenging review.',
		clozeCountHint: 'Based on content length, approximately {0} clozes, adjust flexibly based on actual key points.',
		systemSuffix: 'Important: You must use {{c1::content}} format to wrap important information. Return the modified complete content directly, without adding any explanation.',
		userMessagePrefix: 'Please cloze the following note content, wrapping important information in {{c1::content}} format, and return the complete modified content:',
		chunkHint: '(Approximately {0} clozes in this section)',
		testConnection: 'Test Connection',
		testing: 'Testing…',
		testSuccess: 'Connection successful! Model is available',
		testFailed: 'Connection failed: ',
		configEndpoint: 'Please configure API endpoint first',
	},
} as const;

export type Locale = typeof LOCALES.en;
export type Lang = keyof typeof LOCALES;

export function getLocale(lang: Lang): Locale {
	return LOCALES[lang] || LOCALES.en;
}

export function detectLanguage(): Lang {
	try {
		const lang = navigator.language?.toLowerCase();
		if (lang && (lang.startsWith('zh') || lang.includes('cn'))) return 'zh';
	} catch {
		// navigator.language not available, default to English
	}
	return 'en';
}
