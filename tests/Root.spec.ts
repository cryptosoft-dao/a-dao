import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Address, beginCell, Cell, Dictionary, toNano, TransactionDescriptionGeneric } from '@ton/core';
import { buildAdminContent, buildOrderContent, buildResponseContent, buildUserContent } from './utils/buildContent';
import { Root } from '../wrappers/Root';
import { RoutingPool } from '../wrappers/RoutingPool';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';
import { RootOperationCodes, RoutingPoolOperationCodes, RoutingPoolTransactionTypes } from '../wrappers/Config';

describe('Root', () => {

    const blockchainStartTime = 100;

    let blockchain: Blockchain;

    let root: SandboxContract<Root>;
    let firstRoutingPool: SandboxContract<RoutingPool>;
    let secondRoutingPool: SandboxContract<RoutingPool>;
    let Deployer: SandboxContract<TreasuryContract>;
    let Wallet0: SandboxContract<TreasuryContract>;
    let Wallet1: SandboxContract<TreasuryContract>;
    let Wallet2: SandboxContract<TreasuryContract>;
    let Wallet3: SandboxContract<TreasuryContract>;
    let Wallet4: SandboxContract<TreasuryContract>;
    let Wallet5: SandboxContract<TreasuryContract>;

    let rootCode: Cell;
    let routingPoolCode: Cell;

    beforeAll(async () => {

        rootCode = await compile('Root');
        routingPoolCode = await compile('RoutingPool');

        blockchain = await Blockchain.create();
        blockchain.now = blockchainStartTime;

        Deployer = await blockchain.treasury('Deployer')
        Wallet0 = await blockchain.treasury('Wallet0');
        Wallet1 = await blockchain.treasury('Wallet1');
        Wallet2 = await blockchain.treasury('Wallet2');
        Wallet3 = await blockchain.treasury('Wallet3');
        Wallet4 = await blockchain.treasury('Wallet4');
        Wallet5 = await blockchain.treasury('Wallet5');

        // Params

        root = blockchain.openContract(
            Root.createFromConfig(
                {
                    OwnerAddress: Deployer.address,
                    RoutingPoolCode: routingPoolCode,
                    TotalRoutingPools: BigInt(0),
                    NextRoutingPoolCreationFee: toNano('10'),
                    NextRoutingPoolTransactionFee: toNano('0'),
                }, 
                rootCode,
            ),
        );

        blockchain.setVerbosityForAddress(root.address, {
            blockchainLogs: true,
            vmLogs: 'vm_logs_full'
        })

        const rootDeployResult = await root.sendDeploy(Deployer.getSender(), toNano('10.777'));

        expect(rootDeployResult.transactions).toHaveTransaction({
            from: Deployer.address,
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
