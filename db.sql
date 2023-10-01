--
-- PostgreSQL database dump
--

-- Dumped from database version 11.0
-- Dumped by pg_dump version 14.2

-- Started on 2023-10-01 21:09:55

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 3 (class 2615 OID 2200)
-- Name: public; Type: SCHEMA; Schema: -; Owner: robby parlan
--

CREATE SCHEMA public;


ALTER SCHEMA public OWNER TO "robby parlan";

--
-- TOC entry 2898 (class 0 OID 0)
-- Dependencies: 3
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: robby parlan
--

COMMENT ON SCHEMA public IS 'standard public schema';


SET default_tablespace = '';

--
-- TOC entry 206 (class 1259 OID 82128)
-- Name: cities; Type: TABLE; Schema: public; Owner: dbadmin
--

CREATE TABLE public.cities (
    id integer NOT NULL,
    city_name character varying(200),
    province_id integer NOT NULL
);


ALTER TABLE public.cities OWNER TO dbadmin;

--
-- TOC entry 205 (class 1259 OID 82126)
-- Name: cities_id_seq; Type: SEQUENCE; Schema: public; Owner: dbadmin
--

CREATE SEQUENCE public.cities_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.cities_id_seq OWNER TO dbadmin;

--
-- TOC entry 2899 (class 0 OID 0)
-- Dependencies: 205
-- Name: cities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: dbadmin
--

ALTER SEQUENCE public.cities_id_seq OWNED BY public.cities.id;


--
-- TOC entry 210 (class 1259 OID 82146)
-- Name: datas; Type: TABLE; Schema: public; Owner: dbadmin
--

CREATE TABLE public.datas (
    id bigint NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone,
    station_id character varying(200),
    station_name character varying(200),
    address character varying(500),
    province_id integer,
    province_name character varying(100),
    city_id integer,
    city_name character varying(200),
    uuid character varying(100),
    created_by integer
);


ALTER TABLE public.datas OWNER TO dbadmin;

--
-- TOC entry 209 (class 1259 OID 82144)
-- Name: datas_id_seq; Type: SEQUENCE; Schema: public; Owner: dbadmin
--

CREATE SEQUENCE public.datas_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.datas_id_seq OWNER TO dbadmin;

--
-- TOC entry 2900 (class 0 OID 0)
-- Dependencies: 209
-- Name: datas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: dbadmin
--

ALTER SEQUENCE public.datas_id_seq OWNED BY public.datas.id;


--
-- TOC entry 208 (class 1259 OID 82138)
-- Name: mqtt_datas; Type: TABLE; Schema: public; Owner: dbadmin
--

CREATE TABLE public.mqtt_datas (
    id bigint NOT NULL,
    uuid character varying(100),
    project character varying(100),
    "time" timestamp without time zone,
    temperature character varying(10),
    do_ character varying(10),
    tur character varying(10),
    ct character varying(10),
    ph character varying(10),
    orp character varying(10),
    bod character varying(10),
    cod character varying(10),
    tss character varying(10),
    n character varying(10),
    no3_3 character varying(10),
    no2 character varying(10),
    depth character varying(10),
    "lgnh4+" character varying(10),
    liquid character varying(10)
);


ALTER TABLE public.mqtt_datas OWNER TO dbadmin;

--
-- TOC entry 204 (class 1259 OID 82120)
-- Name: provinces; Type: TABLE; Schema: public; Owner: dbadmin
--

CREATE TABLE public.provinces (
    id integer NOT NULL,
    province_name character varying(200)
);


ALTER TABLE public.provinces OWNER TO dbadmin;

--
-- TOC entry 203 (class 1259 OID 82118)
-- Name: provinces_id_seq; Type: SEQUENCE; Schema: public; Owner: dbadmin
--

CREATE SEQUENCE public.provinces_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.provinces_id_seq OWNER TO dbadmin;

--
-- TOC entry 2901 (class 0 OID 0)
-- Dependencies: 203
-- Name: provinces_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: dbadmin
--

ALTER SEQUENCE public.provinces_id_seq OWNED BY public.provinces.id;


--
-- TOC entry 200 (class 1259 OID 73904)
-- Name: r_config; Type: TABLE; Schema: public; Owner: dbadmin
--

CREATE TABLE public.r_config (
    code character varying(50) NOT NULL,
    type character varying(10),
    value text,
    description character varying(200)
);


ALTER TABLE public.r_config OWNER TO dbadmin;

--
-- TOC entry 197 (class 1259 OID 41099)
-- Name: roles; Type: TABLE; Schema: public; Owner: dbadmin
--

