export class checker_error extends Error {
	constructor(
		message: string,
		public readonly start: number,
		public readonly end: number,
	) {
		super(message);
		this.name = "checker_error";
	}
}
