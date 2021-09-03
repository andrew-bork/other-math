const test = `


`;


/**
 * @typedef {{name: string, properties: Map<string, string>, orders: Map<string, order>} Bill
 * @typedef {{name: string, requirements: [{name:string, type:string}], executive: boolean, returns: string, native: boolean, directsubstitution: string|null}} Order
 */

const StdLib = {
    show: {
        name: "show",
        requirements: [{ name: "shown", type: "word" }],
        executive: true,
        returns: "nothing",
        native: true,
        directsubstitution: "console.log($shown)"
    }
}

function compile(source) {
    // Tokenize

    const tokenize = (source) => {
        const regex = (/\"[^\"]*\"|\+(\+|=){0,1}|-(-|>|=){0,1}|\/|\*|\)|\(|-|{|}|;|<|>|\w+/g);
        return source.match(regex);
    }

    console.log(tokenize(source));

    // Translate

    const translate = (tokens) => {
        const executive = {
            orders: {},
            variables: {},
        };

        var i = 0;
        while (i < tokens.length) {
            if (i == )
        }


    }
}

compile(test);