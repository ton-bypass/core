import { toNano } from '@ton/core';
import { Bypass } from '../wrappers/Bypass';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const bypass = provider.open(
        Bypass.createFromConfig(
            {
                id: Math.floor(Math.random() * 10000),
                counter: 0,
            },
            await compile('Bypass')
        )
    );

    await bypass.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(bypass.address);

    console.log('ID', await bypass.getID());
}
