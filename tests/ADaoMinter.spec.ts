import { Blockchain, SandboxContract, TreasuryContract, printTransactionFees } from '@ton/sandbox';
import { Address, beginCell, Cell, Dictionary, Slice, toNano, TransactionDescriptionGeneric } from '@ton/core';
import { ADaoMinter } from '../wrappers/ADaoMinter';
import { ADao } from '../wrappers/ADao';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';
import { profile } from 'console';
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
        PendingInvitationsDict.set(BigInt(0), beginCell().storeAddress(wallet0.address).storeUint(10 ,32).storeUint(10, 32).endCell());
        PendingInvitationsDict.set(BigInt(1), beginCell().storeAddress(wallet1.address).storeUint(20 ,32).storeUint(20, 32).endCell());
        const PendingInvitations = beginCell().storeDictDirect(PendingInvitationsDict, Dictionary.Keys.BigUint(32), Dictionary.Values.Cell()).endCell();

        const ADaoMinterActivationResult = await firstADao.sendActivateADao(deployer.getSender(), toNano('0.33'), {
            AgreementPercentNumerator: 33,
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
                    .storeUint(10, 32)
                    .storeUint(10, 32)
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
                    .storeUint(20, 32)
                    .storeUint(20, 32)
                .endCell(),
        });

        printTransactionFees(ADaoMinterActivationResult.transactions);

        const ADaoDataAfterActivation = await firstADao.getADaoData();
        expect(ADaoDataAfterActivation.active).toStrictEqual(1);

        // Wallet0 accepts invitation to A DAO

        const wallet0AcceptsInvitation = await firstADao.sendAcceptInvitationToADao(wallet0.getSender(), toNano('0.33'), {
            Key: 0,
        })

        expect(wallet0AcceptsInvitation.transactions).toHaveTransaction({
            from: wallet0.address,
            to: firstADao.address,
            op: ADaoOperationCodes.AcceptInvitationToADao,
            success: true,
        })

        printTransactionFees(wallet0AcceptsInvitation.transactions);
        
        // Wallet1 accepts invitation to A DAO

        const wallet1AcceptsInvitation = await firstADao.sendAcceptInvitationToADao(wallet1.getSender(), toNano('0.33'), {
            Key: 1
        })

        expect(wallet1AcceptsInvitation.transactions).toHaveTransaction({
            from: wallet1.address,
            to: firstADao.address,
            op: ADaoOperationCodes.AcceptInvitationToADao,
            success: true,
        })

        printTransactionFees(wallet1AcceptsInvitation.transactions);

    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and ADaoMinter are ready to use
    });
});
