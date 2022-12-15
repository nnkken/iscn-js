// eslint-disable-next-line import/no-extraneous-dependencies
import {
  StdFee,
  DeliverTxResponse,
} from '@cosmjs/stargate';
import { TxRaw } from 'cosmjs-types/cosmos/tx/v1beta1/tx';

import { ISCN_CHANGE_OWNER_GAS } from '../constant';
import { estimateISCNTxGas } from '../transactions/iscn';
import { ISCNSignOptions, ISCNSignPayload } from '../types';
import {
  formatMsgChangeIscnRecordOwnership,
  formatMsgCreateIscnRecord,
  formatMsgUpdateIscnRecord,
} from '../messages/iscn';
import { BaseSigningClientState, sendMessages, fallbackFeeFromDefault } from './client';
import type { FallbackFeeGetter } from './client';

function fallbackFeeFromIscnPayload(payload: ISCNSignPayload): FallbackFeeGetter {
  return (getState: () => BaseSigningClientState, options: ISCNSignOptions): StdFee => {
    const { denom } = getState();
    const { gasPrice, memo } = options;
    return estimateISCNTxGas(payload, { denom, gasPrice, memo });
  };
}

export interface IscnSigningClient {
  readonly createISCNRecord: (
    senderAddress: string, payload: ISCNSignPayload, options: ISCNSignOptions,
  ) => Promise<TxRaw | DeliverTxResponse>;
  readonly updateISCNRecord: (
    senderAddress: string, iscnId: string, payload: ISCNSignPayload, options: ISCNSignOptions,
  ) => Promise<TxRaw | DeliverTxResponse>;
  readonly changeISCNOwnership: (
    senderAddress: string, newOwner: string, iscnId: string, options: ISCNSignOptions,
  ) => Promise<TxRaw | DeliverTxResponse>;
}

export function setupIscnSigningClient(getState: () => BaseSigningClientState): IscnSigningClient {
  return {
    async createISCNRecord(
      senderAddress: string,
      payload: ISCNSignPayload,
      options: ISCNSignOptions = {},
    ): Promise<TxRaw | DeliverTxResponse> {
      const messages = [formatMsgCreateIscnRecord(senderAddress, payload)];
      return sendMessages(
        getState, senderAddress, messages, options, fallbackFeeFromIscnPayload(payload),
      );
    },
    async updateISCNRecord(
      senderAddress: string,
      iscnId: string,
      payload: ISCNSignPayload,
      options: ISCNSignOptions = {},
    ): Promise<TxRaw | DeliverTxResponse> {
      const messages = [formatMsgUpdateIscnRecord(senderAddress, iscnId, payload)];
      return sendMessages(
        getState, senderAddress, messages, options, fallbackFeeFromIscnPayload(payload),
      );
    },
    async changeISCNOwnership(
      senderAddress: string,
      newOwnerAddress: string,
      iscnId: string,
      options: ISCNSignOptions = {},
    ): Promise<TxRaw | DeliverTxResponse> {
      const messages = [formatMsgChangeIscnRecordOwnership(senderAddress, iscnId, newOwnerAddress)];
      return sendMessages(
        getState, senderAddress, messages, options, fallbackFeeFromDefault(ISCN_CHANGE_OWNER_GAS),
      );
    },
  };
}

export default setupIscnSigningClient;
