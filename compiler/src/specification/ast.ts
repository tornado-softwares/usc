// AI

import {
	type ast_expression,
	type ast_statement,
	type ast_type,
	rule_ast,
} from "@/lib/language/ast";
import { ast_extern_declaration } from "@/lib/language/ast/declarations/extern-declaration";
import { ast_function_declaration } from "@/lib/language/ast/declarations/function-declaration";
import { ast_type_declaration } from "@/lib/language/ast/declarations/type-declaration";
import {
	ast_immutable_variable_declaration,
	ast_mutable_variable_declaration,
} from "@/lib/language/ast/declarations/variable-declaration";
import { ast_binary_expression } from "@/lib/language/ast/expressions/binary-expression";
import { ast_function_call } from "@/lib/language/ast/expressions/function-call";
import { ast_boolean_literal } from "@/lib/language/ast/expressions/literals/boolean-literal";
import { ast_number_literal } from "@/lib/language/ast/expressions/literals/number-literal";
import { ast_object_literal } from "@/lib/language/ast/expressions/literals/object-literal";
import { ast_string_literal } from "@/lib/language/ast/expressions/literals/string-literal";
import { ast_member_access } from "@/lib/language/ast/expressions/member-access";
import { ast_variable } from "@/lib/language/ast/expressions/variable";
import { ast_assignment } from "@/lib/language/ast/i-dont-know/assignment";
import { ast_block } from "@/lib/language/ast/i-dont-know/block";
import { ast_parameter } from "@/lib/language/ast/i-dont-know/parameter";
import { ast_program } from "@/lib/language/ast/i-dont-know/program";
import { ast_property_assignment } from "@/lib/language/ast/i-dont-know/property-assignment";
import { ast_property_signature } from "@/lib/language/ast/signatures/property-signature";
import { ast_expression_statement } from "@/lib/language/ast/statements/expression-statement";
import { ast_if_statement } from "@/lib/language/ast/statements/if-statement";
import { ast_return_statement } from "@/lib/language/ast/statements/return-statement";
import { ast_literal_type } from "@/lib/language/ast/types/literal-type";
import { ast_named_type } from "@/lib/language/ast/types/named-type";
import { ast_object_type } from "@/lib/language/ast/types/object-type";
import { ast_primitive_type } from "@/lib/language/ast/types/primitive-type";
import { ast_union_type } from "@/lib/language/ast/types/union-type";
import type { parser } from "@/lib/parser";
import type { cst, cst_of, group_node } from "@/types/cst";
import * as grammar from "./grammar";
import type { const_token, identifier_token, let_token } from "./tokens";

// ---------- helpers ----------

type group_of<T extends readonly cst[], N extends string> =
	Extract<T[number], { kind: "group"; name: N }>;

const groups = <T extends readonly cst[]>(c: T) =>
	c.filter((x): x is Extract<T[number], { kind: "group" }> => x.kind === "group");

const find_group = <T extends readonly cst[], N extends string>(c: T, name: N) =>
	c.find((x): x is group_of<T, N> => x.kind === "group" && x.name === name);

const find_token = <T extends readonly cst[], N extends string>(c: T, name: N) =>
	c.find((x): x is Extract<T[number], { kind: "token"; name: N }> =>
		x.kind === "token" && x.name === name);

const groups_named = <
	const T extends readonly { kind: string; name: string }[],
	const N extends string,
>(
	children: T,
	name: N,
): Extract<T[number], { kind: "group"; name: N }>[] =>
	children.filter(
		(c): c is Extract<T[number], { kind: "group"; name: N }> =>
			c.kind === "group" && c.name === name,
	);

const expect_group = (children: readonly cst[], name: string): group_node => {
	const found = find_group(children, name);
	if (!found) throw Error(`Expected a "${name}" group.`);
	return found;
};

const expr = (node: cst, parser: parser) =>
	parser.build(node) as ast_expression;

