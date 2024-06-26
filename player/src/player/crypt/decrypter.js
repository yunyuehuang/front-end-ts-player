import AESCrypto from './aes-crypto';
import FastAESKey from './fast-aes-key';
import AESDecryptor, { removePadding } from './aes-decryptor';
import { appendUint8Array } from './mp4-tools';
import { sliceUint8 } from './typed-array';
import { DecrypterAesMode } from './decrypter-aes-mode';
const CHUNK_SIZE = 16; // 16 bytes, 128 bits
export default class Decrypter {
    constructor({ removePKCS7Padding = true } = {}) {
        this.logEnabled = true;
        this.subtle = null;
        this.softwareDecrypter = null;
        this.key = null;
        this.fastAesKey = null;
        this.remainderData = null;
        this.currentIV = null;
        this.currentResult = null;
        this.enableSoftwareAES = true;
        this.removePKCS7Padding = removePKCS7Padding;
        // built in decryptor expects PKCS7 padding
        if (removePKCS7Padding) {
            try {
                const browserCrypto = self.crypto;
                if (browserCrypto) {
                    this.subtle =
                        browserCrypto.subtle ||
                            browserCrypto.webkitSubtle;
                }
            }
            catch (e) {
                /* no-op */
            }
        }
        this.useSoftware = this.subtle === null;
    }
    destroy() {
        this.subtle = null;
        this.softwareDecrypter = null;
        this.key = null;
        this.fastAesKey = null;
        this.remainderData = null;
        this.currentIV = null;
        this.currentResult = null;
    }
    isSync() {
        return this.useSoftware;
    }
    flush() {
        const { currentResult, remainderData } = this;
        if (!currentResult || remainderData) {
            this.reset();
            return null;
        }
        const data = new Uint8Array(currentResult);
        this.reset();
        if (this.removePKCS7Padding) {
            return removePadding(data);
        }
        return data;
    }
    reset() {
        this.currentResult = null;
        this.currentIV = null;
        this.remainderData = null;
        if (this.softwareDecrypter) {
            this.softwareDecrypter = null;
        }
    }
    decrypt(data, key, iv, aesMode) {
        if (this.useSoftware) {
            return new Promise((resolve, reject) => {
                this.softwareDecrypt(new Uint8Array(data), key, iv, aesMode);
                const decryptResult = this.flush();
                if (decryptResult) {
                    resolve(decryptResult.buffer);
                }
                else {
                    reject(new Error('[softwareDecrypt] Failed to decrypt data'));
                }
            });
        }
        return this.webCryptoDecrypt(new Uint8Array(data), key, iv, aesMode);
    }
    // Software decryption is progressive. Progressive decryption may not return a result on each call. Any cached
    // data is handled in the flush() call
    softwareDecrypt(data, key, iv, aesMode) {
        const { currentIV, currentResult, remainderData } = this;
        if (aesMode !== DecrypterAesMode.cbc || key.byteLength !== 16) {
            // console.log('SoftwareDecrypt: can only handle AES-128-CBC');
            return null;
        }
        this.logOnce('JS AES decrypt');
        // The output is staggered during progressive parsing - the current result is cached, and emitted on the next call
        // This is done in order to strip PKCS7 padding, which is found at the end of each segment. We only know we've reached
        // the end on flush(), but by that time we have already received all bytes for the segment.
        // Progressive decryption does not work with WebCrypto
        if (remainderData) {
            data = appendUint8Array(remainderData, data);
            this.remainderData = null;
        }
        // Byte length must be a multiple of 16 (AES-128 = 128 bit blocks = 16 bytes)
        const currentChunk = this.getValidChunk(data);
        if (!currentChunk.length) {
            return null;
        }
        if (currentIV) {
            iv = currentIV;
        }
        let softwareDecrypter = this.softwareDecrypter;
        if (!softwareDecrypter) {
            softwareDecrypter = this.softwareDecrypter = new AESDecryptor();
        }
        softwareDecrypter.expandKey(key);
        const result = currentResult;
        this.currentResult = softwareDecrypter.decrypt(currentChunk.buffer, 0, iv);
        this.currentIV = sliceUint8(currentChunk, -16).buffer;
        if (!result) {
            return null;
        }
        return result;
    }
    webCryptoDecrypt(data, key, iv, aesMode) {
        const subtle = this.subtle;
        if (this.key !== key || !this.fastAesKey) {
            this.key = key;
            this.fastAesKey = new FastAESKey(subtle, key, aesMode);
        }
        return this.fastAesKey
            .expandKey()
            .then((aesKey) => {
            // decrypt using web crypto
            if (!subtle) {
                return Promise.reject(new Error('web crypto not initialized'));
            }
            this.logOnce('WebCrypto AES decrypt');
            const crypto = new AESCrypto(subtle, new Uint8Array(iv), aesMode);
            return crypto.decrypt(data.buffer, aesKey);
        })
            .catch((err) => {
            // logger.warn(
            //   `[decrypter]: WebCrypto Error, disable WebCrypto API, ${err.name}: ${err.message}`,
            // );
            return this.onWebCryptoError(data, key, iv, aesMode);
        });
    }
    onWebCryptoError(data, key, iv, aesMode) {
        const enableSoftwareAES = this.enableSoftwareAES;
        if (enableSoftwareAES) {
            this.useSoftware = true;
            this.logEnabled = true;
            this.softwareDecrypt(data, key, iv, aesMode);
            const decryptResult = this.flush();
            if (decryptResult) {
                return decryptResult.buffer;
            }
        }
        throw new Error('WebCrypto' +
            (enableSoftwareAES ? ' and softwareDecrypt' : '') +
            ': failed to decrypt data');
    }
    getValidChunk(data) {
        let currentChunk = data;
        const splitPoint = data.length - (data.length % CHUNK_SIZE);
        if (splitPoint !== data.length) {
            currentChunk = sliceUint8(data, 0, splitPoint);
            this.remainderData = sliceUint8(data, splitPoint);
        }
        return currentChunk;
    }
    logOnce(msg) {
        if (!this.logEnabled) {
            return;
        }
        console.log(`[decrypter]: ${msg}`);
        this.logEnabled = false;
    }
}
