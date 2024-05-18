import { DecrypterAesMode } from './decrypter-aes-mode';
export default class FastAESKey {
    constructor(subtle, key, aesMode) {
        this.subtle = subtle;
        this.key = key;
        this.aesMode = aesMode;
    }
    expandKey() {
        const subtleAlgoName = getSubtleAlgoName(this.aesMode);
        return this.subtle.importKey('raw', this.key, { name: subtleAlgoName }, false, ['encrypt', 'decrypt']);
    }
}
function getSubtleAlgoName(aesMode) {
    switch (aesMode) {
        case DecrypterAesMode.cbc:
            return 'AES-CBC';
        case DecrypterAesMode.ctr:
            return 'AES-CTR';
        default:
            throw new Error(`[FastAESKey] invalid aes mode ${aesMode}`);
    }
}
