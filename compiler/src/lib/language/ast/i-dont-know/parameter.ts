import { ast_node, type ast_node_data, type ast_type } from "../../ast";

export class ast_parameter extends ast_node {
	readonly kind = "parameter";
	readonly name: string;
	readonly type: ast_type;
	constructor(data: { name: string; type: ast_type } & ast_node_data) {
		super(data);
		this.name = data.name;
		this.type = data.type;
	}
}
