import { z } from "zod";

// ─── Inventory / Gear ────────────────────────────────────────────────────────

export const categorySchema = z.enum([
  "fotografia-video",
  "montana-camping",
  "deportes-acuaticos",
]);

export type Category = z.infer<typeof categorySchema>;

export const CATEGORY_LABELS: Record<Category, string> = {
  "fotografia-video": "Fotografía y Video",
  "montana-camping": "Montaña y Camping",
  "deportes-acuaticos": "Deportes Acuáticos",
};

export const gearItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  category: categorySchema,
  description: z.string().min(1),
  dailyRate: z.number().positive(),
  imageURL: z.string().url().nullish(),
  specs: z.record(z.string(), z.string()),
  available: z.boolean(),
});

export type GearItem = z.infer<typeof gearItemSchema>;

// ─── Rental Request ──────────────────────────────────────────────────────────

const today = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

export const rentalRequestSchema = z.object({
  gearId: z.string().min(1, "Se requiere el ID del equipo"),
  startDate: z
    .string()
    .refine((v) => !isNaN(Date.parse(v)), { message: "Fecha de inicio inválida" })
    .refine((v) => new Date(v) >= today(), {
      message: "La fecha de inicio no puede ser en el pasado",
    }),
  endDate: z
    .string()
    .refine((v) => !isNaN(Date.parse(v)), { message: "Fecha de fin inválida" }),
  customerName: z.string().min(2, "Se requiere el nombre del cliente"),
  customerEmail: z.string().email("Correo electrónico inválido"),
});

export type RentalRequest = z.infer<typeof rentalRequestSchema>;

export const rentalRequestRefinedSchema = rentalRequestSchema.refine(
  (data) => new Date(data.endDate) > new Date(data.startDate),
  { message: "La fecha de fin debe ser posterior a la fecha de inicio", path: ["endDate"] }
);

// ─── Image generation ────────────────────────────────────────────────────────

export const generateImageRequestSchema = z.object({
  gearId: z.string().min(1),
  gearName: z.string().min(1),
});

export type GenerateImageRequest = z.infer<typeof generateImageRequestSchema>;
