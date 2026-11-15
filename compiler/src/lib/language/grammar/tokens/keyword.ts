import type { lsp_semantic } from "@/lsp/semantic";
import { resolver } from "./resolver";

export class keyword<const k extends string = string> extends resolver {
	constructor(public keyword: k, lsp_token_type?: lsp_semantic) {
		super(lsp_token_type)
		if (keyword.length === 1) {
			throw Error("A keyword token of length 1 should be a char token.")
		}
		if (keyword.length < 1) {
			throw Error("The keyword is too small.")
		}
	}

	match(source: string, position: number): string | null {
		const word = this.keyword;
		const next = source[position + word.length] ?? "";
		if (source.startsWith(word, position) && !/[\w$]/.test(next)) {
			return word;
		}
		return null
	}
}
