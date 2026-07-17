import { NavLink } from 'react-router-dom';
import { useData } from '../context/DataContext';

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

  return (
    <nav className="navbar">
      <div className="navbar-brand">💰 Expense Tracker</div>
      <div className="navbar-links">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            {link.label}
          </NavLink>
        ))}
      </div>
      {role && (
        <div className="button-row" style={{ alignItems: 'center' }}>
          <span className="role-badge">{role === 'owner' ? 'Owner' : 'Viewer'}</span>
          <button className="secondary small" onClick={lock}>Lock</button>
        </div>
      )}
    </nav>
  );
}
