--
-- PostgreSQL database dump
--

-- Dumped from database version 11.0
-- Dumped by pg_dump version 14.2

-- Started on 2023-04-04 16:58:14

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
-- TOC entry 2867 (class 0 OID 0)
-- Dependencies: 3
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: robby parlan
--

COMMENT ON SCHEMA public IS 'standard public schema';


SET default_tablespace = '';

--
-- TOC entry 197 (class 1259 OID 41081)
-- Name: api_clients; Type: TABLE; Schema: public; Owner: dbadmin
--

CREATE TABLE public.api_clients (
    id integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone,
    client_id character varying(50) NOT NULL,
    secret_key character varying(100),
    grant_type character varying(20) DEFAULT 'credentials'::character varying NOT NULL,
    is_active boolean DEFAULT false NOT NULL,
    jwt_age integer
);


ALTER TABLE public.api_clients OWNER TO dbadmin;

--
-- TOC entry 196 (class 1259 OID 41079)
-- Name: api_clients_id_seq; Type: SEQUENCE; Schema: public; Owner: dbadmin
--

CREATE SEQUENCE public.api_clients_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.api_clients_id_seq OWNER TO dbadmin;

--
-- TOC entry 2868 (class 0 OID 0)
-- Dependencies: 196
-- Name: api_clients_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: dbadmin
--

ALTER SEQUENCE public.api_clients_id_seq OWNED BY public.api_clients.id;


--
-- TOC entry 202 (class 1259 OID 41113)
-- Name: menus; Type: TABLE; Schema: public; Owner: dbadmin
--

CREATE TABLE public.menus (
    id character varying(10) NOT NULL,
    menu_name character varying(20) NOT NULL,
    order_no integer
);


ALTER TABLE public.menus OWNER TO dbadmin;

--
-- TOC entry 205 (class 1259 OID 73904)
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
-- TOC entry 201 (class 1259 OID 41109)
-- Name: role_access; Type: TABLE; Schema: public; Owner: dbadmin
--

CREATE TABLE public.role_access (
    id integer NOT NULL,
    role_id character varying(10) NOT NULL,
    menu_id character varying(10) NOT NULL
);


ALTER TABLE public.role_access OWNER TO dbadmin;

--
-- TOC entry 200 (class 1259 OID 41107)
-- Name: role_access_id_seq; Type: SEQUENCE; Schema: public; Owner: dbadmin
--

CREATE SEQUENCE public.role_access_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.role_access_id_seq OWNER TO dbadmin;

--
-- TOC entry 2869 (class 0 OID 0)
-- Dependencies: 200
-- Name: role_access_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: dbadmin
--

ALTER SEQUENCE public.role_access_id_seq OWNED BY public.role_access.id;


--
-- TOC entry 199 (class 1259 OID 41099)
-- Name: roles; Type: TABLE; Schema: public; Owner: dbadmin
--

CREATE TABLE public.roles (
    id character varying(10) NOT NULL,
    role_name character varying(20) NOT NULL,
    order_no integer
);


ALTER TABLE public.roles OWNER TO dbadmin;

--
-- TOC entry 198 (class 1259 OID 41097)
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
-- TOC entry 2870 (class 0 OID 0)
-- Dependencies: 198
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: dbadmin
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- TOC entry 204 (class 1259 OID 41121)
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
    is_active boolean DEFAULT false NOT NULL
);


ALTER TABLE public.users OWNER TO dbadmin;

--
-- TOC entry 203 (class 1259 OID 41119)
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
-- TOC entry 2871 (class 0 OID 0)
-- Dependencies: 203
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: dbadmin
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 2712 (class 2604 OID 41084)
-- Name: api_clients id; Type: DEFAULT; Schema: public; Owner: dbadmin
--

ALTER TABLE ONLY public.api_clients ALTER COLUMN id SET DEFAULT nextval('public.api_clients_id_seq'::regclass);


--
-- TOC entry 2716 (class 2604 OID 41112)
-- Name: role_access id; Type: DEFAULT; Schema: public; Owner: dbadmin
--

ALTER TABLE ONLY public.role_access ALTER COLUMN id SET DEFAULT nextval('public.role_access_id_seq'::regclass);


--
-- TOC entry 2717 (class 2604 OID 41124)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: dbadmin
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 2853 (class 0 OID 41081)
-- Dependencies: 197
-- Data for Name: api_clients; Type: TABLE DATA; Schema: public; Owner: dbadmin
--

COPY public.api_clients (id, created_at, updated_at, client_id, secret_key, grant_type, is_active, jwt_age) FROM stdin;
1	2022-04-21 16:28:23.7797	\N	web	5ae6ea9d886dfb01ca99b8aae3db70d	credentials	t	3600
\.


