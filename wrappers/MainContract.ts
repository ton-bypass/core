import {
    Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode, StateInit,
    storeStateInit
} from '@ton/core';

export type MainContractConfig = {
    number: number;
    address: Address;
};

export function initConfigToCell(config: MainContractConfig): Cell {
    return beginCell().storeUint(config.number, 32).storeAddress(config.address).endCell();
}

export class MainContact implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) { }

    static createFromAddress(address: Address) {
        return new MainContact(address);
    }

    static createFromConfig(config: MainContractConfig, code: Cell, workchain = 0) {
        const data = initConfigToCell(config);
        const init = { code, data };
        const address = contractAddress(workchain, init);

        return new MainContact(address, init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        const msg_body = beginCell()
            .storeUint(1, 32) // OP code
            .storeUint(0, 32) // increment_by value
            .endCell();

        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: msg_body,
        });
    }

    async sendIncrement(
        provider: ContractProvider,
        sender: Sender,
        value: bigint,
        increment_by: number) {

        const msg_body = beginCell()
            .storeUint(1, 32) // OP code
            .storeUint(increment_by, 32) // increment_by value
            .endCell();

        await provider.internal(sender, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: msg_body,
        });
    }

    async getData(provider: ContractProvider) {
        const { stack } = await provider.get("get_contract_storage_data", []);
        return {
            number: stack.readNumber(),
            recent_sender: stack.readAddress(),
        };
    }
}
