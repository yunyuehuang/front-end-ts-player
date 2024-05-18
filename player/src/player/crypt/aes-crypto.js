import { DecrypterAesMode } from './decrypter-aes-mode';
export default class AESCrypto {
    constructor(subtle, iv, aesMode) {
        this.subtle = subtle;
        this.aesIV = iv;
        this.aesMode = aesMode;
    }
    decrypt(data, key) {
        switch (this.aesMode) {
            case DecrypterAesMode.cbc:
                return this.subtle.decrypt({ name: 'AES-CBC', iv: this.aesIV }, key, data);
            case DecrypterAesMode.ctr:
                return this.subtle.decrypt({ name: 'AES-CTR', counter: this.aesIV, length: 64 }, //64 : NIST SP800-38A standard suggests that the counter should occupy half of the counter block
                key, data);
            default:
                throw new Error(`[AESCrypto] invalid aes mode ${this.aesMode}`);
        }
    }
}
