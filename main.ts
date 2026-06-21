import { Plugin, MarkdownView, Notice } from 'obsidian';
import { ClozeReviewSettings, DEFAULT_SETTINGS, ClozeReviewSettingTab } from './src/settings';
import { AIService } from './src/ai-service';
import { ClozeParser } from './src/cloze-parser';
import { ReviewMode } from './src/review-mode';
import { BottomToolbar } from './src/toolbar';
import { getLocale, detectLanguage, type Locale } from './src/i18n';

export default class ClozeReviewPlugin extends Plugin {
	settings: ClozeReviewSettings;
	aiService: AIService;
	clozeParser: ClozeParser;
	reviewMode: ReviewMode;
	toolbar: BottomToolbar;
	clozeCache: Map<string, string> = new Map();
	private generating = false;
	private _t: Locale = getLocale('en');

	get t(): Locale { return this._t; }

	updateLang(): void {
		const lang = this.settings.lang === 'auto' ? detectLanguage() : this.settings.lang;
		this._t = getLocale(lang);
		this.refreshCommands();
		this.toolbar?.refresh();
	}

	private refreshCommands(): void {
		const commands = (this.app as { commands: { commands: Record<string, unknown>; editorCommands: Record<string, unknown> } }).commands;
		if (!commands) return;
		for (const id of ['ai-cloze-review:ai-generate-cloze', 'ai-cloze-review:start-review', 'ai-cloze-review:toggle-review-mode']) {
			if (commands.commands[id]) delete commands.commands[id];
			if (commands.editorCommands[id]) delete commands.editorCommands[id];
		}

		this.addCommand({
			id: 'ai-generate-cloze',
			name: this.t.cmdAiGenerate,
			callback: () => this.generateCloze(),
		});

		this.addCommand({
			id: 'start-review',
			name: this.t.cmdStartReview,
			callback: () => this.startReview(),
		});

		this.addCommand({
			id: 'toggle-review-mode',
			name: this.t.cmdToggleReview,
			callback: () => {
				if (this.reviewMode.isActive()) {
					this.reviewMode.deactivate();
				} else {
					void this.startReview();
				}
				this.toolbar.refresh();
			},
		});
	}

	async onload(): Promise<void> {
		await this.loadSettings();
		this.addSettingTab(new ClozeReviewSettingTab(this.app, this));

		this.updateLang();
		this.aiService = new AIService(this.settings);
		this.clozeParser = new ClozeParser();
		this.reviewMode = new ReviewMode(this.app, this);
		this.toolbar = new BottomToolbar(this.app, this);

		this.registerMarkdownPostProcessor((el, _ctx) => {
			this.reviewMode.processElement(el);
		});

		this.toolbar.init();

		this.registerEvent(
			this.app.workspace.on('active-leaf-change', () => {
				if (this.reviewMode.isActive()) {
					this.reviewMode.deactivate(true);
					const view = this.getMarkdownView();
					if (view && view.file && this.clozeCache.has(view.file.path)) {
						window.setTimeout(() => {
						void this.reviewMode.activate(true).then(() => {
							this.toolbar.refresh();
						});
					}, 500);
						return;
					}
				}
				this.toolbar.refresh();
			})
		);
	}

	isGenerating(): boolean {
		return this.generating;
	}

	async startReview(): Promise<void> {
		if (this.reviewMode.isActive()) return;

		const view = this.getMarkdownView();
		if (!view || !view.file) {
			new Notice(this.t.openNoteFirst);
			return;
		}

		if (!this.clozeCache.has(view.file.path)) {
			new Notice(this.t.noCache);
			return;
		}

		await this.reviewMode.activate();
		this.toolbar.refresh();
	}

	async generateCloze(): Promise<void> {
		if (this.generating) return;

		const view = this.getMarkdownView();
		if (!view || !view.file) {
			new Notice(this.t.openNoteFirst);
			return;
		}

		const filePath = view.file.path;

		this.generating = true;
		this.toolbar.refresh();

		const notice = new Notice(this.t.aiGeneratingTitle, 0);

		try {
			const editor = view.editor;
			const selection = editor.getSelection();
			const content = selection || editor.getValue();

			if (!content.trim()) {
				new Notice(this.t.noContent);
				return;
			}

			if (!this.settings.apiKey) {
				new Notice(this.t.configApiKey);
				this.openSettings();
				return;
			}

			if (!this.settings.model) {
				new Notice(this.t.configModel);
				this.openSettings();
				return;
			}

			this.aiService.updateSettings(this.settings);
			const result = await this.aiService.generateCloze(content, this.settings.customPrompt, this._t);

			this.clozeCache.set(filePath, result);

			notice.hide();
			const clozeCount = this.clozeParser.count(result);
			new Notice(`${this.t.generated} ${clozeCount} ${this.t.clozesCount}`);

			if (this.settings.autoEnterReview) {
				const currentView = this.getMarkdownView();
				const stillOnSameNote = currentView && currentView.file && currentView.file.path === filePath;
				if (stillOnSameNote) {
					if (this.reviewMode.isActive()) {
						this.reviewMode.deactivate();
					}
					await this.reviewMode.activate();
				}
			}
		} catch (e) {
			notice.hide();
			new Notice(this.t.genFailed + (e as Error).message, 5000);
			console.error('Cloze generation error:', e);
		} finally {
			this.generating = false;
			this.toolbar.refresh();
		}
	}

	getMarkdownView(): MarkdownView | null {
		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (activeView) return activeView;
		const leaves = this.app.workspace.getLeavesOfType('markdown');
		if (leaves.length > 0) return leaves[0].view as MarkdownView;
		return null;
	}

	openSettings(): void {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
		(this.app as { setting: { open: () => void; openTabById: (id: string) => void } }).setting.open();
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
		(this.app as { setting: { open: () => void; openTabById: (id: string) => void } }).setting.openTabById('ai-cloze-review');
	}

	async loadSettings(): Promise<void> {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<ClozeReviewSettings>);
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
		this.aiService?.updateSettings(this.settings);
	}

	onunload(): void {
		this.reviewMode.destroy();
		this.toolbar.destroy();
		activeDocument.querySelectorAll('.cloze-review-toolbar').forEach((el) => el.remove());
		activeDocument.querySelectorAll('.cloze-review-active').forEach((el) => {
			el.classList.remove('cloze-review-active');
		});
	}
}
