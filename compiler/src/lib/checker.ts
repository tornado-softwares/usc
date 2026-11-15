import { checker_error } from "./errors/checker";
import type { ast_expression, ast_extern_intern_function, ast_literal, ast_node, ast_statement, ast_type, ast_variable_declaration_like, } from "./language/ast";
import type { ast_function_declaration } from "./language/ast/declarations/function-declaration";
import type { ast_type_declaration } from "./language/ast/declarations/type-declaration";
import type { ast_binary_expression } from "./language/ast/expressions/binary-expression";
import { ast_program } from "./language/ast/i-dont-know/program";
import { ast_union_type } from "./language/ast/types/union-type";

export class scope<const T extends ast_node> {
	private readonly data = new Map<string, T>();
	constructor(readonly parent?: scope<T>) { }
	lookup(name: string): T | undefined {
		return this.data.get(name) ?? this.parent?.lookup(name);
	}
	declare(name: string, b: T): boolean {
		if (this.data.has(name)) {
			throw new checker_error(
				`Cannot redeclare ${b.kind} named "${name}"`,
				b.start,
				b.end,
			);
		}
		this.data.set(name, b);
		return true;
	}
}

export class environment {
	constructor(
		readonly variables = new scope<ast_variable_declaration_like>(),
		readonly functions = new scope<ast_extern_intern_function>(),
		readonly types = new scope<ast_type_declaration>(),
		readonly refinements = new Map<ast_variable_declaration_like, ast_type>(),
		readonly root: boolean = true,
		readonly current_function?: ast_function_declaration,
	) { }

	child(
		current_function: ast_function_declaration | undefined = this
			.current_function,
	) {
		return new environment(
			new scope(this.variables),
			new scope(this.functions),
			new scope(this.types),
			new Map(this.refinements),
			false,
			current_function,
		);
	}

	type_of(decl: ast_variable_declaration_like): ast_type {
		return this.refinements.get(decl) ?? decl.type;
	}

	refine(map: Map<ast_variable_declaration_like, ast_type>) {
		for (const [decl, t] of map) this.refinements.set(decl, t);
	}
}

export class type_checker {
	constructor(readonly checker: checker) { }

	readonly expr_types = new Map<ast_expression, ast_type>();
	readonly roots = new Map<ast_expression, ast_type>();

	resolve_expression_type(e: ast_expression, env: environment): ast_type {
		const type = e.infer_type(env, this);
		this.expr_types.set(e, type);
		return type;
	}

	normalize(type: ast_type, env: environment): ast_type[] {
		if (type.kind === "named_type") {
			const resolved = env.types.lookup(type.name);
			return resolved ? this.normalize(resolved.type, env) : [type];
		}
		if (type.kind === "union_type") {
			return type.types.flatMap((t) => this.normalize(t, env));
		}
		return [type];
	}

	resolve_type(type: ast_type, env: environment): ast_type {
		const members = this.normalize(type, env);
		return members.length === 1
			? members[0]
			: new ast_union_type({
				types: members,
				start: type.start,
				end: type.end,
			});
	}

	union_of(types: ast_type[], env: environment, at: ast_node): ast_type {
		const out: ast_type[] = [];
		types
			.flatMap((type) => this.normalize(type, env))
			.filter(
				(normalized) => !out.some((o) => this.type_equals(o, normalized, env)),
			)
			.forEach((normalized) => {
				out.push(normalized);
			});
		return out.length === 1
			? out[0]
			: new ast_union_type({ types: out, start: at.start, end: at.end });
	}

	property(
		type: ast_type,
		name: string,
		env: environment,
	): ast_type | undefined {
		const property_types: ast_type[] = [];
		for (const member of this.normalize(type, env)) {
			if (member.kind !== "object_type") return;
			const property = member.properties.find(
				(property) => property.name === name,
			);
			if (!property) return;
			property_types.push(property.type);
		}
		return property_types.length
			? this.union_of(property_types, env, type)
			: undefined;
	}

