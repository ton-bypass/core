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
    let mainContract: SandboxContract<MainContact>;

    let deployWallet: SandboxContract<TreasuryContract>;
    let mainWallet: SandboxContract<TreasuryContract>;
    let ownerWallet: SandboxContract<TreasuryContract>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        mainWallet = await blockchain.treasury('mainWallet');
        ownerWallet = await blockchain.treasury('ownerWallet');
        deployWallet = await blockchain.treasury('deployWallet');

        mainContract = blockchain.openContract(
            await MainContact.createFromConfig(
                {
                    counter: 0,
                    some_value: 0,
                    address: mainWallet.address,
                    owner_address: ownerWallet.address,
                },
                code,
            ),
        );
    });

    it('should deploy', async () => {
        const deployResult = await mainContract.sendDeploy(deployWallet.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployWallet.address,
            to: mainContract.address,
            deploy: true,
            success: true,
        });

        const data = await mainContract.getData();
        expect(data.number).toEqual(1);
    });

    it('should incremnet', async () => {
        const sendIncrementResult = await mainContract.sendIncrement(deployWallet.getSender(), toNano('0.05'), 79);

        expect(sendIncrementResult.transactions).toHaveTransaction({
            from: deployWallet.address,
            to: mainContract.address,
            success: true,
        });

        const data = await mainContract.getData();

        expect(data.value).toEqual(79);
    });

    it('should get the proper most recent sender address', async () => {
        const senderWallet = await blockchain.treasury('sender');
        const sentMessageResult = await mainContract.sendIncrement(senderWallet.getSender(), toNano('0.05'), 7);

        expect(sentMessageResult.transactions).toHaveTransaction({
            from: senderWallet.address,
            to: mainContract.address,
            success: true,
        });

        const data = await mainContract.getData();

        expect(data.recent_sender.toString()).toBe(senderWallet.address.toString());

        expect(data.number).toEqual(1);
        expect(data.value).toEqual(7);
    });

    it('successfully deposits funds', async () => {
        const senderWallet = await blockchain.treasury('sender');

        const depositMessageResult = await mainContract.sendDeposit(senderWallet.getSender(), toNano('5'));

        expect(depositMessageResult.transactions).toHaveTransaction({
            from: senderWallet.address,
            to: mainContract.address,
            success: true,
        });

        const balanceRequest = await mainContract.getBalance();

        expect(balanceRequest.number).toBeGreaterThan(toNano('4.99'));
    });

    it('should return deposit funds as no command is sent', async () => {
        const senderWallet = await blockchain.treasury('sender');

        const depositMessageResult = await mainContract.sendNoCodeDeposit(senderWallet.getSender(), toNano('5'));

        expect(depositMessageResult.transactions).toHaveTransaction({
            from: mainContract.address,
            to: senderWallet.address,
            success: true,
        });

        const balanceRequest = await mainContract.getBalance();

        expect(balanceRequest.number).toBe(0);
    });

    it('successfully withdraws funds on behalf of owner', async () => {
        const senderWallet = await blockchain.treasury('sender');

        await mainContract.sendDeposit(senderWallet.getSender(), toNano('5'));

        const withdrawalRequestResult = await mainContract.sendWithdrawalRequest(
            ownerWallet.getSender(),
            toNano('0.05'),
            toNano('1'),
        );

        expect(withdrawalRequestResult.transactions).toHaveTransaction({
            from: mainContract.address,
            to: ownerWallet.address,
            success: true,
            value: toNano(1),
        });
    });

    it('fails to withdraw funds on behalf of non-owner', async () => {
        const senderWallet = await blockchain.treasury('sender');

        await mainContract.sendDeposit(senderWallet.getSender(), toNano('5'));

        const withdrawalRequestResult = await mainContract.sendWithdrawalRequest(
            senderWallet.getSender(),
            toNano('0.5'),
            toNano('1'),
        );

        expect(withdrawalRequestResult.transactions).toHaveTransaction({
            from: senderWallet.address,
            to: mainContract.address,
            success: false,
            exitCode: 103,
        });
    });

    it('fails to withdraw funds because lack of balance', async () => {
        const withdrawalRequestResult = await mainContract.sendWithdrawalRequest(
            ownerWallet.getSender(),
            toNano('0.5'),
            toNano('1'),
        );

        expect(withdrawalRequestResult.transactions).toHaveTransaction({
            from: ownerWallet.address,
            to: mainContract.address,
            success: false,
            exitCode: 104,
        });
    });

    it('should execute', async () => {
        const withdrawalRequestResult = await mainContract.sendExecute(ownerWallet.getSender(), toNano('0.5'));

        expect(withdrawalRequestResult.transactions).toHaveTransaction({
            from: ownerWallet.address,
            to: mainContract.address,
            success: true,
            exitCode: 0,
        });
    });

});