// [operand, op, operand, op, operand ...] folded left-associatively.
// With no operators it collapses to the single operand, so a plain `price`
// is a variable node, not a chain of 7 wrappers.
function fold_binary(children: readonly cst[], parser: parser): ast_expression {
	const [first, ...rest] = children;
	if (!first) throw Error("Binary expression with no operands.");
	let left = expr(first, parser);
	for (let i = 0; i + 1 < rest.length; i += 2) {
		const op = rest[i];
		const right = rest[i + 1];
		if (op.kind !== "token" || !right) {
			throw Error("Malformed binary expression.");
		}
		left = new ast_binary_expression({
			operator: op.value,
			left,
			right: expr(right, parser),
			start: first.start,
			end: right.end,
		});
	}
	return left;
}

// ---------- types ----------

export const type_ast = new rule_ast<"type", typeof grammar.union_type, ast_type>({
	rule: grammar.type,
	build: (cst, parser) => union_type_ast.build(cst.children[0], parser),
});

export const primitive_type_ast = new rule_ast({
	rule: grammar.primitive_type,
	build: (cst) =>
		new ast_primitive_type({
			name: cst.children[0].value,
			start: cst.start,
			end: cst.end,
		}),
});

export const named_type_ast = new rule_ast({
	rule: grammar.named_type,
	build: (cst) =>
		new ast_named_type({
			name: cst.children[0].value,
			start: cst.start,
			end: cst.end,
		}),
});

export const property_signature_ast = new rule_ast({
	rule: grammar.property_signature,
	build: (cst, parser) =>
		new ast_property_signature({
			name: cst.children[0].value,
			type: parser.build(cst.children[2]) as ast_type,
			start: cst.start,
			end: cst.end,
		}),
});

export const object_type_ast = new rule_ast({
	rule: grammar.object_type,
	build: (cst, parser) =>
		new ast_object_type({
			properties: groups(cst.children).map(
				(g) => parser.build(g) as ast_property_signature,
			),
			start: cst.start,
			end: cst.end,
		}),
});

// ---------- leaves ----------

export const variable_ast = new rule_ast({
	rule: grammar.variable,
	build: (cst) =>
		new ast_variable({
			name: cst.children[0].value,
			start: cst.start,
			end: cst.end,
		}),
});

export const string_literal_ast = new rule_ast({
	rule: grammar.string_literal,
	build: (cst) =>
		// the lexer keeps the quotes ("\"Alice\""), so strip them
		new ast_string_literal({
			value: cst.children[0].value.slice(1, -1),
			start: cst.start,
			end: cst.end,
		}),
});

export const number_literal_ast = new rule_ast({
	rule: grammar.number_literal,
	build: (cst) =>
		new ast_number_literal({
			value: Number(cst.children[0].value),
			start: cst.start,
			end: cst.end,
		}),
});

export const boolean_literal_ast = new rule_ast({
	rule: grammar.boolean_literal,
	build: (cst) =>
		new ast_boolean_literal({
			value: cst.children[0].value === "true",
			start: cst.start,
			end: cst.end,
		}),
});

export const member_access_ast = new rule_ast({
	rule: grammar.member_access,
	build: (cst) => {
		return new ast_member_access({
			path: cst.children.filter((c) => c.kind === "token" && c.name === "identifier").map((c) => c.value),
			start: cst.start,
			end: cst.end,
		})
	}
});

// ---------- compound expressions ----------

export const function_call_ast = new rule_ast({
	rule: grammar.function_call,
	build: (cst, parser) => {

		const args = cst.children.length === 4 ? cst.children["2"].children : []
		return new ast_function_call({
			called_function: cst.children[0].value,
			args: groups_named(args, "expression").map((g) => expression_ast.build(g, parser))
			, start: cst.start,
			end: cst.end,
		});
	},
});

export const property_assignment_ast = new rule_ast({
	rule: grammar.property_assignment,
	build: (cst, parser) =>
		new ast_property_assignment({
			name: cst.children[0].value,
			value: expression_ast.build(cst.children[2], parser),
			start: cst.start,
			end: cst.end,
		}),
});

