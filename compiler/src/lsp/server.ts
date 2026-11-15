import { createConnection, type Diagnostic, DiagnosticSeverity, type InitializeResult, ProposedFeatures, SemanticTokensBuilder, TextDocumentSyncKind, TextDocuments } from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import { token_type_names } from "@/lsp/semantic";
import { cache, leaves, parse, push_token } from "./features/parser";

const connection = createConnection(ProposedFeatures.all);
const documents = new TextDocuments(TextDocument);

connection.languages.semanticTokens.on((params) => {
	const builder = new SemanticTokensBuilder();
	const doc = documents.get(params.textDocument.uri);
	if (!doc) return builder.build();
	const result = parse(doc);
	if (!result.tree) return builder.build();
	for (const token of leaves(result.tree)) {
		if (token.semantic === undefined) continue;
		push_token(builder, doc, token.start, token.end, token.semantic);
	}
	return builder.build();
});

connection.onInitialize(
	(): InitializeResult => ({
		capabilities: {
			textDocumentSync: TextDocumentSyncKind.Incremental,
			semanticTokensProvider: {
				legend: { tokenTypes: token_type_names, tokenModifiers: [] },
				full: true,
			},
		},
	}),
);

function validate(doc: TextDocument): void {
	const { error } = parse(doc);
	const diagnostics: Diagnostic[] = [];
	if (error) {
		diagnostics.push({
			severity: DiagnosticSeverity.Error,
			range: {
				start: doc.positionAt(error.start),
				end: doc.positionAt(error.end),
			},
			message: error.message,
			source: "usc",
		});
	}
	connection.sendDiagnostics({ uri: doc.uri, diagnostics });
}

documents.onDidChangeContent((event) => validate(event.document));

documents.onDidClose((event) => {
	cache.delete(event.document.uri);
	connection.sendDiagnostics({ uri: event.document.uri, diagnostics: [] });
});

documents.listen(connection);
connection.listen();
