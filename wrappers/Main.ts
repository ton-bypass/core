import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from '@ton/core';
import { Opcodes } from './Opcodes';

export type MainConfig = {
    counter: number;
    some_value: number;
    address: Address;
    owner_address: Address;
};

export function mainContractConfigToCell(config: MainConfig): Cell {
    return beginCell()
        .storeUint(config.counter, 32)
        .storeUint(config.some_value, 32)
        .storeAddress(config.address)
        .storeAddress(config.owner_address)
        .endCell();
}

export class Main implements Contract {
    constructor(
        readonly address: Address,
        readonly init?: { code: Cell; data: Cell },
    ) {}

    static async createFromAddress(address: Address) {
        return new Main(address);
    }

    static async createFromConfig(config: MainConfig, code: Cell, workchain = 0) {
        const data = mainContractConfigToCell(config);
        const init = { code, data };
        const address = contractAddress(workchain, init);

        return new Main(address, init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        const msg_body = beginCell()
            .storeUint(Opcodes.counter, 32) // OP code
            .endCell();

        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: msg_body,
        });
    }

    async sendIncrement(provider: ContractProvider, sender: Sender, value: bigint, increment_by: number) {
        const msg_body = beginCell()
            .storeUint(Opcodes.increase, 32) // OP code
            .storeUint(increment_by, 32) // increment_by value
            .endCell();

        await provider.internal(sender, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: msg_body,
        });
    }

    async sendDeposit(provider: ContractProvider, sender: Sender, value: bigint) {
        const msg_body = beginCell()
            .storeUint(Opcodes.deposit, 32) // OP code
            .endCell();

        await provider.internal(sender, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: msg_body,
        });
    }

    async sendNoCodeDeposit(provider: ContractProvider, sender: Sender, value: bigint) {
        const msg_body = beginCell().endCell();

        await provider.internal(sender, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: msg_body,
        });
    }

    async sendExecute(provider: ContractProvider, sender: Sender, value: bigint) {
        const msg_body = beginCell()
            .storeUint(Opcodes.execute, 32) // OP code
            .storeRef(new Cell())
            .endCell();

        await provider.internal(sender, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: msg_body,
        });
    }

    async sendWithdrawalRequest(provider: ContractProvider, sender: Sender, value: bigint, amount: bigint) {
        const msg_body = beginCell()
            .storeUint(Opcodes.withdraw, 32) // OP code
            .storeCoins(amount)
            .endCell();

        await provider.internal(sender, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: msg_body,
        });
    }

    async getData(provider: ContractProvider) {
        const { stack } = await provider.get('get_contract_storage_data', []);
        return {
            number: stack.readNumber(),
            value: stack.readNumber(),
            recent_sender: stack.readAddress(),
            owner_address: stack.readAddress(),
        };
    }

    async getBalance(provider: ContractProvider) {
        const { stack } = await provider.get('balance', []);
        return {
            number: stack.readNumber(),
        };
    }
}
