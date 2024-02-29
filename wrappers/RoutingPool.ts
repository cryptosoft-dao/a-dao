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

export type RoutingPoolConfig = {
    Active: number;
    RootAddress: Address,
    DeployerAddressSHA256: bigint,
}
export function serializeRoutingPoolConfigToCell(config: RoutingPoolConfig): Cell {
    return beginCell()
        .storeUint(config.Active, 1) // false value
        .storeAddress(config.RootAddress)
        .storeUint(config.DeployerAddressSHA256, 256)
    .endCell();
}

export class RoutingPool implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new RoutingPool(address);
    }

    static createFromConfig(config: RoutingPoolConfig, code: Cell, workchain = 0) {
        const data = serializeRoutingPoolConfigToCell(config);
        const init = { code, data };
        return new RoutingPool(contractAddress(workchain, init), init);
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
    
    async sendVoteTerminateWalletship(
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

    async sendInitiateTerminateWalletship(
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
