import {
	type grammar,
	highlight,
	one_of,
	optional,
	reference,
	repeated,
	rule,
	sequence,
} from "@/lib/language/grammar";
import { lsp_semantic } from "@/lsp/semantic";
import {
	and_token,
	boolean_type_token,
	colon_token,
	comma_token,
	const_token,
	dot_token,
	else_token,
	equal_equal_token,
	equals_token,
	extern_token,
	false_token,
	function_token,
	greater_than_equal_token,
	greater_than_token,
	identifier_token,
	if_token,
	left_brace_token,
	left_parenthesis_token,
	less_than_equal_token,
	less_than_token,
	let_token,
	minus_token,
	not_equal_token,
	number_token,
	number_type_token,
	or_token,
	percent_token,
	plus_token,
	return_token,
	right_brace_token,
	right_parenthesis_token,
	satisfies_token,
	semicolon_token,
	slash_token,
	star_token,
	string_token,
	string_type_token,
	true_token,
	type_token,
	void_type_token,
} from "./tokens";

const function_name = new highlight(identifier_token, lsp_semantic.function);
const property_name = new highlight(identifier_token, lsp_semantic.property);
const type_name = new highlight(identifier_token, lsp_semantic.type);
const param_name = new highlight(identifier_token, lsp_semantic.parameter);
const or_keyword = new highlight(or_token, lsp_semantic.keyword);

interface type_ref extends grammar {
	readonly kind: "rule";
	readonly name: "type";
	readonly element: typeof union_type;
}
interface expression_ref extends grammar {
	readonly kind: "rule";
	readonly name: "expression";
	readonly element: typeof logical_or;
}
interface statement_ref extends grammar {
	readonly kind: "rule";
	readonly name: "statement";
	readonly element: typeof statement_body;
}

export let type: type_ref;
export let expression: expression_ref;
export let statement: statement_ref;
const type_reference = new reference<type_ref>(() => type);
const expression_reference = new reference<expression_ref>(() => expression);
const statement_reference = new reference<statement_ref>(() => statement);

export const primitive_type = new rule(
	"primitive_type",
	new one_of([
		string_type_token,
		number_type_token,
		boolean_type_token,
		void_type_token,
	]),
	lsp_semantic.type,
);

export const named_type = new rule("named_type", type_name);

export const property_signature = new rule(
	"property_signature",
	new sequence([property_name, colon_token, type_reference, semicolon_token]),
);

export const object_type = new rule(
	"object_type",
	new sequence([
		left_brace_token,
		new repeated(property_signature),
		right_brace_token,
	]),
);

export const literal_type = new rule(
	"literal_type",
	new one_of([
		string_token,
		number_token,
		new highlight(true_token, lsp_semantic.type),
		new highlight(false_token, lsp_semantic.type),
	]),
);

export const parenthesized_type = new rule(
	"parenthesized_type",
	new sequence([
		left_parenthesis_token,
		type_reference,
		right_parenthesis_token,
	]),
);

const type_member = new one_of([
	primitive_type,
	literal_type,
	object_type,
	named_type,
	parenthesized_type,
]);

export const union_type = new rule(
	"union_type",
	new sequence([
		type_member,
		new repeated(new sequence([or_keyword, type_member])),
	]),
);

type = new rule("type", union_type);

export const type_declaration = new rule(
	"type_declaration",
	new sequence([
		type_token,
		type_name,
		equals_token,
		type_reference,
		semicolon_token,
	]),
);

export const variable = new rule("variable", identifier_token);

export const string_literal = new rule("string_literal", string_token);
export const number_literal = new rule("number_literal", number_token);

export const boolean_literal = new rule(
	"boolean_literal",
	new one_of([true_token, false_token]),
	lsp_semantic.boolean,
);

export const member_access = new rule(
	"member_access",
	new sequence([
		identifier_token,
		dot_token,
		property_name,
		new repeated(new sequence([dot_token, property_name])),
	]),
);

export const argument_list = new rule(
	"argument_list",
	new sequence([
		expression_reference,
		new repeated(expression_reference, comma_token),
	]),
);

export const function_call = new rule(
	"function_call",
	new sequence([
		function_name,
		left_parenthesis_token,
		new optional(argument_list),
		right_parenthesis_token,
	]),
);

export const property_assignment = new rule(
	"property_assignment",
	new sequence([property_name, colon_token, expression_reference]),
);

