CREATE TABLE "line_group" (
    "id" SERIAL NOT NULL,
    "group_id" VARCHAR(100) NOT NULL,
    "group_name" VARCHAR(255),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    CONSTRAINT "line_group_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "line_group_group_id_key" ON "line_group"("group_id");
