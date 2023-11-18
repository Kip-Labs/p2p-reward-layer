var ethers = require('ethers');  


// specifying the deployed contract address on Ropsten
let contractaddress = "0x50802059B3A299b36bc2c71aBEDBA450032f49AB";

async function TestContract(wallet)
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


exports.TestContract = TestContract;
