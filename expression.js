/**
 * 
 * @typedef {BinaryExpression|ConstantExpression|FunctionExpression|VariableExpression|Differential} Expression
 * @typedef {{type: 0|1|2|3|4|8, l: Expression, r: Expression}} BinaryExpression
 * @typedef {{type: 5, funct: ExpressionFunction, param: Expression}} FunctionExpression
 * @typedef {{type: 6, valType:0|1|2, val: number}} ConstantExpression
 * @typedef {{type: 7, name: string}} VariableExpression
 * @typedef {{type:0, evaluate: (val:ConstantExpression) => ConstantExpression}} ExpressionFunction
 * @typedef {{type: 0|2, exps: [Expression]}} FlattenedExpression
 * @typedef {{type: 12, top: string, bot: string, n: number}} Differential
 * 
 * 
 */

const complex = require("./complex");
const math = require("./complex");


const types = {
    add: 0,
    sub: 1,
    mul: 2,
    div: 3,
    exp: 4,
    eval_func: 5,
    defined_func: 6,
    const: 7,
    var: 8,
    equ: 9,
    flat_add: 10,
    flat_mult: 11,
    differential: 12
}
const valTypes = {
    num: 0,
    vec: 1,
    mat: 2,
}

const variables = { i: 0 };

const isNumber = (stirng) => {
    return /-{0,1}((\d+)|(\d*\.\d+))/g.test(stirng);
}
const isWord = (string) => {
    return /\w+/.test(string);
}

const tokenize = (source) => {
    const keywords = Object.keys(variables);
    var prefix = "";
    if (keywords.length > 0) {
        prefix = keywords.join("|") + "|";
    }

    regex = new RegExp(prefix + "/\\\"[^\\\"]*\\\"|\\+(\\+|=){0,1}|-|\\||\\/|\\*|\\)|\\^|\\(|-|{|}|;|<|>|(\\d*\\.\\d+)|\\d+|[A-Za-z]|,|=", "g");
    return source.match(regex);
}

const num = (r = 0, i = 0) => {
    return { type: types.const, valType: valTypes.num, val: { r: r, i: i } };
}
const numc = (c) => {
    return { type: types.const, valType: valTypes.num, val: c };
}

const vec = (val) => {
    return { type: types.const, valType: valTypes.vec, val: val };
}





/** @type {Map<string, ExpressionFunction>} */
var functions = {
    sin: {
        name: "sin",
        inv: "asin",
        type: 0,
        evaluate: (value) => {
            return num(Math.sin(value.val.r));
        }
    },
    cos: {
        name: "cos",
        inv: "acos",
        type: 0,
        evaluate: (value) => {
            return num(Math.cos(value.val.r));
        }
    },
    tan: {
        name: "tan",
        inv: "atan",
        type: 0,
        evaluate: (value) => {
            return num(Math.tan(value.val.r));
        }
    },
    abs: {
        name: "abs",
        inv: "plusmin",
        type: 0,
        evaluate: (value) => {
            return num(math.complex.abs(value.val));
        }
    },
};

const constants = {
    pi: {
        alias: ["PI", "pi"],
        numerical: num(Math.PI, 0),
        simplify: false,
    },
    e: {
        alias: ["e"],
        numerical: num(Math.E, 0),
        simplify: false,
    }
}


/**
 * 
 * @param {Array<String>} tokens 
 * @returns {Expression}
 */

