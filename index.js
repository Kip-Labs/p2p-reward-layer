// const QuickNode = require('@quicknode/sdk');
// // if you are using ESM style imports, use this line instead:
// // import QuickNode from '@quicknode/sdk';

// const core = new QuickNode.Core({
//   endpointUrl: 'https://prettiest-proud-moon.matic-testnet.quiknode.pro/20620a99300648fc0231616b3aede2f47f8671b9/',
// })

// core.client.getBlockNumber().then(currentBlockNumber => {
//     console.log(currentBlockNumber)
// })

require('dotenv').config();
var ethers = require('ethers');  
var provider = new ethers.JsonRpcProvider(process.env.NODE_URL);    //url);
provider.getBlockNumber().then((result) => {
    console.log("Current block number: " + result);
});

// initiating a new Wallet, passing in our private key to sign transactions
let privatekey = process.env.PRIVATE_KEY;
let wallet = new ethers.Wallet(privatekey, provider);

// print the wallet address
console.log("Using wallet address " + wallet.address);

// const { TestContract } = require('./scripts/contract_tester.js');
// TestContract(wallet);


const express = require("express");
const http = require("http");
const path = require("path");
const app = express();
const server = http.createServer(app);
const { ExpressPeerServer } = require("peer");
const port = process.env.PORT || "8000";
const { Server } = require("socket.io");
const io = new Server(server);

const peerServer = ExpressPeerServer(server, {
    proxied: true,
    debug: true,
    path: "/peerapp",
    ssl: {},
});

app.use(peerServer);

app.use(express.static(path.join(__dirname)));

app.get("/", (request, response) => {
    response.sendFile(`${__dirname}/index.html`);
});

server.listen(port, () => {
    console.log('listening on *:3000');
});

var all_players = new Map();

const {
    v4: uuidv4,
} = require('uuid');
io.on('connection', (socket) => {
    let player_id = uuidv4();
    socket.player_id = player_id;
    console.log('A user connected via WS: ' + player_id);

    socket.emit('peer_id_list', Array.from(all_players.values()));

    let peer_id = null;
    socket.on('peer_id', (msg) => {
        peer_id = msg;
        console.log('on peer_id: ' + peer_id);

        all_players.set(player_id, peer_id);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected on WS: ' + player_id);
        all_players.delete(player_id);
    });
});