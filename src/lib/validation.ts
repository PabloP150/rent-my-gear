import { z } from "zod";

export const CATEGORY_IDS = [
  "fotografia-video",
  "montana-camping",
  "deportes-acuaticos",
] as const;

export type CategoryId = (typeof CATEGORY_IDS)[number];

export const categorySchema = z.enum(CATEGORY_IDS);
export type Category = z.infer<typeof categorySchema>;

export const CATEGORIES: Record<CategoryId, { name: string; description: string }> = {
  "fotografia-video": {
    name: "Fotografía y Video",
    description: "Cámaras, lentes, iluminación y equipo audiovisual profesional",
  },
  "montana-camping": {
    name: "Montaña y Camping",
    description: "Tiendas, mochilas, equipo técnico de montaña y accesorios de camping",
  },
  "deportes-acuaticos": {
    name: "Deportes Acuáticos",
    description: "Kayaks, SUP, equipo de buceo, surf y deportes náuticos",
  },
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

const today = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

export const rentalRequestSchema = z
  .object({
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
  })
  .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
    message: "La fecha de fin debe ser posterior a la fecha de inicio",
    path: ["endDate"],
  });

export type RentalRequest = z.infer<typeof rentalRequestSchema>;

export const generateImageRequestSchema = z.object({
  gearId: z.string().min(1),
  gearName: z.string().min(1),
});

export type GenerateImageRequest = z.infer<typeof generateImageRequestSchema>;
