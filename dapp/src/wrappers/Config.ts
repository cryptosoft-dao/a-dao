// A DAO Master

export const ADaoMasterOperationCodes = {
    SendDeployMessage: 0,
    WithdrawFunds: 1,
    ChangeADaoMasterOwner: 2,
}

// A DAO

export const ADaoOperationCodes = {
    ProcessDeployMessage: 0,
    MasterLog: 1,
    ActivateADao: 2,
    ProposeTransaction: 3,
    ApproveTransaction: 4,
    CollectProfit: 5,
    AcceptInvitationToADao: 6,
    BuyPoints: 7,
    InviteToADao: 8,
    RevokeApproval: 9,
    ChangeMyAddress: 10,
    QuitADao: 11,
    TopUpADaoBalance: 12,
};

export const ADaoInternalOperations = {
    CollectFunds: 81,
    StartPointSale: 82,
    TransferBoughtPoints: 83,
};

export const ADaoTransactionTypes = {
    TransactionWithoutType: 0,
    InviteAddress: 1,
    DeleteAddress: 2,
    SendCollectFunds: 81,
    DistributeTon: 4,
    ArbitraryTransaction: 5,
    UpdateAgreementPercent: 6,
    TransferPoints: 7,
    PutUpPointsForSale: 8,
    DeletePendingInvitations: 9,
    DeletePendingTransactions: 10,
}

