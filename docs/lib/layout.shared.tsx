import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import Image from 'next/image';
import logo from '@/assets/logo/logo.png';

export const gitConfig = {
  user: 'your-org',
  repo: 'agent-eyes',
  branch: 'main',
};

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <>
          <Image src={logo} alt="AgentEyes" width={34} height={34} style={{ borderRadius: 6 }} />
          <span>AgentEyes</span>
        </>
      ),
    },
    links: [
      {
        text: 'Docs',
        url: '/docs',
        active: 'nested-url',
      },
    ],
    githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
  };
}