const parse = (tokens) => {

    /**
     * 
     * @param {Array<String>} tokens 
     * @returns {Expression}
     */
    const parseVector = (tokens) => {
        tokens = tokens.slice(1, -1);
        var paren = 0;
        var curly = 0;
        const val = [];
        var last = 0;
        for (var i = 0; i < tokens.length; i++) {
            const curr = tokens[i];
            if (curr === "(") {
                paren++;
            } else if (curr === ")") {
                paren--;
            } else if (curr === "{") {
                curly++;
            } else if (curr === "}") {
                curly--;
            } else if (curly === 0 && paren === 0) {
                if (curr === ",") {
                    const a = parse(tokens.slice(last, i));
                    console.log(a);
                    val.push(parse(tokens.slice(last, i)));
                    last = i + 1;
                }
            }
        }
        if (last != tokens.length) {
            const a = parse(tokens.slice(last));
            console.log(a);
            val.push(parse(tokens.slice(last)));
        }

        return vec(val);
    }

    // Surrounding Parenthesis
    removeSurroundingParenthesis = (tokens) => {
        if (tokens.length == 0) { return tokens; }
        var paren = 0;
        for (var i = 0; i < tokens.length; i++) {
            if (paren == 0 && i != 0) {
                return tokens;
            } else if (i == 0 && tokens[i] != "(") {
                return tokens;
            } else if (tokens[i] == "(") {
                paren++;
            } else if (tokens[i] == ")") {
                paren--;
            }
        }
        return removeSurroundingParenthesis(tokens.slice(1, -1));
    }

    tokens = removeSurroundingParenthesis(tokens);
    // Addition/Subtraction
    var paren = (tokens[-1] === ")" ? -1 : 0);
    var curly = (tokens[-1] === "}" ? -1 : 0);
    var abs = (tokens[-1] === "|" ? true : false);
    for (var i = tokens.length - 1; i >= 1; i--) {
        const curr = tokens[i];
        if (curr === "(") {
            paren++;
        } else if (curr === ")") {
            paren--;
        } else if (curr === "{") {
            curly++;
        } else if (curr === "}") {
            curly--;
        } else if (curr === "|") {
            abs = !abs;
        } else if (curly === 0 && paren === 0 && !abs) {
            if (curr === "+") {
                return {
                    type: types.add,
                    l: parse(tokens.slice(0, i)),
                    r: parse(tokens.slice(i + 1))
                };
            } else if (curr === "-") {
                return {
                    type: types.sub,
                    l: parse(tokens.slice(0, i)),
                    r: parse(tokens.slice(i + 1))
                };
            }
        }
    }
    // Multiplication/Division
    paren = (tokens[-1] === ")" ? -1 : 0);
    curly = (tokens[-1] === "}" ? -1 : 0);
    abs = (tokens[-1] === "|" ? true : false);
    for (var i = tokens.length - 1; i >= 1; i--) {
        const curr = tokens[i];
        if (curr === "(") {
            paren++;
        } else if (curr === ")") {
            paren--;
        } else if (curr === "{") {
            curly++;
        } else if (curr === "}") {
            curly--;
        } else if (curr === "|") {
            abs = !abs;
        } else if (curly === 0 && paren === 0 && !abs) {
            if (curr === "*") {
                return {
                    type: types.mul,
                    l: parse(tokens.slice(0, i)),
                    r: parse(tokens.slice(i + 1))
                };
            } else if (curr === "/") {
                return {
                    type: types.div,
                    l: parse(tokens.slice(0, i)),
                    r: parse(tokens.slice(i + 1))
                };
            }
        }
    }

    // Exponents
    paren = (tokens[-1] === ")" ? -1 : 0);
    curly = (tokens[-1] === "}" ? -1 : 0);
    abs = (tokens[-1] === "|" ? true : false);
    for (var i = tokens.length - 1; i >= 1; i--) {
        const curr = tokens[i];
        if (curr === "(") {
            paren++;
        } else if (curr === ")") {
            paren--;
        } else if (curr === "{") {
            curly++;
        } else if (curr === "}") {
            curly--;
        } else if (curr === "|") {
            abs = !abs;
        } else if (curly === 0 && paren === 0 && !abs) {
            if (curr === "^") {
                return {
                    type: types.exp,
                    l: parse(tokens.slice(0, i)),
                    r: parse(tokens.slice(i + 1))
                };
            }
        }
    }

    // Terms

    /**
     * 
     * @param {Expression} multexp 
     * @returns {BinaryExpression}
     */
    const multAndParseNext = (multexp, i = 1) => {
        return {
            l: multexp,
            r: (tokens.length > i ? parse(tokens.slice(i)) : num(1)),
            type: types.mul
        };
    }

    const findNextParenGroup = () => {
        paren = 0;
        curly = 0;
        abs = 0;
        for (var i = 0; i < tokens.length; i++) {
            const curr = tokens[i];
            if (curr === "(") {
                paren++;
            } else if (curr === ")") {
                paren--;
                if (paren == 0) {
                    return i;
                }
            } else if (curr === "{") {
                curly++;
            } else if (curr === "}") {
                curly--;
            } else if (curr === "|") {
                abs = !abs;
            }
        }
        return -1;
    }

    const next = tokens[0];
    if (isNumber(next)) {
        return multAndParseNext(num(parseFloat(next)));
    }
    const variable = variables[next];
    //const constants = constants[next];
    if (next == "i") {
        return multAndParseNext(num(0, 1), 1);
    } else if (variable) {
        if (variable.type == 1) {

        } else if (variable.type == 0) {

            if (tokens.length >= 4 && tokens[1] === "(") {
                const begin = 1;
                const end = findNextParenGroup() + 1;
                if (end != -1) {
                    const params = tokens.slice(begin, end);
                    return multAndParseNext({
                        type: types.eval_func,
                        funct: variable,
                        param: parse(params)
                    }, end)
                }
            }

            return {
                type: types.eval_func,
                funct: variable,
                param: parse(tokens.slice(1))
            }
        } else if (variable.type == 2) {
            if (variable.instanteval) {
                return multAndParseNext(numc(variable.value));
            } else {
                return multAndParseNext({
                    type: types.var,
                    name: variable.name
                });
            }
        }
    } else {
        if (next == "(") {
            const begin = 0;
            const end = findNextParenGroup() + 1;
            return multAndParseNext(parse(tokens.slice(begin, end)), end)
        }
        return multAndParseNext({
            type: types.var,
            name: next,
        });
    }
}

