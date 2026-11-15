import { ast_node, type ast_node_data, type ast_statement } from "../../ast";

export class ast_program extends ast_node {
	readonly kind = "program";
	readonly body: ast_statement[];

	constructor(data: { body: ast_statement[] } & ast_node_data) {
		super(data);
		this.body = data.body;
	}
}
