import type { lexer } from "@/lib/lexer";
import type { lsp_semantic } from "@/lsp/semantic";
import type { match } from "@/types/cst";
import type { char } from "./grammar/tokens/char";
import type { keyword } from "./grammar/tokens/keyword";
import type { regex } from "./grammar/tokens/regex";

export abstract class grammar {
	semantic?: lsp_semantic;

	abstract match(
		source: string,
		position: number,
		depth: number,
		lexer: lexer,
	): match[];
}

export class reference<const g extends grammar> extends grammar {
	declare readonly kind: "reference";

	constructor(public readonly get: () => g) {
		super();
	}

	resolve(): grammar {
		return this.get();
	}

	override match(
		source: string,
		position: number,
		depth: number,
		lexer: lexer,
	): match[] {
		return lexer.match(this.resolve(), source, position, depth + 1);
	}
}

export class token<
	const name extends string,
	const v extends string = string,
> extends grammar {
	declare readonly kind: "token";

	declare readonly __value: v;
	constructor(
		public readonly name: name,
		public readonly resolver: char | keyword<v> | regex,
	) {
		super();
		this.semantic = resolver.semantic;
	}

	match(
		source: string,
		position: number,
		_depth: number,
		lexer: lexer,
	): match[] {
		position = lexer.skip_whitespace(source, position);
		const value = this.resolver.match(source, position);
		if (value === null) {
			return [];
		}
		return [
			{
				end: position + value.length,
				tokens: [
					{
						kind: "token",
						name: this.name,
						value,
						start: position,
						end: position + value.length,
						semantic: this.semantic,
					},
				],
			},
		];
	}
}

export class sequence<const e extends grammar[]> extends grammar {
	declare readonly kind: "sequence";
	constructor(public readonly elements: e) {
		super();
	}

	match(
		source: string,
		position: number,
		depth: number,
		lexer: lexer,
	): match[] {
		let results: match[] = [
			{
				end: position,
				tokens: [],
			},
		];

		for (const element of this.elements) {
			const next: match[] = [];
			for (const current of results) {
				const matches = lexer.match(element, source, current.end, depth + 1);

				for (const result of matches) {
					next.push({
						end: result.end,
						tokens: [...current.tokens, ...result.tokens],
					});
				}
			}

			results = lexer.limit(next);

			if (results.length === 0) {
				return [];
			}
		}

		return results;
	}
}

export class one_of<const e extends grammar[]> extends grammar {
	declare readonly kind: "one_of";
	constructor(public readonly elements: e) {
		super();
	}

	match(
		source: string,
		position: number,
		depth: number,
		lexer: lexer,
	): match[] {
		const results: match[] = [];
		for (const element of this.elements) {
			results.push(...lexer.match(element, source, position, depth + 1));
		}
		return lexer.limit(results);
	}
}

export class repeated<
	const e extends grammar,
	const s extends grammar = never,
> extends grammar {
	declare readonly kind: "repeated";
	constructor(
		public readonly element: e,
		public readonly separator?: s,
	) {
		super();
	}

	match(
		source: string,
		position: number,
		depth: number,
		lexer: lexer,
	): match[] {
		const results: match[] = [];
		const walk = (current_position: number, tokens: match["tokens"]): void => {
			results.push({ end: current_position, tokens });
			if (results.length >= lexer.max_results) {
				return;
			}
			let next_position = current_position;
			let separator_tokens: match["tokens"] = [];
			if (this.separator) {
				const separators = lexer.match(this.separator, source, current_position, depth + 1,);
				const separator = separators.find(
					(result) => result.end > current_position,
				);
				if (!separator) {
					return;
				}
				next_position = separator.end;
				separator_tokens = separator.tokens;
			}
			const elements = lexer.match(this.element, source, next_position, depth + 1,);
			for (const element of elements) {
				if (element.end <= current_position) {
					continue;
				}
				walk(element.end, [...tokens, ...separator_tokens, ...element.tokens]);
			}
		};
		walk(position, []);
		return lexer.limit(results);
	}
}

export class optional<const g extends grammar> extends grammar {
	declare readonly kind: "optional";
	constructor(public readonly element: g) {
		super();
	}

	override match(
		source: string,
		position: number,
		depth: number,
		lexer: lexer,
	): match[] {
		const results = lexer.match(this.element, source, position, depth + 1);
		return lexer.limit([
			...results,
			{
				end: position,
				tokens: [],
			},
		]);
	}
}

export class rule<
	const n extends string,
	const g extends grammar,
> extends grammar {
	declare readonly kind: "rule";
	constructor(
		public readonly name: n,
		public readonly element: g,
		semantic?: lsp_semantic,
	) {
		super();
		this.semantic = semantic;
	}

	match(
		source: string,
		position: number,
		depth: number,
		lexer: lexer,
	): match[] {
		return lexer
			.match(this.element, source, position, depth + 1)
			.map((result) => {
				const start = result.tokens[0]?.start ?? position;
				const end = result.tokens[result.tokens.length - 1]?.end ?? position;
				return {
					end: result.end,
					tokens: [
						{
							kind: "group",
							name: this.name,
							children: result.tokens.map((cst) =>
								lexer.override_semantic(cst, this.semantic),
							),
							start,
							end,
						},
					],
				};
			});
	}
}

export class highlight<const g extends grammar> extends grammar {
	declare readonly kind: "highlight";

	constructor(
		public readonly element: g,
		semantic: lsp_semantic,
	) {
		super();
		this.semantic = semantic;
	}

	override match(
		source: string,
		position: number,
		depth: number,
		lexer: lexer,
	): match[] {
		return lexer
			.match(this.element, source, position, depth + 1)
			.map((result) => ({
				end: result.end,
				tokens: result.tokens.map((cst) =>
					lexer.override_semantic(cst, this.semantic),
				),
			}));
	}
}
