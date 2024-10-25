import { Cog6ToothIcon, ArchiveBoxIcon, MagnifyingGlassIcon, HomeIcon, BellIcon } from '@heroicons/react/24/outline';
//import { CodeBracketIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'next-i18next';
import NavigationItems from './NavigationItems';
import { NavigationProps, MenuItem } from './NavigationItems';

interface NavigationItemsProps extends NavigationProps {
  slug: string;
}

const TeamNavigation = ({ slug, activePathname }: NavigationItemsProps) => {
  const { t } = useTranslation('common');

  const menus: MenuItem[] = [
    // {
    //   name: t('all-products'),
    //   href: `/teams/${slug}/products`,
    //   icon: CodeBracketIcon,
    //   active: activePathname === `/teams/${slug}/products`,
    // },
    {
      name: t('home'),
      href: `/teams/${slug}/home`,
      icon: HomeIcon,
      active: activePathname === `/teams/${slug}/home`,
    },
    {
      name: t('ai-research'),
      href: `/teams/${slug}/ai-research`,
      icon: MagnifyingGlassIcon,
      active: activePathname === `/teams/${slug}/ai-research`,
    },
    {
      name: t('documentStore.title'), 
      href: `/teams/${slug}/document-store`,
      icon: ArchiveBoxIcon,
      active: activePathname === `/teams/${slug}/document-store`,
    },
    {
      name: t('activity-log'),
      href: `/teams/${slug}/activity-log`,
      icon: BellIcon,
      active: activePathname === `/teams/${slug}/activity-log`,
    },
    {
      name: t('settings'),
      href: `/teams/${slug}/settings`,
      icon: Cog6ToothIcon,
      active:
        activePathname?.startsWith(`/teams/${slug}`) &&
        //!activePathname.includes('products') &&
        !activePathname.includes('document-store') &&
        !activePathname.includes('ai-research') &&
        !activePathname.includes('home') &&
        !activePathname.includes('ai-result') &&
        !activePathname.includes('activity-log'),
    },
  ];

  return <NavigationItems menus={menus} />;
};

export default TeamNavigation;
