import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { beginCell, Cell, Dictionary, toNano, TransactionDescriptionGeneric } from '@ton/core';
import { buildAdminContent, buildOrderContent, buildResponseContent, buildUserContent } from './utils/buildContent';
import { Root } from '../wrappers/Root';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';

describe('Root', () => {

    const blockchainStartTime = 100;

    let blockchain: Blockchain;

    let rootCode: Cell;
    
    let root: SandboxContract<Root>;
    let Wallet1: SandboxContract<TreasuryContract>;
    let Wallet2: SandboxContract<TreasuryContract>;
    let Wallet3: SandboxContract<TreasuryContract>;


    beforeAll(async () => {

        rootCode = await compile('Root');
        Wallet1 = await blockchain.treasury('Wallet1');
        Wallet2 = await blockchain.treasury('Wallet2');
        Wallet3 = await blockchain.treasury('Wallet3');

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
                    MaxWallets: MaxWallets,
                    AgreementPercent: AgreementPercent,
                    Wallets: Wallets,
                    TotalVoices: TotalVoices,
                    TotalRevenuePoints: TotalRevenuePoints,
                    Votings: Votings,
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
