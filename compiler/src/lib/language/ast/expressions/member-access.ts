import type { environment, type_checker } from "@/lib/checker";
import { checker_error } from "@/lib/errors/checker";
import {
	type ast_node_data,
	ast_node_expression,
	type ast_type,
} from "../../ast";

export class ast_member_access extends ast_node_expression {
	readonly kind = "member_access";
	readonly path: string[];
	constructor(data: { path: string[] } & ast_node_data) {
		super(data);
		this.path = data.path;
	}

	override infer_type(env: environment, checker: type_checker): ast_type {
		const [root, ...rest] = this.path as [string, ...string[]];
		const root_variable = env.variables.lookup(root);
		if (!root_variable) {
			throw new checker_error(
				`Unknown variable named "${root}"`,
				this.start,
				this.end,
			);
		}
		checker.roots.set(this, env.type_of(root_variable));
		let root_variable_type = checker.resolve_type(env.type_of(root_variable), env);
		for (const segment of rest) {
			if (checker.normalize(root_variable_type, env).some((member) => member.kind !== "object_type")) {
				throw new checker_error(
					`Cannot read "${segment}" of type "${root_variable_type.show()}"`,
					this.start,
					this.end,
				);
			}
			const next = checker.property(root_variable_type, segment, env);
			if (!next) {
				throw new checker_error(
					`Property "${segment}" does not exist on type "${root_variable_type.show()}"`,
					this.start,
					this.end,
				);
			}
			root_variable_type = checker.resolve_type(next, env);
		}
		return root_variable_type;
	}
}
