import { Block, DataFormat, FMT_BYTES, FMT_NUMBER, Numbers, Web3 } from "web3";
import {
    Web3Account,
    FeeMarketEIP1559TxData,
    TxData,
    TxOptions,
    TransactionFactory,
    Common,
} from "web3-eth-accounts";
import { readFile, open, FileHandle } from "fs/promises";
import { randomBytes } from "crypto";
import { getTransactionCount, getChainId } from "web3-eth";
import { toWei, toBigInt, hexToBytes } from "web3-utils";

function make_account(web3: Web3): Web3Account {
    let account = web3.eth.accounts.create();
    return account;
}

async function new_private_key(paranoid: boolean = true): Promise<string> {
    if (paranoid) {
        let bytes: Buffer = Buffer.alloc(32);
        let file: FileHandle | undefined;
        try {
            file = await open("/dev/random", "r");
            await file.read(bytes, 0, 32);
        } finally {
            await file?.close();
        }
        return "0x" + bytes.toString("hex");
    } else {
        return "0x" + randomBytes(32).toString("hex");
    }
}

async function create_transaction(
    web3: Web3,
    from_address: string,
    to_address: string,
    value: Numbers,
    gas_limit: bigint = 21000n,
    max_fee_per_gas: bigint = toBigInt(toWei(17, "gwei")),
    max_priority_fee_per_gas: bigint = toBigInt(toWei(1, "gwei"));
) {
    let format: DataFormat = {
        number: FMT_NUMBER.BIGINT,
        bytes: FMT_BYTES.UINT8ARRAY,
    };
    const chain_id = await getChainId(web3, format);

    let tx_data: FeeMarketEIP1559TxData = {
        chainId: chain_id,
        gasLimit: gas_limit,
        maxFeePerGas: max_fee_per_gas,
        maxPriorityFeePerGas: max_priority_fee_per_gas,
        to: to_address,
        nonce: await getTransactionCount(web3, from_address, "latest", format),
        type: 2, // no enum for this :-(
        value: value,
    };
    let tx_common: Common = new Common({ chain: chain_id });
    let tx_opts: TxOptions = {
        common: tx_common,
        freeze: true,
    };
    return TransactionFactory.fromTxData(tx_data, tx_opts);
}

async function main() {
    let paranoid = await new_private_key();
    let relaxed = await new_private_key(false);
    const web3 = new Web3("https://rpc.sepolia.org");

    web3.eth.accounts.create();
    // get my previously generated private keys and instantiate as accounts
    let private_keys = await readFile("./privatekeys", "utf-8").then((a) =>
        a.split("\n").slice(0, -1)
    );
    let accounts: Web3Account[] = private_keys.map((k) =>
        web3.eth.accounts.privateKeyToAccount(k)
    );

    // Get balance of all accounts
    let balance_req = accounts.map((a) => web3.eth.getBalance(a.address));
    let results = await Promise.all(balance_req);
    console.log("All Account Balances");
    console.table(results);

    // Get some blocks and print them
    // by number and tag
    let blocks_request: Promise<Block>[] = [
        web3.eth.getBlock(0),
        web3.eth.getBlock("earliest"),
        web3.eth.getBlock("latest"),
        web3.eth.getBlock("pending"),
        web3.eth.getBlock("finalized"),
        web3.eth.getBlock("safe"),
    ];

    let blocks = await Promise.all(blocks_request);
    console.table(blocks, ["number", "hash"]);

    // Create a transaction
    const amount = toBigInt(toWei("0.0001", "ether"));
    const tx = await create_transaction(
        web3,
        accounts[0].address,
        accounts[1].address,
        amount
    );
    let i = 0;

    // Sign a transaction
    const signed_tx = tx.sign(hexToBytes(accounts[0].privateKey));
    // Submit a transaction
    signed_tx.validate();
    signed_tx.verifySignature();
    let receipt = web3.eth.sendSignedTransaction(signed_tx.serialize());
    console.log(receipt);
    i = 0;
    // Create a transaction without enough gas limit and handle it
    const tx_lowgas = await create_transaction(
        web3,
        accounts[0].address,
        accounts[1].address,
        amount,
        10000n
    );
    const signed_tx_lowgas = tx_lowgas.sign(hexToBytes(accounts[0].privateKey));

    let receipt_low = await web3.eth.sendSignedTransaction(
        signed_tx_lowgas.serialize()
    );
    i = 0;
}

main();
