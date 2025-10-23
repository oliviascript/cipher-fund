import { useMemo, useState } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Contract, ethers } from 'ethers';

import { useEthersSigner } from '../hooks/useEthersSigner';
import { useZamaInstance } from '../hooks/useZamaInstance';
import {
  FUNDRAISING_ADDRESS,
  FUNDRAISING_ABI,
  TOKEN_ADDRESS,
  TOKEN_ABI,
} from '../config/contracts';
import { Header } from './Header';
import '../styles/FundraisingApp.css';

type Campaign = {
  id: number;
  title: string;
  description: string;
  goal: bigint;
  creator: string;
  active: boolean;
  raisedHandle: string;
  userPointsHandle?: string;
};

const MICRO_UNITS = 1_000_000n;

function formatAmount(units: bigint): string {
  const asNumber = Number(units) / 1_000_000;
  return asNumber.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

function parseAmountInput(input: string): bigint {
  const trimmed = input.trim();
  if (trimmed.length === 0) {
    return 0n;
  }

  if (!/^\d+(\.\d{0,6})?$/.test(trimmed)) {
    throw new Error('Enter a valid amount with up to 6 decimals');
  }

  const [whole, fraction = ''] = trimmed.split('.');
  const normalizedFraction = (fraction + '000000').slice(0, 6);

  return BigInt(whole) * MICRO_UNITS + BigInt(normalizedFraction);
}

function isZeroHandle(handle?: string): boolean {
  return !handle || handle === ethers.ZeroHash;
}

type DonationModalProps = {
  campaign: Campaign;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (amount: string) => void;
};

function DonationModal({ campaign, isSubmitting, onClose, onSubmit }: DonationModalProps) {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    try {
      parseAmountInput(amount);
      setError(null);
      onSubmit(amount);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid amount');
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card">
        <div className="modal-header">
          <h3>Donate to {campaign.title}</h3>
          <button onClick={onClose} className="icon-button" aria-label="Close donation dialog">
            ✕
          </button>
        </div>

        <p className="modal-subtitle">Goal: {formatAmount(campaign.goal)} cETH</p>

        <label className="modal-label" htmlFor="donation-amount">
          Donation amount (cETH)
        </label>
        <input
          id="donation-amount"
          type="text"
          inputMode="decimal"
          placeholder="0.00"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          className="modal-input"
          disabled={isSubmitting}
        />
        <p className="modal-hint">Minimum unit is 0.000001 cETH (six decimals)</p>
        {error ? <p className="modal-error">⚠️ {error}</p> : null}

        <div className="modal-actions">
          <button className="secondary-button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button className="primary-button" onClick={submit} disabled={isSubmitting}>
            {isSubmitting ? 'Processing...' : 'Send Donation'}
          </button>
        </div>
      </div>
    </div>
  );
}

type CreateFormState = {
  title: string;
  description: string;
  goal: string;
};

export function FundraisingApp() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const signerPromise = useEthersSigner();
  const { instance, isLoading: zamaLoading } = useZamaInstance();
  const queryClient = useQueryClient();

  const [createState, setCreateState] = useState<CreateFormState>({ title: '', description: '', goal: '' });
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [decryptedRaised, setDecryptedRaised] = useState<Record<number, bigint>>({});
  const [decryptedPoints, setDecryptedPoints] = useState<Record<number, bigint>>({});
  const [decryptingRaised, setDecryptingRaised] = useState<Record<number, boolean>>({});
  const [decryptingPoints, setDecryptingPoints] = useState<Record<number, boolean>>({});
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isClaimingFaucet, setIsClaimingFaucet] = useState(false);
  const [isSubmittingDonation, setIsSubmittingDonation] = useState(false);

  const {
    data: campaigns = [],
    isLoading: isCampaignsLoading,
  } = useQuery({
    queryKey: ['campaigns', address],
    queryFn: async (): Promise<Campaign[]> => {
      if (!publicClient) return [];

      const rawCampaigns = (await publicClient.readContract({
        address: FUNDRAISING_ADDRESS,
        abi: FUNDRAISING_ABI,
        functionName: 'getCampaigns',
      })) as any[];

      const mapped: Campaign[] = rawCampaigns.map((campaignStruct) => ({
        id: Number(campaignStruct.id),
        title: campaignStruct.title as string,
        description: campaignStruct.description as string,
        goal: BigInt(campaignStruct.goal),
        creator: campaignStruct.creator as string,
        active: Boolean(campaignStruct.active),
        raisedHandle: ethers.ZeroHash,
      }));

      if (mapped.length === 0) {
        return mapped;
      }

      const raisedHandles = await Promise.all(
        mapped.map((campaign) =>
          publicClient.readContract({
            address: FUNDRAISING_ADDRESS,
            abi: FUNDRAISING_ABI,
            functionName: 'getCampaignRaised',
            args: [BigInt(campaign.id)],
          })
        )
      );

      let userPoints: string[] = [];
      if (address) {
        userPoints = await Promise.all(
          mapped.map((campaign) =>
            publicClient.readContract({
              address: FUNDRAISING_ADDRESS,
              abi: FUNDRAISING_ABI,
              functionName: 'getUserPoints',
              args: [BigInt(campaign.id), address],
            })
          )
        ) as string[];
      }

      return mapped.map((campaign, index) => ({
        ...campaign,
        raisedHandle: raisedHandles[index] as string,
        userPointsHandle: address ? (userPoints[index] as string) : undefined,
      }));
    },
    enabled: Boolean(publicClient),
    staleTime: 10_000,
  });

  const sortedCampaigns = useMemo(
    () =>
      [...campaigns].sort((a, b) => b.id - a.id),
    [campaigns]
  );

  const resetMessages = () => {
    setStatusMessage(null);
    setErrorMessage(null);
  };

  const handleCreateCampaign = async (event: React.FormEvent) => {
    event.preventDefault();
    resetMessages();

    if (!isConnected) {
      setErrorMessage('Connect your wallet to create a campaign');
      return;
    }

    if (!createState.title.trim() || !createState.description.trim()) {
      setErrorMessage('Title and description are required');
      return;
    }

    let goalUnits: bigint;
    try {
      goalUnits = parseAmountInput(createState.goal);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Invalid goal');
      return;
    }

    if (goalUnits === 0n) {
      setErrorMessage('Goal must be greater than zero');
      return;
    }

    try {
      setIsCreating(true);
      const signer = await signerPromise;
      if (!signer) {
        throw new Error('Wallet signer unavailable');
      }

      const contract = new Contract(FUNDRAISING_ADDRESS, FUNDRAISING_ABI, signer);
      const tx = await contract.createCampaign(
        createState.title.trim(),
        createState.description.trim(),
        goalUnits,
      );
      setStatusMessage('Creating campaign... waiting for confirmation');
      await tx.wait();

      setCreateState({ title: '', description: '', goal: '' });
      setStatusMessage('Campaign created successfully');
      await queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    } catch (error) {
      console.error('Create campaign error', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to create campaign');
    } finally {
      setIsCreating(false);
    }
  };

  const handleFaucet = async () => {
    resetMessages();
    if (!isConnected) {
      setErrorMessage('Connect your wallet to request cETH');
      return;
    }

    try {
      setIsClaimingFaucet(true);
      const signer = await signerPromise;
      if (!signer) {
        throw new Error('Wallet signer unavailable');
      }
      const contract = new Contract(TOKEN_ADDRESS, TOKEN_ABI, signer);
      const tx = await contract.faucet();
      setStatusMessage('Requesting cETH from faucet...');
      await tx.wait();
      setStatusMessage('1 cETH credited to your wallet');
    } catch (error) {
      console.error('Faucet error', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to claim faucet tokens');
    } finally {
      setIsClaimingFaucet(false);
    }
  };

  const handleDonate = async (amountInput: string) => {
    if (!selectedCampaign) return;
    resetMessages();

    if (!isConnected) {
      setErrorMessage('Connect your wallet before donating');
      return;
    }

    if (!instance) {
      setErrorMessage('Encryption service unavailable. Please wait for initialization.');
      return;
    }

    let donationUnits: bigint;
    try {
      donationUnits = parseAmountInput(amountInput);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Invalid donation amount');
      return;
    }

    if (donationUnits === 0n) {
      setErrorMessage('Donation amount must be greater than zero');
      return;
    }

    const maxSafe = BigInt(Number.MAX_SAFE_INTEGER);
    if (donationUnits > maxSafe) {
      setErrorMessage('Amount too large for supported encryption range');
      return;
    }

    try {
      setIsSubmittingDonation(true);
      const signer = await signerPromise;
      if (!signer) {
        throw new Error('Wallet signer unavailable');
      }

      if (!address) {
        throw new Error('Wallet address missing');
      }

      const buffer = instance.createEncryptedInput(TOKEN_ADDRESS, address);
      buffer.add64(Number(donationUnits));
      const encryptedAmount = await buffer.encrypt();

      const payload = ethers.AbiCoder.defaultAbiCoder().encode(['uint256'], [selectedCampaign.id]);
      const tokenContract = new Contract(TOKEN_ADDRESS, TOKEN_ABI, signer);
      const tx = await tokenContract['confidentialTransferAndCall(address,bytes32,bytes,bytes)'](
        FUNDRAISING_ADDRESS,
        encryptedAmount.handles[0],
        encryptedAmount.inputProof,
        payload,
      );

      setStatusMessage('Donation submitted. Waiting for confirmation...');
      await tx.wait();
      setStatusMessage('Donation confirmed');

      setDecryptedPoints((prev) => {
        const clone = { ...prev };
        delete clone[selectedCampaign.id];
        return clone;
      });
      setDecryptedRaised((prev) => {
        const clone = { ...prev };
        delete clone[selectedCampaign.id];
        return clone;
      });

      await queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    } catch (error) {
      console.error('Donation error', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to process donation');
    } finally {
      setIsSubmittingDonation(false);
      setSelectedCampaign(null);
    }
  };

  const decryptValue = async (campaign: Campaign, handle: string, kind: 'raised' | 'points') => {
    if (!instance) {
      setErrorMessage('Encryption service unavailable. Please wait for initialization.');
      return;
    }
    if (!isConnected || !address) {
      setErrorMessage('Connect your wallet to decrypt values');
      return;
    }

    const signer = await signerPromise;
    if (!signer) {
      setErrorMessage('Wallet signer unavailable');
      return;
    }

    if (isZeroHandle(handle)) {
      if (kind === 'raised') {
        setDecryptedRaised((prev) => ({ ...prev, [campaign.id]: 0n }));
      } else {
        setDecryptedPoints((prev) => ({ ...prev, [campaign.id]: 0n }));
      }
      return;
    }

    try {
      if (kind === 'raised') {
        setDecryptingRaised((prev) => ({ ...prev, [campaign.id]: true }));
      } else {
        setDecryptingPoints((prev) => ({ ...prev, [campaign.id]: true }));
      }

      const keypair = instance.generateKeypair();
      const startTime = Math.floor(Date.now() / 1000).toString();
      const durationDays = '10';
      const contractAddresses = [FUNDRAISING_ADDRESS];

      const eip712 = instance.createEIP712(
        keypair.publicKey,
        contractAddresses,
        startTime,
        durationDays,
      );

      const signature = await signer.signTypedData(
        eip712.domain,
        { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
        eip712.message,
      );

      const result = await instance.userDecrypt(
        [{ handle, contractAddress: FUNDRAISING_ADDRESS }],
        keypair.privateKey,
        keypair.publicKey,
        signature.replace('0x', ''),
        contractAddresses,
        address,
        startTime,
        durationDays,
      );

      const decrypted = result[handle] ? BigInt(result[handle]) : 0n;

      if (kind === 'raised') {
        setDecryptedRaised((prev) => ({ ...prev, [campaign.id]: decrypted }));
      } else {
        setDecryptedPoints((prev) => ({ ...prev, [campaign.id]: decrypted }));
      }
    } catch (error) {
      console.error('Decryption error', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to decrypt value');
    } finally {
      if (kind === 'raised') {
        setDecryptingRaised((prev) => ({ ...prev, [campaign.id]: false }));
      } else {
        setDecryptingPoints((prev) => ({ ...prev, [campaign.id]: false }));
      }
    }
  };

  return (
    <div className="app-shell">
      <Header />

      <main className="app-content">
        <section className="hero-section">
          <div>
            <h1 className="hero-title">Confidential Fundraising</h1>
            <p className="hero-subtitle">
              Launch campaigns, donate using encrypted cETH, and reveal your points securely with Zama FHE technology.
            </p>
          </div>
          <div className="hero-highlights">
            <div>
              <h3>Total Campaigns</h3>
              <p>{campaigns.length}</p>
            </div>
            <div>
              <h3>Encryption Status</h3>
              <p>{zamaLoading ? 'Loading…' : instance ? 'Ready' : 'Unavailable'}</p>
            </div>
          </div>
        </section>

        <section className="actions-grid">
          <div className="card">
            <h2>Create a Campaign</h2>
            <p className="card-description">
              Share your mission, set a goal in cETH, and start receiving encrypted donations instantly.
            </p>
            <form className="create-form" onSubmit={handleCreateCampaign}>
              <label className="field-label" htmlFor="campaign-title">
                Title
              </label>
              <input
                id="campaign-title"
                type="text"
                value={createState.title}
                onChange={(event) => setCreateState((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="e.g. Rebuild the community library"
                required
                disabled={isCreating}
              />

              <label className="field-label" htmlFor="campaign-description">
                Description
              </label>
              <textarea
                id="campaign-description"
                value={createState.description}
                onChange={(event) => setCreateState((prev) => ({ ...prev, description: event.target.value }))}
                placeholder="Explain how the funds will be used..."
                required
                rows={3}
                disabled={isCreating}
              />

              <label className="field-label" htmlFor="campaign-goal">
                Goal (cETH)
              </label>
              <input
                id="campaign-goal"
                type="text"
                inputMode="decimal"
                value={createState.goal}
                onChange={(event) => setCreateState((prev) => ({ ...prev, goal: event.target.value }))}
                placeholder="100"
                disabled={isCreating}
                required
              />

              <button type="submit" className="primary-button" disabled={isCreating}>
                {isCreating ? 'Submitting...' : 'Launch Campaign'}
              </button>
            </form>
          </div>

          <div className="card">
            <h2>Contributor Toolkit</h2>
            <p className="card-description">
              Acquire test cETH, then donate to any live campaign. Every 1 cETH grants you 100 encrypted points.
            </p>
            <button className="secondary-button" onClick={handleFaucet} disabled={isClaimingFaucet}>
              {isClaimingFaucet ? 'Requesting...' : 'Get 1 test cETH'}
            </button>
            <ul className="toolkit-list">
              <li>Encrypted donations via Zama relayer</li>
              <li>Points remain private until you decrypt</li>
              <li>Use RainbowKit to swap wallets seamlessly</li>
            </ul>
          </div>
        </section>

        {statusMessage ? <div className="status-banner success">✅ {statusMessage}</div> : null}
        {errorMessage ? <div className="status-banner error">⚠️ {errorMessage}</div> : null}

        <section className="campaign-section">
          <div className="section-heading">
            <h2>Campaigns</h2>
            <button
              className="text-button"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['campaigns'] })}
            >
              Refresh
            </button>
          </div>

          {isCampaignsLoading ? (
            <div className="empty-state">Loading campaigns...</div>
          ) : sortedCampaigns.length === 0 ? (
            <div className="empty-state">No campaigns yet. Be the first to create one!</div>
          ) : (
            <div className="campaign-grid">
              {sortedCampaigns.map((campaign) => {
                const raisedValue = decryptedRaised[campaign.id];
                const pointsValue = decryptedPoints[campaign.id];
                const raisedBusy = decryptingRaised[campaign.id];
                const pointsBusy = decryptingPoints[campaign.id];

                return (
                  <article key={campaign.id} className="campaign-card">
                    <header className="campaign-header">
                      <h3>{campaign.title}</h3>
                      <span className={campaign.active ? 'badge success' : 'badge muted'}>
                        {campaign.active ? 'Active' : 'Inactive'}
                      </span>
                    </header>
                    <p className="campaign-description">{campaign.description}</p>
                    <dl className="campaign-stats">
                      <div>
                        <dt>Goal</dt>
                        <dd>{formatAmount(campaign.goal)} cETH</dd>
                      </div>
                      <div>
                        <dt>Total Raised</dt>
                        <dd>
                          {raisedValue !== undefined ? (
                            <span>{formatAmount(raisedValue)} cETH</span>
                          ) : (
                            <span>•••••</span>
                          )}
                        </dd>
                      </div>
                      <div>
                        <dt>Your Points</dt>
                        <dd>
                          {pointsValue !== undefined ? (
                            <span>{pointsValue} pts</span>
                          ) : (
                            <span>•••••</span>
                          )}
                        </dd>
                      </div>
                    </dl>

                    <div className="campaign-actions">
                      <button
                        className="primary-button"
                        onClick={() => setSelectedCampaign(campaign)}
                        disabled={!campaign.active || !isConnected}
                      >
                        Donate
                      </button>
                      <button
                        className="secondary-button"
                        onClick={() => decryptValue(campaign, campaign.raisedHandle, 'raised')}
                        disabled={!isConnected || raisedBusy || zamaLoading}
                      >
                        {raisedBusy ? 'Decrypting...' : 'Decrypt Raised'}
                      </button>
                      <button
                        className="secondary-button"
                        onClick={() =>
                          decryptValue(
                            campaign,
                            campaign.userPointsHandle ?? ethers.ZeroHash,
                            'points',
                          )
                        }
                        disabled={!isConnected || pointsBusy || zamaLoading}
                      >
                        {pointsBusy ? 'Decrypting...' : 'Decrypt My Points'}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {selectedCampaign ? (
        <DonationModal
          campaign={selectedCampaign}
          isSubmitting={isSubmittingDonation}
          onClose={() => setSelectedCampaign(null)}
          onSubmit={handleDonate}
        />
      ) : null}
    </div>
  );
}
