import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Cell, toNano } from '@ton/core';
import { Root } from '../wrappers/Root';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';

describe('Root', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('Root');
    });

    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let root: SandboxContract<Root>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        root = blockchain.openContract(Root.createFromConfig({}, code));

        deployer = await blockchain.treasury('deployer');

        const deployResult = await root.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: root.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and root are ready to use
    });
});
