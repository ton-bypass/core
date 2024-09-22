import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Cell, beginCell, storeStateInit, StateInit, toNano } from '@ton/core';
import { MainContact } from '../wrappers/MainContract';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';

describe('main.fc contract tests', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('MainContract');
    });

    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let main: SandboxContract<MainContact>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        const initAddress = await blockchain.treasury("initAddress");

        main = blockchain.openContract(MainContact.createFromConfig({
            number: 0,
            address: initAddress.address,
        }, code));

        deployer = await blockchain.treasury('deployer');

        const deployResult = await main.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: main.address,
            deploy: true,
            success: true,
        });
    });

    it('should incremnet', async () => {
        const sentMessageResult = await main.sendIncrement(deployer.getSender(), toNano('0.05'), 1);

        expect(sentMessageResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: main.address,
            success: true,
        });

        const data = await main.getData();
        expect(data.recent_sender.toString()).toBe(deployer.address.toString());
    });
});
