import type { environment, type_checker } from "@/lib/checker";
import { checker_error } from "@/lib/errors/checker";
import {
	type ast_expression,
	type ast_node_data,
	ast_node_expression,
	type ast_type,
} from "../../ast";
import type { ast_parameter } from "../i-dont-know/parameter";

export class ast_function_call extends ast_node_expression {
	readonly kind = "function_call";
	readonly called_function: string;
	readonly args: ast_expression[];
	constructor(
		data: { called_function: string; args: ast_expression[] } & ast_node_data,
	) {
		super(data);
		this.called_function = data.called_function;
		this.args = data.args;
	}

	override infer_type(env: environment, checker: type_checker): ast_type {
		const _function = env.functions.lookup(this.called_function);
		if (!_function) {
			throw new checker_error(
				`Unknown function named "${this.called_function}"`,
				this.start,
				this.end,
			);
		}
		if (this.args.length !== _function.parameters.length) {
			throw new checker_error(
				`"${this.called_function}" expects ${_function.parameters.length} argument(s), got ${this.args.length}`,
				this.start,
				this.end,
			);
		}
		this.args.forEach((a, i) => {
			const param = _function.parameters[i] as ast_parameter;
			checker.expect(param.type, checker.resolve_expression_type(a, env), env, a);
		});
		return _function.return_type;
	}
}
