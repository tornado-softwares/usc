import { ast_node, type ast_node_data, type ast_statement } from "../../ast";

export class ast_block extends ast_node {
	readonly kind = "block";
	readonly statements: ast_statement[];
	constructor(data: { statements: ast_statement[] } & ast_node_data) {
		super(data);
		this.statements = data.statements;
	}
}
