export type SnbtTokenType =
    | 'BYTE'
    | 'BYTE_ARRAY_START'
    | 'COLON'
    | 'COMMA'
    | 'COMPOUND_END'
    | 'COMPOUND_START'
    | 'DOUBLE'
    | 'FLOAT'
    | 'INT'
    | 'INT_ARRAY_START'
    | 'LIST_END'
    | 'LIST_START'
    | 'LONG'
    | 'LONG_ARRAY_START'
    | 'SHORT'
    | 'STRING'
    | 'WHITESPACE'; // For logging, but not made into tokens

export interface SnbtToken {
    content: string;
    offset: number;
    type: SnbtTokenType;
}

export class SnbtData {
    position = 0;
    data: SnbtToken[] = [];

    addToken(offset: number, type: SnbtTokenType, content: string) {
        this.data.push({ type, content, offset });
    }

    currentPosition() {
        return this.position;
    }

    remainingLength() {
        return this.data.length - this.position;
    }

    seek(offset: number) {
        this.position = offset;
    }

    showToken(token?: SnbtToken) {
        if (!token) {
            return 'undefined';
        }

        return `${token.type} at ${token.offset}: "${token.content}"`;
    }

    step(offset: number) {
        this.position += offset;
    }

    token() {
        if (this.position >= this.data.length) {
            throw new Error(
                `Ran out of tokens at position ${this.position} - previous token was ${this.showToken(this.data[this.position - 1])}`
            );
        }

        const token = this.data[this.position];
        this.position += 1;

        return token;
    }
}
