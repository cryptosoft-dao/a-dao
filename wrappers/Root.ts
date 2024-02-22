import { 
    Address, 
    beginCell, 
    Cell, 
    Contract, 
    contractAddress, 
    ContractProvider, 
    Dictionary, 
    Sender, 
    SendMode, 
    toNano 
} from '@ton/core';

export type RootConfig = {
    MaxMembers: bigint | number;
    AgreementPercent: bigint | number;
    Members: Dictionary<bigint, Cell>;
    TotalVoices: bigint | number;
    TotalRevenuePoints: bigint | number;
    Votings: Dictionary<bigint, Cell>;
}
export function rootConfigToCell(config: RootConfig): Cell {
    return beginCell()
        .storeUint(config.MaxMembers, 8)
        .storeUint(config.AgreementPercent, 8)
        .storeDict(config.Members)
        .storeUint(config.TotalVoices, 32)
        .storeUint(config.TotalRevenuePoints, 32)
        .storeDict(config.Votings)
    .endCell();
}

export class Root implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

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

    async sendVoteAddMember(
        provider: ContractProvider, 
        via: Sender,
        value: bigint,
        opts: {
            MemberIndex: number | bigint;
            VotingIndex: number | bigint;
        }
    ) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: 
                beginCell()
                    .storeUint(opts.MemberIndex, 32)
                    .storeUint(opts.VotingIndex, 32)
                .endCell()
        });
    }
    
    async sendVoteTerminateMembership(
        provider: ContractProvider, 
        via: Sender,
        value: bigint,
        opts: {
            MemberIndex: number | bigint;
            VotingIndex: number | bigint;
        }
    ) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: 
                beginCell()
                    .storeUint(opts.MemberIndex, 32)
                    .storeUint(opts.VotingIndex, 32)
                .endCell()
        });
    }

    async sendVoteRouteRevenue(
        provider: ContractProvider, 
        via: Sender,
        value: bigint,
        opts: {
            MemberIndex: number | bigint;
            VotingIndex: number | bigint;
        }
    ) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: 
                beginCell()
                    .storeUint(opts.MemberIndex, 32)
                    .storeUint(opts.VotingIndex, 32)
                .endCell()
        });
    }

    async sendVoteArbitraryTransaction(
        provider: ContractProvider, 
        via: Sender,
        value: bigint,
        opts: {
            MemberIndex: number | bigint;
            VotingIndex: number | bigint;
        }
    ) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: 
                beginCell()
                    .storeUint(opts.MemberIndex, 32)
                    .storeUint(opts.VotingIndex, 32)
                .endCell()
        });
    }

    async sendVoteChangeConfig(
        provider: ContractProvider, 
        via: Sender,
        value: bigint,
        opts: {
            MemberIndex: number | bigint;
            VotingIndex: number | bigint;
        }
    ) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: 
                beginCell()
                    .storeUint(opts.MemberIndex, 32)
                    .storeUint(opts.VotingIndex, 32)
                .endCell()
        });
    }

    async sendInitiateAddMember(
        provider: ContractProvider,
        via: Sender,
        value: bigint,
        opts: {
            MemberIndex: number | bigint;
            VotingIndex: number | bigint;
            VotingCell: Cell;
        }
    ) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: 
                beginCell()
                    .storeUint(opts.MemberIndex, 32)
                    .storeUint(opts.VotingIndex, 32)
                    .storeRef(opts.VotingCell)
                .endCell()
        });
    }

    async sendInitiateTerminateMembership(
        provider: ContractProvider,
        via: Sender,
        value: bigint,
        opts: {
            MemberIndex: number | bigint;
            VotingIndex: number | bigint;
            VotingCell: Cell;
        }
    ) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: 
                beginCell()
                    .storeUint(opts.MemberIndex, 32)
                    .storeUint(opts.VotingIndex, 32)
                    .storeRef(opts.VotingCell)
                .endCell()
        });
    }

    async sendInitiateRouteRevenue(
        provider: ContractProvider,
        via: Sender,
        value: bigint,
        opts: {
            MemberIndex: number | bigint;
            VotingIndex: number | bigint;
            VotingCell: Cell;
        }
    ) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: 
                beginCell()
                    .storeUint(opts.MemberIndex, 32)
                    .storeUint(opts.VotingIndex, 32)
                    .storeRef(opts.VotingCell)
                .endCell()
        });
    }

    async sendInitiateArbitraryTransaction(
        provider: ContractProvider,
        via: Sender,
        value: bigint,
        opts: {
            MemberIndex: number | bigint;
            VotingIndex: number | bigint;
            VotingCell: Cell;
        }
    ) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: 
                beginCell()
                    .storeUint(opts.MemberIndex, 32)
                    .storeUint(opts.VotingIndex, 32)
                    .storeRef(opts.VotingCell)
                .endCell()
        });
    }

    async sendInitiateChangeConfig(
        provider: ContractProvider,
        via: Sender,
        value: bigint,
        opts: {
            MemberIndex: number | bigint;
            VotingIndex: number | bigint;
            VotingCell: Cell;
        }
    ) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: 
                beginCell()
                    .storeUint(opts.MemberIndex, 32)
                    .storeUint(opts.VotingIndex, 32)
                    .storeRef(opts.VotingCell)
                .endCell()
        });
    }

}