CREATE TABLE public.roles (
    id character varying(10) NOT NULL,
    role_name character varying(20) NOT NULL,
    order_no integer
);


ALTER TABLE public.roles OWNER TO dbadmin;

--
-- TOC entry 196 (class 1259 OID 41097)
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: dbadmin
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.roles_id_seq OWNER TO dbadmin;

--
-- TOC entry 2902 (class 0 OID 0)
-- Dependencies: 196
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: dbadmin
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- TOC entry 199 (class 1259 OID 41121)
-- Name: users; Type: TABLE; Schema: public; Owner: dbadmin
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(20) NOT NULL,
    fullname character varying(100),
    email character varying(50) NOT NULL,
    password character varying(100),
    phone character varying(50),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    role_id character varying(10) NOT NULL,
    is_active boolean DEFAULT false NOT NULL,
    jwt_age integer DEFAULT 3600 NOT NULL
);


ALTER TABLE public.users OWNER TO dbadmin;

--
-- TOC entry 198 (class 1259 OID 41119)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: dbadmin
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO dbadmin;

--
-- TOC entry 2903 (class 0 OID 0)
-- Dependencies: 198
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: dbadmin
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 202 (class 1259 OID 73914)
-- Name: watermonitoring; Type: TABLE; Schema: public; Owner: dbadmin
--

CREATE TABLE public.watermonitoring (
    id integer NOT NULL,
    createtime bigint,
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
    exec_count integer DEFAULT 0 NOT NULL,
    id_stasiun character varying(100),
    uuid character varying(100),
    project character varying(100),
    "time" timestamp without time zone
);


ALTER TABLE public.watermonitoring OWNER TO dbadmin;

--
-- TOC entry 201 (class 1259 OID 73912)
-- Name: watermonitoring_id_seq; Type: SEQUENCE; Schema: public; Owner: dbadmin
--

CREATE SEQUENCE public.watermonitoring_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.watermonitoring_id_seq OWNER TO dbadmin;

--
-- TOC entry 2904 (class 0 OID 0)
-- Dependencies: 201
-- Name: watermonitoring_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: dbadmin
--

ALTER SEQUENCE public.watermonitoring_id_seq OWNED BY public.watermonitoring.id;


--
-- TOC entry 207 (class 1259 OID 82136)
-- Name: watermonitoringv2_id_seq; Type: SEQUENCE; Schema: public; Owner: dbadmin
--

CREATE SEQUENCE public.watermonitoringv2_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.watermonitoringv2_id_seq OWNER TO dbadmin;

--
-- TOC entry 2905 (class 0 OID 0)
-- Dependencies: 207
-- Name: watermonitoringv2_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: dbadmin
--

ALTER SEQUENCE public.watermonitoringv2_id_seq OWNED BY public.mqtt_datas.id;


--
-- TOC entry 2737 (class 2604 OID 82131)
-- Name: cities id; Type: DEFAULT; Schema: public; Owner: dbadmin
--

ALTER TABLE ONLY public.cities ALTER COLUMN id SET DEFAULT nextval('public.cities_id_seq'::regclass);


--
-- TOC entry 2739 (class 2604 OID 82149)
-- Name: datas id; Type: DEFAULT; Schema: public; Owner: dbadmin
--

ALTER TABLE ONLY public.datas ALTER COLUMN id SET DEFAULT nextval('public.datas_id_seq'::regclass);


--
-- TOC entry 2738 (class 2604 OID 82141)
-- Name: mqtt_datas id; Type: DEFAULT; Schema: public; Owner: dbadmin
--

ALTER TABLE ONLY public.mqtt_datas ALTER COLUMN id SET DEFAULT nextval('public.watermonitoringv2_id_seq'::regclass);


--
-- TOC entry 2736 (class 2604 OID 82123)
-- Name: provinces id; Type: DEFAULT; Schema: public; Owner: dbadmin
--

ALTER TABLE ONLY public.provinces ALTER COLUMN id SET DEFAULT nextval('public.provinces_id_seq'::regclass);


--
-- TOC entry 2728 (class 2604 OID 41124)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: dbadmin
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 2733 (class 2604 OID 73917)
-- Name: watermonitoring id; Type: DEFAULT; Schema: public; Owner: dbadmin
--

ALTER TABLE ONLY public.watermonitoring ALTER COLUMN id SET DEFAULT nextval('public.watermonitoring_id_seq'::regclass);


