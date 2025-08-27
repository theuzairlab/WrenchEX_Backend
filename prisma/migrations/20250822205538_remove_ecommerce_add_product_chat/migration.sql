/*
  Warnings:

  - You are about to drop the column `stock_quantity` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `order_id` on the `reviews` table. All the data in the column will be lost.
  - You are about to drop the `cart` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `order_items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `orders` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('TEXT', 'IMAGE', 'PRICE_OFFER');

-- DropForeignKey
ALTER TABLE "cart" DROP CONSTRAINT "cart_buyer_id_fkey";

-- DropForeignKey
ALTER TABLE "cart" DROP CONSTRAINT "cart_product_id_fkey";

-- DropForeignKey
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_order_id_fkey";

-- DropForeignKey
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_product_id_fkey";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_buyer_id_fkey";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_seller_id_fkey";

-- DropForeignKey
ALTER TABLE "reviews" DROP CONSTRAINT "reviews_order_id_fkey";

-- AlterTable
ALTER TABLE "products" DROP COLUMN "stock_quantity";

-- AlterTable
ALTER TABLE "reviews" DROP COLUMN "order_id";

-- DropTable
DROP TABLE "cart";

-- DropTable
DROP TABLE "order_items";

-- DropTable
DROP TABLE "orders";

-- DropEnum
DROP TYPE "OrderStatus";

-- CreateTable
CREATE TABLE "appointment_status_history" (
    "id" TEXT NOT NULL,
    "appointment_id" TEXT NOT NULL,
    "status" "AppointmentStatus" NOT NULL,
    "notes" TEXT,
    "changed_by" TEXT NOT NULL,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "appointment_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointment_messages" (
    "id" TEXT NOT NULL,
    "appointment_id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "receiver_id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "appointment_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seller_availability" (
    "id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seller_availability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seller_time_off" (
    "id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seller_time_off_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_chats" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "buyer_id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_chats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_messages" (
    "id" TEXT NOT NULL,
    "chat_id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "message_type" "MessageType" NOT NULL DEFAULT 'TEXT',
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seller_chat_settings" (
    "id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "show_phone" BOOLEAN NOT NULL DEFAULT false,
    "auto_reply_text" TEXT,
    "is_online" BOOLEAN NOT NULL DEFAULT false,
    "last_seen" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seller_chat_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "seller_availability_seller_id_dayOfWeek_key" ON "seller_availability"("seller_id", "dayOfWeek");

-- CreateIndex
CREATE UNIQUE INDEX "product_chats_product_id_buyer_id_key" ON "product_chats"("product_id", "buyer_id");

-- CreateIndex
CREATE UNIQUE INDEX "seller_chat_settings_seller_id_key" ON "seller_chat_settings"("seller_id");

-- AddForeignKey
ALTER TABLE "appointment_status_history" ADD CONSTRAINT "appointment_status_history_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_status_history" ADD CONSTRAINT "appointment_status_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_messages" ADD CONSTRAINT "appointment_messages_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_messages" ADD CONSTRAINT "appointment_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_messages" ADD CONSTRAINT "appointment_messages_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seller_availability" ADD CONSTRAINT "seller_availability_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "sellers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seller_time_off" ADD CONSTRAINT "seller_time_off_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "sellers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_chats" ADD CONSTRAINT "product_chats_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_chats" ADD CONSTRAINT "product_chats_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_chats" ADD CONSTRAINT "product_chats_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_messages" ADD CONSTRAINT "product_messages_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "product_chats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_messages" ADD CONSTRAINT "product_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seller_chat_settings" ADD CONSTRAINT "seller_chat_settings_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "sellers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
