import { NbtLongArray } from '../nbt/nbt-long-array';

// At most, we will have 7 bits to mask
const MASK = [0, 1, 3, 7, 15, 31, 63, 127];

export class BitData {
    static fromLongArrayTag(tag: NbtLongArray): BitData {
        const arrayBuffer = new ArrayBuffer(tag.data.length * 8);
        const view = new DataView(arrayBuffer);
        let position = 0;

        for (const value of tag.data) {
            // Convert back to a byte stream. The source comes from
            // NbtLongArray.fromBinaryData(). Make sure the endianness is
            // correct and matches the reader.
            view.setBigInt64(position, value, true);
            position += 8;
        }

        return new BitData(arrayBuffer);
    }

    private length: number;
    private partial = 0;
    private partialCount = 0;
    private position = 0;
    private view: DataView;

    constructor(data: ArrayBuffer) {
        this.view = new DataView(data);
        this.length = data.byteLength;
    }

    currentPosition() {
        return this.position;
    }

    getBits(n: number): number {
        // Add extra bits to the left
        while (n > this.partialCount) {
            this.partial |= this.view.getUint8(this.position) << this.partialCount;
            this.position += 1;
            this.partialCount += 8;
        }

        // Return bits from the right
        const result = this.partial & MASK[n];
        this.partial >>= n;
        this.partialCount -= n;

        return result;
    }

    // The amount of bytes left in the buffer
    remainingLength() {
        return this.length - this.position;
    }

    seek(position: number, partialCount = 0) {
        this.position = position;
        this.partial = 0;
        this.partialCount = partialCount;
    }

    // FIXME - need to figure out how this is written. Does it update just one byte?
    // FIXME - I don't see a flush method.
    setBits(n: number, value: number) {
        // Add the new bits to the right
        this.partial <<= n;
        this.partial |= value;
        this.partialCount += n;

        while (this.partialCount >= 8) {
            this.view.setUint8(this.position, this.partial >> (this.partialCount - 8));
            this.position += 1;
            this.partialCount -= 8;
            this.partial &= MASK[this.partialCount];
        }
    }
}
