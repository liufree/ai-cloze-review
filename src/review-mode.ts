import { App, MarkdownView, Notice, MarkdownRenderer } from 'obsidian';
import type ClozeReviewPlugin from '../main';

const CLOZE_REGEX = /\{\{c(\d+)::([\s\S]+?)\}\}/g;

export class ReviewMode {
	private app: App;
	private plugin: ClozeReviewPlugin;
	private active = false;

	constructor(app: App, plugin: ClozeReviewPlugin) {
		this.app = app;
		this.plugin = plugin;
	}

	private getMarkdownView(): MarkdownView | null {
		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (activeView) return activeView;
		const leaves = this.app.workspace.getLeavesOfType('markdown');
		if (leaves.length > 0) return leaves[0].view as MarkdownView;
		return null;
	}

	isActive(): boolean {
		return this.active;
	}

	async activate(silent = false): Promise<void> {
		this.active = true;
		const view = this.getMarkdownView();
		if (!view || !view.file) {
			if (!silent) new Notice(this.plugin.t.openNoteFirst);
			this.active = false;
			return;
		}

		const clozeContent = this.plugin.clozeCache.get(view.file.path);
		if (!clozeContent) {
			if (!silent) new Notice(this.plugin.t.generateFirst);
			this.active = false;
			return;
		}

		if (view.getMode() !== 'preview') {
			await view.setState({ mode: 'preview' }, {});
			await new Promise((r) => window.setTimeout(r, 500));
		}

		await this.showClozeOverlay(view, clozeContent);
		this.applyReviewClass(view);
		if (!silent) new Notice(this.plugin.t.reviewOn);
	}

	private async showClozeOverlay(view: MarkdownView, content: string): Promise<void> {
		const previewEl = view.containerEl.querySelector('.markdown-preview-view') as HTMLElement;
		if (!previewEl) return;

		const originalSizer = previewEl.querySelector('.markdown-preview-sizer:not(.cloze-overlay)') as HTMLElement;

		const frontmatter = (originalSizer?.querySelector('.metadata-container, .frontmatter-container') || previewEl.querySelector(':scope > .metadata-container, :scope > .frontmatter-container')) as HTMLElement;
		const inlineTitle = (originalSizer?.querySelector('.inline-title') || previewEl.querySelector(':scope > .inline-title')) as HTMLElement;

		if (originalSizer) {
			originalSizer.setCssProps({ display: 'none' });
		}

		let overlay = previewEl.querySelector('.cloze-overlay') as HTMLElement;
		if (!overlay) {
			overlay = previewEl.ownerDocument.createElement('div');
			overlay.className = 'markdown-preview-sizer markdown-preview-section cloze-overlay';
			previewEl.appendChild(overlay);
		}
		overlay.innerHTML = '';

		const pusher = previewEl.ownerDocument.createElement('div');
		pusher.className = 'markdown-preview-pusher';
		overlay.appendChild(pusher);

		if (inlineTitle) {
			overlay.appendChild(inlineTitle.cloneNode(true));
		}

		if (frontmatter) {
			overlay.appendChild(frontmatter.cloneNode(true));
		}

		const contentDiv = previewEl.ownerDocument.createElement('div');
		overlay.appendChild(contentDiv);

		await MarkdownRenderer.render(
			this.plugin.app,
			content,
			contentDiv,
			view.file!.path,
			this.plugin
		);
	}

	private hideClozeOverlay(view: MarkdownView): void {
		const previewEl = view.containerEl.querySelector('.markdown-preview-view') as HTMLElement;
		if (!previewEl) return;

		const overlay = previewEl.querySelector('.cloze-overlay');
		if (overlay) overlay.remove();

		const originalSizer = previewEl.querySelector('.markdown-preview-sizer:not(.cloze-overlay)') as HTMLElement;
		if (originalSizer) {
			originalSizer.setCssProps({ display: '' });
		}
	}

	deactivate(silent = false): void {
		this.active = false;
		const view = this.getMarkdownView();
		if (view) {
			this.hideClozeOverlay(view);
			this.removeReviewClass(view);
		}
		if (!silent) new Notice(this.plugin.t.reviewOff);
	}

	private applyReviewClass(view: MarkdownView | null): void {
		if (!view) return;
		const previewEl = view.containerEl.querySelector('.markdown-preview-view');
		if (previewEl) {
			previewEl.classList.add('cloze-review-active');
			this.resetAll();
		}
	}

	private removeReviewClass(view: MarkdownView | null): void {
		if (!view) return;
		const previewEl = view.containerEl.querySelector('.markdown-preview-view');
		if (previewEl) {
			previewEl.classList.remove('cloze-review-active');
			previewEl.querySelectorAll('.cloze-blank').forEach((el) => {
				el.classList.remove('cloze-revealed');
			});
		}
	}

