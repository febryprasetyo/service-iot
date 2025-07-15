--
-- PostgreSQL database dump
--

-- Dumped from database version 11.0
-- Dumped by pg_dump version 14.2

-- Started on 2023-11-02 15:36:52

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
-- TOC entry 2914 (class 0 OID 0)
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
-- TOC entry 2915 (class 0 OID 0)
-- Dependencies: 205
-- Name: cities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: dbadmin
--

ALTER SEQUENCE public.cities_id_seq OWNED BY public.cities.id;


--
-- TOC entry 210 (class 1259 OID 82198)
-- Name: devices; Type: TABLE; Schema: public; Owner: dbadmin
--

CREATE TABLE public.devices (
    id integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone,
    id_mesin character varying(200),
    nama_dinas character varying(300),
    nama_stasiun character varying(300),
    created_by integer
);


ALTER TABLE public.devices OWNER TO dbadmin;

--
-- TOC entry 209 (class 1259 OID 82196)
-- Name: devices_id_seq; Type: SEQUENCE; Schema: public; Owner: dbadmin
--

CREATE SEQUENCE public.devices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.devices_id_seq OWNER TO dbadmin;

--
-- TOC entry 2916 (class 0 OID 0)
-- Dependencies: 209
-- Name: devices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: dbadmin
--

ALTER SEQUENCE public.devices_id_seq OWNED BY public.devices.id;


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
-- TOC entry 2917 (class 0 OID 0)
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
-- TOC entry 2918 (class 0 OID 0)
-- Dependencies: 196
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: dbadmin
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- TOC entry 212 (class 1259 OID 82213)
-- Name: stations; Type: TABLE; Schema: public; Owner: dbadmin
--

CREATE TABLE public.stations (
    id bigint NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone,
    device_id integer,
    nama_stasiun character varying(300),
    address character varying(500),
    province_id integer,
    province_name character varying(100),
    city_id integer,
    city_name character varying(200),
    nama_dinas character varying(300),
    id_mesin character varying(200),
    created_by integer
);


ALTER TABLE public.stations OWNER TO dbadmin;

--
-- TOC entry 211 (class 1259 OID 82211)
-- Name: stations_id_seq; Type: SEQUENCE; Schema: public; Owner: dbadmin
--

CREATE SEQUENCE public.stations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.stations_id_seq OWNER TO dbadmin;

--
-- TOC entry 2919 (class 0 OID 0)
-- Dependencies: 211
-- Name: stations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: dbadmin
--

ALTER SEQUENCE public.stations_id_seq OWNED BY public.stations.id;


--
-- TOC entry 199 (class 1259 OID 41121)
-- Name: users; Type: TABLE; Schema: public; Owner: dbadmin
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(20) NOT NULL,
    fullname character varying(100),
    email character varying(50),
    password character varying(100),
    phone character varying(50),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    role_id character varying(10) NOT NULL,
    is_active boolean DEFAULT false NOT NULL,
    jwt_age integer DEFAULT 3600 NOT NULL,
    device_id integer,
    api_key character varying(300),
    secret_key character varying(300),
    created_by integer
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
-- TOC entry 2920 (class 0 OID 0)
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
-- TOC entry 2921 (class 0 OID 0)
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
-- TOC entry 2922 (class 0 OID 0)
-- Dependencies: 207
-- Name: watermonitoringv2_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: dbadmin
--

ALTER SEQUENCE public.watermonitoringv2_id_seq OWNED BY public.mqtt_datas.id;


--
-- TOC entry 2745 (class 2604 OID 82131)
-- Name: cities id; Type: DEFAULT; Schema: public; Owner: dbadmin
--

ALTER TABLE ONLY public.cities ALTER COLUMN id SET DEFAULT nextval('public.cities_id_seq'::regclass);


--
-- TOC entry 2747 (class 2604 OID 82201)
-- Name: devices id; Type: DEFAULT; Schema: public; Owner: dbadmin
--

ALTER TABLE ONLY public.devices ALTER COLUMN id SET DEFAULT nextval('public.devices_id_seq'::regclass);


--
-- TOC entry 2746 (class 2604 OID 82141)
-- Name: mqtt_datas id; Type: DEFAULT; Schema: public; Owner: dbadmin
--

ALTER TABLE ONLY public.mqtt_datas ALTER COLUMN id SET DEFAULT nextval('public.watermonitoringv2_id_seq'::regclass);


--
-- TOC entry 2744 (class 2604 OID 82123)
-- Name: provinces id; Type: DEFAULT; Schema: public; Owner: dbadmin
--

ALTER TABLE ONLY public.provinces ALTER COLUMN id SET DEFAULT nextval('public.provinces_id_seq'::regclass);


--
-- TOC entry 2749 (class 2604 OID 82216)
-- Name: stations id; Type: DEFAULT; Schema: public; Owner: dbadmin
--

ALTER TABLE ONLY public.stations ALTER COLUMN id SET DEFAULT nextval('public.stations_id_seq'::regclass);


--
-- TOC entry 2736 (class 2604 OID 41124)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: dbadmin
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 2741 (class 2604 OID 73917)
-- Name: watermonitoring id; Type: DEFAULT; Schema: public; Owner: dbadmin
--

ALTER TABLE ONLY public.watermonitoring ALTER COLUMN id SET DEFAULT nextval('public.watermonitoring_id_seq'::regclass);


--
-- TOC entry 2902 (class 0 OID 82128)
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
-- TOC entry 2906 (class 0 OID 82198)
-- Dependencies: 210
-- Data for Name: devices; Type: TABLE DATA; Schema: public; Owner: dbadmin
--

COPY public.devices (id, created_at, updated_at, id_mesin, nama_dinas, nama_stasiun, created_by) FROM stdin;
1	2023-11-01 18:35:02.320193	2023-11-01 18:37:53.786	240305005225029	PT. Cahaya Mas Cemerlang Ok	PT. Cahaya Mas Cemerlang	1
\.


--
-- TOC entry 2904 (class 0 OID 82138)
-- Dependencies: 208
-- Data for Name: mqtt_datas; Type: TABLE DATA; Schema: public; Owner: dbadmin
--

