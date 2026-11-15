import { ast_node_acyclic_type, type ast_node_data } from "../../ast";

export class ast_literal_type extends ast_node_acyclic_type {
	readonly kind = "literal_type";
	readonly value: string | number | boolean;
	constructor(data: { value: string | number | boolean } & ast_node_data) {
		super(data);
		this.value = data.value;
	}

	override check_acyclicity(): void {
		return;
	}

	override check_type(): void {
		return;
	}

	override show(): string {
		return JSON.stringify(this.value);
	}
}
