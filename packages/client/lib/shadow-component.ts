export const HOST_CLASS = 'cs-host';

export abstract class ShadowComponent {
    protected _shadowRoot: ShadowRoot | null = null;
    protected _template: string = '';
    protected _templateUrl: string = '';
    protected $host: HTMLElement | null = null;
    protected $parent: HTMLElement | null = null;
    private _style: string = '';

    get shadowRoot() {
        return this._shadowRoot;
    }

    private _fetchResource(url: string) {
        // @ts-ignore
        return fetch(url).then((response) => {
            if (response.ok) {
                return response.text();
            } else {
                console.error(`Error loading resource: ${response.status} ${response.statusText}`);
            }
        });
    }

    protected async loadTemplate(): Promise<void> {
        const template = await this._fetchResource(chrome.runtime.getURL(this._templateUrl));

        if (template) {
            this._template = template;

            this.createTemplateNodes();
        }
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

            this._shadowRoot.innerHTML = `<style>${this._style}</style>${template.innerHTML}`;
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

    public async activate(): Promise<void> {
        await this.loadTemplate();
    }

    public deactivate(): void {
        const { $parent } = this;
        if ($parent && $parent.contains(this.$host)) {
            $parent.removeChild(this.$host!);
        }
    }

    // Set shadow element references in this method
    protected _setShadowElementReferences(): void {

    }
}
