import { toNano } from '@ton/core';
import { Init } from '../wrappers/Init';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const init = provider.open(Init.createFromConfig({}, await compile('Init')));

    await init.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(init.address);

    // run methods on `init`
}
