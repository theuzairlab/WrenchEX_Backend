-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'SELLER', 'BUYER');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('COD', 'DIGITAL_PAYMENT');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'BUYER',
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "phone" TEXT,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "google_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sellers" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "shop_name" TEXT NOT NULL,
    "shop_description" TEXT,
    "shop_address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "is_approved" BOOLEAN NOT NULL DEFAULT false,
    "subscription_plan" TEXT,
    "subscription_expires_at" TIMESTAMP(3),
    "total_earnings" TEXT,
    "rating_average" DOUBLE PRECISION DEFAULT 0,
    "rating_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sellers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "parent_id" TEXT,
    "image_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "specifications" JSONB,
    "price" DOUBLE PRECISION NOT NULL,
    "stock_quantity" INTEGER NOT NULL,
    "images" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_flagged" BOOLEAN NOT NULL DEFAULT false,
    "rating_average" DOUBLE PRECISION DEFAULT 0,
    "rating_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "duration_minutes" INTEGER NOT NULL,
    "is_mobile_service" BOOLEAN NOT NULL DEFAULT false,
    "images" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "rating_average" DOUBLE PRECISION DEFAULT 0,
    "rating_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "buyer_id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "order_number" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "total_amount" DOUBLE PRECISION NOT NULL,
    "delivery_address" JSONB NOT NULL,
    "payment_method" "PaymentMethod" NOT NULL DEFAULT 'COD',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DOUBLE PRECISION NOT NULL,
    "total_price" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" TEXT NOT NULL,
    "buyer_id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "service_id" TEXT NOT NULL,
    "appointment_number" TEXT NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'PENDING',
    "scheduled_date" TIMESTAMP(3) NOT NULL,
    "scheduled_time_start" TIMESTAMP(3) NOT NULL,
    "scheduled_time_end" TIMESTAMP(3) NOT NULL,
    "total_amount" DOUBLE PRECISION NOT NULL,
    "service_location" JSONB,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "reviewer_id" TEXT NOT NULL,
    "reviewee_id" TEXT NOT NULL,
    "order_id" TEXT,
    "appointment_id" TEXT,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cart" (
    "id" TEXT NOT NULL,
    "buyer_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cart_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");

-- CreateIndex
CREATE UNIQUE INDEX "sellers_user_id_key" ON "sellers"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "orders_order_number_key" ON "orders"("order_number");

-- CreateIndex
CREATE UNIQUE INDEX "appointments_appointment_number_key" ON "appointments"("appointment_number");

-- CreateIndex
CREATE UNIQUE INDEX "cart_buyer_id_product_id_key" ON "cart"("buyer_id", "product_id");

-- AddForeignKey
ALTER TABLE "sellers" ADD CONSTRAINT "sellers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "sellers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "sellers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "sellers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "sellers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewee_id_fkey" FOREIGN KEY ("reviewee_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart" ADD CONSTRAINT "cart_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart" ADD CONSTRAINT "cart_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