--
-- TOC entry 2858 (class 0 OID 41113)
-- Dependencies: 202
-- Data for Name: menus; Type: TABLE DATA; Schema: public; Owner: dbadmin
--

COPY public.menus (id, menu_name, order_no) FROM stdin;
usr-mgt	User Management	1
rpt	Reporting	2
trs	Transaksi	3
\.


--
-- TOC entry 2861 (class 0 OID 73904)
-- Dependencies: 205
-- Data for Name: r_config; Type: TABLE DATA; Schema: public; Owner: dbadmin
--

COPY public.r_config (code, type, value, description) FROM stdin;
\.


--
-- TOC entry 2857 (class 0 OID 41109)
-- Dependencies: 201
-- Data for Name: role_access; Type: TABLE DATA; Schema: public; Owner: dbadmin
--

COPY public.role_access (id, role_id, menu_id) FROM stdin;
1	adm	usr-mgt
2	adm	rpt
3	adm	trs
4	usr	rpt
5	usr	trs
\.


--
-- TOC entry 2855 (class 0 OID 41099)
-- Dependencies: 199
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: dbadmin
--

COPY public.roles (id, role_name, order_no) FROM stdin;
adm	Admin	1
usr	User	2
\.


--
-- TOC entry 2860 (class 0 OID 41121)
-- Dependencies: 204
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: dbadmin
--

COPY public.users (id, username, fullname, email, password, phone, created_at, updated_at, role_id, is_active) FROM stdin;
3	test	testing	test@gmail.com	$2b$06$i4ZCnl23QPjQjZx6gngbg..UWjm8EZH0CB4sFssZGf4XEapsam9K.	082182818	2022-04-22 11:34:17.003975+07	2022-04-22 11:34:17.003975+07	adm	t
1	admin	Admin	admin@gmail.com	$2b$06$i4ZCnl23QPjQjZx6gngbg..UWjm8EZH0CB4sFssZGf4XEapsam9K.	0821812	2022-04-22 08:33:40.323941+07	2022-04-22 08:33:40.323941+07	adm	t
2	user	User	user@gmail.com	$2b$06$i4ZCnl23QPjQjZx6gngbg..UWjm8EZH0CB4sFssZGf4XEapsam9K.	02819219	2022-04-22 08:34:05.77018+07	2022-04-22 08:34:05.77018+07	usr	t
\.


--
-- TOC entry 2872 (class 0 OID 0)
-- Dependencies: 196
-- Name: api_clients_id_seq; Type: SEQUENCE SET; Schema: public; Owner: dbadmin
--

SELECT pg_catalog.setval('public.api_clients_id_seq', 1, true);


--
-- TOC entry 2873 (class 0 OID 0)
-- Dependencies: 200
-- Name: role_access_id_seq; Type: SEQUENCE SET; Schema: public; Owner: dbadmin
--

SELECT pg_catalog.setval('public.role_access_id_seq', 5, true);


--
-- TOC entry 2874 (class 0 OID 0)
-- Dependencies: 198
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: dbadmin
--

SELECT pg_catalog.setval('public.roles_id_seq', 1, false);


--
-- TOC entry 2875 (class 0 OID 0)
-- Dependencies: 203
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: dbadmin
--

SELECT pg_catalog.setval('public.users_id_seq', 3, true);


--
-- TOC entry 2726 (class 2606 OID 41135)
-- Name: menus menus_pk; Type: CONSTRAINT; Schema: public; Owner: dbadmin
--

ALTER TABLE ONLY public.menus
    ADD CONSTRAINT menus_pk PRIMARY KEY (id);


--
-- TOC entry 2730 (class 2606 OID 73911)
-- Name: r_config pk_r_config; Type: CONSTRAINT; Schema: public; Owner: dbadmin
--

ALTER TABLE ONLY public.r_config
    ADD CONSTRAINT pk_r_config PRIMARY KEY (code);


--
-- TOC entry 2724 (class 2606 OID 41133)
-- Name: role_access role_access_pk; Type: CONSTRAINT; Schema: public; Owner: dbadmin
--

ALTER TABLE ONLY public.role_access
    ADD CONSTRAINT role_access_pk PRIMARY KEY (id);


--
-- TOC entry 2722 (class 2606 OID 41131)
-- Name: roles roles_pk; Type: CONSTRAINT; Schema: public; Owner: dbadmin
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pk PRIMARY KEY (id);


--
-- TOC entry 2728 (class 2606 OID 41129)
-- Name: users users_pk; Type: CONSTRAINT; Schema: public; Owner: dbadmin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pk PRIMARY KEY (id);


-- Completed on 2023-04-04 16:58:14

--
-- PostgreSQL database dump complete
--

