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
import { ADaoInternalOperations, ADaoMasterOperationCodes, ADaoOperationCodes, ADaoTransactionTypes } from './Config';
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

export type PendingInvitationsData = {
    authorized_address: Address,
    approval_points: number | bigint,
    profit_points: number | bigint,
}

export type PendingTransactionsData = {
    transaction_type: number | bigint;
    deadline: number | bigint;
    transaction_info: Cell;
    approvals: Cell | null;
    approval_points_recieved: number | bigint;
}

export type AuthorizedAddressData = {
    authorized_address: Address;
    approval_points: number | bigint;
    profit_points: number | bigint;
    approved_transactions: Cell | null;
}

export function createPendingInvitationsData(): DictionaryValue<PendingInvitationsData> {
    return {
        serialize(src: PendingInvitationsData, builder: Builder) {
            builder.storeAddress(src.authorized_address);
            builder.storeUint(src.approval_points, 32);
            builder.storeUint(src.profit_points, 32);
        },
        parse: (src: Slice) => {
            return {
                authorized_address: src.loadAddress(),
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
        AgreementPercentNumerator: bigint | number,
        AgreementPercentDenominator: bigint | number,
        ProfitReservePercentNumerator: bigint | number,
        ProfitReservePercentDenominator: bigint | number,
        ProfitableAddresses: Cell,
        PendingInvitations: Cell,
    ) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: 
                beginCell()
                    .storeUint(ADaoOperationCodes.ActivateADao, 32)
                    .storeUint(AgreementPercentNumerator, 32)
                    .storeUint(AgreementPercentDenominator, 32)
                    .storeUint(ProfitReservePercentNumerator, 32)
                    .storeUint(ProfitReservePercentDenominator, 32)
                    .storeMaybeRef(ProfitableAddresses)
                    .storeMaybeRef(PendingInvitations)
                .endCell()
        });
    }

    // General

    async sendTopUpBalance(
        provider: ContractProvider,
        via: Sender,
        value: bigint,
    ) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
        });
    }

    async sendAcceptInvitationToADao(
        provider: ContractProvider,
        via: Sender,
        value: bigint,
        Passcode: bigint | number,
    ) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: 
                beginCell()
                    .storeUint(ADaoOperationCodes.AcceptInvitationToADao, 32)
                    .storeUint(Passcode, 32)
                .endCell()
        });
    }
    
    async sendQuitADao(
        provider: ContractProvider,
        via: Sender,
        value: bigint,
    ) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: 
                beginCell()
                    .storeUint(ADaoOperationCodes.QuitADao, 32)
                .endCell()
        });
    }

    async sendChangeMyAddress(
        provider: ContractProvider,
        via: Sender,
        value: bigint,
        NewAddress: Address,
    ) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: 
                beginCell()
                    .storeUint(ADaoOperationCodes.ChangeMyAddress, 32)
                    .storeAddress(NewAddress)
                .endCell()
        });
    }

    async sendFundsToCollect(
        provider: ContractProvider,
        via: Sender,
        value: bigint,
    ) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body:
                beginCell()
                    .storeUint(ADaoInternalOperations.CollectFunds, 32)
                .endCell()
        });
    }

    // Propose transaction

    async sendProposeInviteAddress(
        provider: ContractProvider,
        via: Sender,
        value: bigint,
        Deadline: number | bigint,
        // cell transaction_info
        AddressToInvite: Address,
        ApprovalPoints: number | bigint,
        ProfitPoints: number | bigint,
    ) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: 
                beginCell()
                    .storeUint(ADaoOperationCodes.ProposeTransaction, 32)
                    .storeUint(ADaoTransactionTypes.InviteAddress, 32)
                    .storeUint(Deadline, 32)
                    .storeRef( // cell transaction_info
                        beginCell()
                            .storeAddress(AddressToInvite)
                            .storeUint(ApprovalPoints, 32)
                            .storeUint(ProfitPoints, 32)
                        .endCell()
                    )
                .endCell()
        });
    }

    async sendProposeDeleteAddress(
        provider: ContractProvider,
        via: Sender,
        value: bigint,
        Deadline: number | bigint,
        // cell transaction_info
        AddressToDelete: Address,
    ) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: 
                beginCell()
                    .storeUint(ADaoOperationCodes.ProposeTransaction, 32)
                    .storeUint(ADaoTransactionTypes.DeleteAddress, 32)
                    .storeUint(Deadline, 32)
                    .storeRef( // cell transaction_info
                        beginCell()
                            .storeAddress(AddressToDelete)
                        .endCell()
                    )
                .endCell()
        });
    }

    async sendProposeSendCollectFunds(
        provider: ContractProvider,
        via: Sender,
        value: bigint,
        Deadline: number | bigint,
        ProfitableAddressPasscode: number | bigint,
    ) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: 
                beginCell()
                    .storeUint(ADaoOperationCodes.ProposeTransaction, 32)
                    .storeUint(ADaoTransactionTypes.SendCollectFunds, 32)
                    .storeUint(Deadline, 32)
                    .storeRef( // cell transaction_info
                        beginCell()
                            .storeUint(ProfitableAddressPasscode, 32)
                        .endCell()
                    )
                .endCell()
        });
    }

    async sendProposeDistributeTon(
        provider: ContractProvider,
        via: Sender,
        value: bigint,
        Deadline: number | bigint,
        DistributionAmount: number | bigint,
    ) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: 
                beginCell()
                    .storeUint(ADaoOperationCodes.ProposeTransaction, 32)
                    .storeUint(ADaoTransactionTypes.DistributeTon, 32)
                    .storeUint(Deadline, 32)
                    .storeRef( // cell transaction_info
                        beginCell()
                            .storeCoins(DistributionAmount)
                        .endCell()
                    )
                .endCell()
        });
    }

    async sendProposeArbitraryTransaction(
        provider: ContractProvider,
        via: Sender,
        value: bigint,
        Deadline: number | bigint,
        Destination: Address,
        Amount: number | bigint,
        MsgBody: Cell,
    ) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: 
                beginCell()
                    .storeUint(ADaoOperationCodes.ProposeTransaction, 32)
                    .storeUint(ADaoTransactionTypes.ArbitraryTransaction, 32)
                    .storeUint(Deadline, 32)
                    .storeRef( // cell transaction_info
                        beginCell()
                            .storeAddress(Destination)
                            .storeCoins(Amount)
                            .storeRef(MsgBody)
                        .endCell()
                    )
                .endCell()
        });
    }

    async sendProposeUpdateAgreementPercent(
        provider: ContractProvider,
        via: Sender,
        value: bigint,
        Deadline: number | bigint,
        AgreementPercentNumerator: number | bigint,
        AgreementPercentDenumerator: number | bigint,
    ) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: 
                beginCell()
                    .storeUint(ADaoOperationCodes.ProposeTransaction, 32)
                    .storeUint(ADaoTransactionTypes.UpdateAgreementPercent, 32)
                    .storeUint(Deadline, 32)
                    .storeRef( // cell transaction_info
                        beginCell()
                            .storeUint(AgreementPercentNumerator, 32)
                            .storeUint(AgreementPercentDenumerator, 32)
                        .endCell()
                    )
                .endCell()
        });
    }

    async sendProposeTransferPoints(
        provider: ContractProvider,
        via: Sender,
        value: bigint,
        Deadline: number | bigint,
        Recipient: Address,
        ApprovalPoints: number | bigint,
        ProfitPoints: number | bigint,
    ) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: 
                beginCell()
                    .storeUint(ADaoOperationCodes.ProposeTransaction, 32)
                    .storeUint(ADaoTransactionTypes.TransferPoints, 32)
                    .storeUint(Deadline, 32)
                    .storeRef( // cell transaction_info
                        beginCell()
                            .storeAddress(Recipient)
                            .storeUint(ApprovalPoints, 32)
                            .storeUint(ProfitPoints, 32)
                        .endCell()
                    )
                .endCell()
        });
    }

    async sendPutUpPointsForSale(
        provider: ContractProvider,
        via: Sender,
        value: bigint,
        Deadline: number | bigint,
        PointsBuyer: Address,
        Price: number | bigint,
        ApprovalPointsForSale: number | bigint,
        ProfitPointsForSale: number | bigint,
    ) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: 
                beginCell()
                    .storeUint(ADaoOperationCodes.ProposeTransaction, 32)
                    .storeUint(ADaoTransactionTypes.PutUpPointsForSale, 32)
                    .storeUint(Deadline, 32)
                    .storeRef( // cell transaction_info
                        beginCell()
                            .storeAddress(PointsBuyer)
                            .storeCoins(Price)
                            .storeUint(ApprovalPointsForSale, 32)
                            .storeUint(ProfitPointsForSale, 32)
                        .endCell()
                    )
                .endCell()
        });
    }

    async sendProposeDeletePendingInvitations(
        provider: ContractProvider,
        via: Sender,
        value: bigint,
        Deadline: number | bigint,
        PendingInvitationsForRemoval: Cell,
    ) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: 
                beginCell()
                    .storeUint(ADaoOperationCodes.ProposeTransaction, 32)
                    .storeUint(ADaoTransactionTypes.DeletePendingTransactions, 32)
                    .storeUint(Deadline, 32)
                    .storeRef( // cell transaction_info
                        beginCell()
                            .storeMaybeRef(PendingInvitationsForRemoval)
                        .endCell()
                    )
                .endCell()
        });
    }

    async sendProposeDeletePendingTransactions(
        provider: ContractProvider,
        via: Sender,
        value: bigint,
        Deadline: number | bigint,
        PendingTransactionsForRemoval: Cell,
    ) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: 
                beginCell()
                    .storeUint(ADaoOperationCodes.ProposeTransaction, 32)
                    .storeUint(ADaoTransactionTypes.DeletePendingTransactions, 32)
                    .storeUint(Deadline, 32)
                    .storeRef( // cell transaction_info
                        beginCell()
                            .storeMaybeRef(PendingTransactionsForRemoval)
                        .endCell()
                    )
                .endCell()
        });
    }

    // Approve transaction

    async sendApprove(
        provider: ContractProvider,
        via: Sender,
        value: bigint,
        TransactionIndex: number | bigint,
    ) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: 
                beginCell()
                    .storeUint(ADaoOperationCodes.ApproveTransaction, 32)
                    .storeUint(TransactionIndex, 32)
                .endCell()
        });
    }

    // Get-methods

    async getADaoStatus(provider: ContractProvider): Promise<number> {
        const result = await provider.get('get_a_dao_status', []);
        return result.stack.readNumber(); // int1 active?
    }

    async getPendingInvitationData(provider: ContractProvider, passcode: bigint): Promise<PendingInvitationsData> {

        const result = await provider.get('get_pending_invitation_data', [{ type: 'int', value: passcode }]);

        const authorized_address = result.stack.readAddress();
        const approval_points = result.stack.readBigNumber();
        const profit_points = result.stack.readBigNumber();

        return {
            authorized_address,
            approval_points,
            profit_points
        };

    }

    async getPendingTransactionsData(provider: ContractProvider, key: bigint): Promise<PendingTransactionsData> {

        const result = await provider.get('get_pending_transaction_data', [{ type: 'int', value: key }]);

        const transaction_type = result.stack.readBigNumber();
        const deadline = result.stack.readBigNumber();
        const transaction_info = result.stack.readCell();
        const approvals = result.stack.readCellOpt();
        const approval_points_recieved = result.stack.readBigNumber();

        return {
            transaction_type,
            deadline,
            transaction_info,
            approvals,
            approval_points_recieved
        };

    }

    async getAuthorizedAddressData(provider: ContractProvider, authorized_address_cell: Cell): Promise<AuthorizedAddressData> {

        const result = await provider.get('get_authorized_address_data', [{ type: 'cell', cell: authorized_address_cell}])

        const authorized_address = result.stack.readAddress();
        const approval_points = result.stack.readBigNumber();
        const profit_points = result.stack.readBigNumber();
        const approved_transactions = result.stack.readCellOpt();

        return {
            authorized_address,
            approval_points,
            profit_points,
            approved_transactions
        };

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
