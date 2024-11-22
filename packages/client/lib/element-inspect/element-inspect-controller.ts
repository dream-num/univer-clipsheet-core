import { ObservableValue } from '@univer-clipsheet-core/shared';
import { IframeCover } from '../cover';
import { ShadowComponent } from '../shadow-component';
import { MaskRenderer } from './mask-renderer';

export const ELEMENT_INSPECT_CLASSES = {
    Wrap: '.cs-wrap',
};

export class ElementInspectController extends ShadowComponent {
    override _templateUrl = 'templates/element-inspect-mask-template.html';
    private $wrap: HTMLElement | null = null;
    private $target: HTMLElement;
    private $cacheEl: HTMLElement;
    active$ = new ObservableValue(false);
    private forbidden: HTMLElement[];

    private clickedTarget$ = new ObservableValue<HTMLElement>(document.body);
    private _renderer: MaskRenderer | null = null;
    private iframeCover = new IframeCover();

    constructor() {
        super();
        this.bindMethods();
        this.$target = document.body;
        this.$cacheEl = document.body;
        this.forbidden = [this.$cacheEl, document.body, document.documentElement];
    }

    get renderer() {
        return this._renderer;
    }

    private bindMethods(): void {
        this.logMouseMovement = this.logMouseMovement.bind(this);
        this.onClick = this.onClick.bind(this);
        this.onMouseDown = this.onMouseDown.bind(this);
    }

    private onMouseDown(evt: MouseEvent) {
        if ((evt.target as HTMLElement).dataset.clipsheet === 'true') {
            return;
        }
        evt.preventDefault();
        evt.stopPropagation();
    }

    override async loadTemplate(): Promise<void> {
        await super.loadTemplate();
        this.registerEvents();
    }

    override _setShadowElementReferences(): void {
        if (!this._shadowRoot) {
            return;
        }
        this.$wrap = this._shadowRoot.querySelector(ELEMENT_INSPECT_CLASSES.Wrap);
    }

    private logMouseMovement({ target: _target }: MouseEvent): void {
        if (!_target) {
            return;
        }

        const target = _target as HTMLElement;
        // specially handle iframe element
        if (target instanceof HTMLIFrameElement) {
            this.iframeCover.attach(target);
        } else {
            if (target === this.iframeCover.cover) {
                return;
            }
            this.iframeCover.detach();
        }

        this.$target = target;

        if (this.forbidden.indexOf(target) !== -1) return;

        this.$cacheEl = target;

        this._renderer?.drawOverlay(target);
    }

    registerEvents() {
        document.addEventListener('mousemove', this.logMouseMovement);
        document.addEventListener('click', this.onClick, {
            capture: true,
        });
        document.addEventListener('mousedown', this.onMouseDown, {
            capture: true,
        });
    }

    unregisterEvents() {
        document.removeEventListener('mousemove', this.logMouseMovement);
        document.removeEventListener('click', this.onClick, {
            capture: true,
        });
        document.removeEventListener('mousedown', this.onMouseDown, {
            capture: true,
        });
    }

    stop() {
        const { value } = this.active$;
        if (!value) {
            return;
        }
        this.unregisterEvents();
        this._renderer?.dispose();
    }

    start() {
        const { value } = this.active$;
        if (!value) {
            return;
        }
        this.registerEvents();
    }

    private onClick(evt: MouseEvent) {
        if ((evt.target as HTMLElement).dataset.clipsheet === 'true') {
            return;
        }
        evt.preventDefault();
        evt.stopPropagation();

        this.clickedTarget$.next(this.$target);
    }

    onInspectElement(callback: (element: HTMLElement) => void) {
        return this.clickedTarget$.subscribe(callback);
    }

    public async activate(): Promise<void> {
        if (this.active$.value) {
            return;
        }
        this.active$.next(true);
        await super.activate();
        if (!this._shadowRoot) {
            return;
        }
        this._renderer = new MaskRenderer(this._shadowRoot);
        this._renderer.registerEvents(() => this.$target);
    }

    public deactivate(): void {
        this.active$.next(false);
        super.deactivate();

        this.$wrap?.classList.add('-out');

        this._renderer?.dispose();
        this.iframeCover.dispose();
        this.clickedTarget$.dispose();
        this.unregisterEvents();
    }
}