/**
 * 
 * @param {Expression} exp 
 * @returns {ConstantExpression}
 */
const evaluate = (exp) => {
    var l, r;
    var param;
    switch (exp.type) {
        case types.add:
            l = evaluate(exp.l);
            r = evaluate(exp.r);
            if (l.valType === r.valType) {
                switch (l.valType) {
                    case valTypes.num:
                        return numc(math.complex.add(l.val, r.val));
                    case valTypes.vec:
                        return vec(l.val.map((value, i) => num(evaluate(value).val + evaluate(r.val[i]).val)));
                }
            }
            break;
        case types.sub:
            l = evaluate(exp.l);
            r = evaluate(exp.r);
            if (l.valType === r.valType) {
                switch (l.valType) {
                    case valTypes.num:
                        return numc(math.complex.sub(l.val, r.val));
                    case valTypes.vec:
                        return vec(l.val.map((value, i) => num(evaluate(value).val - evaluate(r.val[i]).val)));
                }
            }
            break;
        case types.mul:
            l = evaluate(exp.l);
            r = evaluate(exp.r);
            if (l.valType == valTypes.num) {
                if (r.valType == valTypes.num) {
                    return numc(math.complex.mul(l.val, r.val));
                } else if (r.valType == valTypes.vec) {
                    return vec(r.val.map(value => num(evaluate(value).val * l.val)));
                }
            } else if (l.valType == valTypes.vec) {
                if (r.valType == valTypes.num) {
                    return vec(l.val.map(value => num(evaluate(value).val * r.val)));
                } else if (r.valType == valTypes.vec) {
                    return vec(r.val.map((value, i) => num(evaluate(value).val * evaluate(l[i]).val)));
                }
            }
            break;
        case types.div:
            l = evaluate(exp.l);
            r = evaluate(exp.r);
            if (l.valType === r.valType) {
                switch (l.valType) {
                    case valTypes.num:
                        return numc(math.complex.div(l.val, r.val));
                    case valTypes.vec:
                        break;
                }
            }
            break;
        case types.exp:
            l = evaluate(exp.l);
            r = evaluate(exp.r);
            if (l.valType === r.valType) {
                switch (l.valType) {
                    case valTypes.num:
                        return numc(math.complex.pow(l.val, r.val));
                    case valTypes.vec:
                        break;
                }
            }
            break;
        case types.var:

            break;
        case types.const:
            switch (exp.valType) {
                case valTypes.num:
                    return exp;
                case valTypes.vec:
                    return { type: types.const, valType: valTypes.vec, val: exp.val.map((exp) => { return evaluate(exp); }) };
                case valTypes.mat:

            }
            return exp;
        case types.eval_func:
            param = evaluate(exp.param);
            return exp.funct.evaluate(param);
        case types.defined_func:
            param = evaluate(exp.param);
            //return exp.funct.
            return null;
    }
};


