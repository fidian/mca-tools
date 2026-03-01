import { HasEntityData } from './has-entity-data.js';
import { NbtCompound } from '../nbt/nbt-compound.js';
import { NbtList } from '../nbt/nbt-list.js';
import { NbtString } from '../nbt/nbt-string.js';

export interface BannerPatternDefinition {
    asset_id: string;
    translation_key: string;
}

export interface BannerPattern {
    color: string;
    pattern: string | BannerPatternDefinition;
}

export class Banner extends HasEntityData {
    patterns(): BannerPattern[] {
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
