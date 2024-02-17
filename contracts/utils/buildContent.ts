import { beginCell, Builder, Cell, Dictionary, Slice } from '@ton/core';
import { sha256Hash } from '../../wrappers/Helpers';

export type AdminData = {
    category: string;
    canApproveUser: boolean;
    canRevokeUser: boolean;
};

export type ResponseData = {
    text: string;
    price: bigint;
    deadline: number;
};

export function buildUserContent(data: AdminData): Cell {
    const content = Dictionary.empty<bigint, Cell>();
    content.set(sha256Hash('category'), beginCell().storeUint(sha256Hash(data.category), 256).endCell());
    content.set(sha256Hash('can_approve_user'), beginCell().storeBit(data.canApproveUser).endCell());
    content.set(sha256Hash('can_revoke_user'), beginCell().storeBit(data.canRevokeUser).endCell());

    return beginCell().storeDictDirect(content, Dictionary.Keys.BigUint(256), Dictionary.Values.Cell()).endCell();
}

export function buildUserContent(data: AdminData): Cell {
    const content = Dictionary.empty<bigint, Cell>();
    content.set(sha256Hash('category'), beginCell().storeUint(sha256Hash(data.category), 256).endCell());
    content.set(sha256Hash('can_approve_user'), beginCell().storeBit(data.canApproveUser).endCell());
    content.set(sha256Hash('can_revoke_user'), beginCell().storeBit(data.canRevokeUser).endCell());

    return beginCell().storeDictDirect(content, Dictionary.Keys.BigUint(256), Dictionary.Values.Cell()).endCell();
}