/**
 * 
 * @param {Expression} expression
 * @returns {String} 
 */
const string = (expression, precesdence = 0) => {
    if (!expression) return "NULL";
    var out = "";
    switch (expression.type) {
        case types.add:
            if (precesdence > 0) {
                return `(${string(expression.l)} + ${string(expression.r)})`;
            }
            return `${string(expression.l)} + ${string(expression.r)}`;
        case types.sub:
            if (precesdence > 0) {
                return `(${string(expression.l)} - ${string(expression.r)})`;
            }
            return `${string(expression.l)} - ${string(expression.r)}`;
        case types.mul:
            if (precesdence > 1) {
                return `(${string(expression.l),1} * ${string(expression.r,1)})`;
            }
            return `${string(expression.l,1)} * ${string(expression.r,1)}`;
        case types.div:
            if (precesdence > 1) {
                return `(${string(expression.l,1)} / ${string(expression.r,1)})`;
            }
            return `${string(expression.l,1)} / ${string(expression.r,1)}`;
        case types.exp:
            if (precesdence > 2) {
                return `(${string(expression.l,2)} ^ ${string(expression.r,2)})`;
            }
            return `${string(expression.l,2)} ^ ${string(expression.r,2)}`;
        case types.eval_func:
        case types.defined_func:
            return `${expression.funct.name}(${string(expression.param)})`;
        case types.var:
            return `${expression.name}`;
        case types.const:
            switch (expression.valType) {
                case valTypes.num:
                    return math.complex.string(expression.val);
                case valTypes.vec:
                    if (expression.val.length >= 1) {
                        out += `{${string(expression.val[0])}`;
                        for (var i = 1; i < expression.val.length; i++) {
                            out += `, ${string(expression.val[i])}`;
                        }
                        out += `}`;
                    }
                    break;
                case valTypes.mat:
                    break;
            }
            break;
        case types.equ:
            return `${string(expression.l)} = ${string(expression.r)}`;
        case types.flat_add:
            expression.child.forEach((e, i) => {
                out += string(e)
                if (i != expression.child.length - 1) {
                    out += " + ";
                }
            })
            return out;
        case types.flat_mult:
            expression.child.forEach((e, i) => {
                out += string(e)
                if (i != expression.child.length - 1) {
                    out += " * ";
                }
            })
            return out;
    }
    return out;
}

/**
 * 
 * @param {[String]} tokens 
 */
const parseEquation = (tokens) => {
    var i = tokens.findIndex((e) => { return e === "="; });

    const front = parse(tokens.slice(0, i));


    const expression = parse(tokens.slice(i + 1));

    return {
        type: types.equ,
        l: front,
        r: expression,
    }
}


/**
 * 
 * @param {Expression} expression
 * @returns {Expression}
 */
