import { Blockchain, BlockchainSnapshot, internal, SandboxContract, TreasuryContract, printTransactionFees } from '@ton/sandbox';
import { beginCell, Cell, Dictionary, Slice, toNano } from '@ton/core';
import { ADaoMaster } from '../wrappers/ADaoMaster';
import { ADao } from '../wrappers/ADao';
import { PointsSeller } from '../wrappers/PointsSeller';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';
import { ADaoInternalOperations, ADaoOperationCodes, PointsSellerOperations } from '../wrappers/Config';
import { createSliceValue } from './utils/Helpers';

describe('ADaoMaster', () => {

    const blockchainStartTime = 100;

    let blockchain: Blockchain;

    let aDaoMaster: SandboxContract<ADaoMaster>;
    let firstADao: SandboxContract<ADao>;
    let secondADao: SandboxContract<ADao>;
    let deployer: SandboxContract<TreasuryContract>;
    let wallet0: SandboxContract<TreasuryContract>;
    let wallet1: SandboxContract<TreasuryContract>;
    let wallet2: SandboxContract<TreasuryContract>;
    let wallet3: SandboxContract<TreasuryContract>;
    let wallet4: SandboxContract<TreasuryContract>;
    let wallet5: SandboxContract<TreasuryContract>;
    let wallet6: SandboxContract<TreasuryContract>;
    let profitableAddress: SandboxContract<TreasuryContract>;

    let ADaoMasterCode: Cell;
    let ADaoCode: Cell;
    let PointsSellerCode: Cell;

    beforeAll(async () => {

        ADaoMasterCode = await compile('ADaoMaster');
        ADaoCode = await compile('ADao');
        PointsSellerCode = await compile('PointsSeller');

        blockchain = await Blockchain.create();
        blockchain.now = blockchainStartTime;

        deployer = await blockchain.treasury('deployer');
        wallet0 = await blockchain.treasury('wallet0');
        wallet1 = await blockchain.treasury('wallet1');
        wallet2 = await blockchain.treasury('wallet2');
        wallet3 = await blockchain.treasury('wallet3');
        wallet4 = await blockchain.treasury('wallet4');
        wallet5 = await blockchain.treasury('wallet5');
        wallet6 = await blockchain.treasury('wallet5');
        profitableAddress = await blockchain.treasury('profitableAddress');

        // Params

        aDaoMaster = blockchain.openContract(
            ADaoMaster.createFromConfig(
                {
                    OwnerAddress: deployer.address,
                    ADaoCode: ADaoCode,
                    PointsSeller: PointsSellerCode,
                    NextADaoCreationFee: toNano('10'),
                    NextADaoTransactionFee: toNano('0'),
                    NextADaoCreationFeeDiscount: toNano('0.00001'),
                    NextADaoTransactionFeeIncrease: toNano('0.000001'),
                    MaxADaoTransactionFee: toNano('1'),
                    PointsSellerCreationFee: toNano('1')
                }, 
                ADaoMasterCode,
            ),
        );

        const ADaoMasterDeployResult = await aDaoMaster.sendDeploy(deployer.getSender(), toNano('13'));

        expect(ADaoMasterDeployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: aDaoMaster.address,
            deploy: true,
            success: true,
        });

        const firstADaoAddresss = await aDaoMaster.getADaoAddressByDeployerAddress(deployer.address);

        expect(ADaoMasterDeployResult.transactions).toHaveTransaction({
            from: aDaoMaster.address,
            to: firstADaoAddresss,
            deploy: true,
            success: true,
        });

        printTransactionFees(ADaoMasterDeployResult.transactions);

        firstADao = blockchain.openContract(ADao.createFromAddress(firstADaoAddresss));

        const ADaoDataBeforeActivation = await firstADao.getADaoData();
        expect(ADaoDataBeforeActivation.active).toStrictEqual(0);

        // Activate a-dao

        const ProfitableAddressesDict = Dictionary.empty<bigint, Cell>();
        ProfitableAddressesDict.set(BigInt(0), beginCell().storeAddress(profitableAddress.address).endCell());
        const ProfitableAddresses = beginCell().storeDictDirect(ProfitableAddressesDict, Dictionary.Keys.BigUint(32), Dictionary.Values.Cell()).endCell();

        const PendingInvitationsDict = Dictionary.empty<bigint, Cell>();
        PendingInvitationsDict.set(
            BigInt(0), 
            beginCell()
                .storeAddress(wallet0.address)
                .storeUint(28 ,32)
                .storeUint(37, 32)
            .endCell()
        );
        PendingInvitationsDict.set(
            BigInt(1), 
            beginCell()
                .storeAddress(wallet1.address)
                .storeUint(35 ,32)
                .storeUint(28, 32)
            .endCell());
        PendingInvitationsDict.set(BigInt(2), beginCell().storeAddress(wallet2.address).storeUint(37 ,32).storeUint(35, 32).storeDict(Dictionary.empty()).endCell());
        const PendingInvitations = beginCell().storeDictDirect(PendingInvitationsDict, Dictionary.Keys.BigUint(32), Dictionary.Values.Cell()).endCell();

        const ADaoMasterActivationResult = await firstADao.sendActivateADao(deployer.getSender(), toNano('0.33'),
            51, // AgreementPercentNumerator
            100, // AgreementPercentDenominator
            10, // ProfitReservePercentNumerator
            100, // ProfitReservePercentDenominator
            ProfitableAddresses, // ProfitableAddresses
            PendingInvitations, // PendingInvitations
        );

        expect(ADaoMasterActivationResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: firstADao.address,
            success: true,
        });

        expect(ADaoMasterActivationResult.transactions).toHaveTransaction({
            from: firstADao.address,
            to: wallet0.address,
            success: true,
            op: ADaoOperationCodes.InviteToADao,
            body: 
                beginCell()
                    .storeUint(ADaoOperationCodes.InviteToADao, 32)
                    .storeUint(0, 32)
                    .storeUint(28, 32)
                    .storeUint(37, 32)
                .endCell(),
        });

        expect(ADaoMasterActivationResult.transactions).toHaveTransaction({
            from: firstADao.address,
            to: wallet1.address,
            success: true,
            op: ADaoOperationCodes.InviteToADao,
            body: 
                beginCell()
                    .storeUint(ADaoOperationCodes.InviteToADao, 32)
                    .storeUint(1, 32)
                    .storeUint(35, 32)
                    .storeUint(28, 32)
                .endCell(),
        });

        expect(ADaoMasterActivationResult.transactions).toHaveTransaction({
            from: firstADao.address,
            to: wallet2.address,
            success: true,
            op: ADaoOperationCodes.InviteToADao,
            body: 
                beginCell()
                    .storeUint(ADaoOperationCodes.InviteToADao, 32)
                    .storeUint(2, 32)
                    .storeUint(37, 32)
                    .storeUint(35, 32)
                .endCell(),
        });

        printTransactionFees(ADaoMasterActivationResult.transactions);

        const ADaoDataAfterActivation = await firstADao.getADaoData();
        expect(ADaoDataAfterActivation.active).toStrictEqual(1);
        const profitable_addresses_dict = ADaoDataAfterActivation.profitable_addresses;
        const result = profitable_addresses_dict!.beginParse().loadDictDirect(Dictionary.Keys.BigUint(32), Dictionary.Values.Cell());
        expect(result.get(BigInt(0))?.beginParse().loadAddress()).toEqualAddress(profitableAddress.address);

        expect(((await firstADao.getPendingInvitationData(BigInt(0))).authorized_address)).toEqualAddress(wallet0.address);
        expect((await firstADao.getPendingInvitationData(BigInt(0))).approval_points).toStrictEqual(BigInt(28));
        expect((await firstADao.getPendingInvitationData(BigInt(0))).profit_points).toStrictEqual(BigInt(37));

        expect(((await firstADao.getPendingInvitationData(BigInt(1))).authorized_address)).toEqualAddress(wallet1.address);
        expect((await firstADao.getPendingInvitationData(BigInt(1))).approval_points).toStrictEqual(BigInt(35));
        expect((await firstADao.getPendingInvitationData(BigInt(1))).profit_points).toStrictEqual(BigInt(28));

        expect(((await firstADao.getPendingInvitationData(BigInt(2))).authorized_address)).toEqualAddress(wallet2.address);
        expect((await firstADao.getPendingInvitationData(BigInt(2))).approval_points).toStrictEqual(BigInt(37));
        expect((await firstADao.getPendingInvitationData(BigInt(2))).profit_points).toStrictEqual(BigInt(35));

        // Wallet0 accepts invitation to A DAO

        const wallet0AcceptsInvitation = await firstADao.sendAcceptInvitationToADao(wallet0.getSender(), toNano('0.33'), 
            0, // Passcode
        )

        expect(wallet0AcceptsInvitation.transactions).toHaveTransaction({
            from: wallet0.address,
            to: firstADao.address,
            op: ADaoOperationCodes.AcceptInvitationToADao,
            success: true,
        })

        expect((await firstADao.getAuthorizedAddressData(beginCell().storeAddress(wallet0.address).endCell())).authorized_address).toEqualAddress(wallet0.address);
        expect((await firstADao.getAuthorizedAddressData(beginCell().storeAddress(wallet0.address).endCell())).approval_points).toStrictEqual(BigInt(28));
        expect((await firstADao.getAuthorizedAddressData(beginCell().storeAddress(wallet0.address).endCell())).profit_points).toStrictEqual(BigInt(37));

        printTransactionFees(wallet0AcceptsInvitation.transactions);

        const ADaoDataAfterWallet0In = await firstADao.getADaoData();
        expect(ADaoDataAfterWallet0In.total_approval_points).toStrictEqual(BigInt(28));
        expect(ADaoDataAfterWallet0In.total_profit_points).toStrictEqual(BigInt(37));
        
        // Wallet1 accepts invitation to A DAO

        const wallet1AcceptsInvitation = await firstADao.sendAcceptInvitationToADao(wallet1.getSender(), toNano('0.33'), 
            1, // Passcode
        )

        expect(wallet1AcceptsInvitation.transactions).toHaveTransaction({
            from: wallet1.address,
            to: firstADao.address,
            op: ADaoOperationCodes.AcceptInvitationToADao,
            success: true,
        });

        expect((await firstADao.getAuthorizedAddressData(beginCell().storeAddress(wallet1.address).endCell())).authorized_address).toEqualAddress(wallet1.address);
        expect((await firstADao.getAuthorizedAddressData(beginCell().storeAddress(wallet1.address).endCell())).approval_points).toStrictEqual(BigInt(35));
        expect((await firstADao.getAuthorizedAddressData(beginCell().storeAddress(wallet1.address).endCell())).profit_points).toStrictEqual(BigInt(28));

        printTransactionFees(wallet1AcceptsInvitation.transactions);

        const ADaoDataAfterWallet1In = await firstADao.getADaoData();
        expect(ADaoDataAfterWallet1In.total_approval_points).toStrictEqual(BigInt(63));
        expect(ADaoDataAfterWallet1In.total_profit_points).toStrictEqual(BigInt(65));

        // Wallet2 accepts invitation to A DAO

        const wallet2AcceptsInvitation = await firstADao.sendAcceptInvitationToADao(wallet2.getSender(), toNano('0.33'), 
            2, // Passcode
        )

        expect(wallet2AcceptsInvitation.transactions).toHaveTransaction({
            from: wallet2.address,
            to: firstADao.address,
            op: ADaoOperationCodes.AcceptInvitationToADao,
            success: true,
        })

        expect((await firstADao.getAuthorizedAddressData(beginCell().storeAddress(wallet2.address).endCell())).authorized_address).toEqualAddress(wallet2.address);
        expect((await firstADao.getAuthorizedAddressData(beginCell().storeAddress(wallet2.address).endCell())).approval_points).toStrictEqual(BigInt(37));
        expect((await firstADao.getAuthorizedAddressData(beginCell().storeAddress(wallet2.address).endCell())).profit_points).toStrictEqual(BigInt(35));

        printTransactionFees(wallet2AcceptsInvitation.transactions);

        const ADaoDataAfterWallet2In = await firstADao.getADaoData();
        expect(ADaoDataAfterWallet2In.total_approval_points).toStrictEqual(BigInt(100));
        expect(ADaoDataAfterWallet2In.total_profit_points).toStrictEqual(BigInt(100));

    });

    it('Empty test', async () => {});

    it('Change Wallet2 address to Wallet3 address and change back', async () => {

        const wallet2ChangesAddressToWallet3 = await firstADao.sendChangeMyAddress(wallet2.getSender(), toNano('0.33'), 
            wallet3.address, // NewAddress
        )

        expect(wallet2ChangesAddressToWallet3.transactions).toHaveTransaction({
            from: wallet2.address,
            to: firstADao.address,
            op: ADaoOperationCodes.ChangeMyAddress,
            success: true,
        })

        expect((await firstADao.getAuthorizedAddressData(beginCell().storeAddress(wallet3.address).endCell())).authorized_address).toEqualAddress(wallet3.address);
        expect((await firstADao.getAuthorizedAddressData(beginCell().storeAddress(wallet3.address).endCell())).approval_points).toStrictEqual(BigInt(37));
        expect((await firstADao.getAuthorizedAddressData(beginCell().storeAddress(wallet3.address).endCell())).profit_points).toStrictEqual(BigInt(35));

        printTransactionFees(wallet2ChangesAddressToWallet3.transactions);

        const wallet3ChangesAddressToWallet2 = await firstADao.sendChangeMyAddress(wallet3.getSender(), toNano('0.33'), 
            wallet2.address, // NewAddress
        )

        expect(wallet3ChangesAddressToWallet2.transactions).toHaveTransaction({
            from: wallet3.address,
            to: firstADao.address,
            op: ADaoOperationCodes.ChangeMyAddress,
            success: true,
        });

        expect((await firstADao.getAuthorizedAddressData(beginCell().storeAddress(wallet2.address).endCell())).authorized_address).toEqualAddress(wallet2.address);
        expect((await firstADao.getAuthorizedAddressData(beginCell().storeAddress(wallet2.address).endCell())).approval_points).toStrictEqual(BigInt(37));
        expect((await firstADao.getAuthorizedAddressData(beginCell().storeAddress(wallet2.address).endCell())).profit_points).toStrictEqual(BigInt(35));

        printTransactionFees(wallet3ChangesAddressToWallet2.transactions);

    });

    it('Should Propose Transaction: Invite Address wallet3', async () => {

        const proposeWallet3Invitation = await firstADao.sendProposeInviteAddress(wallet0.getSender(), toNano('0.33'), 
            Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30, // Deadline
            wallet3.address, // AddressToInvite
            BigInt(46), // ApprovalPoints
            BigInt(46), // ProfitPoints
        )

        expect(proposeWallet3Invitation.transactions).toHaveTransaction({
            from: wallet0.address,
            to: firstADao.address,
            op: ADaoOperationCodes.ProposeTransaction,
            success: true,
        });

        expect((await firstADao.getPendingTransactionsData(BigInt(0))).transaction_info.beginParse().loadAddress()).toEqualAddress(wallet3.address);

        printTransactionFees(proposeWallet3Invitation.transactions);

    });

    it('Should Propose Transaction: Delete Address wallet1', async () => {

        const proposeWallet1Delete = await firstADao.sendProposeDeleteAddress(wallet2.getSender(), toNano('0.33'), 
            Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30, // Deadline
            wallet1.address, // AddressToDelete
        )

        expect(proposeWallet1Delete.transactions).toHaveTransaction({
            from: wallet2.address,
            to: firstADao.address,
            op: ADaoOperationCodes.ProposeTransaction,
            success: true,
        })

        expect((await firstADao.getPendingTransactionsData(BigInt(1))).transaction_info.beginParse().loadAddress()).toEqualAddress(wallet1.address);

        printTransactionFees(proposeWallet1Delete.transactions);

    });

    it('Should Approve Transaction: Invite Address wallet3', async () => {

        // Wallet0 approves Wallet3 invitation to A DAO

        const wallet0ApprovesWallet3Invitation = await firstADao.sendApprove(wallet0.getSender(), toNano('0.33'), 
            0, // TransactionIndex
        )

        expect(wallet0ApprovesWallet3Invitation.transactions).toHaveTransaction({
            from: wallet0.address,
            to: firstADao.address,
            op: ADaoOperationCodes.ApproveTransaction,
            success: true,
        })

        printTransactionFees(wallet0ApprovesWallet3Invitation.transactions);

        // Wallet2 approves Wallet3 invitation to A DAO

        const wallet2ApprovesWallet3Invitation = await firstADao.sendApprove(wallet2.getSender(), toNano('0.33'), 
            0, // TransactionIndex
        )

        expect(wallet2ApprovesWallet3Invitation.transactions).toHaveTransaction({
            from: wallet2.address,
            to: firstADao.address,
            op: ADaoOperationCodes.ApproveTransaction,
            success: true,
        })

        // Send invitation to wallet3

        expect(wallet2ApprovesWallet3Invitation.transactions).toHaveTransaction({
            from: firstADao.address,
            to: wallet3.address,
            success: true,
            op: ADaoOperationCodes.InviteToADao,
            body: 
                beginCell()
                    .storeUint(ADaoOperationCodes.InviteToADao, 32)
                    .storeUint(3, 32)
                    .storeUint(46, 32)
                    .storeUint(46, 32)
                .endCell(),
        })

        printTransactionFees(wallet2ApprovesWallet3Invitation.transactions);

        // Wallet3 accepts invitation to A DAO

        const wallet3AcceptsInvitation = await firstADao.sendAcceptInvitationToADao(wallet3.getSender(), toNano('0.33'), 
            3, // Passcode
        )

        expect(wallet3AcceptsInvitation.transactions).toHaveTransaction({
            from: wallet3.address,
            to: firstADao.address,
            op: ADaoOperationCodes.AcceptInvitationToADao,
            success: true,
        })

        printTransactionFees(wallet3AcceptsInvitation.transactions);

        const ADaoDataAfterWallet2In = await firstADao.getADaoData();
        expect(ADaoDataAfterWallet2In.total_approval_points).toStrictEqual(BigInt(146));
        expect(ADaoDataAfterWallet2In.total_profit_points).toStrictEqual(BigInt(146));

    });

    it('Wallet3 should quit A DAO', async () => {

        const wallet0QuitsADao = await firstADao.sendQuitADao(wallet3.getSender(), toNano('0.33'));

        expect(wallet0QuitsADao.transactions).toHaveTransaction({
            from: wallet3.address,
            to: firstADao.address,
            op: ADaoOperationCodes.QuitADao,
            success: true,
        });

        printTransactionFees(wallet0QuitsADao.transactions);

        const ADaoDataAfterWallet0Out = await firstADao.getADaoData();
        expect(ADaoDataAfterWallet0Out.total_approval_points).toStrictEqual(BigInt(100));
        expect(ADaoDataAfterWallet0Out.total_profit_points).toStrictEqual(BigInt(100));

    });

    it('Should Approve Transaction: Delete Address wallet1', async () => {

        // Wallet0 approves wallet1 removal

        const wallet0ApprovesWallet1Removal = await firstADao.sendApprove(wallet0.getSender(), toNano('0.33'), 
            1, // TransactionIndex
        )

        expect(wallet0ApprovesWallet1Removal.transactions).toHaveTransaction({
            from: wallet0.address,
            to: firstADao.address,
            op: ADaoOperationCodes.ApproveTransaction,
            success: true,
        })

        printTransactionFees(wallet0ApprovesWallet1Removal.transactions);

        // Wallet2 approves wallet1 removal

        const wallet2ApprovesWallet1Removal = await firstADao.sendApprove(wallet2.getSender(), toNano('0.33'), 
            1, // TransactionIndex
        )

        expect(wallet2ApprovesWallet1Removal.transactions).toHaveTransaction({
            from: wallet2.address,
            to: firstADao.address,
            op: ADaoOperationCodes.ApproveTransaction,
            success: true,
        })

        printTransactionFees(wallet2ApprovesWallet1Removal.transactions);

    });

    it('Should Propose Transaction: Send Collect Funds', async () => {

        const proposeSendCollectFunds = await firstADao.sendProposeSendCollectFunds(wallet2.getSender(), toNano('0.33'), 
            Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30, // Deadline
            0, // ProfitableAddressPasscode
        )

        expect(proposeSendCollectFunds.transactions).toHaveTransaction({
            from: wallet2.address,
            to: firstADao.address,
            op: ADaoOperationCodes.ProposeTransaction,
            success: true,
        })

        printTransactionFees(proposeSendCollectFunds.transactions);

    });

    it('Should Approve Transaction: Send Collect Funds', async () => {

        // Wallet0 approves Send Collect Funds

        const wallet0ApprovesSendCollectFunds = await firstADao.sendApprove(wallet0.getSender(), toNano('0.33'), 
            2, // TransactionIndex
        )

        expect(wallet0ApprovesSendCollectFunds.transactions).toHaveTransaction({
            from: wallet0.address,
            to: firstADao.address,
            op: ADaoOperationCodes.ApproveTransaction,
            success: true,
        });

        printTransactionFees(wallet0ApprovesSendCollectFunds.transactions);

        // Wallet2 approves Send Collect Funds

        const wallet2ApprovesSendCollectFunds = await firstADao.sendApprove(wallet2.getSender(), toNano('0.33'), 
            2, // TransactionIndex
        )

        expect(wallet2ApprovesSendCollectFunds.transactions).toHaveTransaction({
            from: wallet2.address,
            to: firstADao.address,
            op: ADaoOperationCodes.ApproveTransaction,
            success: true,
        })

        expect(wallet2ApprovesSendCollectFunds.transactions).toHaveTransaction({
            from: firstADao.address,
            to: profitableAddress.address,
            op: ADaoInternalOperations.CollectFunds,
            success: true,
        })

        printTransactionFees(wallet2ApprovesSendCollectFunds.transactions);

        const collectFunds = await firstADao.sendFundsToCollect(profitableAddress.getSender(), toNano(333));

        expect(collectFunds.transactions).toHaveTransaction({
            from: profitableAddress.address,
            to: firstADao.address,
            value: toNano(333),
            success: true,
            op: ADaoInternalOperations.CollectFunds,
        })

        printTransactionFees(collectFunds.transactions);

    });

    it('Should Propose Transaction: Distribute Ton', async () => {

        const proposeDistributeTon = await firstADao.sendProposeDistributeTon(wallet2.getSender(), toNano('0.33'), 
            Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30, // Deadline
            toNano(200), // DistributionAmount
        )

        expect(proposeDistributeTon.transactions).toHaveTransaction({
            from: wallet2.address,
            to: firstADao.address,
            op: ADaoOperationCodes.ProposeTransaction,
            success: true,
        })

        printTransactionFees(proposeDistributeTon.transactions);

    });

    it('Should Approve Transaction: Distribute Ton', async () => {

        // Wallet0 approves TON Distribution

        const wallet0ApprovesTonDistribution = await firstADao.sendApprove(wallet0.getSender(), toNano('1'), 
            3, // TransactionIndex
        )

        expect(wallet0ApprovesTonDistribution.transactions).toHaveTransaction({
            from: wallet0.address,
            to: firstADao.address,
            op: ADaoOperationCodes.ApproveTransaction,
            success: true,
        });

        printTransactionFees(wallet0ApprovesTonDistribution.transactions);

        // Wallet2 approves Send Collect Funds

        const wallet2ApprovesTonDistribution = await firstADao.sendApprove(wallet2.getSender(), toNano('3'), 
            3, // TransactionIndex
        )

        expect(wallet2ApprovesTonDistribution.transactions).toHaveTransaction({
            from: wallet2.address,
            to: firstADao.address,
            op: ADaoOperationCodes.ApproveTransaction,
            success: true,
        })

        expect(wallet2ApprovesTonDistribution.transactions).toHaveTransaction({
            from: firstADao.address,
            to: wallet0.address,
            success: true,
        })

        expect(wallet2ApprovesTonDistribution.transactions).toHaveTransaction({
            from: firstADao.address,
            to: wallet2.address,
            success: true,
        })

        printTransactionFees(wallet2ApprovesTonDistribution.transactions);

    });

    it('Should Propose Transaction: Arbitrary Transaction', async () => {

        const proposeArbitraryTransaction = await firstADao.sendProposeArbitraryTransaction(wallet2.getSender(), toNano('0.33'), 
            Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30, // Deadline
            wallet4.address, // Destination
            toNano(0.33), // Amount
            beginCell().storeUint(777, 32).endCell() // MsgBody
        )

        expect(proposeArbitraryTransaction.transactions).toHaveTransaction({
            from: wallet2.address,
            to: firstADao.address,
            op: ADaoOperationCodes.ProposeTransaction,
            success: true,
        })

        printTransactionFees(proposeArbitraryTransaction.transactions);

    });

    it('Should Approve Transaction: Arbitrary Transaction', async () => {

        // Wallet0 approves Arbitrary Transaction

        const wallet0ApprovesArbitraryTransaction = await firstADao.sendApprove(wallet0.getSender(), toNano('0.33'), 
            4, // TransactionIndex
        )

        expect(wallet0ApprovesArbitraryTransaction.transactions).toHaveTransaction({
            from: wallet0.address,
            to: firstADao.address,
            op: ADaoOperationCodes.ApproveTransaction,
            success: true,
        });

        printTransactionFees(wallet0ApprovesArbitraryTransaction.transactions);

        // Wallet2 approves Arbitrary Transaction

        const wallet2ApprovesArbitraryTransaction = await firstADao.sendApprove(wallet2.getSender(), toNano('0.33'), 
            4, // TransactionIndex
        )

        expect(wallet2ApprovesArbitraryTransaction.transactions).toHaveTransaction({
            from: wallet2.address,
            to: firstADao.address,
            op: ADaoOperationCodes.ApproveTransaction,
            success: true,
        })

        expect(wallet2ApprovesArbitraryTransaction.transactions).toHaveTransaction({
            from: firstADao.address,
            to: wallet4.address,
            success: true,
            body: beginCell().storeUint(777, 32).endCell(),
        })

        printTransactionFees(wallet2ApprovesArbitraryTransaction.transactions);

    });

    it('Should Propose Transaction: Update Agreement Percent', async () => {

        const proposeUpdateAgreementPercent = await firstADao.sendProposeUpdateAgreementPercent(wallet2.getSender(), toNano('0.33'), 
            Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30, // Deadline
            BigInt(77), // AgreementPercentNumerator
            BigInt(100), // AgreementPercentDenumerator
        )

        expect(proposeUpdateAgreementPercent.transactions).toHaveTransaction({
            from: wallet2.address,
            to: firstADao.address,
            op: ADaoOperationCodes.ProposeTransaction,
            success: true,
        })

        printTransactionFees(proposeUpdateAgreementPercent.transactions);

    });

    it('Should Approve Transaction: Update Agreement Percent', async () => {

        // Wallet0 approves Update Agreement Percent

        const wallet0ApprovesUpdateAgreementPercent = await firstADao.sendApprove(wallet0.getSender(), toNano('0.33'), 
            5, // TransactionIndex
        )

        expect(wallet0ApprovesUpdateAgreementPercent.transactions).toHaveTransaction({
            from: wallet0.address,
            to: firstADao.address,
            op: ADaoOperationCodes.ApproveTransaction,
            success: true,
        });

        printTransactionFees(wallet0ApprovesUpdateAgreementPercent.transactions);

        // Wallet2 approves Update Agreement Percent

        const wallet2ApprovesUpdateAgreementPercent = await firstADao.sendApprove(wallet2.getSender(), toNano('0.33'), 
            5, // TransactionIndex
        )

        expect(wallet2ApprovesUpdateAgreementPercent.transactions).toHaveTransaction({
            from: wallet2.address,
            to: firstADao.address,
            op: ADaoOperationCodes.ApproveTransaction,
            success: true,
        })

        expect((await firstADao.getADaoData()).agreement_percent_numerator).toStrictEqual(BigInt(77));
        expect((await firstADao.getADaoData()).agreement_percent_denominator).toStrictEqual(BigInt(100));

        printTransactionFees(wallet2ApprovesUpdateAgreementPercent.transactions);

    });

    it('Should Propose Transaction: Transfer Points from Wallet2 to Wallet5 (unauthorized address)', async () => {

        const proposeTransferPoints = await firstADao.sendProposeTransferPoints(wallet2.getSender(), toNano('0.33'), 
            Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30, // Deadline
            wallet5.address, // Recipient
            BigInt(10), // ApprovalPoints
            BigInt(10), // ProfitPoints
        )

        expect(proposeTransferPoints.transactions).toHaveTransaction({
            from: wallet2.address,
            to: firstADao.address,
            op: ADaoOperationCodes.ProposeTransaction,
            success: true,
        })

        printTransactionFees(proposeTransferPoints.transactions);

    });

    it('Should Approve Transaction: Transfer Points from Wallet2 to Wallet5 (unauthorized address)', async () => {

        // Wallet0 approves Transfer Points

        const wallet0ApprovesTransferPoints = await firstADao.sendApprove(wallet0.getSender(), toNano('0.33'), 
            6, // TransactionIndex
        )

        expect(wallet0ApprovesTransferPoints.transactions).toHaveTransaction({
            from: wallet0.address,
            to: firstADao.address,
            op: ADaoOperationCodes.ApproveTransaction,
            success: true,
        });

        printTransactionFees(wallet0ApprovesTransferPoints.transactions);

        // Wallet2 approves Transfer Points

        const wallet2ApprovesTransferPoints = await firstADao.sendApprove(wallet2.getSender(), toNano('0.33'), 
            6, // TransactionIndex
        )

        expect(wallet2ApprovesTransferPoints.transactions).toHaveTransaction({
            from: wallet2.address,
            to: firstADao.address,
            op: ADaoOperationCodes.ApproveTransaction,
            success: true,
        })

        printTransactionFees(wallet2ApprovesTransferPoints.transactions);

    });

    it('Should Propose Transaction: Transfer Points To Authorized Address', async () => {

        const proposeTransferPoints = await firstADao.sendProposeTransferPoints(wallet2.getSender(), toNano('0.33'), 
            Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30, // Deadline
            wallet2.address, // Recipient
            BigInt(10), // ApprovalPoints
            BigInt(10), // ProfitPoints
        )

        expect(proposeTransferPoints.transactions).toHaveTransaction({
            from: wallet2.address,
            to: firstADao.address,
            op: ADaoOperationCodes.ProposeTransaction,
            success: true,
        })

        printTransactionFees(proposeTransferPoints.transactions);

    });

    it('Should Approve Transaction: Transfer Points To Authorized Address', async () => {

        // Wallet0 approves Transfer Points

        const wallet0ApprovesTransferPoints = await firstADao.sendApprove(wallet0.getSender(), toNano('0.33'), 
            7, // TransactionIndex
        )

        expect(wallet0ApprovesTransferPoints.transactions).toHaveTransaction({
            from: wallet0.address,
            to: firstADao.address,
            op: ADaoOperationCodes.ApproveTransaction,
            success: true,
        });

        printTransactionFees(wallet0ApprovesTransferPoints.transactions);

        // Wallet2 approves Transfer Points

        const wallet2ApprovesTransferPoints = await firstADao.sendApprove(wallet2.getSender(), toNano('0.33'), 
            7, // TransactionIndex
        )

        expect(wallet2ApprovesTransferPoints.transactions).toHaveTransaction({
            from: wallet2.address,
            to: firstADao.address,
            op: ADaoOperationCodes.ApproveTransaction,
            success: true,
        })

        printTransactionFees(wallet2ApprovesTransferPoints.transactions);

    });

    it('Should Propose Transaction: Delete Pending Invitations', async () => {

        // Create first Invite Address pending transactions

        const proposeWallet4Invitation = await firstADao.sendProposeInviteAddress(wallet0.getSender(), toNano('0.33'), 
            Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30, // Deadline
            wallet3.address, // AddressToInvite
            BigInt(46), // ApprovalPoints
            BigInt(46), // ProfitPoints
        )

        expect(proposeWallet4Invitation.transactions).toHaveTransaction({
            from: wallet0.address,
            to: firstADao.address,
            op: ADaoOperationCodes.ProposeTransaction,
            success: true,
        })

        printTransactionFees(proposeWallet4Invitation.transactions);

        // Wallet0 approves wallet4 invitation

        const wallet0ApprovesTransferPoints = await firstADao.sendApprove(wallet0.getSender(), toNano('0.33'), 
            8, // TransactionIndex
        )

        expect(wallet0ApprovesTransferPoints.transactions).toHaveTransaction({
            from: wallet0.address,
            to: firstADao.address,
            op: ADaoOperationCodes.ApproveTransaction,
            success: true,
        });

        printTransactionFees(wallet0ApprovesTransferPoints.transactions);

        // Wallet2 approves wallet4 invitation

        const wallet2ApprovesTransferPoints = await firstADao.sendApprove(wallet2.getSender(), toNano('0.33'), 
            8, // TransactionIndex
        )

        expect(wallet2ApprovesTransferPoints.transactions).toHaveTransaction({
            from: wallet2.address,
            to: firstADao.address,
            op: ADaoOperationCodes.ApproveTransaction,
            success: true,
        })

        printTransactionFees(wallet2ApprovesTransferPoints.transactions);

        // Create second Invite Address pending transactions

        const proposeWallet5Invitation = await firstADao.sendProposeInviteAddress(wallet0.getSender(), toNano('0.33'), 
            Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30, // Deadline
            wallet3.address, // AddressToInvite
            BigInt(46), // ApprovalPoints
            BigInt(46), // ProfitPoints
        )

        expect(proposeWallet5Invitation.transactions).toHaveTransaction({
            from: wallet0.address,
            to: firstADao.address,
            op: ADaoOperationCodes.ProposeTransaction,
            success: true,
        })

        printTransactionFees(proposeWallet5Invitation.transactions);

        // Wallet0 approves wallet5 invitation

        const wallet0ApprovesWallet5Invitation = await firstADao.sendApprove(wallet0.getSender(), toNano('0.33'), 
            9, // TransactionIndex
        )

        expect(wallet0ApprovesWallet5Invitation.transactions).toHaveTransaction({
            from: wallet0.address,
            to: firstADao.address,
            op: ADaoOperationCodes.ApproveTransaction,
            success: true,
        });

        printTransactionFees(wallet0ApprovesWallet5Invitation.transactions);

        // Wallet2 approves wallet5 invitation

        const wallet2ApprovesWallet5Invitation = await firstADao.sendApprove(wallet2.getSender(), toNano('0.33'), 
            9, // TransactionIndex
        )

        expect(wallet2ApprovesWallet5Invitation.transactions).toHaveTransaction({
            from: wallet2.address,
            to: firstADao.address,
            op: ADaoOperationCodes.ApproveTransaction,
            success: true,
        })

        printTransactionFees(wallet2ApprovesWallet5Invitation.transactions);

        // Create third Invite Address pending transactions

        const proposeWallet6Invitation = await firstADao.sendProposeInviteAddress(wallet0.getSender(), toNano('0.33'), 
            Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30, // Deadline
            wallet6.address, // AddressToInvite
            BigInt(46), // ApprovalPoints
            BigInt(46), // ProfitPoints
        )

        expect(proposeWallet6Invitation.transactions).toHaveTransaction({
            from: wallet0.address,
            to: firstADao.address,
            op: ADaoOperationCodes.ProposeTransaction,
            success: true,
        })

        printTransactionFees(proposeWallet6Invitation.transactions);

        // Wallet0 approves wallet6 invitation

        const wallet0ApprovesWallet6Invitation = await firstADao.sendApprove(wallet0.getSender(), toNano('0.33'), 
            10, // TransactionIndex
        )

        expect(wallet0ApprovesWallet6Invitation.transactions).toHaveTransaction({
            from: wallet0.address,
            to: firstADao.address,
            op: ADaoOperationCodes.ApproveTransaction,
            success: true,
        });

        printTransactionFees(wallet0ApprovesWallet6Invitation.transactions);

        // Wallet2 approves wallet6 invitation

        const wallet2ApprovesWallet6Invitation = await firstADao.sendApprove(wallet2.getSender(), toNano('0.33'), 
            10, // TransactionIndex
        )

        expect(wallet2ApprovesWallet6Invitation.transactions).toHaveTransaction({
            from: wallet2.address,
            to: firstADao.address,
            op: ADaoOperationCodes.ApproveTransaction,
            success: true,
        })

        printTransactionFees(wallet2ApprovesWallet6Invitation.transactions);

        const PendingInvitationsForRemovalDict = Dictionary.empty<bigint, Slice>();
        PendingInvitationsForRemovalDict.set(BigInt(0), beginCell().endCell().beginParse());
        PendingInvitationsForRemovalDict.set(BigInt(1), beginCell().endCell().beginParse());
        PendingInvitationsForRemovalDict.set(BigInt(2), beginCell().endCell().beginParse());
        const PendingInvitationsForRemoval = beginCell().storeDictDirect(PendingInvitationsForRemovalDict, Dictionary.Keys.BigUint(32), createSliceValue()).endCell();

        const sendProposeDeletePendingInvitations = await firstADao.sendProposeDeletePendingTransactions(wallet2.getSender(), toNano('0.33'),
            Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30, // Deadline
            PendingInvitationsForRemoval
        )

        expect(sendProposeDeletePendingInvitations.transactions).toHaveTransaction({
            from: wallet2.address,
            to: firstADao.address,
            op: ADaoOperationCodes.ProposeTransaction,
            success: true,
        });

        printTransactionFees(sendProposeDeletePendingInvitations.transactions);

    });

    it('Should Approve Transaction: Delete Pending Invitations', async () => {

        // Wallet0 approves Delete Pending Invitations

        const wallet0ApprovesDeletePendingInvitations = await firstADao.sendApprove(wallet0.getSender(), toNano('0.33'), 
            11, // TransactionIndex
        )

        expect(wallet0ApprovesDeletePendingInvitations.transactions).toHaveTransaction({
            from: wallet0.address,
            to: firstADao.address,
            op: ADaoOperationCodes.ApproveTransaction,
            success: true,
        });

        printTransactionFees(wallet0ApprovesDeletePendingInvitations.transactions);

        // Wallet2 approves Delete Pending Invitations

        const wallet2ApprovesDeletePendingInvitations = await firstADao.sendApprove(wallet2.getSender(), toNano('0.33'), 
            11, // TransactionIndex
        )

        expect(wallet2ApprovesDeletePendingInvitations.transactions).toHaveTransaction({
            from: wallet2.address,
            to: firstADao.address,
            op: ADaoOperationCodes.ApproveTransaction,
            success: true,
        })

        printTransactionFees(wallet2ApprovesDeletePendingInvitations.transactions);

    });

    it('Should Propose Transaction: Delete Pending Transactions', async () => {

        // Create 3 pending transactions

        const proposeTransferPoints = await firstADao.sendProposeTransferPoints(wallet2.getSender(), toNano('0.33'), 
            Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30, // Deadline
            wallet2.address, // Recipient
            BigInt(10), // ApprovalPoints
            BigInt(10), // ProfitPoints
        )

        expect(proposeTransferPoints.transactions).toHaveTransaction({
            from: wallet2.address,
            to: firstADao.address,
            op: ADaoOperationCodes.ProposeTransaction,
            success: true,
        })

        printTransactionFees(proposeTransferPoints.transactions);

        const proposeUpdateAgreementPercent = await firstADao.sendProposeUpdateAgreementPercent(wallet2.getSender(), toNano('0.33'), 
            Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30, // Deadline
            BigInt(77), // AgreementPercentNumerator
            BigInt(100), // AgreementPercentDenumerator
        )

        expect(proposeUpdateAgreementPercent.transactions).toHaveTransaction({
            from: wallet2.address,
            to: firstADao.address,
            op: ADaoOperationCodes.ProposeTransaction,
            success: true,
        })

        printTransactionFees(proposeUpdateAgreementPercent.transactions);

        const proposeDistributeTon = await firstADao.sendProposeDistributeTon(wallet2.getSender(), toNano('0.33'), 
            Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30, // Deadline
            toNano(200), // DistributionAmount
        )

        expect(proposeDistributeTon.transactions).toHaveTransaction({
            from: wallet2.address,
            to: firstADao.address,
            op: ADaoOperationCodes.ProposeTransaction,
            success: true,
        })

        printTransactionFees(proposeDistributeTon.transactions);

        // Propose Delete Pending transactions

        const PendingTransactionsForRemovalDict = Dictionary.empty<bigint, Slice>();
        PendingTransactionsForRemovalDict.set(BigInt(0), beginCell().endCell().beginParse());
        PendingTransactionsForRemovalDict.set(BigInt(1), beginCell().endCell().beginParse());
        const PendingTransactionsForRemoval = beginCell().storeDictDirect(PendingTransactionsForRemovalDict, Dictionary.Keys.BigUint(32), createSliceValue()).endCell();

        const proposeDeletePendingTransactions = await firstADao.sendProposeDeletePendingTransactions(wallet2.getSender(), toNano('0.33'),
            Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30, // Deadline
            PendingTransactionsForRemoval
        );

        expect(proposeDeletePendingTransactions.transactions).toHaveTransaction({
            from: wallet2.address,
            to: firstADao.address,
            op: ADaoOperationCodes.ProposeTransaction,
            success: true,
        });

        printTransactionFees(proposeDeletePendingTransactions.transactions);

    });

    it('Should Approve Transaction: Delete Pending Transactions', async () => {

        // Wallet0 approves Delete Pending Transactions

        const wallet0ApprovesDeletePendingTransactions = await firstADao.sendApprove(wallet0.getSender(), toNano('0.33'), 
            15, // TransactionIndex
        )

        expect(wallet0ApprovesDeletePendingTransactions.transactions).toHaveTransaction({
            from: wallet0.address,
            to: firstADao.address,
            op: ADaoOperationCodes.ApproveTransaction,
            success: true,
        });

        printTransactionFees(wallet0ApprovesDeletePendingTransactions.transactions);

        // Wallet2 approves Delete Pending Transactions

        const wallet2ApprovesDeletePendingTransactions = await firstADao.sendApprove(wallet2.getSender(), toNano('0.33'), 
            15, // TransactionIndex
        )

        expect(wallet2ApprovesDeletePendingTransactions.transactions).toHaveTransaction({
            from: wallet2.address,
            to: firstADao.address,
            op: ADaoOperationCodes.ApproveTransaction,
            success: true,
        })

        printTransactionFees(wallet2ApprovesDeletePendingTransactions.transactions);

    });

    it('Should Propose Transaction: Put Up Points For Sale To Authorized Address', async () => {

        expect((await firstADao.getAuthorizedAddressData(beginCell().storeAddress(wallet2.address).endCell())).approval_points).toStrictEqual(BigInt(37));
        expect((await firstADao.getAuthorizedAddressData(beginCell().storeAddress(wallet2.address).endCell())).profit_points).toStrictEqual(BigInt(35));

        expect((await firstADao.getAuthorizedAddressData(beginCell().storeAddress(wallet0.address).endCell())).approval_points).toStrictEqual(BigInt(28));
        expect((await firstADao.getAuthorizedAddressData(beginCell().storeAddress(wallet0.address).endCell())).profit_points).toStrictEqual(BigInt(37));

        const proposeTransferPoints = await firstADao.sendPutUpPointsForSale(wallet2.getSender(), toNano('0.33'), 
            Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30, // Deadline
            wallet0.address, // PointsBuyer
            toNano(100), // Price
            BigInt(10), // ApprovalPointsForSale
            BigInt(10), // ProfitPointsForSale
        );

        expect(proposeTransferPoints.transactions).toHaveTransaction({
            from: wallet2.address,
            to: firstADao.address,
            op: ADaoOperationCodes.ProposeTransaction,
            success: true,
        })

        printTransactionFees(proposeTransferPoints.transactions);

    });

    it('Should Approve Transaction: Put Up Points For Sale', async () => {

        // Wallet0 approves Put Up Points For Sale

        const wallet0ApprovesPutUpPintsForSale = await firstADao.sendApprove(wallet0.getSender(), toNano('0.33'), 
            16, // TransactionIndex
        )

        expect(wallet0ApprovesPutUpPintsForSale.transactions).toHaveTransaction({
            from: wallet0.address,
            to: firstADao.address,
            op: ADaoOperationCodes.ApproveTransaction,
            success: true,
        });

        printTransactionFees(wallet0ApprovesPutUpPintsForSale.transactions);

        // Wallet2 approves Put Up Points For Sale

        const wallet2ApprovesPutUpPointsForSale = await firstADao.sendApprove(wallet2.getSender(), toNano('0.33'), 
            16, // TransactionIndex
        )

        expect(wallet2ApprovesPutUpPointsForSale.transactions).toHaveTransaction({
            from: wallet2.address,
            to: firstADao.address,
            op: ADaoOperationCodes.ApproveTransaction,
            success: true,
        })

        expect(wallet2ApprovesPutUpPointsForSale.transactions).toHaveTransaction({
            from: firstADao.address,
            to: aDaoMaster.address,
            op: ADaoInternalOperations.StartPointSale,
            success: true,
        })

        const pointsSellerAddress = await aDaoMaster.getPointsSellerAddressByIndex(BigInt(0));

        expect(wallet2ApprovesPutUpPointsForSale.transactions).toHaveTransaction({
            from: aDaoMaster.address,
            to: pointsSellerAddress,
            op: ADaoInternalOperations.StartPointSale,
            deploy: true,
            success: true
        });

        const pointsSeller = blockchain.openContract(PointsSeller.createFromAddress(pointsSellerAddress));

        const wallet0BuysPointsFromWallet2 = await pointsSeller.sendBuy(wallet0.getSender(), toNano(100));

        expect(wallet0BuysPointsFromWallet2.transactions).toHaveTransaction({
            from: wallet0.address,
            to: pointsSeller.address,
            success: true,
        })

        expect(wallet0BuysPointsFromWallet2.transactions).toHaveTransaction({
            from: pointsSeller.address,
            to: firstADao.address,
            op: PointsSellerOperations.TransferBoughtPoints,
            success: true,
        })

        // expect((await firstADao.getAuthorizedAddressData(beginCell().storeAddress(wallet2.address).endCell())).approval_points).toStrictEqual(BigInt(27));
        // expect((await firstADao.getAuthorizedAddressData(beginCell().storeAddress(wallet2.address).endCell())).profit_points).toStrictEqual(BigInt(25));

        expect((await firstADao.getAuthorizedAddressData(beginCell().storeAddress(wallet0.address).endCell())).approval_points).toStrictEqual(BigInt(38));
        expect((await firstADao.getAuthorizedAddressData(beginCell().storeAddress(wallet0.address).endCell())).profit_points).toStrictEqual(BigInt(47));

        printTransactionFees(wallet2ApprovesPutUpPointsForSale.transactions);

    });

});
