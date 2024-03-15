import { Blockchain, SandboxContract, TreasuryContract, printTransactionFees } from '@ton/sandbox';
import { Address, beginCell, Cell, Dictionary, toNano, TransactionDescriptionGeneric } from '@ton/core';
import { ADaoMinter } from '../wrappers/ADaoMinter';
import { ADao } from '../wrappers/ADao';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';

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

        /* 
        
        blockchain.setVerbosityForAddress(ADaoMinter.address, {
            blockchainLogs: true,
            vmLogs: 'vm_logs_full'
        }) 
        
        */

        const ADaoMinterDeployResult = await aDaoMinter.sendDeploy(deployer.getSender(), toNano('10.777'));

        expect(ADaoMinterDeployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: aDaoMinter.address,
            deploy: true,
            success: true,
        });

        const bufferToBigInt = (val: Buffer) => BigInt('0x' + val.toString('hex'));
        const firstADaoAddresss = await aDaoMinter.getADaoAddressByDeployerAddress(deployer.address);

        console.log(firstADaoAddresss);

        expect(ADaoMinterDeployResult.transactions).toHaveTransaction({
            from: aDaoMinter.address,
            to: firstADaoAddresss,
            deploy: true,
            success: true,
        });

        printTransactionFees(ADaoMinterDeployResult.transactions);

        firstADao = blockchain.openContract(ADao.createFromAddress(firstADaoAddresss));

        const ProfitableAddressesDict = Dictionary.empty<bigint, Cell>();

        

        const ADaoMinterActivationResult = await firstADao.sendActivate(deployer.getSender(), toNano('0.33'), {
            AgreementPercentNumerator: 0,
            AgreementPercentDenominator: 0,
            ProfitReservePercentNumerator: 0,
            ProfitReservePercentDenominator: 0,
            ProfitableAddresses: Dictionary<bigint, Slice>,
            PendingInvitations: Dictionary<bigint, Slice>,
        })

    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and ADaoMinter are ready to use
    });
});
