import type { checker, environment } from "@/lib/checker";
import {
	type ast_expression,
	type ast_node_data,
	ast_node_statement,
} from "../../ast";

export class ast_expression_statement extends ast_node_statement {
	readonly kind = "expression_statement";
	readonly expression: ast_expression;
	constructor(data: { expression: ast_expression } & ast_node_data) {
		super(data);
		this.expression = data.expression;
	}

	override check_return(): boolean {
		return false
	}

	override check_statement(env: environment, checker: checker): void {
		checker.type_checker.resolve_expression_type(this.expression, env);
	}
}
