import type { lsp_semantic } from "@/lsp/semantic";
import { resolver } from "./resolver";

export class regex extends resolver {
	constructor(public pattern: string, lsp_token_type?: lsp_semantic) {
		super(lsp_token_type)
	}

	match(source: string, position: number): string | null {
		const expression = new RegExp(`^(?:${this.pattern})`);
		const result = expression.exec(source.slice(position));
		if (result && result[0].length > 0) {
			return result[0];
		}
		return null
	}

}
