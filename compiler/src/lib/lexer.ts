import type { grammar } from "@/lib/language/grammar";
import type { lsp_semantic } from "@/lsp/semantic";
import type { cst, match } from "@/types/cst";
import { lexer_error } from "./errors/lexer";

export class lexer_context { }

export class lexer {
	private furthest = 0;

	readonly max_results = 256;
	readonly max_depth = 1024;

	constructor(private readonly grammar: grammar) { }

	tokenize(source: string): match["tokens"] {
		this.furthest = 0;

		const matches = this.match(this.grammar, source, 0, 0);

		const valid = matches
			.filter((result) => {
				const end = this.skip_whitespace(source, result.end);
				return end === source.length;
			})
			.sort((a, b) => b.end - a.end);

		if (valid.length === 0) {
			throw new lexer_error(
				`Unable to tokenize the input at position ${this.furthest}.`,
				this.furthest,
				this.furthest,
				source,
			);
		}

		return (valid[0] as match).tokens;
	}

	match(
		node: grammar,
		source: string,
		position: number,
		depth: number,
	): match[] {
		this.furthest = Math.max(this.furthest, position);
		if (depth > this.max_depth) {
			throw new lexer_error(
				"Maximum grammar recursion depth exceeded.",
				position,
				position,
				source,
			);
		}
		return node.match(source, position, depth, this);
	}

	skip_whitespace(source: string, position: number): number {
		while (position < source.length && /\s/.test(source[position] as string))
			position++;
		return position;
	}

	limit(results: match[]): match[] {
		return results.sort((a, b) => b.end - a.end).slice(0, this.max_results);
	}

	override_semantic(node: cst, semantic?: lsp_semantic): cst {
		if (semantic === undefined) return node;

		if (node.kind === "token") {
			return { ...node, semantic };
		}

		return {
			...node,
			children: node.children.map((child) =>
				this.override_semantic(child, semantic),
			),
		};
	}
}