	type_equals(A: ast_type, B: ast_type, env: environment): boolean {
		const nA = this.normalize(A, env);
		const nB = this.normalize(B, env);
		if (nA.length !== nB.length) return false;
		return nA.every((t) => nB.some((u) => this.member_equals(t, u, env)));
	}

	private member_equals(A: ast_type, B: ast_type, env: environment): boolean {
		if (A.kind !== B.kind) return false;
		if (A.kind === "primitive_type" && B.kind === "primitive_type") {
			return A.name === B.name;
		}
		if (A.kind === "literal_type" && B.kind === "literal_type") {
			return A.value === B.value;
		}
		if (A.kind === "object_type" && B.kind === "object_type") {
			return (
				A.properties.length === B.properties.length &&
				A.properties.every((A_property) => {
					const matching_property = B.properties.find(
						(B_property) => B_property.name === A_property.name,
					);
					return (
						matching_property !== undefined &&
						this.type_equals(A_property.type, matching_property.type, env)
					);
				})
			);
		}
		return false;
	}

	private fits(
		expected: ast_type,
		actual: ast_type,
		env: environment,
	): boolean {
		if (this.member_equals(expected, actual, env)) return true;
		if (actual.kind === "literal_type" && expected.kind === "primitive_type") {
			return expected.name === typeof actual.value;
		}
		if (expected.kind === "object_type" && actual.kind === "object_type") {
			return (
				expected.properties.length === actual.properties.length &&
				expected.properties.every((expected_property) => {
					const matching_property = actual.properties.find(
						(actual_property) =>
							actual_property.name === expected_property.name,
					);
					return (
						matching_property !== undefined &&
						this.assignable(expected_property.type, matching_property.type, env)
					);
				})
			);
		}
		return false;
	}

	assignable(expected: ast_type, actual: ast_type, env: environment): boolean {
		const to = this.normalize(expected, env);
		const from = this.normalize(actual, env);
		return from.every((C /* current */) =>
			to.some((E /* expected */) => this.fits(E, C, env)),
		);
	}

	expect(expected: ast_type, actual: ast_type, env: environment, at: ast_node) {
		if (!this.assignable(expected, actual, env)) {
			throw new checker_error(
				`Type "${actual.show()}" is not assignable to type "${expected.show()}"`,
				at.start,
				at.end,
			);
		}
	}
}

export class checker {
	get types() {
		return this.type_checker;
	}
	readonly type_checker = new type_checker(this);

	check(nodes: ast_node[]) {
		this.type_checker.expr_types.clear();
		this.type_checker.roots.clear();
		nodes
			.filter((node) => node instanceof ast_program)
			.forEach((program) => {
				this.check_statements(program.body, new environment());
			});
	}

	check_statements(statements: ast_statement[], env: environment) {
		const declarations: ast_type_declaration[] = [];
		for (const s of statements) {
			if (s.kind === "type_declaration") {
				env.types.declare(s.name, s);
				declarations.push(s);
			}
		}
		for (const d of declarations) d.type.check_acyclicity(env, [d]);
		for (const d of declarations) d.type.check_type(env, this);
		for (const s of statements) s.check_statement(env, this);
	}

	// AI
	narrow(
		cond: ast_expression,
		env: environment,
		truth: boolean,
	): Map<ast_variable_declaration_like, ast_type> {
		if (cond.kind !== "binary_expression") return new Map();

		switch (cond.operator) {
			case "and":
			case "or":
				return this.narrow_logical(cond, env, truth);
			case "==":
			case "!=":
				return this.narrow_equality(cond, env, truth);
			default:
				return new Map();
		}
	}

