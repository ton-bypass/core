import { address, toNano } from '@ton/core';
import { MainContact } from '../wrappers/MainContract';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const mainContract = await MainContact.createFromConfig(
        {
            counter: 0,
            some_value: 0,
            address: address('EQDzUEDYegDxcx8n-AXLFZQ2MLZd5DNG3jBXzLDnwVrZeCLJ'),
            owner_address: address('EQDzUEDYegDxcx8n-AXLFZQ2MLZd5DNG3jBXzLDnwVrZeCLJ'),
        },
        await compile('MainContract'),
    );

    const openedContract = provider.open(mainContract);

    await openedContract.sendDeploy(provider.sender(), toNano('0.05'));
    await provider.waitForDeploy(openedContract.address);

    // run methods on `init`
}
