import { toNano } from '@ton/core';
import { MainContact } from '../wrappers/MainContract';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const init = provider.open(MainContact.createFromConfig({}, await compile('Init')));

    await init.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(init.address);

    // run methods on `init`
}