	// AI
	private narrow_logical(
		cond: ast_binary_expression,
		env: environment,
		truth: boolean,
	): Map<ast_variable_declaration_like, ast_type> {
		const is_and = cond.operator === "and";
		const both_sides_known = is_and === truth;

		if (both_sides_known) {
			const from_left = this.narrow(cond.left, env, truth);
			const right_env = env.child();
			right_env.refine(from_left);
			const from_right = this.narrow(cond.right, right_env, truth);
			return new Map([...from_left, ...from_right]);
		}

		// Case 1: the left side alone decided the result.
		const case1 = this.narrow(cond.left, env, truth);

		// Case 2: the left side didn't decide it, so the right side did.
		// For "and" (result false): left was true. For "or" (result true): left was false.
		const case2_env = env.child();
		case2_env.refine(this.narrow(cond.left, env, is_and));
		const case2 = this.narrow(cond.right, case2_env, truth);

		const result = new Map<ast_variable_declaration_like, ast_type>();
		for (const decl of new Set([...case1.keys(), ...case2.keys()])) {
			const t1 = case1.get(decl) ?? env.type_of(decl);
			const t2 = case2.get(decl) ?? case2_env.type_of(decl);
			result.set(decl, this.type_checker.union_of([t1, t2], env, cond));
		}
		return result;
	}
	// AI
	private narrow_equality(
		cond: ast_binary_expression,
		env: environment,
		truth: boolean,
	): Map<ast_variable_declaration_like, ast_type> {
		const { target, literal } =
			this.split_target_and_literal(cond.left, cond.right) ?? {};
		if (!target || !literal) return new Map();

		const is_equal = (cond.operator === "==") === truth;
		const resolved = this.resolve_target(target, literal.value, is_equal, env);
		if (!resolved) return new Map();

		const { decl, keep } = resolved;
		const members = this.type_checker.normalize(env.type_of(decl), env);
		const kept = members.filter(keep);

		const learned_nothing = kept.length === 0 || kept.length === members.length;
		if (learned_nothing) return new Map();

		return new Map([[decl, this.type_checker.union_of(kept, env, cond)]]);
	}

	// AI
	private resolve_target(
		target: ast_expression,
		value: ast_literal["value"],
		is_equal: boolean,
		env: environment,
	) {
		const tc = this.type_checker;

		// Could a type be exactly `value`?
		const could_be_value = (t: ast_type) =>
			t.kind === "literal_type"
				? t.value === value
				: t.kind === "primitive_type" && t.name === typeof value;

		// Is a type *only* ever `value`?
		const is_exactly_value = (t: ast_type) =>
			t.kind === "literal_type" && t.value === value;

		// x == "a"
		if (target.kind === "variable") {
			const decl = env.variables.lookup(target.name);
			if (!decl) return undefined;

			const keep = (member: ast_type) =>
				is_equal ? could_be_value(member) : !is_exactly_value(member);
			return { decl, keep };
		}

		// x.kind == "a"   (discriminated union)
		if (target.kind === "member_access" && target.path.length === 2) {
			const [var_name, prop_name] = target.path as [string, string];
			const decl = env.variables.lookup(var_name);
			if (!decl) return undefined;

			const keep = (member: ast_type) => {
				if (member.kind !== "object_type") return true;

				const prop = member.properties.find((p) => p.name === prop_name);
				if (!prop) return true;

				const prop_types = tc.normalize(prop.type, env);
				if (is_equal) return prop_types.some(could_be_value);

				const only_this_value =
					prop_types.length === 1 && is_exactly_value(prop_types[0]!);
				return !only_this_value;
			};
			return { decl, keep };
		}

		return undefined;
	}

	// AI
	split_target_and_literal(left: ast_expression, right: ast_expression) {
		const is_literal = (e: ast_expression): e is ast_literal =>
			e.kind === "string_literal" ||
			e.kind === "number_literal" ||
			e.kind === "boolean_literal";
		if (is_literal(right)) return { target: left, literal: right };
		if (is_literal(left)) return { target: right, literal: left };
		return undefined;
	}

	// We should replace that with the check_return function
	terminates(statements: ast_statement[]): boolean {
		const last = statements.at(-1);
		if (!last) return false;
		if (last.kind === "return_statement") return true;
		return (
			last.kind === "if_statement" &&
			last.else_block !== undefined &&
			this.terminates(last.then_block.statements) &&
			this.terminates(last.else_block.statements)
		);
	}
}