COPY public.mqtt_datas (id, uuid, project, "time", temperature, do_, tur, ct, ph, orp, bod, cod, tss, n, no3_3, no2, depth, "lgnh4+", liquid) FROM stdin;
2	NbtCYvjU6DIWpaMLbfd	fastpec	2023-08-29 14:15:54	30	8	1	1	1	1	1	1	1	1	1	1	1	\N	\N
3	NbtCYvjU6DIWpaMLbfd	fastpec	2023-08-29 14:15:54	30	8	1	1	1	1	1	1	1	1	1	1	1	\N	\N
4	240305005225029	\N	2023-10-30 17:54:44	\N	6.639431	1.39006	0	7.299043	68.377052	7.588572	27.164793	715.925903	0.02823912	6	14	2.231081	0	0
5	240305005225029	\N	2023-10-30 17:54:54	\N	6.639431	1.39006	0	7.299043	68.377052	7.588572	27.164793	715.925903	0.02823912	6	14	2.231081	0	0
6	240305005225029	\N	2023-10-30 17:55:04	\N	6.639431	1.39006	0	7.299043	68.377052	7.588572	27.164793	715.925903	0.02823912	6	14	2.231081	0	0
7	240305005225029	\N	2023-10-30 17:55:14	\N	6.639431	1.39006	0	7.299043	68.377052	7.588572	27.164793	715.925903	0.02823912	6	14	2.231081	0	0
8	240305005225029	\N	2023-10-30 17:55:24	\N	6.639431	1.39006	0	7.299043	68.377052	7.588572	27.164793	715.925903	0.02823912	6	14	2.231081	0	0
9	240305005225029	\N	2023-10-30 17:55:34	\N	6.639431	1.39006	0	7.299043	68.377052	7.588572	27.164793	715.925903	0.02823912	6	14	2.231081	0	0
10	240305005225029	\N	2023-10-30 17:55:44	\N	6.639431	1.39006	0	7.299043	68.377052	7.588572	27.164793	715.925903	0.02823912	6	14	2.231081	0	0
11	240305005225029	\N	2023-10-30 17:56:04	\N	6.639431	1.39006	0	7.299043	68.377052	7.588572	27.164793	715.925903	0.02823912	6	14	2.231081	0	0
12	240305005225029	\N	2023-10-30 17:56:14	\N	6.639431	1.39006	0	7.299043	68.377052	7.588572	27.164793	715.925903	0.02823912	6	14	2.231081	0	0
13	240305005225029	\N	2023-10-30 17:56:24	\N	6.639431	1.39006	0	7.299043	68.377052	7.588572	27.164793	715.925903	0.02823912	6	14	2.231081	0	0
14	240305005225029	\N	2023-10-30 17:56:34	\N	6.639431	1.39006	0	7.299043	68.377052	7.588572	27.164793	715.925903	0.02823912	6	14	2.231081	0	0
15	240305005225029	\N	2023-10-30 17:56:44	\N	6.639431	1.39006	0	7.299043	68.377052	7.588572	27.164793	715.925903	0.02823912	6	14	2.231081	0	0
16	240305005225029	\N	2023-10-30 17:56:54	\N	6.639431	1.39006	0	7.299043	68.377052	7.588572	27.164793	715.925903	0.02823912	6	14	2.231081	0	0
17	240305005225029	\N	2023-10-30 17:57:04	\N	6.639431	1.39006	0	7.299043	68.377052	7.588572	27.164793	715.925903	0.02823912	6	14	2.231081	0	0
18	240305005225029	\N	2023-10-30 17:57:14	\N	6.639431	1.39006	0	7.299043	68.377052	7.588572	27.164793	715.925903	0.02823912	6	14	2.231081	0	0
19	240305005225029	\N	2023-10-30 17:57:24	\N	6.639431	1.39006	0	7.299043	68.377052	7.588572	27.164793	715.925903	0.02823912	6	14	2.231081	0	0
20	240305005225029	\N	2023-10-30 17:57:34	\N	6.639431	1.39006	0	7.299043	68.377052	7.588572	27.164793	715.925903	0.02823912	6	14	2.231081	0	0
21	240305005225029	\N	2023-10-30 17:57:44	\N	6.639431	1.39006	0	7.299043	68.377052	7.588572	27.164793	715.925903	0.02823912	6	14	2.231081	0	0
22	240305005225029	\N	2023-10-30 17:57:54	\N	6.639431	1.39006	0	7.299043	68.377052	7.588572	27.164793	715.925903	0.02823912	6	14	2.231081	0	0
23	240305005225029	\N	2023-10-30 17:58:04	\N	6.639431	1.39006	0	7.299043	68.377052	7.588572	27.164793	715.925903	0.02823912	6	14	2.231081	0	0
24	240305005225029	\N	2023-10-30 17:58:14	\N	6.639431	1.39006	0	7.299043	68.377052	7.588572	27.164793	715.925903	0.02823912	6	14	2.231081	0	0
25	240305005225029	\N	2023-10-30 17:58:24	\N	6.639431	1.39006	0	7.299043	68.377052	7.588572	27.164793	715.925903	0.02823912	6	14	2.231081	0	0
26	240305005225029	\N	2023-10-30 17:58:34	\N	6.639431	1.39006	0	7.299043	68.377052	7.588572	27.164793	715.925903	0.02823912	6	14	2.231081	0	0
27	240305005225029	\N	2023-10-30 17:58:44	\N	6.639431	1.39006	0	7.299043	68.377052	7.588572	27.164793	715.925903	0.02823912	6	14	2.231081	0	0
28	240305005225029	\N	2023-10-30 17:58:54	\N	6.639431	1.39006	0	7.299043	68.377052	7.588572	27.164793	715.925903	0.02823912	6	14	2.231081	0	0
29	240305005225029	\N	2023-10-30 17:59:04	\N	6.639431	1.39006	0	7.299043	68.377052	7.588572	27.164793	715.925903	0.02823912	6	14	2.231081	0	0
30	240305005225029	\N	2023-10-30 17:59:14	\N	6.639431	1.39006	0	7.299043	68.377052	7.588572	27.164793	715.925903	0.02823912	6	14	2.231081	0	0
31	240305005225029	\N	2023-10-30 17:59:24	\N	6.639431	1.39006	0	7.299043	68.377052	7.588572	27.164793	715.925903	0.02823912	6	14	2.231081	0	0
32	240305005225029	\N	2023-10-30 17:59:34	\N	6.639431	1.39006	0	7.299043	68.377052	7.588572	27.164793	715.925903	0.02823912	6	14	2.231081	0	0
33	240305005225029	\N	2023-10-30 17:59:44	\N	6.639431	1.39006	0	7.299043	68.377052	7.588572	27.164793	715.925903	0.02823912	6	14	2.231081	0	0
34	240305005225029	\N	2023-10-30 17:59:54	\N	6.639431	1.39006	0	7.299043	68.377052	7.588572	27.164793	715.925903	0.02823912	6	14	2.231081	0	0
35	240305005225029	\N	2023-10-30 18:00:04	\N	6.639431	1.39006	0	7.299043	68.377052	7.588572	27.164793	715.925903	0.02823912	6	14	2.231081	0	0
36	240305005225029	\N	2023-10-30 18:00:14	\N	6.639431	1.39006	0	7.299043	68.377052	7.588572	27.164793	715.925903	0.02823912	6	14	2.231081	0	0
37	240305005225029	\N	2023-10-30 18:00:24	\N	6.639431	1.39006	0	7.299043	68.377052	7.588572	27.164793	715.925903	0.02823912	6	14	2.231081	0	0
38	240305005225029	\N	2023-10-30 18:00:34	\N	6.639431	1.39006	0	7.299043	68.377052	7.588572	27.164793	715.925903	0.02823912	6	14	2.231081	0	0
39	240305005225029	\N	2023-10-30 18:00:44	\N	6.639431	1.39006	0	7.299043	68.377052	7.588572	27.164793	715.925903	0.02823912	6	14	2.231081	0	0
40	240305005225029	\N	2023-10-30 18:00:54	\N	6.639431	1.39006	0	7.299043	68.377052	7.588572	27.164793	715.925903	0.02823912	6	14	2.231081	0	0
41	240305005225029	\N	2023-10-30 18:01:04	\N	6.639431	1.39006	0	7.299043	68.377052	7.588572	27.164793	715.925903	0.02823912	6	14	2.231081	0	0
42	240305005225029	\N	2023-10-30 18:01:14	\N	6.639431	1.39006	0	7.299043	68.377052	7.588572	27.164793	715.925903	0.02823912	6	14	2.231081	0	0
43	240305005225029	\N	2023-10-30 18:01:24	\N	6.639431	1.39006	0	7.299043	68.377052	7.588572	27.164793	715.925903	0.02823912	6	14	2.231081	0	0
44	240305005225029	\N	2023-10-30 18:01:34	\N	6.639431	1.39006	0	7.299043	68.377052	7.588572	27.164793	715.925903	0.02823912	6	14	2.231081	0	0
45	240305005225029	\N	2023-10-30 18:01:44	\N	6.639431	1.39006	0	7.299043	68.377052	7.588572	27.164793	715.925903	0.02823912	6	14	2.231081	0	0
46	240305005225029	\N	2023-10-30 18:01:54	\N	6.639431	1.39006	0	7.299043	68.377052	7.588572	27.164793	715.925903	0.02823912	6	14	2.231081	0	0
47	240305005225029	\N	2023-10-30 18:02:04	\N	6.639431	1.39006	0	7.299043	68.377052	7.588572	27.164793	715.925903	0.02823912	6	14	2.231081	0	0
48	240305005225029	\N	2023-10-30 18:02:14	\N	6.639431	1.39006	0	7.299043	68.377052	7.588572	27.164793	715.925903	0.02823912	6	14	2.231081	0	0
49	240305005225029	\N	2023-10-30 18:02:24	\N	6.639431	1.39006	0	7.299043	68.377052	7.588572	27.164793	715.925903	0.02823912	6	14	2.231081	0	0
50	240305005225029	\N	2023-10-30 18:02:35	\N	6.639431	1.39006	0	7.299043	68.377052	7.588572	27.164793	715.925903	0.02823912	6	14	2.231081	0	0
51	240305005225029	\N	2023-10-30 18:02:45	\N	6.639431	1.39006	0	7.299043	68.377052	7.588572	27.164793	715.925903	0.02823912	6	14	2.231081	0	0
52	240305005225029	\N	2023-10-30 18:02:55	\N	6.639431	1.39006	0	7.299043	68.377052	7.588572	27.164793	715.925903	0.02823912	6	14	2.231081	0	0
53	240305005225029	\N	2023-10-30 18:03:04	\N	6.639431	1.39006	0	7.299043	68.377052	7.588572	27.164793	715.925903	0.02823912	6	14	2.231081	0	0
54	240305005225029	\N	2023-10-30 18:03:14	\N	6.639431	1.39006	0	7.299043	68.377052	7.588572	27.164793	715.925903	0.02823912	6	14	2.231081	0	0
55	240305005225029	\N	2023-10-30 18:03:25	\N	6.639431	1.39006	0	7.299043	68.377052	7.588572	27.164793	715.925903	0.02823912	6	14	2.231081	0	0
56	240305005225029	\N	2023-10-30 18:03:35	\N	6.639431	1.39006	0	7.299043	68.377052	7.588572	27.164793	715.925903	0.02823912	6	14	2.231081	0	0
57	240305005225029	\N	2023-10-30 18:03:45	\N	6.639431	1.39006	0	7.299043	68.377052	7.588572	27.164793	715.925903	0.02823912	6	14	2.231081	0	0
58	240305005225029	\N	2023-10-30 18:03:55	\N	6.639431	1.39006	0	7.299043	68.377052	7.588572	27.164793	715.925903	0.02823912	6	14	2.231081	0	0
59	240305005225029	\N	2023-10-30 18:04:05	\N	6.639431	1.39006	0	7.299043	68.377052	7.588572	27.164793	715.925903	0.02823912	6	14	2.231081	0	0
60	240305005225029	\N	2023-10-30 18:04:15	\N	6.639431	1.39006	0	7.299043	68.377052	7.588572	27.164793	715.925903	0.02823912	6	14	2.231081	0	0
61	240305005225029	\N	2023-10-30 18:04:25	\N	6.639431	1.39006	0	7.299043	68.377052	7.588572	27.164793	715.925903	0.02823912	6	14	2.231081	0	0
62	240305005225029	\N	2023-10-30 18:04:35	\N	6.639431	1.39006	0	7.299043	68.377052	7.588572	27.164793	715.925903	0.02823912	6	14	2.231081	0	0
63	240305005225029	\N	2023-10-30 18:04:45	\N	6.639431	1.39006	0	7.299043	68.377052	7.588572	27.164793	715.925903	0.02823912	6	14	2.231081	0	0
64	240305005225029	\N	2023-10-30 18:04:55	\N	6.639431	1.39006	0	7.299043	68.377052	7.588572	27.164793	715.925903	0.02823912	6	14	2.231081	0	0
65	240305005225029	\N	2023-10-30 18:05:05	\N	6.639431	1.39006	0	7.299043	68.377052	7.588572	27.164793	715.925903	0.02823912	6	14	2.231081	0	0
66	240305005225029	\N	2023-10-30 18:05:15	\N	6.639431	1.39006	0	7.299043	68.377052	7.588572	27.164793	715.925903	0.02823912	6	14	2.231081	0	0
67	240305005225029	\N	2023-10-30 18:05:25	\N	6.639431	1.39006	0	7.299043	68.377052	7.588572	27.164793	715.925903	0.02823912	6	14	2.231081	0	0
68	240305005225029	\N	2023-10-30 18:05:35	\N	6.639431	1.39006	0	7.299043	68.377052	7.588572	27.164793	715.925903	0.02823912	6	14	2.231081	0	0
69	240305005225029	\N	2023-10-30 18:05:45	\N	6.639431	1.39006	0	7.299043	68.377052	7.588572	27.164793	715.925903	0.02823912	6	14	2.231081	0	0
70	240305005225029	\N	2023-10-30 18:05:55	\N	6.639431	1.39006	0	7.299043	68.377052	7.588572	27.164793	715.925903	0.02823912	6	14	2.231081	0	0
71	240305005225029	\N	2023-10-30 18:06:05	\N	6.639431	1.39006	0	7.299043	68.377052	7.588572	27.164793	715.925903	0.02823912	6	14	2.231081	0	0
72	240305005225029	\N	2023-10-30 18:06:15	\N	6.639431	1.39006	0	7.299043	68.377052	7.588572	27.164793	715.925903	0.02823912	6	14	2.231081	0	0
73	240305005225029	\N	2023-10-30 18:06:25	\N	6.639431	1.39006	0	7.299043	68.377052	7.588572	27.164793	715.925903	0.02823912	6	14	2.231081	0	0
74	240305005225029	\N	2023-10-30 18:06:35	\N	6.639431	1.39006	0	7.299043	68.377052	7.588572	27.164793	715.925903	0.02823912	6	14	2.231081	0	0
75	240305005225029	\N	2023-10-30 18:06:45	\N	6.639431	1.39006	0	7.299043	68.377052	7.588572	27.164793	715.925903	0.02823912	6	14	2.231081	0	0
76	240305005225029	\N	2023-10-30 18:06:55	\N	6.639431	1.39006	0	7.299043	68.377052	7.588572	27.164793	715.925903	0.02823912	6	14	2.231081	0	0
77	240305005225029	\N	2023-10-30 18:07:05	\N	6.639431	1.39006	0	7.299043	68.377052	7.588572	27.164793	715.925903	0.02823912	6	14	2.231081	0	0
78	240305005225029	\N	2023-10-30 18:07:15	\N	6.639431	1.39006	0	7.299043	68.377052	7.588572	27.164793	715.925903	0.02823912	6	14	2.231081	0	0
79	240305005225029	\N	2023-10-30 18:07:25	\N	6.639431	1.39006	0	7.299043	68.377052	7.588572	27.164793	715.925903	0.02823912	6	14	2.231081	0	0
80	240305005225029	\N	2023-10-30 18:07:35	\N	6.639431	1.39006	0	7.299043	68.377052	7.588572	27.164793	715.925903	0.02823912	6	14	2.231081	0	0
81	240305005225029	\N	2023-10-30 18:07:45	\N	6.639431	1.39006	0	7.299043	68.377052	7.588572	27.164793	715.925903	0.02823912	6	14	2.231081	0	0
82	240305005225029	\N	2023-10-30 18:07:55	\N	6.639431	1.39006	0	7.299043	68.377052	7.588572	27.164793	715.925903	0.02823912	6	14	2.231081	0	0
83	240305005225029	\N	2023-10-30 18:08:05	\N	6.639431	1.39006	0	7.299043	68.377052	7.588572	27.164793	715.925903	0.02823912	6	14	2.231081	0	0
84	240305005225029	\N	2023-10-30 18:08:15	\N	6.639431	1.39006	0	7.299043	68.377052	7.588572	27.164793	715.925903	0.02823912	6	14	2.231081	0	0
85	240305005225029	\N	2023-10-30 18:08:25	\N	6.639431	1.39006	0	7.299043	68.377052	7.588572	27.164793	715.925903	0.02823912	6	14	2.231081	0	0
86	240305005225029	\N	2023-10-30 18:08:35	\N	6.639431	1.39006	0	7.299043	68.377052	7.588572	27.164793	715.925903	0.02823912	6	14	2.231081	0	0
87	240305005225029	\N	2023-10-30 18:08:45	\N	6.639431	1.39006	0	7.299043	68.377052	7.588572	27.164793	715.925903	0.02823912	6	14	2.231081	0	0
88	240305005225029	\N	2023-10-30 18:08:55	\N	6.639431	1.39006	0	7.299043	68.377052	7.588572	27.164793	715.925903	0.02823912	6	14	2.231081	0	0
89	240305005225029	\N	2023-10-30 18:09:05	\N	6.639431	1.39006	0	7.299043	68.377052	7.588572	27.164793	715.925903	0.02823912	6	14	2.231081	0	0
90	240305005225029	\N	2023-11-01 13:57:43	\N	5.684223	5.547312	0.1785616	7.225383	193.856659	13.950748	34.48774	947.215942	0.1443354	4	14	0.5672759	0	0
91	240305005225029	\N	2023-11-01 13:57:53	\N	5.684223	5.547312	0.1785616	7.225383	193.856659	13.950748	34.48774	947.215942	0.1443354	4	14	0.5672759	0	0
92	240305005225029	\N	2023-11-01 13:58:03	\N	5.684223	5.547312	0.1785616	7.225383	193.856659	13.950748	34.48774	947.215942	0.1443354	4	14	0.5672759	0	0
93	240305005225029	\N	2023-11-01 13:58:13	\N	5.684223	5.547312	0.1785616	7.225383	193.856659	13.950748	34.48774	947.215942	0.1443354	4	14	0.5672759	0	0
94	240305005225029	\N	2023-11-01 13:58:23	\N	5.684223	5.547312	0.1785616	7.225383	193.856659	13.950748	34.48774	947.215942	0.1443354	4	14	0.5672759	0	0
95	240305005225029	\N	2023-11-01 13:58:33	\N	5.684223	5.547312	0.1785616	7.225383	193.856659	13.950748	34.48774	947.215942	0.1443354	4	14	0.5672759	0	0
96	240305005225029	\N	2023-11-01 13:58:43	\N	5.684223	5.547312	0.1785616	7.225383	193.856659	13.950748	34.48774	947.215942	0.1443354	4	14	0.5672759	0	0
97	240305005225029	\N	2023-11-01 13:58:53	\N	5.684223	5.547312	0.1785616	7.225383	193.856659	13.950748	34.48774	947.215942	0.1443354	4	14	0.5672759	0	0
98	240305005225029	\N	2023-11-01 13:59:03	\N	5.684223	5.547312	0.1785616	7.225383	193.856659	13.950748	34.48774	947.215942	0.1443354	4	14	0.5672759	0	0
99	240305005225029	\N	2023-11-01 13:59:13	\N	5.684223	5.547312	0.1785616	7.225383	193.856659	13.950748	34.48774	947.215942	0.1443354	4	14	0.5672759	0	0
100	240305005225029	\N	2023-11-01 13:59:23	\N	5.684223	5.547312	0.1785616	7.225383	193.856659	13.950748	34.48774	947.215942	0.1443354	4	14	0.5672759	0	0
101	240305005225029	\N	2023-11-01 13:59:33	\N	5.684223	5.547312	0.1785616	7.225383	193.856659	13.950748	34.48774	947.215942	0.1443354	4	14	0.5672759	0	0
102	240305005225029	\N	2023-11-01 13:59:43	\N	5.684223	5.547312	0.1785616	7.225383	193.856659	13.950748	34.48774	947.215942	0.1443354	4	14	0.5672759	0	0
103	240305005225029	\N	2023-11-01 13:59:53	\N	5.684223	5.547312	0.1785616	7.225383	193.856659	13.950748	34.48774	947.215942	0.1443354	4	14	0.5672759	0	0
104	240305005225029	\N	2023-11-01 14:00:03	\N	5.684223	5.547312	0.1785616	7.225383	193.856659	13.950748	34.48774	947.215942	0.1443354	4	14	0.5672759	0	0
105	240305005225029	\N	2023-11-01 14:00:13	\N	5.684223	5.547312	0.1785616	7.225383	193.856659	13.950748	34.48774	947.215942	0.1443354	4	14	0.5672759	0	0
106	240305005225029	\N	2023-11-01 14:14:24	\N	5.644762	5.896377	0.1788919	7.219226	194.495972	0	13.259889	445.759003	0.1399433	4	14	0.5486665	0	0
107	240305005225029	\N	2023-11-01 14:20:54	\N	5.645856	6.825599	0.1786186	7.212006	195.136032	3.183281	22.094246	592.18988	0.146228	4	14	0.5569349	0	0
108	240305005225029	\N	2023-11-01 14:21:14	\N	5.631765	6.203825	0.1786287	7.217628	195.136032	3.198359	22.111601	592.692932	0.1501179	4	14	0.5600848	0	0
109	240305005225029	\N	2023-11-01 14:22:24	\N	5.62756	6.761775	0.1790039	7.213376	194.914032	3.187281	22.09885	592.877747	0.1452176	4	14	0.5593562	0	0
110	240305005225029	\N	2023-11-01 14:22:34	\N	5.627624	6.50812	0.1786813	7.217085	194.892319	3.163744	22.071758	593.058533	0.1461168	4	14	0.5567526	0	0
111	240305005225029	\N	2023-11-01 14:22:44	\N	5.636311	6.358689	0.1791047	7.215563	194.891464	3.142241	22.047009	598.065857	0.1460042	4	14	0.5603313	0	0
112	240305005225029	\N	2023-11-01 14:22:54	\N	5.633742	6.390441	0.1786535	7.214815	194.897736	3.153467	22.059929	594.466064	0.1436577	4	14	0.562147	0	0
113	240305005225029	\N	2023-11-01 14:23:04	\N	5.633423	6.658308	0.178705	7.217009	194.819199	3.187077	22.098614	594.766724	0.1447701	4	14	0.5637683	0	0
114	240305005225029	\N	2023-11-01 14:23:14	\N	5.627443	6.529437	0.1792074	7.21205	194.840271	3.22686	22.144405	595.940674	0.1455542	4	14	0.559414	0	0
115	240305005225029	\N	2023-11-01 14:23:24	\N	5.644437	6.383513	0.1789767	7.214906	194.85495	3.234972	22.153744	595.301758	0.1410207	4	14	0.562927	0	0
116	240305005225029	\N	2023-11-01 14:23:34	\N	5.650373	5.638421	0.1787447	7.217662	194.850693	3.25753	22.179708	595.259521	0.1436581	4	14	0.5597181	0	0
117	240305005225029	\N	2023-11-01 19:19:29	\N	5.641743	4.690581	0.1796195	7.237581	200.363373	0	17.832697	476.437012	0.1865437	4	14	0.6959931	0	0
118	240305005225029	\N	2023-11-01 19:19:39	\N	5.641743	4.690581	0.1796195	7.237581	200.363373	0	17.832697	476.437012	0.1865437	4	14	0.6959931	0	0
\.


