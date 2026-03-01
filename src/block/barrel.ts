import { HasEntityData } from './has-entity-data.js';
import { CustomName } from './mixins/custom-name.js';
import { Lock } from './mixins/lock.js';
import { Mixin } from './mixins/mixin.js';
import { NbtCompound } from '../nbt/nbt-compound.js';
import { NbtList } from '../nbt/nbt-list.js';
import { NbtLong } from '../nbt/nbt-long.js';
import { NbtString } from '../nbt/nbt-string.js';

export class Barrel extends Mixin(
    HasEntityData,
    CustomName,
    Lock,
    class extends HasEntityData {
        items(): NbtList<NbtCompound> {
            const items =
                this.entityData.findChild<NbtList<NbtCompound>>('Items');

            if (!items) {
                throw new Error('Barrel is missing items tag');
            }

            return items;
        }

        lootTable(): string | undefined {
            return this.entityData.findChild<NbtString>('LootTable')?.data;
        }

        lootTableSeed(): bigint | undefined {
            return this.entityData.findChild<NbtLong>('LootTableSeed')?.data;
        }
    }
) {}
