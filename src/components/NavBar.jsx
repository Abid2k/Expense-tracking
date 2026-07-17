import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useTheme } from '../hooks/useTheme';
import { useIsMobile } from '../hooks/useIsMobile';

const links = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/expenses', label: 'Expenses' },
  { to: '/savings', label: 'Savings' },
  { to: '/debts', label: 'Debts' },
  { to: '/todos', label: 'To-Do' },
  { to: '/notes', label: 'Notes' },
  { to: '/reports', label: 'Reports' },
  { to: '/settings', label: 'Settings' },
];

export default function NavBar() {
  const { role, lock } = useData();
  const { isDark, toggle } = useTheme();
  const isMobile = useIsMobile(768);
  const [menuOpen, setMenuOpen] = useState(false);

  const roleControls = role && (
    <>
      <span className="role-badge">{role === 'owner' ? 'Owner' : 'Viewer'}</span>
      <button
        className="secondary small"
        onClick={() => {
          lock();
          setMenuOpen(false);
        }}
      >
        Lock
      </button>
    </>
  );

  return (
    <nav className="navbar">
      <div className="navbar-top">
        <div className="navbar-brand">💰 Expense Tracker</div>
        <div className="navbar-controls">
          <button className="theme-toggle" onClick={toggle} title="Toggle light/dark mode" aria-label="Toggle light/dark mode">
            {isDark ? '☀️' : '🌙'}
          </button>
          {!isMobile && roleControls}
          <button
            className={menuOpen ? 'hamburger-btn open' : 'hamburger-btn'}
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="Toggle navigation menu"
            aria-expanded={menuOpen}
          >
            <span className="hamburger-bar" />
            <span className="hamburger-bar" />
            <span className="hamburger-bar" />
          </button>
        </div>
      </div>
      <div className={menuOpen ? 'navbar-links open' : 'navbar-links'}>
        {isMobile && role && <div className="navbar-drawer-meta">{roleControls}</div>}
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            onClick={() => setMenuOpen(false)}
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            {link.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