--
-- TOC entry 2900 (class 0 OID 82120)
-- Dependencies: 204
-- Data for Name: provinces; Type: TABLE DATA; Schema: public; Owner: dbadmin
--

COPY public.provinces (id, province_name) FROM stdin;
1	DKI JAKARTA
2	JAWA BARAT
\.


--
-- TOC entry 2896 (class 0 OID 73904)
-- Dependencies: 200
-- Data for Name: r_config; Type: TABLE DATA; Schema: public; Owner: dbadmin
--

COPY public.r_config (code, type, value, description) FROM stdin;
\.


--
-- TOC entry 2893 (class 0 OID 41099)
-- Dependencies: 197
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: dbadmin
--

COPY public.roles (id, role_name, order_no) FROM stdin;
adm	Admin	1
usr	User	2
\.


--
-- TOC entry 2908 (class 0 OID 82213)
-- Dependencies: 212
-- Data for Name: stations; Type: TABLE DATA; Schema: public; Owner: dbadmin
--

COPY public.stations (id, created_at, updated_at, device_id, nama_stasiun, address, province_id, province_name, city_id, city_name, nama_dinas, id_mesin, created_by) FROM stdin;
1	2023-11-01 22:01:20.063798	\N	1	PT. Cahaya Mas Cemerlang	Jl Mawar no 23	1	DKI JAKARTA	2	KOTA JAKARTA UTARA	PT. Cahaya Mas Cemerlang	240305005225029	1
\.


--
-- TOC entry 2895 (class 0 OID 41121)
-- Dependencies: 199
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: dbadmin
--

COPY public.users (id, username, fullname, email, password, phone, created_at, updated_at, role_id, is_active, jwt_age, device_id, api_key, secret_key, created_by) FROM stdin;
1	admin	Admin	admin@gmail.com	$2b$06$i4ZCnl23QPjQjZx6gngbg..UWjm8EZH0CB4sFssZGf4XEapsam9K.	0821812	2022-04-22 08:33:40.323941+07	2022-04-22 08:33:40.323941+07	adm	t	3600	\N	\N	\N	\N
5	fastpec-cmc	\N	\N	$2b$10$vDYuvJruSaGhqEebOwWV3Ok0l9CpCI7qJi.C/peHSkNgq1YyivVoO	\N	2023-11-01 21:06:07.736982+07	2023-11-01 21:16:33.858+07	usr	t	3600	1	123456	12345	1
\.


--
-- TOC entry 2898 (class 0 OID 73914)
-- Dependencies: 202
-- Data for Name: watermonitoring; Type: TABLE DATA; Schema: public; Owner: dbadmin
--

