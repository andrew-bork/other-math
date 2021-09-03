const expression = require("./expression")
const test = "isin(x)";
//console.log(expression.tokenize(test));
//console.log(expression.string(expression.parse(test)));
//console.log(expression.string(expression.evaluate(test)));

// expression.parse("sin(x)");
console.log(expression.string(expression.simplify(expression.clean(expression.parse("6 * 2 + 7 * x + 3")))));