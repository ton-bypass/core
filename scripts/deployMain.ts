import { address, toNano } from '@ton/core';
import { Main } from '../wrappers/Main';
import { compile, NetworkProvider } from '@ton/blueprint';
import dotenv from 'dotenv';

dotenv.config();

export async function run(provider: NetworkProvider) {
    const owner_addres = process.env.OWNER_ADDRESS ? process.env.OWNER_ADDRESS : '';

    console.log(owner_addres);

    const mainContract = await Main.createFromConfig(
        {
            counter: 0,
            some_value: 0,
            address: address(owner_addres),
            owner_address: address(owner_addres),
        },
        await compile('Main'),
    );

    const openedContract = provider.open(mainContract);

    await openedContract.sendDeploy(provider.sender(), toNano('0.05'));
    await provider.waitForDeploy(openedContract.address);

    // run methods on `init`
}