COPY public.watermonitoring (id, createtime, temperature, ph, tds, nh3n, tss, turbidity, do_, no3, cod, bod, waterlevel, is_success, sync_time, res_menlhk, exec_count, id_stasiun, uuid, project, "time") FROM stdin;
9	\N	29.020813	7.299043	0	0.02823912	715.925903	1.39006	6.639431	6	27.164793	7.588572	2.231081	t	2023-10-30 17:00:00.477	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-10-30","Jam":"17:00:00","Suhu":29.020812999999986,"DHL":0,"TDS":0,"Salinitas":0,"DO":6.639431000000001,"PH":7.299043000000002,"Turbidity":1.3900599999999992,"Kedalaman":2.231081000000001,"SwSG":0,"Nitrat":6,"Amonia'":0.02823911999999999,"ORP":0,"COD":27.164793,"BOD":7.588572,"TSS":715.9259029999998},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-10-30 17:56:04
10	\N	29.020813	7.299043	0	0.02823912	715.925903	1.39006	6.639431	6	27.164793	7.588572	2.231081	t	2023-10-30 17:00:00.481	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-10-30","Jam":"17:00:00","Suhu":29.020812999999986,"DHL":0,"TDS":0,"Salinitas":0,"DO":6.639431000000001,"PH":7.299043000000002,"Turbidity":1.3900599999999992,"Kedalaman":2.231081000000001,"SwSG":0,"Nitrat":6,"Amonia'":0.02823911999999999,"ORP":0,"COD":27.164793,"BOD":7.588572,"TSS":715.9259029999998},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-10-30 17:56:14
11	\N	29.020813	7.299043	0	0.02823912	715.925903	1.39006	6.639431	6	27.164793	7.588572	2.231081	t	2023-10-30 17:00:00.482	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-10-30","Jam":"17:00:00","Suhu":29.020812999999986,"DHL":0,"TDS":0,"Salinitas":0,"DO":6.639431000000001,"PH":7.299043000000002,"Turbidity":1.3900599999999992,"Kedalaman":2.231081000000001,"SwSG":0,"Nitrat":6,"Amonia'":0.02823911999999999,"ORP":0,"COD":27.164793,"BOD":7.588572,"TSS":715.9259029999998},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-10-30 17:56:24
12	\N	29.020813	7.299043	0	0.02823912	715.925903	1.39006	6.639431	6	27.164793	7.588572	2.231081	t	2023-10-30 17:00:00.482	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-10-30","Jam":"17:00:00","Suhu":29.020812999999986,"DHL":0,"TDS":0,"Salinitas":0,"DO":6.639431000000001,"PH":7.299043000000002,"Turbidity":1.3900599999999992,"Kedalaman":2.231081000000001,"SwSG":0,"Nitrat":6,"Amonia'":0.02823911999999999,"ORP":0,"COD":27.164793,"BOD":7.588572,"TSS":715.9259029999998},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-10-30 17:56:34
13	\N	29.020813	7.299043	0	0.02823912	715.925903	1.39006	6.639431	6	27.164793	7.588572	2.231081	t	2023-10-30 17:00:00.483	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-10-30","Jam":"17:00:00","Suhu":29.020812999999986,"DHL":0,"TDS":0,"Salinitas":0,"DO":6.639431000000001,"PH":7.299043000000002,"Turbidity":1.3900599999999992,"Kedalaman":2.231081000000001,"SwSG":0,"Nitrat":6,"Amonia'":0.02823911999999999,"ORP":0,"COD":27.164793,"BOD":7.588572,"TSS":715.9259029999998},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-10-30 17:56:44
14	\N	29.020813	7.299043	0	0.02823912	715.925903	1.39006	6.639431	6	27.164793	7.588572	2.231081	t	2023-10-30 17:00:00.484	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-10-30","Jam":"17:00:00","Suhu":29.020812999999986,"DHL":0,"TDS":0,"Salinitas":0,"DO":6.639431000000001,"PH":7.299043000000002,"Turbidity":1.3900599999999992,"Kedalaman":2.231081000000001,"SwSG":0,"Nitrat":6,"Amonia'":0.02823911999999999,"ORP":0,"COD":27.164793,"BOD":7.588572,"TSS":715.9259029999998},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-10-30 17:56:54
15	\N	29.020813	7.299043	0	0.02823912	715.925903	1.39006	6.639431	6	27.164793	7.588572	2.231081	t	2023-10-30 17:00:00.485	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-10-30","Jam":"17:00:00","Suhu":29.020812999999986,"DHL":0,"TDS":0,"Salinitas":0,"DO":6.639431000000001,"PH":7.299043000000002,"Turbidity":1.3900599999999992,"Kedalaman":2.231081000000001,"SwSG":0,"Nitrat":6,"Amonia'":0.02823911999999999,"ORP":0,"COD":27.164793,"BOD":7.588572,"TSS":715.9259029999998},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-10-30 17:57:04
16	\N	29.020813	7.299043	0	0.02823912	715.925903	1.39006	6.639431	6	27.164793	7.588572	2.231081	t	2023-10-30 17:00:00.485	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-10-30","Jam":"17:00:00","Suhu":29.020812999999986,"DHL":0,"TDS":0,"Salinitas":0,"DO":6.639431000000001,"PH":7.299043000000002,"Turbidity":1.3900599999999992,"Kedalaman":2.231081000000001,"SwSG":0,"Nitrat":6,"Amonia'":0.02823911999999999,"ORP":0,"COD":27.164793,"BOD":7.588572,"TSS":715.9259029999998},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-10-30 17:57:14
17	\N	29.020813	7.299043	0	0.02823912	715.925903	1.39006	6.639431	6	27.164793	7.588572	2.231081	t	2023-10-30 17:00:00.486	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-10-30","Jam":"17:00:00","Suhu":29.020812999999986,"DHL":0,"TDS":0,"Salinitas":0,"DO":6.639431000000001,"PH":7.299043000000002,"Turbidity":1.3900599999999992,"Kedalaman":2.231081000000001,"SwSG":0,"Nitrat":6,"Amonia'":0.02823911999999999,"ORP":0,"COD":27.164793,"BOD":7.588572,"TSS":715.9259029999998},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-10-30 17:57:24
22	\N	29.020813	7.299043	0	0.02823912	715.925903	1.39006	6.639431	6	27.164793	7.588572	2.231081	t	2023-10-30 17:00:00.49	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-10-30","Jam":"17:00:00","Suhu":29.020812999999986,"DHL":0,"TDS":0,"Salinitas":0,"DO":6.639431000000001,"PH":7.299043000000002,"Turbidity":1.3900599999999992,"Kedalaman":2.231081000000001,"SwSG":0,"Nitrat":6,"Amonia'":0.02823911999999999,"ORP":0,"COD":27.164793,"BOD":7.588572,"TSS":715.9259029999998},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-10-30 17:58:14
18	\N	29.020813	7.299043	0	0.02823912	715.925903	1.39006	6.639431	6	27.164793	7.588572	2.231081	t	2023-10-30 17:00:00.487	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-10-30","Jam":"17:00:00","Suhu":29.020812999999986,"DHL":0,"TDS":0,"Salinitas":0,"DO":6.639431000000001,"PH":7.299043000000002,"Turbidity":1.3900599999999992,"Kedalaman":2.231081000000001,"SwSG":0,"Nitrat":6,"Amonia'":0.02823911999999999,"ORP":0,"COD":27.164793,"BOD":7.588572,"TSS":715.9259029999998},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-10-30 17:57:34
19	\N	29.020813	7.299043	0	0.02823912	715.925903	1.39006	6.639431	6	27.164793	7.588572	2.231081	t	2023-10-30 17:00:00.488	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-10-30","Jam":"17:00:00","Suhu":29.020812999999986,"DHL":0,"TDS":0,"Salinitas":0,"DO":6.639431000000001,"PH":7.299043000000002,"Turbidity":1.3900599999999992,"Kedalaman":2.231081000000001,"SwSG":0,"Nitrat":6,"Amonia'":0.02823911999999999,"ORP":0,"COD":27.164793,"BOD":7.588572,"TSS":715.9259029999998},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-10-30 17:57:44
20	\N	29.020813	7.299043	0	0.02823912	715.925903	1.39006	6.639431	6	27.164793	7.588572	2.231081	t	2023-10-30 17:00:00.488	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-10-30","Jam":"17:00:00","Suhu":29.020812999999986,"DHL":0,"TDS":0,"Salinitas":0,"DO":6.639431000000001,"PH":7.299043000000002,"Turbidity":1.3900599999999992,"Kedalaman":2.231081000000001,"SwSG":0,"Nitrat":6,"Amonia'":0.02823911999999999,"ORP":0,"COD":27.164793,"BOD":7.588572,"TSS":715.9259029999998},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-10-30 17:57:54
21	\N	29.020813	7.299043	0	0.02823912	715.925903	1.39006	6.639431	6	27.164793	7.588572	2.231081	t	2023-10-30 17:00:00.489	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-10-30","Jam":"17:00:00","Suhu":29.020812999999986,"DHL":0,"TDS":0,"Salinitas":0,"DO":6.639431000000001,"PH":7.299043000000002,"Turbidity":1.3900599999999992,"Kedalaman":2.231081000000001,"SwSG":0,"Nitrat":6,"Amonia'":0.02823911999999999,"ORP":0,"COD":27.164793,"BOD":7.588572,"TSS":715.9259029999998},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-10-30 17:58:04
23	\N	29.020813	7.299043	0	0.02823912	715.925903	1.39006	6.639431	6	27.164793	7.588572	2.231081	t	2023-10-30 17:00:00.491	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-10-30","Jam":"17:00:00","Suhu":29.020812999999986,"DHL":0,"TDS":0,"Salinitas":0,"DO":6.639431000000001,"PH":7.299043000000002,"Turbidity":1.3900599999999992,"Kedalaman":2.231081000000001,"SwSG":0,"Nitrat":6,"Amonia'":0.02823911999999999,"ORP":0,"COD":27.164793,"BOD":7.588572,"TSS":715.9259029999998},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-10-30 17:58:24
24	\N	29.020813	7.299043	0	0.02823912	715.925903	1.39006	6.639431	6	27.164793	7.588572	2.231081	t	2023-10-30 17:00:00.491	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-10-30","Jam":"17:00:00","Suhu":29.020812999999986,"DHL":0,"TDS":0,"Salinitas":0,"DO":6.639431000000001,"PH":7.299043000000002,"Turbidity":1.3900599999999992,"Kedalaman":2.231081000000001,"SwSG":0,"Nitrat":6,"Amonia'":0.02823911999999999,"ORP":0,"COD":27.164793,"BOD":7.588572,"TSS":715.9259029999998},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-10-30 17:58:34
25	\N	29.020813	7.299043	0	0.02823912	715.925903	1.39006	6.639431	6	27.164793	7.588572	2.231081	t	2023-10-30 17:00:00.492	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-10-30","Jam":"17:00:00","Suhu":29.020812999999986,"DHL":0,"TDS":0,"Salinitas":0,"DO":6.639431000000001,"PH":7.299043000000002,"Turbidity":1.3900599999999992,"Kedalaman":2.231081000000001,"SwSG":0,"Nitrat":6,"Amonia'":0.02823911999999999,"ORP":0,"COD":27.164793,"BOD":7.588572,"TSS":715.9259029999998},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-10-30 17:58:44
26	\N	29.020813	7.299043	0	0.02823912	715.925903	1.39006	6.639431	6	27.164793	7.588572	2.231081	t	2023-10-30 17:00:00.493	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-10-30","Jam":"17:00:00","Suhu":29.020812999999986,"DHL":0,"TDS":0,"Salinitas":0,"DO":6.639431000000001,"PH":7.299043000000002,"Turbidity":1.3900599999999992,"Kedalaman":2.231081000000001,"SwSG":0,"Nitrat":6,"Amonia'":0.02823911999999999,"ORP":0,"COD":27.164793,"BOD":7.588572,"TSS":715.9259029999998},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-10-30 17:58:54
27	\N	29.020813	7.299043	0	0.02823912	715.925903	1.39006	6.639431	6	27.164793	7.588572	2.231081	t	2023-10-30 17:00:00.493	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-10-30","Jam":"17:00:00","Suhu":29.020812999999986,"DHL":0,"TDS":0,"Salinitas":0,"DO":6.639431000000001,"PH":7.299043000000002,"Turbidity":1.3900599999999992,"Kedalaman":2.231081000000001,"SwSG":0,"Nitrat":6,"Amonia'":0.02823911999999999,"ORP":0,"COD":27.164793,"BOD":7.588572,"TSS":715.9259029999998},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-10-30 17:59:04
28	\N	29.020813	7.299043	0	0.02823912	715.925903	1.39006	6.639431	6	27.164793	7.588572	2.231081	t	2023-10-30 17:00:00.494	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-10-30","Jam":"17:00:00","Suhu":29.020812999999986,"DHL":0,"TDS":0,"Salinitas":0,"DO":6.639431000000001,"PH":7.299043000000002,"Turbidity":1.3900599999999992,"Kedalaman":2.231081000000001,"SwSG":0,"Nitrat":6,"Amonia'":0.02823911999999999,"ORP":0,"COD":27.164793,"BOD":7.588572,"TSS":715.9259029999998},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-10-30 17:59:14
29	\N	29.020813	7.299043	0	0.02823912	715.925903	1.39006	6.639431	6	27.164793	7.588572	2.231081	t	2023-10-30 17:00:00.495	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-10-30","Jam":"17:00:00","Suhu":29.020812999999986,"DHL":0,"TDS":0,"Salinitas":0,"DO":6.639431000000001,"PH":7.299043000000002,"Turbidity":1.3900599999999992,"Kedalaman":2.231081000000001,"SwSG":0,"Nitrat":6,"Amonia'":0.02823911999999999,"ORP":0,"COD":27.164793,"BOD":7.588572,"TSS":715.9259029999998},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-10-30 17:59:24
30	\N	29.020813	7.299043	0	0.02823912	715.925903	1.39006	6.639431	6	27.164793	7.588572	2.231081	t	2023-10-30 17:00:00.496	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-10-30","Jam":"17:00:00","Suhu":29.020812999999986,"DHL":0,"TDS":0,"Salinitas":0,"DO":6.639431000000001,"PH":7.299043000000002,"Turbidity":1.3900599999999992,"Kedalaman":2.231081000000001,"SwSG":0,"Nitrat":6,"Amonia'":0.02823911999999999,"ORP":0,"COD":27.164793,"BOD":7.588572,"TSS":715.9259029999998},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-10-30 17:59:34
31	\N	29.020813	7.299043	0	0.02823912	715.925903	1.39006	6.639431	6	27.164793	7.588572	2.231081	t	2023-10-30 17:00:00.497	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-10-30","Jam":"17:00:00","Suhu":29.020812999999986,"DHL":0,"TDS":0,"Salinitas":0,"DO":6.639431000000001,"PH":7.299043000000002,"Turbidity":1.3900599999999992,"Kedalaman":2.231081000000001,"SwSG":0,"Nitrat":6,"Amonia'":0.02823911999999999,"ORP":0,"COD":27.164793,"BOD":7.588572,"TSS":715.9259029999998},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-10-30 17:59:44
32	\N	29.020813	7.299043	0	0.02823912	715.925903	1.39006	6.639431	6	27.164793	7.588572	2.231081	t	2023-10-30 17:00:00.498	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-10-30","Jam":"17:00:00","Suhu":29.020812999999986,"DHL":0,"TDS":0,"Salinitas":0,"DO":6.639431000000001,"PH":7.299043000000002,"Turbidity":1.3900599999999992,"Kedalaman":2.231081000000001,"SwSG":0,"Nitrat":6,"Amonia'":0.02823911999999999,"ORP":0,"COD":27.164793,"BOD":7.588572,"TSS":715.9259029999998},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-10-30 17:59:54
38	\N	29.020813	7.299043	0	0.02823912	715.925903	1.39006	6.639431	6	27.164793	7.588572	2.231081	t	2023-10-30 21:00:01.392	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-10-30","Jam":"21:00:00","Suhu":29.020813000000018,"DHL":0,"TDS":0,"Salinitas":0,"DO":6.639431000000001,"PH":7.2990429999999975,"Turbidity":1.3900599999999996,"Kedalaman":2.2310810000000023,"SwSG":0,"Nitrat":6,"Amonia'":0.028239120000000006,"ORP":0,"COD":27.164792999999978,"BOD":7.588572,"TSS":715.9259030000003},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-10-30 18:00:54
44	\N	29.020813	7.299043	0	0.02823912	715.925903	1.39006	6.639431	6	27.164793	7.588572	2.231081	t	2023-10-30 21:00:01.399	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-10-30","Jam":"21:00:00","Suhu":29.020813000000018,"DHL":0,"TDS":0,"Salinitas":0,"DO":6.639431000000001,"PH":7.2990429999999975,"Turbidity":1.3900599999999996,"Kedalaman":2.2310810000000023,"SwSG":0,"Nitrat":6,"Amonia'":0.028239120000000006,"ORP":0,"COD":27.164792999999978,"BOD":7.588572,"TSS":715.9259030000003},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-10-30 18:01:54
49	\N	29.020813	7.299043	0	0.02823912	715.925903	1.39006	6.639431	6	27.164793	7.588572	2.231081	t	2023-10-30 21:00:01.403	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-10-30","Jam":"21:00:00","Suhu":29.020813000000018,"DHL":0,"TDS":0,"Salinitas":0,"DO":6.639431000000001,"PH":7.2990429999999975,"Turbidity":1.3900599999999996,"Kedalaman":2.2310810000000023,"SwSG":0,"Nitrat":6,"Amonia'":0.028239120000000006,"ORP":0,"COD":27.164792999999978,"BOD":7.588572,"TSS":715.9259030000003},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-10-30 18:02:45
54	\N	29.020813	7.299043	0	0.02823912	715.925903	1.39006	6.639431	6	27.164793	7.588572	2.231081	t	2023-10-30 21:00:01.406	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-10-30","Jam":"21:00:00","Suhu":29.020813000000018,"DHL":0,"TDS":0,"Salinitas":0,"DO":6.639431000000001,"PH":7.2990429999999975,"Turbidity":1.3900599999999996,"Kedalaman":2.2310810000000023,"SwSG":0,"Nitrat":6,"Amonia'":0.028239120000000006,"ORP":0,"COD":27.164792999999978,"BOD":7.588572,"TSS":715.9259030000003},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-10-30 18:03:35
59	\N	29.020813	7.299043	0	0.02823912	715.925903	1.39006	6.639431	6	27.164793	7.588572	2.231081	t	2023-10-30 21:00:01.411	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-10-30","Jam":"21:00:00","Suhu":29.020813000000018,"DHL":0,"TDS":0,"Salinitas":0,"DO":6.639431000000001,"PH":7.2990429999999975,"Turbidity":1.3900599999999996,"Kedalaman":2.2310810000000023,"SwSG":0,"Nitrat":6,"Amonia'":0.028239120000000006,"ORP":0,"COD":27.164792999999978,"BOD":7.588572,"TSS":715.9259030000003},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-10-30 18:04:25
64	\N	29.020813	7.299043	0	0.02823912	715.925903	1.39006	6.639431	6	27.164793	7.588572	2.231081	t	2023-10-30 21:00:01.416	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-10-30","Jam":"21:00:00","Suhu":29.020813000000018,"DHL":0,"TDS":0,"Salinitas":0,"DO":6.639431000000001,"PH":7.2990429999999975,"Turbidity":1.3900599999999996,"Kedalaman":2.2310810000000023,"SwSG":0,"Nitrat":6,"Amonia'":0.028239120000000006,"ORP":0,"COD":27.164792999999978,"BOD":7.588572,"TSS":715.9259030000003},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-10-30 18:05:15
68	\N	29.020813	7.299043	0	0.02823912	715.925903	1.39006	6.639431	6	27.164793	7.588572	2.231081	t	2023-10-30 21:00:01.381	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-10-30","Jam":"21:00:00","Suhu":29.020813000000018,"DHL":0,"TDS":0,"Salinitas":0,"DO":6.639431000000001,"PH":7.2990429999999975,"Turbidity":1.3900599999999996,"Kedalaman":2.2310810000000023,"SwSG":0,"Nitrat":6,"Amonia'":0.028239120000000006,"ORP":0,"COD":27.164792999999978,"BOD":7.588572,"TSS":715.9259030000003},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-10-30 18:05:55
69	\N	29.020813	7.299043	0	0.02823912	715.925903	1.39006	6.639431	6	27.164793	7.588572	2.231081	t	2023-10-30 21:00:01.385	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-10-30","Jam":"21:00:00","Suhu":29.020813000000018,"DHL":0,"TDS":0,"Salinitas":0,"DO":6.639431000000001,"PH":7.2990429999999975,"Turbidity":1.3900599999999996,"Kedalaman":2.2310810000000023,"SwSG":0,"Nitrat":6,"Amonia'":0.028239120000000006,"ORP":0,"COD":27.164792999999978,"BOD":7.588572,"TSS":715.9259030000003},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-10-30 18:06:05
70	\N	29.020813	7.299043	0	0.02823912	715.925903	1.39006	6.639431	6	27.164793	7.588572	2.231081	t	2023-10-30 21:00:01.386	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-10-30","Jam":"21:00:00","Suhu":29.020813000000018,"DHL":0,"TDS":0,"Salinitas":0,"DO":6.639431000000001,"PH":7.2990429999999975,"Turbidity":1.3900599999999996,"Kedalaman":2.2310810000000023,"SwSG":0,"Nitrat":6,"Amonia'":0.028239120000000006,"ORP":0,"COD":27.164792999999978,"BOD":7.588572,"TSS":715.9259030000003},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-10-30 18:06:15
71	\N	29.020813	7.299043	0	0.02823912	715.925903	1.39006	6.639431	6	27.164793	7.588572	2.231081	t	2023-10-30 21:00:01.387	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-10-30","Jam":"21:00:00","Suhu":29.020813000000018,"DHL":0,"TDS":0,"Salinitas":0,"DO":6.639431000000001,"PH":7.2990429999999975,"Turbidity":1.3900599999999996,"Kedalaman":2.2310810000000023,"SwSG":0,"Nitrat":6,"Amonia'":0.028239120000000006,"ORP":0,"COD":27.164792999999978,"BOD":7.588572,"TSS":715.9259030000003},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-10-30 18:06:25
33	\N	29.020813	7.299043	0	0.02823912	715.925903	1.39006	6.639431	6	27.164793	7.588572	2.231081	t	2023-10-30 21:00:01.388	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-10-30","Jam":"21:00:00","Suhu":29.020813000000018,"DHL":0,"TDS":0,"Salinitas":0,"DO":6.639431000000001,"PH":7.2990429999999975,"Turbidity":1.3900599999999996,"Kedalaman":2.2310810000000023,"SwSG":0,"Nitrat":6,"Amonia'":0.028239120000000006,"ORP":0,"COD":27.164792999999978,"BOD":7.588572,"TSS":715.9259030000003},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-10-30 18:00:04
34	\N	29.020813	7.299043	0	0.02823912	715.925903	1.39006	6.639431	6	27.164793	7.588572	2.231081	t	2023-10-30 21:00:01.389	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-10-30","Jam":"21:00:00","Suhu":29.020813000000018,"DHL":0,"TDS":0,"Salinitas":0,"DO":6.639431000000001,"PH":7.2990429999999975,"Turbidity":1.3900599999999996,"Kedalaman":2.2310810000000023,"SwSG":0,"Nitrat":6,"Amonia'":0.028239120000000006,"ORP":0,"COD":27.164792999999978,"BOD":7.588572,"TSS":715.9259030000003},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-10-30 18:00:14
35	\N	29.020813	7.299043	0	0.02823912	715.925903	1.39006	6.639431	6	27.164793	7.588572	2.231081	t	2023-10-30 21:00:01.389	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-10-30","Jam":"21:00:00","Suhu":29.020813000000018,"DHL":0,"TDS":0,"Salinitas":0,"DO":6.639431000000001,"PH":7.2990429999999975,"Turbidity":1.3900599999999996,"Kedalaman":2.2310810000000023,"SwSG":0,"Nitrat":6,"Amonia'":0.028239120000000006,"ORP":0,"COD":27.164792999999978,"BOD":7.588572,"TSS":715.9259030000003},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-10-30 18:00:24
74	\N	29.020813	7.299043	0	0.02823912	715.925903	1.39006	6.639431	6	27.164793	7.588572	2.231081	t	2023-10-30 21:00:01.42	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-10-30","Jam":"21:00:00","Suhu":29.020813000000018,"DHL":0,"TDS":0,"Salinitas":0,"DO":6.639431000000001,"PH":7.2990429999999975,"Turbidity":1.3900599999999996,"Kedalaman":2.2310810000000023,"SwSG":0,"Nitrat":6,"Amonia'":0.028239120000000006,"ORP":0,"COD":27.164792999999978,"BOD":7.588572,"TSS":715.9259030000003},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-10-30 18:06:55
79	\N	29.020813	7.299043	0	0.02823912	715.925903	1.39006	6.639431	6	27.164793	7.588572	2.231081	t	2023-10-30 21:00:01.423	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-10-30","Jam":"21:00:00","Suhu":29.020813000000018,"DHL":0,"TDS":0,"Salinitas":0,"DO":6.639431000000001,"PH":7.2990429999999975,"Turbidity":1.3900599999999996,"Kedalaman":2.2310810000000023,"SwSG":0,"Nitrat":6,"Amonia'":0.028239120000000006,"ORP":0,"COD":27.164792999999978,"BOD":7.588572,"TSS":715.9259030000003},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-10-30 18:07:45
84	\N	29.020813	7.299043	0	0.02823912	715.925903	1.39006	6.639431	6	27.164793	7.588572	2.231081	t	2023-10-30 21:00:01.427	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-10-30","Jam":"21:00:00","Suhu":29.020813000000018,"DHL":0,"TDS":0,"Salinitas":0,"DO":6.639431000000001,"PH":7.2990429999999975,"Turbidity":1.3900599999999996,"Kedalaman":2.2310810000000023,"SwSG":0,"Nitrat":6,"Amonia'":0.028239120000000006,"ORP":0,"COD":27.164792999999978,"BOD":7.588572,"TSS":715.9259030000003},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-10-30 18:08:35
36	\N	29.020813	7.299043	0	0.02823912	715.925903	1.39006	6.639431	6	27.164793	7.588572	2.231081	t	2023-10-30 21:00:01.39	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-10-30","Jam":"21:00:00","Suhu":29.020813000000018,"DHL":0,"TDS":0,"Salinitas":0,"DO":6.639431000000001,"PH":7.2990429999999975,"Turbidity":1.3900599999999996,"Kedalaman":2.2310810000000023,"SwSG":0,"Nitrat":6,"Amonia'":0.028239120000000006,"ORP":0,"COD":27.164792999999978,"BOD":7.588572,"TSS":715.9259030000003},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-10-30 18:00:34
37	\N	29.020813	7.299043	0	0.02823912	715.925903	1.39006	6.639431	6	27.164793	7.588572	2.231081	t	2023-10-30 21:00:01.391	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-10-30","Jam":"21:00:00","Suhu":29.020813000000018,"DHL":0,"TDS":0,"Salinitas":0,"DO":6.639431000000001,"PH":7.2990429999999975,"Turbidity":1.3900599999999996,"Kedalaman":2.2310810000000023,"SwSG":0,"Nitrat":6,"Amonia'":0.028239120000000006,"ORP":0,"COD":27.164792999999978,"BOD":7.588572,"TSS":715.9259030000003},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-10-30 18:00:44
39	\N	29.020813	7.299043	0	0.02823912	715.925903	1.39006	6.639431	6	27.164793	7.588572	2.231081	t	2023-10-30 21:00:01.393	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-10-30","Jam":"21:00:00","Suhu":29.020813000000018,"DHL":0,"TDS":0,"Salinitas":0,"DO":6.639431000000001,"PH":7.2990429999999975,"Turbidity":1.3900599999999996,"Kedalaman":2.2310810000000023,"SwSG":0,"Nitrat":6,"Amonia'":0.028239120000000006,"ORP":0,"COD":27.164792999999978,"BOD":7.588572,"TSS":715.9259030000003},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-10-30 18:01:04
40	\N	29.020813	7.299043	0	0.02823912	715.925903	1.39006	6.639431	6	27.164793	7.588572	2.231081	t	2023-10-30 21:00:01.394	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-10-30","Jam":"21:00:00","Suhu":29.020813000000018,"DHL":0,"TDS":0,"Salinitas":0,"DO":6.639431000000001,"PH":7.2990429999999975,"Turbidity":1.3900599999999996,"Kedalaman":2.2310810000000023,"SwSG":0,"Nitrat":6,"Amonia'":0.028239120000000006,"ORP":0,"COD":27.164792999999978,"BOD":7.588572,"TSS":715.9259030000003},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-10-30 18:01:14
41	\N	29.020813	7.299043	0	0.02823912	715.925903	1.39006	6.639431	6	27.164793	7.588572	2.231081	t	2023-10-30 21:00:01.395	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-10-30","Jam":"21:00:00","Suhu":29.020813000000018,"DHL":0,"TDS":0,"Salinitas":0,"DO":6.639431000000001,"PH":7.2990429999999975,"Turbidity":1.3900599999999996,"Kedalaman":2.2310810000000023,"SwSG":0,"Nitrat":6,"Amonia'":0.028239120000000006,"ORP":0,"COD":27.164792999999978,"BOD":7.588572,"TSS":715.9259030000003},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-10-30 18:01:24
42	\N	29.020813	7.299043	0	0.02823912	715.925903	1.39006	6.639431	6	27.164793	7.588572	2.231081	t	2023-10-30 21:00:01.397	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-10-30","Jam":"21:00:00","Suhu":29.020813000000018,"DHL":0,"TDS":0,"Salinitas":0,"DO":6.639431000000001,"PH":7.2990429999999975,"Turbidity":1.3900599999999996,"Kedalaman":2.2310810000000023,"SwSG":0,"Nitrat":6,"Amonia'":0.028239120000000006,"ORP":0,"COD":27.164792999999978,"BOD":7.588572,"TSS":715.9259030000003},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-10-30 18:01:34
43	\N	29.020813	7.299043	0	0.02823912	715.925903	1.39006	6.639431	6	27.164793	7.588572	2.231081	t	2023-10-30 21:00:01.398	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-10-30","Jam":"21:00:00","Suhu":29.020813000000018,"DHL":0,"TDS":0,"Salinitas":0,"DO":6.639431000000001,"PH":7.2990429999999975,"Turbidity":1.3900599999999996,"Kedalaman":2.2310810000000023,"SwSG":0,"Nitrat":6,"Amonia'":0.028239120000000006,"ORP":0,"COD":27.164792999999978,"BOD":7.588572,"TSS":715.9259030000003},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-10-30 18:01:44
45	\N	29.020813	7.299043	0	0.02823912	715.925903	1.39006	6.639431	6	27.164793	7.588572	2.231081	t	2023-10-30 21:00:01.4	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-10-30","Jam":"21:00:00","Suhu":29.020813000000018,"DHL":0,"TDS":0,"Salinitas":0,"DO":6.639431000000001,"PH":7.2990429999999975,"Turbidity":1.3900599999999996,"Kedalaman":2.2310810000000023,"SwSG":0,"Nitrat":6,"Amonia'":0.028239120000000006,"ORP":0,"COD":27.164792999999978,"BOD":7.588572,"TSS":715.9259030000003},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-10-30 18:02:04
46	\N	29.020813	7.299043	0	0.02823912	715.925903	1.39006	6.639431	6	27.164793	7.588572	2.231081	t	2023-10-30 21:00:01.401	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-10-30","Jam":"21:00:00","Suhu":29.020813000000018,"DHL":0,"TDS":0,"Salinitas":0,"DO":6.639431000000001,"PH":7.2990429999999975,"Turbidity":1.3900599999999996,"Kedalaman":2.2310810000000023,"SwSG":0,"Nitrat":6,"Amonia'":0.028239120000000006,"ORP":0,"COD":27.164792999999978,"BOD":7.588572,"TSS":715.9259030000003},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-10-30 18:02:14
47	\N	29.020813	7.299043	0	0.02823912	715.925903	1.39006	6.639431	6	27.164793	7.588572	2.231081	t	2023-10-30 21:00:01.401	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-10-30","Jam":"21:00:00","Suhu":29.020813000000018,"DHL":0,"TDS":0,"Salinitas":0,"DO":6.639431000000001,"PH":7.2990429999999975,"Turbidity":1.3900599999999996,"Kedalaman":2.2310810000000023,"SwSG":0,"Nitrat":6,"Amonia'":0.028239120000000006,"ORP":0,"COD":27.164792999999978,"BOD":7.588572,"TSS":715.9259030000003},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-10-30 18:02:24
48	\N	29.020813	7.299043	0	0.02823912	715.925903	1.39006	6.639431	6	27.164793	7.588572	2.231081	t	2023-10-30 21:00:01.402	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-10-30","Jam":"21:00:00","Suhu":29.020813000000018,"DHL":0,"TDS":0,"Salinitas":0,"DO":6.639431000000001,"PH":7.2990429999999975,"Turbidity":1.3900599999999996,"Kedalaman":2.2310810000000023,"SwSG":0,"Nitrat":6,"Amonia'":0.028239120000000006,"ORP":0,"COD":27.164792999999978,"BOD":7.588572,"TSS":715.9259030000003},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-10-30 18:02:35
50	\N	29.020813	7.299043	0	0.02823912	715.925903	1.39006	6.639431	6	27.164793	7.588572	2.231081	t	2023-10-30 21:00:01.403	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-10-30","Jam":"21:00:00","Suhu":29.020813000000018,"DHL":0,"TDS":0,"Salinitas":0,"DO":6.639431000000001,"PH":7.2990429999999975,"Turbidity":1.3900599999999996,"Kedalaman":2.2310810000000023,"SwSG":0,"Nitrat":6,"Amonia'":0.028239120000000006,"ORP":0,"COD":27.164792999999978,"BOD":7.588572,"TSS":715.9259030000003},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-10-30 18:02:55
51	\N	29.020813	7.299043	0	0.02823912	715.925903	1.39006	6.639431	6	27.164793	7.588572	2.231081	t	2023-10-30 21:00:01.404	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-10-30","Jam":"21:00:00","Suhu":29.020813000000018,"DHL":0,"TDS":0,"Salinitas":0,"DO":6.639431000000001,"PH":7.2990429999999975,"Turbidity":1.3900599999999996,"Kedalaman":2.2310810000000023,"SwSG":0,"Nitrat":6,"Amonia'":0.028239120000000006,"ORP":0,"COD":27.164792999999978,"BOD":7.588572,"TSS":715.9259030000003},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-10-30 18:03:04
52	\N	29.020813	7.299043	0	0.02823912	715.925903	1.39006	6.639431	6	27.164793	7.588572	2.231081	t	2023-10-30 21:00:01.405	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-10-30","Jam":"21:00:00","Suhu":29.020813000000018,"DHL":0,"TDS":0,"Salinitas":0,"DO":6.639431000000001,"PH":7.2990429999999975,"Turbidity":1.3900599999999996,"Kedalaman":2.2310810000000023,"SwSG":0,"Nitrat":6,"Amonia'":0.028239120000000006,"ORP":0,"COD":27.164792999999978,"BOD":7.588572,"TSS":715.9259030000003},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-10-30 18:03:14
53	\N	29.020813	7.299043	0	0.02823912	715.925903	1.39006	6.639431	6	27.164793	7.588572	2.231081	t	2023-10-30 21:00:01.406	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-10-30","Jam":"21:00:00","Suhu":29.020813000000018,"DHL":0,"TDS":0,"Salinitas":0,"DO":6.639431000000001,"PH":7.2990429999999975,"Turbidity":1.3900599999999996,"Kedalaman":2.2310810000000023,"SwSG":0,"Nitrat":6,"Amonia'":0.028239120000000006,"ORP":0,"COD":27.164792999999978,"BOD":7.588572,"TSS":715.9259030000003},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-10-30 18:03:25
55	\N	29.020813	7.299043	0	0.02823912	715.925903	1.39006	6.639431	6	27.164793	7.588572	2.231081	t	2023-10-30 21:00:01.407	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-10-30","Jam":"21:00:00","Suhu":29.020813000000018,"DHL":0,"TDS":0,"Salinitas":0,"DO":6.639431000000001,"PH":7.2990429999999975,"Turbidity":1.3900599999999996,"Kedalaman":2.2310810000000023,"SwSG":0,"Nitrat":6,"Amonia'":0.028239120000000006,"ORP":0,"COD":27.164792999999978,"BOD":7.588572,"TSS":715.9259030000003},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-10-30 18:03:45
56	\N	29.020813	7.299043	0	0.02823912	715.925903	1.39006	6.639431	6	27.164793	7.588572	2.231081	t	2023-10-30 21:00:01.408	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-10-30","Jam":"21:00:00","Suhu":29.020813000000018,"DHL":0,"TDS":0,"Salinitas":0,"DO":6.639431000000001,"PH":7.2990429999999975,"Turbidity":1.3900599999999996,"Kedalaman":2.2310810000000023,"SwSG":0,"Nitrat":6,"Amonia'":0.028239120000000006,"ORP":0,"COD":27.164792999999978,"BOD":7.588572,"TSS":715.9259030000003},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-10-30 18:03:55
57	\N	29.020813	7.299043	0	0.02823912	715.925903	1.39006	6.639431	6	27.164793	7.588572	2.231081	t	2023-10-30 21:00:01.409	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-10-30","Jam":"21:00:00","Suhu":29.020813000000018,"DHL":0,"TDS":0,"Salinitas":0,"DO":6.639431000000001,"PH":7.2990429999999975,"Turbidity":1.3900599999999996,"Kedalaman":2.2310810000000023,"SwSG":0,"Nitrat":6,"Amonia'":0.028239120000000006,"ORP":0,"COD":27.164792999999978,"BOD":7.588572,"TSS":715.9259030000003},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-10-30 18:04:05
58	\N	29.020813	7.299043	0	0.02823912	715.925903	1.39006	6.639431	6	27.164793	7.588572	2.231081	t	2023-10-30 21:00:01.41	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-10-30","Jam":"21:00:00","Suhu":29.020813000000018,"DHL":0,"TDS":0,"Salinitas":0,"DO":6.639431000000001,"PH":7.2990429999999975,"Turbidity":1.3900599999999996,"Kedalaman":2.2310810000000023,"SwSG":0,"Nitrat":6,"Amonia'":0.028239120000000006,"ORP":0,"COD":27.164792999999978,"BOD":7.588572,"TSS":715.9259030000003},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-10-30 18:04:15
60	\N	29.020813	7.299043	0	0.02823912	715.925903	1.39006	6.639431	6	27.164793	7.588572	2.231081	t	2023-10-30 21:00:01.412	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-10-30","Jam":"21:00:00","Suhu":29.020813000000018,"DHL":0,"TDS":0,"Salinitas":0,"DO":6.639431000000001,"PH":7.2990429999999975,"Turbidity":1.3900599999999996,"Kedalaman":2.2310810000000023,"SwSG":0,"Nitrat":6,"Amonia'":0.028239120000000006,"ORP":0,"COD":27.164792999999978,"BOD":7.588572,"TSS":715.9259030000003},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-10-30 18:04:35
61	\N	29.020813	7.299043	0	0.02823912	715.925903	1.39006	6.639431	6	27.164793	7.588572	2.231081	t	2023-10-30 21:00:01.413	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-10-30","Jam":"21:00:00","Suhu":29.020813000000018,"DHL":0,"TDS":0,"Salinitas":0,"DO":6.639431000000001,"PH":7.2990429999999975,"Turbidity":1.3900599999999996,"Kedalaman":2.2310810000000023,"SwSG":0,"Nitrat":6,"Amonia'":0.028239120000000006,"ORP":0,"COD":27.164792999999978,"BOD":7.588572,"TSS":715.9259030000003},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-10-30 18:04:45
62	\N	29.020813	7.299043	0	0.02823912	715.925903	1.39006	6.639431	6	27.164793	7.588572	2.231081	t	2023-10-30 21:00:01.414	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-10-30","Jam":"21:00:00","Suhu":29.020813000000018,"DHL":0,"TDS":0,"Salinitas":0,"DO":6.639431000000001,"PH":7.2990429999999975,"Turbidity":1.3900599999999996,"Kedalaman":2.2310810000000023,"SwSG":0,"Nitrat":6,"Amonia'":0.028239120000000006,"ORP":0,"COD":27.164792999999978,"BOD":7.588572,"TSS":715.9259030000003},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-10-30 18:04:55
63	\N	29.020813	7.299043	0	0.02823912	715.925903	1.39006	6.639431	6	27.164793	7.588572	2.231081	t	2023-10-30 21:00:01.415	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-10-30","Jam":"21:00:00","Suhu":29.020813000000018,"DHL":0,"TDS":0,"Salinitas":0,"DO":6.639431000000001,"PH":7.2990429999999975,"Turbidity":1.3900599999999996,"Kedalaman":2.2310810000000023,"SwSG":0,"Nitrat":6,"Amonia'":0.028239120000000006,"ORP":0,"COD":27.164792999999978,"BOD":7.588572,"TSS":715.9259030000003},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-10-30 18:05:05
65	\N	29.020813	7.299043	0	0.02823912	715.925903	1.39006	6.639431	6	27.164793	7.588572	2.231081	t	2023-10-30 21:00:01.416	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-10-30","Jam":"21:00:00","Suhu":29.020813000000018,"DHL":0,"TDS":0,"Salinitas":0,"DO":6.639431000000001,"PH":7.2990429999999975,"Turbidity":1.3900599999999996,"Kedalaman":2.2310810000000023,"SwSG":0,"Nitrat":6,"Amonia'":0.028239120000000006,"ORP":0,"COD":27.164792999999978,"BOD":7.588572,"TSS":715.9259030000003},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-10-30 18:05:25
66	\N	29.020813	7.299043	0	0.02823912	715.925903	1.39006	6.639431	6	27.164793	7.588572	2.231081	t	2023-10-30 21:00:01.417	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-10-30","Jam":"21:00:00","Suhu":29.020813000000018,"DHL":0,"TDS":0,"Salinitas":0,"DO":6.639431000000001,"PH":7.2990429999999975,"Turbidity":1.3900599999999996,"Kedalaman":2.2310810000000023,"SwSG":0,"Nitrat":6,"Amonia'":0.028239120000000006,"ORP":0,"COD":27.164792999999978,"BOD":7.588572,"TSS":715.9259030000003},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-10-30 18:05:35
67	\N	29.020813	7.299043	0	0.02823912	715.925903	1.39006	6.639431	6	27.164793	7.588572	2.231081	t	2023-10-30 21:00:01.418	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-10-30","Jam":"21:00:00","Suhu":29.020813000000018,"DHL":0,"TDS":0,"Salinitas":0,"DO":6.639431000000001,"PH":7.2990429999999975,"Turbidity":1.3900599999999996,"Kedalaman":2.2310810000000023,"SwSG":0,"Nitrat":6,"Amonia'":0.028239120000000006,"ORP":0,"COD":27.164792999999978,"BOD":7.588572,"TSS":715.9259030000003},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-10-30 18:05:45
72	\N	29.020813	7.299043	0	0.02823912	715.925903	1.39006	6.639431	6	27.164793	7.588572	2.231081	t	2023-10-30 21:00:01.418	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-10-30","Jam":"21:00:00","Suhu":29.020813000000018,"DHL":0,"TDS":0,"Salinitas":0,"DO":6.639431000000001,"PH":7.2990429999999975,"Turbidity":1.3900599999999996,"Kedalaman":2.2310810000000023,"SwSG":0,"Nitrat":6,"Amonia'":0.028239120000000006,"ORP":0,"COD":27.164792999999978,"BOD":7.588572,"TSS":715.9259030000003},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-10-30 18:06:35
73	\N	29.020813	7.299043	0	0.02823912	715.925903	1.39006	6.639431	6	27.164793	7.588572	2.231081	t	2023-10-30 21:00:01.419	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-10-30","Jam":"21:00:00","Suhu":29.020813000000018,"DHL":0,"TDS":0,"Salinitas":0,"DO":6.639431000000001,"PH":7.2990429999999975,"Turbidity":1.3900599999999996,"Kedalaman":2.2310810000000023,"SwSG":0,"Nitrat":6,"Amonia'":0.028239120000000006,"ORP":0,"COD":27.164792999999978,"BOD":7.588572,"TSS":715.9259030000003},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-10-30 18:06:45
75	\N	29.020813	7.299043	0	0.02823912	715.925903	1.39006	6.639431	6	27.164793	7.588572	2.231081	t	2023-10-30 21:00:01.42	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-10-30","Jam":"21:00:00","Suhu":29.020813000000018,"DHL":0,"TDS":0,"Salinitas":0,"DO":6.639431000000001,"PH":7.2990429999999975,"Turbidity":1.3900599999999996,"Kedalaman":2.2310810000000023,"SwSG":0,"Nitrat":6,"Amonia'":0.028239120000000006,"ORP":0,"COD":27.164792999999978,"BOD":7.588572,"TSS":715.9259030000003},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-10-30 18:07:05
76	\N	29.020813	7.299043	0	0.02823912	715.925903	1.39006	6.639431	6	27.164793	7.588572	2.231081	t	2023-10-30 21:00:01.421	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-10-30","Jam":"21:00:00","Suhu":29.020813000000018,"DHL":0,"TDS":0,"Salinitas":0,"DO":6.639431000000001,"PH":7.2990429999999975,"Turbidity":1.3900599999999996,"Kedalaman":2.2310810000000023,"SwSG":0,"Nitrat":6,"Amonia'":0.028239120000000006,"ORP":0,"COD":27.164792999999978,"BOD":7.588572,"TSS":715.9259030000003},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-10-30 18:07:15
77	\N	29.020813	7.299043	0	0.02823912	715.925903	1.39006	6.639431	6	27.164793	7.588572	2.231081	t	2023-10-30 21:00:01.422	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-10-30","Jam":"21:00:00","Suhu":29.020813000000018,"DHL":0,"TDS":0,"Salinitas":0,"DO":6.639431000000001,"PH":7.2990429999999975,"Turbidity":1.3900599999999996,"Kedalaman":2.2310810000000023,"SwSG":0,"Nitrat":6,"Amonia'":0.028239120000000006,"ORP":0,"COD":27.164792999999978,"BOD":7.588572,"TSS":715.9259030000003},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-10-30 18:07:25
78	\N	29.020813	7.299043	0	0.02823912	715.925903	1.39006	6.639431	6	27.164793	7.588572	2.231081	t	2023-10-30 21:00:01.423	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-10-30","Jam":"21:00:00","Suhu":29.020813000000018,"DHL":0,"TDS":0,"Salinitas":0,"DO":6.639431000000001,"PH":7.2990429999999975,"Turbidity":1.3900599999999996,"Kedalaman":2.2310810000000023,"SwSG":0,"Nitrat":6,"Amonia'":0.028239120000000006,"ORP":0,"COD":27.164792999999978,"BOD":7.588572,"TSS":715.9259030000003},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-10-30 18:07:35
80	\N	29.020813	7.299043	0	0.02823912	715.925903	1.39006	6.639431	6	27.164793	7.588572	2.231081	t	2023-10-30 21:00:01.424	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-10-30","Jam":"21:00:00","Suhu":29.020813000000018,"DHL":0,"TDS":0,"Salinitas":0,"DO":6.639431000000001,"PH":7.2990429999999975,"Turbidity":1.3900599999999996,"Kedalaman":2.2310810000000023,"SwSG":0,"Nitrat":6,"Amonia'":0.028239120000000006,"ORP":0,"COD":27.164792999999978,"BOD":7.588572,"TSS":715.9259030000003},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-10-30 18:07:55
81	\N	29.020813	7.299043	0	0.02823912	715.925903	1.39006	6.639431	6	27.164793	7.588572	2.231081	t	2023-10-30 21:00:01.425	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-10-30","Jam":"21:00:00","Suhu":29.020813000000018,"DHL":0,"TDS":0,"Salinitas":0,"DO":6.639431000000001,"PH":7.2990429999999975,"Turbidity":1.3900599999999996,"Kedalaman":2.2310810000000023,"SwSG":0,"Nitrat":6,"Amonia'":0.028239120000000006,"ORP":0,"COD":27.164792999999978,"BOD":7.588572,"TSS":715.9259030000003},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-10-30 18:08:05
82	\N	29.020813	7.299043	0	0.02823912	715.925903	1.39006	6.639431	6	27.164793	7.588572	2.231081	t	2023-10-30 21:00:01.425	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-10-30","Jam":"21:00:00","Suhu":29.020813000000018,"DHL":0,"TDS":0,"Salinitas":0,"DO":6.639431000000001,"PH":7.2990429999999975,"Turbidity":1.3900599999999996,"Kedalaman":2.2310810000000023,"SwSG":0,"Nitrat":6,"Amonia'":0.028239120000000006,"ORP":0,"COD":27.164792999999978,"BOD":7.588572,"TSS":715.9259030000003},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-10-30 18:08:15
83	\N	29.020813	7.299043	0	0.02823912	715.925903	1.39006	6.639431	6	27.164793	7.588572	2.231081	t	2023-10-30 21:00:01.427	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-10-30","Jam":"21:00:00","Suhu":29.020813000000018,"DHL":0,"TDS":0,"Salinitas":0,"DO":6.639431000000001,"PH":7.2990429999999975,"Turbidity":1.3900599999999996,"Kedalaman":2.2310810000000023,"SwSG":0,"Nitrat":6,"Amonia'":0.028239120000000006,"ORP":0,"COD":27.164792999999978,"BOD":7.588572,"TSS":715.9259030000003},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-10-30 18:08:25
85	\N	29.020813	7.299043	0	0.02823912	715.925903	1.39006	6.639431	6	27.164793	7.588572	2.231081	t	2023-10-30 21:00:01.428	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-10-30","Jam":"21:00:00","Suhu":29.020813000000018,"DHL":0,"TDS":0,"Salinitas":0,"DO":6.639431000000001,"PH":7.2990429999999975,"Turbidity":1.3900599999999996,"Kedalaman":2.2310810000000023,"SwSG":0,"Nitrat":6,"Amonia'":0.028239120000000006,"ORP":0,"COD":27.164792999999978,"BOD":7.588572,"TSS":715.9259030000003},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-10-30 18:08:45
86	\N	29.020813	7.299043	0	0.02823912	715.925903	1.39006	6.639431	6	27.164793	7.588572	2.231081	t	2023-10-30 21:00:01.429	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-10-30","Jam":"21:00:00","Suhu":29.020813000000018,"DHL":0,"TDS":0,"Salinitas":0,"DO":6.639431000000001,"PH":7.2990429999999975,"Turbidity":1.3900599999999996,"Kedalaman":2.2310810000000023,"SwSG":0,"Nitrat":6,"Amonia'":0.028239120000000006,"ORP":0,"COD":27.164792999999978,"BOD":7.588572,"TSS":715.9259030000003},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-10-30 18:08:55
87	\N	29.020813	7.299043	0	0.02823912	715.925903	1.39006	6.639431	6	27.164793	7.588572	2.231081	t	2023-10-30 21:00:01.43	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-10-30","Jam":"21:00:00","Suhu":29.020813000000018,"DHL":0,"TDS":0,"Salinitas":0,"DO":6.639431000000001,"PH":7.2990429999999975,"Turbidity":1.3900599999999996,"Kedalaman":2.2310810000000023,"SwSG":0,"Nitrat":6,"Amonia'":0.028239120000000006,"ORP":0,"COD":27.164792999999978,"BOD":7.588572,"TSS":715.9259030000003},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-10-30 18:09:05
88	\N	28.83963	7.225383	0.1785616	0.1443354	947.215942	5.547312	5.684223	4	34.48774	13.950748	0.5672759	t	2023-11-01 13:00:00.948	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-11-01","Jam":"13:00:00","Suhu":28.83963,"DHL":0,"TDS":0.17856160000000004,"Salinitas":0,"DO":5.684223000000002,"PH":7.225382999999998,"Turbidity":5.547312,"Kedalaman":0.5672759000000002,"SwSG":0,"Nitrat":4,"Amonia'":0.14433540000000006,"ORP":0,"COD":34.48774000000002,"BOD":13.950748000000003,"TSS":947.2159420000002},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-11-01 13:57:43
89	\N	28.83963	7.225383	0.1785616	0.1443354	947.215942	5.547312	5.684223	4	34.48774	13.950748	0.5672759	t	2023-11-01 13:00:00.954	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-11-01","Jam":"13:00:00","Suhu":28.83963,"DHL":0,"TDS":0.17856160000000004,"Salinitas":0,"DO":5.684223000000002,"PH":7.225382999999998,"Turbidity":5.547312,"Kedalaman":0.5672759000000002,"SwSG":0,"Nitrat":4,"Amonia'":0.14433540000000006,"ORP":0,"COD":34.48774000000002,"BOD":13.950748000000003,"TSS":947.2159420000002},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-11-01 13:57:53
90	\N	28.83963	7.225383	0.1785616	0.1443354	947.215942	5.547312	5.684223	4	34.48774	13.950748	0.5672759	t	2023-11-01 13:00:00.955	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-11-01","Jam":"13:00:00","Suhu":28.83963,"DHL":0,"TDS":0.17856160000000004,"Salinitas":0,"DO":5.684223000000002,"PH":7.225382999999998,"Turbidity":5.547312,"Kedalaman":0.5672759000000002,"SwSG":0,"Nitrat":4,"Amonia'":0.14433540000000006,"ORP":0,"COD":34.48774000000002,"BOD":13.950748000000003,"TSS":947.2159420000002},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-11-01 13:58:03
91	\N	28.83963	7.225383	0.1785616	0.1443354	947.215942	5.547312	5.684223	4	34.48774	13.950748	0.5672759	t	2023-11-01 13:00:00.956	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-11-01","Jam":"13:00:00","Suhu":28.83963,"DHL":0,"TDS":0.17856160000000004,"Salinitas":0,"DO":5.684223000000002,"PH":7.225382999999998,"Turbidity":5.547312,"Kedalaman":0.5672759000000002,"SwSG":0,"Nitrat":4,"Amonia'":0.14433540000000006,"ORP":0,"COD":34.48774000000002,"BOD":13.950748000000003,"TSS":947.2159420000002},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-11-01 13:58:13
92	\N	28.83963	7.225383	0.1785616	0.1443354	947.215942	5.547312	5.684223	4	34.48774	13.950748	0.5672759	t	2023-11-01 13:00:00.957	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-11-01","Jam":"13:00:00","Suhu":28.83963,"DHL":0,"TDS":0.17856160000000004,"Salinitas":0,"DO":5.684223000000002,"PH":7.225382999999998,"Turbidity":5.547312,"Kedalaman":0.5672759000000002,"SwSG":0,"Nitrat":4,"Amonia'":0.14433540000000006,"ORP":0,"COD":34.48774000000002,"BOD":13.950748000000003,"TSS":947.2159420000002},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-11-01 13:58:23
93	\N	28.83963	7.225383	0.1785616	0.1443354	947.215942	5.547312	5.684223	4	34.48774	13.950748	0.5672759	t	2023-11-01 13:00:00.957	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-11-01","Jam":"13:00:00","Suhu":28.83963,"DHL":0,"TDS":0.17856160000000004,"Salinitas":0,"DO":5.684223000000002,"PH":7.225382999999998,"Turbidity":5.547312,"Kedalaman":0.5672759000000002,"SwSG":0,"Nitrat":4,"Amonia'":0.14433540000000006,"ORP":0,"COD":34.48774000000002,"BOD":13.950748000000003,"TSS":947.2159420000002},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-11-01 13:58:33
94	\N	28.83963	7.225383	0.1785616	0.1443354	947.215942	5.547312	5.684223	4	34.48774	13.950748	0.5672759	t	2023-11-01 13:00:00.958	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-11-01","Jam":"13:00:00","Suhu":28.83963,"DHL":0,"TDS":0.17856160000000004,"Salinitas":0,"DO":5.684223000000002,"PH":7.225382999999998,"Turbidity":5.547312,"Kedalaman":0.5672759000000002,"SwSG":0,"Nitrat":4,"Amonia'":0.14433540000000006,"ORP":0,"COD":34.48774000000002,"BOD":13.950748000000003,"TSS":947.2159420000002},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-11-01 13:58:43
95	\N	28.83963	7.225383	0.1785616	0.1443354	947.215942	5.547312	5.684223	4	34.48774	13.950748	0.5672759	t	2023-11-01 13:00:00.959	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-11-01","Jam":"13:00:00","Suhu":28.83963,"DHL":0,"TDS":0.17856160000000004,"Salinitas":0,"DO":5.684223000000002,"PH":7.225382999999998,"Turbidity":5.547312,"Kedalaman":0.5672759000000002,"SwSG":0,"Nitrat":4,"Amonia'":0.14433540000000006,"ORP":0,"COD":34.48774000000002,"BOD":13.950748000000003,"TSS":947.2159420000002},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-11-01 13:58:53
96	\N	28.83963	7.225383	0.1785616	0.1443354	947.215942	5.547312	5.684223	4	34.48774	13.950748	0.5672759	t	2023-11-01 13:00:00.96	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-11-01","Jam":"13:00:00","Suhu":28.83963,"DHL":0,"TDS":0.17856160000000004,"Salinitas":0,"DO":5.684223000000002,"PH":7.225382999999998,"Turbidity":5.547312,"Kedalaman":0.5672759000000002,"SwSG":0,"Nitrat":4,"Amonia'":0.14433540000000006,"ORP":0,"COD":34.48774000000002,"BOD":13.950748000000003,"TSS":947.2159420000002},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-11-01 13:59:03
97	\N	28.83963	7.225383	0.1785616	0.1443354	947.215942	5.547312	5.684223	4	34.48774	13.950748	0.5672759	t	2023-11-01 13:00:00.961	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-11-01","Jam":"13:00:00","Suhu":28.83963,"DHL":0,"TDS":0.17856160000000004,"Salinitas":0,"DO":5.684223000000002,"PH":7.225382999999998,"Turbidity":5.547312,"Kedalaman":0.5672759000000002,"SwSG":0,"Nitrat":4,"Amonia'":0.14433540000000006,"ORP":0,"COD":34.48774000000002,"BOD":13.950748000000003,"TSS":947.2159420000002},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-11-01 13:59:13
98	\N	28.83963	7.225383	0.1785616	0.1443354	947.215942	5.547312	5.684223	4	34.48774	13.950748	0.5672759	t	2023-11-01 13:00:00.961	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-11-01","Jam":"13:00:00","Suhu":28.83963,"DHL":0,"TDS":0.17856160000000004,"Salinitas":0,"DO":5.684223000000002,"PH":7.225382999999998,"Turbidity":5.547312,"Kedalaman":0.5672759000000002,"SwSG":0,"Nitrat":4,"Amonia'":0.14433540000000006,"ORP":0,"COD":34.48774000000002,"BOD":13.950748000000003,"TSS":947.2159420000002},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-11-01 13:59:23
99	\N	28.83963	7.225383	0.1785616	0.1443354	947.215942	5.547312	5.684223	4	34.48774	13.950748	0.5672759	t	2023-11-01 13:00:00.962	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-11-01","Jam":"13:00:00","Suhu":28.83963,"DHL":0,"TDS":0.17856160000000004,"Salinitas":0,"DO":5.684223000000002,"PH":7.225382999999998,"Turbidity":5.547312,"Kedalaman":0.5672759000000002,"SwSG":0,"Nitrat":4,"Amonia'":0.14433540000000006,"ORP":0,"COD":34.48774000000002,"BOD":13.950748000000003,"TSS":947.2159420000002},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-11-01 13:59:33
100	\N	28.83963	7.225383	0.1785616	0.1443354	947.215942	5.547312	5.684223	4	34.48774	13.950748	0.5672759	t	2023-11-01 13:00:00.964	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-11-01","Jam":"13:00:00","Suhu":28.83963,"DHL":0,"TDS":0.17856160000000004,"Salinitas":0,"DO":5.684223000000002,"PH":7.225382999999998,"Turbidity":5.547312,"Kedalaman":0.5672759000000002,"SwSG":0,"Nitrat":4,"Amonia'":0.14433540000000006,"ORP":0,"COD":34.48774000000002,"BOD":13.950748000000003,"TSS":947.2159420000002},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-11-01 13:59:43
101	\N	28.83963	7.225383	0.1785616	0.1443354	947.215942	5.547312	5.684223	4	34.48774	13.950748	0.5672759	t	2023-11-01 13:00:00.966	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-11-01","Jam":"13:00:00","Suhu":28.83963,"DHL":0,"TDS":0.17856160000000004,"Salinitas":0,"DO":5.684223000000002,"PH":7.225382999999998,"Turbidity":5.547312,"Kedalaman":0.5672759000000002,"SwSG":0,"Nitrat":4,"Amonia'":0.14433540000000006,"ORP":0,"COD":34.48774000000002,"BOD":13.950748000000003,"TSS":947.2159420000002},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-11-01 13:59:53
105	\N	29.127197	7.212006	0.1786186	0.146228	592.18988	6.825599	5.645856	4	22.094246	3.183281	0.5569349	t	2023-11-01 19:00:01.095	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-11-01","Jam":"19:00:00","Suhu":28.852000000000007,"DHL":0,"TDS":0.17890524,"Salinitas":0,"DO":5.643681866666668,"PH":7.219816933333334,"Turbidity":6.0420194,"Kedalaman":0.57844258,"SwSG":0,"Nitrat":4,"Amonia'":0.1502697866666667,"ORP":0,"COD":22.597375133333337,"BOD":3.9890872,"TSS":615.8456400666668},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-11-01 14:20:54
106	\N	29.128723	7.217628	0.1786287	0.1501179	592.692932	6.203825	5.631765	4	22.111601	3.198359	0.5600848	t	2023-11-01 19:00:01.099	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-11-01","Jam":"19:00:00","Suhu":28.852000000000007,"DHL":0,"TDS":0.17890524,"Salinitas":0,"DO":5.643681866666668,"PH":7.219816933333334,"Turbidity":6.0420194,"Kedalaman":0.57844258,"SwSG":0,"Nitrat":4,"Amonia'":0.1502697866666667,"ORP":0,"COD":22.597375133333337,"BOD":3.9890872,"TSS":615.8456400666668},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-11-01 14:21:14
107	\N	29.137726	7.213376	0.1790039	0.1452176	592.877747	6.761775	5.62756	4	22.09885	3.187281	0.5593562	t	2023-11-01 19:00:01.1	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-11-01","Jam":"19:00:00","Suhu":28.852000000000007,"DHL":0,"TDS":0.17890524,"Salinitas":0,"DO":5.643681866666668,"PH":7.219816933333334,"Turbidity":6.0420194,"Kedalaman":0.57844258,"SwSG":0,"Nitrat":4,"Amonia'":0.1502697866666667,"ORP":0,"COD":22.597375133333337,"BOD":3.9890872,"TSS":615.8456400666668},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-11-01 14:22:24
108	\N	29.1362	7.217085	0.1786813	0.1461168	593.058533	6.50812	5.627624	4	22.071758	3.163744	0.5567526	t	2023-11-01 19:00:01.101	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-11-01","Jam":"19:00:00","Suhu":28.852000000000007,"DHL":0,"TDS":0.17890524,"Salinitas":0,"DO":5.643681866666668,"PH":7.219816933333334,"Turbidity":6.0420194,"Kedalaman":0.57844258,"SwSG":0,"Nitrat":4,"Amonia'":0.1502697866666667,"ORP":0,"COD":22.597375133333337,"BOD":3.9890872,"TSS":615.8456400666668},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-11-01 14:22:34
109	\N	29.137726	7.215563	0.1791047	0.1460042	598.065857	6.358689	5.636311	4	22.047009	3.142241	0.5603313	t	2023-11-01 19:00:01.102	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-11-01","Jam":"19:00:00","Suhu":28.852000000000007,"DHL":0,"TDS":0.17890524,"Salinitas":0,"DO":5.643681866666668,"PH":7.219816933333334,"Turbidity":6.0420194,"Kedalaman":0.57844258,"SwSG":0,"Nitrat":4,"Amonia'":0.1502697866666667,"ORP":0,"COD":22.597375133333337,"BOD":3.9890872,"TSS":615.8456400666668},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-11-01 14:22:44
110	\N	29.130219	7.214815	0.1786535	0.1436577	594.466064	6.390441	5.633742	4	22.059929	3.153467	0.562147	t	2023-11-01 19:00:01.103	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-11-01","Jam":"19:00:00","Suhu":28.852000000000007,"DHL":0,"TDS":0.17890524,"Salinitas":0,"DO":5.643681866666668,"PH":7.219816933333334,"Turbidity":6.0420194,"Kedalaman":0.57844258,"SwSG":0,"Nitrat":4,"Amonia'":0.1502697866666667,"ORP":0,"COD":22.597375133333337,"BOD":3.9890872,"TSS":615.8456400666668},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-11-01 14:22:54
111	\N	29.130219	7.217009	0.178705	0.1447701	594.766724	6.658308	5.633423	4	22.098614	3.187077	0.5637683	t	2023-11-01 19:00:01.104	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-11-01","Jam":"19:00:00","Suhu":28.852000000000007,"DHL":0,"TDS":0.17890524,"Salinitas":0,"DO":5.643681866666668,"PH":7.219816933333334,"Turbidity":6.0420194,"Kedalaman":0.57844258,"SwSG":0,"Nitrat":4,"Amonia'":0.1502697866666667,"ORP":0,"COD":22.597375133333337,"BOD":3.9890872,"TSS":615.8456400666668},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-11-01 14:23:04
112	\N	29.139221	7.21205	0.1792074	0.1455542	595.940674	6.529437	5.627443	4	22.144405	3.22686	0.559414	t	2023-11-01 19:00:01.105	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-11-01","Jam":"19:00:00","Suhu":28.852000000000007,"DHL":0,"TDS":0.17890524,"Salinitas":0,"DO":5.643681866666668,"PH":7.219816933333334,"Turbidity":6.0420194,"Kedalaman":0.57844258,"SwSG":0,"Nitrat":4,"Amonia'":0.1502697866666667,"ORP":0,"COD":22.597375133333337,"BOD":3.9890872,"TSS":615.8456400666668},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-11-01 14:23:14
113	\N	29.130219	7.214906	0.1789767	0.1410207	595.301758	6.383513	5.644437	4	22.153744	3.234972	0.562927	t	2023-11-01 19:00:01.106	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-11-01","Jam":"19:00:00","Suhu":28.852000000000007,"DHL":0,"TDS":0.17890524,"Salinitas":0,"DO":5.643681866666668,"PH":7.219816933333334,"Turbidity":6.0420194,"Kedalaman":0.57844258,"SwSG":0,"Nitrat":4,"Amonia'":0.1502697866666667,"ORP":0,"COD":22.597375133333337,"BOD":3.9890872,"TSS":615.8456400666668},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-11-01 14:23:24
114	\N	29.142242	7.217662	0.1787447	0.1436581	595.259521	5.638421	5.650373	4	22.179708	3.25753	0.5597181	t	2023-11-01 19:00:01.107	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-11-01","Jam":"19:00:00","Suhu":28.852000000000007,"DHL":0,"TDS":0.17890524,"Salinitas":0,"DO":5.643681866666668,"PH":7.219816933333334,"Turbidity":6.0420194,"Kedalaman":0.57844258,"SwSG":0,"Nitrat":4,"Amonia'":0.1502697866666667,"ORP":0,"COD":22.597375133333337,"BOD":3.9890872,"TSS":615.8456400666668},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-11-01 14:23:34
104	\N	28.968384	7.219226	0.1788919	0.1399433	445.759003	5.896377	5.644762	4	13.259889	0	0.5486665	t	2023-11-01 19:00:01.108	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-11-01","Jam":"19:00:00","Suhu":28.852000000000007,"DHL":0,"TDS":0.17890524,"Salinitas":0,"DO":5.643681866666668,"PH":7.219816933333334,"Turbidity":6.0420194,"Kedalaman":0.57844258,"SwSG":0,"Nitrat":4,"Amonia'":0.1502697866666667,"ORP":0,"COD":22.597375133333337,"BOD":3.9890872,"TSS":615.8456400666668},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-11-01 14:14:24
115	\N	27.396332	7.237581	0.1796195	0.1865437	476.437012	4.690581	5.641743	4	17.832697	0	0.6959931	t	2023-11-01 19:00:01.109	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-11-01","Jam":"19:00:00","Suhu":28.852000000000007,"DHL":0,"TDS":0.17890524,"Salinitas":0,"DO":5.643681866666668,"PH":7.219816933333334,"Turbidity":6.0420194,"Kedalaman":0.57844258,"SwSG":0,"Nitrat":4,"Amonia'":0.1502697866666667,"ORP":0,"COD":22.597375133333337,"BOD":3.9890872,"TSS":615.8456400666668},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-11-01 19:19:29
116	\N	27.396332	7.237581	0.1796195	0.1865437	476.437012	4.690581	5.641743	4	17.832697	0	0.6959931	t	2023-11-01 19:00:01.11	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-11-01","Jam":"19:00:00","Suhu":28.852000000000007,"DHL":0,"TDS":0.17890524,"Salinitas":0,"DO":5.643681866666668,"PH":7.219816933333334,"Turbidity":6.0420194,"Kedalaman":0.57844258,"SwSG":0,"Nitrat":4,"Amonia'":0.1502697866666667,"ORP":0,"COD":22.597375133333337,"BOD":3.9890872,"TSS":615.8456400666668},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-11-01 19:19:39
102	\N	28.83963	7.225383	0.1785616	0.1443354	947.215942	5.547312	5.684223	4	34.48774	13.950748	0.5672759	t	2023-11-01 19:00:01.111	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-11-01","Jam":"19:00:00","Suhu":28.852000000000007,"DHL":0,"TDS":0.17890524,"Salinitas":0,"DO":5.643681866666668,"PH":7.219816933333334,"Turbidity":6.0420194,"Kedalaman":0.57844258,"SwSG":0,"Nitrat":4,"Amonia'":0.1502697866666667,"ORP":0,"COD":22.597375133333337,"BOD":3.9890872,"TSS":615.8456400666668},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-11-01 14:00:03
103	\N	28.83963	7.225383	0.1785616	0.1443354	947.215942	5.547312	5.684223	4	34.48774	13.950748	0.5672759	t	2023-11-01 19:00:01.111	{"req":{"url":"https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo","method":"POST","header":{"Content-Type":"Application/json"},"data":{"data":{"IDStasiun":null,"Tanggal":"2023-11-01","Jam":"19:00:00","Suhu":28.852000000000007,"DHL":0,"TDS":0.17890524,"Salinitas":0,"DO":5.643681866666668,"PH":7.219816933333334,"Turbidity":6.0420194,"Kedalaman":0.57844258,"SwSG":0,"Nitrat":4,"Amonia'":0.1502697866666667,"ORP":0,"COD":22.597375133333337,"BOD":3.9890872,"TSS":615.8456400666668},"apikey":"","apisecret":""}},"res":{"status":{"statusCode":403,"statusDesc":"Forbidden"}}}	0	\N	\N	\N	2023-11-01 14:00:13
\.


