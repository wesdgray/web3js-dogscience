import { Eth } from 'web3-eth';
import type { Account as Web3Account, SignedTransaction, Transaction as TypedTransaction} from 'web3-core';
import { readFile, open } from 'fs/promises';
import { randomBytes } from 'crypto';


function make_account(web3: Eth): Web3Account {
    let account = web3.accounts.create();
    return account;
}

async function new_private_key(paranoid: boolean = true): Promise<string> {
    if (paranoid) {
        let bytes = Buffer.alloc(32);
        let file = await open("/dev/random", "r");
        await file.read(bytes, 0, 32);
        file.close();
        return "0x" + bytes.toString("hex");
    }
    else {
        return "0x" + randomBytes(32).toString("hex");
    }
}

async function create_tx(account1: Web3Account, account2: w3a, provider: Eth): Promise<any> {
    // total fee = gas limit * (base fee + priority fee)
    // according to yellowpaper for a normal transaction, gas limit = 21,000
    // let data: FeeMarketEIP1559TxData = {
    //     gasLimit: 21000,
    //     nonce: await provider.eth.getTransactionCount(account1.address),
    //     maxFeePerGas: provider.utils.toWei(17, "gwei"),
    //     maxPriorityFeePerGas: provider.utils.toWei("0.07", "gwei"),
    //     value: provider.utils.toWei(100_000, "gwei")
    // }
    let data: TypedTransaction = {
        gasLimit: 21000,
        nonce: await provider.getTransactionCount(account1.address),
        maxFeePerGas: 17000000000,
        maxPriorityFeePerGas: 70000000,
        value: 100000000000000,
        chainId: await provider.getChainId(),
        to: account2.address
    }
    return data;
}

async function sign_tx(account1: Web3Account, account2: w3a, provider: Eth, tx: TypedTransaction): Promise<SignedTransaction> {
    let signed = account1.signTransaction(tx);
    return signed
}

async function main() {
    let paranoid = await new_private_key();
    let relaxed = await new_private_key(false);
    const web3 = new Eth("https://rpc.sepolia.org");
    let lib_account = web3.accounts.create();
    // get my previously generated private keys and instantiate as accounts
    let private_keys = await readFile("./privatekeys", "utf-8").then(a => a.split("\n").slice(0, -1));
    let accounts = private_keys.map(k => web3.accounts.privateKeyToAccount(k));

    // Get balance of all accounts
    let balance_req = accounts.map(a => web3.getBalance(a.address));
    let results = await Promise.all(balance_req);
    console.log("All Account Balances");
    console.table(results);

    // Get some blocks and print them 
    // by number and tag
    let blocks_request = [
        web3.getBlock(0),
        web3.getBlock("earliest"),
        web3.getBlock("latest"),
        web3.getBlock("pending"),
        web3.getBlock("finalized"),
        web3.getBlock("safe")
    ]

    let blocks = await Promise.all(blocks_request);
    console.table(blocks, ["number", "hash"])
    // console.table(blocks.map(b => {
    //     const { number, hash } = b;
    //     return { number, hash };
    // }));

    let tx = await create_tx(accounts[0], accounts[1], web3); 
    console.log(tx);
    let signed = await sign_tx(accounts[0], accounts[1], web3, tx);
    console.log(signed);
    if (signed.rawTransaction) {
        let receipt = await web3.sendSignedTransaction(signed.rawTransaction);
        console.log(receipt);
    }
    else {
        console.error("Signed transaction not well formed:\n", signed)
    }
    let i = 0;
}

main();