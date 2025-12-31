PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS "products_product" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "name" varchar(255) NOT NULL, "description" text NOT NULL, "is_sale" bool NOT NULL, "is_new" bool NOT NULL, "is_active" bool NOT NULL, "slug" varchar(255) NOT NULL UNIQUE, "image" varchar(100) NULL, "sale" integer unsigned NOT NULL CHECK ("sale" >= 0), "brand_id" bigint NOT NULL REFERENCES "products_brand" ("id") DEFERRABLE INITIALLY DEFERRED, "category_id" bigint NOT NULL REFERENCES "products_category" ("id") DEFERRABLE INITIALLY DEFERRED, "price" decimal NULL, "is_hit" bool NOT NULL);
INSERT INTO products_product VALUES(1,'Клюшка CCM JetSpeed FT 8 Pro','nice',0,1,1,'ccm-jetspeed-ft-8-pro','',0,1,1,30000,0);
INSERT INTO products_product VALUES(2,'Клюшка Bauer HyperLite2','nice',0,0,1,'bauer-bauer-hyperlite2','apps/products/productiproducts_image/ph.Gord-152.JPG',50,2,1,20000,1);
INSERT INTO products_product VALUES(3,'Тест','выавыа',1,1,1,'bauer','productiproducts_image/ph.Gord-79.JPG',0,2,2,222,0);
INSERT INTO products_product VALUES(4,'Клюшка','ыфвфывыфв',1,1,1,'bauer-2','productiproducts_image/мы3.jpg',0,2,1,123,0);
COMMIT;
