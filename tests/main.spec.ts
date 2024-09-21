import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Cell, toNano } from '@ton/core';
import { Init } from '../wrappers/Init';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';

describe('main.fc contract tests', () => {
    let code: Cell;

    // beforeAll(async () => {
    //     code = await compile('Init');
    // });

    // let blockchain: Blockchain;
    // let deployer: SandboxContract<TreasuryContract>;
    // let init: SandboxContract<Init>;

    // beforeEach(async () => {
    //     blockchain = await Blockchain.create();

    //     init = blockchain.openContract(Init.createFromConfig({}, code));

    //     deployer = await blockchain.treasury('deployer');

    //     const deployResult = await init.sendDeploy(deployer.getSender(), toNano('0.05'));

    //     expect(deployResult.transactions).toHaveTransaction({
    //         from: deployer.address,
    //         to: init.address,
    //         deploy: true,
    //         success: true,
    //     });
    // });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and init are ready to use
    });
});
