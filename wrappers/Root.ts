import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Dictionary, Sender, SendMode, toNano } from '@ton/core';
import { DaoDictType } from './utils/daoDictValue';
import { crc32 } from './utils/crc32';

const DaoDictValueType = beginCell().endCell();

const membersDictContent = Dictionary.empty<bigint, Cell>();

membersDictContent.set(beginCell().storeDictDirect(membersDictContent, 32).beginCell());
const cachedVoting = beginCell().storeDictDirect().endCell();

export function buildMemberDictContent(data: AdminData): Cell {
    const content = Dictionary.empty<bigint, Cell>();

    return beginCell().storeDictDirect(content, Dictionary.Keys.BigUint(256), Dictionary.Values.Cell()).endCell();
}

export function buildVotingsDict(data: AdminData): Cell {
    const content = Dictionary.empty<bigint, Cell>();
    content.set(sha256Hash('category'), beginCell().storeUint(sha256Hash(data.category), 256).endCell());
    content.set(sha256Hash('can_approve_user'), beginCell().storeBit(data.canApproveUser).endCell());
    content.set(sha256Hash('can_revoke_user'), beginCell().storeBit(data.canRevokeUser).endCell());

    return beginCell().storeDictDirect(content, Dictionary.Keys.BigUint(256), Dictionary.Values.Cell()).endCell();
}

export function buildVotingsDict(data: AdminData): Cell {
    const content = Dictionary.empty<bigint, Cell>();
    return beginCell().storeDictDirect(content, Dictionary.Keys.BigUint(256), Dictionary.Values.Cell()).endCell();

}

const VotingsDictValueType = beginCell().endCell();

export type RootConfig = {
    total_dao_users: number | bigint;
    total_dao_strength: number | bigint;
    config: Cell;
    dao_dict: Dictionary<bigint, DaoDictValueType>;
    votings: Dictionary<bigint, VotingsDictValueType>;
};

export function rootConfigToCell(config: RootConfig): Cell {
    return beginCell()
        .storeUint(1, 64)
        .storeRef(
            beginCell()
                .storeUint(config.maxDaoUsers, 32)
                .storeUint(config.minVotesToComplete, 32)
            .endCell()
        )
        .storeDict(config.daoDict)
        .storeDict(Dictionary.empty())
    .endCell();
}

export class Root implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static readonly ADD_MEMBER = crc32('add_member');

    static createFromAddress(address: Address) {
        return new Root(address);
    }

    static createFromConfig(config: RootConfig, code: Cell, workchain = 0) {
        const data = rootConfigToCell(config);
        const init = { code, data };
        return new Root(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async sendAddMember(
        provider: ContractProvider, 
        via: Sender,
        opts: {
            daoMemberId: bigint;
            
        }
    ) {
        await provider.internal(via, {
            value: toNano('0.05'),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }
}
