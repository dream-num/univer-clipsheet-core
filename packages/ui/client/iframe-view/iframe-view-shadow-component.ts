import type { ShadowComponent } from '../shadow-component';

export interface IframeViewShadowComponent extends ShadowComponent {
    setSrc(src: string): void;
}
