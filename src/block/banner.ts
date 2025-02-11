import { CustomName } from './custom-name';
import { NbtCompound } from '../nbt/nbt-compound';
import { NbtList } from '../nbt/nbt-list';
import { NbtString } from '../nbt/nbt-string';

export interface BannerPatternDefinition {
    asset_id: string;
    translation_key: string;
}

export interface BannerPattern {
    color: string;
    pattern: string | BannerPatternDefinition;
}

export class Banner extends CustomName {
    override readonly type = 'BANNER';

    bannerPatterns(): BannerPattern[] {
        const patterns =
            this.entityData.findChild<NbtList<NbtCompound>>('Patterns');

        if (!patterns) {
            throw new Error('Unable to find patterns in banner');
        }

        return patterns.data.map((compound) => {
            const color = compound.findChild<NbtString>('Color');
            const pattern = compound.findChild<NbtString | NbtCompound>(
                'Pattern'
            );

            if (!color || !pattern) {
                throw new Error('Color or pattern not found in banner pattern');
            }

            if (pattern instanceof NbtString) {
                return { color: color.data, pattern: pattern.data };
            }

            return {
                color: color.data,
                pattern: {
                    asset_id:
                        pattern.findChild<NbtString>('Pattern')?.data ?? '',
                    translation_key:
                        pattern.findChild<NbtString>('Pattern')?.data ?? '',
                },
            };
        });
    }
}
