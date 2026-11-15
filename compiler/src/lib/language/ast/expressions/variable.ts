import type { environment } from "@/lib/checker";
import { checker_error } from "@/lib/errors/checker";
import {
	type ast_node_data,
	ast_node_expression,
	type ast_type,
} from "../../ast";

export class ast_variable extends ast_node_expression {
	public readonly kind = "variable";

	public readonly name;
	constructor(data: { name: string } & ast_node_data) {
		super(data);
		this.name = data.name;
	}

	override infer_type(env: environment): ast_type {
		const variable = env.variables.lookup(this.name);
		if (!variable) {
			throw new checker_error(
				`Unknown variable named "${this.name}"`,
				this.start,
				this.end,
			);
		}
		return env.type_of(variable);
	}
}
