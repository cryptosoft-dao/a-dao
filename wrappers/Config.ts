// Root

export const RootOperationCodes = {
    ProcessDeployMessage: 0,
}

// Routing pool

export const RoutingPoolOperationCodes = {
    ProcessDeployMessage: 0,
    ActivateRoutingPool: 1,
    ProposeTransaction: 2,
    ApproveTransaction: 3,
    AcceptInvitationToRoutingPool: 4,
    QuitRoutingPool: 5,
};

export const RoutingPoolTransactionTypes = {
    InviteAddress: 0,
    DeleteAddress: 1,
    DestributeTon: 2,
    ArbitraryTransaction: 3,
    UpdateAgreementPercent: 4
}

