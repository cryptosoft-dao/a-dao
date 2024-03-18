// A DAO Minter

export const ADaoMasterOperationCodes = {
    ChangeADaoMasterOwner: 0,
    SendDeployMessage: 1,
}

// A DAO

export const ADaoOperationCodes = {
    ProcessDeployMessage: 0,
    MasterLog: 1,
    ActivateADao: 2,
    ProposeTransaction: 3,
    ApproveTransaction: 4,
    AcceptInvitationToADao: 5,
    BuyPoints: 6,
    InviteToADao: 7,
    ChangeMyAddress: 8,
    QuitADao: 9,
};

export const ADaoTransactionTypes = {
    TransactionWithoutType: 0,
    InviteAddress: 1,
    DeleteAddress: 2,
    WithdrawProfit: 3,
    DistributeTon: 4,
    ArbitraryTransaction: 5,
    UpdateAgreementPercent: 6,
    TransferPoint: 7,
    PutUpPointsForSale: 8,
    DeletePendingInvitations: 9,
    DeletePendingTransactions: 10,
}

