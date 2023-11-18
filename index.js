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

// specifying the deployed contract address on Ropsten
let contractaddress = "0x50802059B3A299b36bc2c71aBEDBA450032f49AB";

async function TestContract()
{
    // make an API call to the ABIs endpoint 
    const response = await fetch('https://api-testnet.polygonscan.com/api?module=contract&action=getabi&address=' + contractaddress + '&apikey=YourApiKeyToken');
    const data = await response.json();
    let abi = data.result;

    /// print the contracts inputs and outputs
    console.log(abi);

    // initiating a new Contract
    let contract = new ethers.Contract(contractaddress, abi, wallet);
    
    // calling the "retrieve" function to read the stored value
    let read = await contract.retrieve();
    console.log("Value stored in contract is " + read.toString());

    // calling the "store" function to update the value to 420
    let write = await contract.store(1337);

    // wait for 2 blocks of confirmation 
    write.wait(2).then(async () => {  
        // read the contract again, similar to above
        let read = await contract.retrieve();
        console.log("Updated value stored in contract is " + read.toString());
    });    
}

TestContract();


