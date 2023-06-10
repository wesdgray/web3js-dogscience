from web3 import Web3, providers
from web3.types import BlockIdentifier
import json
import dataclasses
import argparse
from time import sleep

@dataclasses.dataclass
class Wallet:
    label: str
    address: str
    publickey: str
    privatekey: str


def get_height(node: Web3):
    return node.eth.get_block_number()
def get_addresses(node: Web3):
    pass
def get_block(id: BlockIdentifier, node: Web3):
    return node.eth.get_block(id)
funcs = {
    "h": get_height,
    "b": get_block
}

def main():
    w = Web3(providers.auto.load_provider_from_uri("https://ethereum-goerli.publicnode.com"))
    wallets_deserialized = None
    with open("wallets") as f:
        wallets_deserialized = f.read()
    wallets_serialized = json.loads(wallets_deserialized)
    wallets = None
    for wallet in wallets_serialized:
        w = Wallet(**wallet)
        wallets[w.label] = w

    i = ""
    while True:
        print(funcs)
        i = input("Enter Command:")
        parser = argparse.ArgumentParser()
        f, a = 
        cmd = funcs.get(i, lambda _: _)
        print(f"{cmd(w)=}")
        

if __name__ == "__main__":
    main()