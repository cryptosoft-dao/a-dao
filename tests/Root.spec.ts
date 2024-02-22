import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { beginCell, Cell, Dictionary, toNano, TransactionDescriptionGeneric } from '@ton/core';
import { buildAdminContent, buildOrderContent, buildResponseContent, buildUserContent } from './utils/buildContent';
import { Root } from '../wrappers/Root';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';

describe('Root', () => {

    let code: Cell;

    beforeAll(async () => {

        code = await compile('Root');

    });

    let blockchain: Blockchain;
    let root: SandboxContract<Root>;
    let firstMember: SandboxContract<TreasuryContract>;
    let econdMember: SandboxContract<TreasuryContract>;
    let thirdMember: SandboxContract<TreasuryContract>;


    beforeEach(async () => {

        blockchain = await Blockchain.create();

        // Storage

        const MaxMembers = BigInt(255);
        const AgreementPercent = BigInt(100);
        const Members = Dictionary.empty<bigint, Cell>();
        const TotalVoices = 1;
        const TotalRevenuePoints = 10;
        const Votings = Dictionary.empty<bigint, Cell>();

        beforeEach(async () => {

            blockchain.now = 1708621037;
            
        });


    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and root are ready to use
    });
});