--
-- TOC entry 2923 (class 0 OID 0)
-- Dependencies: 205
-- Name: cities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: dbadmin
--

SELECT pg_catalog.setval('public.cities_id_seq', 7, true);


--
-- TOC entry 2924 (class 0 OID 0)
-- Dependencies: 209
-- Name: devices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: dbadmin
--

SELECT pg_catalog.setval('public.devices_id_seq', 1, true);


--
-- TOC entry 2925 (class 0 OID 0)
-- Dependencies: 203
-- Name: provinces_id_seq; Type: SEQUENCE SET; Schema: public; Owner: dbadmin
--

SELECT pg_catalog.setval('public.provinces_id_seq', 2, true);


--
-- TOC entry 2926 (class 0 OID 0)
-- Dependencies: 196
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: dbadmin
--

SELECT pg_catalog.setval('public.roles_id_seq', 1, false);


--
-- TOC entry 2927 (class 0 OID 0)
-- Dependencies: 211
-- Name: stations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: dbadmin
--

SELECT pg_catalog.setval('public.stations_id_seq', 1, true);


--
-- TOC entry 2928 (class 0 OID 0)
-- Dependencies: 198
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: dbadmin
--

SELECT pg_catalog.setval('public.users_id_seq', 5, true);


--
-- TOC entry 2929 (class 0 OID 0)
-- Dependencies: 201
-- Name: watermonitoring_id_seq; Type: SEQUENCE SET; Schema: public; Owner: dbadmin
--

