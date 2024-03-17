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

export type ADaoData = {
    active: number | bigint;
    root_address: Address;
    deployer_address: Address;
    transaction_fee: number | bigint;
    agreement_percent_numerator: number | bigint;
    agreement_percent_denominator: number | bigint;
    profit_reserve_percent_numerator: number | bigint;
    profit_reserve_percent_denominator: number | bigint;
    profitable_addresses: Cell | null;
    pending_invitations: Cell | null;
    pending_transactions: Cell | null;
    authorized_addresses: Cell | null;
    total_approval_points: number | bigint;
    total_profit_points: number | bigint;
    total_profit_reserved: number | bigint;
}

export type ADaoConfig = {
    Active: number;
    RootAddress: Address;
    DeployerAddressSHA256: bigint;
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
            Passcode: bigint | number,
        }
    ) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: 
                beginCell()
                    .storeUint(ADaoOperationCodes.AcceptInvitationToADao, 32)
                    .storeUint(opts.Passcode, 32)
                .endCell()
        });
    }
    
    async sendQuitADao(
        provider: ContractProvider,
        via: Sender,
        value: bigint,
        opts: {
            Passcode: bigint | number,
        }
    ) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: 
                beginCell()
                    .storeUint(ADaoOperationCodes.QuitADao, 32)
                    .storeUint(opts.Passcode, 32)
                .endCell()
        });
    }

    async sendChangeMyAddress(
        provider: ContractProvider,
        via: Sender,
        value: bigint,
        opts: {
            Passcode: number | bigint,
            NewAddress: Address,
        }
    ) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: 
                beginCell()
                    .storeUint(ADaoOperationCodes.ChangeMyAddress, 32)
                    .storeUint(opts.Passcode, 32)
                    .storeAddress(opts.NewAddress)
                .endCell()
        });
    }

    // Propose transaction

    async sendProposeInviteAddress(
        provider: ContractProvider,
        via: Sender,
        value: bigint,
        opts: {
            Passcode: number | bigint,
            Deadline: number | bigint,
            // cell transaction_info
            AddressToInvite: Address,
            ApprovalPoints: number | bigint,
            ProfitPoints: number | bigint,
        }
    ) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: 
                beginCell()
                    .storeUint(ADaoOperationCodes.ProposeTransaction, 32)
                    .storeUint(opts.Passcode, 32)
                    .storeUint(ADaoTransactionTypes.InviteAddress, 32)
                    .storeUint(opts.Deadline, 32)
                    .storeRef( // cell transaction_info
                        beginCell()
                            .storeAddress(opts.AddressToInvite)
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
        provider: ContractProvider,
        via: Sender,
        value: bigint,
        opts: {
            Passcode: number | bigint,
            TransactionIndex: number | bigint,
        }
    ) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: 
                beginCell()
                    .storeUint(ADaoOperationCodes.ApproveTransaction, 32)
                    .storeUint(opts.Passcode, 32)
                    .storeUint(opts.TransactionIndex, 32)
                .endCell()
        });
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

    async getADaoData(provider: ContractProvider): Promise<ADaoData> {

        const result = await provider.get('get_a_dao_data', []);

        const active = result.stack.readNumber();
        const root_address = result.stack.readAddress();
        const deployer_address = result.stack.readAddress();
        const transaction_fee = result.stack.readBigNumber();
        const agreement_percent_numerator = result.stack.readBigNumber();
        const agreement_percent_denominator = result.stack.readBigNumber();
        const profit_reserve_percent_numerator = result.stack.readBigNumber();
        const profit_reserve_percent_denominator = result.stack.readBigNumber();
        const profitable_addresses = result.stack.readCellOpt();
        const pending_invitations = result.stack.readCellOpt();
        const pending_transactions = result.stack.readCellOpt();
        const authorized_addresses = result.stack.readCellOpt();
        const total_approval_points = result.stack.readBigNumber();
        const total_profit_points = result.stack.readBigNumber();
        const total_profit_reserved = result.stack.readBigNumber();


        return {
            active,
            root_address,
            deployer_address,
            transaction_fee,
            agreement_percent_numerator,
            agreement_percent_denominator,
            profit_reserve_percent_numerator,
            profit_reserve_percent_denominator,
            profitable_addresses,
            pending_invitations,
            pending_transactions,
            authorized_addresses,
            total_approval_points,
            total_profit_points,
            total_profit_reserved,
        };

    }

}
