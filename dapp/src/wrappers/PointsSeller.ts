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

export class PointsSeller implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new PointsSeller(address);
    }

}