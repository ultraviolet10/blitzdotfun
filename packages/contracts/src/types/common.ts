/**
 * Extract all keys from an object, but also works on union of objects, basically what you think `keyof Union` would do,
 * but doesn't.
 */
export type Keys<T> = T extends unknown ? keyof T : never

/**
 * Returns an union of the optional keys of `T`.
 *
 * The type works well for inference on concrete types but struggles with type bounds. In particular, TS sometimes
 * struggles with multiple of this type and/or {@link RequiredKeys} (the precise conditions being mysterious to me). In
 * those cases, using the alternative type {@link NonRequiredKeys} often works.
 */
export type OptionalKeys<T> = {
    // biome-ignore lint/complexity/noBannedTypes: we need to represent the empty object
    [K in keyof T]-?: {} extends Pick<T, K> ? K : never
}[keyof T]

/**
 * Returns an union of the optional keys of `T`.
 *
 * The type works well for inference on concrete types but struggles with type bounds. In particular, TS sometimes
 * struggles with multiple of this type and/or {@link OptionalKeys} (the precise conditions being mysterious to me). In
 * those cases, using the alternative type {@link NonOptionalKeys} often works.
 */
export type RequiredKeys<T> = {
    // biome-ignore lint/complexity/noBannedTypes: we need to represent the empty object
    [K in keyof T]-?: {} extends Pick<T, K> ? never : K
}[keyof T]

/**
 * Alternative to {@link RequiredKeys}, to be used when the TS type system has trouble mixing multiple instantiations of
 * {@link OptionalKeys} and/or {@link RequiredKeys}.
 */
export type NonOptionalKeys<T> = Exclude<keyof T, OptionalKeys<T>>

/**
 * Alternative to {@link OptionalKeys}, to be used when the TS type system has trouble mixing multiple instantiations of
 * {@link OptionalKeys} and/or {@link RequiredKeys}.
 */
export type NonRequiredKeys<T> = Exclude<keyof T, RequiredKeys<T>>


// === COMMON TYPES ================================================================================

/** Type of http or https strings, starting with the proper protocol. */
export type HTTPString = `http://${string}` | `https://${string}`

/** Type predicate / assertion for {@link HTTPString}. */
export function isHttpString(string: string | undefined): string is HTTPString {
    return !!string && (string.startsWith("http://") || string.startsWith("https://"))
}

/** Type of hexadecimal strings prefixed with 0x. */
export type Hex = `0x${string}`

/** Type of hexadecimal wallet addresses prefixed with 0x. */
export type Address = `0x${string}`

/** A hash, as hex-encoded data. (0x-prefixed string). */
export type Hash = `0x${string}`

/**
 * Type shorthand for `null | undefined`.
 */
export type Nullish = null | undefined

/**
 * Type for any value that is not undefined. Very useful as a type bound.
 */
// biome-ignore lint/complexity/noBannedTypes: -- all hail Norswap san --
export type NotUndefined = {} | null

/**
 * Type for any value that is not null. Very useful as a type bound.
 */
// biome-ignore lint/complexity/noBannedTypes: -- all hail Norswap san --
export type NotNull = {} | undefined

/**
 * Type for any value that is not undefined or null. Very useful as a type bound.
 */
// biome-ignore lint/complexity/noBannedTypes: -- all hail Norswap san --
export type Defined = {}

/**
 * Type of object with values of type `T` (`unknown` by default). This is a better object type than `object` that
 * excludes `null`, `undefined` and primitive types (numbers, booleans, strings).
 */
export type Obj<T = unknown> = Record<string, T>

/**
 * Type guard shorthand for `value !== null && value !== undefined`
 */
export function isDef(value: unknown): value is Defined {
    return value !== null && value !== undefined
}

/**
 * Type guard shorthand for `value === null || value === undefined`.
 */
export function isNullish(value: unknown): value is null | undefined {
    return value === null || value === undefined
}

/**
 * Type guard to check if a value is an object in the sense of {@link Obj} (a non-null non-undefined record).
 */
export function isObj(value: unknown): value is Obj {
    return typeof value === "object" && isDef(value) && !Array.isArray(value)
}

// === Solidity Type Mappings ================================================================================

export type UInt256 = bigint
export type UInt192 = bigint
export type UInt160 = bigint
export type UInt128 = bigint
export type UInt96 = bigint
export type UInt64 = bigint
export type UInt32 = number
export type UInt16 = number
export type UInt8 = number

export type Int256 = bigint
export type Int192 = bigint
export type Int160 = bigint
export type Int128 = bigint
export type Int96 = bigint
export type Int64 = bigint
export type Int32 = number
export type Int16 = number
export type Int8 = number

export type Bytes = Hex

// === TYPE ASSERTIONS =============================================================================

/**
 * Asserts that `_A` is assignable to `_B`.
 *
 * @example
 * ```ts twoslash
 * type _assert1 = AssertAssignableTo<"test", string> // okay
 * type _assert2 = AssertAssignableTo<string, "test"> // error
 * ```
 */
export type AssertAssignableTo<_A extends _B, _B> = never

/**
 * Asserts that `A` and `B` are mutually assignable.
 *
 * @example
 * ```ts twoslash
 * type _assert1 = AssertCompatible<{ a: string, b?: string }, { a: string }> // okay
 * type _assert2 = AssertCompatible<{ a: string, b?: string }, { a: string, b: string }> // error
 * ```
 */
export type AssertCompatible<A extends B, B extends C, C = A> = never

// === TYPE FUNCTIONS ==============================================================================

/**
 * Merges object definitions within a type intersection.
 *
 * e.g. `Prettify<{ a: string } & { b: number }>` evaluates to `{ a: string, b: number }`.
 */
