CREATE TABLE public.api_clients (
    id serial NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone,
    client_id character varying(50) NOT NULL,
    secret_key character varying(100),
    grant_type character varying(20) DEFAULT 'credentials'::character varying NOT NULL,
    is_active boolean DEFAULT false NOT NULL,
    jwt_age integer
);

CREATE TABLE public.r_config (
    code character varying(50) NOT NULL,
    type character varying(10),
    value text,
    description character varying(200)
);

CREATE TABLE public.users (
    id serial NOT NULL,
    username character varying(20) NOT NULL,
    fullname character varying(100),
    email character varying(50) NOT NULL,
    password character varying(100),
    phone character varying(50),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    is_active boolean DEFAULT false NOT NULL
);

CREATE TABLE public.watermonitoring (
    id bigserial NOT NULL,
    createtime bigint,
    id_stasiun character varying(100),
    temperature character varying(100),
    ph character varying(100),
    tds character varying(100),
    nh3n character varying(100),
    tss character varying(100),
    turbidity character varying(100),
    do_ character varying(100),
    no3 character varying(100),
    cod character varying(100),
    bod character varying(100),
    waterlevel character varying(100),
    is_success boolean DEFAULT false,
    sync_time timestamp without time zone,
    res_menlhk text,
    exec_count integer DEFAULT 0 NOT NULL
);