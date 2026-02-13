import { HasEntityData } from './has-entity-data';
import { NbtByte } from '../nbt/nbt-byte';
import { NbtList } from '../nbt/nbt-list';
import { NbtString } from '../nbt/nbt-string';

type SignText = [string, string, string, string];

export class Sign extends HasEntityData {
    backColor(): string | undefined {
        // 1.20+
        return this.entityData.findChild<NbtString>('back_text/color')?.data;
    }

    backGlowingText(): boolean | undefined {
        // 1.20+
        const byte = this.entityData.findChild<NbtByte>(
            'back_text/has_glowing_text'
        );

        if (byte) {
            return byte.data !== 0;
        }

        // Up to 1.19
        return;
    }

    backText(): SignText | undefined {
        // 1.20+
        const backSnbt = this.entityData
            .findChild<NbtList<NbtString>>('back_text/messages')
            ?.data.map((tag) => tag.data);

        if (this.isSignText(backSnbt)) {
            return backSnbt;
        }

        // Up to 1.19
        return;
    }

    frontColor(): string | undefined {
        return (
            // 1.20+
            this.entityData.findChild<NbtString>('front_text/color')?.data ||
            // Up to 1.19
            this.entityData.findChild<NbtString>('Color')?.data
        );
    }

    frontGlowingText(): boolean | undefined {
        const byte =
            // 1.20+
            this.entityData.findChild<NbtByte>('front_text/has_glowing_text') ||
            // Up to 1.19
            this.entityData.findChild<NbtByte>('GlowingText');

        if (byte) {
            return byte.data !== 0;
        }

        return;
    }

    frontText(): SignText {
        // 1.20+
        const frontSnbt = this.entityData
            .findChild<NbtList<NbtString>>('front_text/messages')
            ?.data.map((tag) => tag.data);

        if (this.isSignText(frontSnbt)) {
            return frontSnbt;
        }

        // Up to 1.19
        const frontOldSnbt = [
            this.entityData.findChild<NbtString>('Text1')?.data,
            this.entityData.findChild<NbtString>('Text2')?.data,
            this.entityData.findChild<NbtString>('Text3')?.data,
            this.entityData.findChild<NbtString>('Text4')?.data,
        ].filter((tag): tag is string => !!tag);

        if (this.isSignText(frontOldSnbt)) {
            return frontOldSnbt;
        }

        throw new Error('Unknown format for sign text');
    }

    isWaxed(): boolean | undefined {
        const tag = this.entityData.findChild<NbtByte>('waxed');

        if (!tag) {
            // Up to 1.19
            return;
        }

        // 1.20+
        return tag.data !== 0;
    }

    private isSignText(value?: string[]): value is SignText {
        return value?.length === 4;
    }
}
