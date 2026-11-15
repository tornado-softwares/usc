import type { lsp_semantic } from "@/lsp/semantic";

export type token_node = {
	kind: "token";
	name: string;
	value: string;
	start: number;
	end: number;
	semantic?: lsp_semantic;
}

export type group_node = {
	kind: "group";
	name: string;
	children: cst[];
	start: number;
	end: number;
}

export type cst = token_node | group_node

///////////////////////////////////////////////////////////////////////////////////////////////////

export type match = {
	end: number;
	tokens: cst[];
}

export interface typed_token<n extends string, v extends string = string> {
	kind: "token";
	name: n;
	value: v;
	start: number;
	end: number;
	semantic?: lsp_semantic;
}

export interface typed_group<n extends string, element> {
	kind: "group";
	name: n;
	children: tokens_of<element>;
	start: number;
	end: number;
}

type item<t> = t extends readonly (infer i)[] ? i : never

type concat<a, b> =
	a extends readonly unknown[]
	? b extends readonly unknown[]
	? [...a, ...b]
	: never
	: never

type sequence_tokens<e extends readonly unknown[]> =
	e extends readonly []
	? []
	: e extends readonly [infer h, ...infer t]
	? concat<tokens_of<h>, sequence_tokens<t>>
	: cst[]

export type tokens_of<g> =
	g extends { kind: "token"; name: infer n extends string }
	? [typed_token<n, g extends { __value: infer v extends string } ? v : string>]


	: g extends { kind: "rule"; name: infer n extends string; element: infer e }
	? [typed_group<n, e>]

	: g extends { kind: "sequence"; elements: infer e extends readonly unknown[] }
	? sequence_tokens<e>

	: g extends { kind: "one_of"; elements: infer e extends readonly unknown[] }
	? tokens_of<e[number]>

	: g extends { kind: "optional"; element: infer e }
	? tokens_of<e> | []

	: g extends { kind: "highlight"; element: infer e }
	? tokens_of<e>

	: g extends { kind: "repeated"; element: infer e; separator?: infer s }
	? [NonNullable<s>] extends [never]
	? item<tokens_of<e>>[]
	: [] | [item<tokens_of<e>>, ...(item<tokens_of<e>> | item<tokens_of<NonNullable<s>>>)[]]

	: g extends { kind: "reference"; get: () => infer inner }
	? tokens_of<inner>

	: cst[]

export type cst_of<g> = item<tokens_of<g>>
