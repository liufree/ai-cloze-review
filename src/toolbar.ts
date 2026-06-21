import { App, MarkdownView, WorkspaceLeaf, getIcon } from 'obsidian';
import type ClozeReviewPlugin from '../main';

export class BottomToolbar {
	private app: App;
	private plugin: ClozeReviewPlugin;
	private toolbarEl: HTMLElement | null = null;
	private statusEl: HTMLElement | null = null;
	private leftGroup: HTMLElement | null = null;
	private centerGroup: HTMLElement | null = null;
	private containerEl: HTMLElement | null = null;

	constructor(app: App, plugin: ClozeReviewPlugin) {
		this.app = app;
		this.plugin = plugin;
	}

	init(): void {
		this.app.workspace.onLayoutReady(() => {
			this.update();
		});

		this.app.workspace.on('active-leaf-change', () => {
			this.update();
		});
	}

	private update(): void {
		const leaf = this.app.workspace.getLeaf();
		if (!leaf || leaf.view.getViewType() !== 'markdown') {
			this.hide();
			return;
		}
		this.show(leaf);
	}

	private show(leaf: WorkspaceLeaf): void {
		this.hide();

		const view = leaf.view as MarkdownView;
		const container = view.containerEl;
		container.classList.add('has-cloze-toolbar');
		this.containerEl = container;

		const toolbar = container.ownerDocument.createElement('div');
		toolbar.className = 'cloze-review-toolbar';

		this.leftGroup = container.ownerDocument.createElement('div');
		this.leftGroup.className = 'cloze-toolbar-group cloze-toolbar-left';

		this.statusEl = container.ownerDocument.createElement('span');
		this.statusEl.className = 'cloze-toolbar-status';
		this.statusEl.textContent = this.plugin.t.ready;
		this.leftGroup.appendChild(this.statusEl);

		this.leftGroup.appendChild(this.createIconButton('settings', () => {
			this.plugin.openSettings();
		}));

		this.centerGroup = container.ownerDocument.createElement('div');
		this.centerGroup.className = 'cloze-toolbar-group cloze-toolbar-center';

		toolbar.appendChild(this.leftGroup);
		toolbar.appendChild(this.centerGroup);

		container.appendChild(toolbar);
		this.toolbarEl = toolbar;

		this.refresh();
	}

	refresh(): void {
		if (!this.centerGroup) return;
		this.centerGroup.empty();

		const t = this.plugin.t;
		const generating = this.plugin.isGenerating();
		const reviewing = this.plugin.reviewMode.isActive();
		const hasCache = this.plugin.reviewMode.hasCachedClozes();

		if (generating) {
			this.centerGroup.appendChild(this.createButton(t.generating, 'loader', () => {}, true));
		} else if (reviewing) {
			const stats = this.plugin.reviewMode.getStats();
			const allRevealed = stats.total > 0 && stats.revealed >= stats.total;

			this.centerGroup.appendChild(this.createButton(
				allRevealed ? t.reset : t.showAnswer,
				allRevealed ? 'rotate-ccw' : 'eye-off',
				() => {
					if (allRevealed) {
						this.plugin.reviewMode.resetAll();
					} else {
						this.plugin.reviewMode.revealAll();
					}
					this.refresh();
				}
			));

			this.centerGroup.appendChild(this.createButton(t.exitReview, 'x', () => {
				this.plugin.reviewMode.deactivate();
				this.refresh();
			}));
		} else {
			this.centerGroup.appendChild(this.createButton(t.aiGenerate, 'sparkles', () => {
				void this.plugin.generateCloze();
			}));

			if (hasCache) {
				this.centerGroup.appendChild(this.createButton(t.startReview, 'play', () => {
					void this.plugin.startReview();
				}));
			}
		}

		this.updateStatus(generating, reviewing, hasCache);
	}

	private updateStatus(generating: boolean, reviewing: boolean, hasCache: boolean): void {
		if (!this.statusEl) return;

		const t = this.plugin.t;

		if (generating) {
			this.statusEl.textContent = t.aiGenerating;
			this.statusEl.classList.add('generating');
			this.statusEl.classList.remove('reviewing');
		} else if (reviewing) {
			const stats = this.plugin.reviewMode.getStats();
			this.statusEl.textContent = `${stats.revealed} / ${stats.total}`;
			this.statusEl.classList.add('reviewing');
			this.statusEl.classList.remove('generating');
		} else if (hasCache) {
			const view = this.plugin.getMarkdownView();
			if (view && view.file) {
				const cached = this.plugin.clozeCache.get(view.file.path);
				if (cached) {
					const count = this.plugin.clozeParser.count(cached);
					this.statusEl.textContent = `${count} ${t.clozesCount}`;
				}
			}
			this.statusEl.classList.remove('reviewing', 'generating');
		} else {
		this.statusEl.textContent = this.plugin.t.ready;
			this.statusEl.classList.remove('reviewing', 'generating');
		}
	}

	private createButton(label: string, iconName: string, onClick: () => void, disabled = false): HTMLElement {
		const doc = this.toolbarEl?.ownerDocument ?? activeDocument;
		const btn = doc.createElement('button');
		btn.className = 'cloze-toolbar-btn';

		if (iconName === 'loader') {
			btn.classList.add('is-loading');
			const spinner = doc.createElement('span');
			spinner.className = 'cloze-btn-spinner';
			btn.appendChild(spinner);
		} else {
			const iconEl = btn.createSpan({ cls: 'cloze-btn-icon' });
			const icon = getIcon(iconName);
			if (icon) iconEl.appendChild(icon);
		}

		btn.createSpan({ text: label, cls: 'cloze-btn-label' });

		if (disabled) {
			btn.disabled = true;
		} else {
			btn.addEventListener('click', (e) => {
				e.preventDefault();
				onClick();
			});
		}

		return btn;
	}

	private createIconButton(iconName: string, onClick: () => void): HTMLElement {
		const doc = this.toolbarEl?.ownerDocument ?? activeDocument;
		const btn = doc.createElement('button');
		btn.className = 'cloze-toolbar-btn cloze-btn-icon-only';

		const icon = getIcon(iconName);
		if (icon) btn.appendChild(icon);

		btn.addEventListener('click', (e) => {
			e.preventDefault();
			onClick();
		});

		return btn;
	}

	private hide(): void {
		if (this.toolbarEl) {
			this.toolbarEl.remove();
			this.toolbarEl = null;
		}
		if (this.containerEl) {
			this.containerEl.classList.remove('has-cloze-toolbar');
			this.containerEl = null;
		}
		this.leftGroup = null;
		this.centerGroup = null;
		this.statusEl = null;
	}

	destroy(): void {
		this.hide();
	}
}
