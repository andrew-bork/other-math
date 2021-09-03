/**
 * 
 * @typedef {BinaryExpression|ConstantExpression|FunctionExpression|VariableExpression} Expression
 * @typedef {{type: 0|1|2|3|4|8, l: Expression, r: Expression}} BinaryExpression
 * @typedef {{type: 5, funct: ExpressionFunction, param: Expression}} FunctionExpression
 * @typedef {{type: 6, valType:0|1|2, val: number}} ConstantExpression
 * @typedef {{type: 7}} VariableExpression
 * @typedef {{type:0, evaluate: (val:ConstantExpression) => ConstantExpression}} ExpressionFunction
 * 
 * 
 * 
 * 
 */

const { types, valTypes, parse, tokenize, evaluate, string, clean, num, variables } = require("./expression");

/**
 * 
 * @param {BinaryExpression} equation 
 * @returns 
 */
const solve = (equation) => {
    if (equation.type != 8) return false;
    equation.l;
    equation.r;
}

const findUnknowns = (expression, variables) => {
    const knowns = Object.keys(variables);
    const unknowns = [];

    const search = (e) => {
        switch (e.type) {
            case types.add:
            case types.sub:
            case types.mul:
            case types.div:
            case types.exp:
            case types.equ:
                search(e.l);
                search(e.r);
                break;
            case types.eval_func:
            case types.defined_func:
                search(e.param);
                break;
            case types.var:
                if (knowns.find(b => b === e.name) == null && unknowns.find(b => b === e.name) == null) {
                    unknowns.push(e.name);
                }
            case types.const:
        }
    }
    search(expression);
    console.log(unknowns);
}


/**
 * 
 * @param {Expression} expression 
 * @param {string} respectTo 
 * @returns {Expression}
 */
function differentiate(expression, respectTo = "x") {
    switch (expression.type) {
        case types.add:
            return {
                type: types.add,
                l: differentiate(expression.l, respectTo),
                r: differentiate(expression.r, respectTo),
            }
        case types.sub:
            return {
                type: types.sub,
                l: differentiate(expression.l, respectTo),
                r: differentiate(expression.r, respectTo),
            }
        case types.mul:
            return {
                type: types.add,
                l: {
                    type: types.mul,
                    l: differentiate(expression.l, respectTo),
                    r: expression.r
                },
                r: {
                    type: types.mul,
                    l: expression.l,
                    r: differentiate(expression.r, respectTo),
                }
            };
        case types.div:
            return {
                type: types.div,
                l: {
                    type: types.sub,
                    l: {
                        type: types.mul,
                        l: differentiate(expression.l, respectTo),
                        r: expression.r,
                    },
                    r: {
                        type: types.mul,
                        l: expression.l,
                        r: differentiate(expression.r, respectTo),
                    }
                },
                r: {
                    type: types.exp,
                    l: expression.r,
                    r: num(2)
                }
            };
        case types.exp:
            return {
                type: types.mul,
                l: expression,
                r: differentiate({
                    type: types.mul,
                    l: expression.r,
                    r: {
                        type: types.eval_func,
                        funct: variables.ln,
                        param: expression.l,
                    }
                })
            };
        case types.equ:
            return {
                type: types.equ,
                l: differentiate(expression.l, respectTo),
                r: differentiate(expression.r, respectTo),
            };
        case types.eval_func:
        case types.defined_func:

            return {
                type: types.mul,
                l: plugIn(variables[expression.funct.name].derivative, expression.param, "x"),
                r: differentiate(expression.param, respectTo),
            }
        case types.var:
            if (expression.name == respectTo) {
                return num(1, 0);
            } else {
                return {
                    type: types.differential,
                    top: expression.name,
                    bot: respectTo,
                    n: 1,
                }
            }
        case types.const:
            return num(0, 0)
    }
}

/**
 * 
 * @param {Expression} f 
 * @param {Expression} g 
 * @param {string} variable 
 */
function plugIn(f, g, variable) {
    const search = (e) => {
        switch (e.type) {
            case types.add:
            case types.sub:
            case types.mul:
            case types.div:
            case types.exp:

                return {
                    type: e.type,
                    l: search(e.l),
                    r: search(e.r),
                };
            case types.eval_func:
            case types.defined_func:
                return {
                    type: e.type,
                    funct: e.funct,
                    param: search(e.param),
                };
            case types.var:
                if (variable == e.name) {
                    return g;
                }
                return e;
            case types.const:
                return e;
        }
    }
    return search(f);
}



//console.log(findUnknowns(parse("(x+y)/y"), { y: 0 }));
console.log("Derivative of x^2 is");
//console.log(string(clean(differentiate(parse("sin(x)^2")))));