import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from '@ton/core';

export type InitConfig = {};

export function initConfigToCell(config: InitConfig): Cell {
    return beginCell().endCell();
}

export class Init implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new Init(address);
    }

    static createFromConfig(config: InitConfig, code: Cell, workchain = 0) {
        const data = initConfigToCell(config);
        const init = { code, data };
        return new Init(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }
}
