export class OpenNfseError extends Error {
    constructor(message, options) {
        super(message, options);
        this.name = this.constructor.name;
    }
}
//# sourceMappingURL=base.js.map