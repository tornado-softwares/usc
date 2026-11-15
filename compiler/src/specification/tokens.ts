import { token } from "@/lib/language/grammar"
import { char } from "@/lib/language/grammar/tokens/char"
import { keyword } from "@/lib/language/grammar/tokens/keyword"
import { regex } from "@/lib/language/grammar/tokens/regex"
import { lsp_semantic } from "@/lsp/semantic"

export const identifier_token = new token("identifier", new regex("[a-z](?:[a-z0-9]|_(?=[a-z0-9]))*", lsp_semantic.variable))
export const number_token = new token("number", new regex("[0-9]+", lsp_semantic.number))
export const string_token = new token("string", new regex("\"([^\"\\\\]|\\\\.)*\"", lsp_semantic.string))

export const satisfies_token = new token("satisfies", new keyword("satisfies", lsp_semantic.keyword))
export const const_token = new token("const", new keyword("const", lsp_semantic.keyword))
export const let_token = new token("let", new keyword("let", lsp_semantic.keyword))
export const function_token = new token("function", new keyword("function", lsp_semantic.keyword))
export const type_token = new token("type", new keyword("type", lsp_semantic.keyword))
export const return_token = new token("return", new keyword("return", lsp_semantic.keyword))
export const extern_token = new token("extern", new keyword("external", lsp_semantic.keyword))
export const if_token = new token("if", new keyword("if", lsp_semantic.keyword))
export const else_token = new token("else", new keyword("else", lsp_semantic.keyword))

export const left_parenthesis_token = new token("left_parenthesis", new char("(", lsp_semantic.punctuation))
export const right_parenthesis_token = new token("right_parenthesis", new char(")", lsp_semantic.punctuation))
export const left_brace_token = new token("left_brace", new char("{", lsp_semantic.punctuation))
export const right_brace_token = new token("right_brace", new char("}", lsp_semantic.punctuation))
export const colon_token = new token("colon", new char(":", lsp_semantic.punctuation))
export const semicolon_token = new token("semicolon", new char(";", lsp_semantic.punctuation))
export const comma_token = new token("comma", new char(",", lsp_semantic.punctuation))
export const dot_token = new token("dot", new char(".", lsp_semantic.punctuation))

export const equals_token = new token("equals", new char("=", lsp_semantic.operator))

export const string_type_token = new token("string_type", new keyword("string", lsp_semantic.type))
export const number_type_token = new token("number_type", new keyword("number", lsp_semantic.type))
export const boolean_type_token = new token("boolean_type", new keyword("boolean", lsp_semantic.type))
export const void_type_token = new token("void_type", new keyword("void", lsp_semantic.type))

export const true_token = new token("boolean_true_value", new keyword("true", lsp_semantic.boolean))
export const false_token = new token("boolean_false_value", new keyword("false", lsp_semantic.boolean))

export const plus_token = new token("plus", new char("+", lsp_semantic.operator))
export const minus_token = new token("minus", new char("-", lsp_semantic.operator))
export const star_token = new token("star", new char("*", lsp_semantic.operator))
export const slash_token = new token("slash", new char("/", lsp_semantic.operator))
export const percent_token = new token("percent", new char("%", lsp_semantic.operator))
export const equal_equal_token = new token("eq_eq", new keyword("==", lsp_semantic.operator))
export const not_equal_token = new token("not_eq", new keyword("!=", lsp_semantic.operator))
export const less_than_token = new token("lt", new char("<", lsp_semantic.operator))
export const greater_than_token = new token("gt", new char(">", lsp_semantic.operator))
export const less_than_equal_token = new token("lte", new keyword("<=", lsp_semantic.operator))
export const greater_than_equal_token = new token("gte", new keyword(">=", lsp_semantic.operator))
export const and_token = new token("and", new keyword("and", lsp_semantic.operator))
export const or_token = new token("or", new keyword("or", lsp_semantic.operator))
