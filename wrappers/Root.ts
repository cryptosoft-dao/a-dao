import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Dictionary, Sender, SendMode, toNano } from '@ton/core';
import { DaoDictType } from './utils/daoDictValue';
import { crc32 } from './utils/crc32';

export type RootConfig = {
    maxDaoUsers: number | bigint;
    minVotesToComplete: number | bigint;
    daoDict: Dictionary<bigint, DaoDictType>;
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
