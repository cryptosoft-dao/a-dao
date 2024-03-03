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
    Slice, 
    toNano 
} from '@ton/core';
import { RootOperationCodes, RoutingPoolOperationCodes, RoutingPoolTransactionTypes } from '../wrappers/Config';
import { RoutingPool } from './RoutingPool';

export type RootConfig = {
    OwnerAddress: Address;
    RoutingPoolCode: Cell;
    TotalRoutingPools: number | bigint;
    NextRoutingPoolCreationFee: number | bigint;
    NextRoutingPoolTransactionFee: number | bigint;
}

export function serializeRootConfigToCell(config: RootConfig): Cell {
    return beginCell()
        .storeAddress(config.OwnerAddress)
        .storeRef(config.RoutingPoolCode)
        .storeUint(config.TotalRoutingPools, 32)
        .storeCoins(config.NextRoutingPoolCreationFee)
        .storeCoins(config.NextRoutingPoolTransactionFee)
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
            body: 
                beginCell()
                .endCell(),
        });
    }

    async sendDeployRoutingPool(
        provider: ContractProvider, 
        via: Sender,
        value: bigint,
    ) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
        });
    }

    async getNFTAddressByIndex(provider: ContractProvider, index: bigint): Promise<Address> {
        const result = await provider.get('get_routing_pool_address_by_deployer_address', [{ type: 'slice', cell: deployer_address }]);
        return result.stack.readAddress();
    }

}