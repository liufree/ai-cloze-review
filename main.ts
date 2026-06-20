import { Plugin, MarkdownView, Notice, TFile } from 'obsidian';
import { ClozeReviewSettings, DEFAULT_SETTINGS, ClozeReviewSettingTab } from './src/settings';
import { AIService } from './src/ai-service';
import { ClozeParser } from './src/cloze-parser';
import { ReviewMode } from './src/review-mode';
import { BottomToolbar } from './src/toolbar';

export default class ClozeReviewPlugin extends Plugin {
	settings: ClozeReviewSettings;
	aiService: AIService;
	clozeParser: ClozeParser;
	reviewMode: ReviewMode;
	toolbar: BottomToolbar;
	clozeCache: Map<string, string> = new Map();
	private generating = false;

	async onload(): Promise<void> {
		await this.loadSettings();
		this.addSettingTab(new ClozeReviewSettingTab(this.app, this));

		this.aiService = new AIService(this.settings);
		this.clozeParser = new ClozeParser();
		this.reviewMode = new ReviewMode(this.app, this);
		this.toolbar = new BottomToolbar(this.app, this);

		this.registerMarkdownPostProcessor((el, _ctx) => {
			this.reviewMode.processElement(el);
		});

		this.toolbar.init();

		this.addCommand({
			id: 'ai-generate-cloze',
			name: 'AI 生成挖空',
			callback: () => this.generateCloze(),
		});

		this.addCommand({
			id: 'start-review',
			name: '开始复习（使用缓存）',
			callback: () => this.startReview(),
		});

		this.addCommand({
			id: 'toggle-review-mode',
			name: '切换复习模式',
			callback: () => {
				if (this.reviewMode.isActive()) {
					this.reviewMode.deactivate();
				} else {
					this.startReview();
				}
				this.toolbar.refresh();
			},
		});

		this.registerEvent(
			this.app.workspace.on('active-leaf-change', () => {
				if (this.reviewMode.isActive()) {
					this.reviewMode.deactivate(true);
					const view = this.getMarkdownView();
					if (view && view.file && this.clozeCache.has(view.file.path)) {
						setTimeout(async () => {
							await this.reviewMode.activate(true);
							this.toolbar.refresh();
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
			new Notice('请先打开一个笔记');
			return;
		}

		if (!this.clozeCache.has(view.file.path)) {
			new Notice('没有缓存的挖空内容，请先点击 AI 挖空');
			return;
		}

		await this.reviewMode.activate();
		this.toolbar.refresh();
	}

	async generateCloze(): Promise<void> {
		if (this.generating) return;

		const view = this.getMarkdownView();
		if (!view || !view.file) {
			new Notice('请先打开一个笔记');
			return;
		}

		this.generating = true;
		this.toolbar.refresh();

		const notice = new Notice('AI 正在生成挖空…', 0);

		try {
			const editor = view.editor;
			const selection = editor.getSelection();
			const content = selection || editor.getValue();

			if (!content.trim()) {
				new Notice('没有可挖空的内容');
				return;
			}

			if (!this.settings.apiKey) {
				new Notice('请先在设置中配置 API Key');
				this.openSettings();
				return;
			}

			this.aiService.updateSettings(this.settings);
			const result = await this.aiService.generateCloze(content, this.settings.customPrompt);

			this.clozeCache.set(view.file.path, result);

			notice.hide();
			const clozeCount = this.clozeParser.count(result);
			new Notice(`挖空生成完成！共 ${clozeCount} 个挖空`);

			if (this.settings.autoEnterReview) {
				if (this.reviewMode.isActive()) {
					await this.reviewMode.deactivate();
				}
				await this.reviewMode.activate();
			}
		} catch (e) {
			notice.hide();
			new Notice('AI 生成失败: ' + (e as Error).message, 5000);
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
		(this.app as any).setting.open();
		(this.app as any).setting.openTabById('ai-cloze-review');
	}

	async loadSettings(): Promise<void> {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
		this.aiService?.updateSettings(this.settings);
	}

	onunload(): void {
		this.reviewMode.destroy();
		this.toolbar.destroy();
		document.querySelectorAll('.cloze-review-toolbar').forEach((el) => el.remove());
		document.querySelectorAll('.cloze-review-active').forEach((el) => {
			el.classList.remove('cloze-review-active');
		});
	}
}
