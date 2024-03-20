# A DAO

## Operations

0. Activate A DAO
1. Propose transaction
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
2. Approve transaction
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
3. Accept invitation to A DAO
4. Revoke approval
4. Change my address
5. Quit a DAO
7. Activate A DAO

## Internal protocol operations

0. Process deploy message
1. Collect profit

## Transfer points note

Transfer of the points should be approved by other addresses, so first a proposal for transfering points is initiated, that it is approved by authorized addresses, than approves of the sender ond recipient are hamonized. Proposed Transactions have uint64 indexes that are not repeated throughout the entire history of the contract that can handle 18,446,744,073,709,551,615 (uint64 max number).

Each authorized address has it's individual approves dictionary. Key of the dictionary stands for the index of transaction

### Self-check cases

Setting:

Wallet 0 has 10 approval points\
Wallet 1 has 20 approval points\
Wallet 2 has 30 approval points\
Wallet 3 has 0 approval points\
50 points needed for transaction approval\

#### Case 0. Trasfer to Wallet that approved the same proposal

Wallet 0 approves Proposal 0 with 10 points | Tansaction 0: 10/50 points\
Wallet 1 approves Proposal 0 with 20 points | Tansaction 0: 30/50 points\

Approves dictionaries state:

Wallet 0 — 0:_\
Wallet 1 — 0:_\

Wallet 0 transfers 3 points to Wallet 1 | Wallet 0: 7 points | Wallet 1: 23 points

Approves dictionaries state:

Wallet 0 — 0:_\
Wallet 1 — 0:_\

Wallet 0 can revoke his approve from Transaction 0

Approves dictionaries state:

Wallet 1 — 0:_\

Success!

#### Case 1. Transfer to Wallet that has not approved the same proposal

Wallet 0 approves Proposal 0 with 10 points | Tansaction 0: 10/50 points\
Wallet 0 transfers 3 points to Wallet 3 | Wallet 0: 7 points | Wallet 3: 3 points\

Approves dictionaries state:

Wallet 1 — 0:_\
Wallet 3 — 0:_\

Proposal 0 approval is added to Wallet 3 approvals dictionary\
Wallet 3 can revoke his approve if he does not agree with previous approval points holder\

Success!

#### Case 2. Transfer to Wallet considering terminated proposals

Wallet 0 approves Proposal 0 | Tansaction 0: 10/50 points\
Wallet 1 approves Proposal 0 | Tansaction 0: 30/50 points\
Wallet 2 approves Proposal 0 | Tansaction 0: 60/50 points (Approved)\

Approves dictionaries state:

Wallet 0 — 0:_\
Wallet 1 — 0:_\
Wallet 2 - 0:_\

Proposal 1 initiated
Wallet 0 approves Proposal 0 | Tansaction 0: 10/50 points\
Wallet 0 transfers 3 points to Wallet 1 | Wallet 0: 7 points | Wallet 1: 23 points\

Approves dictionaries state:

Wallet 0 — 0:_, 1:_\
Wallet 1 — 0:_, 1:3\

Just 3 points for Proposal 1 are added to Wallet 1 approvals dictionary\
Wallet 1 revokes new-added approval\


Approves dictionaries state:

Wallet 0 — 0:_, 1:_
Wallet 1 — 0:_

Wallet 1 adds his approval to Proposal 1 (now all his points will be counted)\

Wallet 0 — 0:_, 1:_
Wallet 1 — 0:_, 1:_

Success!