'use client';

import InformDemo from '@/modules/InformDemo';
import { ConfigProvider } from '@/context/ConfigContext';
import { ThemeProvider } from '@/context/ThemeContext';

/**
 * Main page - uses the InformDemo module which is the single source of truth.
 * This same module is exported for use in the Electron wrapper.
 */
export default function Home() {
  return (
    <ThemeProvider>
      <ConfigProvider>
        <InformDemo />
      </ConfigProvider>
    </ThemeProvider>
  );
}
