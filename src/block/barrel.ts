import { HasEntityData } from './has-entity-data';
import { CustomName } from './mixins/custom-name';
import { Lock } from './mixins/lock';
import { Mixin } from './mixins/mixin';
import { NbtCompound } from '../nbt/nbt-compound';
import { NbtList } from '../nbt/nbt-list';
import { NbtLong } from '../nbt/nbt-long';
import { NbtString } from '../nbt/nbt-string';

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
