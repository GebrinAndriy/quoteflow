import type { PricingKind } from "@/domain/pricing/types";
import type { FieldErrors } from "./lead-request-schema";
import { Field } from "./field";
import type { QuoteFields } from "./preview-quote";

type ServiceFieldsProps = {
  kind: PricingKind;
  fields: QuoteFields;
  errors: FieldErrors;
  onChange: (name: keyof QuoteFields, value: string) => void;
};

export function ServiceFields({ kind, fields, errors, onChange }: ServiceFieldsProps) {
  const numberField = (name: keyof QuoteFields, label: string, wholeNumber = false) => (
    <Field
      key={name}
      label={label}
      name={name}
      type="number"
      inputMode={wholeNumber ? "numeric" : "decimal"}
      min={wholeNumber ? "1" : "0"}
      step={wholeNumber ? "1" : "any"}
      required
      value={fields[name]}
      error={errors[name]}
      onChange={(e) => onChange(name, e.target.value)}
    />
  );

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {kind === "per_area" && [
        numberField("widthCm", "Width, cm"),
        numberField("heightCm", "Height, cm"),
        numberField("quantity", "Quantity", true),
      ]}
      {kind === "per_hour" && numberField("hours", "Hours")}
      {kind === "fixed" && numberField("quantity", "Quantity", true)}
    </div>
  );
}
