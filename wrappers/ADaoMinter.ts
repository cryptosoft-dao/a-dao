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
import { ADaoMinterOperationCodes, ADaoOperationCodes, ADaoTransactionTypes } from './Config';
import { ADao } from './ADao';

export type ADaoMinterConfig = {
    OwnerAddress: Address;
    ADaoCode: Cell;
    TotalADaos: number | bigint;
    NextADaoCreationFee: number | bigint;
    NextADaoTransactionFee: number | bigint;
}

export function serializeADaoMinterConfigToCell(config: ADaoMinterConfig): Cell {
    return beginCell()
        .storeAddress(config.OwnerAddress)
        .storeRef(config.ADaoCode)
        .storeUint(config.TotalADaos, 32)
        .storeCoins(config.NextADaoCreationFee)
        .storeCoins(config.NextADaoTransactionFee)
    .endCell();
}

export class ADaoMinter implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new ADaoMinter(address);
    }

    static createFromConfig(config: ADaoMinterConfig, code: Cell, workchain = 0) {
        const data = serializeADaoMinterConfigToCell(config);
        const init = { code, data };
        return new ADaoMinter(contractAddress(workchain, init), init);
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