export type Prettify<T> = { [K in keyof T]: T[K] } & {}

/**
 * Returns the types of the values of T (where T is an object).
 */
export type Values<T> = T[keyof T]

/**
 * A version of `Base` with `OptionalKeys` made optional.
 *
 * e.g. `Optional<{ a: string, b: number }, "b">` evaluates to `{ a: string, b?: number }`.
 */
export type Optional<Base, OptionalKeys extends keyof Base> = Prettify<
    Omit<Base, OptionalKeys> & Partial<Pick<Base, OptionalKeys>>
>

/**
 * Returns the array type that matches all possible permutations of the input disjunction type `T`.
 * Note this has combinatorial complexity.
 *
 * @example
 * ```ts twoslash
 * type Disjunction = "a" | "b"
 * type DisjunctionArray = TupleUnion<Disjunction>
 * type _assert = AssertCompatible<DisjunctionArray, ["a", "b"] | ["b", "a"]>
 * ```
 */
// biome-ignore format: readability
export type TupleUnion<T, K = T> =
    [T] extends [never]
        ? []
        : K extends T
            ? [K, ...TupleUnion<Exclude<T, K>>]
            : never

/**
 * Converts an union type into a tuple type, e.g. `A | B | C` becomes `[A, B, C]`.
 * The order of type arguments is NOT guaranteed, but generally preserved.
 */
// Adapted from https://stackoverflow.com/a/55858763/298664
// Read here to understand some of the dark magic: https://gist.github.com/norswap/37f7dd715a986d0ce163b8d07bbe289a
// biome-ignore format: readability
export type UnionToTuple<Union> =
    [Union] extends [never]
        ? []
        : Select<Union> extends infer Member
            ? [...UnionToTuple<Exclude<Union, Member>>, Member]
            : never

/**
 * Given an union U, selects one of its members. This is *generally* the
 * last one, but sometimes it does weird things, e.g. `Select<1|2|3> == 2`.
 */
export type Select<U> = ReturnOf<InferAsArg<RetFunc<U>>>

type RetFunc<T> = T extends never ? never : () => T
type ArgFunc<T> = T extends never ? never : (_: T) => void
type ReturnOf<T> = T extends () => infer R ? R : never
type InferAsArg<T> = ArgFunc<T> extends (_: infer A) => void ? A : never

/**
 * Given the type of a tuple of keys (`KeyTuple`) and a type whose keys are a superset of the keys
 * in the tuple (`Mapping`), returns a tuple of the value types in `Mapping` for each corresponding
 * key.
 *
 * e.g. `MapTuple<["a", "b"], { a: number, b: string, c: boolean }>` evaluates to `[number, string]`.
 *
 * This combines well with {@link UnionToTuple}, which can be used to get a tuple of keys from the
 * any type union, in particular from the value types of a record (e.g. `MyRecord[keyof MyRecord]`).
 */
// biome-ignore format: readability
export type MapTuple<KeyTuple extends readonly (keyof Mapping)[], Mapping> =
    KeyTuple extends readonly [
          infer First extends keyof Mapping,
          ...infer Rest extends readonly (keyof Mapping)[],
      ]
          ? [Mapping[First], ...MapTuple<Rest, Mapping>]
          : []

/**
 * Given a tuple of key types, and a tuple of value types, produces an object type that maps
 * each key to the corresponding value. If the tuples have different size, the resulting type
 * will only have as many entries as the shortest tuple.
 *
 * e.g. `ObjectFromTuples<["a", "b"], [number, string, boolean]>` evaluates to `{ a: number, b: string }`.
 *
 * This combines well with {@link UnionToTuple}, which can be used to get a tuple of keys from the
 * any type union, in particular from the value types of a record (e.g. `MyRecord[keyof MyRecord]`).
 */
// biome-ignore format: readability
export type ObjectFromTuples<KeyTuple extends PropertyKey[], ValueTuple extends unknown[]> = Prettify<
    KeyTuple extends [
        infer FirstKey extends PropertyKey,
        ...infer RestKeys extends PropertyKey[]
    ]
        ? ValueTuple extends [
            infer FirstValue,
            ...infer RestValues,
        ]
            ? { [key in FirstKey]: FirstValue } & ObjectFromTuples<RestKeys, RestValues>
            : Record<never, never>
      : Record<never, never>
>

/**
 * Returns a version of `T` where all fields of type `Src` have been replaced by a field of type `Dst`, recursively.
 */
export type RecursiveReplace<T, Src, Dst> = Prettify<{
    [K in keyof T]: T[K] extends Src ? Dst : T[K] extends object ? RecursiveReplace<T[K], Src, Dst> : T[K]
}>

/**
 * Distributes the types in an union.
 *
 * e.g. `Distribute<{ a: 1, b: 2 } | { a: 3, b: 4 }>` evaluates to `{ a: 1 | 3, b: 2 | 4 }`
 */
export type Distribute<T> = {
    [K in Keys<T>]: T extends Record<K, infer U> ? U : never
}

/**
 * Returns a copy of an union of objects, where each object is augmented with the
 * optional undefined-typed keys from the other objects that it does not have itself.
 *
 * e.g. `UnionFill<{ a: string } | { b: string }>` evaluates to
 * `{ a: string, b?: undefined } | { a?: undefined, b: string }`
 */
// biome-ignore format: pretty
export type UnionFill<Union, Original = Union> = Prettify<
    [Union] extends [never]
        ? never
        : Select<Union> extends infer Member
            ? | ( & { [K in Exclude<Keys<Original>, keyof Member>]?: undefined }
                  & { [K in keyof Member]: Member[K] } )
              | UnionFill<Exclude<Union, Member>, Original>
            : never
>
