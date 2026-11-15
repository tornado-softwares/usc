import type { checker, environment } from "@/lib/checker";
import { checker_error } from "@/lib/errors/checker";
import {
	ast_node_acyclic_type,
	type ast_node_data,
	type ast_type,
} from "../../ast";
import type { ast_type_declaration } from "../declarations/type-declaration";

export class ast_union_type extends ast_node_acyclic_type {
	readonly kind = "union_type";
	readonly types: ast_type[];
	constructor(data: { types: ast_type[] } & ast_node_data) {
		super(data);
		this.types = data.types;
	}
	override check_acyclicity(
		env: environment,
		stack: ast_type_declaration[],
	): void {
		for (const m of this.types) m.check_acyclicity(env, stack);
	}

	override check_type(env: environment, checker: checker): void {
		for (const type of this.types) type.check_type(env, checker);
		const seen: ast_type[] = [];
		for (const child of this.types) {
			for (const member of checker.type_checker.normalize(child, env)) {
				if (seen.some((seen_member) => checker.type_checker.type_equals(seen_member, member, env))) {
					throw new checker_error(
						`Duplicate type "${member.show()}" in union`,
						child.start,
						child.end,
					);
				}
				seen.push(member);
			}
		}
	}

	override show(): string {
		// AGI
		const flat = (u: ast_type): ast_type[] => u.kind === "union_type" ? u.types.flatMap(flat) : [u];
		return [...new Set(flat(this).map((m) => m.show()))].join(" or ");
	}
}
