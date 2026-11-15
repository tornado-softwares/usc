import type { environment } from "@/lib/checker";
import { checker_error } from "@/lib/errors/checker";
import { ast_node_acyclic_type, type ast_node_data } from "../../ast";
import type { ast_type_declaration } from "../declarations/type-declaration";

export class ast_named_type extends ast_node_acyclic_type {
	readonly kind = "named_type";
	readonly name: string;
	constructor(data: { name: string } & ast_node_data) {
		super(data);
		this.name = data.name;
	}

	override check_acyclicity(env: environment, stack: ast_type_declaration[]): void {
		const type = env.types.lookup(this.name);
		if (!type) return;
		if (stack.includes(type)) {
			throw new checker_error(`Type "${this.name}" is recursive`, this.start, this.end);
		}
		type.type.check_acyclicity(env, [...stack, type]);
		return;
	}

	override check_type(env: environment): void {
		if (!env.types.lookup(this.name)) {
			throw new checker_error(`Unknown type named "${this.name}"`, this.start, this.end);
		}
	}

	override show(): string {
		return this.name // lookup the linked type for a proper representation of the type.
	}
}
