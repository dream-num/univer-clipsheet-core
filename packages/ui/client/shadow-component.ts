import { ObservableValue } from '@univer-clipsheet-core/shared';

export const HOST_CLASS = 'cs-host';

export abstract class ShadowComponent {
    active$ = new ObservableValue<boolean>(false);
    protected _shadowRoot: ShadowRoot | null = null;
    protected _template: string = '';
    protected $host: HTMLElement | null = null;
    protected $parent: HTMLElement | null = null;

    get active() {
        return this.active$.value;
    }

    get shadowRoot() {
        return this._shadowRoot;
    }

    protected createTemplateNodes(): void {
        this._createHostElement();
        this.attachShadowToHost();
        this._populateShadowTemplate();
        this._setShadowElementReferences();
    }

    protected _populateShadowTemplate(): void {
        const templateMarkup = document.createElement('div');
        templateMarkup.innerHTML = this._template;
        if (this._shadowRoot) {
            const template = templateMarkup.querySelector('template')!;

            this._shadowRoot.innerHTML = template.innerHTML;
        }
    }

    protected attachShadowToHost(): void {
        if (this.$host) {
            this._shadowRoot = this.$host.attachShadow({ mode: 'open' });
        }
    }

    protected _createHostElement(): void {
        this.$host = document.createElement('div');
        this.$host.className = HOST_CLASS;
        this.$host.dataset.clipsheet = 'true';
        this.$host.style.cssText = 'all: initial;';

        this.$parent = document.body;
        this.$parent.appendChild(this.$host);
    }

    public activate() {
        this.active$.next(true);
        this.createTemplateNodes();
    }

    public deactivate(): void {
        this.active$.next(false);
        const { $parent } = this;
        if ($parent && $parent.contains(this.$host)) {
            $parent.removeChild(this.$host!);
        }
    }

    // Set shadow element references in this method
    protected _setShadowElementReferences(): void {

    }
}
