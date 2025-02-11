import { Generic } from './generic';
import { Nbt } from '../nbt/nbt';
import { NbtList } from '../nbt/nbt-list';
import { NbtString } from '../nbt/nbt-string';

type SignTextStrings = [string, string, string, string];

export interface SignText {
    front: SignTextStrings;

    // Added in 1.20
    back?: SignTextStrings;
}

function isSignTextStrings(value?: string[]): value is SignTextStrings {
    return value?.length === 4;
}

export class Sign extends Generic {
    /**
     * Gets a sign's text.
     */
    signText(): SignText {
        function snbtToText(snbtList: SignTextStrings): SignTextStrings {
            return snbtList.map((snbt) => {
                const tag = Nbt.fromSnbt(snbt);

                // 1.20 and newer
                if (tag instanceof NbtString) {
                    return tag.data;
                }

                // Old version
                return tag.findChild<NbtString>('text')?.data ?? '';
            }) as SignTextStrings;
        }

        if (!this.entityData) {
            throw new Error('Block is supposed to have entity data');
        }

        const frontSnbt = this.entityData
            .findChild<NbtList<NbtString>>('front_text/messages')
            ?.data.map((tag) => tag.data);
        const backSnbt = this.entityData
            .findChild<NbtList<NbtString>>('back_text/messages')
            ?.data.map((tag) => tag.data);

        if (isSignTextStrings(frontSnbt) && isSignTextStrings(backSnbt)) {
            return {
                front: snbtToText(frontSnbt),
                back: snbtToText(backSnbt),
            } as SignText;
        }

        const frontOldSnbt = [
            this.entityData.findChild<NbtString>('Text1')?.data,
            this.entityData.findChild<NbtString>('Text2')?.data,
            this.entityData.findChild<NbtString>('Text3')?.data,
            this.entityData.findChild<NbtString>('Text4')?.data,
        ].filter((tag): tag is string => !!tag);

        if (isSignTextStrings(frontOldSnbt)) {
            return {
                front: snbtToText(frontOldSnbt),
            };
        }

        throw new Error('Unknown format for sign text');
    }
}