--
-- TOC entry 2888 (class 0 OID 82128)
-- Dependencies: 206
-- Data for Name: cities; Type: TABLE DATA; Schema: public; Owner: dbadmin
--

COPY public.cities (id, city_name, province_id) FROM stdin;
1	KOTA JAKARTA PUSAT	1
2	KOTA JAKARTA UTARA	1
3	KOTA JAKARTA SELATAN	1
4	KOTA JAKARTA TIMUR	1
5	KOTA JAKARTA BARAT	1
6	KOTA BANDUNG	2
7	KAB. BANDUNG	2
\.


--
-- TOC entry 2892 (class 0 OID 82146)
-- Dependencies: 210
-- Data for Name: datas; Type: TABLE DATA; Schema: public; Owner: dbadmin
--

COPY public.datas (id, created_at, updated_at, station_id, station_name, address, province_id, province_name, city_id, city_name, uuid, created_by) FROM stdin;
2	2023-09-14 12:56:55.326673	\N	FASTPEC-FPA-101	Cahaya Mas Cemerlang 2	Jl. rayamangun blok K no 23	1	DKI JAKARTA	4	KOTA JAKARTA TIMUR	f07472d5-aac5-423c-b968-9c4a45d0acd6	1
3	2023-09-14 12:57:06.971154	\N	FASTPEC-FPA-103	Cahaya Mas Cemerlang 3	Jl. rayamangun blok K no 23	1	DKI JAKARTA	4	KOTA JAKARTA TIMUR	d25704ec-bf0c-4249-83b4-d41ebe669155	1
4	2023-09-14 13:08:37.571884	\N	FASTPEC-FPA-104	Cahaya Mas Cemerlang 4	Jl. rayamangun blok K no 23	1	DKI JAKARTA	4	KOTA JAKARTA TIMUR	57275cfd-8af3-4d9e-9598-553943bc53c2	1
\.


--
-- TOC entry 2890 (class 0 OID 82138)
-- Dependencies: 208
-- Data for Name: mqtt_datas; Type: TABLE DATA; Schema: public; Owner: dbadmin
--

COPY public.mqtt_datas (id, uuid, project, "time", temperature, do_, tur, ct, ph, orp, bod, cod, tss, n, no3_3, no2, depth, "lgnh4+", liquid) FROM stdin;
2	NbtCYvjU6DIWpaMLbfd	fastpec	2023-08-29 14:15:54	30	8	1	1	1	1	1	1	1	1	1	1	1	\N	\N
3	NbtCYvjU6DIWpaMLbfd	fastpec	2023-08-29 14:15:54	30	8	1	1	1	1	1	1	1	1	1	1	1	\N	\N
\.


--
-- TOC entry 2886 (class 0 OID 82120)
-- Dependencies: 204
-- Data for Name: provinces; Type: TABLE DATA; Schema: public; Owner: dbadmin
--

COPY public.provinces (id, province_name) FROM stdin;
1	DKI JAKARTA
2	JAWA BARAT
\.


--
-- TOC entry 2882 (class 0 OID 73904)
-- Dependencies: 200
-- Data for Name: r_config; Type: TABLE DATA; Schema: public; Owner: dbadmin
--

COPY public.r_config (code, type, value, description) FROM stdin;
\.


--
-- TOC entry 2879 (class 0 OID 41099)
-- Dependencies: 197
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: dbadmin
--

COPY public.roles (id, role_name, order_no) FROM stdin;
adm	Admin	1
usr	User	2
\.


--
-- TOC entry 2881 (class 0 OID 41121)
-- Dependencies: 199
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: dbadmin
--

COPY public.users (id, username, fullname, email, password, phone, created_at, updated_at, role_id, is_active, jwt_age) FROM stdin;
3	test	testing	test@gmail.com	$2b$06$i4ZCnl23QPjQjZx6gngbg..UWjm8EZH0CB4sFssZGf4XEapsam9K.	082182818	2022-04-22 11:34:17.003975+07	2022-04-22 11:34:17.003975+07	adm	t	3600
1	admin	Admin	admin@gmail.com	$2b$06$i4ZCnl23QPjQjZx6gngbg..UWjm8EZH0CB4sFssZGf4XEapsam9K.	0821812	2022-04-22 08:33:40.323941+07	2022-04-22 08:33:40.323941+07	adm	t	3600
2	user	User	user@gmail.com	$2b$06$i4ZCnl23QPjQjZx6gngbg..UWjm8EZH0CB4sFssZGf4XEapsam9K.	02819219	2022-04-22 08:34:05.77018+07	2022-04-22 08:34:05.77018+07	usr	t	3600
\.


