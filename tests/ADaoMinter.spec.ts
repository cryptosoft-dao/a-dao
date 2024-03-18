import { Blockchain, BlockchainSnapshot, internal, SandboxContract, TreasuryContract, printTransactionFees } from '@ton/sandbox';
import { Address, beginCell, Cell, Dictionary, Slice, toNano, TransactionDescriptionGeneric } from '@ton/core';
import { ADaoMinter } from '../wrappers/ADaoMinter';
import { ADao } from '../wrappers/ADao';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';
import { ADaoOperationCodes } from '../wrappers/Config';

describe('ADaoMinter', () => {

    const blockchainStartTime = 100;

    let blockchain: Blockchain;

    let aDaoMinter: SandboxContract<ADaoMinter>;
    let firstADao: SandboxContract<ADao>;
    let secondADao: SandboxContract<ADao>;
    let deployer: SandboxContract<TreasuryContract>;
    let wallet0: SandboxContract<TreasuryContract>;
    let wallet1: SandboxContract<TreasuryContract>;
    let wallet2: SandboxContract<TreasuryContract>;
    let wallet3: SandboxContract<TreasuryContract>;
    let wallet4: SandboxContract<TreasuryContract>;
    let wallet5: SandboxContract<TreasuryContract>;
    let profitableAddress: SandboxContract<TreasuryContract>;

    let ADaoMinterCode: Cell;
    let ADaoCode: Cell;

    beforeAll(async () => {

        ADaoMinterCode = await compile('ADaoMinter');
        ADaoCode = await compile('ADao');

        blockchain = await Blockchain.create();
        blockchain.now = blockchainStartTime;

        deployer = await blockchain.treasury('deployer');
        wallet0 = await blockchain.treasury('wallet0');
        wallet1 = await blockchain.treasury('wallet1');
        wallet2 = await blockchain.treasury('wallet2');
        wallet3 = await blockchain.treasury('wallet3');
        wallet4 = await blockchain.treasury('wallet4');
        wallet5 = await blockchain.treasury('wallet5');
        profitableAddress = await blockchain.treasury('profitableAddress');

        // Params

        aDaoMinter = blockchain.openContract(
            ADaoMinter.createFromConfig(
                {
                    OwnerAddress: deployer.address,
                    ADaoCode: ADaoCode,
                    NextADaoCreationFee: toNano('10'),
                    NextADaoTransactionFee: toNano('0'),
                }, 
                ADaoMinterCode,
            ),
        );

        const ADaoMinterDeployResult = await aDaoMinter.sendDeploy(deployer.getSender(), toNano('10.777'));

        expect(ADaoMinterDeployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: aDaoMinter.address,
            deploy: true,
            success: true,
        });

        const firstADaoAddresss = await aDaoMinter.getADaoAddressByDeployerAddress(deployer.address);

        expect(ADaoMinterDeployResult.transactions).toHaveTransaction({
            from: aDaoMinter.address,
            to: firstADaoAddresss,
            deploy: true,
            success: true,
        });

        printTransactionFees(ADaoMinterDeployResult.transactions);

        firstADao = blockchain.openContract(ADao.createFromAddress(firstADaoAddresss));

        const ADaoDataBeforeActivation = await firstADao.getADaoData();
        expect(ADaoDataBeforeActivation.active).toStrictEqual(0);

        /*

        blockchain.setVerbosityForAddress(firstADao.address, {
            blockchainLogs: true,
            vmLogs: 'vm_logs_full'
        }) 

        */

        // Activate a-dao

        const bufferToBigInt = (val: Buffer) => BigInt('0x' + val.toString('hex'));

        const ProfitableAddressesDict = Dictionary.empty<bigint, Cell>();
        ProfitableAddressesDict.set(bufferToBigInt(profitableAddress.address.hash), beginCell().storeAddress(profitableAddress.address).endCell());
        const ProfitableAddresses = beginCell().storeDictDirect(ProfitableAddressesDict, Dictionary.Keys.BigUint(256), Dictionary.Values.Cell()).endCell();

        const PendingInvitationsDict = Dictionary.empty<bigint, Cell>();
        PendingInvitationsDict.set(BigInt(0), beginCell().storeAddress(wallet0.address).storeUint(28 ,32).storeUint(37, 32).endCell());
        PendingInvitationsDict.set(BigInt(1), beginCell().storeAddress(wallet1.address).storeUint(35 ,32).storeUint(28, 32).endCell());
        PendingInvitationsDict.set(BigInt(2), beginCell().storeAddress(wallet2.address).storeUint(37 ,32).storeUint(35, 32).endCell());
        const PendingInvitations = beginCell().storeDictDirect(PendingInvitationsDict, Dictionary.Keys.BigUint(32), Dictionary.Values.Cell()).endCell();

        const ADaoMinterActivationResult = await firstADao.sendActivateADao(deployer.getSender(), toNano('0.33'), {
            AgreementPercentNumerator: 51,
            AgreementPercentDenominator: 100,
            ProfitReservePercentNumerator: 10,
            ProfitReservePercentDenominator: 100,
            ProfitableAddresses: ProfitableAddresses,
            PendingInvitations: PendingInvitations,
        });

        expect(ADaoMinterActivationResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: firstADao.address,
            success: true,
        });

        expect(ADaoMinterActivationResult.transactions).toHaveTransaction({
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

        expect(ADaoMinterActivationResult.transactions).toHaveTransaction({
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

        expect(ADaoMinterActivationResult.transactions).toHaveTransaction({
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

        printTransactionFees(ADaoMinterActivationResult.transactions);

        const ADaoDataAfterActivation = await firstADao.getADaoData();
        expect(ADaoDataAfterActivation.active).toStrictEqual(-1);

        // Wallet0 accepts invitation to A DAO

        const wallet0AcceptsInvitation = await firstADao.sendAcceptInvitationToADao(wallet0.getSender(), toNano('0.33'), {
            Passcode: 0,
        })

        expect(wallet0AcceptsInvitation.transactions).toHaveTransaction({
            from: wallet0.address,
            to: firstADao.address,
            op: ADaoOperationCodes.AcceptInvitationToADao,
            success: true,
        })

        printTransactionFees(wallet0AcceptsInvitation.transactions);

        const ADaoDataAfterWallet0In = await firstADao.getADaoData();
        expect(ADaoDataAfterWallet0In.total_approval_points).toStrictEqual(BigInt(28));
        expect(ADaoDataAfterWallet0In.total_profit_points).toStrictEqual(BigInt(37));
        
        // Wallet1 accepts invitation to A DAO

        const wallet1AcceptsInvitation = await firstADao.sendAcceptInvitationToADao(wallet1.getSender(), toNano('0.33'), {
            Passcode: 1,
        })

        expect(wallet1AcceptsInvitation.transactions).toHaveTransaction({
            from: wallet1.address,
            to: firstADao.address,
            op: ADaoOperationCodes.AcceptInvitationToADao,
            success: true,
        })

        printTransactionFees(wallet1AcceptsInvitation.transactions);

        const ADaoDataAfterWallet1In = await firstADao.getADaoData();
        expect(ADaoDataAfterWallet1In.total_approval_points).toStrictEqual(BigInt(63));
        expect(ADaoDataAfterWallet1In.total_profit_points).toStrictEqual(BigInt(65));

        // Wallet2 accepts invitation to A DAO

        const wallet2AcceptsInvitation = await firstADao.sendAcceptInvitationToADao(wallet2.getSender(), toNano('0.33'), {
            Passcode: 2,
        })

        expect(wallet2AcceptsInvitation.transactions).toHaveTransaction({
            from: wallet2.address,
            to: firstADao.address,
            op: ADaoOperationCodes.AcceptInvitationToADao,
            success: true,
        })

        printTransactionFees(wallet1AcceptsInvitation.transactions);

        const ADaoDataAfterWallet2In = await firstADao.getADaoData();
        expect(ADaoDataAfterWallet2In.total_approval_points).toStrictEqual(BigInt(100));
        expect(ADaoDataAfterWallet2In.total_profit_points).toStrictEqual(BigInt(100));

    });

    it('Change Wallet2 address to Wallet3 address and change back', async () => {

        const wallet2ChangesAddressToWallet2 = await firstADao.sendChangeMyAddress(wallet2.getSender(), toNano('0.33'), {
            Passcode: 2,
            NewAddress: wallet3.address,
        })

        expect(wallet2ChangesAddressToWallet2.transactions).toHaveTransaction({
            from: wallet2.address,
            to: firstADao.address,
            op: ADaoOperationCodes.ChangeMyAddress,
            success: true,
        })

        printTransactionFees(wallet2ChangesAddressToWallet2.transactions);

        const wallet3ChangesAddressToWallet2 = await firstADao.sendChangeMyAddress(wallet3.getSender(), toNano('0.33'), {
            Passcode: 2,
            NewAddress: wallet2.address,
        })

        expect(wallet3ChangesAddressToWallet2.transactions).toHaveTransaction({
            from: wallet3.address,
            to: firstADao.address,
            op: ADaoOperationCodes.ChangeMyAddress,
            success: true,
        })

        printTransactionFees(wallet3ChangesAddressToWallet2.transactions);

    });

    it('Should Propose Transaction: Invite Address wallet3', async () => {

        const proposeWallet3Invitation = await firstADao.sendProposeInviteAddress(wallet0.getSender(), toNano('0.33'), {
            Passcode: 0,
            Deadline: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30,
            AddressToInvite: wallet3.address,
            ApprovalPoints: BigInt(46),
            ProfitPoints: BigInt(46),
        })

        expect(proposeWallet3Invitation.transactions).toHaveTransaction({
            from: wallet0.address,
            to: firstADao.address,
            op: ADaoOperationCodes.ProposeTransaction,
            success: true,
        })

        printTransactionFees(proposeWallet3Invitation.transactions);

    });

    it('Wallet0 should approve wallet3 invitation', async () => {

        const wallet0ApprovesWallet3Invitation = await firstADao.sendApproveInviteAddress(wallet0.getSender(), toNano('0.33'), {
            Passcode: 0,
            TransactionIndex: 0,
        })

        expect(wallet0ApprovesWallet3Invitation.transactions).toHaveTransaction({
            from: wallet0.address,
            to: firstADao.address,
            op: ADaoOperationCodes.ApproveTransaction,
            success: true,
        })

        printTransactionFees(wallet0ApprovesWallet3Invitation.transactions);

    });

    it('Wallet2 should approve wallet3 invitation', async () => {

        const wallet2ApprovesWallet3Invitation = await firstADao.sendApproveInviteAddress(wallet2.getSender(), toNano('0.33'), {
            Passcode: 2,
            TransactionIndex: 0,
        })

        expect(wallet2ApprovesWallet3Invitation.transactions).toHaveTransaction({
            from: wallet2.address,
            to: firstADao.address,
            op: ADaoOperationCodes.ApproveTransaction,
            success: true,
        })

        printTransactionFees(wallet2ApprovesWallet3Invitation.transactions);

    });

    it('Wallet3 should accept invitation', async () => {

        const wallet3AcceptsInvitation = await firstADao.sendAcceptInvitationToADao(wallet3.getSender(), toNano('0.33'), {
            Passcode: 3,
        })

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

        const wallet0QuitsADao = await firstADao.sendQuitADao(wallet3.getSender(), toNano('0.33'), {
            Passcode: 3,
        })

        expect(wallet0QuitsADao.transactions).toHaveTransaction({
            from: wallet3.address,
            to: firstADao.address,
            op: ADaoOperationCodes.QuitADao,
            success: true,
        })

        printTransactionFees(wallet0QuitsADao.transactions);

        const ADaoDataAfterWallet0Out = await firstADao.getADaoData();
        expect(ADaoDataAfterWallet0Out.total_approval_points).toStrictEqual(BigInt(100));
        expect(ADaoDataAfterWallet0Out.total_profit_points).toStrictEqual(BigInt(100));

    });

    it('Should Propose Transaction: Delete Address wallet1', async () => {

        const proposeWallet1Delete = await firstADao.sendProposeDeleteAddress(wallet2.getSender(), toNano('0.33'), {
            Passcode: 2,
            Deadline: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30,
            AddressToDelete: wallet1.address,
        })

        expect(proposeWallet1Delete.transactions).toHaveTransaction({
            from: wallet2.address,
            to: firstADao.address,
            op: ADaoOperationCodes.ProposeTransaction,
            success: true,
        })

        printTransactionFees(proposeWallet1Delete.transactions);

    });

    it('Should Propose Transaction: Withdraw Profit', async () => {

        const proposeWithdrawProfit = await firstADao.sendProposeWithdrawProfit(wallet2.getSender(), toNano('0.33'), {
            Passcode: 2,
            Deadline: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30,
        })

        expect(proposeWithdrawProfit.transactions).toHaveTransaction({
            from: wallet2.address,
            to: firstADao.address,
            op: ADaoOperationCodes.ProposeTransaction,
            success: true,
        })

        printTransactionFees(proposeWithdrawProfit.transactions);

    });

    it('Should Propose Transaction: Distribute Ton', async () => {

        const proposeDistributeTon = await firstADao.sendProposeDistributeTon(wallet2.getSender(), toNano('0.33'), {
            Passcode: 2,
            Deadline: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30,
            DistributionAmount: toNano(333),
        })

        expect(proposeDistributeTon.transactions).toHaveTransaction({
            from: wallet2.address,
            to: firstADao.address,
            op: ADaoOperationCodes.ProposeTransaction,
            success: true,
        })

        printTransactionFees(proposeDistributeTon.transactions);

    });

    it('Should Propose Transaction: Arbitrary Transaction', async () => {

        const proposeArbitraryTransaction = await firstADao.sendProposeArbitraryTransaction(wallet2.getSender(), toNano('0.33'), {
            Passcode: 2,
            Deadline: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30,
            Destination: wallet5.address,
            Amount: toNano(0.33),
            MsgBody: beginCell().endCell()
        })

        expect(proposeArbitraryTransaction.transactions).toHaveTransaction({
            from: wallet2.address,
            to: firstADao.address,
            op: ADaoOperationCodes.ProposeTransaction,
            success: true,
        })

        printTransactionFees(proposeArbitraryTransaction.transactions);

    });

    it('Should Propose Transaction: Update Agreement Percent', async () => {

        const proposeUpdateAgreementPercent = await firstADao.sendProposeUpdateAgreementPercent(wallet2.getSender(), toNano('0.33'), {
            Passcode: 2,
            Deadline: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30,
            AgreementPercentNumerator: BigInt(33),
            AgreementPercentDenumerator: BigInt(33),
        })

        expect(proposeUpdateAgreementPercent.transactions).toHaveTransaction({
            from: wallet2.address,
            to: firstADao.address,
            op: ADaoOperationCodes.ProposeTransaction,
            success: true,
        })

        printTransactionFees(proposeUpdateAgreementPercent.transactions);

    });

    it('Should Propose Transaction: Transfer Points', async () => {

        const proposeTransferPoints = await firstADao.sendProposeTransferPoints(wallet2.getSender(), toNano('0.33'), {
            Passcode: 2,
            Deadline: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30,
            Destination: wallet5.address,
            ApprovalPoints: BigInt(10),
            ProfitPoints: BigInt(10),
        })

        expect(proposeTransferPoints.transactions).toHaveTransaction({
            from: wallet2.address,
            to: firstADao.address,
            op: ADaoOperationCodes.ProposeTransaction,
            success: true,
        })

        printTransactionFees(proposeTransferPoints.transactions);

    });

});
