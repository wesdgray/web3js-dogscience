import { Web3, utils} from 'web3';
import { Web3Account, Common, TransactionFactory, TxData, TxOptions, FeeMarketEIP1559Transaction, FeeMarketEIP1559TxData, Transaction, TypedTransaction, SignTransactionResult } from 'web3-eth-accounts';
import { readFile, open } from 'fs/promises';
import { randomBytes } from 'crypto';

function make_account(web3: Web3): Web3Account {
    let account = web3.eth.accounts.create();
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

async function create_tx(account1: Web3Account, account2: Web3Account, provider: Web3): Promise<TypedTransaction> {
    // total fee = gas limit * (base fee + priority fee)
    // according to yellowpaper for a normal transaction, gas limit = 21,000
    // let data: FeeMarketEIP1559TxData = {
    //     gasLimit: 21000,
    //     nonce: await provider.eth.getTransactionCount(account1.address),
    //     maxFeePerGas: provider.utils.toWei(17, "gwei"),
    //     maxPriorityFeePerGas: provider.utils.toWei("0.07", "gwei"),
    //     value: provider.utils.toWei(100_000, "gwei")
    // }
    let data: FeeMarketEIP1559TxData = {
        gasLimit: 21000,
        nonce: await provider.eth.getTransactionCount(account1.address),
        maxFeePerGas: 17000000000,
        maxPriorityFeePerGas: 70000000,
        value: 100000000000000,
        chainId: await provider.eth.getChainId(),
        to: account2.address
    }
    let t = new FeeMarketEIP1559Transaction(data);
    let tx = TransactionFactory.fromTxData(data);
    return t;
}

async function sign_tx(account1: Web3Account, account2: Web3Account, provider: Web3, tx: TypedTransaction): Promise<SignTransactionResult> {
    let signed = account1.signTransaction(tx);
    return signed
}

async function main() {
    let paranoid = await new_private_key();
    let relaxed = await new_private_key(false);
    const web3 = new Web3("https://rpc.sepolia.org");
    web3.eth.accounts.sign
    let lib_account = web3.eth.accounts.create();
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
    let tx = await create_tx(accounts[0], accounts[1], web3); 
    console.log(tx);
    let signed = await sign_tx(accounts[0], accounts[1], web3, tx);

    let i = 0;
}

main();