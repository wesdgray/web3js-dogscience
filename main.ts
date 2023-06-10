import { Web3 } from 'web3';
import { Web3Account } from 'web3-eth-accounts';
import { readFile } from 'fs/promises';
import { randomBytes } from 'crypto';

function make_account(web3: Web3): Web3Account {
    let account = web3.eth.accounts.create();
    return account;
}
function new_address(): string {
    return "0x" + randomBytes(32).toString("hex");
}

async function main() {
    const web3 = new Web3("https://rpc.sepolia.org");
    web3.eth.accounts.create()
    // get my previously generated private keys and instantiate as accounts
    let private_keys = await readFile("./privatekeys", "utf-8").then(a => a.split("\n").slice(0, -1));
    let accounts = private_keys.map(k => web3.eth.accounts.privateKeyToAccount(k));

    // Get balance of all accounts
    let balance_req = accounts.map(a => web3.eth.getBalance(a.address));
    let results = await Promise.all(balance_req);
    console.log("All Account Balances");
    console.table(results);

    // Get some blocks and print them 
    // by number and tag
    let blocks_request = [
        web3.eth.getBlock(0),
        web3.eth.getBlock("earliest"),
        web3.eth.getBlock("latest"),
        web3.eth.getBlock("pending"),
        web3.eth.getBlock("finalized"),
        web3.eth.getBlock("safe")
    ]

    let blocks = await Promise.all(blocks_request);
    console.table(blocks, ["number", "hash"])
    // console.table(blocks.map(b => {
    //     const { number, hash } = b;
    //     return { number, hash };
    // }));

    let i = 0;
}

main();