// The shape every translation must have: the same keys as English, with
// string values. Plural "_one" forms are optional because Vietnamese only has
// one form.
export type Messages<T> = {
  -readonly [K in keyof T as K extends `${string}_one` ? never : K]: T[K] extends string
    ? string
    : Messages<T[K]>
} & {
  -readonly [K in keyof T as K extends `${string}_one` ? K : never]?: string
}
