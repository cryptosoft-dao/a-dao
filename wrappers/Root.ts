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
    RoutingPoolCode: Cell;
    FeesInfo: Cell;
    ReferralProgram: Cell;
}
export function serializeRootConfigToCell(config: RootConfig): Cell {
    return beginCell()
        .storeRef(config.RoutingPoolCode)
        .storeRef(config.FeesInfo)
        .storeRef(config.ReferralProgram)
    .endCell();
}

export class Root implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new Root(address);
    }

    static createFromConfig(config: RootConfig, code: Cell, workchain = 0) {
        const data = serializeRootConfigToCell(config);
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

    async sendCreateRoutingPool(
        provider: ContractProvider, 
        via: Sender,
        value: bigint,
        opts: {
            DeployerAddress: Address;
            MaxAuthorizedAddresses: number | bigint;
            TransactionApprovalPercent: number | bigint;
            AuthorizedAddresses: Dictionary<bigint, Cell>;
            TotalApprovalPoints: number | bigint;
            TotalDistributionPoints: number | bigint;
        }
    ) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: 
                beginCell()
                    .storeAddress(opts.DeployerAddress)
                    .storeUint(opts.MaxAuthorizedAddresses, 8)
                    .storeUint(opts.TransactionApprovalPercent, 8)
                    .storeDict(opts.AuthorizedAddresses)
                    .storeUint(opts.TotalApprovalPoints, 32)
                    .storeUint(opts.TotalDistributionPoints, 32)
                .endCell()
        });
    }

}