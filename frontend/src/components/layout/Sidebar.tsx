'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
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
  CubeIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';
import { springs } from '@/lib/animations';

// ============================================
// MENU ITEMS
// ============================================
const menuItems = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Clientes', href: '/dashboard/clients', icon: UserGroupIcon },
  { name: 'Barbeiros', href: '/dashboard/barbers', icon: ScissorsIcon },
  { name: 'Serviços', href: '/dashboard/services', icon: WrenchScrewdriverIcon },
  { name: 'Pacotes', href: '/dashboard/packages', icon: CubeIcon },
  { name: 'Produtos', href: '/dashboard/products', icon: ShoppingBagIcon },
  { name: 'Agendamentos', href: '/dashboard/appointments', icon: CalendarDaysIcon },
  { name: 'Assinaturas', href: '/dashboard/subscriptions', icon: RectangleStackIcon },
  { name: 'Checkout', href: '/dashboard/checkout', icon: ShoppingCartIcon },
  { name: 'Financeiro', href: '/dashboard/financial', icon: CurrencyDollarIcon },
  { name: 'Notificações', href: '/dashboard/notifications', icon: ChatBubbleLeftRightIcon },
  { name: 'WhatsApp', href: '/dashboard/whatsapp', icon: Cog6ToothIcon },
];

// ============================================
// SIDEBAR COMPONENT
// ============================================
export function Sidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuthStore();

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-dark-900 border-r border-dark-800 flex flex-col z-40">
      {/* Logo */}
      <div className="p-6 border-b border-dark-800">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-2xl font-bold text-gradient">Barber</h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-dark-400 text-sm"
          >
            Manager
          </motion.p>
        </motion.div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-hide">
        {menuItems.map((item, index) => {
          const isActive =
            pathname === item.href || pathname?.startsWith(`${item.href}/`);

          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03, duration: 0.3 }}
            >
              <Link href={item.href} className="relative block">
                <motion.div
                  whileHover={{ x: 4 }}
                  transition={springs.default}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors relative',
                    isActive
                      ? 'bg-primary-500/10 text-primary-500'
                      : 'text-dark-300 hover:bg-dark-800 hover:text-white'
                  )}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active-indicator"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary-500 rounded-r-full"
                      transition={springs.default}
                    />
                  )}

                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium">{item.name}</span>

                  {/* Hover glow effect */}
                  {isActive && (
                    <motion.div
                      className="absolute inset-0 rounded-lg bg-primary-500/5"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    />
                  )}
                </motion.div>
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* User Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="p-4 border-t border-dark-800"
      >
        <div className="flex items-center gap-3 mb-4">
          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={springs.default}
            className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center"
          >
            <span className="text-primary-500 font-bold">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </span>
          </motion.div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user?.name || 'Usuário'}
            </p>
            <p className="text-xs text-dark-400 truncate">
              {user?.email || 'email@example.com'}
            </p>
          </div>
        </div>

        <motion.button
          whileHover={{ x: 4 }}
          whileTap={{ scale: 0.98 }}
          transition={springs.default}
          onClick={logout}
          className="flex items-center gap-2 w-full px-4 py-2 text-dark-400 hover:text-white hover:bg-dark-800 rounded-lg transition-colors"
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5" />
          <span>Sair</span>
        </motion.button>
      </motion.div>
    </aside>
  );
}

// ============================================
// SIDEBAR LINK (for custom menu items)
// ============================================
interface SidebarLinkProps {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  badge?: React.ReactNode;
}

export function SidebarLink({ href, icon: Icon, children, badge }: SidebarLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname?.startsWith(`${href}/`);

  return (
    <Link href={href} className="relative block">
      <motion.div
        whileHover={{ x: 4 }}
        transition={springs.default}
        className={cn(
          'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors relative',
          isActive
            ? 'bg-primary-500/10 text-primary-500'
            : 'text-dark-300 hover:bg-dark-800 hover:text-white'
        )}
      >
        {isActive && (
          <motion.div
            layoutId="sidebar-active-indicator"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary-500 rounded-r-full"
            transition={springs.default}
          />
        )}
        <Icon className="w-5 h-5 flex-shrink-0" />
        <span className="font-medium flex-1">{children}</span>
        {badge}
      </motion.div>
    </Link>
  );
}
