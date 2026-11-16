// Wraps the theme's version dropdown so that each instance's dropdown only shows on that
// instance's own pages, instead of every product's dropdown on every page.
import React, {type ReactNode} from 'react';
import DocsVersionDropdownNavbarItem from '@theme-original/NavbarItem/DocsVersionDropdownNavbarItem';
import type DocsVersionDropdownNavbarItemType from '@theme/NavbarItem/DocsVersionDropdownNavbarItem';
import type {WrapperProps} from '@docusaurus/types';
import {useActivePlugin} from '@docusaurus/plugin-content-docs/client';

type Props = WrapperProps<typeof DocsVersionDropdownNavbarItemType>;

export default function DocsVersionDropdownNavbarItemWrapper(props: Props): ReactNode {
  const activePlugin = useActivePlugin();
  if (activePlugin?.pluginId !== (props.docsPluginId ?? 'default')) {
    return null;
  }
  return <DocsVersionDropdownNavbarItem {...props} />;
}
