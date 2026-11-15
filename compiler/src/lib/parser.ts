import type { cst, cst_of } from "@/types/cst";
import type { ast_node, rule_ast } from "./language/ast";

export class parser {
	constructor(public rules: rule_ast<any, any, any>[]) { }

	parse(nodes: cst[]): ast_node[] {
		return nodes.flatMap(node => this.build_all(node));
	}


	private build_all(node: cst): ast_node[] {
		if (node.kind !== "group") {
			throw Error(`Cannot build an AST node from "${node.name}" token.`);
		}
		const rule = this.rules.find(r => r.name === node.name);
		if (!rule) {
			console.warn(`AST rule "${node.name}" not provided.`);
			return this.parse(node.children);
		}
		return [rule.build(node, this)];
	}

	build(node: cst): ast_node {
		const nodes = this.build_all(node);
		if (nodes.length !== 1) {
			throw Error(`Expected "${node.name}" to build exactly one AST node, got ${nodes.length}.`);
		}
		return nodes[0]
	}



}
