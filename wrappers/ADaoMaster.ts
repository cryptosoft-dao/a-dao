import { 
    Address, 
    beginCell, 
    Cell, 
    Contract, 
    contractAddress, 
    ContractProvider,
    Sender, 
    SendMode, 
} from '@ton/core';

export type ADaoMasterConfig = {
    OwnerAddress: Address;
    ADaoCode: Cell;
    NextADaoCreationFee: number | bigint;
    NextADaoTransactionFee: number | bigint;
    NextADaoCreationFeeDiscount: number | bigint;
    NextADaoTransactionFeeIncrease: number | bigint;
    MaxADaoTransactionFee: number | bigint;
    PointsSeller: Cell;
    PointsSellerCreationFee: number | bigint;
}

export function serializeADaoMasterConfigToCell(config: ADaoMasterConfig): Cell {
    return beginCell()
        .storeAddress(config.OwnerAddress)
        .storeRef(config.ADaoCode)
        .storeCoins(config.NextADaoCreationFee)
        .storeCoins(config.NextADaoTransactionFee)
        .storeCoins(config.NextADaoCreationFeeDiscount)
        .storeCoins(config.NextADaoTransactionFeeIncrease)
        .storeCoins(config.MaxADaoTransactionFee)
        .storeRef(config.PointsSeller)
        .storeUint(0, 32)
        .storeCoins(config.PointsSellerCreationFee)
    .endCell();
}

export class ADaoMaster implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new ADaoMaster(address);
    }

    static createFromConfig(config: ADaoMasterConfig, code: Cell, workchain = 0) {
        const data = serializeADaoMasterConfigToCell(config);
        const init = { code, data };
        return new ADaoMaster(contractAddress(workchain, init), init);
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

    async sendDeployADao(
        provider: ContractProvider, 
        via: Sender,
        value: bigint,
    ) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
        });
    }

    async getADaoAddressByDeployerAddress(provider: ContractProvider, deployer_address: Address): Promise<Address> {
        const result = await provider.get('get_a_dao_address_by_deployer_address', [{ type: 'slice', cell: beginCell().storeAddress(deployer_address).endCell()}]);
        return result.stack.readAddress();
    }

}