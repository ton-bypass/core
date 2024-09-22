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
    let mainContract: SandboxContract<MainContact>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        const initWallet = await blockchain.treasury('initWallet');
        const ownerWallet = await blockchain.treasury('ownerWallet');

        mainContract = blockchain.openContract(
            await MainContact.createFromConfig(
                {
                    number: 0,
                    address: initWallet.address,
                    owner_address: ownerWallet.address,
                },
                code,
            ),
        );

        deployer = await blockchain.treasury('deployer');

        const deployResult = await mainContract.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: mainContract.address,
            deploy: true,
            success: true,
        });
    });

    it('should incremnet', async () => {
        const sentMessageResult = await mainContract.sendIncrement(deployer.getSender(), toNano('0.05'), 1);

        expect(sentMessageResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: mainContract.address,
            success: true,
        });

        const data = await mainContract.getData();
        expect(data.recent_sender.toString()).toBe(deployer.address.toString());
    });

    it('should get the proper most recent sender address', async () => {
        const senderWallet = await blockchain.treasury('sender');

        const sentMessageResult = await mainContract.sendIncrement(senderWallet.getSender(), toNano('0.05'), 1);

        expect(sentMessageResult.transactions).toHaveTransaction({
            from: senderWallet.address,
            to: mainContract.address,
            success: true,
        });

        const data = await mainContract.getData();

        expect(data.recent_sender.toString()).toBe(senderWallet.address.toString());
        expect(data.number).toEqual(2);
    });

    it('successfully deposits funds', async () => {
        // test logic is coming
    });
    it('should return deposit funds as no command is sent', async () => {
        // test logic is coming
    });
    it('successfully withdraws funds on behalf of owner', async () => {
        // test logic is coming
    });
    it('fails to withdraw funds on behalf of non-owner', async () => {
        // test logic is coming
    });
    it('fails to withdraw funds because lack of balance', async () => {
        // test logic is coming
    });
});
