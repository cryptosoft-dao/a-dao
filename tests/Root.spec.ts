import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { beginCell, Cell, Dictionary, toNano, TransactionDescriptionGeneric } from '@ton/core';
import { buildAdminContent, buildOrderContent, buildResponseContent, buildUserContent } from './utils/buildContent';
import { Root } from '../wrappers/Root';
import { RoutingPool } from '../wrappers/RoutingPool';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';

describe('Root', () => {

    const blockchainStartTime = 100;

    let blockchain: Blockchain;

    let rootCode: Cell;
    let routingPoolCode: Cell;
    
    let root: SandboxContract<Root>;
    let RoutingPool: SandboxContract<RoutingPool>;
    let Wallet0: SandboxContract<TreasuryContract>;
    let Wallet1: SandboxContract<TreasuryContract>;
    let Wallet2: SandboxContract<TreasuryContract>;
    let Wallet3: SandboxContract<TreasuryContract>;
    let Wallet4: SandboxContract<TreasuryContract>;
    let Wallet5: SandboxContract<TreasuryContract>;

    beforeAll(async () => {

        rootCode = await compile('Root');
        routingPoolCode = await compile('RoutingPool');

        Wallet0 = await blockchain.treasury('Wallet0');
        Wallet1 = await blockchain.treasury('Wallet1');
        Wallet2 = await blockchain.treasury('Wallet2');
        Wallet3 = await blockchain.treasury('Wallet3');
        Wallet4 = await blockchain.treasury('Wallet4');
        Wallet5 = await blockchain.treasury('Wallet5');

        blockchain = await Blockchain.create();
        blockchain.now = blockchainStartTime;

        // Storage

        const MaxWallets = BigInt(255);
        const AgreementPercent = BigInt(100);
        const Wallets = Dictionary.empty<bigint, Cell>();
        const TotalVoices = 1;
        const TotalRevenuePoints = 10;
        const Votings = Dictionary.empty<bigint, Cell>();

        blockchain = await Blockchain.create();
        blockchain.now = blockchainStartTime;

        root = blockchain.openContract(
            Root.createFromConfig(
                {
                    RoutingPoolDeployFee: BigInt(3000000),
                    RoutingPoolCode: routingPoolCode,
                }, 
                rootCode,
            ),
        );

        const rootDeploy = await root.sendDeploy(Wallet1.getSender(), toNano('0.05'));

        expect(rootDeploy.transactions).toHaveTransaction({
            from: Wallet1.address,
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
