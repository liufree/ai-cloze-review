import { App, PluginSettingTab, Setting } from 'obsidian';
import type ClozeReviewPlugin from '../main';

export interface ClozeReviewSettings {
	apiEndpoint: string;
	apiKey: string;
	model: string;
	customPrompt: string;
	difficulty: 'easy' | 'medium' | 'hard' | 'extreme';
	temperature: number;
	autoEnterReview: boolean;
}

export const DEFAULT_PROMPT = `你是一个学习辅助工具。请分析以下笔记内容，识别其中的重点内容（如关键概念、定义、术语、日期、数字、公式、人名、地名、核心论点等），并将这些重要内容用挖空格式 {{c1::内容}} 包裹起来。

要求：
1. 只对值得记忆的重要信息进行挖空，不要过度挖空
2. 每个挖空应该是一个完整的、有意义的内容片段
3. 保持原文结构和格式不变，只添加挖空标记
4. 对于需要提示的内容，可以使用 {{c1::内容::提示}} 格式
5. 挖空数量适中，重点突出
6. 不要对标题、列表标记、链接等结构元素进行挖空
7. 直接返回修改后的完整内容，不要添加任何额外说明或解释`;

export const DEFAULT_SETTINGS: ClozeReviewSettings = {
	apiEndpoint: 'https://api.openai.com/v1/chat/completions',
	apiKey: '',
	model: 'gpt-4o-mini',
	customPrompt: '',
	difficulty: 'medium',
	temperature: 0.3,
	autoEnterReview: true,
};

export class ClozeReviewSettingTab extends PluginSettingTab {
	plugin: ClozeReviewPlugin;

	constructor(app: App, plugin: ClozeReviewPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl('h3', { text: 'AI 配置' });

		new Setting(containerEl)
			.setName('API 端点')
			.setDesc('OpenAI 兼容的 API 地址（支持 OpenAI / 智谱 / Moonshot / Ollama 等）')
			.addText((text) =>
				text
					.setPlaceholder('https://api.openai.com/v1/chat/completions')
					.setValue(this.plugin.settings.apiEndpoint)
					.onChange(async (value) => {
						this.plugin.settings.apiEndpoint = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName('API Key')
			.setDesc('API 密钥')
			.addText((text) => {
				text.inputEl.type = 'password';
				text
					.setPlaceholder('sk-...')
					.setValue(this.plugin.settings.apiKey)
					.onChange(async (value) => {
						this.plugin.settings.apiKey = value;
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName('模型')
			.setDesc('使用的模型名称')
			.addText((text) =>
				text
					.setPlaceholder('gpt-4o-mini')
					.setValue(this.plugin.settings.model)
					.onChange(async (value) => {
						this.plugin.settings.model = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName('温度')
			.setDesc('生成温度 (0-1)，越低越确定性')
			.addSlider((slider) =>
				slider
					.setLimits(0, 1, 0.1)
					.setValue(this.plugin.settings.temperature)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.temperature = value;
						await this.plugin.saveSettings();
					})
			);

		containerEl.createEl('h3', { text: '挖空设置' });

		new Setting(containerEl)
			.setName('难度')
			.setDesc('挖空密度自动根据内容长度和难度计算')
			.addDropdown((dropdown) =>
				dropdown
					.addOption('easy', '简单 - 稀疏，只挖最核心内容')
					.addOption('medium', '中等 - 适度挖空')
					.addOption('hard', '困难 - 密集挖空')
					.addOption('extreme', '超密集 - 几乎覆盖所有知识点')
					.setValue(this.plugin.settings.difficulty)
					.onChange(async (value) => {
						this.plugin.settings.difficulty = value as 'easy' | 'medium' | 'hard' | 'extreme';
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName('自动进入复习模式')
			.setDesc('AI 生成挖空后自动进入复习模式')
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.autoEnterReview)
					.onChange(async (value) => {
						this.plugin.settings.autoEnterReview = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName('自定义提示词')
			.setDesc('留空则使用默认提示词')
			.addTextArea((text) => {
				text
					.setPlaceholder(DEFAULT_PROMPT)
					.setValue(this.plugin.settings.customPrompt)
					.onChange(async (value) => {
						this.plugin.settings.customPrompt = value;
						await this.plugin.saveSettings();
					});
				text.inputEl.rows = 10;
				text.inputEl.style.width = '100%';
			});

		const hintEl = containerEl.createEl('div', { cls: 'cloze-review-hint' });
		hintEl.innerHTML = `
			<p><strong>挖空语法：</strong></p>
			<ul>
				<li><code>{{c1::内容}}</code> - 基本挖空</li>
				<li><code>{{c1::内容::提示}}</code> - 带提示的挖空</li>
			</ul>
			<p>挖空数量根据笔记内容长度和难度自动计算，无需手动设置。</p>
			<p>在阅读视图中，复习模式会将挖空内容隐藏为空白，点击可显示答案。</p>
		`;
	}
}
