Run server:
npm run start

Compile contract:
npx hardhat compile

Test contract:
npx hardhat test

Deploy contract:
npx hardhat run scripts/deploy.js --network polygon_mumbai

Run peerjs server:
npm install -g peer; npx peerjs --port 443 --key peerjs --path /peerapp
