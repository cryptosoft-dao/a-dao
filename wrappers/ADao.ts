import { 
    Address, 
    beginCell, 
    Builder,
    Cell, 
    Contract, 
    contractAddress, 
    ContractProvider, 
    Dictionary, 
    DictionaryValue,
    Sender, 
    SendMode, 
    toNano 
} from '@ton/core';
import { ADaoMinterOperationCodes, ADaoOperationCodes, ADaoTransactionTypes } from './Config';
import { Slice } from '@ton/core';

export type ADaoConfig = {
    Active: number;
    RootAddress: Address,
    DeployerAddressSHA256: bigint,
}
export function serializeADaoConfigToCell(config: ADaoConfig): Cell {
    return beginCell()
        .storeUint(config.Active, 1) // false value
        .storeAddress(config.RootAddress)
        .storeUint(config.DeployerAddressSHA256, 256)
    .endCell();
}

export type ProfitableAddressValue = {
    address: Address,
}

export function createProfitableAddressesValue(): DictionaryValue<ProfitableAddressValue> {
    return {
        serialize(src: ProfitableAddressValue, builder: Builder) {
            builder.storeAddress(src.address);
        },
        parse: (src: Slice) => {
            return {
                address: src.loadAddress(),
            };
        },
    };
}

export type PendingInvitationsValue = {
    address: Address,
    approval_points: number | bigint,
    profit_points: number | bigint,
}

export function createPendingInvitationsValue(): DictionaryValue<PendingInvitationsValue> {
    return {
        serialize(src: PendingInvitationsValue, builder: Builder) {
            builder.storeAddress(src.address);
            builder.storeUint(src.approval_points, 32);
            builder.storeUint(src.profit_points, 32);
        },
        parse: (src: Slice) => {
            return {
                address: src.loadAddress(),
                approval_points: src.loadUint(32),
                profit_points: src.loadUint(32),
            };
        },
    };
}

export class ADao implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new ADao(address);
    }

    static createFromConfig(config: ADaoConfig, code: Cell, workchain = 0) {
        const data = serializeADaoConfigToCell(config);
        const init = { code, data };
        return new ADao(contractAddress(workchain, init), init);
    }

    // Activate A Dao

    async sendActivateADao (
        provider: ContractProvider,
        via: Sender,
        value: bigint,
        opts: {
            AgreementPercentNumerator: bigint | number,
            AgreementPercentDenominator: bigint | number,
            ProfitReservePercentNumerator: bigint | number,
            ProfitReservePercentDenominator: bigint | number,
            ProfitableAddresses: Cell,
            PendingInvitations: Cell,
        }
    ) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: 
                beginCell()
                    .storeUint(ADaoOperationCodes.ActivateADao, 32)
                    .storeUint(opts.AgreementPercentNumerator, 32)
                    .storeUint(opts.AgreementPercentDenominator, 32)
                    .storeUint(opts.ProfitReservePercentNumerator, 32)
                    .storeUint(opts.ProfitReservePercentDenominator, 32)
                    .storeMaybeRef(opts.ProfitableAddresses)
                    .storeMaybeRef(opts.PendingInvitations)
                .endCell()
        });
    }

    // General

    async sendAcceptInvitationToADao(
        provider: ContractProvider,
        via: Sender,
        value: bigint,
        opts: {
            Key: bigint | number,
        }
    ) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: 
                beginCell()
                    .storeUint(ADaoOperationCodes.AcceptInvitationToADao, 32)
                    .storeUint(opts.Key, 32)
                .endCell()
        });
    }
    
    async sendQuitADao(
        provider: ContractProvider,
        via: Sender,
        value: bigint,
        opts: {
            Key: bigint | number,
        }
    ) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: 
                beginCell()
                    .storeUint(ADaoOperationCodes.QuitADao, 32)
                    .storeUint(opts.Key, 32)
                .endCell()
        });
    }

    // Propose transaction

    async sendProposeInviteAddress(
        provider: ContractProvider,
        via: Sender,
        value: bigint,
        opts: {
            TransactionType: bigint | number;
            Deadline: bigint | number;
            // cell transaction_info
            AddressToInvite: Address;
            ApprovalPoints: bigint | number;
            ProfitPoints: bigint | number;
        }
    ) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: 
                beginCell()
                    .storeUint(ADaoOperationCodes.ProposeTransaction, 32)
                    .storeUint(opts.TransactionType, 32)
                    .storeUint(opts.Deadline, 32)
                    .storeRef( // cell transaction_info
                        beginCell()
                            .storeUint(ADaoTransactionTypes.InviteAddress, 4)
                            .storeUint(opts.ApprovalPoints, 32)
                            .storeUint(opts.ProfitPoints, 32)
                    )
                .endCell()
        });
    }

    async sendProposeDeleteAddress(
        
    ) {

    }
    async sendProposeDistributeTon(
        
    ) {

    }

    async sendProposeWithdrawProfit(
        
    ) {

    }

    async sendProposeArbitraryTransaction(
        
    ) {

    }

    async sendProposeUpdateAgreementPercent(
        
    ) {

    }

    async sendProposeTransferPoints(
        
    ) {

    }

    // Approve transaction

    async sendApproveInviteAddress(

    ) {

    }

    async sendApproveDeleteAddress(
        
    ) {

    }
    async sendApproveDistributeTon(
        
    ) {

    }

    async sendApproveWithdrawProfit(
        
    ) {

    }

    async sendApproveArbitraryTransaction(
        
    ) {

    }

    async sendApproveUpdateAgreementPercent(
        
    ) {

    }

    async sendApproveTransferPoints(
        
    ) {

    }

    // Get-methods

    async getADaoStatus(provider: ContractProvider): Promise<number> {
        const result = await provider.get('get_a_dao_status', []);
        return result.stack.readNumber(); // int1 active?
    }

    async getADaoData(provider: ContractProvider) {
        const { stack } = await provider.get('get_a_dao_data', []);

        return (
            stack.readNumber(), // int1 active?
            stack.readAddress(), // slice root_address
            stack.readAddress(), // slice deployer_address
            stack.readBigNumber(), // uint32 transaction_fee
            stack.readBigNumber(), // uint32 agreement_percent_numerator
            stack.readBigNumber(), // uint32 agreement_percent_denominator
            stack.readBigNumber(), // uint32 profit_reserve_percent_numerator
            stack.readBigNumber(), // uint32 profit_reserve_percent_denominator
            stack.readCellOpt(), // dict profitable_addresses
            stack.readCellOpt(), // dict pending_invitations
            stack.readCellOpt(), // dict pending_transactions
            stack.readCellOpt(), // dict authorized_addresses
            stack.readBigNumber(), // uint32 total_approval_points
            stack.readBigNumber(), // uint32 total_profit_points
            stack.readBigNumber() // uint32 total_profit_reserved
        );
    }

}
