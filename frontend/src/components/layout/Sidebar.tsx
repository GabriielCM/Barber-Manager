'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  UserGroupIcon,
  ScissorsIcon,
  WrenchScrewdriverIcon,
  ShoppingBagIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  ShoppingCartIcon,
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  RectangleStackIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/store/authStore';

const menuItems = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Clientes', href: '/dashboard/clients', icon: UserGroupIcon },
  { name: 'Barbeiros', href: '/dashboard/barbers', icon: ScissorsIcon },
  { name: 'Serviços', href: '/dashboard/services', icon: WrenchScrewdriverIcon },
  { name: 'Produtos', href: '/dashboard/products', icon: ShoppingBagIcon },
  { name: 'Agendamentos', href: '/dashboard/appointments', icon: CalendarDaysIcon },
  { name: 'Assinaturas', href: '/dashboard/subscriptions', icon: RectangleStackIcon },
  { name: 'Checkout', href: '/dashboard/checkout', icon: ShoppingCartIcon },
  { name: 'Financeiro', href: '/dashboard/financial', icon: CurrencyDollarIcon },
  { name: 'Notificações', href: '/dashboard/notifications', icon: ChatBubbleLeftRightIcon },
  { name: 'WhatsApp', href: '/dashboard/whatsapp', icon: Cog6ToothIcon },
];

export function Sidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuthStore();

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-dark-900 border-r border-dark-800 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-dark-800">
        <h1 className="text-2xl font-bold text-primary-500">Barber</h1>
        <p className="text-dark-400 text-sm">Manager</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary-500/10 text-primary-500'
                  : 'text-dark-300 hover:bg-dark-800 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-dark-800">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center">
            <span className="text-primary-500 font-bold">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs text-dark-400 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 w-full px-4 py-2 text-dark-400 hover:text-white hover:bg-dark-800 rounded-lg transition-colors"
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5" />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}
