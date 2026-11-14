import { describe, expect, it } from "vitest";
import { safeNext } from "@/lib/auth/safe-next";
import { addressSchema, changePasswordSchema, passwordSchema, signUpSchema } from "./account";

describe("safeNext", () => {
  it("acepta rutas internas", () => {
    expect(safeNext("/cuenta/favoritos", "/cuenta")).toBe("/cuenta/favoritos");
    expect(safeNext("/producto/x?y=1", "/cuenta")).toBe("/producto/x?y=1");
  });
  it("rechaza redirecciones abiertas", () => {
    for (const bad of ["//evil.com", "/\\evil.com", "https://evil.com", "evil.com", "", undefined, 42]) {
      expect(safeNext(bad, "/cuenta")).toBe("/cuenta");
    }
  });
  it("respeta el prefijo", () => {
    expect(safeNext("/cuenta", "/admin/productos", "/admin")).toBe("/admin/productos");
    expect(safeNext("/admin/marcas", "/admin/productos", "/admin")).toBe("/admin/marcas");
  });
});

describe("contraseñas", () => {
  it("exige 8+ caracteres con letras y números", () => {
    expect(passwordSchema.safeParse("abc12345").success).toBe(true);
    expect(passwordSchema.safeParse("abc123").success).toBe(false);
    expect(passwordSchema.safeParse("abcdefghij").success).toBe(false);
    expect(passwordSchema.safeParse("1234567890").success).toBe(false);
    expect(passwordSchema.safeParse("a1".repeat(37)).success).toBe(false); // > 72
  });
  it("la nueva debe coincidir y ser distinta a la actual", () => {
    const base = { actual: "vieja1234", password: "nueva1234", confirmar: "nueva1234" };
    expect(changePasswordSchema.safeParse(base).success).toBe(true);
    expect(changePasswordSchema.safeParse({ ...base, confirmar: "otra1234" }).success).toBe(false);
    expect(changePasswordSchema.safeParse({ ...base, password: "vieja1234", confirmar: "vieja1234" }).success).toBe(false);
  });
});

describe("registro", () => {
  const ok = { nombre: "Ana", email: " Ana@Correo.com ", telefono: "", password: "clave1234", autorizacion: "on" };
  it("normaliza el correo y deja el celular opcional", () => {
    const r = signUpSchema.safeParse(ok);
    expect(r.success && r.data.email).toBe("ana@correo.com");
  });
  it("exige la autorización de datos", () => {
    expect(signUpSchema.safeParse({ ...ok, autorizacion: undefined }).success).toBe(false);
  });
});

describe("direcciones", () => {
  const ok = {
    alias: "Casa",
    destinatario: "Ana Pérez",
    telefono: "+57 300 123 4567",
    departamento: "Antioquia",
    ciudad: "Medellín",
    direccion: "Calle 10 # 20-30",
  };
  it("acepta una dirección válida y normaliza el celular", () => {
    const r = addressSchema.safeParse(ok);
    expect(r.success && r.data.telefono).toBe("3001234567");
  });
  it("rechaza departamentos que no existen", () => {
    expect(addressSchema.safeParse({ ...ok, departamento: "Narnia" }).success).toBe(false);
  });
});
