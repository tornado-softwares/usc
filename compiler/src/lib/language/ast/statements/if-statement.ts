import type { checker, environment } from "@/lib/checker";
import { checker_error } from "@/lib/errors/checker";
import {
	type ast_expression,
	type ast_node_data,
	ast_node_statement,
	type ast_type,
} from "../../ast";
import type { ast_block } from "../i-dont-know/block";
import { ast_primitive_type } from "../types/primitive-type";

export class ast_if_statement extends ast_node_statement {
	readonly kind = "if_statement";
	readonly condition: ast_expression;
	readonly then_block: ast_block;
	readonly else_block: ast_block | undefined;
	constructor(
		data: {
			condition: ast_expression;
			then_block: ast_block;
			else_block: ast_block | undefined;
		} & ast_node_data,
	) {
		super(data);
		this.condition = data.condition;
		this.then_block = data.then_block;
		this.else_block = data.else_block;
	}

	override check_return(type: ast_type): boolean {
		if (!this.else_block) {
			return false;
		}

		const then_return = this.then_block.statements.some((statement) =>
			statement.check_return(type),
		);
		if (!this.else_block) {
			if (!then_return) {
				throw new checker_error(
					`You must return a value of type "${type.show()}" in this block.`,
					this.then_block.start,
					this.then_block.end,
				);
			}
			return then_return;
		} else {
			const else_return = this.else_block.statements.some((statement) =>
				statement.check_return(type),
			);
			if (!else_return) {
				throw new checker_error(
					`You must return a value of type "${type.show()}" in this block.`,
					this.else_block.start,
					this.else_block.end,
				);
			}
			return else_return;
		}
	}

	override check_statement(env: environment, checker: checker): void {
		const t = checker.type_checker.resolve_expression_type(this.condition, env);
		const boolean = new ast_primitive_type({
			name: "boolean",
			start: this.condition.start,
			end: this.condition.end,
		});
		checker.type_checker.expect(boolean, t, env, this.condition);

		const when_true = checker.narrow(this.condition, env, true);
		const when_false = checker.narrow(this.condition, env, false);

		const then_env = env.child();
		then_env.refine(when_true);
		checker.check_statements(this.then_block.statements, then_env);

		if (this.else_block) {
			const else_env = env.child();
			else_env.refine(when_false);
			checker.check_statements(this.else_block.statements, else_env);
		}

		const then_exits = checker.terminates(this.then_block.statements);
		const else_exits = this.else_block
			? checker.terminates(this.else_block.statements)
			: false;
		if (then_exits && !else_exits) env.refine(when_false);
		else if (else_exits && !then_exits) env.refine(when_true);
	}
}
