CREATE TABLE public.users
(
    user_id serial NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    email text,
    phone_number text,
    password text,
    role text,
    PRIMARY KEY (user_id),
    CONSTRAINT role_check CHECK (role IN ('admin', 'customer', 'guest')) NOT VALID
);

ALTER TABLE IF EXISTS public.users
    OWNER to postgres;
    
CREATE TABLE products (
    product_id SERIAL PRIMARY KEY,
    product_name VARCHAR(100) NOT NULL,
    description TEXT,
    unit_price NUMERIC(10,2) NOT NULL,
    product_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('available','not available'))
);


CREATE TABLE public.sales
(
    sale_id integer NOT NULL DEFAULT nextval('sales_sale_id_seq'::regclass),
    user_id integer,
    sale_date timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    total_amount numeric,
    CONSTRAINT sales_pkey PRIMARY KEY (sale_id),
    CONSTRAINT fk_sales_users FOREIGN KEY (user_id)
        REFERENCES public.users (user_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE SET NULL
);

CREATE TABLE sale_items (
    sale_item_id SERIAL PRIMARY KEY,
    sale_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    price_at_sale DECIMAL(10, 2) NOT NULL CHECK (price_at_sale >= 0),
    FOREIGN KEY (sale_id) REFERENCES sales(sale_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);

CREATE TABLE inventory (
    inventory_id SERIAL PRIMARY KEY,
    product_id INT NOT NULL UNIQUE,
    quantity_in_stock INT NOT NULL DEFAULT 0 CHECK (quantity_in_stock >= 0),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);

