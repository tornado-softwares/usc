import {
	type ast_node_data,
	ast_node_literal,
	type ast_type,
} from "../../../ast";
import { ast_literal_type } from "../../types/literal-type";

export class ast_string_literal extends ast_node_literal {
	readonly kind = "string_literal";
	readonly value: string;
	constructor(data: { value: string } & ast_node_data) {
		super(data);
		this.value = data.value;
	}
	override infer_type(): ast_type {
		return new ast_literal_type({
			value: this.value,
			start: this.start,
			end: this.end,
		});
	}
}
