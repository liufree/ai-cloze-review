export interface ClozeMatch {
	fullMatch: string;
	id: string;
	answer: string;
	hint: string | null;
	start: number;
	end: number;
}

const CLOZE_REGEX = /\{\{c(\d+)::([\s\S]+?)\}\}/g;

export class ClozeParser {
	findAll(text: string): ClozeMatch[] {
		const matches: ClozeMatch[] = [];
		let match: RegExpExecArray | null;
		const regex = new RegExp(CLOZE_REGEX);

		while ((match = regex.exec(text)) !== null) {
			const content = match[2];
			const parts = content.split('::');
			const answer = parts[0].trim();
			const hint = parts.length > 1 ? parts.slice(1).join('::').trim() : null;

			matches.push({
				fullMatch: match[0],
				id: match[1],
				answer,
				hint,
				start: match.index,
				end: regex.lastIndex,
			});
		}

		return matches;
	}

	count(text: string): number {
		const matches = this.findAll(text);
		return matches.length;
	}

	stripClozes(text: string): string {
		return text.replace(CLOZE_REGEX, (_match, _id, content) => {
			const parts = content.split('::');
			return parts[0].trim();
		});
	}

	hasClozes(text: string): boolean {
		return CLOZE_REGEX.test(text);
	}
}
