/**
 * Mixin function to combine multiple classes together.
 *
 * Described at https://catchts.com/oop-style#typed_inheritance
 * Credits Wilco: https://stackoverflow.com/users/5291/wilco
 * Credits @jcalz - https://stackoverflow.com/a/50375286
 *
 * Using the modified version where all classes extend a base class. The
 * constructor is UNABLE to be modified by mixins.
 *
 * Usage:
 *
 *     export class Whatever extends Mixin(
 *         BaseClass,
 *         Mixin1,
 *         Mixin2,
 *         ...,
 *         class extends BaseClass {
 *             // class definition
 *         }
 *     ) {}
 */

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
    k: infer I
) => void
    ? I
    : never;

type ClassType = new (...args: any[]) => any;

export function Mixin<T extends ClassType, R extends T[]>(
    BaseType: T,
    ...classRefs: [...R]
): new (
    ...args: ConstructorParameters<T>
) => UnionToIntersection<InstanceType<[...R][number]>> {
    const derived = class extends BaseType {};
    classRefs.forEach((classRef) => {
        Object.getOwnPropertyNames(classRef.prototype).forEach((name) => {
            const descriptor = Object.getOwnPropertyDescriptor(
                classRef.prototype,
                name
            );

            if (name !== 'constructor' && descriptor) {
                Object.defineProperty(derived.prototype, name, descriptor);
            }
        });
    });

    return derived;
}
