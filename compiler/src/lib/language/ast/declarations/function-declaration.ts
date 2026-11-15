import type { checker, environment } from "@/lib/checker";
import { checker_error } from "@/lib/errors/checker";
import {
	type ast_node_data,
	ast_node_statement,
	type ast_type,
} from "../../ast";
import type { ast_block } from "../i-dont-know/block";
import type { ast_parameter } from "../i-dont-know/parameter";

export class ast_function_declaration extends ast_node_statement {
	readonly kind = "function_declaration";
	readonly name: string;
	readonly parameters: ast_parameter[];
	readonly return_type: ast_type;
	readonly body: ast_block;
	constructor(
		data: {
			name: string;
			parameters: ast_parameter[];
			return_type: ast_type;
			body: ast_block;
		} & ast_node_data,
	) {
		super(data);
		this.name = data.name;
		this.parameters = data.parameters;
		this.return_type = data.return_type;
		this.body = data.body;
		/*if (this.name === "main") {
			if (this.parameters.length !== 0) {
				throw new checker_error("main function cannot take parameters.", this.parameters[0].start, this.parameters[this.parameters.length - 1].end);
			}
		}*/
	}

	check_return() {
		let first_error: checker_error | undefined;
		for (const statement of this.body.statements) {
			try {
				if (statement.check_return(this.return_type) === true) {
					return false
				}
			} catch (error) {
				if (!(error instanceof checker_error)) throw error;
				else first_error ??= error;
			}
		}
		if (first_error) throw first_error;
		throw new checker_error(`This function must return a value of type "${this.return_type.show()}".`, this.body.start, this.body.end);
	}

	override check_statement(env: environment, checker: checker): void {
		env.functions.declare(this.name, this);
		for (const parameter of this.parameters) parameter.type.check_type(env, checker);
		this.return_type.check_type(env, checker);
		/*if (this.name === "main") {
			checker.type_checker.expect(new ast_primitive_type({ "name": "number", start: this.start, end: this.end }), this.return_type, env, this.return_type)
		}*/
		const function_env = env.child(this);
		function_env.refinements.clear();
		for (const parameter of this.parameters) function_env.variables.declare(parameter.name, parameter);
		this.check_return()

		/*if (!this.body.statements.some(statement => statement.kind === "return_statement") && !checker.type_checker.assignable(this.return_type, new ast_primitive_type({ "name": "void", start: this.start, end: this.end }), env)) {
			throw new checker_error(`This function must return a value of type"${this.return_type.show()}".`, this.body.start, this.body.end);
		}*/


		/*if (env.root && env.functions.lookup("main") === undefined) {
			throw new checker_error("main function is missing.", this.start, this.end);
		}*/
		checker.check_statements(this.body.statements, function_env);
		return;
	}
}
