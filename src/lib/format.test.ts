import { describe, expect, it } from "vitest";
import { discountPercent, formatCOP, remainingForFreeShipping, formatPhone } from "./format";

describe("formatCOP", () => {
  it("agrupa miles con punto y usa espacio de no separación", () => {
    expect(formatCOP(1250000)).toBe("$ 1.250.000");
  });
  it("maneja valores pequeños, cero y enormes", () => {
    expect(formatCOP(0)).toBe("$ 0");
    expect(formatCOP(999)).toBe("$ 999");
    expect(formatCOP(123456789012)).toBe("$ 123.456.789.012");
  });
  it("redondea y conserva el signo", () => {
    expect(formatCOP(1999.6)).toBe("$ 2.000");
    expect(formatCOP(-18000)).toBe("-$ 18.000");
  });
});

describe("discountPercent", () => {
  it("calcula el porcentaje redondeado", () => {
    expect(discountPercent(3_400_000, 4_000_000)).toBe(15);
  });
  it("devuelve 0 sin descuento real", () => {
    expect(discountPercent(100, null)).toBe(0);
    expect(discountPercent(100, 100)).toBe(0);
    expect(discountPercent(100, 80)).toBe(0);
  });
});

describe("remainingForFreeShipping", () => {
  it("nunca es negativo", () => {
    expect(remainingForFreeShipping(320_000, 500_000)).toBe(180_000);
    expect(remainingForFreeShipping(800_000, 500_000)).toBe(0);
  });
});

describe("formatPhone", () => {
  it("agrupa 10 dígitos y deja igual lo demás", () => {
    expect(formatPhone("3001234567")).toBe("300 123 4567");
    expect(formatPhone("12345")).toBe("12345");
  });
});
