type tst = { kind: "A"; value_a: number } | { kind: "B"; value_b: number };
const a: tst = {} as any;

if (a.kind === "A" && a.value_a === 3) {
	a.value_a;
} else {
	a.value_b;
}
