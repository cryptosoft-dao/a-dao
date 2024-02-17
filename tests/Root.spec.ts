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
    let secondMember: SandboxContract<TreasuryContract>;
    let thirdMember: SandboxContract<TreasuryContract>;


    beforeEach(async () => {

        blockchain = await Blockchain.create();

        const content = Dictionary.empty<bigint, Cell>();
        
        content.set(sha256Hash('category'), beginCell().storeUint(sha256Hash(data.category), 256).endCell());
        content.set(sha256Hash('category'), beginCell().storeUint(sha256Hash(data.category), 256).endCell());
        content.set(sha256Hash('category'), beginCell().storeUint(sha256Hash(data.category), 256).endCell());

        return beginCell().storeDictDirect(content, Dictionary.Keys.BigUint(256), Dictionary.Values.Cell()).endCell();

        const dao_config = beginCell().store_uint(max_dao_members, 32).store_uint(percent_for_approval, 64).endCell();

        export function buildDaoDict(data: AdminData): Cell {
            
            const content = Dictionary.empty<bigint, Cell>();
            content.set(sha256Hash('category'), beginCell().storeUint(sha256Hash(data.category), 256).endCell());
            content.set(sha256Hash('category'), beginCell().storeUint(sha256Hash(data.category), 256).endCell());
            content.set(sha256Hash('category'), beginCell().storeUint(sha256Hash(data.category), 256).endCell());
            return beginCell().storeDictDirect(content, Dictionary.Keys.BigUint(256), Dictionary.Values.Cell()).endCell();

        }

        const dao_dict = Dictionary.empty<bigint, Cell>();
        content.set(sha256Hash('category'), beginCell().storeUint(sha256Hash(data.category), 256).endCell());

        const dao_dict = beginCell().storeDictDirect(content, Dictionary.Keys.BigUint(256), Dictionary.Values.Cell()).endCell();
        content.set(sha256Hash('category'), beginCell().storeUint(sha256Hash(data.category), 256).endCell());

        const votings = beginCell().storeDictDirect(content, Dictionary.Keys.BigUint(256), Dictionary.Values.Cell()).endCell();

        root = blockchain.openContract(Root.createFromConfig({
            total_dao_users: BigInt(3),
            total_dao_strength: BigInt(0),
            config: beginCell().endCell(),
            dao_dict: Dictionary.empty<bigint, Cell>(),
            votings: Dictionary.empty<bigint, Cell>(),
        }, code));

        firstMember = await blockchain.treasury('firstMember');
        secondMember = await blockchain.treasury('secondMember');
        thirdMember = await blockchain.treasury('thirdMember');

        const deployResult = await root.sendDeploy(firstMember.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: firstMember.address,
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
