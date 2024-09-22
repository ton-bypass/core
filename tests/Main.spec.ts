import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Cell, toNano } from '@ton/core';
import { Main } from '../wrappers/Main';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';

describe('main.fc contract tests', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('Main');
    });

    let blockchain: Blockchain;
    let main: SandboxContract<Main>;

    let deploy: SandboxContract<TreasuryContract>;
    let owner: SandboxContract<TreasuryContract>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        owner = await blockchain.treasury('ownerWallet');
        deploy = await blockchain.treasury('deployWallet');

        main = blockchain.openContract(
            await Main.createFromConfig(
                {
                    counter: 0,
                    some_value: 0,
                    address: owner.address,
                    owner_address: owner.address,
                },
                code,
            ),
        );
    });

    it('should deploy', async () => {
        const deployResult = await main.sendDeploy(deploy.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deploy.address,
            to: main.address,
            deploy: true,
            success: true,
        });

        const data = await main.getData();
        expect(data.number).toEqual(1);
    });

    it('should incremnet', async () => {
        const sendIncrementResult = await main.sendIncrement(deploy.getSender(), toNano('0.05'), 79);

        expect(sendIncrementResult.transactions).toHaveTransaction({
            from: deploy.address,
            to: main.address,
            success: true,
        });

        const data = await main.getData();

        expect(data.value).toEqual(79);
    });

    it('should get the proper most recent sender address', async () => {
        const senderWallet = await blockchain.treasury('sender');
        const sentMessageResult = await main.sendIncrement(senderWallet.getSender(), toNano('0.05'), 7);

        expect(sentMessageResult.transactions).toHaveTransaction({
            from: senderWallet.address,
            to: main.address,
            success: true,
        });

        const data = await main.getData();

        expect(data.recent_sender.toString()).toBe(senderWallet.address.toString());

        expect(data.number).toEqual(1);
        expect(data.value).toEqual(7);
    });

    it('successfully deposits funds', async () => {
        const senderWallet = await blockchain.treasury('sender');

        const depositMessageResult = await main.sendDeposit(senderWallet.getSender(), toNano('5'));

        expect(depositMessageResult.transactions).toHaveTransaction({
            from: senderWallet.address,
            to: main.address,
            success: true,
        });

        const balanceRequest = await main.getBalance();

        expect(balanceRequest.number).toBeGreaterThan(toNano('4.99'));
    });

    it('should return deposit funds as no command is sent', async () => {
        const senderWallet = await blockchain.treasury('sender');

        const depositMessageResult = await main.sendNoCodeDeposit(senderWallet.getSender(), toNano('5'));

        expect(depositMessageResult.transactions).toHaveTransaction({
            from: main.address,
            to: senderWallet.address,
            success: true,
        });

        const balanceRequest = await main.getBalance();

        expect(balanceRequest.number).toBe(0);
    });

    it('successfully withdraws funds on behalf of owner', async () => {
        const senderWallet = await blockchain.treasury('sender');

        await main.sendDeposit(senderWallet.getSender(), toNano('5'));

        const withdrawalRequestResult = await main.sendWithdrawalRequest(
            owner.getSender(),
            toNano('0.05'),
            toNano('1'),
        );

        expect(withdrawalRequestResult.transactions).toHaveTransaction({
            from: main.address,
            to: owner.address,
            success: true,
            value: toNano(1),
        });
    });

    it('fails to withdraw funds on behalf of non-owner', async () => {
        const senderWallet = await blockchain.treasury('sender');

        await main.sendDeposit(senderWallet.getSender(), toNano('5'));

        const withdrawalRequestResult = await main.sendWithdrawalRequest(
            senderWallet.getSender(),
            toNano('0.5'),
            toNano('1'),
        );

        expect(withdrawalRequestResult.transactions).toHaveTransaction({
            from: senderWallet.address,
            to: main.address,
            success: false,
            exitCode: 103,
        });
    });

    it('fails to withdraw funds because lack of balance', async () => {
        const withdrawalRequestResult = await main.sendWithdrawalRequest(owner.getSender(), toNano('0.5'), toNano('1'));

        expect(withdrawalRequestResult.transactions).toHaveTransaction({
            from: owner.address,
            to: main.address,
            success: false,
            exitCode: 104,
        });
    });

    it('should execute', async () => {
        const withdrawalRequestResult = await main.sendExecute(owner.getSender(), toNano('0.5'));

        expect(withdrawalRequestResult.transactions).toHaveTransaction({
            from: owner.address,
            to: main.address,
            success: true,
            exitCode: 0,
        });
    });

    it('should not execute', async () => {
        const senderWallet = await blockchain.treasury('sender');

        const withdrawalRequestResult = await main.sendExecute(senderWallet.getSender(), toNano('0.5'));

        expect(withdrawalRequestResult.transactions).toHaveTransaction({
            from: senderWallet.address,
            to: main.address,
            success: false,
            exitCode: 103,
        });
    });
});
