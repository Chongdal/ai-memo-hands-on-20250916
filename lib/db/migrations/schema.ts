import { pgTable, foreignKey, pgPolicy, uuid, varchar, text, timestamp } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const usersInAuth = pgTable("users_in_auth", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	email: varchar({ length: 255 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const notes = pgTable("notes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	title: varchar({ length: 200 }).notNull(),
	content: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [usersInAuth.id],
			name: "notes_user_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("Users can only access their own notes", { as: "permissive", for: "all", to: ["public"], using: sql`(auth.uid() = user_id)` }),
]);
