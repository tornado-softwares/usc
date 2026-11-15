import type { environment, type_checker } from "@/lib/checker";
import { checker_error } from "@/lib/errors/checker";
import {
	type ast_expression,
	type ast_node_data,
	ast_node_expression,
	type ast_type,
} from "../../ast";
import { ast_primitive_type } from "../types/primitive-type";
import { ast_union_type } from "../types/union-type";

export class ast_binary_expression extends ast_node_expression {
	readonly kind = "binary_expression";
	readonly operator: string;
	readonly left: ast_expression;
	readonly right: ast_expression;
	constructor(
		data: {
			operator: string;
			left: ast_expression;
			right: ast_expression;
		} & ast_node_data,
	) {
		super(data);
		this.operator = data.operator;
		this.left = data.left;
		this.right = data.right;
	}

	widen(t: ast_type, env: environment, checker: type_checker): ast_type {
		const widened: ast_type[] = [];
		for (const m of checker.normalize(t, env)) {
			const w =
				m.kind === "literal_type"
					? new ast_primitive_type({
						name: typeof m.value as "string" | "number" | "boolean",
						start: m.start,
						end: m.end,
					})
					: m;
			if (!widened.some((o) => checker.type_equals(o, w, env))) widened.push(w);
		}
		return widened.length === 1 ? widened[0] : new ast_union_type({ types: widened, start: t.start, end: t.end });
	}

	override infer_type(env: environment, checker: type_checker): ast_type {
		const left_type = checker.resolve_expression_type(this.left, env);

		// The right side of "and" only runs when the left is true,
		// the right side of "or" only runs when the left is false.
		let right_env = env;
		if (this.operator === "and" || this.operator === "or") {
			right_env = env.child();
			right_env.refine(checker.checker.narrow(this.left, env, this.operator === "and"));
		}
		const right_type = checker.resolve_expression_type(this.right, right_env);

		const l = this.widen(left_type, env, checker);
		const r = this.widen(right_type, env, checker);
		const is = (t: ast_type, n: string) => t.kind === "primitive_type" && t.name === n;


		switch (this.operator) {
			case "+":
				if (is(l, "number") && is(r, "number")) return new ast_primitive_type({ name: "number", start: this.start, end: this.end });
				if (is(l, "string") && is(r, "string")) return new ast_primitive_type({ name: "string", start: this.start, end: this.end });
				throw new checker_error(`Operator "${this.operator}" cannot be applied to "${l.show()}" and "${r.show()}"`, this.start, this.end,);
			case "-":
			case "*":
			case "/":
			case "%":
				if (is(l, "number") && is(r, "number")) return new ast_primitive_type({ name: "number", start: this.start, end: this.end });
				throw new checker_error(`Operator "${this.operator}" cannot be applied to "${l.show()}" and "${r.show()}"`, this.start, this.end,);
			case "<":
			case ">":
			case "<=":
			case ">=":
				if (is(l, "number") && is(r, "number")) return new ast_primitive_type({ name: "boolean", start: this.start, end: this.end });
				throw new checker_error(`Operator "${this.operator}" cannot be applied to "${l.show()}" and "${r.show()}"`, this.start, this.end,);
			case "==":
			case "!=":
				if (checker.type_equals(l, r, env)) return new ast_primitive_type({ name: "boolean", start: this.start, end: this.end });
				throw new checker_error(`Operator "${this.operator}" cannot be applied to "${l.show()}" and "${r.show()}"`, this.start, this.end,);
			case "and":
			case "or":
				if (is(l, "boolean") && is(r, "boolean")) return new ast_primitive_type({ name: "boolean", start: this.start, end: this.end });
				throw new checker_error(`Operator "${this.operator}" cannot be applied to "${l.show()}" and "${r.show()}"`, this.start, this.end,);
			default:
				throw new checker_error(`Operator "${this.operator}" cannot be applied to "${l.show()}" and "${r.show()}"`, this.start, this.end,);
		}
	}
}
