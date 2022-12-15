import {
  SigningStargateClient,
  Coin,
  StdFee,
  DeliverTxResponse,
} from '@cosmjs/stargate';
// eslint-disable-next-line import/no-extraneous-dependencies
import { EncodeObject, OfflineSigner } from '@cosmjs/proto-signing';
import { TxRaw } from 'cosmjs-types/cosmos/tx/v1beta1/tx';
// eslint-disable-next-line import/no-extraneous-dependencies
import { assert, isNonNullObject } from '@cosmjs/utils';

import {
  DEFAULT_RPC_ENDPOINT,
  DEFAULT_GAS_PRICE_NUMBER,
  COSMOS_DENOM,
  ISCN_CHANGE_OWNER_GAS,
  SEND_NFT_GAS,
  LIKENFT_BURN_NFT_GAS,
  GRANT_SEND_AUTH_GAS,
  EXEC_SEND_AUTH_GAS,
  REVOKE_SEND_AUTH_GAS,
  STUB_WALLET,
  STUB_ISCN_ID,
  STUB_CLASS_ID,
} from '../constant';
import { ISCNQueryClient } from '../queryClient';
import { messageRegistry as registry } from '../messages/registry';
import {
  ISCNSignOptions, ISCNSignPayload, MintNFTData, NewNFTClassData,
} from '../types';
import signOrBroadcast from '../transactions/sign';
import { formatGasFee, estimateMsgTxGas, estimateMsgsTxGas } from '../transactions/gas';

export interface BaseSigningClientState {
  signingClient: SigningStargateClient | null;
  queryClient: ISCNQueryClient;
  rpcURL: string;
  denom: string;
}

export type FallbackFeeGetter = (
  getState: () => BaseSigningClientState, options: ISCNSignOptions,
) => StdFee;

export function fallbackFeeFromMsgs(messages: EncodeObject[]): FallbackFeeGetter {
  return (getState: () => BaseSigningClientState, options: ISCNSignOptions) => {
    const { denom } = getState();
    const { gasPrice, memo } = options;
    return estimateMsgsTxGas(messages, { denom, gasPrice, memo });
  };
}

export function fallbackFeeFromDefault(gas: number): FallbackFeeGetter {
  return (getState: () => BaseSigningClientState, options: ISCNSignOptions) => {
    const { denom } = getState();
    const { gasPrice } = options;
    return formatGasFee({ gas, gasPrice, denom });
  };
}

export async function sendMessages(
  getState: () => BaseSigningClientState,
  senderAddress: string,
  messages :EncodeObject[],
  options: ISCNSignOptions = {},
  fallbackFeeGetter: FallbackFeeGetter,
): Promise<TxRaw | DeliverTxResponse> {
  const { fee: inputFee, gasPrice, ...signOptions } = options;
  const { signingClient } = getState();
  if (!signingClient) throw new Error('SIGNING_CLIENT_NOT_CONNECTED');
  let fee = inputFee;
  if (fee && gasPrice) throw new Error('CANNOT_SET_BOTH_FEE_AND_GASPRICE');
  if (!fee) {
    fee = fallbackFeeGetter(getState, options);
  }
  const response = await signOrBroadcast(senderAddress, messages, fee, signingClient, signOptions);
  return response;
}

type obj = Record<string, unknown>;

type SigningClientSetup<A> = (getState: () => BaseSigningClientState) => A;

export class BaseSigningClient {
  private state: BaseSigningClientState;

  public static withSigningClients<A extends obj>(
    clientSetupA: SigningClientSetup<A>,
  ): BaseSigningClient & A;

  public static withSigningClients<
    A extends obj,
    B extends obj,
  >(
    clientSetupA: SigningClientSetup<A>,
    clientSetupB: SigningClientSetup<B>,
  ): BaseSigningClient & A & B;

  public static withSigningClients<
    A extends obj,
    B extends obj,
    C extends obj,
  >(
    clientSetupA: SigningClientSetup<A>,
    clientSetupB: SigningClientSetup<B>,
    clientSetupC: SigningClientSetup<C>,
  ): BaseSigningClient & A & B & C;

  public static withSigningClients<
    A extends obj,
    B extends obj,
    C extends obj,
    D extends obj,
  >(
    clientSetupA: SigningClientSetup<A>,
    clientSetupB: SigningClientSetup<B>,
    clientSetupC: SigningClientSetup<C>,
    clientSetupD: SigningClientSetup<D>,
  ): BaseSigningClient & A & B & C & D;

