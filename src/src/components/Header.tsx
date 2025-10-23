import { ConnectButton } from '@rainbow-me/rainbowkit';
import '../styles/Header.css';

export function Header() {
  return (
    <header className="header">
      <div className="header-inner">
        <div>
          <p className="header-title">CipherFund</p>
          <p className="header-subtitle">Encrypted fundraising powered by cETH and Zama FHE</p>
        </div>
        <ConnectButton />
      </div>
    </header>
  );
}
