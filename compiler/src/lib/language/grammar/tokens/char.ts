import type { lsp_semantic } from "@/lsp/semantic";
import { resolver } from "./resolver";

export class char extends resolver {
	constructor(
		public char: string,
		lsp_token_type?: lsp_semantic,
	) {
		super(lsp_token_type);
		if (char.length !== 1) {
			throw Error("a char token should be 1 letter.");
		}
	}

	match(source: string, position: number): string | null {
		if (source.startsWith(this.char, position)) {
			return this.char;
		}
		return null;
	}
}
