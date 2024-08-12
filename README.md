# A DAO

## Operations

0. Activate A DAO\
1. Propose transaction\
1.1. Invite address\
1.2. Delete address\
1.3. Withdraw profit\
1.4. Distribute TON\
1.5. Arbitrary transaction\
1.6. Update agreement percent\
1.7. Transfer points\
1.8. Put up points for sale\
1.9. Delete pending invitations\
1.10. Delete pending transactions\
2. Approve transaction\
2.1. Invite address\
2.2. Delete address\
2.3. Withdraw profit\
2.4. Distribute TON\
2.5. Arbitrary transaction\
2.5. Update agreement percent\
2.6. Transfer points\
2.7. Put up points for sale\
2.8. Delete pending invitations\
2.9. Delete pending transactions\
3. Accept invitation to A DAO\
4. Revoke approval\
4. Change my address\
5. Quit a DAO\
7. Activate A DAO\

## Internal protocol operations

0. Process deploy message
1. Collect profit

## Transfer points note

Transfer of the points should be approved by other addresses, so first a proposal for transfering points is initiated, that it is approved by authorized addresses, than approves of the sender ond recipient are hamonized. Proposed Transactions have uint64 indexes that are not repeated throughout the entire history of the contract that can handle 18,446,744,073,709,551,615 (uint64 max number).

Each authorized address has it's individual approves dictionary. Key of the dictionary stands for the index of transaction
