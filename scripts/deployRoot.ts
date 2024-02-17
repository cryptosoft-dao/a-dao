import { toNano } from '@ton/core';
import { Root } from '../wrappers/Root';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const root = provider.open(Root.createFromConfig({
        total_dao_users: BigInt,
        total_dao_strength: BigInt,
        config: 
        dao_dict:
        votings:
    }, await compile('Root')));

    await root.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(root.address);

    // run methods on `root`
}
