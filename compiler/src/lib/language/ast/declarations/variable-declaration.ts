import type { checker, environment } from "@/lib/checker";
import {
	type ast_expression,
	type ast_node_data,
	ast_node_statement,
	type ast_type,
} from "../../ast";

export abstract class ast_variable_declaration extends ast_node_statement {
	public readonly name;
	readonly value: ast_expression;
	readonly type: ast_type;
	constructor(
		data: {
			name: string;
			type: ast_type;
			value: ast_expression;
		} & ast_node_data,
	) {
		super(data);
		this.name = data.name;
		this.type = data.type;
		this.value = data.value;
	}

	override check_statement(env: environment, checker: checker): void {
		this.type.check_type(env, checker);
		const actual = checker.type_checker.resolve_expression_type(
			this.value,
			env,
		);
		checker.type_checker.expect(this.type, actual, env, this.value);
		env.variables.declare(this.name, this);
	}

	override check_return(): boolean {
		return false
	}
}

export class ast_mutable_variable_declaration extends ast_variable_declaration {
	public readonly kind = "mutable_variable_declaration";

	constructor(
		data: {
			name: string;
			type: ast_type;
			value: ast_expression;
		} & ast_node_data,
	) {
		super(data);
	}

}

export class ast_immutable_variable_declaration extends ast_variable_declaration {
	public readonly kind = "immutable_variable_declaration";

	constructor(
		data: {
			name: string;
			type: ast_type;
			value: ast_expression;
		} & ast_node_data,
	) {
		super(data);
	}
}