const clean = (expression) => {
    var l, r, lc, rc;
    var child = [];
    switch (expression.type) {
        case types.add:
            l = clean(expression.l);
            r = clean(expression.r);
            lc = l.type === types.const;
            rc = r.type === types.const;
            if (rc && math.complex.zero(r.val)) {
                return l;
            }
            if (lc && math.complex.zero(l.val)) {
                return r;
            }

            return {
                type: types.add,
                l: l,
                r: r,
            }
        case types.sub:
            l = clean(expression.l);
            r = clean(expression.r);
            lc = l.type === types.const;
            rc = r.type === types.const;
            if (rc && math.complex.zero(r.val)) {
                return l;
            }
            if (lc && math.complex.zero(l.val)) {
                return {
                    type: types.mul,
                    l: num(-1),
                    r: r,
                };
            }

            return {
                type: types.sub,
                l: l,
                r: r,
            }
        case types.mul:
            l = clean(expression.l);
            r = clean(expression.r);
            lc = l.type === types.const;
            rc = r.type === types.const;
            if (rc && math.complex.zero(r.val)) {
                return num(0);
            }
            if (lc && math.complex.zero(l.val)) {
                return num(0);
            }
            if (rc && math.complex.eql(r.val, math.complex.real(1))) {
                return l;
            }
            if (lc && math.complex.eql(l.val, math.complex.real(1))) {
                return r;
            }


            return {
                type: types.mul,
                l: l,
                r: r,
            }
        case types.div:
            l = clean(expression.l);
            r = clean(expression.r);
            lc = l.type === types.const;
            rc = r.type === types.const;
            if (rc && math.complex.zero(r.val)) {
                return num(NaN);
            }
            if (lc && math.complex.zero(l.val)) {
                return num(0);
            }
            if (rc && math.complex.eql(r.val, math.complex.real(1))) {
                return l;
            }


            return {
                type: types.div,
                l: l,
                r: r,
            }
        case types.var:
            return expression;
        case types.eval_func:
        case types.defined_func:
            expression.param = clean(expression.param);
            return expression;
        case types.exp:
            l = clean(expression.l);
            r = clean(expression.r);
            lc = l.type === types.const;
            rc = r.type === types.const;
            if (lc && math.complex.eql(l.val, math.complex.real(1))) {
                return num(1);
            } else if (lc && math.complex.zero(l.val)) {
                if (rc && math.complex.zero(r.val)) {
                    return num(NaN);
                }
                return num(0);
            }

            return {
                type: types.exp,
                l: l,
                r: r,
            }
        case types.equ:
            return {
                type: types.equ,
                l: clean(expression.l),
                r: clean(expression.r),
            }
        case types.const:
            return expression;
        case types.flat_add:
            expression.child.forEach((e, i) => {
                e = clean(e);
                if (!(e.type == types.const && math.complex.zero(e.val))) {
                    child.push(e);
                }
            })
            return {
                type: types.flat_add,
                child: child
            };
        case types.flat_mult:
            const bruh = expression.child.map((e) => { return clean(e) });
            if (bruh.some((e) => { return e.type == types.const && math.complex.zero(e.val) })) {
                return num(0, 0);
            }
            expression.child.forEach((e, i) => {
                if (!(e.type == types.const && math.complex.eql(e.val, math.complex.real(1)))) {
                    child.push(e);
                }
            })
            return {
                type: types.flat_mult,
                child: child
            };
    }
}




/**
 * 
 * @param {Expression} a 
 * @param {Expression} b 
 */
const equal = (a, b) => {
    if (a.type != b.type) return false;


}






const simplify = (exp) => {
    exp = flatten(clean(exp));
    console.log(exp);
    return evaluateArithmetic(exp);
};


const flatten = (expression) => {

    const res = [];

    const search = (e, query = () => { return false }) => {
        console.log(e);
        if (query(e)) {
            search(e.l, query);
            search(e.r, query);
        } else {
            res.push(e);
        }
    }

    var l, r, lc, rc;
    switch (expression.type) {
        case types.add:
            search(expression, (e) => { return e.type == types.add });
            return {
                type: types.flat_add,
                child: res.map((e) => flatten(e))
            };
        case types.mul:
            search(expression, (e) => { return e.type == types.mul });
            return {
                type: types.flat_mult,
                child: res.map((e) => flatten(e))
            };
        case types.div:
        case types.sub:
            l = flatten(expression.l);
            r = flatten(expression.r);
            return {
                type: expression.type,
                l: l,
                r: r,
            };
        case types.eval_func:
        case types.defined_func:
            expression.param = clean(expression.param);
            return expression;
        case types.exp:
            l = flatten(expression.l);
            r = flatten(expression.r);
            return {
                type: types.pow,
                l: l,
                r: r,
            };
        case types.var:
        case types.equ:
        case types.const:
            return expression;
    }
}


