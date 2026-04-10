import { type FormEvent, type JSX, type ReactNode, useMemo, useState } from 'react';

import './siteLockGate.css';

const SITE_LOCK_STORAGE_KEY = 'shrunothi-site-lock';

function makeFingerprint(value: string): string {
  let hash = 5381;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 33) ^ value.charCodeAt(index);
  }
  return `v1-${(hash >>> 0).toString(16)}`;
}

type SiteLockGateProps = {
  password: string;
  children: ReactNode;
};

export default function SiteLockGate({ password, children }: SiteLockGateProps): JSX.Element {
  const passwordFingerprint = useMemo(() => makeFingerprint(password), [password]);
  const [isUnlocked, setIsUnlocked] = useState(() => {
    try {
      return window.localStorage.getItem(SITE_LOCK_STORAGE_KEY) === passwordFingerprint;
    } catch {
      return false;
    }
  });
  const [enteredPassword, setEnteredPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleUnlock = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (enteredPassword === password) {
      try {
        window.localStorage.setItem(SITE_LOCK_STORAGE_KEY, passwordFingerprint);
      } catch {
        // Ignore storage errors and still allow unlocked session.
      }
      setIsUnlocked(true);
      setEnteredPassword('');
      setErrorMessage('');
      return;
    }
    setErrorMessage('Incorrect password. Please try again.');
  };

  if (isUnlocked) {
    return <>{children}</>;
  }

  return (
    <main className="site-lock">
      <section className="site-lock__card">
        <p className="site-lock__badge">Pre-launch access</p>
        <h1 className="site-lock__title">This website is locked</h1>
        <p className="site-lock__subtitle">
          Enter the shared password to view the site before launch.
        </p>

        <form className="site-lock__form" onSubmit={handleUnlock}>
          <label className="site-lock__label" htmlFor="site-lock-password">
            Password
          </label>
          <input
            id="site-lock-password"
            className="site-lock__input"
            type="password"
            value={enteredPassword}
            onChange={(event) => setEnteredPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
          {errorMessage ? (
            <p className="site-lock__error" role="alert">
              {errorMessage}
            </p>
          ) : null}
          <button className="site-lock__button" type="submit">
            Unlock website
          </button>
        </form>
      </section>
    </main>
  );
}