--
-- TOC entry 2884 (class 0 OID 73914)
-- Dependencies: 202
-- Data for Name: watermonitoring; Type: TABLE DATA; Schema: public; Owner: dbadmin
--

COPY public.watermonitoring (id, createtime, temperature, ph, tds, nh3n, tss, turbidity, do_, no3, cod, bod, waterlevel, is_success, sync_time, res_menlhk, exec_count, id_stasiun, uuid, project, "time") FROM stdin;
\.


--
-- TOC entry 2906 (class 0 OID 0)
-- Dependencies: 205
-- Name: cities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: dbadmin
--

SELECT pg_catalog.setval('public.cities_id_seq', 7, true);


--
-- TOC entry 2907 (class 0 OID 0)
-- Dependencies: 209
-- Name: datas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: dbadmin
--

SELECT pg_catalog.setval('public.datas_id_seq', 4, true);


--
-- TOC entry 2908 (class 0 OID 0)
-- Dependencies: 203
-- Name: provinces_id_seq; Type: SEQUENCE SET; Schema: public; Owner: dbadmin
--

SELECT pg_catalog.setval('public.provinces_id_seq', 2, true);


--
-- TOC entry 2909 (class 0 OID 0)
-- Dependencies: 196
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: dbadmin
--

SELECT pg_catalog.setval('public.roles_id_seq', 1, false);


--
-- TOC entry 2910 (class 0 OID 0)
-- Dependencies: 198
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: dbadmin
--

SELECT pg_catalog.setval('public.users_id_seq', 3, true);


--
-- TOC entry 2911 (class 0 OID 0)
-- Dependencies: 201
-- Name: watermonitoring_id_seq; Type: SEQUENCE SET; Schema: public; Owner: dbadmin
--

SELECT pg_catalog.setval('public.watermonitoring_id_seq', 8, true);


--
-- TOC entry 2912 (class 0 OID 0)
-- Dependencies: 207
-- Name: watermonitoringv2_id_seq; Type: SEQUENCE SET; Schema: public; Owner: dbadmin
--

SELECT pg_catalog.setval('public.watermonitoringv2_id_seq', 3, true);


--
-- TOC entry 2752 (class 2606 OID 82133)
-- Name: cities cities_pk; Type: CONSTRAINT; Schema: public; Owner: dbadmin
--

ALTER TABLE ONLY public.cities
    ADD CONSTRAINT cities_pk PRIMARY KEY (id);


--
-- TOC entry 2756 (class 2606 OID 82155)
-- Name: datas datas_pk; Type: CONSTRAINT; Schema: public; Owner: dbadmin
--

ALTER TABLE ONLY public.datas
    ADD CONSTRAINT datas_pk PRIMARY KEY (id);


--
-- TOC entry 2746 (class 2606 OID 73911)
-- Name: r_config pk_r_config; Type: CONSTRAINT; Schema: public; Owner: dbadmin
--

ALTER TABLE ONLY public.r_config
    ADD CONSTRAINT pk_r_config PRIMARY KEY (code);


--
-- TOC entry 2750 (class 2606 OID 82125)
-- Name: provinces provinces_pk; Type: CONSTRAINT; Schema: public; Owner: dbadmin
--

ALTER TABLE ONLY public.provinces
    ADD CONSTRAINT provinces_pk PRIMARY KEY (id);


--
-- TOC entry 2742 (class 2606 OID 41131)
-- Name: roles roles_pk; Type: CONSTRAINT; Schema: public; Owner: dbadmin
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pk PRIMARY KEY (id);


--
-- TOC entry 2744 (class 2606 OID 41129)
-- Name: users users_pk; Type: CONSTRAINT; Schema: public; Owner: dbadmin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pk PRIMARY KEY (id);


--
-- TOC entry 2748 (class 2606 OID 73923)
-- Name: watermonitoring watermonitoring_pk; Type: CONSTRAINT; Schema: public; Owner: dbadmin
--

ALTER TABLE ONLY public.watermonitoring
    ADD CONSTRAINT watermonitoring_pk PRIMARY KEY (id);


--
-- TOC entry 2754 (class 2606 OID 82143)
-- Name: mqtt_datas watermonitoringv2_pk; Type: CONSTRAINT; Schema: public; Owner: dbadmin
--

ALTER TABLE ONLY public.mqtt_datas
    ADD CONSTRAINT watermonitoringv2_pk PRIMARY KEY (id);


-- Completed on 2023-10-01 21:09:55

--
-- PostgreSQL database dump complete
--

