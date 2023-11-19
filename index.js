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

const { RewardUser } = require('./scripts/contract_tester.js');


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
    console.log('listening on *:' + port);
});

var player_to_peer_map = new Map();
var files_to_peers_map = new Map();
var peers_to_sockets_map = new Map();
var peer_to_wallets_map = new Map();
var peer_to_rewards_map = new Map();

const {
    v4: uuidv4,
} = require('uuid');
io.on('connection', (socket) => {
    let player_id = uuidv4();
    socket.player_id = player_id;
    console.log('A user connected via WS: ' + player_id);

    socket.emit('peer_id_list', Array.from(player_to_peer_map.values()));

    let peer_id = null;
    let peer_wallet = null;

    socket.on('setup', (msg) => {
        peer_id = msg.peer_id;
        peer_wallet = msg.wallet;
        console.log('on setup: ' + msg);

        player_to_peer_map.set(player_id, peer_id);
        peers_to_sockets_map.set(peer_id, socket.id);
        peer_to_wallets_map.set(peer_id, peer_wallet);
        peer_to_rewards_map.set(peer_id, 0);
        // console.log('Socket Id: ' + socket.id + ' Peer Id: ' + peer_id);

        socket.emit('peer_id_list', Array.from(player_to_peer_map.values()));
    });

    socket.on('wallet_address', (msg) => {
        wallet_address = msg;

        // Add to mapping
    });

    socket.on('add_file', (msg) => {
        let file_url = msg;

        let users = files_to_peers_map.get(file_url);
        if (users == null) {
            users = [];
        }

        if (users.includes(peer_id)) {
            return;
        }

        users.push(peer_id);

        files_to_peers_map.set(file_url, users);
        console.log("Added file '" + truncate(file_url, 20) + "' for peer " + peer_id);
    });

    socket.on('request_file', (msg) => {
        let file_url = msg;

        // Look among peers if they have the files
        let users = files_to_peers_map.get(file_url);
        // If so then that peer should send it to the person requesting it
        if (users != null) {
            console.log("Found file '" + truncate(file_url, 20) + "' for peer " + peer_id);
            /// look for file if available, start at the index for the last request
            for (let i = 0; i < users.length; i++) {
                this.index = (this.index + 1) % users.length;

                let socket_id = peers_to_sockets_map.get(users[i]);
                // console.log("Sending to socket ID " + socket_id + " for peer " + peer_id + " for file " + file_url);
                io.to(socket_id).emit('send_file', { 'file_url': file_url, 'peer_id': peer_id });

                peer_to_rewards_map.set(users[i], peer_to_rewards_map.get(users[i]) + 1);
                return;
            }
        }

        let all_peers = Array.from(player_to_peer_map.values())
        // if (all_peers.length <= 3) {
        if (true) {
            console.log("File '" + truncate(file_url, 20) + "' not found for peer " + peer_id + ", requesting from all peers");
            /// Cache the file on all peers
            console.log("Sending to all peers count " + all_peers.length)
            for (let i = 0; i < all_peers.length; i++) {
                let _peer_id = all_peers[i]
                if(_peer_id == peer_id) continue;
                let socket_id = peers_to_sockets_map.get(_peer_id);
                // console.log("Sending to socket ID " + socket_id + " for peer " + peer_id + " for file " + file_url);
                io.to(socket_id).emit('send_file', { 'file_url': file_url, 'peer_id': peer_id });
                
                // Request tokens to be sent to wallet of this peer based on the file
                peer_to_rewards_map.set(_peer_id, peer_to_rewards_map.get(_peer_id) + 1);
            }
        }
        // else {
        //     /// get the three peers with the least amount of used memory to cache the file
        //     let indices = [];
        //     indices[0] = -1;
        //     indices[1] = -1;
        //     indices[2] = -1;
        //     let mins = [];
        //     mins[0] = 9999999999;
        //     mins[1] = 9999999999;
        //     mins[2] = 9999999999;
        //     for (let i = 0; i < this.peers.length; i++) {
        //         let mem = this.peers[i].usedMemory;
        //         if (mem < mins[0]) {
        //             mins[2] = mins[1];
        //             indices[2] = indices[1];
        //             mins[1] = mins[0];
        //             indices[1] = indices[0];
        //             mins[0] = mem;
        //             indices[0] = i;
        //         }
        //         else if (mem < mins[1]) {
        //             mins[2] = mins[1];
        //             indices[2] = indices[1];
        //             mins[1] = mem;
        //             indices[1] = i;
        //         }
        //         else if (mem < mins[2]) {
        //             mins[2] = mem;
        //             indices[2] = i;
        //         }
        //     }
        //     for (let i = 0; i < 3; i++) {
        //         if (indices[i] < 0) break;
        //         this.peers[indices[i]].GetFile(file_url).then(file => {
        //             if (gotFile == false) {
        //                 gotFile = true;
        //                 resolve(file);
        //             }
        //         });
        //     }
        // }
    });

    socket.on('request_reward', (msg) => {
        console.log("> User requested reward");
        /// reward all users then reset
        let all_peers = Array.from(peer_to_rewards_map.keys());
        console.log(peer_to_rewards_map)
        // console.log(all_peers)
        for(let i = 0; i < all_peers.length; i++)
        {
            // console.log("Try rewarding peer " + all_peers[i]);
            let _peer_id = all_peers[i];
            let peer_reward = peer_to_rewards_map.get(_peer_id);
            if (peer_reward <= 0) {
                // console.log("Peer " + _peer_id + " has no reward");
                continue;
            }
            let peer_address = peer_to_wallets_map.get(_peer_id);
            RewardUser(wallet, peer_address, peer_reward);
            peer_to_rewards_map[_peer_id] = 0;
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected on WS: ' + player_id);
        player_to_peer_map.delete(player_id);
        socket.emit('peer_id_list', Array.from(player_to_peer_map.values()));
    });
});

function truncate(str, n) {
    return (str.length > n) ? str.slice(0, n - 1) + '...' : str;
};