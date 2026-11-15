export class lexer_error extends Error {
	constructor(
		message: string,
		public readonly start: number,
		public readonly end: number,
		public readonly source: string,
		public readonly filename?: string,
		public readonly expected: string[] = [],
	) {
		super(message);
		this.name = "lexer_error";
	}
}
