import { GenericBlock } from './generic-block';
import { Nbt } from '../nbt/nbt';
import { NbtList } from '../nbt/nbt-list';
import { NbtString } from '../nbt/nbt-string';

export interface SignText {
    front: [string, string, string, string];

    // Added in 1.20
    back?: [string, string, string, string];
}

export class SignBlock extends GenericBlock {
    /**
     * Gets a sign's text.
     */
    signText(): SignText {
        function snbtToText(snbtList: string[]) {
            return snbtList.map((snbt) => {
                const tag = Nbt.fromSnbt(snbt);

                if (tag instanceof NbtString) {
                    return tag.data;
                }

                return tag.findChild<NbtString>('text')?.data ?? '';
            });
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

        if (frontSnbt && backSnbt) {
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

        if (frontOldSnbt) {
            return {
                front: snbtToText(frontOldSnbt),
            };
        }

        throw new Error('Unknown format for sign text');
    }
}
