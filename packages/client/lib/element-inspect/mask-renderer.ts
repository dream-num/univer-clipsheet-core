
export const MASK_CANVAS_ID = '#cs-canvas';

export class MaskRenderer {
    private canvas!: HTMLCanvasElement;
    private ctx!: CanvasRenderingContext2D;

    constructor(protected shadowRoot: ShadowRoot) {
        this.bindMethods();
        this.setCanvasElement();
    }

    protected bindMethods(): void {
        this.drawOverlay = this.drawOverlay.bind(this);
        this.handleResize = this.handleResize.bind(this);
    }

    private setCanvasElement(): void {
        this.canvas = this.shadowRoot.querySelector(MASK_CANVAS_ID)!;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.canvas.style.pointerEvents = 'none';
        this.ctx = this.canvas.getContext('2d')!;
    }

    private _computeBox(element: Element): any {
        const rect = element.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(element);

        const toNumber = (val: string) => Math.max(0, Number.parseInt(val, 10));

        const box = {
            width: rect.width,
            height: rect.height,
            top: rect.top,
            left: rect.left,
            margin: {
                top: toNumber(computedStyle.marginTop),
                right: toNumber(computedStyle.marginRight),
                bottom: toNumber(computedStyle.marginBottom),
                left: toNumber(computedStyle.marginLeft),
            },
            padding: {
                top: toNumber(computedStyle.paddingTop),
                right: toNumber(computedStyle.paddingRight),
                bottom: toNumber(computedStyle.paddingBottom),
                left: toNumber(computedStyle.paddingLeft),
            },
        };

        return box;
    }

    public drawOverlay(element: Element) {
        if (!element) {
            return;
        }
        const box = this._computeBox(element);

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        box.left = Math.floor(box.left) + 1.5;
        box.width = Math.floor(box.width) - 1;


        // padding-box
        const x = box.left;
        const y = box.top;
        const width = box.width;
        const height = box.height;

        this.ctx.fillStyle = 'rgba(73,187,231,0.25)';
        this.ctx.clearRect(x, y, width, height);
        this.ctx.fillRect(x, y, width, height);
    }

    clearOverlay(): void {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    handleResize(): void {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    registerEvents(getTargetCallback: () => Element): void {
        document.addEventListener('scroll', () => {
            this.drawOverlay(getTargetCallback());
        });

        window.addEventListener('resize', () => {
            this.handleResize();
            this.drawOverlay(getTargetCallback());
        });
    }

    dispose() {
        this.clearOverlay();
    }
}
