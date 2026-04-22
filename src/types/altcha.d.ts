import type { DetailedHTMLProps, HTMLAttributes } from 'react';

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'altcha-widget': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          challengeurl?: string;
          auto?: string;
          hidelogo?: boolean;
          hidefooter?: boolean;
        },
        HTMLElement
      >;
    }
  }
}
