import type { KintoneFormFieldProperty } from "@kintone/rest-api-client";

/** フィールドプロパティの型エイリアス */
type FieldProperty = KintoneFormFieldProperty.OneOf;

export const getFieldProp = <K extends string>(f: FieldProperty, key: K) =>
  key in f ? (f as Record<string, unknown>)[key] : undefined;