	revealAll(): void {
		if (!this.active) {
			new Notice(this.plugin.t.activateFirst);
			return;
		}
		const view = this.getMarkdownView();
		if (!view) return;
		view.containerEl.querySelectorAll('.cloze-blank').forEach((el) => {
			el.classList.add('cloze-revealed');
		});
	}

	resetAll(): void {
		const view = this.getMarkdownView();
		if (!view) return;
		view.containerEl.querySelectorAll('.cloze-blank').forEach((el) => {
			el.classList.remove('cloze-revealed');
		});
	}

	getStats(): { total: number; revealed: number } {
		const view = this.getMarkdownView();
		if (!view) return { total: 0, revealed: 0 };
		const overlay = view.containerEl.querySelector('.cloze-overlay');
		if (!overlay) return { total: 0, revealed: 0 };
		const blanks = overlay.querySelectorAll('.cloze-blank');
		const revealed = overlay.querySelectorAll('.cloze-blank.cloze-revealed');
		return { total: blanks.length, revealed: revealed.length };
	}

	hasClozes(): boolean {
		const view = this.getMarkdownView();
		if (!view) return false;
		return view.containerEl.querySelectorAll('.cloze-blank').length > 0;
	}

	hasCachedClozes(): boolean {
		const view = this.getMarkdownView();
		if (!view || !view.file) return false;
		return this.plugin.clozeCache.has(view.file.path);
	}

	processElement(el: HTMLElement): void {
		if (!this.active) return;
		if (!el.closest('.cloze-overlay')) return;

		const walker = el.ownerDocument.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
			acceptNode(node: Text): number {
				const parent = node.parentElement;
				if (!parent) return NodeFilter.FILTER_REJECT;
				if (parent.closest('code, pre, .cloze-blank, .cloze-answer, .cloze-placeholder')) {
					return NodeFilter.FILTER_REJECT;
				}
				if (!node.textContent || !node.textContent.includes('{{c')) {
					return NodeFilter.FILTER_REJECT;
				}
				return NodeFilter.FILTER_ACCEPT;
			},
		});

		const textNodes: Text[] = [];
		let node: Node | null;
		while ((node = walker.nextNode())) {
			textNodes.push(node as Text);
		}

		for (const textNode of textNodes) {
			this.processTextNode(textNode);
		}
	}

	private processTextNode(textNode: Text): void {
		const text = textNode.textContent;
		if (!text) return;

		const regex = new RegExp(CLOZE_REGEX);
		let lastIndex = 0;
		let match: RegExpExecArray | null;
		const fragments: Node[] = [];
		let hasMatch = false;

		while ((match = regex.exec(text)) !== null) {
			hasMatch = true;
			if (match.index > lastIndex) {
				fragments.push(textNode.ownerDocument.createTextNode(text.slice(lastIndex, match.index)));
			}

			const content = match[2];
			const parts = content.split('::');
			const answer = parts[0].trim();
			const hint = parts.length > 1 ? parts.slice(1).join('::').trim() : null;

			const clozeEl = this.createClozeElement(answer, hint, textNode.ownerDocument);
			fragments.push(clozeEl);
			lastIndex = regex.lastIndex;
		}

		if (hasMatch) {
			if (lastIndex < text.length) {
				fragments.push(textNode.ownerDocument.createTextNode(text.slice(lastIndex)));
			}
			const parent = textNode.parentElement;
			if (!parent) return;
			for (const frag of fragments) {
				parent.insertBefore(frag, textNode);
			}
			parent.removeChild(textNode);
		}
	}

	private createClozeElement(answer: string, hint: string | null, doc: Document): HTMLElement {
		const el = doc.createElement('span');
		el.className = 'cloze-blank';

		const answerSpan = doc.createElement('span');
		answerSpan.className = 'cloze-answer';
		answerSpan.textContent = answer;
		el.appendChild(answerSpan);

		const placeholderSpan = doc.createElement('span');
		placeholderSpan.className = 'cloze-placeholder';
		placeholderSpan.textContent = hint ? `[${hint}]` : this.plugin.t.placeholder;
		el.appendChild(placeholderSpan);

		el.addEventListener('click', (e) => {
			e.preventDefault();
			e.stopPropagation();
			if (this.active) {
				el.classList.toggle('cloze-revealed');
				this.plugin.toolbar.refresh();
			}
		});

		return el;
	}

	destroy(): void {
		this.active = false;
		const view = this.getMarkdownView();
		if (view) {
			this.hideClozeOverlay(view);
			this.removeReviewClass(view);
		}
		activeDocument.querySelectorAll('.cloze-review-active').forEach((el) => {
			el.classList.remove('cloze-review-active');
		});
	}
}
