import type { checker, environment } from "@/lib/checker";
import { checker_error } from "@/lib/errors/checker";
import {
	type ast_expression,
	type ast_node_data,
	ast_node_statement,
} from "../../ast";
import { ast_primitive_type } from "../types/primitive-type";

export class ast_return_statement extends ast_node_statement {
	readonly kind = "return_statement";
	readonly value: ast_expression | undefined;
	constructor(data: { value: ast_expression | undefined } & ast_node_data) {
		super(data);
		this.value = data.value;
	}

	override check_return(): boolean {
		return true
	}

	override check_statement(env: environment, checker: checker): void {
		const _function = env.current_function;
		if (!_function) {
			throw new checker_error(
				"Return outside of a function",
				this.start,
				this.end,
			);
		}
		if (this.value) {
			const actual = checker.type_checker.resolve_expression_type(this.value, env);
			checker.type_checker.expect(_function.return_type, actual, env, this.value);
		} else {
			const none = new ast_primitive_type({
				name: "void",
				start: this.start,
				end: this.end,
			});
			checker.type_checker.expect(_function.return_type, none, env, this);
		}
	}
}