  // generate all withSigningClients definitions up to 10 clients
  public static withSigningClients<
    A extends obj,
    B extends obj,
    C extends obj,
    D extends obj,
    E extends obj,
  >(
    clientSetupA: SigningClientSetup<A>,
    clientSetupB: SigningClientSetup<B>,
    clientSetupC: SigningClientSetup<C>,
    clientSetupD: SigningClientSetup<D>,
    clientSetupE: SigningClientSetup<E>,
  ): BaseSigningClient & A & B & C & D & E;

  public static withSigningClients<
    A extends obj,
    B extends obj,
    C extends obj,
    D extends obj,
    E extends obj,
    F extends obj,
  >(
    clientSetupA: SigningClientSetup<A>,
    clientSetupB: SigningClientSetup<B>,
    clientSetupC: SigningClientSetup<C>,
    clientSetupD: SigningClientSetup<D>,
    clientSetupE: SigningClientSetup<E>,
    clientSetupF: SigningClientSetup<F>,
  ): BaseSigningClient & A & B & C & D & E & F;

  public static withSigningClients<
    A extends obj,
    B extends obj,
    C extends obj,
    D extends obj,
    E extends obj,
    F extends obj,
    G extends obj,
  >(
    clientSetupA: SigningClientSetup<A>,
    clientSetupB: SigningClientSetup<B>,
    clientSetupC: SigningClientSetup<C>,
    clientSetupD: SigningClientSetup<D>,
    clientSetupE: SigningClientSetup<E>,
    clientSetupF: SigningClientSetup<F>,
    clientSetupG: SigningClientSetup<G>,
  ): BaseSigningClient & A & B & C & D & E & F & G;

  public static withSigningClients<
    A extends obj,
    B extends obj,
    C extends obj,
    D extends obj,
    E extends obj,
    F extends obj,
    G extends obj,
    H extends obj,
  >(
    clientSetupA: SigningClientSetup<A>,
    clientSetupB: SigningClientSetup<B>,
    clientSetupC: SigningClientSetup<C>,
    clientSetupD: SigningClientSetup<D>,
    clientSetupE: SigningClientSetup<E>,
    clientSetupF: SigningClientSetup<F>,
    clientSetupG: SigningClientSetup<G>,
    clientSetupH: SigningClientSetup<H>,
  ): BaseSigningClient & A & B & C & D & E & F & G & H;

  public static withSigningClients(
    ...clientSetups: Array<SigningClientSetup<obj>>
  ): any {
    const client = new BaseSigningClient();
    const getState = () => client.state;
    const clients = clientSetups.map((clientSetup) => clientSetup(getState));
    // eslint-disable-next-line no-restricted-syntax
    for (const cilent of clients) {
      assert(isNonNullObject(cilent));
      // eslint-disable-next-line no-restricted-syntax
      for (const [moduleKey, moduleValue] of Object.entries(cilent)) {
        assert(isNonNullObject(moduleValue));
        const current = (client as any)[moduleKey] || {};
        (client as any)[moduleKey] = {
          ...current,
          ...moduleValue,
        };
      }
    }
    return client;
  }

  constructor() {
    this.state = {
      signingClient: null,
      queryClient: new ISCNQueryClient(),
      rpcURL: DEFAULT_RPC_ENDPOINT,
      denom: COSMOS_DENOM,
    };
  }

  getSigningStargateClient(): SigningStargateClient | null {
    return this.state.signingClient;
  }

  getISCNQueryClient(): ISCNQueryClient {
    return this.state.queryClient;
  }

  async connect(rpcURL: string): Promise<void> {
    await this.state.queryClient.connect(rpcURL);
    this.state.rpcURL = rpcURL;
    await this.fetchISCNFeeDenom();
  }

  async setSigner(signer: OfflineSigner): Promise<void> {
    this.state.signingClient = await SigningStargateClient.connectWithSigner(
      this.state.rpcURL,
      signer,
      { registry },
    );
  }

  async connectWithSigner(rpcURL: string, signer: OfflineSigner): Promise<void> {
    await this.connect(rpcURL);
    await this.setSigner(signer);
  }

  async fetchISCNFeeDenom(): Promise<void> {
    const feePerByte = await this.state.queryClient.queryFeePerByte();
    if (feePerByte?.denom) this.state.denom = feePerByte.denom;
  }

  setDenom(denom: string): void {
    this.state.denom = denom;
  }

  async sendMessages(
    senderAddress: string, messages :EncodeObject[],
    options: ISCNSignOptions = {},
  ): Promise<TxRaw | DeliverTxResponse> {
    return sendMessages(
      () => this.state, senderAddress, messages,
      options, fallbackFeeFromMsgs(messages),
    );
  }
}

export default BaseSigningClient;
