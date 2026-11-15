import { ast_node_acyclic_type, type ast_node_data } from "../../ast";

export class ast_primitive_type extends ast_node_acyclic_type {
	readonly kind = "primitive_type";
	readonly name: "string" | "number" | "boolean" | "void";
	constructor(data: { name: "string" | "number" | "boolean" | "void" } & ast_node_data) {
		super(data);
		this.name = data.name;
	}
	override check_acyclicity(): void { }

	override check_type(): void { }

	override show(): string {
		return this.name;
	}
}
