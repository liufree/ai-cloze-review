import { App, PluginSettingTab, Setting, Notice } from 'obsidian';
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
			)
			.addButton((button) =>
				button
					.setButtonText(t.testConnection)
					.onClick(async () => {
						this.plugin.aiService.updateSettings(this.plugin.settings);
						button.setButtonText(t.testing);
						button.setDisabled(true);
						try {
							await this.plugin.aiService.testConnection();
							new Notice(t.testSuccess);
						} catch (e) {
							new Notice(t.testFailed + (e as Error).message, 5000);
						} finally {
							button.setButtonText(t.testConnection);
							button.setDisabled(false);
						}
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
					.setPlaceholder(this.plugin.t.defaultPrompt)
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
