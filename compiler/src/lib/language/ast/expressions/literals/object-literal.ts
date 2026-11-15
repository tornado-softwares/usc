import type { environment, type_checker } from "@/lib/checker";
import { checker_error } from "@/lib/errors/checker";
import {
	type ast_node_data,
	ast_node_literal,
	type ast_type,
} from "@/lib/language/ast";
import type { ast_property_assignment } from "../../i-dont-know/property-assignment";
import { ast_property_signature } from "../../signatures/property-signature";
import { ast_object_type } from "../../types/object-type";

export class ast_object_literal extends ast_node_literal {
	readonly kind = "object_literal";
	readonly properties: ast_property_assignment[];
	type?: ast_type
	constructor(data: {
		properties: ast_property_assignment[],
		type?: ast_type
	} & ast_node_data) {
		super(data);
		this.properties = data.properties;
		this.type = data.type;
	}

	override infer_type(env: environment, checker: type_checker): ast_type {

		const seen = new Set<string>();
		for (const property of this.properties) {
			if (seen.has(property.name)) {
				throw new checker_error(
					`Duplicate property "${property.name}"`,
					property.start,
					property.end,
				);
			}
			seen.add(property.name);
		}

		const inferred_type = new ast_object_type({
			properties: this.properties.map(
				(p) =>
					new ast_property_signature({
						name: p.name,
						type: checker.resolve_expression_type(p.value, env),
						start: p.start,
						end: p.end,
					}),
			),
			start: this.start,
			end: this.end,
		});

		if (!this.type) return inferred_type;
		this.type.check_type(env, checker.checker)
		checker.expect(this.type, inferred_type, env, this)
		return this.type
	}
}
