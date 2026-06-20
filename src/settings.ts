import { App, PluginSettingTab, Setting } from 'obsidian';
import type ClozeReviewPlugin from '../main';
import { detectLanguage, type Lang } from './i18n';

export interface ClozeReviewSettings {
	lang: 'auto' | Lang;
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
	lang: 'auto',
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

		const t = this.plugin.t;

		containerEl.createEl('h3', { text: t.language });
		new Setting(containerEl)
			.setName(t.language)
			.setDesc(t.languageDesc)
			.addDropdown((dropdown) =>
				dropdown
					.addOption('auto', t.languageDesc)
					.addOption('zh', t.chinese)
					.addOption('en', t.english)
					.setValue(this.plugin.settings.lang)
					.onChange(async (value) => {
						this.plugin.settings.lang = value as 'auto' | 'zh' | 'en';
						await this.plugin.saveSettings();
						this.plugin.updateLang();
						this.display();
					})
			);

		containerEl.createEl('h3', { text: t.aiConfig });

		new Setting(containerEl)
			.setName(t.apiEndpoint)
			.setDesc(t.apiEndpointDesc)
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
			.setName(t.apiKey)
			.setDesc(t.apiKeyDesc)
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
			.setName(t.model)
			.setDesc(t.modelDesc)
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
			.setName(t.temperature)
			.setDesc(t.temperatureDesc)
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

		containerEl.createEl('h3', { text: t.clozeSettings });

		new Setting(containerEl)
			.setName(t.difficulty)
			.setDesc(t.difficultyDesc)
			.addDropdown((dropdown) =>
				dropdown
					.addOption('easy', t.easy)
					.addOption('medium', t.medium)
					.addOption('hard', t.hard)
					.addOption('extreme', t.extreme)
					.setValue(this.plugin.settings.difficulty)
					.onChange(async (value) => {
						this.plugin.settings.difficulty = value as 'easy' | 'medium' | 'hard' | 'extreme';
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName(t.autoReview)
			.setDesc(t.autoReviewDesc)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.autoEnterReview)
					.onChange(async (value) => {
						this.plugin.settings.autoEnterReview = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName(t.customPrompt)
			.setDesc(t.customPromptDesc)
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
			<p><strong>${t.clozeSyntax}：</strong></p>
			<ul>
				<li><code>{{c1::内容}}</code> - ${t.basicCloze}</li>
				<li><code>{{c1::内容::提示}}</code> - ${t.hintCloze}</li>
			</ul>
			<p>${t.autoCalc}</p>
			<p>${t.readingDesc}</p>
		`;
	}
}
