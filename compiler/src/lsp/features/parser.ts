import type { SemanticTokensBuilder } from "vscode-languageserver";
import type { TextDocument } from "vscode-languageserver-textdocument";
import { checker } from "@/lib/checker";
import { checker_error } from "@/lib/errors/checker";
import { lexer_error } from "@/lib/errors/lexer";
import type { ast_node } from "@/lib/language/ast";
import { lexer } from "@/lib/lexer";
import { parser } from "@/lib/parser";
import * as ast_program from "@/specification/ast";
import { program } from "@/specification/grammar";
import type { cst } from "@/types/cst";

const language_lexer = new lexer(program);
const language_parser = new parser(Object.values(ast_program));
const language_checker = new checker();

type parse_error = {
	message: string;
	start: number;
	end: number;
};

type parsed = {
	tree?: cst[];
	ast?: ast_node[];
	error?: parse_error;
};

export const cache = new Map<string, { version: number; result: parsed }>();

function to_parse_error(error: unknown): parse_error {
	const message = error instanceof Error ? error.message : String(error);
	if (error instanceof checker_error || error instanceof lexer_error) {
		return { message, start: error.start, end: error.end };
	}
	return { message, start: 0, end: 0 };
}

export function parse(doc: TextDocument): parsed {
	const cached = cache.get(doc.uri);
	if (cached && cached.version === doc.version) return cached.result;

	let tree: cst[] | undefined;
	let ast: ast_node[] | undefined;
	let result: parsed;

	try {
		tree = language_lexer.tokenize(doc.getText());
		ast = language_parser.parse(tree);
		language_checker.check(ast);
		result = { tree, ast };
	} catch (error) {
		result = { tree, ast, error: to_parse_error(error) };
	}

	cache.set(doc.uri, { version: doc.version, result });
	return result;
}

export function* leaves(
	nodes: cst[],
): Generator<Extract<cst, { kind: "token" }>> {
	for (const node of nodes) {
		if (node.kind === "token") yield node;
		else yield* leaves(node.children);
	}
}

export function push_token(builder: SemanticTokensBuilder, doc: TextDocument, start: number, end: number, type: number,): void {
	const from = doc.positionAt(start);
	const to = doc.positionAt(end);
	const length = to.character - from.character;
	if (length > 0) {
		builder.push(from.line, from.character, length, type, 0);
	}
}
