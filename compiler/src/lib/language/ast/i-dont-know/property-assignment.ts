import { type ast_expression, ast_node, type ast_node_data } from "../../ast";

export class ast_property_assignment extends ast_node {
	readonly kind = "property_assignment";
	readonly name: string;
	readonly value: ast_expression;
	constructor(data: { name: string; value: ast_expression } & ast_node_data) {
		super(data);
		this.name = data.name;
		this.value = data.value;
	}
}