const evaluateArithmetic = (expression) => {
    var l, r, lc, rc;
    var child = [];
    switch (expression.type) {
        case types.add:
            l = evaluateArithmetic(expression.l);
            r = evaluateArithmetic(expression.r);
            lc = l.type === types.const;
            rc = r.type === types.const;
            if (rc && lc) {
                return numc(math.complex.add(l.val, r.val));
            }
            return {
                type: types.add,
                l: l,
                r: r,
            };
        case types.sub:
            l = evaluateArithmetic(expression.l);
            r = evaluateArithmetic(expression.r);
            lc = l.type === types.const;
            rc = r.type === types.const;
            if (rc && lc) {
                return numc(math.complex.sub(l.val, r.val));
            }
            return {
                type: types.sub,
                l: l,
                r: r,
            };
        case types.mul:
            l = evaluateArithmetic(expression.l);
            r = evaluateArithmetic(expression.r);
            lc = l.type === types.const;
            rc = r.type === types.const;
            if (rc && lc) {
                return numc(math.complex.mul(l.val, r.val));
            }
            return {
                type: types.mul,
                l: l,
                r: r,
            };
        case types.div:
            l = evaluateArithmetic(expression.l);
            r = evaluateArithmetic(expression.r);
            lc = l.type === types.const;
            rc = r.type === types.const;
            if (rc && lc) {
                return numc(math.complex.div(l.val, r.val));
            }
            return {
                type: types.div,
                l: l,
                r: r,
            };
        case types.eval_func:
        case types.defined_func:
            expression.param = clean(expression.param);
            return expression;
        case types.exp:
            l = evaluateArithmetic(expression.l);
            r = evaluateArithmetic(expression.r);
            lc = l.type === types.const;
            rc = r.type === types.const;
            if (lc && rc) {
                return numc(math.complex.pow(l.val, r.val));
            }
            return {
                type: types.pow,
                l: l,
                r: r,
            };
        case types.var:
        case types.equ:
        case types.const:
            return expression;
        case types.flat_add:
            var sum = math.complex.real(0);
            expression.child.forEach((e) => {
                e = evaluateArithmetic(e);
                if (e.type == types.const) {
                    sum = math.complex.add(sum, e.val);
                } else {
                    child.push(e);
                }
            });
            if (child.length == 0) {
                return numc(sum);
            }
            if (!math.complex.zero(sum)) {
                child.push(numc(sum));
            }
            return {
                type: types.flat_add,
                child: child,
            };
        case types.flat_mult:
            var prod = math.complex.real(1);
            expression.child.forEach((e) => {
                e = evaluateArithmetic(e);
                if (e.type == types.const) {
                    prod = math.complex.mul(prod, e.val);
                } else {
                    child.push(e);
                }
            });

            if (child.length == 0) {
                return numc(prod);
            }
            if (math.complex.zero(prod)) {
                return num(0, 0);
            }
            if (!math.complex.eql(prod, math.complex.real(1))) {
                child.push(numc(prod));
            }
            return {
                type: types.flat_mult,
                child: child,
            };
    }

}








module.exports = {
    types: types,
    valTypes: valTypes,
    parse: (source) => {
        return parse(tokenize(source));
    },
    tokenize: (source) => {
        return tokenize(source);
    },
    evaluate: (source) => {
        return evaluate(parse(tokenize(source)));
    },
    clean: clean,
    string: string,
    //variables: variables,
    num: num,
    simplify: simplify,
    flatten: flatten
};