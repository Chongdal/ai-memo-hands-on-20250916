import { relations } from "drizzle-orm/relations";
import { usersInAuth, notes } from "./schema";

export const notesRelations = relations(notes, ({one}) => ({
	usersInAuth: one(usersInAuth, {
		fields: [notes.userId],
		references: [usersInAuth.id]
	}),
}));

export const usersInAuthRelations = relations(usersInAuth, ({many}) => ({
	notes: many(notes),
}));