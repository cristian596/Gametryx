/** Estado que devuelven las Server Actions de cuenta a sus formularios. */
export type FormState = {
  /** Error general del formulario */
  error?: string;
  /** Errores por campo: { nombreDelCampo: mensaje } */
  fieldErrors?: Record<string, string>;
  /** Código de éxito que el formulario traduce a un mensaje */
  ok?: string;
};