export const object_literal_ast = new rule_ast({
	rule: grammar.object_literal,
	build: (cst, parser) => {
		const type_cst = find_group(cst.children, "type");
		return new ast_object_literal({
			properties: groups_named(cst.children, "property_assignment").map((g) =>
				property_assignment_ast.build(g, parser),
			),
			type: type_cst ? type_ast.build(type_cst, parser) : undefined,
			start: cst.start,
			end: cst.end,
		})
	}
});

// "(expr)" just yields the inner expression; the parentheses carry no meaning
export const parenthesized_ast = new rule_ast({
	rule: grammar.parenthesized,
	build: (cst, parser) => parser.build(cst.children[1]),
});

export const multiplicative_ast = new rule_ast({
	rule: grammar.multiplicative,
	build: (cst, parser) => fold_binary(cst.children, parser),
});
export const additive_ast = new rule_ast({
	rule: grammar.additive,
	build: (cst, parser) => fold_binary(cst.children, parser),
});
export const comparison_ast = new rule_ast({
	rule: grammar.comparison,
	build: (cst, parser) => fold_binary(cst.children, parser),
});
export const equality_ast = new rule_ast({
	rule: grammar.equality,
	build: (cst, parser) => fold_binary(cst.children, parser),
});
export const logical_and_ast = new rule_ast({
	rule: grammar.logical_and,
	build: (cst, parser) => fold_binary(cst.children, parser),
});
export const logical_or_ast = new rule_ast({
	rule: grammar.logical_or,
	build: (cst, parser) => fold_binary(cst.children, parser),
});

export const expression_ast = new rule_ast<"expression", typeof grammar.expression["element"], ast_expression>({
	rule: grammar.expression,
	build: (cst, parser) => logical_or_ast.build(cst.children[0], parser),
});
// ---------- statements ----------

export const type_declaration_ast = new rule_ast({
	rule: grammar.type_declaration,
	build: (cst, parser) =>
		new ast_type_declaration({
			name: cst.children[1].value,
			type: parser.build(cst.children[3]) as ast_type,
			start: cst.start,
			end: cst.end,
		}),
});

export const variable_declaration_ast = new rule_ast({
	rule: grammar.variable_declaration,
	build: (cst, parser) => {
		const nature = cst.children.find((c) => c.kind === "token" && (c.name === "const" || c.name === "let")) as unknown as cst_of<typeof const_token> | cst_of<typeof let_token>;
		const type = cst.children.find((c) => c.kind === "group" && c.name === "type") as unknown as cst_of<typeof grammar.type>
		const expression = cst.children.find((c) => c.kind === "group" && c.name === "expression") as unknown as cst_of<typeof grammar.expression>
		const identifier = cst.children.find((c) => c.kind === "token" && c.name === "identifier") as unknown as cst_of<typeof identifier_token>
		switch (nature.value) {
			case "const":
				return new ast_immutable_variable_declaration({
					name: identifier.value,
					type: parser.build(type) as ast_type,
					value: parser.build(expression) as ast_expression,
					start: cst.start,
					end: cst.end,
				});
			case "let":
				return new ast_mutable_variable_declaration({
					name: identifier.value,
					type: parser.build(type) as ast_type,
					value: parser.build(expression) as ast_expression,
					start: cst.start,
					end: cst.end,
				});
		}
	},
});

export const return_statement_ast = new rule_ast({
	rule: grammar.return_statement,
	build: (cst, parser) => {
		const value = find_group(cst.children, "expression");
		return new ast_return_statement({
			value: value ? expr(value, parser) : undefined,
			start: cst.start,
			end: cst.end,
		});
	},
});

export const expression_statement_ast = new rule_ast({
	rule: grammar.expression_statement,
	build: (cst, parser) =>
		new ast_expression_statement({
			expression: expr(cst.children[0], parser),
			start: cst.start,
			end: cst.end,
		}),
});

