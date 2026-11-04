import { Home, Library, Search } from 'lucide-react';
import { paths } from '../lib/route';

/** Navegação inferior do celular. */
export function MobileNav({ hash }: { hash: string }) {
  const current = hash || paths.home();
  const links = [
    { href: paths.home(), label: 'Início', Icon: Home, active: current === '#/' || current === '#' },
    { href: paths.search(), label: 'Buscar', Icon: Search, active: current.startsWith('#/buscar') },
    { href: paths.library(), label: 'Sua Biblioteca', Icon: Library, active: current === '#/biblioteca' || current === '#/curtidas' },
  ];
  return (
    <nav className="mobile-nav" aria-label="Principal">
      <ul>
        {links.map(({ href, label, Icon, active }) => (
          <li key={href}>
            <a className="mobile-nav__link" href={href} aria-current={active ? 'page' : undefined}>
              <Icon aria-hidden="true" />
              <span>{label}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
