const test = `

public static void main(String[] args){

    String hello = "Hello world!";

}

`;

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