export const assignment_ast = new rule_ast({
	rule: grammar.assignment,
	build: (cst, parser) =>
		new ast_assignment({
			target: parser.build(cst.children[0]) as ast_member_access | ast_variable,
			value: expr(cst.children[2], parser),
			start: cst.start,
			end: cst.end,
		}),
});

export const block_ast = new rule_ast({
	rule: grammar.block,
	build: (cst, parser) =>
		new ast_block({
			statements: groups(cst.children).map(
				(g) => parser.build(g) as ast_statement,
			),
			start: cst.start,
			end: cst.end,
		}),
});

export const parameter_ast = new rule_ast({
	rule: grammar.parameter,
	build: (cst, parser) =>
		new ast_parameter({
			name: cst.children[0].value,
			type: parser.build(cst.children[2]) as ast_type,
			start: cst.start,
			end: cst.end,
		}),
});

export const function_declaration_ast = new rule_ast({
	rule: grammar.function_declaration,
	build: (cst, parser) => {
		const list = find_group(cst.children, "parameter_list");
		const name_token = cst.children.find((c) => c.kind === "token" && c.name === "identifier",) as cst_of<typeof identifier_token>;
		return new ast_function_declaration({
			name: name_token.value,
			parameters: list
				? groups(list.children).map((g) => parser.build(g) as ast_parameter)
				: [],
			return_type: parser.build(expect_group(cst.children, "type")) as ast_type,
			body: parser.build(expect_group(cst.children, "block")) as ast_block,
			start: cst.start,
			end: cst.end,
		});
	},
});

// statement is a wrapper around exactly one concrete statement
export const statement_ast = new rule_ast({
	rule: grammar.statement,
	build: (cst, parser) => parser.build(cst.children[0]),
});

export const program_ast = new rule_ast({
	rule: grammar.program,
	build: (cst, parser) =>
		new ast_program({
			body: cst.children.map((c) => parser.build(c) as ast_statement),
			start: cst.start,
			end: cst.end,
		}),
});

export const union_type_ast = new rule_ast<"union_type", typeof grammar.union_type["element"], ast_type>({
	rule: grammar.union_type,
	build: (cst, parser) => {
		const types = groups(cst.children).map((g) => parser.build(g) as ast_type);
		if (types.length === 1) return types[0] as ast_type;
		return new ast_union_type({ types, start: cst.start, end: cst.end });
	},
});

export const extern_declaration_ast = new rule_ast({
	rule: grammar.extern_declaration,
	build: (cst, parser) => {
		const name_token = cst.children.find((c) => c.kind === "token" && c.name === "identifier",) as cst_of<typeof identifier_token>;
		const list = find_group(cst.children, "parameter_list");
		return new ast_extern_declaration({
			name: name_token.value,
			parameters: list
				? groups(list.children).map((g) => parser.build(g) as ast_parameter)
				: [],
			return_type: parser.build(expect_group(cst.children, "type")) as ast_type,
			start: cst.start,
			end: cst.end,
		});
	},
});

export const literal_type_ast = new rule_ast({
	rule: grammar.literal_type,
	build: (cst) => {
		const raw = cst.children[0].value;
		const value =
			raw === "true"
				? true
				: raw === "false"
					? false
					: raw.startsWith('"')
						? raw.slice(1, -1) // the lexer keeps the quotes
						: Number(raw);
		return new ast_literal_type({ value, start: cst.start, end: cst.end });
	},
});

export const if_statement_ast = new rule_ast({
	rule: grammar.if_statement,
	build: (cst, parser) => {
		const blocks = groups(cst.children)
			.filter((g) => g.name === "block")
			.map((g) => parser.build(g) as ast_block);
		return new ast_if_statement({
			condition: expr(cst.children[2], parser),
			then_block: blocks[0] as ast_block,
			else_block: blocks[1],
			start: cst.start,
			end: cst.end,
		});
	},
});


export const parenthesized_type_ast = new rule_ast({
	rule: grammar.parenthesized_type,
	build: (cst, parser) => parser.build(cst.children[1]),
});
