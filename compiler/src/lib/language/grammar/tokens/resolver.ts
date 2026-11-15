import type { lsp_semantic } from "@/lsp/semantic"

export abstract class resolver {
	public readonly semantic
	constructor(lsp_token_type?: lsp_semantic) {
		this.semantic = lsp_token_type
	}
	abstract match(source: string, position: number): string | null
}
