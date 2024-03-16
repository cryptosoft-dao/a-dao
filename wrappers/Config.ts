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
};

export const ADaoTransactionTypes = {
    InviteAddress: 0,
    DeleteAddress: 1,
    DestributeTon: 2,
    ArbitraryTransaction: 3,
    UpdateAgreementPercent: 4
}

