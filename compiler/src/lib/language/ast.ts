import type { cst_of } from "@/types/cst";
import type { checker, environment, type_checker } from "../checker";
import type { parser } from "../parser";
import type { ast_extern_declaration } from "./ast/declarations/extern-declaration";
import type { ast_function_declaration } from "./ast/declarations/function-declaration";
import type { ast_type_declaration } from "./ast/declarations/type-declaration";
import type {
	ast_immutable_variable_declaration,
	ast_mutable_variable_declaration,
	ast_variable_declaration,
} from "./ast/declarations/variable-declaration";
import type { ast_binary_expression } from "./ast/expressions/binary-expression";
import type { ast_function_call } from "./ast/expressions/function-call";
import type { ast_boolean_literal } from "./ast/expressions/literals/boolean-literal";
import type { ast_number_literal } from "./ast/expressions/literals/number-literal";
import type { ast_object_literal } from "./ast/expressions/literals/object-literal";
import type { ast_string_literal } from "./ast/expressions/literals/string-literal";
import type { ast_member_access } from "./ast/expressions/member-access";
import type { ast_variable } from "./ast/expressions/variable";
import type { ast_assignment } from "./ast/i-dont-know/assignment";
import type { ast_parameter } from "./ast/i-dont-know/parameter";
import type { ast_expression_statement } from "./ast/statements/expression-statement";
import type { ast_if_statement } from "./ast/statements/if-statement";
import type { ast_return_statement } from "./ast/statements/return-statement";
import type { ast_literal_type } from "./ast/types/literal-type";
import type { ast_named_type } from "./ast/types/named-type";
import type { ast_object_type } from "./ast/types/object-type";
import type { ast_primitive_type } from "./ast/types/primitive-type";
import type { ast_union_type } from "./ast/types/union-type";
import type { grammar, rule } from "./grammar";

export class rule_ast<const n extends string, const g extends grammar, const result extends ast_node,> {
	public readonly rule: rule<n, g>;
	public readonly name: n;
	public readonly build: (cst: cst_of<rule<n, g>>, parser: parser) => result;

	constructor(data: {
		rule: rule<n, g>;
		build: (cst: cst_of<rule<n, g>>, parser: parser) => result;
	}) {
		this.rule = data.rule;
		this.name = data.rule.name;
		this.build = data.build;
	}
}

export type ast_node_data = { start: number; end: number };

export abstract class ast_node {
	abstract readonly kind: string;
	readonly start: number;
	readonly end: number;
	constructor(data: ast_node_data) {
		this.start = data.start;
		this.end = data.end;
	}
}

export abstract class ast_node_acyclic_type extends ast_node {
	constructor(data: ast_node_data) {
		super(data);
	}
	abstract check_acyclicity(
		env: environment,
		stack: ast_type_declaration[],
	): void;
	abstract check_type(env: environment, checker: checker): void;
	abstract show(): string;
}

export abstract class ast_node_statement extends ast_node {
	constructor(data: ast_node_data) {
		super(data);
	}
	abstract check_statement(env: environment, checker: checker): void;
	abstract check_return(type: ast_type): boolean;
}

export abstract class ast_node_expression extends ast_node {
	constructor(data: ast_node_data) {
		super(data);
	}
	abstract infer_type(env: environment, checker: type_checker): ast_type;
}


export abstract class ast_node_literal extends ast_node_expression {
	constructor(data: ast_node_data) {
		super(data);
	}
}


export type ast_variable_declaration_like = ast_variable_declaration | ast_parameter;
export type ast_extern_intern_function = ast_function_declaration | ast_extern_declaration;

export type ast_type =
	| ast_literal_type
	| ast_primitive_type
	| ast_named_type
	| ast_object_type
	| ast_union_type;

export type ast_expression =
	| ast_binary_expression
	| ast_function_call
	| ast_object_literal
	| ast_string_literal
	| ast_number_literal
	| ast_boolean_literal
	| ast_member_access
	| ast_variable;

export type ast_statement =
	| ast_type_declaration
	| ast_function_declaration
	| ast_if_statement
	| ast_extern_declaration
	| ast_immutable_variable_declaration
	| ast_mutable_variable_declaration
	| ast_return_statement
	| ast_expression_statement
	| ast_assignment;

export type ast_literal =
	| ast_string_literal
	| ast_number_literal
	| ast_boolean_literal;
