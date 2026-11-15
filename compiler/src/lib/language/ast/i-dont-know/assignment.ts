import type { checker, environment } from "@/lib/checker";
import { checker_error } from "@/lib/errors/checker";
import {
	type ast_expression,
	type ast_node_data,
	ast_node_statement,
} from "../../ast";
import type { ast_member_access } from "../expressions/member-access";
import type { ast_variable } from "../expressions/variable";

export class ast_assignment extends ast_node_statement {
	readonly kind = "assignment";
	readonly target: ast_member_access | ast_variable;
	readonly value: ast_expression;
	constructor(
		data: {
			target: ast_member_access | ast_variable;
			value: ast_expression;
		} & ast_node_data,
	) {
		super(data);
		this.target = data.target;
		this.value = data.value;
	}

	override check_return(): boolean {
		return false
	}

	override check_statement(env: environment, checker: checker): void {
		const root = this.target.kind === "variable" ? this.target.name : this.target.path[0];
		const root_variable = env.variables.lookup(root);
		if (root_variable?.kind === "immutable_variable_declaration") {
			throw new checker_error(
				`Cannot assign to constant "${root}"`,
				this.target.start,
				this.target.end,
			);
		}
		const target = this.target.kind === "variable" && root_variable
			? root_variable.type
			: checker.type_checker.resolve_expression_type(this.target, env);
		const value = checker.type_checker.resolve_expression_type(this.value, env);
		checker.type_checker.expect(target, value, env, this.value);
		if (root_variable) env.refinements.delete(root_variable);
	}
}
