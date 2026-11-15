import type { checker, environment } from "@/lib/checker";
import { checker_error } from "@/lib/errors/checker";
import {
	type ast_node_data,
	ast_node_statement,
	type ast_type,
} from "../../ast";
import type { ast_parameter } from "../i-dont-know/parameter";

export class ast_extern_declaration extends ast_node_statement {
	readonly kind = "extern_declaration";
	readonly name: string;
	readonly parameters: ast_parameter[];
	readonly return_type: ast_type;
	constructor(
		data: {
			name: string;
			parameters: ast_parameter[];
			return_type: ast_type;
		} & ast_node_data,
	) {
		super(data);
		this.name = data.name;
		this.parameters = data.parameters;
		this.return_type = data.return_type;
	}

	override check_return(): boolean {
		return false
	}

	private extern_type(type: ast_type, env: environment, allow_union: boolean, checker: checker,) {
		type.check_type(env, checker);
		const members = checker.type_checker.normalize(type, env);
		if (!allow_union && members.length > 1) {
			throw new checker_error("extern return type cannot be a union", type.start, type.end,);
		}
		for (const m of members) {
			if (m.kind !== "primitive_type") {
				throw new checker_error(`extern functions only accept primitive types, got "${m.show()}"`, type.start, type.end,);
			}
		}
	}

	override check_statement(env: environment, checker: checker): void {
		env.functions.declare(this.name, this);
		for (const parameter of this.parameters) this.extern_type(parameter.type, env, true, checker);
		this.extern_type(this.return_type, env, false, checker);
	}
}
