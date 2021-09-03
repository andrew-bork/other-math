const mj = require("mathjax-node-svg2png");
const fs = require("fs");

mj.config({});
mj.start();
mj.typeset({
    math: "x - y = 10",
    format: "TeX",
    png: true,
    scale: 24,
}, function(data) {
    if (!data.errors) {
        fs.writeFileSync("thing.png", Buffer.from(data.png.substring(22), "base64"));
    }
})