SELECT pg_catalog.setval('public.watermonitoring_id_seq', 116, true);


--
-- TOC entry 2930 (class 0 OID 0)
-- Dependencies: 207
-- Name: watermonitoringv2_id_seq; Type: SEQUENCE SET; Schema: public; Owner: dbadmin
--

SELECT pg_catalog.setval('public.watermonitoringv2_id_seq', 118, true);


--
-- TOC entry 2762 (class 2606 OID 82133)
-- Name: cities cities_pk; Type: CONSTRAINT; Schema: public; Owner: dbadmin
--

ALTER TABLE ONLY public.cities
    ADD CONSTRAINT cities_pk PRIMARY KEY (id);


--
-- TOC entry 2766 (class 2606 OID 82207)
-- Name: devices devices_pk; Type: CONSTRAINT; Schema: public; Owner: dbadmin
--

ALTER TABLE ONLY public.devices
    ADD CONSTRAINT devices_pk PRIMARY KEY (id);


--
-- TOC entry 2768 (class 2606 OID 82224)
-- Name: devices devices_un; Type: CONSTRAINT; Schema: public; Owner: dbadmin
--

ALTER TABLE ONLY public.devices
    ADD CONSTRAINT devices_un UNIQUE (id_mesin);


--
-- TOC entry 2756 (class 2606 OID 73911)
-- Name: r_config pk_r_config; Type: CONSTRAINT; Schema: public; Owner: dbadmin
--

