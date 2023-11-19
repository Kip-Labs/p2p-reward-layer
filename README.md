
Peer to peer caching layer that rewards peers for distributed file sharing.


### Description

This project connects clients in a peer-to-peer network in the browser.
Users can request files from a central server that contains a list of which peers have the file, and the server then tells the peers that have the files to send the file to the requesting peer. 
The peers receive a reward on the polygon network based on the files that they have shared this way.
The goal is to build a foundation for the decentralization of the backend of the metaverse based on the issues we have faced while developing our project kip.xyz

### How it's made

This project uses peerjs to connect clients in a peer-to-peer network via WebRTC. Interaction with the server happens via Websockets to announce when users connect and when they have requested or received files. We wrote a solidity contract for the reward layer and deployed it to the polygon network.

### Development

Run server:
```npm run start```

Compile contract:
```npx hardhat compile```

Test contract:
```npx hardhat test```

Deploy contract:
```npx hardhat run scripts/deploy.js --network polygon_mumbai```

Run peerjs server:
```npm install -g peer; npx peerjs --port 443 --key peerjs --path /peerapp```
