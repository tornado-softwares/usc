import {
	type ast_node_data,
	ast_node_statement,
	type ast_type,
} from "../../ast";

export class ast_type_declaration extends ast_node_statement {
	readonly kind = "type_declaration";
	readonly name: string;
	readonly type: ast_type;
	constructor(data: { name: string; type: ast_type } & ast_node_data) {
		super(data);
		this.name = data.name;
		this.type = data.type;
	}
	override check_statement(): void {

	}
	override check_return(): boolean {
		return false
	}
}
