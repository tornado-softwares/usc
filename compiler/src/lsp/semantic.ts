export enum lsp_semantic {
	"keyword" = 0,
	"string" = 1,
	"number" = 2,
	"operator" = 3,
	"variable" = 4,
	"function" = 5,
	"comment" = 6,
	"property" = 7,
	"type" = 8,
	"parameter" = 9,
	"punctuation" = 10,
	"boolean" = 11,
}

export const token_type_names = Object.keys(lsp_semantic).slice(Object.keys(lsp_semantic).length / 2)
