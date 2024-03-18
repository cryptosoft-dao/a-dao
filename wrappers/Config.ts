// A DAO Minter

export const ADaoMinterOperationCodes = {
    ProcessDeployMessage: 0,
}

// A DAO

export const ADaoOperationCodes = {
    ProcessDeployMessage: 0,
    ActivateADao: 1,
    ProposeTransaction: 2,
    ApproveTransaction: 3,
    AcceptInvitationToADao: 4,
    QuitADao: 5,
    InviteToADao: 6,
    ChangeMyAddress: 7,
};

export const ADaoTransactionTypes = {
    InviteAddress: 0,
    DeleteAddress: 1,
    WithdrawProfit: 2,
    DistributeTon: 3,
    ArbitraryTransaction: 4,
    UpdateAgreementPercent: 5,
    TransferPoint: 6,
}

