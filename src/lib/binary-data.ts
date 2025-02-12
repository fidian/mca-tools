/**
 * Create a read/write view of a binary data buffer. Write operations that are
 * beyond the buffer's current size will increase the buffer's size in chunks.
 */
export class BinaryData {
    private position = 0;
    private view: DataView;

    constructor(data: ArrayBufferLike) {
        this.view = new DataView(data);
    }

    buffer(): ArrayBufferLike {
        return this.view.buffer;
    }

    byteLength(): number {
        return this.view.byteLength;
    }

    currentPosition(): number {
        return this.position;
    }

    getArrayBuffer(length: number) {
        const data = this.view.buffer.slice(
            this.position,
            this.position + length
        );
        this.position += length;

        return data;
    }

    getByte() {
        const value = this.view.getUint8(this.position);
        this.position += 1;

        return value;
    }

    getDouble() {
        const value = this.view.getFloat64(this.position);
        this.position += 8;

        return value;
    }

    getFloat() {
        const value = this.view.getFloat32(this.position);
        this.position += 4;

        return value;
    }

    getInt() {
        const value = this.view.getInt32(this.position);
        this.position += 4;

        return value;
    }

    getInt64(): bigint {
        const value = this.view.getBigInt64(this.position, true);
        this.position += 8;

        return value;
    }

    getInt64LE(): bigint {
        const value = this.view.getBigInt64(this.position);
        this.position += 8;

        return value;
    }

    getNByteInteger(n: number) {
        let value = 0;

        for (let i = 0; i < n; i += 1) {
            const b = this.getByte();
            value = value * 256 + b;
        }

        return value;
    }

    getShort() {
        const value = this.view.getInt16(this.position);
        this.position += 2;

        return value;
    }

    getString(len: number) {
        let s = '';

        for (let i = 0; i < len; i += 1) {
            const c = this.getByte();

            if (c > 0) {
                s += String.fromCharCode(c);
            }
        }

        return s;
    }

    getUInt() {
        const value = this.view.getUint32(this.position);
        this.position += 4;

        return value;
    }

    getUInt64(): bigint {
        const v = this.view.getBigUint64(this.position);
        this.position += 8;

        return v;
    }

    getUInt64LE(): bigint {
        const v = this.view.getBigUint64(this.position, true);
        this.position += 8;

        return v;
    }

    getUShort() {
        const value = this.view.getUint16(this.position);
        this.position += 2;

        return value;
    }

    /**
     * Checks how many bytes are between the current position and the end of
     * the buffer.
     */
    remainingLength() {
        return this.view.byteLength - this.position;
    }

    seek(offset: number): void {
        this.position = offset;
    }

    setArrayBuffer(value: ArrayBuffer) {
        this.growToFit(value.byteLength);
        new Uint8Array(this.view.buffer).set(
            new Uint8Array(value),
            this.position
        );
        this.position += value.byteLength;
    }

    setByte(value: number) {
        this.growToFit(1);
        this.view.setUint8(this.position, value);
        this.position += 1;
    }

    setDouble(value: number) {
        this.growToFit(8);
        this.view.setFloat64(this.position, value);
        this.position += 8;
    }

    setFloat(value: number) {
        this.growToFit(4);
        this.view.setFloat32(this.position, value);
        this.position += 4;
    }

    setInt(value: number) {
        this.growToFit(4);
        this.view.setInt32(this.position, value);
        this.position += 4;
    }

    setInt64(value: bigint) {
        this.growToFit(8);
        this.view.setBigInt64(this.position, value);
        this.position += 8;
    }

    setInt64LE(value: bigint) {
        this.growToFit(8);
        this.view.setBigUint64(this.position, value, true);
        this.position += 8;
    }

    setNByteInteger(value: number, size: number) {
        this.growToFit(size);

        for (let i = size - 1; i >= 0; i -= 1) {
            this.setByte(Math.floor(value / Math.pow(256, i)) % 256);
        }
    }

    setShort(value: number) {
        this.growToFit(2);
        this.view.setInt16(this.position, value);
        this.position += 2;
    }

    setString(value: string) {
        this.growToFit(value.length);

        for (let i = 0; i < value.length; i += 1) {
            this.setByte(value.charCodeAt(i));
        }
    }

    setUInt(value: number) {
        this.growToFit(4);
        this.view.setUint32(this.position, value);
        this.position += 4;
    }

    setUInt64(value: bigint) {
        this.growToFit(8);
        this.view.setBigUint64(this.position, value);
        this.position += 8;
    }

    setUInt64LE(value: bigint) {
        this.growToFit(8);
        this.view.setBigUint64(this.position, value, true);
        this.position += 8;
    }

    setUShort(value: number) {
        this.growToFit(2);
        this.view.setUint16(this.position, value);
        this.position += 2;
    }

    private growToFit(size: number) {
        while (size > this.remainingLength()) {
            const newBuffer = new ArrayBuffer(this.view.byteLength * 2);
            new Uint8Array(newBuffer).set(new Uint8Array(this.view.buffer));
            this.view = new DataView(newBuffer);
        }
    }
}
