type Props = {
  user?: { name?: string };
};

export default function MobileHeader({ user }: Props) {
  return (
    <header className="mobile-header">
      <img
        src="/logo.png"
        alt="Shrunothi"
        className="mobile-logo"
      />

      <div className="mobile-user">
        {user?.name ? `Welcome, ${user.name}!` : "Welcome"}
      </div>
    </header>
  );
}