ALTER TABLE ONLY public.r_config
    ADD CONSTRAINT pk_r_config PRIMARY KEY (code);


--
-- TOC entry 2760 (class 2606 OID 82125)
-- Name: provinces provinces_pk; Type: CONSTRAINT; Schema: public; Owner: dbadmin
--

ALTER TABLE ONLY public.provinces
    ADD CONSTRAINT provinces_pk PRIMARY KEY (id);


--
-- TOC entry 2752 (class 2606 OID 41131)
-- Name: roles roles_pk; Type: CONSTRAINT; Schema: public; Owner: dbadmin
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pk PRIMARY KEY (id);


--
-- TOC entry 2770 (class 2606 OID 82222)
-- Name: stations stations_pk; Type: CONSTRAINT; Schema: public; Owner: dbadmin
--

ALTER TABLE ONLY public.stations
    ADD CONSTRAINT stations_pk PRIMARY KEY (id);


--
-- TOC entry 2754 (class 2606 OID 41129)
-- Name: users users_pk; Type: CONSTRAINT; Schema: public; Owner: dbadmin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pk PRIMARY KEY (id);


--
-- TOC entry 2758 (class 2606 OID 73923)
-- Name: watermonitoring watermonitoring_pk; Type: CONSTRAINT; Schema: public; Owner: dbadmin
--

ALTER TABLE ONLY public.watermonitoring
    ADD CONSTRAINT watermonitoring_pk PRIMARY KEY (id);


--
-- TOC entry 2764 (class 2606 OID 82143)
-- Name: mqtt_datas watermonitoringv2_pk; Type: CONSTRAINT; Schema: public; Owner: dbadmin
--

ALTER TABLE ONLY public.mqtt_datas
    ADD CONSTRAINT watermonitoringv2_pk PRIMARY KEY (id);


-- Completed on 2023-11-02 15:36:53

--
-- PostgreSQL database dump complete
--