export const object_literal = new rule(
	"object_literal",
	new sequence([
		left_brace_token,
		new optional(
			new sequence([
				property_assignment,
				new repeated(property_assignment, comma_token),
			]),
		),
		right_brace_token,
		new optional(new sequence([satisfies_token, type_reference])),
	]),
);

export const parenthesized = new rule(
	"parenthesized",
	new sequence([
		left_parenthesis_token,
		expression_reference,
		right_parenthesis_token,
	]),
);

const primary = new one_of([
	function_call,
	object_literal,
	string_literal,
	number_literal,
	boolean_literal,
	member_access,
	variable,
	parenthesized,
]);

export const multiplicative = new rule(
	"multiplicative",
	new sequence([
		primary,
		new repeated(
			new sequence([
				new one_of([star_token, slash_token, percent_token]),
				primary,
			]),
		),
	]),
);

export const additive = new rule(
	"additive",
	new sequence([
		multiplicative,
		new repeated(
			new sequence([new one_of([plus_token, minus_token]), multiplicative]),
		),
	]),
);

export const comparison = new rule(
	"comparison",
	new sequence([
		additive,
		new repeated(
			new sequence([
				new one_of([
					less_than_equal_token,
					greater_than_equal_token,
					less_than_token,
					greater_than_token,
				]),
				additive,
			]),
		),
	]),
);

export const equality = new rule(
	"equality",
	new sequence([
		comparison,
		new repeated(
			new sequence([
				new one_of([equal_equal_token, not_equal_token]),
				comparison,
			]),
		),
	]),
);

export const logical_and = new rule(
	"logical_and",
	new sequence([equality, new repeated(new sequence([and_token, equality]))]),
);

export const logical_or = new rule(
	"logical_or",
	new sequence([
		logical_and,
		new repeated(new sequence([or_token, logical_and])),
	]),
);

expression = new rule("expression", logical_or);

export const variable_declaration = new rule(
	"variable_declaration",
	new one_of([
		new sequence([
			new one_of([const_token, let_token]),
			identifier_token,
			new sequence([colon_token, type_reference]),
			equals_token,
			expression_reference,
			semicolon_token,
		]),
		new sequence([
			type_reference,
			new one_of([const_token, let_token]),
			identifier_token,
			equals_token,
			expression_reference,
			semicolon_token,
		]),
	]),
);

export const return_statement = new rule(
	"return_statement",
	new sequence([
		return_token,
		new optional(expression_reference),
		semicolon_token,
	]),
);

export const expression_statement = new rule(
	"expression_statement",
	new sequence([expression_reference, semicolon_token]),
);

export const block = new rule(
	"block",
	new sequence([
		left_brace_token,
		new repeated(statement_reference),
		right_brace_token,
	]),
);

export const parameter = new rule(
	"parameter",
	new sequence([param_name, colon_token, type_reference]),
);

export const parameter_list = new rule(
	"parameter_list",
	new sequence([parameter, new repeated(parameter, comma_token)]),
);

export const function_declaration = new rule(
	"function_declaration",
	new one_of([
		new sequence([
			new optional(function_token),
			function_name,
			left_parenthesis_token,
			new optional(parameter_list),
			right_parenthesis_token,
			colon_token,
			type_reference,
			block,
		]),
		new sequence([
			type_reference,
			function_name,
			left_parenthesis_token,
			new optional(parameter_list),
			right_parenthesis_token,
			block,
		]),
	]),
);

export const extern_declaration = new rule(
	"extern_declaration",
	new one_of([
		new sequence([
			extern_token,
			new optional(function_token),
			function_name,
			left_parenthesis_token,
			new optional(parameter_list),
			right_parenthesis_token,
			colon_token,
			type_reference,
			semicolon_token,
		]),
		new sequence([
			extern_token,
			type_reference,
			new optional(function_token),
			function_name,
			left_parenthesis_token,
			new optional(parameter_list),
			right_parenthesis_token,
			semicolon_token,
		]),
	]),
);

export const if_statement = new rule(
	"if_statement",
	new sequence([
		if_token,
		left_parenthesis_token,
		expression_reference,
		right_parenthesis_token,
		block,
		new optional(new sequence([else_token, block])),
	]),
);

export const assignment = new rule(
	"assignment",
	new sequence([
		new one_of([member_access, variable]),
		equals_token,
		expression_reference,
		semicolon_token,
	]),
);

const statement_body = new one_of([
	type_declaration,
	function_declaration,
	extern_declaration,
	if_statement,
	variable_declaration,
	return_statement,
	expression_statement,
	assignment,
]);

statement = new rule("statement", statement_body);

export const program = new rule("program", new repeated(statement_reference));
