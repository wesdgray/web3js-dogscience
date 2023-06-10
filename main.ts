import { Web3 } from 'web3';
import { Web3Account } from 'web3-eth-accounts';
import { readFile, open } from 'fs/promises';
import { randomBytes } from 'crypto';

function make_account(web3: Web3): Web3Account {
    let account = web3.eth.accounts.create();
    return account;
}
async function new_private_key(paranoid: boolean = true): Promise<string> {
    if(paranoid) {
        let bytes = Buffer.alloc(32);
        await open("/dev/random", "r").then(f => f.read(bytes, 0, 32));
        return "0x" + bytes.toString("hex");
    }
    else {
        return "0x" + randomBytes(32).toString("hex");
    }
}
async function main() {
    let paranoid = await new_private_key();
    let relaxed = await new_private_key(false);
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