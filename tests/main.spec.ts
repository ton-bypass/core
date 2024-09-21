import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Cell, beginCell, storeStateInit, StateInit, toNano } from '@ton/core';
import { Init } from '../wrappers/Init';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';

describe('main.fc contract tests', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('Init');
    });

    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let init: SandboxContract<Init>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        const initAddress = await blockchain.treasury("initAddress");

        init = blockchain.openContract(Init.createFromConfig({
            number: 0,
            address: initAddress.address,
        }, code));

        deployer = await blockchain.treasury('deployer');

        const deployResult = await init.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: init.address,
            deploy: true,
            success: true,
        });
    });

    it('should incremnet', async () => {
        const sentMessageResult = await init.sendIncrement(deployer.getSender(), toNano('0.05'), 1);

        expect(sentMessageResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: init.address,
            success: true,
        });

        const data = await init.getData();
        expect(data.recent_sender.toString()).toBe(deployer.address.toString());
    });
});
