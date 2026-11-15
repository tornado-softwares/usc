import { type checker, type environment, scope } from "@/lib/checker";
import { ast_node_acyclic_type, type ast_node_data } from "../../ast";
import type { ast_type_declaration } from "../declarations/type-declaration";
import type { ast_property_signature } from "../signatures/property-signature";

export class ast_object_type extends ast_node_acyclic_type {
	readonly kind = "object_type";
	readonly properties: ast_property_signature[];
	constructor(data: { properties: ast_property_signature[] } & ast_node_data) {
		super(data);
		this.properties = data.properties;
	}
	override check_acyclicity(
		env: environment,
		stack: ast_type_declaration[],
	): void {
		for (const property of this.properties) property.type.check_acyclicity(env, stack);
	}

	override check_type(env: environment, checker: checker): void {
		const fields = new scope<ast_property_signature>();
		for (const property of this.properties) {
			fields.declare(property.name, property);
			property.type.check_type(env, checker);
		}
	}

	override show(): string {
		return `{ ${this.properties.map((property) => `${property.name}: ${property.type.show()}`).join("; ")} }`;
	}
}
