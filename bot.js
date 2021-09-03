const discordjs = require("discord.js");


const token = `NjI1NDE5MDE3Mjc1ODM0NDA0.XYfQ2Q.b7W-EFRxvHzMuOTCyFsROlh_htU`;

var wake = ".math"


const client = new discordjs.Client();

client.on("ready", () => {

});

client.on("message", (msg) => {
    const args = msg.content.match(/(\w+)/g);

    if(args.shift() === wake){

        

    }
});

client.login(token);